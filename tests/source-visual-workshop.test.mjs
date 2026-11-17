import test from 'node:test';
import assert from 'node:assert/strict';
import {handleSourceVisualAction} from '../src/lib/businessPlans/sourceVisualActions.mjs';
import {documentEvaluationState,visualKey,pageEvaluationKey} from '../src/lib/businessPlans/visionActions.mjs';
import {visualCardKey,sourceVisualSignature,visualDraftFingerprint,validateVisualAnswer} from '../src/lib/businessPlans/sourceVisuals.mjs';
import {hasCurrentSourceReview,sourceReviewKey} from '../src/lib/businessPlans/sourceReview.mjs';
import {reviewedVisualAssets,transferSourceVisuals,validatePlacements} from '../src/lib/businessPlans/sourceVisualTransfer.mjs';
const id='10000000-0000-4000-8000-000000000001',company='20000000-0000-4000-8000-000000000001',req=n=>`30000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function fixture(){
 let row={id,company_id:company,updated_at:'1',content_draft:'확인한 계획',metadata:{sourceUpload:{fingerprint:'abc',state:'ready'},sourceVision:{prepared:true,total:1,pages:[{id:1,hash:'image',path:'page'}]},sourceCoach:{}}};row.metadata.sourceVision.key=visualKey(row);row.metadata.sourceCoach.evaluations=[{key:pageEvaluationKey(row,row.metadata.sourceVision.pages[0]),path:'evaluation'}];const key=documentEvaluationState(row).key;row.metadata.sourceCoach.documents=[{key,path:'report'}];
 const project={id:'project',company_id:company},user={id:'actor'};let editable=true,uploads=0;
 const db={
  rpc:async()=>({data:editable}),
  from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:structuredClone(row)})}),
  storage:{from:()=>({
   info:async()=>({data:{contentType:'image/jpeg',size:5}}),
   upload:async()=>{uploads++;return {};},
   download:async()=>({data:new Blob(['jpeg'],{type:'image/jpeg'})})
  })}
 };
 const persist=async(_,old,metadata)=>{assert.equal(old.updated_at,row.updated_at);row={...row,metadata,updated_at:String(Number(row.updated_at)+1)};return structuredClone(row);};
 const download=async()=>Buffer.from(JSON.stringify({summary:'수치는 아직 미확인',visualRecommendations:[{kind:'chart',title:'개선 효과',outline:'비교',requiredData:'수치',pages:[1]}]}));
 return {get row(){return structuredClone(row);},key,cardKey:visualCardKey(key,0),db,project,user,persist,download,setEditable:v=>editable=v,get uploads(){return uploads;},call:async(body,guide,image)=>handleSourceVisualAction({body:{sourceId:id,reportKey:key,index:0,...body},db,row:structuredClone(row),user,project,persist,download,guide,image})};
}
const table={id:'table',sectionId:'source-review',type:'table',title:'확인 자료',caption:'수집 계획',source:'사용자 답변',basis:'plan',columns:['항목','내용'],rows:[['고객','확인 필요']]};
test('missing evidence questions persist; reply loss reuses result; edits and inclusion survive review snapshot',async()=>{
 const f=fixture();let calls=0;const guide=async()=>{calls++;return {reply:'수치와 단위가 필요합니다.',questions:['기간별 수치를 알려주세요.'],visual:null};};
 const b={action:'source-visual-chat',requestId:req(1),expectedVersion:0,type:'bar',message:'만들어 주세요'};
 const r=await f.call(b,guide);assert.equal(r.card.turns.length,1);assert.equal(r.card.visual,null);assert.equal(r.card.drafts.actor,'');
 await f.call(b,guide);assert.equal(calls,1);
 await assert.rejects(f.call({...b,message:'다른 요청'},guide),/이전 생성 요청/);
 const saved=await f.call({action:'source-visual-save',requestId:req(2),expectedVersion:r.card.version,message:'초안 요청',visual:table,included:true});
 assert.deepEqual(saved.card.visual,table);assert.equal(saved.card.included,true);
 const reviewed=f.row;reviewed.metadata.sourceReview={reviewedContent:reviewed.content_draft,analysisKey:sourceReviewKey(reviewed),visualSignature:sourceVisualSignature(reviewed),visuals:[table]};assert.equal(hasCurrentSourceReview(reviewed),true);
 reviewed.metadata.sourceVisuals[f.cardKey].visual.title='수정';assert.equal(hasCurrentSourceReview(reviewed),false);
 await assert.rejects(f.call({action:'source-visual-save',requestId:req(3),expectedVersion:0,message:'낡은 초안'}),/다른 창/);
});
test('graph numbers need exact evidence; missing evidence cannot be marked ready',()=>{
 const f=fixture(),base={reply:'완료',questions:[],ready:true,visual:{...table,unit:'시간',points:[{label:'현재',value:24,evidence:'현재 24시간'}]}};
 assert.equal(validateVisualAnswer(base,{row:f.row,id:'graph',type:'bar',evidence:'현재 24시간'}).visual.points[0].value,24);
 assert.throws(()=>validateVisualAnswer(base,{row:f.row,id:'graph',type:'bar',evidence:'현재 미확인'}),/근거/);
 assert.throws(()=>validateVisualAnswer({...base,questions:['출처?']},{row:f.row,id:'graph',type:'bar',evidence:'현재 24시간'}),/질문/);
});
test('AI failure preserves prior visual and answer; retry can complete same operation; revoked access cannot save image',async()=>{
 const f=fixture();let r=await f.call({action:'source-visual-save',requestId:req(1),expectedVersion:0,visual:table});
 const body={action:'source-visual-chat',requestId:req(2),expectedVersion:r.card.version,type:'table',message:'표 수정'};
 await assert.rejects(f.call(body,async()=>{throw Error('temporary');}),/temporary/);assert.deepEqual(f.row.metadata.sourceVisuals[f.cardKey].visual,table);assert.equal(f.row.metadata.sourceVisuals[f.cardKey].drafts.actor,'표 수정');
 r=await f.call({...body,expectedVersion:f.row.metadata.sourceVisuals[f.cardKey].version},async()=>({reply:'수정',questions:[],visual:{...table,title:'새 제목'}}));assert.equal(r.card.history.length,1);
 f.setEditable(false);await assert.rejects(f.call({action:'source-visual-chat',requestId:req(3),expectedVersion:r.card.version,type:'image',message:'개념 삽화'},async()=>({reply:'삽화',questions:[],visual:{...table,type:'image'},imagePrompt:'개념'}),async()=>({bytes:Buffer.from('jpeg'),model:'image'})),/권한/);assert.equal(f.uploads,0);
});
test('review signature ignores JSONB object key order; transfer preserves exact assets and verifies all placements',async()=>{
 const f=fixture();await f.call({action:'source-visual-save',requestId:req(1),expectedVersion:0,visual:table,included:true});const a=f.row,b=f.row;
 b.metadata.sourceVisuals[f.cardKey].visual=Object.fromEntries(Object.entries(table).reverse());assert.equal(sourceVisualSignature(a),sourceVisualSignature(b));assert.equal(visualDraftFingerprint({message:"",visual:table,included:true}),visualDraftFingerprint({included:true,visual:b.metadata.sourceVisuals[f.cardKey].visual,message:""}));
 a.metadata.sourceReview={visuals:[table,{...table,id:'img',type:'image',path:`companies/${company}/${id}/visuals/a.jpg`}]};const assets=reviewedVisualAssets([a]),sections=[{id:'s1',title:'문제'},{id:'s2',title:'계획'}],placements=assets.map(x=>({id:x.id,sectionTitle:'계획'}));
 assert.throws(()=>validatePlacements([],assets,sections),/배치/);
 const v=await transferSourceVisuals({db:f.db,assets,placements,sections,companyId:company,documentId:req(9)});assert.equal(v.length,2);assert.deepEqual(v[0].rows,table.rows);assert.equal(v[0].sectionId,'s2');assert.match(v[1].path,new RegExp(req(9)));assert.equal(f.uploads,1);
 assets[1].visual.path='companies/other/private.jpg';await assert.rejects(transferSourceVisuals({db:f.db,assets,placements,sections,companyId:company,documentId:req(9)}),/경로/);
});
