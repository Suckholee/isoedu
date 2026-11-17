import test from 'node:test';
import assert from 'node:assert/strict';
import {unzipSync,strFromU8} from 'fflate';
import {buildPlanDocx,DOCX_MIME} from '../src/lib/businessPlans/docxExport.mjs';
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const table={id:'table',type:'table',sectionId:'s1',title:'증빙 수집 표',basis:'plan',caption:'미확인 자료',source:'검토 메모',columns:['항목','확인 상태'],rows:[['준비 시간','증빙 수집 전 · 확인 필요']]};
const image={id:'image',type:'image',sectionId:'s2',title:'개념 삽화',basis:'reference',caption:'실제 제품 증빙 아님',source:'AI 생성'};
const doc=()=>({title:'시험 사업계획서',code:'AP-TEST',revisionNo:4,contentDraft:'1. 문제 인식\n고객 문제와 확인할 자료 & 검증 <계획>\n\n2. 실현 가능성\n개발과 검토',ai:{input:{type:'application_plan'},formDefinition:{title:'신청 사업계획서',sections:[{id:'s1',title:'1. 문제 인식'},{id:'s2',title:'2. 실현 가능성'}]},visuals:[table,image]}});
test('genuine DOCX embeds every picture and editable table in the correct section',()=>{
 const bytes=buildPlanDocx(doc(),{visualImages:{image:png},companyName:'시험 회사'}),files=unzipSync(bytes),xml=strFromU8(files['word/document.xml']);
 assert.match(strFromU8(files['word/styles.xml']),/<w:spacing w:val="0"\/><w:w w:val="100"\/>/);assert.match(DOCX_MIME,/wordprocessingml/);assert.ok(files['[Content_Types].xml']);assert.ok(files['word/media/image1.png']);assert.ok(!xml.includes('data:image'));assert.ok(!xml.includes('altChunk'));assert.match(xml,/증빙 수집 전 · 확인 필요/);assert.match(xml,/&amp; 검증 &lt;계획&gt;/);assert.ok(xml.indexOf('증빙 수집 표')<xml.indexOf('2. 실현 가능성'));assert.ok(xml.indexOf('개념 삽화')>xml.indexOf('2. 실현 가능성'));
 assert.match(xml,/<w:tblHeader\/>/);assert.doesNotMatch(xml,/<w:trHeight|<w:cantSplit|w:hRule="exact"/);assert.match(xml,/wp:extent cx="\d+" cy="\d+"/);
});
test('missing images fail closed; changed headings retain full text and all saved assets',()=>{
 assert.throws(()=>buildPlanDocx(doc()),/이미지/);const changed=doc();changed.contentDraft='사용자가 변경한 제목\n'+('긴 본문 내용 '.repeat(1000));changed.ai.visuals.push({...table,id:'orphan',sectionId:'removed',title:'이전 문항 표'});
 const files=unzipSync(buildPlanDocx(changed,{visualImages:{image:png}})),xml=strFromU8(files['word/document.xml']);assert.match(xml,/사용자가 변경한 제목/);assert.match(xml,/이전 문항 표/);assert.equal((xml.match(/긴 본문 내용 /g)||[]).length,1000);
});
test('wide multi-page table retains all rows without fixed heights and fits the printable width',()=>{
 const d=doc();d.ai.visuals=[{...table,columns:Array.from({length:8},(_,i)=>`열 ${i}`),rows:Array.from({length:30},(_,i)=>Array.from({length:8},(_,j)=>`${i}-${j} ${'긴 설명 '.repeat(j+1)}`))}];const files=unzipSync(buildPlanDocx(d)),xml=strFromU8(files['word/document.xml']);assert.match(xml,/29-7/);assert.doesNotMatch(xml,/<w:trHeight/);for(const grid of xml.matchAll(/<w:tblGrid>(.*?)<\/w:tblGrid>/g)){assert.equal([...grid[1].matchAll(/w:w="(\d+)"/g)].reduce((sum,m)=>sum+Number(m[1]),0),9864);}
});
