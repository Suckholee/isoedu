import { supabase } from './supabaseClient';
import { isCloudMode } from './dataConfig';
import { INITIAL_COMPANIES } from './mockData';
import { workflowError } from './projectWorkflow.mjs';
import {
  DEFAULT_NOTIFICATION_RULES,
  DEFAULT_AUDITOR_POOL,
  TRAINING_COURSE_PRESETS,
  buildMemberDirectory,
  generateCompletionCertificateNumber,
} from './adminCenter.mjs';

const LOCAL_ADMIN_STORAGE_KEY = 'honestone_admin_state_v1';

const SEED_PROFILES = [
  {
    id: 'demo-admin-01',
    email: 'ceo@honestone.kr',
    full_name: '조영빈',
    role: 'ADMIN',
    phone: '010-9281-3300',
    company_id: INITIAL_COMPANIES[0]?.id || 'comp-hitech-01',
    is_active: true,
    created_at: '2026-09-01T09:00:00Z',
    metadata: { department: '대표이사 · 총괄운영', title: '대표 / 선임심사원' },
  },
  {
    id: 'demo-auditor-02',
    email: 'auditor.kim@kab.or.kr',
    full_name: '김성우',
    role: 'AUDITOR',
    phone: '010-4412-8901',
    company_id: INITIAL_COMPANIES[0]?.id || 'comp-hitech-01',
    is_active: true,
    created_at: '2026-09-12T10:30:00Z',
    metadata: {
      department: '품질·환경 심사단',
      grade: '선임심사원 (Lead Auditor)',
      licenseNo: 'KAB-LA-2019-0482',
      standards: ['ISO_9001', 'ISO_14001'],
      region: '서울·경기·인천',
      cohort: '1기',
      courseName: TRAINING_COURSE_PRESETS[0],
      completionStatus: 'CERTIFIED',
      certificateNo: 'HN-EDU-202609-1기-001',
      completionDate: '2026-09-30',
    },
  },
  {
    id: 'demo-member-03',
    email: 'qa@hitech.co.kr',
    full_name: '이지현',
    role: 'MEMBER',
    phone: '010-7721-5023',
    company_id: INITIAL_COMPANIES[0]?.id || 'comp-hitech-01',
    is_active: true,
    created_at: '2026-10-02T14:15:00Z',
    metadata: {
      department: '품질보증팀',
      title: '품질관리 실무담당자',
      cohort: '1기',
      courseName: TRAINING_COURSE_PRESETS[3],
      completionStatus: 'COMPLETED',
      certificateNo: 'HN-EDU-202610-1기-002',
      completionDate: '2026-10-15',
    },
  },
  {
    id: 'demo-member-04',
    email: 'student01@isoedu.kr',
    full_name: '박민수',
    role: 'MEMBER',
    phone: '010-3109-7840',
    company_id: INITIAL_COMPANIES[1]?.id || 'comp-bio-02',
    is_active: true,
    created_at: '2026-10-15T11:00:00Z',
    metadata: {
      department: 'ISO 전문가 양성과정 2기',
      title: '수강생 · 컨설턴트 후보',
      cohort: '2기',
      courseName: TRAINING_COURSE_PRESETS[0],
      completionStatus: 'ENROLLED',
    },
  },
];

function readLocalAdminState() {
  if (typeof window === 'undefined') {
    return {
      profiles: SEED_PROFILES,
      rosterEntries: [],
      memberships: [],
      companyMeta: {},
      joinCodes: {},
      joinRequests: [],
      dispatches: [],
      customTemplates: [],
      notificationRules: DEFAULT_NOTIFICATION_RULES,
      auditorPool: DEFAULT_AUDITOR_POOL,
      cmsOverrides: {},
      auditLogs: [],
    };
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_ADMIN_STORAGE_KEY);
    if (!raw) throw new Error('empty');
    const parsed = JSON.parse(raw);
    return {
      profiles: Array.isArray(parsed.profiles) && parsed.profiles.length ? parsed.profiles : SEED_PROFILES,
      rosterEntries: Array.isArray(parsed.rosterEntries) ? parsed.rosterEntries : [],
      memberships: Array.isArray(parsed.memberships) ? parsed.memberships : [],
      companyMeta: parsed.companyMeta && typeof parsed.companyMeta === 'object' ? parsed.companyMeta : {},
      joinCodes: parsed.joinCodes && typeof parsed.joinCodes === 'object' ? parsed.joinCodes : {},
      joinRequests: Array.isArray(parsed.joinRequests) ? parsed.joinRequests : [],
      dispatches: Array.isArray(parsed.dispatches) ? parsed.dispatches : [],
      customTemplates: Array.isArray(parsed.customTemplates) ? parsed.customTemplates : [],
      notificationRules:
        Array.isArray(parsed.notificationRules) && parsed.notificationRules.length
          ? parsed.notificationRules
          : DEFAULT_NOTIFICATION_RULES,
      auditorPool:
        Array.isArray(parsed.auditorPool) && parsed.auditorPool.length
          ? parsed.auditorPool
          : DEFAULT_AUDITOR_POOL,
      cmsOverrides: parsed.cmsOverrides && typeof parsed.cmsOverrides === 'object' ? parsed.cmsOverrides : {},
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
    };
  } catch {
    return {
      profiles: SEED_PROFILES,
      rosterEntries: [],
      memberships: [],
      companyMeta: {},
      joinCodes: {},
      joinRequests: [],
      dispatches: [],
      customTemplates: [],
      notificationRules: DEFAULT_NOTIFICATION_RULES,
      auditorPool: DEFAULT_AUDITOR_POOL,
      cmsOverrides: {},
      auditLogs: [],
    };
  }
}

function writeLocalAdminState(updater) {
  const current = readLocalAdminState();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LOCAL_ADMIN_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }
  return next;
}

function isMissingFunctionOrTableError(err) {
  const code = String(err?.code || '');
  const msg = String(err?.message || '').toLowerCase();
  return (
    code === 'PGRST202' ||
    code === 'PGRST205' ||
    code === '42883' ||
    code === '42P01' ||
    msg.includes('could not find the function') ||
    msg.includes('could not find the table') ||
    msg.includes('does not exist')
  );
}

export async function loadAdminSnapshot({ user, profile, companies = [] } = {}) {
  const localState = readLocalAdminState();

  const mergedCompanies = companies.map((c) => ({
    ...c,
    metadata: {
      ...(c.metadata && typeof c.metadata === 'object' ? c.metadata : {}),
      ...(localState.companyMeta[c.id] || {}),
    },
  }));

  if (!isCloudMode || !supabase || !user) {
    const members = buildMemberDirectory({
      profiles: localState.profiles,
      rosterEntries: localState.rosterEntries,
      companies: mergedCompanies,
      memberships: localState.memberships,
      pendingRequests: localState.joinRequests.filter((r) => r.status === 'pending'),
    });

    return {
      members,
      companies: mergedCompanies,
      dispatches: localState.dispatches,
      customTemplates: localState.customTemplates,
      notificationRules: localState.notificationRules,
      auditorPool: localState.auditorPool,
      cmsOverrides: localState.cmsOverrides,
      auditLogs: localState.auditLogs,
      schemaStatus: isCloudMode ? 'AUTH_REQUIRED' : 'LOCAL_MODE',
    };
  }

  // Cloud mode: query accessible profiles, company_members, audit_logs, electronic_dispatches, member_roster, dispatch_custom_templates
  const [profilesRes, membershipsRes, logsRes, dispatchesRes, rosterRes, customTplRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('company_members').select('*').limit(500),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(150),
    supabase.from('electronic_dispatches').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('member_roster').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('dispatch_custom_templates').select('*').order('updated_at', { ascending: false }).limit(50),
  ]);

  const cloudProfiles = profilesRes.data || [];
  if (profile && !cloudProfiles.some((p) => p.id === profile.id)) {
    cloudProfiles.unshift({
      id: profile.id,
      email: profile.email || user.email,
      full_name: profile.fullName || user.email?.split('@')[0],
      role: profile.role || 'MEMBER',
      company_id: profile.company?.id || null,
      is_active: true,
    });
  }

  // Merge locally invited/supplemented profiles or metadata overrides
  const profileMap = new Map();
  for (const p of cloudProfiles) {
    const localOverride = localState.profiles.find((lp) => lp.id === p.id || lp.email === p.email);
    profileMap.set(p.id, {
      ...p,
      phone: p.phone || localOverride?.phone || '',
      metadata: {
        ...(localOverride?.metadata || {}),
        ...(p.metadata && typeof p.metadata === 'object' ? p.metadata : {}),
      },
    });
  }
  for (const lp of localState.profiles) {
    if (lp.isLocalInvite && !Array.from(profileMap.values()).some((cp) => cp.email === lp.email)) {
      profileMap.set(lp.id, lp);
    }
  }

  const cloudMemberships = membershipsRes.data || [];
  const cloudLogs = logsRes.data || [];
  const hasDispatchTable = !dispatchesRes.error || !isMissingFunctionOrTableError(dispatchesRes.error);
  const cloudDispatches = hasDispatchTable ? dispatchesRes.data || [] : [];
  const hasRosterTable = !rosterRes.error || !isMissingFunctionOrTableError(rosterRes.error);
  const cloudRoster = hasRosterTable ? rosterRes.data || [] : [];
  const hasCustomTplTable = !customTplRes.error || !isMissingFunctionOrTableError(customTplRes.error);
  const cloudCustomTemplates = hasCustomTplTable
    ? (customTplRes.data || []).map((row) => ({
        id: row.id,
        key: row.template_key,
        category: row.category || '관리자 커스텀 템플릿',
        title: row.title,
        defaultChannel: row.default_channel || 'EMAIL',
        subjectTemplate: row.subject_template,
        bodyTemplate: row.body_template,
        attachments: Array.isArray(row.attachments) ? row.attachments : [],
        isCustom: true,
      }))
    : [];

  // Combine cloud dispatches with local fallback dispatches
  const dispatchIds = new Set(cloudDispatches.map((d) => d.id));
  const combinedDispatches = [
    ...cloudDispatches,
    ...localState.dispatches.filter((d) => !dispatchIds.has(d.id)),
  ];

  const tplKeys = new Set(cloudCustomTemplates.map((t) => t.key));
  const combinedCustomTemplates = [
    ...cloudCustomTemplates,
    ...localState.customTemplates.filter((t) => !tplKeys.has(t.key)),
  ];

  const members = buildMemberDirectory({
    profiles: Array.from(profileMap.values()),
    rosterEntries: [...cloudRoster, ...localState.rosterEntries],
    companies: mergedCompanies,
    memberships: [...cloudMemberships, ...localState.memberships],
    pendingRequests: localState.joinRequests.filter((r) => r.status === 'pending'),
  });

  // Merge AUDITOR profiles into auditorPool
  const auditorProfiles = members
    .filter((m) => m.role === 'AUDITOR')
    .map((m) => ({
      id: m.id,
      name: m.fullName,
      email: m.email,
      grade: m.metadata?.grade || '공인심사원 · 전문가',
      standards: Array.isArray(m.metadata?.standards) ? m.metadata.standards : ['ISO_9001'],
      region: m.metadata?.region || '전국',
      licenseNo: m.metadata?.licenseNo || '심사원 자격 등록',
      conflictStatus: m.metadata?.conflictStatus || '이해상충 이상 없음',
      active: m.isActive,
      assignedCount: m.activeCompanyCount,
    }));

  const poolByEmail = new Map();
  for (const item of [...auditorProfiles, ...localState.auditorPool]) {
    const key = String(item.email || item.id).toLowerCase();
    if (!poolByEmail.has(key)) poolByEmail.set(key, item);
  }

  return {
    members,
    companies: mergedCompanies,
    dispatches: combinedDispatches,
    customTemplates: combinedCustomTemplates,
    notificationRules: localState.notificationRules,
    auditorPool: Array.from(poolByEmail.values()),
    cmsOverrides: localState.cmsOverrides,
    auditLogs: [...cloudLogs, ...localState.auditLogs].slice(0, 200),
    schemaStatus: hasDispatchTable ? 'CLOUD_READY' : 'CLOUD_BASE_SCHEMA',
  };
}

export async function loadCompanyTeamAccess(companyId) {
  if (!companyId) return null;
  if (!isCloudMode || !supabase) {
    const state = readLocalAdminState();
    const members = state.profiles.map((p, idx) => ({
      userId: p.id,
      name: p.full_name || p.fullName,
      email: p.email,
      role: idx === 0 ? 'OWNER' : 'EDITOR',
      active: p.is_active !== false,
      endedAt: null,
    }));
    const requests = state.joinRequests.filter((r) => r.companyId === companyId && r.status === 'pending');
    return { canManage: true, members, requests };
  }
  const { data, error } = await supabase.rpc('company_access', { c_id: companyId });
  if (error) throw new Error(workflowError(error));
  return data;
}

export async function fetchOrRotateCompanyJoinCode(companyId, rotate = false) {
  if (!companyId) throw new Error('대상 기업을 선택해 주세요.');
  if (!isCloudMode || !supabase) {
    const nextCode = crypto.randomUUID();
    writeLocalAdminState((curr) => ({
      ...curr,
      joinCodes: {
        ...curr.joinCodes,
        [companyId]: rotate ? nextCode : curr.joinCodes[companyId] || nextCode,
      },
    }));
    return readLocalAdminState().joinCodes[companyId];
  }
  const { data, error } = await supabase.rpc('company_join_code', { c_id: companyId, rotate });
  if (error) throw new Error(workflowError(error));
  return data;
}

export async function decideCompanyJoinRequest({ requestId, approve, memberRole = 'VIEWER' }) {
  if (!isCloudMode || !supabase) {
    writeLocalAdminState((curr) => ({
      ...curr,
      joinRequests: curr.joinRequests.map((r) =>
        r.id === requestId ? { ...r, status: approve ? 'approved' : 'rejected' } : r
      ),
    }));
    return;
  }
  const { error } = await supabase.rpc('decide_company_join', {
    request_id: requestId,
    approve,
    member_role: memberRole,
  });
  if (error) throw new Error(workflowError(error));
}

export async function revokeCompanyMember({ companyId, memberId }) {
  if (!isCloudMode || !supabase) {
    writeLocalAdminState((curr) => ({
      ...curr,
      memberships: curr.memberships.map((m) =>
        (m.company_id || m.companyId) === companyId && (m.user_id || m.userId) === memberId
          ? { ...m, is_active: false, active: false, ended_at: new Date().toISOString() }
          : m
      ),
    }));
    return;
  }
  const { error } = await supabase.rpc('end_company_membership', {
    c_id: companyId,
    member_id: memberId,
  });
  if (error) throw new Error(workflowError(error));
}

export async function changeCompanyMemberRole({ companyId, memberId, nextRole }) {
  if (!isCloudMode || !supabase) {
    writeLocalAdminState((curr) => ({
      ...curr,
      memberships: curr.memberships.map((m) =>
        (m.company_id || m.companyId) === companyId && (m.user_id || m.userId) === memberId
          ? { ...m, membership_role: nextRole, role: nextRole }
          : m
      ),
    }));
    return { mode: 'LOCAL' };
  }
  const { error } = await supabase.rpc('update_company_member_role', {
    c_id: companyId,
    member_id: memberId,
    next_role: nextRole,
  });
  if (error) {
    if (isMissingFunctionOrTableError(error)) {
      throw new Error(
        '역할 변경 RPC(admin_center_migration.sql)가 운영 DB에 아직 적용되지 않았습니다. 소속 해제 후 재승인으로 역할을 변경하거나 DB 마이그레이션을 적용해 주세요.'
      );
    }
    throw new Error(workflowError(error));
  }
  return { mode: 'CLOUD' };
}

export async function saveMemberProfileAdmin({
  targetUserId,
  email = '',
  fullName,
  phone,
  role,
  isActive,
  companyId = null,
  companyName = '',
  metadata = {},
  currentUserId,
}) {
  const cleanEmail = String(email || '').trim().toLowerCase();

  // Always persist supplemental metadata locally in both profiles and rosterEntries
  writeLocalAdminState((curr) => {
    const exists = curr.profiles.some(
      (p) => p.id === targetUserId || (cleanEmail && String(p.email || '').toLowerCase() === cleanEmail)
    );
    const nextProfiles = exists
      ? curr.profiles.map((p) =>
          p.id === targetUserId || (cleanEmail && String(p.email || '').toLowerCase() === cleanEmail)
            ? {
                ...p,
                full_name: fullName ?? p.full_name,
                phone: phone ?? p.phone,
                role: role ?? p.role,
                is_active: isActive !== undefined ? isActive : p.is_active,
                metadata: { ...(p.metadata || {}), ...metadata },
              }
            : p
        )
      : [
          ...curr.profiles,
          {
            id: targetUserId,
            email: cleanEmail,
            full_name: fullName,
            phone: phone || '',
            role: role || 'MEMBER',
            is_active: isActive !== false,
            metadata,
          },
        ];

    const nextRoster = curr.rosterEntries.map((r) =>
      r.id === targetUserId || (cleanEmail && String(r.email || '').toLowerCase() === cleanEmail)
        ? {
            ...r,
            full_name: fullName ?? r.full_name,
            phone: phone ?? r.phone,
            role: role ?? r.role,
            is_active: isActive !== undefined ? isActive : r.is_active,
            metadata: { ...(r.metadata || {}), ...metadata },
          }
        : r
    );
    return { ...curr, profiles: nextProfiles, rosterEntries: nextRoster };
  });

  if (!isCloudMode || !supabase) {
    return { savedToCloud: false, message: '브라우저 관리자 저장소에 회원·수료 정보를 저장했습니다.' };
  }

  // Also sync to member_roster if email is available
  if (cleanEmail) {
    await supabase.rpc('admin_upsert_member_roster', {
      payload: {
        email: cleanEmail,
        fullName,
        phone: phone || '',
        role: role || 'MEMBER',
        companyId,
        companyName,
        isActive: isActive !== false,
        cohort: metadata.cohort || '',
        courseName: metadata.courseName || '',
        completionStatus: metadata.completionStatus || 'NONE',
        certificateNo: metadata.certificateNo || '',
        completionDate: metadata.completionDate || '',
        adminMemo: metadata.adminMemo || '',
        department: metadata.department || '',
        metadata,
      },
    });
  }

  // Try admin_update_member_profile RPC if targetUserId is a valid UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(targetUserId || '')
  );
  if (isUuid) {
    const { error } = await supabase.rpc('admin_update_member_profile', {
      target_user_id: targetUserId,
      next_full_name: fullName || null,
      next_phone: phone ?? null,
      next_role: role || null,
      next_active: typeof isActive === 'boolean' ? isActive : null,
      next_metadata: metadata,
    });

    if (!error) {
      return { savedToCloud: true, message: 'Supabase에 회원 정보·권한·수료 상태를 저장했습니다.' };
    }

    if (!isMissingFunctionOrTableError(error) && !String(error.message || '').includes('Member profile not found')) {
      throw new Error(workflowError(error));
    }
  }

  return {
    savedToCloud: true,
    message: '회원·수강생 정보 및 수료 상태를 저장했습니다.',
  };
}

export async function registerMemberInviteCandidate({
  email,
  fullName,
  phone = '',
  role = 'MEMBER',
  companyId = null,
  companyName = '',
  department = '',
  cohort = '',
  courseName = '',
  completionStatus = 'NONE',
  certificateNo = '',
  completionDate = '',
  adminMemo = '',
}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanName = String(fullName || '').trim();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('유효한 이메일 주소를 입력해 주세요.');
  }
  if (!cleanName) {
    throw new Error('회원(수강생·담당자) 성명을 입력해 주세요.');
  }

  const normalizedRole = ['ADMIN', 'AUDITOR', 'MEMBER'].includes(role) ? role : 'MEMBER';
  const normalizedCompletion = ['NONE', 'ENROLLED', 'COMPLETED', 'CERTIFIED'].includes(completionStatus)
    ? completionStatus
    : cohort || courseName
    ? 'ENROLLED'
    : 'NONE';

  const metadata = {
    department: String(department || (cohort ? `${cohort} 수강생` : '신규 등록 회원')).trim(),
    companyName: String(companyName || '어니스톤 교육생').trim(),
    invitedCompanyName: companyName,
    inviteStatus: 'REGISTERED',
    cohort: String(cohort || '').trim(),
    courseName: String(courseName || '').trim(),
    completionStatus: normalizedCompletion,
    certificateNo: String(certificateNo || '').trim(),
    completionDate: String(completionDate || '').trim(),
    adminMemo: String(adminMemo || '').trim(),
  };

  let cloudRow = null;
  if (isCloudMode && supabase) {
    const { data, error } = await supabase.rpc('admin_upsert_member_roster', {
      payload: {
        email: cleanEmail,
        fullName: cleanName,
        phone: String(phone || '').trim(),
        role: normalizedRole,
        companyId: companyId || null,
        companyName: metadata.companyName,
        isActive: true,
        cohort: metadata.cohort,
        courseName: metadata.courseName,
        completionStatus: metadata.completionStatus,
        certificateNo: metadata.certificateNo,
        completionDate: metadata.completionDate,
        adminMemo: metadata.adminMemo,
        department: metadata.department,
        metadata,
      },
    });
    if (!error && data) {
      cloudRow = data;
    } else if (error && !isMissingFunctionOrTableError(error)) {
      throw new Error(workflowError(error));
    }
  }

  const candidate = {
    id: cloudRow?.id || crypto.randomUUID(),
    email: cleanEmail,
    full_name: cleanName,
    role: normalizedRole,
    phone: String(phone || '').trim(),
    company_id: companyId || null,
    company_name: metadata.companyName,
    is_active: true,
    isLocalInvite: true,
    created_at: cloudRow?.created_at || new Date().toISOString(),
    metadata,
  };

  writeLocalAdminState((curr) => ({
    ...curr,
    profiles: [
      candidate,
      ...curr.profiles.filter((p) => String(p.email || '').toLowerCase() !== cleanEmail),
    ],
    rosterEntries: [
      candidate,
      ...curr.rosterEntries.filter((r) => String(r.email || '').toLowerCase() !== cleanEmail),
    ],
    auditLogs: [
      {
        id: crypto.randomUUID(),
        company_id: companyId,
        user_email: cleanEmail,
        action_type: 'CREATE',
        target_resource: 'MEMBER_ROSTER',
        resource_title: `${cleanName} (${cleanEmail})`,
        details: {
          role: candidate.role,
          companyName: metadata.companyName,
          cohort: metadata.cohort,
          completionStatus: metadata.completionStatus,
        },
        created_at: new Date().toISOString(),
      },
      ...curr.auditLogs,
    ],
  }));

  return candidate;
}

export async function batchRegisterMembersAdmin(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('일괄 등록할 회원 명단이 없습니다.');
  }
  const registered = [];
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    const certNo =
      r.completionStatus === 'COMPLETED' || r.completionStatus === 'CERTIFIED'
        ? r.certificateNo ||
          generateCompletionCertificateNumber({ cohort: r.cohort || '1기', sequence: i + 1 })
        : r.certificateNo || '';
    const item = await registerMemberInviteCandidate({
      email: r.email,
      fullName: r.fullName,
      phone: r.phone || '',
      role: r.role || 'MEMBER',
      companyId: r.companyId || null,
      companyName: r.companyName || '어니스톤 교육생',
      department: r.department || (r.cohort ? `${r.cohort} 수강생` : ''),
      cohort: r.cohort || '',
      courseName: r.courseName || '',
      completionStatus: r.completionStatus || 'ENROLLED',
      certificateNo: certNo,
      completionDate:
        r.completionStatus === 'COMPLETED' || r.completionStatus === 'CERTIFIED'
          ? new Date().toISOString().slice(0, 10)
          : '',
      adminMemo: r.adminMemo || '',
    });
    registered.push(item);
  }
  return registered;
}

export async function batchIssueMemberCompletion({
  members = [],
  cohort = '',
  courseName = '',
  completionDate = new Date().toISOString().slice(0, 10),
  currentUserId = null,
}) {
  if (!Array.isArray(members) || members.length === 0) {
    throw new Error('수료 처리할 회원을 1명 이상 선택해 주세요.');
  }
  const updated = [];
  for (let i = 0; i < members.length; i += 1) {
    const m = members[i];
    const nextCohort = cohort || m.cohort || '1기';
    const nextCourse = courseName || m.courseName || TRAINING_COURSE_PRESETS[0];
    const nextCertNo =
      m.certificateNo ||
      generateCompletionCertificateNumber({
        cohort: nextCohort,
        sequence: i + 1,
        dateStr: completionDate,
      });

    const nextMeta = {
      ...(m.metadata || {}),
      cohort: nextCohort,
      courseName: nextCourse,
      completionStatus: 'COMPLETED',
      certificateNo: nextCertNo,
      completionDate,
    };

    await saveMemberProfileAdmin({
      targetUserId: m.id,
      email: m.email,
      fullName: m.fullName,
      phone: m.phone,
      role: m.role,
      isActive: m.isActive,
      companyId: m.primaryCompanyId,
      companyName: m.primaryCompanyName,
      metadata: nextMeta,
      currentUserId,
    });

    updated.push({
      ...m,
      cohort: nextCohort,
      courseName: nextCourse,
      completionStatus: 'COMPLETED',
      certificateNo: nextCertNo,
      completionDate,
      metadata: nextMeta,
    });
  }
  return updated;
}

export async function saveCompanyProfileAdmin({
  companyId,
  name,
  industry,
  bizNo,
  ceoName,
  scale,
  ksicCode,
  contactEmail,
  phone,
  address,
  sites = [],
}) {
  const metadata = {
    bizNo: String(bizNo || '').trim(),
    ceoName: String(ceoName || '').trim(),
    scale: String(scale || '중소기업').trim(),
    ksicCode: String(ksicCode || '').trim(),
    contactEmail: String(contactEmail || '').trim(),
    phone: String(phone || '').trim(),
    address: String(address || '').trim(),
    sites: Array.isArray(sites) ? sites : [],
    updatedAt: new Date().toISOString(),
  };

  writeLocalAdminState((curr) => ({
    ...curr,
    companyMeta: {
      ...curr.companyMeta,
      [companyId]: metadata,
    },
    auditLogs: [
      {
        id: crypto.randomUUID(),
        company_id: companyId,
        action_type: 'UPDATE',
        target_resource: 'COMPANY_SETTINGS',
        resource_title: name,
        details: { industry, bizNo: metadata.bizNo, siteCount: metadata.sites.length },
        created_at: new Date().toISOString(),
      },
      ...curr.auditLogs,
    ],
  }));

  if (!isCloudMode || !supabase) {
    return { savedToCloud: false, message: '기업 프로필 및 사업장 정보를 저장했습니다.' };
  }

  const { error } = await supabase.rpc('update_company_profile_info', {
    c_id: companyId,
    next_name: name,
    next_industry: industry || '미분류',
    next_metadata: metadata,
  });

  if (!error) {
    return { savedToCloud: true, message: '기업 프로필 및 다중 사업장 정보를 Supabase에 저장했습니다.' };
  }

  if (isMissingFunctionOrTableError(error)) {
    return {
      savedToCloud: false,
      message:
        '기업 프로필 및 다중 사업장 정보를 관리자 보완 저장소에 기록했습니다. (DB 영구 컬럼 반영은 admin_center_migration.sql 적용 시 활성화)',
    };
  }

  throw new Error(workflowError(error));
}

export async function fetchDispatchGatewayStatus() {
  try {
    const res = await fetch('/api/admin-dispatch', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      ok: false,
      emailConfigured: false,
      smsConfigured: false,
      emailProvider: 'Resend / SMTP API 키 대기 (발송 대장 + 메일앱 모드)',
      smsProvider: '알림톡·SMS API 키 대기 (발송 대장 기록 모드)',
      senderName: '어니스톤 관리자 조영빈',
      senderEmail: 'ceo@honestone.kr',
    };
  }
}

export async function recordElectronicDispatch({
  companyId = null,
  companyName = '',
  channel = 'EMAIL',
  templateKey = 'ADMIN_MEMBER_NOTICE',
  recipientName = '',
  recipientContact = '',
  senderName = '어니스톤 관리자 조영빈',
  senderEmail = 'ceo@honestone.kr',
  subject = '',
  body = '',
  attachments = [],
  deliveryNote = '',
  status = 'QUEUED',
  userEmail = '',
}) {
  const safeAttachments = Array.isArray(attachments)
    ? attachments.map((a) => ({
        id: a.id || a.code || a.fileName || 'att',
        code: a.code || '',
        title: a.title || a.fileName || '첨부 문서',
        fileName: a.fileName || a.title || 'document.pdf',
        category: a.category || '동봉문서',
        sizeBytes: a.sizeBytes || 0,
      }))
    : [];

  const metadata = {
    companyName,
    senderName,
    senderEmail,
    attachments: safeAttachments,
    deliveryNote,
  };

  const localRecord = {
    id: crypto.randomUUID(),
    company_id: companyId,
    company_name: companyName,
    channel,
    template_key: templateKey,
    recipient_name: recipientName,
    recipient_contact: recipientContact,
    sender_email: senderEmail,
    subject,
    body,
    status,
    attachments: safeAttachments,
    metadata,
    created_at: new Date().toISOString(),
  };

  let savedToCloud = false;
  let cloudData = null;

  if (isCloudMode && supabase) {
    const { data, error } = await supabase.rpc('create_electronic_dispatch', {
      payload: {
        companyId,
        channel,
        templateKey,
        recipientName,
        recipientContact,
        subject,
        body,
        status: ['QUEUED', 'MAILTO_OPENED', 'COPIED', 'SENT', 'FAILED'].includes(status)
          ? status
          : 'QUEUED',
        metadata,
      },
    });
    if (!error && data) {
      savedToCloud = true;
      cloudData = {
        ...data,
        attachments: safeAttachments,
        metadata: { ...metadata, ...(data.metadata || {}) },
      };
    } else if (error && !isMissingFunctionOrTableError(error)) {
      throw new Error(workflowError(error));
    }
  }

  writeLocalAdminState((curr) => ({
    ...curr,
    dispatches: [cloudData || localRecord, ...curr.dispatches],
    auditLogs: [
      {
        id: crypto.randomUUID(),
        company_id: companyId,
        user_email: userEmail || senderEmail || '관리자 조영빈',
        action_type: 'CREATE',
        target_resource: 'ELECTRONIC_DISPATCH',
        resource_title: `${recipientName} · ${subject}`,
        details: {
          channel,
          templateKey,
          recipientName,
          recipientContact,
          attachmentCount: safeAttachments.length,
          status,
          deliveryNote,
        },
        created_at: localRecord.created_at,
      },
      ...curr.auditLogs,
    ],
  }));

  return { record: cloudData || localRecord, savedToCloud };
}

export async function executeAdminDispatchBatch({
  items = [],
  mode = 'SERVER_OR_QUEUE', // 'SERVER_OR_QUEUE' | 'MAILTO_OPENED' | 'COPIED'
  userEmail = 'ceo@honestone.kr',
}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('전자발송 대상 회원을 1명 이상 선택해 주세요.');
  }

  let gatewayResults = null;
  if (mode === 'SERVER_OR_QUEUE' && typeof fetch === 'function') {
    try {
      const res = await fetch('/api/admin-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        gatewayResults = await res.json();
      }
    } catch {
      // Fallback to local/Supabase ledger recording if offline
    }
  }

  const savedRecords = [];
  let sentCount = 0;
  let queuedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const apiRes = gatewayResults?.results?.[i];
    const finalStatus =
      mode === 'MAILTO_OPENED'
        ? 'MAILTO_OPENED'
        : mode === 'COPIED'
        ? 'COPIED'
        : apiRes?.status || 'QUEUED';
    const deliveryNote =
      mode === 'MAILTO_OPENED'
        ? '관리자 기본 메일 클라이언트(mailto) 전달 및 발송 대장 기록 완료'
        : mode === 'COPIED'
        ? '발송 전문 클립보드 복사 및 발송 대장 기록 완료'
        : apiRes?.deliveryNote || '전자발송 대장(큐) 기록 완료';

    if (finalStatus === 'SENT') sentCount += 1;
    else if (finalStatus === 'FAILED') failedCount += 1;
    else queuedCount += 1;

    const saved = await recordElectronicDispatch({
      companyId: item.companyId || null,
      companyName: item.companyName || '',
      channel: item.channel || 'EMAIL',
      templateKey: item.templateKey || 'ADMIN_MEMBER_NOTICE',
      recipientName: item.recipientName || '회원',
      recipientContact: item.recipientContact || '',
      senderName: item.senderName || '어니스톤 관리자 조영빈',
      senderEmail: item.senderEmail || userEmail || 'ceo@honestone.kr',
      subject: item.subject || '',
      body: item.body || '',
      attachments: item.attachments || [],
      deliveryNote,
      status: finalStatus,
      userEmail: userEmail || item.senderEmail || 'ceo@honestone.kr',
    });
    savedRecords.push(saved.record);
  }

  return {
    records: savedRecords,
    sentCount,
    queuedCount,
    failedCount,
    emailConfigured: Boolean(gatewayResults?.emailConfigured),
    smsConfigured: Boolean(gatewayResults?.smsConfigured),
  };
}

export function saveNotificationRulesLocal(rules = []) {
  writeLocalAdminState((curr) => ({
    ...curr,
    notificationRules: rules,
  }));
  return rules;
}

export function saveAuditorPoolItemLocal(item) {
  writeLocalAdminState((curr) => {
    const id = item.id || `auditor-${Date.now()}`;
    const nextItem = { ...item, id };
    const exists = curr.auditorPool.some((a) => a.id === id);
    const nextPool = exists
      ? curr.auditorPool.map((a) => (a.id === id ? nextItem : a))
      : [nextItem, ...curr.auditorPool];
    return { ...curr, auditorPool: nextPool };
  });
}

export function saveCmsOverrideLocal(requirementId, patch) {
  writeLocalAdminState((curr) => ({
    ...curr,
    cmsOverrides: {
      ...curr.cmsOverrides,
      [requirementId]: {
        ...(curr.cmsOverrides[requirementId] || {}),
        ...patch,
        updatedAt: new Date().toISOString().slice(0, 10),
      },
    },
  }));
}

export async function saveCustomDispatchTemplateAdmin({
  key = '',
  title = '',
  category = '관리자 커스텀 템플릿',
  defaultChannel = 'EMAIL',
  subjectTemplate = '',
  bodyTemplate = '',
  attachments = [],
} = {}) {
  const cleanTitle = String(title || '').trim();
  const cleanSubject = String(subjectTemplate || '').trim();
  const cleanBody = String(bodyTemplate || '').trim();
  if (!cleanTitle || !cleanSubject || !cleanBody) {
    throw new Error('템플릿 이름, 제목, 본문을 모두 입력해 주세요.');
  }

  const templateKey =
    key && String(key).startsWith('CUSTOM_')
      ? String(key)
      : `CUSTOM_${Date.now().toString(36).toUpperCase()}`;

  const tplObj = {
    key: templateKey,
    category: String(category || '관리자 커스텀 템플릿').trim(),
    title: cleanTitle,
    defaultChannel: ['EMAIL', 'ALIMTALK', 'SMS'].includes(defaultChannel) ? defaultChannel : 'EMAIL',
    subjectTemplate: cleanSubject,
    bodyTemplate: cleanBody,
    attachments: Array.isArray(attachments) ? attachments : [],
    isCustom: true,
    updatedAt: new Date().toISOString(),
  };

  if (isCloudMode && supabase) {
    const { error } = await supabase.rpc('upsert_dispatch_custom_template', {
      payload: tplObj,
    });
    if (error && !isMissingFunctionOrTableError(error)) {
      throw new Error(workflowError(error));
    }
  }

  writeLocalAdminState((curr) => ({
    ...curr,
    customTemplates: [
      tplObj,
      ...(curr.customTemplates || []).filter((t) => t.key !== templateKey),
    ],
  }));

  return tplObj;
}

export function deleteCustomDispatchTemplateAdmin(templateKey) {
  writeLocalAdminState((curr) => ({
    ...curr,
    customTemplates: (curr.customTemplates || []).filter((t) => t.key !== templateKey),
  }));
}

export async function retryQueuedOrFailedDispatches(dispatchRows = [], userEmail = 'ceo@honestone.kr') {
  if (!Array.isArray(dispatchRows) || dispatchRows.length === 0) {
    throw new Error('재발송할 대기·실패 건이 없습니다.');
  }

  const items = dispatchRows.map((d) => ({
    recipientName: d.recipient_name || d.recipientName || '회원',
    recipientContact: d.recipient_contact || d.recipientContact || '',
    companyId: d.company_id || d.companyId || null,
    companyName: d.company_name || d.companyName || d.metadata?.companyName || '',
    channel: d.channel || 'EMAIL',
    templateKey: d.template_key || d.templateKey || 'ADMIN_MEMBER_NOTICE',
    senderName: d.metadata?.senderName || '어니스톤 관리자 조영빈',
    senderEmail: d.sender_email || d.metadata?.senderEmail || userEmail || 'ceo@honestone.kr',
    subject: d.subject || '',
    body: d.body || '',
    attachments: Array.isArray(d.attachments)
      ? d.attachments
      : Array.isArray(d.metadata?.attachments)
      ? d.metadata.attachments
      : [],
  }));

  return executeAdminDispatchBatch({
    items,
    mode: 'SERVER_OR_QUEUE',
    userEmail,
  });
}
