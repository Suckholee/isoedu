import {isReference} from './manuals.mjs';
import {sourceKey} from './manualRepository.mjs';
import {ArticleError} from '../articles/model.mjs';
export function sourceNotes(draft){
 let notes;try{notes=JSON.parse(draft.source_notes);}catch{}
 if(notes?.version!==1||!Array.isArray(notes.evidence)||!notes.evidence.length||notes.evidence.length>50)throw new ArticleError('개념 상세에서 매뉴얼 근거를 연결한 답변을 준비해 주세요.');
 return notes;
}
export function validatePublicationSources(draft,rows){
 const notes=sourceNotes(draft);
 if(/\[확인 필요\]|\[작성 필요\]/.test(draft.body))throw new ArticleError('답변의 확인 필요 항목을 해결한 뒤 발행해 주세요.');
 for(const e of notes.evidence){
  const row=rows.find(r=>r.id===e.documentId);
  if(!row||!isReference(row)||sourceKey(row)!==e.sourceKey)throw new ArticleError('근거 매뉴얼이 변경됐거나 접근할 수 없습니다. 개념 상세에서 근거를 다시 연결해 주세요.',409);
 }
 if(!notes.evidence.some(e=>e.title&&draft.body.includes(e.title)))throw new ArticleError('독자가 확인할 수 있도록 답변 본문에 근거 매뉴얼 이름과 쪽·구간을 적어 주세요.');
}
