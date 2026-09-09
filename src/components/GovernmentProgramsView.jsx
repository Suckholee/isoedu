'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Landmark, 
  Search, 
  FileCheck2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Download, 
  FolderPlus, 
  ChevronRight, 
  Filter, 
  Layers, 
  Clock, 
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { ALL_GOV_PROGRAMS, GOV_CENTRAL_PROGRAMS, GOV_LOCAL_PROGRAMS } from '../lib/governmentProgramsData';
import { matchDocumentsForProgram } from '../lib/crossDocumentMatcher';

export default function GovernmentProgramsView({ 
  documents = [], 
  onSelectDocument, 
  onCreateProjectWithProgram,
  onAddDocument
}) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'CENTRAL' | 'LOCAL' | 'RECOMMENDED'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState(ALL_GOV_PROGRAMS[2].id); // Default: 중기부 해외규격인증획득지원사업
  const [checklistFilter, setChecklistFilter] = useState('ALL'); // 'ALL' | 'REUSED' | 'MISSING'
  const [manualPickerItem, setManualPickerItem] = useState(null); // When user wants to connect another existing doc

  // Filtered Programs list
  const filteredPrograms = useMemo(() => {
    return ALL_GOV_PROGRAMS.filter(prog => {
      // Tab filter
      if (activeTab === 'CENTRAL' && prog.category !== 'CENTRAL') return false;
      if (activeTab === 'LOCAL' && prog.category !== 'LOCAL') return false;
      
      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = prog.title?.toLowerCase().includes(q);
        const matchDesc = prog.description?.toLowerCase().includes(q);
        const matchMinistry = (prog.ministry || prog.region)?.toLowerCase().includes(q);
        const matchTags = prog.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchMinistry && !matchTags) return false;
      }

      // Recommended filter (reuseRate >= 50%)
      if (activeTab === 'RECOMMENDED') {
        const evalResult = matchDocumentsForProgram(prog, documents);
        if (evalResult.reuseRate < 50) return false;
      }

      return true;
    });
  }, [activeTab, searchQuery, documents]);

  // Selected Program object
  const selectedProgram = useMemo(() => {
    return ALL_GOV_PROGRAMS.find(p => p.id === selectedProgramId) || filteredPrograms[0] || ALL_GOV_PROGRAMS[0];
  }, [selectedProgramId, filteredPrograms]);

  // Evaluated checklist & cross-document reuse metrics
  const evaluation = useMemo(() => {
    if (!selectedProgram) return null;
    return matchDocumentsForProgram(selectedProgram, documents);
  }, [selectedProgram, documents]);

  // Filtered Checklist items
  const displayedChecklist = useMemo(() => {
    if (!evaluation) return [];
    if (checklistFilter === 'REUSED') {
      return evaluation.evaluatedItems.filter(item => item.status === 'MATCHED_REUSED');
    }
    if (checklistFilter === 'MISSING') {
      return evaluation.evaluatedItems.filter(item => item.status !== 'MATCHED_REUSED');
    }
    return evaluation.evaluatedItems;
  }, [evaluation, checklistFilter]);

  // Handle AI Auto-generation of missing document
  const handleGenerateAiDoc = (item) => {
    const newDoc = {
      id: `ai-gov-${Date.now()}`,
      name: `[${selectedProgram.title.split(' ')[0]}] ${item.name} (표준 제출용)`,
      category: item.matchedCategory || '04. 기록 / 양식 (Records)',
      code: `GOV-${selectedProgram.id}-${Math.floor(Math.random()*900+100)}`,
      clause: '정부지원사업 필수 제출서류',
      standard: 'GOV_GRANT',
      description: `${selectedProgram.title} 신청을 위해 AI 규격 표준으로 신규 작성된 제출용 서류입니다.`,
      status: '최신본',
      version: 'v1.0',
      updatedAt: '방금 전',
      author: 'AI 지원사업 전담팀',
      content: `# ${selectedProgram.title}\n## 필수 제출 서류: ${item.name}\n\n### 1. 제출 기업 개요\n- 지원 사업명: ${selectedProgram.title}\n- 주관 부처/지자체: ${selectedProgram.ministry || selectedProgram.region}\n- 대상 인증 규격: 해외 규격 인증 (CE, FDA, ISO 등)\n\n### 2. 과업 개요 및 목적\n본 문서는 ${selectedProgram.title}의 지원 자격을 충족하고 사업계획의 객관적 타당성을 입증하기 위해 작성된 공식 제출 문서입니다.\n\n### 3. 세부 추진 내용\n- 추진 일정: 협약 체결일로부터 6개월 이내\n- 소요 예산: ${selectedProgram.budgetLimit}\n- 기대 효과: 글로벌 신규 판로 개척 및 수출액 전년 대비 150% 신장 달성.\n\n### 4. 서약 및 승인\n위 기재 내용은 사실과 다름없음을 확인하며, 지원사업 지침을 준수할 것을 서약합니다.\n\n대표이사 직인 (날인 완료)`
    };

    if (onAddDocument) {
      onAddDocument(newDoc);
    }
    alert(`"${newDoc.name}" 서류가 생성되어 [${newDoc.category}] 폴더에 자동 등록되었습니다!`);
  };

  // Connect manually picked doc
  const handleConnectDoc = (targetItem, selectedDoc) => {
    alert(`"${selectedDoc.name}" 문서가 "${targetItem.name}" 제출 서류로 매핑되었습니다.`);
    setManualPickerItem(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafd] overflow-hidden">
      {/* 1. Header Banner */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5" /> 정부·지자체 53선 마스터
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 기존 구비 문서 크로스 재사용 (Cross-Reuse)
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              정부 & 지자체 해외인증 지원사업 매니저
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              정부 26개 부처 및 지자체 27개 지원사업 필수 서류 체크리스트를 기업이 이미 구비한 ISO 심사/법인/노무 문서와 1:1 자동 매핑합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onCreateProjectWithProgram && onCreateProjectWithProgram(selectedProgram)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all hover:shadow"
            >
              <FolderPlus className="w-4 h-4" />
              <span>이 사업으로 매니징 폴더 생성</span>
            </button>
          </div>
        </div>

        {/* Search & Tabs bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ALL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 53선
            </button>
            <button
              onClick={() => setActiveTab('CENTRAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                activeTab === 'CENTRAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Landmark className="w-3 h-3" /> 중앙정부 (26선)
            </button>
            <button
              onClick={() => setActiveTab('LOCAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                activeTab === 'LOCAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3 h-3" /> 전국 지자체 (27선)
            </button>
            <button
              onClick={() => setActiveTab('RECOMMENDED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                activeTab === 'RECOMMENDED' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-500" /> 맞춤 추천 (구비율 50%↑)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="부처, 지자체, 규격(CE, FDA) 검색..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Main Content Split: Left Catalog vs Right Detail Binder */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Programs Catalog List */}
        <div className="w-80 md:w-96 border-r border-slate-200 bg-white flex flex-col overflow-hidden shrink-0">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">지원사업 목록 ({filteredPrograms.length}건)</span>
            <span>클릭하여 서류 매핑 분석</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
            {filteredPrograms.map((prog) => {
              const isSelected = prog.id === selectedProgram?.id;
              const evalRes = matchDocumentsForProgram(prog, documents);

              return (
                <div
                  key={prog.id}
                  onClick={() => setSelectedProgramId(prog.id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border text-left ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                      prog.category === 'CENTRAL'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {prog.ministry || prog.region}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      p.{prog.pageRef}
                    </span>
                  </div>

                  <h3 className={`text-xs font-bold leading-snug line-clamp-2 ${
                    isSelected ? 'text-blue-900' : 'text-slate-800'
                  }`}>
                    {prog.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                    {prog.budgetLimit}
                  </p>

                  {/* Reuse matching rate pill */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">기존 구비 문서 매칭</span>
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      evalRes.reuseRate >= 70
                        ? 'bg-emerald-100 text-emerald-700'
                        : evalRes.reuseRate >= 40
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {evalRes.matchedCount}/{evalRes.totalRequired}건 ({evalRes.reuseRate}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Program Details & Cross-Project Reuse Binder */}
        <div className="flex-1 flex flex-col bg-[#f8fafd] overflow-y-auto p-6">
          {selectedProgram ? (
            <div className="max-w-5xl mx-auto w-full space-y-6">
              {/* Program Overview Banner */}
              <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {selectedProgram.category === 'CENTRAL' ? '🏛️ 중앙정부 지원사업' : '🏢 지자체 해외인증 지원'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        주관: {selectedProgram.ministry || selectedProgram.region}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        자료 출처: p.{selectedProgram.pageRef}
                      </span>
                    </div>

                    <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                      {selectedProgram.title}
                    </h2>

                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                      {selectedProgram.description}
                    </p>
                  </div>

                  <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 shrink-0 text-center min-w-[200px]">
                    <div className="text-xs text-blue-600 font-semibold mb-1">지원 규모</div>
                    <div className="text-base font-extrabold text-blue-900 leading-tight">
                      {selectedProgram.budgetLimit}
                    </div>
                    <div className="text-[11px] text-blue-500 mt-1">
                      {selectedProgram.targetIndustry}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-400 mr-1">핵심 태그:</span>
                  {selectedProgram.tags?.map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cross-Reuse Engine Evaluation Card */}
              {evaluation && (
                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-[24px] p-6 text-white shadow-md relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                      {/* Reuse Circle Ring */}
                      <div className="w-20 h-20 rounded-full border-4 border-emerald-400/40 flex flex-col items-center justify-center bg-emerald-950/60 shadow-inner">
                        <span className="text-2xl font-black text-emerald-300 leading-none">
                          {evaluation.reuseRate}%
                        </span>
                        <span className="text-[10px] text-emerald-200/80 uppercase font-semibold mt-0.5">
                          재사용률
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            사내 기존 구비 문서 스마트 자동 매핑 분석
                          </h3>
                          {evaluation.bonusPointsCount > 0 && (
                            <span className="px-2 py-0.5 bg-amber-400 text-amber-950 rounded-full text-xs font-black">
                              +{evaluation.bonusPointsCount}점 가점 확보!
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-emerald-100/80 max-w-xl">
                          {evaluation.summaryMessage}
                        </p>
                        <p className="text-[11px] text-emerald-200/60">
                          * ISO 심사, 법인 정관, 취업규칙 등 기존에 갖추어 둔 문서를 재활용하여 중복 서류 작업 비용을 대폭 절감합니다.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => onCreateProjectWithProgram && onCreateProjectWithProgram(selectedProgram)}
                        className="px-4 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>전용 관리 폴더 생성</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Detailed Submission Documents Binder */}
              <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-blue-600" />
                      지원사업 필수 제출서류 & 기존 문서 매핑 바인더
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      각 항목별로 기존 구비 문서를 확인하고, 미비된 서류는 AI 표준 서식으로 즉시 생성할 수 있습니다.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setChecklistFilter('ALL')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        checklistFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      전체 ({evaluation?.totalRequired || 0})
                    </button>
                    <button
                      onClick={() => setChecklistFilter('REUSED')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        checklistFilter === 'REUSED' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      🟢 재사용 가능 ({evaluation?.matchedCount || 0})
                    </button>
                    <button
                      onClick={() => setChecklistFilter('MISSING')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        checklistFilter === 'MISSING' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      🔴 신규 준비 필요 ({evaluation?.missingCount || 0})
                    </button>
                  </div>
                </div>

                {/* Submission Items List */}
                <div className="space-y-3">
                  {displayedChecklist.map((item, idx) => {
                    const isMatched = item.status === 'MATCHED_REUSED';

                    return (
                      <div
                        key={item.id || idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          isMatched
                            ? 'bg-emerald-50/40 border-emerald-200/90'
                            : item.status === 'GOV_ISSUE_FRESH'
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-rose-50/30 border-rose-200'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${item.statusColor}`}>
                                {item.statusLabel}
                              </span>

                              {item.type === 'BONUS' ? (
                                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  ⭐ 평가 가점 항목 ({item.points})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                                  필수 제출 서류
                                </span>
                              )}

                              <span className="text-xs text-slate-500">
                                발급/작성처: <strong className="text-slate-700">{item.issuer}</strong>
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              {isMatched ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              )}
                              <span>{item.name}</span>
                            </h4>

                            <p className="text-xs text-slate-600">
                              {item.description}
                            </p>

                            {/* Reuse Detail Note */}
                            <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                              isMatched
                                ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" />
                              <span>{item.reuseNote}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
                            {isMatched && item.matchedDoc ? (
                              <button
                                onClick={() => onSelectDocument && onSelectDocument(item.matchedDoc)}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>매핑된 문서 열람</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleGenerateAiDoc(item)}
                                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>✨ AI 서식 즉시 생성</span>
                                </button>
                                <button
                                  onClick={() => setManualPickerItem(item)}
                                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all"
                                >
                                  기존 문서 수동 연결
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12">
              <Landmark className="w-12 h-12 stroke-1 mb-2" />
              <p className="text-sm font-semibold">좌측 목록에서 지원사업을 선택하세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Manual Document Picker Modal */}
      {manualPickerItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">
                기존 사내 문서함에서 연결
              </h3>
              <button
                onClick={() => setManualPickerItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              필수 제출 항목: <strong>{manualPickerItem.name}</strong><br />
              현재 사내에 보관된 아래 문서 중 연결할 문서를 선택하세요.
            </p>
            <div className="max-h-64 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => handleConnectDoc(manualPickerItem, doc)}
                  className="p-2.5 rounded-xl hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-all"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">{doc.displayName || doc.title || doc.name}</div>
                    <div className="text-[11px] text-slate-400">{doc.category} · {doc.code}</div>
                  </div>
                  <button className="px-2 py-1 bg-blue-600 text-white text-[11px] font-semibold rounded-lg">
                    연결
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
