import {validTaskDate,taskToday} from '../workTaskDates.mjs';
const DATE=String.raw`(20\d{2})\s*(?:년|[.\-/])\s*(\d{1,2})\s*(?:월|[.\-/])\s*(\d{1,2})\s*일?`;
function dates(text){return [...text.matchAll(new RegExp(DATE,'g'))].map(m=>{const value=`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;return {value,index:m.index,end:m.index+m[0].length};}).filter(d=>validTaskDate(d.value));}
// Deterministic candidates only: document contents are data, never instructions.
export function dateCandidates(units,{today=taskToday(),warnings=[]}={}){
 const found={issuedOn:[],validUntil:[],coveredYears:[]};
 for(const u of units){
  const lines=String(u.text||'').normalize('NFKC').split(/\n/).map(x=>x.replace(/[ \t]+/g,' ').trim()).filter(Boolean);
  for(let i=0;i<lines.length;i++){
   const line=lines[i],next=lines[i+1]||'',context=line+(dates(line).length?'':' '+next),ds=dates(context);
   const evidence={location:u.location||'본문',excerpt:context.slice(0,260),method:u.method||'text'};
   if(/발\s*급\s*(?:일|년월일)|발\s*행\s*(?:일|년월일)|교\s*부\s*일|date\s*(?:of\s*)?issu(?:e|ed)|issued\s*on|(?:위와\s*같이|이를)\s*증명합니다|발급합니다/i.test(line)){
    // Multiple dates on an issue line are intentionally ambiguous.
    for(const d of ds)if((dates(line).length||!/유\s*효|만\s*료|valid\s*until|expir/i.test(next))&&d.value<=today)found.issuedOn.push({value:d.value,...evidence});
   }
   if(/유\s*효\s*(?:기\s*간|기\s*한)|만\s*료\s*일|valid\s*(?:until|through)|expir(?:y|ation)\s*date/i.test(line)){
    const range=/[~～〜]|부터|\bto\b/i.test(context);const candidates=range&&ds.length===2?[ds[1]]:ds;
    for(const d of candidates)found.validUntil.push({value:d.value,...evidence});
   }
   if(/(?:사업|과세|귀속|회계|자료)\s*(?:연도|년도|기간)|재무제표|손익계산서|대차대조표|재무상태표|고용.*(?:연도|년도)|fiscal\s*year|tax\s*year/i.test(line)){
    const yearContext=/20\d{2}/.test(line)?line:context;
    const yrs=[...yearContext.matchAll(/\b(20\d{2})\b/g)].map(m=>Number(m[1])).filter(y=>y<=Number(today.slice(0,4)));
    const range=yearContext.match(/(20\d{2})\s*년?\s*[~～〜-]\s*(20\d{2})\s*년?/);
    if(range&&Number(range[2])>=Number(range[1])&&Number(range[2])-Number(range[1])<=10)for(let y=+range[1];y<=+range[2];y++)if(y<=+today.slice(0,4))yrs.push(y);
    for(const value of new Set(yrs))found.coveredYears.push({value,...evidence});
   }
  }
 }
 const unique=items=>[...new Set(items.map(x=>x.value))];
 const issue=unique(found.issuedOn),expiry=unique(found.validUntil),years=unique(found.coveredYears).sort();
 const conflicts=[];if(issue.length>1)conflicts.push('발급일 후보가 여러 개입니다.');if(expiry.length>1)conflicts.push('유효기간 후보가 여러 개입니다.');
 if(issue.length===1&&expiry.length===1&&expiry[0]<issue[0])conflicts.push('유효기간이 발급일보다 앞섭니다.');
 return {version:1,issuedOn:issue.length===1?issue[0]:'',validUntil:expiry.length===1?expiry[0]:'',coveredYears:years,evidence:found,conflicts,warnings,requiresConfirmation:true};
}
