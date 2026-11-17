export const COMMON_CRITERIA = [
  ['problem','문제·고객의 명확성','고객의 문제와 수요를 구체적으로 설명하고 근거를 제시하는가'],
  ['solution','해결책·차별성','문제와 해결책이 연결되며 경쟁 대안 대비 차이가 설명되는가'],
  ['execution','실행 가능성','일정·팀·예산·실행 방법과 검증 계획이 서로 맞는가'],
  ['evidence','근거·수치의 신뢰성','숫자의 출처·연도·단위와 실적/계획/가정을 구분하는가'],
  ['structure','구조·전달력','문단·표·그림이 핵심 주장과 앞뒤 흐름을 명확히 전달하는가'],
].map(([id,title,description])=>({id:'common-'+id,title,description,maxScore:20,scope:'common'}));
export function validateProgramRubric(value){
  if(value==null)return null;
  const bounded=(s,n)=>typeof s==='string'&&s.trim()&&s.length<=n;
  if(!bounded(value.title,200)||!bounded(value.sourceUrl,1000)||!bounded(value.version,200)||value.confirmed!==true||!Array.isArray(value.criteria)||!value.criteria.length||value.criteria.length>15)throw Error('사업명·공개 원문 주소·공고 차수와 확인한 평가기준을 입력해 주세요.');
  const url=new URL(value.sourceUrl);if(url.protocol!=='https:'||url.username||url.password)throw Error('공개 기준의 HTTPS 원문 주소를 입력해 주세요.');
  return {title:value.title.trim(),sourceUrl:url.href,version:value.version.trim(),confirmed:true,criteria:value.criteria.map((item,i)=>{
    if(!bounded(item.title,200)||!bounded(item.description,3000)||!(item.maxScore===null||Number.isInteger(item.maxScore)&&item.maxScore>0&&item.maxScore<=1000))throw Error('평가항목·원문 기준·공개 배점을 확인해 주세요. 배점이 없으면 비워 두세요.');
    return {id:`program-${i+1}`,title:item.title.trim(),description:item.description.trim(),maxScore:item.maxScore,scope:'program'};
  })};
}
export const criteriaFor=program=>[...COMMON_CRITERIA,...(program?.criteria||[])];
export function validateDocumentEvaluation(value,criteria,total){
  const text=(v,max)=>typeof v==='string'&&v.trim()&&v.length<=max;
  const pages=v=>Array.isArray(v)&&v.length>0&&new Set(v).size===v.length&&v.every(n=>Number.isInteger(n)&&n>=1&&n<=total);
  if(!text(value?.summary,6000)||!Array.isArray(value.scores)||value.scores.length!==criteria.length||!Array.isArray(value.priorities)||value.priorities.length>10)throw Error('전체 평가 형식이 올바르지 않습니다.');
  const seen=new Set();
  for(const s of value.scores){const c=criteria.find(c=>c.id===s.criterionId);if(!c||seen.has(c.id)||!text(s.reason,3000)||!pages(s.pages)||!(s.score===null||c.maxScore!==null&&Number.isInteger(s.score)&&s.score>=0&&s.score<=c.maxScore))throw Error('전체 평가의 기준·배점·근거 페이지를 확인하지 못했습니다.');seen.add(c.id);}
  for(const p of value.priorities)if(!text(p.issue,3000)||!text(p.suggestion,3000)||!text(p.question,1500)||!pages(p.pages))throw Error('보완 우선순위의 근거를 확인하지 못했습니다.');
  if(value.visualRecommendations!==undefined){
    if(!Array.isArray(value.visualRecommendations)||value.visualRecommendations.length>6)throw Error('시각 자료 제안 형식을 확인하지 못했습니다.');
    for(const v of value.visualRecommendations)if(!['table','chart','diagram','image'].includes(v.kind)||!text(v.title,200)||!text(v.purpose,1500)||!text(v.outline,2000)||!text(v.requiredData,2000)||!pages(v.pages))throw Error('시각 자료 제안의 위치와 필요한 자료를 확인하지 못했습니다.');
  }
  return value;
}
export function pageScoreSummary(evaluation,criteria,scope){
  const assessed=criteria.filter(c=>c.scope===scope&&c.maxScore!=null).map(c=>({c,s:evaluation?.scores?.find(s=>s.criterionId===c.id)})).filter(x=>x.s?.score!=null);
  return {score:assessed.reduce((n,x)=>n+x.s.score,0),maximum:assessed.reduce((n,x)=>n+x.c.maxScore,0),assessed:assessed.length,total:criteria.filter(c=>c.scope===scope).length};
}
export function validatePageEvaluation(value,criteria){
  const text=(s,n)=>typeof s==='string'&&s.trim()&&s.length<=n;
  if(!text(value?.summary,4000)||!Array.isArray(value.scores)||value.scores.length!==criteria.length||!Array.isArray(value.annotations)||value.annotations.length>20)throw Error('페이지 평가 형식을 확인하지 못했습니다.');
  const ids=new Set();
  for(const score of value.scores){const criterion=criteria.find(c=>c.id===score.criterionId);
    if(!criterion||ids.has(score.criterionId)||!text(score.reason,2000)||!(score.score===null||criterion.maxScore!==null&&Number.isInteger(score.score)&&score.score>=0&&score.score<=criterion.maxScore))throw Error('평가 항목과 배점이 기준과 다릅니다.');
    ids.add(score.criterionId);
  }
  for(const note of value.annotations){const b=note.box;
    if(!criteria.some(c=>c.id===note.criterionId)||!b||!['x','y','width','height'].every(k=>Number.isFinite(b[k]))||b.x<0||b.y<0||b.width<=0||b.height<=0||b.x+b.width>1000||b.y+b.height>1000||!['role','context','evidence','issue','suggestion','question'].every(k=>text(note[k],2500)))throw Error('원문 위치와 평가 근거를 확인하지 못했습니다.');
  }
  for(const score of value.scores)if(score.score!==null&&!value.annotations.some(a=>a.criterionId===score.criterionId))throw Error('점수에 연결된 페이지 근거가 없습니다.');
  return value;
}
export function applyReviewChanges(content,changes){
  if(!Array.isArray(changes)||changes.length>8)throw Error('수정안 형식을 확인해 주세요.');
  let result=content;
  for(const change of changes){if(typeof change.before!=='string'||!change.before.trim()||change.before.length>12000||typeof change.after!=='string'||!change.after.trim()||change.after.length>16000||typeof change.reason!=='string'||!change.reason.trim()||change.reason.length>2000||result.split(change.before).length!==2)throw Error('수정 위치를 정확히 찾지 못했습니다. 본문을 보존했습니다.');result=result.replace(change.before,()=>change.after);}
  if(result.length>60000)throw Error('보완본은 60,000자 이내로 작성해 주세요.');return result;
}
