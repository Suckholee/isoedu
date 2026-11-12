import {test} from 'node:test';import assert from 'node:assert/strict';
import {PLAN_SECTIONS,sectionsToText} from '../src/lib/venture/catalog.mjs';
import {parsePlanForm,updatePlanCell,buildPlanFormHtml} from '../src/lib/venture/planForm.mjs';
const content='[검토 표제]\n이전 수작업 문구를 보존합니다.\n\n'+sectionsToText(PLAN_SECTIONS.map(s=>({...s,content:`${s.id} 첫 문단\n\n둘째 문단 <태그> & 원문`})))+'\n';
test('form maps all 13 fields and changing a field preserves all surrounding text',()=>{
 const parsed=parsePlanForm(content);assert.equal(parsed.sections.length,13);assert.match(parsed.preamble,/수작업/);
 const field=parsed.sections.find(s=>s.id==='market'),updated=updatePlanCell(content,'business_plan','market','확인한 새 목표시장');
 assert.equal(updated,content.slice(0,field.bodyStart)+'확인한 새 목표시장'+content.slice(field.bodyEnd));
 for(const s of parsed.sections)assert.equal(updatePlanCell(content,'business_plan',s.id,s.value),content);
 assert.match(updated,/\[검토 표제\]/);assert.equal(parsePlanForm(updated).sections.length,13);
});
test('unstructured and duplicate-heading documents remain raw instead of silently losing text',()=>{
 assert.equal(parsePlanForm('기존 자유형 본문'),null);assert.equal(parsePlanForm(content+'\n목표시장 및 고객\n중복'),null);
 assert.throws(()=>updatePlanCell('형식 없음','business_plan','market','변경'));
 assert.throws(()=>updatePlanCell(content,'business_plan','market','x'.repeat(16001)));
});
test('Word form export uses the same field mapping, metadata and escaped user text',()=>{
 const html=buildPlanFormHtml({title:'시험',code:'VG-TEST',contentDraft:content,revisionNo:3,ai:{input:{type:'business_plan',application:'new'},review:{reviewed:true}}},{companyName:'네오앤피터'});
 assert.equal((html.match(/colspan="2"/g)||[]).length,13);assert.match(html,/네오앤피터/);assert.match(html,/&lt;태그&gt; &amp;/);assert.match(html,/수정 3/);assert.match(html,/검토 표제/);
 assert.match(buildPlanFormHtml({title:'자유형',contentDraft:'미분류 내용'}),/미분류 내용/);
});

test('company drive and workbench export the same venture form',async()=>{const {buildWordDocumentHtml}=await import('../src/lib/documentExport.mjs');const doc={title:'시험',contentDraft:content,ai:{kind:'venture-document',input:{type:'business_plan'}}};assert.equal(buildWordDocumentHtml(doc),buildPlanFormHtml(doc));});

test('solution paragraphs map to distinct functional categories with original text preserved',async()=>{
 const {parsePlanSubfields}=await import('../src/lib/venture/planSubfields.mjs');
 const text='네오앤피터가 준비하는 솔루션은 문서 준비 플랫폼입니다.\n\n핵심 기능은 체크리스트와 문서 생성입니다.\n\n사업모델은 구독 방식의 계획안입니다.\n\n차별점은 증빙 연결입니다.';
 const rows=parsePlanSubfields({id:'solution',value:text});
 assert.equal(rows.find(r=>r.id==='features').value,'핵심 기능은 체크리스트와 문서 생성입니다.');
 assert.equal(rows.find(r=>r.id==='model').value,'사업모델은 구독 방식의 계획안입니다.');
 assert.equal(rows.find(r=>r.id==='difference').value,'차별점은 증빙 연결입니다.');
 for(const paragraph of text.split('\n\n'))assert(rows.some(r=>r.value.includes(paragraph)));
});
test('editing a category produces stable explicit fields, preserving other paragraphs and sections',async()=>{
 const {parsePlanSubfields}=await import('../src/lib/venture/planSubfields.mjs');const {updatePlanSubcell}=await import('../src/lib/venture/planForm.mjs');
 const original=content.replace('solution 첫 문단\n\n둘째 문단 <태그> & 원문','네오앤피터 솔루션 개요\n\n핵심 기능은 원본 보관\n\n사업모델은 확인 필요');
 const before=parsePlanForm(original),solution=before.sections.find(s=>s.id==='solution');
 const rows=parsePlanSubfields(solution),field=rows.find(r=>r.id==='features');
 assert.equal(updatePlanSubcell(original,'business_plan','solution',field.key,field.value),original);
 const changed=updatePlanSubcell(original,'business_plan','solution',field.key,'핵심 기능은 증빙 매핑과 문서 검토');
 const after=parsePlanForm(changed),subfields=parsePlanSubfields(after.sections.find(s=>s.id==='solution'));
 assert.equal(subfields.find(r=>r.id==='features').value,'핵심 기능은 증빙 매핑과 문서 검토');
 assert.equal(subfields.find(r=>r.id==='model').value,'사업모델은 확인 필요');
 assert.equal(subfields.find(r=>r.id==='proof').value,'');
 for(const section of before.sections.filter(s=>s.id!=='solution'))assert.equal(after.sections.find(s=>s.id===section.id).value,section.value);
 assert.equal(after.preamble,before.preamble);
});
test('export labels describe categories instead of a generic writing-content row',()=>{
 const html=buildPlanFormHtml({title:'시험',contentDraft:content,ai:{input:{type:'business_plan'}}});
 assert(!html.includes('>작성 내용<'));for(const label of ['핵심 기능','사업모델','차별성·경쟁력','목표 고객','시장 범위·규모','자금 사용 계획'])assert(html.includes(label));
});


test('inline basic fields export identically to the editable paper without changing the linked company',()=>{
 const html=buildPlanFormHtml({title:'시험',contentDraft:content,ai:{companyName:'연결 회사',input:{type:'business_plan',application:'new'},documentFields:{companyName:'문서 기업명 <수정>',representativeName:'검토 & 확인',businessNumber:'시험용 번호',application:'unknown'}}},{companyName:'연결 회사'});
 assert.match(html,/문서 기업명 &lt;수정&gt;/);assert.match(html,/검토 &amp; 확인/);assert.match(html,/시험용 번호/);assert.match(html,/신청 구분<\/th><td[^>]*>확인 필요/);assert(!html.includes('신규 신청'));
});
