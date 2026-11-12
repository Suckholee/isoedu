import {cookies} from 'next/headers';
import {createClient} from '../../../utils/supabase/server';
import {CurationError} from '../../../lib/curation/engine.mjs';
import {curationContext,readCuration,publicReport,saveCuration} from '../../../lib/curation/repository.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
const fail=e=>json({error:e instanceof CurationError?e.message:'처리하지 못했습니다. 입력을 유지한 채 다시 시도해 주세요.'},e instanceof CurationError?e.status:500);
export async function GET(request){try{const ctx=await curationContext(createClient(cookies()),new URL(request.url).searchParams.get('companyId'));return json({company:ctx.company,canEdit:ctx.canEdit,report:publicReport(await readCuration(ctx))});}catch(e){return fail(e);}}
export async function POST(request){try{
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new CurationError('같은 사이트에서 다시 시도해 주세요.',403);
 if(Number(request.headers.get('content-length'))>32000)throw new CurationError('입력 정보가 너무 큽니다.',413);
 const raw=await request.text();if(Buffer.byteLength(raw,'utf8')>32000)throw new CurationError('입력 정보가 너무 큽니다.',413);
 let body;try{body=JSON.parse(raw);}catch{throw new CurationError('입력 형식을 확인해 주세요.');}
 if(!body||typeof body!=='object'||Array.isArray(body))throw new CurationError('입력 형식을 확인해 주세요.');
 const ctx=await curationContext(createClient(cookies()),body.companyId,{write:true});return json({report:await saveCuration(ctx,body)});
 }catch(e){return fail(e);}}
