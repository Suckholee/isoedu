const kindName={table:'표',bar:'그래프',line:'그래프',diagram:'도표',image:'이미지'};
const normalized=s=>s.normalize('NFKC').replace(/[\s‘’“”'"「」『』<>〈〉·]/g,'');
// Run before persistence: proposed/rejected visuals are not completed artifacts.
export function reconcileVisualReferences(sections,drafts,visuals){
 const ready=new Set(visuals.map(v=>`${v.sectionId}:${v.title}`));
 const corrections=[];
 const result=sections.map(section=>{
  const candidates=drafts.filter(d=>d.sectionTitle===section.title);
  const missing=candidates.filter(d=>!ready.has(`${section.id}:${d.title}`));
  const content=section.content.split(/(\n|(?<=[.!?。])\s+)/).map(part=>{
   const refers=/참조|참고|구성했|작성했|삽입했|제시했|아래.*표|다음.*표|visualDrafts/.test(part);
   const matched=missing.filter(d=>normalized(part).includes(normalized(d.title)));
   // Generic "아래 표" is unsafe if this section has no saved table at all.
   if(refers&&!matched.length&&/아래\s*표|다음\s*표|해당\s*표/.test(part)&&!visuals.some(v=>v.sectionId===section.id&&v.type==='table'))matched.push(...missing.filter(d=>d.type==='table'));
   if(refers&&!matched.length&&!/원문|인용/.test(part)){
    const quoted=[...part.matchAll(/[‘“「『]([^’”」』]+)[’”」』]\s*(?:표|그래프|도표|이미지)/g)];
    for(const match of quoted)if(!visuals.some(v=>normalized(v.title)===normalized(match[1])))matched.push({title:match[1],type:'table'});
    if(!matched.length&&/아래\s*표|다음\s*표|해당\s*표/.test(part)&&!visuals.some(v=>v.sectionId===section.id&&v.type==='table'))matched.push({title:'이 문항의 표',type:'table'});
   }
   if(refers&&matched.length){
    corrections.push(...matched.map(d=>`${d.title}: 생성되지 않은 ${kindName[d.type]||'시각 자료'} 참조를 작성 필요 안내로 바꿨습니다.`));
    return [...new Set(matched.map(d=>`[작성 필요: ${d.title} — 근거자료를 확인한 후 ${kindName[d.type]||'시각 자료'}를 추가하세요.]`))].join(' ');
   }
   return part.replace(/visualDrafts(?:의|에|에서)?\s*/g,'');
  }).join('');
  return {...section,content};
 });
 return {sections:result,corrections:[...new Set(corrections)]};
}
