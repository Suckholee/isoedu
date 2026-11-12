import {randomUUID} from 'node:crypto';
import {validateVisuals} from '../venture/visuals.mjs';
import {PlanError} from './model.mjs';
const str={type:'string'},strings={type:'array',items:str};
const obj=properties=>({type:'object',additionalProperties:false,properties,required:Object.keys(properties)});
export const autoVisualSchema={type:'array',items:obj({sectionTitle:str,type:{type:'string',enum:['table','bar','line','diagram','image']},title:str,caption:str,basis:{type:'string',enum:['fact','plan','reference']},evidenceIds:strings,evidence:str,columns:strings,rows:{type:'array',items:strings},unit:str,points:{type:'array',items:obj({label:str,value:{type:'number'},evidence:str})},nodes:strings,imagePrompt:str})};
export const AUTO_COMPOSITION_INSTRUCTIONS=`본문과 함께 visualDrafts에 필요한 표·그래프·도식·설명 그림을 자동 구성한다. 모든 종류를 억지로 넣지 않고 문항과 정보에 필요한 자료만 최대 10개, 그림은 최대 2개를 만든다. 각 자료의 sectionTitle은 작성한 sections의 정확한 제목이다. 비교/예산/일정/팀 구성은 편집 가능한 table, 동일 단위의 확인된 수치 2개 이상은 bar 또는 line, 구조/업무 흐름은 diagram, 제품·서비스 사용 시나리오나 원리를 설명할 필요가 있으면 image를 선택한다. 표를 시각 자료에 넣었으면 본문에 동일한 텍스트 표를 중복 작성하지 않는다. 표는 최대8열20행, 그래프2~24점, 도식2~12단계. 비해당 배열/문자열은 빈 값이다. 시각 자료의 evidenceIds는 실제 사용한 회사 자료 ID 또는 user다. evidence에는 제공된 회사 정보의 원문 구절을 인용한다. 그래프의 각 evidence에는 해당 label, value, unit을 포함한 제공 자료 원문 구절을 그대로 인용한다. 출처 없는 숫자, 예시 양식의 숫자, AI가 만든 목표치를 표와 그래프에 넣지 않는다. 수치가 없으면 그래프를 생략하고 visualNotes에 필요한 수치와 단위를 남긴다. 계획과 실적을 한 그래프에 섞지 않는다. 표의 미입력 셀은 [확인 필요]다. imagePrompt는 대상 서비스·제품을 설명하는 명확한 개념 삽화의 구도·구성요소·관계를 한국어로 지시한다. 실제 제품 사진, 인증서, 실적 증빙, 공장 현장 또는 로고를 생성해 대체하지 않는다. 이미지 basis는 plan 또는 reference이고 실제 사진이 필요한 경우 visualNotes에 자료 필요를 표시한다. 그림 안에 숫자, 그래프, 상세 문장, 인증 마크를 그리지 않는다. video 제출방식이면 실제 현장 촬영을 대체하는 image는 만들지 않고 촬영 장면·시간표만 구성한다. 외부 URL·HTML·SVG·스크립트를 반환하지 않는다.`;
const compact=x=>String(x).normalize('NFKC').replace(/\s|,/g,'');
const numbers=x=>(String(x).replace(/(?<=\d),(?=\d)/g,'').match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
const validText=(s,max)=>typeof s==='string'&&s.length<=max;
export function composeVisuals(value,{input,sections}){
 if(!Array.isArray(value.visualDrafts)||value.visualDrafts.length>10||!Array.isArray(value.visualNotes)||value.visualNotes.length>20||value.visualNotes.some(n=>!validText(n,1000)))throw new PlanError('자동 배치 결과를 확인하지 못했습니다.',502);
 const sources=new Map([['user',[input.business,input.facts,JSON.stringify(input.companyProfile||{})].join('\n')],...input.sources.map(s=>[s.id,s.text])]);
 const visuals=[],images=[],warnings=[...value.visualNotes];
 for(const [index,v] of value.visualDrafts.entries()){
  const section=sections.find(s=>s.title===v.sectionTitle);
  if(!section||!Array.isArray(v.evidenceIds)||!v.evidenceIds.length||v.evidenceIds.some(id=>!sources.has(id))||!validText(v.evidence,5000))throw new PlanError('시각 자료의 연결 문항과 출처가 올바르지 않습니다.',502);
  const evidenceText=v.evidenceIds.map(id=>sources.get(id)).join('\n'),source=v.evidenceIds.map(id=>id==='user'?'회사 입력 정보':`회사 자료 ${id}`).join(' · ');
  const base={id:randomUUID(),sectionId:section.id,type:v.type,title:v.title,caption:v.caption,source,basis:v.basis};
  try{
   if(['bar','line'].includes(v.type)){
    if(!validText(v.unit,80)||!v.unit.trim()||!Array.isArray(v.points)||v.points.length<2)throw Error('그래프에 필요한 수치·단위가 부족합니다.');
    for(const point of v.points){if(!validText(point.evidence,1000)||!point.evidence.trim()||!evidenceText.includes(point.evidence)||!compact(point.evidence).includes(compact(point.label))||!compact(point.evidence).includes(compact(v.unit))||!numbers(point.evidence.replace(point.label,'').replace(v.unit,'')).includes(point.value))throw Error('그래프의 항목·값·단위가 회사 자료의 원문과 일치하지 않습니다.');}
   }
   if(v.type==='table'){
    if(!validText(v.evidence,5000)||!v.evidence.trim()||!evidenceText.includes(v.evidence))throw Error('표의 원문 근거를 확인해야 합니다.');
    for(const cell of [...(v.columns||[]),...(v.rows||[]).flat()])for(const n of numbers(cell))if(!numbers(v.evidence).includes(n))throw Error('표의 수치가 인용 근거에 없습니다.');
   }
   if(v.type==='image'){
    if(input.template.submissionMode==='video')throw Error('현장 촬영을 생성 이미지로 대체하지 않습니다.');
    if(images.length>=2||!['plan','reference'].includes(v.basis)||!validText(v.imagePrompt,3000)||v.imagePrompt.trim().length<20)throw Error('개념 그림의 작성 정보를 확인해야 합니다.');
    // Validate shared visual fields with a server-controlled placeholder path, never a supplied URL.
    validateVisuals([{...base,path:`companies/company/document/visuals/${base.id}.jpg`}],{sectionIds:sections.map(s=>s.id),companyId:'company',documentId:'document'});
    images.push({...base,prompt:v.imagePrompt.trim(),state:'pending',attempts:0});continue;
   }
   visuals.push(...validateVisuals([{...base,columns:v.columns,rows:v.rows,unit:v.unit,points:v.points,nodes:v.nodes}],{sectionIds:sections.map(s=>s.id)}));
  }catch(e){warnings.push(`${validText(v.title,200)?v.title:`시각 자료 ${index+1}`}: ${e.message}`);}
 }
 return {visuals,images,warnings};
}
