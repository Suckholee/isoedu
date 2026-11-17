export const KNOWLEDGE_CATEGORY='지식 답변';
const particle=(word,closed,open)=>{const n=word.charCodeAt(word.length-1)-0xac00;return n>=0&&n<=11171?(n%28?closed:open):closed;};
export function conceptQuestions(concept,graph){
 if(!concept?.documentIds?.length)return [];
 const neighbor=graph.edges.find(e=>e.type==='같은 문맥'&&(e.source===concept.id||e.target===concept.id));
 const other=neighbor&&graph.nodes.find(n=>n.id===(neighbor.source===concept.id?neighbor.target:neighbor.source));
 return [
  {intent:'definition',question:`${concept.label}${particle(concept.label,'이란','란')} 무엇인가요?`},
  {intent:'preparation',question:`${concept.label}${particle(concept.label,'을','를')} 준비할 때 무엇을 확인해야 하나요?`},
  ...(other?[{intent:'relationship',question:`${concept.label}${particle(concept.label,'과','와')} ${other.label}${particle(other.label,'은','는')} 어떤 관계인가요?`}]:[])
 ].map(q=>({...q,id:`${concept.id}:${q.intent}`,conceptIds:[concept.id,...(q.intent==='relationship'?[other.id]:[])],documentIds:concept.documentIds}));
}
export function questionDraft(question,graph,documents){
 const concepts=graph.nodes.filter(n=>question.conceptIds.includes(n.id));
 let evidence=concepts.flatMap(n=>(n.evidence||[]).map(e=>{
  const d=documents.find(d=>d.id===e.documentId);
  return {concept:n.label,documentId:e.documentId,title:d?.title,sourceKey:d?.sourceKey,readAt:d?.analysis?.readAt,location:e.location,text:e.text};
 }));
 if(!evidence.length)throw Error('답변의 근거가 되는 매뉴얼 본문을 먼저 읽어 주세요.');
 const notes=()=>JSON.stringify({version:1,questionId:question.id,intent:question.intent,conceptIds:question.conceptIds,evidence},null,2);
 while(notes().length>20000&&evidence.length>1)evidence.pop();
 return {title:question.question,body:'',category:KNOWLEDGE_CATEGORY,ai_generated:false,
  topic:`질문: ${question.question}\n첫 문단에서 직접 답하고, 근거가 있는 범위만 설명한다. 매뉴얼 이름과 쪽·구간, 적용 범위와 확인일을 본문에 명시한다. 근거가 부족하면 단정하지 않는다.`,
  source_notes:notes()};
}
