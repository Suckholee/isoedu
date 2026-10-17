import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateComplianceReadiness, evaluateAllStandardsOverview } from '../src/lib/complianceEngine.js';

test('compliance engine: handles empty documents gracefully', () => {
  const result = evaluateComplianceReadiness([], 'ISO_9001');
  assert.equal(result.readinessScore, 0);
  assert.equal(result.readyCount, 0);
  assert.ok(result.totalRequired > 0);
  assert.equal(result.missingCount, result.totalRequired);
  assert.equal(result.requirements.every(r => r.status === 'MISSING'), true);
});

test('compliance engine: calculates score and expiring status correctly', () => {
  const mockDocs = [
    {
      id: 'doc-1',
      code: 'QMS-P-001',
      title: '문서 및 기록관리 절차서',
      standards: ['ISO_9001'],
      clauseNumber: '7.5',
      dDay: 15 // Expiring (< 30)
    },
    {
      id: 'doc-2',
      code: 'QMS-M-001',
      title: '품질경영매뉴얼',
      standards: ['ISO_9001'],
      clauseNumber: '4.3',
      dDay: 120 // Ready (> 30)
    }
  ];

  const result = evaluateComplianceReadiness(mockDocs, 'ISO_9001');
  assert.ok(result.readyCount >= 2);
  assert.ok(result.expiringCount >= 1);
  assert.ok(result.readinessScore > 0);
});

test('compliance engine: evaluates all standards overview without crashing', () => {
  const overview = evaluateAllStandardsOverview([]);
  assert.ok(Array.isArray(overview));
  assert.ok(overview.length > 0);
  for (const std of overview) {
    assert.ok(std.code);
    assert.equal(typeof std.readinessScore, 'number');
  }
});
