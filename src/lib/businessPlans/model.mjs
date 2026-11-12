export const PLAN_TYPES=[
 {id:'venture',label:'벤처기업확인',pattern:'벤처|혁신성장'},
 {id:'startup',label:'예비·초기 창업패키지',pattern:'예비창업|초기창업|창업과제'},
 {id:'scaleup',label:'창업도약·스케일업',pattern:'창업도약|창도패|스케일업'},
 {id:'restart',label:'재도전성공패키지',pattern:'재도전'},
 {id:'export',label:'수출바우처·해외진출',pattern:'수출|해외진출'},
 {id:'data',label:'데이터바우처',pattern:'데이터바우처'},
 {id:'rnd',label:'R&D·기술개발',pattern:'R&D|연구개발|기술개발|프리팁스|TIPS|IP나래'},
 {id:'finance',label:'정책자금·기술보증',pattern:'보증|융자|기술사업|정책자금|육성기금'},
 {id:'employment',label:'고용·유연근무 지원',pattern:'고용|유연근무|신중년|시차출퇴근'},
 {id:'small',label:'소상공인·스마트공방',pattern:'소상공인|스마트공방|1인창조'},
 {id:'other',label:'기타 신청 사업',pattern:'.*'},
];
export const COMMON_LIBRARY_ID='5edfe9ef-debc-4f85-af8c-c75b9fff89d9';
export class PlanError extends Error {constructor(message,status=400){super(message);this.status=status;}}
export const isId=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
export const inferType=title=>PLAN_TYPES.find(t=>new RegExp(t.pattern,'i').test(title||''))?.id||'other';
export const isEligibleSource=d=>d.metadata?.sourceImport?.category!=='unassigned'&&!d.metadata?.sourceImport?.excludeFromAi&&!/아이디.*비번|비밀번호/.test(d.title||'');
export function sourceOption(d){return {id:d.id,title:d.title,updatedAt:d.updated_at,originalName:d.metadata?.originalName||d.title,originalPath:d.metadata?.originalPath||null,fileSize:d.metadata?.fileSize||0,sha256:d.metadata?.migration?.sha256||null,text:d.content_draft||'',category:d.metadata?.sourceImport?.category||'company-material',type:inferType(d.title)};}
const bounded=(s,max,name,required=true)=>{if(typeof s!=='string'||s.length>max||required&&!s.trim())throw new PlanError(`${name}을 확인해 주세요. (최대 ${max.toLocaleString()}자)`);return s.trim();};
export function validateInput(body){
 if(!isId(body.documentId)||!isId(body.companyId)||body.companyId===COMMON_LIBRARY_ID)throw new PlanError('작성할 회사를 선택해 주세요.');
 if(!PLAN_TYPES.some(t=>t.id===body.type))throw new PlanError('신청 사업을 선택해 주세요.');
 if(body.projectId&&!isId(body.projectId))throw new PlanError('프로젝트를 확인해 주세요.');
 if(body.consent!==true)throw new PlanError('선택한 자료의 AI 전달을 확인해 주세요.');
 const read=x=>{if(!isId(x?.id)||typeof x.updatedAt!=='string')throw new PlanError('자료 연결을 확인해 주세요.');return {id:x.id,updatedAt:x.updatedAt,text:bounded(x.text,60000,'자료 본문'),warnings:Array.isArray(x.warnings)?x.warnings.slice(0,10).map(s=>bounded(s,500,'읽기 안내',false)):[]};};
 if(!Array.isArray(body.sources)||body.sources.length>5)throw new PlanError('회사 자료는 5개까지 선택할 수 있습니다.');
 const template=read(body.template),sources=body.sources.map(read);
 if(new Set(sources.map(s=>s.id)).size!==sources.length||sources.some(s=>s.id===template.id))throw new PlanError('양식과 회사 자료를 중복 선택할 수 없습니다.');
 if(sources.reduce((n,s)=>n+s.text.length,0)>120000)throw new PlanError('회사 자료 본문 합계는 120,000자까지 가능합니다. 필요한 자료를 골라 주세요.');
 return {autoCompose:body.autoCompose===true,sourceWarnings:Array.isArray(body.sourceWarnings)?body.sourceWarnings.slice(0,5).map(w=>bounded(w,1000,'자료 읽기 안내',false)):[],type:body.type,projectId:body.projectId||null,business:bounded(body.business,4000,'사업 아이템'),facts:bounded(body.facts||'',16000,'확인한 정보',false),template,sources};
}
const normalize=s=>s.replace(/\s/g,'').normalize('NFKC');
export function validateOutput(value,input){
 if(!Array.isArray(value?.sections)||!value.sections.length||value.sections.length>60||!Array.isArray(value.questions)||value.questions.length>20)throw new PlanError('AI가 문항을 완성하지 못했습니다. 다시 시도해 주세요.',502);
 const ids=new Set(input.sources.map(x=>x.id));ids.add('user');const titles=new Set();
 const sections=value.sections.map((s,i)=>{
  const title=bounded(s.title,300,'문항 제목'),content=bounded(s.content,12000,'문항 내용'),requirement=bounded(s.requirement||'',2000,'작성 안내',false);
  if(!normalize(input.template.text).includes(normalize(title))||titles.has(title))throw new PlanError('원문 양식과 생성 문항이 다릅니다. 양식을 다시 확인해 주세요.',502);titles.add(title);
  if(!Array.isArray(s.evidenceIds)||s.evidenceIds.some(x=>!ids.has(x))||!Array.isArray(s.missing)||s.missing.length>15)throw new PlanError('생성 문항의 출처를 확인하지 못했습니다.',502);
  return {id:'section-'+(i+1),title,requirement,content,evidenceIds:[...new Set(s.evidenceIds)],missing:s.missing.map(x=>bounded(x,500,'확인 항목'))};
 });
 if(input.template.requiredSections&&(sections.length!==input.template.requiredSections.length||sections.some((s,i)=>s.title!==input.template.requiredSections[i])))throw new PlanError('필수 문항이 누락되었거나 순서가 다릅니다. 다시 시도해 주세요.',502);
 if(sections.reduce((n,s)=>n+s.content.length,0)>100000)throw new PlanError('생성 결과가 너무 큽니다. 양식을 나누어 주세요.',502);
 return {sections,questions:value.questions.map(x=>bounded(x,1000,'확인 질문'))};
}
