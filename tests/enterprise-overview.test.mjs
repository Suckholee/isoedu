import {test} from 'node:test';
import assert from 'node:assert/strict';
import {enterpriseProjectSummary,loadEnterpriseOverview} from '../src/lib/enterpriseOverview.mjs';
test('enterprise progress separates excluded requests, document reviews and completed tasks by company/project',()=>{
 const project={id:'p',companyId:'c'},row={project_id:'p',company_id:'c'};
 const summary=enterpriseProjectSummary(project,['requested','changes','submitted','accepted','not_applicable'].map(status=>({...row,status})).concat({...row,company_id:'other',status:'accepted'}),[{...row,status:'done'},{...row,status:'waiting'},{...row,project_id:'other',status:'done'}],[{companyId:'c',ai:{projectId:'p',state:'ready',review:{reviewed:true}}},{companyId:'c',ai:{projectId:'p',state:'failed'}},{companyId:'other',ai:{projectId:'p',state:'ready'}}]);
 assert.deepEqual(summary,{total:5,pending:2,submitted:1,accepted:1,excluded:1,drafts:1,reviewed:1,tasks:2,doneTasks:1});
});
test('overview fetches canonical project identifiers together with requests and all task statuses',async()=>{
 const calls=[];const client={from(table){const q={select(){return q;},eq(key,value){calls.push([table,key,value]);return q;},order(){return Promise.resolve({data:table==='audit_projects'?[{id:'canonical',company_id:'c',data:{id:'stale',companyId:'wrong',title:'준비 프로젝트'}}]:[]});}};return q;}};
 const result=await loadEnterpriseOverview(client,'c');assert.deepEqual(result.projects,[{id:'canonical',companyId:'c',title:'준비 프로젝트'}]);assert.equal(calls.length,3);assert(calls.every(([,key,value])=>key==='company_id'&&value==='c'));
 await assert.rejects(loadEnterpriseOverview({from(){return {select(){return this;},eq(){return this;},order(){return Promise.resolve({error:Error('connection failed')});}};}},'c'),/connection failed/);
});
