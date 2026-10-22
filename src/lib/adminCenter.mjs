// Pure domain logic for Honestone Admin Center:
// S01~S04 (회원·기업·소속 권한), 전자발송·알림 규칙(S25·S27·S34), 심사원 풀·CMS·운영(S21·S30~S36), 감사 로그.

export const ADMIN_TABS = Object.freeze([
  {
    id: 'members',
    label: '회원 · 계정 관리',
    sub: 'S02·S04·S30',
    description: '전체 가입 회원 조회, 플랫폼 역할(최고관리자·심사원·기업회원) 및 활성 상태 제어, 기업별 소속 현황 관리',
  },
  {
    id: 'companies',
    label: '기업 · 소속 권한',
    sub: 'S01·S03·S04',
    description: '기업 프로필·다중 사업장(Site) 관리, 소속 신청 코드 발급·재발급, 구성원 승인·역할 변경·소속 해제',
  },
  {
    id: 'dispatch',
    label: '전자발송 · 알림 설정',
    sub: '전자발송·S25·S34',
    description: '회원 초대·신청코드·유효기간·보완 요청 전자발송(이메일·알림톡·SMS) 큐 관리 및 발송 조건/시점 규칙 설정',
  },
  {
    id: 'operations',
    label: '심사원 · 기준 CMS · 운영',
    sub: 'S21·S31~S36',
    description: '심사원·전문가 자격 풀(S21), 인증별 표준 템플릿·기준정보 CMS(S32), 통합 운영 지표·접수/정산 관리 틀',
  },
  {
    id: 'audit-logs',
    label: '보안 감사 로그',
    sub: 'S02·S04·S17',
    description: '로그인, 권한 변경, 소속 승인·해제, 문서·프로젝트 생성/수정, 전자발송 기록 등 보안 감사 추적 대장',
  },
]);

export const PLATFORM_ROLE_LABELS = Object.freeze({
  ADMIN: '최고관리자',
  AUDITOR: '공인심사원 · 전문가',
  MEMBER: '기업실무자 · 수강생',
});

export const MEMBERSHIP_ROLE_LABELS = Object.freeze({
  OWNER: '회사 관리자 (OWNER)',
  EDITOR: '편집 권한 (EDITOR)',
  VIEWER: '열람 전용 (VIEWER)',
});

export const DISPATCH_CHANNELS = Object.freeze([
  { id: 'EMAIL', label: '이메일 (Email)', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'ALIMTALK', label: '카카오 알림톡 (Biztalk)', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'SMS', label: '문자 메시지 (SMS/LMS)', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
]);

export const DISPATCH_STATUS_LABELS = Object.freeze({
  QUEUED: '발송 대기 (큐 등록)',
  QUEUED_LOCAL: '발송 대기 (대장 기록)',
  MAILTO_OPENED: '메일 앱 전달됨',
  COPIED: '발송문 복사됨',
  SENT: '발송 완료',
  FAILED: '발송 실패',
});

export const DEFAULT_ADMIN_SENDER = Object.freeze({
  name: '어니스톤 관리자 조영빈',
  email: 'ceo@honestone.kr',
  organization: '어니스톤 (Honestone)',
});

export const COMPLETION_STATUS_LABELS = Object.freeze({
  NONE: '해당없음',
  ENROLLED: '수강중',
  COMPLETED: '수료완료',
  CERTIFIED: '파트너검증완료',
});

export const TRAINING_COURSE_PRESETS = Object.freeze([
  'ISO 9001·14001·45001 통합심사원 및 인증실무 과정',
  'ISO 9001 품질경영시스템 심사원·전문가 양성 과정',
  'ISO 14001·45001 환경·안전보건 실무 전문가 과정',
  '기업 인증 내재화 및 구비서류 실무 워크숍',
]);

export const OFFICIAL_ATTACHMENT_PRESETS = Object.freeze([
  {
    id: 'preset-completion-cert',
    code: 'CERT-EDU-01',
    title: '어니스톤 ISO 전문가·수강생 교육과정 수료증 (공식 서식)',
    category: '수료증·증명서',
    fileName: '어니스톤_교육과정_수료증.pdf',
  },
  {
    id: 'preset-iso-kickoff-notice',
    code: 'DOC-NOTICE-01',
    title: 'ISO 인증 준비 착수 안내 공문 및 필수 구비서류 체크리스트',
    category: '안내 공문',
    fileName: '어니스톤_ISO인증준비_착수공문_체크리스트.pdf',
  },
  {
    id: 'preset-supplement-form',
    code: 'DOC-SUPP-02',
    title: '필수 구비서류 보완 요청서 및 표준 작성 가이드',
    category: '보완 요청서',
    fileName: '어니스톤_구비서류_보완요청서.docx',
  },
  {
    id: 'preset-audit-schedule-notice',
    code: 'DOC-AUDIT-03',
    title: '심사 일정 사전 통보서 및 현장·서류 준비 지침서',
    category: '심사 통보서',
    fileName: '어니스톤_심사일정_사전통보서.pdf',
  },
  {
    id: 'preset-renewal-guide',
    code: 'DOC-RENEW-04',
    title: '인증 유효기간 만기 및 사후·갱신 심사 절차 안내문',
    category: '사후관리 공문',
    fileName: '어니스톤_사후갱신심사_안내문.pdf',
  },
]);

export const DISPATCH_TEMPLATES = Object.freeze([
  {
    key: 'ADMIN_MEMBER_NOTICE',
    category: '전체·선택 회원 공지 (관리자 발송)',
    title: '회원 대상 공지사항 및 교육·인증 운영 안내',
    defaultChannel: 'EMAIL',
    subjectTemplate: '[어니스톤 공지] {{수신자명}} 회원님, {{규격명}} 운영 및 주요 일정 안내',
    bodyTemplate: [
      '안녕하세요, {{수신자명}} 님 ({{기업명}}).',
      '어니스톤 관리자 조영빈입니다.',
      '',
      '플랫폼 회원 여러분께 주요 운영 사항 및 준비 일정을 안내해 드립니다.',
      '',
      '■ 수신 대상: {{수신자명}} ({{기업명}})',
      '■ 관련 과정/규격: {{규격명}}',
      '■ 주요 안내 사항: {{보완항목}}',
      '■ 기준 일자: {{목표일}}',
      '',
      '상세 내용은 동봉된 첨부 문서 또는 어니스톤 플랫폼 워크스페이스에서 확인하실 수 있습니다.',
      '문의사항이 있으시면 언제든 회신해 주시기 바랍니다.',
      '',
      '감사합니다.',
      '{{발신자명}} 드림',
    ].join('\n'),
  },
  {
    key: 'CERT_OR_COMPLETION_ISSUANCE',
    category: '인증서·수료증·공문 발송 (S24·B01)',
    title: '교육 수료증 / ISO 인증 준비 공문 / 표준 서식 전자발송',
    defaultChannel: 'EMAIL',
    subjectTemplate: '[어니스톤] {{수신자명}} ({{기업명}}) 님 {{교육과정명}} 수료증·문서 전자발송 안내',
    bodyTemplate: [
      '안녕하세요, {{수신자명}} 님.',
      '어니스톤 관리자 조영빈입니다.',
      '',
      '{{기업명}} 소속 {{수신자명}} 님의 교육 수료증 및 요청하신 표준 문서를 전자발송해 드립니다.',
      '',
      '■ 수신 회원: {{수신자명}} ({{기업명}})',
      '■ 수강 기수 / 과정명: {{수강기수}} / {{교육과정명}}',
      '■ 수료(발급) 번호: {{수료번호}}',
      '■ 발송 문서 내역: {{보완항목}}',
      '■ 발급·발송 일자: {{수료일자}}',
      '',
      '동봉된 첨부 파일 및 플랫폼 문서함을 확인해 주시기 바랍니다.',
      '',
      '감사합니다.',
      '{{발신자명}} 드림',
    ].join('\n'),
  },
  {
    key: 'MEMBER_INVITE_CODE',
    category: '회원·소속 관리 (S02·S04)',
    title: '신규 회원 가입 및 기업 소속 신청 코드 안내',
    defaultChannel: 'EMAIL',
    subjectTemplate: '[어니스톤] {{기업명}} 워크스페이스 소속 신청 코드 안내',
    bodyTemplate: [
      '안녕하세요, {{수신자명}} 님.',
      '',
      '어니스톤(Honestone) 인증 준비·문서 관리 플랫폼에서 {{기업명}} 워크스페이스 합류를 위한 소속 신청 코드를 안내해 드립니다.',
      '',
      '■ 대상 기업: {{기업명}}',
      '■ 부여 예정 권한: {{역할명}}',
      '■ 소속 신청 코드: {{신청코드}}',
      '',
      '[이용 방법]',
      '1. 어니스톤 플랫폼에 로그인(또는 신규 회원가입)합니다.',
      '2. [관리자 센터 > 기업·소속 권한] 또는 [설정 > 회사 소속 신청]에서 위 신청 코드를 입력합니다.',
      '3. 회사 관리자가 승인하면 즉시 {{기업명}}의 프로젝트 및 구비문서에 접근하실 수 있습니다.',
      '',
      '감사합니다.',
      '{{발신자명}} 드림',
    ].join('\n'),
  },
  {
    key: 'MEMBER_JOIN_APPROVED',
    category: '회원·소속 관리 (S04)',
    title: '기업 소속 승인 완료 및 권한 부여 안내',
    defaultChannel: 'ALIMTALK',
    subjectTemplate: '[어니스톤] {{기업명}} 소속 승인 및 권한({{역할명}}) 설정 완료 안내',
    bodyTemplate: [
      '안녕하세요, {{수신자명}} 님.',
      '',
      '요청하신 {{기업명}} 워크스페이스 소속 신청이 승인되었습니다.',
      '',
      '■ 소속 기업: {{기업명}}',
      '■ 승인 권한: {{역할명}}',
      '■ 적용 규격/범위: {{규격명}}',
      '',
      '지금 플랫폼에 접속하여 현재 거래처의 프로젝트와 구비서류 현황을 확인하실 수 있습니다.',
      '',
      '감사합니다.',
      '{{발신자명}} 드림',
    ].join('\n'),
  },
  {
    key: 'AUDIT_SCHEDULE_REMINDER',
    category: '심사·일정 관리 (S23·S28)',
    title: '내부 목표 심사일 대비 준비 일정 사전 점검 안내',
    defaultChannel: 'EMAIL',
    subjectTemplate: '[어니스톤] {{기업명}} ({{규격명}}) 목표 심사일({{목표일}}) 사전 준비 안내',
    bodyTemplate: [
      '안녕하세요, {{수신자명}} 님.',
      '',
      '{{기업명}}의 {{규격명}} 내부 목표 심사일({{목표일}})을 기준으로 사전 점검 일정을 안내해 드립니다.',
      '',
      '■ 대상 기업: {{기업명}}',
      '■ 대상 규격: {{규격명}}',
      '■ 내부 목표일: {{목표일}}',
      '■ 중점 점검 사항: {{보완항목}}',
      '',
      '※ 본 안내는 어니스톤 플랫폼의 내부 준비 일정 기준이며, 공식 인증기관 심사 확정 일정과는 구분됩니다.',
      '',
      '감사합니다.',
      '{{발신자명}} 드림',
    ].join('\n'),
  },
  {
    key: 'DOC_SUPPLEMENT_REQUEST',
    category: '구비서류·보완 요청 (S15·S33)',
    title: '필수 구비서류 미입력 항목 및 증적 보완 요청',
    defaultChannel: 'EMAIL',
    subjectTemplate: '[어니스톤] {{기업명}} ({{규격명}}) 필수 구비서류 보완 요청 안내',
    bodyTemplate: [
      '안녕하세요, {{수신자명}} 님.',
      '',
      '{{기업명}}의 {{규격명}} 인증 준비 문서 검토 결과, 아래 항목에 대한 확인 및 보완이 필요합니다.',
      '',
      '■ 대상 기업: {{기업명}}',
      '■ 보완 요청 항목: {{보완항목}}',
      '■ 권장 완료 기한: {{목표일}}',
      '',
      '플랫폼 내 [인증 관리 > 프로젝트 구비서류] 또는 [실시간 편집기]에서 미입력 항목([...])을 치환하고 내부 확인 상태를 갱신해 주시기 바랍니다.',
      '',
      '감사합니다.',
      '{{발신자명}} 드림',
    ].join('\n'),
  },
  {
    key: 'CERT_EXPIRY_NOTICE',
    category: '사후·만기 관리 (S26·S29)',
    title: '인증 유효기간 만기 도래 및 차기 갱신 심사 준비 안내',
    defaultChannel: 'ALIMTALK',
    subjectTemplate: '[어니스톤] {{기업명}} {{규격명}} 유효기간 만기 점검 및 차기 심사 준비 안내',
    bodyTemplate: [
      '안녕하세요, {{수신자명}} 님.',
      '',
      '{{기업명}}에서 보유·관리 중인 {{규격명}} 인증(또는 필수 문서)의 유효기간 만기일({{목표일}})이 도래하여 사전 안내드립니다.',
      '',
      '■ 대상 기업: {{기업명}}',
      '■ 대상 규격: {{규격명}}',
      '■ 기준 만기/목표일: {{목표일}}',
      '■ 안내 사항: {{보완항목}}',
      '',
      '[사후·일정 관리 > 유효기간·리스크] 메뉴에서 갱신 주기와 차기 심사 준비 프로젝트를 확인해 주세요.',
      '',
      '감사합니다.',
      '{{발신자명}} 드림',
    ].join('\n'),
  },
]);

export const DEFAULT_NOTIFICATION_RULES = Object.freeze([
  {
    id: 'rule-member-join',
    eventKey: 'MEMBER_JOIN_REQUEST',
    eventLabel: '회사 소속 신청 및 승인 처리 (S04)',
    conditionText: '소속 신청 코드 입력 또는 관리자 승인/반려 발생 시',
    timingOffset: '즉시 (Immediate)',
    channels: ['IN_APP', 'EMAIL'],
    active: true,
    targetRole: '회사 관리자 (OWNER) 및 신청 당사자',
  },
  {
    id: 'rule-cert-expiry-90',
    eventKey: 'CERT_EXPIRY_APPROACHING',
    eventLabel: '인증서 유효기간 만료 사전 알림 (S26·S28)',
    conditionText: '보유 인증서·필수 문서 유효기간 만료일 기준',
    timingOffset: 'D-90 / D-60 / D-30',
    channels: ['IN_APP', 'EMAIL', 'ALIMTALK'],
    active: true,
    targetRole: '기업 실무담당자 (EDITOR) 및 회사 관리자',
  },
  {
    id: 'rule-project-milestone',
    eventKey: 'PROJECT_TARGET_MILESTONE',
    eventLabel: '내부 목표 심사일 준비 마일스톤 안내 (S23)',
    conditionText: '프로젝트 내부 목표일 기준 미연결·미확인 구비서류 존재 시',
    timingOffset: 'D-30 / D-14 / D-3',
    channels: ['IN_APP', 'EMAIL'],
    active: true,
    targetRole: '프로젝트 담당자 및 배정 심사원·전문가',
  },
  {
    id: 'rule-doc-supplement',
    eventKey: 'DOCUMENT_SUPPLEMENT_NEEDED',
    eventLabel: '구비서류 보완 요청 및 검토 상태 변경 (S15·S33)',
    conditionText: '검토 메모 등록 또는 보완 요청 상태 전환 시',
    timingOffset: '즉시 (Immediate)',
    channels: ['IN_APP', 'EMAIL', 'SMS'],
    active: true,
    targetRole: '문서 작성자 및 기업 실무담당자',
  },
  {
    id: 'rule-standard-revision',
    eventKey: 'STANDARD_REVISION_NOTICE',
    eventLabel: 'ISO 규격·법적 요구사항 기준정보 업데이트 (S27·S32)',
    conditionText: 'CMS 표준 템플릿 버전 배포(Published) 시 해당 규격 보유 기업',
    timingOffset: '배포 후 1시간 이내',
    channels: ['IN_APP', 'EMAIL'],
    active: false,
    targetRole: '해당 규격 프로젝트 보유 기업 전체',
  },
]);

export const DEFAULT_AUDITOR_POOL = Object.freeze([
  {
    id: 'auditor-pool-1',
    name: '김성우',
    email: 'auditor.kim@kab.or.kr',
    grade: '선임심사원 (Lead Auditor)',
    standards: ['ISO_9001', 'ISO_14001'],
    region: '서울·경기·인천',
    licenseNo: 'KAB-LA-2019-0482',
    conflictStatus: '이해상충 이상 없음',
    active: true,
    assignedCount: 4,
  },
  {
    id: 'auditor-pool-2',
    name: '박진영',
    email: 'jypark@honestone.kr',
    grade: '수석 컨설턴트 · 심사원보',
    standards: ['ISO_9001', 'ISO_45001'],
    region: '대전·충청·세종',
    licenseNo: 'HS-CON-2023-0119',
    conflictStatus: '이해상충 이상 없음',
    active: true,
    assignedCount: 3,
  },
  {
    id: 'auditor-pool-3',
    name: '최윤서',
    email: 'yschoi@security-iso.kr',
    grade: '선임심사원 (정보보호)',
    standards: ['ISO_27001', 'ISO_9001'],
    region: '서울·판교·전국',
    licenseNo: 'ISMS-LA-2021-0831',
    conflictStatus: '이해상충 검토 완료',
    active: true,
    assignedCount: 2,
  },
]);

export function resolveAdminTab(pathname = '', searchParams = null) {
  const parts = String(pathname || '')
    .split('/')
    .filter(Boolean);
  if (parts[0] === 'admin' && parts[1]) {
    const matched = ADMIN_TABS.find((t) => t.id === parts[1]);
    if (matched) return matched.id;
  }
  const queryTab =
    typeof searchParams?.get === 'function'
      ? searchParams.get('adminTab')
      : typeof searchParams === 'string'
      ? new URLSearchParams(searchParams).get('adminTab')
      : null;
  if (queryTab && ADMIN_TABS.some((t) => t.id === queryTab)) {
    return queryTab;
  }
  return 'members';
}

export function normalizeCompanyProfile(company = {}) {
  const meta = company?.metadata && typeof company.metadata === 'object' ? company.metadata : {};
  const rawSites = Array.isArray(meta.sites) ? meta.sites : [];
  const sites =
    rawSites.length > 0
      ? rawSites.map((s, idx) => ({
          id: s.id || `site-${idx + 1}`,
          name: String(s.name || (idx === 0 ? '본사 사업장' : `사업장 ${idx + 1}`)).trim(),
          address: String(s.address || '').trim(),
          scope: String(s.scope || '').trim(),
          headcount: Number.isFinite(Number(s.headcount)) ? Number(s.headcount) : 0,
          isHeadquarters: Boolean(s.isHeadquarters ?? idx === 0),
        }))
      : [
          {
            id: 'site-hq',
            name: '본사 (주사업장)',
            address: String(meta.address || '').trim(),
            scope: String(meta.scope || company?.industry || '').trim(),
            headcount: Number.isFinite(Number(meta.headcount)) ? Number(meta.headcount) : 0,
            isHeadquarters: true,
          },
        ];

  return {
    id: company?.id || '',
    name: String(company?.name || '').trim(),
    industry: String(company?.industry || '미분류').trim(),
    bizNo: String(meta.bizNo || company?.bizNo || '').trim(),
    ceoName: String(meta.ceoName || company?.ceoName || '').trim(),
    scale: String(meta.scale || '중소기업').trim(),
    ksicCode: String(meta.ksicCode || '').trim(),
    contactEmail: String(meta.contactEmail || '').trim(),
    phone: String(meta.phone || '').trim(),
    address: String(meta.address || '').trim(),
    sites,
    sourceClientId: company?.source_client_id || null,
  };
}

export function validateCompanyProfileInput(input = {}) {
  const name = String(input.name || '').trim();
  if (!name || name.length > 180) {
    return { valid: false, field: 'name', error: '기업명(거래처명)을 1~180자 이내로 입력해 주세요.' };
  }
  const bizNo = String(input.bizNo || '').trim();
  if (bizNo && !/^(\d{3}-\d{2}-\d{5}|\d{10})$/.test(bizNo)) {
    return {
      valid: false,
      field: 'bizNo',
      error: '사업자등록번호는 000-00-00000 형식 또는 숫자 10자리로 입력해 주세요.',
    };
  }
  const contactEmail = String(input.contactEmail || '').trim();
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return {
      valid: false,
      field: 'contactEmail',
      error: '대표 이메일 주소 형식을 확인해 주세요.',
    };
  }
  return { valid: true, field: null, error: null };
}

export function buildMemberDirectory({
  profiles = [],
  rosterEntries = [],
  companies = [],
  memberships = [],
  pendingRequests = [],
} = {}) {
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const companyByName = new Map(
    companies
      .filter((c) => c?.name)
      .map((c) => [String(c.name).trim().toLowerCase(), c])
  );
  const membershipsByUser = new Map();

  for (const m of memberships) {
    const userId = m.user_id || m.userId;
    if (!userId) continue;
    const list = membershipsByUser.get(userId) || [];
    const comp = companyById.get(m.company_id || m.companyId);
    list.push({
      companyId: m.company_id || m.companyId,
      companyName: m.companyName || comp?.name || '소속 기업',
      role: m.membership_role || m.role || 'VIEWER',
      active: m.is_active !== undefined ? Boolean(m.is_active) : m.active !== false,
      endedAt: m.ended_at || m.endedAt || null,
    });
    membershipsByUser.set(userId, list);
  }

  const pendingByUser = new Map();
  for (const req of pendingRequests) {
    const userId = req.user_id || req.userId;
    if (!userId) continue;
    const list = pendingByUser.get(userId) || [];
    list.push(req);
    pendingByUser.set(userId, list);
  }

  // Index roster entries by email and id for merging
  const rosterByEmail = new Map();
  const extraRosterItems = [];
  for (const r of rosterEntries) {
    if (!r || typeof r !== 'object') continue;
    const emailKey = String(r.email || '').trim().toLowerCase();
    if (emailKey) {
      rosterByEmail.set(emailKey, r);
    } else if (r.id) {
      extraRosterItems.push(r);
    }
  }

  const seenIds = new Set();
  const seenEmails = new Set();
  const rows = [];

  const buildRow = (p, rosterMatch = null, isRosterOnly = false) => {
    const pMeta = p.metadata && typeof p.metadata === 'object' ? p.metadata : {};
    const rMeta =
      rosterMatch?.metadata && typeof rosterMatch.metadata === 'object' ? rosterMatch.metadata : {};
    const meta = { ...rMeta, ...pMeta };

    const rawCompanyName = String(
      meta.companyName || rosterMatch?.company_name || rosterMatch?.companyName || p.company_name || p.companyName || ''
    ).trim();
    const matchedCompanyByName = rawCompanyName ? companyByName.get(rawCompanyName.toLowerCase()) : null;

    const primaryCompanyId =
      p.company_id ||
      p.companyId ||
      p.company?.id ||
      rosterMatch?.company_id ||
      rosterMatch?.companyId ||
      matchedCompanyByName?.id ||
      null;
    const primaryCompany = primaryCompanyId
      ? companyById.get(primaryCompanyId) || p.company || matchedCompanyByName
      : p.company || matchedCompanyByName;

    const userMemberships = [...(membershipsByUser.get(p.id) || [])];
    if (primaryCompanyId && !userMemberships.some((m) => m.companyId === primaryCompanyId)) {
      userMemberships.unshift({
        companyId: primaryCompanyId,
        companyName: primaryCompany?.name || rawCompanyName || '기본 워크스페이스',
        role: 'OWNER',
        active: true,
        endedAt: null,
      });
    }
    const activeMemberships = userMemberships.filter((m) => m.active);
    const userPending = pendingByUser.get(p.id) || [];
    const roleCandidate = p.role || rosterMatch?.role || 'MEMBER';
    const role = ['ADMIN', 'AUDITOR', 'MEMBER'].includes(roleCandidate) ? roleCandidate : 'MEMBER';
    const isActive =
      p.is_active !== undefined
        ? Boolean(p.is_active)
        : p.isActive !== undefined
        ? Boolean(p.isActive)
        : rosterMatch?.is_active !== undefined
        ? Boolean(rosterMatch.is_active)
        : true;

    const cohort = String(meta.cohort || p.cohort || rosterMatch?.cohort || '').trim();
    const courseName = String(meta.courseName || p.courseName || rosterMatch?.courseName || '').trim();
    const rawCompletion = String(
      meta.completionStatus || p.completionStatus || rosterMatch?.completionStatus || 'NONE'
    )
      .trim()
      .toUpperCase();
    const completionStatus = ['NONE', 'ENROLLED', 'COMPLETED', 'CERTIFIED'].includes(rawCompletion)
      ? rawCompletion
      : cohort || courseName
      ? 'ENROLLED'
      : 'NONE';
    const certificateNo = String(meta.certificateNo || p.certificateNo || rosterMatch?.certificateNo || '').trim();
    const completionDate = String(
      meta.completionDate || p.completionDate || rosterMatch?.completionDate || ''
    ).trim();
    const adminMemo = String(meta.adminMemo || p.adminMemo || rosterMatch?.adminMemo || '').trim();
    const tags = Array.isArray(meta.tags)
      ? meta.tags
      : typeof meta.tags === 'string' && meta.tags.trim()
      ? meta.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    return {
      id: p.id,
      email: String(p.email || rosterMatch?.email || '').trim(),
      fullName: String(
        p.full_name ||
          p.fullName ||
          p.name ||
          rosterMatch?.full_name ||
          rosterMatch?.fullName ||
          p.email?.split('@')[0] ||
          '이름 미등록'
      ).trim(),
      role,
      roleLabel: PLATFORM_ROLE_LABELS[role] || role,
      phone: String(p.phone || meta.phone || rosterMatch?.phone || '').trim(),
      department: String(meta.department || p.title || '').trim(),
      isActive,
      primaryCompanyId,
      primaryCompanyName:
        primaryCompany?.name || activeMemberships[0]?.companyName || rawCompanyName || '미배정',
      memberships: userMemberships,
      activeCompanyCount: activeMemberships.length,
      pendingRequestCount: userPending.length,
      cohort,
      courseName,
      completionStatus,
      completionStatusLabel: COMPLETION_STATUS_LABELS[completionStatus] || '해당없음',
      certificateNo,
      completionDate,
      adminMemo,
      tags,
      isRosterOnly,
      createdAt: p.created_at || p.createdAt || rosterMatch?.created_at || null,
      updatedAt: p.updated_at || p.updatedAt || rosterMatch?.updated_at || null,
      metadata: {
        ...meta,
        cohort,
        courseName,
        completionStatus,
        certificateNo,
        completionDate,
        adminMemo,
        tags,
      },
    };
  };

  for (const p of profiles) {
    if (!p?.id || seenIds.has(p.id)) continue;
    seenIds.add(p.id);
    const emailKey = String(p.email || '').trim().toLowerCase();
    if (emailKey) seenEmails.add(emailKey);
    const rosterMatch = emailKey ? rosterByEmail.get(emailKey) : null;
    rows.push(buildRow(p, rosterMatch, false));
  }

  for (const [emailKey, r] of rosterByEmail.entries()) {
    if (seenEmails.has(emailKey)) continue;
    const id = r.id || `roster-${emailKey}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    seenEmails.add(emailKey);
    rows.push(buildRow({ ...r, id }, r, true));
  }

  for (const r of extraRosterItems) {
    const id = r.id;
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);
    rows.push(buildRow({ ...r, id }, r, true));
  }

  return rows.sort((a, b) => {
    const roleOrder = { ADMIN: 0, AUDITOR: 1, MEMBER: 2 };
    const rDiff = (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9);
    if (rDiff !== 0) return rDiff;
    return a.fullName.localeCompare(b.fullName, 'ko');
  });
}

export function filterMemberDirectory(
  members = [],
  { role = 'ALL', status = 'ALL', companyId = '', cohort = 'ALL', completionStatus = 'ALL', query = '' } = {}
) {
  const q = String(query || '').trim().toLowerCase();
  return members.filter((m) => {
    if (role !== 'ALL' && m.role !== role) return false;
    if (status === 'ACTIVE' && !m.isActive) return false;
    if (status === 'INACTIVE' && m.isActive) return false;
    if (status === 'PENDING_JOIN' && m.pendingRequestCount === 0) return false;
    if (cohort !== 'ALL' && String(m.cohort || '') !== cohort) return false;
    if (completionStatus !== 'ALL') {
      if (completionStatus === 'HAS_COURSE' && (!m.completionStatus || m.completionStatus === 'NONE')) {
        return false;
      }
      if (completionStatus !== 'HAS_COURSE' && m.completionStatus !== completionStatus) {
        return false;
      }
    }
    if (companyId) {
      const inCompany =
        m.primaryCompanyId === companyId ||
        m.memberships.some((item) => item.companyId === companyId && item.active);
      if (!inCompany) return false;
    }
    if (q) {
      const hay = [
        m.fullName,
        m.email,
        m.phone,
        m.department,
        m.primaryCompanyName,
        m.cohort,
        m.courseName,
        m.certificateNo,
        m.adminMemo,
        ...(Array.isArray(m.tags) ? m.tags : []),
        ...m.memberships.map((item) => item.companyName),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function escapeCsvCell(val) {
  const str = String(val ?? '').replace(/\r?\n/g, ' ');
  if (/[",]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildMembersCsv(members = []) {
  const header = [
    '성명',
    '이메일',
    '플랫폼 역할',
    '계정 상태',
    '주 소속 기업',
    '활성 소속 기업 수',
    '연락처',
    '수강기수',
    '교육과정명',
    '수료상태',
    '수료번호',
    '관리자메모',
    '가입일',
  ];
  const lines = [
    header.map(escapeCsvCell).join(','),
    ...members.map((m) =>
      [
        m.fullName,
        m.email,
        m.roleLabel,
        m.isActive ? '활성' : '비활성(정지)',
        m.primaryCompanyName,
        m.activeCompanyCount,
        m.phone || '-',
        m.cohort || '-',
        m.courseName || '-',
        m.completionStatusLabel || COMPLETION_STATUS_LABELS[m.completionStatus] || '해당없음',
        m.certificateNo || '-',
        m.adminMemo || '-',
        m.createdAt ? String(m.createdAt).slice(0, 10) : '-',
      ]
        .map(escapeCsvCell)
        .join(',')
    ),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}

export function generateCompletionCertificateNumber({
  cohort = '',
  sequence = 1,
  dateStr = new Date().toISOString().slice(0, 10),
} = {}) {
  const ym = String(dateStr || '').replace(/-/g, '').slice(0, 6) || '202610';
  const cleanCohort = String(cohort || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^0-9A-Za-z가-힣]/g, '');
  const seqStr = String(Math.max(1, Number(sequence) || 1)).padStart(3, '0');
  return cleanCohort ? `HN-EDU-${ym}-${cleanCohort}-${seqStr}` : `HN-EDU-${ym}-${seqStr}`;
}

export function buildCompletionCertificateDoc(member = {}, options = {}) {
  const fullName = member.fullName || '수강생';
  const companyName = member.primaryCompanyName || member.companyName || '어니스톤 교육생';
  const cohort = options.cohort || member.cohort || '제1기';
  const courseName =
    options.courseName || member.courseName || TRAINING_COURSE_PRESETS[0];
  const certificateNo =
    options.certificateNo ||
    member.certificateNo ||
    generateCompletionCertificateNumber({ cohort, sequence: 1 });
  const completionDate =
    options.completionDate || member.completionDate || new Date().toISOString().slice(0, 10);
  const issuerName = options.issuerName || '어니스톤 (Honestone) 대표 조 영 빈';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>어니스톤 교육과정 수료증 - ${fullName}</title>
<style>
  @page { size: A4 portrait; margin: 20mm; }
  body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; color: #0f172a; line-height: 1.6; }
  .cert-frame { border: 4px double #1e3a8a; padding: 36px 40px; min-height: 230mm; box-sizing: border-box; }
  .cert-no { font-size: 11pt; color: #334155; font-weight: bold; margin-bottom: 24px; }
  .cert-title { text-align: center; font-size: 28pt; font-weight: 800; letter-spacing: 12px; color: #0f172a; margin: 20px 0 36px; }
  .info-table { width: 100%; border-collapse: collapse; margin: 24px 0 36px; font-size: 12pt; }
  .info-table th { text-align: left; width: 130px; padding: 10px 8px; color: #334155; border-bottom: 1px solid #e2e8f0; }
  .info-table td { padding: 10px 8px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; }
  .statement { font-size: 13.5pt; text-align: center; margin: 44px 0; line-height: 2.0; font-weight: 600; word-break: keep-all; }
  .date-row { text-align: center; font-size: 13pt; font-weight: 700; margin-top: 48px; }
  .issuer-row { text-align: center; font-size: 17pt; font-weight: 800; color: #1e3a8a; margin-top: 36px; letter-spacing: 2px; }
</style>
</head>
<body>
  <div class="cert-frame">
    <div class="cert-no">수료번호 : 제 ${certificateNo} 호</div>
    <div class="cert-title">수 료 증</div>
    <table class="info-table">
      <tr><th>성 명</th><td>${fullName}</td></tr>
      <tr><th>소 속 기 업</th><td>${companyName}</td></tr>
      <tr><th>수 강 기 수</th><td>${cohort}</td></tr>
      <tr><th>교 육 과 정</th><td>${courseName}</td></tr>
    </table>
    <div class="statement">
      위 사람은 어니스톤(Honestone)에서 실시한<br/>
      <strong>「${courseName}」</strong>의 전 교육 및 실무 평가 과정을<br/>
      성실히 이수하였으므로 이 증서를 수여합니다.
    </div>
    <div class="date-row">${completionDate}</div>
    <div class="issuer-row">${issuerName} [직인]</div>
  </div>
</body>
</html>`;
}

export function buildSampleRosterCsv() {
  const header = [
    '성명',
    '이메일',
    '연락처',
    '권한(MEMBER/AUDITOR)',
    '소속기업명',
    '수강기수',
    '교육과정명',
    '수료상태(수강중/수료완료/파트너검증완료)',
    '수료번호',
    '비고',
  ];
  const sampleRows = [
    [
      '김수강',
      'trainee1@example.kr',
      '010-1234-5678',
      'MEMBER',
      '(주)대한정밀',
      '1기',
      'ISO 9001·14001·45001 통합심사원 및 인증실무 과정',
      '수료완료',
      'HN-EDU-202610-1기-001',
      '실습 우수 수료생',
    ],
    [
      '이심사',
      'auditor2@example.kr',
      '010-9876-5432',
      'AUDITOR',
      '어니스톤 파트너스',
      '1기',
      'ISO 9001·14001·45001 통합심사원 및 인증실무 과정',
      '파트너검증완료',
      'HN-EDU-202610-1기-002',
      '기계·금속 분야 전문',
    ],
  ];
  const lines = [
    header.map(escapeCsvCell).join(','),
    ...sampleRows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}

function splitCsvLine(line, delimiter = ',') {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseMemberRosterCsv(rawText = '') {
  const cleaned = String(rawText || '').replace(/^\uFEFF/, '').trim();
  if (!cleaned) return { validRows: [], invalidRows: [] };

  const rawLines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (rawLines.length === 0) return { validRows: [], invalidRows: [] };

  const delimiter = rawLines[0].includes('\t') && !rawLines[0].includes(',') ? '\t' : ',';
  const firstCells = splitCsvLine(rawLines[0], delimiter);
  const hasHeader = firstCells.some((c) =>
    /^(성명|이름|name|이메일|email|연락처|전화번호)/i.test(c.trim())
  );

  const headerMap = {};
  if (hasHeader) {
    firstCells.forEach((h, i) => {
      const k = h.replace(/\s+/g, '').toLowerCase();
      if (/^(성명|이름|name|회원명|수강생명)/.test(k)) headerMap.name = i;
      else if (/^(이메일|메일|email)/.test(k)) headerMap.email = i;
      else if (/^(연락처|전화|휴대폰|phone|tel)/.test(k)) headerMap.phone = i;
      else if (/^(권한|역할|role)/.test(k)) headerMap.role = i;
      else if (/^(소속|기업|회사|company)/.test(k)) headerMap.company = i;
      else if (/^(부서|직책|dept|department)/.test(k)) headerMap.department = i;
      else if (/^(기수|수강기수|cohort)/.test(k)) headerMap.cohort = i;
      else if (/^(교육과정|과정명|course)/.test(k)) headerMap.course = i;
      else if (/^(수료상태|상태|completion|수료여부)/.test(k)) headerMap.completion = i;
      else if (/^(수료번호|증서번호|cert)/.test(k)) headerMap.certNo = i;
      else if (/^(비고|메모|관리자메모|memo|note)/.test(k)) headerMap.memo = i;
    });
  }

  const dataLines = hasHeader ? rawLines.slice(1) : rawLines;
  const validRows = [];
  const invalidRows = [];
  const seenEmails = new Set();

  dataLines.forEach((line, idx) => {
    const cells = splitCsvLine(line, delimiter);
    const pick = (key, fallbackIdx, def = '') => {
      if (hasHeader && headerMap[key] !== undefined) {
        return cells[headerMap[key]] ?? def;
      }
      return cells[fallbackIdx] ?? def;
    };

    const rawName = pick('name', 0, '');
    const rawEmail = pick('email', 1, '');
    const rawPhone = pick('phone', 2, '');
    const rawRole = pick('role', 3, 'MEMBER');
    const rawCompany = pick('company', 4, '');
    const rawDept = hasHeader && headerMap.department !== undefined ? cells[headerMap.department] || '' : '';
    const rawCohort = pick('cohort', 5, '');
    const rawCourse = pick('course', 6, '');
    const rawCompletion = pick('completion', 7, '');
    const rawCertNo = pick('certNo', 8, '');
    const rawMemo = pick('memo', 9, '');

    const fullName = rawName.trim();
    const email = rawEmail.trim().toLowerCase();
    const rowNumber = hasHeader ? idx + 2 : idx + 1;

    if (!fullName) {
      invalidRows.push({ rowNumber, lineNumber: rowNumber, fullName: '(미입력)', email, reason: '성명 누락' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      invalidRows.push({
        rowNumber,
        lineNumber: rowNumber,
        fullName,
        email: email || '(미입력)',
        reason: '유효하지 않은 이메일 형식',
      });
      return;
    }
    if (seenEmails.has(email)) {
      invalidRows.push({ rowNumber, lineNumber: rowNumber, fullName, email, reason: '명단 내 중복 이메일' });
      return;
    }
    seenEmails.add(email);

    const roleUpper = rawRole.trim().toUpperCase();
    const role =
      roleUpper === 'ADMIN' || rawRole.includes('관리자')
        ? 'ADMIN'
        : roleUpper === 'AUDITOR' || rawRole.includes('심사원') || rawRole.includes('전문가')
        ? 'AUDITOR'
        : 'MEMBER';

    const compTrim = rawCompletion.trim().toUpperCase();
    let completionStatus = 'NONE';
    if (compTrim === 'CERTIFIED' || rawCompletion.includes('파트너') || rawCompletion.includes('검증')) {
      completionStatus = 'CERTIFIED';
    } else if (compTrim === 'COMPLETED' || rawCompletion.includes('수료완료') || rawCompletion === '수료') {
      completionStatus = 'COMPLETED';
    } else if (compTrim === 'ENROLLED' || rawCompletion.includes('수강') || rawCohort.trim() || rawCourse.trim()) {
      completionStatus = 'ENROLLED';
    }

    validRows.push({
      rowNumber,
      lineNumber: rowNumber,
      fullName,
      email,
      phone: rawPhone.trim(),
      role,
      companyName: rawCompany.trim() || '어니스톤 교육생',
      department: rawDept.trim(),
      cohort: rawCohort.trim(),
      courseName: rawCourse.trim(),
      completionStatus,
      certificateNo: rawCertNo.trim(),
      adminMemo: rawMemo.trim(),
    });
  });

  return { validRows, invalidRows };
}

export function renderDispatchPreview(templateKey, variables = {}, customTemplates = []) {
  const allTemplates = [
    ...DISPATCH_TEMPLATES,
    ...(Array.isArray(customTemplates) ? customTemplates : []),
  ];
  const tpl = allTemplates.find((t) => t.key === templateKey) || DISPATCH_TEMPLATES[0];
  const senderName = String(variables.senderName || DEFAULT_ADMIN_SENDER.name).trim();
  const senderEmail = String(variables.senderEmail || DEFAULT_ADMIN_SENDER.email).trim();
  const attachments = Array.isArray(variables.attachments) ? variables.attachments : [];

  const map = {
    수신자명: variables.recipientName || '담당자',
    기업명: variables.companyName || '귀사',
    신청코드: variables.joinCode || '(소속 신청 코드 발급 필요)',
    역할명: variables.roleLabel || '열람/편집 권한',
    목표일: variables.targetDate || new Date().toISOString().slice(0, 10),
    규격명: variables.standardName || 'ISO 9001:2015',
    보완항목: variables.supplementText || '필수 구비서류 미입력 항목([...]) 점검 및 내부 확인 처리',
    수강기수: variables.cohort || '제1기',
    교육과정명: variables.courseName || TRAINING_COURSE_PRESETS[0],
    수료번호: variables.certificateNo || 'HN-EDU-202610-001',
    수료일자: variables.completionDate || variables.targetDate || new Date().toISOString().slice(0, 10),
    발신자명: senderName,
    발신이메일: senderEmail,
  };

  const replaceTokens = (str) =>
    String(str || '').replace(/\{\{([^}]+)\}\}/g, (_, key) => map[key.trim()] ?? `{{${key}}}`);

  let body = replaceTokens(variables.customBody || tpl.bodyTemplate);
  if (attachments.length > 0) {
    const attachmentLines = attachments.map(
      (att, idx) =>
        `  ${idx + 1}. [${att.category || '동봉문서'}] ${att.title || att.fileName}${
          att.fileName && att.title && att.fileName !== att.title ? ` (${att.fileName})` : ''
        }`
    );
    body = `${body}\n\n[동봉·첨부 문서 (${attachments.length}건)]\n${attachmentLines.join('\n')}`;
  }

  return {
    templateKey: tpl.key,
    channel: variables.channel || tpl.defaultChannel,
    senderName,
    senderEmail,
    subject: replaceTokens(variables.customSubject || tpl.subjectTemplate),
    body,
    attachments,
  };
}

export function normalizeDispatchRecipients(recipients = [], channel = 'EMAIL') {
  const seen = new Set();
  const validRecipients = [];
  const invalidRecipients = [];

  for (const item of recipients) {
    if (!item || typeof item !== 'object') continue;
    const name = String(item.fullName || item.name || item.recipientName || '회원').trim();
    const email = String(item.email || '').trim();
    const phone = String(item.phone || '').trim();
    const contact =
      channel === 'EMAIL'
        ? email || String(item.recipientContact || '').trim()
        : phone || String(item.recipientContact || '').trim() || email;
    const dedupeKey = `${item.id || ''}:${contact.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    if (!contact) {
      invalidRecipients.push({
        ...item,
        name,
        contact: '',
        reason: channel === 'EMAIL' ? '이메일 미등록' : '연락처 미등록',
      });
      continue;
    }
    if (channel === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      invalidRecipients.push({
        ...item,
        name,
        contact,
        reason: '이메일 형식 오류',
      });
      continue;
    }

    validRecipients.push({
      id: item.id || `recipient-${validRecipients.length + 1}`,
      name,
      email,
      phone,
      contact,
      companyId: item.primaryCompanyId || item.companyId || null,
      companyName: item.primaryCompanyName || item.companyName || '어니스톤 회원',
      roleLabel: item.roleLabel || PLATFORM_ROLE_LABELS[item.role] || '회원',
      cohort: item.cohort || item.metadata?.cohort || '',
      courseName: item.courseName || item.metadata?.courseName || '',
      certificateNo: item.certificateNo || item.metadata?.certificateNo || '',
      completionDate: item.completionDate || item.metadata?.completionDate || '',
    });
  }

  return { validRecipients, invalidRecipients };
}

export function buildPersonalizedDispatchBatch({
  recipients = [],
  templateKey = 'ADMIN_MEMBER_NOTICE',
  channel = 'EMAIL',
  baseVariables = {},
  subject,
  body,
  attachments = [],
  customTemplates = [],
} = {}) {
  const { validRecipients, invalidRecipients } = normalizeDispatchRecipients(recipients, channel);
  const payloads = validRecipients.map((recipient, idx) => {
    const rendered = renderDispatchPreview(
      templateKey,
      {
        ...baseVariables,
        ...(subject !== undefined ? { customSubject: subject } : {}),
        ...(body !== undefined ? { customBody: body } : {}),
        channel,
        recipientName: recipient.name,
        companyName: recipient.companyName || baseVariables.companyName || '귀사',
        cohort: recipient.cohort || baseVariables.cohort || '제1기',
        courseName: recipient.courseName || baseVariables.courseName || TRAINING_COURSE_PRESETS[0],
        certificateNo:
          recipient.certificateNo ||
          baseVariables.certificateNo ||
          generateCompletionCertificateNumber({
            cohort: recipient.cohort || baseVariables.cohort || '1기',
            sequence: idx + 1,
          }),
        completionDate:
          recipient.completionDate ||
          baseVariables.completionDate ||
          baseVariables.targetDate ||
          new Date().toISOString().slice(0, 10),
        attachments,
      },
      customTemplates
    );
    return {
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientContact: recipient.contact,
      companyId: recipient.companyId || baseVariables.companyId || null,
      companyName: recipient.companyName || baseVariables.companyName || '',
      channel,
      templateKey: rendered.templateKey,
      senderName: rendered.senderName,
      senderEmail: rendered.senderEmail,
      subject: rendered.subject,
      body: rendered.body,
      attachments,
    };
  });

  return { payloads, validRecipients, invalidRecipients };
}

export function validateDispatchInput(input = {}) {
  const channel = String(input.channel || 'EMAIL').trim();
  if (!['EMAIL', 'ALIMTALK', 'SMS'].includes(channel)) {
    return { valid: false, field: 'channel', error: '발송 채널을 선택해 주세요.' };
  }
  const contact = String(input.recipientContact || '').trim();
  if (!contact) {
    return {
      valid: false,
      field: 'recipientContact',
      error: channel === 'EMAIL' ? '수신자 이메일 주소를 입력해 주세요.' : '수신자 휴대전화 번호를 입력해 주세요.',
    };
  }
  if (channel === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    return { valid: false, field: 'recipientContact', error: '유효한 이메일 주소 형식을 입력해 주세요.' };
  }
  const subject = String(input.subject || '').trim();
  if (!subject) {
    return { valid: false, field: 'subject', error: '발송 제목을 입력해 주세요.' };
  }
  const body = String(input.body || '').trim();
  if (!body) {
    return { valid: false, field: 'body', error: '발송 본문 내용을 입력해 주세요.' };
  }
  return { valid: true, field: null, error: null };
}

export function buildMailtoHref({ recipientContact = '', bccContacts = [], subject = '', body = '' } = {}) {
  const email = String(recipientContact || '').trim();
  const params = new URLSearchParams();
  const cleanBcc = (Array.isArray(bccContacts) ? bccContacts : [])
    .map((c) => String(c || '').trim())
    .filter((c) => c && c !== email);
  if (cleanBcc.length > 0) params.set('bcc', cleanBcc.join(','));
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const query = params.toString().replace(/\+/g, '%20');
  return `mailto:${encodeURIComponent(email)}${query ? `?${query}` : ''}`;
}

export function filterDispatchHistory(
  dispatches = [],
  { channel = 'ALL', status = 'ALL', memberContact = '', query = '' } = {}
) {
  const q = String(query || '').trim().toLowerCase();
  const targetContact = String(memberContact || '').trim().toLowerCase();

  return dispatches.filter((d) => {
    if (channel !== 'ALL' && d.channel !== channel) return false;
    if (status !== 'ALL') {
      if (status === 'QUEUED' && !['QUEUED', 'QUEUED_LOCAL'].includes(d.status)) return false;
      if (status !== 'QUEUED' && d.status !== status) return false;
    }
    if (targetContact) {
      const contact = String(d.recipient_contact || d.recipientContact || '').toLowerCase();
      const rName = String(d.recipient_name || d.recipientName || '').toLowerCase();
      if (contact !== targetContact && !rName.includes(targetContact)) return false;
    }
    if (q) {
      const hay = [
        d.recipient_name || d.recipientName,
        d.recipient_contact || d.recipientContact,
        d.companyName || d.metadata?.companyName,
        d.subject,
        d.body,
        d.sender_email || d.metadata?.senderName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function buildDispatchesCsv(dispatches = []) {
  const header = [
    '발송일시',
    '발신관리자',
    '수신회원명',
    '소속기업',
    '발송채널',
    '수신연락처',
    '템플릿코드',
    '발송제목',
    '동봉문서수',
    '발송상태',
    '전송결과/메모',
  ];
  const lines = [
    header.map(escapeCsvCell).join(','),
    ...dispatches.map((d) => {
      const attachments = Array.isArray(d.attachments)
        ? d.attachments
        : Array.isArray(d.metadata?.attachments)
        ? d.metadata.attachments
        : [];
      return [
        d.created_at || d.createdAt || '-',
        d.metadata?.senderName || d.sender_email || DEFAULT_ADMIN_SENDER.name,
        d.recipient_name || d.recipientName || '-',
        d.companyName || d.metadata?.companyName || '-',
        d.channel || 'EMAIL',
        d.recipient_contact || d.recipientContact || '-',
        d.template_key || d.templateKey || '-',
        d.subject || '-',
        attachments.length > 0
          ? `${attachments.length}건 (${attachments.map((a) => a.title || a.fileName || '문서').join('; ')})`
          : '0건',
        DISPATCH_STATUS_LABELS[d.status] || d.status || '-',
        d.metadata?.deliveryNote || d.deliveryNote || '-',
      ]
        .map(escapeCsvCell)
        .join(',');
    }),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}

export function buildAuditLogsCsv(logs = []) {
  const header = ['일시', '수행자 이메일', '작업 유형', '대상 리소스', '리소스 제목', '기업 ID', '상세 내역'];
  const lines = [
    header.map(escapeCsvCell).join(','),
    ...logs.map((log) =>
      [
        log.created_at || log.createdAt || '-',
        log.user_email || log.userEmail || '-',
        log.action_type || log.actionType || '-',
        log.target_resource || log.targetResource || '-',
        log.resource_title || log.resourceTitle || '-',
        log.company_id || log.companyId || '-',
        typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || ''),
      ]
        .map(escapeCsvCell)
        .join(',')
    ),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}

export function summarizePlatformOperations({
  members = [],
  companies = [],
  projects = [],
  documents = [],
  dispatches = [],
  auditLogs = [],
} = {}) {
  const activeMembers = members.filter((m) => m.isActive).length;
  const auditorCount = members.filter((m) => m.role === 'AUDITOR').length;
  const adminCount = members.filter((m) => m.role === 'ADMIN').length;
  const verifiedDocs = documents.filter(
    (d) => String(d.reviewStatus || '').toUpperCase() === 'VERIFIED' || d.docStatus === '승인 완료'
  ).length;
  const draftDocs = documents.length - verifiedDocs;

  return {
    totalMembers: members.length,
    activeMembers,
    auditorCount,
    adminCount,
    totalCompanies: companies.length,
    totalProjects: projects.length,
    totalDocuments: documents.length,
    verifiedDocs,
    draftDocs,
    totalDispatches: dispatches.length,
    totalAuditLogs: auditLogs.length,
  };
}
