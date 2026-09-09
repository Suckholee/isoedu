// ========================================================
// ISO Statutory Mandatory Documented Information Master Dataset
// Annex SL (Clause 4 ~ 10) Official Audit Requirements
// ========================================================

export const ISO_STANDARDS_INFO = [
  {
    code: 'ISO_9001',
    name: 'ISO 9001:2015',
    title: '품질경영시스템 (QMS)',
    description: '고객 만족 및 품질 보증을 위한 국제 표준 규격 (공공조달, 대기업 납품 필수)',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'bg-blue-600',
    primaryDepartment: '품질경영팀',
  },
  {
    code: 'ISO_14001',
    name: 'ISO 14001:2015',
    title: '환경경영시스템 (EMS)',
    description: '환경오염 방지, 탄소중립 및 환경법규 준수 체계 (ESG 경영 필수 규격)',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'bg-emerald-600',
    primaryDepartment: '환경안전팀',
  },
  {
    code: 'ISO_45001',
    name: 'ISO 45001:2018',
    title: '안전보건경영시스템 (OH&S)',
    description: '중대재해처벌법 대응 및 산업안전보건 관리 체계 (위험성평가 의무화)',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'bg-amber-600',
    primaryDepartment: '산업안전팀',
  },
  {
    code: 'ISO_27001',
    name: 'ISO 27001:2022',
    title: '정보보안경영시스템 (ISMS)',
    description: '정보자산 보호, 클라우드 보안 및 개인정보 유출 방지 (SaaS/IT 필수)',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    iconColor: 'bg-rose-600',
    primaryDepartment: '정보보안팀',
  },
  {
    code: 'ISO_13485',
    name: 'ISO 13485:2016',
    title: '의료기기 품질경영 (MD-QMS)',
    description: '체외진단 및 의료기기 제조/설계, 유럽 CE MDR/FDA 승인 필수 규격',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    iconColor: 'bg-cyan-600',
    primaryDepartment: '의료기기RA/QA팀',
  },
  {
    code: 'ISO_50001',
    name: 'ISO 50001:2018',
    title: '에너지경영시스템 (EnMS)',
    description: '사업장 에너지 효율화, 온실가스 탄소배출권 및 에너지 소비 절감 체계',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'bg-purple-600',
    primaryDepartment: '시설관리팀',
  },
];

export const ISO_MANDATORY_REQUIREMENTS = [
  // ==========================================
  // 1. ISO 9001:2015 품질경영시스템 필수 구비 문서 (16종)
  // ==========================================
  {
    id: 'REQ-9001-00',
    standard: 'ISO_9001',
    clause: '0.0',
    clauseGroup: '인증서 원본',
    title: 'ISO 9001:2015 정식 인증서 원본',
    level: 'CERT',
    mandatory: true,
    codePattern: 'CERT-9001',
    defaultCode: 'CERT-9001',
    legalAuditReason: '한국인정지원센터(KAB) 공인 인증서 원본. 유효기간(3년) 및 사후심사 주기 검증 필수.',
    penaltyRisk: '만기 경과 시 인증 취소 및 조달청 입찰 가점 즉시 상실',
    defaultTitle: 'ISO 9001:2015 품질경영시스템 인증서 원본',
    summary: '국제표준화기구(ISO) 및 KAB 공인 한국품질재단 발행 정식 인증서',
    templateDraft: `# ISO 9001:2015 품질경영시스템 인증서 (Certificate of Registration)

인증번호: IC-QMS-2024-0012
사업장: (주)아이소에듀 본사 및 R&D 연구소
인증범위: 소프트웨어 개발, 클라우드 교육 솔루션 기획 및 서비스 제공

본 인증서는 상기 조직의 품질경영시스템이 ISO 9001:2015 요구사항에 적합함을 증명함.
- 최초 인증일: 2024년 06월 15일
- 차기 사후심사 예정일: 2025년 06월 15일 (D-26일 임박)
- 인증 만료일: 2027년 06월 14일
인증기관: 한국품질표준원 / KAB Accredited`
  },
  {
    id: 'REQ-9001-01',
    standard: 'ISO_9001',
    clause: '4.3',
    clauseGroup: '4. 조직 상황',
    title: '품질경영시스템 적용범위 및 품질매뉴얼',
    level: 'LEVEL_1',
    mandatory: true,
    codePattern: 'QM-01',
    defaultCode: 'QM-01',
    legalAuditReason: 'ISO 9001 4.3조 필수 요구. 사업장별 조직 상황, 이해관계자 요구 및 적용 제외 조항 명시 필수.',
    penaltyRisk: '미비 시 심사 중대 부적합(Major Non-conformity) 지적',
    defaultTitle: '품질경영시스템 매뉴얼 (Quality Manual)',
    summary: '전사 품질경영체계의 최고위 표준 문서로서 ISO 9001 4~10조의 기본 방침 규정',
    templateDraft: `# QM-01 품질경영시스템 매뉴얼 (Quality Manual)

제1장 총칙
제1조(목적) 본 매뉴얼은 ISO 9001:2015 규격을 충족하는 품질경영시스템을 수립하고 운영함을 목적으로 한다.
제2조(적용범위) 본 매뉴얼은 당사 본사 및 전 사업장의 제품/서비스 기획, 개발 및 운영에 적용한다.

제2장 조직 상황 (Clause 4)
4.1 조직과 그 상황의 이해: 연 1회 SWOT 분석을 실시하여 내외부 이슈를 식별한다.
4.2 이해관계자의 요구와 기대: 고객, 주주, 협력업체 및 규제기관의 요구를 파악하여 반영한다.
4.3 품질경영시스템 적용범위 결정: 소프트웨어 및 온라인 교육 솔루션 설계/개발/운영.`
  },
  {
    id: 'REQ-9001-02',
    standard: 'ISO_9001',
    clause: '5.2',
    clauseGroup: '5. 리더십',
    title: '품질방침 및 최고경영자 의지표명서',
    level: 'LEVEL_1',
    mandatory: true,
    codePattern: 'QP-01',
    defaultCode: 'QP-01',
    legalAuditReason: 'ISO 9001 5.2조 필수 요구. 최고경영자의 품질방침 제정 및 전사 공표 문서화 증빙.',
    penaltyRisk: '방침 미공표 시 리더십 평가 항목 감점',
    defaultTitle: '전사 품질방침 및 경영목표 선언서',
    summary: '최고경영자의 품질경영 비전, 고객 만족 원칙 및 전 임직원 행동 강령 정의',
    templateDraft: `# QP-01 품질방침 선언서

당사는 최고 수준의 에듀테크 솔루션을 제공하기 위해 다음의 품질방침을 수립하고 실천한다.

1. 고객 중심 가치 창출: 고객 요구를 초과 달성하는 무결점 교육 플랫폼 제공
2. 지속적인 프로세스 개선: PDCA 사이클 기반의 프로세스 혁신
3. 법규 및 표준 준수: ISO 9001 및 관련 법령 100% 준수

대표이사 홍길동 (직인)`
  },
  {
    id: 'REQ-9001-03',
    standard: 'ISO_9001',
    clause: '6.1',
    clauseGroup: '6. 기획',
    title: '리스크 및 기회 관리 절차서',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'QMS-P-003',
    defaultCode: 'QMS-P-003',
    legalAuditReason: 'ISO 9001 6.1조 필수 요구. 리스크 기반 사고(Risk-based Thinking) 프로세스 규정 및 리스크 레지스터 보유 필수.',
    penaltyRisk: '리스크 평가 미비 시 6.1조 경부적합 발행',
    defaultTitle: '조직 상황 및 리스크 관리 절차서',
    summary: '사업장 내외부 리스크와 기회를 식별·평가하고 위험도 등급에 따른 비상 대책 수립',
    templateDraft: `# QMS-P-003 조직 상황 및 리스크 관리 절차서

제1조(목적) 경영 목표 달성을 저해하는 잠재적 위험을 사전 식별하고 통제함을 목적으로 한다.
제2조(책임) 각 부서장은 반기별 리스크 식별표를 작성하고 품질경영팀에 제출한다.
제3조(평가 기준) 발생가능성(1~5점)과 영향도(1~5점)를 곱하여 위험도(RPN) 15 이상은 집중 관리한다.`
  },
  {
    id: 'REQ-9001-04',
    standard: 'ISO_9001',
    clause: '6.2',
    clauseGroup: '6. 기획',
    title: '품질목표 및 부서별 달성 추진계획서',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'QMS-P-006',
    defaultCode: 'QMS-P-006',
    legalAuditReason: 'ISO 9001 6.2조 필수 요구. 측정 가능한 정량적 품질목표 및 분기별 진척 모니터링 증빙.',
    penaltyRisk: '측정 불가 목표 설정 시 목표 수립 부적합 지적',
    defaultTitle: '품질목표 수립 및 관리 절차서',
    summary: '전사 및 부서별 정량적 품질목표(KPI) 설정, 모니터링 및 성과 달성 보고 체계',
    templateDraft: `# QMS-P-006 품질목표 관리 절차서

1. 목표 수립 기준: SMART 원칙(구체적, 측정 가능, 달성 가능, 관련성, 기한)
2. 분기별 실적 점검: 매분기 종료 10일 이내 목표 달성률 집계 및 미달 부서 개선 대책 제출.`
  },
  {
    id: 'REQ-9001-05',
    standard: 'ISO_9001',
    clause: '7.1.5',
    clauseGroup: '7. 지원',
    title: '계측기 및 감시·측정 자원 검교정 절차서',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'QMS-P-007',
    defaultCode: 'QMS-P-007',
    legalAuditReason: 'ISO 9001 7.1.5조 필수 요구. 제품/서비스 검증용 측정 장비의 국가공인 검교정 성적서 및 소급성 관리.',
    penaltyRisk: '미교정 장비 사용 시 제품 신뢰성 중대 부적합',
    defaultTitle: '감시 및 측정장비 관리 절차서',
    summary: '사내 시험 및 측정 장비의 등록, 검교정 주기 준수, 식별 및 이상 장비 격리 관리',
    templateDraft: `# QMS-P-007 감시 및 측정장비 관리 절차서

제1조(목적) 품질 검사에 사용하는 계측기의 정밀도와 신뢰성을 보장한다.
제2조(검교정 주기) 국가교정기관 연 1회 정기 검교정을 원칙으로 하며 성적서는 5년간 보관한다.`
  },
  {
    id: 'REQ-9001-06',
    standard: 'ISO_9001',
    clause: '7.2',
    clauseGroup: '7. 지원',
    title: '임직원 교육훈련 및 적격성 관리 지침서',
    level: 'LEVEL_3',
    mandatory: true,
    codePattern: 'IS-I-001',
    defaultCode: 'IS-I-001',
    legalAuditReason: 'ISO 9001 7.2조 필수 요구. 직무별 필요 역량 정의, 연간 교육훈련 계획 및 이수 평가 기록 관리.',
    penaltyRisk: '법정의무교육 미이수 시 1인당 과태료 부과 및 심사 지적',
    defaultTitle: '사내 교육훈련 및 자격부여 지침서',
    summary: '임직원 역량 평가표, 연간 직무 교육 계획 수립, 교육 결과 평가 및 자격 인증서 관리',
    templateDraft: `# IS-I-001 사내 교육훈련 지침서

1. 연간 교육계획: 매년 12월 차년도 교육계획서 수립
2. 필수 이수: 신규 입사자 OJT 40시간 및 품질/정보보안 법정의무교육
3. 유효성 평가: 교육 후 30일 이내 업무 적용도 평가 실시.`
  },
  {
    id: 'REQ-9001-07',
    standard: 'ISO_9001',
    clause: '7.5',
    clauseGroup: '7. 지원',
    title: '문서화된 정보(문서 및 기록) 관리 절차서',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'QMS-P-001',
    defaultCode: 'QMS-P-001',
    legalAuditReason: 'ISO 9001 7.5조 핵심 규정. 사내 표준 문서의 제정, 승인, 개정 이력 추적 및 폐기 통제.',
    penaltyRisk: '최신 개정본 미사용 시 전사 문서관리 체계 무효화',
    defaultTitle: '문서 및 기록관리 규정 절차서',
    summary: '사내 표준 문서의 식별, 작성, 검토, 결재, 개정 이력 관리 및 최소 5년 품질기록 보존 연한 통제',
    templateDraft: `# QMS-P-001 문서 및 기록관리 규정 절차서

제1조(목적) 품질문서의 작성, 승인, 배포 및 기록 보존에 관한 표준을 수립한다.
제2조(문서 번호 체계)
- 1계층 매뉴얼: QM-XX
- 2계층 절차서: QMS-P-XXX
- 3계층 지침서: IS-I-XXX
- 4계층 양식: IS-F-XXX
제3조(보존연한) 모든 품질기록은 최소 5년간 클라우드 드라이브에 보존한다.`
  },
  {
    id: 'REQ-9001-08',
    standard: 'ISO_9001',
    clause: '8.2',
    clauseGroup: '8. 운용',
    title: '고객 요구사항 검토 및 계약관리 절차서',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'QMS-P-008',
    defaultCode: 'QMS-P-008',
    legalAuditReason: 'ISO 9001 8.2.3조 필수 요구. 계약 체결 전 사양, 납기, 법적 요구 충족 가능성 사전 검토 증빙.',
    penaltyRisk: '사전 검토 미비 시 고객 클레임 및 납기 지연 분쟁',
    defaultTitle: '고객 요구사항 검토 및 계약 절차서',
    summary: '견적 제출 및 계약 전 기술적, 운영적 요구사항 타당성 검토 회의 및 고객 변경 요청 관리',
    templateDraft: `# QMS-P-008 고객 요구사항 검토 및 계약 절차서

1. 수주 전 검토: 영업팀과 기술팀이 합동으로 납기, 스펙, 단가 타당성을 검토한다.
2. 계약 변경 관리: 고객사 요청에 의한 사양 변경 시 즉시 품질경영팀과 협의하여 문서화한다.`
  },
  {
    id: 'REQ-9001-09',
    standard: 'ISO_9001',
    clause: '8.4',
    clauseGroup: '8. 운용',
    title: '외부제공자(외주/협력업체) 평가 및 관리 절차서',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'QMS-P-009',
    defaultCode: 'QMS-P-009',
    legalAuditReason: 'ISO 9001 8.4조 필수 요구. 공급자 선정 기준, 정기 품질 평가표 및 적격 공급업체 등록부 유지.',
    penaltyRisk: '무자격 외주업체 사용 시 공급망 품질 부적합',
    defaultTitle: '외부 공급망 및 협력사 평가 관리 절차서',
    summary: '외주 개발사, 자재 공급사의 최초 적격성 평가 및 연 1회 정기 평가(품질/납기/ESG) 체계',
    templateDraft: `# QMS-P-009 외부 공급업체 평가 절차서

1. 공급업체 선정: 품질시스템, 신용등급, 보안인증 보유 여부 종합 심사
2. 정기 재평가: 매년 11월 70점 미만 업체는 개선 시정조치 요구 또는 거래 중단.`
  },
  {
    id: 'REQ-9001-10',
    standard: 'ISO_9001',
    clause: '8.5',
    clauseGroup: '8. 운용',
    title: '표준 개발 및 서비스 운영 관리 지침서',
    level: 'LEVEL_3',
    mandatory: true,
    codePattern: 'IS-I-002',
    defaultCode: 'IS-I-002',
    legalAuditReason: 'ISO 9001 8.5.1조 필수 요구. 서비스 및 제품의 통제된 조건에서의 실행 지침과 검증 기준.',
    penaltyRisk: '작업 표준 부재 시 현장 품질 산포 및 에러 다발',
    defaultTitle: '표준 서비스 개발 및 릴리즈 운영 지침서',
    summary: '개발 환경 통제, 배포 전 품질 테스트 체크리스트, 백업 및 무중단 배포 기준',
    templateDraft: `# IS-I-002 표준 개발 및 서비스 운영 지침서

1. 배포 전 검증: QA 자동화 테스트 95% 이상 패스 및 코드리뷰 완료 필수
2. 모니터링: 서비스 가용률 99.9% 유지 및 장애 발생 시 15분 이내 초동 조치.`
  },
  {
    id: 'REQ-9001-11',
    standard: 'ISO_9001',
    clause: '8.7',
    clauseGroup: '8. 운용',
    title: '부적합 출력(제품/서비스) 관리 절차서',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'QMS-P-010',
    defaultCode: 'QMS-P-010',
    legalAuditReason: 'ISO 9001 8.7조 필수 요구. 불량 및 결함 발생 시 식별, 격리, 반품 또는 특채 승인 절차 규정.',
    penaltyRisk: '불량품 유출 시 고객 클레임 및 배상 책임',
    defaultTitle: '부적합 출력물 식별 및 통제 절차서',
    summary: '공정 결함 발견 시 식별 라벨 부착, 시스템 격리, 재작업 검증 및 폐기 승인 기준',
    templateDraft: `# QMS-P-010 부적합 출력 관리 절차서

1. 부적합 식별: 발견 즉시 '부적합' 태그를 부여하고 정상 공정에서 물리적/논리적 격리
2. 처분 승인: 재작업 또는 폐기 여부는 품질부서장의 최종 승인을 득한다.`
  },
  {
    id: 'REQ-9001-12',
    standard: 'ISO_9001',
    clause: '9.1.2',
    clauseGroup: '9. 성과평가',
    title: '고객 만족도 조사 및 모니터링 지침서',
    level: 'LEVEL_3',
    mandatory: true,
    codePattern: 'IS-I-005',
    defaultCode: 'IS-I-005',
    legalAuditReason: 'ISO 9001 9.1.2조 필수 요구. 고객의 인식(만족도)에 대한 정기적 조사 및 데이터 통계 분석 증빙.',
    penaltyRisk: '만족도 조사 미실시 시 사후심사 지적 빈발',
    defaultTitle: '고객 만족도 조사 및 불만 처리 지침서',
    summary: '반기별 고객 설문 조사 실시, NPS 지표 산출, 불만 VOC 접수 후 24시간 이내 처리 프로세스',
    templateDraft: `# IS-I-005 고객 만족도 조사 지침서

1. 조사 주기: 연 2회 (상반기 6월, 하반기 12월) 전 고객사 대상
2. 목표치: 만족도 점수 85점 이상 유지, 70점 미만 항목은 원인 분석 및 개선 보고서 발행.`
  },
  {
    id: 'REQ-9001-13',
    standard: 'ISO_9001',
    clause: '9.2',
    clauseGroup: '9. 성과평가',
    title: '내부품질심사(Internal Audit) 관리 절차서',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'QMS-P-004',
    defaultCode: 'QMS-P-004',
    legalAuditReason: 'ISO 9001 9.2조 법정 필수. 연 1회 전 부서 대상 독립된 내부심사 실시, 심사원 자격 부여 및 심사보고서 보관.',
    penaltyRisk: '내부심사 누락 시 갱신심사 인증 취소 사유',
    defaultTitle: '내부품질심사 관리 규정 절차서',
    summary: '연간 심사 계획, 독립된 심사팀 구성, 심사 체크리스트 기반 현장 점검 및 부적합 시정조치 추적',
    templateDraft: `# QMS-P-004 내부품질심사 관리 절차서

제1조(목적) 품질시스템의 적합성과 유효성을 객관적으로 자체 평가한다.
제2조(심사원 자격) 공인 내부심사원 교육과정(16시간)을 이수한 자 중 해당 부서와 무관한 자가 심사를 수행한다.
제3조(보고) 심사 결과는 심사 종료 후 7일 이내 경영진에게 보고하고 경영검토 회의에 상정한다.`
  },
  {
    id: 'REQ-9001-14',
    standard: 'ISO_9001',
    clause: '9.3',
    clauseGroup: '9. 성과평가',
    title: '최고경영자 경영검토(Management Review) 절차서',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'QMS-P-002',
    defaultCode: 'QMS-P-002',
    legalAuditReason: 'ISO 9001 9.3조 법정 필수. 경영진이 참석하는 정기 경영검토 회의체 운영 및 의결 회의록 보관 필수.',
    penaltyRisk: '경영검토 미실시 시 사후심사 즉시 불합격',
    defaultTitle: '최고경영자 경영검토 운영 절차서',
    summary: '연 1회 이상 최고경영자 주관 경영검토 회의, 이전 심사 조치결과 검토, 자원 배분 및 시스템 개선 의결',
    templateDraft: `# QMS-P-002 최고경영자 경영검토 운영 절차서

제1조(주관) 최고경영자(대표이사)가 주관하며 전 임원이 필참한다.
제2조(입력 사항) 내부심사 결과, 고객 만족도, 품질목표 달성도, 시정조치 현황 등 7대 필수 안건.
제3조(출력 사항) 프로세스 개선 결정, 추가 자원 배분 계획 및 대표이사 최종 서명 날인.`
  },
  {
    id: 'REQ-9001-15',
    standard: 'ISO_9001',
    clause: '10.2',
    clauseGroup: '10. 개선',
    title: '부적합 및 시정조치(CAPA) 관리 절차서',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'QMS-P-005',
    defaultCode: 'QMS-P-005',
    legalAuditReason: 'ISO 9001 10.2조 법정 필수. 결함 원인 분석(5-Why), 시정조치요구서(CAR) 발행 및 재발방지 유효성 검증.',
    penaltyRisk: '시정조치 미종결 시 사후심사 지적 지속 누적',
    defaultTitle: '시정조치 및 예방조치(CAPA) 관리 절차서',
    summary: '심사 지적 및 고객 불만에 대한 근본원인 분석, 개선 대책 수립, 3개월 후 유효성 재검증 프로세스',
    templateDraft: `# QMS-P-005 시정조치 및 예방조치 관리 절차서

제1조(원인분석) 부적합 발생 시 5-Why 기법을 활용하여 근본 원인을 규명한다.
제2조(시정조치 요구) 품질경영팀은 해당 부서에 CAR을 발행하고 14일 이내 대책서를 징구한다.
제3조(유효성 확인) 조치 완료 3개월 후 동일 결함 재발 여부를 현장 실사하여 최종 종결한다.`
  },

  // ==========================================
  // 2. ISO 14001:2015 환경경영시스템 필수 구비 문서 (12종)
  // ==========================================
  {
    id: 'REQ-14001-00',
    standard: 'ISO_14001',
    clause: '0.0',
    clauseGroup: '인증서 원본',
    title: 'ISO 14001:2015 정식 인증서 원본',
    level: 'CERT',
    mandatory: true,
    codePattern: 'CERT-14001',
    defaultCode: 'CERT-14001',
    legalAuditReason: 'KAB 공인 ISO 14001 인증서 원본. 탄소중립 및 환경법규 준수 심사 증빙.',
    penaltyRisk: '만기 시 조달청 환경 가점 미적용',
    defaultTitle: 'ISO 14001:2015 환경경영시스템 인증서 원본',
    summary: '환경부 및 KAB 공인 발행 ISO 14001 인증서',
    templateDraft: `# ISO 14001:2015 환경경영시스템 인증서
인증번호: IC-EMS-2024-0045
사업장: (주)아이소에듀 전 사업장
인증범위: 친환경 IT 교육 솔루션 기획, 그린 데이터센터 운영 및 소프트웨어 개발`
  },
  {
    id: 'REQ-14001-01',
    standard: 'ISO_14001',
    clause: '4.3',
    clauseGroup: '4. 조직 상황',
    title: '환경경영시스템 적용범위서 및 환경매뉴얼',
    level: 'LEVEL_1',
    mandatory: true,
    codePattern: 'EM-01',
    defaultCode: 'EM-01',
    legalAuditReason: 'ISO 14001 4.3조. 사업장 경계, 온실가스 배출 범위 및 환경영향 활동 규정.',
    penaltyRisk: '환경매뉴얼 부재 시 중대 부적합',
    defaultTitle: '환경경영 매뉴얼 (Environmental Manual)',
    summary: '환경 방침, 전과정(Life Cycle) 관점의 환경영향 평가 및 준수의무 통제',
    templateDraft: `# EM-01 환경경영시스템 매뉴얼
1. 목적: 환경보호 및 환경오염 방지 활동 체계화
2. 적용범위: 사업장 내 전력, 용수, 폐기물 및 소프트웨어 그린 코딩 전반`
  },
  {
    id: 'REQ-14001-02',
    standard: 'ISO_14001',
    clause: '5.2',
    clauseGroup: '5. 리더십',
    title: '환경방침 선언서',
    level: 'LEVEL_1',
    mandatory: true,
    codePattern: 'EP-01',
    defaultCode: 'EP-01',
    legalAuditReason: 'ISO 14001 5.2조. 탄소배출 저감, 자원 재활용, 환경법규 준수 의지 대내외 공표.',
    penaltyRisk: '환경방침 미게시 시 감점',
    defaultTitle: '전사 환경방침 및 ESG 선언서',
    summary: '자원 절약, 에너지 효율 극대화 및 폐기물 제로화 실천 강령',
    templateDraft: `# EP-01 전사 환경방침
우리는 다음의 환경방침을 실천하여 지속가능한 지구를 지킨다.
1. 에너지 효율 20% 개선
2. 디지털 전환을 통한 종이 사용 제로화
3. 폐기물 분리배출 100% 실천`
  },
  {
    id: 'REQ-14001-03',
    standard: 'ISO_14001',
    clause: '6.1.2',
    clauseGroup: '6. 기획',
    title: '환경측면 평가 절차서 및 환경영향평가표',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'EMS-P-002',
    defaultCode: 'EMS-P-002',
    legalAuditReason: 'ISO 14001 6.1.2조 법정 필수. 대기/수질/폐기물/소음 등 환경영향 요소의 유의성 평가 대장.',
    penaltyRisk: '환경영향평가 미비 시 사후심사 지적 1위',
    defaultTitle: '환경측면 파악 및 영향평가 절차서',
    summary: '정상/비상/과거 상태별 환경 요인 식별, 유의한 환경측면 도출 및 관리방안 수립',
    templateDraft: `# EMS-P-002 환경영향평가 절차서
1. 평가 대상: 전사 전력 소모, 냉난방기 냉매 누출, 전자기기 폐기물
2. 유의성 평가: 점수 합계 80점 이상은 '유의 환경측면'으로 지정하여 중점 개선.`
  },
  {
    id: 'REQ-14001-04',
    standard: 'ISO_14001',
    clause: '6.1.3',
    clauseGroup: '6. 기획',
    title: '환경 준수의무(법규) 관리 절차서 및 법규등록부',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'EMS-P-003',
    defaultCode: 'EMS-P-003',
    legalAuditReason: 'ISO 14001 6.1.3조 필수. 폐기물관리법, 대기환경보전법 등 최신 개정 법규 목록 및 준수 평가.',
    penaltyRisk: '환경법규 위반 시 과태료 및 입찰 참가 제한',
    defaultTitle: '환경 준수의무 관리 절차서 및 법규등록부',
    summary: '환경 관련 법률, 조례, 협약 목록화 및 반기별 적합성 평가 결과 보고',
    templateDraft: `# EMS-P-003 환경 법규등록부 및 준수의무 관리 절차서
1. 대상 법령: 폐기물관리법, 자원재활용법, 전기안전관리법 등 12개 법률
2. 최신화: 법제처 알림 서비스를 연계하여 개정 시 15일 이내 법규등록부 갱신.`
  },
  {
    id: 'REQ-14001-05',
    standard: 'ISO_14001',
    clause: '8.2',
    clauseGroup: '8. 운용',
    title: '환경 비상사태 대비 및 대응 절차서',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'EMS-P-004',
    defaultCode: 'EMS-P-004',
    legalAuditReason: 'ISO 14001 8.2조. 화재, 유류/유해화학물질 누출, 누전 등 비상상황 훈련 일지 및 대피로 확보.',
    penaltyRisk: '소방점검 미비 시 500만원 이하 과태료',
    defaultTitle: '비상사태 대비 및 대응 관리 절차서',
    summary: '비상 연락망, 방제 장비 비치, 연 1회 모의 소방훈련 및 평가 보고서 작성',
    templateDraft: `# EMS-P-004 비상사태 대응 절차서
1. 비상조직 구성: 총괄지휘반, 대피유도반, 소화반, 응급구호반
2. 훈련: 연 1회 전사 대피훈련 실시 및 소방서 합동 훈련 보고서 5년 보존.`
  },
  {
    id: 'REQ-14001-06',
    standard: 'ISO_14001',
    clause: '9.2',
    clauseGroup: '9. 성과평가',
    title: '환경 내부심사 관리 절차서 및 결과보고서',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'EMS-P-005',
    defaultCode: 'EMS-P-005',
    legalAuditReason: 'ISO 14001 9.2조. 환경경영시스템의 독립적 내부감사 수행 및 부적합 조치.',
    penaltyRisk: '환경 내부심사 미실시 시 인증 정지',
    defaultTitle: '환경경영시스템 내부심사 절차서',
    summary: '환경 심사 계획, 폐기물 보관소 및 설비 실사, 부적합 개선 조치 보고',
    templateDraft: `# EMS-P-005 환경 내부심사 절차서
1. 심사 주기: 정기 환경 사후심사 1개월 전 전 부서 대상 실시
2. 현장 검증: 분리수거장, 전산실 전력 계량기, 비상대응 장비 작동 상태 확인.`
  },

  // ==========================================
  // 3. ISO 45001:2018 안전보건경영시스템 필수 구비 문서 (12종)
  // ==========================================
  {
    id: 'REQ-45001-00',
    standard: 'ISO_45001',
    clause: '0.0',
    clauseGroup: '인증서 원본',
    title: 'ISO 45001:2018 정식 인증서 원본',
    level: 'CERT',
    mandatory: true,
    codePattern: 'CERT-45001',
    defaultCode: 'CERT-45001',
    legalAuditReason: '중대재해처벌법 제4조 이행 입증용 안전보건경영시스템 공인 인증서 원본.',
    penaltyRisk: '만기 D-15일 임박 (최대 1,000만원 과태료 및 대표이사 책임 리스크)',
    defaultTitle: 'ISO 45001:2018 안전보건경영시스템 인증서 원본',
    summary: 'KAB 공인 인증기관 발행 중대재해 예방 공식 인증서',
    templateDraft: `# ISO 45001:2018 안전보건경영시스템 인증서
인증번호: IC-OHS-2024-0089
사업장: (주)아이소에듀 사옥 및 부설 연구소
인증범위: 임직원 및 상주 협력업체 사업장 전반의 산업안전보건 관리`
  },
  {
    id: 'REQ-45001-01',
    standard: 'ISO_45001',
    clause: '5.2',
    clauseGroup: '5. 리더십',
    title: '안전보건방침 및 안전경영 선언서',
    level: 'LEVEL_1',
    mandatory: true,
    codePattern: 'OHS-P-001',
    defaultCode: 'OHS-P-001',
    legalAuditReason: '산업안전보건법 제14조 및 ISO 45001 5.2조. 무재해 달성 및 근로자 생명 존중 방침 게시.',
    penaltyRisk: '안전방침 미수립 시 고용노동부 시정명령',
    defaultTitle: '안전보건경영 매뉴얼 및 안전방침서',
    summary: '중대재해 제로화, 근로자 작업중지권 보장 및 산업안전보건위원회 운영 규정',
    templateDraft: `# OHS-P-001 안전보건방침
당사는 임직원의 생명과 안전을 경영의 제1원칙으로 삼는다.
1. 중대산업재해 ZERO 달성
2. 위험요소 발견 시 즉각적인 작업중지권 행사 보장
3. 법정 안전보건 예산 전액 집행`
  },
  {
    id: 'REQ-45001-02',
    standard: 'ISO_45001',
    clause: '6.1.2',
    clauseGroup: '6. 기획',
    title: '위험성평가(Risk Assessment) 관리 절차서 및 평가표',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'OHS-P-002',
    defaultCode: 'OHS-P-002',
    legalAuditReason: '중대재해처벌법 시행령 제4조 제3호 의무 요건. 연 1회 정기 위험성평가 및 근로자 참여 증빙 필수.',
    penaltyRisk: '위험성평가 미실시 시 1,000만원 이하 과태료 및 형사처벌 가중',
    defaultTitle: '사업장 위험성평가 관리 절차서 및 결과표',
    summary: '유해·위험요인 파악, 위험성 빈도/강도 계산, 감소 대책 수립 및 노동조합/근로자대표 서명부',
    templateDraft: `# OHS-P-002 위험성평가 절차서
1. 평가 주기: 최초평가, 연 1회 정기평가, 공정 변경 시 수시평가
2. 평가 절차: 사전준비 -> 유해위험요인 파악 -> 위험성 추정 -> 위험성 결정 -> 대책수립
3. 근로자 참여: 작업 공정별 근로자가 직접 참여하여 체크리스트 작성.`
  },
  {
    id: 'REQ-45001-03',
    standard: 'ISO_45001',
    clause: '8.1.2',
    clauseGroup: '8. 운용',
    title: '안전작업허가(PTW) 및 현장 작업안전 지침서',
    level: 'LEVEL_3',
    mandatory: true,
    codePattern: 'OHS-I-001',
    defaultCode: 'OHS-I-001',
    legalAuditReason: '고소작업, 화기작업, 밀폐공간 등 고위험 작업 전 안전허가증 발행 및 관리감독자 배치 증빙.',
    penaltyRisk: '무허가 위험작업 적발 시 즉시 작업중지 명령',
    defaultTitle: '안전작업허가제(PTW) 운영 지침서',
    summary: '화기/밀폐/고소/정전 작업 전 허가 신청, 가스 농도 측정 및 안전관리자 승인 기록',
    templateDraft: `# OHS-I-001 안전작업허가(PTW) 지침서
1. 허가 대상: 높이 2m 이상 고소작업, 용접/절단 등 화기작업, 정전 작업
2. 절차: 작업 전일 허가서 신청 -> 현장 안전점검 -> 안전보건관리책임자 승인.`
  },
  {
    id: 'REQ-45001-04',
    standard: 'ISO_45001',
    clause: '10.2',
    clauseGroup: '10. 개선',
    title: '산업재해·아차사고 조사 및 시정조치 절차서',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'OHS-P-003',
    defaultCode: 'OHS-P-003',
    legalAuditReason: '산업안전보건법 제57조. 재해 발생 시 원인 조사표 작성, 산업재해조사표 노동청 제출 및 재발방지.',
    penaltyRisk: '산재 은폐 시 1년 이하 징역 또는 1,000만원 이하 벌금',
    defaultTitle: '재해 조사 및 아차사고(Near-Miss) 관리 절차서',
    summary: '사고 발생 시 24시간 이내 보고, 원인 규명, 재발방지 대책 수립 및 전사 전파',
    templateDraft: `# OHS-P-003 산업재해 및 아차사고 관리 절차서
1. 보고 체계: 사고 발생 즉시 총괄책임자 보고 및 1개월 이내 노동청 산업재해조사표 제출
2. 아차사고 발굴: 분기별 우수 아차사고 제안자 포상 및 위험 개선 조치.`
  },

  // ==========================================
  // 4. ISO 27001:2022 정보보안경영시스템 필수 구비 문서 (10종)
  // ==========================================
  {
    id: 'REQ-27001-00',
    standard: 'ISO_27001',
    clause: '0.0',
    clauseGroup: '인증서 원본',
    title: 'ISO 27001:2022 정식 인증서 원본',
    level: 'CERT',
    mandatory: true,
    codePattern: 'CERT-27001',
    defaultCode: 'CERT-27001',
    legalAuditReason: '글로벌 보안 표준 ISO 27001 인증서. 클라우드 고객사 보안 실사 및 투자유치 필수 증빙.',
    penaltyRisk: '만기 시 해외 바이어 보안 감사 탈락',
    defaultTitle: 'ISO 27001:2022 정보보안경영시스템 인증서 원본',
    summary: '영국 UKAS 또는 한국 KAB 공인 정보보호 인증서',
    templateDraft: `# ISO 27001:2022 정보보안경영시스템 인증서
인증번호: IC-ISMS-2024-0112
사업장: (주)아이소에듀 클라우드 데이터센터 및 본사
인증범위: 클라우드 SaaS 교육 서비스 개발 및 인프라 운영 관리`
  },
  {
    id: 'REQ-27001-01',
    standard: 'ISO_27001',
    clause: '5.2',
    clauseGroup: '5. 리더십',
    title: '정보보호 정책서 (Information Security Policy)',
    level: 'LEVEL_1',
    mandatory: true,
    codePattern: 'ISP-01',
    defaultCode: 'ISP-01',
    legalAuditReason: 'ISO 27001 5.2조 및 개인정보보호법. 정보보호최고책임자(CISO) 지정 및 전사 보안 수칙.',
    penaltyRisk: '정보보호 정책 부재 시 보안 감사 즉시 부적합',
    defaultTitle: '전사 정보보호 기본 정책서',
    summary: '자산 관리, 접근 통제, 암호화 정책, 침해사고 대응 및 클린데스크 정책 총괄',
    templateDraft: `# ISP-01 전사 정보보호 기본 정책서
1. CISO 지정: 정보보호최고책임자 권한 및 예산 독립성 보장
2. 접근 권한: 최소 권한 부여 원칙(Need-to-know) 및 퇴사 시 즉시 계정 회수
3. 암호화: 고객 개인정보 저장 및 전송 구간 AES-256 / TLS 1.3 암호화 강제.`
  },
  {
    id: 'REQ-27001-02',
    standard: 'ISO_27001',
    clause: '6.1.3',
    clauseGroup: '6. 기획',
    title: '적용성 보고서 (Statement of Applicability, SoA)',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'ISMS-P-002',
    defaultCode: 'ISMS-P-002',
    legalAuditReason: 'ISO 27001 핵심 필수 산출물. Annex A 93개 보안 통제 항목의 적용/제외 사유 명시.',
    penaltyRisk: 'SoA 누락 시 심사 개시 불가 (심사 반려)',
    defaultTitle: 'ISO 27001:2022 적용성 보고서 (SoA)',
    summary: '조직적(37개), 인적(8개), 물리적(14개), 기술적(34개) 통제항목 이행 현황 매트릭스',
    templateDraft: `# ISMS-P-002 적용성 보고서 (SoA v2022)
1. 조직적 통제 (A.5): 보안 정책, 자산 관리, 클라우드 보안 적용 완료
2. 기술적 통제 (A.8): 취약점 점검(월 1회), 소스코드 정적 분석, 2차 인증(MFA) 강제.`
  },
  {
    id: 'REQ-27001-03',
    standard: 'ISO_27001',
    clause: 'A.5.15',
    clauseGroup: '8. 운용',
    title: '접근통제 및 계정관리 지침서',
    level: 'LEVEL_3',
    mandatory: true,
    codePattern: 'ISMS-I-001',
    defaultCode: 'ISMS-I-001',
    legalAuditReason: 'ISO 27001 Annex A.5.15 & A.5.18. DB 및 서버 접근통제, 패스워드 복잡도, MFA 인증 기록.',
    penaltyRisk: '개인정보 유출 시 매출액의 3% 과징금 부과',
    defaultTitle: '시스템 접근통제 및 계정 권한 관리 지침서',
    summary: '계정 생성/변경/삭제 절차, 분기별 휴면 계정 감사 및 관리자 권한 분립',
    templateDraft: `# ISMS-I-001 접근통제 지침서
1. 패스워드 정책: 10자리 이상 영문/숫자/특수문자 조합, 90일 주기 변경 강제
2. 2단계 인증: 전 서버 및 사내 포털 접속 시 모바일 OTP 또는 FIDO 인증 필수.`
  },
  {
    id: 'REQ-27001-04',
    standard: 'ISO_27001',
    clause: '9.2 / 9.3',
    clauseGroup: '9. 성과 평가',
    title: '정보보안 점검표 및 침해사고 대응기록',
    level: 'LEVEL_4',
    mandatory: true,
    codePattern: 'ISMS-R-001',
    defaultCode: 'ISMS-R-001',
    legalAuditReason: 'ISO 27001 9.2조 내부감사 및 침해사고 대응 기록. KISA 가이드라인 준수 필수.',
    penaltyRisk: '보안사고 미보고 시 과태료 최대 3,000만원',
    defaultTitle: '정보보안 내부감사 점검표 및 침해사고 조치기록부',
    summary: '월간 보안 취약점 점검 결과, 악성코드 탐지 로그 및 비상대응 훈련 결과표',
    templateDraft: `# ISMS-R-001 정보보안 내부감사 점검표
1. 점검일자: 2024년 05월 20일
2. 점검자: CISO 및 사내 정보보호위원회
3. 항목별 점검 결과:
  - 서버/DB 계정관리: 적합 (불필요 계정 전수 삭제 완료)
  - 방화벽/IPS 정책: 적합 (비인가 포트 전면 차단)
  - 임직원 보안 서약서: 전원 징구 완료 (100%)`
  },

  // ==========================================
  // 5. ISO 13485:2016 의료기기 품질경영시스템 필수 구비 문서 (5종)
  // ==========================================
  {
    id: 'REQ-13485-00',
    standard: 'ISO_13485',
    clause: '0.0',
    clauseGroup: '인증서 원본',
    title: 'ISO 13485:2016 정식 인증서 원본',
    level: 'CERT',
    mandatory: true,
    codePattern: 'CERT-13485',
    defaultCode: 'CERT-13485',
    legalAuditReason: '의료기기 품질경영시스템 공인 인증서. CE MDR 심사 및 식약처 GMP 심사 기본 요건.',
    penaltyRisk: '만기 시 해외 수출 통관 보류 및 판매 중지',
    defaultTitle: 'ISO 13485:2016 의료기기 품질경영시스템 인증서 원본',
    summary: '글로벌 심사기관(BSI/TUV SUD) 발행 공식 의료기기 제조 인증서',
    templateDraft: `# ISO 13485:2016 의료기기 품질경영시스템 인증서
인증번호: MD-QMS-2024-0089
인증범위: 체외진단의료기기(IVD) 시약 및 분석기기 설계, 제조 및 유통
유효기간: 2024-08-10 ~ 2027-08-09`
  },
  {
    id: 'REQ-13485-01',
    standard: 'ISO_13485',
    clause: '4.2.2',
    clauseGroup: '4. 품질경영시스템',
    title: '의료기기 품질매뉴얼 (Medical Quality Manual)',
    level: 'LEVEL_1',
    mandatory: true,
    codePattern: 'MD-QM-01',
    defaultCode: 'MD-QM-01',
    legalAuditReason: 'ISO 13485 4.2.2조 필수. 의료기기 제품 표준 및 기술문서(TCF) 체계와의 연계 명시.',
    penaltyRisk: '미비 시 심사 불합격(Re-audit)',
    defaultTitle: '의료기기 품질경영시스템 매뉴얼 (MD-QM)',
    summary: '의료기기 설계/제조 전반의 안전성 및 유효성 보증을 위한 최고위 표준 매뉴얼',
    templateDraft: `# MD-QM-01 의료기기 품질매뉴얼 (ISO 13485 / CE MDR)
제1장 총칙
1. 목적: 환자 및 사용자의 안전을 최우선으로 하는 체외진단의료기기 품질경영체계 수립
2. 적용 규격: ISO 13485:2016, ISO 14971:2019(위험관리), EU MDR 2017/745
3. 조직의 역할: 제조업자(Manufacturer)로서의 법적 책임 준수`
  },
  {
    id: 'REQ-13485-02',
    standard: 'ISO_13485',
    clause: '7.1 / 7.3',
    clauseGroup: '7. 제품 실현',
    title: '의료기기 위험관리 절차서 (ISO 14971 연계)',
    level: 'LEVEL_2',
    mandatory: true,
    codePattern: 'MD-QP-01',
    defaultCode: 'MD-QP-01',
    legalAuditReason: 'ISO 13485 7.1 및 ISO 14971. 전 수명주기 위험 분석, 위험 평가 및 통제 조치.',
    penaltyRisk: '위험관리 결함 시 제품 리콜 및 인증 철회',
    defaultTitle: '의료기기 위험관리(Risk Management) 절차서',
    summary: '의료기기 설계부터 폐기까지 위해요인(Hazard) 식별 및 잔여위험 허용기준 평가',
    templateDraft: `# MD-QP-01 의료기기 위험관리 절차서 (ISO 14971)
1. 위험분석: 고장형태영향분석(FMEA)을 통한 생물학적, 화학적, 전기적 위해요인 식별
2. 위험통제: 본질적 설계 안전 -> 보호조치 -> 안전 정보 제공 3단계 통제
3. 잔여위험 평가: 편익 대비 위험 분석(Benefit-Risk Analysis) 실시`
  },
  {
    id: 'REQ-13485-03',
    standard: 'ISO_13485',
    clause: '6.4 / 7.5',
    clauseGroup: '6. 자원관리',
    title: '클린룸 환경관리 및 오염방지 지침서',
    level: 'LEVEL_3',
    mandatory: true,
    codePattern: 'MD-QI-01',
    defaultCode: 'MD-QI-01',
    legalAuditReason: 'ISO 13485 6.4조 작업환경 관리. 미립자, 부유균, 온습도 기준 관리 및 기록 의무.',
    penaltyRisk: '환경 기준치 초과 시 제조 정지',
    defaultTitle: '청정실(Cleanroom Class 10,000) 환경관리 지침서',
    summary: '작업자 방진복 착용 절차, 차압 관리, 공조설비(HEPA필터) 점검 주기 규정',
    templateDraft: `# MD-QI-01 클린룸 환경관리 지침서
1. 청정도 기준: Class 10,000 (0.5㎛ 입자 352,000개/㎥ 이하)
2. 일일 점검: 차압(10~15Pa 유지), 실내온도 20±2℃, 습도 45±5%
3. 부유균/낙하균 측정: 주 1회 한천배지 노출 시험 실시`
  },
  {
    id: 'REQ-13485-04',
    standard: 'ISO_13485',
    clause: '4.2.3 / 7.3.10',
    clauseGroup: '4. 문서화',
    title: '의료기기 기술문서(TCF) 및 설계이력파일(DHF)',
    level: 'LEVEL_4',
    mandatory: true,
    codePattern: 'MD-QR-01',
    defaultCode: 'MD-QR-01',
    legalAuditReason: 'ISO 13485 4.2.3 의료기기 파일. 유럽 CE 인증 및 식약처 품목허가 제출용 원천 서류.',
    penaltyRisk: '기술문서 미흡 시 해외 인허가 반려',
    defaultTitle: '의료기기 기술문서(TCF/DHF) 종합 체크리스트',
    summary: '제품 사양서, 위험관리파일(RMF), 임상평가보고서(CER), 멸균검증성적서 색인표',
    templateDraft: `# MD-QR-01 의료기기 기술문서(TCF) 색인표
1. 품목명: 체외진단용 분자유전자 진단키트
2. 등급: Class II (유럽 CE MDR Rule 3)
3. 기술문서 구성:
  - Part 1: 제품 설명 및 사양서 (부속품 포함)
  - Part 2: 위험관리 종합보고서 (RMR-2024)
  - Part 3: 유효기간 안정성 시험 성적서 (실시간 가속시험)
  - Part 4: 임상적 성능시험 결과보고서 (CER Rev 2.0)`
  }
];
