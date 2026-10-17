import {localReferenceAccess} from '../../../../lib/referenceLibrary.mjs';
import {clientDrive} from '../../../../lib/clientDrive.mjs';
import {documentPreview} from '../../../../lib/documentPreview.mjs';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {Readable} from 'node:stream';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request,{params}){
 if(!localReferenceAccess(request))return Response.json({error:'로컬 참고자료 접근만 허용됩니다.'},{status:403});
 try{
 const file=await clientDrive.file(params.id).catch(()=>null);let entry=file?{...file,source:file.sourcePath,title:file.name}:null;if(!entry)return Response.json({error:'문서를 찾을 수 없습니다.'},{status:404});
 const url=new URL(request.url);
 if(url.searchParams.has('preview')){try{const preview=await documentPreview(file);entry={...entry,source:preview.sourcePath,format:preview.format};}catch(e){return Response.json({error:e.message},{status:422,headers:{'Cache-Control':'private, no-store'}});}}
 if(!url.searchParams.has('file')&&!url.searchParams.has('preview'))return Response.json(await clientDrive.content(entry.id),{headers:{'Cache-Control':'private, no-store'}});
 if(entry.format==='HTML'){const {readFile}=await import('node:fs/promises');return new Response(await readFile(entry.source),{headers:{'Content-Type':'text/html; charset=utf-8','X-Document-Preview':'html','Cache-Control':'private, no-store','Content-Security-Policy':"sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'",'X-Content-Type-Options':'nosniff'}});}
 const size=(await stat(entry.source)).size;const range=request.headers.get('range');let start=0,end=size-1,status=200;
 if(range){const m=range.match(/^bytes=(\d*)-(\d*)$/);if(!m||(!m[1]&&!m[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});if(m[1]){start=Number(m[1]);end=m[2]?Number(m[2]):end;}else start=Math.max(0,size-Number(m[2]));end=Math.min(end,size-1);if(start>end||start>=size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});status=206;}
 const imageTypes={PNG:'image/png',JPG:'image/jpeg',JPEG:'image/jpeg',WEBP:'image/webp'};
 const mime=entry.format==='PDF'?'application/pdf':imageTypes[entry.format]||'application/octet-stream';
 const inline=(entry.format==='PDF'||imageTypes[entry.format])&&!url.searchParams.has('download');
 const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Type':mime,'Content-Disposition':`${inline?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(entry.title)}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'};
 if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${size}`;
 return new Response(Readable.toWeb(createReadStream(entry.source,{start,end})),{status,headers});
 }catch{return Response.json({error:'문서를 열지 못했습니다. 다시 시도해 주세요.'},{status:503});}
}
