import {DOCUMENT_TYPES} from './catalog.mjs';
import {PLAN_SUBFIELDS,parsePlanSubfields} from './planSubfields.mjs';
import {parsePlanForm,updatePlanSubcell} from './planForm.mjs';
import {readDocumentFields} from './documentFields.mjs';
export function emptySourcePlan(type){return DOCUMENT_TYPES[type].sections.map(s=>`${s.title}\n${PLAN_SUBFIELDS[s.id].map(f=>`【${f.label}】\n[확인 필요: ${f.label}]`).join('\n\n')}`).join('\n\n');}
export function missingValue(value){return !value?.trim()||/^\s*\[(?:확인 필요|판독 불가)[\s\S]*\]\s*$/.test(value);}
export function sourceCellText(cell,sourceName){
 const normalized=value=>String(value||'').replace(/\s+/g,'').replace(/[“”‘’"'「」]/g,'');
 const anchors=(cell.evidenceByUnit||[]).filter(item=>item.direct&&item.certainty!=='uncertain'&&item.value?.trim());
 // Prefer pages explicitly titled for this field, rather than later generic charts.
 let text=anchors.length?anchors.map(item=>`${item.value}\n[${sourceName} · ${item.location}]`).filter((v,i,a)=>a.indexOf(v)===i).join('\n\n'):cell.value;const seen=new Set();
 for(const item of anchors.length?anchors:cell.evidenceByUnit||[]){
  if(item.certainty==='uncertain'||!item.evidence?.trim())continue;
  const key=normalized(item.evidence);if(!key||seen.has(key))continue;seen.add(key);
  if(normalized(text).includes(key))continue;
  text+=`\n\n${item.certainty==='plan'?'[계획 근거] ':''}${item.evidence}\n[${sourceName} · ${item.location}]`;
 }
 if(text.length>15000)throw Error('이 항목의 원문 근거가 많습니다. 자료를 나눠 문항별로 검토해 주세요. 쪽별 원문은 보존됩니다.');
 return text;
}
export function mapSourceCells({content,type,sources,fields,mode='fill'}){
 let next=content;const changes=[],covered=new Set(),fieldData={...fields},candidates=[];
 if(!parsePlanForm(next,type))throw Error('양식의 문항 제목을 확인해 주세요. 본문 편집으로 기존 내용을 보존할 수 있습니다.');
 for(const source of sources){
  for(const [key,cell] of Object.entries(source.metadata.sourceAnalysis.cells||{})){
   const [sectionId,fieldId]=key.split('/'),definition=PLAN_SUBFIELDS[sectionId]?.find(f=>f.id===fieldId);
   if(!definition||!DOCUMENT_TYPES[type].sections.some(s=>s.id===sectionId)||!cell.value?.trim())continue;
   candidates.push({key,...cell,sourceId:source.id,sourceName:source.title});if(cell.certainty==='uncertain')continue;
   covered.add(key);const section=parsePlanForm(next,type).sections.find(s=>s.id===sectionId),target=parsePlanSubfields(section).find(f=>f.id===fieldId);
   if(!target||!missingValue(target.value)&&mode!=='supplement')continue;
   const valueWithEvidence=sourceCellText(cell,source.title),citation=`[${source.title} · ${cell.location}]`,addition=`${cell.certainty==='plan'?'[계획안] ':''}${valueWithEvidence}${valueWithEvidence.includes('['+source.title+' · ')?'':'\n'+citation}`;
   if(target.value.includes(addition))continue;
   const value=missingValue(target.value)?addition:target.value+'\n\n'+addition;
   next=updatePlanSubcell(next,type,sectionId,target.key,value);changes.push({before:target.value,after:value,reason:`${source.title} · ${cell.location}에서 ${definition.label} 반영`});
  }
  if(source.metadata.sourceAnalysis.companyMatch!=='different')for(const basic of Object.values(source.metadata.sourceAnalysis.basicFields||{}))if((basic.key!=='application'||/신청\s*구분\s*[:：]?\s*(신규|재확인)/.test(basic.evidence||''))&&basic.key!=='companyName'&&basic.value&&(!fieldData[basic.key]||fieldData[basic.key]==='unknown')&&['representativeName','businessNumber','application'].includes(basic.key))fieldData[basic.key]=basic.value;
 }
 const missing=[];for(const section of parsePlanForm(next,type).sections)for(const field of parsePlanSubfields(section))if(!covered.has(section.id+'/'+field.id)&&missingValue(field.value))missing.push({sectionId:section.id,fieldId:field.id,label:field.label,question:`${field.label}에 대해 알려주세요. ${field.guide} 자료나 확인된 내용이 있나요? 모르면 확인 필요로 남길 수 있습니다.`});
 if(next.length>80000)throw Error('원문 근거가 문서 작성 범위를 넘었습니다. 자료를 나눠 문항별로 검토해 주세요. 분석 결과는 보존됩니다.');
 return {content:next,documentFields:fieldData,changes,candidates,missing,questions:missing.slice(0,2).map(f=>f.question)};
}
