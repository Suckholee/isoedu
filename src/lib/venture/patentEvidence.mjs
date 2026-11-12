import {parsePlanForm,updatePlanSubcell} from './planForm.mjs';
import {parsePlanSubfields} from './planSubfields.mjs';
export function appendPatentEvidence(content,type,result,selected){
 const parsed=parsePlanForm(content,type),section=parsed?.sections.find(s=>s.id==='ip')||parsed?.sections.find(s=>s.id==='solution');
 const field=section&&parsePlanSubfields(section).find(f=>f.id==='proof');
 if(!field)throw Error('문항 양식에서 참고자료를 넣을 칸을 찾지 못했습니다. 문항 제목을 먼저 확인해 주세요.');
 const chosen=result.patents.filter(p=>selected.includes(p.applicationNumber)&&!content.includes(`출원번호: ${p.applicationNumber}`));
 if(!chosen.length)throw Error('새로 반영할 특허를 선택해 주세요. 이미 연결된 출원번호는 중복 반영하지 않습니다.');
 const lines=chosen.map(p=>`${p.title}\n출원번호: ${p.applicationNumber} · 출원일: ${p.applicationDate||'확인 필요'}\n출원인: ${p.applicantName||'확인 필요'}\n조회 상태: ${p.registerStatus||'확인 필요'} · 등록번호: ${p.registerNumber||'확인 필요'} · 등록일: ${p.registerDate||'확인 필요'}\nIPC: ${p.ipcNumber||'확인 필요'}${p.abstract?`\n초록: ${p.abstract}`:''}`);
 const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(result.queriedAt));
 const text=`[KIPRIS 공개조회 참고자료 · ${date}]\n검색어: ${result.query}\n${lines.join('\n\n')}\n자료 출처: KIPRIS Plus · ${result.sourceUrl}\n공개 조회 참고자료입니다. 회사 보유 여부·현재 권리자·신청 기술과의 연관성은 원부 등으로 별도 확인해야 합니다.`;
 return {content:updatePlanSubcell(content,type,section.id,field.key,[field.value,text].filter(Boolean).join('\n\n')),focus:section.id,count:chosen.length};
}
