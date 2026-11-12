import {readDocumentFields} from './documentFields.mjs';
import {parsePlanSubfields,serializePlanSubfield} from './planSubfields.mjs';
import {visualsHtml} from './visuals.mjs';
import {DOCUMENT_TYPES,definitionForAi} from './catalog.mjs';

// Keep offsets into the original text: editing a cell must not reformat other cells.
export function parsePlanForm(content,type='business_plan',customDefinition=null){
 const definition=customDefinition||DOCUMENT_TYPES[type];if(!definition||typeof content!=='string')return null;
 const matches=[];
 for(const section of definition.sections){
  const escaped=section.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const found=[...content.matchAll(new RegExp(`^${escaped}\\r?$`,'gm'))];
  if(found.length!==1)return null;
  matches.push({...section,start:found[0].index,headingEnd:found[0].index+found[0][0].length});
 }
 if(matches.some((m,i)=>i>0&&m.start<=matches[i-1].start))return null;
 const sections=matches.map((m,i)=>{
  const bodyStart=m.headingEnd+(content[m.headingEnd]==='\n'?1:0);
  const rawEnd=matches[i+1]?.start??content.length;
  const trailing=content.slice(bodyStart,rawEnd).match(/\s*$/)?.[0].length||0;
  const bodyEnd=Math.max(bodyStart,rawEnd-trailing);
  return {...m,bodyStart,bodyEnd,value:content.slice(bodyStart,bodyEnd)};
 });
 return {preamble:content.slice(0,matches[0].start),sections};
}
export function updatePlanCell(content,type,id,value,definition=null){
 const parsed=parsePlanForm(content,type,definition),section=parsed?.sections.find(s=>s.id===id);
 if(!section||typeof value!=='string'||value.length>16000)throw Error('문항 내용을 확인해 주세요.');
 const next=content.slice(0,section.bodyStart)+value+content.slice(section.bodyEnd);
 if(next.length>80000)throw Error('문서 본문은 80,000자 이내로 작성해 주세요.');
 return next;
}
export function updatePlanSubcell(content,type,sectionId,key,value,definition=null){
 const section=parsePlanForm(content,type,definition)?.sections.find(s=>s.id===sectionId);
 if(!section)throw Error('문항을 확인해 주세요.');
 return updatePlanCell(content,type,sectionId,serializePlanSubfield(section,key,value),definition);
}
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function buildPlanFormHtml(doc,{companyName='',visualImages={}}={}){
 const fields=readDocumentFields(doc.ai);
 const type=doc.ai?.input?.type||'business_plan',parsed=parsePlanForm(doc.contentDraft||'',type,definitionForAi(doc.ai));
 const cellStyle='border:1px solid #333;padding:12px;vertical-align:top;white-space:pre-wrap;line-height:1.8;font-size:10.5pt;';
 const body=parsed?`${parsed.preamble.trim()?`<p style="white-space:pre-wrap;font-size:10pt;">${escape(parsed.preamble)}</p>`:''}${parsed.sections.map((s,i)=>`<table style="width:100%;border-collapse:collapse;table-layout:fixed;margin:18px 0;page-break-inside:auto;"><colgroup><col style="width:22%"><col style="width:78%"></colgroup><tr><th colspan="2" style="${cellStyle}background:#ececec;text-align:left;font-weight:bold;">${i+1}. ${escape(s.title)}</th></tr>${parsePlanSubfields(s).map(f=>`<tr><th style="${cellStyle}width:22%;background:#f7f7f7;font-size:9pt;">${escape(f.label)}</th><td style="${cellStyle}width:78%;">${escape(f.value||`[확인 필요: ${f.label}]`).replaceAll('\n','<br>')}</td></tr>`).join('')}</table>${visualsHtml((doc.ai?.visuals||[]).filter(v=>v.sectionId===s.id),visualImages)}`).join('')}`:`<pre style="white-space:pre-wrap;">${escape(doc.contentDraft||'')}</pre>${visualsHtml(doc.ai?.visuals||[],visualImages)}`;
 return `<!DOCTYPE html><html lang="ko" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${escape(doc.title)}</title><style>@page{size:A4;margin:20mm 18mm;}body{font-family:'Batang','바탕','Noto Serif KR',serif;color:#111;}h1{text-align:center;font-size:20pt;}thead{display:table-header-group;}p{line-height:1.8;}</style></head><body><h1>${escape(definitionForAi(doc.ai)?.title||doc.title)}</h1><p style="text-align:right;font-size:9pt;">신청 준비용 · 공식 신청 화면 입력 전 검토</p><table style="width:100%;border-collapse:collapse;font-size:10pt;"><tr><th style="${cellStyle}background:#eee;">기업명</th><td style="${cellStyle}">${escape(fields.companyName||companyName)}</td><th style="${cellStyle}background:#eee;">신청 구분</th><td style="${cellStyle}">${({new:'신규 신청',renewal:'재확인 신청',unknown:'확인 필요'})[fields.application]||'확인 필요'}</td></tr><tr><th style="${cellStyle}background:#eee;">대표자</th><td style="${cellStyle}">${escape(fields.representativeName||'[확인 필요]')}</td><th style="${cellStyle}background:#eee;">사업자등록번호</th><td style="${cellStyle}">${escape(fields.businessNumber||'[확인 필요]')}</td></tr><tr><th style="${cellStyle}background:#eee;">문서 번호</th><td style="${cellStyle}">${escape(doc.code)}</td><th style="${cellStyle}background:#eee;">수정·검토</th><td style="${cellStyle}">수정 ${escape(doc.revisionNo||1)} · ${doc.ai?.review?.reviewed?'내부 검토 기록 있음':'검토 전'}</td></tr></table>${body}</body></html>`;
}
