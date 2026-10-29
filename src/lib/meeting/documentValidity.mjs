import {policyCatalog} from './documentPolicies.mjs';
import {validTaskDate,taskToday} from '../workTaskDates.mjs';
export {policyCatalog};
export const VALIDITY_LABELS={missing:'미제출',unknown:'확인 필요',valid:'기간·연도 확인',expired:'최신본 필요',scheduled:'신청 전 갱신 예정',unspecified:'기간 기준 미지정',inactive:'다른 유형의 보관 자료',exempt:'해당 없음',closed:'접수 후 보관'};
export function addDays(date,days){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function addMonths(date,months){const [y,m,d]=date.split('-').map(Number);const end=new Date(Date.UTC(y,m+months,0)).getUTCDate();return new Date(Date.UTC(y,m-1+months,Math.min(d,end))).toISOString().slice(0,10);}
export function documentValidity(request,context={},today=taskToday()){
 const policy=request.policy||{},rule=policy.rule||{kind:'none'};
 let calculatedExpiry,requiredYears;
 const out=(status,reason,extra={})=>({status,reason,checkedOn:today,...(requiredYears?{requiredYears}:{}),...(calculatedExpiry?{expiresOn:calculatedExpiry}:{}),...extra});
 if(!request.policy_key)return out('unspecified','원문 기준을 연결하지 않은 자료');
 if(policy.applicationType!==context.applicationType)return out('inactive','현재 선택한 신청 유형과 다릅니다.');
 if(request.status==='not_applicable')return out('exempt','컨설턴트가 근거를 기록했습니다.');
 if(context.applicationSubmittedAt)return out('closed','접수 후 자동 재요청을 중지한 기록입니다.');
 if(!request.document_id)return out('missing','제출할 서류가 있습니다.');
 let plan=context.applicationDate||'';
 if(plan&&!validTaskDate(plan))return out('unknown','신청 기준일을 확인해 주세요.');
 if(plan&&plan<today)plan=today;
 if(request.issued_on&&request.issued_on>today)return out('unknown','발급일이 미래입니다.');
 if(request.valid_until&&request.valid_until<today)return out('expired','원문 유효기간이 지났습니다.',{expiresOn:request.valid_until});
 if(rule.kind==='age_days'||rule.kind==='age_months'){
  if(!plan)return out('unknown','예정 신청일을 입력해 주세요.');
  if(!request.issued_on)return out('unknown','원문 발급일을 확인해 주세요.');
  const expiry=rule.kind==='age_days'?addDays(request.issued_on,rule.days):addMonths(request.issued_on,rule.months);
  calculatedExpiry=expiry;
  let window=rule.kind==='age_days'?addDays(plan,-rule.days):addMonths(plan,-rule.months);
  while(rule.kind==='age_months'&&addMonths(window,rule.months)<plan)window=addDays(window,1);
  if(expiry<plan){if(today<window)return out('scheduled','보유본을 우선 검토하고 신청 전 최신본을 요청합니다.',{expiresOn:expiry,nextRequestOn:window});return out('expired','예정 신청일 기준 발급 허용 기간을 넘었습니다.',{expiresOn:expiry});}
  if(expiry<today)return out('expired','발급 허용 기간을 넘었습니다.',{expiresOn:expiry});
 }
 if(request.valid_until){if(request.valid_until<today)return out('expired','원문 유효기간이 지났습니다.',{expiresOn:request.valid_until});if(plan&&request.valid_until<plan)return out('scheduled','예정 신청일 전에 만료됩니다.',{expiresOn:request.valid_until,nextRequestOn:addDays(request.valid_until,1)});}
 else if(rule.kind==='expiry'&&rule.required)return out('unknown','원문에 적힌 유효기간을 확인해 주세요.');
 if(rule.kind==='years'){
  if(!plan||!context.companyFoundedDate)return out('unknown','신청 기준일과 회사 설립일이 필요합니다.');
  if(!(request.covered_years||[]).length)return out('unknown','원문에 포함된 자료 연도를 확인해 주세요.');
  const last=Number(plan.slice(0,4))-1,founded=Number(context.companyFoundedDate.slice(0,4));
  if(!rule.allowShortHistory&&founded>last-rule.years+1)return out('unknown','업력과 3개년 요구기간을 담당자에게 확인해 주세요.');
  const start=Math.max(last-rule.years+1,founded);
  if(start>last)return out('unknown','신설기업의 제출 가능한 회계기간을 별도로 확인해 주세요.');
  const expected=Array.from({length:last-start+1},(_,i)=>start+i),missing=expected.filter(y=>!(request.covered_years||[]).includes(y));
  requiredYears=expected;
  if(missing.length)return out('expired',`필요 자료 연도 미충족: ${missing.join(', ')}`,{requiredYears:expected});
  if((rule.manualPeriod||rule.yearEnd)&&!request.period_confirmed)return out('unknown',rule.yearEnd?'연도별 12월 말 기준을 원문과 대조해 주세요.':'직전 분기·최근 신고분 범위를 원문과 대조해 주세요.');
  return out('valid','신청 기준 연도와 업력 내 자료를 확인했습니다.',{requiredYears:expected});
 }
 if(rule.kind==='none'&&!request.valid_until)return out('unspecified','노션에 일수 제한이 없어 임의 만기를 적용하지 않습니다.');
 return out('valid','입력한 원문 날짜 기준. 내용 검토는 별도입니다.');
}
export function typeRequestItems(type){const info=policyCatalog.types[type];if(!info)throw Error('신청 유형을 확인해 주세요.');return info.documents.map(d=>({...d,key:type==='ISO'?d.key:`${type.toLowerCase()}-${d.key}`,guidance:d.guidance||'원문과 기관의 최신 요청 내용을 대조해 주세요.',source:info.url}));}
