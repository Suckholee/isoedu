// ========================================================
// ISOEdu & Certification Radar - Initial & Scenario Data
// ========================================================

export const INITIAL_COMPANIES = [
  { id: 'comp-1', name: '(주)하이테크정밀', industry: '제조업 (정밀가공/금속)', businessNumber: '124-81-99201' },
  { id: 'comp-2', name: '넥스트클라우드(주)', industry: 'IT/SaaS (클라우드 솔루션)', businessNumber: '211-86-34012' },
  { id: 'comp-3', name: '바른푸드랩(주)', industry: '식품 가공 및 유통', businessNumber: '315-88-12903' },
];

export const CERTIFICATION_CATEGORIES = [
  { code: 'ALL', name: '전체 규격' },
  { code: 'ISO_9001', name: 'ISO 9001 (품질경영)' },
  { code: 'ISO_14001', name: 'ISO 14001 (환경경영)' },
  { code: 'ISO_27001', name: 'ISO 27001 (정보보안)' },
  { code: 'VENTURE', name: '벤처기업인증' },
  { code: 'INNOBIZ', name: '이노비즈(기술혁신)' },
  { code: 'HACCP', name: '스마트 HACCP' },
];

export const HIERARCHY_LEVELS = [
  { id: 'ALL', name: '전체 문서 계층', desc: '모든 인증 문서' },
  { id: 'CERT', name: '0. 인증서 원본', desc: '정식 인가/인증서 (만기 D-Day 관리)' },
  { id: 'LEVEL_1', name: '1계층: 매뉴얼 (Manual)', desc: '경영방침 및 최고 경영진 의지' },
  { id: 'LEVEL_2', name: '2계층: 절차서 (SOP)', desc: '업무 프로세스 표준 절차서' },
  { id: 'LEVEL_3', name: '3계층: 지침서 (Work Instruction)', desc: '세부 실무 및 현장 작업 지침' },
  { id: 'LEVEL_4', name: '4계층: 기록/양식 (Forms & Records)', desc: '심사 증빙 및 점검 기록 양식' },
];

// 기본 시드 문서 데이터
export const SEED_DOCUMENTS = [
  // 0. 인증서 원본
  {
    id: 'doc-001',
    companyId: 'comp-1',
    certificationCode: 'ISO_9001',
    hierarchyLevel: 'CERT',
    clauseNumber: '공식인증',
    code: 'CERT-ISO9001-2024',
    title: 'ISO 9001:2015 품질경영시스템 인증서',
    status: 'EXPIRING', // 갱신임박
    expiryDate: '2026-10-15',
    dDay: 37,
    penaltyRisk: '만기 시 조달청 다수공급자계약(MAS) 가점 박탈 및 현대/기아차 1차 협력사 벤더 등록 취소 위험',
    summary: '품질경영시스템 국제표준 규격 인증서 (발급기관: KSA 한국표준협회)',
    checklist: [
      { text: '인증서 원본 스캔본 등록 확인', done: true },
      { text: '인증 유효기간(3년) 확인', done: true },
      { text: '차기 사후심사(1년 주기) 일정 사전 조율', done: false },
    ],
    contentDraft: `[ISO 9001:2015 인증서 메타데이터]\n- 인증등록번호: QMS-2023-8891\n- 최초인증일: 2023-10-16\n- 만기일: 2026-10-15\n- 인증범위: 정밀 금속 부품의 설계, 개발 및 가공 제조\n- 심사기관: 한국표준협회(KSA)\n* 사후관리 심사 예정: 만기 30일 전 갱신 신청 필수.`
  },
  {
    id: 'doc-002',
    companyId: 'comp-1',
    certificationCode: 'VENTURE',
    hierarchyLevel: 'CERT',
    clauseNumber: '법정확인서',
    code: 'CERT-VENT-2024',
    title: '벤처기업확인서 (혁신성장유형)',
    status: 'READY',
    expiryDate: '2027-04-30',
    dDay: 234,
    penaltyRisk: '만기 시 법인세/소득세 50% 감면 혜택 즉시 소멸 및 신용보증기금 우대보증 중단',
    summary: '벤처기업육성에 관한 특별조치법 제25조에 따른 혁신성장형 벤처기업 인증',
    checklist: [
      { text: '벤처확인기관 평가보고서 보관', done: true },
      { text: '연구개발비 투자 비율 증빙 구비', done: true },
      { text: '특허 기술 가치평가서 연계', done: true },
    ],
    contentDraft: `[벤처기업 확인서]\n- 확인번호: 2024-0412-0091\n- 유형: 혁신성장유형\n- 유효기간: 2024-05-01 ~ 2027-04-30\n- 세제혜택: 창업 3년 이내 취득 시 취득세 75% 감면, 법인세 5년 50% 감면 대상.`
  },

  // 1계층: 매뉴얼
  {
    id: 'doc-003',
    companyId: 'comp-1',
    certificationCode: 'ISO_9001',
    hierarchyLevel: 'LEVEL_1',
    clauseNumber: 'Clause 4~10',
    code: 'QM-01',
    title: '품질경영 매뉴얼 (Quality Manual)',
    status: 'READY',
    expiryDate: '2026-12-31',
    dDay: 114,
    penaltyRisk: '심사 시 매뉴얼 미비 또는 최신화 누락 시 중부적합(Major Non-conformity) 판정으로 인증 취소',
    summary: '조직의 상황, 리더십, 품질방침, 기획, 지원, 운용, 성과평가 및 개선을 총괄하는 최상위 규정',
    checklist: [
      { text: '최고경영자 품질방침 서명 및 공표', done: true },
      { text: '이해관계자 요구사항 파악표 반영', done: true },
      { text: '품질목표 및 KPI 수립 완료', done: true },
    ],
    contentDraft: `# 제1장 조직의 상황 및 품질방침\n1.1 목적: 본 매뉴얼은 (주)하이테크정밀의 품질경영시스템을 구축하고 고객만족과 지속적 개선을 보장함을 목적으로 한다.\n1.2 품질방침: "불량률 0.01% 도전, 정밀 공정 혁신을 통한 고객 신뢰 100% 달성"\n1.3 적용범위: 본사 및 정밀가공 제1공장 전 공정.`
  },

  // 2계층: 절차서
  {
    id: 'doc-004',
    companyId: 'comp-1',
    certificationCode: 'ISO_9001',
    hierarchyLevel: 'LEVEL_2',
    clauseNumber: 'Clause 7.5',
    code: 'QP-01',
    title: '문서 및 기록관리 절차서 (Document Control SOP)',
    status: 'READY',
    expiryDate: '2026-12-31',
    dDay: 114,
    penaltyRisk: '버전 관리 실패로 인한 구버전 도면/절차서 현장 적용 시 불량 발생 및 심사 부적합',
    summary: '사내 표준 문서의 제정, 개정, 승인, 배포, 보관 및 폐기 절차를 규정한 핵심 운영 규정',
    checklist: [
      { text: '문서 제/개정 승인권자 위임 전결표 작성', done: true },
      { text: '최신본 관리대장 현행화', done: true },
      { text: '사외 문서(KS규격, 고객 도면) 관리 규정 포함', done: false },
    ],
    contentDraft: `# 문서 및 기록관리 절차서 (QP-01)\n1. 적용 범위: 회사의 모든 품질경영시스템 관련 사내 표준 및 외부 출처 문서.\n2. 책임과 권한:\n - 대표이사: 품질매뉴얼 승인\n - 품질책임자: 절차서 및 지침서 심사/승인\n3. 개정 관리: 개정 번호는 Rev.00부터 부여하며, 개정 사유와 이력을 개정이력표에 기록한다.`
  },
  {
    id: 'doc-005',
    companyId: 'comp-1',
    certificationCode: 'ISO_9001',
    hierarchyLevel: 'LEVEL_2',
    clauseNumber: 'Clause 9.2',
    code: 'QP-05',
    title: '내부 품질심사 절차서 (Internal Audit SOP)',
    status: 'ACTION_NEEDED', // 조치필요
    expiryDate: '2026-10-01',
    dDay: 23,
    penaltyRisk: '연 1회 이상 내부심사 미실시 시 사후/갱신 심사 통과 불가 (심사 거절 사유)',
    summary: '연간 내부심사 계획 수립, 심사원 자격 부여, 심사 수행 및 시정조치 추적 프로세스',
    checklist: [
      { text: '내부심사원 자격 인정 기준 및 교육 이수증', done: false },
      { text: '2026년도 상반기 내부심사 계획서 승인', done: true },
      { text: '부서별 심사 체크리스트 작성', done: false },
    ],
    contentDraft: `# 내부심사 절차서 (QP-05)\n1. 목적: 당사 품질경영시스템이 계획된 사양 및 ISO 9001 요구사항에 적합하게 실행되는지 독립적으로 검증.\n2. 심사원의 독립성: 심사원은 자신의 직무에 대해 심사를 수행할 수 없다(객관성 보장).\n3. 시정조치: 부적합 발견 시 30일 이내에 원인분석 및 시정조치 완료 보고서를 제출해야 한다.`
  },

  // 3계층: 지침서
  {
    id: 'doc-006',
    companyId: 'comp-1',
    certificationCode: 'ISO_9001',
    hierarchyLevel: 'LEVEL_3',
    clauseNumber: 'Clause 8.6',
    code: 'WI-QC-02',
    title: '완제품 최종검사 및 출하 지침서',
    status: 'READY',
    expiryDate: '2027-01-15',
    dDay: 129,
    penaltyRisk: '출하 검사 성적서 미비 시 고객사 클레임 발생 및 납품 정지',
    summary: '생산 완료 제품의 치수, 외관, 경도 검사 기준과 합격 판정 기준을 규정',
    checklist: [
      { text: '측정기기(버니어캘리퍼스, 3차원측정기) 검교정 성적서 유효성 확인', done: true },
      { text: 'AQL 샘플링 검사 기준표 비치', done: true },
    ],
    contentDraft: `# 완제품 출하검사 지침서 (WI-QC-02)\n1. 검사항목: 외관 스크래치, 치수 공차(±0.005mm), 조도 표면 검사.\n2. 판정 기준: 불량 발견 시 즉시 Lot 전량 격리 후 불합격 스티커 부착.`
  },

  // 4계층: 기록 및 양식
  {
    id: 'doc-007',
    companyId: 'comp-1',
    certificationCode: 'ISO_9001',
    hierarchyLevel: 'LEVEL_4',
    clauseNumber: 'Clause 9.3',
    code: 'FORM-MR-01',
    title: '경영검토 보고서 (Management Review Record)',
    status: 'DRAFT', // 작성중
    expiryDate: '2026-11-20',
    dDay: 73,
    penaltyRisk: '최고경영자 경영검토 누락 시 ISO 사후심사 즉시 불합격',
    summary: '연간 품질 목표 달성도, 고객 클레임 현황, 리스크 평가 결과를 대표이사에게 보고한 공식 기록',
    checklist: [
      { text: '전년도 시정조치 이행 결과 취합', done: true },
      { text: '고객만족도 설문조사 결과 요약', done: false },
      { text: '차년도 예산 및 인원 배정 계획 수립', done: false },
    ],
    contentDraft: `# 2026년도 제1회 정기 경영검토 보고서\n- 일시: 2026년 11월 15일 (예정)\n- 참석자: 대표이사, 연구소장, 품질부서장, 생산부서장\n- 검토 안건: 품질방침 달성률, 스마트공장 2단계 도입 검토.`
  }
];

// 시연 및 강의용 4대 즉시 실행 시나리오 프리셋
export const DEMO_SCENARIOS = [
  {
    id: 'scenario-1',
    tag: '제조업 / 공공조달',
    title: '제조업 3년 차, 조달청 MAS 및 공공입찰 대비 ISO 9001/14001',
    prompt: '정밀 금속가공 제조업 3년 차 기업입니다. 하반기 조달청 다수공급자계약(MAS) 등록과 현대차 1차 벤더 협력사 등록을 위해 ISO 9001과 ISO 14001 인증을 급하게 준비해야 합니다. 어떤 문서 체계가 필수적으로 필요하고 즉시 구성할 수 있나요?',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    responseAnalysis: `**[기업 현황 진단]**
- **대상 업종:** 정밀가공/기계 제조업 (업력 3년 차)
- **주요 목적:** 조달청 나라장터 MAS 가점 확보, 대기업 협력사 등록 요건 충족
- **필요 규격:** **ISO 9001 (품질)** 및 **ISO 14001 (환경)** 복합 인증 체계

**[진단 결과 및 전략]**
공공입찰 심사관 및 벤더 등록 평가위원은 단순 인증서뿐만 아니라 **'문서 및 기록관리(7.5)', '부적합품 관리(8.7)', '설비 보전 및 검교정(7.1.5)'** 관련 실질 절차서와 최근 3개월간의 가동 기록 증빙을 가장 엄격하게 검증합니다.

지금 바로 적용 가능한 **[제조업 특화 ISO 9001/14001 필수 8종 패키지]**를 구성했습니다.`,
    recommendedDocs: [
      {
        companyId: 'comp-1',
        certificationCode: 'ISO_9001',
        hierarchyLevel: 'LEVEL_1',
        clauseNumber: 'Clause 4~10',
        code: 'QM-MFG-01',
        title: '정밀제조 품질경영 매뉴얼 (통합형)',
        status: 'READY',
        expiryDate: '2027-09-30',
        dDay: 387,
        penaltyRisk: '매뉴얼 누락 시 조달청 PQ 적격심사 품질경영 부문 감점 (1.5점 감점)',
        summary: '제조업 맞춤형 10대 조항 총괄 품질 매뉴얼 (설비관리 및 작업표준 포함)',
        checklist: [
          { text: '품질경영 방침 수립 및 서명', done: true },
          { text: '조직도 및 직무권한표 개정', done: true },
        ],
        contentDraft: `# 정밀제조 품질경영 매뉴얼\n본 매뉴얼은 부품 가공의 정밀성과 친환경 공정 준수를 기본으로 조달청 품질 기준을 100% 충족하도록 작성됨.`
      },
      {
        companyId: 'comp-1',
        certificationCode: 'ISO_9001',
        hierarchyLevel: 'LEVEL_2',
        clauseNumber: 'Clause 8.5.1',
        code: 'QP-MFG-02',
        title: '제조공정 관리 및 설비예방보전 절차서',
        status: 'READY',
        expiryDate: '2027-09-30',
        dDay: 387,
        penaltyRisk: '설비 점검 이력 미비 시 제조물배상책임(PL) 분쟁 및 조달 하자보수 제재',
        summary: 'CNC 선반, 머시닝센터 등 주요 생산설비의 일일/월간 점검 및 공정 모니터링 절차',
        checklist: [
          { text: '주요 설비 이력카드 작성', done: true },
          { text: '예방보전 점검 주기표 설정', done: true },
        ],
        contentDraft: `# 제조공정 관리 절차서\n설비 고장으로 인한 납기 지연 방지를 위해 매월 1회 정기 분해점검을 의무화한다.`
      },
      {
        companyId: 'comp-1',
        certificationCode: 'ISO_9001',
        hierarchyLevel: 'LEVEL_2',
        clauseNumber: 'Clause 8.7',
        code: 'QP-MFG-04',
        title: '부적합품 식별 및 격리/폐기 절차서',
        status: 'READY',
        expiryDate: '2027-09-30',
        dDay: 387,
        penaltyRisk: '불량품 혼입 출하 시 조달청 부정당업자 지정 및 6개월간 입찰 참가 자격 제한',
        summary: '가공 불량 발생 시 붉은색 식별표 부착 및 불합격 보관장 격리 절차',
        checklist: [
          { text: '부적합품 적치장소 펜스 및 표지판 설치', done: true },
          { text: '폐기 승인 전결 규정 마련', done: true },
        ],
        contentDraft: `# 부적합품 관리 절차서\n가공 공차 초과 제품은 즉시 '부적합 식별표'를 부착하고 24시간 이내에 격리장소로 이동한다.`
      },
      {
        companyId: 'comp-1',
        certificationCode: 'ISO_14001',
        hierarchyLevel: 'LEVEL_2',
        clauseNumber: 'Clause 6.1.2',
        code: 'EP-ENV-01',
        title: '환경측면 파악 및 유해물질 관리 절차서',
        status: 'READY',
        expiryDate: '2027-09-30',
        dDay: 387,
        penaltyRisk: '절삭유/지정폐기물 무단 배출 적발 시 최대 5년 이하 징역 또는 5천만원 이하 벌금',
        summary: '금속가공 절삭유, 세척용제, 칩 폐기물 배출 관리 및 환경영향 평가 기준',
        checklist: [
          { text: 'MSDS(물질안전보건자료) 현장 비치', done: true },
          { text: '지정폐기물 위탁처리 계약서 연계', done: true },
        ],
        contentDraft: `# 환경측면 파악 절차서\n폐유 및 금속칩은 환경부 허가 위탁업체를 통해 100% 인계하며 '올바로 시스템'에 등록한다.`
      },
      {
        companyId: 'comp-1',
        certificationCode: 'ISO_9001',
        hierarchyLevel: 'LEVEL_4',
        clauseNumber: 'Clause 7.1.5',
        code: 'FORM-CAL-01',
        title: '계측기/측정장비 검교정 관리대장',
        status: 'READY',
        expiryDate: '2027-03-31',
        dDay: 204,
        penaltyRisk: '검교정 만료 계측기 사용 적발 시 심사 즉시 불합격 및 성적서 무효 처리',
        summary: '버니어캘리퍼스, 마이크로미터, 하이트게이지 등 국가공인 검교정 주기 관리 양식',
        checklist: [
          { text: '한국인정기구(KOLAS) 성적서 번호 기재', done: true },
          { text: '차기 교정 만기일 라벨 부착', done: true },
        ],
        contentDraft: `# 계측기 관리대장 양식\n기기명, 일련번호, 관리번호, 교정일자, 차기교정일, 교정기관, 판정결과 기록.`
      }
    ]
  },
  {
    id: 'scenario-2',
    tag: 'IT/SaaS / 보안·투자',
    title: '클라우드 SaaS 기업, 투자 유치 및 데이터 보안을 위한 벤처인증 + ISO 27001',
    prompt: '저희는 B2B 엔터프라이즈 SaaS 소프트웨어를 개발하는 2년 차 스타트업입니다. 시리즈 A 투자 유치 및 금융권 고객사 납품을 위해 벤처기업인증(혁신성장형)과 ISO 27001(정보보호경영) 인증이 시급합니다. 어떤 서류들이 필요한가요?',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    responseAnalysis: `**[기업 현황 진단]**
- **대상 업종:** B2B SaaS / 클라우드 소프트웨어 (업력 2년 차)
- **주요 목적:** 시리즈 A 투자사 실사(DD), 금융/대기업 고객사 보안 평가 통과
- **필요 규격:** **벤처기업인증 (혁신성장형)** 및 **ISO/IEC 27001 (정보보호)**

**[진단 결과 및 전략]**
SaaS 기업의 경우 벤처인증에서는 **'기술보증기금/전문기관 평가 지표(특허 보유, R&D 역량)'**가 핵심이며, ISO 27001에서는 **'클라우드 접근제어(A.9)', '개인정보 암호화(A.10)', '침해사고 대응 절차(A.16)'**가 필수 검증 대상입니다.

투자 실사 및 보안 감사에 즉시 제출할 수 있는 **[SaaS/IT 특화 필수 5종 세트]**를 준비했습니다.`,
    recommendedDocs: [
      {
        companyId: 'comp-2',
        certificationCode: 'ISO_27001',
        hierarchyLevel: 'LEVEL_1',
        clauseNumber: 'Clause 4~10',
        code: 'ISMS-M-01',
        title: '클라우드 정보보호경영 매뉴얼 (ISO 27001:2022)',
        status: 'READY',
        expiryDate: '2027-10-31',
        dDay: 418,
        penaltyRisk: '금융권 납품 시 보안 감사 미달로 계약 파기 및 위약금 발생',
        summary: 'AWS/GCP 클라우드 인프라 기반 SaaS 서비스 정보보호 최고방침 및 ISMS 운영규정',
        checklist: [
          { text: '정보보호 최고책임자(CISO) 지정 공고', done: true },
          { text: '정보자산 식별 및 위험평가 보고서 수립', done: true },
        ],
        contentDraft: `# 정보보호경영 매뉴얼\n본 매뉴얼은 클라우드 고객 데이터의 기밀성, 무결성, 가용성을 보장하기 위한 보안 규정이다.`
      },
      {
        companyId: 'comp-2',
        certificationCode: 'ISO_27001',
        hierarchyLevel: 'LEVEL_2',
        clauseNumber: 'Annex A.8.2',
        code: 'ISMS-P-03',
        title: '클라우드 접근통제 및 권한관리 절차서',
        status: 'READY',
        expiryDate: '2027-10-31',
        dDay: 418,
        penaltyRisk: '개인정보 유출 사고 시 최대 매출액의 3% 이하 과징금 (개인정보보호법 제64조의2)',
        summary: 'IAM 계정 최소권한 부여, 2단계 인증(MFA) 의무화, 퇴사자 권한 즉시 회수 절차',
        checklist: [
          { text: '전사 임직원 관리자 콘솔 MFA 활성화', done: true },
          { text: '분기별 권한 재검토 기록 보관', done: true },
        ],
        contentDraft: `# 접근통제 절차서\n모든 운영 서버 접속은 VPN과 Bastion Host를 경유해야 하며, 루트 계정의 직접 사용은 엄격히 금지된다.`
      },
      {
        companyId: 'comp-2',
        certificationCode: 'ISO_27001',
        hierarchyLevel: 'LEVEL_2',
        clauseNumber: 'Annex A.5.24',
        code: 'ISMS-P-08',
        title: '보안 침해사고 대응 및 비상복구 절차서',
        status: 'READY',
        expiryDate: '2027-10-31',
        dDay: 418,
        penaltyRisk: '침해사고 미신고 시 과태료 3천만원 및 투자 계약상 중대 귀책사유',
        summary: 'DDoS, 데이터 유출, 랜섬웨어 감염 시 단계별 에스컬레이션 및 KISA 신고 프로세스',
        checklist: [
          { text: '비상연락망 및 CISO 직통 보고 라인 구축', done: true },
          { text: '모의 해킹 및 재해복구(DR) 연 1회 훈련', done: true },
        ],
        contentDraft: `# 보안 사고 대응 절차서\n사고 인지 즉시 2시간 이내 비상대응팀을 소집하고 24시간 이내 KISA 및 수사기관에 통보한다.`
      },
      {
        companyId: 'comp-2',
        certificationCode: 'VENTURE',
        hierarchyLevel: 'LEVEL_2',
        clauseNumber: '기술혁신성',
        code: 'VENT-SOP-01',
        title: '연구개발(R&D) 활동 및 지식재산권 관리 절차서',
        status: 'READY',
        expiryDate: '2027-08-31',
        dDay: 357,
        penaltyRisk: '연구개발비 비율 5% 미달 시 벤처기업 확인 거절 및 정부 R&D 가점 취소',
        summary: '연구전담부서 운영 규정, 특허 출원 로드맵, 소스코드 버전 및 연구노트 관리 기준',
        checklist: [
          { text: '연구노트 전자서명 시스템 도입', done: true },
          { text: '핵심 BM 특허 출원 증빙 첨부', done: true },
        ],
        contentDraft: `# R&D 관리 절차서\n소프트웨어 아키텍처 변경 및 신규 기능 개발 시 연구노트를 주간 단위로 업데이트한다.`
      }
    ]
  },
  {
    id: 'scenario-3',
    tag: '식품/바이오 / 위생·안전',
    title: '식품 제조가공 기업, 대형마트 납품을 위한 스마트 HACCP 및 ISO 22000',
    prompt: '가공식품(밀키트 및 소스류)을 제조하는 기업입니다. 이번에 컬리와 이마트 납품 심사가 잡혀있는데, 스마트 HACCP 및 ISO 22000(식품안전) 인증 문서 세트가 시급합니다. 어떤 서류들이 우선 구비되어야 하나요?',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    responseAnalysis: `**[기업 현황 진단]**
- **대상 업종:** 식품 제조가공 및 소스류 HMR
- **주요 목적:** 대형 유통채널(이마트, 마켓컬리) 벤더 입점 심사 통과
- **필요 규격:** **스마트 HACCP (중요관리점 자동화)** 및 **ISO 22000 (식품안전경영시스템)**

**[진단 결과 및 전략]**
유통사 식품안전 점검관은 **'가열 살균 공정 CCP 일지 자동 기록', '원료 입고 검사 및 알레르기 유발물질 교차오염 방지', '제품 회수(Recall) 모의훈련 기록'**을 1순위로 불시 점검합니다. 누락 시 입점 취소는 물론 식약처 행정처분을 받게 됩니다.

위해요소 중점관리를 위한 **[식품안전 HACCP & ISO 22000 필수 5종 패키지]**를 구성했습니다.`,
    recommendedDocs: [
      {
        companyId: 'comp-3',
        certificationCode: 'HACCP',
        hierarchyLevel: 'LEVEL_1',
        clauseNumber: '위해요소중점관리',
        code: 'HACCP-M-01',
        title: 'HACCP 관리기준서 (선행요건 및 관리계획)',
        status: 'READY',
        expiryDate: '2027-06-30',
        dDay: 295,
        penaltyRisk: 'HACCP 기준 미준수 시 영업정지 15일 및 과징금 부과 (식품위생법 제48조)',
        summary: '작업장 위생관리, 시설설비 유지, 용수 관리, 검사 관리 등 선행요건 및 CCP 계획 총괄',
        checklist: [
          { text: '중요관리점(CCP-1B, CCP-2P) 결정표 확정', done: true },
          { text: '한계기준(Critical Limit) 과학적 근거 자료 구비', done: true },
        ],
        contentDraft: `# HACCP 관리기준서\n소스류 살균공정의 한계기준은 '95℃ 이상, 15분간 유지'로 설정하며 IoT 센서로 실시간 전송한다.`
      },
      {
        companyId: 'comp-3',
        certificationCode: 'HACCP',
        hierarchyLevel: 'LEVEL_2',
        clauseNumber: 'CCP 모니터링',
        code: 'HACCP-P-02',
        title: '스마트 살균 공정 한계기준 모니터링 절차서',
        status: 'READY',
        expiryDate: '2027-06-30',
        dDay: 295,
        penaltyRisk: '살균온도 미달 제품 유통 시 식중독 발생 및 전량 강제 회수·폐기 처분',
        summary: '가열 살균기 디지털 온도 센서 자동 로깅 및 한계기준 이탈 시 자동 알람·라인 정지 절차',
        checklist: [
          { text: '온도 센서 월간 표준온도계 비교 검교정', done: true },
          { text: '온도 이탈 시 자동 밸브 차단 인터록 테스트', done: true },
        ],
        contentDraft: `# 살균공정 모니터링 절차서\n온도가 93℃ 이하로 하강 시 경보음이 울리며 공압 밸브가 작동하여 제품 이송을 즉시 중단한다.`
      },
      {
        companyId: 'comp-3',
        certificationCode: 'HACCP',
        hierarchyLevel: 'LEVEL_4',
        clauseNumber: '추적성 관리',
        code: 'FORM-REC-03',
        title: '부적합 식품 긴급 회수(Recall) 모의훈련 보고서',
        status: 'READY',
        expiryDate: '2026-11-30',
        dDay: 83,
        penaltyRisk: '연 1회 회수 모의훈련 미실시 시 HACCP 인증 취소',
        summary: '불량 제품 100박스 출하 가상 시나리오에 따른 4시간 이내 회수율 98% 달성 모의훈련 기록',
        checklist: [
          { text: '거래처 연락망 현행화 확인', done: true },
          { text: 'Lot별 재고 추적 시뮬레이션 완료', done: true },
        ],
        contentDraft: `# 리콜 모의훈련 보고서\n훈련일자: 2026년 8월 20일 / 가상 사고: 금속검출기 오작동으로 인한 이물 혼입 의심 / 결과: 3시간 20분 내 전량 추적 성공.`
      }
    ]
  },
  {
    id: 'scenario-4',
    tag: '만기 점검 / 리스크 진단',
    title: '보유 중인 벤처기업 및 ISO 9001 만기 갱신 누락 리스크 사전 진단',
    prompt: '현재 보유하고 있는 벤처기업 확인서와 ISO 9001 인증서의 만기 일자가 얼마 남지 않았습니다. 만약 갱신 시기를 놓쳤을 때 발생하는 법적 과태료, 정부지원사업 제재, 대출 이자 불이익을 구체적으로 알려주시고 갱신 절차 문서를 불러와주세요.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    responseAnalysis: `**[만기 누락 리스크 정밀 진단]**
인증서 만기 누락은 단순한 행정 서류 지연이 아니라 **치명적인 재무적·영업적 타격**으로 이어집니다.

1. **벤처기업인증 만기 누락 시:**
   - 💸 **세제 혜택 즉시 중단:** 법인세/소득세 50% 감면 소멸, 취득세 중과세 추징 리스크.
   - 🏦 **금융권 대출 가산금리:** 신용보증기금/기보 우대보증료율(0.2% 감면) 해지 및 금리 상승.
   - 📜 **정부과제 탈락:** 중기부 R&D 및 수출바우처 가점(최대 5점) 소멸로 자동 탈락.

2. **ISO 9001 만기 누락 시:**
   - 🏛 **조달청 MAS 입찰 자격 정지:** 나라장터 쇼핑몰 상품 판매 일시 중지.
   - 📑 **사후심사 거절 시:** '인증 취소' 공시 후 재취득까지 2~3개월간 무인증 상태 지속.

지금 즉시 갱신 절차에 착수할 수 있도록 **[인증 갱신 및 사후심사 전용 절차서 세트]**를 호출합니다.`,
    recommendedDocs: [
      {
        companyId: 'comp-1',
        certificationCode: 'ISO_9001',
        hierarchyLevel: 'LEVEL_2',
        clauseNumber: 'Clause 9.2 & 9.3',
        code: 'QP-REN-01',
        title: 'ISO 인증 갱신 및 사후관리 심사 대응 절차서',
        status: 'EXPIRING',
        expiryDate: '2026-10-15',
        dDay: 37,
        penaltyRisk: '만기 30일 전 갱신 신청 미접수 시 심사 지연으로 인한 인증 효력 정지',
        summary: '만기 D-90일 전 사후심사 기관 신청, 전년도 시정조치 이행 증빙, 수검 준비 체크리스트',
        checklist: [
          { text: '한국표준협회(KSA) 심사 일정 조율', done: false },
          { text: '최근 1개년 내부심사 보고서 편철', done: true },
          { text: '품질경영 성과지표(KPI) 달성 실적 취합', done: false },
        ],
        contentDraft: `# 갱신 심사 대응 절차서\n1. 만기 60일 전 심사 신청서 제출.\n2. 1단계 문서심사 보완사항 14일 이내 조치.\n3. 2단계 현장심사 수검 및 시정조치 완료.`
      },
      {
        companyId: 'comp-1',
        certificationCode: 'VENTURE',
        hierarchyLevel: 'LEVEL_2',
        clauseNumber: '갱신평가',
        code: 'VENT-REN-02',
        title: '벤처기업 확인 갱신 신청 및 지표 점검표',
        status: 'ACTION_NEEDED',
        expiryDate: '2026-11-30',
        dDay: 83,
        penaltyRisk: '만기 경과 시 법인세 50% 감면 즉시 박탈 및 조세특례제한법 추징',
        summary: '벤처확인종합관리시스템(V-On) 갱신 신청 서류 패키지 및 R&D 비율 점검',
        checklist: [
          { text: '최근 결산 재무제표 R&D 비율 5% 검증', done: true },
          { text: '사업계획서(향후 3개년 사업화 로드맵) 갱신', done: false },
          { text: '현장 실사 대비 기술 설명 PPT 준비', done: false },
        ],
        contentDraft: `# 벤처 갱신 점검표\n서류 접수 후 서면평가 및 전문기관 현장실사까지 최소 45일 소요되므로 만기 2개월 전 접수 필수.`
      }
    ]
  }
];
