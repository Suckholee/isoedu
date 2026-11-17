import {extractConcepts,conceptRelations,conceptKey} from './concepts.mjs';

export const isReference = row => row.metadata?.sourceImport?.category === 'reference' && !row.metadata?.sourceImport?.excludeFromAi;
export const isManual = title => /매뉴얼|manual|가이드|guide|지침|요령|교재|강의|차시|작성법|필요정보/i.test(title || '');
const FILLER = new Set('어떻게 당신 기재 기재함 주요 있어야 있는지 것인 되어 하여 현재 다양한 관련사항 관련내용 가이 녹화됨 성함 본인 느낀표 무버다 백만원 단위 표서 계정임 STEP STEP1 STEP2 STEP3 STEP4 STEP5'.toLowerCase().split(' '));
const SHORT_TERMS = new Set(['ai','ui','ux','it','ip','hr','vr','ar','ml','qa','qc']);
const usableConcept = c => !FILLER.has(c.label.toLowerCase()) && (!/^[a-z]{2}$/i.test(c.label) || SHORT_TERMS.has(c.label.toLowerCase()));
// Filter OCR fragments in existing caches as well as new analyses without altering the original document.
export function cleanManualAnalysis(analysis) {
 const concepts=analysis.concepts.filter(usableConcept),keys=new Set(concepts.map(c=>c.key));
 return {...analysis,concepts,relations:analysis.relations.filter(r=>keys.has(r.source)&&keys.has(r.target))};
}
export function validateUnits(units) {
 if(!Array.isArray(units)||!units.length||units.length>2000)throw Error('본문의 쪽·구간 정보를 확인해 주세요.');
 let total=0;
 const result=units.map((unit,i)=>{
  if(typeof unit?.text!=='string'||typeof unit.location!=='string'||unit.location.length>160)throw Error('본문 형식을 확인해 주세요.');
  total+=unit.text.length;if(total>1000000)throw Error('한 문서의 본문은 100만 자까지 읽을 수 있습니다.');
  return {text:unit.text,location:unit.location||`구간 ${i+1}`};
 });
 if(!result.some(u=>u.text.trim()))throw Error('읽을 수 있는 본문이 없습니다. 원본을 확인해 주세요.');
 return result;
}
export function analyzeManual(input,title) {
 const units=validateUnits(input),concepts=new Map(),relations=new Map();
 for(const unit of units){
  // Analyze every unit in bounded chunks; a long manual is not silently truncated at its first pages.
  for(let start=0;start<unit.text.length;start+=58000){
   const text=unit.text.slice(start,start+60000),found=extractConcepts(text,title,24).filter(usableConcept).slice(0,16);
   for(const c of found){
    if(!concepts.has(c.key))concepts.set(c.key,{...c,locations:[],evidence:[],occurrences:0});
    const item=concepts.get(c.key);item.occurrences++;
    if(!item.locations.includes(unit.location))item.locations.push(unit.location);
    if(item.evidence.length<3&&!item.evidence.some(e=>e.text===c.evidence))item.evidence.push({text:c.evidence,location:unit.location});
   }
   for(const r of conceptRelations(text,found)){
    const key=[r.source,r.target].sort().join('|');
    if(!relations.has(key))relations.set(key,{...r,location:unit.location});
   }
  }
 }
 const chosen=[...concepts.values()].sort((a,b)=>b.occurrences-a.occurrences||a.key.localeCompare(b.key)).slice(0,32),keys=new Set(chosen.map(c=>c.key));
 return {version:2,method:'reference-body-v1',characters:units.reduce((n,u)=>n+u.text.length,0),unitCount:units.length,concepts:chosen,relations:[...relations.values()].filter(r=>keys.has(r.source)&&keys.has(r.target)).slice(0,64)};
}
export function manualGraph(documents) {
 const nodes=new Map(),edges=new Map();
 const addEdge=(source,target,type,documentId,evidence=[],location='')=>{
  const key=[source,target].sort().join('|')+'|'+type;
  if(!edges.has(key))edges.set(key,{source,target,type,documentIds:[],evidence:[]});
  const edge=edges.get(key);if(!edge.documentIds.includes(documentId))edge.documentIds.push(documentId);
  for(const text of evidence)if(edge.evidence.length<6)edge.evidence.push({text,location,documentId});
 };
 for(const document of documents){
  const id=`document:${document.id}`;
  nodes.set(id,{id,label:document.title,type:'document',documentId:document.id,analyzed:Boolean(document.analysis)});
  if(!document.analysis)continue;
  for(const c of document.analysis.concepts){
   const key=`concept:${conceptKey(c.label)}`;
   if(!nodes.has(key))nodes.set(key,{id:key,label:c.label,type:'concept',documentIds:[],recordIds:[],evidence:[]});
   const node=nodes.get(key);if(!node.documentIds.includes(document.id))node.documentIds.push(document.id);
   for(const e of c.evidence)if(node.evidence.length<12)node.evidence.push({...e,documentId:document.id});
   addEdge(id,key,'본문 개념',document.id,c.evidence.map(e=>e.text),c.evidence[0]?.location);
  }
  const keyMap=new Map(document.analysis.concepts.map(c=>[c.key,`concept:${conceptKey(c.label)}`]));
  for(const r of document.analysis.relations){
   if(keyMap.has(r.source)&&keyMap.has(r.target))addEdge(keyMap.get(r.source),keyMap.get(r.target),'같은 문맥',document.id,[r.evidence],r.location);
  }
 }
 return {nodes:[...nodes.values()],edges:[...edges.values()]};
}
