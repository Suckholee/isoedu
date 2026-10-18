// Preview transport is separate from the unchanged original file.
export async function decodeCloudPreview(text,encoding){
 if(!encoding)return text;
 if(encoding!=='gzip-base64')throw Error('지원하지 않는 미리보기 저장 형식입니다.');
 const bytes=Uint8Array.from(atob(text),c=>c.charCodeAt(0));
 return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}
