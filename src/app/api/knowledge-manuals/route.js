import {cookies} from 'next/headers';
import {createClient} from '../../../utils/supabase/server';
import {listManuals,saveManualAnalysis,ManualError} from '../../../lib/secondBrain/manualRepository.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=60;
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function database(){const db=createClient(cookies());if(!db)throw new ManualError('로그인이 필요합니다.',401);const {data,error}=await db.auth.getUser();if(error||!data?.user)throw new ManualError('로그인이 필요합니다.',401);return db;}
const fail=e=>json({error:e instanceof ManualError?e.message:'참조문서 분석을 완료하지 못했습니다. 원본은 유지됩니다.'},e instanceof ManualError?e.status:503);
export async function GET(){try{return json({documents:await listManuals(await database())});}catch(e){return fail(e);}}
export async function POST(request){try{
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)throw new ManualError('같은 사이트에서 다시 시도해 주세요.',403);
 const db=await database();if(Number(request.headers.get('content-length'))>4000000)throw new ManualError('본문이 너무 큽니다.',413);
 const raw=await request.text();if(Buffer.byteLength(raw)>4000000)throw new ManualError('본문이 너무 큽니다.',413);
 let body;try{body=JSON.parse(raw);}catch{throw new ManualError('본문 형식을 확인해 주세요.');}
 return json({document:await saveManualAnalysis(db,body)});
 }catch(e){return fail(e);}}
