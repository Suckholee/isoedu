export const SOURCE_MAX_BYTES=500*1024*1024;
export const SOURCE_PART_BYTES=20*1024*1024;
export function validateSourceBundle(bundle,{companyId,documentId}){
 const prefix=`companies/${companyId}/${documentId}/`;
 if(bundle?.version!==1||!Number.isSafeInteger(bundle.size)||bundle.size<=0||bundle.size>SOURCE_MAX_BYTES||bundle.partSize!==SOURCE_PART_BYTES||typeof bundle.contentType!=='string'||bundle.contentType.length>150||typeof bundle.fileName!=='string'||bundle.fileName.length>255||!bundle.originalPath?.startsWith(prefix)||!Array.isArray(bundle.parts)||bundle.parts.length!==Math.ceil(bundle.size/SOURCE_PART_BYTES))throw Error('원본 분할 정보를 확인하지 못했습니다.');
 let offset=0;
 const parts=bundle.parts.map((part,i)=>{
  if(part.path!==`${prefix}source-original/part-${String(i).padStart(5,'0')}`||part.size!==Math.min(SOURCE_PART_BYTES,bundle.size-offset)||!/^[a-f0-9]{64}$/.test(part.sha256))throw Error('원본 조각의 경로·크기를 확인하지 못했습니다.');
  const entry={...part,start:offset,end:offset+part.size-1};offset+=part.size;return entry;
 });
 return {...bundle,parts};
}
export function bundleRange(value,size){
 if(!value)return {start:0,end:size-1,status:200};
 const match=value.match(/^bytes=(\d*)-(\d*)$/);if(!match||!match[1]&&!match[2])return null;
 let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2])),end=match[1]&&match[2]?Number(match[2]):size-1;
 if(![start,end].every(Number.isSafeInteger)||start<0||start>=size||end<start||!match[1]&&Number(match[2])===0)return null;
 return {start,end:Math.min(end,size-1),status:206};
}
export async function serveSourceBundle({bundle,target,request,fetchPart,headers}){
 const checked=validateSourceBundle(bundle,target),range=bundleRange(request.headers.get('range'),checked.size);
 if(!range)return new Response(null,{status:416,headers:{...headers,'Content-Range':`bytes */${checked.size}`}});
 const parts=checked.parts.filter(p=>p.end>=range.start&&p.start<=range.end),queue=parts[Symbol.iterator]();let reader,remaining=0;
 const body=new ReadableStream({async pull(controller){
  try{while(true){if(reader){const {done,value}=await reader.read();if(!done){if(value.byteLength>remaining)throw Error('파일 조각 크기가 다릅니다.');remaining-=value.byteLength;controller.enqueue(value);return;}if(remaining!==0)throw Error('원본 조각이 누락되었습니다.');reader=null;}
   const next=queue.next();if(next.done){controller.close();return;}
   const p=next.value,start=Math.max(range.start,p.start)-p.start,end=Math.min(range.end,p.end)-p.start;
   const response=await fetchPart(p.path,`bytes=${start}-${end}`);if(!response.ok||!response.body)throw Error('원본 조각에 접근할 수 없습니다.');
   if(response.status!==206&&!(start===0&&end===p.size-1&&response.status===200))throw Error('원본 구간 응답이 다릅니다.');
   remaining=end-start+1;reader=response.body.getReader();
  }}catch(e){await reader?.cancel().catch(()=>{});controller.error(e);}
 },async cancel(){await reader?.cancel().catch(()=>{});}});
 const output=new Headers(headers);output.set('Content-Type',checked.contentType);output.set('Content-Length',String(range.end-range.start+1));output.set('Accept-Ranges','bytes');output.set('Content-Disposition',`inline; filename*=UTF-8''${encodeURIComponent(checked.fileName)}`);output.set('Content-Security-Policy',"sandbox; default-src 'none'; frame-ancestors 'self'");if(range.status===206)output.set('Content-Range',`bytes ${range.start}-${range.end}/${checked.size}`);
 return new Response(body,{status:range.status,headers:output});
}
