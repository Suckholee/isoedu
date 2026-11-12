import test from 'node:test';
import assert from 'node:assert/strict';
import {curateCertifications,normalizeProfile,EMPTY_PROFILE,curationHandoff} from '../src/lib/curation/engine.mjs';
import {CERTIFICATIONS,preparationDocuments,CURATION_VERSION} from '../src/lib/curation/catalog.mjs';
import {curationContext,readCuration,saveCuration,reportId} from '../src/lib/curation/repository.mjs';
import {createCurationClient} from '../src/lib/curation/client.mjs';
import {projectDraft} from '../src/lib/projectWorkflow.mjs';
import {navFromPath,platformHref,validPlatformPath} from '../src/lib/platformRoutes.mjs';
const company={id:'a0000000-0000-4000-a000-000000000001',name:'가상 검토 기업',industry:'소프트웨어'};
const other='a0000000-0000-4000-a000-000000000002';
const today='2026-11-06';
const get=(id,p)=>curateCertifications({...EMPTY_PROFILE,...p},{today}).find(x=>x.id===id);
const good={operating:'yes',sme:'yes',technology:'yes',growth:'yes',managementInnovation:'yes',ventureExcluded:'no',innobizExcluded:'no',mainbizExcluded:'no',foundedAt:'2020-01-01',goals:['investment','research']};
test('blank input stays unknown; no unsupported eligibility/probability or false SME assumptions',()=>{
 const rows=curateCertifications(EMPTY_PROFILE,{today});assert.equal(rows.length,9);assert(rows.every(x=>x.status==='missing'&&x.eligibility==='not-determined'));assert(rows.every(x=>!Object.hasOwn(x,'probability')));assert.equal(get('VENTURE_GROWTH',good).status,'priority');assert.equal(get('VENTURE_GROWTH',{...good,sme:'no'}).status,'conditions');assert.equal(get('VENTURE_GROWTH',{...good,ventureExcluded:''}).status,'missing');
});
test('calendar age boundary, leap dates, exclusions and unknowns are distinguished',()=>{
 assert.equal(get('INNOBIZ',{...good,foundedAt:'2023-11-07'}).status,'conditions');assert.equal(get('INNOBIZ',{...good,foundedAt:'2023-11-06'}).status,'missing');assert.equal(get('INNOBIZ',{...good,foundedAt:'2023-11-05'}).status,'priority');assert.equal(get('MAINBIZ',{...good,foundedAt:'2023-11-06'}).status,'candidate');assert.equal(get('MAINBIZ',{...good,mainbizExcluded:'yes'}).status,'conditions');
 assert.throws(()=>normalizeProfile({...good,foundedAt:'2023-02-29'},today));assert.throws(()=>normalizeProfile({...good,foundedAt:'2026-11-07'},today));assert.doesNotThrow(()=>normalizeProfile({...good,foundedAt:'2024-02-29'},today));
});
test('renewal is based on explicit dated holdings; no expiry is not an active certificate',()=>{
 assert.equal(get('ISO_9001',{operating:'yes',held:[{id:'ISO_9001',expiresAt:''}]}).status,'missing');
 assert.equal(get('ISO_9001',{held:[{id:'ISO_9001',expiresAt:'2026-11-05'}]}).status,'renewal');
 assert.equal(get('ISO_9001',{held:[{id:'ISO_9001',expiresAt:'2027-11-06'}]}).status,'held');
 assert.equal(get('ISO_9001',{operating:'yes',goals:['customer']}).status,'priority');
});
test('researcher requirements use explicit size, date and valid holding, never a recommendation',()=>{
 const p={...good,employeeCount:'5',researcherCount:'2',researchSize:'small',researchStaffQualified:'yes',researchSpace:'yes',nonResearchStaff:'yes'};
 assert.equal(get('RESEARCH_LAB',p).status,'conditions');assert.equal(get('RESEARCH_DEPARTMENT',p).status,'priority');assert.equal(get('RESEARCH_LAB',{...p,foundedAt:'2025-01-01'}).status,'priority');
 assert.equal(get('RESEARCH_LAB',{...p,researchSize:''}).status,'missing');
 assert.equal(get('RESEARCH_LAB',{...p,held:[{id:'VENTURE_GROWTH',expiresAt:''}]}).status,'conditions');
 assert.equal(get('RESEARCH_LAB',{...p,held:[{id:'VENTURE_GROWTH',expiresAt:'2027-01-01'}]}).status,'priority');
 assert.throws(()=>normalizeProfile({...p,employeeCount:'1'},today));assert.throws(()=>normalizeProfile({...p,researcherCount:'1.5'},today));
});
function fakeDb({auth=true,read=true,edit=true}={}){
 const rows=new Map();let race=false;const db={rows,auth:{async getUser(){return {data:{user:auth?{id:'tester'}:null}};}},async rpc(){return {data:edit};},race(){race=true;},from(table){let op='read',payload,filters=[];const query={select(){return query;},eq(k,v){filters.push([k,v]);return query;},insert(v){op='insert';payload=v;return query;},update(v){op='update';payload=v;return query;},async maybeSingle(){if(table==='companies')return {data:read&&filters.some(([k,v])=>k==='id'&&v===company.id)?company:null};let row=[...rows.values()].find(r=>filters.every(([k,v])=>r[k]===v));if(op==='read')return {data:row||null};if(op==='insert'){if(rows.has(payload.id))return {data:null,error:{code:'23505'}};rows.set(payload.id,structuredClone(payload));return {data:structuredClone(payload)};}if(race){race=false;return {data:null};}if(!row)return {data:null};row={...row,...structuredClone(payload)};rows.set(row.id,row);return {data:structuredClone(row)};}};return query;}};return db;
}
test('server checks login, company read and editor independently of account type',async()=>{
 await assert.rejects(()=>curationContext(fakeDb({auth:false}),company.id),e=>e.status===401);
 await assert.rejects(()=>curationContext(fakeDb({read:false}),company.id),e=>e.status===404);
 await assert.rejects(()=>curationContext(fakeDb({edit:false}),company.id,{write:true}),e=>e.status===403);
 const viewer=await curationContext(fakeDb({edit:false}),company.id);assert.equal(await readCuration(viewer),null);await assert.rejects(()=>saveCuration(viewer,{profile:good,expectedRevision:0}),e=>e.status===403);
 assert.notEqual(reportId(company.id),reportId(other));
});
test('saved recommendations survive reload, preserve versions, isolate companies and reject stale or concurrent saves',async()=>{
 const db=fakeDb(),ctx=await curationContext(db,company.id,{write:true});
 const saved=await saveCuration(ctx,{profile:good,expectedRevision:0,results:[{id:'fake',eligible:true}]},{now:'2026-11-06T02:00:00Z'});
 assert.equal(saved.revision,1);assert.equal(saved.results.length,9);assert(saved.results.every(r=>r.eligibility==='not-determined'));assert.equal((await readCuration(ctx)).company_id,company.id);
 await assert.rejects(()=>saveCuration(ctx,{profile:good,expectedRevision:0}),e=>e.status===409);
 const next=await saveCuration(ctx,{profile:{...good,goals:['customer']},expectedRevision:1},{now:'2026-11-06T02:01:00Z'});assert.equal(next.revision,2);assert.equal(next.history[0].revision,1);
 db.race();await assert.rejects(()=>saveCuration(ctx,{profile:good,expectedRevision:2}),e=>e.status===409);assert.equal((await readCuration(ctx)).metadata.curation.revision,2);
 const otherCtx={...ctx,company:{...company,id:other}};assert.equal(await readCuration(otherCtx),null);
});
test('local company saved inputs reload and storage errors never report success',async()=>{
 const m=new Map(),storage={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};const client=createCurationClient({cloud:false,storage});await client.save(company,good,0);assert.equal((await client.load(company)).report.revision,1);assert.equal((await client.load({id:other})).report,null);await assert.rejects(()=>client.save(company,good,0));
 const denied=createCurationClient({cloud:false,storage:{getItem:()=>null,setItem:()=>{throw Error('full');}}});await assert.rejects(()=>denied.save(company,good,0),/full/);
});
test('shared route and preparation preserve company/report/revision, not qualification',()=>{
 assert.equal(navFromPath('/certification-curation'),'curation');assert(validPlatformPath('certification-curation'));assert.match(platformHref('curation','company='+company.id),/company=/);
 const result=get('VENTURE_GROWTH',good);const h=curationHandoff({companyId:company.id,reportId:reportId(company.id),revision:2,result});assert.equal(h.eligibility,'not-determined');assert.equal(h.kind,'DOMESTIC');assert(preparationDocuments(result.id).length>0);
 const p=projectDraft({companyId:company.id,title:h.title,kind:h.kind,requirements:[],requestId:'test',curationOrigin:h});assert.equal(p.curationOrigin.sourceVersion,CURATION_VERSION);assert.equal(p.curationOrigin.revision,2);assert.throws(()=>projectDraft({...p,companyId:other}));assert(CERTIFICATIONS.every(c=>c.url.startsWith('https://')));
});
