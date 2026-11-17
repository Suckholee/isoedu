import {lookup} from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import {createHash} from 'node:crypto';
import {Parser} from 'htmlparser2';
import ipaddr from 'ipaddr.js';
import {analyzeText} from './concepts.mjs';
export class LinkError extends Error {constructor(message,status=422){super(message);this.status=status;}}
export function publicAddress(address){try{return ipaddr.process(address).range()==='unicast';}catch{return false;}}
export function publicUrl(value){
 let u;try{u=new URL(value);}catch{throw new LinkError('http 또는 https 링크를 입력해 주세요.');}
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port&&!['80','443'].includes(u.port)||u.href.length>2000)throw new LinkError('로그인 정보가 없는 공개 웹페이지 주소를 입력해 주세요.');
 const host=u.hostname.replace(/^\[|\]$/g,'');
 if(!host.includes('.')&& !host.includes(':')||/\.(local|localhost|internal|test|invalid)$/i.test(host)||ipaddr.isValid(host)&&!publicAddress(host))throw new LinkError('공개 인터넷 주소만 읽을 수 있습니다.');
 u.hash='';return u;
}
export async function resolvePublic(url,resolver=lookup){
 const host=url.hostname.replace(/^\[|\]$/g,'');
 const entries=ipaddr.isValid(host)?[{address:host,family:ipaddr.parse(host).kind()==='ipv4'?4:6}]:await resolver(host,{all:true});
 const allowed=entries.filter(e=>publicAddress(e.address));
 if(!allowed.length)throw new LinkError('내부 네트워크 주소는 읽을 수 없습니다.');
 return allowed.find(e=>e.family===4)||allowed[0];
}
// DNS is validated and pinned in the actual socket lookup, including every redirect.
export async function readPublicPage(value,{resolver=lookup,requester,signal}={}){
 let url=publicUrl(value);const deadline=AbortSignal.any([AbortSignal.timeout(18000),...(signal?[signal]:[])]);
 for(let step=0;step<5;step++){
  const address=await Promise.race([resolvePublic(url,resolver),new Promise((_,reject)=>{if(deadline.aborted)reject(new LinkError('읽기 시간이 초과되었습니다.'));else deadline.addEventListener('abort',()=>reject(new LinkError('읽기 시간이 초과되었습니다.')),{once:true});})]);
  const result=await new Promise((resolve,reject)=>{
   const send=requester||(url.protocol==='https:'?https.request:http.request);
   const req=send(url,{method:'GET',agent:false,signal:deadline,headers:{'User-Agent':'HonestoneLinkReader/1.0','Accept':'text/html, text/plain;q=0.9','Accept-Encoding':'identity'},lookup:(_host,options,cb)=>options?.all?cb(null,[address]):cb(null,address.address,address.family)},res=>{
    if([301,302,303,307,308].includes(res.statusCode)){res.resume();resolve({redirect:res.headers.location});return;}
    if(res.statusCode!==200){res.resume();reject(new LinkError(`원문 사이트에서 읽기를 허용하지 않았습니다 (${res.statusCode}). 링크와 메모는 직접 저장할 수 있습니다.`));return;}
    const type=res.headers['content-type']||'';
    if(!/^(text\/html|application\/xhtml\+xml|text\/plain)\b/i.test(type)){res.resume();reject(new LinkError('현재 공개 웹페이지와 텍스트 링크를 지원합니다. PDF·영상은 직접 메모로 추가해 주세요.'));return;}
    if(res.headers['content-encoding']&&res.headers['content-encoding']!=='identity'){res.destroy();reject(new LinkError('이 사이트의 압축 응답을 읽을 수 없습니다.'));return;}
    let length=0;const chunks=[];
    res.on('data',chunk=>{length+=chunk.length;if(length>2000000){res.destroy();reject(new LinkError('원문이 너무 큽니다. 2MB 이하 웹페이지를 넣어 주세요.'));}else chunks.push(chunk);});
    res.on('error',reject);res.on('end',()=>{if(length<=2000000)resolve({bytes:Buffer.concat(chunks),type,url:url.href});});
   });req.on('error',reject);req.end();
  });
  if(result.redirect){url=publicUrl(new URL(result.redirect,url).href);continue;}
  if(!result.bytes)throw new LinkError('원문 주소의 이동을 확인하지 못했습니다.');
  return result;
 }
 throw new LinkError('주소 이동이 너무 많아 원문을 읽지 못했습니다.');
}
export function pageText(bytes,type){
 const charset=type.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]||bytes.toString('ascii',0,2048).match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]||'utf-8';
 let html;try{html=new TextDecoder(charset).decode(bytes);}catch{html=bytes.toString('utf8');}
 if(type.startsWith('text/plain'))return {title:'',text:html.slice(0,60000),truncated:html.length>60000};
 let title='',all='',main='',depth=0,blocked=0,inTitle=false,mainDepth=0;const stack=[];
 const parser=new Parser({onopentag(name,attrs){
  const skip=['script','style','noscript','nav','footer','header','svg','form','button','iframe','template'].includes(name)||'hidden'in attrs||attrs['aria-hidden']==='true';
  stack.push({skip,main:name==='article'||name==='main'});depth++;
  if(skip)blocked++;if(name==='title')inTitle=true;if(name==='article'||name==='main')mainDepth++;
  if(['p','div','br','li','h1','h2','h3','section'].includes(name)&&!blocked){all+='\n';if(mainDepth)main+='\n';}
 },ontext(text){if(inTitle)title+=text;if(!blocked&&!inTitle){all+=text;if(mainDepth)main+=text;}},onclosetag(name){const state=stack.pop();depth--;if(state?.skip)blocked--;if(state?.main)mainDepth--;if(name==='title')inTitle=false;if(!blocked){all+=' ';if(mainDepth)main+=' ';}}},{decodeEntities:true});
 parser.end(html);
 const text=(main.trim().length>150?main:all).replace(/[\t ]+/g,' ').split('\n').map(s=>s.trim()).filter(Boolean).join('\n');
 if(text.length<160||/^(just a moment|access denied|checking your browser|enable javascript)/i.test(title.trim()))throw new LinkError('본문을 충분히 읽지 못했습니다. 로그인·접근 차단·스크립트 전용 페이지일 수 있습니다. 직접 메모로 추가해 주세요.');
 return {title:title.trim().slice(0,200),text:text.slice(0,60000),truncated:text.length>60000};
}
export async function analyzeLink(url,options){
 const page=await readPublicPage(url,options);const source=pageText(page.bytes,page.type);const analysis=analyzeText(source.text,source.title);
 if(!analysis.summary.length||!analysis.concepts.length)throw new LinkError('요약할 본문과 개념을 찾지 못했습니다. 직접 메모로 추가해 주세요.');
 return {...analysis,title:source.title||new URL(page.url).hostname,source_url:page.url,source_hash:createHash('sha256').update(source.text).digest('hex'),characters:source.text.length,truncated:source.truncated,read_at:new Date().toISOString()};
}
