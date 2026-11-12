import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validatePatentQuery,parsePatentResponse,searchPatents} from '../src/lib/venture/kipris.mjs';
import {appendPatentEvidence} from '../src/lib/venture/patentEvidence.mjs';
import {PLAN_SECTIONS,sectionsToText} from '../src/lib/venture/catalog.mjs';
import {parsePlanForm} from '../src/lib/venture/planForm.mjs';
// Synthetic protocol fixtures, never displayed as live KIPRIS results.
const item='<item><applicationNumber>1020050050026</applicationNumber><inventionTitle>시험 &amp; 검토</inventionTitle><applicantName>타사</applicantName><registerStatus>소멸</registerStatus><registerNumber>0012345678901</registerNumber><astrtCont><![CDATA[원문 <유지>]]></astrtCont></item>';
const xml=(items=item,total=1)=>`<?xml version="1.0"?><response><header><resultCode>00</resultCode></header><body><items>${items}</items></body><count><totalCount>${total}</totalCount></count></response>`;
test('KIPRIS parsing preserves IDs, original status, entities and explicit zero results',()=>{
 const result=parsePatentResponse(xml());assert.equal(result.patents[0].registerNumber,'0012345678901');assert.equal(result.patents[0].title,'시험 & 검토');assert.equal(result.patents[0].registerStatus,'소멸');assert.equal(result.patents[0].abstract,'원문 <유지>');
 assert.deepEqual(parsePatentResponse(xml('',0)),{total:0,patents:[]});
});
test('KIPRIS rejects authentication errors, HTML, malformed XML and entity declarations instead of faking zero patents',()=>{
 for(const value of ['<html>로그인</html>',xml().replace('<totalCount>1</totalCount>',''),xml().replace('00','30'),'<!DOCTYPE a [<!ENTITY x SYSTEM "file:///etc/passwd">]>'+xml(),'<response><body></response>',xml().replace('1020050050026','invalid')])assert.throws(()=>parsePatentResponse(value));
});
test('KIPRIS request is fixed HTTPS, uses correct query fields, page size and a server key; response never includes it',async()=>{
 let url;
 const result=await searchPatents({mode:'applicant',query:'시험 회사',page:2},{apiKey:'test%2Bsecret%3D',fetchImpl:async u=>{url=u;return new Response(xml(),{headers:{'Content-Type':'application/xml'}});}});
 assert.equal(url.protocol,'https:');assert.equal(url.hostname,'plus.kipris.or.kr');assert.match(url.pathname,/getAdvancedSearch$/);assert.equal(url.searchParams.get('applicant'),'시험 회사');assert.equal(url.searchParams.get('ServiceKey'),'test+secret=');assert.equal(url.searchParams.get('numOfRows'),'10');assert.equal(url.searchParams.get('pageNo'),'2');assert(!JSON.stringify(result).includes('test+secret='));assert(!result.sourceUrl.includes('ServiceKey'));
 assert.equal(validatePatentQuery({mode:'application',query:'10-2005-0050026',page:1}).query,'1020050050026');
 assert.throws(()=>validatePatentQuery({mode:'application',query:'123',page:1}));assert.throws(()=>validatePatentQuery({mode:'keyword',query:'x',page:101}));
});
test('missing keys, network failures and excessive bodies cannot produce synthetic search results or expose provider secrets',async()=>{
 const request={mode:'keyword',query:'문서',page:1};
 await assert.rejects(searchPatents(request,{apiKey:''}),e=>e.status===503);
 await assert.rejects(searchPatents(request,{apiKey:'secret',fetchImpl:async()=>{throw Error('secret URL');}}),e=>e.status===502&&!e.message.includes('secret'));
 await assert.rejects(searchPatents(request,{apiKey:'secret',fetchImpl:async()=>new Response('secret',{status:403})}),e=>!e.message.includes('secret'));
 await assert.rejects(searchPatents(request,{apiKey:'secret',fetchImpl:async()=>new Response('x'.repeat(1500001))}));
});
test('only selected live references append to proof, preserve existing fields and never assert company ownership',()=>{
 const original=sectionsToText(PLAN_SECTIONS.map(s=>({...s,content:'사용자 원문 '+s.id}))),before=parsePlanForm(original);
 const result={...parsePatentResponse(xml()),query:'문서',queriedAt:'2026-11-04T23:00:00Z',sourceUrl:'https://plus.kipris.or.kr/'};
 const applied=appendPatentEvidence(original,'business_plan',result,['1020050050026']);assert.equal(applied.focus,'ip');assert.equal(applied.count,1);assert.match(applied.content,/KIPRIS 공개조회 참고자료 · 2026-11-05/);assert.match(applied.content,/원부 등으로 별도 확인/);assert.match(applied.content,/조회 상태: 소멸/);assert.match(applied.content,/출원인: 타사/);
 const after=parsePlanForm(applied.content);for(const section of before.sections.filter(s=>s.id!=='ip'))assert.equal(after.sections.find(s=>s.id===section.id).value,section.value);assert.match(after.sections.find(s=>s.id==='ip').value,/사용자 원문 ip/);
 assert.throws(()=>appendPatentEvidence(applied.content,'business_plan',result,['1020050050026']));assert.throws(()=>appendPatentEvidence(original,'business_plan',result,[]));
});
