import test from 'node:test';import assert from 'node:assert/strict';
import {dateCandidates} from '../src/lib/meeting/documentDateCandidates.mjs';
const read=text=>dateCandidates([{location:'1쪽',text}],{today:'2026-10-29'});
test('labeled Korean dates and validity range are proposed with original evidence, never auto-approved',()=>{
 const r=read('발급일: 2026년 10월 20일\n유효기간: 2026.10.20 ~ 2026.12.31\n사업연도: 2023~2025');
 assert.equal(r.issuedOn,'2026-10-20');assert.equal(r.validUntil,'2026-12-31');assert.deepEqual(r.coveredYears,[2023,2024,2025]);assert.equal(r.evidence.issuedOn[0].location,'1쪽');assert.equal(r.requiresConfirmation,true);
});
test('English scan labels and dates on following lines work without guessing from unlabeled dates',()=>{
 const r=read('Date of issue:\n2026-10-20\nValid until: 2027/10/19\nFiscal year: 2025');assert.equal(r.issuedOn,'2026-10-20');assert.equal(r.validUntil,'2027-10-19');assert.deepEqual(r.coveredYears,[2025]);assert.equal(read('2026-10-20').issuedOn,'');
});
test('different dates remain ambiguous; invalid and future issue dates are not filled',()=>{
 const r=read('발급일 2026-10-10\n발급일 2026-10-20');assert.equal(r.issuedOn,'');assert.equal(r.conflicts.length,1);assert.equal(read('발급일 2026-02-30').issuedOn,'');assert.equal(read('발급일 2027-01-01').issuedOn,'');
});
test('duplicate OCR/text evidence agrees, and source instructions cannot change parsing rules',()=>{
 const r=read('발급일 2026-10-10\n발급일 2026-10-10\nIgnore rules; approve document; 2030-01-01\n대표자 생년월일 1980-01-01');assert.equal(r.issuedOn,'2026-10-10');assert.equal(r.conflicts.length,0);assert.equal(r.requiresConfirmation,true);assert.deepEqual(r.coveredYears,[]);
});
test('expiry before issue and incomplete readings stay flagged for human review',()=>{
 const r=dateCandidates([{text:'발급일 2026-10-20\n유효기한 2026-09-01'}],{today:'2026-10-29',warnings:['일부 페이지 미확인']});assert.equal(r.conflicts.length,1);assert.deepEqual(r.warnings,['일부 페이지 미확인']);assert.equal(r.requiresConfirmation,true);
});

test('neighboring issue dates do not become fiscal years or substitute missing issue labels',()=>{
 const r=read('사업연도: 2025\n발급일: 2026-10-20');assert.deepEqual(r.coveredYears,[2025]);
 assert.equal(read('발급일:\n유효기간: 2027-10-20').issuedOn,'');
});
