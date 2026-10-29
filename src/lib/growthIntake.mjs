export const GROWTH_KEY='honestone_growth_intake_v1';
export const INTERESTS={
 government:{label:'정부지원사업',description:'우리 회사에 맞는 공고부터 찾아보고 싶어요',steps:['소재지·업력·업종 등 신청 조건 확인','공고 원문과 제출 양식 확인','보유 서류와 모집 일정 정리']},
 certification:{label:'기업인증',description:'벤처·연구소 등 기업인증을 준비하고 싶어요',steps:['필요한 인증 종류와 목적 정리','회사 현황과 보유 증빙 확인','유형별 신청 서류 준비']},
 iso:{label:'ISO 인증',description:'ISO 인증과 갱신에 필요한 준비를 하고 싶어요',steps:['인증 규격과 적용 범위 확인','기존 문서와 부족한 자료 확인','준비 서류와 심사 일정 정리']},
 unsure:{label:'아직 잘 모르겠어요',description:'회사 상황에 맞춰 준비할 일을 정리하고 싶어요',steps:['사업 현황과 현재 목표 정리','지원사업·기업인증·ISO 중 우선순위 확인','먼저 준비할 자료 정리']},
};
const SIZE=['1~4명','5~9명','10~29명','30~99명','100명 이상'];
export const EMPLOYEE_RANGES=SIZE;
export function validateGrowthDraft(input){
 if(!input||!Object.hasOwn(INTERESTS,input.interest))throw Error('관심 분야를 선택해 주세요.');
 const text=(key,max,required=false)=>{const v=String(input[key]||'').trim();if(v.length>max||required&&!v)throw Error(key==='companyName'?'회사명을 100자 이내로 입력해 주세요.':'입력 내용을 확인해 주세요.');return v;};
 if(!SIZE.includes(input.employees))throw Error('직원 수를 선택해 주세요.');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id||''))throw Error('입력 정보를 다시 시작해 주세요.');
 return {id:input.id,interest:input.interest,companyName:text('companyName',100,true),industry:text('industry',80,true),employees:input.employees,region:text('region',60),createdAt:typeof input.createdAt==='string'&&input.createdAt.length<=40&&!Number.isNaN(Date.parse(input.createdAt))?new Date(input.createdAt).toISOString():new Date().toISOString()};
}
export const INTAKE_PREFIX='HONESTONE_GROWTH_INTAKE_V1\n';
export function parseGrowthIntake(notes){try{if(!notes?.startsWith(INTAKE_PREFIX))return null;return validateGrowthDraft(JSON.parse(notes.slice(INTAKE_PREFIX.length)));}catch{return null;}}
export function growthTaskPayload(draft,{userId,companyId,assignee='나',origin}){const data=validateGrowthDraft(draft);if(!userId||!companyId)throw Error('로그인한 회사 정보를 확인해 주세요.');return {id:data.id,created_by:userId,company_id:companyId,title:`${INTERESTS[data.interest].label} · ${data.companyName} 준비 방향 확인`.slice(0,180),status:'todo',assignee:assignee.slice(0,80),due_date:null,official_due_date:null,notes:INTAKE_PREFIX+JSON.stringify(data),source_url:new URL('/',origin).href,checklist:INTERESTS[data.interest].steps.map((text,i)=>({id:String(i),text,done:false}))};}
export async function saveGrowthTask(client,payload){
 const result=await client.from('work_tasks').insert(payload).select().single();
 if(!result.error)return result.data;
 if(result.error.code==='23505'){const existing=await client.from('work_tasks').select('*').eq('id',payload.id).eq('created_by',payload.created_by).single();if(!existing.error&&existing.data.company_id===payload.company_id&&existing.data.notes===payload.notes)return existing.data;}
 throw Error('준비 정보를 저장하지 못했습니다. 입력 내용은 유지됩니다. 로그인과 회사 권한을 확인한 뒤 다시 시도해 주세요.');
}
