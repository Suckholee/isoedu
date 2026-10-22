'use client';
import {useEffect,useState} from 'react';
import {Folder,FileText,Plus,Download} from 'lucide-react';
import CloudFileViewer from './CloudFileViewer';
import DocumentSpaceHeader from './DocumentSpaceHeader';
import {getSecureDownloadUrl} from '../lib/storageVault';
import {safeDownloadFileName,buildWordDocumentHtml,triggerBrowserDownload} from '../lib/documentExport.mjs';

export default function ManagedClientDrive({clients,selectedClient,documents,onSelectClient,onOpenDocument,onAddDocument,onCreateClient}){
 const [query,setQuery]=useState('');
 const [opened,setOpened]=useState(null);
 const [downloadError,setDownloadError]=useState('');
 useEffect(()=>{setOpened(null);setDownloadError('');},[selectedClient?.id]);
 const matching=clients.filter(c=>c.name.toLowerCase().includes(query.toLowerCase()));

 async function handleDirectDownload(d){
  setDownloadError('');
  try{
   const filePath=d.fileUrl||d.originalPath;
   if(d.kind==='client-file'||filePath){
    if(!filePath)throw Error('원본 파일 경로가 아직 등록되지 않았습니다.');
    const url=await getSecureDownloadUrl(filePath,600);
    const anchor=document.createElement('a');
    anchor.href=url;
    anchor.download=d.fileName||d.title||d.name||'document';
    anchor.target='_blank';
    anchor.rel='noopener';
    anchor.click();
    if(url.startsWith('blob:'))setTimeout(()=>URL.revokeObjectURL(url),30000);
    return;
   }
   const html=buildWordDocumentHtml(d,{companyName:selectedClient?.name||''});
   const fileName=safeDownloadFileName(`${d.code?`${d.code}_`:''}${d.title||d.name}`,'doc');
   triggerBrowserDownload(html,fileName,'application/msword;charset=utf-8');
  }catch(e){
   setDownloadError(e.message||'파일을 다운로드하지 못했습니다.');
  }
 }

 return <div className="client-drive"><DocumentSpaceHeader active="clients"/><div className="client-drive-toolbar"><nav><button onClick={()=>onSelectClient(null)}>전체 거래처</button>{selectedClient&&<strong> / {selectedClient.name}</strong>}</nav><button className="work-primary" onClick={selectedClient?onAddDocument:onCreateClient}><Plus size={16}/>{selectedClient?'문서 등록':'거래처·프로젝트 추가'}</button></div>
 {!selectedClient?<><input className="work-client-search" aria-label="관리 거래처 검색" placeholder="거래처 검색" value={query} onChange={e=>setQuery(e.target.value)}/><div className="managed-client-grid">{matching.map(c=><button key={c.id} onClick={()=>onSelectClient(c)}><Folder size={28}/><strong>{c.name}</strong><small>거래처 문서·업무·인증 관리</small></button>)}</div>{!matching.length&&<p className="work-empty">등록된 거래처가 없습니다. 거래처를 추가해 관리를 시작하세요.</p>}</>:<><p className="my-5 text-sm text-slate-500">{selectedClient.name}의 회사 문서 {documents.length}개</p>{downloadError&&<p role="alert" className="text-sm text-rose-700 my-2">{downloadError}</p>}{opened?<CloudFileViewer document={opened} onClose={()=>setOpened(null)}/>:documents.length?<div>{documents.map(d=><div className="platform-list-row w-full flex items-center justify-between gap-3" key={d.id}><button type="button" className="flex items-center gap-3 flex-1 text-left min-w-0" onClick={()=>d.kind==='client-file'?setOpened(d):onOpenDocument(d)}><FileText size={18}/><strong className="truncate">{d.title||d.name}</strong></button><div className="flex items-center gap-2 shrink-0"><span>{d.kind==='client-file'?(d.migration?.status==='complete'?d.format+' · 원본 보관':d.migration?.status==='failed'?'원본 이관 보류':'원본 이관 중'):d.status}</span><button type="button" aria-label={`${d.title||d.name} 다운로드`} onClick={()=>handleDirectDownload(d)} className="text-xs px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold inline-flex items-center gap-1"><Download size={13}/>{d.kind==='client-file'||d.fileUrl?'원본 다운로드':'다운로드(.doc)'}</button></div></div>)}</div>:<div className="work-empty"><FileText size={28}/><h2>등록된 클라우드 문서가 없습니다.</h2><p>거래처 원본 파일은 아직 이관되지 않았습니다. 원본 이관 전에는 기존 파일이 이 목록에 나타나지 않습니다.</p><button onClick={onAddDocument}>문서 등록</button></div>}</>}
 </div>;
}
