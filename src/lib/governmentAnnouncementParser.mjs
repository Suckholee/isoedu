const clean = s => (s || '').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
export function parseKStartup(html, checkedAt) {
 return [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].flatMap(([,block])=>{
  const id=block.match(/javascript:go_view\((\d+)\)/)?.[1];const title=clean(block.match(/<p class="tit">([\s\S]*?)<\/p>/)?.[1]);
  if(!id||!title)return [];
  const text=clean(block);const start=text.match(/시작일자 (\d{4}-\d{2}-\d{2})/)?.[1]||null;const end=text.match(/마감일자 (\d{4}-\d{2}-\d{2})/)?.[1]||null;
  const lines=[...block.matchAll(/<span class="list">([\s\S]*?)<\/span>/g)].map(m=>clean(m[1]));
  const type=clean(block.match(/<span class="flag agency">([\s\S]*?)<\/span>/)?.[1]);
  return [{id:`kstartup-${id}`,sourceId:id,title,agency:lines[1]||'K-Startup',category:type==='지자체'?'LOCAL':type==='민간'?'PRIVATE':'CENTRAL',applicationStartDate:start,applicationEndDate:end,sourceUrl:`https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${id}`,sourceName:'K-Startup',verifiedAt:checkedAt,verificationLevel:'공식 목록 확인',targetIndustry:'상세 공고에서 확인',budgetLimit:'상세 공고에서 확인',description:'K-Startup 공식 모집 공고. 지원 대상·제외 조건·제출 양식은 원문에서 확인하세요.',requiredDocsTemplate:'UNVERIFIED',tags:[type],attachments:[]}];
 });
}
export function parseMss(html, checkedAt) {
 return [...html.matchAll(/<tr\b[^>]*onclick="doBbsFView\('310','(\d+)'[^>]*>([\s\S]*?)<\/tr>/g)].flatMap(([,id,block])=>{
 const title=clean(block.match(/<a class="pc-detail"[^>]*>([\s\S]*?)<\/a>/)?.[1]);if(!title)return [];
 const text=clean(block);const period=text.match(/신청기간\s*(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/);
 return [{id:`mss-${id}`,sourceId:id,title,agency:'중소벤처기업부',category:'CENTRAL',applicationStartDate:period?.[1]||null,applicationEndDate:period?.[2]||null,sourceUrl:`https://www.mss.go.kr/site/smba/ex/bbs/View.do?cbIdx=310&bcIdx=${id}&parentSeq=${id}`,sourceName:'중소벤처기업부',verifiedAt:checkedAt,verificationLevel:'공식 목록 확인',targetIndustry:'상세 공고에서 확인',budgetLimit:'상세 공고에서 확인',description:'중소벤처기업부 공식 사업공고. 신청자격과 제출서류는 첨부 원문 확인이 필요합니다.',requiredDocsTemplate:'UNVERIFIED',tags:[],attachments:[...new Set([...block.matchAll(/data-href="([^"]+)"/g)].map(m=>'https://www.mss.go.kr'+m[1].replace(/&amp;/g,'&')))]}];
 });
}
