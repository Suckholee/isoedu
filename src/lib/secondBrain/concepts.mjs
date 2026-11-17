// Shared, deterministic extraction: every concept and edge has visible source evidence.
const GROUPS = [
 ['기업부설연구소','기업 부설 연구소'],['연구개발전담부서','연구개발 전담부서'],['지식재산권','산업재산권'],['기술성','기술 경쟁력'],['시장성','시장 경쟁력'],['성장성','성장 가능성'],['정책자금'],['고용유지'],['고용창출'],['유연근무'],['창업지원사업','창업 지원사업'],['자금조달','자금 조달'],['현장평가','현장 평가'],['벤처확인','벤처 확인'],['특허'],['수익성'],['사업타당성','사업 타당성'],['위험성 평가','위험성평가'],

 ['지식','knowledge'],['위키','wiki'],['다이어리','diary'],['회의록','meeting notes'],['보고서','report'],['보관함','archive'],['권한','permissions'],['원문 링크','source link'],
 ['세컨브레인','second brain','secondbrain','세컨드 브레인','세컨드브레인','세컨 브레인'],
 ['지식 관리','knowledge management','지식관리'],['사업계획서','business plan','사업 계획서'],
 ['인공지능','artificial intelligence','AI'],['자동화','automation'],['프로젝트','project'],
 ['문서 작성','document creation','문서작성'],['지식 그래프','knowledge graph','지식그래프'],
 ['메모','notes','note taking'],['연결','connections','connection'],['검색','search'],
 ['요약','summarization','summary'],['태그','tags','tagging'],['분류','organization','categorization'],
 ['개인정보','privacy'],['데이터','data'],['인증','certification'],['벤처기업','벤처 기업'],
 ['혁신성장','혁신 성장'],['사업화','commercialization'],['투자','investment'],
 ['연구개발','research and development','R&D'],['시장 분석','market analysis','시장분석'],
 ['고객','customer'],['매출','revenue'],['수익 모델','business model','수익모델'],
 ['협업','collaboration'],['일정','schedule'],['워크플로','workflow'],['생산성','productivity'],
 ['근거','evidence'],['원문','source material'],['프로세스','process'],['품질 관리','quality management'],
];
const STOP = new Set(('참고 한글 워드 작성요령 요령 개편안내 작성법 추가 작성시 v1 pdf hwp hwpx doc docx ppt pptx xls xlsx png jpg jpeg 작성예시 예시 서식 별첨 붙임 신청서 첨부 양식 확인대기 최종 복사 년도 그거 어디 적어놨더라 보기 실제 필요한 사용 결과 대상 그대로 다시 서로 먼저 이후 지금 처음 직접 페이지 화면 버튼 선택 새로 다음 또는 모두 가장 더라 알려 않으면 해야 위한 위한 this that with from have your you our their they them into also more about which when will what how not are for and the can has its one all was use using used http https www com html image images button menu login sign home read click learn get now start new time next page cookies cookie privacy policy terms copyright content true false null undefined div class script style href 있습니다 합니다 위한 있는 없는 통해 대한 또는 및 것은 수 있도록 위해 대한 함께 모든 관련 경우 필요 내용 확인 자료 작성 기록 정보 제공 활용 지원 방법 서비스 기능 관리 기준 양식 파일 회사 사용자 사업 입니다 됩니다 있으며 하는 하고 할 있습니다 하는지 때문 것으로 같은 등을 등의 이를 그런 저희 여기 바로 오늘'.split(' ')));
export const conceptKey = value => String(value).normalize('NFKC').toLocaleLowerCase().replace(/[\s_\-]+/g,'').replace(/[^\p{L}\p{N}]/gu,'');
const matchIndex = (text, term) => /[a-z]/i.test(term) ? text.search(new RegExp(`(?<![a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?![a-z0-9])`,'i')) : text.indexOf(term);
const has = (text, term) => matchIndex(text, term) >= 0;
const sentencesOf = text => String(text).split(/\n+|(?<=[.!?。])\s+/).map(s=>s.trim()).filter(Boolean);
const aliasesFor = label => GROUPS.find(group=>group.some(alias=>conceptKey(alias)===conceptKey(label))) || [label];
// Keep the matched words inside a contiguous quotation, including late matches in long sentences.
function evidenceWindow(sentence, groups, limit) {
 const matches=groups.map(aliases=>aliases.map(term=>({index:matchIndex(sentence,term),length:term.length})).filter(m=>m.index>=0).sort((a,b)=>a.index-b.index)[0]);
 if(matches.some(m=>!m))return '';
 const first=Math.min(...matches.map(m=>m.index)),last=Math.max(...matches.map(m=>m.index+m.length));
 if(last-first>limit)return '';
 const start=Math.max(0,first-Math.floor((limit-(last-first))/2));
 return sentence.slice(start,start+limit).trim();
}
export function conceptRelations(text, concepts) {
 const sentences=sentencesOf(String(text).slice(0,60000)),relations=[];
 for(let i=0;i<concepts.length;i++)for(let j=i+1;j<concepts.length;j++){
  const a=concepts[i],b=concepts[j],groups=[aliasesFor(a.label),aliasesFor(b.label)];
  const evidence=sentences.map(s=>evidenceWindow(s,groups,280)).find(Boolean);
  if(evidence&&relations.length<24)relations.push({source:a.key,target:b.key,label:'같은 문맥',evidence});
 }
 return relations;
}
export function extractConcepts(text, title = '', limit = 14) {
 const source = String(text).slice(0,60000), sentences=sentencesOf(source), candidates = new Map();
 const offer=(label, aliases=[label], boost=0)=>{
  const evidence=sentences.find(s=>aliases.some(a=>has(s,a)));
  if(!evidence)return;
  const key=conceptKey(label);if(!key||/^(서식|붙임|별첨|첨부|차시|양식|part|v)[\d-]+$/i.test(label)||STOP.has(label.toLowerCase())||label.length<2||label.length>32)return;
  const count=source.split(/\n+/).filter(s=>aliases.some(a=>has(s,a))).length;
  const score=count+boost+(aliases.some(a=>has(title,a))?5:0);
  if(!candidates.has(key)||candidates.get(key).score<score)candidates.set(key,{key,label,evidence:evidenceWindow(evidence, [aliases], 240),score});
 };
 for(const group of GROUPS)offer(group[0],group,2);
 const tokens=source.match(/[\p{L}][\p{L}\p{N}-]{1,31}/gu)||[];
 const counts=new Map();for(let token of tokens){token=has(title,token)?token:token.replace(/(에서는|으로부터|으로|에서|에게|이라는|이란|들을|들은|하는|하고|하며|하기|합니다|습니다|입니다|은|는|을|를|의|이|가|와|과|도|에)$/,'');const key=conceptKey(token);if(!STOP.has(token.toLowerCase())&&token.length>=2)counts.set(key,{label:token,count:(counts.get(key)?.count||0)+1});}
 for(const {label,count} of counts.values())if(count>=2||has(title,label))offer(label,[label],Math.min(count,8)*.3);
 // Known aliases collapse into one canonical concept rather than duplicate English/Korean hubs.
 const aliases=new Set(GROUPS.flatMap(g=>g.slice(1).map(conceptKey)));
 return [...candidates.values()].filter(c=>!aliases.has(c.key)||GROUPS.some(g=>conceptKey(g[0])===c.key)).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key)).slice(0,limit).map(({score,...c})=>c);
}
export function analyzeText(text, title='') {
 const source=String(text).slice(0,60000).replace(/\r/g,'');
 const concepts=extractConcepts(source,title);
 const sentences=[...new Set(source.split(/\n+|(?<=[.!?。])\s+/).map(s=>s.trim()).filter(s=>s.length>=35&&s.length<=1000))];
 const scored=sentences.map((s,index)=>({s,index,score:concepts.filter(c=>aliasesFor(c.label).some(alias=>has(s,alias))).length+Math.min(s.length,180)/180}));
 const summary=scored.sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,4).sort((a,b)=>a.index-b.index).map(x=>x.s.slice(0,280));
 const relations=conceptRelations(source,concepts);
 return {version:1,method:'extractive-v1',summary,concepts,relations};
}
export function recordConcepts(record){
 return record.analysis?.concepts || extractConcepts(`${record.title}\n${record.body}`,record.title,10);
}
export function recordRelations(record, concepts=recordConcepts(record)) {
 return record.analysis?.relations || conceptRelations(`${record.title}\n${record.body}`,concepts);
}
