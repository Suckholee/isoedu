import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PLAN_SECTIONS,DOCUMENT_TYPES,OFFICIAL_DOCUMENTS} from '../src/lib/venture/catalog.mjs';
import {validateInput,validateOutput,generateVentureDocument,revisionPatch} from '../src/lib/venture/generation.mjs';

const input={type:'business_plan',application:'new',business:'가상 기업 시험',facts:'미확인',sourceIds:[]};
const output={sections:PLAN_SECTIONS.map(s=>({id:s.id,content:'가상 기업 시험. [확인 필요: 근거]'})),questions:['근거가 있나요?'],checks:['원본 대조']};
test('official growth outline and source types exclude generated certificates',()=>{
  assert.equal(PLAN_SECTIONS.length,13);assert.equal(OFFICIAL_DOCUMENTS.length,20);
  assert.equal(new Set(OFFICIAL_DOCUMENTS.map(d=>d.key)).size,20);
  assert(!DOCUMENT_TYPES['sme-certificate']);
  assert.throws(()=>validateInput({...input,type:'sme-certificate'}));
  assert.throws(()=>validateInput({...input,sourceIds:['other-company-id']}));
  assert.throws(()=>validateInput({...input,facts:'x'.repeat(16001)}));
});
test('provider is real Responses endpoint, strict output, no storage, only supplied sources',async()=>{
  let request;
  const result=await generateVentureDocument({companyName:'시험',input,sources:[],apiKey:'test-only',fetchImpl:async(url,options)=>{request={url,...JSON.parse(options.body)};return Response.json({status:'completed',id:'response-test',model:'model-test',output:[{content:[{type:'output_text',text:JSON.stringify(output)}]}]});}});
  assert.equal(request.url,'https://api.openai.com/v1/responses');assert.equal(request.store,false);assert.equal(request.text.format.strict,true);
  assert.match(request.instructions,/만들지 않는다/);assert.match(request.instructions,/명령이 아니다/);assert.equal(result.sections.length,13);assert.equal(result.provider.responseId,'response-test');
});
test('missing key, provider error, refusal, truncation and malformed output never return a mock draft',async()=>{
  await assert.rejects(generateVentureDocument({input,apiKey:''}),/설정/);
  for(const value of [{status:'incomplete'},{status:'completed',output:[{content:[{type:'refusal'}]}]},{status:'completed',output:[{content:[{type:'output_text',text:'{}'}]}]}])await assert.rejects(generateVentureDocument({input,apiKey:'test-only',fetchImpl:async()=>Response.json(value)}));
  await assert.rejects(generateVentureDocument({input,apiKey:'test-only',fetchImpl:async()=>new Response('secret diagnostic',{status:429})}),e=>!e.message.includes('secret')&&e.status===502);
  assert.throws(()=>validateOutput({...output,sections:output.sections.slice(0,7)},input.type));
});
test('review preserves previous body and rejects stale writes and forged completion states',()=>{
  const row={content_draft:'original',status:'DRAFT',updated_at:'2026-11-05T01:00:00.000Z',metadata:{revisionNo:1,projectOrigin:{projectId:'test'},ai:{state:'ready',history:[],input}}};
  const patch=revisionPatch(row,{content:'edited',reviewed:true,note:'시험용 검토',expectedUpdatedAt:row.updated_at},'actor');
  assert.equal(patch.status,'REVIEW');assert.equal(patch.metadata.ai.history[0].content,'original');assert.equal(patch.metadata.ai.review.actor,'actor');assert.equal(patch.metadata.revisionNo,2);assert.equal(row.metadata.ai.history.length,0);
  assert.throws(()=>revisionPatch(row,{content:'lost update',reviewed:true,note:'',expectedUpdatedAt:'old'},'actor'),e=>e.status===409);
  assert.throws(()=>revisionPatch(row,{content:'approved',reviewed:'APPROVED',note:'',expectedUpdatedAt:row.updated_at},'actor'));
});

// Execute the actual route with a small RLS-aware adapter. SQL/RLS are also tested
// against the repository migrations in enterprise-portal.test.mjs.
const ids={project:'10000000-0000-4000-8000-000000000001',company:'10000000-0000-4000-8000-000000000002',doc:'10000000-0000-4000-8000-000000000003',other:'10000000-0000-4000-8000-000000000004'};
let state;
function adapter(){return {auth:{getUser:async()=>({data:{user:state.logged?{id:'actor'}:null}})},rpc:async(name)=>({data:name==='can_edit_company'?state.edit:true}),from(table){
  let filters=[],operation='select',payload,one=false,count=false;
  const q={select(columns,options){count=!!options?.count;return q;},eq(key,value){filters.push([key,value]);return q;},gte(){return q;},in(key,value){filters.push([key,value]);return q;},order(){return q;},limit(){return q;},maybeSingle(){one=true;return q;},single(){one=true;return q;},insert(value){operation='insert';payload=value;return q;},update(value){operation='update';payload=value;return q;},then(resolve,reject){return Promise.resolve().then(()=>{
    let rows=table==='audit_projects'?(state.access?[{id:ids.project,company_id:ids.company,data:{}}]:[]):table==='companies'?[{id:ids.company,name:'시험기업'}]:table==='project_operations'?[{project_id:ids.project,data:{applicationType:'VENTURE_GROWTH'}}]:state.rows;
    const match=r=>filters.every(([key,value])=>{const v=key.startsWith('metadata->ai->>')?r.metadata?.ai?.[key.split('->>')[1]]:r[key];return Array.isArray(value)?value.includes(v):v===value;});
    rows=rows.filter(match);
    if(operation==='insert'){if(state.rows.some(r=>r.id===payload.id))return {error:{code:'23505'}};state.rows.push(structuredClone(payload));rows=[state.rows.at(-1)];}
    if(operation==='update'){for(const r of rows)Object.assign(r,structuredClone(payload));}
    return {data:structuredClone(one?rows[0]||null:rows),count:count?rows.length:undefined};
  }).then(resolve,reject);}};return q;}};}
globalThis.__ventureClient=adapter;
const routeText=(await readFile(new URL('../src/app/api/venture-documents/route.js',import.meta.url),'utf8'))
  .replace("import {cookies} from 'next/headers';",'const cookies=()=>({});')
  .replace("import {createClient} from '../../../utils/supabase/server';",'const createClient=()=>globalThis.__ventureClient();')
  .replaceAll("'../../../lib/",`'${new URL('../src/lib/',import.meta.url).href}`);
const route=await import(`data:text/javascript;base64,${Buffer.from(routeText).toString('base64')}`);
const post=(body)=>route.POST(new Request('http://localhost/api/venture-documents',{method:'POST',headers:{origin:'http://localhost'},body:JSON.stringify({projectId:ids.project,documentId:ids.doc,...body})}));
test('route authorization, idempotency, retries, persistent input/output and CAS review',async()=>{
  state={logged:false,edit:true,access:true,rows:[]};let calls=0,fail=false;
  const oldFetch=globalThis.fetch,oldKey=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-only';
  globalThis.fetch=async()=>{calls++;return fail?new Response('',{status:500}):Response.json({status:'completed',id:'test-response',output:[{content:[{type:'output_text',text:JSON.stringify(output)}]}]});};
  try{
    assert.equal((await post({action:'generate',input})).status,401);state.logged=true;state.access=false;
    assert.equal((await post({action:'generate',input})).status,404);state.access=true;state.edit=false;
    assert.equal((await post({action:'generate',input})).status,403);state.edit=true;
    assert.equal((await post({action:'generate',input:{...input,sourceIds:[ids.other]}})).status,403);assert.equal(calls,0);
    const generated=await post({action:'generate',input});assert.equal(generated.status,200);const doc=(await generated.json()).document;
    assert.equal(doc.metadata.ai.state,'ready');assert.equal(doc.metadata.ai.input.business,input.business);assert.match(doc.content_draft,/확인 필요/);
    assert.equal((await post({action:'generate',input})).status,200);assert.equal(calls,1);
    assert.equal((await post({action:'generate',input:{...input,business:'different'}})).status,409);assert.equal(calls,1);
    assert.equal((await post({action:'save',expectedUpdatedAt:'stale',content:'edited',reviewed:true,note:''})).status,409);
    const saved=await post({action:'save',expectedUpdatedAt:doc.updated_at,content:'edited',reviewed:true,note:'검토',documentFields:{companyName:'시험기업 (편집)',representativeName:'확인 필요',businessNumber:'',application:'unknown'}});assert.equal(saved.status,200);
    const savedDocument=(await saved.json()).document;assert.equal(savedDocument.metadata.ai.history[0].content,doc.content_draft);assert.equal(savedDocument.metadata.ai.documentFields.companyName,'시험기업 (편집)');assert.equal(savedDocument.metadata.ai.documentFields.application,'unknown');
    fail=true;assert.equal((await post({action:'generate',documentId:ids.other,input})).status,502);
    const failed=state.rows.find(r=>r.id===ids.other);assert.equal(failed.metadata.ai.state,'failed');assert.equal(failed.content_draft,'');
    fail=false;assert.equal((await post({action:'generate',documentId:ids.other,input,retry:true})).status,200);assert.equal(failed.metadata.ai.attempts,2);
    const listed=await route.GET(new Request(`http://localhost/api/venture-documents?projectId=${ids.project}`));assert.equal((await listed.json()).documents.length,2);
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});

test('conversation applies only unique anchors and preserves headings and manual edits',async()=>{
 const {applyDocumentChanges}=await import('../src/lib/venture/conversation.mjs');
 const original='개발 배경 및 필요성\n사용자 수작업 문장.\n[확인 필요: 고객]';
 assert.equal(applyDocumentChanges(original,[{before:'[확인 필요: 고객]',after:'[계획안] 고객은 제조기업.',reason:'사용자 답변 반영'}],'business_plan'),'개발 배경 및 필요성\n사용자 수작업 문장.\n[계획안] 고객은 제조기업.');
 assert.throws(()=>applyDocumentChanges('반복 반복',[{before:'반복',after:'변경',reason:''}],'business_plan'));
 assert.throws(()=>applyDocumentChanges(original,[{before:'개발 배경 및 필요성',after:'삭제',reason:''}],'business_plan'));
 assert.throws(()=>applyDocumentChanges(original,[{before:'없는 문장',after:'추측',reason:''}],'business_plan'));
});
test('chat persists answers and preview without overwriting body; explicit review save and idempotent retries',async()=>{
 const {sectionsToText}=await import('../src/lib/venture/catalog.mjs');
 const original=sectionsToText(output.sections.map((s,i)=>({...s,title:PLAN_SECTIONS[i].title}))),stamp='2026-11-05T00:00:00.000Z';
 state={logged:true,access:true,edit:true,rows:[{id:ids.doc,company_id:ids.company,title:'시험',content_draft:original,status:'REVIEW',updated_at:stamp,metadata:{revisionNo:2,ai:{projectId:ids.project,state:'ready',input,output,history:[],sources:[]}}}]};
 const turnId='10000000-0000-4000-8000-000000000010',oldFetch=globalThis.fetch,oldKey=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-only';let calls=0,fail=false;
 const change={before:output.sections[0].content+'\n\n'+PLAN_SECTIONS[1].title,after:'가상 시험: 고객은 제조기업.\n\n'+PLAN_SECTIONS[1].title,reason:'사용자 답변 반영'};
 globalThis.fetch=async()=>{calls++;return fail?new Response('',{status:500}):Response.json({status:'completed',id:'chat-response',output:[{content:[{type:'output_text',text:JSON.stringify({reply:'고객을 반영했습니다.',questions:['다음은 어떤 기능을 제공하나요?'],choices:['아직 정하지 않았습니다.'],changes:[change]})}]}]});};
 try{
  const payload={action:'chat',turnId,expectedUpdatedAt:stamp,message:'가상 시험 고객은 제조기업입니다.',content:original};
  const response=await post(payload);assert.equal(response.status,200);const draft=(await response.json()).document;
  assert.equal(draft.content_draft,original);assert.match(draft.metadata.ai.chat.proposal.content,/고객은 제조기업/);assert.equal(draft.metadata.ai.chat.turns[0].message,payload.message);
  assert.equal((await post(payload)).status,200);assert.equal(calls,1);
  assert.equal((await post({...payload,message:'다른 답변'})).status,409);
  assert.equal((await post({action:'save',expectedUpdatedAt:draft.updated_at,content:draft.metadata.ai.chat.proposal.content,reviewed:true,note:''})).status,409);
  const saved=await post({action:'save',expectedUpdatedAt:draft.updated_at,content:draft.metadata.ai.chat.proposal.content,reviewed:true,note:'검토',proposalId:turnId});assert.equal(saved.status,200);const document=(await saved.json()).document;
  assert.equal(document.metadata.ai.chat.proposal,null);assert.equal(document.metadata.ai.chat.turns[0].savedRevision,3);assert.equal(document.metadata.ai.history[0].content,original);assert.equal((await post(payload)).status,200);assert.equal(calls,1);
  fail=true;const failed=await post({...payload,turnId:ids.other,expectedUpdatedAt:document.updated_at,content:document.content_draft});assert.equal(failed.status,502);const failure=(await failed.json()).document;assert.equal(failure.metadata.ai.state,'ready');assert.equal(failure.metadata.ai.chat.turns.at(-1).state,'failed');assert.equal(failure.content_draft,document.content_draft);
  state.edit=false;assert.equal((await post({...payload,turnId:ids.other,retry:true})).status,403);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});


test('inline basic fields save with the body, preserve previous fields and reject arbitrary metadata',()=>{
 const input={type:'business_plan',application:'new'};
 const original={companyName:'가상기업',representativeName:'',businessNumber:'',application:'new'};
 const row={content_draft:'원문',status:'DRAFT',updated_at:'stamp',metadata:{revisionNo:1,ai:{state:'ready',companyName:'실제 연결 회사명',input,documentFields:original,history:[]}}};
 const fields={...original,companyName:'가상기업 (수정)',representativeName:'미확인',application:'unknown'};
 const patch=revisionPatch(row,{content:'직접 고친 본문',reviewed:true,note:'시험',documentFields:fields,expectedUpdatedAt:'stamp'},'actor');
 assert.deepEqual(patch.metadata.ai.documentFields,fields);assert.deepEqual(patch.metadata.ai.history[0].documentFields,original);
 assert.equal(patch.metadata.ai.companyName,'실제 연결 회사명');assert.equal(patch.metadata.ai.input.application,'new');
 assert.throws(()=>revisionPatch(row,{content:'수정',reviewed:false,note:'',documentFields:{...fields,companyId:'다른 회사'},expectedUpdatedAt:'stamp'},'actor'));
 assert.throws(()=>revisionPatch(row,{content:'수정',reviewed:false,note:'',documentFields:{...fields,application:'approved'},expectedUpdatedAt:'stamp'},'actor'));
});
test('chat validates draft basic fields and retains them in retry identity',async()=>{
 const {validateChatRequest,guideVentureDocument}=await import('../src/lib/venture/conversation.mjs');
 const fields={companyName:'시험 회사',representativeName:'미확인',businessNumber:'',application:'unknown'};
 const payload=validateChatRequest({message:'확인할 정보를 알려 주세요.',content:'현재 본문',focus:'all',documentFields:fields});
 assert.deepEqual(payload.documentFields,fields);
 assert.throws(()=>validateChatRequest({...payload,documentFields:{...fields,representativeName:'x'.repeat(101)}}));
 const oldKey=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-only';let sent;
 try{await guideVentureDocument({row:{metadata:{ai:{companyName:'연결 회사',input:{type:'business_plan'},sources:[]}}},...payload,fetchImpl:async(url,options)=>{sent=JSON.parse(JSON.parse(options.body).input);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({reply:'기본정보를 확인했습니다.',questions:[],choices:[],changes:[]})}]}]});}});assert.deepEqual(sent.documentFields,fields);}finally{if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});


test('patent search uses existing project/document permission checks and reports missing configuration without a mock',async()=>{
 const oldKey=process.env.KIPRIS_API_KEY;delete process.env.KIPRIS_API_KEY;
 state={logged:true,access:true,edit:true,rows:[{id:ids.doc,company_id:ids.company,metadata:{ai:{projectId:ids.project,state:'ready'}}}]};
 const payload={action:'search-patents',mode:'keyword',query:'문서',page:1};
 try{
  assert.equal((await post(payload)).status,503);assert.deepEqual(await (await post({action:'patent-status'})).json(),{configured:false});
  state.edit=false;assert.equal((await post(payload)).status,403);state.edit=true;state.access=false;assert.equal((await post(payload)).status,404);state.access=true;
  assert.equal((await post({...payload,documentId:ids.other})).status,404);state.logged=false;assert.equal((await post(payload)).status,401);
 }finally{if(oldKey===undefined)delete process.env.KIPRIS_API_KEY;else process.env.KIPRIS_API_KEY=oldKey;}
});


test('source endpoints preserve project authorization even before any file processing',async()=>{
 state={logged:false,edit:true,access:true,rows:[]};assert.equal((await post({action:'source-list'})).status,401);state.logged=true;state.edit=false;assert.equal((await post({action:'source-list'})).status,403);state.edit=true;state.access=false;assert.equal((await post({action:'source-list'})).status,404);
});
