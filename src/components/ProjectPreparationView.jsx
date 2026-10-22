'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useAuth} from '../context/AuthContext';
import CloudFileViewer from './CloudFileViewer';
import {ISO_MANDATORY_REQUIREMENTS} from '../lib/isoRequirementsData';
import {
 loadProjectDetail,
 linkProjectRequirement,
 linkProjectRequirementsBatch,
 updateProjectTask,
 syncProjectTasksBatch,
} from '../lib/companyProjectRepository';
import {
 PROJECT_KINDS,
 DOCUMENT_REVIEW_STATUSES,
 requirementReviewState,
 applyDocumentReviewStatus,
 buildRequirementDraftDocument,
 findProjectRequirementMatches,
 buildBatchRequirementDrafts,
 buildProjectTaskSyncPlan,
} from '../lib/projectWorkflow.mjs';
import {validateUploadFile,uploadDocumentFile,listDocumentFiles,getSecureDownloadUrl} from '../lib/storageVault';
import {TASK_STATUSES} from '../lib/workTaskDates.mjs';
import {
 safeDownloadFileName,
 buildWordDocumentHtml,
 buildProjectBinderHtml,
 buildProjectRequirementsCsv,
 triggerBrowserDownload,
} from '../lib/documentExport.mjs';

export default function ProjectPreparationView({project,documents=[],onOpenDetail,onAddDocument,onAddDocuments,onUpdateDocument}){
 const {user,profile}=useAuth();
 const [requirementSearch,setRequirementSearch]=useState(''),[requirementFilter,setRequirementFilter]=useState('all');
 const [detail,setDetail]=useState(null),[error,setError]=useState(''),[actionError,setActionError]=useState(''),[actionNotice,setActionNotice]=useState(''),[busy,setBusy]=useState(false),[readerDoc,setReaderDoc]=useState(null);
 const [quickReviewReqId,setQuickReviewReqId]=useState(null),[reviewNoteDraft,setReviewNoteDraft]=useState('');
 const identity=useRef(''),generation=useRef(0);identity.current=`${user?.id}/${project.id}`;
 async function load(){const id=identity.current,g=++generation.current;setDetail(null);setError('');setActionError('');try{const d=await loadProjectDetail(project.id);if(id===identity.current&&g===generation.current)setDetail(d);}catch(e){if(id===identity.current&&g===generation.current)setError(e.message);}}
 useEffect(()=>{setReaderDoc(null);load();const focus=()=>load();window.addEventListener('focus',focus);return()=>{generation.current++;window.removeEventListener('focus',focus);};},[project.id,user?.id]);

 async function syncTasksSilent(nextRequirements,nextDocuments,currentDetail=detail){
  if(!currentDetail?.canEdit||!currentDetail?.tasks?.length)return currentDetail?.tasks||[];
  const plan=buildProjectTaskSyncPlan(currentDetail.tasks,nextRequirements,nextDocuments,currentDetail.project.companyId);
  if(!plan.updates.length)return currentDetail.tasks;
  try{
   const savedTasks=await syncProjectTasksBatch(plan.updates);
   const byId=new Map(savedTasks.map(t=>[t.id,t]));
   return currentDetail.tasks.map(t=>byId.get(t.id)||t);
  }catch{
   return currentDetail.tasks;
  }
 }

 async function link(id,documentId){
  const uid=identity.current;setBusy(true);setError('');setActionError('');setActionNotice('');
  try{
   const saved=await linkProjectRequirement(id,documentId);
   if(uid===identity.current&&detail){
    const nextReqs=detail.requirements.map(r=>r.id===id?saved:r);
    const nextTasks=await syncTasksSilent(nextReqs,documents,detail);
    if(uid===identity.current)setDetail(prev=>prev?{...prev,requirements:nextReqs,tasks:nextTasks}:prev);
   }
  }catch(e){if(uid===identity.current){setDetail(null);setError(e.message);}}finally{setBusy(false);}
 }

 async function createDraftAndLink(r,p){
  if(busy||!detail?.canEdit||!onAddDocument)return;
  const uid=identity.current;setBusy(true);setActionError('');setActionNotice('');
  try{
   const draft=buildRequirementDraftDocument(r,p,ISO_MANDATORY_REQUIREMENTS);
   const savedDoc=await onAddDocument(draft);
   if(!savedDoc?.id)throw Error('초안 문서를 저장하지 못했습니다. 거래처 권한과 연결 상태를 확인해 주세요.');
   const savedReq=await linkProjectRequirement(r.id,savedDoc.id);
   if(uid===identity.current&&detail){
    const nextReqs=detail.requirements.map(item=>item.id===r.id?savedReq:item);
    const nextDocs=[savedDoc,...documents.filter(d=>d.id!==savedDoc.id)];
    const nextTasks=await syncTasksSilent(nextReqs,nextDocs,detail);
    if(uid===identity.current){
     setDetail(prev=>prev?{...prev,requirements:nextReqs,tasks:nextTasks}:prev);
     setActionNotice(`'${savedDoc.title}' 초안을 생성·연결하고 준비 일정 진척도를 갱신했습니다.`);
     onOpenDetail?.(savedDoc);
    }
   }
  }catch(e){if(uid===identity.current)setActionError(e.message);}finally{setBusy(false);}
 }

 async function autoLinkMatchedDocuments(matches){
  if(busy||!detail?.canEdit||!matches?.length)return;
  const uid=identity.current;setBusy(true);setActionError('');setActionNotice('');
  try{
   const savedReqs=await linkProjectRequirementsBatch(matches.map(m=>({id:m.requirementId,documentId:m.documentId})));
   const byId=new Map(savedReqs.map(r=>[r.id,r]));
   const nextReqs=detail.requirements.map(r=>byId.get(r.id)||r);
   const nextTasks=await syncTasksSilent(nextReqs,documents,detail);
   if(uid===identity.current){
    setDetail(prev=>prev?{...prev,requirements:nextReqs,tasks:nextTasks}:prev);
    setActionNotice(`기존 보유 문서 ${savedReqs.length}건을 구비서류에 자동 연결하고 준비 일정을 갱신했습니다.`);
   }
  }catch(e){if(uid===identity.current)setActionError(e.message||'자동 연결에 실패했습니다.');}finally{setBusy(false);}
 }

 async function createBatchDraftsAndLink(targetRequirements,p){
  if(busy||!detail?.canEdit||(!onAddDocuments&&!onAddDocument))return;
  const unlinked=targetRequirements.filter(r=>!r.document_id);
  if(!unlinked.length)return;
  const uid=identity.current;setBusy(true);setActionError('');setActionNotice('');
  try{
   const batchPlan=buildBatchRequirementDrafts(unlinked,p,ISO_MANDATORY_REQUIREMENTS);
   let savedDocs=[];
   if(onAddDocuments){
    savedDocs=(await onAddDocuments(batchPlan.map(item=>item.draft)))||[];
   }else{
    for(const item of batchPlan){
     const saved=await onAddDocument(item.draft);
     if(saved?.id)savedDocs.push(saved);
    }
   }
   if(savedDocs.length!==batchPlan.length)throw Error('일부 초안 문서를 저장하지 못했습니다. 거래처 권한과 연결 상태를 확인해 주세요.');
   const links=batchPlan.map((item,idx)=>({id:item.requirementId,documentId:savedDocs[idx].id}));
   const savedReqs=await linkProjectRequirementsBatch(links);
   const byId=new Map(savedReqs.map(r=>[r.id,r]));
   const nextReqs=detail.requirements.map(r=>byId.get(r.id)||r);
   const nextDocs=[...savedDocs,...documents];
   const nextTasks=await syncTasksSilent(nextReqs,nextDocs,detail);
   if(uid===identity.current){
    setDetail(prev=>prev?{...prev,requirements:nextReqs,tasks:nextTasks}:prev);
    setActionNotice(`미연결 구비서류 ${savedReqs.length}건의 초안을 일괄 생성·연결하고 준비 일정 체크리스트를 갱신했습니다.`);
   }
  }catch(e){if(uid===identity.current)setActionError(e.message||'일괄 초안 생성에 실패했습니다.');}finally{setBusy(false);}
 }

 async function uploadAndLinkFile(r,p,linkedDoc,event){
  const file=event.target.files?.[0];
  event.target.value='';
  if(!file||busy||!detail?.canEdit)return;
  const check=validateUploadFile(file);
  if(!check.valid){setActionError(check.error);return;}
  const uid=identity.current;setBusy(true);setActionError('');setActionNotice('');
  try{
   let targetDoc=linkedDoc;
   if(!targetDoc){
    if(!onAddDocument)throw Error('문서 저장 경로를 확인해 주세요.');
    const draft=buildRequirementDraftDocument(r,p,ISO_MANDATORY_REQUIREMENTS,{
     title:`${r.title} (${file.name})`,
     reviewStatus:'REVIEW',
    });
    targetDoc=await onAddDocument(draft);
    if(!targetDoc?.id)throw Error('구비서류 문서를 생성하지 못했습니다.');
   }
   const existingVersions=linkedDoc?await listDocumentFiles(p.companyId,targetDoc.id):[];
   const nextVersion=Math.max(0,...existingVersions.map(v=>v.version||0))+1;
   const uploaded=await uploadDocumentFile(file,{companyId:p.companyId,docId:targetDoc.id,version:nextVersion,user:profile||user});
   if(onUpdateDocument){
    targetDoc=await onUpdateDocument({
     ...targetDoc,
     fileUrl:uploaded.filePath,
     fileName:file.name,
     fileSize:file.size,
     status:'DRAFT',
     docStatus:DOCUMENT_REVIEW_STATUSES.REVIEW,
     reviewStatus:'REVIEW',
     lastModified:new Date().toISOString(),
    })||targetDoc;
   }
   const savedReq=r.document_id===targetDoc.id?r:await linkProjectRequirement(r.id,targetDoc.id);
   if(uid===identity.current&&detail){
    const nextReqs=detail.requirements.map(item=>item.id===r.id?savedReq:item);
    const nextDocs=[targetDoc,...documents.filter(d=>d.id!==targetDoc.id)];
    const nextTasks=await syncTasksSilent(nextReqs,nextDocs,detail);
    if(uid===identity.current){
     setDetail(prev=>prev?{...prev,requirements:nextReqs,tasks:nextTasks}:prev);
     setActionNotice(`'${file.name}' 파일을 보관하고 구비서류에 연결했습니다. 내용을 검토해 주세요.`);
    }
   }
  }catch(e){if(uid===identity.current)setActionError(e.message||'파일 업로드 및 연결에 실패했습니다.');}finally{setBusy(false);}
 }

 async function changeReviewStatus(r,linkedDoc,nextStatus){
  if(busy||!detail?.canEdit||!linkedDoc||!onUpdateDocument)return;
  const uid=identity.current;setBusy(true);setActionError('');setActionNotice('');
  try{
   const updated=applyDocumentReviewStatus(linkedDoc,nextStatus);
   const saved=await onUpdateDocument(updated);
   if(!saved)throw Error('확인 상태를 저장하지 못했습니다.');
   const nextDocs=documents.map(d=>d.id===saved.id?saved:d);
   const nextTasks=await syncTasksSilent(detail.requirements,nextDocs,detail);
   if(uid===identity.current){
    setDetail(prev=>prev?{...prev,tasks:nextTasks}:prev);
    setActionNotice(`'${r.title}' 확인 상태를 '${DOCUMENT_REVIEW_STATUSES[nextStatus]}'(으)로 변경하고 준비 일정을 동기화했습니다.`);
   }
  }catch(e){if(uid===identity.current)setActionError(e.message);}finally{setBusy(false);}
 }

 async function syncTasksManually(plan){
  if(busy||!detail?.canEdit||!plan?.updates?.length)return;
  const uid=identity.current;setBusy(true);setActionError('');setActionNotice('');
  try{
   const savedTasks=await syncProjectTasksBatch(plan.updates);
   const byId=new Map(savedTasks.map(t=>[t.id,t]));
   if(uid===identity.current){
    setDetail(prev=>prev?{...prev,tasks:prev.tasks.map(t=>byId.get(t.id)||t)}:prev);
    setActionNotice(`구비서류 연결·확인 현황에 맞춰 준비 일정 ${savedTasks.length}건과 체크리스트를 동기화했습니다.`);
   }
  }catch(e){if(uid===identity.current)setActionError(e.message||'준비 일정 동기화에 실패했습니다.');}finally{setBusy(false);}
 }

 async function changeTaskStatus(task,nextStatus){
  if(busy||!detail?.canEdit)return;
  const uid=identity.current;setBusy(true);setActionError('');setActionNotice('');
  try{
   const saved=await updateProjectTask(task.id,{status:nextStatus});
   if(uid===identity.current){
    setDetail(prev=>prev?{...prev,tasks:prev.tasks.map(t=>t.id===saved.id?saved:t)}:prev);
    setActionNotice(`'${task.title}' 일정 상태를 '${TASK_STATUSES[nextStatus]}'(으)로 변경했습니다.`);
   }
  }catch(e){if(uid===identity.current)setActionError(e.message||'일정 상태 변경에 실패했습니다.');}finally{setBusy(false);}
 }

 function downloadWordDoc(doc,p){
  try{
   const html=buildWordDocumentHtml(doc,{companyName:p.clientName});
   const fileName=safeDownloadFileName(`${doc.code?`${doc.code}_`:''}${doc.title||doc.name}`,'doc');
   triggerBrowserDownload(html,fileName,'application/msword;charset=utf-8');
   setActionNotice(`'${doc.title||doc.name}' 문서를 Word(.doc) 서식으로 다운로드했습니다.`);
  }catch(e){setActionError(e.message||'문서 다운로드에 실패했습니다.');}
 }

 async function downloadAttachedOriginal(doc){
  const path=doc?.fileUrl||doc?.originalPath;
  if(!path)return;
  try{
   const url=await getSecureDownloadUrl(path);
   const anchor=document.createElement('a');
   anchor.href=url;
   anchor.download=doc.fileName||doc.title||doc.name||'document';
   anchor.target='_blank';
   anchor.rel='noopener';
   anchor.click();
   if(url.startsWith('blob:'))setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(e){setActionError(e.message||'원본 파일 다운로드에 실패했습니다.');}
 }

 function downloadProjectCsv(p,requirements,files){
  try{
   const csv=buildProjectRequirementsCsv(p,requirements,files);
   const fileName=safeDownloadFileName(`${p.title}_구비서류_현황표`,'csv');
   triggerBrowserDownload(csv,fileName,'text/csv;charset=utf-8');
   setActionNotice('구비서류 연결·확인 현황표(.csv)를 다운로드했습니다.');
  }catch(e){setActionError(e.message||'현황표 다운로드에 실패했습니다.');}
 }

 function downloadProjectBinder(p,requirements,files){
  try{
   const html=buildProjectBinderHtml(p,requirements,files);
   const fileName=safeDownloadFileName(`${p.title}_구비서류_통합바인더`,'doc');
   triggerBrowserDownload(html,fileName,'application/msword;charset=utf-8');
   setActionNotice('연결된 구비서류 통합 바인더(.doc)를 다운로드했습니다.');
  }catch(e){setActionError(e.message||'통합 바인더 다운로드에 실패했습니다.');}
 }

 async function saveReviewNote(r,linkedDoc){
  if(busy||!detail?.canEdit||!linkedDoc||!onUpdateDocument)return;
  const uid=identity.current;setBusy(true);setActionError('');setActionNotice('');
  try{
   const saved=await onUpdateDocument({...linkedDoc,reviewNote:reviewNoteDraft.trim(),lastModified:new Date().toISOString()});
   if(!saved)throw Error('검토 메모를 저장하지 못했습니다.');
   if(uid===identity.current)setActionNotice(`'${r.title}' 검토 메모를 저장했습니다.`);
  }catch(e){if(uid===identity.current)setActionError(e.message||'검토 메모 저장에 실패했습니다.');}finally{setBusy(false);}
 }

 async function toggleQuickChecklistItem(linkedDoc,idx){
  if(busy||!detail?.canEdit||!linkedDoc||!onUpdateDocument)return;
  const currentList=Array.isArray(linkedDoc.checklist)?linkedDoc.checklist:[];
  const nextList=currentList.map((item,i)=>i===idx?{...item,done:!item.done}:item);
  try{
   await onUpdateDocument({...linkedDoc,checklist:nextList,lastModified:new Date().toISOString()});
  }catch(e){setActionError(e.message||'체크리스트 저장에 실패했습니다.');}
 }

 function openQuickReview(r,files){
  setQuickReviewReqId(r.id);
  const doc=files.find(d=>d.id===r.document_id);
  setReviewNoteDraft(doc?.reviewNote||'');
 }

 const companyQuery=`company=${encodeURIComponent(project.companyId)}&project=${encodeURIComponent(project.id)}`;
 if(error)return <div className="platform-card m-5" role="alert">{error} <button onClick={load} className="underline">다시 불러오기</button></div>;
 if(!detail)return <p role="status" className="p-5">프로젝트·구비서류·일정을 불러오는 중입니다.</p>;
 const p=detail.project,files=documents.filter(d=>d.companyId===p.companyId);
 const linkedCount=detail.requirements.filter(r=>r.document_id).length;
 const stateOf=r=>requirementReviewState(r,files.find(d=>d.id===r.document_id));
 const draftCount=detail.requirements.filter(r=>stateOf(r)==='DRAFT').length;
 const reviewCount=detail.requirements.filter(r=>stateOf(r)==='REVIEW').length;
 const verifiedCount=detail.requirements.filter(r=>stateOf(r)==='VERIFIED').length;
 const autoMatches=findProjectRequirementMatches(detail.requirements,files,ISO_MANDATORY_REQUIREMENTS,p.companyId);
 const matchByRequirementId=new Map(autoMatches.map(m=>[m.requirementId,m]));
 const taskSyncPlan=buildProjectTaskSyncPlan(detail.tasks,detail.requirements,files,p.companyId);
 const query=requirementSearch.trim().toLocaleLowerCase();
 const visibleRequirements=detail.requirements.filter(r=>{
  const file=files.find(d=>d.id===r.document_id);
  const state=requirementReviewState(r,file);
  if(requirementFilter==='missing'&&r.document_id)return false;
  if(requirementFilter==='linked'&&!r.document_id)return false;
  if(requirementFilter==='draft'&&state!=='DRAFT')return false;
  if(requirementFilter==='review'&&state!=='REVIEW')return false;
  if(requirementFilter==='verified'&&state!=='VERIFIED')return false;
  return !query||[r.title,r.standard,file?.title,file?.name,file?.code,DOCUMENT_REVIEW_STATUSES[state]].some(value=>String(value||'').toLocaleLowerCase().includes(query));
 });
 const unlinkedVisible=visibleRequirements.filter(r=>!r.document_id);
 const activeQuickReq=quickReviewReqId?detail.requirements.find(r=>r.id===quickReviewReqId)||null:null;
 const activeQuickDoc=activeQuickReq?files.find(d=>d.id===activeQuickReq.document_id)||null:null;
 const activeQuickIdx=activeQuickReq?visibleRequirements.findIndex(r=>r.id===activeQuickReq.id):-1;
 const prevQuickReq=activeQuickIdx>0?visibleRequirements[activeQuickIdx-1]:null;
 const nextQuickReq=activeQuickIdx>=0&&activeQuickIdx<visibleRequirements.length-1?visibleRequirements[activeQuickIdx+1]:null;
 const nextUnverifiedReq=visibleRequirements.find(r=>r.id!==activeQuickReq?.id&&stateOf(r)!=='VERIFIED')||null;
 return <div className="p-5 space-y-4"><header className="flex justify-between gap-3 flex-wrap"><div><h1 className="text-xl font-bold">{p.title}</h1><p className="text-sm text-slate-500">{p.clientName} · {PROJECT_KINDS[p.kind]} · 목표 {p.targetDate||'미정'}</p></div><div className="flex items-center gap-3 flex-wrap"><button type="button" onClick={()=>window.print()} className="text-xs px-3 py-1.5 rounded bg-white text-slate-700 border border-slate-300 font-semibold hover:bg-slate-100 print:hidden">준비 요약표 인쇄·PDF</button><Link className="text-blue-700" href={'/certifications?company='+encodeURIComponent(p.companyId)}>거래처 프로젝트 목록</Link></div></header>
 {p.notes&&<p className="text-sm whitespace-pre-wrap">{p.notes}</p>}
 <section className="platform-card"><h2>구비서류 · {detail.requirements.length}개</h2><p className="text-xs text-slate-500 my-3">{!detail.canEdit?'열람 권한으로 보고 있습니다. ':''}프로젝트 생성 시 검토한 기준 목록입니다. 문서 연결·내부 확인 상태는 공식 인증기관의 심사 적합 판정이나 승인을 대신하지 않습니다.</p>
 {detail.requirements.length>0&&<div role="region" aria-label="구비서류 준비 자동화 및 다운로드" className="my-3 p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2"><div className="text-xs text-slate-700"><strong>준비 자동화·다운로드</strong> · 연결 {linkedCount}/{detail.requirements.length}건 · 내부 확인 완료 {verifiedCount}건{detail.canEdit&&autoMatches.length>0?` · 기존 보유 문서 ${autoMatches.length}건 자동 매칭 가능`:''}</div><div className="flex flex-wrap gap-2">{detail.canEdit&&autoMatches.length>0&&<button type="button" disabled={busy} onClick={()=>autoLinkMatchedDocuments(autoMatches)} className="text-xs px-3 py-1.5 rounded bg-emerald-600 text-white font-semibold disabled:opacity-50">기존 문서 자동 매칭·연결 ({autoMatches.length}건)</button>}{detail.canEdit&&unlinkedVisible.length>0&&(onAddDocuments||onAddDocument)&&<button type="button" disabled={busy} onClick={()=>createBatchDraftsAndLink(unlinkedVisible,p)} className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white font-semibold disabled:opacity-50">미연결 구비서류 일괄 초안 생성·연결 ({unlinkedVisible.length}건)</button>}{detail.canEdit&&taskSyncPlan.updates.length>0&&<button type="button" disabled={busy} onClick={()=>syncTasksManually(taskSyncPlan)} className="text-xs px-3 py-1.5 rounded bg-slate-800 text-white font-semibold disabled:opacity-50">준비 일정·체크리스트 동기화 ({taskSyncPlan.updates.length}건)</button>}<button type="button" onClick={()=>downloadProjectCsv(p,detail.requirements,files)} className="text-xs px-3 py-1.5 rounded bg-white text-slate-700 border border-slate-300 font-semibold hover:bg-slate-100">현황표 다운로드 (.csv)</button>{linkedCount>0&&<button type="button" onClick={()=>downloadProjectBinder(p,detail.requirements,files)} className="text-xs px-3 py-1.5 rounded bg-white text-blue-700 border border-blue-300 font-semibold hover:bg-blue-50">연결 문서 통합 다운로드 (.doc)</button>}</div></div>}
 {actionError&&<p role="alert" className="text-sm text-rose-700 my-2">{actionError}</p>}
 {actionNotice&&<p role="status" className="text-sm text-emerald-700 my-2">{actionNotice}</p>}
 <div className="flex flex-wrap items-center gap-2 mb-3"><label className="sr-only" htmlFor="project-requirement-search">구비서류·규격·연결 문서 검색</label><input id="project-requirement-search" type="search" autoCorrect="off" autoCapitalize="none" spellCheck={false} value={requirementSearch} onChange={e=>setRequirementSearch(e.target.value)} placeholder="구비서류·규격·연결 문서 검색" className="border rounded px-3 py-2 text-sm"/><div role="group" aria-label="구비서류 연결 상태" className="flex flex-wrap gap-1">{[['all','전체',detail.requirements.length],['missing','미연결',detail.requirements.length-linkedCount],['linked','연결됨',linkedCount],['draft','초안 작성 중',draftCount],['review','내부 검토 중',reviewCount],['verified','내부 확인 완료',verifiedCount]].map(([value,label,count])=><button key={value} type="button" aria-pressed={requirementFilter===value} onClick={()=>setRequirementFilter(value)} className={`rounded px-3 py-2 text-sm ${requirementFilter===value?'bg-blue-100 text-blue-800':'bg-slate-100 text-slate-600'}`}>{label} {count}</button>)}</div><span role="status" className="text-xs text-slate-500">{visibleRequirements.length}개 표시</span>{(query||requirementFilter!=='all')&&<button type="button" className="text-sm text-blue-700" onClick={()=>{setRequirementSearch('');setRequirementFilter('all');}}>필터 초기화</button>}</div><div className="overflow-auto"><table className="platform-table"><thead><tr><th scope="col">규격</th><th scope="col">구비서류</th><th scope="col">연결 문서·작성</th><th scope="col">확인 상태</th></tr></thead><tbody>{visibleRequirements.map(r=>{
  const linkedDoc=files.find(d=>d.id===r.document_id);
  const state=requirementReviewState(r,linkedDoc);
  const suggestedMatch=!r.document_id?matchByRequirementId.get(r.id):null;
  const uploadInputId=`req-upload-${r.id}`;
  return <tr key={r.id} className={activeQuickReq?.id===r.id?'bg-blue-50/50':''}><td>{r.standard||'직접 지정'}</td><td><button type="button" onClick={()=>openQuickReview(r,files)} className="text-left font-semibold text-slate-900 hover:text-blue-700 underline-offset-2 hover:underline">{r.title}</button><small className="block text-slate-400" title={r.source_version}>생성 시 기준 보관{linkedDoc?.reviewNote?` · 메모: ${linkedDoc.reviewNote}`:''}</small></td><td><div className="flex flex-wrap items-center gap-2"><select aria-label={`${r.title} 연결 문서`} disabled={busy||!detail.canEdit} value={r.document_id||''} onChange={e=>link(r.id,e.target.value)} className="max-w-60 border rounded p-1"><option value="">미연결</option>{files.map(d=><option key={d.id} value={d.id}>{d.title||d.name}</option>)}</select>{linkedDoc&&<button type="button" className="text-blue-700 text-xs font-semibold underline" onClick={()=>linkedDoc.kind==='client-file'?setReaderDoc(linkedDoc):onOpenDetail?.(linkedDoc)}>{linkedDoc.kind==='client-file'?'원본 열람':'열기'}</button>}<button type="button" aria-label={`${r.title} 빠른 점검`} aria-expanded={activeQuickReq?.id===r.id} className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200" onClick={()=>openQuickReview(r,files)}>빠른 점검</button>{linkedDoc&&linkedDoc.kind!=='client-file'&&<button type="button" aria-label={`${r.title} Word 문서 다운로드`} className="text-xs px-2 py-1 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-100" onClick={()=>downloadWordDoc(linkedDoc,p)}>다운로드(.doc)</button>}{linkedDoc&&(linkedDoc.fileUrl||linkedDoc.originalPath)&&<button type="button" aria-label={`${r.title} 첨부 원본 파일 다운로드`} className="text-xs px-2 py-1 rounded bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50" onClick={()=>downloadAttachedOriginal(linkedDoc)}>원본 파일 다운로드</button>}{suggestedMatch&&detail.canEdit&&<button type="button" aria-label={`${r.title} 추천 문서 자동 연결`} disabled={busy} className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold" onClick={()=>link(r.id,suggestedMatch.documentId)}>추천 연결: {suggestedMatch.documentTitle}</button>}{!r.document_id&&detail.canEdit&&onAddDocument&&<button type="button" aria-label={`${r.title} 초안 생성 후 연결`} disabled={busy} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold" onClick={()=>createDraftAndLink(r,p)}>초안 생성·연결</button>}{detail.canEdit&&onAddDocument&&<><input id={uploadInputId} type="file" aria-label={`${r.title} 파일 업로드 후 연결`} disabled={busy} accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp,.hwpx,.ppt,.pptx,.png,.jpg,.jpeg" className="sr-only" onChange={e=>uploadAndLinkFile(r,p,linkedDoc,e)}/><label htmlFor={uploadInputId} className={`text-xs px-2 py-1 rounded border cursor-pointer ${busy?'opacity-50 pointer-events-none':'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>{linkedDoc?'파일 첨부':'파일 업로드·연결'}</label></>}</div>{suggestedMatch&&<small className="block text-emerald-700 mt-1">자동 매칭 근거: {suggestedMatch.matchReason}</small>}{linkedDoc?.fileName&&<small className="block text-slate-500 mt-1">첨부 파일: {linkedDoc.fileName}</small>}</td><td>{!r.document_id||!linkedDoc?'준비 필요':detail.canEdit&&onUpdateDocument?<div><select aria-label={`${r.title} 확인 상태`} disabled={busy} value={state} onChange={e=>changeReviewStatus(r,linkedDoc,e.target.value)} className="border rounded p-1 text-xs">{Object.entries(DOCUMENT_REVIEW_STATUSES).map(([k,label])=><option key={k} value={k}>{label}</option>)}</select><small className="block text-slate-400 mt-0.5">내부 검토 기준 · 공식 심사 별도</small></div>:<span>{DOCUMENT_REVIEW_STATUSES[state]||'문서 연결 · 검토 필요'}</span>}</td></tr>;
 })}{detail.requirements.length>0&&!visibleRequirements.length&&<tr><td colSpan={4} className="text-center py-6 text-slate-500">조건에 맞는 구비서류가 없습니다. 검색어나 연결 상태를 바꿔 주세요.</td></tr>}</tbody></table></div>{!detail.requirements.length&&<p className="text-sm my-3">확인된 구비서류가 아직 등록되지 않았습니다. 이 상태를 준비 완료로 표시하지 않습니다.</p>}
 {activeQuickReq&&<aside role="region" aria-label="구비서류 빠른 점검 패널" className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 print:hidden">
  <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200 pb-2.5">
   <div>
    <span className="text-xs font-mono font-bold text-blue-700">{activeQuickReq.standard||'직접 지정'} · {activeQuickIdx+1}/{visibleRequirements.length}</span>
    <h3 className="text-sm font-bold text-slate-900">{activeQuickReq.title}</h3>
   </div>
   <div className="flex items-center gap-1.5 flex-wrap">
    <button type="button" disabled={!prevQuickReq} onClick={()=>prevQuickReq&&openQuickReview(prevQuickReq,files)} className="text-xs px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-40">← 이전 항목</button>
    <button type="button" disabled={!nextQuickReq} onClick={()=>nextQuickReq&&openQuickReview(nextQuickReq,files)} className="text-xs px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-40">다음 항목 →</button>
    {nextUnverifiedReq&&<button type="button" onClick={()=>openQuickReview(nextUnverifiedReq,files)} className="text-xs px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold">다음 미확인 항목으로 이동</button>}
    <button type="button" onClick={()=>setQuickReviewReqId(null)} className="text-xs px-2.5 py-1 rounded bg-slate-200 text-slate-700 font-semibold">점검 패널 닫기</button>
   </div>
  </div>
  {!activeQuickDoc?<div className="text-xs text-slate-600 flex items-center justify-between gap-2 flex-wrap"><span>아직 연결된 문서가 없습니다. 기존 문서를 연결하거나 초안을 생성해 점검을 시작하세요.</span>{detail.canEdit&&onAddDocument&&<button type="button" disabled={busy} onClick={()=>createDraftAndLink(activeQuickReq,p)} className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white font-semibold">초안 생성·연결</button>}</div>:<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
   <div className="space-y-2">
    <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-800">연결 문서 요약 ({activeQuickDoc.code||'코드 미지정'})</span><button type="button" onClick={()=>activeQuickDoc.kind==='client-file'?setReaderDoc(activeQuickDoc):onOpenDetail?.(activeQuickDoc)} className="text-xs text-blue-700 font-semibold underline">전체 편집기 열기</button></div>
    <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap max-h-36 overflow-y-auto">{activeQuickDoc.summary||activeQuickDoc.contentDraft?.slice(0,260)||'요약 내용이 없습니다.'}</p>
    {Array.isArray(activeQuickDoc.checklist)&&activeQuickDoc.checklist.length>0&&<div className="space-y-1">
     <span className="text-xs font-bold text-slate-800 block">필수 점검 체크리스트 ({activeQuickDoc.checklist.filter(c=>c.done).length}/{activeQuickDoc.checklist.length})</span>
     {activeQuickDoc.checklist.map((item,idx)=><label key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-white px-2.5 py-1.5 rounded border border-slate-200 cursor-pointer"><input type="checkbox" checked={Boolean(item.done)} disabled={!detail.canEdit||busy} onChange={()=>toggleQuickChecklistItem(activeQuickDoc,idx)}/><span>{item.text}</span></label>)}
    </div>}
   </div>
   <div className="space-y-2">
    <label htmlFor="quick-review-note-input" className="text-xs font-bold text-slate-800 block">검토·보완 메모 (인수인계 및 심사 전 확인사항)</label>
    <textarea id="quick-review-note-input" rows={3} disabled={!detail.canEdit||busy} value={reviewNoteDraft} onChange={e=>setReviewNoteDraft(e.target.value)} placeholder="예: 24년도 내부심사 결과보고서 스캔본 첨부 필요" className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"/>
    <div className="flex items-center justify-between gap-2 flex-wrap">
     <button type="button" disabled={!detail.canEdit||busy} onClick={()=>saveReviewNote(activeQuickReq,activeQuickDoc)} className="text-xs px-3 py-1.5 rounded bg-slate-800 text-white font-semibold disabled:opacity-50">검토 메모 저장</button>
     {detail.canEdit&&onUpdateDocument&&stateOf(activeQuickReq)!=='VERIFIED'&&<button type="button" disabled={busy} onClick={async()=>{await changeReviewStatus(activeQuickReq,activeQuickDoc,'VERIFIED');if(nextUnverifiedReq)openQuickReview(nextUnverifiedReq,files);}} className="text-xs px-3 py-1.5 rounded bg-emerald-600 text-white font-semibold disabled:opacity-50">내부 확인 완료 후 다음 항목 →</button>}
    </div>
   </div>
  </div>}
 </aside>}
 </section>
 <section className="platform-card"><header className="flex justify-between items-center gap-3 flex-wrap"><h2>준비 일정</h2><div className="flex items-center gap-3">{detail.canEdit&&taskSyncPlan.updates.length>0&&<button type="button" disabled={busy} onClick={()=>syncTasksManually(taskSyncPlan)} className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-300 font-semibold">구비서류 현황으로 일정 동기화 ({taskSyncPlan.updates.length}건)</button>}<Link className="text-blue-700" href={'/dashboard?'+companyQuery+'&view=calendar'}>달력에서 보기·수정</Link></div></header><p className="text-xs text-slate-500 my-3">검토 후 생성한 내부 준비 일정입니다. 구비서류 연결·확인 상태 변경 시 체크리스트와 진행 상태가 함께 갱신되며, 공식 심사·접수 예약은 연동되지 않았습니다.</p><table className="platform-table"><thead><tr><th scope="col">업무</th><th scope="col">체크리스트 진척</th><th scope="col">내부 마감</th><th scope="col">상태</th></tr></thead><tbody>{detail.tasks.map(t=>{
  const list=Array.isArray(t.checklist)?t.checklist:[];
  const doneCount=list.filter(item=>item?.done).length;
  return <tr key={t.id}><td><Link className="text-blue-700" href={'/dashboard?'+companyQuery+'&task='+encodeURIComponent(t.id)}>{t.title}</Link></td><td className="text-xs text-slate-600">{list.length?`${doneCount}/${list.length} 완료`:'항목 없음'}</td><td>{t.due_date||'미정'}</td><td>{detail.canEdit?<select aria-label={`${t.title} 일정 상태`} disabled={busy} value={t.status||'todo'} onChange={e=>changeTaskStatus(t,e.target.value)} className="border rounded p-1 text-xs">{Object.entries(TASK_STATUSES).map(([k,label])=><option key={k} value={k}>{label}</option>)}</select>:TASK_STATUSES[t.status]}</td></tr>;
 })}</tbody></table></section>
 {readerDoc&&<CloudFileViewer document={readerDoc} onClose={()=>setReaderDoc(null)}/>}
 </div>;
}
