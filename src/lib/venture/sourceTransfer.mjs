// Immutable storage paths make a retry safe even when the first reply was lost.
export function transientSourceTransfer(error){
 const status=Number(error?.statusCode||error?.status||error?.cause?.status);
 if(status)return status===408||status===429||status>=500;
 return error instanceof TypeError||/network|fetch|timeout|timed out|connection|연결/i.test(error?.message||'');
}
export async function retrySourceTransfer(operation,{signal,onRetry=()=>{},wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 for(let attempt=1;;attempt++){
  if(signal?.aborted)throw new DOMException('중지됨','AbortError');
  try{return await operation();}catch(error){
   if(signal?.aborted)throw new DOMException('중지됨','AbortError');
   if(attempt>=3||!transientSourceTransfer(error))throw error;
   onRetry(attempt);await wait(attempt*1000);
  }
 }
}
export function sourceTransferMessage(error){
 const status=Number(error?.statusCode||error?.status);
 if(status===413)return '보관소가 자료 조각의 크기를 허용하지 않습니다. 관리자에게 보관소 크기 설정을 확인해 주세요.';
 if(status===401||status===403)return '자료 보관 권한을 확인하지 못했습니다. 로그인 상태와 회사 권한을 확인해 주세요.';
 if(status===429)return '보관소 요청 한도에 도달했습니다. 잠시 후 같은 파일로 이어가 주세요.';
 return `자료 전송에 실패했습니다${status?' (응답 '+status+')':''}. 완료한 조각은 보존됩니다. 연결·보관소 용량을 확인한 뒤 같은 파일로 이어가 주세요.`;
}
