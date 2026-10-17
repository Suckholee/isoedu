'use client';
import {useEffect,useState} from 'react';
export default function OriginalDocumentPreview({file,onText}) {
 const [markup,setMarkup]=useState(false);
 const [url,setUrl]=useState(''),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();let objectUrl;setUrl('');setError('');setMarkup(false);
 fetch(`/api/client-drive/${encodeURIComponent(file.id)}?preview=1`,{signal:controller.signal,cache:'no-store'}).then(async response=>{
  const type=response.headers.get('content-type')||'';
  if(!response.ok||!(type.includes('application/pdf')||(type.includes('text/html')&&response.headers.get('X-Document-Preview')==='html'))){const detail=await response.json().catch(()=>null);throw Error(detail?.error||'원문을 열지 못했습니다.');}
  const isMarkup=type.includes('text/html');setMarkup(isMarkup);
  const blob=isMarkup?new Blob([`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'">`,await response.text()],{type:'text/html'}):await response.blob();if(controller.signal.aborted)return;objectUrl=URL.createObjectURL(blob);setUrl(objectUrl);
 }).catch(e=>{if(e.name!=='AbortError')setError(e.message);});
 return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};},[file.id]);

 if(error)return <div className="original-preview-status" role="alert"><p>{error}</p><button onClick={onText}>전체 본문 보기</button></div>;
 if(!url)return <p className="original-preview-status" role="status">원문 미리보기를 준비하고 있습니다. 처음 열 때는 변환에 시간이 걸릴 수 있습니다.</p>;
 return <div className="original-document-preview"><p>{markup?'원문 렌더링 · 글꼴·일부 개체 배치는 원본과 다를 수 있습니다.':'원본 문서의 PDF 미리보기'} · {file.format} 원본 다운로드 가능</p><iframe sandbox={markup?'':undefined} title={file.name+' 원문 미리보기'} src={url}/></div>;
}
