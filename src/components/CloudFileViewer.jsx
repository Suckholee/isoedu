'use client';
import {useEffect,useState} from 'react';
import {decodeCloudPreview} from '../lib/cloudPreview.mjs';
import {getSecureDownloadUrl} from '../lib/storageVault';
export default function CloudFileViewer({document:doc,onClose}){
 const [preview,setPreview]=useState(''),[download,setDownload]=useState(''),[error,setError]=useState(''),[text,setText]=useState(false);
 useEffect(()=>{let active=true,blobUrl;setPreview('');setDownload('');setError('');setText(false);
 (async()=>{try{
 if(doc.migration?.status==='failed'&&!doc.previewPath){setText(true);throw Error('원본 이관이 보류되었습니다. 저장소 용량 제한을 확인해야 합니다. 추출 본문은 아래에서 확인할 수 있습니다.');}
 const prefix=`companies/${doc.companyId}/${doc.id}/`;
 if(!doc.originalPath?.startsWith(prefix)||doc.previewPath&&!doc.previewPath.startsWith(prefix))throw Error('문서의 저장 경로를 확인해 주세요.');
 const original=await getSecureDownloadUrl(doc.originalPath,600);if(!active)return;setDownload(original);
 if(doc.previewPath){const url=await getSecureDownloadUrl(doc.previewPath,600);
 if(doc.previewFormat==='HTML'){const response=await fetch(url);if(!response.ok)throw Error('미리보기를 읽지 못했습니다.');const html=await decodeCloudPreview(await response.text(),doc.previewEncoding);blobUrl=URL.createObjectURL(new Blob([`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'">`,html],{type:'text/html'}));if(active)setPreview(blobUrl);}else if(active)setPreview(url);
 }else if(active)setText(true);
 }catch(e){if(active)setError(e.message);}})();return()=>{active=false;if(blobUrl)URL.revokeObjectURL(blobUrl);};},[doc.id,doc.companyId,doc.originalPath,doc.previewPath,doc.previewFormat,doc.previewEncoding]);
 return <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5" aria-label="거래처 원본 뷰어"><div className="flex flex-wrap items-center gap-4"><button onClick={onClose}>← 파일 목록</button><strong className="flex-1">{doc.title}</strong>{download&&<a href={download} target="_blank" rel="noreferrer">원본 열기·다운로드</a>}<button onClick={()=>setText(v=>!v)}>{text?'원문 미리보기':'전체 본문'}</button></div>{error&&<p role="alert" className="my-4 text-red-600">{error}</p>}{text?<pre className="mt-5 whitespace-pre-wrap break-words text-sm">{doc.contentDraft||'추출된 본문이 없습니다. 원본을 내려받아 확인해 주세요.'}</pre>:preview?<><p className="my-3 text-xs text-slate-500">{doc.format==='PDF'?'PDF 원본':'원문 변환 미리보기 · 글꼴과 일부 배치는 원본과 다를 수 있습니다.'}</p><iframe sandbox={doc.previewFormat==='HTML'?'':undefined} title={doc.title+' 원문'} src={preview} className="w-full border-0" style={{height:'75vh'}}/></>:!error&&<p role="status" className="my-5">원문을 준비하고 있습니다.</p>}</section>;
}
