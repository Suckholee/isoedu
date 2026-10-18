import test from 'node:test';import assert from 'node:assert/strict';
import {taskToRow,taskFromRow} from '../src/lib/cloudWorkTasks.mjs';
const nodes=[{id:'a',kind:'client'},{id:'b',kind:'client'},{id:'d',type:'file',parentId:'a'}];
test('cloud task mapping keeps real dates, checklist and server identity; refuses cross-company links',()=>{
 const input={title:' 업무 ',status:'doing',clientId:'a',documentId:'d',dueDate:'2026-10-19',officialDueDate:'2026-10-23',createdBy:'forged',checklist:[{text:'확인',done:true}]};
 const row=taskToRow(input,nodes);assert.equal(row.title,'업무');assert.equal(row.created_by,undefined);assert.equal(row.official_due_date,'2026-10-23');
 assert.equal(taskFromRow({...row,created_by:'real'}).createdBy,'real');
 assert.throws(()=>taskToRow({...input,clientId:'b'},nodes),/회사/);assert.throws(()=>taskToRow({...input,dueDate:'2026-02-29'},nodes),/날짜/);assert.throws(()=>taskToRow({...input,sourceUrl:'javascript:alert(1)'},nodes),/http/);
});
