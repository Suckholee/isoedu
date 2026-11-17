import {mkdtemp,writeFile,readFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir,homedir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {VentureError} from '../venture/generation.mjs';
const run=promisify(execFile);
export async function renderSourcePdf(bytes,format){
  const ext=String(format).toLowerCase();
  if(!['hwp','hwpx','doc','docx','pptx','xlsx','txt','md','csv'].includes(ext))throw new VentureError('이 형식의 페이지 변환을 지원하지 않습니다.');
  const work=await mkdtemp(path.join(tmpdir(),'honestone-vision-'));
  try{
    const input=path.join(work,'document.'+(ext==='md'?'txt':ext)),output=path.join(work,'document.pdf');
    await writeFile(input,bytes);
    if(process.env.ISOEDU_DOCUMENT_CONVERTER){
      await run(process.env.ISOEDU_DOCUMENT_CONVERTER,[input,output],{timeout:90000,maxBuffer:1024*1024});
    }else{
      if(['hwp','hwpx'].includes(ext))throw Error('Native Hancom converter required');
      const fontConfig=path.join(work,'fonts.conf');
      const fontDir=path.resolve('node_modules/@ohah/hwpjs/fonts').replaceAll('&','&amp;');
      await writeFile(fontConfig,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${fontDir}</dir><dir>/Library/Fonts</dir><dir>/System/Library/Fonts</dir><dir>/System/Library/Fonts/Supplemental</dir><dir>/usr/share/fonts</dir><cachedir>${work}/font-cache</cachedir><alias><family>sans-serif</family><prefer><family>Noto Sans KR</family></prefer></alias><alias><family>serif</family><prefer><family>Noto Sans KR</family></prefer></alias></fontconfig>`);
      const profile=path.join(work,'profile');await mkdir(path.join(profile,'user'),{recursive:true});
      await writeFile(path.join(profile,'user','registrymodifications.xcu'),`<?xml version="1.0"?><oor:items xmlns:oor="http://openoffice.org/2001/registry"><item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop></item></oor:items>`);
      const executable=process.env.ISOEDU_SOFFICE||path.join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/soffice');
      await run(executable,[`-env:UserInstallation=${pathToFileURL(profile)}`,'--headless','--norestore','--convert-to','pdf','--outdir',work,input],{timeout:90000,maxBuffer:1024*1024,env:{...process.env,FONTCONFIG_FILE:fontConfig}});
    }
    const pdf=await readFile(output);
    if(pdf.subarray(0,5).toString()!=='%PDF-'||pdf.length>100*1024*1024)throw Error('invalid output');
    return pdf;
  }catch{throw new VentureError(`${format} 페이지를 변환하지 못했습니다. 서버 변환 도구와 글꼴을 확인하거나 같은 문서를 PDF로 내보내 추가해 주세요. 원본은 보존됩니다.`,503);}
  finally{await rm(work,{recursive:true,force:true});}
}
