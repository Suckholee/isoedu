// Per-document values; editing these never changes the company's master record.
export function readDocumentFields(ai={}){
 return {companyName:ai.documentFields?.companyName??ai.companyName??'',representativeName:ai.documentFields?.representativeName??'',businessNumber:ai.documentFields?.businessNumber??'',application:ai.documentFields?.application??ai.input?.application??'unknown'};
}
export function sameDocumentFields(a,b){return ['companyName','representativeName','businessNumber','application'].every(key=>a?.[key]===b?.[key]);}
export function validateDocumentFields(value){
 const limits={companyName:200,representativeName:100,businessNumber:20};
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>![...Object.keys(limits),'application'].includes(k)))throw Error('문서 기본정보를 확인해 주세요.');
 for(const [key,max] of Object.entries(limits))if(typeof value[key]!=='string'||value[key].length>max)throw Error('기업명·대표자·사업자등록번호의 입력 길이를 확인해 주세요.');
 if(!value.companyName.trim()||!['new','renewal','unknown'].includes(value.application))throw Error('기업명과 신청 구분을 확인해 주세요.');
 return Object.fromEntries([...Object.keys(limits),'application'].map(key=>[key,value[key].trim()]));
}
