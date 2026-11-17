import {VentureError} from '../venture/generation.mjs';
export function updateWorkingDraft(row,body,actor){
  const cardMessages=body.cardMessages||{},activePriority=body.activePriority??null;
  if(typeof cardMessages!=='object'||Array.isArray(cardMessages)||Object.keys(cardMessages).length>30||Object.entries(cardMessages).some(([k,v])=>!/^([a-f0-9]{64}):[0-9]$/.test(k)||typeof v!=='string'||v.length>4000)||(activePriority!==null&&(typeof activePriority!=='string'||!/^([a-f0-9]{64}):[0-9]$/.test(activePriority))))throw new VentureError('카드 대화 초안을 확인해 주세요.');
  const old=row.metadata.sourceWorkingDrafts?.[actor];
  if(old?.requestId===body.requestId){if(old.content!==body.content||old.message!==body.message||old.pageId!==body.pageId||old.point!==body.point||JSON.stringify(old.cardMessages||{})!==JSON.stringify(cardMessages)||(old.activePriority??null)!==activePriority)throw new VentureError('이전 자동 저장 요청과 다릅니다.',409);return old;}
  if(!Number.isInteger(body.expectedDraftVersion)||body.expectedDraftVersion!==(old?.version||0))throw new VentureError('다른 창의 수정 내용이 먼저 저장됐습니다. 현재 입력은 이 기기에 보관했습니다. 다시 열어 저장본과 확인해 주세요.',409);
  if(typeof body.requestId!=='string'||body.requestId.length>100||!body.requestId||typeof body.content!=='string'||body.content.length>60000||typeof body.message!=='string'||body.message.length>4000||!Number.isInteger(body.pageId)||body.pageId<1||body.pageId>2000||!Number.isInteger(body.point)||body.point<0||body.point>20)throw new VentureError('자동 저장할 내용을 확인해 주세요.');
  return {cardMessages,activePriority,content:body.content,message:body.message,pageId:body.pageId,point:body.point,requestId:body.requestId,version:(old?.version||0)+1,actor,at:new Date().toISOString(),baseRevision:row.metadata.sourceReview?.revision||0};
}
