import {localReferenceAccess} from '../../../lib/referenceLibrary.mjs';
import {clientDrive} from '../../../lib/clientDrive.mjs';
import {taskStore} from '../../../lib/workTasks.mjs';
export const dynamic='force-dynamic';export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request){if(!localReferenceAccess(request))return Response.json({error:'현재 업무 관리는 로컬 환경에서만 사용할 수 있습니다.'},{status:403});try{return Response.json({tasks:await taskStore.list(),nodes:await clientDrive.list()}, {headers});}catch{return Response.json({error:'업무를 불러오지 못했습니다.'},{status:503,headers});}}
export async function POST(request){if(!localReferenceAccess(request))return Response.json({error:'로컬 접근만 허용됩니다.'},{status:403});try{if(Number(request.headers.get('content-length'))>100000)throw Error('업무 내용이 너무 큽니다.');const task=await taskStore.save(await request.json(),await clientDrive.list());return Response.json({task},{headers});}catch(e){return Response.json({error:e.message||'저장하지 못했습니다.'},{status:400,headers});}}
