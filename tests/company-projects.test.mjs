import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {
 projectDraft,
 requirementsForStandards,
 suggestedProjectTasks,
 DOCUMENT_REVIEW_STATUSES,
 requirementReviewState,
 applyDocumentReviewStatus,
 buildRequirementDraftDocument,
 findProjectRequirementMatches,
 buildBatchRequirementDrafts,
 buildProjectTaskSyncPlan,
 syncSuggestedTaskDates,
 suggestProjectTitle,
 extractTemplatePlaceholders,
 replaceTemplatePlaceholders,
 summarizeQuickstartProgress,
} from '../src/lib/projectWorkflow.mjs';
import {ISO_MANDATORY_REQUIREMENTS} from '../src/lib/isoRequirementsData.js';
import {toDocumentRow,fromDocumentRow} from '../src/lib/documentModel.js';
import {
 safeDownloadFileName,
 buildWordDocumentHtml,
 buildProjectBinderHtml,
 buildProjectRequirementsCsv,
} from '../src/lib/documentExport.mjs';
const db=new PGlite(),owner='20000000-0000-4000-8000-000000000001',staff='20000000-0000-4000-8000-000000000002',outsider='20000000-0000-4000-8000-000000000003';
let company,otherCompany,project,document;
async function act(id,fn,role='authenticated') {await db.exec(`BEGIN; SET LOCAL ROLE ${role};`);await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[id||'']);try{const result=await fn();await db.exec('COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
before(async()=>{
 await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE SCHEMA auth; CREATE SCHEMA storage;
 CREATE TABLE auth.users(id UUID PRIMARY KEY,email TEXT,raw_user_meta_data JSONB DEFAULT '{}'::jsonb);
 CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
 CREATE FUNCTION public.uuid_generate_v4() RETURNS UUID LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
 CREATE TABLE storage.buckets(id TEXT PRIMARY KEY,name TEXT,public BOOLEAN,file_size_limit BIGINT,allowed_mime_types TEXT[]);
 CREATE TABLE storage.objects(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id TEXT,name TEXT); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 CREATE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$ SELECT (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
 GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated;
 GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO anon,authenticated;
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated;`);
 for(const path of ['schema.sql','platform_migration.sql','work_tasks_migration.sql','company_projects_migration.sql','company_projects_migration.sql'])await db.exec((await readFile(new URL('../supabase/'+path,import.meta.url),'utf8')).replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',''));
 for(const [id,email] of [[owner,'owner@example.test'],[staff,'staff@example.test'],[outsider,'other@example.test']])await db.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)',[id,email,{full_name:id}]);
 company=(await db.query('SELECT company_id FROM public.profiles WHERE id=$1',[owner])).rows[0].company_id;
 otherCompany=(await db.query('SELECT company_id FROM public.profiles WHERE id=$1',[outsider])).rows[0].company_id;
 document=(await db.query("INSERT INTO public.documents(company_id,title,certification_code,hierarchy_level) VALUES($1,'Company document','ISO_9001','LEVEL_1') RETURNING id",[company])).rows[0].id;
});
after(()=>db.close());
function payload(id='30000000-0000-4000-8000-000000000001') {return {requestId:id,title:'Integrated preparation',companyId:company,kind:'ISO',standards:['ISO_9001','ISO_14001'],targetDate:'2026-12-10',requirements:[{key:'req-1',title:'Document requirement',standard:'ISO_9001',sourceVersion:'review-20261019'}],tasks:suggestedProjectTasks('2026-12-10')};}
async function create(p,id=owner){return act(id,async()=> (await db.query('SELECT * FROM public.create_work_project($1::jsonb)',[p])).rows[0]);}

test('project previews retain multiple standards, require reviewable dates and omit issued certificates',()=>{
 assert.equal(suggestedProjectTasks('2026-03-01')[0].dueDate,'2026-01-30');
 assert.deepEqual(requirementsForStandards(['ISO_9001'],[{id:'a',standard:'ISO_9001',level:'CERT'},{id:'b',standard:'ISO_9001',level:'BASE',title:'Manual'}]).map(r=>r.key),['b']);
 assert.equal(projectDraft({...payload(),companyId:'company'}).standards.length,2);
 assert.throws(()=>projectDraft({...payload(),tasks:[{key:'x',title:'Late',dueDate:'2026-12-11'}]}),/목표일/);
 assert.throws(()=>projectDraft({...payload(),targetDate:'2026-02-30'}),/목표일/);
});
test('company project saves requirements and tasks atomically, preserves existing company and is retry safe',async()=>{
 const count=(await db.query('SELECT count(*)::int AS n FROM public.companies')).rows[0].n;
 project=await create(payload());assert.equal(project.company_id,company);
 const again=await create(payload());assert.equal(again.id,project.id);
 await assert.rejects(create({...payload(),title:'Different content'}),/content changed/);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM public.companies')).rows[0].n,count);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM public.work_tasks WHERE project_id=$1',[project.id])).rows[0].n,3);
 assert.equal((await db.query('SELECT * FROM public.project_requirements WHERE project_id=$1',[project.id])).rows.length,1);
 const second=await create(payload('30000000-0000-4000-8000-000000000002'));assert.notEqual(second.id,project.id);assert.equal(second.company_id,company);
});
test('invalid schedules roll back project and new company, missing/foreign access cannot create',async()=>{
 const p=payload('30000000-0000-4000-8000-000000000003');p.tasks[0].dueDate='invalid';p.companyId='';p.clientName='Rollback company';
 const count=(await db.query('SELECT count(*)::int AS n FROM public.companies')).rows[0].n;
 await assert.rejects(create(p),/date/);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM public.companies')).rows[0].n,count);
 await assert.rejects(create(payload('30000000-0000-4000-8000-000000000004'),outsider),/editor/);
 await assert.rejects(act(null,()=>db.query('SELECT * FROM public.create_work_project($1::jsonb)',[payload()]),'anon'),/permission/);
});
test('company scope is enforced on requirement document links and task/project reassignment',async()=>{
 const req=(await db.query('SELECT * FROM public.project_requirements WHERE project_id=$1',[project.id])).rows[0];
 await act(owner,()=>db.query('UPDATE public.project_requirements SET document_id=$1 WHERE id=$2',[document,req.id]));
 const foreign=(await db.query("INSERT INTO public.documents(company_id,title,certification_code,hierarchy_level) VALUES($1,'Foreign','ISO_9001','LEVEL_1') RETURNING id",[otherCompany])).rows[0].id;
 await assert.rejects(act(owner,()=>db.query('UPDATE public.project_requirements SET document_id=$1 WHERE id=$2',[foreign,req.id])),/Document must/);
 await assert.rejects(act(owner,()=>db.query('UPDATE public.project_requirements SET company_id=$1 WHERE id=$2',[otherCompany,req.id])),/permission/);
 await assert.rejects(act(owner,()=>db.query('UPDATE public.audit_projects SET company_id=$1 WHERE id=$2',[otherCompany,project.id])),/permission/);
 const task=(await db.query('SELECT id FROM public.work_tasks WHERE project_id=$1',[project.id])).rows[0].id;
 await assert.rejects(act(owner,()=>db.query('UPDATE public.work_tasks SET company_id=$1 WHERE id=$2',[otherCompany,task])),/Project must/);
 await act(outsider,async()=>assert.equal((await db.query('SELECT * FROM public.project_requirements WHERE project_id=$1',[project.id])).rows.length,0));
});
test('staff requests grant no access before owner approval; nonowners cannot approve or enumerate team',async()=>{
 const code=await act(owner,async()=>(await db.query('SELECT public.company_join_code($1) AS code',[company])).rows[0].code);
 const request=await act(staff,async()=>(await db.query('SELECT public.request_company_join($1) AS id',[code])).rows[0].id);
 await act(staff,async()=>assert.equal((await db.query('SELECT * FROM public.companies WHERE id=$1',[company])).rows.length,0));
 await assert.rejects(act(staff,()=>db.query('SELECT public.decide_company_join($1,true)',[request])),/owner/);
 await assert.rejects(act(outsider,()=>db.query('SELECT public.company_access($1)',[company])),/denied/);
 await act(owner,()=>db.query("SELECT public.decide_company_join($1,true,'VIEWER')",[request]));
 await act(staff,async()=>{
  assert.equal((await db.query('SELECT * FROM public.audit_projects WHERE id=$1',[project.id])).rows.length,1);
  assert.equal((await db.query("UPDATE public.work_tasks SET title='No' WHERE project_id=$1 RETURNING id",[project.id])).rows.length,0);
  const team=(await db.query('SELECT public.company_access($1) AS data',[company])).rows[0].data;assert.equal(team.canManage,false);assert.equal(team.members.length,1);
 });
 await assert.rejects(act(owner,()=>db.query('SELECT public.decide_company_join($1,true)',[request])),/cannot be decided/);
});
test('revocation blocks legacy profile fallback, documents, revisions, storage, tasks and projects; keeps company data',async()=>{
 await db.query('UPDATE public.profiles SET company_id=$1 WHERE id=$2',[company,staff]);
 const version=(await db.query("INSERT INTO public.document_versions(document_id,change_reason,author_name) VALUES($1,'Initial','Owner') RETURNING id",[document])).rows[0].id;
 await db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('iso-vault',$1)",[`companies/${company}/${document}/file.pdf`]);
 await act(owner,()=>db.query('SELECT public.end_company_membership($1,$2)',[company,staff]));
 await act(staff,async()=>{
  assert.equal((await db.query('SELECT public.can_read_company($1) AS ok',[company])).rows[0].ok,false);
  assert.equal((await db.query('SELECT public.can_edit_company($1) AS ok',[company])).rows[0].ok,false);
  for(const [table,condition,id] of [['documents','id',document],['audit_projects','id',project.id],['work_tasks','project_id',project.id],['project_requirements','project_id',project.id],['document_versions','id',version]])assert.equal((await db.query(`SELECT * FROM public.${table} WHERE ${condition}=$1`,[id])).rows.length,0,table);
  assert.equal((await db.query("SELECT * FROM storage.objects WHERE bucket_id='iso-vault'")).rows.length,0);
 });
 assert.equal((await db.query('SELECT * FROM public.documents WHERE id=$1',[document])).rows.length,1);
 await assert.rejects(act(staff,()=>db.query('SELECT public.end_company_membership($1,$2)',[company,owner])),/owner/);
 await assert.rejects(act(owner,()=>db.query('SELECT public.end_company_membership($1,$2)',[company,owner])),/Self removal/);
});
test('auditor role alone cannot read other companies; inactive memberships cannot self reactivate',async()=>{
 await db.query("UPDATE public.profiles SET role='AUDITOR' WHERE id=$1",[staff]);
 await act(staff,async()=>assert.equal((await db.query('SELECT * FROM public.documents WHERE id=$1',[document])).rows.length,0));
 await assert.rejects(act(staff,()=>db.query('UPDATE public.company_members SET is_active=true WHERE company_id=$1 AND user_id=$2',[company,staff])),/permission/);
 await assert.rejects(act(null,()=>db.query('SELECT * FROM public.company_join_codes'),'anon'),/permission/);
});

test('server refuses schedules beyond target and reapproval safely restores only the requested company',async()=>{
 const p=payload('30000000-0000-4000-8000-000000000007');p.tasks[0].dueDate='2026-12-11';await assert.rejects(create(p),/exceeds/);
 const code=await act(owner,async()=>(await db.query('SELECT public.company_join_code($1) AS code',[company])).rows[0].code);
 const req=await act(staff,async()=>(await db.query('SELECT public.request_company_join($1) AS id',[code])).rows[0].id);
 await act(owner,()=>db.query("SELECT public.decide_company_join($1,true,'EDITOR')",[req]));
 // AUDITOR accounts remain read-only even with an editor membership.
 await act(staff,async()=>{assert.equal((await db.query('SELECT public.can_read_company($1) AS ok',[company])).rows[0].ok,true);assert.equal((await db.query('SELECT public.can_edit_company($1) AS ok',[company])).rows[0].ok,false);assert.equal((await db.query('SELECT * FROM public.companies WHERE id=$1',[otherCompany])).rows.length,0);});
});

test('requirement draft generation and review state preserve company scope and never auto-approve',async()=>{
 const reqRow=(await db.query('SELECT * FROM public.project_requirements WHERE project_id=$1',[project.id])).rows[0];
 assert.equal(requirementReviewState({document_id:null},null),'MISSING');
 const draft=buildRequirementDraftDocument(
  {id:reqRow.id,requirement_key:'REQ-9001-01',title:'품질경영시스템 적용범위 및 품질매뉴얼',standard:'ISO_9001',source_version:reqRow.source_version},
  {id:project.id,companyId:company,clientName:'미래정밀',title:'2026 ISO 9001 준비',standards:['ISO_9001']},
  ISO_MANDATORY_REQUIREMENTS
 );
 assert.equal(draft.companyId,company);
 assert.equal(draft.status,'DRAFT');
 assert.equal(draft.reviewStatus,'DRAFT');
 assert.equal(draft.docStatus,DOCUMENT_REVIEW_STATUSES.DRAFT);
 assert.equal(draft.expiryDate,null);
 assert.equal(draft.approvalDate,null);
 assert.match(draft.contentDraft,/미래정밀/);
 assert.doesNotMatch(draft.contentDraft,/\(주\)아이소에듀/);
 assert.equal(draft.projectOrigin.projectId,project.id);
 assert.equal(draft.projectOrigin.requirementId,reqRow.id);

 const rowInput=toDocumentRow({...draft,id:'40000000-0000-4000-8000-000000000001'});
 const savedDocRow=await act(owner,async()=>(await db.query(
  'INSERT INTO public.documents(id,company_id,certification_code,hierarchy_level,clause_number,code,title,status,summary,content_draft,checklist,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
  [rowInput.id,rowInput.company_id,rowInput.certification_code,rowInput.hierarchy_level,rowInput.clause_number,rowInput.code,rowInput.title,rowInput.status,rowInput.summary,rowInput.content_draft,JSON.stringify(rowInput.checklist),rowInput.metadata]
 )).rows[0]);
 const linkedReq=await act(owner,async()=>(await db.query('UPDATE public.project_requirements SET document_id=$1 WHERE id=$2 RETURNING *',[savedDocRow.id,reqRow.id])).rows[0]);
 const restoredDoc=fromDocumentRow(savedDocRow);
 assert.equal(requirementReviewState(linkedReq,restoredDoc),'DRAFT');

 const inReview=applyDocumentReviewStatus(restoredDoc,'REVIEW');
 assert.equal(inReview.status,'DRAFT');
 assert.equal(inReview.docStatus,DOCUMENT_REVIEW_STATUSES.REVIEW);
 assert.equal(requirementReviewState(linkedReq,inReview),'REVIEW');

 const verified=applyDocumentReviewStatus(inReview,'VERIFIED');
 assert.equal(verified.status,'READY');
 assert.equal(verified.docStatus,DOCUMENT_REVIEW_STATUSES.VERIFIED);
 assert.equal(requirementReviewState(linkedReq,verified),'VERIFIED');
 assert.throws(()=>applyDocumentReviewStatus(verified,'INVALID_STATE'),/확인 상태/);
});

test('automation points: auto-match existing documents, batch draft creation, and work_tasks schedule sync pass DB trigger validation',async()=>{
 const unlinkedReqs=[
  {id:'req-1',company_id:company,requirement_key:'REQ-9001-01',title:'품질경영시스템 적용범위 및 품질매뉴얼',standard:'ISO_9001',document_id:null},
  {id:'req-2',company_id:company,requirement_key:'REQ-9001-02',title:'품질방침 선언서',standard:'ISO_9001',document_id:null},
  {id:'req-3',company_id:company,requirement_key:'REQ-9001-13',title:'내부심사 절차서 및 연간 심사계획/결과보고서',standard:'ISO_9001',document_id:null},
 ];
 const candidateDocs=[
  {id:'doc-other-company',companyId:otherCompany,code:'QM-001',title:'타사 품질매뉴얼',standards:['ISO_9001'],hierarchyLevel:'MANUAL'},
  {id:'doc-cert-ignore',companyId:company,code:'QM-001',title:'품질경영시스템 적용범위 및 품질매뉴얼',standards:['ISO_9001'],hierarchyLevel:'CERT'},
  {id:'doc-code-match',companyId:company,code:'QM-001',title:'미래정밀 품질경영 매뉴얼',standards:['ISO_9001'],hierarchyLevel:'MANUAL'},
  {id:'doc-clause-match',companyId:company,code:'POL-99',title:'미래정밀 품질방침서',standards:['ISO_9001'],clauseNumber:'5.2',hierarchyLevel:'MANUAL'},
 ];
 const matches=findProjectRequirementMatches(unlinkedReqs,candidateDocs,ISO_MANDATORY_REQUIREMENTS,company);
 assert.equal(matches.length,2);
 assert.equal(matches[0].requirementId,'req-1');
 assert.equal(matches[0].documentId,'doc-code-match');
 assert.match(matches[0].matchReason,/QM-001/);
 assert.equal(matches[1].requirementId,'req-2');
 assert.equal(matches[1].documentId,'doc-clause-match');
 assert.match(matches[1].matchReason,/5\.2/);

 const afterMatchReqs=unlinkedReqs.map(r=>{
  const m=matches.find(item=>item.requirementId===r.id);
  return m?{...r,document_id:m.documentId}:r;
 });
 const batchDrafts=buildBatchRequirementDrafts(afterMatchReqs,{id:project.id,companyId:company,clientName:'미래정밀',title:'2026 ISO 9001 준비',standards:['ISO_9001']},ISO_MANDATORY_REQUIREMENTS);
 assert.equal(batchDrafts.length,1);
 assert.equal(batchDrafts[0].requirementId,'req-3');
 assert.equal(batchDrafts[0].draft.code,'QMS-P-004');
 assert.equal(batchDrafts[0].draft.status,'DRAFT');

 const projectTasks=(await db.query('SELECT * FROM public.work_tasks WHERE project_id=$1 ORDER BY due_date',[project.id])).rows;
 assert.equal(projectTasks.length,3);
 const allLinkedReqs=afterMatchReqs.map(r=>r.id==='req-3'?{...r,document_id:'doc-batch-3'}:r);
 const syncedDocs=[
  {...candidateDocs[2],status:'READY',reviewStatus:'VERIFIED'},
  {...candidateDocs[3],status:'DRAFT',reviewStatus:'REVIEW'},
  {...batchDrafts[0].draft,id:'doc-batch-3',status:'DRAFT',reviewStatus:'DRAFT'},
 ];
 const syncPlan=buildProjectTaskSyncPlan(projectTasks,allLinkedReqs,syncedDocs,company);
 assert.equal(syncPlan.summary.total,3);
 assert.equal(syncPlan.summary.linkedCount,3);
 assert.equal(syncPlan.summary.verifiedCount,1);
 assert.equal(syncPlan.updates.length,3);
 assert.equal(syncPlan.updates.find(u=>u.project_task_key==='preparation-1').status,'done');
 assert.equal(syncPlan.updates.find(u=>u.project_task_key==='preparation-2').status,'waiting');
 assert.equal(syncPlan.updates.find(u=>u.project_task_key==='preparation-3').status,'doing');

 await act(owner,async()=>{
  for(const u of syncPlan.updates){
   const updated=(await db.query('UPDATE public.work_tasks SET status=$1,checklist=$2 WHERE id=$3 RETURNING *',[u.status,JSON.stringify(u.checklist),u.id])).rows[0];
   assert.equal(updated.status,u.status);
   assert.equal(updated.checklist.length,u.checklist.length);
  }
 });

 assert.equal(suggestProjectTitle({companyName:'미래정밀',kind:'ISO',standards:['ISO_9001','ISO_14001']}),'미래정밀 ISO 9001·ISO 14001 인증 준비');
 assert.equal(suggestProjectTitle({companyName:'미래정밀',kind:'SUPPORT',programTitle:'2026 수출바우처 지원사업'}),'2026 수출바우처 지원사업');
 const initialTasks=suggestedProjectTasks('2026-12-15');
 const customSecond=initialTasks.map((t,idx)=>idx===1?{...t,title:'맞춤 증적 수집',dueDate:'2026-11-25'}:t);
 const resynced=syncSuggestedTaskDates(customSecond,'2026-12-20',['preparation-2']);
 assert.equal(resynced[0].dueDate,'2026-11-20');
 assert.equal(resynced[1].dueDate,'2026-11-25');
 assert.equal(resynced[1].title,'맞춤 증적 수집');
 assert.equal(resynced[2].dueDate,'2026-12-17');

 assert.equal(safeDownloadFileName('QM-01: 품질/매뉴얼*초안','doc'),'QM-01__품질_매뉴얼_초안.doc');
 const wordHtml=buildWordDocumentHtml(batchDrafts[0].draft,{companyName:'미래정밀'});
 assert.match(wordHtml,/미래정밀/);
 assert.match(wordHtml,/초안 작성 중/);
 assert.match(wordHtml,/공식 인증기관 심사·승인 별도/);
 const binderHtml=buildProjectBinderHtml({title:'2026 ISO 9001 준비',clientName:'미래정밀',targetDate:'2026-12-15'},allLinkedReqs,syncedDocs);
 assert.match(binderHtml,/구비서류 통합 준비 바인더/);
 assert.match(binderHtml,/3\/3건 연결/);
 const csv=buildProjectRequirementsCsv({title:'2026 ISO 9001 준비',clientName:'미래정밀'},allLinkedReqs,syncedDocs);
 assert.ok(csv.startsWith('\uFEFF'));
 assert.match(csv,/내부 확인 완료/);
 assert.match(csv,/내부 검토 중/);
 assert.match(csv,/초안 작성 중/);

 const placeholders=extractTemplatePlaceholders(batchDrafts[0].draft.contentDraft);
 assert.ok(placeholders.length>=3);
 assert.ok(placeholders.some(p=>p.includes('적용범위')));
 const replacedText=replaceTemplatePlaceholders(batchDrafts[0].draft.contentDraft,{
  [placeholders[0]]:'정밀기계 부품의 설계 및 제조',
 });
 assert.match(replacedText,/정밀기계 부품의 설계 및 제조/);
 assert.equal(extractTemplatePlaceholders(replacedText).includes(placeholders[0]),false);

 const qs0=summarizeQuickstartProgress({companies:[],projects:[],documents:[]});
 assert.equal(qs0.completedSteps,0);
 assert.equal(qs0.progressPercent,0);
 const qs3=summarizeQuickstartProgress({
  companies:[{id:company}],
  projects:[{id:'p1',companyId:company}],
  documents:syncedDocs,
 });
 assert.equal(qs3.step1Done,true);
 assert.equal(qs3.step2Done,true);
 assert.equal(qs3.step3Done,true);
 assert.equal(qs3.progressPercent,100);
});
