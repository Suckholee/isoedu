import {completePlanImage} from '../../../lib/businessPlans/imageActions.mjs';
import {applicationCatalog,generateApplication} from '../../../lib/venture/applicationActions.mjs';
import {handleVisualAction} from '../../../lib/venture/visualActions.mjs';
import {PlanError} from '../../../lib/businessPlans/model.mjs';
import {proposalParents} from '../../../lib/venture/proposalLineage.mjs';
import {readDocumentFields,sameDocumentFields} from '../../../lib/venture/documentFields.mjs';
import {handleSourceAction} from '../../../lib/venture/sourceActions.mjs';
import {searchPatents} from '../../../lib/venture/kipris.mjs';
import {cookies} from 'next/headers';
import {createClient} from '../../../utils/supabase/server';
import {definitionForAi, DOCUMENT_TYPES, SOURCE_FINGERPRINTS, VENTURE_VERSION, VENTURE_BOOK_URL, officialRequestItems, sectionsToText} from '../../../lib/venture/catalog.mjs';
import {VentureError,uuid,validateInput,inputHash,generateVentureDocument,revisionPatch} from '../../../lib/venture/generation.mjs';
import {validateChatRequest,guideVentureDocument} from '../../../lib/venture/conversation.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=120;
const headers={'Cache-Control':'private, no-store'};
const json=(body,status=200)=>Response.json(body,{status,headers});
function check(result){if(result.error)throw new VentureError('저장소 요청에 실패했습니다. 권한과 연결 상태를 확인해 주세요.',503);return result.data;}
async function context(projectId,write=false){
  if(!uuid(projectId))throw new VentureError('프로젝트를 확인해 주세요.');
  const db=createClient(cookies());
  if(!db)throw new VentureError('로그인된 기업 저장소가 필요합니다.',503);
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user)throw new VentureError('로그인이 필요합니다.',401);
  const project=check(await db.from('audit_projects').select('id,company_id,data').eq('id',projectId).maybeSingle());
  if(!project)throw new VentureError('접근할 수 없는 프로젝트입니다.',404);
  if(write&&!check(await db.rpc('can_edit_company',{c_id:project.company_id})))throw new VentureError('이 회사의 문서 편집 권한이 필요합니다.',403);
  const ops=check(await db.from('project_operations').select('data').eq('project_id',projectId).maybeSingle());
  project.applicationType=ops?.data?.applicationType;
  return {db,user,project};
}
const scoped=(db,project)=>db.from('documents').select('*').eq('company_id',project.company_id).eq('metadata->ai->>projectId',project.id);
const fail=e=>json({document:e.document||undefined,error:e instanceof VentureError||e instanceof PlanError?e.message:'처리하지 못했습니다. 입력은 유지되며 다시 시도할 수 있습니다.'},e instanceof VentureError||e instanceof PlanError?e.status:500);
export async function GET(request){
  try{const {db,project}=await context(new URL(request.url).searchParams.get('projectId'));
    return json({documents:check(await scoped(db,project).order('created_at',{ascending:false}).limit(100))});
  }catch(e){return fail(e);}
}
export async function POST(request){
  let active;
  try{
    const origin=request.headers.get('origin');
    if(origin&&origin!==new URL(request.url).origin)throw new VentureError('같은 사이트에서 다시 시도해 주세요.',403);
    if(Number(request.headers.get('content-length'))>1000000)throw new VentureError('입력이 너무 큽니다.',413);
    const raw=await request.text();if(Buffer.byteLength(raw,'utf8')>1000000)throw new VentureError('입력이 너무 큽니다.',413);
    let body;try{body=JSON.parse(raw);}catch{throw new VentureError('입력 형식을 확인해 주세요.');}
    const {db,user,project}=await context(body?.projectId,true);
    if(body.action==='application-catalog')return json(await applicationCatalog(db,project));
    if(['sync-checklist','generate','source-fill'].includes(body.action)&&project.applicationType!=='VENTURE_GROWTH')throw new VentureError('이 기능은 혁신성장 프로젝트에서 사용할 수 있습니다.');
    if(body.action==='source-fill'&&body.documentId){const target=check(await scoped(db,project).eq('id',body.documentId).maybeSingle());if(target?.metadata?.ai?.input?.type==='application_plan')throw new VentureError('신청 사업별 문서는 작성 설정에서 근거자료를 선택해 주세요.');}
    if(typeof body.action==='string'&&body.action.startsWith('source-'))return json(await handleSourceAction({body,db,user,project}));
    if(body.action==='sync-checklist'){
      check(await db.rpc('request_project_documents',{p_id:project.id,items:officialRequestItems()}));
      return json({saved:true});
    }
    if(body.action==='patent-status')return json({configured:!!process.env.KIPRIS_API_KEY?.trim()});
    if(!uuid(body.documentId))throw new VentureError('문서 식별자를 확인해 주세요.');
    if(body.action==='application-generate')return json(await generateApplication({db,user,project,body}));
    let row=check(await scoped(db,project).eq('id',body.documentId).maybeSingle());
    if(body.action==='application-image')return json(await completePlanImage({db,user,project,row,body}));
    if(body.action==='visual-generate')return json(await handleVisualAction({db,user,project,row,body}));
    if(body.action==='search-patents'){
      if(!row||row.metadata?.ai?.state!=='ready')throw new VentureError('생성된 문서를 먼저 선택해 주세요.',404);
      return json(await searchPatents(body));
    }
    if(body.action==='chat'){
      if(!row||row.metadata?.ai?.state!=='ready')throw new VentureError('생성된 문서를 먼저 선택해 주세요.',404);
      if(!uuid(body.turnId))throw new VentureError('대화 식별자를 확인해 주세요.');
      const payload=validateChatRequest(body,definitionForAi(row.metadata.ai)),hash=inputHash(payload),chat=row.metadata.ai.chat||{turns:[]};
      const previous=chat.turns.find(t=>t.id===body.turnId);
      if(previous){
        if(previous.inputHash!==hash)throw new VentureError('기존 대화 요청과 내용이 다릅니다.',409);
        if(previous.state==='ready')return json({document:row});
        if(previous.savedContentHash&&previous.savedContentHash!==inputHash(row.content_draft))throw new VentureError('이 대화 이후 저장된 본문이 변경되었습니다. 최신 문서에서 새 답변으로 이어가 주세요.',409);
        if(previous.state==='pending'&&Date.now()-Date.parse(previous.at)<130000)throw new VentureError('AI가 답변 중입니다. 잠시 후 저장 목록을 새로고침해 주세요.',409);
        if(body.retry!==true)throw new VentureError('이전 대화의 재시도를 선택해 주세요.',409);
        if(previous.attempts>=3)throw new VentureError('같은 대화는 세 번까지 재시도할 수 있습니다.',429);
      }else{
        if(row.updated_at!==body.expectedUpdatedAt)throw new VentureError('문서가 변경되었습니다. 저장본을 다시 불러와 주세요.',409);
        if(chat.turns.length>=20)throw new VentureError('문서당 대화 20회에 도달했습니다. 내용을 저장하고 새 초안으로 이어가 주세요.',429);
      }
      if(chat.turns.some(t=>t.id!==body.turnId&&t.state==='pending'&&Date.now()-Date.parse(t.at)<130000))throw new VentureError('다른 대화가 처리 중입니다.',409);
      const turn={id:body.turnId,...payload,savedContentHash:inputHash(row.content_draft),inputHash:hash,state:'pending',attempts:(previous?.attempts||0)+1,actor:user.id,at:new Date().toISOString()};
      const turns=previous?chat.turns.map(t=>t.id===turn.id?turn:t):[...chat.turns,turn];
      const claimed=check(await db.from('documents').update({updated_at:new Date().toISOString(),metadata:{...row.metadata,ai:{...row.metadata.ai,chat:{...chat,turns}}}}).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',row.updated_at).select('*').maybeSingle());
      if(!claimed)throw new VentureError('다른 곳에서 문서가 변경되었습니다.',409);
      active={db,row:claimed,chatTurnId:turn.id};
      const output=await guideVentureDocument({row:claimed,...payload});
      const completed={...turn,...output,state:'ready'};
      const draftFields=payload.documentFields||chat.proposal?.documentFields||readDocumentFields(row.metadata.ai);
      const hasDraft=output.proposedContent!==row.content_draft||!sameDocumentFields(draftFields,readDocumentFields(row.metadata.ai));
      const nextChat={...claimed.metadata.ai.chat,turns:turns.map(t=>t.id===turn.id?completed:t),proposal:hasDraft?{turnId:turn.id,content:output.proposedContent,documentFields:draftFields,changes:output.changes,parentTurnIds:proposalParents(chat,turn.id)}:null};
      const saved=check(await db.from('documents').update({updated_at:new Date().toISOString(),metadata:{...claimed.metadata,ai:{...claimed.metadata.ai,chat:nextChat}}}).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',claimed.updated_at).select('*').maybeSingle());
      if(!saved)throw new VentureError('대화 중 문서가 변경되어 덮어쓰지 않았습니다.',409);
      active=null;return json({document:saved});
    }
    if(body.action==='discard-proposal'){
      if(!row||row.updated_at!==body.expectedUpdatedAt)throw new VentureError('최신 문서를 다시 불러와 주세요.',409);
      const saved=check(await db.from('documents').update({updated_at:new Date().toISOString(),metadata:{...row.metadata,ai:{...row.metadata.ai,chat:{...row.metadata.ai.chat,proposal:null,turns:(row.metadata.ai.chat?.turns||[]).map(t=>!t.savedRevision&&t.changes?.length?{...t,discarded:true}:t)}}}}).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',row.updated_at).select('*').maybeSingle());
      if(!saved)throw new VentureError('문서가 변경되었습니다.',409);return json({document:saved});
    }
    if(body.action==='save'){
      if(!row)throw new VentureError('문서를 찾을 수 없습니다.',404);
      const patch=revisionPatch(row,body,user.id);
      for(const visual of patch.metadata.ai.visuals||[]){if(visual.type!=='image')continue;const info=await db.storage.from('iso-vault').info(visual.path);if(info.error||!info.data||!['image/png','image/jpeg','image/webp'].includes(info.data.metadata?.mimetype||info.data.contentType)||Number(info.data.metadata?.size||info.data.size)>5*1024*1024)throw new VentureError('그림 파일의 형식과 저장 상태를 확인해 주세요.');}
      const proposal=row.metadata.ai.chat?.proposal;
      if(proposal){
        if(body.proposalId!==proposal.turnId)throw new VentureError('AI 반영본을 확인하고 저장해 주세요.',409);
        patch.metadata.ai.chat={...row.metadata.ai.chat,proposal:null,turns:row.metadata.ai.chat.turns.map(t=>[proposal.turnId,...(proposal.parentTurnIds||[])].includes(t.id)?{...t,savedRevision:patch.metadata.revisionNo}:t)};
      }
      const saved=check(await db.from('documents').update(patch).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',row.updated_at).select('*').maybeSingle());
      if(!saved)throw new VentureError('다른 곳에서 문서가 변경되었습니다. 저장본을 다시 불러와 주세요.',409);
      return json({document:saved});
    }
    if(body.action!=='generate')throw new VentureError('지원하지 않는 요청입니다.');
    const input=validateInput(body.input),hash=inputHash(input);
    if(!process.env.OPENAI_API_KEY)throw new VentureError('AI 연결 설정이 필요합니다.',503);
    if(row){
      if(row.metadata.ai.inputHash!==hash)throw new VentureError('기존 요청과 입력이 다릅니다. 새 초안으로 생성해 주세요.',409);
      if(row.metadata.ai.state==='ready')return json({document:row});
      if(row.metadata.ai.state==='generating'&&Date.now()-Date.parse(row.updated_at)<130000)throw new VentureError('생성 중입니다. 잠시 후 저장본을 다시 불러와 주세요.',409);
      if((row.metadata.ai.attempts||1)>=3)throw new VentureError('세 번의 시도가 끝났습니다. 연결 상태를 확인하고 새 초안으로 생성해 주세요.',429);
      if(body.retry!==true)throw new VentureError('이전 요청이 완료되지 않았습니다. 재시도를 선택해 주세요.',409);
    }else{
      const {count,error}=await db.from('documents').select('id',{count:'exact',head:true}).eq('company_id',project.company_id).eq('metadata->ai->>kind','venture-document').gte('created_at',new Date(Date.now()-3600000).toISOString());
      if(error)throw new VentureError('생성 사용량을 확인하지 못했습니다.',503);
      if(count>=10)throw new VentureError('회사당 한 시간에 새 초안 10개까지 생성할 수 있습니다. 잠시 후 이용해 주세요.',429);
      const sources=input.sourceIds.length?check(await db.from('documents').select('id,title,content_draft,updated_at').eq('company_id',project.company_id).in('id',input.sourceIds)):[];
      if(sources.length!==input.sourceIds.length)throw new VentureError('참고 문서에 접근할 수 없습니다.',403);
      if(sources.some(s=>!s.content_draft?.trim()))throw new VentureError('참고 문서에 저장된 본문이 없습니다. 확인한 내용을 입력란에 옮겨 주세요.');
      if(sources.reduce((n,s)=>n+s.content_draft.length,0)>40000)throw new VentureError('참고 본문은 합계 40,000자까지 사용할 수 있습니다. 필요한 문서만 선택해 주세요.');
      const company=check(await db.from('companies').select('name').eq('id',project.company_id).single());
      const now=new Date().toISOString();
      const inserted=await db.from('documents').insert({id:body.documentId,company_id:project.company_id,title:`${company.name} · ${DOCUMENT_TYPES[input.type].title}`,certification_code:'VENTURE',hierarchy_level:'LEVEL_2',code:`VG-${body.documentId.slice(0,8)}`,status:'DRAFT',summary:'벤처 혁신성장유형 준비용 AI 초안 · 공식 제출 전 확인 필요',content_draft:'',updated_at:now,metadata:{standards:['VENTURE'],reviewStatus:'DRAFT',revisionNo:1,projectOrigin:{projectId:project.id,clientName:company.name},ai:{kind:'venture-document',projectId:project.id,state:'pending',attempts:0,input,inputHash:hash,sources,companyName:company.name,createdBy:user.id,basis:{version:VENTURE_VERSION,url:VENTURE_BOOK_URL,sha256:SOURCE_FINGERPRINTS},history:[]}}}).select('*').single();
      if(inserted.error?.code==='23505')throw new VentureError('같은 생성 요청이 이미 접수되었습니다. 저장본을 다시 불러와 주세요.',409);
      row=check(inserted);
    }
    const claimed=check(await db.from('documents').update({updated_at:new Date().toISOString(),metadata:{...row.metadata,ai:{...row.metadata.ai,state:'generating',attempts:(row.metadata.ai.attempts||0)+1,error:null}}}).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',row.updated_at).select('*').maybeSingle());
    if(!claimed)throw new VentureError('다른 요청이 처리 중입니다. 저장본을 다시 불러와 주세요.',409);
    active={db,row:claimed};
    const ai=claimed.metadata.ai;
    const output=await generateVentureDocument({companyName:ai.companyName,input:ai.input,sources:ai.sources});
    const saved=check(await db.from('documents').update({content_draft:sectionsToText(output.sections),updated_at:new Date().toISOString(),metadata:{...claimed.metadata,ai:{...ai,state:'ready',output,generatedAt:new Date().toISOString()}}}).eq('id',claimed.id).eq('company_id',project.company_id).eq('updated_at',claimed.updated_at).select('*').maybeSingle());
    if(!saved)throw new VentureError('생성 중 문서가 변경되어 덮어쓰지 않았습니다. 저장본을 확인해 주세요.',409);
    active=null;return json({document:saved});
  }catch(e){
    if(active?.chatTurnId){
      const {db,row,chatTurnId}=active;
      const failed=await db.from('documents').update({updated_at:new Date().toISOString(),metadata:{...row.metadata,ai:{...row.metadata.ai,chat:{...row.metadata.ai.chat,turns:row.metadata.ai.chat.turns.map(t=>t.id===chatTurnId?{...t,state:'failed',error:e instanceof VentureError||e instanceof PlanError?e.message:'대화 처리 실패'}:t)}}}}).eq('id',row.id).eq('company_id',row.company_id).eq('updated_at',row.updated_at).select('*').maybeSingle();
      return json({error:e instanceof VentureError||e instanceof PlanError?e.message:'대화 처리에 실패했습니다.',document:failed.data||undefined},e instanceof VentureError||e instanceof PlanError?e.status:500);
    }else if(active){const {db,row}=active;await db.from('documents').update({updated_at:new Date().toISOString(),metadata:{...row.metadata,ai:{...row.metadata.ai,state:'failed',error:e instanceof VentureError||e instanceof PlanError?e.message:'생성 또는 저장 중 오류가 발생했습니다.'}}}).eq('id',row.id).eq('company_id',row.company_id).eq('updated_at',row.updated_at);}
    return fail(e);
  }
}
