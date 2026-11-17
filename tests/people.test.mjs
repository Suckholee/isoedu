import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {PROFILES,EXTERNAL_ARTICLES,getProfile,filterProfiles,contributionGroups,attributionInput,profileSchema} from '../src/lib/people/model.mjs';
import {articleSchema} from '../src/lib/articles/seo.mjs';
test('imported public profiles retain source identities and explicit authored links only',()=>{
 assert.equal(PROFILES.length,33);assert.equal(new Set(PROFILES.map(p=>p.slug)).size,33);
 assert.equal(PROFILES.filter(p=>p.entityType==='Organization').length,1);
 assert.equal(EXTERNAL_ARTICLES.length,4);assert.equal(contributionGroups('youngbin-cho',EXTERNAL_ARTICLES).authored.length,0);assert.equal(contributionGroups('youngbin-cho',EXTERNAL_ARTICLES).sourced.length,4);assert.ok(EXTERNAL_ARTICLES.every(a=>getProfile(a.source_author_slug)&&!a.author_slug&&!a.reviewer_slug&&a.url.startsWith('https://thirtymentor-mvp.vercel.app/blog/')));
 assert.equal(filterProfiles('조 영빈').length,1);assert.equal(filterProfiles('존재하지않음').length,0);assert.ok(filterProfiles('','세무 · 회계').every(p=>/세무|회계/.test(p.field)));
 assert.ok(PROFILES.every(p=>p.sourceUrl&&!('kakaoName' in p)));
});
test('attribution requires an actual public person, private evidence and a real nonfuture review date',()=>{
 const now=new Date('2026-11-16T18:00:00Z'),base={author_slug:'youngbin-cho',reviewer_slug:'seokho-lee',reviewed_on:'2026-11-17',attribution_note:'작성 원문 및 검토자 공개 회신 확인'};
 assert.equal(attributionInput(base,now).reviewed_on,'2026-11-17');
 for(const patch of [{reviewer_slug:'ryunc-safety'},{author_slug:'unknown'},{attribution_note:''},{reviewed_on:'2026-02-30'},{reviewed_on:'2026-11-18'},{reviewed_on:null}])assert.throws(()=>attributionInput({...base,...patch},now));
 assert.equal(attributionInput({},now).author_slug,null);
});
test('profile and article schemas preserve author/reviewer roles without inventing a person',()=>{
 const p=getProfile('youngbin-cho'),posts=[{id:'a',title:'작성 글',url:'https://example.test/a',author_slug:p.slug},{id:'b',title:'검토 글',url:'https://example.test/b',reviewer_slug:p.slug,reviewed_on:'2026-11-17'}];
 const groups=contributionGroups(p.slug,posts);assert.equal(groups.authored.length,1);assert.equal(groups.reviewed.length,1);
 const schema=profileSchema(p,'https://example.test',posts);assert.equal(schema.mainEntity['@type'],'Person');assert.equal(profileSchema(p,'https://example.test',EXTERNAL_ARTICLES).hasPart.length,0);assert.equal(profileSchema(p,'https://example.test',EXTERNAL_ARTICLES).subjectOf.length,4);assert.equal(schema.hasPart[1].reviewedBy['@id'],schema.mainEntity['@id']);
 assert.equal(profileSchema(getProfile('ryunc-safety'),'https://example.test').mainEntity['@type'],'Organization');
 const article=articleSchema({id:'abc',author_slug:p.slug,reviewer_slug:'seokho-lee',reviewed_on:'2026-11-17'});assert.equal(article[0].author.name,'조영빈');assert.equal(article[1].reviewedBy.name,'이석호');assert.equal(articleSchema({id:'a'})[0].author['@type'],'Organization');
});
const db=new PGlite(),admin='a0000000-0000-4000-8000-000000000001',member='a0000000-0000-4000-8000-000000000002',id='b0000000-0000-4000-8000-000000000001';
before(async()=>{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid primary key);CREATE TABLE profiles(id uuid,role text,is_active boolean);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;CREATE FUNCTION get_current_user_role() RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$SELECT role FROM profiles WHERE id=auth.uid() AND is_active=true$$;GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;INSERT INTO auth.users VALUES('${admin}'),('${member}');INSERT INTO profiles VALUES('${admin}','ADMIN',true),('${member}','MEMBER',true);`);
 await db.exec(await readFile(new URL('../supabase/site_articles_migration.sql',import.meta.url),'utf8'));
 const migration=await readFile(new URL('../supabase/site_article_people_migration.sql',import.meta.url),'utf8');await db.exec(migration);await db.exec(migration);
});
after(()=>db.close());
async function asUser(user,fn,role='authenticated'){await db.exec(`BEGIN;SET LOCAL ROLE ${role}`);await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[user]);try{return await fn();}finally{await db.exec('ROLLBACK');}}
const body='기업이 실제 운영 자료를 확인하며 인증 준비를 진행합니다. '.repeat(8);
const save=(rev,author='youngbin-cho',reviewer='seokho-lee',note='참여 및 이름 공개 확인',date='2026-01-01',title='작성·검토 연결 검증')=>db.query('SELECT * FROM save_site_article_with_people($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',[id,rev,title,body,'안내','주제','비공개 원문',false,author,reviewer,note,date]);
test('attribution saves/reloads, is published atomically, retains old public version, and disappears on withdrawal',async()=>{
 await asUser(admin,async()=>{
  const saved=(await save(0)).rows[0];assert.equal(saved.author_slug,'youngbin-cho');assert.equal(saved.revision,1);
  assert.equal((await db.query('SELECT reviewer_slug FROM site_article_drafts WHERE id=$1',[id])).rows[0].reviewer_slug,'seokho-lee');
  await db.query('SELECT publish_site_article($1,1,true)',[id]);
  await save(2,'seokho-lee',null,'새 작성자 확인',null,'수정본');
  let row=(await db.query('SELECT * FROM site_articles')).rows[0];assert.equal(row.author_slug,'youngbin-cho');assert.equal(row.reviewer_slug,'seokho-lee');assert.ok(!('attribution_note' in row));assert.ok(!('source_notes' in row));
  await db.query('SELECT publish_site_article($1,3,true)',[id]);
  await db.exec('SET LOCAL ROLE anon');row=(await db.query('SELECT * FROM site_articles')).rows[0];assert.equal(row.author_slug,'seokho-lee');assert.equal(row.reviewer_slug,null);
  await db.exec('SET LOCAL ROLE authenticated');await db.query('SELECT publish_site_article($1,4,false)',[id]);assert.equal((await db.query('SELECT * FROM site_articles')).rows.length,0);assert.equal((await db.query('SELECT * FROM site_article_drafts')).rows.length,1);
 });
});
test('legacy content changes clear attribution while a public snapshot stays unchanged',async()=>{
 await asUser(admin,async()=>{await save(0);await db.query('SELECT publish_site_article($1,1,true)',[id]);await db.query('SELECT save_site_article($1,2,$2,$3,$4,$5,$6,false)',[id,'변경된 제목',body,'안내','주제','비공개 원문']);const d=(await db.query('SELECT * FROM site_article_drafts')).rows[0];assert.equal(d.author_slug,null);assert.equal(d.reviewer_slug,null);assert.equal(d.attribution_note,'');assert.equal((await db.query('SELECT reviewer_slug FROM site_articles')).rows[0].reviewer_slug,'seokho-lee');});
});
test('anonymous, member, inactive admin, stale revision and invalid attribution are rejected',async()=>{
 await asUser('',()=>assert.rejects(save(0),e=>e.code==='42501'),'anon');await asUser(member,()=>assert.rejects(save(0),e=>e.code==='42501'));
 await db.query('UPDATE profiles SET is_active=false WHERE id=$1',[admin]);await asUser(admin,()=>assert.rejects(save(0),e=>e.code==='42501'));await db.query('UPDATE profiles SET is_active=true WHERE id=$1',[admin]);
 for(const args of [[0,'unknown'],[0,'youngbin-cho','ryunc-safety'],[0,'youngbin-cho','seokho-lee',''],[0,'youngbin-cho','seokho-lee','근거','2999-01-01']])await asUser(admin,()=>assert.rejects(save(...args),e=>e.code==='22023'));
 await asUser(admin,async()=>{await save(0);await assert.rejects(save(99),e=>e.code==='40001');});
});
