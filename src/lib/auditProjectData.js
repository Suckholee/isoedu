// ========================================================
// ISO Auditor Activity Domains & Client Audit Projects Dataset
// Based on ISO Auditor Scope of Activities & Revenue Model
// ========================================================

export const AUDITOR_ACTIVITY_DOMAINS = [
  {
    id: 'ISO_AUDIT',
    title: 'ISO 경영시스템 심사',
    subtitle: 'ISO 9001, 14001, 45001, 27001, 13485, 22000, 37001',
    icon: '🏆',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    description: '국제표준 경영시스템 최초인증, 정기 사후관리심사, 갱신심사 및 특수규격 심사',
    standards: ['ISO_9001', 'ISO_14001', 'ISO_45001', 'ISO_27001', 'ISO_13485', 'ISO_22000', 'ISO_37001']
  },
  {
    id: 'SME_CONSULTING',
    title: '중소기업 컨설팅 (5~20인 대상)',
    subtitle: '소규모 사업장 맞춤형 QMS 프로세스 표준화',
    icon: '🏢',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: '5~20인 규모 스타트업/제조업 맞춤형 4계층 문서 체계화 및 업무 매뉴얼 구축',
    standards: ['ISO_9001', 'SME_QMS', 'STARTUP_STANDARD']
  },
  {
    id: 'PRODUCT_CERT',
    title: '제품 인증 컨설팅 / 총괄대행',
    subtitle: 'KC, CE, FDA, UL, PSE, CCC, GCC',
    icon: '🔬',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    description: '국내외 강제 규격 제품시험, 기술문서(TCF) 작성, 공장심사 대응 총괄 대행',
    standards: ['CE_MDR', 'FDA_510K', 'KC_SAFETY', 'UL_CERT', 'PSE_JAPAN']
  },
  {
    id: 'DOMESTIC_MGMT_CERT',
    title: '국내 경영인증 컨설팅',
    subtitle: '연구소, 벤처, 이노비즈, 메인비즈, 녹색인증',
    icon: '🎖️',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'KOITA 기업부설연구소 설립, 벤처기업 확인, 이노비즈 기술평가 인증 총괄',
    standards: ['KOITA_LAB', 'VENTURE_CERT', 'INNOBIZ', 'GREEN_CERT']
  },
  {
    id: 'CORPORATE_LECTURE',
    title: '기업/기관 강의 및 사내교육',
    subtitle: '1~3시간 단위 실무 특강 및 심사원 양성',
    icon: '🎓',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'ISO 내부심사원 양성 교육, 중대재해처벌법 대응 안전교육, 품질실무 특강',
    standards: ['INTERNAL_AUDITOR_TRAINING', 'SAFETY_LEGAL_EDU', 'QUALITY_MGMT_LECTURE']
  },
  {
    id: 'GOV_EVALUATION',
    title: '정부/지자체 과제 선정평가위 참여',
    subtitle: 'R&D 사업계획서 심사 및 기술지도',
    icon: '⚖️',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    description: '중소벤처기업부, 산자부 R&D 국책과제 기술성·사업성 평가 및 현장 기술지도',
    standards: ['RND_GOV_EVAL', 'TECH_ROADMAP', 'COMMERCIALIZATION']
  }
];

// 심사 및 프로젝트 진행 5대 라이프사이클 단계
export const AUDIT_STAGES = [
  { step: 1, id: 'STAGE_1_DIAGNOSIS', name: '1단계: 서류진단 & GAP 분석', desc: '기존 사내 규정 검토 및 필수 규격 누락 항목 식별', color: 'text-blue-600 bg-blue-50' },
  { step: 2, id: 'STAGE_2_DOCUMENTATION', name: '2단계: 필수 문서 수립 & 보완', desc: '매뉴얼, 절차서, 지침서, 점검표 4계층 표준 문서 작성', color: 'text-indigo-600 bg-indigo-50' },
  { step: 3, id: 'STAGE_3_INTERNAL_AUDIT', name: '3단계: 내부심사 & 경영검토', desc: '자체 내부품질심사 수행 및 최고경영자 경영검토 의결', color: 'text-amber-600 bg-amber-50' },
  { step: 4, id: 'STAGE_4_ONSITE_AUDIT', name: '4단계: 현장 본심사 수검', desc: '인증기관 심사원 현장 실사 대응 및 관찰/지적사항 확인', color: 'text-rose-600 bg-rose-50' },
  { step: 5, id: 'STAGE_5_CERTIFICATION', name: '5단계: 시정조치 & 인증서 발급', desc: '심사 지적사항(CAR) 100% 종결 및 정식 공인 인증서 수령', color: 'text-emerald-600 bg-emerald-50' },
];

export const INITIAL_AUDIT_PROJECTS = [
  {
    id: 'proj-1',
    companyId: 'comp-1',
    clientName: '(주)아이소에듀',
    bizNumber: '120-88-29401',
    ceo: '홍길동',
    employeeCount: '18명 (5~20인 소기업)',
    industry: '에듀테크 및 클라우드 SaaS 교육 솔루션',
    address: '서울특별시 강남구 테헤란로 427, 14층',
    activityDomainId: 'ISO_AUDIT',
    activityDomainTitle: 'ISO 경영시스템 심사',
    auditStandard: 'ISO_9001',
    auditStandardName: 'ISO 9001:2015 품질경영시스템',
    auditType: '정기 사후관리심사 (Surveillance Audit)',
    leadAuditor: '홍준호 수석심사원',
    targetAuditDate: '2025-06-15',
    dDay: 26,
    currentStage: 3, // 3단계 내부심사 & 경영검토 진행중
    readinessScore: 87.5,
    docCount: 16,
    status: 'ACTIVE',
    storageQuota: '50 GB',
    notes: '사후심사 D-26일 임박. 내부품질심사 보고서 및 경영검토 회의록 대표이사 승인 대기 중.'
  },
  {
    id: 'proj-2',
    companyId: 'comp-2',
    clientName: '에듀캠퍼스(주)',
    bizNumber: '214-87-19382',
    ceo: '이민정',
    employeeCount: '12명 (5~20인 소기업)',
    industry: '기업 직무 교육 및 HR 컨설팅',
    address: '경기도 성남시 분당구 판교역로 166',
    activityDomainId: 'ISO_AUDIT',
    activityDomainTitle: 'ISO 경영시스템 심사',
    auditStandard: 'ISO_14001',
    auditStandardName: 'ISO 14001:2015 환경경영시스템',
    auditType: '정기 사후관리심사',
    leadAuditor: '김철수 선임심사원',
    targetAuditDate: '2025-06-20',
    dDay: 31,
    currentStage: 2, // 2단계 필수 문서 수립 진행중
    readinessScore: 66.7,
    docCount: 8,
    status: 'ACTIVE',
    storageQuota: '30 GB',
    notes: '폐기물 보관 기준 및 환경영향평가표 개정 작업 진행 중.'
  },
  {
    id: 'proj-3',
    companyId: 'comp-3',
    clientName: '스마트러닝 솔루션즈',
    bizNumber: '119-86-55201',
    ceo: '박상현',
    employeeCount: '8명 (5~20인 스타트업)',
    industry: 'AI 기반 온라인 코딩 교육 플랫폼',
    address: '서울특별시 마포구 마포대로 122',
    activityDomainId: 'SME_CONSULTING',
    activityDomainTitle: '중소기업 컨설팅 (5~20인 대상)',
    auditStandard: 'ISO_27001',
    auditStandardName: 'ISO 27001:2022 정보보안경영시스템',
    auditType: '최초 인증심사 (1·2단계)',
    leadAuditor: '최정보 보안전문위원',
    targetAuditDate: '2025-07-15',
    dDay: 56,
    currentStage: 1, // 1단계 서류진단 진행중
    readinessScore: 40.0,
    docCount: 5,
    status: 'ACTIVE',
    storageQuota: '50 GB',
    notes: '정보보호 정책서 및 적용성보고서(SoA) 초안 수립 단계.'
  },
  {
    id: 'proj-4',
    companyId: 'comp-bio',
    clientName: '(주)메디바이오텍',
    bizNumber: '135-81-99201',
    ceo: '정승호',
    employeeCount: '15명 (5~20인 중소기업)',
    industry: '체외진단 의료기기 및 검사 시약 제조',
    address: '인천광역시 연수구 송도미래로 30',
    activityDomainId: 'PRODUCT_CERT',
    activityDomainTitle: '제품 인증 컨설팅 / 총괄대행',
    auditStandard: 'ISO_13485',
    auditStandardName: 'ISO 13485 + CE MDR 의료기기 인증',
    auditType: '유럽 CE 기술문서(TCF) 총괄대행 심사',
    leadAuditor: '홍준호 수석심사원',
    targetAuditDate: '2025-08-10',
    dDay: 82,
    currentStage: 2,
    readinessScore: 50.0,
    docCount: 7,
    status: 'ACTIVE',
    storageQuota: '100 GB',
    notes: 'CE MDR 임상평가보고서(CER) 및 위험관리(ISO 14971) 문서화 진행 중.'
  }
];

const PROJECTS_STORAGE_KEY = 'isoedu_audit_projects_v1';

export function getStoredProjects() {
  if (typeof window === 'undefined') return INITIAL_AUDIT_PROJECTS;
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_PROJECTS));
      return INITIAL_AUDIT_PROJECTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load projects from storage:', e);
    return INITIAL_AUDIT_PROJECTS;
  }
}

export function saveStoredProjects(projects) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to storage:', e);
  }
}
