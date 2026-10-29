import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {pendingDateDocuments,compactReading} from '../src/lib/meeting/documentDateBackfill.mjs';
const db = new PGlite(),
  owner = "20000000-0000-4000-8000-000000000001",
  staff = "20000000-0000-4000-8000-000000000002",
  outsider = "20000000-0000-4000-8000-000000000003";
let company, otherCompany, project, document;
async function act(id, fn, role = "authenticated") {
  await db.exec(`BEGIN; SET LOCAL ROLE ${role};`);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [
    id || "",
  ]);
  try {
    const result = await fn();
    await db.exec("COMMIT");
    return result;
  } catch (e) {
    await db.exec("ROLLBACK");
    throw e;
  }
}
before(async () => {
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
  for (const path of [
    "schema.sql",
    "platform_migration.sql",
    "work_tasks_migration.sql",
    "company_projects_migration.sql",
    "meeting_20261023_migration.sql",
    "document_date_readings_migration.sql",
    "document_date_readings_migration.sql",
  ])
    await db.exec(
      (
        await readFile(new URL("../supabase/" + path, import.meta.url), "utf8")
      ).replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', ""),
    );
  for (const [id, email] of [
    [owner, "owner@example.test"],
    [staff, "staff@example.test"],
    [outsider, "other@example.test"],
  ])
    await db.query(
      "INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)",
      [id, email, { full_name: id }],
    );
  company = (
    await db.query("SELECT company_id FROM public.profiles WHERE id=$1", [
      owner,
    ])
  ).rows[0].company_id;
  otherCompany = (
    await db.query("SELECT company_id FROM public.profiles WHERE id=$1", [
      outsider,
    ])
  ).rows[0].company_id;
  document = (
    await db.query(
      "INSERT INTO public.documents(company_id,title,certification_code,hierarchy_level) VALUES($1,'Company document','ISO_9001','LEVEL_1') RETURNING id",
      [company],
    )
  ).rows[0].id;

});
after(() => db.close());
const actRpc=(id,name,args)=>act(id,async()=> ((result)=>Object.keys(result).length===1 && ['refresh_project_document_checks'].includes(name.split('(')[0])?Object.values(result)[0]:result)((await db.query(`SELECT * FROM public.${name}`,args)).rows[0]));

const stamp=async()=> (await db.query('SELECT * FROM public.documents WHERE id=$1',[document])).rows[0];
const candidate={status:'review',sourceHash:'a'.repeat(64),issuedOn:'2026-10-20',validUntil:'2026-12-31',coveredYears:[2023,2024,2025],evidence:{},warnings:[],conflicts:[]};
let saved;
test('saving candidates requires editor and matching source/revision; no confirmed facts or expiry are written',async()=>{
 const path=`companies/${company}/${document}/original.pdf`;
 await db.query("UPDATE public.documents SET file_url=$1,metadata='{}' WHERE id=$2",[path,document]);
 await db.query("INSERT INTO public.document_versions(document_id,file_path,checksum,change_reason,author_name) VALUES($1,$2,$3,'upload','test')",[document,path,'a'.repeat(64)]);
 const d=await stamp();
 await assert.rejects(actRpc(outsider,'save_document_date_reading($1,$2,$3,$4)',[document,path,d.updated_at,candidate]),/editor/);
 await assert.rejects(actRpc(owner,'save_document_date_reading($1,$2,$3,$4)',[document,path,d.updated_at,{...candidate,sourceHash:'b'.repeat(64)}]),/checksum/);
 saved=await actRpc(owner,'save_document_date_reading($1,$2,$3,$4)',[document,path,d.updated_at,candidate]);
 assert.equal(saved.metadata.dateReading.status,'review');assert.equal(saved.metadata.dateFacts,undefined);assert.equal(saved.expiry_date,null);
 await assert.rejects(actRpc(owner,'save_document_date_reading($1,$2,$3,$4)',[document,path,d.updated_at,candidate]),/Concurrent/);
 assert.equal(pendingDateDocuments([saved]).length,0);
});
test('confirmation requires human flag/current reading, records facts separately and preserves company isolation',async()=>{
 const r=saved.metadata.dateReading;
 await assert.rejects(actRpc(owner,'confirm_document_date_reading($1,$2,$3,$4,$5,$6,$7)',[document,r.id,saved.updated_at,'2026-10-20','2026-12-31',[2023,2024,2025],false]),/confirmation/);
 saved=await actRpc(owner,'confirm_document_date_reading($1,$2,$3,$4,$5,$6,$7)',[document,r.id,saved.updated_at,'2026-10-20','2026-12-31',[2023,2024,2025],true]);
 assert.equal(saved.metadata.dateFacts.issuedOn,'2026-10-20');assert.equal(saved.metadata.dateReading.status,'confirmed');assert.equal(saved.expiry_date,null);
 await act(outsider,async()=>assert.equal((await db.query('SELECT * FROM public.documents WHERE id=$1',[document])).rows.length,0));
});
test('ordinary stale metadata edits cannot erase or forge server readings; changed source returns to queue',async()=>{
 await act(owner,()=>db.query("UPDATE public.documents SET metadata='{\"note\":\"other edit\",\"dateReading\":{\"status\":\"forged\"}}' WHERE id=$1",[document]));
 let d=await stamp();assert.equal(d.metadata.dateReading.status,'confirmed');assert.equal(d.metadata.dateFacts.issuedOn,'2026-10-20');assert.equal(d.metadata.note,'other edit');
 await db.query('UPDATE public.documents SET file_url=$1 WHERE id=$2',[`companies/${company}/${document}/new.pdf`,document]);d=await stamp();assert.equal(pendingDateDocuments([d]).length,1);
 await assert.rejects(actRpc(owner,'confirm_document_date_reading($1,$2,$3,$4,$5,$6,$7)',[document,saved.metadata.dateReading.id,d.updated_at,null,null,[],true]),/Concurrent/);
 await assert.rejects(act(owner,()=>db.query('SELECT public.save_document_date_reading($1,$2,$3,$4)',[document,d.file_url,d.updated_at,candidate]),'anon'),/permission/);
});
test('failure retry stays queued, evidence bounded for storage and unconfirmed status cannot become certificate expiry',()=>{
 const d={file_url:'x',metadata:{dateReading:{sourcePath:'x',engine:'browser-reader-20261029-v2',status:'failed'}}};assert.equal(pendingDateDocuments([d]).length,1);
 const r=compactReading({issuedOn:'',validUntil:'',coveredYears:[],evidence:{issuedOn:Array(120).fill({excerpt:'x'.repeat(600),location:'1쪽'})}});assert.equal(r.status,'no_candidates');assert.equal(r.evidence.issuedOn.length,100);assert.equal(r.evidence.issuedOn[0].excerpt.length,260);
});

test('text-only documents bind candidates to exact stored text hash',async()=>{
 await db.query("UPDATE public.documents SET file_url=NULL,metadata='{}',content_draft='발급일 2026-10-20' WHERE id=$1",[document]);
 const d=await stamp();
 const hash=(await db.query("SELECT encode(sha256(convert_to(content_draft,'UTF8')),'hex') AS hash FROM public.documents WHERE id=$1",[document])).rows[0].hash;
 const saved=await actRpc(owner,'save_document_date_reading($1,$2,$3,$4)',[document,'',d.updated_at,{...candidate,sourceHash:hash}]);assert.equal(saved.metadata.dateReading.sourceHash,hash);
});
test('missing cloud original can retain clearly flagged text-only candidates without claiming original availability',async()=>{
 const d=await stamp(),path=`companies/${company}/${document}/missing.pdf`,hash='c'.repeat(64);
 await db.query('UPDATE public.documents SET file_url=NULL,metadata=$1,content_draft=$2 WHERE id=$3',[{originalPath:path,migration:{sha256:hash,status:'failed'}},'발급일 2026-10-20',document]);
 const row=await stamp(),textHash=(await db.query("SELECT encode(sha256(convert_to(content_draft,'UTF8')),'hex') AS hash FROM public.documents WHERE id=$1",[document])).rows[0].hash;
 const saved=await actRpc(owner,'save_document_date_reading($1,$2,$3,$4)',[document,path,row.updated_at,{...candidate,sourceHash:hash,textHash,sourceUnavailable:true}]);
 assert.equal(saved.metadata.dateReading.sourceUnavailable,true);assert.equal(saved.metadata.dateReading.textHash,textHash);assert.equal(saved.metadata.dateFacts,undefined);
 await act(owner,()=>db.query('UPDATE public.documents SET content_draft=$1 WHERE id=$2',['changed stored text',document]));assert.equal((await stamp()).metadata.dateReading,undefined);
});
