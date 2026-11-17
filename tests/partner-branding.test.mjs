import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {brandingDefaults,brandingInput,publishedBranding,publicLink,brandingProfile} from '../src/lib/people/branding.mjs';
import {getProfile,profileSchema} from '../src/lib/people/model.mjs';
import {parseYoutubeFeed,youtubeFeed,instagramFeed} from '../src/lib/people/social.mjs';
import {validPlatformPath} from '../src/lib/platformRoutes.mjs';
const base=()=>({...brandingDefaults('youngbin-cho'),publicationNote:'본인 소개와 고객사 공개 승인 확인',clients:[{id:'public-client',name:'공개 동의 고객사',summary:'검증용 공개 사례',url:'https://example.com/',isPublic:true},{id:'private-client',name:'비공개 고객사',summary:'비공개 계약',url:'',isPublic:false}],work:[{id:'work',title:'공개 작업',client:'공개 동의 고객사',period:'2026',role:'담당',description:'확인한 작업 내용',url:'',isPublic:true}]});
test('branding publishes only explicitly public history and safe channel identities',()=>{
 const content=publishedBranding(base());assert.equal(content.clients.length,1);assert.equal(content.work.length,1);assert.ok(!JSON.stringify(content).includes('비공개'));assert.ok(!('publicationNote'in content));assert.ok(!('isPublic'in content.work[0]));
 for(const url of ['javascript:alert(1)','http://example.com','https://user:pass@example.com/'])assert.throws(()=>publicLink(url));
 for(const url of ['https://instagram.com.evil.test/person','https://www.instagram.com/p/abc/','https://youtube.com/watch?v=abc'])assert.throws(()=>publicLink(url,url.includes('youtube')?'youtube':'instagram'));
 assert.throws(()=>brandingInput({...base(),youtubeChannelId:'UCaaaaaaaaaaaaaaaaaaaaaa'}));
 assert.throws(()=>brandingInput({...base(),clients:[{...base().clients[0],isPublic:'true'}]}));
 assert.throws(()=>brandingInput({...base(),services:Array(13).fill('분야')}));
 const schema=profileSchema(brandingProfile(getProfile('youngbin-cho'),content),'https://example.test');assert.ok(schema.mainEntity.sameAs.includes(content.links.instagram));assert.equal(schema.mainEntity.description,content.about);
 assert.equal(validPlatformPath('admin',['partners']),true);
});
const channel='UC4bv_sw6JudKORw7lbLxe6w',xml=`<feed><yt:channelId>${channel}</yt:channelId><entry><yt:channelId>${channel}</yt:channelId><yt:videoId>aBcDeF12345</yt:videoId><title>공개 영상</title><published>2026-01-01T00:00:00Z</published></entry></feed>`;
test('YouTube feeds verify ownership, dates, safe links and bounded fetches',async()=>{
 const shortFeed=xml.replace(`<yt:channelId>${channel}</yt:channelId>`,`<yt:channelId>${channel.slice(2)}</yt:channelId><author><uri>https://www.youtube.com/channel/${channel}</uri></author>`);
 assert.equal(parseYoutubeFeed(shortFeed,channel).length,1);
 assert.throws(()=>parseYoutubeFeed(shortFeed.replace('https://www.youtube.com/channel/','https://evil.test/channel/'),channel));
 const posts=parseYoutubeFeed(xml,channel);assert.equal(posts.length,1);assert.equal(posts[0].url,'https://www.youtube.com/watch?v=aBcDeF12345');
 assert.throws(()=>parseYoutubeFeed(xml,'UCaaaaaaaaaaaaaaaaaaaaaa'));
 assert.throws(()=>parseYoutubeFeed('<!DOCTYPE root>'+xml,channel));
 assert.equal(parseYoutubeFeed(xml.replace('2026-01-01','2999-01-01'),channel).length,0);
 let requested;const result=await youtubeFeed(base(),async(url,options)=>{requested=url;assert.equal(options.redirect,'error');return new Response(xml);});assert.match(requested,/^https:\/\/www\.youtube\.com\/feeds\/videos.xml\?channel_id=UC/);assert.equal(result.items.length,1);
 await assert.rejects(youtubeFeed(base(),async()=>new Response('x'.repeat(1_000_001))));
 assert.equal((await youtubeFeed({...base(),youtubeChannelId:''})).status,'needs_channel');
});
test('Instagram requires authorization and a matching account, never exposes access tokens',async()=>{
 assert.equal((await instagramFeed('youngbin-cho',base(),{env:{}})).status,'needs_connection');
 const env={INSTAGRAM_GRAPH_VERSION:'v27.0',PARTNER_INSTAGRAM_CONNECTIONS:JSON.stringify({'youngbin-cho':{userId:'123456789',accessToken:'test-token-do-not-expose-12345'}})};
 let calls=0;const result=await instagramFeed('youngbin-cho',base(),{env,fetchImpl:async(url,options)=>{calls++;assert.ok(!url.includes('test-token'));assert.match(options.headers.Authorization,/^Bearer /);return Response.json(calls===1?{user_id:'123456789',username:'honestone_kevin'}:{data:[{id:'1',permalink:'https://www.instagram.com/p/ABC123/',caption:'공개 게시물',media_url:'https://scontent.cdninstagram.com/photo.jpg',timestamp:'2026-01-01T00:00:00Z'},{id:'2',permalink:'javascript:alert(1)',timestamp:'2026-01-01T00:00:00Z'}]});}});
 assert.equal(result.items.length,1);assert.ok(!JSON.stringify(result).includes('test-token'));
 calls=0;await assert.rejects(instagramFeed('youngbin-cho',base(),{env,fetchImpl:async()=>{calls++;return Response.json({user_id:'123456789',username:'someone_else'});}}));assert.equal(calls,1);
});
const db=new PGlite(),admin='a0000000-0000-4000-8000-000000000001',member='a0000000-0000-4000-8000-000000000002';
before(async()=>{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid primary key);CREATE TABLE profiles(id uuid,role text,is_active boolean);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;CREATE FUNCTION get_current_user_role() RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$SELECT role FROM profiles WHERE id=auth.uid() AND is_active=true$$;GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;INSERT INTO auth.users VALUES('${admin}'),('${member}');INSERT INTO profiles VALUES('${admin}','ADMIN',true),('${member}','MEMBER',true);`);
 for(const file of ['site_articles_migration.sql','site_article_people_migration.sql','partner_branding_migration.sql','partner_branding_migration.sql'])await db.exec(await readFile(new URL('../supabase/'+file,import.meta.url),'utf8'));
});
after(()=>db.close());
async function asUser(user,fn,role='authenticated'){await db.exec(`BEGIN;SET LOCAL ROLE ${role}`);await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[user]);try{return await fn();}finally{await db.exec('ROLLBACK');}}
const save=(revision,content=base())=>db.query('SELECT * FROM save_partner_profile($1,$2,$3::jsonb)',['youngbin-cho',revision,JSON.stringify(content)]);
test('admin save, reload, publish snapshot, revision conflict, history and withdrawal are atomic',async()=>{
 await asUser(admin,async()=>{
  assert.equal((await save(0)).rows[0].revision,1);assert.equal((await db.query('SELECT * FROM partner_profile_drafts')).rows[0].content.clients.length,2);
  await db.query("SELECT publish_partner_profile('youngbin-cho',1,true)");
  let published=(await db.query('SELECT content FROM partner_profiles')).rows[0].content;assert.equal(published.clients.length,1);assert.equal(published.publicationNote,undefined);
  await db.exec('SET LOCAL ROLE anon');assert.equal((await db.query('SELECT content FROM partner_profiles')).rows[0].content.clients.length,1);await db.exec('SET LOCAL ROLE authenticated');
  await save(2,{...base(),headline:'수정 중 소개'});published=(await db.query('SELECT content FROM partner_profiles')).rows[0].content;assert.notEqual(published.headline,'수정 중 소개');
  assert.equal((await db.query('SELECT * FROM partner_profile_revisions')).rows.length,3);
  await db.query("SELECT publish_partner_profile('youngbin-cho',3,false)");assert.equal((await db.query('SELECT * FROM partner_profiles')).rows.length,0);assert.equal((await db.query('SELECT * FROM partner_profile_drafts')).rows.length,1);
 });
 await asUser(admin,async()=>{await save(0);await assert.rejects(save(9),e=>e.code==='40001');});
});
test('RLS denies anonymous/member edits, private drafts, inactive admins, direct writes and unsafe publications',async()=>{
 await asUser('',()=>assert.rejects(save(0),e=>e.code==='42501'),'anon');await asUser(member,()=>assert.rejects(save(0),e=>e.code==='42501'));
 await asUser(member,async()=>assert.equal((await db.query('SELECT * FROM partner_profile_drafts')).rows.length,0));
 await asUser('',()=>assert.rejects(db.query('SELECT * FROM partner_profile_drafts'),e=>e.code==='42501'),'anon');
 await asUser(admin,()=>assert.rejects(db.query("INSERT INTO partner_profiles(slug,content) VALUES('youngbin-cho','{}')"),e=>e.code==='42501'));
 await db.query('UPDATE profiles SET is_active=false WHERE id=$1',[admin]);await asUser(admin,()=>assert.rejects(save(0),e=>e.code==='42501'));await db.query('UPDATE profiles SET is_active=true WHERE id=$1',[admin]);
 await asUser(admin,async()=>{await save(0,{...base(),publicationNote:''});await assert.rejects(db.query("SELECT publish_partner_profile('youngbin-cho',1,true)"),e=>e.code==='22023');});
 for(const c of [{...base(),links:{...base().links,website:'javascript:alert(1)'}},{...base(),clients:[{...base().clients[0],isPublic:null}]},{...base(),services:null}])await asUser(admin,()=>assert.rejects(save(0,c),e=>e.code==='22023'));
});
