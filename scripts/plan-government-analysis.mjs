import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../data/government-programs/',import.meta.url);
const read=async(name,fallback)=>JSON.parse(await readFile(new URL(name,root),'utf8').catch(()=>JSON.stringify(fallback)));
const records=await read('records.json',[]), previous=await read('analysis-queue.json',[]);
const now=new Date().toISOString();
const queue=[];
for(const record of records){
 const old=previous.find(x=>x.programId===record.id);
 const html=await readFile(new URL(`evidence/${record.id}/detail.html`,root),'utf8').catch(()=>'');
 const normalized=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
 const fingerprint=createHash('sha256').update(JSON.stringify([record.title,record.applicationStartDate,record.applicationEndDate,normalized,record.detailReview?.attachmentUrls||[]])).digest('hex');
 const analysis=await read(`analyses/${record.id}.json`,null);
 const complete=analysis?.reviewStatus==='complete'&&analysis.sourceFingerprint===fingerprint;
 const changed=!!old&&old.sourceFingerprint!==fingerprint;
 queue.push({programId:record.id,title:record.title,sourceUrl:record.sourceUrl,deadline:record.applicationEndDate||null,sourceFingerprint:fingerprint,status:complete?'complete':changed?'changed':analysis?'partial':'pending',reason:complete?'검증된 동일 원문':changed?'원문 변경 재분석':analysis?'미확인 항목 후속 검토':'첨부 분석 대기',firstSeenAt:old?.firstSeenAt||now,lastPlannedAt:now,attempts:old?.attempts||0,nextRetryAt:changed?null:old?.nextRetryAt||null,lastError:old?.lastError||null,analysisFile:`analyses/${record.id}.json`});
}
queue.sort((a,b)=>{
 const priority=x=>x.status==='complete'?3:x.deadline&&x.deadline>=now.slice(0,10)?0:!x.deadline?1:2;
 return priority(a)-priority(b)||(a.deadline||'9999').localeCompare(b.deadline||'9999')||a.programId.localeCompare(b.programId);
});
await writeFile(new URL('analysis-queue.json',root),JSON.stringify(queue,null,2)+'\n');
const available=queue.filter(x=>x.status!=='complete'&&(!x.nextRetryAt||x.nextRetryAt<=now));
console.log(JSON.stringify({total:queue.length,remaining:queue.filter(x=>x.status!=='complete').length,next:available.slice(0,5)},null,2));
