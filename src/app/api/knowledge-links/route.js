import {cookies} from 'next/headers';
import {randomUUID} from 'node:crypto';
import {createClient} from '../../../utils/supabase/server';
import {analyzeLink,LinkError,publicUrl} from '../../../lib/secondBrain/readLink.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=60;
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const uuid=x=>typeof x==='string'&&/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(x);
function checked(result){if(result.error){const c=result.error.code;throw new LinkError(c==='40001'?'다른 창에서 수정되었습니다. 최신 기록을 다시 열어 주세요.':c==='42501'?'이 회사의 기록 편집 권한이 필요합니다.':c==='P0001'?'링크 읽기는 계정당 5분에 10회, 하루 100회까지 가능합니다. 잠시 후 다시 시도해 주세요.':['PGRST202','PGRST204','42883'].includes(c)?'링크 분석 저장소 설정이 필요합니다.':'분석 결과를 저장하지 못했습니다. 다시 시도해 주세요.',c==='40001'?409:c==='42501'?403:c==='P0001'?429:503);}return result.data;}
export async function POST(request){try{
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)throw new LinkError('같은 사이트에서 다시 시도해 주세요.',403);
 const db=createClient(cookies());if(!db)throw new LinkError('로그인이 필요합니다.',401);
 const {data:{user},error}=await db.auth.getUser();if(error||!user)throw new LinkError('로그인이 필요합니다.',401);
 if(Number(request.headers.get('content-length'))>6000)throw new LinkError('입력이 너무 큽니다.',413);
 const raw=await request.text();if(Buffer.byteLength(raw)>6000)throw new LinkError('입력이 너무 큽니다.',413);
 let body;try{body=JSON.parse(raw);}catch{throw new LinkError('입력 형식을 확인해 주세요.',400);}
 if(!uuid(body?.companyId))throw new LinkError('회사를 선택해 주세요.',400);
 if(!checked(await db.rpc('can_edit_company',{c_id:body.companyId})))throw new LinkError('이 회사의 기록 편집 권한이 필요합니다.',403);
 let record;
 if(body.recordId){if(!uuid(body.recordId))throw new LinkError('기록을 확인해 주세요.',400);
 record=checked(await db.from('knowledge_records').select('*').eq('company_id',body.companyId).eq('id',body.recordId).maybeSingle());
 if(!record)throw new LinkError('기록을 찾지 못했습니다.',404);
 if(record.revision!==body.revision)throw new LinkError('다른 창에서 수정되었습니다. 최신 기록을 다시 열어 주세요.',409);
 }
 const url=publicUrl(record?record.source_url:body.url).href;
 checked(await db.rpc('claim_knowledge_link_read',{p_company:body.companyId}));
 const analysis=await analyzeLink(url,{signal:request.signal});
 const payload=record||{company_id:body.companyId,title:analysis.title,body:'',kind:'link',source_url:url,tags:[],pinned:false,archived:false};
 const saved=checked(await db.rpc('save_knowledge_analysis',{p_id:record?.id||randomUUID(),p_revision:record?.revision||0,p_record:payload,p_analysis:analysis}));
 return json({record:Array.isArray(saved)?saved[0]:saved});
 }catch(error){return json({error:error instanceof LinkError?error.message:'원문을 읽지 못했습니다. 연결을 확인하고 다시 시도해 주세요. 기존 기록은 유지됩니다.'},error instanceof LinkError?error.status:502);}}
