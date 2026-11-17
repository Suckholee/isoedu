import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeManual,isReference,isManual,manualGraph,validateUnits,cleanManualAnalysis} from '../src/lib/secondBrain/manuals.mjs';
import {manualOption,saveManualAnalysis,sourceKey} from '../src/lib/secondBrain/manualRepository.mjs';
import {readScan} from '../src/lib/secondBrain/scanText.mjs';
const text='벤처확인을 준비하려면 연구개발과 지식재산권의 근거를 정리합니다. 시장 분석과 고객 조사를 통해 사업타당성을 설명합니다.';
test('sideways scans retry rotation and retain the clearest text, with abort and low-quality reporting',async()=>{
 const calls=[],worker={recognize:async(_image,options)=>{calls.push(options);return {data:options?{text,confidence:85}:{text:'EEE HEE',confidence:20}};}};
 const result=await readScan(worker,{});assert.equal(result.text,text);assert.equal(result.lowConfidence,false);assert.equal(calls.length,2);assert.equal(calls[1].rotateRadians,Math.PI*1.5);
 assert.equal((await readScan({recognize:async()=>({data:{text:'noise',confidence:10}})},{})).lowConfidence,true);
 const abort=new AbortController();abort.abort();await assert.rejects(readScan(worker,{},{signal:abort.signal}),{name:'AbortError'});
});
test('cached OCR fragments and their edges are excluded while domain abbreviations survive',()=>{
 const original={concepts:['Ee','FS','어떻게','연구개발','AI','IP'].map(label=>({key:label,label})),relations:[{source:'Ee',target:'연구개발'},{source:'AI',target:'연구개발'}]};
 const cleaned=cleanManualAnalysis(original);
 assert.deepEqual(cleaned.concepts.map(c=>c.label),['연구개발','AI','IP']);
 assert.deepEqual(cleaned.relations,[{source:'AI',target:'연구개발'}]);assert.equal(original.concepts.length,6);
});
test('reference graph uses actual body concepts with page evidence, not titles or unrelated links',()=>{
 const a=analyzeManual([{location:'3쪽',text}], '기술사업계획서 작성요령');
 const b=analyzeManual([{location:'8쪽',text:'연구개발과 지식재산권을 준비합니다.'}], '벤처확인 가이드');
 const g=manualGraph([{id:'a',title:'첫 매뉴얼',analysis:a},{id:'b',title:'두 번째 매뉴얼',analysis:b},{id:'unread',title:'대외비 제목만 있는 원본'}]);
 const research=g.nodes.find(n=>n.id==='concept:연구개발');assert.deepEqual(research.documentIds,['a','b']);assert(research.evidence.some(e=>e.location==='3쪽'&&text.includes(e.text)));
 assert(!g.edges.some(e=>e.source==='document:unread'||e.target==='document:unread'));
 assert(!g.nodes.some(n=>['tag','record','standard'].includes(n.type)));
 assert(g.edges.some(e=>e.type==='같은 문맥'&&e.evidence.some(x=>x.location==='8쪽')));
 assert(isManual('기술사업계획서 작성요령'));assert(!isReference({metadata:{sourceImport:{category:'unassigned'}}}));
 assert(!isReference({metadata:{sourceImport:{category:'reference',excludeFromAi:true}}}));
});
test('manual analysis includes later pages and discloses empty or excessive source failures',()=>{
 const units=[{location:'1쪽',text:'서론 '.repeat(21000)},{location:'93쪽',text:'위험성 평가와 고용유지를 검토합니다.'}];
 const a=analyzeManual(units,'운영 매뉴얼');assert(a.concepts.some(c=>c.label==='위험성 평가'&&c.locations.includes('93쪽')));assert.equal(a.unitCount,2);assert.equal(a.characters,units.reduce((n,u)=>n+u.text.length,0));
 assert.throws(()=>validateUnits([{location:'1쪽',text:''}]));assert.throws(()=>validateUnits([{location:'1쪽',text:'a'.repeat(1000001)}]));
});
function store(row,{editable=true,conflict=false}={}){
 const original=structuredClone(row);let current=structuredClone(row),patch;
 return {original,get current(){return current;},db:{rpc:async()=>({data:editable}),from:()=>{
  let update=false;const filters=[];const q={select:()=>q,eq:(key,value)=>{filters.push([key,value]);return q;},update:value=>{update=true;patch=value;return q;},maybeSingle:async()=>{
   if(!filters.every(([key,value])=>current[key]===value))return {data:null};
   if(update){if(conflict)return {data:null};current={...current,...patch};}return {data:structuredClone(current)};
  }};return q;
 }}};
}
const base=()=>({id:'70000000-0000-4000-8000-000000000001',company_id:'90000000-0000-4000-8000-000000000001',title:'연구개발 매뉴얼',content_draft:text,updated_at:'2026-11-15T00:00:00.000Z',metadata:{sourceImport:{category:'reference'},originalPath:'companies/c/d/original.pdf',migration:{sha256:'source-hash',status:'complete'},existing:'preserve'}});
test('manual analysis persists alongside original data and reloads only for the same source',async()=>{
 const row=base(),s=store(row),body={documentId:row.id,updatedAt:row.updated_at,sourceKey:sourceKey(row),units:[{location:'injected',text:'다른 임의 본문'}]};
 const saved=await saveManualAnalysis(s.db,body);assert(saved.analysis);assert.equal(saved.analysis.characters,text.length);assert.equal(s.current.content_draft,row.content_draft);assert.equal(s.current.metadata.existing,'preserve');assert.equal(s.current.metadata.originalPath,row.metadata.originalPath);
 assert(manualOption(s.current).analysis);assert.equal(manualOption({...s.current,content_draft:'원문 변경'}).analysis,null);
 assert.equal(manualOption({...s.current,metadata:{...s.current.metadata,migration:{sha256:'changed'}}}).analysis,null);
});
test('analysis rejects other categories, readonly accounts, stale sources and concurrent writes without mutation',async()=>{
 for(const mode of ['nonreference','readonly','stale','conflict']){
  const row=base();if(mode==='nonreference')row.metadata.sourceImport.category='company-material';
  const s=store(row,{editable:mode!=='readonly',conflict:mode==='conflict'}),body={documentId:row.id,updatedAt:mode==='stale'?'old':row.updated_at,sourceKey:sourceKey(row)};
  await assert.rejects(saveManualAnalysis(s.db,body));assert.deepEqual(s.current,s.original);
 }
});
