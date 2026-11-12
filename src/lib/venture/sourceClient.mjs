import {supabase} from '../supabaseClient';
import {SOURCE_MAX_BYTES,SOURCE_PART_BYTES} from './sourceBundle.mjs';
import {readSourceUnits} from './sourceReader.mjs';
import {retrySourceTransfer,sourceTransferMessage} from './sourceTransfer.mjs';
const digest=async blob=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(b=>b.toString(16).padStart(2,'0')).join('');
export async function sourceFingerprint(file){return digest(new Blob([file.name+'\n'+file.size+'\n'+file.lastModified+'\n',file.slice(0,65536),file.slice(Math.max(0,file.size-65536))]));}
async function put(path,blob,type,signal){
 try{await retrySourceTransfer(async()=>{
  const result=await supabase.storage.from('iso-vault').upload(path,blob.type===type?blob:new Blob([blob],{type}),{contentType:type,upsert:false});
  if(!result.error)return;
  if(!/already exists|Duplicate/i.test(result.error.message))throw result.error;
  const old=await supabase.storage.from('iso-vault').download(path);if(old.error)throw old.error;
  if(await digest(old.data)!==await digest(blob))throw Error('이전에 올린 같은 자료 조각과 내용이 다릅니다.');
 },{signal});}catch(error){if(error.name==='AbortError'||/내용이 다릅니다/.test(error.message))throw error;throw Error(sourceTransferMessage(error),{cause:error});}
}
export async function prepareCompanySource(file,{api,sources,companyId,signal,onProgress=()=>{},onSource=()=>{}}){
 const ensure=()=>{if(signal?.aborted)throw new DOMException('준비를 중지했습니다.','AbortError');};
 if(file.size<=0||file.size>SOURCE_MAX_BYTES)throw Error('자료는 파일당 500MB까지 올릴 수 있습니다.');
 const fingerprint=await sourceFingerprint(file),previous=sources.find(s=>s.metadata.sourceUpload.fingerprint===fingerprint),sourceId=previous?.id||crypto.randomUUID();
 let source=(await api({action:'source-begin',sourceId,file:{name:file.name,size:file.size,fingerprint}})).source;onSource(source);
 if(source.metadata.sourceUpload.state!=='ready'){
  for(let i=0;i<Math.ceil(file.size/SOURCE_PART_BYTES);i++){ensure();const blob=file.slice(i*SOURCE_PART_BYTES,Math.min(file.size,(i+1)*SOURCE_PART_BYTES)),sha256=await digest(blob),old=source.metadata.sourceUpload.parts[i];
   if(old){if(old.sha256!==sha256)throw Error('이전 원본과 다른 파일입니다. 새 자료로 올려 주세요.');continue;}
   onProgress(`원본 전송 ${Math.min(file.size,(i+1)*SOURCE_PART_BYTES).toLocaleString('ko-KR')} / ${file.size.toLocaleString('ko-KR')} 바이트`);
   const path=`companies/${companyId}/${sourceId}/source-original/part-${String(i).padStart(5,'0')}`;await put(path,blob,source.metadata.sourceUpload.contentType,signal);ensure();source=(await api({action:'source-part',sourceId,index:i,sha256})).source;onSource(source);
  }
  ensure();source=(await api({action:'source-complete',sourceId})).source;onSource(source);window.dispatchEvent(new CustomEvent('honestone:documents-saved',{detail:{companyId}}));
 }
 if(source.metadata.sourceAnalysis.prepared)return source;
 const skipIds=new Set(source.metadata.sourceAnalysis.units.map(u=>u.id));let total=0;
 for await(const unit of readSourceUnits(file,{signal,skipIds,onProgress})){
  ensure();total=unit.id;if(unit.skip)continue;if(skipIds.has(unit.id))continue;
  const base=`companies/${companyId}/${sourceId}/analysis-input/unit-${unit.id}/`,textPath=base+'text.txt',images=[];
  await put(textPath,new Blob([unit.text],{type:'text/plain'}),'text/plain',signal);
  for(let i=0;i<unit.images.length;i++){const path=base+`image-${i}.jpg`;await put(path,unit.images[i],'image/jpeg',signal);images.push(path);ensure();}
  source=(await api({action:'source-unit',sourceId,unit:{id:unit.id,location:unit.location,textPath,images}})).source;onSource(source);
 }
 ensure();source=(await api({action:'source-prepared',sourceId,total})).source;onSource(source);return source;
}
export async function analyzeCompanySource(source,{api,signal,onProgress=()=>{},onSource=()=>{}}){
 if(!source.metadata.sourceAnalysis.prepared)throw Error('분석 준비가 끝나지 않았습니다. 원본을 다시 선택해 이어가 주세요.');
 for(const unit of source.metadata.sourceAnalysis.units){if(signal?.aborted)throw new DOMException('분석을 중지했습니다.','AbortError');if(unit.state==='ready')continue;const progress=`${unit.id}/${source.metadata.sourceAnalysis.total} · ${unit.location} 분석`;onProgress(progress);source=(await retrySourceTransfer(()=>api({action:'source-analyze',sourceId:source.id,unitId:unit.id}),{signal,onRetry:attempt=>onProgress(`${progress} · 연결 재시도 ${attempt}/2`)})).source;onSource(source);}
 return source;
}
