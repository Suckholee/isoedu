import test from 'node:test';import assert from 'node:assert/strict';import {findPdfMatches,splitPdfHighlights} from '../src/lib/pdfSearch.mjs';
test('PDF search spans fragments and whitespace without losing source offsets',()=>{assert.deepEqual(findPdfMatches(['사업',' 계획','서 사업계획서'],'사업계획서'),[{start:0,end:6},{start:7,end:12}]);});
test('PDF search handles case and compatibility characters',()=>{assert.deepEqual(findPdfMatches(['ＡＢＣ abc'],'abc'),[{start:0,end:3},{start:4,end:7}]);assert.deepEqual(findPdfMatches(['a'],'  '),[]);});
test('PDF highlights preserve full text and separate cross-fragment ranges',()=>{const parts=splitPdfHighlights('계획서 기타',2,[{start:0,end:5,hit:0}]);assert.equal(parts.map(p=>p.text).join(''),'계획서 기타');assert.deepEqual(parts[0],{text:'계획서',hit:0});});
