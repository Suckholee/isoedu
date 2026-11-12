// Browser-only reader. PDF byte ranges and seekable ZIP entries avoid a full-file copy.
const MAX_UNITS=2000,MAX_XML=20*1024*1024;
const textNodes=node=>[...node.getElementsByTagName('*')].filter(n=>['t','v','val'].includes(n.localName)).map(n=>n.textContent).join(' ');
export function sourceTextChunks(text,limit=18000){
 const result=[];let rest=text;while(rest.length>limit){let end=rest.lastIndexOf('\n',limit);if(end<limit/2)end=limit;result.push(rest.slice(0,end));rest=rest.slice(end).replace(/^\n/,'');}if(rest.trim())result.push(rest);return result;
}
export function officeSourceText(xml){
 const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw Error('문서 XML이 손상되었습니다.');
 function walk(node){if(node.nodeType!==1)return '';
  if(['tbl','table'].includes(node.localName)){
   const rows=[...node.getElementsByTagName('*')].filter(n=>n.localName==='tr').map((row,i)=>{const cells=[...row.children].filter(n=>['tc','td','th'].includes(n.localName));return `${i+1}행 | `+cells.map(cell=>{const span=[...cell.getElementsByTagName('*')].find(n=>n.localName==='gridSpan')?.getAttribute('w:val');return textNodes(cell)+(span?` [${span}열 병합]`:'');}).join(' | ');});return '\n[원문 표: 빈 셀과 행·열 순서를 유지]\n'+rows.join('\n')+'\n';
  }
  if(node.localName==='p')return textNodes(node)+'\n';
  return [...node.children].map(walk).join('');
 }
 return walk(doc.documentElement)||doc.documentElement.textContent;
}
async function jpeg(canvas){const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.88));if(!blob)throw Error('분석 이미지를 만들지 못했습니다.');if(blob.size>4000000)throw Error('분석 이미지가 너무 큽니다.');return blob;}
async function canvasImages(canvas){
 const images=[await jpeg(canvas)];
 if(Math.max(canvas.width,canvas.height)>1800){for(let i=0;i<2;i++){const crop=document.createElement('canvas'),vertical=canvas.height>=canvas.width;crop.width=vertical?canvas.width:Math.ceil(canvas.width/2);crop.height=vertical?Math.ceil(canvas.height/2):canvas.height;crop.getContext('2d').drawImage(canvas,vertical?0:i*Math.floor(canvas.width/2),vertical?i*Math.floor(canvas.height/2):0,crop.width,crop.height,0,0,crop.width,crop.height);images.push(await jpeg(crop));crop.width=crop.height=0;}}
 return images;
}
async function rasterImages(blob){const image=await createImageBitmap(blob);if(image.width*image.height>100000000){image.close();throw Error('1억 화소를 넘는 이미지는 나눠 올려 주세요. 원본은 보관됩니다.');}const scale=Math.min(1,2600/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.ceil(image.width*scale);canvas.height=Math.ceil(image.height*scale);canvas.getContext('2d').fillStyle='white';canvas.getContext('2d').fillRect(0,0,canvas.width,canvas.height);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();try{return await canvasImages(canvas);}finally{canvas.width=canvas.height=0;}}
export async function* readSourceUnits(file,{signal,skipIds=new Set(),onProgress=()=>{}}={}){
 const stop=()=>{if(signal?.aborted)throw new DOMException('준비를 중지했습니다.','AbortError');};
 const ext=file.name.split('.').pop().toLowerCase();let count=0;
 const next=()=>{stop();if(++count>MAX_UNITS)throw Error('파일당 분석 단위가 2,000개를 넘습니다. 파일을 나눠 올려 주세요.');return count;};
 if(ext==='pdf'){
  const pdfjs=await import('pdfjs-dist/build/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc='/document-reader/pdf.worker.min.mjs';
  const initial=new Uint8Array(await file.slice(0,65536).arrayBuffer()),range=new pdfjs.PDFDataRangeTransport(file.size,initial,true,file.name);let destroyed=false;
  range.requestDataRange=(begin,end)=>{file.slice(begin,end).arrayBuffer().then(bytes=>{if(!destroyed)range.onDataRange(begin,new Uint8Array(bytes));}).catch(()=>task.destroy());};range.abort=()=>{destroyed=true;};
  const task=pdfjs.getDocument({range,length:file.size,disableAutoFetch:true,disableStream:true,rangeChunkSize:65536,isEvalSupported:false,cMapUrl:'/document-reader/cmaps/',cMapPacked:true,standardFontDataUrl:'/document-reader/standard_fonts/'});const abort=()=>task.destroy();signal?.addEventListener('abort',abort,{once:true});let pdf;
  try{pdf=await task.promise;if(pdf.numPages>MAX_UNITS)throw Error(`전체 ${pdf.numPages}쪽입니다. 2,000쪽 이하로 파일을 나눠 주세요.`);
   for(let n=1;n<=pdf.numPages;n++){stop();onProgress(`${n}/${pdf.numPages}쪽 준비`);
    const page=await pdf.getPage(n),native=await page.getTextContent();let text='',y;
    for(const item of native.items){if(!('str'in item))continue;text+=(y!==undefined&&Math.abs(y-item.transform[5])>4?'\n':' ')+item.str;y=item.transform[5];if(item.hasEOL){text+='\n';y=undefined;}}
    const chunks=sourceTextChunks(text);if(!chunks.length)chunks.push('');
    for(let part=0;part<chunks.length;part++){
     const id=next(),location=`${n}쪽${chunks.length>1?` · 본문 ${part+1}/${chunks.length}구간`:''}`;
     if(skipIds.has(id)){yield {id,skip:true,location};continue;}
     let images=[];
     if(part===0){const viewport=page.getViewport({scale:Math.min(3,2600/Math.max(page.view[2]-page.view[0],page.view[3]-page.view[1]))}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;stop();images=await canvasImages(canvas);canvas.width=canvas.height=0;}
     yield {id,location,text:chunks[part],images};
    }
    page.cleanup();
   }
  }finally{destroyed=true;signal?.removeEventListener('abort',abort);await pdf?.destroy().catch(()=>{});if(!pdf)await task.destroy().catch(()=>{});}return;
 }
 if(['png','jpg','jpeg'].includes(ext)){const id=next();yield skipIds.has(id)?{id,skip:true,location:'이미지 원문'}:{id,location:'이미지 원문',text:'이미지의 문구·표·그래프를 원문대로 읽어 주세요.',images:await rasterImages(file)};return;}
 if(['txt','md','csv','doc'].includes(ext)){
  if(file.size>50*1024*1024)throw Error('대용량 텍스트·구형 DOC는 여러 파일 또는 PDF로 나눠 올려 주세요. 원본 보관은 완료되었습니다.');let text=await file.text();
  if(ext==='doc'){if(!/^\s*(?:<!doctype|<html|<meta|<\?xml)/i.test(text))throw Error('구형 바이너리 DOC는 PDF·DOCX로 변환해 추가해 주세요. 원본은 보관됩니다.');const doc=new DOMParser().parseFromString(text,'text/html');doc.querySelectorAll('script,style').forEach(n=>n.remove());text=doc.body.innerText||doc.body.textContent;}
  const chunks=sourceTextChunks(text);for(let i=0;i<chunks.length;i++){const id=next();yield {id,location:`본문 ${i+1}/${chunks.length}구간`,text:chunks[i],images:[]};}return;
 }
 if(ext==='hwp'){
  if(file.size>100*1024*1024)throw Error('100MB가 넘는 구형 HWP는 PDF로 변환해 추가해 주세요. 원본은 보관됩니다.');
  const {hwpUnits}=await import('../meeting/readDocumentDates.mjs'),warnings=[],bytes=new Uint8Array(await file.arrayBuffer()),units=await hwpUnits(bytes,warnings);
  for(const u of units)for(const text of sourceTextChunks(u.text)){const id=next();yield {id,location:u.location,text,images:[]};}
  const CFB=await import('cfb'),container=CFB.read(bytes,{type:'array'});
  for(let i=0;i<container.FileIndex.length;i++)if(/\/BinData\/.*\.(?:png|jpe?g)$/i.test(container.FullPaths[i])){const id=next(),location=container.FullPaths[i];if(skipIds.has(id)){yield {id,skip:true,location};continue;}let imageBytes=Uint8Array.from(container.FileIndex[i].content),images;try{images=await rasterImages(new Blob([imageBytes]));}catch{const {inflateSync}=await import('fflate');try{imageBytes=inflateSync(imageBytes,{out:new Uint8Array(16000000)});images=await rasterImages(new Blob([imageBytes]));}catch{throw Error('HWP 삽입 이미지를 읽지 못했습니다. 원문을 PDF로 변환해 추가해 주세요.');}}yield {id,location,text:'HWP 삽입 이미지 · 문서 본문과 함께 확인',images};}
  return;
 }
 if(!['docx','hwpx','pptx','xlsx'].includes(ext))throw Error('이 형식은 PDF로 변환해 올려 주세요.');
 const {ZipReader,BlobReader}=await import('@zip.js/zip.js');const zip=new ZipReader(new BlobReader(file),{useWebWorkers:false,checkSignature:true});
 try{const entries=await zip.getEntries();if(entries.length>50000)throw Error('압축 내부 항목이 너무 많습니다. 문서를 나눠 주세요.');
  const getBlob=async(entry,max)=>{stop();if(entry.encrypted)throw Error('암호화된 문서는 암호를 해제해 주세요.');if(entry.uncompressedSize>max)throw Error('문서 내부 항목이 너무 큽니다. PDF로 변환해 주세요.');let size=0;const chunks=[];await entry.getData(new WritableStream({write(chunk){stop();size+=chunk.byteLength;if(size>max)throw Error('문서 내부 크기가 허용 범위를 넘었습니다.');chunks.push(chunk);}}),{useWebWorkers:false,checkSignature:true});return new Blob(chunks);};
  const getText=async entry=>(await getBlob(entry,MAX_XML)).text();
  let shared=[];if(ext==='xlsx'){const entry=entries.find(e=>e.filename==='xl/sharedStrings.xml');if(entry){const doc=new DOMParser().parseFromString(await getText(entry),'application/xml');shared=[...doc.getElementsByTagName('si')].map(e=>e.textContent);}}
  const bodies=entries.filter(e=>ext==='docx'?/^word\/(document|header\d+|footer\d+|diagrams\/data\d+)\.xml$/.test(e.filename):ext==='hwpx'?/^Contents\/section\d+\.xml$/.test(e.filename):ext==='pptx'?/^ppt\/slides\/slide\d+\.xml$/.test(e.filename):/^xl\/worksheets\/sheet\d+\.xml$/.test(e.filename)).sort((a,b)=>a.filename.localeCompare(b.filename,undefined,{numeric:true}));
  for(const entry of bodies){onProgress(entry.filename+' 읽는 중');const xml=await getText(entry);let text;
   if(ext==='xlsx'){const doc=new DOMParser().parseFromString(xml,'application/xml');text=[...doc.getElementsByTagName('row')].map(row=>`행 ${row.getAttribute('r')} | `+[...row.getElementsByTagName('c')].map(c=>{const value=c.getElementsByTagName('v')[0]?.textContent||c.getElementsByTagName('is')[0]?.textContent||'';return `${c.getAttribute('r')}: ${c.getAttribute('t')==='s'?shared[Number(value)]||'':value}`;}).join(' | ')).join('\n');const merge=[...doc.getElementsByTagName('mergeCell')].map(e=>e.getAttribute('ref'));if(merge.length)text+='\n병합 셀: '+merge.join(', ');}
   else text=officeSourceText(xml);
   const chunks=sourceTextChunks(text);for(let n=0;n<chunks.length;n++){const id=next();yield {id,location:`${entry.filename} · ${n+1}/${chunks.length}구간`,text:chunks[n],images:[]};}
  }
  for(const entry of entries.filter(e=>/^(word|ppt|xl)\/charts\/chart\d+\.xml$/.test(e.filename))){const doc=new DOMParser().parseFromString(await getText(entry),'application/xml');const series=[...doc.getElementsByTagName('*')].filter(n=>n.localName==='ser').map((s,i)=>'계열 '+(i+1)+'\n'+[...s.children].map(n=>n.localName+': '+textNodes(n)).join('\n')).join('\n\n');for(const text of sourceTextChunks('원본 차트 XML의 축·범례·계열 데이터. 숫자는 원문 값입니다.\n'+series)){const id=next();yield {id,location:entry.filename,text,images:[]};}}
  for(const entry of entries.filter(e=>/^(?:word\/media|ppt\/media|xl\/media|BinData)\//.test(e.filename)&&!e.directory)){
   const id=next(),location=entry.filename;onProgress(location+' 준비');if(skipIds.has(id)){yield {id,skip:true,location};continue;}
   if(!/\.(?:png|jpe?g|gif|webp|bmp)$/i.test(entry.filename)){yield {id,location,text:`[확인 필요: ${entry.filename} 삽입 그림 형식은 직접 변환하지 못했습니다. 원본을 PDF로 변환해 함께 확인해야 합니다.]`,images:[]};continue;}
   if(entry.uncompressedSize>50*1024*1024)throw Error('문서 내부 이미지가 50MB를 넘습니다. 이미지를 분리해 올려 주세요.');const blob=await getBlob(entry,50*1024*1024);yield {id,location,text:`삽입 이미지 ${location}. 해당 자료의 본문·표와 함께 원문 대조가 필요합니다.`,images:await rasterImages(blob)};
  }
  if(!count)throw Error('문서에서 읽을 본문이나 이미지를 찾지 못했습니다.');
 }finally{await zip.close();}
}
