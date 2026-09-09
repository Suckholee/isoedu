// ========================================================
// ISO 9001:2015 & 2024 Climate Change Amendment Master Blueprint
// Categorized into:
// 1. 기본체계 문서 (기준 문서)
// 2. 주요 절차서 (표준 12종 + AI/컨설팅 특화 7종)
// 3. 반드시 남겨야 하는 주요 기록 (7대 영역 30종)
// 4. 네오앤피터 AI/AX 컨설팅 우선 15종 패키지
// ========================================================

export const ISO_9001_CATEGORIES = [
  { id: 'ALL', name: '전체 보기', desc: '모든 ISO 9001 준비 문서' },
  { id: 'STARTER_15', name: '🌟 네오앤피터 15종 우선 세트', desc: '소규모 AI/컨설팅 기업 심사 통과 필수 최소 문서' },
  { id: 'BASE', name: '1. 기본체계 문서 (기준)', desc: '인증 범위와 품질관리 기본 체계 (11종)' },
  { id: 'PROCEDURE', name: '2. 주요 절차서 (12+7종)', desc: '표준 12종 + AI/컨설팅 특화 7종 절차서' },
  { id: 'RECORD', name: '3. 업무 기록 (운영 증거)', desc: '심사 시 실제 운영 입증 7대 영역 기록 (30종)' },
];

export const ISO_9001_MASTER_BLUEPRINT = [
  // =================================================================
  // 1. 기본체계 문서 (기준 문서) - 11종
  // =================================================================
  {
    id: 'b-01',
    code: 'QM-00',
    title: '품질경영시스템 적용범위 (Scope of QMS)',
    category: 'BASE',
    subCategory: '1. 기본체계 문서',
    level: 'LEVEL_1',
    clause: 'Clause 4.3',
    isStarter15: false,
    summary: '인증 대상 사업장, 서비스/제품 범위 및 규격 적용 제외 조항 정당성 명시',
    legalAuditReason: 'ISO 9001 4.3조 필수 요구사항. 심사 시작 시 가장 먼저 검토하는 원천 문서.',
    penaltyRisk: '적용범위 불명확 시 심사 진행 불가 및 인증서 발행 보류',
    templateDraft: `# 품질경영시스템 적용범위 명세서 (QMS Scope)
- 문서번호: QM-00-SCOPE | 제정일자: 2024-05-20 | Rev. 2.0
- 조직명: (주)네오앤피터 (Neo & Peter Co., Ltd.)

1. 적용 사업장: 서울특별시 강남구 테헤란로 본사 및 AX R&D 센터
2. 인증 대상 제품 및 서비스 범위:
   - 인공지능(AI) 솔루션 기획, 알고리즘 개발 및 소프트웨어 공급
   - 기업 디지털 전환(AX) 컨설팅 및 전문 직무 교육 서비스
3. 적용 제외 조항:
   - 8.3 설계 및 개발: [적용함] 자체 AI 모델 및 SaaS 아키텍처 설계 수행
   - 7.1.5 모니터링 및 측정 자원(물리적 계측기): [해당 없음] 하드웨어 제조 공정이 없는 순수 소프트웨어 서비스 기업으로 정당하게 제외함.`
  },
  {
    id: 'b-02',
    code: 'QM-01',
    title: '품질경영 매뉴얼 (Quality Manual)',
    category: 'BASE',
    subCategory: '1. 기본체계 문서',
    level: 'LEVEL_1',
    clause: 'Clause 4~10 전 조항',
    isStarter15: true,
    summary: '전체 품질경영 체계를 일목요연하게 설명하는 사내 최고위 기준 문서',
    legalAuditReason: '2015년판에서 매뉴얼이 의무는 아니나, 전체 체계 설명 및 심사원 인터뷰 대응을 위해 실무상 최우선 작성 권장.',
    penaltyRisk: '사내 체계 이해 부족으로 심사원 관찰사항(Observation) 다수 발생',
    templateDraft: `# QM-01 품질경영 매뉴얼 (Quality Manual v3.0)
(주)네오앤피터 | 최고경영자: 대표이사 Peter

제1장 총칙
제1조(목적) 본 매뉴얼은 ISO 9001:2015 및 2024 기후변화 개정사항에 적합한 품질경영시스템을 구축하여 고객 만족과 AX 혁신 가치를 창출함을 목적으로 한다.
제2조(조직 상황) 4.1 내외부 이슈 분석과 4.2 이해관계자 요구사항을 매년 1회 이상 검토한다.
제3조(품질방침) 고객 중심 AI 혁신, 데이터 신뢰성 확보, 지속적 품질 개선.
제4조(운영 체계) 요구사항 접수 -> 프로젝트 기획 -> AI 설계/개발 -> 품질검수 -> 서비스 승인 -> 사후 모니터링`
  },
  {
    id: 'b-03',
    code: 'QM-02',
    title: '회사 조직도 및 업무분장표',
    category: 'BASE',
    subCategory: '1. 기본체계 문서',
    level: 'LEVEL_1',
    clause: 'Clause 5.3',
    isStarter15: true,
    summary: '품질경영 대리인(QMR), 각 부서별 책임과 권한 및 보고 체계 규정',
    legalAuditReason: 'ISO 9001 5.3조 조직의 역할, 책임 및 권한 필수 문서화 요구사항.',
    penaltyRisk: '부서 간 업무 R&R 불명확 시 부적합 지적',
    templateDraft: `# 회사 조직도 및 품질 업무분장표
- 문서번호: QM-02-ORG | 승인: 대표이사

1. 조직 체계도:
   [대표이사 / CEO]
        │
   ┌────┴──────────────────────────┐
   │ 품질경영대리인 (QMR: CPO)      │
   └────┬──────────────────────────┘
        ├─ AX 컨설팅 사업부: 고객 요구사항 검토, 컨설팅 프로젝트 수행
        ├─ AI 기술개발팀: 알고리즘 설계, 모델 파인튜닝, 버전 배포
        ├─ 품질보증(QA)팀: 산출물 검수, 내부심사 주관, 부적합 관리
        └─ 경영지원팀: 임직원 교육, 계약서 보존, 협력업체 정산

2. 부서별 품질 책임:
   - 대표이사: 품질방침 제정, 경영검토 주재, 자원 배정
   - 품질관리자: 사내 표준문서 관리, 내부감사 계획 수립 및 보고
   - 프로젝트 매니저(PM): 일정 준수, 고객 승인 확인서 징구`
  },
  {
    id: 'b-04',
    code: 'QM-03',
    title: '프로세스 맵 (Process Interaction Map)',
    category: 'BASE',
    subCategory: '1. 기본체계 문서',
    level: 'LEVEL_1',
    clause: 'Clause 4.4',
    isStarter15: true,
    summary: '경영, 핵심(영업/개발/납품), 지원 프로세스 간의 상호작용 흐름도',
    legalAuditReason: 'ISO 9001 4.4조 프로세스 접근법(Process Approach)에 따른 입력-출력 관계 규정.',
    penaltyRisk: '프로세스 단절 시 본심사 부적합 지적',
    templateDraft: `# 전사 품질 프로세스 맵 (Process Map)
1. 경영 프로세스 (M1~M3):
   - M1: 경영기획 및 기후변화 검토 -> M2: 리스크/기회 관리 -> M3: 경영검토
2. 핵심 비즈니스 프로세스 (C1~C5):
   - [고객 요구 접수] -> C1: 계약검토 -> C2: 프로젝트 계획 -> C3: AI 설계/개발 -> C4: 종합 검수 -> C5: 고객 승인 및 납품
3. 지원 프로세스 (S1~S4):
   - S1: 문서 및 기록관리 -> S2: 인적자원 교육 -> S3: 외주/API 공급사 관리 -> S4: 내부심사`
  },
  {
    id: 'b-05',
    code: 'QM-04',
    title: '프로세스별 책임·입력·출력·성과지표(KPI) 정의서',
    category: 'BASE',
    subCategory: '1. 기본체계 문서',
    level: 'LEVEL_1',
    clause: 'Clause 4.4.1',
    isStarter15: false,
    summary: '각 단위 프로세스별 Input, Output, 담당자, 통제 기준 및 KPI 정의',
    legalAuditReason: '프로세스 모니터링 및 측정 가능성을 입증하기 위한 핵심 기준표.',
    penaltyRisk: '성과 측정 지표 부재 시 지속적 개선 요구사항 위반',
    templateDraft: `# 프로세스별 입력·출력 및 KPI 정의서
| 프로세스명 | 책임자 | 주요 입력(Input) | 주요 출력(Output) | 관리 KPI 지표 |
| :--- | :--- | :--- | :--- | :--- |
| 영업/계약검토 | 사업팀장 | 고객 RFP, 상담일지 | 수주계약서, 요구정의서 | 계약 검토율 100% |
| AI 개발/설계 | 개발팀장 | 기능요구서, 학습데이터 | 소스코드, 모델 가중치 | 모델 정확도 95%↑ |
| 서비스 검수 | QA팀장 | 개발 산출물, 테스트케이스 | 검수확인서, 승인서 | 납기 준수율 98%↑ |
| 고객 만족 | CS팀장 | 프로젝트 완료 보고 | 만족도 설문 결과표 | 고객만족도 90점↑ |`
  },
  {
    id: 'b-06',
    code: 'QM-05',
    title: '품질방침 및 연간 품질목표 (Quality Policy & Objectives)',
    category: 'BASE',
    subCategory: '1. 기본체계 문서',
    level: 'LEVEL_1',
    clause: 'Clause 5.2 / 6.2',
    isStarter15: true,
    summary: '최고경영자의 품질 경영 철학 공표 및 측정 가능한 연간 수치 목표',
    legalAuditReason: 'ISO 9001 5.2조 및 6.2조 법정 필수 요구사항. 전 직원 인식 인터뷰 단골 질문.',
    penaltyRisk: '품질목표 미수립 또는 실적 미측정 시 중대 부적합',
    templateDraft: `# (주)네오앤피터 품질방침 및 2025년도 품질목표
1. 최고경영자 품질방침:
   "우리는 최고의 AI 기술과 고객 중심 AX 컨설팅으로 신뢰받는 품질 가치를 실현한다."
   - 1) 고객 요구사항 100% 충족 및 납기 준수
   - 2) AI 결과물의 안전성 및 데이터 정합성 보증
   - 3) 전사 프로세스의 지속적 개선 및 친환경 디지털 전환

2. 2025년도 전사 품질목표:
   - 고객 만족도: 92점 이상 달성 (전년 대비 +3점)
   - 프로젝트 납기 준수율: 98.5% 이상 달성
   - AI 솔루션 치명적 장애(Bug) 발생률: 0건
   - 임직원 연간 전문 직무 교육: 1인당 40시간 이수`
  },
  {
    id: 'b-07',
    code: 'QM-06',
    title: '내부·외부 이슈 분석표 (SWOT 분석)',
    category: 'BASE',
    subCategory: '1. 기본체계 문서',
    level: 'LEVEL_1',
    clause: 'Clause 4.1',
    isStarter15: true,
    summary: '강점, 약점, 기회, 위협 및 시장/기술/경쟁 환경 분석',
    legalAuditReason: 'ISO 9001 4.1조 조직과 그 상황의 이해 필수 문서.',
    penaltyRisk: '상황 분석 누락 시 조항 4.1 위반 지적',
    templateDraft: `# 2025년 조직 내·외부 이슈 분석표 (SWOT)
1. 내부 이슈:
   - 강점(S): 최상위 LLM/AX 컨설팅 역량, 신속한 애자일 개발 체계
   - 약점(W): 소규모 인력에 따른 특정 핵심 개발자 의존도
2. 외부 이슈:
   - 기회(O): 정부 AX 지원사업 확대, 기업들의 생성형 AI 도입 수요 급증
   - 위협(T): 오픈소스 AI 모델 경쟁 심화, 빅테크 API 종속성
3. 전략적 조치: 자체 독자 프롬프트/파이프라인 지식재산권 확보 및 외주 협력사 풀 다변화`
  },
  {
    id: 'b-08',
    code: 'QM-07',
    title: '이해관계자 및 요구사항 분석표',
    category: 'BASE',
    subCategory: '1. 기본체계 문서',
    level: 'LEVEL_1',
    clause: 'Clause 4.2',
    isStarter15: true,
    summary: '고객, 협력사, 정부기관, 임직원의 니즈 분석 및 대응 방안',
    legalAuditReason: 'ISO 9001 4.2조 이해관계자의 요구와 기대 파악 필수 문서.',
    penaltyRisk: '고객 요구 누락으로 인한 클레임 발생 시 감점',
    templateDraft: `# 이해관계자 니즈 및 대응계획표
| 구분 | 주요 이해관계자 | 요구 및 기대사항 | 사내 대응 프로세스 |
| :--- | :--- | :--- | :--- |
| 고객사 | AX 도입 중소/중견기업 | 고성능 AI 모델, 납기준수, 유지보수 | 계약검토 및 프로젝트 관리 절차 |
| 협력사 | 클라우드/API 공급사 | 명확한 요구사항, 정산 기일 준수 | 공급업체 관리 절차 |
| 규제기관 | 과기정통부, 개인정보위 | AI 윤리 가이드라인, 개인정보 보호 | 데이터 보안 지침 준수 |
| 임직원 | 개발자 및 컨설턴트 | 공정한 보상, 최신 기술 역량 강화 | 연간 교육훈련 계획 실행 |`
  },
  {
    id: 'b-09',
    code: 'QM-08',
    title: '리스크·기회 관리대장 (Risk Register)',
    category: 'BASE',
    subCategory: '1. 기본체계 문서',
    level: 'LEVEL_1',
    clause: 'Clause 6.1',
    isStarter15: true,
    summary: '사업/프로젝트/기술 리스크 식별, 발생가능성 및 영향도 평가 및 조치',
    legalAuditReason: 'ISO 9001 6.1조 리스크 기반 사고(Risk-based Thinking) 핵심 증빙.',
    penaltyRisk: '리스크 평가 미비 시 심사 탈락',
    templateDraft: `# 전사 리스크 및 기회 관리대장
- 평가일: 2024-06-10 | 주관: 품질경영팀
1. 식별된 리스크 (R-01): 고객사 데이터 유출 리스크
   - 발생가능성: 2 | 심각도: 4 | 위험등급: HIGH (8점)
   - 조치계획: 가명화 조치 의무화, 로컬 폐쇄망 학습 인프라 구축, 비밀유지서약서(NDA) 징구
2. 식별된 기회 (O-01): 지자체 스마트공장 AI 보급사업 수요 확대
   - 실행계획: 지자체 공급기업 등록 및 전용 AX 패키지 표준화`
  },
  {
    id: 'b-10',
    code: 'QM-09',
    title: '기후변화 관련성 검토서 (★ 2024년 ISO 개정 공식 반영)',
    category: 'BASE',
    subCategory: '1. 기본체계 문서',
    level: 'LEVEL_1',
    clause: 'Clause 4.1 & 4.2 (2024 Amendment)',
    isStarter15: true,
    summary: '2024년 2월 발효된 ISO 9001 기후변화(Climate Change) 연계성 평가 필수서류',
    legalAuditReason: '2024년 공식 ISO 개정안(ISO/IAF Joint Communique) 필수 반영 항목. 심사원이 반드시 질문하는 최신 규격 요건.',
    penaltyRisk: '최신 2024 개정 미반영 시 사후심사 지적 대상',
    templateDraft: `# [2024년 최신 개정] 기후변화 관련성 검토서 (Climate Change Relevance Review)
- 근거 규격: ISO 9001:2015/Amd 1:2024 (Clause 4.1 & 4.2)
- 조직명: (주)네오앤피터 | 검토일: 2024-05-15 | 승인: 대표이사

1. 조항 4.1 검토: 조직의 상황에서 기후변화 이슈가 관련성이 있는가?
   - 분석 내용: 당사는 소프트웨어 개발 및 AX 컨설팅 전문 기업으로 제조 공장에서의 직접적 탄소배출(Scope 1)은 미미함.
   - 단, AI 대형 언어모델 학습 및 클라우드 서버 구동 시 전력 소비(Scope 2)와 그린 AI(Green AI) 알고리즘 최적화 수요가 증가하고 있음.
   - 판정: [관련성 있음 - 클라우드 에너지 효율 최적화 알고리즘 도입을 사내 품질 방침에 연계]

2. 조항 4.2 검토: 이해관계자에게 기후변화 관련 요구사항이 있는가?
   - 분석 내용: 공공기관 및 대기업 고객사에서 ESG 공급망 평가 시 탄소중립 실천 여부 및 페이퍼리스(Paperless) 업무 체계를 요구함.
   - 판정: [관련성 있음 - 전사 계약 및 결재 문서 100% 전자서명화, 에너지 고효율 클라우드 인스턴스 사용]`
  },
  {
    id: 'b-11',
    code: 'QM-10',
    title: '법규 및 고객 요구사항 관리대장',
    category: 'BASE',
    subCategory: '1. 기본체계 문서',
    level: 'LEVEL_1',
    clause: 'Clause 8.2.2',
    isStarter15: false,
    summary: 'SW산업진흥법, 개인정보보호법, 인공지능기본법 등 관련 법규 등록 및 준수 평가',
    legalAuditReason: 'ISO 9001 8.2.2조 제품 및 서비스에 관련된 요구사항 결정 필수 증빙.',
    penaltyRisk: '법적 규제 위반 시 인증 정지',
    templateDraft: `# 적용 법규 및 고객 요구사항 등록부
1. 개인정보보호법: 고객 데이터 처리 시 동의 획득 및 암호화 보존 (반기 1회 점검)
2. 소프트웨어 진흥법: 하도급 계약 기준 및 SW 적정대가 기준 준수
3. EU AI Act / 국내 인공지능 발전과 신뢰 기반 조성 등에 관한 법률: AI 신뢰성 및 편향성 검증`
  },

  // =================================================================
  // 2. 주요 절차서 (12종 표준 + 7종 AI/컨설팅 특화)
  // =================================================================
  {
    id: 'p-01',
    code: 'QP-01',
    title: '문서 및 기록관리 절차서',
    category: 'PROCEDURE',
    subCategory: '문서관리',
    level: 'LEVEL_2',
    clause: 'Clause 7.5',
    isStarter15: true,
    summary: '사내 공문서의 제정, 개정, 승인, 배포, 보존연한 및 폐기 절차 규정',
    legalAuditReason: 'ISO 9001 7.5조 문서화된 정보 관리. 전체 시스템의 기본 규칙.',
    penaltyRisk: '최신본 관리 실패 시 구버전 오적용으로 인한 심사 지적',
    templateDraft: `# QP-01 문서 및 기록관리 절차서
제1조(목적) 당사 품질경영시스템의 문서화된 정보의 제·개정 및 보존을 규정한다.
제2조(책임) 품질관리자는 문서 마스터 등록부를 유지하고, 각 팀장은 기록을 3년 이상 보존한다.
제3조(문서 체계) 1계층 매뉴얼 -> 2계층 절차서 -> 3계층 지침서 -> 4계층 기록/양식
제4조(폐기) 보존연한(3년)이 경과한 기록은 부서장 승인 후 영구 삭제 또는 파쇄한다.`
  },
  {
    id: 'p-02',
    code: 'QP-02',
    title: '고객 요구사항 및 계약검토 절차서',
    category: 'PROCEDURE',
    subCategory: '영업·계약',
    level: 'LEVEL_2',
    clause: 'Clause 8.2',
    isStarter15: true,
    summary: '고객 RFP 접수, 기술적 수행 가능성, 납기, 리소스 검토 및 계약 체결 절차',
    legalAuditReason: 'ISO 9001 8.2조 계약 검토 의무화.',
    penaltyRisk: '불명확한 계약으로 인한 분쟁 발생 시 품질시스템 결함 판정',
    templateDraft: `# QP-02 고객 요구사항 및 계약검토 절차서
1. 계약 전 검토: 영업팀은 고객 요구 납기, 기능 범위, 예산을 기술팀과 사전 검토한다.
2. 계약서 날인: 대표이사 결재 완료 후 전자서명(모두싸인 등)으로 체결한다.
3. 요구사항 변경: 계약 체결 후 고객의 스펙 변경 요청 시 '요구사항 변경요청서'를 작성한다.`
  },
  {
    id: 'p-03',
    code: 'QP-03',
    title: '프로젝트·서비스 제공관리 절차서',
    category: 'PROCEDURE',
    subCategory: '서비스 수행',
    level: 'LEVEL_2',
    clause: 'Clause 8.5',
    isStarter15: true,
    summary: 'AX 컨설팅 및 서비스 기획, 수행 단계별 진척 관리, 고객 인도 절차',
    legalAuditReason: 'ISO 9001 8.5조 생산 및 서비스 제공 관리.',
    penaltyRisk: '프로젝트 통제 실패 시 납기 지연 및 고객 클레임',
    templateDraft: `# QP-03 프로젝트 및 서비스 제공관리 절차서
1. 착수 회의: 프로젝트 매니저(PM) 배정 및 WBS 일정표 수립
2. 주간 진척 관리: 주간 업무일지 작성 및 마일스톤 달성률 점검
3. 중간 보고 및 최종 검수: 고객사 담당자 확인 서명 징구`
  },
  {
    id: 'p-04',
    code: 'QP-04',
    title: '제품·서비스 설계 및 개발관리 절차서',
    category: 'PROCEDURE',
    subCategory: '설계·개발',
    level: 'LEVEL_2',
    clause: 'Clause 8.3',
    isStarter15: true,
    summary: '기획 -> 입력 -> 출력 -> 검증(Verification) -> 유효성 확인(Validation) -> 변경관리',
    legalAuditReason: 'ISO 9001 8.3조 설계개발 필수 통제 절차.',
    penaltyRisk: '설계 검증 기록 부재 시 중대 부적합',
    templateDraft: `# QP-04 설계 및 개발관리 절차서
1. 설계 입력: 기능요구서, 알고리즘 목표 성능 수치
2. 설계 검토: 중간 코드리뷰 및 모델 아키텍처 타당성 검토
3. 설계 검증: 단위 테스트 및 통합 테스트 결과서 작성
4. 유효성 확인: 고객사 실제 운영 환경 파일럿 테스트 및 승인`
  },
  {
    id: 'p-05',
    code: 'QP-05',
    title: '공급업체 및 외주업체 관리 절차서',
    category: 'PROCEDURE',
    subCategory: '구매·외주',
    level: 'LEVEL_2',
    clause: 'Clause 8.4',
    isStarter15: true,
    summary: '외주 개발사, 클라우드/API 공급업체 선정평가, 정기평가 및 품질 검수 절차',
    legalAuditReason: 'ISO 9001 8.4조 외부에서 제공되는 프로세스, 제품 및 서비스의 관리.',
    penaltyRisk: '등록되지 않은 무자격 외주업체 사용 시 지적',
    templateDraft: `# QP-05 공급업체 및 외주업체 관리 절차서
1. 신규 업체 등록: 기술력, 가격, 납기준수율 평가(70점 이상 합격)
2. 정기 재평가: 연 1회 기존 협력업체 이행 실적 평가
3. 외주 결과물 검수: 소스코드 검수 및 기능 테스트 통과 후 정산 집행`
  },
  {
    id: 'p-06',
    code: 'QP-06',
    title: '교육·역량·자격관리 절차서',
    category: 'PROCEDURE',
    subCategory: '인적자원',
    level: 'LEVEL_2',
    clause: 'Clause 7.2',
    isStarter15: false,
    summary: '임직원 역량 평가, 연간 교육계획 수립, 직무 교육 이수 및 자격 인정 절차',
    legalAuditReason: 'ISO 9001 7.2조 역량(Competence) 증빙 필수.',
    penaltyRisk: '무자격자 중요 업무 수행 시 부적합',
    templateDraft: `# QP-06 교육 및 역량관리 절차서
1. 연간 교육계획: 매년 1월 전사 기술/품질/보안 교육 계획 수립
2. 직무 역량 평가: 연 1회 임직원 스킬 매트릭스 평가
3. 교육 결과 보고: 참석자 명단 및 만족도 결과표 3년 보존`
  },
  {
    id: 'p-07',
    code: 'QP-07',
    title: '검사·검수·서비스 승인 절차서',
    category: 'PROCEDURE',
    subCategory: '품질관리',
    level: 'LEVEL_2',
    clause: 'Clause 8.6',
    isStarter15: false,
    summary: '중간 산출물 검사, 최종 납품 전 검수 및 고객 인수증 징구 절차',
    legalAuditReason: 'ISO 9001 8.6조 제품 및 서비스의 릴리스.',
    penaltyRisk: '승인 없는 무단 배포 시 심사 지적',
    templateDraft: `# QP-07 검수 및 서비스 승인 절차서
1. 검수 기준: 기능 명세서 충족 여부 및 테스트 통과율 100%
2. 승인 권한: QA팀장 및 프로젝트 총괄 책임자
3. 고객 인수: 최종 서비스 검수확인서 서명 징구 후 릴리스 완료`
  },
  {
    id: 'p-08',
    code: 'QP-08',
    title: '부적합 및 시정조치 절차서',
    category: 'PROCEDURE',
    subCategory: '문제관리',
    level: 'LEVEL_2',
    clause: 'Clause 8.7 / 10.2',
    isStarter15: true,
    summary: '서비스 결함, 납기 지연, 오류 발생 시 원인 분석(5-Why) 및 재발방지 조치',
    legalAuditReason: 'ISO 9001 10.2조 시정조치 필수 요구사항. 심사원이 가장 집중적으로 점검.',
    penaltyRisk: '동일 부적합 반복 발생 시 인증 취소 사유',
    templateDraft: `# QP-08 부적합 및 시정조치 절차서
1. 부적합 식별: 결함 발견 즉시 '부적합 보고서' 발행
2. 원인 분석: 5-Why 기법을 통한 근본 원인 도출
3. 시정조치 및 유효성 확인: 조치 후 30일 이내 재발 여부 확인`
  },
  {
    id: 'p-09',
    code: 'QP-09',
    title: '고객 만족도 및 불만처리 절차서',
    category: 'PROCEDURE',
    subCategory: '고객관리',
    level: 'LEVEL_2',
    clause: 'Clause 9.1.2',
    isStarter15: true,
    summary: '프로젝트 완료 후 정기 만족도 설문 조사 및 고객 클레임 24시간 내 대응',
    legalAuditReason: 'ISO 9001 9.1.2조 고객 만족 측정 필수.',
    penaltyRisk: '고객 만족 측정 실적 부재 시 심사 탈락',
    templateDraft: `# QP-09 고객 만족도 및 불만처리 절차서
1. 고객 만족도 조사: 납품 완료 후 14일 이내 5개 척도 설문 실시
2. 고객 불만(클레임) 접수: 접수 후 24시간 이내 1차 응답, 5일 이내 개선책 전달
3. 연간 분석: 연 1회 종합 분석하여 경영검토 보고 안건으로 상정`
  },
  {
    id: 'p-10',
    code: 'QP-10',
    title: '품질성과 모니터링 및 분석 절차서',
    category: 'PROCEDURE',
    subCategory: '성과관리',
    level: 'LEVEL_2',
    clause: 'Clause 9.1.3',
    isStarter15: false,
    summary: '품질목표 달성률, 장애 건수, 프로세스 효율성에 대한 정량 데이터 분석',
    legalAuditReason: 'ISO 9001 9.1.3조 분석 및 평가.',
    penaltyRisk: '데이터 기반 관리 체계 부재 지적',
    templateDraft: `# QP-10 품질성과 모니터링 절차서
1. 주기: 분기별 1회 데이터 수집 및 분석
2. 분석 대상: 납기준수율, 결함 발생률, 협력사 평가 점수
3. 결과 활용: 목표 미달 프로세스에 대한 개선과제 도출`
  },
  {
    id: 'p-11',
    code: 'QP-11',
    title: '내부심사 절차서',
    category: 'PROCEDURE',
    subCategory: '내부점검',
    level: 'LEVEL_2',
    clause: 'Clause 9.2',
    isStarter15: true,
    summary: '연간 내부감사 계획, 독립된 내부심사원 배정, 체크리스트 감사 및 시정조치',
    legalAuditReason: 'ISO 9001 9.2조 내부심사. 최초 인증 심사 전 최소 1회 전사 내부감사 완료 필수.',
    penaltyRisk: '내부심사 미실시 시 심사 수검 자격 박탈',
    templateDraft: `# QP-11 내부품질심사 절차서
1. 심사 주기: 연 1회 이상 정기 실시 (본심사 1개월 전 완료)
2. 심사원 자격: 내부심사원 양성 교육 이수자 (자신의 부서는 감사 불가)
3. 지적사항 관리: 부적합 사항에 대해 14일 이내 시정조치 완료 확인`
  },
  {
    id: 'p-12',
    code: 'QP-12',
    title: '경영검토 절차서',
    category: 'PROCEDURE',
    subCategory: '경영관리',
    level: 'LEVEL_2',
    clause: 'Clause 9.3',
    isStarter15: true,
    summary: '최고경영자가 직접 주재하는 연간 품질경영시스템 종합 성과 검토 회의',
    legalAuditReason: 'ISO 9001 9.3조 경영검토. 최초 인증 심사 전 대표이사 주재 경영검토 1회 필수.',
    penaltyRisk: '경영검토 회의록 부재 시 본심사 절대 통과 불가',
    templateDraft: `# QP-12 최고경영자 경영검토 절차서
1. 주기: 연 1회 이상 대표이사 주재
2. 입력 사항: 이전 검토 조치 결과, 내외부 이슈/기후변화 변동, 품질목표 실적, 내부심사 결과
3. 출력 사항: 자원 배정 결정, 시스템 개선 과제, 품질방침 재확인`
  },

  // -----------------------------------------------------------------
  // AI 개발·컨설팅 회사 특화 절차서 (7종)
  // -----------------------------------------------------------------
  {
    id: 'p-ai-01',
    code: 'QP-AI-01',
    title: '고객 요구사항 변경관리 절차서',
    category: 'PROCEDURE',
    subCategory: 'AI·컨설팅 특화',
    level: 'LEVEL_2',
    clause: 'Clause 8.2.4',
    isStarter15: false,
    summary: 'AI 프로젝트 진행 중 기능/데이터 스펙 변경 시 영향도 평가 및 고객 합의 절차',
    legalAuditReason: '소프트웨어/AI 서비스 특유의 Scope Creep 방지 및 품질 안정성 확보.',
    penaltyRisk: '변경 이력 누락 시 납품 후 분쟁 발생',
    templateDraft: `# QP-AI-01 고객 요구사항 변경관리 절차서
1. 변경 요청: 고객사의 구두/서면 요청 접수 후 '요구사항 변경요청서' 작성
2. 기술/일정 검토: 추가 개발 공수 및 납기 변동 영향도 산출
3. 고객 승인: 공수 추가에 따른 변경계약서 또는 이메일 공식 합의`
  },
  {
    id: 'p-ai-02',
    code: 'QP-AI-02',
    title: '프로젝트 산출물 검수 절차서',
    category: 'PROCEDURE',
    subCategory: 'AI·컨설팅 특화',
    level: 'LEVEL_2',
    clause: 'Clause 8.6',
    isStarter15: false,
    summary: '컨설팅 보고서, 아키텍처 설계서, AI 모델 가중치 등 단계별 산출물 승인 기준',
    legalAuditReason: '서비스 컨설팅 산출물의 무결성 검증.',
    penaltyRisk: '미검수 산출물 인도 시 고객 신뢰도 하락',
    templateDraft: `# QP-AI-02 프로젝트 산출물 검수 절차서
1. 착수계 / 요구정의서 / 설계서 / 최종결과보고서 4단계 산출물 검수
2. PM 검토 -> QA팀 승인 -> 고객사 서명 날인 절차 확립`
  },
  {
    id: 'p-ai-03',
    code: 'QP-AI-03',
    title: '소스코드·배포 버전관리 절차서',
    category: 'PROCEDURE',
    subCategory: 'AI·컨설팅 특화',
    level: 'LEVEL_2',
    clause: 'Clause 8.5.2',
    isStarter15: false,
    summary: 'Git 브랜치 전략, PR 코드리뷰, 태그 릴리스 및 롤백 절차',
    legalAuditReason: '식별 및 추적성(Traceability) 요구사항 충족.',
    penaltyRisk: '버전 혼선으로 인한 과거 버그 재발 방지',
    templateDraft: `# QP-AI-03 소스코드 및 배포 버전관리 절차서
1. 형상관리 도구: GitHub / GitLab Enterprise 활용
2. 브랜치 전략: main (배포용), develop (개발용), feature (단위기능)
3. 코드 리뷰: 최소 1인 이상의 동료 개발자 PR 승인 후 머지`
  },
  {
    id: 'p-ai-04',
    code: 'QP-AI-04',
    title: '고객 데이터 및 정보보호 절차서',
    category: 'PROCEDURE',
    subCategory: 'AI·컨설팅 특화',
    level: 'LEVEL_2',
    clause: 'Clause 8.5.3',
    isStarter15: false,
    summary: '고객 제공 데이터의 접근 통제, 마스킹/익명화, 프로젝트 종료 후 안전 폐기',
    legalAuditReason: '고객 또는 외부공급자의 재산(Property) 관리 필수.',
    penaltyRisk: '고객 데이터 유출 시 법적 제재 및 인증 취소',
    templateDraft: `# QP-AI-04 고객 데이터 및 정보보호 절차서
1. 고객 자산 관리: 고객 제공 학습 데이터는 격리된 보안 스토리지에 암호화 보관
2. 익명화: 개인식별정보(PII) 포함 시 반드시 비식별 조치 후 학습에 활용
3. 데이터 반환/파기: 프로젝트 검수 완료 후 고객사 확인 하에 영구 파기`
  },
  {
    id: 'p-ai-05',
    code: 'QP-AI-05',
    title: 'AI 결과물 정확성 및 환각(Hallucination) 검증 절차서',
    category: 'PROCEDURE',
    subCategory: 'AI·컨설팅 특화',
    level: 'LEVEL_2',
    clause: 'Clause 8.5.1',
    isStarter15: false,
    summary: 'LLM 생성물 정확도, RAG 검색 정합성, 응답 속도 및 편향성 벤치마크 테스트',
    legalAuditReason: 'AI 서비스 품질 보증(QA)의 핵심 차별화 절차.',
    penaltyRisk: '부정확한 AI 결과물로 인한 고객 피해 방지',
    templateDraft: `# QP-AI-05 AI 결과물 정확성 검증 절차서
1. 골든 테스트셋(Golden Test Set) 구축: 최소 100건 이상의 정답 셋 확보
2. 정량 평가: 정확도(Accuracy), F1-Score, 환각 발생률 1% 미만 유지
3. 인간 피드백(RLHF/RLAIF): 전문가 검수단을 통한 표본 검증`
  },
  {
    id: 'p-ai-06',
    code: 'QP-AI-06',
    title: '장애·오류 대응 절차서',
    category: 'PROCEDURE',
    subCategory: 'AI·컨설팅 특화',
    level: 'LEVEL_2',
    clause: 'Clause 8.7',
    isStarter15: false,
    summary: 'SaaS 서버 다운, API 응답 오류 발생 시 긴급 복구 및 사후 원인보고(PIR)',
    legalAuditReason: '서비스 부적합 출력의 통제 및 고객 통보.',
    penaltyRisk: '장애 방치 시 SLA 위반 배상 리스크',
    templateDraft: `# QP-AI-06 장애 및 오류 대응 절차서
1. 장애 등급: P1(전면중단) 1시간 내 복구, P2(부분오류) 4시간 내 복구
2. 온콜(On-Call) 체계: 긴급 알림(Slack/SMS) 즉시 전파
3. 사후 분석(PIR): 48시간 이내 근본 원인 및 재발방지책 고객사 공유`
  },
  {
    id: 'p-ai-07',
    code: 'QP-AI-07',
    title: '외부 개발자 및 API 공급업체 관리 절차서',
    category: 'PROCEDURE',
    subCategory: 'AI·컨설팅 특화',
    level: 'LEVEL_2',
    clause: 'Clause 8.4.2',
    isStarter15: false,
    summary: '프리랜서 개발자 보안 서약, OpenAI/Anthropic/AWS 등 API SLA 모니터링',
    legalAuditReason: '클라우드 및 외부 공급업체 통제 강화.',
    penaltyRisk: '외부 종속성 오류로 인한 품질 이슈 사전 차단',
    templateDraft: `# QP-AI-07 외부 개발자 및 API 공급사 관리 절차서
1. 외부 개발자: 소스코드 접근 권한 최소화 및 비밀유지서약서 필수 체결
2. API 서비스 모니터링: 공급사 가용성(99.9% 이상) 및 비용 한도 알림 설정
3. 대체 공급선: 주력 API 장애 시 즉시 전환 가능한 Fallback 모델 사전 구성`
  },

  // =================================================================
  // 3. 반드시 남겨야 하는 주요 기록 (7대 영역 실전 증빙)
  // =================================================================
  // [영역 1: 경영 및 목표]
  {
    id: 'r-01',
    code: 'QR-01-TARGET',
    title: '품질목표 실적관리표',
    category: 'RECORD',
    subCategory: '경영 및 목표',
    level: 'LEVEL_4',
    clause: 'Clause 6.2',
    isStarter15: true,
    summary: '분기별 품질목표 달성 여부 기록 및 미달 시 원인 분석표',
    legalAuditReason: '심사 시 품질목표가 형식적인지 실제 측정하는지 검증.',
    penaltyRisk: '목표만 있고 실적 기록 없으면 즉시 부적합',
    templateDraft: `# 2024년도 품질목표 분기별 실적관리표
- 1분기: 고객만족도 91.5점 (목표: 90점) -> 달성
- 2분기: 납기준수율 99.1% (목표: 98%) -> 달성
- 3분기: AI 모델 환각률 0.8% (목표: 1% 이하) -> 달성
- 4분기: 전사 교육시간 1인당 42시간 -> 달성`
  },
  {
    id: 'r-02',
    code: 'QR-02-MR',
    title: '최고경영자 경영검토 회의록',
    category: 'RECORD',
    subCategory: '경영 및 목표',
    level: 'LEVEL_4',
    clause: 'Clause 9.3',
    isStarter15: true,
    summary: '대표이사 주재 전사 품질 성과 보고 및 의사결정 회의록 (서명 날인)',
    legalAuditReason: 'ISO 9001 본심사 통과의 절대 필수 서류.',
    penaltyRisk: '경영검토 회의록 미비 시 심사 탈락',
    templateDraft: `# 2024년도 최고경영자 경영검토 회의록
- 일시: 2024-05-28 14:00~16:00 | 장소: 본사 대회의실
- 참석자: 대표이사 Peter(서명), QMR, 사업팀장, 개발팀장, QA팀장
- 주요 안건 및 결정 사항:
  1) 2024 기후변화 개정안 검토 완료 -> 전사 페이퍼리스 및 저전력 AI 클라우드 전환 승인
  2) 내부감사 지적사항 2건(교육기록 보관 지연) 시정조치 완료 확인
  3) 차년도 AI R&D 투자 예산 2억원 확정`
  },

  // [영역 2: 고객 및 프로젝트]
  {
    id: 'r-03',
    code: 'QR-03-CONTRACT',
    title: '계약검토서 및 요구사항 정의서',
    category: 'RECORD',
    subCategory: '고객 및 프로젝트',
    level: 'LEVEL_4',
    clause: 'Clause 8.2.3',
    isStarter15: false,
    summary: '고객 프로젝트 수주 전 기술 타당성 및 리소스 사전 검토표',
    legalAuditReason: '고객 요구사항 검토의 증거 보존.',
    penaltyRisk: '무리한 계약으로 인한 납품 실패 방지',
    templateDraft: `# 프로젝트 계약 사전 검토서
- 고객사: (주)한국스마트제조 | 프로젝트명: AX 생성형 매뉴얼 챗봇 구축
- 검토 결과: 납기(3개월) 적정, 기술 스택(RAG + LLM) 적합, 개발 인력 가용 확인 -> 승인`
  },
  {
    id: 'r-04',
    code: 'QR-04-ACCEPT',
    title: '중간·최종 검수확인서 및 납품 승인기록',
    category: 'RECORD',
    subCategory: '고객 및 프로젝트',
    level: 'LEVEL_4',
    clause: 'Clause 8.6',
    isStarter15: false,
    summary: '고객사 담당자의 정식 서명 날인이 포함된 완료 검수확인서',
    legalAuditReason: '서비스가 정당하게 인도되었음을 입증하는 법적 증거.',
    penaltyRisk: '고객 인수증 누락 시 서비스 완결 입증 불가',
    templateDraft: `# 최종 프로젝트 검수 및 인수확인서
- 발주처: (주)한국스마트제조 검수책임자 홍길동 부장 (인)
- 당사: (주)네오앤피터 PM 김철수 차장 (인)
- 검수 일자: 2024-08-15
- 검수 결과: 요구 기능 25종 전수 정상 동작 확인 및 최종 납품 승인함.`
  },
  {
    id: 'r-05',
    code: 'QR-05-CS',
    title: '고객 만족도 조사 결과표 및 불만 처리대장',
    category: 'RECORD',
    subCategory: '고객 및 프로젝트',
    level: 'LEVEL_4',
    clause: 'Clause 9.1.2',
    isStarter15: true,
    summary: '연간 고객 만족도 설문 취합본 및 고객 문의/불만 해결 이력',
    legalAuditReason: '고객 중심 경영시스템의 실질적 작동 증거.',
    penaltyRisk: '고객 피드백 증빙 미보유 시 지적',
    templateDraft: `# 2024년도 상반기 고객 만족도 조사 결과 분석표
- 조사 대상: 완료 프로젝트 8개사
- 종합 만족도: 93.4점 (매우 우수)
- 고객 피드백: "AI 응답 속도가 빠르고 맞춤형 튜닝이 만족스러움. 단, 관리자 대시보드 기능 보강 요망."
- 조치: 3분기 정기 업데이트에 대시보드 통계 기능 추가 반영`
  },

  // [영역 3: 설계 및 개발]
  {
    id: 'r-06',
    code: 'QR-06-DEV',
    title: '설계 검토·테스트 결과서 및 산출물 승인기록',
    category: 'RECORD',
    subCategory: '설계·개발',
    level: 'LEVEL_4',
    clause: 'Clause 8.3.4',
    isStarter15: false,
    summary: '기능명세서, 테스트케이스 수행 결과서, 최종 릴리스 승인서',
    legalAuditReason: '설계 검증 및 유효성 확인 기록 보존 의무.',
    penaltyRisk: '테스트 증빙 부재 시 개발 프로세스 부적합',
    templateDraft: `# AI 솔루션 통합 테스트 결과서
- 테스트 일시: 2024-07-20 | 테스트 총괄: QA팀장
- 수행 항목: 120개 테스트케이스 (기능 90건, 보안 15건, 부하 15건)
- 결과: 통과 118건, 경미 결함 2건 즉시 수정 완료 -> 최종 릴리스 승인 (Pass)`
  },

  // [영역 4: 구매 및 외주]
  {
    id: 'r-07',
    code: 'QR-07-VENDOR',
    title: '공급업체(외주업체) 선정평가표 및 정기평가 기록',
    category: 'RECORD',
    subCategory: '구매·외주',
    level: 'LEVEL_4',
    clause: 'Clause 8.4.1',
    isStarter15: true,
    summary: '외주 협력사 및 클라우드 공급업체 등록 명부 및 연간 평가표',
    legalAuditReason: '외주 품질 리스크 통제 증빙.',
    penaltyRisk: '무평가 협력업체 외주 발주 시 중대 결함',
    templateDraft: `# 2024년도 협력업체 정기 평가표
- 대상 업체: (주)클라우드테크 (클라우드 인프라 운영 외주)
- 평가 항목: 기술력(30), 납기준수(30), 보안관리(20), 가격(20)
- 종합 점수: 92점 (우수 협력업체로 재계약 승인)`
  },

  // [영역 5: 인력 및 교육]
  {
    id: 'r-08',
    code: 'QR-08-EDU',
    title: '연간 교육계획 및 임직원 교육훈련 결과기록',
    category: 'RECORD',
    subCategory: '인력 및 교육',
    level: 'LEVEL_4',
    clause: 'Clause 7.2',
    isStarter15: false,
    summary: '사내외 직무/품질/보안 교육 참석 서명부 및 수료증',
    legalAuditReason: '직무 역량 교육 이수 증빙 보존.',
    penaltyRisk: '교육 기록 누락 시 인적자원 관리 부적합',
    templateDraft: `# 2024년도 ISO 9001 사내 품질 실무 교육 결과보고서
- 일시: 2024-04-10 (4시간) | 강사: 품질경영팀장
- 교육 내용: 프로세스 접근법, 2024 기후변화 개정사항 및 내부감사 대응
- 참석 인원: 전 임직원 15명 전원 참석 (서명부 첨부 완료)`
  },

  // [영역 6: 부적합 및 개선]
  {
    id: 'r-09',
    code: 'QR-09-CAR',
    title: '부적합 보고서 및 시정조치 요구서 (CAR)',
    category: 'RECORD',
    subCategory: '부적합 및 개선',
    level: 'LEVEL_4',
    clause: 'Clause 10.2',
    isStarter15: true,
    summary: '문제 발생 시 근본 원인 분석, 단기 시정, 근본 방지 대책 및 유효성 확인서',
    legalAuditReason: 'ISO 사후심사 및 갱신심사에서 심사원이 가장 꼼꼼하게 보는 시정조치 이력.',
    penaltyRisk: '부적합이 1건도 없다고 하면 심사원이 조작으로 의심함 (최소 1~2건의 자체 개선 이력 필수)',
    templateDraft: `# 시정조치 요구서 (Corrective Action Request: CAR-2024-01)
1. 부적합 내용: 고객 요구사항 변경 시 구두로만 협의하여 배포본에 누락 발생 (2024-05-02)
2. 근본 원인: 변경관리 요청서 양식 미사용 및 담당자 절차 숙지 미흡
3. 시정조치:
   - 해당 기능 48시간 내 패치 배포 및 고객사 사과문 발송
   - 전사 프로젝트 매니저 대상 '요구사항 변경관리 절차' 특별 재교육 실시
4. 유효성 검증(1개월 후): 이후 5개 프로젝트에서 변경관리 기록 100% 정상 준수 확인 (종결 승인)`
  },

  // [영역 7: 내부심사]
  {
    id: 'r-10',
    code: 'QR-10-AUDIT',
    title: '연간 내부심사 계획서 및 심사 결과보고서 (체크리스트 포함)',
    category: 'RECORD',
    subCategory: '내부심사',
    level: 'LEVEL_4',
    clause: 'Clause 9.2',
    isStarter15: true,
    summary: '자체 내부감사 체크리스트 질의응답 기록, 발견된 관찰사항 및 종결 보고서',
    legalAuditReason: '최초 인증 본심사 수검을 위해 최소 1회 완결 필수.',
    penaltyRisk: '내부감사 보고서 없으면 본심사 수검 절대 불가',
    templateDraft: `# 2024년도 제1차 전사 내부품질심사 결과보고서
- 심사 일자: 2024-05-20 ~ 05-21 (2일간)
- 심사팀: 선임심사원 이영진 과장, 심사원 박소연 대리
- 심사 대상: 경영진, 사업팀, 개발팀, QA팀, 경영지원팀 전 부서
- 심사 결과:
  - 적합: 28개 항목
  - 시정조치 권고(Minor): 2건 (교육 참석부 보관함 라벨링 미흡, 외주업체 재평가 일정 지연)
  - 지적사항 전건 시정조치 완료 확인 및 최고경영자 보고 완료.`
  }
];

// 네오앤피터 15종 우선 세트 필터 헬퍼
export function getStarter15Documents() {
  return ISO_9001_MASTER_BLUEPRINT.filter(d => d.isStarter15);
}

// 카테고리별 문서 필터 헬퍼
export function getBlueprintByCategory(catId = 'ALL') {
  if (catId === 'ALL') return ISO_9001_MASTER_BLUEPRINT;
  if (catId === 'STARTER_15') return getStarter15Documents();
  return ISO_9001_MASTER_BLUEPRINT.filter(d => d.category === catId);
}
