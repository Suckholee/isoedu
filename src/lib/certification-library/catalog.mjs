import 'server-only';
import { policyCatalog } from '../meeting/documentPolicies.mjs';
import { CERTIFICATIONS, preparationDocuments } from '../curation/catalog.mjs';

const certification = Object.fromEntries(CERTIFICATIONS.map(item => [item.id, item]));
const ventureUrl = type => `https://www.smes.go.kr/venturein/institution/requireGuide?rgCd=${type}`;

const isoSteps = [
  '확인할 사업장과 업무 범위를 정하고, 거래처가 요구하는 규격과 판본을 확인합니다.',
  '담당자와 운영 기준을 정한 뒤 실제 업무 기록을 모읍니다.',
  '내부심사와 경영검토를 진행하고, 발견된 문제의 조치 결과를 확인합니다.',
  '외부 인증기관에 심사 범위와 최신 요구 자료를 확인합니다.',
];

const iso = (id, name, summary, audience, evidence, url) => ({
  id, name, category: 'international', type: '경영시스템', summary, audience,
  steps: isoSteps, evidence, source: { name: 'ISO 공식 안내', url },
  caution: '인증 심사와 발급은 외부 인증기관에서 진행합니다. 적용 판본과 전환 일정은 기관에 확인하세요.',
});

const ventureSteps = [
  '벤처확인시스템에서 신청 유형과 대상 요건을 확인합니다.',
  '기업 기본정보와 선택한 유형의 증빙을 모아 최신 양식으로 정리합니다.',
  '벤처확인시스템에서 신청하고 평가기관의 보완 요청에 대응합니다.',
];

const researchSteps = [
  '회사 규모와 신청 유형에 맞는 전담인력 기준을 확인합니다.',
  '연구 공간과 기자재를 구분하고 인력의 자격·재직 증빙을 준비합니다.',
  '신고관리시스템에서 신규설립을 신고하고 보완 사항을 확인합니다.',
];

const domestic = (id, name, summary, audience, steps, evidence, sourceName, url, caution) => ({
  id, name, category: 'domestic', type: '기업 확인·인정', summary, audience, steps, evidence,
  source: { name: sourceName, url }, caution,
});

const product = (id, name, category, summary, audience, steps, evidence, sourceName, url, caution) => ({
  id, name, category, type: '제품 적합성', summary, audience, steps, evidence,
  source: { name: sourceName, url }, caution,
});

export const certificationGuides = [
  domestic('VENTURE_GROWTH', '벤처기업확인 · 혁신성장', '기술 혁신성과 사업 성장성을 평가하는 벤처확인 유형입니다.',
    '제품·서비스의 기술 차별성과 시장 성장 계획을 증빙하려는 중소기업',
    ventureSteps, ['기술과 제품의 차별점', '시장·고객 검증 자료', '사업계획서 및 기업 증빙'],
    '벤처확인시스템 · 혁신성장유형', ventureUrl('C'), '기술과 사업 자료는 평가 근거로 활용됩니다. 최신 요건과 제출 항목은 공식 유형별 안내에서 확인하세요.'),
  domestic('VENTURE_INVEST', '벤처기업확인 · 벤처투자', '적격투자기관의 투자 실적을 바탕으로 신청하는 유형입니다.',
    '투자기관, 투자 형태, 투자금액과 자본금 비율을 확인할 수 있는 중소기업',
    ventureSteps, ['투자 계약과 납입 증빙', '투자기관 확인 자료', '등기·주주 및 자본금 자료'],
    '벤처확인시스템 · 벤처투자유형', ventureUrl('A'), '투자 인정 범위와 예외 요건을 신청 유형 안내에서 확인하세요.'),
  domestic('VENTURE_RESEARCH', '벤처기업확인 · 연구개발', '연구 조직과 연구개발 투자 및 사업 성장성을 검토하는 유형입니다.',
    '연구개발 조직과 연구개발비를 증빙할 수 있는 중소기업',
    ventureSteps, ['연구소·전담부서 등 해당 조직 증빙', '연구개발비 산정 및 회계 근거', '사업과 성장 계획'],
    '벤처확인시스템 · 연구개발유형', ventureUrl('B'), '인정되는 연구 조직, 비용 산정 기간과 예외는 공식 요건을 확인하세요.'),
  domestic('VENTURE_PRE', '벤처기업확인 · 예비벤처', '창업을 준비하는 신청자의 기술과 사업 계획을 평가하는 유형입니다.',
    '법인 설립 또는 사업자등록을 준비 중인 예비창업자',
    ventureSteps, ['창업자와 팀의 역량', '기술·제품 개발 계획', '시장 진입 및 사업화 계획'],
    '벤처확인시스템 · 예비벤처유형', ventureUrl('D'), '신청 시점의 창업 상태와 확인 후 절차를 공식 안내에서 확인하세요.'),
  domestic('INNOBIZ', '이노비즈', '기업의 기술혁신 체계와 기술사업화 역량을 평가합니다.',
    '개발 실적과 기술사업화 계획을 갖춘 중소기업',
    ['기업의 업력·업종과 신청 요건을 확인합니다.', '온라인 자가진단을 진행하고 기술사업화 자료를 정리합니다.', '현장평가에 필요한 기술·경영 자료를 준비합니다.'],
    ['기술사업계획', '연구개발·특허·기술 실적', '제품 사업화와 매출 자료'],
    '이노비즈 신청 · 제도 소개', 'https://www.innobiz.net/authen/authen1.asp', '업력 인정과 제외 조건은 신청 기관의 최신 안내를 확인하세요.'),
  domestic('MAINBIZ', '메인비즈', '경영혁신 활동과 성과를 평가하는 제도입니다.',
    '조직 운영, 마케팅 또는 업무 개선 활동과 성과를 설명할 수 있는 중소기업',
    ['공식 신청 요건과 제외 대상을 확인합니다.', '자가진단을 하고 경영혁신 과제의 실행 자료를 정리합니다.', '현장평가에 대비해 개선 전후의 지표와 근거를 준비합니다.'],
    ['회사 현황과 조직 자료', '경영 개선 활동과 담당자', '고객·업무 개선 및 성과 기록'],
    '메인비즈 · 제도 소개', certification.MAINBIZ.url, '평가용 자료와 실제 제출 서류는 공식 안내를 대조하세요.'),
  domestic('RESEARCH_LAB', '기업부설연구소', '연구 조직의 전담인력과 공간 등 신고 요건을 확인합니다.',
    '기업 안에 독립적인 연구 조직을 갖추려는 기업',
    researchSteps, ['연구 조직과 전담인력 자료', '연구 공간 도면·사진', '연구시설과 기자재 목록'],
    '연구소·전담부서 신고관리시스템', certification.RESEARCH_LAB.url, '기업 규모와 창업 유형에 따라 전담인력 요건이 달라질 수 있습니다.'),
  domestic('RESEARCH_DEPARTMENT', '연구개발전담부서', '연구개발전담부서의 인력·공간·시설 요건을 확인합니다.',
    '기업 내부에서 연구를 전담하는 부서를 설치하려는 기업',
    researchSteps, ['전담부서 조직도', '연구전담요원 자격과 재직 근거', '연구 공간과 기자재'],
    '연구소·전담부서 신고관리시스템', certification.RESEARCH_DEPARTMENT.url, '전담요원 수와 함께 업무 전담 여부 및 물적 요건을 확인하세요.'),
  domestic('WOMEN_ENTERPRISE', '여성기업확인', '여성이 소유하고 실질적으로 경영하는 기업임을 확인하는 제도입니다.',
    '공공구매나 여성기업 지원제도에 제출할 확인서를 준비하는 기업',
    ['사업자 형태에 맞는 소유·경영 요건을 확인합니다.', '공공구매종합정보망에 기업 정보를 등록하고 서류를 제출합니다.', '서류 검토 및 현장실사 안내를 확인합니다.'],
    ['기업 형태와 대표자 정보', '소유·출자 관계 증빙', '실제 경영 활동 근거'],
    '여성기업 종합정보 포털 · 신청 안내', 'https://womanbiz.wbiz.or.kr/company/document.do', '사업자 형태별 제출 서류는 신청 안내를 확인하세요.'),
  iso('ISO_9001', 'ISO 9001 · 품질경영', '고객 요구와 제품·서비스 품질을 일관되게 관리합니다.',
    '품질 기준, 생산·서비스 절차와 고객 불만 대응을 체계화하려는 조직',
    ['업무 흐름과 책임자', '품질 목표와 검사·고객 대응 기록', '부적합 및 개선 기록'], 'https://www.iso.org/standards/popular/iso-9000-family'),
  iso('ISO_14001', 'ISO 14001 · 환경경영', '사업 활동의 환경 영향과 관리 절차를 점검합니다.',
    '환경 영향과 관련 의무를 파악하고 개선 실적을 관리하려는 조직',
    ['환경 영향과 관련 의무 목록', '환경 목표·측정 기록', '비상 대응과 개선 기록'], 'https://www.iso.org/standards/popular/iso-14000-family'),
  iso('ISO_45001', 'ISO 45001 · 안전보건', '작업장의 위험요인을 찾고 안전보건을 체계적으로 관리합니다.',
    '작업장 위험과 근로자 참여를 관리하는 조직',
    ['작업별 위험성평가', '근로자 참여 및 교육 기록', '사고 조사·개선 조치'], 'https://www.iso.org/insights/iso-45001-explained'),
  iso('ISO_27001', 'ISO/IEC 27001 · 정보보호', '정보자산의 위험을 식별하고 관리하는 체계를 점검합니다.',
    '고객 정보나 핵심 시스템의 보안을 체계적으로 관리하려는 조직',
    ['정보자산과 위험 평가', '통제 적용 선언서 및 처리 계획', '접근권한·사고 대응 기록'], 'https://www.iso.org/standard/27001'),
  iso('ISO_13485', 'ISO 13485 · 의료기기 품질', '의료기기의 수명주기와 품질 관리 체계를 점검합니다.',
    '의료기기 설계·제조 등 관련 업무의 품질 체계를 운영하는 조직',
    ['제품 범위와 적용 규제 목록', '설계·공급업체·생산관리 기록', '추적성·불만·개선 기록'], 'https://www.iso.org/iso-13485-medical-devices.html'),
  iso('ISO_50001', 'ISO 50001 · 에너지경영', '에너지 사용을 측정하고 에너지 성과를 개선합니다.',
    '사업장 에너지 효율과 소비를 지속적으로 관리하려는 조직',
    ['에너지 사용 현황과 주요 사용처', '기준선·성과지표', '개선계획 및 측정 기록'], 'https://www.iso.org/standard/69426.html'),
  product('KC_PRODUCT', 'KC · 전기·생활·어린이제품', 'domestic', '국내 판매 전 제품의 안전관리 대상 여부와 해당 절차를 확인합니다.',
    '국내에서 전기용품·생활용품·어린이제품을 제조하거나 수입하는 기업',
    ['제품의 모델·용도·대상 연령을 정리합니다.', '품목별 안전인증·안전확인·공급자적합성확인 등 적용 절차를 확인합니다.', '시험·신고 및 표시사항을 해당 기관 안내에 맞춰 준비합니다.'],
    ['제품 사양과 모델 목록', '부품 및 사용설명서', '시험자료와 표시 도안'],
    '제품안전정보센터 · 품목별 안전 기준', 'https://www.safetykorea.kr/policy/standard', '무선·전자파 등 별도 적용 제도가 있는 제품은 관할 기관의 안내를 함께 확인하세요.'),
  product('EU_CE', 'CE 마킹 · 유럽', 'international', '유럽 시장에 공급하는 해당 제품의 적합성 평가와 표시 절차입니다.',
    '유럽 시장에 제품을 공급하며 제품별 CE 적용 여부를 확인하려는 제조사',
    ['제품의 용도와 대상 시장을 정하고 적용되는 EU 법령을 식별합니다.', '적합성 평가 절차와 지정기관 참여 필요 여부를 확인합니다.', '기술문서를 작성하고 해당 제품에 적용되는 적합성 선언과 표시를 준비합니다.'],
    ['제품 사양과 적용 법령·표준', '시험·위험 평가 및 기술문서', '해당 제품의 적합성 선언과 표시 자료'],
    '유럽위원회 · 제조사 CE 안내', 'https://single-market-economy.ec.europa.eu/single-market/goods/ce-marking/manufacturers_en',
    '제품별 법령에 따라 절차와 지정기관 필요 여부가 달라집니다.'),
].map(guide => {
  const policyId = guide.type === '경영시스템' ? 'ISO_9001' : guide.id;
  const policy = policyCatalog.types[policyId];
  const checklist = policy ? policy.documents : preparationDocuments(policyId);
  return { ...guide, checklist, preparationSource: policy?.url || checklist[0]?.sourceUrl };
});
