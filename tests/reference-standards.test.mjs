import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceStandard,createReferenceDraft} from '../src/lib/referenceStandards.mjs';
import {localReferenceAccess} from '../src/lib/referenceLibrary.mjs';
const reference={id:'case-001',sha256:'known-hash'};
test('cross-company draft transfers structure but no source facts, identifiers or metrics',()=>{
 const standard=referenceStandard('벤처 사업계획서','원본회사 원본대표 010-1234-5678 매출 99억원\n1. 개발배경\n2. 시장전략\n3. 팀 구성');
 const draft=createReferenceDraft({company:{id:'target-company',name:'대상회사'},item:'대상사업',headings:standard.headings,standard,reference});
 assert.equal(draft.companyId,'target-company');assert.match(draft.contentDraft,/대상회사/);assert.doesNotMatch(draft.contentDraft,/원본회사|원본대표|010-1234|99억원/);assert.equal(draft.status,'DRAFT');assert.equal(draft.referenceOrigin.sha256,'known-hash');
 assert.equal(draft.approvalDate,undefined);assert.equal(draft.approver,undefined);
});
test('missing company or business item cannot generate a saved draft',()=>{
 const standard=referenceStandard('일반','');const args={headings:['기업 현황'],standard,reference};
 assert.throws(()=>createReferenceDraft({...args,company:null,item:'사업'}));assert.throws(()=>createReferenceDraft({...args,company:{id:'x',name:'회사'},item:''}));
});
test('private reference API rejects production and cross-site requests',()=>{
 const old=process.env.NODE_ENV;
 try{process.env.NODE_ENV='production';assert.equal(localReferenceAccess(new Request('http://localhost:3000/api/reference-library')),false);process.env.NODE_ENV='development';assert.equal(localReferenceAccess(new Request('http://localhost:3000/api/reference-library',{headers:{'sec-fetch-site':'cross-site'}})),false);assert.equal(localReferenceAccess(new Request('https://example.com/api/reference-library')),false);}finally{process.env.NODE_ENV=old;}
});

test('reference-origin and target company survive repository save and reload without cross-company overwrite',async()=>{
 const {createDocumentRepository}=await import('../src/lib/documentRepository.js');
 const {toDocumentRow,fromDocumentRow}=await import('../src/lib/documentModel.js');
 const values=new Map();const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 const standard=referenceStandard('벤처 신청서','');
 const a={...createReferenceDraft({company:{id:'A',name:'A회사',industry:'제조업'},item:'A사업',headings:standard.headings,standard,reference}),id:'draft-A'};
 const b={...createReferenceDraft({company:{id:'B',name:'B회사'},item:'B사업',headings:standard.headings,standard,reference}),id:'draft-B'};
 const repo=createDocumentRepository({mode:'local',storage});await repo.save('A',[a]);await repo.save('B',[b]);
 const reloaded=createDocumentRepository({mode:'local',storage});assert.equal((await reloaded.list('A'))[0].businessItem,'A사업');assert.equal((await reloaded.list('B'))[0].businessItem,'B사업');
 assert.deepEqual(fromDocumentRow(toDocumentRow(a)).referenceOrigin,a.referenceOrigin);await assert.rejects(repo.save('A',[b]),/다른 회사/);
});

test('outline extraction excludes source names and source performance figures in headings',()=>{
 const standard=referenceStandard('벤처 신청서','1. 원본회사 실적\n2. 매출 99억원 달성\n3. 개발배경\n4. 시장전략\n5. 팀 구성','(주)원본회사 원본대표');
 assert.doesNotMatch(standard.headings.join('\n'),/원본회사|99억원/);assert.equal(standard.headings.length,3);
});
