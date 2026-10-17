import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {referenceStandard} from './referenceStandards.mjs';
const base=path.join(process.cwd(),'data/business-plan-corpus');
export function localReferenceAccess(request){
 const host=new URL(request.url).hostname;
 const site=request.headers.get('sec-fetch-site');
 return process.env.NODE_ENV==='development'&&['localhost','127.0.0.1','[::1]'].includes(host)&&!['cross-site','same-site'].includes(site)&&!request.headers.get('origin')?.match(/^https?:\/\/(?!localhost(?::|\/)|127\.0\.0\.1(?::|\/)|\[::1\](?::|\/))/);
}
export async function referenceEntries(){
 const index=JSON.parse(await readFile(path.join(base,'index.json'),'utf8'));
 return index.map(d=>({id:d.id,title:path.basename(d.source).normalize('NFC').split('__').slice(1).join('__'),customer:d.label,format:d.method.slice(1).toUpperCase(),sha256:d.sha256,characters:d.characters,source:d.source}));
}
export async function referenceEntry(id){
 if(!/^case-\d{3}$/.test(id))return null;
 return (await referenceEntries()).find(d=>d.id===id)||null;
}
export async function referenceContent(entry){
 const corpus=JSON.parse(await readFile(path.join(base,entry.id+'.json'),'utf8'));
 const text=corpus.units.map(u=>`[${u.location}]\n${u.text}`).join('\n\n');
 return {units:corpus.units.map(u=>({location:u.location,text:u.text,ocr:Boolean(u.ocrStatus)})),standard:referenceStandard(entry.title,text,entry.customer)};
}
