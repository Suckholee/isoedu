// ========================================================
// Cross-Project Document Reuse & Matching Engine
// Matches company's existing documents (ISO audits, corporate docs, R&D)
// against Government & Local Government Grant Requirements
// ========================================================

import { REQUIRED_DOCUMENTS_TEMPLATES } from './governmentProgramsData.js';

export function matchDocumentsForProgram(program, companyDocs = [], companyProfile = {}) {
  const templateKey = program?.requiredDocsTemplate || 'STANDARD_OVERSEAS_CERT';
  const checklist = REQUIRED_DOCUMENTS_TEMPLATES[templateKey] || REQUIRED_DOCUMENTS_TEMPLATES.STANDARD_OVERSEAS_CERT;

  let matchedCount = 0;
  let bonusPointsCount = 0;

  const evaluatedItems = checklist.map((reqItem) => {
    let bestMatch = null;
    let matchScore = 0;

    for (const doc of companyDocs) {
      let score = 0;
      const titleStr = (doc.title || doc.name || '').toLowerCase();
      const codeStr = (doc.code || '').toLowerCase();
      const descStr = (doc.description || '').toLowerCase();
      const clauseStr = (doc.clause || '').toLowerCase();
      const catStr = (doc.category || '').toLowerCase();

      // 1. Keyword match
      for (const kw of reqItem.matchKeywords) {
        const kwLower = kw.toLowerCase();
        if (titleStr.includes(kwLower)) score += 4;
        if (codeStr.includes(kwLower)) score += 3;
        if (descStr.includes(kwLower)) score += 2;
        if (clauseStr.includes(kwLower)) score += 2;
        if (catStr.includes(kwLower)) score += 2;
      }

      // 2. Category match
      if (reqItem.matchedCategory && (catStr.includes(reqItem.matchedCategory.toLowerCase()) || reqItem.matchedCategory.toLowerCase().includes(catStr))) {
        score += 2;
      }

      // 3. Special type match
      if (reqItem.reuseSourceType === 'EXISTING_ISO_CERT' && (catStr.includes('인증서') || codeStr.includes('cert') || titleStr.includes('인증서'))) {
        score += 5;
      }
      if (reqItem.reuseSourceType === 'EXISTING_QMS_MANUAL' && (codeStr.includes('qm') || catStr.includes('매뉴얼') || titleStr.includes('매뉴얼'))) {
        score += 5;
      }
      if (reqItem.reuseSourceType === 'EXISTING_PSST_PLAN' && (codeStr.includes('psst') || titleStr.includes('사업계획서') || titleStr.includes('계획서'))) {
        score += 6;
      }
      if (reqItem.reuseSourceType === 'EXISTING_CORPORATE_DOCS' && (titleStr.includes('정관') || titleStr.includes('주주명부') || titleStr.includes('취업규칙'))) {
        score += 5;
      }
      if (reqItem.reuseSourceType === 'EXISTING_EMPLOYEE_LIST' && (titleStr.includes('취업규칙') || titleStr.includes('교육훈련') || titleStr.includes('인사'))) {
        score += 4;
      }
      if (reqItem.reuseSourceType === 'EXISTING_FINANCIAL_STMT' && (titleStr.includes('재무') || titleStr.includes('손익') || titleStr.includes('예산') || titleStr.includes('연구개발비'))) {
        score += 4;
      }
      if (reqItem.reuseSourceType === 'EXISTING_TECH_SPEC' && (titleStr.includes('지침서') || titleStr.includes('절차서') || titleStr.includes('사양서') || titleStr.includes('도면'))) {
        score += 4;
      }

      if (score > matchScore) {
        matchScore = score;
        bestMatch = {
          ...doc,
          displayName: doc.title || doc.name || doc.code || '사내 보관 문서'
        };
      }
    }

    // Determine status based on matchScore
    if (bestMatch && matchScore >= 3) {
      matchedCount++;
      if (reqItem.type === 'BONUS') {
        bonusPointsCount += 5;
      }
      const folderName = bestMatch.category || '사내 문서함';
      return {
        ...reqItem,
        status: 'MATCHED_REUSED',
        statusLabel: '기존 구비 문서 자동 매핑됨 (재사용 100%)',
        statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        matchedDoc: bestMatch,
        reuseNote: `[${folderName}] 폴더의 "${bestMatch.displayName}" (${bestMatch.code || '기본'})를 본 지원사업 제출서류로 즉시 재사용합니다.`
      };
    }

    // Not matched in company docs
    if (reqItem.reuseSourceType === 'GOV_ISSUE_FRESH') {
      return {
        ...reqItem,
        status: 'GOV_ISSUE_FRESH',
        statusLabel: '행정기관 최신 발급 필요 (30일 이내)',
        statusColor: 'bg-amber-50 text-amber-700 border-amber-300',
        matchedDoc: null,
        reuseNote: `${reqItem.issuer}에서 최근 1개월 이내 발급된 원본 증명원이 필요합니다.`
      };
    }

    if (reqItem.reuseSourceType === 'NEW_VENDOR_QUOTATION') {
      return {
        ...reqItem,
        status: 'NEW_VENDOR_QUOTATION',
        statusLabel: '인증/시험기관 견적서 수령 필요',
        statusColor: 'bg-blue-50 text-blue-700 border-blue-300',
        matchedDoc: null,
        reuseNote: 'KTR, KTL, KCL 등 공인 시험기관 또는 심사기관 비교견적서(2곳 이상) 첨부 필요.'
      };
    }

    return {
      ...reqItem,
      status: 'NEEDS_CREATION',
      statusLabel: '신규 작성 필요 (AI 즉시 작성 가능)',
      statusColor: 'bg-rose-50 text-rose-700 border-rose-300',
      matchedDoc: null,
      reuseNote: '아직 사내에 준비된 문서가 없습니다. AI 템플릿 생성을 통해 초안을 즉시 마련할 수 있습니다.'
    };
  });

  const totalRequired = evaluatedItems.length;
  const reuseRate = totalRequired > 0 ? Math.round((matchedCount / totalRequired) * 100) : 0;

  return {
    programId: program?.id,
    programTitle: program?.title,
    evaluatedItems,
    totalRequired,
    matchedCount,
    missingCount: totalRequired - matchedCount,
    reuseRate,
    bonusPointsCount,
    summaryMessage: `총 ${totalRequired}개 필수 제출서류 중 ${matchedCount}개 서류가 기존 사내 문서(ISO 심사/법인/노무)에서 즉시 재사용(구비율 ${reuseRate}%) 가능합니다!`
  };
}
