import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import {
  resolveAdminTab,
  normalizeCompanyProfile,
  validateCompanyProfileInput,
  buildMemberDirectory,
  filterMemberDirectory,
  buildMembersCsv,
  DEFAULT_ADMIN_SENDER,
  OFFICIAL_ATTACHMENT_PRESETS,
  renderDispatchPreview,
  buildPersonalizedDispatchBatch,
  validateDispatchInput,
  buildMailtoHref,
  filterDispatchHistory,
  buildDispatchesCsv,
  buildAuditLogsCsv,
  summarizePlatformOperations,
  generateCompletionCertificateNumber,
  buildCompletionCertificateDoc,
  buildSampleRosterCsv,
  parseMemberRosterCsv,
} from '../src/lib/adminCenter.mjs';

const db = new PGlite();
const adminId = '90000000-0000-4000-8000-000000000001';
const ownerId = '90000000-0000-4000-8000-000000000002';
const staffId = '90000000-0000-4000-8000-000000000003';
const outsiderId = '90000000-0000-4000-8000-000000000004';
let ownerCompanyId, outsiderCompanyId;

async function act(userId, fn, role = 'authenticated') {
  await db.exec(`BEGIN; SET LOCAL ROLE ${role};`);
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [userId || '']);
  try {
    const res = await fn();
    await db.exec('COMMIT');
    return res;
  } catch (err) {
    await db.exec('ROLLBACK');
    throw err;
  }
}

before(async () => {
  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE SCHEMA auth;
    CREATE SCHEMA storage;
    CREATE TABLE auth.users(id UUID PRIMARY KEY, email TEXT, raw_user_meta_data JSONB DEFAULT '{}'::jsonb);
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS $$ SELECT jsonb_build_object('email', 'test@honestone.kr') $$;
    CREATE FUNCTION public.uuid_generate_v4() RETURNS UUID LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
    CREATE TABLE storage.buckets(id TEXT PRIMARY KEY, name TEXT, public BOOLEAN, file_size_limit BIGINT, allowed_mime_types TEXT[]);
    CREATE TABLE storage.objects(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id TEXT, name TEXT);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$ SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1)-1] $$;
    GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
  `);

  for (const file of [
    'schema.sql',
    'platform_migration.sql',
    'work_tasks_migration.sql',
    'managed_clients_migration.sql',
    'company_projects_migration.sql',
    'admin_center_migration.sql',
    'admin_center_migration.sql', // Verify idempotency on re-run
  ]) {
    const sql = (await readFile(new URL(`../supabase/${file}`, import.meta.url), 'utf8')).replace(
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
      ''
    );
    await db.exec(sql);
  }

  for (const [id, email, name] of [
    [adminId, 'admin@honestone.kr', '플랫폼관리자'],
    [ownerId, 'owner@client.kr', '기업대표'],
    [staffId, 'staff@client.kr', '기업실무자'],
    [outsiderId, 'outsider@other.kr', '타사담당자'],
  ]) {
    await db.query('INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES ($1, $2, $3)', [
      id,
      email,
      { full_name: name, company_name: `${name} 기업` },
    ]);
  }

  await db.query("UPDATE public.profiles SET role = 'ADMIN' WHERE id = $1", [adminId]);
  ownerCompanyId = (await db.query('SELECT company_id FROM public.profiles WHERE id = $1', [ownerId])).rows[0]
    .company_id;
  outsiderCompanyId = (
    await db.query('SELECT company_id FROM public.profiles WHERE id = $1', [outsiderId])
  ).rows[0].company_id;
});

after(async () => {
  await db.close();
});

test('admin tab resolution and member directory filtering/CSV export work accurately', () => {
  assert.equal(resolveAdminTab('/admin', ''), 'members');
  assert.equal(resolveAdminTab('/admin/dispatch', ''), 'dispatch');
  assert.equal(resolveAdminTab('/admin', 'adminTab=audit-logs'), 'audit-logs');

  const members = buildMemberDirectory({
    profiles: [
      { id: 'u1', email: 'a@test.kr', full_name: '김관리', role: 'ADMIN', is_active: true, company_id: 'c1' },
      { id: 'u2', email: 'b@test.kr', full_name: '이심사', role: 'AUDITOR', is_active: true, company_id: 'c1' },
      { id: 'u3', email: 'c@test.kr', full_name: '박실무', role: 'MEMBER', is_active: false, company_id: 'c2' },
    ],
    companies: [
      { id: 'c1', name: '어니스톤' },
      { id: 'c2', name: '하이테크' },
    ],
  });

  assert.equal(members.length, 3);
  assert.equal(filterMemberDirectory(members, { role: 'AUDITOR' }).length, 1);
  assert.equal(filterMemberDirectory(members, { status: 'INACTIVE' })[0].fullName, '박실무');
  assert.equal(filterMemberDirectory(members, { companyId: 'c2' })[0].email, 'c@test.kr');
  assert.equal(filterMemberDirectory(members, { query: '이심사' }).length, 1);

  const csv = buildMembersCsv(members);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('김관리'));
  assert.ok(csv.includes('비활성(정지)'));
});

test('company profile validation, electronic dispatch preview and mailto generation work properly', () => {
  assert.equal(validateCompanyProfileInput({ name: '' }).valid, false);
  assert.equal(validateCompanyProfileInput({ name: '정상기업', bizNo: 'invalid' }).valid, false);
  assert.equal(validateCompanyProfileInput({ name: '정상기업', bizNo: '123-45-67890' }).valid, true);

  const norm = normalizeCompanyProfile({
    id: 'c1',
    name: '테스트기업',
    industry: '제조업',
    metadata: { bizNo: '123-45-67890', sites: [{ id: 's1', name: '본사', address: '서울', headcount: 25 }] },
  });
  assert.equal(norm.bizNo, '123-45-67890');
  assert.equal(norm.sites.length, 1);

  const preview = renderDispatchPreview('MEMBER_INVITE_CODE', {
    recipientName: '홍길동',
    companyName: '미래테크',
    joinCode: '11111111-2222-4333-8444-555555555555',
    roleLabel: '편집 권한',
  });
  assert.ok(preview.subject.includes('미래테크'));
  assert.ok(preview.body.includes('홍길동'));
  assert.ok(preview.body.includes('11111111-2222-4333-8444-555555555555'));

  assert.equal(
    validateDispatchInput({
      channel: 'EMAIL',
      recipientContact: 'bad-email',
      subject: preview.subject,
      body: preview.body,
    }).valid,
    false
  );
  assert.equal(
    validateDispatchInput({
      channel: 'EMAIL',
      recipientContact: 'user@company.kr',
      subject: preview.subject,
      body: preview.body,
    }).valid,
    true
  );

  const mailto = buildMailtoHref({
    recipientContact: 'user@company.kr',
    bccContacts: ['member1@company.kr', 'member2@company.kr'],
    subject: '안내 제목',
    body: '본문 내용',
  });
  assert.ok(mailto.startsWith('mailto:user%40company.kr?'));
  assert.ok(mailto.includes('bcc=member1%40company.kr%2Cmember2%40company.kr'));

  assert.equal(DEFAULT_ADMIN_SENDER.email, 'ceo@honestone.kr');
  assert.ok(OFFICIAL_ATTACHMENT_PRESETS.length >= 5);

  const batch = buildPersonalizedDispatchBatch({
    channel: 'EMAIL',
    templateKey: 'ADMIN_MEMBER_NOTICE',
    recipients: [
      { id: 'u1', fullName: '김대표', companyName: '에이테크', companyId: 'c1', email: 'kim@atech.kr' },
      { id: 'u2', fullName: '이실무', companyName: '비솔루션', companyId: 'c2', email: 'lee@bsol.kr' },
    ],
    subject: '[어니스톤] {{수신자명}} 님 ({{기업명}}) 안내',
    body: '안녕하세요 {{수신자명}} 님, {{발신자명}} 드림.\n{{동봉문서목록}}',
    attachments: [{ id: 'preset-edu-cert', title: '교육과정 수료증', docCode: 'EDU-CERT-01', category: '수료증' }],
  });
  assert.equal(batch.payloads.length, 2);
  assert.ok(batch.payloads[0].subject.includes('김대표'));
  assert.ok(batch.payloads[0].subject.includes('에이테크'));
  assert.ok(batch.payloads[0].body.includes('조영빈'));
  assert.ok(batch.payloads[0].body.includes('교육과정 수료증'));
  assert.ok(batch.payloads[1].subject.includes('이실무'));

  const history = [
    {
      id: 'd1',
      created_at: '2026-10-22T09:00:00Z',
      channel: 'EMAIL',
      status: 'SENT',
      recipient_name: '김대표',
      recipient_contact: 'kim@atech.kr',
      subject: '수료증 안내',
      metadata: {
        senderName: DEFAULT_ADMIN_SENDER.displayName,
        companyName: '에이테크',
        attachments: [{ title: '교육과정 수료증' }],
      },
    },
    {
      id: 'd2',
      created_at: '2026-10-22T10:00:00Z',
      channel: 'ALIMTALK',
      status: 'QUEUED',
      recipient_name: '이실무',
      recipient_contact: '010-2222-3333',
      subject: '심사 일정 공지',
      metadata: {
        senderName: DEFAULT_ADMIN_SENDER.displayName,
        companyName: '비솔루션',
        attachments: [],
      },
    },
  ];
  assert.equal(filterDispatchHistory(history, { channel: 'EMAIL' }).length, 1);
  assert.equal(filterDispatchHistory(history, { status: 'QUEUED' }).length, 1);
  assert.equal(filterDispatchHistory(history, { query: '수료증' }).length, 1);

  const dispatchCsv = buildDispatchesCsv(history);
  assert.ok(dispatchCsv.startsWith('\uFEFF'));
  assert.ok(dispatchCsv.includes('김대표'));
  assert.ok(dispatchCsv.includes('교육과정 수료증'));
});

test('company profile update, member role change, admin member control and electronic dispatch RPCs enforce RBAC', async () => {
  // 1. Company profile & multi-site update (S01, S03)
  const updatedComp = await act(ownerId, async () => {
    const res = await db.query(
      'SELECT * FROM public.update_company_profile_info($1, $2, $3, $4::jsonb)',
      [
        ownerCompanyId,
        '어니스톤 정밀',
        '의료기기 제조',
        JSON.stringify({
          bizNo: '214-88-99001',
          ceoName: '기업대표',
          sites: [
            { id: 'site-1', name: '본사', address: '서울 강남구', headcount: 15 },
            { id: 'site-2', name: '오송공장', address: '충북 청주시', headcount: 42 },
          ],
        }),
      ]
    );
    return res.rows[0];
  });
  assert.equal(updatedComp.name, '어니스톤 정밀');
  assert.equal(updatedComp.metadata.bizNo, '214-88-99001');
  assert.equal(updatedComp.metadata.sites.length, 2);

  await assert.rejects(
    act(outsiderId, () =>
      db.query('SELECT * FROM public.update_company_profile_info($1, $2, $3, $4::jsonb)', [
        ownerCompanyId,
        '침해시도',
        '기타',
        '{}',
      ])
    ),
    /editor or owner required/
  );

  // 2. Join request approval + member role change between VIEWER and EDITOR (S04)
  const code = await act(ownerId, async () => {
    return (await db.query('SELECT public.company_join_code($1, false) AS code', [ownerCompanyId]))
      .rows[0].code;
  });
  const reqId = await act(staffId, async () => {
    return (await db.query('SELECT public.request_company_join($1) AS id', [code])).rows[0].id;
  });
  await act(ownerId, () =>
    db.query("SELECT public.decide_company_join($1, true, 'VIEWER')", [reqId])
  );

  await act(ownerId, () =>
    db.query("SELECT public.update_company_member_role($1, $2, 'EDITOR')", [
      ownerCompanyId,
      staffId,
    ])
  );
  await act(staffId, async () => {
    const canEdit = (
      await db.query('SELECT public.can_edit_company($1) AS ok', [ownerCompanyId])
    ).rows[0].ok;
    assert.equal(canEdit, true);
  });

  // Cannot downgrade OWNER directly
  await assert.rejects(
    act(ownerId, () =>
      db.query("SELECT public.update_company_member_role($1, $2, 'VIEWER')", [
        ownerCompanyId,
        ownerId,
      ])
    ),
    /Owner role cannot be downgraded/
  );

  // 3. Admin member profile & active status control (S02, S30)
  await assert.rejects(
    act(staffId, () =>
      db.query(
        "SELECT * FROM public.admin_update_member_profile($1, '박실무', '010-1111-2222', 'ADMIN', true, '{}'::jsonb)",
        [staffId]
      )
    ),
    /Platform admin required/
  );

  // Admin can promote/suspend another user, but cannot deactivate themselves
  await assert.rejects(
    act(adminId, () =>
      db.query(
        "SELECT * FROM public.admin_update_member_profile($1, '관리자', NULL, 'ADMIN', false, '{}'::jsonb)",
        [adminId]
      )
    ),
    /Cannot deactivate your own account/
  );

  const promoted = await act(adminId, async () => {
    return (
      await db.query(
        "SELECT * FROM public.admin_update_member_profile($1, '기업실무자(심사원전환)', '010-5555-7777', 'AUDITOR', true, $2::jsonb)",
        [staffId, JSON.stringify({ licenseNo: 'KAB-2026-99' })]
      )
    ).rows[0];
  });
  assert.equal(promoted.role, 'AUDITOR');
  assert.equal(promoted.phone, '010-5555-7777');

  // 4. Electronic dispatch creation & tenant isolation
  const dispatchRow = await act(ownerId, async () => {
    return (
      await db.query('SELECT * FROM public.create_electronic_dispatch($1::jsonb)', [
        JSON.stringify({
          companyId: ownerCompanyId,
          channel: 'EMAIL',
          templateKey: 'MEMBER_INVITE_CODE',
          recipientName: '신규직원',
          recipientContact: 'newbie@client.kr',
          subject: '[어니스톤] 소속 신청 코드 안내',
          body: '신청 코드 본문입니다.',
          status: 'QUEUED',
        }),
      ])
    ).rows[0];
  });
  assert.equal(dispatchRow.channel, 'EMAIL');
  assert.equal(dispatchRow.recipient_contact, 'newbie@client.kr');

  // Outsider cannot read ownerCompany's electronic dispatches or create one for ownerCompany
  await act(outsiderId, async () => {
    const visible = (
      await db.query('SELECT * FROM public.electronic_dispatches WHERE id = $1', [dispatchRow.id])
    ).rows;
    assert.equal(visible.length, 0);
  });
  await assert.rejects(
    act(outsiderId, () =>
      db.query('SELECT * FROM public.create_electronic_dispatch($1::jsonb)', [
        JSON.stringify({
          companyId: ownerCompanyId,
          channel: 'SMS',
          recipientContact: '010-1234-5678',
          subject: '무단발송',
          body: '내용',
        }),
      ])
    ),
    /Company permission required/
  );

  // 5. Member roster & custom dispatch template RPCs (S02, B01, S32)
  await assert.rejects(
    act(outsiderId, () =>
      db.query('SELECT * FROM public.admin_upsert_member_roster($1::jsonb)', [
        JSON.stringify({ email: 'trainee@test.kr', fullName: '무단등록' }),
      ])
    ),
    /Company editor\/owner or platform admin required/
  );

  const rosterRow = await act(adminId, async () => {
    return (
      await db.query('SELECT * FROM public.admin_upsert_member_roster($1::jsonb)', [
        JSON.stringify({
          email: 'staff@client.kr',
          fullName: '기업실무자(2기수료)',
          phone: '010-7777-8888',
          companyId: ownerCompanyId,
          companyName: '어니스톤 정밀',
          role: 'MEMBER',
          cohort: '2기',
          courseName: 'ISO 9001·14001·45001 통합 내부심사원 양성과정',
          completionStatus: 'COMPLETED',
          certificateNo: 'HS-EDU-2026-02-001',
          completionDate: '2026-10-22',
          adminMemo: '실습 우수 수료생',
        }),
      ])
    ).rows[0];
  });
  assert.equal(rosterRow.metadata.cohort, '2기');
  assert.equal(rosterRow.metadata.completionStatus, 'COMPLETED');
  assert.equal(rosterRow.metadata.certificateNo, 'HS-EDU-2026-02-001');

  // Verify profile metadata was synced for existing auth user
  const syncedProfile = (
    await db.query('SELECT metadata FROM public.profiles WHERE id = $1', [staffId])
  ).rows[0];
  assert.equal(syncedProfile.metadata.cohort, '2기');
  assert.equal(syncedProfile.metadata.certificateNo, 'HS-EDU-2026-02-001');

  // Custom dispatch template upsert
  const customTpl = await act(adminId, async () => {
    return (
      await db.query('SELECT * FROM public.upsert_dispatch_custom_template($1::jsonb)', [
        JSON.stringify({
          templateKey: 'CUSTOM_COHORT_2_CERT',
          category: '교육·수료',
          title: '2기 수료증 발급 및 심화과정 안내',
          defaultChannel: 'EMAIL',
          subject: '[어니스톤] {{수신자명}} 님 ({{수강기수}}) 수료증 전달 안내',
          body: '수료번호: {{수료번호}} / 교육과정: {{교육과정명}}',
        }),
      ])
    ).rows[0];
  });
  assert.equal(customTpl.template_key, 'CUSTOM_COHORT_2_CERT');
  assert.equal(customTpl.title, '2기 수료증 발급 및 심화과정 안내');
});

test('CSV roster parser, trainee completion certificate generator and cohort template substitution work accurately', () => {
  const sampleCsv = buildSampleRosterCsv();
  assert.ok(sampleCsv.startsWith('\uFEFF'));

  const parsed = parseMemberRosterCsv(
    `성명,이메일,연락처,소속기업,부서,역할,수강기수,교육과정명,수료상태,수료번호,관리자메모
김수강,trainee1@example.co.kr,010-1234-5678,(주)대한정밀,품질관리팀,수강생,2기,ISO 통합 내부심사원 과정,수료완료,HS-EDU-2026-02-001,우수학습자
잘못된행,not-an-email,010-0000-0000,(주)대한정밀,생산팀,수강생,2기,과정,수강중,,`
  );
  assert.equal(parsed.validRows.length, 1);
  assert.equal(parsed.invalidRows.length, 1);
  assert.equal(parsed.validRows[0].fullName, '김수강');
  assert.equal(parsed.validRows[0].cohort, '2기');
  assert.equal(parsed.validRows[0].completionStatus, 'COMPLETED');
  assert.equal(parsed.validRows[0].certificateNo, 'HS-EDU-2026-02-001');

  const certNo = generateCompletionCertificateNumber({
    cohort: '2기',
    sequence: 7,
    dateStr: '2026-10-22',
  });
  assert.equal(certNo, 'HN-EDU-202610-2기-007');

  const docHtml = buildCompletionCertificateDoc({
    fullName: '김수강',
    companyName: '(주)대한정밀',
    cohort: '2기',
    courseName: 'ISO 9001·14001·45001 통합 내부심사원 양성과정',
    certificateNo: certNo,
    completionDate: '2026-10-22',
  });
  assert.ok(docHtml.includes('수 료 증'));
  assert.ok(docHtml.includes('김수강'));
  assert.ok(docHtml.includes('HN-EDU-202610-2기-007'));
  assert.ok(docHtml.includes('조 영 빈'));

  const mergedMembers = buildMemberDirectory({
    profiles: [],
    rosterEntries: parsed.validRows,
    companies: [],
  });
  assert.equal(mergedMembers.length, 1);
  assert.equal(filterMemberDirectory(mergedMembers, { cohort: '2기' }).length, 1);
  assert.equal(filterMemberDirectory(mergedMembers, { completionStatus: 'COMPLETED' }).length, 1);

  const batch = buildPersonalizedDispatchBatch({
    channel: 'EMAIL',
    templateKey: 'CUSTOM_1',
    recipients: mergedMembers,
    subject: '[어니스톤] {{수신자명}} ({{수강기수}}) 수료 안내',
    body: '과정: {{교육과정명}} / 번호: {{수료번호}}',
  });
  assert.equal(batch.payloads[0].subject, '[어니스톤] 김수강 (2기) 수료 안내');
  assert.ok(batch.payloads[0].body.includes('HS-EDU-2026-02-001'));
});
