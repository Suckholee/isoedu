import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultFileTarget,vaultRange} from '../src/lib/vaultFileRequest.mjs';
test('authenticated file proxy binds company/document paths and rejects traversal',()=>{
 const path='companies/20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000001/자료 원본.pdf';
 assert.equal(vaultFileTarget(path).documentId,'30000000-0000-4000-8000-000000000001');
 for(const p of [null,'local/file','companies/x/y/a.pdf',path+'/../secret',path+'\\other',path+'\n'])assert.equal(vaultFileTarget(p),null);
 assert.equal(vaultRange('bytes=0-1023'),'bytes=0-1023');assert.equal(vaultRange('bytes=-100'),'bytes=-100');assert.equal(vaultRange('bytes=0-'),'bytes=0-');assert.equal(vaultRange('bytes=-'),null);assert.equal(vaultRange('bytes=0-1,4-5'),null);
});

import {createVaultFileHandler} from '../src/lib/vaultFileHandler.mjs';
const file='companies/20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000001/file.pdf';
function client({user=true,document=true}={}){const query={select(){return query;},eq(){return query;},async single(){return {data:document?{id:'doc'}:null};}};return {auth:{getUser:async()=>({data:{user:user?{id:'u'}:null}}),getSession:async()=>({data:{session:{access_token:'test-session-only'}}})},from:()=>query};}
const config={url:'https://example.supabase.co',key:'test-public-key'};
test('file proxy checks current membership for each request and never fetches revoked files',async()=>{
 let called=0;
 const handler=createVaultFileHandler({getClient:()=>client({document:false}),config,fetcher:async()=>{called++;}});
 const response=await handler(new Request('https://app.test/api/vault-file?path='+encodeURIComponent(file)));
 assert.equal(response.status,404);assert.equal(called,0);assert.equal(response.headers.get('cache-control'),'private, no-store');
 const anon=createVaultFileHandler({getClient:()=>client({user:false}),config,fetcher:async()=>{called++;}});
 assert.equal((await anon(new Request('https://app.test/api/vault-file?path='+encodeURIComponent(file)))).status,401);assert.equal(called,0);
});
test('file proxy preserves PDF range streaming and never returns the upstream bearer credential',async()=>{
 let called=0;
 const handler=createVaultFileHandler({getClient:()=>client(),config,fetcher:async(url,init)=>{
  called++;assert.match(url,/storage\/v1\/object\/iso-vault\/companies\//);assert.equal(init.headers.Range,'bytes=0-3');assert.equal(init.headers.Authorization,'Bearer test-session-only');assert.equal(init.cache,'no-store');
  return new Response('PDF!',{status:206,headers:{'content-type':'application/pdf','content-range':'bytes 0-3/100','accept-ranges':'bytes','content-length':'4'}});
 }});
 const response=await handler(new Request('https://app.test/api/vault-file?path='+encodeURIComponent(file),{headers:{Range:'bytes=0-3'}}));
 assert.equal(response.status,206);assert.equal(await response.text(),'PDF!');assert.equal(response.headers.get('content-range'),'bytes 0-3/100');assert.equal(response.headers.get('authorization'),null);assert.equal(called,1);
});
