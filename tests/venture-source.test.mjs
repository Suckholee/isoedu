import {test} from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {SOURCE_PART_BYTES,SOURCE_MAX_BYTES,validateSourceBundle,bundleRange,serveSourceBundle} from '../src/lib/venture/sourceBundle.mjs';
import {emptySourcePlan,mapSourceCells} from '../src/lib/venture/sourceMapping.mjs';
import {parsePlanForm,updatePlanSubcell} from '../src/lib/venture/planForm.mjs';
import {parsePlanSubfields} from '../src/lib/venture/planSubfields.mjs';
import {validateAnalysis,analyzeSourceUnit} from '../src/lib/venture/sourceAnalysis.mjs';
import {handleSourceAction} from '../src/lib/venture/sourceActions.mjs';
const ids={company:'10000000-0000-4000-8000-000000000002',project:'10000000-0000-4000-8000-000000000001',source:'10000000-0000-4000-8000-000000000003',doc:'10000000-0000-4000-8000-000000000004',job:'10000000-0000-4000-8000-000000000005'};
const prefix=`companies/${ids.company}/${ids.source}/`,digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const bundle={version:1,size:SOURCE_PART_BYTES+5,partSize:SOURCE_PART_BYTES,contentType:'application/pdf',fileName:'원본.pdf',originalPath:prefix+'source-original/original.pdf',parts:[{path:prefix+'source-original/part-00000',size:SOURCE_PART_BYTES,sha256:'a'.repeat(64)},{path:prefix+'source-original/part-00001',size:5,sha256:'b'.repeat(64)}]};
test('500MB bundle contract rejects missing parts, foreign paths and forged sizes',()=>{
 assert.equal(SOURCE_MAX_BYTES,500*1024*1024);assert.equal(validateSourceBundle(bundle,{companyId:ids.company,documentId:ids.source}).parts[1].start,SOURCE_PART_BYTES);
 for(const b of [{...bundle,parts:bundle.parts.slice(1)},{...bundle,size:SOURCE_MAX_BYTES+1},{...bundle,parts:[{...bundle.parts[0],path:prefix+'../other'},bundle.parts[1]]},{...bundle,parts:[bundle.parts[0],{...bundle.parts[1],size:6}]}])assert.throws(()=>validateSourceBundle(b,{companyId:ids.company,documentId:ids.source}));
});
test('original download streams correct byte ranges across parts, suffixes and end boundaries',async()=>{
 const calls=[],fetchPart=async(path,range)=>{calls.push({path,range});const [,a,b]=range.match(/bytes=(\d+)-(\d+)/);return new Response(new Uint8Array(Number(b)-Number(a)+1).fill(path.endsWith('00000')?65:66),{status:206});};
 const response=await serveSourceBundle({bundle,target:{companyId:ids.company,documentId:ids.source},request:new Request('https://app.test',{headers:{Range:`bytes=${SOURCE_PART_BYTES-2}-${SOURCE_PART_BYTES+2}`}}),fetchPart,headers:{}});
 assert.equal(await response.text(),'AABBB');assert.equal(response.status,206);assert.equal(calls.length,2);assert.equal(response.headers.get('Content-Length'),'5');assert.equal(response.headers.get('Content-Range'),`bytes ${SOURCE_PART_BYTES-2}-${SOURCE_PART_BYTES+2}/${bundle.size}`);
 assert.deepEqual(bundleRange('bytes=-2',100),{start:98,end:99,status:206});assert.equal(bundleRange('bytes=100-',100),null);
 const bad=await serveSourceBundle({bundle,target:{companyId:ids.company,documentId:ids.source},request:new Request('https://app.test',{headers:{Range:'bytes=999999999-'}}),fetchPart,headers:{}});assert.equal(bad.status,416);assert.equal(calls.length,2);
});
const fields={companyName:'시험기업',representativeName:'',businessNumber:'',application:'unknown'};
const source={id:ids.source,title:'기존 계획',metadata:{sourceAnalysis:{companyMatch:'same',cells:{'market/notAField':{value:'잘못된 항목은 무시',certainty:'clear',location:'1쪽'},'solution/model':{value:'월 구독 계획',certainty:'plan',location:'1쪽'},'market/customerGroup':{value:'잘못된 항목',certainty:'clear',location:'1쪽'}},basicFields:{}}}};
test('source mapping fills actual named cells, preserves manual content, and separates plans from facts',()=>{
 const base=emptySourcePlan('business_plan'),section=parsePlanForm(base).sections.find(s=>s.id==='solution'),key=parsePlanSubfields(section).find(f=>f.id==='model').key;
 const manual=updatePlanSubcell(base,'business_plan','solution',key,'담당자가 직접 확인한 수익모델입니다.');
 const filled=mapSourceCells({content:manual,type:'business_plan',sources:[source],fields});assert.equal(filled.content,manual);assert.equal(filled.changes.length,0);
 const proposed=mapSourceCells({content:manual,type:'business_plan',sources:[source],fields,mode:'supplement'});assert.match(proposed.content,/담당자가 직접 확인한 수익모델입니다/);assert.match(proposed.content,/\[계획안\] 월 구독 계획/);assert.match(proposed.content,/기존 계획 · 1쪽/);
 const one=mapSourceCells({content:base,type:'business_plan',sources:[source],fields});assert.equal(one.changes.length,1);assert(!one.missing.some(f=>f.sectionId==='solution'&&f.fieldId==='model'));assert.equal(one.questions.length,2);
 const before=parsePlanForm(base),after=parsePlanForm(one.content);for(const s of before.sections.filter(s=>s.id!=='solution'))assert.equal(after.sections.find(a=>a.id===s.id).value,s.value);
});
const output={summary:'기능시험 자료를 읽었습니다.',companyMatch:'same',fields:[{sectionId:'solution',fieldId:'model',value:'월 구독 계획',evidence:'월 구독형',certainty:'plan'}],basicFields:[],tables:[{title:'예산 계획',columns:['연도','금액'],rows:[['2027','90'],['2028','']],unit:'백만원',notes:'실제 지출 아님'}],charts:[{title:'시범 기업 계획',xAxis:'연도',yAxis:'개사',series:[{name:'계획',points:[{label:'2027',value:'5',unit:'개사'}]}],interpretation:'계획안',uncertainties:['실적이 아님']}],warnings:[]};
test('vision sends actual images plus text, stores no provider conversation, preserves table blanks and chart units',async()=>{
 let sent;const result=await analyzeSourceUnit({companyName:'시험',sourceName:'자료',unit:{id:1,location:'1쪽',text:'원문'},images:['data:image/jpeg;base64,/9j/'],apiKey:'test-only',fetchImpl:async(url,init)=>{assert.equal(url,'https://api.openai.com/v1/responses');sent=JSON.parse(init.body);return Response.json({status:'completed',model:'test',output:[{content:[{type:'output_text',text:JSON.stringify(output)}]}]});}});
 assert.equal(sent.store,false);assert.equal(sent.input[0].content[1].type,'input_image');assert.equal(sent.input[0].content[1].detail,'high');assert.equal(result.tables[0].rows[1][1],'');assert.equal(result.charts[0].series[0].points[0].unit,'개사');assert.throws(()=>validateAnalysis({...output,fields:[{...output.fields[0],fieldId:'invented'}]}));
 await assert.rejects(analyzeSourceUnit({unit:{},apiKey:''}),e=>e.status===503);
});
function storageAdapter(){const rows=[],objects=new Map();let deny=false;
 const db={storage:{from(){return {async download(path){return {data:objects.get(path),error:objects.has(path)?null:Error('missing')};},async upload(path,value){if(objects.has(path))return {error:Error('duplicate')};objects.set(path,value);return {data:{path}};}};}},from(table){let filters=[],op='select',payload,one=false,count=false;const q={select(c,o){count=!!o?.count;return q;},eq(k,v){filters.push([k,v]);return q;},in(k,v){filters.push([k,v]);return q;},gte(){return q;},order(){return q;},limit(){return q;},maybeSingle(){one=true;return q;},single(){one=true;return q;},insert(v){op='insert';payload=v;return q;},update(v){op='update';payload=v;return q;},then(resolve,reject){return Promise.resolve().then(()=>{let list=table==='companies'?[{id:ids.company,name:'시험기업'}]:deny?[]:rows;list=list.filter(r=>filters.every(([k,v])=>{const value=k.startsWith('metadata->')?k.split('->').slice(1).reduce((x,p)=>x?.[p.replace('>','')],r.metadata):r[k];return Array.isArray(v)?v.includes(value):value===v;}));if(op==='insert'){const row=structuredClone(payload);row.updated_at=new Date().toISOString();rows.push(row);list=[row];}if(op==='update')for(const row of list)Object.assign(row,structuredClone(payload));return {data:structuredClone(one?list[0]||null:list),count:count?list.length:undefined};}).then(resolve,reject);}};return q;}};
 return {db,rows,objects,setDeny:value=>{deny=value;}};
}
test('source job verifies original bytes, resumes analysis, preserves results and fills through a persistent review proposal',async()=>{
 const store=storageAdapter(),project={id:ids.project,company_id:ids.company},user={id:'actor'},call=body=>handleSourceAction({db:store.db,project,user,body:{sourceId:ids.source,...body}});
 const file={name:'시험.pdf',size:4,fingerprint:'f'.repeat(64)};let row=(await call({action:'source-begin',file})).source;
 store.objects.set(prefix+'source-original/part-00000',new Blob(['PDF!']));await assert.rejects(call({action:'source-part',index:0,sha256:'0'.repeat(64)}));
 await call({action:'source-part',index:0,sha256:digest('PDF!')});row=(await call({action:'source-complete'})).source;assert.equal(row.metadata.sourceBundle.size,4);
 const textPath=prefix+'analysis-input/unit-1/text.txt';store.objects.set(textPath,new Blob(['월 구독형']));await call({action:'source-unit',unit:{id:1,location:'1쪽',textPath,images:[]}});await assert.rejects(call({action:'source-prepared',total:2}));await call({action:'source-prepared',total:1});
 const oldFetch=globalThis.fetch,oldKey=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-only';let fail=true,calls=0;globalThis.fetch=async()=>{calls++;return fail?new Response('',{status:500}):Response.json({status:'completed',model:'test-model',output:[{content:[{type:'output_text',text:JSON.stringify(output)}]}]});};
 try{await assert.rejects(call({action:'source-analyze',unitId:1}));assert.equal(store.rows[0].metadata.sourceAnalysis.units[0].state,'failed');fail=false;row=(await call({action:'source-analyze',unitId:1})).source;assert.equal(row.metadata.sourceAnalysis.state,'ready');await call({action:'source-analyze',unitId:1});assert.equal(calls,2);
  const raw=await call({action:'source-result',unitId:1});assert.equal(raw.result.tables[0].rows[0][1],'90');assert.equal(raw.result.charts[0].series[0].points[0].value,'5');
  const body={action:'source-fill',documentId:ids.doc,importId:ids.job,sourceIds:[ids.source],mode:'fill'};const mapped=(await call(body)).document;assert.equal(mapped.status,'DRAFT');assert.match(mapped.metadata.ai.chat.proposal.content,/월 구독 계획/);assert(!mapped.content_draft.includes('월 구독 계획'));assert.equal(mapped.metadata.ai.chat.turns[0].questions.length,2);assert.equal((await call(body)).document.id,mapped.id);await assert.rejects(call({...body,mode:'supplement'}),e=>e.status===409);assert.equal(store.rows.length,2);
  store.setDeny(true);await assert.rejects(call({action:'source-result',unitId:1}),e=>e.status===404);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});

test('source questions exclude provided customers and customer application wording cannot set company application type',()=>{
 const base=emptySourcePlan('business_plan'),s={id:ids.source,title:'고객 자료',metadata:{sourceAnalysis:{companyMatch:'same',cells:{'market/customer':{value:'제조기업 준비팀',certainty:'clear',location:'1쪽'}},basicFields:{application:{key:'application',value:'new',evidence:'고객은 신규 신청 준비팀'}}}}};
 const mapped=mapSourceCells({content:base,type:'business_plan',sources:[s],fields});assert.equal(mapped.documentFields.application,'unknown');assert(!mapped.missing.some(f=>f.sectionId==='market'&&f.fieldId==='customer'));assert(!mapped.questions.some(q=>q.includes('목표 고객')));
 s.metadata.sourceAnalysis.basicFields.application.evidence='신청 구분: 신규';assert.equal(mapSourceCells({content:base,type:'business_plan',sources:[s],fields}).documentFields.application,'new');
});
test('conversation retains relevant unfilled evidence while bounding large source collections',async()=>{
 const {conversationSources}=await import('../src/lib/venture/conversation.mjs');const analysis=Object.fromEntries(Array.from({length:54},(_,i)=>['solution/'+i,{value:'x'.repeat(1200)+i,certainty:'clear'}]));analysis['market/customer']={value:'이미 반영한 고객'};
 const row={metadata:{ai:{sources:Array.from({length:10},(_,i)=>({id:String(i),title:'자료'+i,analysis})),sourceImport:{missingFields:[{sectionId:'solution',fieldId:'53'}]}}}};
 const result=conversationSources(row,'all','이미 반영한 고객');assert(JSON.stringify(result).length<80000);assert.equal(Object.keys(result[0].analysis)[0],'solution/53');assert(!result[0].analysis['market/customer']);assert(result[0].omittedFields>0);
});
test('changed staged images are rejected before AI analysis and a failed unit remains resumable',async()=>{
 const store=storageAdapter(),project={id:ids.project,company_id:ids.company},user={id:'actor'},call=body=>handleSourceAction({db:store.db,project,user,body:{sourceId:ids.source,...body}});
 await call({action:'source-begin',file:{name:'그림.png',size:4,fingerprint:'e'.repeat(64)}});store.objects.set(prefix+'source-original/part-00000',new Blob(['PNG!']));await call({action:'source-part',index:0,sha256:digest('PNG!')});await call({action:'source-complete'});
 const textPath=prefix+'analysis-input/unit-1/text.txt',imagePath=prefix+'analysis-input/unit-1/image-0.jpg';store.objects.set(textPath,new Blob(['표 원문']));store.objects.set(imagePath,new Blob([new Uint8Array([255,216,1,2])]));await call({action:'source-unit',unit:{id:1,location:'이미지 원문',textPath,images:[imagePath]}});await call({action:'source-prepared',total:1});store.objects.set(imagePath,new Blob([new Uint8Array([255,216,3,4])]));
 await assert.rejects(call({action:'source-analyze',unitId:1}),/준비 당시 이미지/);assert.equal(store.rows[0].metadata.sourceAnalysis.units[0].state,'failed');assert.equal(store.rows[0].metadata.sourceAnalysis.units[0].attempts,1);
});


test('review lineage covers active source imports and chat drafts without reviving discarded or saved turns',async()=>{
 const {proposalParents}=await import('../src/lib/venture/proposalLineage.mjs');
 const ids=proposalParents({proposal:{turnId:'chat',parentTurnIds:['import1']},turns:[{id:'import1',state:'ready',kind:'source-import'},{id:'import2',state:'ready',kind:'source-import'},{id:'chat',state:'ready'},{id:'old',state:'ready',savedRevision:2},{id:'discarded',state:'ready',discarded:true}]},'next');assert.deepEqual(ids,['chat','import1','import2']);
});

test('targeted reread keeps the last verified result on failure and retains old artifacts after replacement',async()=>{
 const store=storageAdapter(),project={id:ids.project,company_id:ids.company},user={id:'actor'};
 const textPath=prefix+'analysis-input/unit-1/text.txt',oldPath=prefix+'analysis-output/unit-1-1.txt';
 store.objects.set(textPath,new Blob(['표와 흐름도']));store.objects.set(oldPath,new Blob([JSON.stringify(output)]));
 store.rows.push({id:ids.source,company_id:ids.company,title:'그림 자료.pdf',updated_at:'2026-01-01T00:00:00Z',metadata:{sourceOrigin:{projectId:project.id},sourceUpload:{state:'ready'},sourceAnalysis:{prepared:true,total:1,state:'ready',cells:{},basicFields:{},units:[{id:1,location:'1쪽',textPath,textHash:digest('표와 흐름도'),images:[],state:'ready',attempts:1,outputPath:oldPath}]}}});
 const call=body=>handleSourceAction({db:store.db,project,user,body:{action:'source-analyze',sourceId:ids.source,unitId:1,...body}});
 const oldFetch=globalThis.fetch,oldKey=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-only';let fail=true,calls=0;
 globalThis.fetch=async()=>{calls++;if(fail)throw new TypeError('network timeout');return Response.json({status:'completed',model:'test',output:[{content:[{type:'output_text',text:JSON.stringify(output)}]}]});};
 try{
  await assert.rejects(call({reread:true}));let a=store.rows[0].metadata.sourceAnalysis;assert.equal(a.state,'ready');assert.equal(a.units[0].state,'ready');assert.equal(a.units[0].outputPath,oldPath);assert.equal(a.units[0].attempts,2);
  await call({});assert.equal(calls,1);fail=false;const reread=(await call({reread:true})).source.metadata.sourceAnalysis.units[0];assert.notEqual(reread.outputPath,oldPath);assert.deepEqual(reread.previousOutputs,[oldPath]);assert(store.objects.has(oldPath));assert.equal(reread.attempts,3);
  await assert.rejects(call({reread:true}),e=>e.status===429);assert.equal(calls,2);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});

test('source mapping retains early page evidence when the final rolling summary drops schedule or features',async()=>{
 const {sourceCellText}=await import('../src/lib/venture/sourceMapping.mjs');
 const cell={value:'2029년 4분기 복구 목표 48시간',evidenceByUnit:[{unitId:5,location:'5쪽',certainty:'plan',evidence:'2027년 상반기 자료 분석·양식 편집, 하반기 시범 검증. 2028년 권한·이력 관리.'},{unitId:24,location:'24쪽',certainty:'plan',evidence:'2029년 4분기 복구 목표 48시간'},{unitId:7,location:'7쪽',certainty:'uncertain',evidence:'불명확한 수치 999억원'}]};
 const text=sourceCellText(cell,'계획서.pdf');assert.match(text,/2027년 상반기/);assert.match(text,/2028년 권한/);assert.match(text,/48시간/);assert.match(text,/계획서.pdf · 5쪽/);assert(!text.includes('999억원'));
 assert.match(sourceCellText({value:'예산 15백만원',evidenceByUnit:[{certainty:'plan',location:'2쪽',evidence:'예산 1.5백만원'}]},'자료'),/1\.5백만원/);
 const anchored=sourceCellText({value:'일반 처리 흐름만 남은 요약',evidenceByUnit:[{direct:true,certainty:'plan',location:'2쪽',value:'필요서류 체크리스트·원본 관리·AI 작성 검토',evidence:'핵심 기능: 체크리스트·원본 관리·AI 작성 검토'},{direct:false,certainty:'plan',location:'24쪽',value:'일반 처리 흐름',evidence:'다른 문항 시간표 31·47·59시간'}]},'자료');assert.match(anchored,/체크리스트/);assert(!anchored.includes('31·47·59'));assert.match(anchored,/자료 · 2쪽/);
 const s={...source,metadata:{sourceAnalysis:{companyMatch:'same',cells:{'development/schedule':{...cell,certainty:'plan',location:'24쪽'}},basicFields:{}}}};
 const mapped=mapSourceCells({content:emptySourcePlan('business_plan'),type:'business_plan',sources:[s],fields});assert.match(mapped.content,/2027년 상반기/);assert.match(mapped.content,/2028년 권한/);assert.match(mapped.content,/48시간/);
});
test('JSONB key order does not mark unchanged document fields as an unsaved edit',async()=>{
 const {readDocumentFields,sameDocumentFields}=await import('../src/lib/venture/documentFields.mjs');
 const fromJsonb={application:'unknown',businessNumber:'',companyName:'네오앤피터',representativeName:''};assert(sameDocumentFields(fromJsonb,readDocumentFields({documentFields:fromJsonb})));assert(!sameDocumentFields({...fromJsonb,companyName:'수정'},readDocumentFields({documentFields:fromJsonb})));
});
