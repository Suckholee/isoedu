import {dateCandidates} from './documentDateCandidates.mjs';
export const DATE_READER_ENGINE='browser-reader-20261029-v2';
export const readingSource=doc=>doc.file_url||doc.metadata?.originalPath||'';
export function currentDateReading(doc){const r=doc.metadata?.dateReading;return r?.sourcePath===readingSource(doc)&&r?.engine===DATE_READER_ENGINE?r:null;}
export function pendingDateDocuments(docs){return docs.filter(d=>!['review','no_candidates','confirmed'].includes(currentDateReading(d)?.status));}
export async function textDateReading(text,warnings=[]){const bytes=new TextEncoder().encode(text);return {...dateCandidates([{text,location:'문서함 저장 본문',method:'stored-text'}],{warnings}),sourceHash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('')};}
export function compactReading(candidate){
 const evidence={};for(const [field,items]of Object.entries(candidate.evidence||{}))evidence[field]=items.slice(0,100).map(x=>({...x,excerpt:x.excerpt.slice(0,260),location:x.location.slice(0,180)}));
 const count=candidate.issuedOn||candidate.validUntil||candidate.coveredYears?.length;
 return {...candidate,evidence,status:count?'review':'no_candidates'};
}
