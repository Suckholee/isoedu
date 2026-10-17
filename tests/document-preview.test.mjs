import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {registerDocumentPreview,documentPreview} from '../src/lib/documentPreview.mjs';
test('원본 바이트별 PDF 연결, 변경된 원본에 이전 미리보기 사용 금지',async()=>{const root=await mkdtemp(path.join(os.tmpdir(),'iso-preview-'));try{const source=path.join(root,'source.hwp'),pdf=path.join(root,'export.pdf');await writeFile(source,'original');await writeFile(pdf,'%PDF-1.7\nfixture');const file={id:'case-test',name:'test.hwp',sourcePath:source};await assert.rejects(()=>documentPreview(file,root));await registerDocumentPreview(file,pdf,root);const preview=await documentPreview(file,root);assert.equal((await readFile(preview.sourcePath,'utf8')),'%PDF-1.7\nfixture');assert.equal(await readFile(source,'utf8'),'original');await writeFile(source,'changed');await assert.rejects(()=>documentPreview(file,root));await writeFile(pdf,'not pdf');await assert.rejects(()=>registerDocumentPreview(file,pdf,root));}finally{await rm(root,{recursive:true,force:true});}});
