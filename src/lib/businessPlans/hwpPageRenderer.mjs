// Pinned HWPJS 0.1.1 WASM + read-only canvas adapter. Assets and license are served locally.
const root='/document-reader/hwpjs-0.1.1/';
const load=name=>import(/* webpackIgnore: true */ root+name);
const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
let fontReady;
function prepareFont(){
 if(!fontReady)fontReady=(async()=>{
  const font=new FontFace('Certimento HWP Sans',`url(${root}fonts/NotoSansKR-Regular.ttf)`,{weight:'100 900'});
  await font.load();document.fonts.add(font);await document.fonts.ready;
 })().catch(()=>{fontReady=null;throw Error('한글 글꼴을 준비하지 못했습니다. 페이지를 다시 준비해 주세요.');});
 return fontReady;
}
export async function* renderHwpPages(file,{signal,onProgress=()=>{},onLayout=()=>{}}={}){
 onProgress('한글 글꼴을 준비하고 있습니다…');await prepareFont();
 if(signal?.aborted)throw new DOMException('중지','AbortError');
 const [{createEditor,detectDocumentFormat},{createWorkerRuntimeFactory},{createSurfaceRenderer}]=await Promise.all([load('index.js'),load('runtime.js'),load('chunk-sg8m4ms8.js?v=4')]);
 const host=document.createElement('div'),canvas=document.createElement('canvas'),spacer=document.createElement('div');
 host.style.cssText='position:fixed;left:-12000px;top:0;width:1100px;height:1400px;overflow:auto;pointer-events:none';
 canvas.style.cssText='position:sticky;top:0;display:block';host.append(canvas,spacer);document.body.append(host);
 const editor=createEditor({runtimeFactory:createWorkerRuntimeFactory({workerURL:root+'worker.js',wasmURL:root+'hwpjs.wasm'})});
 let renderer;
 try{
  const bytes=new Uint8Array(await file.arrayBuffer());
  const state=await editor.load(bytes,{format:detectDocumentFormat(bytes),editable:false});
  if(signal?.aborted)throw new DOMException('중지','AbortError');
  renderer=createSurfaceRenderer(canvas,host,spacer,()=>{},{devicePixelRatio:()=>2});
  async function resource(kind,payload,field){const reply=await editor.readResource({kind,...payload},state.token);if(reply.error)throw Error(reply.error);return reply[field];}
  renderer.pictureReader((section,pictureNode)=>resource('picture-bytes',{section,pictureNode},'bytes'));
  renderer.tableBackgroundReader((section,listNode)=>resource('table-background-bytes',{section,listNode},'bytes'));
  renderer.chartReader((section,wrapper)=>resource('chart-display',{section,wrapper},'chart'));
  renderer.show(state.content,{sourceState:state,resourceEpoch:state.documentId,resourceDocument:state.documentId});
  await frame();await frame();
  let layout=renderer.layout();
  onLayout({state:layout.state,total:layout.pages?.length,limited:layout.limited,sourceCoverage:layout.sourceCoverage,objectCoverage:layout.objectCoverage,pictures:layout.pictureCoverage});
  if(layout.state!=='paginated'||layout.limited||layout.sourceCoverage==='incomplete'||layout.objectCoverage==='incomplete'||layout.pictureCoverage?.pending||!layout.pages?.length)throw Error('한글 파일의 일부 표·개체를 페이지로 표시하지 못했습니다. 원본은 보존했습니다.');
  const pages=layout.pages.map(p=>({...p.paper}));
  if(pages.length>2000)throw Error('한글 문서는 최대 2,000쪽까지 지원합니다.');
  for(let i=0;i<pages.length;i++){
   if(signal?.aborted)throw new DOMException('중지','AbortError');
   const p=pages[i];onProgress(`한글 원본 ${i+1}/${pages.length}쪽을 이미지로 준비하고 있습니다…`);
   host.style.width=Math.ceil(p.x+p.width+48)+'px';host.style.height=Math.ceil(p.height+48)+'px';
   await frame();await frame();renderer.layout();
   spacer.style.minHeight=Math.ceil(p.y+p.height+100)+'px';host.scrollTop=Math.max(0,Math.floor(p.y)-12);host.dispatchEvent(new Event('scroll'));
   await frame();await frame();
   const end=Date.now()+20000;
   while(canvas.dataset.paintPending!=='false'||canvas.dataset.picturePending==='true'){if(signal?.aborted)throw new DOMException('중지','AbortError');if(Date.now()>end)throw Error('한글 페이지의 그림을 준비하지 못했습니다. 다시 시도해 주세요.');await new Promise(r=>setTimeout(r,40));}
   if(renderer.layout().pictureCoverage?.failed)throw Error('한글 파일의 그림을 읽지 못했습니다. 완료 처리하지 않고 원본을 보존했습니다.');
   const output=document.createElement('canvas');output.width=Math.ceil(p.width*2);output.height=Math.ceil(p.height*2);
   const ctx=output.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,output.width,output.height);
   // Read the actual high-resolution canvas pixels, rather than upscaling a
   // 1x screen image (which blurred thin strokes into adjacent table borders).
   ctx.drawImage(canvas,p.x*2,(p.y-host.scrollTop)*2,p.width*2,p.height*2,0,0,output.width,output.height);
   const blob=await new Promise(resolve=>output.toBlob(resolve,'image/jpeg',.9));if(!blob)throw Error('페이지 이미지 저장 실패');
   yield {id:i+1,images:[blob]};output.width=output.height=0;
  }
 }finally{renderer?.close();await editor.dispose();host.remove();}
}
