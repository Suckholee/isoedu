export async function saveEnterpriseUpload(file,{companyId,user,getScope,retryState,createDocument,uploadFile,updateDocument}){
 const scope=getScope(),ensure=()=>{if(getScope()!==scope)throw Error('회사 또는 계정이 바뀌어 업로드 연결을 중지했습니다.');};
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(b=>b.toString(16).padStart(2,'0')).join('');ensure();
 let state=retryState.current;if(state?.scope!==scope||state?.hash!==hash){const doc=await createDocument({companyId,title:file.name,code:'FILE-'+crypto.randomUUID().slice(0,8),hierarchyLevel:'LEVEL_4',status:'DRAFT',reviewStatus:'REVIEW',kind:'client-file',format:file.name.split('.').pop().toUpperCase()});if(!doc?.id)throw Error('문서를 저장하지 못했습니다.');state={scope,hash,doc};retryState.current=state;}ensure();
 if(!state.uploaded){state.uploaded=await uploadFile(file,{companyId,docId:state.doc.id,user});}ensure();
 const path=state.uploaded.filePath,pdf=/\.pdf$/i.test(file.name),saved=await updateDocument({...state.doc,fileUrl:path,originalPath:path,fileName:file.name,fileSize:file.size,...(pdf?{previewPath:path,previewFormat:'PDF'}:{})});ensure();
 if(saved?.fileUrl!==path)throw Error('파일은 저장되었지만 문서 연결을 마치지 못했습니다. 같은 파일로 다시 시도해 주세요.');retryState.current=null;return saved;
}
