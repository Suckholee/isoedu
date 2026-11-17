import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { indexedDB } from 'fake-indexeddb';
import { PGlite } from '@electric-sql/pglite';
import { cleanRecord, findRecords, newRecord, recordText } from '../src/lib/secondBrain/model.mjs';
import { localRecords } from '../src/lib/secondBrain/repository.mjs';
import { knowledgeGraph } from '../src/lib/secondBrain/graph.mjs';
import { navFromPath, validPlatformPath, platformHref } from '../src/lib/platformRoutes.mjs';

test('local records persist, enforce revision and company, archive/restore and export source', async () => {
  const repo = localRecords(indexedDB, 'test-brain');
  const context = { companyId: 'a', projects: [], documents: [] };
  const original = newRecord('a', { title: '지원사업 검토', body: '실제 미팅 기록', tags: ['지원사업'], source_url: 'https://example.com/source' });
  const saved = await repo.save(original, context);
  assert.equal((await localRecords(indexedDB, 'test-brain').load('a')).records[0].body, original.body);
  assert.equal((await repo.load('b')).records.length, 0);
  await assert.rejects(repo.save({ ...saved, company_id: 'b' }, { ...context, companyId: 'b' }));
  const updated = await repo.save({ ...saved, archived: true }, context);
  await assert.rejects(repo.save(saved, context), /다른 창/);
  assert.equal(findRecords([updated]).length, 0);
  assert.equal(findRecords([updated], { view: 'archive' }).length, 1);
  const restored = await repo.save({ ...updated, archived: false }, context);
  assert.equal(findRecords([restored], { query: '지원사업 미팅' }).length, 1);
  assert.match(recordText(restored), /https:\/\/example.com\/source/);
  const outcomes = await Promise.allSettled([repo.save(restored, context), repo.save(restored, context)]);
  assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1);
});

test('invalid links, dates, missing link sources and cross-company references are rejected', () => {
  const input = newRecord('a', { title: '지식' }), context = { companyId: 'a', documents: [{ id: 'doc', companyId: 'b' }], projects: [{ id: 'project', companyId: 'b' }] };
  for (const patch of [{ source_url: 'javascript:alert(1)' }, { source_url: 'https://name:password@example.com' }, { event_date: '2026-02-30' }, { kind: 'link' }, { document_id: 'doc' }, { project_id: 'project' }, { tags: ['a'.repeat(41)] }]) assert.throws(() => cleanRecord({ ...input, ...patch }, context));
});

test('graph creates only saved relations to same-company documents and projects; filters/routes retain context', () => {
  const r = { ...newRecord('a', { title: '기록', tags: ['인증'], document_id: 'doc', project_id: 'project' }), updated_at: '2026-11-15' };
  const graph = knowledgeGraph([r], [{ id: 'doc', companyId: 'b' }], [{ id: 'project', companyId: 'b' }]);
  assert.equal(graph.nodes.length, 2); assert.equal(graph.edges.length, 1);
  const connected = knowledgeGraph([r], [{ id: 'doc', companyId: 'a' }], [{ id: 'project', companyId: 'a' }]);
  assert.equal(connected.edges.length, 3);
  assert.equal(findRecords([r], { tag: '세무' }).length, 0);
  assert.equal(navFromPath('/second-brain'), 'second_brain');
  assert(validPlatformPath('second-brain', []));
  assert.match(platformHref('second_brain', 'company=a&kbtag=ISO'), /company=a&kbtag=ISO/);
});

const db = new PGlite();
const owner = '80000000-0000-4000-8000-000000000001', viewer = '80000000-0000-4000-8000-000000000002', other = '80000000-0000-4000-8000-000000000003';
const company = '90000000-0000-4000-8000-000000000001', foreign = '90000000-0000-4000-8000-000000000002';
const note = '70000000-0000-4000-8000-000000000001', document = '60000000-0000-4000-8000-000000000001', project = '50000000-0000-4000-8000-000000000001';
before(async () => {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    GRANT USAGE ON SCHEMA auth,public TO authenticated,anon;
    CREATE TABLE companies(id uuid PRIMARY KEY);
    CREATE TABLE audit_projects(id uuid PRIMARY KEY,company_id uuid REFERENCES companies(id));
    CREATE TABLE documents(id uuid PRIMARY KEY,company_id uuid REFERENCES companies(id));
    CREATE TABLE memberships(user_id uuid,company_id uuid,editor boolean,active boolean DEFAULT true);
    CREATE FUNCTION can_read_company(c_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path=public,pg_temp AS $$ SELECT EXISTS(SELECT 1 FROM memberships WHERE user_id=auth.uid() AND company_id=c_id AND active) $$;
    CREATE FUNCTION can_edit_company(c_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path=public,pg_temp AS $$ SELECT EXISTS(SELECT 1 FROM memberships WHERE user_id=auth.uid() AND company_id=c_id AND editor AND active) $$;
    INSERT INTO auth.users VALUES('${owner}'),('${viewer}'),('${other}');
    INSERT INTO companies VALUES('${company}'),('${foreign}');
    INSERT INTO memberships(user_id,company_id,editor) VALUES('${owner}','${company}',true),('${viewer}','${company}',false),('${other}','${foreign}',true);
    INSERT INTO documents VALUES('${document}','${foreign}'); INSERT INTO audit_projects VALUES('${project}','${foreign}');`);
  const sql = await readFile(new URL('../supabase/knowledge_records_migration.sql', import.meta.url), 'utf8');
  await db.exec(sql); await db.exec(sql);
});
after(() => db.close());
async function act(user, action, role = 'authenticated') {
  await db.exec(`BEGIN; SET LOCAL ROLE ${role}`);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [user || '']);
  try { const result = await action(); await db.exec('COMMIT'); return result; }
  catch (error) { await db.exec('ROLLBACK'); throw error; }
}
const payload = { company_id: company, title: '회사 지식', body: '권한이 있는 회사에만 저장', kind: 'note', source_url: '', tags: ['인증'] };
const save = (revision, patch = {}) => db.query('SELECT * FROM save_knowledge_record($1,$2,$3)', [note, revision, { ...payload, ...patch }]);

test('SQL saves/reloads, denies anonymous, viewer and other company access, and blocks direct writes', async () => {
  const saved = await act(owner, () => save(0)); assert.equal(saved.rows[0].revision, 1);
  const loaded = await act(viewer, () => db.query('SELECT * FROM knowledge_records')); assert.equal(loaded.rows[0].body, payload.body);
  assert.equal((await act(other, () => db.query('SELECT * FROM knowledge_records'))).rows.length, 0);
  await assert.rejects(act('', () => db.query('SELECT * FROM knowledge_records'), 'anon'), e => e.code === '42501');
  await assert.rejects(act(viewer, () => save(1)), e => e.code === '42501');
  await assert.rejects(act(other, () => save(1)), e => e.code === '42501');
  await assert.rejects(act(owner, () => db.query("UPDATE knowledge_records SET title='bypass'")), e => e.code === '42501');
});

test('SQL archive/restore preserves source, rejects stale writes and cross-company linked data', async () => {
  await assert.rejects(act(owner, () => save(0)), e => e.code === '40001');
  await assert.rejects(act(owner, () => save(1, { document_id: document })), e => e.code === '42501');
  await assert.rejects(act(owner, () => save(1, { project_id: project })), e => e.code === '42501');
  await assert.rejects(act(owner, () => save(1, { source_url: 'javascript:alert(1)' })), e => e.code === '23514');
  await assert.rejects(act(owner, () => save(1, { event_date: '2026-02-30' })));
  await act(owner, () => save(1, { archived: true, source_url: 'https://example.com/source' }));
  const archived = (await act(owner, () => db.query('SELECT * FROM knowledge_records'))).rows[0]; assert.equal(archived.archived, true);
  const restored = (await act(owner, () => save(2, { archived: false, source_url: archived.source_url }))).rows[0];
  assert.equal(restored.source_url, archived.source_url); assert.equal(restored.revision, 3);
  await db.query('UPDATE memberships SET active=false WHERE user_id=$1', [owner]);
  assert.equal((await act(owner, () => db.query('SELECT * FROM knowledge_records'))).rows.length, 0);
  await assert.rejects(act(owner, () => save(3)), e => e.code === '42501');
});
