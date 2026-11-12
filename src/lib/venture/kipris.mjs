import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {VentureError} from './generation.mjs';
export const KIPRIS_SPEC_URL='https://plus.kipris.or.kr/portal/popup/DBII_000000000000001/SC002/ADI_0000000000002944/apiDescriptionSearch.do';
const endpoint='https://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice/';
const parser=new XMLParser({parseTagValue:false,parseAttributeValue:false,ignoreAttributes:true,trimValues:true});
const scalar=(v,max=4000)=>typeof v==='string'?v.slice(0,max):'';
export function validatePatentQuery(body){
 if(!['keyword','applicant','application','rightholder'].includes(body.mode)||typeof body.query!=='string'||!body.query.trim()||body.query.length>150||!Number.isInteger(body.page)||body.page<1||body.page>100)throw new VentureError('검색 구분·검색어(150자 이내)·페이지를 확인해 주세요.');
 const query=body.mode==='application'?body.query.replace(/[\s-]/g,''):body.query.trim();
 if(body.mode==='application'&&!/^\d{13}$/.test(query))throw new VentureError('출원번호는 하이픈을 제외한 13자리 숫자로 입력해 주세요.');
 return {mode:body.mode,query,page:body.page};
}
export function parsePatentResponse(xml){
 if(typeof xml!=='string'||Buffer.byteLength(xml,'utf8')>1500000||/<!DOCTYPE|<!ENTITY/i.test(xml)||XMLValidator.validate(xml)!==true)throw new VentureError('KIPRIS 응답 형식을 확인하지 못했습니다. 다시 시도해 주세요.',502);
 let root;try{root=parser.parse(xml);}catch{throw new VentureError('KIPRIS 응답을 읽지 못했습니다.',502);}
 const response=root.response,header=response?.header||root.OpenAPI_ServiceResponse?.cmmMsgHeader;
 const code=scalar(header?.resultCode||header?.returnReasonCode,50);
 if(code&&!['0','00','000','0000'].includes(code))throw new VentureError('KIPRIS 요청이 거절되었습니다. API 키의 상품 이용 승인·기간·호출 한도를 확인해 주세요.',502);
 if(!response||typeof response!=='object')throw new VentureError('KIPRIS 검색 응답이 아닙니다.',502);
 const body=response.body||{},count=response.count||body.count;
 const totalValue=count?.totalCount??body.totalCount;
 if(totalValue===undefined||!/^\d+$/.test(String(totalValue)))throw new VentureError('KIPRIS 검색 건수를 확인하지 못했습니다.',502);
 const total=Number(totalValue),items=body.items?.item??response.items?.item??[];
 const list=items===''||items===null?[]:Array.isArray(items)?items:[items];
 if(list.length>10||total>0&&!list.length)throw new VentureError('KIPRIS 검색 목록을 확인하지 못했습니다.',502);
 const patents=list.map(item=>({applicationNumber:scalar(item.applicationNumber,30),title:scalar(item.inventionTitle,1000),applicationDate:scalar(item.applicationDate,20),applicantName:scalar(item.applicantName,1500),registerStatus:scalar(item.registerStatus,50),registerNumber:scalar(item.registerNumber,30),registerDate:scalar(item.registerDate,20),ipcNumber:scalar(item.ipcNumber,1000),abstract:scalar(item.astrtCont,4000)}));
 if(patents.some(p=>!/^\d{13}$/.test(p.applicationNumber)||!p.title))throw new VentureError('특허 번호·명칭이 누락되어 결과를 표시하지 않았습니다.',502);
 return {total,patents};
}
export async function searchPatents(body,{apiKey=process.env.KIPRIS_API_KEY,fetchImpl=fetch}={}){
 const query=validatePatentQuery(body);
 if(!apiKey?.trim())throw new VentureError('KIPRIS 연결 설정이 필요합니다. 관리자에게 API 키 설정을 요청해 주세요.',503);
 const url=new URL(endpoint+(query.mode==='keyword'?'getWordSearch':'getAdvancedSearch'));
 const field={keyword:'word',applicant:'applicant',application:'applicationNumber',rightholder:'rightHoler'}[query.mode];
 let key=apiKey.trim();try{if(/%[0-9A-F]{2}/i.test(key))key=decodeURIComponent(key);}catch{throw new VentureError('KIPRIS 키의 저장 형식을 확인해 주세요.',503);}
 url.search=new URLSearchParams({[field]:query.query,patent:'true',utility:'true',pageNo:String(query.page),numOfRows:'10',ServiceKey:key}).toString();
 let response;try{response=await fetchImpl(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});}catch{throw new VentureError('KIPRIS에 연결하지 못했습니다. 잠시 후 다시 검색해 주세요.',502);}
 if(!response.ok)throw new VentureError('KIPRIS 검색에 실패했습니다. 이용 승인과 연결 상태를 확인해 주세요.',502);
 if(Number(response.headers.get('content-length'))>1500000)throw new VentureError('KIPRIS 응답이 너무 큽니다.',502);
 // Bound the stream as well: a missing Content-Length must not bypass the limit.
 const reader=response.body?.getReader();if(!reader)throw new VentureError('KIPRIS 응답이 비어 있습니다.',502);
 const chunks=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1500000){await reader.cancel();throw Error();}chunks.push(value);}}catch{throw new VentureError('KIPRIS 응답을 끝까지 읽지 못했습니다. 다시 검색해 주세요.',502);}
 const xml=Buffer.concat(chunks).toString('utf8'),result=parsePatentResponse(xml);
 return {...result,...query,queriedAt:new Date().toISOString(),source:'KIPRIS Plus',sourceUrl:KIPRIS_SPEC_URL};
}
