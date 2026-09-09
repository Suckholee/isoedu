'use client';

import React, { useState, useMemo } from 'react';
import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Search, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Filter, 
  ArrowRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { ISO_STANDARDS_INFO } from '../lib/isoRequirementsData.js';
import { evaluateComplianceReadiness, evaluateAllStandardsOverview } from '../lib/complianceEngine.js';

export default function IsoComplianceMatrixView({
  documents,
  currentCompany,
  onOpenDetail,
  onAddDocument,
  onUpdateDocument
}) {
  const [selectedStandard, setSelectedStandard] = useState('ISO_9001');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'MISSING' | 'READY'
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
  const [activeReqForLink, setActiveReqForLink] = useState(null);

  // 1. 전체 규격 종합 개요 계산
  const standardsOverview = useMemo(() => {
    return evaluateAllStandardsOverview(documents, currentCompany?.id);
  }, [documents, currentCompany]);

  // 2. 현재 선택된 규격 세부 준비도 분석
  const currentAnalysis = useMemo(() => {
    return evaluateComplianceReadiness(documents, selectedStandard, currentCompany?.id);
  }, [documents, selectedStandard, currentCompany]);

  // 3. 상태 필터링된 그룹 항목들
  const filteredGroups = useMemo(() => {
    return currentAnalysis.groups.map(group => {
      const filteredItems = group.items.filter(item => {
        if (statusFilter === 'MISSING') return item.status === 'MISSING';
        if (statusFilter === 'READY') return item.status === 'READY' || item.status === 'EXPIRING';
        return true;
      });
      return {
        ...group,
        items: filteredItems
      };
    }).filter(group => group.items.length > 0);
  }, [currentAnalysis, statusFilter]);

  // 원클릭 AI 표준 템플릿 즉시 구비 (빈 슬롯 채우기)
  const handleGenerateTemplate = (req) => {
    const newDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      companyId: currentCompany?.id || 'comp-1',
      title: req.defaultTitle,
      code: req.defaultCode,
      standards: [req.standard],
      hierarchyLevel: req.level,
      clauseNumber: req.clause,
      department: currentAnalysis.standardInfo.primaryDepartment || '품질경영팀',
      author: 'AI 규격 자동편성기',
      version: 'v1.0',
      revisionNo: 'Rev. 1.0',
      status: 'READY',
      docStatus: '승인 완료',
      approvalDate: new Date().toISOString().split('T')[0],
      expiryDate: '2027-05-30',
      dDay: 365,
      penaltyRisk: req.penaltyRisk,
      summary: req.summary,
      checklist: [
        { text: `${req.standard} 규격 조항 ${req.clause} 요건 대조 완료`, done: true },
        { text: '사후심사 심사관 현장 검증 증빙 등록', done: true },
        { text: '부서장 최종 승인 및 전자 직인 날인', done: true },
      ],
      contentDraft: req.templateDraft || `# ${req.defaultTitle}\n\n1. 목적 및 범위\n2. 주관 부서 책임\n3. 이행 기준`,
      coverGradient: req.level === 'LEVEL_1' ? 'from-blue-600 to-indigo-700' :
                     req.level === 'LEVEL_2' ? 'from-emerald-600 to-teal-700' :
                     req.level === 'LEVEL_3' ? 'from-amber-600 to-orange-700' : 'from-purple-600 to-indigo-800'
    };

    onAddDocument && onAddDocument(newDoc);
  };

  // 기존 드라이브 문서와 연결
  const handleLinkExistingDoc = (doc) => {
    if (!activeReqForLink) return;

    // 해당 문서에 규격 및 조항 매핑 업데이트
    const updated = {
      ...doc,
      standards: Array.from(new Set([...(doc.standards || []), activeReqForLink.standard])),
      clauseNumber: activeReqForLink.clause,
      hierarchyLevel: activeReqForLink.level
    };

    onUpdateDocument && onUpdateDocument(updated);
    setIsLinkingModalOpen(false);
    setActiveReqForLink(null);
  };

  return (
    <div className="space-y-6 pb-6">
      
      {/* 1. Header: Enterprise Tenant & ISO Standards Switcher Tabs */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-normal text-slate-800 tracking-tight font-sans">
                ISO 규격별 법정 필수 구비 바인더
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>심사 레디니스 진단</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              국제표준 규격별 사전에 법적으로 정해진 필수 구비 문서 목록에 맞춰 귀사의 준비 상태를 1:1로 검증합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              기업: <b className="text-slate-900">{currentCompany?.name || '(주)아이소에듀'}</b>
            </span>
          </div>
        </div>

        {/* 2. Top ISO Standards Selector Tabs with live readiness badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {standardsOverview.map(std => {
            const isSelected = selectedStandard === std.code;
            return (
              <button
                key={std.code}
                onClick={() => setSelectedStandard(std.code)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative group ${
                  isSelected
                    ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-100'
                    : 'bg-[#f0f4f9]/60 hover:bg-white border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-900 truncate">
                    {std.name}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    std.readinessScore >= 80 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : std.readinessScore >= 50 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {std.readinessScore}% 완료
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mb-2">
                  {std.title}
                </div>
                
                {/* Mini progress bar */}
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      std.readinessScore >= 80 ? 'bg-emerald-500' : std.readinessScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${std.readinessScore}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium mt-1.5">
                  <span>구비 {std.readyCount} / {std.totalRequired}건</span>
                  {std.missingCount > 0 && (
                    <span className="text-rose-600 font-bold">{std.missingCount}건 미비</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* 3. Audit Preparedness Meter Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-lg space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {currentAnalysis.standardInfo.name}
              </span>
              <h2 className="text-lg font-bold text-white">
                {currentAnalysis.standardInfo.title} 심사 수검 준비율
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {currentAnalysis.standardInfo.description}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-3xl font-black text-white tracking-tight">
                {currentAnalysis.readinessScore}%
              </div>
              <div className="text-[11px] text-slate-400 font-bold">
                {currentAnalysis.readinessScore >= 80 ? '사후심사 통과 유력 (적합)' : '미비 문서 보완 필요'}
              </div>
            </div>
            
            {/* Circle Ring / SVG */}
            <div className="w-14 h-14 relative flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={currentAnalysis.readinessScore >= 80 ? '#10b981' : currentAnalysis.readinessScore >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3.5"
                  strokeDasharray={`${currentAnalysis.readinessScore}, 100`}
                />
              </svg>
              <span className="absolute text-[11px] font-black text-white">
                {currentAnalysis.readyCount}/{currentAnalysis.totalRequired}
              </span>
            </div>
          </div>
        </div>

        {/* Readiness Status Pills */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">구비 완료: <b className="text-emerald-400">{currentAnalysis.readyCount}건</b></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse"></span>
              <span className="text-slate-300">미비/작성 필요: <b className="text-rose-400">{currentAnalysis.missingCount}건</b></span>
            </div>
            {currentAnalysis.expiringCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-slate-300">만기 임박: <b className="text-amber-400">{currentAnalysis.expiringCount}건</b></span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <span>주관 부서: <b className="text-slate-200">{currentAnalysis.standardInfo.primaryDepartment}</b></span>
          </div>
        </div>

      </div>

      {/* 4. Filter Controls (All / Missing / Ready) */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>구비 요건 필터:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-[#f0f4f9] text-slate-600 hover:bg-[#edf2fc]'
            }`}
          >
            전체 필수 요건 ({currentAnalysis.totalRequired})
          </button>
          <button
            onClick={() => setStatusFilter('MISSING')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'MISSING'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>미비 / 작성 필요 ({currentAnalysis.missingCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('READY')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'READY'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>구비 완료 ({currentAnalysis.readyCount})</span>
          </button>
        </div>
      </div>

      {/* 5. Annex SL Clause Groups & Statutory Document Slots */}
      <div className="space-y-6">
        {filteredGroups.map(group => (
          <div key={group.name} className="space-y-3">
            
            {/* Clause Group Header */}
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-200/80 pb-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>{group.name}</span>
              <span className="text-xs text-slate-400 font-normal">
                ({group.items.filter(i => i.status !== 'MISSING').length}/{group.items.length} 항목 구비)
              </span>
            </div>

            {/* Requirement Slots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {group.items.map(req => {
                const isReady = req.status === 'READY';
                const isExpiring = req.status === 'EXPIRING';
                const isMissing = req.status === 'MISSING';

                return (
                  <div
                    key={req.id}
                    className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                      isMissing
                        ? 'bg-[#fffbfa] border-rose-200/90 shadow-2xs'
                        : isExpiring
                        ? 'bg-[#fffdf5] border-amber-300 shadow-xs'
                        : 'bg-white border-slate-200/90 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top Meta: Clause + Level + Status Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            § {req.clause}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {req.level === 'CERT' ? '인증서' :
                             req.level === 'LEVEL_1' ? '1계층 매뉴얼' :
                             req.level === 'LEVEL_2' ? '2계층 절차서' :
                             req.level === 'LEVEL_3' ? '3계층 지침서' : '4계층 양식'}
                          </span>
                        </div>

                        {/* Readiness Status Badge */}
                        {isReady && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>준비 완료</span>
                          </span>
                        )}
                        {isExpiring && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>만기 임박 (D-{req.matchedDoc?.dDay})</span>
                          </span>
                        )}
                        {isMissing && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 flex items-center gap-1 border border-rose-300 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>미비 (작성 필요)</span>
                          </span>
                        )}
                      </div>

                      {/* Requirement Title */}
                      <h4 className="font-bold text-sm text-slate-900 tracking-tight leading-snug">
                        {req.title}
                      </h4>

                      {/* Legal/Audit Verification Reason */}
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {req.legalAuditReason}
                      </p>

                      {/* Risk Penalty (If Missing) */}
                      {isMissing && req.penaltyRisk && (
                        <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 font-semibold flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span className="truncate">⚠️ {req.penaltyRisk}</span>
                        </div>
                      )}

                      {/* If Matched Document exists: Show File Chip */}
                      {req.matchedDoc && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate min-w-0">
                              <div className="font-bold text-xs text-slate-900 truncate">
                                {req.matchedDoc.title}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {req.matchedDoc.code} • {req.matchedDoc.version || 'v1.0'} • 담당: {req.matchedDoc.author || '담당자'}
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white text-slate-600 border border-slate-200 shrink-0">
                            {req.matchedDoc.docStatus || '승인 완료'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {req.matchedDoc ? (
                        <>
                          <button
                            onClick={() => onOpenDetail && onOpenDetail(req.matchedDoc)}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>문서 열람 및 편집 (Docs)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setActiveReqForLink(req);
                              setIsLinkingModalOpen(true);
                            }}
                            title="다른 문서로 매핑 변경"
                            className="py-1.5 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold"
                          >
                            변경
                          </button>
                        </>
                      ) : (
                        <>
                          {/* One-click AI Standard Template Generation */}
                          <button
                            onClick={() => handleGenerateTemplate(req)}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>✨ AI 표준 양식 즉시 채우기</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveReqForLink(req);
                              setIsLinkingModalOpen(true);
                            }}
                            className="py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors shrink-0"
                          >
                            문서 연결
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        ))}
      </div>

      {/* 6. Document Link Modal (내 드라이브의 기존 문서 연결) */}
      {isLinkingModalOpen && activeReqForLink && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
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

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {documents.map(doc => (
                <div
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
                </div>
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
        </div>
      )}

    </div>
  );
}
