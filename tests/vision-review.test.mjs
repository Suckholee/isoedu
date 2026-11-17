import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {COMMON_CRITERIA,validateProgramRubric,validatePageEvaluation,pageScoreSummary,applyReviewChanges} from '../src/lib/businessPlans/visionReview.mjs';
import {handleVisionAction,pageEvaluationKey,visualKey} from '../src/lib/businessPlans/visionActions.mjs';
const digest=x=>createHash('sha256').update(x).digest('hex');
const annotation=()=>({criterionId:'common-problem',box:{x:100,y:120,width:500,height:200},role:'고객 문제 정의',context:'해결책을 설명하기 전 고객 문제를 제시하는 부분',evidence:'고객 인터뷰 예정',issue:'확인된 인터뷰 근거가 없음',suggestion:'대상과 검증 방법을 계획으로 구분해 제시',question:'누구를 대상으로 언제 인터뷰할 계획인가요?'});
const evaluation=()=>({summary:'시험용 페이지 평가',scores:COMMON_CRITERIA.map((c,i)=>({criterionId:c.id,score:i===0?10:null,reason:i===0?'고객 문제의 근거가 부족함':'이 페이지에서 평가하지 않음'})),annotations:[annotation()]});
test('page rubric separates nonapplicable criteria and unpublished weights, and rejects unsupported score locations',()=>{
  const program=validateProgramRubric({title:'시험 사업',version:'2026 공고 7쪽',sourceUrl:'https://example.org/notice',confirmed:true,criteria:[{title:'실행계획',description:'담당자와 일정의 구체성',maxScore:null}]});
  assert.equal(program.criteria[0].maxScore,null);assert.equal(program.criteria[0].scope,'program');
  assert.throws(()=>validateProgramRubric({...program,confirmed:false}));
  assert.throws(()=>validateProgramRubric({...program,sourceUrl:'javascript:alert(1)'}));
  const result=validatePageEvaluation(evaluation(),COMMON_CRITERIA);assert.deepEqual(pageScoreSummary(result,COMMON_CRITERIA,'common'),{score:10,maximum:20,assessed:1,total:5});
  for(const change of [value=>value.scores[0].score=21,value=>value.annotations[0].box.x=900,value=>value.annotations=[],value=>value.scores[1].criterionId='common-problem']){const value=evaluation();change(value);assert.throws(()=>validatePageEvaluation(value,COMMON_CRITERIA));}
});
test('AI proposals preserve manual text and reject duplicate, missing or oversized replacement anchors',()=>{
  assert.equal(applyReviewChanges('수동 메모\n고객 인터뷰 예정',[{before:'고객 인터뷰 예정',after:'[계획안] 제조기업 담당자 인터뷰 예정',reason:'대상 명시'}]),'수동 메모\n[계획안] 제조기업 담당자 인터뷰 예정');
  for(const content of ['고객 인터뷰 예정\n고객 인터뷰 예정','다른 본문'])assert.throws(()=>applyReviewChanges(content,[{before:'고객 인터뷰 예정',after:'수정',reason:'시험'}]));
});
function store(){
  const company='10000000-0000-4000-8000-000000000001',id='20000000-0000-4000-8000-000000000001',project={id:'30000000-0000-4000-8000-000000000001',company_id:company};
  let current={id,company_id:company,title:'시험.pdf',content_draft:'기존 저장본',updated_at:'2026-01-01T00:00:00Z',metadata:{format:'PDF',originalPath:`companies/${company}/${id}/source-original/original.pdf`,sourceUpload:{state:'ready',fingerprint:'original'},sourceAnalysis:{state:'new',units:[]}}};
  const objects=new Map(),db={storage:{from:()=>({upload:async(path,blob)=>{objects.set(path,Buffer.from(await blob.arrayBuffer()));return {};}})}};
  const persist=async(_db,row,metadata)=>{if(row.updated_at!==current.updated_at)throw Object.assign(Error('CAS conflict'),{status:409});current={...structuredClone(row),metadata:structuredClone(metadata),updated_at:new Date(Date.parse(current.updated_at)+1).toISOString()};return structuredClone(current);};
  const download=async(_db,path,max)=>{const value=objects.get(path);if(!value||value.length>max)throw Error('not found or too large');return value;};
  const plainUpload=async(_db,path,value)=>objects.set(path,Buffer.from(JSON.stringify(value)));
  const call=body=>handleVisionAction({body,db,row:structuredClone(current),user:{id:'actor'},project,persist,download,plainUpload});
  return {call,objects,get row(){return current;},set row(value){current=value;},async pages(total=2){const key=visualKey(current);for(let id=1;id<=total;id++){const path=`companies/${company}/${current.id}/vision-pages/${key}/${id}.jpg`;objects.set(path,Buffer.from([255,216,id,255,217]));await call({action:'source-vision-unit',visualKey:key,page:{id,path}});}await assert.rejects(call({action:'source-vision-complete',total:total+1}));await call({action:'source-vision-complete',total});}};
}
async function provider(fn){const old=globalThis.fetch,key=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-only';const requests=[];globalThis.fetch=async(_url,options)=>{const body=JSON.parse(options.body);requests.push(body);let value;
  switch(body.text.format.name){
  case 'plan_page_review': value=evaluation();break;
  case 'plan_document_review': value={summary:'전체 논리 연결 평가',scores:COMMON_CRITERIA.map(c=>({criterionId:c.id,score:12,reason:'여러 페이지의 근거를 연결함',pages:[1,2]})),priorities:[{issue:'검증 계획',suggestion:'고객 문제와 검증 지표 연결',question:'측정 방법은?',pages:[1,2]}],visualRecommendations:[]};break;
  default: value={reply:'대상을 확인했습니다.',questions:['검증 일정도 알려 주세요.'],changes:[{lineId:1,after:'[계획안] 제조기업 담당자 인터뷰 예정',reason:'사용자 답변으로 대상 보완'}]};
  }
  return Response.json({status:'completed',model:'test-vision',output:[{content:[{type:'output_text',text:JSON.stringify(value)}]}]});};try{await fn(requests);}finally{globalThis.fetch=old;if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;}}

test('46-page analysis resumes at the old hourly cap, saves a report, and leaves coaching available',()=>provider(async requests=>{
  const s=store();
  await s.pages(46);
  const evaluate=pageId=>s.call({action:'source-page-evaluate',pageId,expectedUpdatedAt:s.row.updated_at});
  for(let page=1;page<=28;page++)await evaluate(page);
  const coach=s.row.metadata.sourceCoach;
  const saved=structuredClone(coach.evaluations);
  const attempt={key:pageEvaluationKey(s.row,s.row.metadata.sourceVision.pages[28]),at:new Date().toISOString()};
  coach.usage.push(attempt,attempt);
  assert.equal(coach.usage.length,30);
  const progress=(await s.call({action:'source-document-result'})).progress;
  assert.deepEqual(progress.completedPageIds,Array.from({length:28},(_,i)=>i+1));
  await evaluate(1); // An already saved page is still idempotent if a caller requests it.
  for(let page=29;page<=46;page++)await evaluate(page);
  assert.equal(requests.length,46);
  assert.deepEqual(s.row.metadata.sourceCoach.evaluations.slice(0,28),saved);
  const report=await s.call({action:'source-document-evaluate',expectedUpdatedAt:s.row.updated_at});
  assert.equal(report.report.total,46);
  assert.deepEqual(JSON.parse(requests.at(-1).input[0].content[0].text).pages.map(p=>p.page),Array.from({length:46},(_,i)=>i+1));
  assert.equal((await s.call({action:'source-document-result'})).report.key,report.report.key);
  const chat={action:'source-coach-chat',pageId:1,annotationIndex:0,turnId:'40000000-0000-4000-8000-000000000001',expectedUpdatedAt:s.row.updated_at,content:'수동 메모\n고객 인터뷰 예정',message:'제조기업 담당자입니다.'};
  assert.ok((await s.call(chat)).turn);
  assert.equal(s.row.content_draft,'기존 저장본');
}));
test('vision evaluations read exact page and adjacent images, persist overlays, and keep drafts unchanged until review save',()=>provider(async requests=>{
  const s=store();await assert.rejects(s.call({action:'source-page-evaluate',pageId:1}));await s.pages();
  const result=await s.call({action:'source-page-evaluate',pageId:1,expectedUpdatedAt:s.row.updated_at});assert.equal(result.evaluation.annotations[0].box.x,100);assert.equal(s.row.content_draft,'기존 저장본');
  const inputs=requests[0].input[0].content.filter(c=>c.type==='input_image');assert.equal(inputs.length,2);assert(inputs[1].image_url.endsWith(s.objects.get(s.row.metadata.sourceVision.pages[0].path).toString('base64')));assert.equal(requests[0].store,false);
  await s.call({action:'source-page-evaluate',pageId:1});assert.equal(requests.length,1);
  const read=await s.call({action:'source-page-result',pageId:1});assert.equal(read.evaluation.annotations[0].role,'고객 문제 정의');
  const chat={action:'source-coach-chat',pageId:1,annotationIndex:0,turnId:'40000000-0000-4000-8000-000000000001',expectedUpdatedAt:s.row.updated_at,content:'수동 메모\n고객 인터뷰 예정',message:'제조기업 담당자입니다.'};
  await s.call(chat);assert.equal(s.row.content_draft,'기존 저장본');assert.equal(s.row.metadata.sourceCoach.proposal.content,'수동 메모\n[계획안] 제조기업 담당자 인터뷰 예정');
  await s.call(chat);assert.equal(requests.length,2);await assert.rejects(s.call({...chat,message:'변경된 요청'}),e=>e.status===409);
  await s.call({action:'source-coach-discard',expectedUpdatedAt:s.row.updated_at});assert.equal(s.row.metadata.sourceCoach.proposal,null);assert(s.row.metadata.sourceCoach.turns[0].discarded);
}));
test('public rubric changes invalidate prior scores, and changed page bytes or stale edits fail without losing content',()=>provider(async requests=>{
  const s=store();await s.pages();await s.call({action:'source-page-evaluate',pageId:1,expectedUpdatedAt:s.row.updated_at});
  const rubric={title:'시험 사업',version:'2026 공고 7쪽',sourceUrl:'https://example.org/notice',confirmed:true,criteria:[{title:'사업성',description:'공개 기준 원문',maxScore:30}]};
  await s.call({action:'source-rubric-save',program:rubric,expectedUpdatedAt:s.row.updated_at});await assert.rejects(s.call({action:'source-page-result',pageId:1}),e=>e.status===404);
  await assert.rejects(s.call({action:'source-page-evaluate',pageId:1,expectedUpdatedAt:'old'}),e=>e.status===409);
  s.objects.set(s.row.metadata.sourceVision.pages[0].path,Buffer.from([255,216,99]));
  await assert.rejects(s.call({action:'source-page-evaluate',pageId:1,expectedUpdatedAt:s.row.updated_at}),e=>e.status===409);assert.equal(requests.length,1);assert.equal(s.row.metadata.sourceCoach.pending,null);assert.equal(s.row.content_draft,'기존 저장본');
}));
test('PDF companions require original attestation, scoped paths and PDF bytes, and cannot replace prepared pages',async()=>{
  const s=store();s.row.metadata.format='HWPX';const path=`companies/${s.row.company_id}/${s.row.id}/vision-render/50000000-0000-4000-8000-000000000001.pdf`;
  s.objects.set(path,Buffer.from('%PDF-1.4\nfixture'));
  const body={action:'source-render-attach',expectedUpdatedAt:s.row.updated_at,fingerprint:'original',path,confirmed:true};
  await assert.rejects(s.call({...body,confirmed:false}));await assert.rejects(s.call({...body,path:'companies/other/file.pdf'}));
  await s.call(body);assert.equal(s.row.metadata.sourceRender.originalFormat,'HWPX');assert.equal(s.row.metadata.sourceRender.sha256,digest(s.objects.get(path)));assert.match(s.row.metadata.originalPath,/source-original/);
  await s.pages();await assert.rejects(s.call({...body,expectedUpdatedAt:s.row.updated_at}),e=>e.status===409);
});

test('identical images on different pages retain separate location evaluations',()=>provider(async requests=>{
  const s=store();await s.pages();
  const pages=s.row.metadata.sourceVision.pages;
  s.objects.set(pages[1].path,s.objects.get(pages[0].path));pages[1].hash=pages[0].hash;
  const a=await s.call({action:'source-page-evaluate',pageId:1,expectedUpdatedAt:s.row.updated_at});
  const b=await s.call({action:'source-page-evaluate',pageId:2,expectedUpdatedAt:s.row.updated_at});
  assert.notEqual(a.evaluation.key,b.evaluation.key);assert.equal(b.evaluation.pageId,2);assert.equal(requests.length,2);
}));
test('adding a viewer preserves legacy review keys until page images are prepared',async()=>{
  const {sourceReviewKey,hasCurrentSourceReview}=await import('../src/lib/businessPlans/sourceReview.mjs');
  const row={content_draft:'검토 본문',metadata:{sourceUpload:{state:'ready',fingerprint:'original'},sourceAnalysis:{state:'ready',units:[{id:1,textHash:'hash',outputPath:'path'}]}}};
  const key=JSON.stringify(['original',[[1,'hash','path']]]);
  row.metadata.sourceReview={reviewedContent:'검토 본문',analysisKey:key};
  assert.equal(sourceReviewKey(row),key);assert.equal(hasCurrentSourceReview(row),true);
  row.metadata.sourceVision={key:'new-page-images',prepared:true};assert.equal(hasCurrentSourceReview(row),false);
});
test('evaluation history keeps actor, timestamp and original criteria after rubric changes',()=>provider(async()=>{
  const s=store();await s.pages();const first=await s.call({action:'source-page-evaluate',pageId:1,expectedUpdatedAt:s.row.updated_at});
  assert.equal(first.evaluation.actor,'actor');assert(first.evaluation.readAt);assert.deepEqual(first.evaluation.criteria,COMMON_CRITERIA);
  await s.call({action:'source-rubric-save',program:{title:'다른 기준',version:'2026 공고',sourceUrl:'https://example.org/notice',confirmed:true,criteria:[{title:'성장성',description:'공개 원문',maxScore:10}]},expectedUpdatedAt:s.row.updated_at});
  const history=await s.call({action:'source-page-result',evaluationKey:first.evaluation.key});assert.deepEqual(history.evaluation,JSON.parse(JSON.stringify(first.evaluation)));assert.equal(s.row.metadata.sourceCoach.programHistory[0].actor,'actor');
  await assert.rejects(s.call({action:'source-page-result',evaluationKey:'foreign-key'}),e=>e.status===404);
}));

test('AI line selections preserve exact Korean text and reject invalid or duplicate locations',async()=>{
  const {guideVisionReview}=await import('../src/lib/businessPlans/visionCoach.mjs');
  const old=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-only';
  const content='사용자 메모 보존\n[확인 필요] 담당업무·경력 미확정';
  const run=changes=>guideVisionReview({image:'data:image/jpeg;base64,/9g=',content,message:'담당자 확인 필요로 표시',fetchImpl:async(_url,opts)=>{const input=JSON.parse(JSON.parse(opts.body).input[0].content[0].text);assert.equal(input.lines[1].text,content.split('\n')[1]);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({reply:'확인 필요로 남겼습니다.',questions:[],changes})}]}]});}});
  try{const result=await run([{lineId:1,after:'[확인 필요] 담당자 및 경력 확인 예정',reason:'미확정 유지'}]);assert.equal(result.proposedContent,'사용자 메모 보존\n[확인 필요] 담당자 및 경력 확인 예정');assert.equal(result.changes[0].before,content.split('\n')[1]);for(const ids of [[99],[1,1],[-1]])await assert.rejects(run(ids.map(lineId=>({lineId,after:'변경',reason:'시험'}))));}finally{if(old===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=old;}
});

test('whole-document evaluation requires every current page, resumes cached pages and invalidates on rubric changes',async()=>{
 const s=store();await s.pages();const old=globalThis.fetch,key=process.env.OPENAI_API_KEY;let pageCalls=0,reportCalls=0;process.env.OPENAI_API_KEY='test-only';
 globalThis.fetch=async(_url,options)=>{const request=JSON.parse(options.body);let value;if(request.text.format.name==='plan_document_review'){reportCalls++;const input=JSON.parse(request.input[0].content[0].text);assert.deepEqual(input.pages.map(p=>p.page),[1,2]);value={summary:'전체 논리 연결 평가',scores:COMMON_CRITERIA.map(c=>({criterionId:c.id,score:12,reason:'두 페이지를 연결한 근거',pages:[1,2]})),priorities:[{issue:'검증 계획',suggestion:'고객 문제와 검증 지표 연결',question:'측정 방법은?',pages:[1,2]}]};}else{pageCalls++;value=evaluation();}return Response.json({status:'completed',model:'test',output:[{content:[{type:'output_text',text:JSON.stringify(value)}]}]});};
 try{
  await s.call({action:'source-page-evaluate',pageId:1,expectedUpdatedAt:s.row.updated_at});
  assert.equal((await s.call({action:'source-document-result'})).progress.completed,1);
  await assert.rejects(s.call({action:'source-document-evaluate',expectedUpdatedAt:s.row.updated_at}),e=>e.status===409);
  await s.call({action:'source-page-evaluate',pageId:1});await s.call({action:'source-page-evaluate',pageId:2,expectedUpdatedAt:s.row.updated_at});assert.equal(pageCalls,2);
  const result=await s.call({action:'source-document-evaluate',expectedUpdatedAt:s.row.updated_at});assert.equal(result.report.total,2);assert.equal(result.report.actor,'actor');assert.equal(result.report.pageKeys.length,2);
  assert.deepEqual((await s.call({action:'source-document-result'})).report,JSON.parse(JSON.stringify(result.report)));await s.call({action:'source-document-evaluate'});assert.equal(reportCalls,1);
  await s.call({action:'source-rubric-save',expectedUpdatedAt:s.row.updated_at,program:{title:'사업',version:'1차',confirmed:true,sourceUrl:'https://example.org',criteria:[{title:'기준',description:'공개 기준',maxScore:null}]}});
  const changed=await s.call({action:'source-document-result'});assert.equal(changed.report,null);assert.equal(changed.progress.completed,0);assert.equal(s.row.metadata.sourceCoach.documents.length,1);
 }finally{globalThis.fetch=old;if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;}
});
test('working drafts isolate account versions, preserve reviewed text, accept empty drafts and reject stale retries',async()=>{
 const {updateWorkingDraft}=await import('../src/lib/businessPlans/workingDraft.mjs');const s=store(),row=s.row;
 const request={requestId:'one',expectedDraftVersion:0,content:'수정 중',message:'질문 작성 중',pageId:2,point:1};
 const draft=updateWorkingDraft(row,request,'a');row.metadata.sourceWorkingDrafts={a:draft};
 assert.equal(row.content_draft,'기존 저장본');assert.equal(draft.actor,'a');assert.equal(updateWorkingDraft(row,request,'a'),draft);
 assert.throws(()=>updateWorkingDraft(row,{...request,requestId:'two'},'a'),e=>e.status===409);
 assert.throws(()=>updateWorkingDraft(row,{...request,content:'다른 내용'},'a'),e=>e.status===409);
 const other=updateWorkingDraft(row,{...request,content:''},'b');assert.equal(other.version,1);assert.equal(other.content,'');assert.equal(draft.content,'수정 중');
 const next=updateWorkingDraft(row,{...request,requestId:'two',expectedDraftVersion:1,content:''},'a');assert.equal(next.version,2);
});

test('priority conversations bind to the current document report, preserve edits, and retry without another AI call',()=>provider(async requests=>{
 const {documentEvaluationState}=await import('../src/lib/businessPlans/visionActions.mjs');
 const s=store();await s.pages();for(const pageId of [1,2])await s.call({action:'source-page-evaluate',pageId,expectedUpdatedAt:s.row.updated_at});
 const state=documentEvaluationState(s.row),path='scoped-document-report';
 const report={key:state.key,total:2,summary:'文書全体の評価',scores:[],priorities:[{issue:'全体の顧客課題',suggestion:'確認した顧客を明記',question:'誰が顧客ですか',pages:[2,1]}]};
 s.objects.set(path,Buffer.from(JSON.stringify(report)));s.row.metadata.sourceCoach.documents=[{key:state.key,path}];
 const body={action:'source-coach-chat',reportKey:state.key,priorityIndex:0,pageId:1,turnId:'40000000-0000-4000-8000-000000000005',expectedUpdatedAt:s.row.updated_at,content:'수동 메모\n고객 인터뷰 예정',message:'제조기업 담당자입니다.'};
 await assert.rejects(s.call({...body,reportKey:'foreign'}),e=>e.status===409);
 await assert.rejects(s.call({...body,priorityIndex:8}));assert.equal(requests.length,2);
 const result=await s.call(body);assert.equal(result.turn.priorityIndex,0);assert.equal(result.turn.reportKey,state.key);assert.equal(result.turn.pageId,2);assert.equal(result.turn.actor,'actor');
 const input=JSON.parse(requests.at(-1).input[0].content[0].text);assert.equal(input.annotation.issue,report.priorities[0].issue);assert.equal(input.documentReview.key,state.key);
 assert.equal(s.row.content_draft,'기존 저장본');assert.match(s.row.metadata.sourceCoach.proposal.content,/^수동 메모/);
 await s.call(body);assert.equal(requests.length,3);
 await assert.rejects(s.call({...body,priorityIndex:1}));
 await assert.rejects(s.call({...body,turnId:'40000000-0000-4000-8000-000000000006',expectedUpdatedAt:s.row.updated_at}),e=>e.status===409);
 await s.call({action:'source-coach-discard',expectedUpdatedAt:s.row.updated_at});assert(s.row.metadata.sourceCoach.turns[0].discarded);
}));
test('card reply drafts round-trip per account with bounded keys and conflict protection',async()=>{
 const {updateWorkingDraft}=await import('../src/lib/businessPlans/workingDraft.mjs');const s=store(),key='a'.repeat(64)+':0';
 const body={requestId:'card-one',expectedDraftVersion:0,content:'수정 본문',message:'페이지 답변',pageId:1,point:0,cardMessages:{[key]:'작성 중인 카드 답변'},activePriority:key};
 const draft=updateWorkingDraft(s.row,body,'actor');s.row.metadata.sourceWorkingDrafts={actor:draft};
 assert.deepEqual(draft.cardMessages,body.cardMessages);assert.equal(draft.activePriority,key);assert.equal(updateWorkingDraft(s.row,body,'actor'),draft);
 assert.throws(()=>updateWorkingDraft(s.row,{...body,cardMessages:{[key]:'다른 답변'}},'actor'),e=>e.status===409);
 assert.throws(()=>updateWorkingDraft(s.row,{...body,cardMessages:{bad:'invalid'}},'actor'));
 assert.throws(()=>updateWorkingDraft(s.row,{...body,cardMessages:{[key]:'x'.repeat(4001)}},'actor'));
 assert.equal(updateWorkingDraft(s.row,body,'other').version,1);
});

test('HWP page regeneration archives the old manifest and retains saved reviews, drafts and conversation history',async()=>{
 const s=store();await s.pages();const before=structuredClone(s.row.metadata.sourceVision);
 const row=s.row;row.metadata.format='HWP';row.metadata.sourceReview={revision:2,content:'보완본 유지'};row.metadata.sourceWorkingDrafts={actor:{content:'작성 중 유지'}};row.metadata.sourceCoach={turns:[{id:'history'}],evaluations:[{key:'old-evaluation',path:'old-result'}]};s.row=row;
 await assert.rejects(s.call({action:'source-vision-unit',visualKey:before.key,page:before.pages[0]}));
 await s.pages();assert.deepEqual(s.row.metadata.sourceVisionHistory,[before]);assert.equal(s.row.metadata.sourceVision.rendererVersion,'hwpjs-0.1.1-font-ink-v4');assert.equal(s.row.metadata.sourceReview.content,'보완본 유지');assert.equal(s.row.metadata.sourceWorkingDrafts.actor.content,'작성 중 유지');assert.equal(s.row.metadata.sourceCoach.turns[0].id,'history');assert.equal(s.row.metadata.sourceCoach.evaluations[0].key,'old-evaluation');
});
