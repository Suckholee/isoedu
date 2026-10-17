import {readFile,writeFile,mkdir,stat,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,copyFile,rm} from 'node:fs/promises';
const run=promisify(execFile),pending=new Map();
let queue=Promise.resolve();
const OFFICE_FORMATS=new Set(['DOC','DOCX','XLS','XLSX','PPT','PPTX','ODT','ODS','ODP','RTF','CSV']);
async function convertOffice(file,root,sourceHash){
 const work=await mkdtemp(path.join(os.tmpdir(),'isoedu-preview-'));
 try{
  const input=path.join(work,'document.'+file.format.toLowerCase());await copyFile(file.sourcePath,input);
  const executable=process.env.ISOEDU_SOFFICE||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/soffice');
  await mkdir(root,{recursive:true});const fontConfig=path.join(work,'fonts.conf');await writeFile(fontConfig,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>/Library/Fonts</dir><dir>/System/Library/Fonts</dir><dir>/System/Library/Fonts/Supplemental</dir><cachedir>${root}/font-cache</cachedir><alias><family>sans-serif</family><prefer><family>Arial Unicode MS</family></prefer></alias></fontconfig>`);
  const exportFormat=['XLS','XLSX'].includes(file.format)?'pdf:calc_pdf_Export:{"SinglePageSheets":{"type":"boolean","value":"true"}}':'pdf';
  await run(executable,['--headless','--convert-to',exportFormat,'--outdir',work,input],{timeout:90000,maxBuffer:1024*1024,env:{...process.env,FONTCONFIG_FILE:fontConfig}});
  const bytes=await readFile(path.join(work,'document.pdf'));if(bytes.subarray(0,5).toString()!=='%PDF-')throw Error('invalid pdf');
  await mkdir(root,{recursive:true});const temp=path.join(root,sourceHash+'.'+randomUUID()+'.tmp');await writeFile(temp,bytes);await rename(temp,path.join(root,sourceHash+'.pdf'));
  await writeFile(path.join(root,sourceHash+'.json'),JSON.stringify({sourceHash,sourceId:file.id,renderer:'LibreOffice PDF export',createdAt:new Date().toISOString(),bytes:bytes.length}));
 }catch{throw Error('원문 변환을 완료하지 못했습니다. 암호화·손상 여부와 변환 도구 설치를 확인해 주세요.');}
 finally{await rm(work,{recursive:true,force:true});}
}

// Only a preview tied to the exact source bytes may be shown as its original layout.
export async function documentPreview(file,root=path.join(process.cwd(),'data/client-drive/previews')) {
 const sourceHash=createHash('sha256').update(await readFile(file.sourcePath)).digest('hex');
 const target=path.join(root,sourceHash+'.pdf');
 try{const data=await readFile(target);if(data.subarray(0,5).toString()!=='%PDF-')throw Error();return {sourcePath:target,format:'PDF',name:file.name+'.pdf'};}
 catch{
  const markup=['HWP','HWPX'].includes(file.format),extension=markup?'html':'pdf';
  if(!markup&&!OFFICE_FORMATS.has(file.format))throw Error('지원하지 않는 원문 미리보기 형식입니다.');
  const output=path.join(root,sourceHash+'.'+extension);
  if(markup){try{await stat(output);return {sourcePath:output,format:'HTML',name:file.name+'.html'};}catch{}}
  const key=root+sourceHash;let job=pending.get(key);if(!job){job=queue.catch(()=>{}).then(async()=>{
    if(!markup)return convertOffice(file,root,sourceHash);
    await mkdir(root,{recursive:true});const temporary=output+'.'+randomUUID()+'.tmp';
    try{if(file.format==='HWP'){try{await run(process.execPath,[path.join(process.cwd(),'scripts/render-hwp-preview.cjs'),file.sourcePath,temporary],{timeout:90000,maxBuffer:32*1024*1024});}catch{await run(process.env.ISOEDU_PYTHON||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'),[path.join(process.cwd(),'scripts/render-hwp-fallback.py'),file.sourcePath,temporary],{timeout:90000,maxBuffer:4*1024*1024});}}
    else await run(process.env.ISOEDU_PYTHON||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'),[path.join(process.cwd(),'scripts/render-hwpx-preview.py'),file.sourcePath,temporary],{timeout:60000,maxBuffer:1024*1024});
    await rename(temporary,output);}catch{await rm(temporary,{force:true});throw Error('원문을 변환하지 못했습니다. 암호화·손상 여부를 확인해 주세요.');}
  });queue=job;pending.set(key,job);job.finally(()=>pending.delete(key)).catch(()=>{});}
  await job;return {sourcePath:output,format:markup?'HTML':'PDF',name:file.name+'.'+extension};
 }
}
export async function registerDocumentPreview(file,pdf,root=path.join(process.cwd(),'data/client-drive/previews')) {
 const bytes=await readFile(pdf);if(bytes.subarray(0,5).toString()!=='%PDF-')throw Error('PDF 파일이 아닙니다.');
 const sourceHash=createHash('sha256').update(await readFile(file.sourcePath)).digest('hex');
 await mkdir(root,{recursive:true});const dest=path.join(root,sourceHash+'.pdf'),temp=dest+'.'+randomUUID()+'.tmp';await writeFile(temp,bytes);await rename(temp,dest);
 await writeFile(path.join(root,sourceHash+'.json'),JSON.stringify({sourceHash,sourceId:file.id,renderer:'Hancom Office PDF export',createdAt:new Date().toISOString(),bytes:(await stat(dest)).size},null,2));return dest;
}
