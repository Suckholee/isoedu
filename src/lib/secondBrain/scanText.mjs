import {abortable} from '../meeting/readDocumentDates.mjs';
export async function readScan(worker,image,{signal,onProgress=()=>{}}={}){
 const check=()=>{if(signal?.aborted)throw new DOMException('읽기를 중지했습니다.','AbortError');};
 check();let best=(await abortable(worker.recognize(image),signal)).data;
 if(best.confidence<60){
  for(const degrees of [270,90,180]){
   check();onProgress(`스캔 방향 ${degrees}도 확인 중`);
   const candidate=(await abortable(worker.recognize(image,{rotateRadians:degrees*Math.PI/180}),signal)).data;
   if(candidate.confidence>best.confidence+3&&candidate.text.replace(/\s/g,'').length>=35)best=candidate;
   if(best.confidence>=78)break;
  }
 }
 check();return {text:best.text,lowConfidence:best.confidence<45};
}
