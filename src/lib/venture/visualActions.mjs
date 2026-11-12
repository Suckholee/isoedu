import {VentureError,inputHash,uuid} from './generation.mjs';
import {generateVisual} from './visualGeneration.mjs';
const must=r=>{if(r.error)throw new VentureError('시각 자료 요청을 저장하지 못했습니다.',503);return r.data;};
export async function handleVisualAction({db,user,project,row,body,generate=generateVisual}){
 if(!row||row.metadata?.ai?.state!=='ready')throw new VentureError('작성할 문서를 선택해 주세요.',404);
 if(!uuid(body.requestId))throw new VentureError('요청 식별자를 확인해 주세요.');
 const requests=row.metadata.ai.visualRequests||[],hash=inputHash({sectionId:body.sectionId,visualType:body.visualType,instruction:body.instruction,content:body.content}),previous=requests.find(r=>r.id===body.requestId);
 if(previous){if(previous.hash!==hash)throw new VentureError('기존 요청과 입력이 다릅니다.',409);if(previous.state==='ready'&&previous.visual)return {document:row,visual:previous.visual};throw new VentureError('이미 처리한 요청입니다. 저장 목록을 확인해 주세요.',409);}
 if(row.updated_at!==body.expectedUpdatedAt)throw new VentureError('최신 문서를 다시 불러와 주세요.',409);
 if(requests.length>=20)throw new VentureError('문서별 시각 자료 생성 20회에 도달했습니다. 기존 자료를 편집해 주세요.',429);
 if(requests.some(r=>r.state==='pending'&&Date.now()-Date.parse(r.at)<130000))throw new VentureError('시각 자료를 생성하고 있습니다.',409);
 const request={id:body.requestId,hash,state:'pending',at:new Date().toISOString(),actor:user.id};
 const claimed=must(await db.from('documents').update({updated_at:new Date().toISOString(),metadata:{...row.metadata,ai:{...row.metadata.ai,visualRequests:[...requests,request]}}}).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',row.updated_at).select('*').maybeSingle());
 if(!claimed)throw new VentureError('문서가 변경됐습니다. 다시 불러와 주세요.',409);
 try{
  const visual=await generate({row:claimed,body});
  if(!must(await db.rpc('can_edit_company',{c_id:project.company_id})))throw new VentureError('편집 권한이 변경됐습니다.',403);
  const saved=must(await db.from('documents').update({updated_at:new Date().toISOString(),metadata:{...claimed.metadata,ai:{...claimed.metadata.ai,visualProposal:visual,visualRequests:[...requests,{...request,state:'ready',visual}]}}}).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',claimed.updated_at).select('*').maybeSingle());
  if(!saved)throw new VentureError('생성 중 문서가 변경됐습니다. 최신 문서를 불러와 주세요.',409);
  return {document:saved,visual};
 }catch(e){const failed=await db.from('documents').update({updated_at:new Date().toISOString(),metadata:{...claimed.metadata,ai:{...claimed.metadata.ai,visualRequests:[...requests,{...request,state:'failed'}]}}}).eq('id',row.id).eq('company_id',project.company_id).eq('updated_at',claimed.updated_at).select('*').maybeSingle();const error=e instanceof VentureError?e:new VentureError('시각 자료 생성에 실패했습니다.',502);error.document=failed.data||undefined;throw error;}
}
