export function suggestCompanySources(sources,type){
 return [...sources].sort((a,b)=>Number(b.type===type)-Number(a.type===type)||Date.parse(b.updatedAt)-Date.parse(a.updatedAt)).slice(0,5).map(s=>s.id);
}
export async function finishAutomaticImages({document,api,onProgress=()=>{},isActive=()=>true}){
 let row=document;const failures=[];
 for(const job of document.metadata.ai.autoComposition?.images||[]){
  if(job.state==='ready'||job.attempts>=3)continue;
  if(!isActive())return {document:row,failures,interrupted:true};
  onProgress(`그림 작성·삽입 중: ${job.title}`);
  try{const result=await api({action:'application-image',documentId:row.id,imageId:job.id});row=result.document;}
  catch(e){if(!e.document)throw e;row=e.document;failures.push(e.message);}
 }
 return {document:row,failures};
}
