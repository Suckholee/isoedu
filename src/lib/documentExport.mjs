import { DOCUMENT_REVIEW_STATUSES, requirementReviewState } from './projectWorkflow.mjs';

export function escapeHtml(value = '') {
 return String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
}

export function safeDownloadFileName(rawName = 'document', extension = 'doc') {
 const cleaned = String(rawName || 'document')
  .trim()
  .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_')
  .replace(/\s+/g, '_')
  .slice(0, 100) || 'document';
 const ext = String(extension || '').replace(/^\.+/, '');
 return ext ? `${cleaned}.${ext}` : cleaned;
}

export function resolveReviewStatusLabel(doc) {
 if (!doc) return '준비 필요';
 if (doc.reviewStatus && Object.hasOwn(DOCUMENT_REVIEW_STATUSES, doc.reviewStatus)) {
  return DOCUMENT_REVIEW_STATUSES[doc.reviewStatus];
 }
 if (doc.docStatus === '내부 확인 완료' || doc.status === 'READY' || doc.status === 'APPROVED') {
  return DOCUMENT_REVIEW_STATUSES.VERIFIED;
 }
 if (['내부 검토 중', '검토 중'].includes(doc.docStatus) || doc.kind === 'client-file') {
  return DOCUMENT_REVIEW_STATUSES.REVIEW;
 }
 return DOCUMENT_REVIEW_STATUSES.DRAFT;
}

function renderDocumentSectionHtml(doc, { companyName = '' } = {}) {
 const displayCompany = (companyName || doc?.projectOrigin?.clientName || '대상 거래처').trim();
 const title = doc?.title || doc?.name || '사내 표준 문서';
 const code = doc?.code || '-';
 const version = doc?.revisionNo || doc?.version || 'v1.0-draft';
 const reviewLabel = resolveReviewStatusLabel(doc);
 const approvalDate = doc?.approvalDate || '미정 (내부 확인 후 기재)';
 const expiryDate = doc?.expiryDate || '해당 없음 / 미정';
 const summary = doc?.summary || '사내 운영 기준 및 구비서류 준비 문서';
 const bodyText = doc?.contentDraft || doc?.content || '등록된 본문 내용이 없습니다.';
 const checklist = Array.isArray(doc?.checklist) ? doc.checklist : [];

 const checklistRows = checklist.length
  ? `<h3 style="font-size:13pt;margin:18px 0 8px 0;color:#0f172a;">필수 점검 체크리스트</h3>
     <table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:16px;" border="1" cellspacing="0" cellpadding="6">
      <thead>
       <tr style="background:#f1f5f9;">
        <th style="width:70px;text-align:center;">이행 여부</th>
        <th style="text-align:left;">점검 항목</th>
       </tr>
      </thead>
      <tbody>
       ${checklist.map(item => `<tr><td style="text-align:center;font-weight:bold;">${item?.done ? '[완료]' : '[미완료]'}</td><td>${escapeHtml(item?.text || '')}</td></tr>`).join('')}
      </tbody>
     </table>`
  : '';

 return `<section style="font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;color:#0f172a;line-height:1.6;">
  <div style="border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:14px;">
   <div style="font-size:9pt;color:#475569;">${escapeHtml(displayCompany)} 사내 표준 문서 · 내부 검토용 (공식 인증기관 심사·승인 별도)</div>
   <h1 style="font-size:18pt;margin:6px 0 0 0;">${escapeHtml(title)}</h1>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:16px;" border="1" cellspacing="0" cellpadding="6">
   <tbody>
    <tr>
     <th style="width:18%;background:#f8fafc;text-align:left;">거래처명</th>
     <td style="width:32%;">${escapeHtml(displayCompany)}</td>
     <th style="width:18%;background:#f8fafc;text-align:left;">문서 번호</th>
     <td style="width:32%;">${escapeHtml(code)}</td>
    </tr>
    <tr>
     <th style="background:#f8fafc;text-align:left;">개정 번호</th>
     <td>${escapeHtml(version)}</td>
     <th style="background:#f8fafc;text-align:left;">내부 확인 상태</th>
     <td><strong>${escapeHtml(reviewLabel)}</strong> (공식 심사 별도)</td>
    </tr>
    <tr>
     <th style="background:#f8fafc;text-align:left;">제·개정일자</th>
     <td>${escapeHtml(approvalDate)}</td>
     <th style="background:#f8fafc;text-align:left;">유효 만기일</th>
     <td>${escapeHtml(expiryDate)}</td>
    </tr>
    <tr>
     <th style="background:#f8fafc;text-align:left;">문서 요약</th>
     <td colspan="3">${escapeHtml(summary)}</td>
    </tr>
   </tbody>
  </table>
  <h2 style="font-size:13pt;margin:16px 0 8px 0;color:#0f172a;">문서 본문</h2>
  <div style="border:1px solid #cbd5e1;padding:14px;white-space:pre-wrap;font-size:10.5pt;background:#ffffff;">${escapeHtml(bodyText)}</div>
  ${checklistRows}
 </section>`;
}

export function buildWordDocumentHtml(doc, { companyName = '' } = {}) {
 if (!doc || (!doc.title && !doc.name)) throw Error('다운로드할 문서 정보를 확인해 주세요.');
 const title = doc.title || doc.name;
 return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="ko">
<head>
 <meta charset="utf-8" />
 <title>${escapeHtml(title)}</title>
</head>
<body style="margin:24px;">
 ${renderDocumentSectionHtml(doc, { companyName })}
</body>
</html>`;
}

export function buildProjectBinderHtml(project, requirements = [], documents = []) {
 if (!project?.title) throw Error('다운로드할 프로젝트 정보를 확인해 주세요.');
 const companyName = (project.clientName || '대상 거래처').trim();
 const docsById = new Map(documents.map(d => [d.id, d]));
 const linkedItems = requirements
  .map(r => ({ requirement: r, doc: docsById.get(r.document_id) || null }))
  .filter(item => item.doc);

 const summaryRows = requirements.map((r, idx) => {
  const doc = docsById.get(r.document_id) || null;
  const state = requirementReviewState(r, doc);
  const stateLabel = state === 'MISSING' ? '준비 필요 (미연결)' : DOCUMENT_REVIEW_STATUSES[state];
  return `<tr>
   <td style="text-align:center;">${idx + 1}</td>
   <td>${escapeHtml(r.standard || '직접 지정')}</td>
   <td>${escapeHtml(r.title || '')}</td>
   <td>${escapeHtml(doc ? (doc.title || doc.name || '') : '미연결')}</td>
   <td>${escapeHtml(doc?.code || '-')}</td>
   <td>${escapeHtml(stateLabel)}</td>
  </tr>`;
 }).join('');

 const docSections = linkedItems.map((item, idx) => `
  <div style="page-break-before:always;margin-top:28px;padding-top:16px;border-top:2px dashed #94a3b8;">
   <div style="font-size:10pt;font-weight:bold;color:#1d4ed8;margin-bottom:6px;">[구비서류 ${idx + 1}/${linkedItems.length}] ${escapeHtml(item.requirement.standard || '직접 지정')} · ${escapeHtml(item.requirement.title)}</div>
   ${renderDocumentSectionHtml(item.doc, { companyName })}
  </div>
 `).join('');

 return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="ko">
<head>
 <meta charset="utf-8" />
 <title>${escapeHtml(project.title)} 구비서류 통합 바인더</title>
</head>
<body style="margin:24px;font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;color:#0f172a;">
 <header style="border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px;">
  <div style="font-size:10pt;color:#475569;">${escapeHtml(companyName)} · 내부 목표일: ${escapeHtml(project.targetDate || '미정')}</div>
  <h1 style="font-size:20pt;margin:6px 0;">${escapeHtml(project.title)} — 구비서류 통합 준비 바인더</h1>
  <p style="font-size:9.5pt;color:#64748b;margin:4px 0 0 0;">본 문서는 내부 심사 준비 기록이며, 공식 인증기관의 심사 적합 판정이나 발급 승인을 대신하지 않습니다.</p>
 </header>
 <h2 style="font-size:13pt;margin:14px 0 8px 0;">1. 구비서류 연결 및 내부 확인 현황표 (${linkedItems.length}/${requirements.length}건 연결)</h2>
 <table style="width:100%;border-collapse:collapse;font-size:9.5pt;margin-bottom:20px;" border="1" cellspacing="0" cellpadding="6">
  <thead>
   <tr style="background:#f1f5f9;">
    <th style="width:45px;">번호</th>
    <th style="width:90px;">규격</th>
    <th>구비서류</th>
    <th>연결 문서명</th>
    <th style="width:95px;">문서 코드</th>
    <th style="width:110px;">확인 상태</th>
   </tr>
  </thead>
  <tbody>
   ${summaryRows || '<tr><td colspan="6" style="text-align:center;">등록된 구비서류가 없습니다.</td></tr>'}
  </tbody>
 </table>
 ${docSections}
</body>
</html>`;
}

function escapeCsvCell(value = '') {
 const text = String(value ?? '').replace(/\r?\n/g, ' ');
 if (/[",]/.test(text)) {
  return `"${text.replaceAll('"', '""')}"`;
 }
 return text;
}

export function buildProjectRequirementsCsv(project, requirements = [], documents = []) {
 if (!project?.title) throw Error('다운로드할 프로젝트 정보를 확인해 주세요.');
 const docsById = new Map(documents.map(d => [d.id, d]));
 const headers = ['번호', '프로젝트명', '거래처', '규격', '구비서류명', '연결 문서명', '문서 코드', '첨부 파일명', '내부 확인 상태'];
 const rows = requirements.map((r, idx) => {
  const doc = docsById.get(r.document_id) || null;
  const state = requirementReviewState(r, doc);
  const stateLabel = state === 'MISSING' ? '준비 필요(미연결)' : DOCUMENT_REVIEW_STATUSES[state];
  return [
   idx + 1,
   project.title || '',
   project.clientName || '',
   r.standard || '직접 지정',
   r.title || '',
   doc ? (doc.title || doc.name || '') : '미연결',
   doc?.code || '',
   doc?.fileName || '',
   stateLabel,
  ].map(escapeCsvCell).join(',');
 });
 return `\uFEFF${[headers.map(escapeCsvCell).join(','), ...rows].join('\r\n')}`;
}

export function triggerBrowserDownload(content, fileName, mimeType = 'application/octet-stream') {
 if (typeof window === 'undefined' || typeof document === 'undefined') return;
 const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
 const url = URL.createObjectURL(blob);
 const anchor = document.createElement('a');
 anchor.href = url;
 anchor.download = fileName;
 anchor.rel = 'noopener';
 document.body.appendChild(anchor);
 anchor.click();
 anchor.remove();
 setTimeout(() => URL.revokeObjectURL(url), 30000);
}
