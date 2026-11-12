import test from 'node:test';
import assert from 'node:assert/strict';
import {certificationReport, CONSULTATION_URL, reportText} from '../src/lib/certificationReport.mjs';
import {growthTaskPayload, parseGrowthIntake} from '../src/lib/growthIntake.mjs';

const draft = {
  id: '11111111-1111-4111-8111-111111111111',
  companyName: '샘플 제조사',
  industry: '제조업',
  employees: '5~9명',
  interest: 'internationalProduct',
};

test('the public report records supplied product and market and flags missing inputs', () => {
  const empty = certificationReport(draft);
  assert.equal(empty.scope, '해외 제품인증');
  assert.equal(empty.missing.length, 2);
  assert.ok(!empty.facts.some(([label]) => label === '대상 시장'));

  const inputs = {...draft, certificationTarget: '포장 장비', targetMarket: '유럽연합'};
  const report = certificationReport(inputs);
  assert.equal(report.missing.length, 0);
  const download = reportText(report);
  for (const item of ['샘플 제조사', '포장 장비', '유럽연합', '시험', CONSULTATION_URL]) {
    assert.ok(download.includes(item));
  }
  const payload = growthTaskPayload(inputs, {userId: 'member', companyId: 'authorized', origin: 'https://example.com'});
  assert.equal(parseGrowthIntake(payload.notes).targetMarket, '유럽연합');
  assert.equal(parseGrowthIntake(payload.notes).certificationTarget, '포장 장비');
});

test('legacy drafts still open and domestic reports do not require a foreign market', () => {
  const report = certificationReport({...draft, interest: 'domesticProduct', certificationTarget: '포장 장비'});
  assert.equal(report.missing.length, 0);
  assert.ok(!reportText(report).includes('진출 대상 국가'));
});
