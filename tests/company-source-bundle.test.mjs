import test from 'node:test';import assert from 'node:assert/strict';
import {validateSourceBundle,serveSourceBundle,SOURCE_PART_BYTES} from '../src/lib/venture/sourceBundle.mjs';
const companyId='20000000-0000-4000-8000-000000000001',documentId='30000000-0000-4000-8000-000000000001';const target={companyId,documentId};const prefix=`companies/${companyId}/${documentId}/`;const bundle={version:1,size:SOURCE_PART_BYTES+4,partSize:SOURCE_PART_BYTES,contentType:'application/pdf',fileName:'원본.pdf',originalPath:prefix+'source-original/original.pdf',parts:[{path:prefix+'source-original/part-00000',size:SOURCE_PART_BYTES,sha256:'a'.repeat(64)},{path:prefix+'source-original/part-00001',size:4,sha256:'b'.repeat(64)}]};
test('company originals reject foreign document chunks and incomplete manifests',()=>{
 assert.equal(validateSourceBundle(bundle,target).parts[1].start,SOURCE_PART_BYTES);
 assert.throws(()=>validateSourceBundle({...bundle,parts:[{...bundle.parts[0],path:'companies/other/doc/file'},bundle.parts[1]]},target));
 assert.throws(()=>validateSourceBundle({...bundle,parts:bundle.parts.slice(0,1)},target));
 assert.throws(()=>validateSourceBundle({...bundle,size:501*1024**2},target));
});
test('download spanning a chunk boundary preserves exact requested bytes and length',async()=>{
 const calls=[];const response=await serveSourceBundle({bundle,target,request:new Request('https://app.test/file',{headers:{Range:`bytes=${SOURCE_PART_BYTES-2}-${SOURCE_PART_BYTES+1}`}}),headers:{'Cache-Control':'private, no-store'},fetchPart:async(path,range)=>{calls.push(range);return new Response(path.endsWith('00000')?'AB':'CD',{status:206});}});
 assert.equal(response.status,206);assert.equal(response.headers.get('Content-Length'),'4');assert.equal(await response.text(),'ABCD');assert.deepEqual(calls,[`bytes=${SOURCE_PART_BYTES-2}-${SOURCE_PART_BYTES-1}`,'bytes=0-1']);
});
test('out of range requests fetch nothing and missing chunks fail the body',async()=>{
 let calls=0;const opts={bundle,target,headers:{},fetchPart:async()=>{calls++;return new Response('',{status:404});}};
 const invalid=await serveSourceBundle({...opts,request:new Request('https://app.test/file',{headers:{Range:'bytes=999999999-'}})});assert.equal(invalid.status,416);assert.equal(calls,0);
 const missing=await serveSourceBundle({...opts,request:new Request('https://app.test/file',{headers:{Range:'bytes=0-2'}})});await assert.rejects(()=>missing.arrayBuffer());
});
