import {cookies} from 'next/headers';
import {createClient} from '../../../utils/supabase/server';
import {ArticleError,draftInput,generateArticle} from '../../../lib/articles/model.mjs';
export const dynamic='force-dynamic';export const maxDuration=120;
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
function check(r){if(r.error){const code=r.error.code;if(['40001','23505'].includes(code))throw new ArticleError('저장본이 변경되었습니다. 입력을 복사한 뒤 목록에서 최신 글을 다시 열어 주세요.',409);if(['22023','23514','23502'].includes(code))throw new ArticleError('제목·본문과 입력 길이를 확인해 주세요.',400);if(code==='42501')throw new ArticleError('관리자 권한이 필요합니다.',403);if(code==='P0001')throw new ArticleError(r.error.message,429);throw new ArticleError('글 저장소 연결을 확인해 주세요.',503);}return r.data;}
function saved(r){const data=check(r);const row=Array.isArray(data)?data[0]:data;if(!row?.id)throw new ArticleError('저장 결과를 확인하지 못했습니다. 목록을 새로고침해 주세요.',503);return row;}
async function context(){const db=createClient(cookies());if(!db)throw new ArticleError('로그인이 필요합니다.',401);const {data:{user},error}=await db.auth.getUser();if(error||!user)throw new ArticleError('로그인이 필요합니다.',401);if(check(await db.rpc('get_current_user_role'))!=='ADMIN')throw new ArticleError('관리자만 글을 작성·발행할 수 있습니다.',403);return db;}
const failure=e=>json({error:e instanceof ArticleError?e.message:'처리하지 못했습니다. 입력을 유지했으니 다시 시도해 주세요.'},e instanceof ArticleError?e.status:500);
export async function GET(){try{const db=await context();return json({articles:check(await db.from('site_article_drafts').select('*').order('updated_at',{ascending:false}).limit(100)),aiConfigured:Boolean(process.env.OPENAI_API_KEY)});}catch(e){return failure(e);}}
export async function POST(request){try{const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new ArticleError('같은 사이트에서 다시 시도해 주세요.',403);if(Number(request.headers.get('content-length'))>150000)throw new ArticleError('입력이 너무 큽니다.',413);const raw=await request.text();if(Buffer.byteLength(raw)>150000)throw new ArticleError('입력이 너무 큽니다.',413);let body;try{body=JSON.parse(raw);}catch{throw new ArticleError('입력 형식을 확인해 주세요.');}const db=await context();
 if(body.action==='generate'){if(!process.env.OPENAI_API_KEY)throw new ArticleError('AI 연결 설정이 필요합니다. 직접 작성과 저장은 사용할 수 있습니다.',503);const input=draftInput({...body,title:'',body:'',category:''});if(input.topic.length<3||input.source_notes.length<20)throw new ArticleError('주제와 참고자료를 입력해 주세요.');check(await db.rpc('claim_site_article_ai'));return json({draft:await generateArticle(input)});}
 if(!uuid(body.id)||!Number.isInteger(body.revision)||body.revision<0)throw new ArticleError('글 식별자와 저장본을 확인해 주세요.');
 if(body.action==='save'){const d=draftInput(body);return json({article:saved(await db.rpc('save_site_article',{p_id:body.id,p_revision:body.revision,p_title:d.title,p_body:d.body,p_category:d.category,p_topic:d.topic,p_source_notes:d.source_notes,p_ai_generated:d.ai_generated}))});}
 if(['publish','unpublish'].includes(body.action)){if(body.action==='publish'&&body.reviewed!==true)throw new ArticleError('공개할 내용을 먼저 검토해 주세요.');return json({article:saved(await db.rpc('publish_site_article',{p_id:body.id,p_revision:body.revision,p_publish:body.action==='publish'}))});}
 throw new ArticleError('지원하지 않는 요청입니다.');
 }catch(e){return failure(e);}}
