import { validTaskDate } from './workTaskDates.mjs';
export const PROJECT_KINDS = { ISO: 'ISO 인증 준비', DOMESTIC: '기업 인증 준비', SUPPORT: '지원사업 준비', GENERAL: '종합 컨설팅' };
export const REQUIREMENT_SOURCE = 'isoedu-reference-2026-10-19-review-required';
export const DOCUMENT_REVIEW_STATUSES = {
 DRAFT: '초안 작성 중',
 REVIEW: '내부 검토 중',
 VERIFIED: '내부 확인 완료',
};
export function requirementReviewState(requirement, linkedDoc) {
 if (!requirement?.document_id || !linkedDoc) return 'MISSING';
 if (linkedDoc.reviewStatus && Object.hasOwn(DOCUMENT_REVIEW_STATUSES, linkedDoc.reviewStatus)) return linkedDoc.reviewStatus;
 if (linkedDoc.docStatus === '내부 확인 완료' || linkedDoc.status === 'APPROVED') return 'VERIFIED';
 if (linkedDoc.status === 'REVIEW' || ['내부 검토 중', '검토 중', '승인 대기'].includes(linkedDoc.docStatus) || linkedDoc.kind === 'client-file') return 'REVIEW';
 return 'DRAFT';
}
export function applyDocumentReviewStatus(doc, nextReviewStatus) {
 if (!doc?.id || !doc?.companyId) throw Error('상태를 변경할 문서를 확인해 주세요.');
 if (!Object.hasOwn(DOCUMENT_REVIEW_STATUSES, nextReviewStatus)) throw Error('확인 상태 값을 확인해 주세요.');
 const status = nextReviewStatus === 'VERIFIED' ? 'READY' : 'DRAFT';
 return {
  ...doc,
  status,
  docStatus: DOCUMENT_REVIEW_STATUSES[nextReviewStatus],
  reviewStatus: nextReviewStatus,
  lastModified: new Date().toISOString(),
 };
}
export function buildRequirementDraftDocument(requirement, project, catalog = [], extra = {}) {
 if (!requirement?.id || !requirement?.title?.trim()) throw Error('초안을 생성할 구비서류 항목을 확인해 주세요.');
 if (!project?.id || !project?.companyId) throw Error('프로젝트와 거래처 정보를 확인해 주세요.');
 const reviewStatus = extra.reviewStatus || 'DRAFT';
 if (!Object.hasOwn(DOCUMENT_REVIEW_STATUSES, reviewStatus)) throw Error('초안 확인 상태를 확인해 주세요.');
 const key = requirement.requirement_key || requirement.key || '';
 const catalogItem = catalog.find(item => item.id === key) || catalog.find(item => item.standard === requirement.standard && item.title === requirement.title) || null;
 const clientLabel = (project.clientName || '대상 거래처').trim();
 const baseTemplate = catalogItem?.templateDraft
  ? catalogItem.templateDraft.replaceAll('(주)아이소에듀', clientLabel)
  : `# ${requirement.title}\n\n## 1. 목적 및 적용 범위\n- 대상 거래처: ${clientLabel}\n- 적용 범위: [적용범위: 예 - 주요 제품·서비스의 설계 및 제조]\n\n## 2. 세부 운영 기준 및 절차\n- 주관 부서: [주관부서: 예 - 품질관리팀]\n- 시행 기준일: [시행일자: 예 - 2026-11-01]\n- 담당 부서 및 책임을 회사 현황에 맞게 작성하세요.\n\n## 3. 관련 기록 및 증적\n- 현장 이행 기록 및 첨부 증적을 연결하세요.`;
 const footerPlaceholders = baseTemplate.includes('[주관부서') || baseTemplate.includes('[적용범위')
  ? ''
  : `\n\n---\n### 기업 운영 맞춤 기입란\n- 적용 범위: [적용범위: 예 - 주요 제품·서비스의 설계 및 제조]\n- 주관 부서: [주관부서: 예 - 품질경영팀]\n- 시행 기준일: [시행일자: 예 - 2026-11-01]`;
 const contentDraft = extra.contentDraft || `> [작성 안내] ${clientLabel} · ${project.title} 구비서류 초안입니다. 타사 수치나 미확인 정보를 복사하지 말고 실제 운영 사실과 증적을 확인해 작성하세요.\n\n${baseTemplate}${footerPlaceholders}`;
 const rawCode = extra.code || catalogItem?.defaultCode || `${requirement.standard || 'DOC'}-${key || 'REQ'}`;
 return {
  companyId: project.companyId,
  title: (extra.title || catalogItem?.defaultTitle || requirement.title).trim(),
  code: String(rawCode).toUpperCase(),
  standards: requirement.standard ? [requirement.standard] : (project.standards?.length ? project.standards : ['ISO_9001']),
  hierarchyLevel: catalogItem?.level && catalogItem.level !== 'CERT' ? catalogItem.level : 'LEVEL_2',
  clauseNumber: catalogItem?.clause || '직접 지정',
  department: '담당 부서 미지정',
  author: '작성자 확인 필요',
  version: 'v1.0-draft',
  revisionNo: 'Rev. Draft',
  status: reviewStatus === 'VERIFIED' ? 'READY' : 'DRAFT',
  docStatus: DOCUMENT_REVIEW_STATUSES[reviewStatus],
  reviewStatus,
  approvalDate: null,
  expiryDate: null,
  dDay: null,
  penaltyRisk: catalogItem?.penaltyRisk || '',
  summary: catalogItem?.summary || `${project.title} · ${requirement.title} 준비 문서 (내부 검토 필요)`,
  checklist: catalogItem
   ? [
      { text: `${requirement.standard} 조항 ${catalogItem.clause} 요건 대조`, done: false },
      { text: '현장 운영 사실·증적 대조', done: false },
      { text: '내부 검토 확인', done: false },
     ]
   : [
      { text: '구비서류 작성 내용 확인', done: false },
      { text: '증적 자료 첨부 확인', done: false },
     ],
  contentDraft,
  projectOrigin: {
   projectId: project.id,
   requirementId: requirement.id,
   requirementKey: key,
   sourceVersion: requirement.source_version || requirement.sourceVersion || REQUIREMENT_SOURCE,
  },
 };
}
export function findProjectRequirementMatches(requirements = [], documents = [], catalog = [], companyId = '') {
 const unlinked = requirements.filter(r => !r?.document_id);
 const Matches = [];
 for (const req of unlinked) {
  const targetCompanyId = req.company_id || companyId;
  if (!targetCompanyId) continue;
  const key = req.requirement_key || req.key || '';
  const catalogItem = catalog.find(item => item.id === key) || catalog.find(item => item.standard === req.standard && item.title === req.title) || null;
  const companyDocs = documents.filter(d => d?.id && d.companyId === targetCompanyId);
  let matched = null;
  let matchReason = '';
  for (const doc of companyDocs) {
   if (doc.projectOrigin?.requirementId === req.id || (key && doc.projectOrigin?.requirementKey === key)) {
    matched = doc;
    matchReason = '동일 구비서류 기준 문서';
    break;
   }
  }
  if (!matched && catalogItem) {
   const normalizeCode = value => String(value || '').toUpperCase().replace(/-0+(\d+)/g, '-$1');
   const defCode = String(catalogItem.defaultCode || '').toUpperCase();
   const pattern = String(catalogItem.codePattern || '').toUpperCase();
   const normDefCode = normalizeCode(defCode);
   const normPattern = normalizeCode(pattern);
   for (const doc of companyDocs) {
    if (doc.kind === 'client-file' || doc.hierarchyLevel === 'CERT') continue;
    const codeUpper = String(doc.code || '').toUpperCase();
    const normCode = normalizeCode(codeUpper);
    if (defCode && (codeUpper === defCode || normCode === normDefCode)) {
     matched = doc;
     matchReason = `문서 코드 일치 (${doc.code || defCode})`;
     break;
    }
    if (pattern && (codeUpper.includes(pattern) || normCode.includes(normPattern))) {
     matched = doc;
     matchReason = `코드 패턴 일치 (${pattern})`;
     break;
    }
    const standards = Array.isArray(doc.standards) ? doc.standards : [];
    const hasStandard = req.standard && (standards.includes(req.standard) || standards.includes('ALL'));
    const hasClause = catalogItem.clause && String(doc.clauseNumber || '').includes(catalogItem.clause);
    if (hasStandard && hasClause) {
     matched = doc;
     matchReason = `${req.standard} §${catalogItem.clause} 조항 일치`;
     break;
    }
   }
  }
  if (!matched) {
   const reqTitle = String(req.title || '').trim().toLocaleLowerCase();
   const defaultTitle = String(catalogItem?.defaultTitle || '').trim().toLocaleLowerCase();
   for (const doc of companyDocs) {
    if (doc.hierarchyLevel === 'CERT') continue;
    const docTitle = String(doc.title || doc.name || '').trim().toLocaleLowerCase();
    if (docTitle && (docTitle === reqTitle || (defaultTitle && docTitle === defaultTitle))) {
     matched = doc;
     matchReason = '문서 제목 일치';
     break;
    }
   }
  }
  if (matched) {
   Matches.push({
    requirementId: req.id,
    requirementKey: key,
    requirementTitle: req.title,
    standard: req.standard || '',
    documentId: matched.id,
    documentTitle: matched.title || matched.name || '',
    documentCode: matched.code || '',
    matchReason,
   });
  }
 }
 return Matches;
}
export function buildBatchRequirementDrafts(requirements = [], project, catalog = []) {
 if (!project?.id || !project?.companyId) throw Error('프로젝트와 거래처 정보를 확인해 주세요.');
 const unlinked = requirements.filter(r => r?.id && !r.document_id);
 return unlinked.map(r => ({
  requirementId: r.id,
  draft: buildRequirementDraftDocument(r, project, catalog),
 }));
}
export function buildProjectTaskSyncPlan(tasks = [], requirements = [], documents = [], companyId = '') {
 const total = requirements.length;
 const stateOf = r => {
  const targetCompanyId = r.company_id || companyId;
  const doc = documents.find(d => d.id === r.document_id && (!targetCompanyId || d.companyId === targetCompanyId));
  return requirementReviewState(r, doc);
 };
 const linkedCount = requirements.filter(r => stateOf(r) !== 'MISSING').length;
 const reviewOrVerifiedCount = requirements.filter(r => ['REVIEW', 'VERIFIED'].includes(stateOf(r))).length;
 const verifiedCount = requirements.filter(r => stateOf(r) === 'VERIFIED').length;
 const updates = [];
 for (let i = 0; i < tasks.length; i++) {
  const task = tasks[i];
  if (!task?.id) continue;
  const key = task.project_task_key || `preparation-${i + 1}`;
  let nextStatus = task.status || 'todo';
  let nextChecklist = Array.isArray(task.checklist) ? task.checklist : [];
  if (key === 'preparation-1') {
   nextChecklist = [
    { id: 'scope-reqs', text: `구비서류 기준 목록 확인 (${total}개)`.slice(0, 200), done: total > 0 },
    { id: 'scope-start', text: `초안 생성 또는 기존 문서 연결 시작 (${linkedCount}/${total})`.slice(0, 200), done: total > 0 && linkedCount > 0 },
   ];
   nextStatus = total === 0 ? 'todo' : linkedCount === total ? 'done' : linkedCount > 0 ? 'doing' : 'todo';
  } else if (key === 'preparation-2') {
   nextChecklist = requirements.slice(0, 50).map((r, idx) => ({
    id: String(r.id || r.requirement_key || idx).slice(0, 80),
    text: `${r.standard ? `[${r.standard}] ` : ''}${r.title}`.slice(0, 200),
    done: stateOf(r) !== 'MISSING',
   }));
   nextStatus = total === 0 || linkedCount === 0 ? 'todo' : verifiedCount === total ? 'done' : linkedCount === total ? 'waiting' : 'doing';
  } else if (key === 'preparation-3') {
   nextChecklist = requirements.slice(0, 50).map((r, idx) => ({
    id: `verify-${String(r.id || r.requirement_key || idx)}`.slice(0, 80),
    text: `${r.title} 내부 확인 완료`.slice(0, 200),
    done: stateOf(r) === 'VERIFIED',
   }));
   nextStatus = total === 0 || reviewOrVerifiedCount === 0 ? 'todo' : verifiedCount === total ? 'done' : 'doing';
  } else {
   continue;
  }
  const sameStatus = task.status === nextStatus;
  const sameChecklist = JSON.stringify(task.checklist || []) === JSON.stringify(nextChecklist);
  if (!sameStatus || !sameChecklist) {
   updates.push({
    id: task.id,
    project_task_key: key,
    title: task.title,
    status: nextStatus,
    checklist: nextChecklist,
   });
  }
 }
 return {
  summary: { total, linkedCount, draftCount: linkedCount - reviewOrVerifiedCount, reviewCount: reviewOrVerifiedCount - verifiedCount, verifiedCount, missingCount: total - linkedCount },
  updates,
 };
}
export function projectDraft({companyId='',clientName='',title='',kind='ISO',standards=[],targetDate='',requirements=[],tasks=[],requestId,notes='',programId=''}={}) {
 if(!requestId)throw Error('저장 요청 식별자를 확인해 주세요.');
 if(!title.trim()||title.trim().length>120)throw Error('프로젝트명을 120자 이내로 입력해 주세요.');
 if(!companyId&&!clientName.trim())throw Error('기존 거래처를 선택하거나 새 거래처명을 입력해 주세요.');
 if(!Object.hasOwn(PROJECT_KINDS,kind))throw Error('프로젝트 종류를 확인해 주세요.');
 if(kind==='ISO'&&!standards.length)throw Error('준비할 ISO 규격을 선택해 주세요.');
 if(!validTaskDate(targetDate))throw Error('목표일을 확인해 주세요.');
 if(tasks.length>30||tasks.some(t=>!t.title.trim()||t.title.length>180||!validTaskDate(t.dueDate)))throw Error('준비 업무명과 날짜를 확인해 주세요.');
 if(targetDate&&tasks.some(t=>t.dueDate&&t.dueDate>targetDate))throw Error('목표일보다 늦은 준비 일정이 있습니다. 날짜를 확인해 주세요.');
 if(new Set(tasks.map(t=>t.key)).size!==tasks.length||new Set(requirements.map(r=>r.key)).size!==requirements.length)throw Error('중복 항목을 확인해 주세요.');
 return {workflowVersion:2,requestId,companyId,clientName:clientName.trim(),title:title.trim(),kind,standards:kind==='ISO'?standards:[],targetDate,notes:notes.slice(0,10000),programId,requirements:requirements.map(r=>({...r,sourceVersion:r.sourceVersion||'user-reviewed-v1'})),tasks};
}
export function suggestedProjectTasks(targetDate) {
 const titles=['회사 현황·준비 범위 확인','구비서류 작성·증적 정리','내부 검토·보완'];
 return titles.map((title,i)=>{
  let dueDate='';
  if(targetDate&&validTaskDate(targetDate)){const d=new Date(targetDate+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-[30,14,3][i]);dueDate=d.toISOString().slice(0,10);}
  return {key:`preparation-${i+1}`,title,dueDate};
 });
}
export function syncSuggestedTaskDates(currentTasks=[],nextTargetDate='',manualDateKeys=[]) {
 const manualSet=new Set(manualDateKeys);
 const suggested=suggestedProjectTasks(nextTargetDate);
 const suggestedByKey=new Map(suggested.map(t=>[t.key,t]));
 if(!currentTasks.length)return suggested;
 return currentTasks.map(task=>{
  if(manualSet.has(task.key))return task;
  const match=suggestedByKey.get(task.key);
  return match?{...task,dueDate:match.dueDate}:task;
 });
}
export function suggestProjectTitle({companyName='',kind='ISO',standards=[],programTitle=''}={}) {
 if(programTitle&&programTitle.trim())return programTitle.trim().slice(0,120);
 const prefix=companyName&&companyName.trim()?`${companyName.trim()} `:'';
 if(kind==='ISO'){
  const stdLabel=standards.length?standards.map(s=>String(s).replace('_',' ')).join('·'):'ISO';
  return `${prefix}${stdLabel} 인증 준비`.slice(0,120);
 }
 return `${prefix}${PROJECT_KINDS[kind]||'인증 준비'}`.slice(0,120);
}
export function requirementsForStandards(standards,catalog) {
 return catalog.filter(r=>standards.includes(r.standard)&&r.level!=='CERT').map(r=>({key:r.id,title:r.title,standard:r.standard,sourceVersion:REQUIREMENT_SOURCE}));
}
export function extractTemplatePlaceholders(text = '') {
 if (typeof text !== 'string' || !text) return [];
 const matches = text.match(/\[[^\[\]\r\n]{1,60}\]/g) || [];
 const ignored = new Set([
  '[작성 안내]',
  '[강조 조항]',
  '[참고 사항]',
  '[필수 이행 사항]',
  '[AI 규격 감사 보완 조항 추가 반영]',
 ]);
 const unique = [];
 for (const token of matches) {
  if (ignored.has(token)) continue;
  if (/^\[실습/.test(token)) continue;
  if (!unique.includes(token)) unique.push(token);
 }
 return unique;
}
export function replaceTemplatePlaceholders(text = '', replacements = {}) {
 if (typeof text !== 'string' || !text) return '';
 let next = text;
 for (const [token, value] of Object.entries(replacements || {})) {
  if (value === undefined || value === null || !String(value).trim()) continue;
  next = next.replaceAll(token, String(value).trim());
 }
 return next;
}
export function summarizeQuickstartProgress({ companies = [], projects = [], documents = [] } = {}) {
 const projectCount = Array.isArray(projects) ? projects.length : 0;
 const companyDocs = Array.isArray(documents) ? documents.filter(d => d?.id && d.hierarchyLevel !== 'CERT') : [];
 const docCount = companyDocs.length;
 const verifiedDocCount = companyDocs.filter(d =>
  d.reviewStatus === 'VERIFIED' || d.docStatus === '내부 확인 완료' || d.status === 'READY' || d.status === 'APPROVED'
 ).length;
 const step1Done = projectCount > 0;
 const step2Done = step1Done && docCount > 0;
 const step3Done = step2Done && verifiedDocCount > 0;
 const completedSteps = [step1Done, step2Done, step3Done].filter(Boolean).length;
 return {
  companyCount: Array.isArray(companies) ? companies.length : 0,
  projectCount,
  docCount,
  verifiedDocCount,
  step1Done,
  step2Done,
  step3Done,
  completedSteps,
  progressPercent: Math.round((completedSteps / 3) * 100),
 };
}
export function workflowError(error) {
 if(/Request content changed/.test(error?.message||''))return '이미 저장된 요청입니다. 프로젝트 목록을 확인하거나 입력창을 다시 열어 새 프로젝트를 만들어 주세요.';
 if(['PGRST202','PGRST205','42P01','42703'].includes(error?.code))return '프로젝트·회사 권한 저장소 설정이 아직 적용되지 않았습니다. 서버 설정 적용 후 다시 시도해 주세요.';
 if(error?.code==='42501'||/denied|required|permission|row.level/i.test(error?.message||''))return '회사 접근 권한을 확인해 주세요. 소속이 변경됐다면 화면을 새로 불러와 주세요.';
 return '요청을 저장하지 못했습니다. 연결 상태와 입력 내용을 확인한 뒤 다시 시도해 주세요.';
}
