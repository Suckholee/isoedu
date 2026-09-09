'use client';

import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  ChevronDown, 
  ChevronRight, 
  MoreVertical, 
  Info, 
  Users, 
  Check, 
  Grid, 
  List, 
  Award, 
  BookOpen, 
  GitPullRequest, 
  FileText, 
  ClipboardCheck, 
  AlertCircle,
  Clock, 
  Sparkles, 
  ArrowUpDown, 
  Filter, 
  Layers, 
  CheckCircle2,
  ShieldCheck,
  Star,
  Copy,
  Trash2,
  Printer,
  X,
  ExternalLink,
  HardDrive,
  Cpu,
  Leaf,
  ShieldAlert,
  Stethoscope,
  Zap,
  Globe,
  Plus
} from 'lucide-react';
import { ISO_STANDARDS_INFO, ISO_MANDATORY_REQUIREMENTS } from '../lib/isoRequirementsData.js';
import { 
  ISO_9001_CATEGORIES, 
  ISO_9001_MASTER_BLUEPRINT, 
  getStarter15Documents, 
  getBlueprintByCategory 
} from '../lib/iso9001Blueprint.js';
import { evaluateComplianceReadiness } from '../lib/complianceEngine.js';
import IsoComplianceMatrixView from './IsoComplianceMatrixView.jsx';

export default function DriveExplorer({
  documents,
  selectedStandard = 'ISO_9001',
  onSelectStandard,
  selectedFolder = 'ALL',
  onSelectFolder,
  onOpenDetail,
  onOpenNewDoc,
  activeStatusFilter,
  onClearStatusFilter,
  currentCompany,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onToggleStar,
  onDuplicateDoc
}) {
  const [driveViewTab, setDriveViewTab] = useState('folders'); // 'folders' | 'matrix'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [isFolderSectionOpen, setIsFolderSectionOpen] = useState(true);
  const [isFileSectionOpen, setIsFileSectionOpen] = useState(true);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [activeMenuDocId, setActiveMenuDocId] = useState(null);
  const [iso9001Filter, setIso9001Filter] = useState('ALL'); // 'ALL' | 'STARTER_15' | 'BASE' | 'PROCEDURE' | 'RECORD' | 'AI_SPECIFIC'
  const [copiedToast, setCopiedToast] = useState(false);

  // 1. 현재 선택된 규격 메타 정보
  const currentStandardInfo = useMemo(() => {
    return ISO_STANDARDS_INFO.find(s => s.code === selectedStandard) || ISO_STANDARDS_INFO[0];
  }, [selectedStandard]);

  // 2. 현재 선택된 규격에 대한 준비도 분석
  const complianceStats = useMemo(() => {
    return evaluateComplianceReadiness(documents, selectedStandard, currentCompany?.id);
  }, [documents, selectedStandard, currentCompany]);

  // 3. ISO 규격별 마스터 블루프린트 항목들과 등록된 문서 간의 결합
  const standardCombinedItems = useMemo(() => {
    if (selectedStandard === 'ISO_9001') {
      return ISO_9001_MASTER_BLUEPRINT.map(item => {
        const matched = documents.find(d => {
          const matchStd = !d.standards || d.standards.includes('ISO_9001') || d.standards.includes('ALL');
          if (!matchStd) return false;
          const codeUpper = (d.code || '').toUpperCase();
          const itemCodeUpper = (item.code || '').toUpperCase();
          if (codeUpper === itemCodeUpper) return true;
          if (item.code && codeUpper.includes(item.code)) return true;
          if (d.title && item.title && (d.title.includes(item.title.split(' ')[0]) || item.title.includes(d.title.split(' ')[0]))) return true;
          return false;
        });

        return {
          ...item,
          isRegistered: Boolean(matched),
          registeredDoc: matched || null,
          displayContent: matched?.contentDraft || matched?.content || item.templateDraft
        };
      });
    }

    // 기타 규격 (ISO 14001, 45001, 27001, 13485) 또는 전체 모드
    const standardReqs = ISO_MANDATORY_REQUIREMENTS.filter(r => selectedStandard === 'ALL' || r.standard === selectedStandard);

    const reqItems = standardReqs.map(req => {
      const matched = documents.find(d => {
        const matchStd = !d.standards || d.standards.includes(req.standard) || d.standards.includes('ALL');
        if (!matchStd) return false;
        const codeUpper = (d.code || '').toUpperCase();
        const reqCodeUpper = (req.defaultCode || req.codePattern || '').toUpperCase();
        if (codeUpper && reqCodeUpper && (codeUpper === reqCodeUpper || codeUpper.includes(reqCodeUpper) || reqCodeUpper.includes(codeUpper))) return true;
        if (d.title && req.title && (d.title.includes(req.title.split(' ')[0]) || req.title.includes(d.title.split(' ')[0]))) return true;
        return false;
      });

      return {
        id: req.id,
        code: req.defaultCode || req.codePattern,
        title: req.title || req.defaultTitle,
        category: req.clauseGroup || '필수 규격 문서',
        subCategory: req.clauseGroup || '필수 조항',
        level: req.level,
        clause: req.clause,
        summary: req.summary,
        legalAuditReason: req.legalAuditReason,
        penaltyRisk: req.penaltyRisk,
        templateDraft: req.templateDraft,
        isRegistered: Boolean(matched),
        registeredDoc: matched || null,
        displayContent: matched?.contentDraft || matched?.content || req.templateDraft
      };
    });

    // 사용자가 직접 등록한 사내 문서 중 reqItems에 없는 문서 추가 병합
    const customDocs = documents.filter(d => {
      const matchStd = selectedStandard === 'ALL' || (d.standards && (d.standards.includes(selectedStandard) || d.standards.includes('ALL')));
      if (!matchStd) return false;
      return !reqItems.some(r => r.registeredDoc?.id === d.id);
    }).map(d => ({
      id: d.id,
      code: d.code,
      title: d.title,
      category: d.category || '사내 등록 문서',
      subCategory: d.hierarchyLevel === 'LEVEL_1' ? '매뉴얼' : d.hierarchyLevel === 'LEVEL_2' ? '절차서' : d.hierarchyLevel === 'LEVEL_3' ? '지침서' : d.hierarchyLevel === 'LEVEL_4' ? '기록' : '인증서',
      level: d.hierarchyLevel,
      clause: d.clauseNumber || '전 조항',
      summary: d.summary || '',
      legalAuditReason: '사내 등록 표준 규격 문서',
      penaltyRisk: d.penaltyRisk || '',
      templateDraft: d.contentDraft || d.content,
      isRegistered: true,
      registeredDoc: d,
      displayContent: d.contentDraft || d.content
    }));

    return [...reqItems, ...customDocs];
  }, [selectedStandard, documents]);

  // 4. 필터링된 항목 목록
  const displayedItems = useMemo(() => {
    return standardCombinedItems.filter(item => {
      // 1) 폴더 필터
      if (selectedFolder !== 'ALL') {
        if (selectedStandard === 'ISO_9001') {
          if ((selectedFolder === 'LEVEL_1' || selectedFolder === 'BASE') && item.category !== 'BASE' && item.level !== 'LEVEL_1') return false;
          if ((selectedFolder === 'LEVEL_2' || selectedFolder === 'PROCEDURE') && item.category !== 'PROCEDURE' && item.level !== 'LEVEL_2') return false;
          if ((selectedFolder === 'LEVEL_4' || selectedFolder === 'RECORD' || selectedFolder === 'LEVEL_3') && item.category !== 'RECORD' && item.level !== 'LEVEL_4' && item.level !== 'LEVEL_3') return false;
          if (selectedFolder === 'CERT' && item.level !== 'CERT') return false;
        } else {
          if (selectedFolder === 'STARRED') {
            if (!item.isStarred && (!item.registeredDoc || !item.registeredDoc.isStarred)) return false;
          } else if (item.level !== selectedFolder) {
            return false;
          }
        }
      }

      // 2) ISO 9001 전용 서브 필터 (네오앤피터 15종, AI 특화 등)
      if (selectedStandard === 'ISO_9001') {
        if (iso9001Filter === 'STARTER_15' && !item.isStarter15) return false;
        if (iso9001Filter === 'AI_SPECIFIC' && item.subCategory !== 'AI·컨설팅 특화') return false;
        if (iso9001Filter === 'BASE' && item.category !== 'BASE') return false;
        if (iso9001Filter === 'PROCEDURE' && item.category !== 'PROCEDURE') return false;
        if (iso9001Filter === 'RECORD' && item.category !== 'RECORD') return false;
      }

      // 3) 상태 필터 (만기임박 등)
      if (activeStatusFilter === 'EXPIRING') {
        const dDay = item.registeredDoc?.dDay ?? item.dDay;
        if (!dDay || dDay > 40) return false;
      }

      return true;
    });
  }, [selectedStandard, selectedFolder, iso9001Filter, standardCombinedItems, activeStatusFilter]);

  // 5. 활성 미리보기 항목 (문서 예시 실시간 뷰어용)
  const [selectedPreviewId, setSelectedPreviewId] = useState(null);

  const activePreviewItem = useMemo(() => {
    if (selectedPreviewId) {
      const found = standardCombinedItems.find(i => i.id === selectedPreviewId);
      if (found) return found;
      const foundDoc = documents.find(d => d.id === selectedPreviewId);
      if (foundDoc) return foundDoc;
    }
    // 기본값: 첫 번째 표시 항목
    if (displayedItems.length > 0) return displayedItems[0];
    return null;
  }, [selectedPreviewId, standardCombinedItems, documents, displayedItems]);

  // 6. 폴더 통계 계산
  const folders = useMemo(() => {
    if (selectedStandard === 'ISO_9001') {
      return [
        { 
          id: 'BASE', 
          name: '1. 기본체계 문서 (기준 문서)', 
          subText: '품질방침, 프로세스맵, 리스크관리, 기후변화검토서 등',
          count: standardCombinedItems.filter(d => d.category === 'BASE' || d.level === 'LEVEL_1').length, 
          registeredCount: standardCombinedItems.filter(d => (d.category === 'BASE' || d.level === 'LEVEL_1') && d.isRegistered).length,
          color: 'text-blue-600 fill-blue-500/20' 
        },
        { 
          id: 'PROCEDURE', 
          name: '2. 주요 절차서 (12+7종)', 
          subText: '표준 12종 + AI/AX 컨설팅 특화 7종',
          count: standardCombinedItems.filter(d => d.category === 'PROCEDURE' || d.level === 'LEVEL_2').length, 
          registeredCount: standardCombinedItems.filter(d => (d.category === 'PROCEDURE' || d.level === 'LEVEL_2') && d.isRegistered).length,
          color: 'text-emerald-600 fill-emerald-500/20' 
        },
        { 
          id: 'RECORD', 
          name: '3. 업무 기록 (실제 운영 증거)', 
          subText: '경영검토회의록, 검수확인서, 내부심사 등 7대 영역',
          count: standardCombinedItems.filter(d => d.category === 'RECORD' || d.level === 'LEVEL_4' || d.level === 'LEVEL_3').length, 
          registeredCount: standardCombinedItems.filter(d => (d.category === 'RECORD' || d.level === 'LEVEL_4' || d.level === 'LEVEL_3') && d.isRegistered).length,
          color: 'text-purple-600 fill-purple-500/20' 
        },
        { 
          id: 'CERT', 
          name: '00. 정식 인증서 원본', 
          subText: '한국인정지원센터(KAB) 공인 인증서 원본',
          count: documents.filter(d => d.hierarchyLevel === 'CERT' && (d.standards || []).includes('ISO_9001')).length || 1, 
          registeredCount: documents.filter(d => d.hierarchyLevel === 'CERT' && (d.standards || []).includes('ISO_9001')).length,
          color: 'text-rose-600 fill-rose-500/20' 
        },
      ];
    }

    // 일반 규격 폴더 (4계층 구조 + 인증서)
    return [
      { 
        id: 'LEVEL_1', 
        name: '01. 매뉴얼 (Manual)', 
        count: standardCombinedItems.filter(d => d.level === 'LEVEL_1').length,
        registeredCount: standardCombinedItems.filter(d => d.level === 'LEVEL_1' && d.isRegistered).length,
        color: 'text-blue-500 fill-blue-500/20' 
      },
      { 
        id: 'LEVEL_2', 
        name: '02. 절차서 (Procedure)', 
        count: standardCombinedItems.filter(d => d.level === 'LEVEL_2').length,
        registeredCount: standardCombinedItems.filter(d => d.level === 'LEVEL_2' && d.isRegistered).length,
        color: 'text-emerald-500 fill-emerald-500/20' 
      },
      { 
        id: 'LEVEL_3', 
        name: '03. 지침서 (Instruction)', 
        count: standardCombinedItems.filter(d => d.level === 'LEVEL_3').length,
        registeredCount: standardCombinedItems.filter(d => d.level === 'LEVEL_3' && d.isRegistered).length,
        color: 'text-amber-500 fill-amber-500/20' 
      },
      { 
        id: 'LEVEL_4', 
        name: '04. 기록 / 양식 (Records)', 
        count: standardCombinedItems.filter(d => d.level === 'LEVEL_4').length,
        registeredCount: standardCombinedItems.filter(d => d.level === 'LEVEL_4' && d.isRegistered).length,
        color: 'text-purple-500 fill-purple-500/20' 
      },
      { 
        id: 'CERT', 
        name: '00. 인증서 원본', 
        count: standardCombinedItems.filter(d => d.level === 'CERT').length || 1,
        registeredCount: standardCombinedItems.filter(d => d.level === 'CERT' && d.isRegistered).length,
        color: 'text-rose-500 fill-rose-500/20' 
      },
    ];
  }, [selectedStandard, standardCombinedItems, documents]);

  // 표준 예시 복사 핸들러
  const handleCopyExample = (text) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // 표준 예시로 사내 문서 즉시 등록 핸들러
  const handleAdoptExampleAsDoc = (item) => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      companyId: currentCompany?.id || 'comp-1',
      hierarchyLevel: item.level || 'LEVEL_2',
      standards: [selectedStandard],
      code: item.code || 'QP-NEW',
      title: item.title,
      category: item.subCategory || '표준 절차서',
      version: 'v1.0',
      revisionNo: 'Rev. 0',
      approvalDate: new Date().toISOString().split('T')[0],
      lastRevisionDate: new Date().toISOString().split('T')[0],
      expiryDate: '2026-12-31',
      dDay: 365,
      status: 'READY',
      docStatus: '승인',
      validityStatus: 'NORMAL',
      department: '품질경영팀',
      author: '품질담당관',
      approver: '대표이사 Peter',
      clauseNumber: item.clause || 'Clause 4~10',
      path: `/${currentStandardInfo.name}/${item.title}`,
      commentsCount: 0,
      coverGradient: 'from-blue-600 via-indigo-600 to-sky-700',
      penaltyRisk: item.penaltyRisk || '정기 사후심사 필수 점검 대상',
      summary: item.summary || `${item.title} 공식 표준 규정`,
      contentDraft: item.templateDraft || item.displayContent || `# ${item.title}\n\n사내 표준 규정 본문`,
      isStarred: false,
    };

    onAddDocument && onAddDocument(newDoc);
    setSelectedPreviewId(newDoc.id);
  };

  // 아이콘 헬퍼
  const getStandardIcon = (code) => {
    switch (code) {
      case 'ISO_9001': return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'ISO_27001': return <Cpu className="w-4 h-4 text-rose-600" />;
      case 'ISO_14001': return <Leaf className="w-4 h-4 text-emerald-600" />;
      case 'ISO_45001': return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      case 'ISO_13485': return <Stethoscope className="w-4 h-4 text-cyan-600" />;
      case 'ISO_50001': return <Zap className="w-4 h-4 text-purple-600" />;
      default: return <Globe className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 relative" onClick={() => setActiveMenuDocId(null)}>
      
      {/* 1. Google Drive Master View Tab Switcher: [ 📂 ISO 규격 메타 드라이브 | 📋 ISO 규격별 필수 바인더 ] */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-normal text-slate-800 tracking-tight font-sans">
            Drive에 오신 것을 환영합니다
          </h1>

          <div className="flex items-center p-1 rounded-full border border-slate-300/80 bg-[#edf2fc]">
            <button
              onClick={() => setDriveViewTab('folders')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                driveViewTab === 'folders'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>ISO 규격 메타 드라이브</span>
            </button>

            <button
              onClick={() => setDriveViewTab('matrix')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                driveViewTab === 'matrix'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>전체 규격 종합 진단 바인더</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            </button>
          </div>
        </div>

        {/* Right Controls: Filter status + Info button */}
        <div className="flex items-center gap-2">
          {selectedFolder === 'STARRED' && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>중요 문서함</span>
            </span>
          )}

          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsInfoDrawerOpen(!isInfoDrawerOpen);
            }}
            title="드라이브 세부정보 및 감사 활동"
            className={`p-2 rounded-full transition-colors ${
              isInfoDrawerOpen ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* RENDER VIEW A: ISO STATUTORY COMPLIANCE MATRIX BINDER */}
      {driveViewTab === 'matrix' ? (
        <IsoComplianceMatrixView
          documents={documents}
          currentCompany={currentCompany}
          onOpenDetail={onOpenDetail}
          onAddDocument={onAddDocument}
          onUpdateDocument={onUpdateDocument}
        />
      ) : (
        /* RENDER VIEW B: ISO META-STANDARDIZED DRIVE & EXAMPLE EXPLORER */
        <>
          {/* 2. ISO 규격 메타 기준 선택 탭 바 (사용자 핵심 요구: 메타기준화) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>ISO 규격 종류 선택 (메타 기준)</span>
              </div>
              <span className="text-[11px] text-slate-400">
                규격을 선택하면 해당 규격의 준비 폴더와 표준 문서 예시가 연동됩니다
              </span>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {ISO_STANDARDS_INFO.map(std => {
                const isActive = selectedStandard === std.code;
                return (
                  <button
                    key={std.code}
                    onClick={() => {
                      onSelectStandard && onSelectStandard(std.code);
                      onSelectFolder && onSelectFolder('ALL');
                    }}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border shadow-2xs ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400/40 shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-[#edf2fc] border-slate-200/90'
                    }`}
                  >
                    <div className={`p-1 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                      {getStandardIcon(std.code)}
                    </div>
                    <span>{std.name.split(':')[0]}</span>
                    <span className="text-[11px] font-normal opacity-90">({std.title.split(' ')[0]})</span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  onSelectStandard && onSelectStandard('ALL');
                  onSelectFolder && onSelectFolder('ALL');
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border shadow-2xs ${
                  selectedStandard === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400/40'
                    : 'bg-white text-slate-700 hover:bg-[#edf2fc] border-slate-200/90'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>전체 규격 종합</span>
              </button>
            </div>
          </div>

          {/* 3. 선택된 규격 메타 배너 & 준비도 요약 카드 */}
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white p-4 sm:p-5 rounded-2xl border border-blue-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs">
                    {currentStandardInfo.name}
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {currentStandardInfo.title}
                  </span>
                  {selectedStandard === 'ISO_9001' && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ★ 2024 기후변화(Climate Change) 개정 공식 반영
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentStandardInfo.description} · 소규모 AI/컨설팅 기업(네오앤피터) 최적화 기준
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onOpenNewDoc && onOpenNewDoc('BLANK')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 규격 문서 등록</span>
                </button>
              </div>
            </div>

            {/* ISO 9001인 경우: 네오앤피터 15종 우선 세트 및 카테고리 퀵 탭 */}
            {selectedStandard === 'ISO_9001' && (
              <div className="pt-2 border-t border-blue-200/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0">빠른 필터:</span>
                {ISO_9001_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setIso9001Filter(cat.id);
                      if (cat.id === 'BASE') onSelectFolder('LEVEL_1');
                      else if (cat.id === 'PROCEDURE') onSelectFolder('LEVEL_2');
                      else if (cat.id === 'RECORD') onSelectFolder('LEVEL_4');
                      else onSelectFolder('ALL');
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      iso9001Filter === cat.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setIso9001Filter('AI_SPECIFIC');
                    onSelectFolder('LEVEL_2');
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    iso9001Filter === 'AI_SPECIFIC'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  🤖 AI·컨설팅 특화 7종
                </button>
              </div>
            )}
          </div>

          {/* 4. "이쪽이 준비해야하는 문서의 폴더가 나오고" (준비 폴더 섹션) */}
          <div className="space-y-3">
            <div 
              onClick={() => setIsFolderSectionOpen(!isFolderSectionOpen)}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
            >
              {isFolderSectionOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
              <span className="font-bold">
                {selectedStandard === 'ISO_9001' 
                  ? '준비해야 하는 필수 문서 폴더 (3대 체계 + 인증서)' 
                  : `${currentStandardInfo.name} 준비 필수 문서 폴더`}
              </span>
            </div>

            {isFolderSectionOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {folders.map(folder => {
                  const isSelected = selectedFolder === folder.id || 
                    (folder.id === 'BASE' && selectedFolder === 'LEVEL_1') || 
                    (folder.id === 'PROCEDURE' && selectedFolder === 'LEVEL_2') || 
                    (folder.id === 'RECORD' && (selectedFolder === 'LEVEL_4' || selectedFolder === 'LEVEL_3'));

                  return (
                    <div
                      key={folder.id}
                      onClick={() => {
                        const isCurrentlyActive = selectedFolder === folder.id || 
                          (folder.id === 'BASE' && selectedFolder === 'LEVEL_1') || 
                          (folder.id === 'PROCEDURE' && selectedFolder === 'LEVEL_2') || 
                          (folder.id === 'RECORD' && (selectedFolder === 'LEVEL_4' || selectedFolder === 'LEVEL_3'));
                        const next = isCurrentlyActive ? 'ALL' : folder.id;
                        onSelectFolder(next);
                        if (folder.id === 'BASE') setIso9001Filter('BASE');
                        else if (folder.id === 'PROCEDURE') setIso9001Filter('PROCEDURE');
                        else if (folder.id === 'RECORD') setIso9001Filter('RECORD');
                        else setIso9001Filter('ALL');
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-[#c2e7ff]/40 border-blue-400 shadow-xs ring-2 ring-blue-200'
                          : 'bg-[#f0f4f9]/60 hover:bg-[#edf2fc] border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Folder className={`w-5 h-5 shrink-0 ${folder.color}`} />
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                            {folder.name}
                          </span>
                        </div>
                        <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                          {folder.registeredCount !== undefined 
                            ? `${folder.registeredCount}/${folder.count}`
                            : `${folder.count}종`}
                        </span>
                      </div>
                      {folder.subText && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {folder.subText}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. "또 그 문서의 예시가 보이게끔 그런 식으로 해줘" (문서 목록 & 실시간 예시 분할 뷰) */}
          <div className="space-y-3 pt-2">
            
            {/* Header with list count */}
            <div className="flex items-center justify-between">
              <div 
                onClick={() => setIsFileSectionOpen(!isFileSectionOpen)}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
              >
                {isFileSectionOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <span className="font-bold">
                  {selectedStandard === 'ISO_9001' ? 'ISO 9001 준비 문서 & 표준 예시 목록' : '문서 목록'} 
                  ({displayedItems.length}개 항목)
                </span>
              </div>

              <div className="text-xs text-slate-400">
                문서 행을 클릭하면 오른쪽에 <b className="text-blue-600">공식 표준 예시 전문</b>이 즉시 표시됩니다
              </div>
            </div>

            {/* Split Layout: Left Table (55%) + Right Live Example Preview Pane (45%) */}
            {isFileSectionOpen && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* LEFT: Document List Table (7 cols on lg) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-700 select-none">
                      <thead className="text-[11px] font-bold text-slate-500 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">코드 / 문서명</th>
                          <th className="py-2.5 px-3">구분 / 조항</th>
                          <th className="py-2.5 px-3">상태</th>
                          <th className="py-2.5 px-2 text-right">예시 보기</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {displayedItems.map((item) => {
                          const isSelected = activePreviewItem && (activePreviewItem.id === item.id || activePreviewItem.code === item.code);
                          const isRegistered = item.isRegistered ?? true;

                          return (
                            <tr 
                              key={item.id}
                              onClick={() => setSelectedPreviewId(item.id)}
                              className={`cursor-pointer transition-colors group ${
                                isSelected
                                  ? 'bg-blue-50/90 text-blue-950 font-semibold'
                                  : 'hover:bg-[#f0f4f9]/70'
                              }`}
                            >
                              {/* Code & Title */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <span className={`px-1.5 py-0.5 rounded font-mono font-black text-[10px] shrink-0 ${
                                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {item.code || 'DOC'}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-700">
                                        {item.title}
                                      </span>
                                      {item.isStarter15 && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 shrink-0">
                                          15종 필수
                                        </span>
                                      )}
                                      {item.code === 'QM-09' && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                                          2024 개정
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                      {item.summary || item.notes}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Category & Clause */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="text-[11px] text-slate-600 font-semibold">
                                  {item.subCategory || item.category || '절차서'}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {item.clause || item.clauseNumber || '전 조항'}
                                </div>
                              </td>

                              {/* Registration Status */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                {isRegistered ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>구비 완료</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    <span>표준 예시 완비</span>
                                  </span>
                                )}
                              </td>

                              {/* Preview Action Button */}
                              <td className="py-3 px-2 text-right whitespace-nowrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPreviewId(item.id);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    isSelected
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  예시 확인
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT: Live Standard Example Viewer Pane (5 cols on lg) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border-2 border-blue-200/90 shadow-md p-5 flex flex-col space-y-4 sticky top-4">
                  {activePreviewItem ? (
                    <>
                      {/* Preview Header */}
                      <div className="border-b border-slate-100 pb-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-blue-600 text-white">
                              {activePreviewItem.code || 'QM-01'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              {activePreviewItem.clause || activePreviewItem.clauseNumber || 'ISO 규격'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopyExample(activePreviewItem.displayContent || activePreviewItem.templateDraft || activePreviewItem.contentDraft)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                              title="예시 전문 복사"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (activePreviewItem.registeredDoc) {
                                  onOpenDetail(activePreviewItem.registeredDoc);
                                } else {
                                  handleAdoptExampleAsDoc(activePreviewItem);
                                }
                              }}
                              className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                              title="에디터에서 편집"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-base font-black text-slate-900 leading-snug">
                          {activePreviewItem.title}
                        </h3>

                        {copiedToast && (
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-scale-up">
                            <Check className="w-3.5 h-3.5" />
                            <span>표준 문서 예시 전문이 클립보드에 복사되었습니다!</span>
                          </div>
                        )}
                      </div>

                      {/* Legal Audit Requirements & Risks */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex items-start gap-1.5 text-slate-700">
                          <AlertCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <b className="text-slate-900">심사 기준:</b> {activePreviewItem.legalAuditReason || '정기 사후심사 적합성 확인 필수'}
                          </div>
                        </div>
                        {activePreviewItem.penaltyRisk && (
                          <div className="text-[11px] text-rose-600 font-semibold pl-5">
                            ⚠️ 미비 시: {activePreviewItem.penaltyRisk}
                          </div>
                        )}
                      </div>

                      {/* Full-Text Formatted Markdown Example Viewer */}
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                          <span>실전 공문서 표준 예시 본문 (Preview)</span>
                          <span className="text-[10px] text-blue-600 font-normal">표준 서식 그대로 즉시 사용 가능</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed max-h-[320px] overflow-y-auto whitespace-pre-wrap selection:bg-blue-500 selection:text-white border border-slate-800">
                          {activePreviewItem.displayContent || activePreviewItem.templateDraft || activePreviewItem.contentDraft || '표준 예시 본문 로딩중...'}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        {activePreviewItem.isRegistered ? (
                          <button
                            onClick={() => onOpenDetail(activePreviewItem.registeredDoc || activePreviewItem)}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>사내 등록본 편집 / 수정하기</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAdoptExampleAsDoc(activePreviewItem)}
                            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>✨ 이 예시로 우리 기업 문서 바로 등록하기</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleCopyExample(activePreviewItem.displayContent || activePreviewItem.templateDraft || activePreviewItem.contentDraft)}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>복사</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs">왼쪽 목록에서 문서를 선택하면 표준 예시가 표시됩니다.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        </>
      )}

      {/* 6. Google Drive Details & Activity Log Right Slide-over Drawer */}
      {isInfoDrawerOpen && (
        <aside 
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-y-0 right-0 z-50 w-80 bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slide-left p-5 text-xs text-slate-700 space-y-4"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>드라이브 세부정보 & 활동</span>
            </h3>
            <button onClick={() => setIsInfoDrawerOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
              <div className="font-bold text-blue-900 text-xs">클라우드 스토리지 현황</div>
              <div className="text-sm font-black text-blue-700">245.6 GB / 2,000 GB (12.3%)</div>
              <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '12.3%' }}></div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between"><span>관리 문서:</span><b className="text-slate-900">{documents.length}건</b></div>
              <div className="flex justify-between"><span>사후심사 D-Day:</span><b className="text-amber-600">D-26일 임박</b></div>
              <div className="flex justify-between"><span>소유자:</span><b>최고관리자 (Peter)</b></div>
              <div className="flex justify-between"><span>동기화 상태:</span><b className="text-emerald-600">실시간 연동중</b></div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pt-2 border-t border-slate-100">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              최근 감사 및 개정 활동 로그
            </div>
            <div className="space-y-2.5 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-50 space-y-0.5">
                <div className="font-bold text-slate-800">QM-09 기후변화 검토서 2024년판 반영</div>
                <div className="text-slate-400">품질관리자 · 방금 전</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 space-y-0.5">
                <div className="font-bold text-slate-800">네오앤피터 15종 필수 세트 동기화 완료</div>
                <div className="text-slate-400">시스템 자동 연동 · 10분 전</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 space-y-0.5">
                <div className="font-bold text-slate-800">ISO 9001 사후심사 D-26 알림</div>
                <div className="text-slate-400">시스템 자동 발송 · 1시간 전</div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <button
              onClick={() => setIsInfoDrawerOpen(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              닫기
            </button>
          </div>
        </aside>
      )}

    </div>
  );
}
