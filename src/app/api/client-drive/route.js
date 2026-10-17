import {localReferenceAccess} from '../../../lib/referenceLibrary.mjs';
import {clientDrive} from '../../../lib/clientDrive.mjs';
export const dynamic='force-dynamic';export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request){if(!localReferenceAccess(request))return Response.json({error:'거래처 드라이브는 현재 로컬 환경에서만 사용할 수 있습니다.'},{status:403});try{return Response.json({nodes:await clientDrive.list()}, {headers});}catch{return Response.json({error:'드라이브를 불러오지 못했습니다.'},{status:503});}}
export async function POST(request){
 if(!localReferenceAccess(request))return Response.json({error:'로컬 드라이브 접근만 허용됩니다.'},{status:403});
 try{if(Number(request.headers.get('content-length'))>51*1024*1024)return Response.json({error:'파일은 50MB 이하여야 합니다.'},{status:413});let result;
 if(request.headers.get('content-type')?.includes('multipart/form-data')){const form=await request.formData();const file=form.get('file');if(!file||typeof file.arrayBuffer!=='function')throw Error('업로드할 파일을 선택해 주세요.');if(file.size>50*1024*1024)throw Error('파일은 50MB 이하여야 합니다.');result=await clientDrive.upload({parentId:form.get('parentId'),name:file.name,bytes:Buffer.from(await file.arrayBuffer())});}
 else{const body=await request.json();if(body.action==='createDraft')result=await clientDrive.draft(body);else result=await clientDrive.action(body);}
 const {sourcePath,...node}=result;return Response.json({node},{headers});
 }catch(e){return Response.json({error:e.message||'작업을 저장하지 못했습니다.'},{status:400});}
}
