import {composeVisuals} from '../businessPlans/autoComposition.mjs';
import {OFFICIAL_FORMS,FORM_COVERAGE,verifyOfficialForm} from '../businessPlans/officialFormCatalog.mjs';
import {canUseStoredTemplate,templateReview} from '../businessPlans/storedFormReview.mjs';
import {VentureError,inputHash} from './generation.mjs';
import {generatePlan} from '../businessPlans/generate.mjs';
import {validateInput,isEligibleSource,sourceOption,PLAN_TYPES} from '../businessPlans/model.mjs';
import {sectionsToText} from './catalog.mjs';
const versionAfter=row=>new Date(Math.max(Date.now(),(Date.parse(row.updated_at)||0)+1)).toISOString();
const must=r=>{if(r.error)throw new VentureError('자료 저장소의 권한과 연결을 확인해 주세요.',503);return r.data;};
export async function applicationCatalog(db,project){
 const own=must(await db.from('documents').select('id,title,company_id,content_draft,updated_at,metadata').eq('company_id',project.company_id).order('updated_at',{ascending:false}).limit(500));
 const common=must(await db.from('documents').select('id,title,company_id,content_draft,updated_at,metadata').eq('metadata->sourceImport->>category','reference').limit(200));
 const company=must(await db.from('companies').select('id,name,industry').eq('id',project.company_id).single());
 const previous=own.find(d=>d.metadata?.ai?.applicationInput)?.metadata.ai.applicationInput;
 return {company,previousInput:previous?{business:previous.business,facts:previous.facts}:null,coverage:FORM_COVERAGE,templates:[...OFFICIAL_FORMS,...[...new Map([...common,...own.filter(d=>d.metadata?.originalPath)].filter(d=>isEligibleSource(d)&&canUseStoredTemplate(d)).map(d=>[d.id,d])).values()].map(d=>({...sourceOption(d),review:templateReview(d),type:templateReview(d).type||sourceOption(d).type,status:'stored-unverified'}))],sources:own.filter(d=>isEligibleSource(d)&&d.metadata?.sourceImport?.category!=='reference'&&!d.metadata?.ai&&(d.content_draft?.trim()||d.metadata?.originalPath)).map(sourceOption)};
}
export async function generateApplication({db,user,project,body,generate=generatePlan}){
 let row=must(await db.from('documents').select('*').eq('id',body.documentId).eq('company_id',project.company_id).maybeSingle());
 const input=body.retry&&row?row.metadata.ai.applicationInput:validateInput({...body,companyId:project.company_id,projectId:project.id});
 if(!input)throw new VentureError('사업 양식 입력을 확인해 주세요.');
 const company=must(await db.from('companies').select('id,name,industry').eq('id',project.company_id).single());
 if(!row)input.companyProfile={name:company.name,industry:company.industry||''};
 else if(!body.retry&&row.metadata?.ai?.applicationInput?.companyProfile)input.companyProfile=row.metadata.ai.applicationInput.companyProfile;
 const official=verifyOfficialForm(input);
 if(official)input.template={...input.template,requirements:official.requirements,formKey:official.key,sourceUrl:official.sourceUrl,sha256:official.sha256,year:official.year,round:official.round,documentKind:official.documentKind,submissionMode:official.submissionMode,sourceScope:official.sourceScope||null,limitations:official.limitations,requiredSections:official.requiredSections||null};
 const hash=inputHash(input);
 const verify=async()=>{
  verifyOfficialForm(input);
  const ids=[...(official?[]:[input.template.id]),...input.sources.map(s=>s.id)];
  const refs=ids.length?must(await db.from('documents').select('id,title,company_id,updated_at,metadata').in('id',ids)):[];
  if(refs.length!==ids.length)throw new VentureError('참고 자료 접근 권한을 확인해 주세요.',403);
  for(const source of [...(official?[]:[input.template]),...input.sources]){
   const d=refs.find(d=>d.id===source.id),isTemplate=source.id===input.template.id;
   if(!isEligibleSource(d)||!isTemplate&&d.company_id!==project.company_id||isTemplate&&(d.company_id!==project.company_id&&d.metadata?.sourceImport?.category!=='reference'||!canUseStoredTemplate(d)))throw new VentureError('이 회사의 자료와 확인 가능한 빈 양식만 사용할 수 있습니다.',403);
   if(source.updatedAt!==d.updated_at)throw new VentureError('자료가 변경됐습니다. 다시 읽어 주세요.',409);
  }
  if(official)refs.push({id:official.id,title:official.title,company_id:null,metadata:{migration:{sha256:official.sha256}}});
  return refs;
 };
 const refs=await verify();if(row){if(row.metadata?.ai?.projectId!==project.id||row.metadata.ai.inputHash!==hash)throw new VentureError('다른 문서 또는 다른 입력입니다.',409);if(row.metadata.ai.state==='ready')return {document:row};if(row.metadata.ai.state==='generating'&&Date.now()-Date.parse(row.updated_at)<130000)throw new VentureError('생성 중입니다. 잠시 후 목록을 새로고침해 주세요.',409);if(!body.retry||row.metadata.ai.attempts>=3)throw new VentureError('같은 요청의 재시도 가능 횟수를 확인해 주세요.',409);}
 else{
  if(!process.env.OPENAI_API_KEY)throw new VentureError('AI 연결 설정이 필요합니다.',503);
  const quota=await db.from('documents').select('id',{head:true,count:'exact'}).eq('company_id',project.company_id).eq('metadata->ai->>kind','venture-document').gte('created_at',new Date(Date.now()-3600000).toISOString());must(quota);if(quota.count>=10)throw new VentureError('한 시간에 회사별 새 문서 10개까지 생성할 수 있습니다.',429);
  const inserted=await db.from('documents').insert({id:body.documentId,company_id:project.company_id,title:`${company.name} · ${official?.title||PLAN_TYPES.find(t=>t.id===input.type).label+' 사업계획서'}`,code:'AP-'+body.documentId.slice(0,8),certification_code:'BUSINESS_PLAN',hierarchy_level:'LEVEL_2',status:'DRAFT',content_draft:'',metadata:{revisionNo:1,reviewStatus:'DRAFT',standards:['BUSINESS_PLAN'],projectOrigin:{projectId:project.id,clientName:company.name},ai:{kind:'venture-document',projectId:project.id,companyName:company.name,state:'pending',attempts:0,input:{type:'application_plan',application:'unknown',business:input.business,facts:input.facts,sourceIds:input.sources.map(s=>s.id)},applicationInput:input,inputHash:hash,sources:input.sources.map(s=>({...s,title:refs.find(r=>r.id===s.id).title,content_draft:s.text})),basis:{officialForm:official?{key:official.key,year:official.year,round:official.round,sourceUrl:official.sourceUrl,originalUrl:official.originalUrl,sha256:official.sha256,verifiedAt:official.verifiedAt,requirements:official.requirements,documentKind:official.documentKind,submissionMode:official.submissionMode,sourceScope:official.sourceScope||null,versionLabel:official.versionLabel||null,requiredSections:official.requiredSections||null}:null,templateId:input.template.id,title:refs.find(r=>r.id===input.template.id).title,updatedAt:input.template.updatedAt,provenance:refs.map(r=>({id:r.id,title:r.title,companyId:r.company_id,sha256:r.metadata?.migration?.sha256||null}))},history:[],createdBy:user.id}}}).select('*').single();if(inserted.error?.code==='23505')throw new VentureError('같은 요청이 이미 접수됐습니다. 목록을 새로고침해 주세요.',409);row=must(inserted);
 }
 const claimed=must(await db.from('documents').update({updated_at:versionAfter(row),metadata:{...row.metadata,ai:{...row.metadata.ai,state:'generating',attempts:row.metadata.ai.attempts+1,error:null}}}).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',row.updated_at).select('*').maybeSingle());if(!claimed)throw new VentureError('동시에 변경됐습니다.',409);
 try{const result=await generate({input,companyName:claimed.metadata.ai.companyName});if(!must(await db.rpc('can_edit_company',{c_id:project.company_id})))throw new VentureError('편집 권한이 변경됐습니다.',403);await verify();const content=sectionsToText(result.sections);if(content.length>80000)throw new VentureError('문서가 너무 큽니다. 양식을 나누어 주세요.');
  const composed=input.autoCompose?composeVisuals(result,{input,sections:result.sections}):{visuals:[],images:[],warnings:[]};
  const saved=must(await db.from('documents').update({content_draft:content,updated_at:versionAfter(claimed),metadata:{...claimed.metadata,ai:{...claimed.metadata.ai,state:'ready',generatedAt:new Date().toISOString(),formDefinition:{title:claimed.title,sections:result.sections.map(s=>({id:s.id,title:s.title,guide:s.requirement}))},output:{...result,checks:[...result.sections.flatMap(s=>s.missing),...(input.sourceWarnings||[]),...composed.warnings]},visuals:composed.visuals,autoComposition:input.autoCompose?{version:1,state:composed.images.length?'pending-images':'ready',images:composed.images,warnings:[...(input.sourceWarnings||[]),...composed.warnings]}:null}}}).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',claimed.updated_at).select('*').maybeSingle());if(!saved)throw new VentureError('생성 중 문서가 변경되어 덮어쓰지 않았습니다.',409);return {document:saved};
 }catch(e){await db.from('documents').update({updated_at:versionAfter(claimed),metadata:{...claimed.metadata,ai:{...claimed.metadata.ai,state:'failed',error:e.message}}}).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',claimed.updated_at);throw new VentureError(e.message,e.status||502);}
}
