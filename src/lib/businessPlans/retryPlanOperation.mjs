// Retry only idempotent plan operations. User edits and permission conflicts stop.
const cancelled=()=>new DOMException('중지했습니다. 저장된 결과는 보존됩니다.','AbortError');
export function planRetryKind(error){
 if(error?.name==='AbortError'||/사용 잔액|연결 설정|인증·이용 권한/.test(error?.message||''))return null;
 const status=Number(error?.status||error?.statusCode);
 if(status===409&&/다른 AI 작업이 진행 중|생성 중입니다/.test(error.message))return 'pending';
 if(status===408||status>=500&&status<=599)return 'transient';
 if(!status&&(error instanceof TypeError||/Failed to fetch|network|연결|서버 응답을 읽지 못/.test(error?.message||'')))return 'transient';
 return null;
}
export function abortableDelay(ms,signal){return new Promise((resolve,reject)=>{
 if(signal?.aborted)return reject(cancelled());
 const stop=()=>{clearTimeout(timer);signal?.removeEventListener('abort',stop);reject(cancelled());};
 const timer=setTimeout(()=>{signal?.removeEventListener('abort',stop);resolve();},ms);
 signal?.addEventListener('abort',stop,{once:true});
});}
export async function retryPlanOperation(operation,{signal,onRetry=()=>{},recover=async()=>{},wait=abortableDelay,maxRetries=2,maxPendingPolls=45}={}){
 let retries=0,polls=0;
 for(;;){
  if(signal?.aborted)throw cancelled();
  try{const result=await operation();if(signal?.aborted)throw cancelled();return result;}
  catch(error){
   if(signal?.aborted)throw cancelled();
   const kind=planRetryKind(error);
   if(!kind||kind==='transient'&&retries>=maxRetries||kind==='pending'&&polls>=maxPendingPolls)throw error;
   if(kind==='pending')polls++;else retries++;
   onRetry({kind,attempt:retries,polls});
   await wait(kind==='pending'?5000:1500*retries,signal);
   if(signal?.aborted)throw cancelled();
   // Refresh CAS versions after failed/lost replies; never reuse stale snapshots.
   await recover(error);
  }
 }
}
export function visionIdentity(source){return JSON.stringify([source.id,source.metadata.sourceVision?.key,source.metadata.sourceVision?.pages.map(p=>[p.id,p.hash]),source.metadata.sourceCoach?.program||null]);}
export async function retryVisionOperation({source,body,api,signal,onRetry,onSource=()=>{},wait}){
 let current=source;const identity=visionIdentity(source);
 return retryPlanOperation(()=>api({...body,sourceId:current.id,expectedUpdatedAt:current.updated_at}),{signal,onRetry,wait,recover:async()=>{
  const fresh=await retryPlanOperation(()=>api({action:'source-render',sourceId:current.id}),{signal,wait});
  if(visionIdentity(fresh.source)!==identity)throw Object.assign(Error('원문 또는 평가기준이 변경되어 자동 재시도를 멈췄습니다. 최신 자료를 확인해 주세요.'),{status:409});
  current=fresh.source;if(!signal?.aborted)onSource(current);
 }});
}
