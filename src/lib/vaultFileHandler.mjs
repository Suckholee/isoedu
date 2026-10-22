import {vaultFileTarget,vaultRange} from './vaultFileRequest.mjs';
export function createVaultFileHandler({getClient,config,fetcher=fetch}){
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const fail=(status,message)=>Response.json({error:message},{status,headers});
return async function GET(request){
 const target=vaultFileTarget(new URL(request.url).searchParams.get('path'));
 if(!target)return fail(400,'파일 경로를 확인해 주세요.');
 const client=await getClient();if(!client)return fail(503,'클라우드 연결을 확인해 주세요.');
 try{
  const {data:identity,error:identityError}=await client.auth.getUser();
  if(identityError||!identity.user)return fail(401,'로그인이 필요합니다.');
  const {data:document,error}=await client.from('documents').select('id').eq('id',target.documentId).eq('company_id',target.companyId).single();
  if(error||!document)return fail(404,'파일이 없거나 접근 권한이 없습니다.');
  const {data:session}=await client.auth.getSession();
  if(!session.session)return fail(401,'로그인이 필요합니다.');
  const upstreamHeaders={apikey:config.key,Authorization:`Bearer ${session.session.access_token}`};
  const range=vaultRange(request.headers.get('range'));if(range)upstreamHeaders.Range=range;
  const upstream=await fetcher(`${config.url}/storage/v1/object/iso-vault/${target.path.split('/').map(encodeURIComponent).join('/')}`,{headers:upstreamHeaders,cache:'no-store',signal:AbortSignal.timeout(30000)});
  if(!upstream.ok&&upstream.status!==416)return fail(upstream.status===401?401:404,'파일을 읽지 못했거나 접근 권한이 해제되었습니다.');
  const responseHeaders=new Headers(headers);
  for(const name of ['content-type','content-length','content-range','accept-ranges'])if(upstream.headers.has(name))responseHeaders.set(name,upstream.headers.get(name));
  responseHeaders.set('Content-Security-Policy',upstream.headers.get('content-type')?.includes('text/html') ? "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:" : "default-src 'none'; frame-ancestors 'self'");
  return new Response(upstream.body,{status:upstream.status,headers:responseHeaders});
 }catch{return fail(503,'파일을 불러오지 못했습니다. 연결 상태를 확인해 주세요.');}
};
}
