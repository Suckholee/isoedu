'use client';
import ModalLayer from './ui/ModalLayer';
import CloudFileViewer from './CloudFileViewer';

import React, { useState, useMemo, useEffect } from 'react';
import {FileText,ChevronLeft,ChevronRight,RotateCcw} from 'lucide-react';
import styles from './IsoComplianceMatrixView.module.css';
import {DOCUMENT_TYPES,registerDate,selectComplianceRows} from '../lib/complianceRegister.mjs';
import { evaluateComplianceReadiness, evaluateAllStandardsOverview } from '../lib/complianceEngine.js';

export default function IsoComplianceMatrixView({
  initialStandard = 'ISO_9001',
  onSelectStandard,
  documents,
  currentCompany,
  onOpenDetail,
  onAddDocument,
  onUpdateDocument
}) {
  const [selectedStandard, setSelectedStandard] = useState(initialStandard);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'MISSING' | 'READY'
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
  const [activeReqForLink, setActiveReqForLink] = useState(null);

  const [filters,setFilters]=useState({type:'ALL',query:'',code:'',owner:'',date:'',sort:'clause',direction:'asc'});
  const [page,setPage]=useState(1),[pageSize,setPageSize]=useState(20);
  const [readerDoc,setReaderDoc]=useState(null);
  const [busy,setBusy]=useState(false),[actionError,setActionError]=useState('');
  // 1. 전체 규격 종합 개요 계산
  const standardsOverview = useMemo(() => {
    return evaluateAllStandardsOverview(documents, currentCompany?.id);
  }, [documents, currentCompany]);

  // 2. 현재 선택된 규격 세부 준비도 분석
  const currentAnalysis = useMemo(() => {
    return evaluateComplianceReadiness(documents, selectedStandard, currentCompany?.id);
  }, [documents, selectedStandard, currentCompany]);

  const rows=useMemo(()=>selectComplianceRows(currentAnalysis.requirements,{...filters,status:statusFilter}),[currentAnalysis,filters,statusFilter]);
  const pages=Math.max(1,Math.ceil(rows.length/pageSize)),safePage=Math.min(page,pages);
  const visible=rows.slice((safePage-1)*pageSize,safePage*pageSize);
  const setFilter=(field,value)=>{setFilters(prev=>({...prev,[field]:value}));setPage(1);};
  const sortBy=field=>{setFilters(prev=>({...prev,sort:field,direction:prev.sort===field&&prev.direction==='asc'?'desc':'asc'}));setPage(1);};
  const reset=()=>{setFilters({type:'ALL',query:'',code:'',owner:'',date:'',sort:'clause',direction:'asc'});setStatusFilter('ALL');setPage(1);};
  useEffect(()=>{setPage(1);setReaderDoc(null);setIsLinkingModalOpen(false);setActiveReqForLink(null);setActionError('');},[currentCompany?.id,selectedStandard]);
  const openLink=req=>{setActiveReqForLink(req);setIsLinkingModalOpen(true);setActionError('');};
  const sortHeader=(field,label)=><button type="button" className={styles.sort} onClick={()=>sortBy(field)}>{label}<span>{filters.sort===field?(filters.direction==='asc'?'▴':'▾'):'▿'}</span></button>;

  // 기존 기준 양식으로 검토 전 초안을 저장한다.
  const handleGenerateTemplate = async (req) => {
    if(busy||!currentCompany?.id)return;setBusy(true);setActionError('');
    const newDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      companyId: currentCompany?.id || 'comp-1',
      title: req.defaultTitle,
      code: req.defaultCode,
      standards: [req.standard],
      hierarchyLevel: req.level,
      clauseNumber: req.clause,
      department: currentAnalysis.standardInfo.primaryDepartment || '품질경영팀',
      author: '기준 양식 초안',
      version: 'v1.0',
      revisionNo: 'Rev. 1.0',
      status: 'DRAFT',
      docStatus: '작성 중',
      approvalDate: null,
      expiryDate: null,
      penaltyRisk: req.penaltyRisk,
      summary: req.summary,
      checklist: [
        { text: `${req.standard} 규격 조항 ${req.clause} 요건 대조 완료`, done: false },
        { text: '사후심사 심사관 현장 검증 증빙 등록', done: false },
        { text: '부서장 최종 승인 및 전자 직인 날인', done: false },
      ],
      contentDraft: req.templateDraft || `# ${req.defaultTitle}\n\n1. 목적 및 범위\n2. 주관 부서 책임\n3. 이행 기준`,
      coverGradient: req.level === 'LEVEL_1' ? 'from-blue-600 to-indigo-700' :
                     req.level === 'LEVEL_2' ? 'from-emerald-600 to-teal-700' :
                     req.level === 'LEVEL_3' ? 'from-amber-600 to-orange-700' : 'from-purple-600 to-indigo-800'
    };

    try{const saved=await onAddDocument?.(newDoc);if(!saved)throw Error('양식을 저장하지 못했습니다. 다시 시도해 주세요.');onOpenDetail?.(saved);}catch(e){setActionError(e.message);}finally{setBusy(false);}
  };

  // 기존 드라이브 문서와 연결
  const handleLinkExistingDoc = async (doc) => {
    if (!activeReqForLink||busy||doc.companyId!==currentCompany?.id) return;
    setBusy(true);setActionError('');
    try {

    // 해당 문서에 규격 및 조항 매핑 업데이트
    const updated = {
      ...doc,
      standards: Array.from(new Set([...(doc.standards || []), activeReqForLink.standard])),
      clauseNumber: activeReqForLink.clause,
      hierarchyLevel: activeReqForLink.level
    };

    const saved = onUpdateDocument && await onUpdateDocument(updated);
    if (!saved) throw Error('문서 연결을 저장하지 못했습니다. 다시 시도해 주세요.');
    setIsLinkingModalOpen(false);
    setActiveReqForLink(null);
    }catch(e){setActionError(e.message);}finally{setBusy(false);}
  };

  return (
    <div className={styles.workspace}>
      <header className={styles.heading}><div><h1>ISO 인증 관리</h1><p>{currentCompany?.name} · 규격과 문서 유형별로 연결 문서를 관리하세요.</p></div></header>
      <nav className={styles.standards} aria-label="ISO 규격 선택">{standardsOverview.map(std=><button key={std.code} type="button" aria-pressed={selectedStandard===std.code} onClick={()=>onSelectStandard?onSelectStandard(std.code):setSelectedStandard(std.code)}>{std.name}<span className={styles.count}>{std.readyCount}/{std.totalRequired}</span></button>)}</nav>
      <nav className={styles.states} aria-label="ISO 문서 연결 상태">{[['ALL','전체 요건',currentAnalysis.totalRequired],['MISSING','미연결',currentAnalysis.missingCount],['LINKED','문서 연결됨',currentAnalysis.readyCount],['EXPIRING','기한 확인',currentAnalysis.expiringCount]].map(([id,label,count])=><button type="button" key={id} aria-pressed={statusFilter===id} onClick={()=>{setStatusFilter(id);setPage(1);}}>{label}<span className={styles.count}>{count}</span></button>)}<span className={styles.summary}>문서 연결률 {currentAnalysis.readinessScore}% · 심사 적합 판정과 별도</span></nav>
      {actionError&&<p role="alert" className={styles.error}>{actionError}</p>}
      <section className={styles.register} aria-label="ISO 구비문서 관리 대장">
       <div className={styles.toolbar}><strong>구비문서 관리 대장</strong><span>총 {currentAnalysis.totalRequired}건 중 {rows.length}건 · {currentAnalysis.standardInfo.name}</span><button type="button" onClick={reset}><RotateCcw size={12} className="inline mr-1"/>필터 초기화</button></div>
       <div className={styles.scroll}>
        <table className={styles.table}>
         <colgroup><col style={{width:40}}/><col style={{width:100}}/><col style={{width:105}}/><col/><col style={{width:125}}/><col style={{width:95}}/><col style={{width:105}}/><col style={{width:165}}/></colgroup>
         <thead>
          <tr className={styles.filters}><th>필터</th><th><input aria-label="조항·문서 코드 검색" placeholder="코드 검색" value={filters.code} onChange={e=>setFilter('code',e.target.value)}/></th><th><select aria-label="문서 유형 필터" value={filters.type} onChange={e=>setFilter('type',e.target.value)}><option value="ALL">전체 유형</option>{Object.entries(DOCUMENT_TYPES).map(([id,label])=><option key={id} value={id}>{label} ({currentAnalysis.requirements.filter(r=>r.level===id).length})</option>)}</select></th><th><input aria-label="요건·연결 문서명 검색" placeholder="요건·연결 문서명·코드 검색…" value={filters.query} onChange={e=>setFilter('query',e.target.value)}/></th><th><input aria-label="담당자·부서 검색" placeholder="담당자·부서" value={filters.owner} onChange={e=>setFilter('owner',e.target.value)}/></th><th><input aria-label="문서 수정일 필터" type="date" value={filters.date} onChange={e=>setFilter('date',e.target.value)}/></th><th><select aria-label="연결 상태 필터" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}><option value="ALL">전체 상태</option><option value="MISSING">미연결</option><option value="LINKED">연결됨</option><option value="EXPIRING">기한 확인</option></select></th><th/></tr>
          <tr><th>No.</th><th aria-sort={filters.sort==='clause'?(filters.direction==='asc'?'ascending':'descending'):'none'}>{sortHeader('clause','조항 / 코드')}</th><th>문서 유형</th><th>{sortHeader('title','구비 요건 / 연결 문서')}</th><th>{sortHeader('department','담당 / 부서')}</th><th>{sortHeader('date','수정일')}</th><th>{sortHeader('status','연결 상태')}</th><th>문서 관리</th></tr>
         </thead>
         <tbody>{visible.map((req,index)=>{
          const doc=req.matchedDoc;const date=registerDate(req);const knownDay=typeof doc?.dDay==='number'&&Number.isFinite(doc.dDay);
          return <tr key={req.id}><td className="text-center text-slate-400">{(safePage-1)*pageSize+index+1}</td><td><span className={styles.code}>§ {req.clause}</span><small className={styles.secondary}>{doc?.code||req.defaultCode}</small></td><td><span className={styles.type}>{DOCUMENT_TYPES[req.level]||req.level}</span></td><td><span className={styles.requirement} title={[req.title,req.legalAuditReason].filter(Boolean).join(' · ')}>{req.title}</span><small className={styles.secondary} title={doc?.title||req.clauseGroup}>{doc?`${doc.title} · ${doc.docStatus||doc.status||'상태 미확인'}`:req.clauseGroup}</small></td><td><span>{doc?.department||'—'}</span><small className={styles.secondary}>{doc?.author||'담당 미지정'}</small></td><td>{date||'—'}</td><td><span className={`${styles.badge} ${req.status==='MISSING'?styles.missing:req.status==='EXPIRING'?styles.expiring:styles.linked}`}>{req.status==='MISSING'?'미연결':req.status==='EXPIRING'?(knownDay?`기한 D${doc.dDay>=0?'-':'+'}${Math.abs(doc.dDay)}`:'기한 미확인'):'연결됨'}</span></td><td><div className={styles.actions}>{doc?<button type="button" onClick={()=>doc.kind==='client-file'?setReaderDoc(doc):onOpenDetail?.(doc)}>열람·편집 →</button>:<button type="button" disabled={busy} onClick={()=>handleGenerateTemplate(req)}>양식으로 작성</button>}<button type="button" disabled={busy} onClick={()=>openLink(req)}>{doc?'변경':'문서 연결'}</button></div></td></tr>;
         })}{!visible.length&&<tr><td className={styles.empty} colSpan={8}>조건에 맞는 구비 요건이 없습니다. 필터를 초기화해 확인하세요.</td></tr>}</tbody>
        </table>
       </div>
       <footer className={styles.footer}><label>페이지당 표시: <select aria-label="ISO 목록 페이지당 표시" value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}}>{[10,20,50].map(n=><option value={n} key={n}>{n}건</option>)}</select></label><span>문서 연결 상태는 실제 심사 적합·승인 상태와 별도입니다.</span><div className={styles.pages}><button type="button" aria-label="ISO 목록 이전 페이지" disabled={safePage<=1} onClick={()=>setPage(safePage-1)}><ChevronLeft size={14}/></button><span>{safePage} / {pages}</span><button type="button" aria-label="ISO 목록 다음 페이지" disabled={safePage>=pages} onClick={()=>setPage(safePage+1)}><ChevronRight size={14}/></button></div></footer>
      </section>

      {readerDoc&&<CloudFileViewer document={readerDoc} onClose={()=>setReaderDoc(null)}/>}
      {/* 6. Document Link Modal (내 드라이브의 기존 문서 연결) */}
      {isLinkingModalOpen && activeReqForLink && (
        <ModalLayer onClose={() => {setIsLinkingModalOpen(false);setActiveReqForLink(null);}} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  내 드라이브 문서 연결
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  [{activeReqForLink.clause}] {activeReqForLink.title} 요건에 연결할 문서를 선택하세요.
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsLinkingModalOpen(false);
                  setActiveReqForLink(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {actionError&&<p role="alert" className={styles.error}>{actionError}</p>}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {!documents.some(doc=>doc.companyId===currentCompany?.id)&&<p className="p-4 text-sm text-slate-500" role="status">이 거래처에 연결할 수 있는 문서가 없습니다.</p>}
              {documents.filter(doc=>doc.companyId===currentCompany?.id).map(doc => (
                <button type="button" disabled={busy}
                  key={doc.id}
                  onClick={() => handleLinkExistingDoc(doc)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 truncate min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate min-w-0">
                      <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 truncate">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {doc.code} • {doc.hierarchyLevel} • {doc.author || '담당자'}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    연결하기 →
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t flex justify-end">
              <button
                onClick={() => {
                  setIsLinkingModalOpen(false);
                  setActiveReqForLink(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                닫기
              </button>
            </div>

          </div>
        </ModalLayer>
      )}

    </div>
  );
}
