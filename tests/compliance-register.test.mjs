import test from 'node:test';import assert from 'node:assert/strict';
import {selectComplianceRows,registerDate} from '../src/lib/complianceRegister.mjs';
const rows=[{id:'a',clause:'4.10',level:'LEVEL_2',title:'품질 절차',defaultCode:'P-01',status:'MISSING'},{id:'b',clause:'4.2',level:'CERT',title:'인증서',status:'EXPIRING',matchedDoc:{title:'공장 인증서',code:'CERT-1',department:'품질팀',author:'홍길동',lastModified:'2026-10-18T03:00:00Z'}},{id:'c',clause:'5.1',level:'LEVEL_2',title:'보안 절차',status:'READY',matchedDoc:{title:'정보보안',department:'보안팀',author:'김담당',lastModified:'2026-10-17T03:00:00Z'}}];
test('type and status filtering combine, and linked includes expiry rows',()=>{assert.deepEqual(selectComplianceRows(rows,{status:'LINKED',type:'CERT'}).map(r=>r.id),['b']);assert.deepEqual(selectComplianceRows(rows,{status:'MISSING'}).map(r=>r.id),['a']);});
test('column filters intersect rather than overriding one another',()=>{assert.deepEqual(selectComplianceRows(rows,{code:'CERT',query:'공장',owner:'홍길동',date:'2026-10-18'}).map(r=>r.id),['b']);assert.equal(selectComplianceRows(rows,{owner:'보안',date:'2026-10-18'}).length,0);});
test('clause sorting is numeric and never mutates source order',()=>{assert.deepEqual(selectComplianceRows(rows).map(r=>r.id),['b','a','c']);assert.deepEqual(selectComplianceRows(rows,{direction:'desc'}).map(r=>r.id),['c','a','b']);assert.deepEqual(rows.map(r=>r.id),['a','b','c']);});
test('missing dates remain unknown, not synthesized',()=>{assert.equal(registerDate(rows[0]),'');assert.equal(registerDate(rows[1]),'2026-10-18');assert.equal(selectComplianceRows(rows,{query:'없는 문서'}).length,0);});

test('timestamp dates use Korean business timezone',()=>assert.equal(registerDate({matchedDoc:{lastModified:'2026-10-18T23:00:00Z'}}),'2026-10-19'));
