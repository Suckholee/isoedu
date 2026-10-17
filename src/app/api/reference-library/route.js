import {localReferenceAccess,referenceEntries} from '../../../lib/referenceLibrary.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request){
 if(!localReferenceAccess(request))return Response.json({error:'참고자료 문서함은 이 컴퓨터의 개발 환경에서만 사용할 수 있습니다.'},{status:403});
 try{return Response.json({documents:(await referenceEntries()).map(({source,...d})=>d),scope:'local-reference-library'},{headers:{'Cache-Control':'private, no-store'}});}
 catch{return Response.json({error:'참고자료 목록을 불러오지 못했습니다.'},{status:503});}
}
