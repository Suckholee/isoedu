import {hwpUnits,officeUnits,abortable} from '../meeting/readDocumentDates.mjs';
import {unzipSync,strFromU8} from 'fflate';
export async function readPlanSource(source,{signal,onProgress=()=>{}}={}){
 const check=()=>{if(signal?.aborted)throw new DOMException('읽기를 중지했습니다.','AbortError');};
 const warnings=[],units=[];if(source.text?.trim()){if(source.text.length>60000)throw Error('저장 본문이 60,000자를 넘습니다. 필요한 부분을 별도 자료로 준비해 주세요.');return {id:source.id,updatedAt:source.updatedAt,text:source.text,warnings:['저장된 추출 본문을 사용했습니다. 원본의 표·그림과 대조해 주세요.']};}
 if(!source.originalPath)throw Error('읽을 원본이 없습니다.');
 const url='/api/vault-file?path='+encodeURIComponent(source.originalPath),ext=(source.originalName||source.title).split('.').at(-1).toLowerCase();
 check();let pdf,worker;
 try{
 if(ext==='pdf'){
  const lib=await import('pdfjs-dist/build/pdf.mjs');lib.GlobalWorkerOptions.workerSrc='/document-reader/pdf.worker.min.mjs';
  const task=lib.getDocument({url,withCredentials:true,disableAutoFetch:true,disableStream:true,isEvalSupported:false,cMapUrl:'/document-reader/cmaps/',cMapPacked:true,standardFontDataUrl:'/document-reader/standard_fonts/'});
  const abort=()=>{task.destroy().catch(()=>{});worker?.terminate().catch(()=>{});};signal?.addEventListener('abort',abort,{once:true});
  try{pdf=await abortable(task.promise,signal);if(pdf.numPages>200)throw Error('200쪽을 넘는 자료는 필요한 부분을 별도 PDF로 준비해 주세요. 일부만 읽고 생성하지 않습니다.');
   for(let i=1;i<=pdf.numPages;i++){check();onProgress(`${i}/${pdf.numPages}쪽 읽는 중`);const page=await pdf.getPage(i),native=await page.getTextContent();let y,text='';for(const item of native.items){if(!('str'in item))continue;text+=(y!==undefined&&Math.abs(y-item.transform[5])>4?'\n':' ')+item.str;y=item.transform[5];if(item.hasEOL){text+='\n';y=undefined;}}
    if(text.replace(/\s/g,'').length<40){onProgress(`${i}쪽 스캔 글자 읽는 중`);if(!worker){const {createWorker}=await import('tesseract.js');worker=await createWorker('kor+eng',1,{workerPath:'/document-reader/worker.min.js',corePath:'/document-reader',langPath:'/document-reader',gzip:true,workerBlobURL:false});}check();const v=page.getViewport({scale:Math.min(2,2400/Math.max(page.view[2],page.view[3]))}),canvas=document.createElement('canvas');canvas.width=v.width;canvas.height=v.height;try{await abortable(page.render({canvasContext:canvas.getContext('2d'),viewport:v}).promise,signal);text=(await abortable(worker.recognize(canvas),signal)).data.text;}finally{canvas.width=canvas.height=0;}if(!warnings.includes('스캔 OCR 결과는 원문과 대조해 주세요.'))warnings.push('스캔 OCR 결과는 원문과 대조해 주세요.');}
    units.push({location:`${i}쪽`,text});page.cleanup();if(units.reduce((n,u)=>n+u.text.length,0)>59000)throw Error('자료 본문이 60,000자를 넘습니다. 필요한 부분을 별도 자료로 준비해 주세요.');
   }warnings.push('표의 배치와 그림의 의미는 자동 해석하지 않습니다. 원문을 확인해 주세요.');
  }finally{signal?.removeEventListener('abort',abort);await task.destroy().catch(()=>{});}
 }else{
  if(!source.fileSize||source.fileSize>100*1024*1024)throw Error('이 형식은 100MB까지 읽습니다. PDF로 변환하거나 필요한 부분을 준비해 주세요.');
  const r=await fetch(url,{signal});if(!r.ok)throw Error('원본을 읽지 못했습니다. 권한과 연결을 확인해 주세요.');const bytes=new Uint8Array(await r.arrayBuffer());check();if(bytes.length!==source.fileSize)throw Error('원본 크기가 다릅니다. 다시 불러와 주세요.');
  if(source.sha256){const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(digest!==source.sha256)throw Error('저장된 원본과 파일이 다릅니다.');}
  if(ext==='hwp')units.push(...await hwpUnits(bytes,warnings));
  else if(['docx','hwpx','xlsx'].includes(ext))units.push(...officeUnits(bytes,ext,warnings));
  else if(ext==='pptx'){let total=0;const zip=unzipSync(bytes,{filter:f=>{if(!/^ppt\/slides\/slide\d+\.xml$/.test(f.name))return false;total+=f.originalSize;if(total>12000000)throw Error('슬라이드 본문이 너무 큽니다.');return true;}});for(const name of Object.keys(zip).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))){const doc=new DOMParser().parseFromString(strFromU8(zip[name]),'application/xml');if(doc.querySelector('parsererror'))throw Error('슬라이드 XML을 읽지 못했습니다.');units.push({location:name,text:[...doc.getElementsByTagName('*')].filter(n=>n.localName==='p').map(n=>n.textContent).join('\n')});}warnings.push('슬라이드 본문을 읽었습니다. 삽입 이미지·차트는 원문 대조가 필요합니다.');}
  else if(['txt','md','csv'].includes(ext))units.push({location:'본문',text:new TextDecoder().decode(bytes)});
  else throw Error('이 형식은 PDF·HWP/HWPX·DOCX·PPTX로 변환해 주세요.');
 }
 check();const text=units.map(u=>`[${u.location}]\n${u.text}`).join('\n\n');if(!text.trim()||!units.some(u=>u.text.trim()))throw Error('본문을 읽지 못했습니다. 다른 양식이나 PDF를 선택해 주세요.');if(text.length>60000)throw Error('자료 본문이 60,000자를 넘습니다. 필요한 부분을 별도 자료로 준비해 주세요.');return {id:source.id,updatedAt:source.updatedAt,text,warnings};
 }finally{await worker?.terminate().catch(()=>{});await pdf?.destroy().catch(()=>{});}
}
