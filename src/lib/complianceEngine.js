// ========================================================
// ISO Statutory Compliance & Readiness Analysis Engine
// Evaluates company document holdings against ISO Mandatory Requirements
// ========================================================

import { ISO_MANDATORY_REQUIREMENTS, ISO_STANDARDS_INFO } from './isoRequirementsData.js';

export function evaluateComplianceReadiness(documents = [], standardCode = 'ISO_9001', companyId = null) {
  // 1. 해당 규격의 법정 필수 요건 필터링
  const standardReqs = ISO_MANDATORY_REQUIREMENTS.filter(r => r.standard === standardCode);

  // 2. 현재 활성 테넌트의 문서 필터링 (companyId가 있으면 매칭, 없으면 전체 매칭)
  const tenantDocs = companyId 
    ? documents.filter(d => !d.companyId || d.companyId === companyId)
    : documents;

  let readyCount = 0;
  let missingCount = 0;
  let expiringCount = 0;

  // 3. 각 필수 요건에 대해 기업 문서 매칭 분석
  const evaluatedReqs = standardReqs.map(req => {
    // 매칭 우선순위:
    // 1) 문서 코드가 일치하는 경우 (예: QMS-P-001, QM-01)
    // 2) 코드 패턴이 포함되는 경우 (예: CERT-9001)
    // 3) 조항 번호 및 규격 코드가 일치하는 경우
    const matchedDoc = tenantDocs.find(doc => {
      const codeUpper = (doc.code || '').toUpperCase();
      const defUpper = (req.defaultCode || '').toUpperCase();
      const patternUpper = (req.codePattern || '').toUpperCase();

      if (codeUpper === defUpper) return true;
      if (patternUpper && codeUpper.includes(patternUpper)) return true;

      const standards = doc.standards || [];
      const hasStandard = standards.includes(req.standard) || standards.includes('ALL');
      const hasClause = doc.clauseNumber && (doc.clauseNumber === req.clause || doc.clauseNumber.includes(req.clause));
      return hasStandard && hasClause;
    });

    let status = 'MISSING'; // 'READY' | 'EXPIRING' | 'MISSING'
    if (matchedDoc) {
      if (matchedDoc.dDay !== undefined && matchedDoc.dDay <= 30) {
        status = 'EXPIRING';
        expiringCount++;
        readyCount++;
      } else {
        status = 'READY';
        readyCount++;
      }
    } else {
      missingCount++;
    }

    return {
      ...req,
      matchedDoc: matchedDoc || null,
      status,
    };
  });

  const totalRequired = standardReqs.length;
  const readinessScore = totalRequired > 0 ? Math.round((readyCount / totalRequired) * 100) : 0;

  // 4. Annex SL 조항 그룹별 분류
  const groups = [];
  const groupMap = new Map();

  evaluatedReqs.forEach(item => {
    const grp = item.clauseGroup || '일반 규격 요건';
    if (!groupMap.has(grp)) {
      groupMap.set(grp, []);
      groups.push({ name: grp, items: groupMap.get(grp) });
    }
    groupMap.get(grp).push(item);
  });

  return {
    standardCode,
    standardInfo: ISO_STANDARDS_INFO.find(s => s.code === standardCode) || ISO_STANDARDS_INFO[0],
    totalRequired,
    readyCount,
    missingCount,
    expiringCount,
    readinessScore,
    requirements: evaluatedReqs,
    groups
  };
}

// 전사 전체 규격 종합 요약 계산
export function evaluateAllStandardsOverview(documents = [], companyId = null) {
  return ISO_STANDARDS_INFO.map(std => {
    const analysis = evaluateComplianceReadiness(documents, std.code, companyId);
    return {
      ...std,
      readinessScore: analysis.readinessScore,
      readyCount: analysis.readyCount,
      totalRequired: analysis.totalRequired,
      missingCount: analysis.missingCount,
      expiringCount: analysis.expiringCount
    };
  });
}
