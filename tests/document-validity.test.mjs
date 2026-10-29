import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {documentValidity,policyCatalog} from '../src/lib/meeting/documentValidity.mjs';
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
    "document_validity_migration.sql",
    "document_validity_migration.sql",
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
 project=(await actRpc(owner,'create_work_project($1)',[{requestId:'40000000-0000-4000-8000-000000000001',companyId:company,title:'Document dates',kind:'ISO',requirements:[],tasks:[]}])).id;
});
after(() => db.close());
const actRpc=(id,name,args)=>act(id,async()=> ((result)=>Object.keys(result).length===1 && ['refresh_project_document_checks'].includes(name.split('(')[0])?Object.values(result)[0]:result)((await db.query(`SELECT * FROM public.${name}`,args)).rows[0]));
function policy(type,key){const info=policyCatalog.types[type],d=info.documents.find(d=>d.key===key);return {...d,applicationType:type,url:info.url,version:policyCatalog.version,rule:d.rule||{kind:'none'}};}
async function evaluated(type,key,fields={},ctx={},today='2026-10-29'){
 const r={status:'submitted',document_id:document,policy_key:`${type}:${key}`,policy:policy(type,key),covered_years:[],...fields};const context={applicationType:type,applicationDate:'2026-10-29',companyFoundedDate:'2020-01-01',...ctx};
 const js=documentValidity(r,context,today),sql=(await db.query('SELECT public.document_validity_result(jsonb_populate_record(NULL::public.project_document_requests,$1::jsonb),$2::jsonb,$3::date) AS v',[r,context,today])).rows[0].v;
 for(const k of ['status','reason','expiresOn','nextRequestOn','requiredYears'])assert.deepEqual(sql[k],js[k],`${type}/${key}/${k}`);return js;
}

test('canonical Notion source stays identical to client and SQL policy snapshots',async()=>{
 assert.deepEqual(JSON.parse(await readFile('data/document-policies/notion-20261029.json','utf8')),policyCatalog);
 const templates=(await db.query('SELECT template FROM public.document_policy_templates')).rows;
 assert.equal(templates.length,Object.values(policyCatalog.types).reduce((n,t)=>n+t.documents.length,0));
 assert.equal(policy('MAINBIZ','corporate-registry').rule.kind,'none');
 assert.equal(policy('ISO','insurance-roster').rule.kind,'none');
});
test('venture 14-day boundary, missing anchors and initial old copy defer until collection window',async()=>{
 assert.equal((await evaluated('VENTURE_GROWTH','insurance-roster',{issued_on:'2026-10-15'})).status,'valid');
 assert.equal((await evaluated('VENTURE_GROWTH','insurance-roster',{issued_on:'2026-10-14'})).status,'expired');
 assert.equal((await evaluated('VENTURE_GROWTH','insurance-roster',{issued_on:'2026-10-14'},{applicationDate:''})).status,'unknown');
 assert.equal((await evaluated('VENTURE_INVEST','corporate-registry',{issued_on:'2026-10-01'},{applicationDate:'2026-12-20'})).nextRequestOn,'2026-12-06');
 assert.equal((await evaluated('VENTURE_INVEST','corporate-registry',{issued_on:'2026-10-01'},{applicationDate:'2026-12-20'},'2026-12-06')).status,'expired');
});
test('innobiz uses calendar month with month end and leap-year bounds; mainbiz gets no guessed month',async()=>{
 assert.equal((await evaluated('INNOBIZ','national-tax',{issued_on:'2028-02-29'},{applicationDate:'2028-03-29'},'2028-03-29')).status,'valid');
 assert.equal((await evaluated('INNOBIZ','national-tax',{issued_on:'2028-02-29'},{applicationDate:'2028-03-30'},'2028-03-30')).status,'expired');
 assert.equal((await evaluated('INNOBIZ','national-tax',{issued_on:'2026-01-01'},{applicationDate:'2026-03-31'},'2026-02-01')).nextRequestOn,'2026-03-01');
 assert.equal((await evaluated('MAINBIZ','corporate-registry',{issued_on:'2020-01-01'})).status,'unspecified');
});
test('explicit expiry overrides deferred collection, no OCR guesses, year coverage accounts for actual history',async()=>{
 assert.equal((await evaluated('VENTURE_GROWTH','sme-certificate',{valid_until:'2026-10-29'})).status,'valid');
 assert.equal((await evaluated('VENTURE_GROWTH','sme-certificate',{valid_until:'2026-10-28'})).status,'expired');
 assert.equal((await evaluated('INNOBIZ','national-tax',{issued_on:'2026-10-01',valid_until:'2026-10-28'},{applicationDate:'2026-12-31'})).status,'expired');
 assert.equal((await evaluated('VENTURE_GROWTH','financial-statements')).status,'unknown');
 assert.equal((await evaluated('VENTURE_GROWTH','financial-statements',{covered_years:[2025]},{companyFoundedDate:'2025-01-01'})).status,'valid');
 assert.equal((await evaluated('INNOBIZ','financial-statements',{covered_years:[2025]},{companyFoundedDate:'2025-01-01'})).status,'unknown');
 assert.equal((await evaluated('VENTURE_GROWTH','vat',{covered_years:[2023,2024,2025]})).status,'unknown');
 assert.equal((await evaluated('VENTURE_GROWTH','vat',{covered_years:[2023,2024,2025],period_confirmed:true})).status,'valid');
 assert.equal((await evaluated('VENTURE_GROWTH','financial-statements',{covered_years:[2023,2024,2025]},{applicationDate:'2026-10-29'},'2027-01-01')).status,'expired');
});
test('configuration checks company authority, saves rules and does not duplicate requests',async()=>{
 await assert.rejects(actRpc(outsider,'configure_document_checks($1,$2,$3,$4,$5)',[project,0,'VENTURE_GROWTH','2026-10-29','2020-01-01']),/consultant/);
 const ops=await actRpc(owner,'configure_document_checks($1,$2,$3,$4,$5)',[project,0,'VENTURE_GROWTH','2026-10-29','2020-01-01']);assert.equal(ops.data.documentMonitoring,true);
 await actRpc(owner,'configure_document_checks($1,$2,$3,$4,$5)',[project,ops.revision,'VENTURE_GROWTH','2026-10-29','2020-01-01']);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM public.project_document_requests WHERE project_id=$1',[project])).rows[0].n,policyCatalog.types.VENTURE_GROWTH.documents.length);
 await assert.rejects(actRpc(owner,'configure_document_checks($1,$2,$3,$4,$5)',[project,0,'ISO',null,null]),/Concurrent/);
 await assert.rejects(act(owner,()=>db.query('SELECT public.internal_refresh_document_checks($1)',[project])),/permission/);
 await assert.rejects(act(owner,()=>db.query('SELECT public.run_document_checks()')),/permission/);
});
test('old files are preserved, nightly re-requests are idempotent, stale files cannot be approved or resubmitted',async()=>{
 const req=(await db.query("SELECT * FROM public.project_document_requests WHERE project_id=$1 AND request_key='venture_growth-insurance-roster'",[project])).rows[0];
 await db.query("UPDATE public.project_document_requests SET document_id=$1,submitted_file_path='original-old.pdf',submitted_checksum='oldhash',issued_on='2026-01-01',status='accepted' WHERE id=$2",[document,req.id]);
 assert.equal((await actRpc(owner,'refresh_project_document_checks($1)',[project])).reRequested,1);
 assert.equal((await actRpc(owner,'refresh_project_document_checks($1)',[project])).reRequested,0);
 const saved=(await db.query('SELECT * FROM public.project_document_requests WHERE id=$1',[req.id])).rows[0];assert.equal(saved.status,'changes');assert.equal(saved.submitted_file_path,'original-old.pdf');assert.equal(saved.renewal_cycle,1);
 const event=(await db.query('SELECT * FROM public.document_renewal_events WHERE request_id=$1',[req.id])).rows[0];assert.equal(event.snapshot.checksum,'oldhash');
 assert.equal((await db.query("SELECT status FROM public.work_tasks WHERE project_id=$1 AND project_task_key='intake-venture_growth-insurance-roster'",[project])).rows[0].status,'waiting');
 await assert.rejects(actRpc(owner,'review_project_document($1,$2,$3,$4,$5)',[req.id,saved.revision,'accepted',null,'']),/validity/);
 await db.query("UPDATE public.documents SET file_url='original-old.pdf' WHERE id=$1",[document]);
 await assert.rejects(actRpc(owner,'review_project_document($1,$2,$3,$4,$5)',[req.id,saved.revision,'submitted',document,'']),/Latest/);
 await act(outsider,async()=>assert.equal((await db.query('SELECT * FROM public.document_renewal_events WHERE request_id=$1',[req.id])).rows.length,0));
});
test('new upload clears old dates, metadata validates actual source and revisions, then review can complete',async()=>{
 const req=(await db.query("SELECT * FROM public.project_document_requests WHERE project_id=$1 AND request_key='venture_growth-insurance-roster'",[project])).rows[0];
 const path=`companies/${company}/${document}/latest.pdf`;
 await db.query('INSERT INTO storage.objects(bucket_id,name) VALUES($1,$2)',['iso-vault',path]);
 await db.query('INSERT INTO public.document_versions(document_id,change_reason,author_name,file_path,checksum) VALUES($1,$2,$3,$4,$5)',[document,'upload','tester',path,'newhash']);
 await db.query('UPDATE public.documents SET file_url=$1 WHERE id=$2',[path,document]);
 const submitted=await actRpc(owner,'review_project_document($1,$2,$3,$4,$5)',[req.id,req.revision,'submitted',document,'']);assert.equal(submitted.issued_on,null);assert.equal(submitted.validity.status,'unknown');
 await assert.rejects(actRpc(owner,'record_document_dates($1,$2,$3,$4,$5,$6)',[req.id,submitted.revision,'2099-01-01',null,[],false]),/Invalid/);
 await assert.rejects(actRpc(owner,'record_document_dates($1,$2,$3,$4,$5,$6)',[req.id,0,null,null,[],false]),/Concurrent/);
 const today=(await db.query("SELECT (now() AT TIME ZONE 'Asia/Seoul')::date::text AS today")).rows[0].today;
 const dated=await actRpc(owner,'record_document_dates($1,$2,$3,$4,$5,$6)',[req.id,submitted.revision,today,null,[],false]);assert.equal(dated.validity.status,'valid');
 const accepted=await actRpc(owner,'review_project_document($1,$2,$3,$4,$5)',[req.id,dated.revision,'accepted',null,'']);assert.equal(accepted.status,'accepted');assert.equal(accepted.submitted_checksum,'newhash');
 assert.equal((await db.query('SELECT count(*)::int AS n FROM public.document_renewal_events WHERE request_id=$1',[req.id])).rows[0].n,1);
});
test('nightly worker is private, records runs, stops after submitted application and isolates original history',async()=>{
 const result=(await db.query('SELECT public.run_document_checks() AS result')).rows[0].result;assert.equal(result.errors,0);assert.equal(result.reRequested,0);
 await db.query("UPDATE public.project_operations SET data=data||'{\"applicationSubmittedAt\":\"2026-10-29\"}'::jsonb WHERE project_id=$1",[project]);
 const r=(await db.query("SELECT * FROM public.project_document_requests WHERE project_id=$1 AND request_key='venture_growth-insurance-roster'",[project])).rows[0];assert.equal(r.validity.status,'closed');
 assert.equal((await db.query('SELECT public.run_document_checks() AS result')).rows[0].result.projects,0);
 await assert.rejects(act(null,()=>db.query('SELECT public.run_document_checks()'),'anon'),/permission/);
 assert.ok((await db.query('SELECT count(*)::int AS n FROM public.document_check_runs')).rows[0].n>=2);
});
