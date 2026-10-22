export function normalizeLoginIdentifier(value=''){
 const raw=String(value??'').trim().toLowerCase();
 if(!raw)return '';
 if(!raw.includes('@')&&/^[a-z0-9._-]+$/i.test(raw))return `${raw}@honestone.kr`;
 return raw;
}
export function readLoginFields(formData,fallback={}){
 return {email:normalizeLoginIdentifier(formData.get('email')??fallback.email??''),password:String(formData.get('password')??fallback.password??'')};
}
export function loginErrorMessage(error){
 if(error?.code==='invalid_credentials'||/invalid login credentials/i.test(error?.message||''))return '이메일 또는 비밀번호가 일치하지 않습니다. 영문 대소문자와 특수문자를 확인해 주세요.';
 if(error?.code==='email_not_confirmed')return '이메일 인증 상태를 확인해야 합니다. 관리자에게 계정 상태 확인을 요청해 주세요.';
 if(error?.status===429)return '로그인 요청이 많아 잠시 제한되었습니다. 잠시 후 다시 시도해 주세요.';
 if(error?.name==='AbortError'||error?.name==='TimeoutError'||/fetch|network|timeout/i.test(error?.message||''))return '로그인 서버에 연결하지 못했습니다. 인터넷 연결·회사 네트워크 제한을 확인한 뒤 다시 시도해 주세요.';
 return '로그인을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
// Bound only auth requests: large document uploads retain their normal duration.
export function createAuthFetch(fetcher,timeoutMs=15000){
 return async(input,init={})=>{
  const url=typeof input==='string'?input:input.url||String(input);
  if(!url.includes('/auth/v1/'))return fetcher(input,init);
  const controller=new AbortController(),signal=init.signal;
  const abort=()=>controller.abort(signal?.reason);if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetcher(input,{...init,signal:controller.signal});}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 };
}
