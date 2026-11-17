import {createHash,randomUUID} from 'node:crypto';
import {VentureError,uuid} from '../venture/generation.mjs';
import {validateSourceBundle} from '../venture/sourceBundle.mjs';
import {renderSourcePdf} from './renderSource.mjs';
import {validateProgramRubric,criteriaFor} from './visionReview.mjs';
import {evaluateVisionPage,evaluateVisionDocument,guideVisionReview} from './visionCoach.mjs';
import {HWP_RENDER_VERSION,usesNativeHwpRenderer} from './hwpRenderVersion.mjs';
const hash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const MAX_ATTEMPTS_PER_REQUEST=3;
const MIN_HOURLY_REQUESTS=30;
function enforceVisionQuota(usage,requestKey,{pageCount,chat=false}){
  if(usage.filter(item=>item.key===requestKey).length>=MAX_ATTEMPTS_PER_REQUEST){
    throw new VentureError('같은 분석·대화의 세 번 시도가 끝났습니다. 완료된 평가는 보존됩니다.',429);
  }
  // Historical usage stored page/report hashes and chat turn UUIDs in the same list.
  const cutoff=Date.now()-3600000;
  const recent=usage.filter(item=>uuid(item.key)===chat&&Date.parse(item.at)>cutoff).length;
  // Reserve enough requests for every page and the final report, including retries.
  const limit=chat?MIN_HOURLY_REQUESTS:Math.max(MIN_HOURLY_REQUESTS,(pageCount+1)*MAX_ATTEMPTS_PER_REQUEST);
  if(recent>=limit){
    const message=chat?'보완 대화의 시간당 요청 한도에 도달했습니다.':'문서 분석의 시간당 요청 한도에 도달했습니다. 완료된 페이지는 보존됩니다. 잠시 후 이어서 분석해 주세요.';
    throw new VentureError(message,429);
  }
}
export const rubricKey=row=>hash(row.metadata.sourceCoach?.program||null);
export const visualKey=row=>hash([row.metadata.sourceUpload.fingerprint,row.metadata.sourceRender?.path||row.metadata.originalPath,...(usesNativeHwpRenderer(row)?[HWP_RENDER_VERSION]:[])]);
export const pageEvaluationKey=(row,page)=>hash([row.metadata.sourceVision.key,page.id,page.hash,rubricKey(row)]);
export function documentEvaluationState(row){
  const vision=row.metadata.sourceVision,coach=row.metadata.sourceCoach||{};
  const pages=vision?.prepared&&vision.key===visualKey(row)?vision.pages:[];
  const refs=pages.map(page=>coach.evaluations?.find(e=>e.key===pageEvaluationKey(row,page))).filter(Boolean);
  const key=hash(['document-v2-visuals',vision?.key,rubricKey(row),pages.map(p=>pageEvaluationKey(row,p))]);
  return {key,total:pages.length,completed:refs.length,refs,report:pages.length&&refs.length===pages.length?coach.documents?.find(r=>r.key===key):null};
}
export async function handleVisionAction({body,db,row,user,project,persist,download,plainUpload}){
  const base=`companies/${project.company_id}/${row.id}/`,action=body.action;
  const save=metadata=>persist(db,row,metadata);
  if(action==='source-document-result'&&body.reportKey){
    const ref=row.metadata.sourceCoach?.documents?.find(e=>e.key===body.reportKey);
    if(!ref)throw new VentureError('이 문서의 종합 평가 기록이 없습니다.',404);
    return {source:row,report:JSON.parse((await download(db,ref.path,1000000)).toString('utf8'))};
  }
  const blobUpload=async(path,bytes,type)=>{const r=await db.storage.from('iso-vault').upload(path,new Blob([bytes],{type}),{contentType:type,upsert:false});if(r.error)throw new VentureError('페이지 파일을 저장하지 못했습니다.',503);};
  if(action==='source-page-result'&&body.evaluationKey){
    const ref=row.metadata.sourceCoach?.evaluations?.find(e=>e.key===body.evaluationKey);
    if(!ref)throw new VentureError('이 문서의 평가 기록이 없습니다.',404);
    return {source:row,evaluation:JSON.parse((await download(db,ref.path,1000000)).toString('utf8'))};
  }
  if(action==='source-render-attach'){
    if(row.updated_at!==body.expectedUpdatedAt||body.fingerprint!==row.metadata.sourceUpload.fingerprint)throw new VentureError('원본이 변경됐습니다. 최신 문서에서 연결해 주세요.',409);
    if(row.metadata.sourceVision?.pages?.length)throw new VentureError('이미 페이지가 준비된 문서는 새 자료로 등록해 주세요.',409);
    if(body.confirmed!==true||typeof body.path!=='string'||!body.path.startsWith(base+'vision-render/')||!/^[-a-f0-9]+\.pdf$/.test(body.path.slice((base+'vision-render/').length)))throw new VentureError('동일 원문에서 내보낸 PDF인지 확인해 주세요.');
    const pdf=await download(db,body.path,100*1024*1024);if(pdf.subarray(0,5).toString()!=='%PDF-')throw new VentureError('PDF 형식을 확인해 주세요.');
    row=await save({...row.metadata,sourceRender:{state:'ready',path:body.path,size:pdf.length,sha256:hash(pdf),format:'PDF',originalFormat:row.metadata.format,attachedBy:user.id,note:'사용자가 동일 원문에서 내보냈다고 확인한 PDF · 원본과 페이지를 대조하세요.'}});return {source:row};
  }
  if(action==='source-coach-discard'){
    if(row.updated_at!==body.expectedUpdatedAt)throw new VentureError('최신 대화를 다시 불러와 주세요.',409);
    const coach=row.metadata.sourceCoach||{};if(body.resolution==='applied'&&(!coach.proposal||coach.proposal.content!==body.content))throw new VentureError('적용한 수정안과 본문이 다릅니다.',409);if(coach.pending&&Date.now()-Date.parse(coach.pending.at)<120000)throw new VentureError('진행 중인 대화가 끝난 뒤 보류해 주세요.',409);
    row=await save({...row.metadata,sourceCoach:{...coach,pending:null,proposal:null,turns:(coach.turns||[]).map(t=>t.id===coach.proposal?.turnId?body.resolution==='applied'?{...t,applied:true,appliedAt:new Date().toISOString(),appliedBy:user.id}:{...t,discarded:true,discardedAt:new Date().toISOString(),discardedBy:user.id}:t)}});return {source:row};
  }
  if(action==='source-render'){
    if(row.metadata.sourceRender?.state==='ready')return {source:row,visualKey:visualKey(row)};
    const format=row.metadata.format;
    if(['HWP','HWPX'].includes(format))return {source:row,visualKey:visualKey(row),renderer:'hwpjs-0.1.1'};
    if(['PDF','PNG','JPG','JPEG'].includes(format))return {source:row,visualKey:visualKey(row)};
    if(row.metadata.sourceUpload.size>100*1024*1024)throw new VentureError('이 형식의 페이지 변환은 100MB까지 지원합니다. PDF로 내보내 추가해 주세요.',413);
    const old=row.metadata.sourceRender;if(old?.state==='rendering'&&Date.now()-Date.parse(old.startedAt)<120000)throw new VentureError('페이지 변환 중입니다. 잠시 후 다시 확인해 주세요.',409);
    row=await save({...row.metadata,sourceRender:{state:'rendering',startedAt:new Date().toISOString()}});
    try{
      const bundle=validateSourceBundle(row.metadata.sourceBundle,{companyId:project.company_id,documentId:row.id}),parts=[];
      for(const part of bundle.parts){const bytes=await download(db,part.path,part.size);if(bytes.length!==part.size||hash(bytes)!==part.sha256)throw new VentureError('원본 조각이 등록 당시와 다릅니다.',409);parts.push(bytes);}
      const pdf=await renderSourcePdf(Buffer.concat(parts),format),path=base+`vision-render/${randomUUID()}.pdf`;await blobUpload(path,pdf,'application/pdf');
      row=await persist(db,row,{...row.metadata,sourceRender:{state:'ready',path,sha256:hash(pdf),size:pdf.length,format:'PDF',originalFormat:format,note:'변환 페이지 · 글꼴·개체·인쇄 영역을 원본과 대조하세요.'}});
      return {source:row,visualKey:visualKey(row)};
    }catch(e){await persist(db,row,{...row.metadata,sourceRender:{state:'failed',error:e.message}}).catch(()=>{});throw e;}
  }
  if(action==='source-vision-unit'){
    const key=visualKey(row),page=body.page,vision=row.metadata.sourceVision;
    if(body.visualKey!==key||!Number.isInteger(page?.id)||page.id<1||page.id>2000||page.path!==base+`vision-pages/${key}/${page.id}.jpg`)throw new VentureError('페이지 이미지 연결을 확인해 주세요.');
    const bytes=await download(db,page.path,4000000);if(bytes[0]!==255||bytes[1]!==216)throw new VentureError('페이지는 JPEG 이미지여야 합니다.');
    const current=vision?.key===key?vision:{key,pages:[],prepared:false,...(usesNativeHwpRenderer(row)?{rendererVersion:HWP_RENDER_VERSION}:{})};
    const stored=current.pages.find(p=>p.id===page.id),digest=hash(bytes);
    if(stored){if(stored.hash!==digest)throw new VentureError('이미 보관한 페이지와 다릅니다.',409);return {source:row};}
    if(current.prepared)throw new VentureError('완료된 페이지 묶음을 변경할 수 없습니다.',409);
    const history=vision&&vision.key!==key?[...(row.metadata.sourceVisionHistory||[]),vision]:row.metadata.sourceVisionHistory;
    row=await save({...row.metadata,...(history?{sourceVisionHistory:history}:{}),sourceVision:{...current,pages:[...current.pages,{id:page.id,path:page.path,hash:digest}].sort((a,b)=>a.id-b.id)}});return {source:row};
  }
  if(action==='source-vision-complete'){
    const v=row.metadata.sourceVision;if(!v||v.key!==visualKey(row)||!Number.isInteger(body.total)||body.total<1||v.pages.length!==body.total||v.pages.some((p,i)=>p.id!==i+1))throw new VentureError('준비한 페이지가 누락되었습니다.',409);
    row=await save({...row.metadata,sourceVision:{...v,prepared:true,total:body.total}});return {source:row};
  }
  if(action==='source-rubric-save'){
    if(row.updated_at!==body.expectedUpdatedAt)throw new VentureError('문서가 변경됐습니다. 다시 열어 주세요.',409);
    if(row.metadata.sourceCoach?.pending&&Date.now()-Date.parse(row.metadata.sourceCoach.pending.at)<120000)throw new VentureError('AI 작업이 끝난 뒤 기준을 변경해 주세요.',409);
    let program;try{program=validateProgramRubric(body.program);}catch(e){throw new VentureError(e.message);}
    const coach=row.metadata.sourceCoach||{},at=new Date().toISOString();
    row=await save({...row.metadata,sourceCoach:{...coach,program,programHistory:[...(coach.programHistory||[]),{program,at,actor:user.id}],proposal:null,turns:(coach.turns||[]).map(t=>t.id===coach.proposal?.turnId?{...t,discarded:true,discardedAt:at,discardedBy:user.id,discardReason:'평가기준 변경'}:t)}});return {source:row};
  }
  const vision=row.metadata.sourceVision,coach=row.metadata.sourceCoach||{};
  let priorityReview=null,priority=null;
  if(action==='source-coach-chat'&&body.priorityIndex!==undefined){
    const ref=documentEvaluationState(row).report;
    if(!ref||body.reportKey!==ref.key)throw new VentureError('전체 평가가 변경됐습니다. 최신 보완 카드를 다시 열어 주세요.',409);
    priorityReview=JSON.parse((await download(db,ref.path,1000000)).toString('utf8'));
    if(!Number.isInteger(body.priorityIndex)||body.priorityIndex<0||!priorityReview.priorities[body.priorityIndex])throw new VentureError('보완 카드를 확인해 주세요.');
    priority=priorityReview.priorities[body.priorityIndex];
  }
  const page=vision?.pages.find(p=>p.id===(priority?priority.pages[0]:body.pageId));
  if(['source-document-result','source-document-evaluate'].includes(action)){
    const state=documentEvaluationState(row),{refs,report,...counts}=state;
    const progress={...counts,completedPageIds:refs.map(ref=>ref.pageId)};
    if(report)return {source:row,progress,report:JSON.parse((await download(db,report.path,1000000)).toString('utf8'))};
    if(action==='source-document-result')return {source:row,progress,report:null};
    if(!state.total||state.completed!==state.total)throw new VentureError('모든 페이지의 이미지 평가가 끝나야 전체 평가를 만들 수 있습니다.',409);
    if(row.updated_at!==body.expectedUpdatedAt)throw new VentureError('자료가 변경됐습니다. 다시 열어 이어서 분석해 주세요.',409);
    if(coach.pending&&Date.now()-Date.parse(coach.pending.at)<120000)throw new VentureError('다른 AI 작업이 진행 중입니다. 완료 후 이어서 분석해 주세요.',409);
    const usage=coach.usage||[];
    enforceVisionQuota(usage,state.key,{pageCount:state.total});
    const evaluations=[];let size=0;
    for(const ref of refs){const bytes=await download(db,ref.path,1000000);size+=bytes.length;if(size>1500000)throw new VentureError('종합 평가 용량을 초과했습니다. 페이지 분석 기록은 보존됩니다.',413);const result=JSON.parse(bytes.toString('utf8'));if(result.key!==ref.key)throw new VentureError('페이지 평가 기록이 변경됐습니다.',409);evaluations.push(result);}
    const pending={key:state.key,at:new Date().toISOString()};
    row=await save({...row.metadata,sourceCoach:{...coach,pending,usage:[...usage,pending]}});
    try{
      const result={...await evaluateVisionDocument({evaluations,criteria:criteriaFor(coach.program),program:coach.program}),key:state.key,total:state.total,pageKeys:refs.map(r=>r.key),criteria:criteriaFor(coach.program),program:coach.program||null,at:new Date().toISOString(),actor:user.id};
      const path=base+`vision-documents/${randomUUID()}.txt`;await plainUpload(db,path,result);
      row=await persist(db,row,{...row.metadata,sourceCoach:{...row.metadata.sourceCoach,pending:null,documents:[...(coach.documents||[]),{key:state.key,path,at:result.at,actor:user.id,total:state.total}]}});
      return {source:row,progress,report:result};
    }catch(e){await persist(db,row,{...row.metadata,sourceCoach:{...row.metadata.sourceCoach,pending:null,error:e.message}}).catch(()=>{});throw e;}
  }
  if(!vision?.prepared||vision.key!==visualKey(row)||!page)throw new VentureError('전체 페이지 이미지 준비를 먼저 완료해 주세요.',409);
  const key=pageEvaluationKey(row,page),existing=coach.evaluations?.find(e=>e.key===key);
  if(action==='source-page-result'){
    if(!existing)throw new VentureError('현재 기준으로 저장된 페이지 평가가 없습니다.',404);
    return {source:row,evaluation:JSON.parse((await download(db,existing.path,1000000)).toString('utf8'))};
  }
  if(!['source-page-evaluate','source-coach-chat'].includes(action))throw new VentureError('지원하지 않는 비전 작업입니다.');
  if(action==='source-page-evaluate'&&existing)return {source:row,evaluation:JSON.parse((await download(db,existing.path,1000000)).toString('utf8'))};
  if(coach.pending&&Date.now()-Date.parse(coach.pending.at)<120000)throw new VentureError('다른 AI 작업이 진행 중입니다.',409);
  if(action==='source-coach-chat'&&(!existing||!uuid(body.turnId)||typeof body.content!=='string'||!body.content.trim()||body.content.length>60000||typeof body.message!=='string'||!body.message.trim()||body.message.length>4000||(!priority&&!Number.isInteger(body.annotationIndex))))throw new VentureError('평가 지점·답변·보완 본문을 확인해 주세요.');
  const coachKey=priority?hash([priorityReview.key,body.priorityIndex]):key;
  const requestHash=hash([coachKey,body.content,body.message,priority?body.priorityIndex:body.annotationIndex]),oldTurn=coach.turns?.find(t=>t.id===body.turnId);
  if(oldTurn){if(oldTurn.requestHash!==requestHash)throw new VentureError('이전 대화 요청과 다릅니다.',409);return {source:row,turn:oldTurn};}
  if(action==='source-coach-chat'&&coach.proposal&&coach.proposal.content!==body.content)throw new VentureError('앞서 받은 수정안을 적용하거나 보류한 뒤 대화를 이어가세요.',409);
  if(row.updated_at!==body.expectedUpdatedAt)throw new VentureError('자료가 변경됐습니다. 최신 자료에서 다시 실행해 주세요.',409);
  if(action==='source-coach-chat'&&(coach.turns||[]).length>=20)throw new VentureError('문서의 보완 대화 20회에 도달했습니다. 현재 내용을 저장해 주세요.',429);
  const usage=coach.usage||[];
  const attemptKey=action==='source-page-evaluate'?key:body.turnId;
  enforceVisionQuota(usage,attemptKey,{pageCount:vision.pages.length,chat:action==='source-coach-chat'});
  const pending={key:attemptKey,at:new Date().toISOString()};
  row=await save({...row.metadata,sourceCoach:{...coach,pending,usage:[...usage,pending]}});
  try{
    const bytes=await download(db,page.path,4000000);if(hash(bytes)!==page.hash)throw new VentureError('AI가 읽을 페이지 이미지가 변경됐습니다.',409);
    const image='data:image/jpeg;base64,'+bytes.toString('base64');let result;
    if(action==='source-page-evaluate'){
      const context=(row.metadata.sourceAnalysis?.units||[]).filter(u=>u.state==='ready'&&u.location?.match(/^(\d+)쪽/)?.[1]&&Math.abs(Number(u.location.match(/^(\d+)쪽/)[1])-page.id)<=1).map(u=>({location:u.location,summary:u.summary}));
      const contextImages=[];for(const adjacent of vision.pages.filter(p=>Math.abs(p.id-page.id)===1)){const bytes=await download(db,adjacent.path,4000000);if(hash(bytes)!==adjacent.hash)throw new VentureError('인접 페이지 이미지가 변경됐습니다.',409);contextImages.push({page:adjacent.id,image:'data:image/jpeg;base64,'+bytes.toString('base64')});}
      result=await evaluateVisionPage({image,contextImages,criteria:criteriaFor(coach.program),program:coach.program,page:{number:page.id,total:vision.total},context});
      const path=base+`vision-evaluations/${randomUUID()}.txt`,readAt=new Date().toISOString(),actor=user.id;
      result={...result,pageId:page.id,key,rubricKey:rubricKey(row),readAt,actor,criteria:criteriaFor(coach.program),program:coach.program||null,imagePath:page.path};
      await plainUpload(db,path,result);
      row=await persist(db,row,{...row.metadata,sourceCoach:{...row.metadata.sourceCoach,pending:null,evaluations:[...(coach.evaluations||[]),{key,pageId:page.id,path,rubricKey:rubricKey(row),readAt,actor,model:result.provider.model}]}});
      return {source:row,evaluation:{...result,pageId:page.id,key,rubricKey:rubricKey(row)}};
    }
    const evaluation=JSON.parse((await download(db,existing.path,1000000)).toString('utf8')),annotation=priority?{role:'전체 문서 보완 카드',context:priorityReview.summary,evidence:priority.pages.map(n=>`${n}쪽`).join(', '),...priority}:evaluation.annotations[body.annotationIndex];if(!annotation)throw new VentureError('평가 지점을 확인해 주세요.');
    const wholeRef=documentEvaluationState(row).report;const documentReview=wholeRef?JSON.parse((await download(db,wholeRef.path,1000000)).toString('utf8')):null;
    result=await guideVisionReview({image,evaluation,annotation,documentReview,content:body.content,message:body.message,history:(coach.turns||[]).filter(t=>t.key===coachKey).slice(-8).map(t=>({message:t.message,reply:t.reply}))});
    const turn={id:body.turnId,requestHash,key:coachKey,pageId:page.id,...(priority?{reportKey:priorityReview.key,priorityIndex:body.priorityIndex,priorityIssue:priority.issue}:{annotationIndex:body.annotationIndex}),message:body.message,reply:result.reply,questions:result.questions,changes:result.changes,provider:result.provider,at:new Date().toISOString(),actor:user.id};
    const proposal=result.changes.length?{turnId:body.turnId,baseContent:body.content,content:result.proposedContent,key:coachKey,...(priority?{reportKey:priorityReview.key,priorityIndex:body.priorityIndex}:{})}:null;
    row=await persist(db,row,{...row.metadata,sourceCoach:{...row.metadata.sourceCoach,pending:null,turns:[...(coach.turns||[]),turn],proposal}});return {source:row,turn};
  }catch(e){await persist(db,row,{...row.metadata,sourceCoach:{...row.metadata.sourceCoach,pending:null,error:e.message}}).catch(()=>{});throw e;}
}
