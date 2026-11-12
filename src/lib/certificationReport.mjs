import {INTERESTS, validateGrowthDraft} from './growthIntake.mjs';

export const CONSULTATION_URL = 'https://honestone.kr/contact';
export const SMART_FACTORY_NOTICE = 'https://www.smart-factory.kr/usr/np/nm/ma/noticeMatterDetail?bbsCd=00000002&bbsSn=1207&bizClsfCd=88888888';

export function certificationReport(draft) {
  const data = validateGrowthDraft(draft);
  if (data.kind === 'program') throw new Error('인증 준비 정보를 확인해 주세요.');

  const {label, steps} = INTERESTS[data.interest];
  const missing = [];
  if (['domesticProduct', 'internationalProduct'].includes(data.interest) && !data.certificationTarget) {
    missing.push('제품명·모델·사용 용도를 확인하세요.');
  }
  if (['internationalCertification', 'internationalProduct'].includes(data.interest) && !data.targetMarket) {
    missing.push('진출 대상 국가 또는 거래처 요구사항을 확인하세요.');
  }
  return {
    title: '인증 준비 리포트',
    scope: label,
    facts: [
      ['회사', data.companyName],
      ['업종', data.industry],
      ['직원 수', data.employees],
      ['소재지', data.region],
      ['인증 준비 대상', data.certificationTarget],
      ['대상 시장', data.targetMarket],
    ].filter(([, value]) => value),
    steps,
    missing,
    note: '입력 정보에 따른 사전 준비 안내입니다. 적용 요건과 시험·심사 절차는 공식 기준 및 해당 기관에서 확인하세요.',
  };
}

export function reportText(report) {
  return [
    `써티멘토 · ${report.title}`,
    '',
    `관심 분야: ${report.scope}`,
    ...report.facts.map(([label, value]) => `${label}: ${value}`),
    '',
    '먼저 확인할 일',
    ...report.steps.map((step, index) => `${index + 1}. ${step}`),
    ...(report.missing.length ? ['', '추가로 확인할 정보', ...report.missing.map(item => `- ${item}`)] : []),
    '',
    report.note,
    `전문가 검토·인증 준비 용역 문의: ${CONSULTATION_URL}`,
  ].join('\n');
}
