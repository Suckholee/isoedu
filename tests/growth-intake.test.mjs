import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGrowthDraft,growthTaskPayload,saveGrowthTask,parseGrowthIntake} from '../src/lib/growthIntake.mjs';
const draft={id:'11111111-1111-4111-8111-111111111111',interest:'iso',companyName:' 테스트기업 ',industry:'제조',employees:'5~9명',region:'서울',createdAt:'2026-10-29T00:00:00Z'};
test('guest information becomes a scoped task without inventing deadlines or permissions',()=>{const p=growthTaskPayload({...draft,companyId:'attacker'},{userId:'member',companyId:'authorized',origin:'https://example.com'});assert.equal(p.company_id,'authorized');assert.equal(p.created_by,'member');assert.equal(p.due_date,null);assert.equal(p.official_due_date,null);assert.equal(p.checklist.length,3);assert.equal(parseGrowthIntake(p.notes).companyName,'테스트기업');assert.equal(parseGrowthIntake('ordinary notes'),null);});
test('invalid drafts cannot be saved',()=>{for(const invalid of [{interest:'other'},{employees:'x'},{companyName:''},{id:'x'}])assert.throws(()=>validateGrowthDraft({...draft,...invalid}));assert.throws(()=>growthTaskPayload(draft,{origin:'https://example.com'}));});
function fake(error,existing){
 const chain={eq:()=>chain,single:async()=>({data:existing,error:null})};
 return {from:()=>({insert:()=>({select:()=>({single:async()=>({error,data:error?null:{id:draft.id}})})}),select:()=>chain})};
}
test('duplicate retry only accepts the same owner scoped content',async()=>{const payload=growthTaskPayload(draft,{userId:'u',companyId:'c',origin:'https://example.com'});assert.equal((await saveGrowthTask(fake({code:'23505'},payload),payload)).id,draft.id);await assert.rejects(saveGrowthTask(fake({code:'23505'},{...payload,company_id:'other'}),payload));await assert.rejects(saveGrowthTask(fake({code:'42501'}),payload));assert.equal(draft.companyName,' 테스트기업 ');});
