import {OFFICIAL_FORMS,FORM_COVERAGE,verifyOfficialForm} from '../src/lib/businessPlans/officialFormCatalog.mjs';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {STORED_FORM_REVIEW} from '../src/lib/businessPlans/storedFormReview.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {validateInput,validateOutput,COMMON_LIBRARY_ID,inferType} from '../src/lib/businessPlans/model.mjs';
import {applicationCatalog,generateApplication} from '../src/lib/venture/applicationActions.mjs';
import {handleVisualAction} from '../src/lib/venture/visualActions.mjs';
import {validateVisuals,visualSvg,visualsHtml} from '../src/lib/venture/visuals.mjs';
import {generateVisual} from '../src/lib/venture/visualGeneration.mjs';
import {parsePlanForm,updatePlanSubcell,buildPlanFormHtml} from '../src/lib/venture/planForm.mjs';
import {revisionPatch} from '../src/lib/venture/generation.mjs';
import {validateChatRequest,applyDocumentChanges} from '../src/lib/venture/conversation.mjs';
const company='10000000-0000-4000-8000-000000000001',foreign='10000000-0000-4000-8000-000000000002',template='20000000-0000-4000-8000-000000000001',source='20000000-0000-4000-8000-000000000002',id='30000000-0000-4000-8000-000000000001',at='2026-11-12T01:00:00.000Z';
const input=()=>({action:'generate',documentId:id,companyId:company,type:'venture',business:'가상 자료 관리 서비스',facts:'가상 검증. 현재 고객 수 미확인.',consent:true,template:{id:template,updatedAt:at,text:'1. 문제 인식\n문제와 근거\n2. 사업화 계획\n추진계획'},sources:[{id:source,updatedAt:at,text:'가상 회사. 기술 시제품 개발 중.'}]});
const output=()=>({sections:[{id:'section-1',title:'1. 문제 인식',requirement:'문제와 근거',content:'[계획안] 가상 회사의 자료를 정리합니다.',evidenceIds:[source],missing:['고객 수']},{id:'section-2',title:'2. 사업화 계획',requirement:'추진계획',content:'[확인 필요: 사업화 일정]',evidenceIds:['user'],missing:['일정']}],questions:['사업화 일정은 무엇인가요?']});
function mock(){const state={editable:true,user:{id:'actor'},calls:0,rows:[{id:template,company_id:COMMON_LIBRARY_ID,title:'벤처 양식',content_draft:'',updated_at:at,metadata:{sourceImport:{category:'reference'},migration:{sha256:STORED_FORM_REVIEW.find(r=>r.kind==='blank-form').sha256}}},{id:source,company_id:company,title:'회사 자료',content_draft:'내용',updated_at:at,metadata:{}}]};
 class Query{constructor(table){this.table=table;this.filters=[];this.op='select';}select(_,opts){this.opts=opts;return this;}eq(k,v){this.filters.push(r=>{let value=r;for(const key of k.replaceAll('->>','.').replaceAll('->','.').split('.'))value=value?.[key];return value===v;});return this;}in(k,v){this.filters.push(r=>v.includes(r[k]));return this;}gte(){return this;}order(){return this;}limit(){return this;}insert(v){this.op='insert';this.value=v;return this;}update(v){this.op='update';this.value=v;return this;}maybeSingle(){this.singleValue=true;return this;}single(){this.singleValue=true;return this;}then(resolve,reject){return Promise.resolve().then(()=>this.execute()).then(resolve,reject);}execute(){let rows=this.table==='companies'?[{id:company,name:'가상 기업'}]:this.table==='documents'?state.rows:[];let selected=rows.filter(r=>this.filters.every(f=>f(r)));if(this.op==='insert'){if(state.rows.some(x=>x.id===this.value.id))return {error:{code:'23505'}};const row={...structuredClone(this.value),updated_at:new Date().toISOString(),created_at:at};state.rows.push(row);selected=[row];}if(this.op==='update'){for(const row of selected)Object.assign(row,structuredClone(this.value));}return {data:this.opts?.head?null:structuredClone(this.singleValue?selected[0]||null:selected),count:selected.length,error:null};}}
 const db={from:t=>new Query(t),auth:{getUser:async()=>({data:{user:state.user}})},rpc:async()=>({data:state.editable})};return {state,db};}

const project={id:'40000000-0000-4000-8000-000000000001',company_id:company};
const visual=()=>({id:'50000000-0000-4000-8000-000000000001',sectionId:'section-1',type:'bar',title:'가상 매출 계획',caption:'가상 시험용',source:'사용자 계획',basis:'plan',unit:'백만원',points:[{label:'2027',value:10,evidence:'2027년 계획 10백만원'},{label:'2028',value:20,evidence:'2028년 계획 20백만원'}]});
const args=m=>({db:m.db,user:{id:'actor'},project,body:{...input(),projectId:project.id},generate:async()=>{m.state.calls++;return {...output(),provider:{model:'test'}};}});
const withKey=async(fn)=>{const key=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test';try{await fn();}finally{if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;}};
test('application draft retains dynamic headings and provenance; same request returns saved output',()=>withKey(async()=>{const m=mock(),a=args(m),r=await generateApplication(a);assert.equal(r.document.metadata.ai.kind,'venture-document');assert.equal(r.document.metadata.ai.input.type,'application_plan');assert.equal(r.document.metadata.ai.formDefinition.sections.length,2);assert.equal(r.document.metadata.ai.basis.provenance.length,2);await generateApplication(a);assert.equal(m.state.calls,1);}));
test('foreign, unresolved and stale company evidence are rejected before generation',()=>withKey(async()=>{for(const mode of ['foreign','pending','stale']){const m=mock();if(mode==='foreign')m.state.rows[1].company_id=foreign;if(mode==='pending')m.state.rows[1].metadata.sourceImport={category:'unassigned'};if(mode==='stale')m.state.rows[0].updated_at='changed';await assert.rejects(generateApplication(args(m)));assert.equal(m.state.calls,0);assert.equal(m.state.rows.length,2);}}));
test('application failure persists and explicit retry uses saved input on the same document',()=>withKey(async()=>{const m=mock(),a=args(m);await assert.rejects(generateApplication({...a,generate:async()=>{throw Error('provider unavailable');}}));assert.equal(m.state.rows.at(-1).metadata.ai.state,'failed');const r=await generateApplication({...a,body:{documentId:id,retry:true}});assert.equal(r.document.metadata.ai.state,'ready');assert.equal(m.state.rows.length,3);}));
test('permission loss and concurrent edit never overwrite application body',()=>withKey(async()=>{for(const mode of ['permission','concurrent']){const m=mock(),a=args(m);await assert.rejects(generateApplication({...a,generate:async()=>{if(mode==='permission')m.state.editable=false;else Object.assign(m.state.rows.at(-1),{content_draft:'수동 수정',updated_at:'later'});return output();}}));assert.equal(m.state.rows.at(-1).content_draft,mode==='permission'?'':'수동 수정');}}));
test('dynamic sections support isolated edits, chat focus and heading protection',()=>{const def={title:'수출 양식',sections:[{id:'section-1',title:'1. 문제 인식',guide:'근거'},{id:'section-2',title:'2. 사업화 계획',guide:'추진계획'}]},body='1. 문제 인식\n본문 A\n\n2. 사업화 계획\n본문 B';const next=updatePlanSubcell(body,'application_plan','section-1','body-0','직접 수정',def);assert.equal(parsePlanForm(next,'application_plan',def).sections[1].value,'본문 B');assert.equal(validateChatRequest({message:'보완',content:body,focus:'section-2'},def).focus,'section-2');assert.throws(()=>applyDocumentChanges(body,[{before:'2. 사업화 계획',after:'없음'}],'application_plan',def));});
test('visual validation blocks foreign images, excessive content and invalid chart values; output escapes markup',()=>{const opts={sectionIds:['section-1'],companyId:company,documentId:id};assert.equal(validateVisuals([visual()],opts).length,1);assert.throws(()=>validateVisuals([{...visual(),points:[{label:'A',value:NaN,evidence:'x'}]}],opts));assert.throws(()=>validateVisuals([{...visual(),type:'image',path:`companies/${foreign}/${id}/visuals/a.png`}],opts));assert.throws(()=>validateVisuals(Array(21).fill(visual()),opts));assert(!visualSvg({...visual(),title:'<script>'}).includes('<script>'));assert(!visualsHtml([{...visual(),title:'<img onerror=alert(1)>'}]).includes('<img onerror'));});
test('saving visuals preserves previous visual values in revision history and Word includes data, caption and embedded image',()=>withKey(async()=>{const m=mock(),r=(await generateApplication(args(m))).document;r.metadata.ai.visuals=[visual()];const changed={...visual(),caption:'검토한 계획'};const patch=revisionPatch(r,{expectedUpdatedAt:r.updated_at,content:r.content_draft,reviewed:true,note:'근거 확인',visuals:[changed]},'actor');assert.equal(patch.metadata.ai.history[0].visuals[0].caption,'가상 시험용');assert.equal(patch.metadata.ai.visuals[0].caption,'검토한 계획');const html=buildPlanFormHtml({ai:patch.metadata.ai,contentDraft:patch.content_draft,title:'시험',code:'TEST'},{visualImages:{[changed.id]:'data:image/png;base64,AAAA'}});assert.match(html,/data:image\/png;base64,AAAA/);assert.match(html,/2028년 계획 20백만원/);assert.match(html,/검토한 계획/);}));
test('visual action records request once, preserves body and rejects replay with changed content',()=>withKey(async()=>{const m=mock(),row=(await generateApplication(args(m))).document;let calls=0;const body={requestId:visual().id,expectedUpdatedAt:row.updated_at,content:row.content_draft,sectionId:'section-1',visualType:'bar',instruction:'그래프'};const a={db:m.db,user:{id:'actor'},project,row,body,generate:async()=>{calls++;return visual();}};const r=await handleVisualAction(a);assert.equal(r.document.content_draft,row.content_draft);assert.equal(r.document.metadata.ai.visualProposal.id,visual().id);await handleVisualAction({...a,row:r.document});assert.equal(calls,1);await assert.rejects(handleVisualAction({...a,row:r.document,body:{...body,content:'other'}}));}));
test('visual provider rejects invented values or quotations and never enables tools',()=>withKey(async()=>{for(const bad of [false,true]){let sent;const value={...visual(),columns:[],rows:[],nodes:[]};if(bad)value.points[0].value=999;const fn=()=>generateVisual({row:{id,company_id:company,metadata:{ai:{input:{type:'application_plan'},formDefinition:{sections:[{id:'section-1',title:'계획'}]}}}},body:{requestId:visual().id,sectionId:'section-1',visualType:'bar',instruction:'계획 그래프',content:'2027년 계획 10백만원, 2028년 계획 20백만원'},fetchImpl:async(url,o)=>{sent=JSON.parse(o.body);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(value)}]}]});}});if(bad)await assert.rejects(fn());else assert.equal((await fn()).points[1].value,20);assert.equal(sent.store,false);assert.equal(sent.tools,undefined);}}));

test('official forms retain scope, exact original fingerprint and advisory versus maximum page limits',()=>{
 assert.equal(OFFICIAL_FORMS.length,30);assert.equal(new Set(OFFICIAL_FORMS.map(f=>f.id)).size,30);
 for(const f of OFFICIAL_FORMS){const bytes=readFileSync(new URL('../public'+f.originalUrl,import.meta.url));assert.equal(bytes.length,f.fileSize);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);assert(f.text.length>100&&f.text.length<=60000);assert.match(f.sourceUrl,/^https:\/\//);assert(!f.sourceUrl.includes('Token'));}
 assert.equal(OFFICIAL_FORMS.find(f=>f.key==='prestartup-2026').requirements.bodyPages.mode,'maximum');
 assert.equal(OFFICIAL_FORMS.find(f=>f.key==='startup-general-2026').requirements.bodyPages.mode,'approximate');
 const exp=OFFICIAL_FORMS.find(f=>f.type==='export');assert.match(exp.text,/page 19/);assert(!exp.text.includes('[page 1]'));assert.equal(exp.round,'1차');
});
test('catalog excludes common examples, guides and unreviewed material without changing company sources',async()=>{
 const m=mock();for(const kind of ['example','guide','unverified'])m.state.rows.push({...m.state.rows[0],id:kind,metadata:{sourceImport:{category:'reference'},migration:{sha256:STORED_FORM_REVIEW.find(r=>r.kind===kind).sha256}}});
 const c=await applicationCatalog(m.db,project);assert.equal(c.templates.filter(t=>t.source==='official-catalog').length,30);assert(!c.templates.some(t=>['example','guide','unverified'].includes(t.id)));assert.equal(c.sources.length,1);assert.equal(c.coverage.length,11);assert.equal(c.templates.find(t=>t.id===template).type,STORED_FORM_REVIEW.find(r=>r.kind==='blank-form').type);
});
test('official template generation records exact source snapshot and still rejects foreign company evidence',()=>withKey(async()=>{
 const form=OFFICIAL_FORMS[0];const m=mock(),a=args(m);a.body={...a.body,type:form.type,template:{id:form.id,updatedAt:form.updatedAt,text:form.text}};
 const result=await generateApplication(a);const basis=result.document.metadata.ai.basis.officialForm;assert.equal(basis.key,form.key);assert.equal(basis.sha256,form.sha256);assert.equal(result.document.metadata.ai.applicationInput.template.requirements.bodyPages.value,10);
 await generateApplication(a);assert.equal(m.state.calls,1);
 const foreignMock=mock(),foreignArgs=args(foreignMock);foreignMock.state.rows[1].company_id=foreign;foreignArgs.body={...a.body};await assert.rejects(generateApplication(foreignArgs));assert.equal(foreignMock.state.calls,0);
}));
test('changed official text, version, type and common reference masquerading as template are rejected before AI',()=>withKey(async()=>{
 for(const mode of ['text','version','type','example','guide','unknown']){
  const m=mock(),a=args(m),f=OFFICIAL_FORMS[0];
  if(['text','version','type'].includes(mode)){a.body={...a.body,type:f.type,template:{id:f.id,updatedAt:f.updatedAt,text:f.text}};if(mode==='text')a.body.template.text+='tampered';if(mode==='version')a.body.template.updatedAt='old';if(mode==='type')a.body.type='export';}
  else m.state.rows[0].metadata.migration.sha256=STORED_FORM_REVIEW.find(r=>r.kind===mode)?.sha256||'unknown';
  await assert.rejects(generateApplication(a));assert.equal(m.state.calls,0);assert.equal(m.state.rows.length,2);
 }
}));


test('expanded catalog distinguishes guides, online fields and film scripts from blank forms',()=>{
 assert.equal(OFFICIAL_FORMS.filter(f=>f.documentKind==='official-form').length,25);
 assert.equal(OFFICIAL_FORMS.filter(f=>f.documentKind==='official-online-fields').length,1);
 assert.equal(OFFICIAL_FORMS.filter(f=>f.documentKind==='guide-outline').length,3);
 const v=OFFICIAL_FORMS.find(f=>f.documentKind==='video-script');assert.equal(v.submissionMode,'video');assert.equal(v.requiredSections.length,6);assert.match(v.text,/500MB/);assert(!v.text.includes('클러스터 운영기관'));
 for(const f of OFFICIAL_FORMS){assert(f.text===f.text.trim());for(const h of f.requiredSections||[])assert(f.text.replace(/\s/g,'').includes(h.replace(/\s/g,'')));}
 for(const c of FORM_COVERAGE)assert.equal(c.readyCount,OFFICIAL_FORMS.filter(f=>f.type===c.type).length);
 assert.equal(OFFICIAL_FORMS.find(f=>f.key==='venture-growth-guide-2026').requiredSections.length,13);
 assert.equal(OFFICIAL_FORMS.find(f=>f.key==='venture-rnd-guide-2026').requiredSections.length,10);
 assert.match(OFFICIAL_FORMS.find(f=>f.key==='ipnarae-incheon-2026-2').round,/인천/);
 assert.equal(FORM_COVERAGE.flatMap(c=>c.pending).length,8);
 assert(!OFFICIAL_FORMS.some(f=>f.key==='export-mss-2026-3'));
});
test('all registered variants reach the existing editor and preserve trusted submission semantics',()=>withKey(async()=>{
 for(const form of OFFICIAL_FORMS){const m=mock(),a=args(m);a.body={...a.body,type:form.type,template:{id:form.id,updatedAt:form.updatedAt,text:form.text,submissionMode:'forged',documentKind:'forged'}};
 a.generate=async({input})=>{assert.equal(input.template.submissionMode,form.submissionMode);assert.equal(input.template.documentKind,form.documentKind);return {...output(),provider:{model:'test'}};};
 const r=await generateApplication(a);assert.equal(r.document.metadata.ai.basis.officialForm.submissionMode,form.submissionMode);assert.equal(r.document.metadata.ai.basis.officialForm.sourceUrl,form.sourceUrl);assert(r.document.title.includes(form.title));
 }
}));
test('guide and video output must include every required section in order',()=>{
 for(const f of OFFICIAL_FORMS.filter(f=>f.requiredSections)){
 const i={...input(),template:{...f}},sections=f.requiredSections.map(title=>({title,requirement:'근거에 따라 작성',content:'[확인 필요: 회사 자료]',evidenceIds:[],missing:[]}));
 assert.equal(validateOutput({sections,questions:[]},i).sections.length,sections.length);
 assert.throws(()=>validateOutput({sections:sections.slice(1),questions:[]},i));
 assert.throws(()=>validateOutput({sections:[...sections].reverse(),questions:[]},i));
 }
});


import {composeVisuals} from '../src/lib/businessPlans/autoComposition.mjs';
import {completePlanImage} from '../src/lib/businessPlans/imageActions.mjs';
import {generatePlanImage} from '../src/lib/businessPlans/imageGeneration.mjs';
import {generatePlan} from '../src/lib/businessPlans/generate.mjs';
import {finishAutomaticImages,suggestCompanySources} from '../src/lib/businessPlans/oneClickClient.mjs';
const numericFacts='가상 시험용. 2027년 매출 계획 10백만원. 2028년 매출 계획 20백만원.';
const graphic=(type,change={})=>({sectionTitle:'1. 문제 인식',type,title:'가상 계획',caption:'가상 검증 자료',basis:'plan',evidenceIds:['user'],evidence:numericFacts,columns:[],rows:[],unit:'',points:[],nodes:[],imagePrompt:'',...change});
const allGraphics=()=>[
 graphic('table',{columns:['연도','매출 계획(백만원)'],rows:[['2027','10'],['2028','20']]}),
 graphic('bar',{unit:'백만원',points:[{label:'2027',value:10,evidence:'2027년 매출 계획 10백만원'},{label:'2028',value:20,evidence:'2028년 매출 계획 20백만원'}]}),
 graphic('diagram',{nodes:['고객 요청','서비스 제공']}),
 graphic('image',{imagePrompt:'고객 요청을 접수하고 정보를 정리하여 사용자에게 전달하는 서비스의 개념 삽화. 흰 배경.'})
];
function automaticArgs(m){const a=args(m);a.body={...a.body,autoCompose:true,facts:numericFacts};a.generate=async()=>{m.state.calls++;return {...output(),visualDrafts:allGraphics(),visualNotes:[],provider:{model:'test'}};};return a;}
const imageBytes=Buffer.from([255,216,255,224,0,16,255,217]);
const imageProvider=async()=>({bytes:imageBytes,contentType:'image/jpeg',model:'test-image'});
function withStorage(m){m.state.uploads=[];m.db.storage={from:bucket=>({upload:async(path,bytes,opts)=>{m.state.uploads.push({bucket,path,bytes,opts});return m.state.uploadError?{error:{message:'failed'}}:{data:{path}};}})};return m;}
test('one click stores body, editable visuals and resumable image jobs with company provenance',()=>withKey(async()=>{
 const m=mock(),a=automaticArgs(m),r=await generateApplication(a),ai=r.document.metadata.ai;
 assert.equal(ai.visuals.length,3);assert.equal(ai.autoComposition.images.length,1);assert.equal(ai.autoComposition.state,'pending-images');assert.equal(ai.applicationInput.companyProfile.name,'가상 기업');assert.equal(ai.autoComposition.images[0].sectionId,'section-1');
 await generateApplication(a);assert.equal(m.state.calls,1);
}));
test('automatic graphs and tables never use invented numeric values or template examples',()=>{
 const i={...input(),facts:numericFacts};
 for(const draft of [graphic('bar',{unit:'백만원',points:[{label:'2027',value:999,evidence:'2027년 매출 계획 10백만원'},{label:'2028',value:20,evidence:'2028년 매출 계획 20백만원'}]}),graphic('table',{columns:['매출'],rows:[['999']]}),graphic('bar',{unit:'억원',points:allGraphics()[1].points})]){
  const r=composeVisuals({visualDrafts:[draft],visualNotes:[]},{input:i,sections:output().sections});assert.equal(r.visuals.length,0);assert.equal(r.warnings.length,1);
 }
 const result=composeVisuals({visualDrafts:allGraphics(),visualNotes:[]},{input:i,sections:output().sections});assert.equal(result.visuals.length,3);
 assert.throws(()=>composeVisuals({visualDrafts:[graphic('image',{evidenceIds:['foreign']})],visualNotes:[]},{input:i,sections:output().sections}));
});
test('film applications never generate synthetic images as actual site evidence',()=>{
 const i={...input(),facts:numericFacts,template:{...input().template,submissionMode:'video'}};
 const r=composeVisuals({visualDrafts:[allGraphics()[3]],visualNotes:[]},{input:i,sections:output().sections});assert.equal(r.images.length,0);assert.match(r.warnings[0],/현장 촬영/);
});
test('image generation inserts a private saved picture once and survives replay',()=>withKey(async()=>{
 const m=withStorage(mock()),row=(await generateApplication(automaticArgs(m))).document,job=row.metadata.ai.autoComposition.images[0];let calls=0;
 const a={db:m.db,user:{id:'actor'},project,row,body:{imageId:job.id},generate:async()=>{calls++;return imageProvider();}};
 const r=await completePlanImage(a);assert.equal(r.document.metadata.ai.autoComposition.state,'ready');assert.equal(r.document.metadata.ai.visuals.length,4);assert.equal(r.document.content_draft,row.content_draft);assert.match(m.state.uploads[0].path,new RegExp('companies/'+company+'/'+row.id+'/visuals/'));assert.equal(m.state.uploads[0].opts.upsert,false);
 await completePlanImage({...a,row:r.document});assert.equal(calls,1);assert.equal(m.state.uploads.length,1);
 const image=r.document.metadata.ai.visuals.at(-1);const html=buildPlanFormHtml({title:'가상 계획',ai:r.document.metadata.ai,contentDraft:r.document.content_draft},{visualImages:{[image.id]:'data:image/jpeg;base64,/9j/'}});assert.match(html,/AI 생성 개념 그림/);assert.match(html,/data:image\/jpeg;base64/);
}));
test('image failure retains text and earlier visuals; retry only creates missing image',()=>withKey(async()=>{
 const m=withStorage(mock()),row=(await generateApplication(automaticArgs(m))).document,job=row.metadata.ai.autoComposition.images[0],a={db:m.db,user:{id:'actor'},project,row,body:{imageId:job.id}};let failed;
 try{await completePlanImage({...a,generate:async()=>{throw Error('provider down');}});}catch(e){failed=e.document;}
 assert.equal(failed.content_draft,row.content_draft);assert.equal(failed.metadata.ai.visuals.length,3);assert.equal(failed.metadata.ai.autoComposition.state,'partial');
 const r=await completePlanImage({...a,row:failed,generate:imageProvider});assert.equal(r.document.metadata.ai.autoComposition.state,'ready');assert.equal(m.state.calls,1);
}));
test('image permissions, company isolation, concurrent edits and duplicate claims prevent writes',()=>withKey(async()=>{
 for(const mode of ['foreign','permission','concurrent','revoke','duplicate']){
  const m=withStorage(mock()),row=(await generateApplication(automaticArgs(m))).document,job=row.metadata.ai.autoComposition.images[0];let calls=0;
  if(mode==='foreign')row.company_id=foreign;if(mode==='permission')m.state.editable=false;
  const a={db:m.db,user:{id:'actor'},project,row,body:{imageId:job.id},generate:async()=>{calls++;if(mode==='concurrent')Object.assign(m.state.rows.at(-1),{content_draft:'사용자 수정',updated_at:'later'});if(mode==='revoke')m.state.editable=false;if(mode==='duplicate'){const fresh=structuredClone(m.state.rows.at(-1));await assert.rejects(completePlanImage({...a,row:fresh}),/생성 중/);}return imageProvider();}};
  if(mode==='duplicate'){await completePlanImage(a);assert.equal(calls,1);assert.equal(m.state.uploads.length,1);}
  else {await assert.rejects(completePlanImage(a));assert.equal(m.state.uploads.length,0);if(mode==='concurrent')assert.equal(m.state.rows.at(-1).content_draft,'사용자 수정');if(['foreign','permission'].includes(mode))assert.equal(calls,0);}
 }
}));
test('image storage failure is never reported as completed and retry limits are enforced',()=>withKey(async()=>{
 const m=withStorage(mock()),row=(await generateApplication(automaticArgs(m))).document,job=row.metadata.ai.autoComposition.images[0];m.state.uploadError=true;
 await assert.rejects(completePlanImage({db:m.db,user:{id:'actor'},project,row,body:{imageId:job.id},generate:imageProvider}));assert.equal(m.state.rows.at(-1).metadata.ai.autoComposition.state,'partial');
 const latest=structuredClone(m.state.rows.at(-1));latest.metadata.ai.autoComposition.images[0].attempts=3;await assert.rejects(completePlanImage({db:m.db,user:{id:'actor'},project,row:latest,body:{imageId:job.id},generate:imageProvider}),/3회/);
}));
test('provider image contract uses server key and validates returned bytes without fetching image URLs',async()=>{
 let sent;
 const r=await generatePlanImage({prompt:'가상 서비스 개념',apiKey:'test-key',fetchImpl:async(url,o)=>{assert.equal(url,'https://api.openai.com/v1/images/generations');sent=JSON.parse(o.body);return Response.json({data:[{b64_json:imageBytes.toString('base64')}]});}});assert.equal(r.contentType,'image/jpeg');assert.equal(sent.n,1);assert.equal(sent.output_format,'jpeg');
 await assert.rejects(generatePlanImage({prompt:'가상',apiKey:'test',fetchImpl:async()=>Response.json({data:[{url:'https://untrusted.invalid/a.jpg'}]})}));
 await assert.rejects(generatePlanImage({prompt:'가상',apiKey:'test',fetchImpl:async()=>Response.json({data:[{b64_json:Buffer.from('<script>').toString('base64')}]})}));
});
test('single generation request asks for automatic placement with the original evidence',async()=>{
 let sent;const value={...output(),visualDrafts:allGraphics(),visualNotes:[]};const i={...input(),autoCompose:true,facts:numericFacts};
 const r=await generatePlan({input:i,companyName:'가상 기업',apiKey:'test',fetchImpl:async(url,o)=>{sent=JSON.parse(o.body);return Response.json({status:'completed',model:'test',output:[{content:[{type:'output_text',text:JSON.stringify(value)}]}]});}});
 assert.equal(sent.store,false);assert(sent.text.format.schema.required.includes('visualDrafts'));assert.match(sent.instructions,/실제 제품 사진/);assert.equal(r.visualDrafts.length,4);
});
test('client automatically completes remaining images and stops when the company workspace closes',async()=>{
 const jobs=[{id:'a',state:'ready',attempts:1},{id:'b',state:'pending',attempts:0},{id:'c',state:'pending',attempts:0}],document={id,metadata:{ai:{autoComposition:{images:jobs}}}};const calls=[];
 await finishAutomaticImages({document,api:async b=>{calls.push(b);return {document};}});assert.deepEqual(calls.map(c=>c.imageId),['b','c']);
 calls.length=0;await finishAutomaticImages({document,api:async b=>{calls.push(b);return {document};},isActive:()=>false});assert.equal(calls.length,0);
 const picks=suggestCompanySources([{id:'old-match',type:'rnd',updatedAt:'2020-01-01'},{id:'new-other',type:'finance',updatedAt:'2026-01-01'}],'rnd');assert.equal(picks[0],'old-match');
});

import {providerError} from '../src/lib/businessPlans/providerError.mjs';
test('exhausted provider credits are distinguished from a temporary request limit',async()=>{
 const e=await providerError(Response.json({error:{code:'credit_balance_exhausted',type:'insufficient_quota'}},{status:429}));assert.equal(e.status,503);assert.match(e.message,/사용 잔액/);
 const busy=await providerError(Response.json({error:{code:'rate_limit_exceeded'}},{status:429}));assert.equal(busy.status,429);assert.match(busy.message,/잠시 후/);
});
