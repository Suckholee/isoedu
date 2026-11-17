import test from 'node:test';
import assert from 'node:assert/strict';
import {retryPlanOperation,retryVisionOperation,abortableDelay} from '../src/lib/businessPlans/retryPlanOperation.mjs';
import {reconcileVisualReferences} from '../src/lib/businessPlans/visualReferences.mjs';
import {validateDocumentEvaluation,COMMON_CRITERIA} from '../src/lib/businessPlans/visionReview.mjs';
const error=(status,message='temporary')=>Object.assign(Error(message),{status});
const row=(version='1')=>({id:'source',updated_at:version,metadata:{sourceVision:{key:'image-v4',pages:[{id:1,hash:'hash'}]},sourceCoach:{}}});
test('lost reply and invalid AI response recover from latest source version without duplicating completed work',async()=>{
 let server=row(),requests=0,charged=0,ready=false;const versions=[];
 const result=await retryVisionOperation({source:row(),body:{action:'source-page-evaluate',pageId:1},wait:async()=>{},api:async body=>{
  if(body.action==='source-render')return {source:server};
  versions.push(body.expectedUpdatedAt);requests++;
  if(requests===1){server=row('2');throw error(502,'원문 위치와 평가 근거를 확인하지 못했습니다.');}
  if(!ready){charged++;ready=true;server=row('3');throw new TypeError('Failed to fetch');}
  return {source:server,evaluation:{saved:true}};
 }});
 assert.equal(result.evaluation.saved,true);assert.deepEqual(versions,['1','2','3']);assert.equal(charged,1);
});
test('pending polls do not consume AI retries; permissions, quota, edits, changed image stop',async()=>{
 let calls=0;assert.equal(await retryPlanOperation(async()=>{if(++calls<4)throw error(409,'다른 AI 작업이 진행 중입니다.');return 'saved';},{wait:async()=>{}}),'saved');
 for(const status of [400,401,403,429]){let n=0;await assert.rejects(retryPlanOperation(async()=>{n++;throw error(status);},{wait:async()=>{}}));assert.equal(n,1);}
 let n=0;await assert.rejects(retryPlanOperation(async()=>{n++;throw error(502);},{wait:async()=>{}}));assert.equal(n,3);
 await assert.rejects(retryVisionOperation({source:row(),body:{action:'source-page-evaluate'},wait:async()=>{},api:async b=>{if(b.action==='source-render'){const changed=row('2');changed.metadata.sourceVision.key='new';return {source:changed};}throw new TypeError('Failed to fetch');}}),/원문 또는 평가기준/);
});
test('stop cancels backoff immediately and does not start another request',async()=>{
 const ac=new AbortController();let n=0;const p=retryPlanOperation(async()=>{n++;throw error(502);},{signal:ac.signal,onRetry:()=>ac.abort()});await assert.rejects(p,e=>e.name==='AbortError');assert.equal(n,1);
 const bc=new AbortController(),delay=abortableDelay(60000,bc.signal);bc.abort();await assert.rejects(delay,e=>e.name==='AbortError');
});
test('actual rejected table references are corrected before storage; valid tables and unrelated facts stay intact',()=>{
 const sections=[{id:'s1',title:'일반현황',content:'기업명: 시험회사\n팀 구성 현황: visualDrafts의 ‘팀 구성 현황’ 표 참조. 현재 팀원 정보는 확인 필요입니다.\n매출은 확인 필요입니다.'},{id:'s2',title:'개발 계획',content:'일정은 visualDrafts의 ‘사업추진 일정’ 표에 검토용 초안으로 구성했습니다. 실제 기간은 [확인 필요]입니다.\n고객 비교 표를 참조하세요.'}];
 const drafts=[{sectionTitle:'일반현황',title:'팀 구성 현황',type:'table'},{sectionTitle:'개발 계획',title:'사업추진 일정',type:'table'},{sectionTitle:'개발 계획',title:'고객 비교',type:'table'}];
 const result=reconcileVisualReferences(sections,drafts,[{sectionId:'s2',title:'고객 비교',type:'table'}]);
 assert.match(result.sections[0].content,/작성 필요: 팀 구성 현황/);assert.match(result.sections[0].content,/현재 팀원 정보는 확인 필요입니다/);assert.match(result.sections[0].content,/매출은 확인 필요입니다/);assert.match(result.sections[1].content,/작성 필요: 사업추진 일정/);assert.match(result.sections[1].content,/고객 비교 표를 참조하세요/);assert.ok(result.sections.every(s=>!s.content.includes('visualDrafts')));
 assert.equal(sections[0].content.includes('visualDrafts'),true);
 const untouched='원문 표의 92%는 검증 필요입니다.\n다른 문장.';assert.equal(reconcileVisualReferences([{id:'s',title:'t',content:untouched}],[],[]).sections[0].content,untouched);
});
test('visual recommendations require real page locations, permitted types and required data; legacy results still readable',()=>{
 const base={summary:'종합',scores:COMMON_CRITERIA.map(c=>({criterionId:c.id,score:10,reason:'근거',pages:[1]})),priorities:[]};
 assert.equal(validateDocumentEvaluation(base,COMMON_CRITERIA,6),base);
 const value={...base,visualRecommendations:[{kind:'chart',title:'교육 시간 비교',purpose:'검증 가능한 효과 전달',outline:'가로축 단계, 세로축 시간',requiredData:'동일 기준 측정값 확보 후 작성',pages:[2]}]};
 assert.equal(validateDocumentEvaluation(value,COMMON_CRITERIA,6),value);
 assert.throws(()=>validateDocumentEvaluation({...value,visualRecommendations:[{...value.visualRecommendations[0],pages:[7]}]},COMMON_CRITERIA,6));
});
