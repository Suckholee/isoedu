import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocumentRepository } from '../src/lib/documentRepository.js';
import { mergeImportedDocuments, fromDocumentRow, toDocumentRow } from '../src/lib/documentModel.js';
import { LOCAL_DOCUMENTS_KEY } from '../src/lib/localDocuments.js';
import { resolveDataConfig } from '../src/lib/dataConfig.js';

function memoryStorage(initial) {
  const values = new Map([[LOCAL_DOCUMENTS_KEY, JSON.stringify(initial)]]);
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
const a = { id: 'a-1', companyId: 'a', code: 'QM-01', title: 'A manual', contentDraft: 'A' };
const b = { id: 'b-1', companyId: 'b', code: 'QM-01', title: 'B manual', contentDraft: 'B' };

test('local save/delete remains company-scoped and an empty company stays empty after reload', async () => {
  const storage = memoryStorage([a, b]);
  const repo = createDocumentRepository({ mode: 'local', storage });
  await repo.save('a', [{ ...a, title: 'Updated' }]);
  assert.deepEqual(await repo.list('b'), [b]);
  await repo.remove('a', a.id);
  const reloaded = createDocumentRepository({ mode: 'local', storage });
  assert.deepEqual(await reloaded.list('a'), []);
  assert.deepEqual(await reloaded.list('b'), [b]);
  await assert.rejects(repo.save('a', [b]), /다른 회사/);
});

test('importing matching codes never changes another company or the existing document ID', () => {
  const updates = mergeImportedDocuments([a, b], [{ code: 'QM-01', title: 'New A', certificationCode: 'ISO_14001' }], 'a');
  assert.equal(updates.length, 1);
  assert.equal(updates[0].id, a.id);
  assert.equal(updates[0].companyId, 'a');
  assert.deepEqual(updates[0].standards, ['ISO_14001']);
  assert.equal(b.contentDraft, 'B');
});

test('cloud row mapping preserves tenant, zero D-day, content and extra UI fields', () => {
  const doc = { ...a, standards: ['ISO_9001', 'ISO_14001'], dDay: 0, hierarchyLevel: 'LEVEL_1', contentDraft: 'Draft', isStarred: true };
  const row = toDocumentRow(doc);
  assert.equal(row.company_id, 'a');
  assert.equal(row.content_draft, 'Draft');
  assert.equal(row.d_day, 0);
  const read = fromDocumentRow(row);
  for (const field of ['id', 'companyId', 'contentDraft', 'dDay', 'hierarchyLevel', 'isStarred']) assert.equal(read[field], doc[field]);
  assert.deepEqual(read.standards, doc.standards);
  const legacy = fromDocumentRow({ id: 'legacy', company_id: 'b', certification_code: 'ISO_27001', content_draft: 'Existing' });
  assert.deepEqual(legacy.standards, ['ISO_27001']);
  assert.equal(legacy.contentDraft, 'Existing');
});

test('cloud errors propagate without touching local storage', async () => {
  let touched = false;
  const failure = new Error('Network unavailable');
  const client = { from: () => ({
    select: () => ({ eq: () => ({ order: async () => ({ error: failure }) }) }),
    upsert: () => ({ select: async () => ({ error: failure }) }),
  }) };
  const repo = createDocumentRepository({ mode: 'cloud', client, storage: { getItem() { touched = true; }, setItem() { touched = true; } } });
  await assert.rejects(repo.list('a'), /Network unavailable/);
  await assert.rejects(repo.save('a', [a]), /Network unavailable/);
  assert.equal(touched, false);
});

test('configured Supabase selects cloud mode; explicit cloud never silently becomes local', () => {
  assert.equal(resolveDataConfig({ url: 'https://project.supabase.co', key: 'sb_publishable_test' }).mode, 'cloud');
  assert.equal(resolveDataConfig({ mode: 'cloud' }).mode, 'cloud');
  assert.equal(resolveDataConfig({}).mode, 'local');
  assert.throws(() => resolveDataConfig({ mode: 'typo' }));
});
