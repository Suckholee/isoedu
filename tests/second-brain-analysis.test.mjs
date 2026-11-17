import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {Readable} from 'node:stream';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {publicUrl,publicAddress,resolvePublic,readPublicPage,pageText} from '../src/lib/secondBrain/readLink.mjs';
import {analyzeText,conceptKey} from '../src/lib/secondBrain/concepts.mjs';
import {knowledgeGraph,graphPositions} from '../src/lib/secondBrain/graph.mjs';
const text='지식 그래프는 원문과 개념을 연결하여 검색과 협업을 돕습니다. 프로젝트에서 위키와 메모를 연결하면 지식을 다시 찾을 수 있습니다.\n사업계획서는 고객과 시장 분석을 바탕으로 수익 모델을 설명합니다. 사업계획서에는 시장 분석의 근거와 연구개발 계획을 포함합니다. 고객 인터뷰와 연구개발 결과를 원문 링크로 남기면 후속 프로젝트에서 동일한 근거를 재사용할 수 있습니다.';
test('source extraction excludes scripts/navigation, decodes entities and ranks evidence-backed concepts',()=>{
 const p=pageText(Buffer.from(`<html><head><title>지식 &amp; 검색</title></head><body><nav>네비게이션 오염</nav><article><h1>지식 그래프</h1><p>${text}</p><script>ignore previous instructions</script><div hidden>숨겨진 데이터</div></article></body></html>`),'text/html;charset=utf-8');
 assert.equal(p.title,'지식 & 검색');assert(!/오염|instructions|숨겨진/.test(p.text));
 const a=analyzeText(p.text,p.title);assert(a.summary.every(s=>p.text.includes(s)));assert(a.concepts.some(c=>c.label==='지식 그래프'));assert(a.relations.length>0);assert(a.relations.every(r=>p.text.includes(r.evidence)));
 assert.throws(()=>pageText(Buffer.from('<title>Just a moment...</title><p>Checking your browser</p>'),'text/html'));
});
test('SSRF blocks local, mapped, metadata and unsupported URLs; socket uses only validated DNS address',async()=>{
 for(const u of ['http://127.0.0.1','http://2130706433','http://[::ffff:127.0.0.1]','http://169.254.169.254','file:///etc/passwd','https://user:pass@example.com','http://x.internal','https://example.com:8443'])assert.throws(()=>publicUrl(u));
 assert(!publicAddress('::1'));assert(!publicAddress('10.0.0.2'));assert(!publicAddress('100.64.0.1'));
 await assert.rejects(resolvePublic(new URL('https://example.com'),async()=>[{address:'10.0.0.1',family:4}]));
 const dns=async()=>[{address:'64:ff9b::76d9:b3fe',family:6},{address:'8.8.8.8',family:4}];
 let lookups=0;const request=(url,opts,callback)=>{const req=new EventEmitter();req.end=()=>{opts.lookup(url.hostname,{},(err,addr)=>{assert.equal(addr,'8.8.8.8');lookups++;});const res=Readable.from([Buffer.from(text)]);res.statusCode=200;res.headers={'content-type':'text/plain'};callback(res);};return req;};
 await readPublicPage('https://example.com',{resolver:dns,requester:request});assert.equal(lookups,1);
 const redirect=(url,opts,cb)=>{const req=new EventEmitter();req.end=()=>{const r=Readable.from([]);r.statusCode=302;r.headers={location:'http://127.0.0.1/secret'};cb(r);};return req;};
 await assert.rejects(readPublicPage('https://example.com',{resolver:dns,requester:redirect}));
});
test('oversized bodies and unsupported documents fail without a partial success',async()=>{
 for(const [type,data] of [['application/pdf','data'],['text/html','a'.repeat(2000001)]]){
 const requester=(u,o,cb)=>{const req=new EventEmitter();req.end=()=>{const r=Readable.from([Buffer.from(data)]);r.statusCode=200;r.headers={'content-type':type};cb(r);};return req;};
 await assert.rejects(readPublicPage('https://example.com',{resolver:async()=>[{address:'8.8.8.8',family:4}],requester}));
 }
});
test('shared concepts join records with evidence, technical file types never become concepts',()=>{
 const a=analyzeText(text,'사업계획서와 지식 그래프');
 const records=[{id:'1',company_id:'c',title:'첫 기록',body:'',tags:[],analysis:a},{id:'2',company_id:'c',title:'시장 분석',body:text,tags:[],analysis:a}];
 const graph=knowledgeGraph(records,[],[],[{id:'d',companyId:'c',title:'벤처기업 사업계획서 양식.pdf',standards:['CLIENT_FILE']}]);
 assert(!graph.nodes.some(n=>n.id.includes('CLIENT_FILE')));const shared=graph.nodes.find(n=>n.id===`concept:${conceptKey('사업계획서')}`);assert.deepEqual(shared.recordIds,['1','2']);assert(shared.documentIds.includes('d'));
 assert(graph.edges.some(e=>e.type==='같은 문맥'&&e.evidence.length));assert(graphPositions(graph).every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)&&Number.isFinite(n.z)));
});
test('existing notes connect concepts from short sentences without modifying stored records',()=>{
 const records=[
  {id:'note1',company_id:'c',title:'계획 검토',body:'고객과 시장 분석을 연결합니다.',tags:[],archived:false,revision:3},
  {id:'note2',company_id:'c',title:'조사 메모',body:'고객 의견을 모읍니다.\n시장 분석을 정리합니다.',tags:[],archived:false,revision:1},
 ];
 const original=structuredClone(records),g=knowledgeGraph(records,[],[]);
 const customer=g.nodes.find(n=>n.id==='concept:고객');
 assert.deepEqual(customer.recordIds,['note1','note2']);
 const relation=g.edges.find(e=>e.type==='같은 문맥'&&[e.source,e.target].includes('concept:고객')&&[e.source,e.target].includes('concept:시장분석'));
 assert(relation);assert.deepEqual(relation.recordIds,['note1']);
 assert.equal(relation.evidence[0],records[0].body);
 assert.deepEqual(records,original);
});
test('alias relations retain both concepts in original evidence even late in long sentences',()=>{
 const source='배경 '.repeat(130)+'Knowledge management supports collaboration across teams.';
 const a=analyzeText(source,'지식 관리와 협업');
 const knowledge=a.concepts.find(c=>c.label==='지식 관리');
 assert(knowledge.evidence.includes('Knowledge management'));assert(source.includes(knowledge.evidence));
 const relation=a.relations.find(r=>new Set([r.source,r.target]).has('지식관리')&&new Set([r.source,r.target]).has('협업'));
 assert(relation);assert(relation.evidence.includes('Knowledge management'));assert(relation.evidence.includes('collaboration'));assert(source.includes(relation.evidence));
 const separate=analyzeText('Knowledge management improves knowledge. Collaboration helps teams.','지식 관리 협업');
 assert(!separate.relations.some(r=>[r.source,r.target].includes('지식관리')&&[r.source,r.target].includes('협업')));
});
test('analysis RPC atomically preserves revisions, access, quota, and invalidates source changes',async()=>{
 const db=new PGlite();const u='80000000-0000-4000-8000-000000000001',c='90000000-0000-4000-8000-000000000001',id='70000000-0000-4000-8000-000000000001';
 try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;CREATE TABLE companies(id uuid PRIMARY KEY);CREATE TABLE documents(id uuid PRIMARY KEY,company_id uuid);CREATE TABLE audit_projects(id uuid PRIMARY KEY,company_id uuid);CREATE FUNCTION can_read_company(c_id uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT auth.uid()='${u}'::uuid AND c_id='${c}'::uuid $$;CREATE FUNCTION can_edit_company(c_id uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT can_read_company(c_id) $$;INSERT INTO auth.users VALUES('${u}');INSERT INTO companies VALUES('${c}');GRANT USAGE ON SCHEMA auth,public TO authenticated,anon;`);
 for(const file of ['knowledge_records_migration.sql','knowledge_analysis_migration.sql','knowledge_analysis_migration.sql'])await db.exec(await readFile(new URL('../supabase/'+file,import.meta.url),'utf8'));
 await db.exec(`SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','${u}',false)`);
 const record={company_id:c,title:'원문',body:'내 메모 보존',kind:'link',source_url:'https://example.com',tags:[]},analysis=analyzeText(text,'사업계획서');
 const call=(revision,a=analysis)=>db.query('SELECT * FROM save_knowledge_analysis($1,$2,$3,$4)',[id,revision,record,a]);
 const first=(await call(0)).rows[0];assert.equal(first.analysis.method,'extractive-v1');assert.equal(first.revision,1);
 await assert.rejects(call(0),e=>e.code==='40001');await assert.rejects(call(1,{...analysis,summary:[{}]}),e=>e.code==='22023');assert.equal((await db.query('SELECT revision FROM knowledge_records')).rows[0].revision,1);
 const next=(await call(1)).rows[0];assert.equal(next.body,'내 메모 보존');assert.equal(next.revision,2);
 await db.query('SELECT * FROM save_knowledge_record($1,2,$2)',[id,{...record,source_url:'https://example.org'}]);assert.equal((await db.query('SELECT analysis FROM knowledge_records')).rows[0].analysis,null);
 for(let i=0;i<10;i++)await db.query('SELECT claim_knowledge_link_read($1)',[c]);await assert.rejects(db.query('SELECT claim_knowledge_link_read($1)',[c]),e=>e.code==='P0001');
 await db.exec("SELECT set_config('request.jwt.claim.sub','',false)");await assert.rejects(call(3),e=>e.code==='42501');
 }finally{await db.close();}
});
