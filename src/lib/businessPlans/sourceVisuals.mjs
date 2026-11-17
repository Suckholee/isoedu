import {validateVisuals} from '../venture/visuals.mjs';
export const visualCardKey=(reportKey,index)=>`${reportKey}:${index}`;
export function validateSourceVisual(visual,row){return validateVisuals([visual],{sectionIds:['source-review'],companyId:row.company_id,documentId:row.id})[0];}
export function includedSourceVisuals(row){return Object.values(row.metadata?.sourceVisuals||{}).filter(c=>c.included&&c.visual).map(c=>c.visual);}
export const canonicalVisualValue=v=>Array.isArray(v)?v.map(canonicalVisualValue):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonicalVisualValue(v[k])])):v;
export function sourceVisualSignature(row){return JSON.stringify(canonicalVisualValue(includedSourceVisuals(row).sort((a,b)=>a.id.localeCompare(b.id))));}
export function validateVisualAnswer(value,{row,id,type,evidence}){
 if(typeof value?.reply!=='string'||!value.reply.trim()||value.reply.length>4000||!Array.isArray(value.questions)||value.questions.length>3||value.questions.some(q=>typeof q!=='string'||!q.trim()||q.length>1000))throw Error('시각 자료 답변 형식을 확인하지 못했습니다.');
 if(!value.ready){if(!value.questions.length)throw Error('부족한 자료를 확인할 질문이 없습니다.');return {reply:value.reply,questions:value.questions,visual:null};}
 if(value.questions.length)throw Error('확인할 질문에 답한 뒤 자료를 만들 수 있습니다.');
 const visual={...value.visual,id,sectionId:'source-review',type};
 if(['bar','line'].includes(type))for(const p of visual.points||[]){if(!p.evidence?.trim()||!evidence.includes(p.evidence)||!(p.evidence.replaceAll(',','').match(/-?\d+(?:\.\d+)?/g)||[]).some(n=>Number(n)===p.value))throw Error('그래프 수치가 제공한 근거와 다릅니다.');}
 // Images are validated after their bytes are saved to the private vault.
 return {reply:value.reply,questions:[],visual:type==='image'?{...visual,basis:'reference'}:validateSourceVisual(visual,row)};
}

export const visualDraftFingerprint=value=>JSON.stringify(canonicalVisualValue(value));
