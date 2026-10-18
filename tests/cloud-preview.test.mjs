import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {decodeCloudPreview} from '../src/lib/cloudPreview.mjs';
test('compressed transport preserves Korean document text, tables and embedded image bytes',async()=>{
 const html='<html><style>td{border:1px solid}</style><table><tr><td>미래석건 사업계획서</td></tr></table><img src="data:image/png;base64,aGVsbG8="></html>';
 assert.equal(await decodeCloudPreview(gzipSync(Buffer.from(html)).toString('base64'),'gzip-base64'),html);
});
test('existing uncompressed previews remain readable',async()=>assert.equal(await decodeCloudPreview('<p>원문</p>'),'<p>원문</p>'));
test('invalid and unknown preview encodings fail instead of displaying corrupted content',async()=>{
 await assert.rejects(decodeCloudPreview('invalid%%','gzip-base64'));
 await assert.rejects(decodeCloudPreview('content','unknown'));
});
