'use client';
import {useEffect,useState} from 'react';
import {Folder,FileText,Plus,ArrowLeft} from 'lucide-react';
import CloudFileViewer from './CloudFileViewer';
import DocumentSpaceHeader from './DocumentSpaceHeader';
export default function ManagedClientDrive({clients,selectedClient,documents,onSelectClient,onOpenDocument,onAddDocument,onCreateClient}){
 const [query,setQuery]=useState('');
 const [opened,setOpened]=useState(null);
 useEffect(()=>setOpened(null),[selectedClient?.id]);
 const matching=clients.filter(c=>c.name.toLowerCase().includes(query.toLowerCase()));
 return <div className="client-drive"><DocumentSpaceHeader active="clients"/><div className="client-drive-toolbar"><nav><button onClick={()=>onSelectClient(null)}>전체 거래처</button>{selectedClient&&<strong> / {selectedClient.name}</strong>}</nav><button className="work-primary" onClick={selectedClient?onAddDocument:onCreateClient}><Plus size={16}/>{selectedClient?'문서 등록':'거래처·프로젝트 추가'}</button></div>
 {!selectedClient?<><input className="work-client-search" aria-label="관리 거래처 검색" placeholder="거래처 검색" value={query} onChange={e=>setQuery(e.target.value)}/><div className="managed-client-grid">{matching.map(c=><button key={c.id} onClick={()=>onSelectClient(c)}><Folder size={28}/><strong>{c.name}</strong><small>거래처 문서·업무·인증 관리</small></button>)}</div>{!matching.length&&<p className="work-empty">등록된 거래처가 없습니다. 거래처를 추가해 관리를 시작하세요.</p>}</>:<><p className="my-5 text-sm text-slate-500">{selectedClient.name}의 회사 문서 {documents.length}개</p>{opened?<CloudFileViewer document={opened} onClose={()=>setOpened(null)}/>:documents.length?<div>{documents.map(d=><button className="platform-list-row w-full" key={d.id} onClick={()=>d.kind==='client-file'?setOpened(d):onOpenDocument(d)}><FileText size={18}/><strong>{d.title||d.name}</strong><span>{d.kind==='client-file'?(d.migration?.status==='complete'?d.format+' · 원본 보관':'원본 이관 중'):d.status}</span></button>)}</div>:<div className="work-empty"><FileText size={28}/><h2>등록된 클라우드 문서가 없습니다.</h2><p>거래처 원본 파일은 아직 이관되지 않았습니다. 원본 이관 전에는 기존 파일이 이 목록에 나타나지 않습니다.</p><button onClick={onAddDocument}>문서 등록</button></div>}</>}
 </div>;
}
