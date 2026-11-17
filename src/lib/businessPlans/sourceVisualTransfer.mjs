import {randomUUID,createHash} from 'node:crypto';
import {VentureError} from '../venture/generation.mjs';
import {validateVisuals} from '../venture/visuals.mjs';
export function reviewedVisualAssets(refs){return refs.flatMap(source=>(source.metadata?.sourceReview?.visuals||[]).map(visual=>({id:createHash('sha256').update(source.id+':'+visual.id).digest('hex').slice(0,32),sourceId:source.id,sourceTitle:source.title,visual})));}
export function validatePlacements(value,assets,sections){
 if(!assets.length)return [];
 if(!Array.isArray(value)||value.length!==assets.length||new Set(value.map(p=>p.id)).size!==assets.length||value.some(p=>!assets.some(a=>a.id===p.id)||!sections.some(s=>s.title===p.sectionTitle)))throw new VentureError('저장한 시각 자료의 배치 위치를 확인하지 못했습니다.',502);
 return value;
}
export async function transferSourceVisuals({db,assets,placements,sections,companyId,documentId}){
 validatePlacements(placements,assets,sections);const visuals=[];
 for(const asset of assets){
  const section=sections.find(s=>s.title===placements.find(p=>p.id===asset.id).sectionTitle);let v={...asset.visual,id:asset.id,sectionId:section.id};
  if(v.type==='image'){
   const sourcePrefix=`companies/${companyId}/${asset.sourceId}/visuals/`;
   if(!v.path?.startsWith(sourcePrefix)||!/^[-\w]+\.(jpg|jpeg|png|webp)$/.test(v.path.slice(sourcePrefix.length)))throw new VentureError('원본 시각 자료 경로를 확인해 주세요.',403);
   const result=await db.storage.from('iso-vault').download(v.path);if(result.error||!result.data||result.data.size>5*1024*1024)throw new VentureError('보관된 이미지를 읽지 못했습니다.',503);
   const path=`companies/${companyId}/${documentId}/visuals/${randomUUID()}.${v.path.split('.').pop()}`;
   const saved=await db.storage.from('iso-vault').upload(path,result.data,{contentType:result.data.type,upsert:false});if(saved.error)throw new VentureError('새 신청서에 이미지를 저장하지 못했습니다.',503);v.path=path;
  }
  visuals.push(v);
 }
 return validateVisuals(visuals,{sectionIds:sections.map(s=>s.id),companyId,documentId});
}
