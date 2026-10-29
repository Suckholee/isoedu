'use client';
import {useEffect,useRef,useState} from 'react';
import styles from './InlinePdfViewer.module.css';

// Render in our viewer: browser PDF preferences must not turn previews into downloads.
export default function InlinePdfViewer({url,title}){
 const root=useRef(null),[pdf,setPdf]=useState(null),[error,setError]=useState(''),[width,setWidth]=useState(800);
 useEffect(()=>{let cancelled=false,task;setPdf(null);setError('');
  (async()=>{try{const lib=await import('pdfjs-dist/build/pdf.mjs');if(cancelled)return;lib.GlobalWorkerOptions.workerSrc='/document-reader/pdf.worker.min.mjs';task=lib.getDocument({url,cMapUrl:'/document-reader/cmaps/',cMapPacked:true,standardFontDataUrl:'/document-reader/standard_fonts/',isEvalSupported:false});const document=await task.promise;if(!cancelled)setPdf(document);}catch(e){if(!cancelled)setError('PDF를 표시하지 못했습니다. 원본 다운로드 또는 전체 본문으로 확인해 주세요.');}})();
  return()=>{cancelled=true;task?.destroy().catch(()=>{});};
 },[url]);
 useEffect(()=>{const el=root.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setWidth(Math.max(240,entry.contentRect.width-32)));observer.observe(el);return()=>observer.disconnect();},[]);
 return <div ref={root} className={styles.viewer} aria-label={title+' PDF 본문'}>{error?<p role="alert" className={styles.message}>{error}</p>:!pdf?<p role="status" className={styles.message}>문서를 불러오는 중입니다…</p>:Array.from({length:pdf.numPages},(_,i)=><PdfPage key={i} pdf={pdf} number={i+1} width={width} root={root}/>)}</div>;
}
function PdfPage({pdf,number,width,root}){
 const holder=useRef(null),canvas=useRef(null),[visible,setVisible]=useState(number===1),[ratio,setRatio]=useState(1.414),[error,setError]=useState('');
 useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{root:root.current,rootMargin:'600px'});observer.observe(holder.current);return()=>observer.disconnect();},[root]);
 useEffect(()=>{if(!visible)return;let cancelled=false,render;setError('');
  (async()=>{try{const page=await pdf.getPage(number);if(cancelled)return;const base=page.getViewport({scale:1});setRatio(base.height/base.width);const viewport=page.getViewport({scale:width/base.width}),density=Math.min(window.devicePixelRatio||1,2),target=canvas.current;target.width=Math.ceil(viewport.width*density);target.height=Math.ceil(viewport.height*density);render=page.render({canvasContext:target.getContext('2d'),viewport,transform:density===1?undefined:[density,0,0,density,0,0]});await render.promise;}catch(e){if(!cancelled&&e.name!=='RenderingCancelledException')setError('이 페이지를 표시하지 못했습니다.');}})();
  return()=>{cancelled=true;render?.cancel();};
 },[pdf,number,width,visible]);
 return <section ref={holder} className={styles.page} style={{width,maxWidth:'100%'}} aria-label={`${number}페이지`}><div className={styles.paper} style={{aspectRatio:`1 / ${ratio}`}}>{visible&&<canvas ref={canvas} aria-label={`${number}페이지 원문`}/>}{error&&<p role="alert" className={styles.message}>{error}</p>}</div><span className={styles.pageNumber}>{number} / {pdf.numPages}</span></section>;
}
