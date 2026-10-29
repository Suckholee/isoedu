// The OCR worker and language models are served locally; document pixels stay in this browser.
export function needsPdfOcr(content,hasRaster=false){const length=content.items.filter(x=>typeof x.str==='string').map(x=>x.str).join('').replace(/\s/g,'').length;return length===0||(length<40&&hasRaster);}
export function ocrWords(data,width,height){
 const words=[];for(const block of data.blocks||[])for(const paragraph of block.paragraphs||[])for(const line of paragraph.lines||[]){const valid=(line.words||[]).filter(w=>typeof w.text==='string'&&w.text.trim()&&w.bbox&&[w.bbox.x0,w.bbox.y0,w.bbox.x1,w.bbox.y1].every(Number.isFinite));
  for(const [i,word] of valid.entries()){const x0=Math.max(0,Math.min(width,word.bbox.x0)),x1=Math.max(0,Math.min(width,word.bbox.x1)),y0=Math.max(0,Math.min(height,word.bbox.y0)),y1=Math.max(0,Math.min(height,word.bbox.y1));if(x1<=x0||y1<=y0)continue;words.push({str:word.text.trim()+' ',x:x0/width,y:y0/height,width:(x1-x0)/width,height:(y1-y0)/height,hasEOL:i===valid.length-1,confidence:Number(word.confidence)||0});}
 }return words;
}
export function createPdfTextService(pdf,{onStatus=()=>{},timeout=120000}={}){
 const jobs=new Map(),attempts=new Map();let disposed=false,workerPromise,queue=Promise.resolve(),currentRender;
 const abort=()=>new DOMException('문서를 닫아 인식을 중지했습니다.','AbortError');
 let rejectStop;const stopped=new Promise((_,reject)=>{rejectStop=reject;});stopped.catch(()=>{});
 const status=(number,state,extra={})=>{if(!disposed)onStatus(number,{state,attempt:attempts.get(number)||0,...extra});};
 async function worker(){if(!workerPromise){const pending=(async()=>{const {createWorker}=await import('tesseract.js');if(disposed)throw abort();const instance=await createWorker('kor+eng',1,{workerPath:'/document-reader/worker.min.js',corePath:'/document-reader',langPath:'/document-reader',gzip:true,workerBlobURL:false});if(disposed){await instance.terminate();throw abort();}return instance;})().catch(e=>{if(workerPromise===pending)workerPromise=null;throw e;});workerPromise=pending;}return workerPromise;}
 async function recognize(page,number){if(disposed)throw abort();status(number,'ocr');let canvas,timer,renderTask;const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{const pending=workerPromise;workerPromise=null;pending?.then(w=>w.terminate()).catch(()=>{});reject(Error('글자 인식 시간이 초과되었습니다. 다시 인식해 주세요.'));},timeout);});
  try{const base=page.getViewport({scale:1}),scale=Math.min(3,2600/Math.max(base.width,base.height),Math.sqrt(6000000/(base.width*base.height))),viewport=page.getViewport({scale});canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport});currentRender=renderTask;await Promise.race([renderTask.promise,stopped,deadline]);currentRender=null;if(disposed)throw abort();
   const instance=await Promise.race([worker(),stopped,deadline]);if(disposed)throw abort();const result=await Promise.race([instance.recognize(canvas,{}, {text:true,blocks:true}),stopped,deadline]);if(disposed)throw abort();const words=ocrWords(result.data,canvas.width,canvas.height);
   if(result.data.text?.trim()&&!words.length)throw Error('글자는 읽었지만 위치를 확인하지 못했습니다. 다시 인식해 주세요.');
   return {method:'ocr',words,content:{items:words.map(w=>({str:w.str}))},confidence:Number(result.data.confidence)||0};
  }finally{clearTimeout(timer);renderTask?.cancel();currentRender=null;if(canvas)canvas.width=canvas.height=0;}
 }
 function get(number){if(disposed)return Promise.reject(abort());if(jobs.has(number))return jobs.get(number);status(number,'reading');
  const job=(async()=>{try{const page=await pdf.getPage(number),content=await page.getTextContent();if(disposed)throw abort();let raster=false;const count=content.items.filter(x=>x.str?.trim()).map(x=>x.str).join('').replace(/\s/g,'').length;if(count<40){const lib=await import('pdfjs-dist/build/pdf.mjs'),ops=await page.getOperatorList();raster=ops.fnArray.some(op=>[lib.OPS.paintImageXObject,lib.OPS.paintInlineImageXObject,lib.OPS.paintImageMaskXObject].includes(op));}let result;
    if(needsPdfOcr(content,raster)){status(number,'queued');const queued=queue.then(()=>recognize(page,number));queue=queued.catch(()=>{});result=await queued;}else result={method:'native',content};
    if(disposed)throw abort();status(number,'ready',{method:result.method,empty:!result.content.items.some(x=>x.str?.trim()),confidence:result.confidence});return result;
   }catch(e){if(!disposed)status(number,'failed',{error:e.message||'글자를 읽지 못했습니다.'});throw e;}})();jobs.set(number,job);return job;
 }
 return {get,retry(number){attempts.set(number,(attempts.get(number)||0)+1);jobs.delete(number);return get(number);},async scan(){for(let n=1;n<=pdf.numPages;n++){if(disposed)return;try{await get(n);}catch{if(disposed)return;}}},dispose(){disposed=true;rejectStop(abort());currentRender?.cancel();const pending=workerPromise;workerPromise=null;pending?.then(w=>w.terminate()).catch(()=>{});jobs.clear();}};
}
