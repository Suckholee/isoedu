const UUID='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
export function vaultFileTarget(path){
 if(typeof path!=='string'||path.length>2000||/[\\\u0000-\u001f]/.test(path)||path.split('/').some(part=>part==='..'||part==='.'||!part))return null;
 const match=path.match(new RegExp(`^companies/(${UUID})/(${UUID})/(.+)$`,'i'));
 return match?{companyId:match[1],documentId:match[2],path}:null;
}
export function vaultRange(value){return value&&/^bytes=\d*-\d*$/.test(value)&&value!=='bytes=-'?value:null;}
