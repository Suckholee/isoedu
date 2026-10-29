import {validDate,programPeriod} from './programCalendar.mjs';
export function safePublicUrl(value){if(typeof value!=='string'||value.length>4096)return null;try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:null;}catch{return null;}}
export function programSnapshot(record,action='bookmark'){
 if(!record||!/^[-a-z0-9]{1,100}$/i.test(record.id||'')||typeof record.title!=='string'||!record.title.trim())throw Error('공고 정보를 다시 확인해 주세요.');
 return {id:record.id,title:record.title.trim().slice(0,300),sourceUrl:safePublicUrl(record.sourceUrl)||'',applicationEndDate:validDate(record.applicationEndDate),deadlineTime:typeof record.deadlineTime==='string'?record.deadlineTime.slice(0,30):'',verifiedAt:typeof record.verifiedAt==='string'?record.verifiedAt.slice(0,40):'',action:action==='prepare'?'prepare':'bookmark',requiredDocuments:(Array.isArray(record.requiredDocuments)?record.requiredDocuments:record.analysis?.requiredDocuments||[]).slice(0,20).map(d=>String(typeof d==='string'?d:d?.name||'').slice(0,180)).filter(Boolean)};
}
export function periodLabel(record,today){const {start,end}=programPeriod(record);if(!start&&!end)return '일정 미확인';if(end&&end<today)return '기간 종료';if(start&&start>today)return '모집 예정';if(start&&end)return '기간상 모집 중';return end?'마감일 확인':'마감일 미확인';}
export function monthKey(value,fallback){return /^\d{4}-(0[1-9]|1[0-2])$/.test(value||'')&&Number(value.slice(0,4))>=2000&&Number(value.slice(0,4))<=2100?value:fallback;}
export function filterPrograms(programs,query='',category='ALL'){const q=query.trim().toLowerCase();return programs.filter(p=>(category==='ALL'||p.category===category)&&`${p.title} ${p.agency||p.ministry||''} ${p.region||''} ${(p.tags||[]).join(' ')}`.toLowerCase().includes(q));}
