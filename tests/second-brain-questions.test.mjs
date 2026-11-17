import {test} from 'node:test';
import assert from 'node:assert/strict';
import {conceptQuestions,questionDraft} from '../src/lib/secondBrain/questions.mjs';
import {validatePublicationSources} from '../src/lib/secondBrain/publication.mjs';
import {sourceKey} from '../src/lib/secondBrain/manualRepository.mjs';
import {articleSchema,jsonLd} from '../src/lib/articles/seo.mjs';
const row={id:'a',title:'사업계획서 작성요령',content_draft:'시장 분석과 고객을 확인합니다.',metadata:{sourceImport:{category:'reference'},originalPath:'private/manual.pdf'}};
const concept={id:'concept:시장',label:'시장',documentIds:['a'],evidence:[{documentId:'a',location:'3쪽',text:row.content_draft}]};
const graph={nodes:[concept,{id:'concept:고객',label:'고객'}],edges:[{source:concept.id,target:'concept:고객',type:'같은 문맥'}]};
test('questions retain concept and page provenance without inventing an answer or exposing storage paths',()=>{
 const qs=conceptQuestions(concept,graph);assert.equal(qs.length,3);assert(qs[2].question.includes('고객'));
 const draft=questionDraft(qs[0],graph,[{...row,sourceKey:sourceKey(row)}]);assert.equal(draft.body,'');
 const notes=JSON.parse(draft.source_notes);assert.equal(notes.evidence[0].location,'3쪽');assert.equal(notes.evidence[0].sourceKey,sourceKey(row));assert(!draft.source_notes.includes('private/manual.pdf'));assert.deepEqual(conceptQuestions({documentIds:[]},graph),[]);
});
test('public answers require current reference evidence and a visible source, excluding unresolved claims',()=>{
 const draft=questionDraft(conceptQuestions(concept,graph)[0],graph,[{...row,sourceKey:sourceKey(row)}]);draft.body='시장과 고객을 구체적으로 확인합니다. 출처: 사업계획서 작성요령 3쪽';
 assert.doesNotThrow(()=>validatePublicationSources(draft,[row]));
 assert.throws(()=>validatePublicationSources(draft,[{...row,content_draft:'changed'}]));
 assert.throws(()=>validatePublicationSources(draft,[]));
 assert.throws(()=>validatePublicationSources({...draft,body:'출처 없는 답변'},[row]));
 assert.throws(()=>validatePublicationSources({...draft,body:draft.body+' [확인 필요]'},[row]));
});
test('FAQ structured data exactly matches visible published content and never includes private editorial notes',()=>{
 const post={id:'x',title:'시장 분석은 무엇인가요?',body:'실제 공개 답변 </script><script>alert(1)</script>',category:'지식 답변',source_notes:'private evidence',published_at:'2026-11-15',updated_at:'2026-11-15'};
 const schemas=articleSchema(post);assert.equal(schemas[1].mainEntity[0].acceptedAnswer.text,post.body);assert.equal(schemas[1].mainEntity[0].name,post.title);const encoded=jsonLd(schemas);assert(!encoded.includes('</script>'));assert(!encoded.includes('private evidence'));assert.equal(articleSchema({...post,category:'기타'}).length,1);
});
