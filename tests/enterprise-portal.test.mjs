import {test,before,after} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
const db=new PGlite(),owner='80000000-0000-4000-8000-000000000001',member='80000000-0000-4000-8000-000000000002',other='80000000-0000-4000-8000-000000000003';let client,memberCompany;
async function act(id,fn,role='authenticated'){await db.exec(`BEGIN; SET LOCAL ROLE ${role};`);await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[id||'']);try{const value=await fn();await db.exec('COMMIT');return value;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function context(id,role){return act(id,async()=>(await db.query('SELECT public.my_company_connections() AS value')).rows[0].value,role);}
before(async()=>{
 await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE SCHEMA auth; CREATE SCHEMA storage;
 CREATE TABLE auth.users(id UUID PRIMARY KEY,email TEXT,raw_user_meta_data JSONB DEFAULT '{}'::jsonb);
 CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
 CREATE FUNCTION public.uuid_generate_v4() RETURNS UUID LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
 CREATE TABLE storage.buckets(id TEXT PRIMARY KEY,name TEXT,public BOOLEAN,file_size_limit BIGINT,allowed_mime_types TEXT[]);
 CREATE TABLE storage.objects(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id TEXT,name TEXT); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 CREATE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$ SELECT (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
 GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated;
 GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO anon,authenticated;
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated;`);
 for(const path of ['schema.sql','platform_migration.sql','work_tasks_migration.sql','company_projects_migration.sql','managed_clients_migration.sql','meeting_20261023_migration.sql','enterprise_portal_migration.sql','enterprise_portal_migration.sql'])await db.exec((await readFile(new URL('../supabase/'+path,import.meta.url),'utf8')).replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',''));
 for(const [id,email] of [[owner,'owner@example.test'],[member,'member@example.test'],[other,'other@example.test']])await db.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)',[id,email,{full_name:id,company_name:'Same Company',role:'ADMIN',account_type:'consultant'}]);
 memberCompany=(await db.query('SELECT company_id FROM public.profiles WHERE id=$1',[member])).rows[0].company_id;
 client=(await act(owner,async()=>(await db.query("SELECT public.register_managed_client('Client','test-client') AS id")).rows[0].id));
});after(()=>db.close());
test('signup starts enterprise workspace immediately, same name and metadata never join existing data',async()=>{const data=await context(member);assert.equal(data.mode,'enterprise');assert.deepEqual(data.companies.map(c=>c.id),[memberCompany]);assert.equal(data.companies[0].canEdit,true);assert.equal((await db.query('SELECT role FROM public.profiles WHERE id=$1',[member])).rows[0].role,'MEMBER');const owned=await context(owner);assert.equal(owned.mode,'consultant');assert(owned.companies.some(c=>c.id===client));});
test('existing company approval grants only that membership, revocation removes it',async()=>{const code=await act(owner,async()=>(await db.query('SELECT public.company_join_code($1) AS value',[client])).rows[0].value);const request=await act(member,async()=>(await db.query('SELECT public.request_company_join($1) AS value',[code])).rows[0].value);assert(!(await context(member)).companies.some(c=>c.id===client));assert.equal((await context(other)).requests.length,0);await act(owner,()=>db.query("SELECT public.decide_company_join($1,true,'EDITOR')",[request]));assert((await context(member)).companies.some(c=>c.id===client));assert.equal((await context(member)).mode,'enterprise');await act(owner,()=>db.query('SELECT public.end_company_membership($1,$2)',[client,member]));assert(!(await context(member)).companies.some(c=>c.id===client));});
test('anonymous and inactive accounts cannot retrieve portal data',async()=>{await assert.rejects(context(null,'anon'),/permission denied/);await db.query('UPDATE public.profiles SET is_active=false WHERE id=$1',[other]);await assert.rejects(context(other),/Active login required/);});
