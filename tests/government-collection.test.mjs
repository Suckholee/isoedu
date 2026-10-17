import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKStartup,parseMss} from '../src/lib/governmentAnnouncementParser.mjs';
import {matchDocumentsForProgram} from '../src/lib/crossDocumentMatcher.js';
test('K-Startup stores actual dates and stable detail URL without D-day guessing',()=>{
 const html=`<li><span class="flag agency">공공</span><a href='javascript:go_view(123);'><p class="tit">A &amp; B</p></a><span class="list">사업</span><span class="list">기관</span><span class="list">시작일자 2026-10-15</span><span class="list">마감일자 2026-10-25</span></li>`;
 const [p]=parseKStartup(html,'now');assert.equal(p.id,'kstartup-123');assert.equal(p.title,'A & B');assert.equal(p.applicationEndDate,'2026-10-25');assert.match(p.sourceUrl,/pbancSn=123/);assert.equal(p.requiredDocsTemplate,'UNVERIFIED');
});
test('MSS keeps missing dates unknown and parses attachment addresses',()=>{
 const html=`<tr onclick="doBbsFView('310','456','x','456');"><a class="pc-detail">Test</a><span data-href="/file?a=1&amp;b=2"></span></tr>`;
 const [p]=parseMss(html,'now');assert.equal(p.applicationStartDate,null);assert.equal(p.applicationEndDate,null);assert.equal(p.attachments[0],'https://www.mss.go.kr/file?a=1&b=2');
});
test('new collected public notices never inherit unverified ISO document requirements',()=>{
 const result=matchDocumentsForProgram({id:'x',requiredDocsTemplate:'UNVERIFIED'},[]);assert.equal(result.totalRequired,0);assert.equal(result.reuseRate,0);
});
