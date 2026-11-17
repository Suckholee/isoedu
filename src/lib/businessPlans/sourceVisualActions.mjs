import {randomUUID,createHash} from 'node:crypto';
import {VentureError,uuid} from '../venture/generation.mjs';
import {documentEvaluationState} from './visionActions.mjs';
import {guideSourceVisual} from './sourceVisualCoach.mjs';
import {generatePlanImage} from './imageGeneration.mjs';
import {validateSourceVisual,visualCardKey} from './sourceVisuals.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const fresh=c=>c?.pending&&Date.now()-Date.parse(c.pending.at)<210000;
export async function handleSourceVisualAction({body,db,row,user,project,persist,download,guide=guideSourceVisual,image=generatePlanImage}){
 const ref=documentEvaluationState(row).report;
 if(!ref||body.reportKey!==ref.key||!Number.isInteger(body.index)||body.index<0||body.index>5)throw new VentureError('최신 평가의 시각 자료 카드를 다시 열어 주세요.',409);
 const report=JSON.parse((await download(db,ref.path,1000000)).toString('utf8')),recommendation=report.visualRecommendations?.[body.index];
 if(!recommendation)throw new VentureError('시각 자료 제안이 없습니다.',404);
 const key=visualCardKey(ref.key,body.index),cards=row.metadata.sourceVisuals||{};
 let card=cards[key]||{version:0,turns:[],visual:null,included:false,drafts:{}};
 const save=async next=>{card={...next,version:card.version+1,at:new Date().toISOString(),actor:user.id};row=await persist(db,row,{...row.metadata,sourceVisuals:{...row.metadata.sourceVisuals,[key]:card}});return {source:row,card};};
 if(!uuid(body.requestId))throw new VentureError('저장 요청을 확인해 주세요.');
 const requestHash=hash([body.action,body.message,body.type,body.visual,body.included]);
 const old=card.turns.find(t=>t.id===body.requestId);
 if(old){if(old.hash!==requestHash)throw new VentureError('이전 생성 요청과 내용이 다릅니다.',409);return {source:row,card};}
 if(card.lastRequest?.id===body.requestId){if(card.lastRequest.hash!==requestHash)throw new VentureError('이전 저장 요청과 내용이 다릅니다.',409);return {source:row,card};}
 if(fresh(card))throw new VentureError('다른 AI 작업이 진행 중입니다.',409);
 if(body.expectedVersion!==card.version)throw new VentureError('다른 창에서 이 자료를 수정했습니다. 입력은 보존됩니다. 최신 카드를 다시 열어 주세요.',409);
 if(body.action==='source-visual-save'){
  const next={...card,operationId:body.requestId,lastRequest:{id:body.requestId,hash:requestHash}};
  if(body.message!==undefined){if(typeof body.message!=='string'||body.message.length>4000)throw new VentureError('답변은 4,000자 이내로 입력해 주세요.');next.drafts={...card.drafts,[user.id]:body.message};}
  if(body.visual!==undefined){try{next.visual=body.visual===null?null:validateSourceVisual(body.visual,row);}catch(e){throw new VentureError(e.message);}if(next.visual?.type==='image'){const info=await db.storage.from('iso-vault').info(next.visual.path);if(info.error||!info.data||!['image/png','image/jpeg','image/webp'].includes(info.data.metadata?.mimetype||info.data.contentType)||Number(info.data.metadata?.size||info.data.size)>5*1024*1024)throw new VentureError('실제 저장된 이미지 파일을 확인해 주세요.');}}
  if(body.included!==undefined){if(typeof body.included!=='boolean'||body.included&&!next.visual)throw new VentureError('먼저 자료를 만들어 주세요.');next.included=body.included;}
  if(!next.visual)next.included=false;
  return save(next);
 }
 if(body.action!=='source-visual-chat'||!['table','bar','line','diagram','image'].includes(body.type)||typeof body.message!=='string'||!body.message.trim()||body.message.length>4000)throw new VentureError('만들 자료와 답변을 확인해 주세요.');
 if(card.turns.length>=20)throw new VentureError('카드의 AI 대화 20회에 도달했습니다. 만든 자료를 직접 수정할 수 있습니다.',429);
 const attempts=card.attempts||{};if((attempts[body.requestId]||0)>=3)throw new VentureError('같은 요청의 3회 시도가 끝났습니다. 입력은 보존됩니다.',429);
 const context=[row.metadata.sourceWorkingDrafts?.[user.id]?.content||row.content_draft||'',report.summary,recommendation.outline,recommendation.requiredData].join('\n').slice(0,65000);
 const previous={...card};await save({...card,operationId:body.requestId,pending:{id:body.requestId,at:new Date().toISOString()},attempts:{...attempts,[body.requestId]:(attempts[body.requestId]||0)+1},drafts:{...card.drafts,[user.id]:body.message}});
 try{
  const id=card.visual?.id||randomUUID();const result=await guide({row,recommendation,card,message:body.message,type:body.type,context,id});
  let visual=result.visual;
  if(visual&&body.type==='image'){
   if(!result.imagePrompt?.trim())throw new VentureError('그림 구도를 확인하지 못했습니다.',502);
   const generated=await image({prompt:result.imagePrompt});
   if(!(await db.rpc('can_edit_company',{c_id:project.company_id})).data)throw new VentureError('편집 권한이 변경됐습니다.',403);
   const path=`companies/${project.company_id}/${row.id}/visuals/${randomUUID()}.jpg`;
   const uploaded=await db.storage.from('iso-vault').upload(path,generated.bytes,{contentType:'image/jpeg',upsert:false});if(uploaded.error)throw new VentureError('그림을 저장하지 못했습니다.',503);
   visual=validateSourceVisual({...visual,path,caption:('AI 생성 개념 그림 · '+visual.caption.replace(/^(AI 생성 개념 그림\s*[·:]\s*)+/u,'')).slice(0,1000),source:('AI 생성 · '+generated.model+' · '+visual.source).slice(0,2000)},row);
  }
  if(!(await db.rpc('can_edit_company',{c_id:project.company_id})).data)throw new VentureError('편집 권한이 변경됐습니다.',403);
  // Read current metadata before commit: other cards/drafts may have been saved while AI ran.
  const current=await db.from('documents').select('*').eq('id',row.id).eq('company_id',project.company_id).maybeSingle();
  if(current.error||!current.data)throw new VentureError('자료를 다시 확인하지 못했습니다.',503);
  if(documentEvaluationState(current.data).key!==ref.key||current.data.metadata.sourceVisuals?.[key]?.pending?.id!==body.requestId)throw new VentureError('생성 요청이 변경됐습니다.',409);
  row=current.data;
  const turn={id:body.requestId,hash:requestHash,message:body.message,reply:result.reply,questions:result.questions,at:new Date().toISOString(),actor:user.id};
  return await save({...card,pending:null,visual:visual||card.visual,turns:[...card.turns,turn],drafts:{...card.drafts,[user.id]:''},history:[...(card.history||[]),...(visual&&previous.visual?[{visual:previous.visual,at:previous.at}]:[])]});
 }catch(e){
  await save({...card,pending:null,error:e.message}).catch(()=>{});
  throw e instanceof VentureError?e:new VentureError(e.message||'자료 생성에 실패했습니다. 이전 자료와 답변은 보존됩니다.',e.status||502);
 }
}
