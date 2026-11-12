import {randomUUID} from 'node:crypto';
import {generatePlanImage} from './imageGeneration.mjs';
import {PlanError,isId} from './model.mjs';
import {validateVisuals} from '../venture/visuals.mjs';
const checked=r=>{if(r.error)throw new PlanError('그림 저장소 연결을 확인해 주세요.',503);return r.data;};
const versionAfter=row=>new Date(Math.max(Date.now(),(Date.parse(row.updated_at)||0)+1)).toISOString();
const compositionState=images=>images.every(i=>i.state==='ready')?'ready':images.some(i=>i.state==='failed')?'partial':'pending-images';
export async function completePlanImage({db,user,project,row,body,generate=generatePlanImage}){
 const ai=row?.metadata?.ai;
 if(!row||row.company_id!==project.company_id||ai?.projectId!==project.id||ai.state!=='ready'||!ai.applicationInput?.autoCompose||!isId(body.imageId))throw new PlanError('자동작성 문서와 그림을 확인해 주세요.',404);
 const jobs=ai.autoComposition?.images;
 if(!Array.isArray(jobs)||jobs.length>2)throw new PlanError('저장된 그림 작업을 확인해 주세요.');
 const job=jobs.find(j=>j.id===body.imageId);if(!job)throw new PlanError('그림 작업이 없습니다.',404);
 if(job.state==='ready')return {document:row};
 if(!checked(await db.rpc('can_edit_company',{c_id:project.company_id})))throw new PlanError('회사 편집 권한이 없습니다.',403);
 if(jobs.some(j=>j.state==='generating'&&Date.now()-Date.parse(j.startedAt)<130000))throw new PlanError('그림을 생성 중입니다. 잠시 후 저장 목록에서 이어가 주세요.',409);
 if(job.attempts>=3)throw new PlanError('그림 재시도 3회에 도달했습니다. 본문은 계속 편집할 수 있습니다.',429);
 if(!ai.formDefinition.sections.some(s=>s.id===job.sectionId))throw new PlanError('그림을 넣을 문항이 변경됐습니다.',409);
 if((ai.visuals||[]).length>=20)throw new PlanError('문서당 시각 자료는 20개까지 가능합니다.');
 const startedAt=versionAfter(row),attemptId=randomUUID(),nextJobs=jobs.map(j=>j.id===job.id?{...j,state:'generating',attempts:j.attempts+1,startedAt,attemptId,error:null}:j);
 const claimed=checked(await db.from('documents').update({updated_at:startedAt,metadata:{...row.metadata,ai:{...ai,autoComposition:{...ai.autoComposition,state:'pending-images',images:nextJobs}}}}).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',row.updated_at).select('*').maybeSingle());
 if(!claimed)throw new PlanError('문서가 동시에 변경됐습니다.',409);
 try{
  const image=await generate({prompt:job.prompt});
  if(!checked(await db.rpc('can_edit_company',{c_id:project.company_id})))throw new PlanError('그림 생성 중 편집 권한이 변경됐습니다.',403);
  const current=checked(await db.from('documents').select('id,updated_at').eq('id',row.id).eq('company_id',project.company_id).maybeSingle());
  if(current?.updated_at!==claimed.updated_at)throw new PlanError('문서가 수정되어 자동 그림을 덮어쓰지 않았습니다.',409);
  const path=`companies/${project.company_id}/${row.id}/visuals/${job.id}-${attemptId}.jpg`;
  checked(await db.storage.from('iso-vault').upload(path,image.bytes,{contentType:'image/jpeg',upsert:false}));
  const visual=validateVisuals([{...job,type:'image',path,basis:job.basis==='plan'?'plan':'reference',caption:`AI 생성 개념 그림 · ${job.caption}`.slice(0,1000),source:`AI 생성 · ${image.model} · ${job.source}`.slice(0,2000)}],{sectionIds:ai.formDefinition.sections.map(s=>s.id),companyId:project.company_id,documentId:row.id})[0];
  const completed=nextJobs.map(j=>j.id===job.id?{...j,state:'ready',path,model:image.model,completedAt:new Date().toISOString()}:j);
  const saved=checked(await db.from('documents').update({updated_at:versionAfter(claimed),metadata:{...claimed.metadata,ai:{...claimed.metadata.ai,visuals:[...(claimed.metadata.ai.visuals||[]),visual],autoComposition:{...claimed.metadata.ai.autoComposition,state:compositionState(completed),images:completed}}}}).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',claimed.updated_at).select('*').maybeSingle());
  if(!saved)throw new PlanError('문서가 변경되어 그림을 자동 삽입하지 않았습니다.',409);
  return {document:saved};
 }catch(e){
  const failedJobs=nextJobs.map(j=>j.id===job.id?{...j,state:'failed',error:e instanceof PlanError?e.message:'그림 생성·저장에 실패했습니다.'}:j);
  const failed=await db.from('documents').update({updated_at:versionAfter(claimed),metadata:{...claimed.metadata,ai:{...claimed.metadata.ai,autoComposition:{...claimed.metadata.ai.autoComposition,state:'partial',images:failedJobs}}}}).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',claimed.updated_at).select('*').maybeSingle();
  const error=e instanceof PlanError?e:new PlanError('그림 생성·저장에 실패했습니다. 본문과 완성된 자료는 보존됩니다.',502);error.document=failed.data||undefined;throw error;
 }
}
