import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { unzipSync, strFromU8 } from "fflate";
import {
  validateOperations,
  renewalNoticeDate,
  crmImportPreview,
  EMPTY_OPERATIONS,
} from "../src/lib/meeting/workflow.mjs";
import { buildApplicationWorkbook } from "../src/lib/meeting/applicationWorkbook.mjs";
const db = new PGlite(),
  owner = "20000000-0000-4000-8000-000000000001",
  staff = "20000000-0000-4000-8000-000000000002",
  outsider = "20000000-0000-4000-8000-000000000003";
let company, otherCompany, project, document;
async function act(id, fn, role = "authenticated") {
  await db.exec(`BEGIN; SET LOCAL ROLE ${role};`);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [
    id || "",
  ]);
  try {
    const result = await fn();
    await db.exec("COMMIT");
    return result;
  } catch (e) {
    await db.exec("ROLLBACK");
    throw e;
  }
}
before(async () => {
  await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE SCHEMA auth; CREATE SCHEMA storage;
 CREATE TABLE auth.users(id UUID PRIMARY KEY,email TEXT,raw_user_meta_data JSONB DEFAULT '{}'::jsonb);
 CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
 CREATE FUNCTION public.uuid_generate_v4() RETURNS UUID LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
 CREATE TABLE storage.buckets(id TEXT PRIMARY KEY,name TEXT,public BOOLEAN,file_size_limit BIGINT,allowed_mime_types TEXT[]);
 CREATE TABLE storage.objects(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id TEXT,name TEXT); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 CREATE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$ SELECT (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
 GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated;
 GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO anon,authenticated;
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated;`);
  for (const path of [
    "schema.sql",
    "platform_migration.sql",
    "work_tasks_migration.sql",
    "company_projects_migration.sql",
    "meeting_20261023_migration.sql",
    "meeting_20261023_migration.sql",
  ])
    await db.exec(
      (
        await readFile(new URL("../supabase/" + path, import.meta.url), "utf8")
      ).replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', ""),
    );
  for (const [id, email] of [
    [owner, "owner@example.test"],
    [staff, "staff@example.test"],
    [outsider, "other@example.test"],
  ])
    await db.query(
      "INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)",
      [id, email, { full_name: id }],
    );
  company = (
    await db.query("SELECT company_id FROM public.profiles WHERE id=$1", [
      owner,
    ])
  ).rows[0].company_id;
  otherCompany = (
    await db.query("SELECT company_id FROM public.profiles WHERE id=$1", [
      outsider,
    ])
  ).rows[0].company_id;
  document = (
    await db.query(
      "INSERT INTO public.documents(company_id,title,certification_code,hierarchy_level) VALUES($1,'Company document','ISO_9001','LEVEL_1') RETURNING id",
      [company],
    )
  ).rows[0].id;
});
after(() => db.close());
const payload = () => ({
  requestId: "30000000-0000-4000-8000-000000000001",
  companyId: company,
  title: "회의 반영",
  kind: "ISO",
  requirements: [],
  tasks: [],
});
const rpc = async (id, name, args) =>
  act(
    id,
    async () => (await db.query(`SELECT * FROM public.${name}`, args)).rows[0],
  );
test("prepayment tentative schedule, client scope confirmation, month-end reminder are independent", () => {
  const p = validateOperations({
    ...EMPTY_OPERATIONS,
    scheduleStatus: "tentative",
    auditDate: "2026-11-01",
  });
  assert.equal(p.paymentStatus, "unpaid");
  assert.throws(
    () => validateOperations({ ...p, scheduleStatus: "confirmed" }),
    /범위/,
  );
  assert.equal(
    validateOperations({
      ...p,
      scheduleStatus: "confirmed",
      scope: "제조",
      scopeConfirmed: true,
    }).scheduleStatus,
    "confirmed",
  );
  assert.equal(
    renewalNoticeDate({
      nextAuditDate: "2028-03-31",
      certificateExpiresAt: "2027-01-01",
    }),
    "2028-02-29",
  );
  assert.equal(
    renewalNoticeDate({ certificateExpiresAt: "2026-01-31" }),
    "2025-12-31",
  );
  assert.throws(
    () =>
      validateOperations({
        ...p,
        certificateIssuedAt: "2026-12-01",
        certificateExpiresAt: "2026-11-01",
      }),
    /만료일/,
  );
});
test("CRM preview rejects unrelated companies, duplicates and preserves source/document identity", () => {
  const row = {
    companyId: "a",
    externalId: "crm-10",
    title: "Client ISO",
    documentIds: ["doc-1"],
  };
  const input = { version: 1, projects: [row] };
  assert.equal(
    crmImportPreview(input, [{ id: "a", name: "회사" }])[0].externalId,
    "crm-10",
  );
  assert.throws(() => crmImportPreview(input, []), /연결/);
  assert.throws(
    () =>
      crmImportPreview({ version: 1, projects: [row, row] }, [
        { id: "a", name: "회사" },
      ]),
    /중복/,
  );
});
test("actual workbook preserves the other sheet, styles, merges and formulas; writes literal XML-safe values only", async () => {
  const source = new Uint8Array(
    await readFile("public/templates/iso-application-251210.xlsx"),
  );
  const bytes = buildApplicationWorkbook(source, {
    companyName: "검증회사 & <회사>",
    scope: '=HYPERLINK("x")',
  });
  const original = unzipSync(source),
    result = unzipSync(bytes);
  for (const key of Object.keys(original))
    if (key !== "xl/worksheets/sheet1.xml")
      assert.deepEqual(result[key], original[key], key);
  const xml = strFromU8(result["xl/worksheets/sheet1.xml"]);
  assert.match(xml, /검증회사 &amp; &lt;회사&gt;/);
  assert.match(xml, /=HYPERLINK\(&quot;x&quot;\)/);
  assert.match(xml, /r="C4"[^>]*t="inlineStr"/);
  const o = strFromU8(original["xl/worksheets/sheet1.xml"]);
  assert.deepEqual(
    xml.match(/<(?:x:)?f\b[^>]*>.*?<\/(?:x:)?f>/g),
    o.match(/<(?:x:)?f\b[^>]*>.*?<\/(?:x:)?f>/g),
  );
});
test("owner can import CRM projects atomically, preserve document company and refuse silent source overwrite", async () => {
  const row = {
    companyId: company,
    externalId: "old-1",
    title: "Migrated",
    notes: "history",
    kind: "ISO",
    targetDate: "",
    documentIds: [document],
  };
  const call = (items, id = owner) =>
    act(id, () =>
      db.query("SELECT public.import_crm_projects($1,$2) AS result", [
        "legacy",
        items,
      ]),
    );
  const first = (await call([row])).rows[0].result;
  assert.equal(first.saved, 1);
  assert.equal((await call([row])).rows[0].result.skipped, 1);
  await assert.rejects(
    call([{ ...row, title: "Changed" }]),
    /manual reconciliation/,
  );
  await assert.rejects(
    call([{ ...row, externalId: "old-2", companyId: otherCompany }]),
    /owner/,
  );
  const before = (
    await db.query("SELECT count(*)::int AS n FROM public.audit_projects")
  ).rows[0].n;
  await assert.rejects(
    call([
      { ...row, externalId: "old-3" },
      { ...row, externalId: "old-4", documentIds: [outsider] },
    ]),
    /mismatch/,
  );
  assert.equal(
    (await db.query("SELECT count(*)::int AS n FROM public.audit_projects"))
      .rows[0].n,
    before,
  );
  project = (
    await act(owner, () =>
      db.query("SELECT * FROM public.create_work_project($1)", [payload()]),
    )
  ).rows[0];
});
test("company join does not grant access until primary/owner approves; nomination needs recipient acceptance", async () => {
  const code = (await rpc(owner, "consultant_join_code($1)", [company]))
    .consultant_join_code;
  const request = (await rpc(staff, "request_company_join($1)", [code]))
    .request_company_join;
  assert.equal(
    (await rpc(staff, "can_read_company($1)", [company])).can_read_company,
    false,
  );
  await assert.rejects(
    rpc(outsider, "approve_consultant($1)", [request]),
    /required/,
  );
  await rpc(owner, "manage_consultant($1,$2,$3)", [company, owner, "add"]);
  await rpc(owner, "approve_consultant($1)", [request]);
  const team = (await rpc(staff, "consultant_team($1)", [company]))
    .consultant_team;
  assert.equal(team.canPrepare, true);
  assert.equal(team.canManage, false);
  await rpc(owner, "manage_consultant($1,$2,$3)", [company, staff, "nominate"]);
  assert.equal(
    (await rpc(staff, "can_manage_consultants($1)", [company]))
      .can_manage_consultants,
    false,
  );
  await assert.rejects(
    rpc(outsider, "manage_consultant($1,$2,$3)", [company, staff, "accept"]),
    /Nominee/,
  );
  await rpc(staff, "manage_consultant($1,$2,$3)", [company, staff, "accept"]);
  assert.equal(
    (await rpc(staff, "can_manage_consultants($1)", [company]))
      .can_manage_consultants,
    true,
  );
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int AS n FROM public.company_consultants WHERE company_id=$1 AND is_primary",
        [company],
      )
    ).rows[0].n,
    1,
  );
});
test("operations check server permission, stale writes, independent payment, certificate company and persist reminder tasks", async () => {
  const data = {
    ...EMPTY_OPERATIONS,
    scheduleStatus: "tentative",
    auditDate: "2026-12-01",
    nextAuditDate: "2027-03-31",
  };
  const save = (id, revision, value) =>
    rpc(id, "save_project_operations($1,$2,$3)", [project.id, revision, value]);
  await assert.rejects(save(outsider, 0, data), /consultant/);
  const saved = await save(staff, 0, data);
  assert.equal(saved.revision, 1);
  await assert.rejects(save(staff, 0, data), /Concurrent/);
  await assert.rejects(
    save(staff, 1, { ...data, scheduleStatus: "confirmed" }),
    /scope/,
  );
  await assert.rejects(
    save(staff, 1, { ...data, certificateDocumentId: document }),
    /certificate/,
  );
  const tasks = (
    await db.query("SELECT * FROM public.work_tasks WHERE project_id=$1", [
      project.id,
    ])
  ).rows;
  assert.equal(
    tasks
      .find((t) => t.project_task_key === "meeting-renewal-notice")
      .due_date.toISOString()
      .slice(0, 10),
    "2027-02-28",
  );
  await act(outsider, async () =>
    assert.equal(
      (
        await db.query(
          "SELECT * FROM public.project_operations WHERE project_id=$1",
          [project.id],
        )
      ).rows.length,
      0,
    ),
  );
});
test("client submission cannot self-approve, requires stored upload and preserves review with optimistic concurrency", async () => {
  await rpc(owner, "request_project_documents($1,$2)", [
    project.id,
    [{ key: "biz", title: "사업자등록증", guidance: "최신본" }],
  ]);
  const r = (
    await db.query(
      "SELECT * FROM public.project_document_requests WHERE project_id=$1",
      [project.id],
    )
  ).rows[0];
  const review = (id, rev, status, doc = null, note = "") =>
    rpc(id, "review_project_document($1,$2,$3,$4,$5)", [
      r.id,
      rev,
      status,
      doc,
      note,
    ]);
  await assert.rejects(review(owner, 0, "submitted", document), /Uploaded/);
  await db.query(
    "UPDATE public.documents SET file_url='companies/example/test.pdf' WHERE id=$1",
    [document],
  );
  await assert.rejects(review(owner, 0, "submitted", document), /Uploaded/);
  await db.exec(
    "INSERT INTO storage.objects(bucket_id,name) VALUES('iso-vault','companies/example/test.pdf')",
  );
  await db.query(
    "INSERT INTO public.document_versions(document_id,change_reason,author_name,file_path,checksum) VALUES($1,'upload','tester','companies/example/test.pdf','verified-hash')",
    [document],
  );
  await db.query(
    "INSERT INTO public.company_members(company_id,user_id,membership_role) VALUES($1,$2,$3)",
    [company, outsider, "EDITOR"],
  );
  await review(outsider, 0, "submitted", document);
  await assert.rejects(review(outsider, 1, "accepted"), /Consultant review/);
  await assert.rejects(review(owner, 0, "accepted"), /Concurrent/);
  await assert.rejects(review(staff, 1, "changes", null, ""), /Feedback/);
  await review(staff, 1, "changes", null, "최신본 필요");
  await review(owner, 2, "submitted", document);
  await review(staff, 3, "accepted");
  const saved = (
    await db.query(
      "SELECT * FROM public.project_document_requests WHERE id=$1",
      [r.id],
    )
  ).rows[0];
  assert.equal(saved.submitted_checksum, "verified-hash");
  assert.equal(saved.reviewed_by, staff);
  assert.equal(
    (
      await db.query(
        "SELECT status FROM public.work_tasks WHERE project_id=$1 AND project_task_key='intake-biz'",
        [project.id],
      )
    ).rows[0].status,
    "done",
  );
  await assert.rejects(
    review(owner, 4, "submitted", document),
    /cannot be replaced/,
  );
  await assert.rejects(
    act(owner, () =>
      db.query(
        "UPDATE public.project_document_requests SET status='accepted' WHERE id=$1",
        [r.id],
      ),
    ),
    /permission/,
  );
});
test("removing co-consultant revokes company data but preserves documents and primary role cannot be removed", async () => {
  await assert.rejects(
    rpc(owner, "manage_consultant($1,$2,$3)", [company, staff, "remove"]),
    /Transfer/,
  );
  // Transfer back, then remove former primary. Company owner is never stripped of membership.
  await rpc(staff, "manage_consultant($1,$2,$3)", [company, owner, "nominate"]);
  await rpc(owner, "manage_consultant($1,$2,$3)", [company, owner, "accept"]);
  await rpc(owner, "manage_consultant($1,$2,$3)", [company, staff, "remove"]);
  assert.equal(
    (await rpc(staff, "can_read_company($1)", [company])).can_read_company,
    false,
  );
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int AS n FROM public.documents WHERE id=$1",
        [document],
      )
    ).rows[0].n,
    1,
  );
  await act(staff, async () =>
    assert.equal(
      (
        await db.query(
          "SELECT * FROM public.project_document_requests WHERE project_id=$1",
          [project.id],
        )
      ).rows.length,
      0,
    ),
  );
});

test('conditional documents allow reasoned consultant exemption and reopening without inventing an upload',async()=>{
 await rpc(owner,'request_project_documents($1,$2)',[project.id,[{key:'permit',title:'인허가',conditional:true}]]);
 const r=(await db.query("SELECT * FROM public.project_document_requests WHERE project_id=$1 AND request_key='permit'",[project.id])).rows[0];
 const review=(id,rev,status,note='')=>rpc(id,'review_project_document($1,$2,$3,$4,$5)',[r.id,rev,status,null,note]);
 await assert.rejects(review(outsider,0,'not_applicable','대상 업종 아님'),/Conditional exemption/);
 await assert.rejects(review(owner,0,'not_applicable'),/reason/);
 assert.equal((await review(owner,0,'not_applicable','대상 업종 아님')).status,'not_applicable');
 assert.equal((await review(owner,1,'requested')).status,'requested');
});
