import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const member = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
const auditor = '10000000-0000-4000-8000-000000000003';
let company, otherCompany, documentId;
const root = new URL('../', import.meta.url);

before(async () => {
  // Only Supabase platform schemas are stubbed; app tables, triggers and RLS are the real SQL files.
  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE SCHEMA auth;
    CREATE SCHEMA storage;
    CREATE TABLE auth.users (id UUID PRIMARY KEY, email TEXT, raw_user_meta_data JSONB DEFAULT '{}'::jsonb);
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS $$ SELECT jsonb_build_object('email', 'test@example.com') $$;
    CREATE FUNCTION public.uuid_generate_v4() RETURNS UUID LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
    CREATE TABLE storage.buckets (id TEXT PRIMARY KEY, name TEXT, public BOOLEAN, file_size_limit BIGINT, allowed_mime_types TEXT[]);
    CREATE TABLE storage.objects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id TEXT, name TEXT);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$ SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1)-1] $$;
    GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
  `);
  const schema = (await readFile(new URL('supabase/schema.sql', root), 'utf8')).replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', '');
  await db.exec(schema);
  const migration = await readFile(new URL('supabase/platform_migration.sql', root), 'utf8');
  await db.exec(migration);
  await db.exec(migration); // Rerunning must not leave a partially hardened database.
  for (const id of [member, other, auditor]) {
    await db.query('INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES ($1, $2, $3)', [id, `${id}@example.com`, { full_name: 'Test', role: 'ADMIN', company_name: 'Test company' }]);
  }
  company = (await db.query('SELECT company_id FROM public.profiles WHERE id = $1', [member])).rows[0].company_id;
  otherCompany = (await db.query('SELECT company_id FROM public.profiles WHERE id = $1', [other])).rows[0].company_id;
  await db.query("UPDATE public.profiles SET role = 'AUDITOR' WHERE id = $1", [auditor]);
  documentId = (await db.query("INSERT INTO public.documents(company_id, certification_code, hierarchy_level, title) VALUES ($1, 'ISO_9001', 'LEVEL_1', 'Private manual') RETURNING id", [company])).rows[0].id;
});
after(async () => { await db.close(); });

async function asUser(id, action, role = 'authenticated') {
  await db.exec(`BEGIN; SET LOCAL ROLE ${role};`);
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [id || '']);
  try { return await action(); } finally { await db.exec('ROLLBACK'); }
}

test('signup ignores requested ADMIN role and creates a real company membership', async () => {
  const row = (await db.query('SELECT role, company_id FROM public.profiles WHERE id = $1', [member])).rows[0];
  assert.equal(row.role, 'MEMBER');
  assert.ok(row.company_id);
});

test('anonymous clients cannot read tenant documents', async () => {
  await assert.rejects(asUser(null, () => db.query('SELECT * FROM public.documents'), 'anon'), /permission denied/);
});

test('members read their company and cannot read another company', async () => {
  await asUser(member, async () => {
    assert.equal((await db.query('SELECT * FROM public.documents WHERE id = $1', [documentId])).rows.length, 1);
    assert.equal((await db.query('SELECT * FROM public.companies WHERE id = $1', [otherCompany])).rows.length, 0);
    assert.equal((await db.query('SELECT * FROM public.profiles WHERE id = $1', [member])).rows.length, 1);
  });
  await asUser(other, async () => assert.equal((await db.query('SELECT * FROM public.documents WHERE id = $1', [documentId])).rows.length, 0));
});

test('members cannot promote themselves or move their profile to another company', async () => {
  await assert.rejects(asUser(member, () => db.query("UPDATE public.profiles SET role = 'ADMIN' WHERE id = $1", [member])), /permission denied/);
  await assert.rejects(asUser(member, () => db.query('UPDATE public.profiles SET company_id = $1 WHERE id = $2', [otherCompany, member])), /permission denied/);
});

test('cross-company writes fail; auditor can read but cannot change documents', async () => {
  await assert.rejects(asUser(other, () => db.query("INSERT INTO public.documents(company_id, title, hierarchy_level, certification_code) VALUES ($1, 'Wrong', 'LEVEL_1', 'ISO_9001')", [company])), /row-level security/);
  await asUser(auditor, async () => {
    assert.equal((await db.query('SELECT * FROM public.documents WHERE id = $1', [documentId])).rows.length, 1);
    assert.equal((await db.query("UPDATE public.documents SET title = 'Wrong' WHERE id = $1 RETURNING id", [documentId])).rows.length, 0);
    assert.equal((await db.query('DELETE FROM public.documents WHERE id = $1 RETURNING id', [documentId])).rows.length, 0);
  });
});

test('VIEWER membership permits reading and blocks updating', async () => {
  await db.query("INSERT INTO public.company_members(company_id, user_id, membership_role) VALUES ($1, $2, 'VIEWER')", [company, other]);
  await asUser(other, async () => {
    assert.equal((await db.query('SELECT * FROM public.documents WHERE id = $1', [documentId])).rows.length, 1);
    assert.equal((await db.query("UPDATE public.documents SET title = 'Wrong' WHERE id = $1 RETURNING id", [documentId])).rows.length, 0);
  });
  await db.query('DELETE FROM public.company_members WHERE company_id = $1 AND user_id = $2', [company, other]);
});

test('document changes create database-authored audit records; direct forgery fails', async () => {
  await asUser(member, async () => {
    await db.query("UPDATE public.documents SET title = 'Revised' WHERE id = $1", [documentId]);
    const logs = (await db.query("SELECT * FROM public.audit_logs WHERE resource_id = $1 AND action_type = 'UPDATE'", [documentId])).rows;
    assert.equal(logs.length, 1);
    assert.equal(logs[0].user_id, member);
    assert.equal(logs[0].company_id, company);
  });
  await assert.rejects(asUser(member, () => db.query("INSERT INTO public.audit_logs(company_id, user_id, action_type, target_resource) VALUES ($1, $2, 'DELETE', 'DOCUMENT')", [otherCompany, other])), /permission denied/);
});

test('storage paths enforce document ownership and reject another tenant', async () => {
  await asUser(member, async () => {
    await db.query("INSERT INTO storage.objects(bucket_id, name) VALUES ('iso-vault', $1)", [`companies/${company}/${documentId}/file.pdf`]);
    assert.equal((await db.query('SELECT * FROM storage.objects')).rows.length, 1);
  });
  await assert.rejects(asUser(other, () => db.query("INSERT INTO storage.objects(bucket_id, name) VALUES ('iso-vault', $1)", [`companies/${company}/${documentId}/file.pdf`])), /row-level security/);
});

test('project creation persists a company, membership and project in one transaction', async () => {
  await asUser(member, async () => {
    const result = await db.query('SELECT * FROM public.create_audit_project($1::jsonb)', [{ clientName: 'New tenant', industry: 'Manufacturing' }]);
    const created = result.rows[0];
    assert.ok(created.id);
    assert.ok(created.company_id);
    assert.equal((await db.query('SELECT * FROM public.audit_projects WHERE id = $1', [created.id])).rows.length, 1);
    assert.equal((await db.query('SELECT public.can_edit_company($1) AS allowed', [created.company_id])).rows[0].allowed, true);
  });
});
