'use client';
import {useEffect,useRef,useState,useMemo} from 'react';
import {Minus,Plus,ChevronLeft,ChevronRight,Search,X} from 'lucide-react';
import {findPdfMatches,splitPdfHighlights} from '../lib/pdfSearch.mjs';
import styles from './InlinePdfViewer.module.css';
const EMPTY=[];
export default function InlinePdfViewer({url,title}){
 const root=useRef(null),searchInput=useRef(null),pages=useRef(new Map()),cache=useRef(new Map());
 const [pdf,setPdf]=useState(null),[error,setError]=useState(''),[width,setWidth]=useState(800),[zoom,setZoom]=useState('fit'),[page,setPage]=useState(1),[pageInput,setPageInput]=useState('1');
 const [query,setQuery]=useState(''),[results,setResults]=useState([]),[hit,setHit]=useState(0),[searching,setSearching]=useState(false),[searchError,setSearchError]=useState('');
 const active=results[hit];
 const byPage=useMemo(()=>{const map=new Map();for(const r of results){if(!map.has(r.page))map.set(r.page,[]);map.get(r.page).push(r);}return map;},[results]);
 useEffect(()=>{let cancelled=false,task;setPdf(null);setError('');cache.current=new Map();
  (async()=>{try{const lib=await import('pdfjs-dist/build/pdf.mjs');if(cancelled)return;lib.GlobalWorkerOptions.workerSrc='/document-reader/pdf.worker.min.mjs';task=lib.getDocument({url,cMapUrl:'/document-reader/cmaps/',cMapPacked:true,standardFontDataUrl:'/document-reader/standard_fonts/',isEvalSupported:false});const document=await task.promise;if(!cancelled)setPdf(document);}catch(e){if(!cancelled)setError('PDF를 표시하지 못했습니다. 원본 다운로드 또는 전체 본문으로 확인해 주세요.');}})();
  return()=>{cancelled=true;task?.destroy().catch(()=>{});};
 },[url]);
 useEffect(()=>{const el=root.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setWidth(Math.max(240,entry.contentRect.width-32)));observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>{const handler=e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='f'){e.preventDefault();searchInput.current?.focus();searchInput.current?.select();}};document.addEventListener('keydown',handler);return()=>document.removeEventListener('keydown',handler);},[]);
 useEffect(()=>{setPageInput(String(page));},[page]);
 useEffect(()=>{let cancelled=false;setResults([]);setHit(0);setSearchError('');if(!pdf||!query.trim()){setSearching(false);return;}setSearching(true);
  const timer=setTimeout(async()=>{const found=[];let failed=0;try{for(let n=1;n<=pdf.numPages;n++){if(cancelled)return;try{let content=cache.current.get(n);if(!content){content=await (await pdf.getPage(n)).getTextContent();if(cancelled)return;cache.current.set(n,content);}for(const match of findPdfMatches(content.items.filter(x=>typeof x.str==='string').map(x=>x.str),query))found.push({...match,page:n,hit:found.length});}catch{failed++;}}if(!cancelled){setResults(found);if(failed)setSearchError(`${failed}개 페이지를 검색하지 못했습니다.`);}}finally{if(!cancelled)setSearching(false);}},250);
  return()=>{cancelled=true;clearTimeout(timer);};
 },[pdf,query]);
 function jump(n){if(!pdf)return;const target=Math.max(1,Math.min(pdf.numPages,Number(n)||1));setPage(target);setPageInput(String(target));pages.current.get(target)?.scrollIntoView({block:'start',inline:'nearest'});}
 useEffect(()=>{if(active)jump(active.page);},[active]);
 function navigateHit(delta){if(results.length)setHit(i=>(i+delta+results.length)%results.length);}
 async function changeZoom(value){if(!pdf)return;const currentPage=page;setZoom(value);requestAnimationFrame(()=>pages.current.get(currentPage)?.scrollIntoView({block:'start',inline:'nearest'}));}
 async function stepZoom(delta){if(!pdf)return;let percent=zoom;if(zoom==='fit'){const first=await pdf.getPage(page);percent=Math.round(width/first.getViewport({scale:1}).width*100);}changeZoom(Math.max(25,Math.min(300,Number(percent)+delta)));}
 function onScroll(){const viewport=root.current;if(!viewport)return;const top=viewport.getBoundingClientRect().top;let closest=1,distance=Infinity;for(const [n,el] of pages.current){const box=el.getBoundingClientRect();if(box.bottom<=top)continue;const d=Math.abs(box.top-top);if(d<distance){distance=d;closest=n;}}setPage(closest);}
 return <div className={styles.shell}>
  <div className={styles.toolbar} role="toolbar" aria-label="문서 보기 도구">
   <div className={styles.group}><button aria-label="이전 페이지" disabled={!pdf||page<=1} onClick={()=>jump(page-1)}><ChevronLeft size={15}/></button><form onSubmit={e=>{e.preventDefault();jump(pageInput);}}><input aria-label="이동할 페이지" inputMode="numeric" value={pageInput} onChange={e=>setPageInput(e.target.value)} onBlur={()=>jump(pageInput)} disabled={!pdf}/><span> / {pdf?.numPages||'—'}</span></form><button aria-label="다음 페이지" disabled={!pdf||page>=pdf.numPages} onClick={()=>jump(page+1)}><ChevronRight size={15}/></button></div>
   <div className={styles.group}><button aria-label="축소" disabled={!pdf} onClick={()=>stepZoom(-25)}><Minus size={15}/></button><select aria-label="문서 확대 비율" value={zoom} disabled={!pdf} onChange={e=>changeZoom(e.target.value==='fit'?'fit':Number(e.target.value))}>{['fit',...new Set([50,75,100,125,150,200,300,...(zoom==='fit'?[]:[zoom])].sort((a,b)=>a-b))].map(v=><option key={v} value={v}>{v==='fit'?'너비 맞춤':v+'%'}</option>)}</select><button aria-label="확대" disabled={!pdf} onClick={()=>stepZoom(25)}><Plus size={15}/></button></div>
   <div className={`${styles.group} ${styles.search}`}><Search size={14}/><input ref={searchInput} aria-label="문서 내 검색" placeholder="문서 내 검색" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();navigateHit(e.shiftKey?-1:1);}}}/>{query&&<button aria-label="검색 지우기" onClick={()=>setQuery('')}><X size={13}/></button>}<span role="status">{searching?'검색 중…':query?results.length?`${hit+1}/${results.length}`:'결과 없음':''}</span><button aria-label="이전 검색 결과" disabled={!results.length} onClick={()=>navigateHit(-1)}><ChevronLeft size={15}/></button><button aria-label="다음 검색 결과" disabled={!results.length} onClick={()=>navigateHit(1)}><ChevronRight size={15}/></button></div>
  </div>
  {searchError&&<p className={styles.notice} role="status">{searchError}</p>}
  <div ref={root} onScroll={onScroll} className={styles.viewer} aria-label={title+' PDF 본문'}>{error?<p role="alert" className={styles.message}>{error}</p>:!pdf?<p role="status" className={styles.message}>문서를 불러오는 중입니다…</p>:Array.from({length:pdf.numPages},(_,i)=><PdfPage key={i} pdf={pdf} number={i+1} fitWidth={width} zoom={zoom} root={root} pages={pages} force={page===i+1||active?.page===i+1} matches={byPage.get(i+1)||EMPTY} activeHit={active?.hit} cache={cache}/>)}</div>
 </div>;
}
function PdfPage({pdf,number,fitWidth,zoom,root,pages,force,matches,activeHit,cache}){
 const holder=useRef(null),canvas=useRef(null),text=useRef(null),layer=useRef(null),[visible,setVisible]=useState(number===1),[size,setSize]=useState({width:595,height:842}),[ready,setReady]=useState(0),[error,setError]=useState(''),[textError,setTextError]=useState(false);
 const width=zoom==='fit'?fitWidth:size.width*zoom/100,shouldRender=visible||force;
 useEffect(()=>{pages.current.set(number,holder.current);const observer=new IntersectionObserver(entries=>{setVisible(entries.some(e=>e.isIntersecting));},{root:root.current,rootMargin:'600px'});observer.observe(holder.current);return()=>{observer.disconnect();pages.current.delete(number);};},[root,pages,number]);
 useEffect(()=>{if(!shouldRender)return;let cancelled=false,render,textLayer;setError('');setTextError(false);
  (async()=>{try{const page=await pdf.getPage(number);if(cancelled)return;const base=page.getViewport({scale:1});setSize(old=>old.width===base.width&&old.height===base.height?old:{width:base.width,height:base.height});const viewport=page.getViewport({scale:width/base.width}),density=Math.min(window.devicePixelRatio||1,2,Math.sqrt(16000000/(viewport.width*viewport.height))),target=canvas.current;target.width=Math.ceil(viewport.width*density);target.height=Math.ceil(viewport.height*density);render=page.render({canvasContext:target.getContext('2d'),viewport,transform:[density,0,0,density,0,0]});await render.promise;if(cancelled)return;
   try{const lib=await import('pdfjs-dist/build/pdf.mjs');let content=cache.current.get(number);if(!content){content=await page.getTextContent();if(cancelled)return;cache.current.set(number,content);}if(cancelled)return;text.current.replaceChildren();text.current.style.setProperty('--scale-factor',viewport.scale);textLayer=new lib.TextLayer({textContentSource:content,container:text.current,viewport});layer.current=textLayer;await textLayer.render();if(!cancelled){setTextError(!content.items.some(x=>x.str?.trim()));setReady(v=>v+1);}}catch(e){if(!cancelled)setTextError(true);}
  }catch(e){if(!cancelled&&e.name!=='RenderingCancelledException')setError('이 페이지를 표시하지 못했습니다.');}})();
  return()=>{cancelled=true;render?.cancel();textLayer?.cancel();layer.current=null;};
 },[pdf,number,width,shouldRender,cache]);
 useEffect(()=>{if(!layer.current)return;let offset=0;for(let i=0;i<layer.current.textDivs.length;i++){const span=layer.current.textDivs[i],value=layer.current.textContentItemsStr[i],fragment=document.createDocumentFragment();for(const part of splitPdfHighlights(value,offset,matches)){if(part.hit!==undefined){const mark=document.createElement('mark');mark.textContent=part.text;mark.dataset.hit=part.hit;mark.className=part.hit===activeHit?styles.activeMatch:styles.match;fragment.append(mark);}else fragment.append(document.createTextNode(part.text));}span.replaceChildren(fragment);offset+=value.length;}
  if(matches.some(m=>m.hit===activeHit)){const target=text.current.querySelector(`[data-hit="${activeHit}"]`);target?.scrollIntoView({block:'center',inline:'nearest'});}
 },[matches,activeHit,ready]);
 return <section ref={holder} className={styles.page} style={{width}} aria-label={`${number}페이지`}><div className={styles.paper} style={{aspectRatio:`${size.width} / ${size.height}`}}>{shouldRender&&<><canvas ref={canvas} aria-label={`${number}페이지 원문`}/><div ref={text} className={styles.textLayer}/></>}{error&&<p role="alert" className={styles.message}>{error}</p>}</div><span className={styles.pageNumber}>{number} / {pdf.numPages}{textError?' · 텍스트 없는 페이지: 검색·선택은 OCR 필요':''}</span></section>;
}
