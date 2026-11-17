import {cookies} from 'next/headers';
import {createClient} from '../../../utils/supabase/server';
import {getProfile} from '../../../lib/people/model.mjs';
import {BrandingError,brandingInput} from '../../../lib/people/branding.mjs';
import {instagramConnection} from '../../../lib/people/social.mjs';
export const dynamic='force-dynamic';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
function check({data,error}){
 if(!error)return data;
 if(['42P01','PGRST202','PGRST205'].includes(error.code))throw new BrandingError('파트너스 저장소 연결이 아직 준비되지 않았습니다. 입력은 유지됩니다.',503);
 if(['40001','23505'].includes(error.code))throw new BrandingError('다른 곳에서 수정되었습니다. 입력을 복사하고 최신 저장본을 다시 열어 주세요.',409);
 if(error.code==='42501')throw new BrandingError('관리자 권한이 필요합니다.',403);
 if(['22023','23514'].includes(error.code))throw new BrandingError('소개·채널 주소·공개 확인 근거를 확인해 주세요.');
 throw new BrandingError('저장소 연결을 확인해 주세요. 입력은 유지됩니다.',503);
}
async function context(){
 const db=createClient(cookies());if(!db)throw new BrandingError('로그인이 필요합니다.',401);
 const {data:{user},error}=await db.auth.getUser();if(error||!user)throw new BrandingError('로그인이 필요합니다.',401);
 if(check(await db.rpc('get_current_user_role'))!=='ADMIN')throw new BrandingError('관리자만 파트너스를 수정할 수 있습니다.',403);
 return db;
}
const failure=e=>json({error:e instanceof BrandingError?e.message:'처리하지 못했습니다. 입력을 유지하고 다시 시도해 주세요.'},e instanceof BrandingError?e.status:500);
export async function GET(){try{const db=await context();return json({profiles:check(await db.from('partner_profile_drafts').select('*').order('updated_at',{ascending:false}))});}catch(e){return failure(e);}}
export async function POST(request){try{
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new BrandingError('같은 사이트에서 다시 시도해 주세요.',403);
 if(Number(request.headers.get('content-length'))>150000)throw new BrandingError('입력이 너무 큽니다.',413);
 const db=await context(),raw=await request.text();if(Buffer.byteLength(raw)>150000)throw new BrandingError('입력이 너무 큽니다.',413);
 let body;try{body=JSON.parse(raw);}catch{throw new BrandingError('입력 형식을 확인해 주세요.');}
 if(!getProfile(body.slug)||!Number.isInteger(body.revision)||body.revision<0)throw new BrandingError('파트너와 저장본을 확인해 주세요.');
 if(body.action==='connection')return json({instagramConfigured:Boolean(instagramConnection(body.slug)&&/^v\d+\.0$/.test(process.env.INSTAGRAM_GRAPH_VERSION||''))});
 let data;
 if(body.action==='save')data=check(await db.rpc('save_partner_profile',{p_slug:body.slug,p_revision:body.revision,p_content:brandingInput(body.content)}));
 else if(['publish','withdraw'].includes(body.action)){
  if(body.action==='publish'&&body.reviewed!==true)throw new BrandingError('공개할 소개와 이력을 먼저 확인해 주세요.');
  data=check(await db.rpc('publish_partner_profile',{p_slug:body.slug,p_revision:body.revision,p_publish:body.action==='publish'}));
 }else throw new BrandingError('지원하지 않는 요청입니다.');
 const profile=Array.isArray(data)?data[0]:data;if(!profile?.slug)throw new BrandingError('저장 결과를 확인하지 못했습니다.',503);
 return json({profile});
 }catch(e){return failure(e);}}
