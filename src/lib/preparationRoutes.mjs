const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function preparationPath({projectId,requestId='business-plan',documentId,fileId,companyId}) {
 if(!UUID.test(projectId)||!(['business-plan','overview'].includes(requestId)||UUID.test(requestId))||documentId&&!UUID.test(documentId)||fileId&&!UUID.test(fileId))throw Error('문서 주소를 확인해 주세요.');
 return `/dashboard/preparation/${projectId}/${requestId}${fileId?`/files/${fileId}`:documentId?`/documents/${documentId}`:''}${companyId?`?company=${encodeURIComponent(companyId)}`:''}`;
}
export function parsePreparationPath(pathname) {
 const parts=pathname.split('/').filter(Boolean);
 if(parts[0]!=='dashboard'||parts[1]!=='preparation'||![4,6].includes(parts.length))return null;
 const [, ,projectId,requestId,segment,documentId]=parts;
 if(!UUID.test(projectId)||!(['business-plan','overview'].includes(requestId)||UUID.test(requestId))||parts.length===6&&(!['documents','files'].includes(segment)||!UUID.test(documentId)))return null;
 return {projectId,requestId,documentId:segment==='documents'?documentId||null:null,fileId:segment==='files'?documentId||null:null};
}
