import {renderHwpPages} from './hwpPageRenderer.mjs';
import {put} from '../venture/sourceClient.mjs';
import {readSourceUnits} from '../venture/sourceReader.mjs';
export async function prepareVisionSource(source,{api,signal,onSource=()=>{},onProgress=()=>{}}){
  onProgress('확장자에 맞는 페이지를 준비하고 있습니다…');
  const rendered=await api({action:'source-render',sourceId:source.id});source=rendered.source;onSource(source);
  const key=rendered.visualKey;if(source.metadata.sourceVision?.key===key&&source.metadata.sourceVision.prepared)return source;
  const path=source.metadata.sourceRender?.path||source.metadata.originalPath;
  const response=await fetch('/api/vault-file?path='+encodeURIComponent(path),{signal});if(!response.ok)throw Error('페이지 원본을 불러오지 못했습니다.');
  const blob=await response.blob();if(signal?.aborted)throw new DOMException('중지','AbortError');
  const file=new File([blob],source.metadata.sourceRender?.path?'preview.pdf':source.title,{type:blob.type});
  let total=0;
  for await(const unit of (rendered.renderer==='hwpjs-0.1.1'?renderHwpPages(file,{signal,onProgress}):readSourceUnits(file,{signal,onProgress}))){
    if(!unit.images.length)continue;
    const id=++total,pagePath=`companies/${source.company_id}/${source.id}/vision-pages/${key}/${id}.jpg`;
    if(source.metadata.sourceVision?.key===key&&source.metadata.sourceVision.pages.some(page=>page.id===id))continue;
    onProgress(`${id}쪽 이미지 보관 중…`);await put(pagePath,unit.images[0],'image/jpeg',signal);
    if(signal?.aborted)throw new DOMException('중지','AbortError');
    source=(await api({action:'source-vision-unit',sourceId:source.id,visualKey:key,page:{id,path:pagePath}})).source;onSource(source);
  }
  if(signal?.aborted)throw new DOMException('중지','AbortError');
  source=(await api({action:'source-vision-complete',sourceId:source.id,total})).source;onSource(source);return source;
}
