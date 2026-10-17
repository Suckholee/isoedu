import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';
import { parseKStartup, parseMss } from '../src/lib/governmentAnnouncementParser.mjs';
const root=new URL('../data/government-programs/',import.meta.url);await mkdir(root,{recursive:true});
const now=new Date().toISOString();let records=JSON.parse(await readFile(new URL('records.json',root),'utf8').catch(()=>'[]'));
for(const [source,url,parse] of [['k-startup','https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do',parseKStartup],['mss','https://www.mss.go.kr/site/smba/ex/bbs/List.do?cbIdx=310',parseMss]]) {
 try {
 const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);
 const html=await r.text();const items=parse(html,now);if(!items.length)throw new Error('No announcement rows parsed');
 await mkdir(new URL('evidence/',root),{recursive:true});await writeFile(new URL(`evidence/${source}-latest.html`,root),html);
 for(const item of items){const old=records.find(p=>p.id===item.id);if(!old||JSON.stringify({...old,verifiedAt:null})!==JSON.stringify({...item,verifiedAt:null}))await appendFile(new URL('history.jsonl',root),JSON.stringify({at:now,id:item.id,before:old||null,after:item})+'\n');records=records.filter(p=>p.id!==item.id);records.push({...old,...item});}
 await appendFile(new URL('runs.jsonl',root),JSON.stringify({at:now,source,status:'partial-success',coverage:'public listing page 1 only; details and remaining pages not collected',count:items.length,url})+'\n');console.log(source,items.length,'records (page 1 only)');
 }catch(e){await appendFile(new URL('runs.jsonl',root),JSON.stringify({at:now,source,status:'failed',error:e.message})+'\n');console.error(source,e.message);process.exitCode=1;}
}
await writeFile(new URL('records.json',root),JSON.stringify(records,null,2)+'\n');
