'use client';
import {useEffect,useState,useId} from 'react';
import {createPortal} from 'react-dom';
import {ArrowLeft,Download,X} from 'lucide-react';
import ModalLayer from './ui/ModalLayer';
import styles from './CloudFileViewer.module.css';
import {decodeCloudPreview} from '../lib/cloudPreview.mjs';
import {getSecureDownloadUrl} from '../lib/storageVault';
export default function CloudFileViewer({document:doc,onClose,reviewPanel,reviewNavigation}){
 const titleId=useId();
 const [preview,setPreview]=useState(''),[download,setDownload]=useState(''),[error,setError]=useState(''),[text,setText]=useState(false);
 useEffect(()=>{let active=true,blobUrl;setPreview('');setDownload('');setError('');setText(false);
 (async()=>{try{
 if(doc.migration?.status==='failed'&&!doc.previewPath){setText(true);throw Error('원본 이관이 보류되었습니다. 저장소 용량 제한을 확인해야 합니다. 추출 본문은 아래에서 확인할 수 있습니다.');}
 if(!doc.originalPath&&doc.contentDraft){setText(true);return;}
 const prefix=`companies/${doc.companyId}/${doc.id}/`;
 if(!doc.originalPath?.startsWith(prefix)||doc.previewPath&&!doc.previewPath.startsWith(prefix))throw Error('문서의 저장 경로를 확인해 주세요.');
 const original=await getSecureDownloadUrl(doc.originalPath,600);if(!active)return;setDownload(original);
 if(doc.previewPath){const url=await getSecureDownloadUrl(doc.previewPath,600);
 if(doc.previewFormat==='HTML'){const response=await fetch(url);if(!response.ok)throw Error('미리보기를 읽지 못했습니다.');const html=await decodeCloudPreview(await response.text(),doc.previewEncoding);blobUrl=URL.createObjectURL(new Blob([`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'">`,html],{type:'text/html'}));if(active)setPreview(blobUrl);}else if(active)setPreview(url);
 }else if(active)setText(true);
 }catch(e){if(active)setError(e.message);}})();return()=>{active=false;if(blobUrl)URL.revokeObjectURL(blobUrl);};},[doc.id,doc.companyId,doc.originalPath,doc.previewPath,doc.previewFormat,doc.previewEncoding]);
 if(typeof window==='undefined')return null;
 return createPortal(<ModalLayer onClose={onClose} className={styles.overlay}>
  <section role="dialog" aria-modal="true" aria-labelledby={titleId} className={styles.viewer}>
   <header className={styles.toolbar}>
    <button type="button" onClick={onClose} aria-label="문서 닫고 파일 목록으로"><ArrowLeft size={17}/>목록</button>
    <h2 id={titleId} className={styles.title} title={doc.title}>{doc.title}</h2>
    {reviewNavigation}
    <div className={styles.actions}>
     {download&&<a href={download} target="_blank" rel="noreferrer"><Download size={15}/>원본 다운로드</a>}
     <button type="button" aria-pressed={text} onClick={()=>setText(v=>!v)}>{text?'원문 미리보기':'전체 본문'}</button>
     <button type="button" onClick={onClose} aria-label="문서 뷰어 닫기" title="닫기 (Esc)"><X size={20}/></button>
    </div>
   </header>
   {error&&<p role="alert" className={styles.error}>{error}</p>}
   {!text&&preview&&<p className={styles.note}>{doc.format==='PDF'?'PDF 원본':'원문 변환 미리보기 · 글꼴과 일부 배치는 원본과 다를 수 있습니다.'}</p>}
   <div className={reviewPanel?styles.reviewBody:styles.body}><div className={styles.content}>
    {text?<pre className={styles.text}>{doc.contentDraft||'추출된 본문이 없습니다. 원본을 내려받아 확인해 주세요.'}</pre>:preview?<iframe sandbox={doc.previewFormat==='HTML'?'':undefined} title={doc.title+' 원문'} src={preview} className={styles.frame}/>:!error&&<p role="status" className={styles.status}>원문을 준비하고 있습니다.</p>}
   </div>{reviewPanel&&<aside className={styles.reviewPanel} aria-label="문서 날짜 검토">{reviewPanel}</aside>}</div>
  </section>
 </ModalLayer>,window.document.body);
}
