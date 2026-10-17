import test from 'node:test';
import assert from 'node:assert/strict';
import { monthCells, dateKey, programPeriod, programsOnDate } from '../src/lib/programCalendar.mjs';
test('calendar includes leap day and a complete six-week grid',()=>{
 const days=monthCells(2028,1);assert.equal(days.length,42);assert.equal(days[0].getDay(),0);assert.ok(days.some(d=>dateKey(d)==='2028-02-29'));
});
test('application periods include both boundaries and exclude undated programs',()=>{
 const p={id:'a',applicationStartDate:'2026-10-01',applicationEndDate:'2026-10-03'};
 for(const date of ['2026-10-01','2026-10-02','2026-10-03'])assert.deepEqual(programsOnDate([p,{id:'unknown'}],date),[p]);
 assert.deepEqual(programsOnDate([p],'2026-10-04'),[]);
});
test('invalid and reversed dates remain unconfirmed; deadline-only is shown only that day',()=>{
 assert.deepEqual(programPeriod({applicationStartDate:'2026-02-30'}),{start:null,end:null});
 assert.deepEqual(programPeriod({applicationStartDate:'2026-10-03',applicationEndDate:'2026-10-01'}),{start:null,end:null});
 const p={applicationEndDate:'2026-10-03'};assert.equal(programsOnDate([p],'2026-10-03').length,1);assert.equal(programsOnDate([p],'2026-10-02').length,0);
});
