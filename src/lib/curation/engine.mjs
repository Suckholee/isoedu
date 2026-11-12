import {CERTIFICATIONS,CURATION_VERSION,GOALS,REVIEWED_AT} from './catalog.mjs';
import {validTaskDate,taskToday} from '../workTaskDates.mjs';
export class CurationError extends Error{constructor(message,status=400){super(message);this.status=status;}}
export const TRI_FIELDS={sme:'중소기업 해당 여부',operating:'정상 영업 여부',technology:'기술 차별성·증빙',growth:'성장 계획·근거',managementInnovation:'경영혁신 활동·성과',researchSpace:'요건에 맞는 연구공간·기자재',researchStaffQualified:'연구전담요원 자격·전담/상근 확인',nonResearchStaff:'연구 외 업무 담당 상시 직원',ventureExcluded:'벤처 신청 제외 조건 해당',innobizExcluded:'이노비즈 신청 제외 조건 해당',mainbizExcluded:'메인비즈 신청 제외 조건 해당'};
export const EMPTY_PROFILE={industry:'',foundedAt:'',employeeCount:'',researcherCount:'',researchSize:'',goals:[],held:[],...Object.fromEntries(Object.keys(TRI_FIELDS).map(k=>[k,'']))};
function str(x,max,label){if(x==null)return '';if(typeof x!=='string'||x.length>max)throw new CurationError(`${label} 입력을 확인해 주세요.`);return x.trim();}
export function normalizeProfile(input={},today=taskToday()){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new CurationError('회사 정보 형식을 확인해 주세요.');
 const out={...EMPTY_PROFILE,goals:[],held:[]};out.industry=str(input.industry,200,'업종');out.foundedAt=str(input.foundedAt,10,'설립일');
 if(!validTaskDate(out.foundedAt)||out.foundedAt>today)throw new CurationError('설립일은 오늘 이전의 실제 날짜로 입력해 주세요.');
 for(const k of Object.keys(TRI_FIELDS)){out[k]=input[k]??'';if(!['','yes','no'].includes(out[k]))throw new CurationError(`${TRI_FIELDS[k]} 값을 확인해 주세요.`);}
 for(const k of ['employeeCount','researcherCount']){const v=input[k];if(v==null||v===''){out[k]='';continue;}if(typeof v!=='number'&&typeof v!=='string'||!/^\d{1,6}$/.test(String(v))||!Number.isSafeInteger(Number(v)))throw new CurationError('인원은 0 이상의 정수로 입력해 주세요.');out[k]=String(Number(v));}
 if(out.employeeCount!==''&&out.researcherCount!==''&&Number(out.researcherCount)>Number(out.employeeCount))throw new CurationError('연구전담요원 수가 전체 인원보다 많습니다.');
 out.researchSize=input.researchSize??'';if(!['','small','medium','mid','large'].includes(out.researchSize))throw new CurationError('연구소의 기업 규모를 확인해 주세요.');
 if(!Array.isArray(input.goals??[])||(input.goals||[]).some(g=>!Object.hasOwn(GOALS,g)))throw new CurationError('사업 목표를 확인해 주세요.');out.goals=[...new Set(input.goals||[])];
 if(!Array.isArray(input.held??[])||(input.held||[]).length>CERTIFICATIONS.length)throw new CurationError('보유 인증을 확인해 주세요.');
 for(const h of input.held||[]){if(!h||!CERTIFICATIONS.some(c=>c.id===h.id)||out.held.some(x=>x.id===h.id))throw new CurationError('중복되거나 알 수 없는 보유 인증입니다.');const expiresAt=str(h.expiresAt,10,'만료일');if(!validTaskDate(expiresAt))throw new CurationError('인증 만료일을 확인해 주세요.');out.held.push({id:h.id,expiresAt});}
 return out;
}
const check=(key,label,value,expected='yes')=>({key,label,state:value===''||value==null?'unknown':value===expected?'met':'unmet',value:value||'미입력'});
function ageCheck(profile,today){const boundary=`${Number(today.slice(0,4))-3}${today.slice(4)}`;return {key:'foundedAt',label:'업력 3년 이상 (전환 이력 별도 확인)',state:!profile.foundedAt?'unknown':profile.foundedAt<=boundary?'met':'unmet',value:profile.foundedAt||'미입력'};}
function labThreshold(p,today){
 const size={small:3,medium:5,mid:7,large:10}[p.researchSize];if(!size)return null;
 // Do not infer an exception from a recommended, expired, or undated venture certificate.
 if(p.held.some(h=>h.id==='VENTURE_GROWTH'&&h.expiresAt&&h.expiresAt>=today)&&p.sme==='yes')return 2;
 if(p.researchSize==='small'){if(!p.foundedAt)return null;const third=`${Number(p.foundedAt.slice(0,4))+3}${p.foundedAt.slice(4)}`;if(today<=third)return 2;}
 return size;
}
export function curateCertifications(raw,{today=taskToday()}={}){
 if(!today||!validTaskDate(today))throw new CurationError('검토 기준일을 확인해 주세요.');const p=normalizeProfile(raw,today);
 return CERTIFICATIONS.map(c=>{
  let checks=[check('operating','정상 영업',p.operating)];const reasons=c.goals.filter(g=>p.goals.includes(g)).map(g=>`${GOALS[g]} 목표와 연결됩니다.`);let requiredEvaluation=c.review;
  if(c.kind==='DOMESTIC'&&!c.id.startsWith('RESEARCH'))checks.push(check('sme','중소기업 해당',p.sme));
  if(['INNOBIZ','MAINBIZ'].includes(c.id))checks.push(ageCheck(p,today));
  if(c.id==='INNOBIZ'){
   const age=checks.find(x=>x.key==='foundedAt');if(age.state==='met'&&p.foundedAt===`${Number(today.slice(0,4))-3}${today.slice(4)}`){age.state='unknown';age.value+=' · 3년 경계일 기관 확인';}
   checks.push(check('technology','기술 차별성·증빙 준비',p.technology),check('innobizExcluded','최신 제외 조건에 해당하지 않음',p.innobizExcluded,'no'));
  }
  if(c.id==='MAINBIZ')checks.push(check('managementInnovation','경영혁신 활동·성과 준비',p.managementInnovation),check('mainbizExcluded','최신 제외 조건에 해당하지 않음',p.mainbizExcluded,'no'));
  if(c.id==='VENTURE_GROWTH')checks.push(check('technology','기술 혁신성 근거 준비',p.technology),check('growth','사업 성장성 근거 준비',p.growth),check('ventureExcluded','최신 제외 조건에 해당하지 않음',p.ventureExcluded,'no'));
  if(c.id.startsWith('RESEARCH')){
   const min=c.id==='RESEARCH_DEPARTMENT'?1:labThreshold(p,today);
   checks.push({key:'researcherCount',label:min?`연구전담요원 ${min}명 이상 (일반 기준·특례 별도)`:'기업 규모·업력에 따른 인원 기준 확인',state:min===null||p.researcherCount===''?'unknown':Number(p.researcherCount)>=min?'met':'unmet',value:p.researcherCount===''?'미입력':`${p.researcherCount}명`});
   checks.push(check('researchStaffQualified',TRI_FIELDS.researchStaffQualified,p.researchStaffQualified),check('researchSpace',TRI_FIELDS.researchSpace,p.researchSpace),check('nonResearchStaff',TRI_FIELDS.nonResearchStaff,p.nonResearchStaff));
   requiredEvaluation+=' 규모 변경 유예·연구원/교원 창업 등 특례는 이 간이 검토에 포함하지 않습니다.';
  }
  const blocked=checks.some(x=>x.state==='unmet'),missing=checks.filter(x=>x.state==='unknown');const held=p.held.find(h=>h.id===c.id);let status=blocked?'conditions':missing.length?'missing':reasons.length?'priority':'candidate';let renewal=false;
  if(held){if(held.expiresAt){const days=Math.round((Date.parse(held.expiresAt+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000);renewal=days<=90;status=renewal?'renewal':'held';reasons.unshift(days<0?`입력한 만료일 ${held.expiresAt}이 지났습니다.`:days<=90?`입력한 만료일까지 ${days}일 남았습니다.`:`보유 기록의 만료일은 ${held.expiresAt}입니다.`);}else{status='missing';reasons.unshift('보유 기록의 만료일·현재 유효 상태를 확인해 주세요.');missing.push({key:'held',label:'보유 인증의 유효 상태',state:'unknown'});}}
  return {...c,status,reasons:reasons.length?reasons:['사업 목표를 선택하면 준비 우선순위를 정리할 수 있습니다.'],checks,missing:missing.map(x=>({key:x.key,label:x.label})),blockers:checks.filter(x=>x.state==='unmet').map(x=>x.label),held:held||null,renewal,requiredEvaluation,eligibility:'not-determined',priority:renewal?0:status==='priority'?1:status==='candidate'?2:status==='missing'?3:status==='conditions'?4:5,evaluatedOn:today,sourceVersion:CURATION_VERSION,reviewedAt:REVIEWED_AT};
 }).sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
}
export function curationHandoff({companyId,reportId,revision,result}){
 if(!companyId||!reportId||!Number.isInteger(revision)||revision<1||!CERTIFICATIONS.some(c=>c.id===result?.id))throw new CurationError('저장된 추천 결과를 먼저 확인해 주세요.');
 return {companyId,reportId,revision,certificationId:result.id,sourceVersion:CURATION_VERSION,kind:result.kind,standards:result.standard?[result.standard]:[],title:`${result.name} 준비`,notes:`인증 큐레이션 ${reportId} 수정${revision} / ${result.id} / ${CURATION_VERSION}\n${result.reasons.join('\n')}\n미확인: ${result.missing.map(x=>x.label).join(', ')||'기관 평가·실제 증빙 확인'}\n추천은 준비 검토이며 공식 적합·승인 결과가 아닙니다.`,eligibility:'not-determined'};
}
