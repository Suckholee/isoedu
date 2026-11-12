export const SOURCE_FINGERPRINTS = {"guidebook-2026": "3b1fde4cd8ba5f908e5b68b3f2f64bd79cf67a0510e48076e83a3026af2480a0", "growth-guideline": "0547ce08382195615d561f236c13284c94f9fc527c6481e5df5bb0a2709e85d0"};
export const VENTURE_VERSION = 'venture-growth-2026-11-05-v1';
export const VENTURE_GUIDE_URL = 'https://www.smes.go.kr/venturein/institution/requireGuide?rgCd=C';
export const VENTURE_BOOK_URL = 'https://www.smes.go.kr/venturein/board/viewArchBoard?menuId=4080000&bbsSn=5861';
// 2026 guidebook, printed pp.34–35 (PDF spread 21). These are not character limits.
export const PLAN_SECTIONS = [
  ['problem','개발 배경 및 필요성','고객의 불편과 확인 근거. 재확인은 기존 기술의 개선·신규 개발 배경.'],
  ['solution','솔루션으로서의 기술 소개','핵심 기능·사업모델·차별점과 이를 확인할 증빙.'],
  ['development','기술개발','현재까지의 개발 경과와 향후 3년 목표·인력·일정.'],
  ['market','목표시장 및 고객','목표 고객, 시장 범위·규모의 출처와 향후 3년 전망.'],
  ['competition','경쟁사 분석','최대 3개 경쟁사의 특장점과 비교 근거.'],
  ['expansion','시장진입 및 확대 전략','현재 추진 경과와 향후 3년의 단계별 고객 확보 계획.'],
  ['funding','자금조달 계획','확보된 자금과 계획 중인 자금을 구분하고 향후 3년 조달·사용 계획.'],
  ['team','팀 구성','대표자 경력·기업가정신 경험, 연구조직·기술인력 현황.'],
  ['researchCost','연구개발비','신청일 기준 당기 연구개발비. 확인된 금액과 산정 근거.'],
  ['researchResults','기술개발 실적','정부·공동·자체 연구개발의 진행·완료 실적과 증빙.'],
  ['ip','지식재산권 보유 현황','관련 지식재산권의 출원·등록 구분. 재확인은 최근 3년 추가분.'],
  ['partners','외부 협업 실적','신청 기술 관련 협약·공동사업. 재확인은 최근 3년 신규 실적.'],
  ['performance','사업성과','재확인 기업만: 선택한 2개 지표의 최근 3년 실적. 신규 신청은 해당 없음.'],
].map(([id,title,guide])=>({id,title,guide}));
export const DOCUMENT_TYPES = {
  business_plan: {title:'혁신성장 사업계획서', sections:PLAN_SECTIONS},
  development_plan: {title:'기술개발 추진계획서', sections:PLAN_SECTIONS.filter(s=>['problem','solution','development','team','funding'].includes(s.id))},
};
const row=(key,title,group,guidance)=>({key:`venture_growth-${key}`,title,group,conditional:group!=='기본 서류',guidance});
export const OFFICIAL_DOCUMENTS = [
  row('sme-certificate','중소기업확인서','기본 서류','신청일에 유효한 확인서. 공식 시스템 자동 연계 여부를 신청 시 확인합니다.'),
  row('business-registration','사업자등록증','기본 서류','현재 사업자 정보와 일치하는 원본을 준비합니다.'),
  row('corporate-registry','법인등기부등본','해당 시 제출','법인: 말소사항 포함 등기사항전부증명서 제출용, 신청일 기준 2주 이내 발급.'),
  row('vat','부가가치세 과세표준증명원','기본 서류','최근 3개년. 업력이 짧으면 해당 기간 1·2개년 자료를 준비합니다.'),
  row('financial-statements','재무제표 또는 감사보고서','기본 서류','최근 3개년. 업력이 짧으면 해당 기간 자료를 준비합니다.'),
  row('employment-history','고용보험 사업장 취득자 명부','기본 서류','최근 3개년 각 연도 12월 말일 기준. 업력이 짧으면 해당 기간 자료.'),
  row('insurance-roster','4대보험 가입자 명부','기본 서류','전 직원 명부, 신청일 기준 2주 이내 발급.'),
  row('shareholders','주주명부','해당 시 제출','법인사업자 필수. 신청일 기준 2주 이내 작성본.'),
  row('career-proof','대표자 경력 증빙','해당 시 제출','동종업계 경력 기재 시 경력증명서·국민연금 가입증명·건강보험 자격득실·고용보험 이력 중 택1.'),
  row('qualification','대표자 국가기술자격 증빙','해당 시 제출','자격 기재 시 국가기술자격증 사본 또는 취득사항 확인서 중 택1.'),
  row('research-organization','연구개발조직 인정서','해당 시 제출','인정받은 연구소·전담부서 보유 시. 신청일 기준 2주 이내 발급.'),
  row('research-tax-review','연구·인력개발비 사전심사 결과통지서','해당 시 제출','이 통지서로 연구개발비를 인정받고자 하는 경우.'),
  row('export-performance','수출실적증명서','해당 시 제출','재확인 기업의 사업성과에서 수출액을 선택한 경우.'),
  row('innobiz','이노비즈확인서','해당 시 제출','현재 공개 구비서류 목록에 기재. 2026 가이드북 추가목록에는 없어 해당 여부·제출 조건을 기관에 확인합니다.'),
  row('internal-research','내부 연구조직·업무분장 자료','현장 확인 자료','공인 연구조직 없이 기업 내부 연구조직으로 신청한 경우 조직도·업무분장 등.'),
  row('technical-staff','기술인력 학력·경력·자격 증빙','현장 확인 자료','기재한 기술인력 등급을 확인할 자료. 실제 증명서 원본을 준비합니다.'),
  row('research-evidence','연구개발 실적 증빙','현장 확인 자료','신청 기술과 관련된 협약서·결과보고서·연구노트 등.'),
  row('ip-evidence','지식재산권 증빙','현장 확인 자료','기재한 출원·등록 상태를 확인할 원부 등.'),
  row('collaboration','외부 협업 증빙','현장 확인 자료','관련 계약·협약·MOU·NDA 등 실제 체결 자료.'),
  row('service-metrics','서비스 성과 증빙','현장 확인 자료','재확인 시 선택한 서비스 지표의 집계 근거. MAU·전환율·총거래액 등.'),
];
export function officialRequestItems(){return OFFICIAL_DOCUMENTS.map(d=>({...d,guidance:`[${d.group}] ${d.guidance}\n공식 기준 ${VENTURE_VERSION}: ${VENTURE_GUIDE_URL}`}));}
export function sectionsToText(sections){return sections.map(s=>`${s.title}\n${s.content}`).join('\n\n');}

export function definitionForAi(ai={}){return ai.input?.type==='application_plan'&&ai.formDefinition?ai.formDefinition:DOCUMENT_TYPES[ai.input?.type]||DOCUMENT_TYPES.business_plan;}
