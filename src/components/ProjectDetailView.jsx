'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Award, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Folder, 
  FileText, 
  Plus, 
  ExternalLink, 
  Check, 
  ShieldCheck, 
  ChevronRight, 
  ChevronDown,
  Layers, 
  Sparkles,
  HardDrive,
  Copy,
  Trash2,
  Filter,
  BookOpen,
  GitPullRequest,
  ClipboardCheck,
  Globe,
  Leaf,
  ShieldAlert,
  Stethoscope,
  Zap,
  Edit3
} from 'lucide-react';
import { ISO_STANDARDS_INFO, ISO_MANDATORY_REQUIREMENTS } from '../lib/isoRequirementsData.js';
import { 
  ISO_9001_CATEGORIES, 
  ISO_9001_MASTER_BLUEPRINT 
} from '../lib/iso9001Blueprint.js';
import GovernmentProgramsView from './GovernmentProgramsView.jsx';

export default function ProjectDetailView({
  project,
  documents = [],
  onBackToDrive,
  onOpenDetail,
  onOpenNewDoc,
  onAddDocument,
  onUpdateDocument,
  onUpdateProjectStage
}) {
  // 사용자의 핵심 직관: "현재 존재하는 문서 / ISO 9001 / ISO 14001 / ISO 45001 / ... 이렇게 탭을 전환해서 보는 느낌"
  // 기본 탭: 고객사의 주 목표 규격(예: ISO_9001) 또는 EXISTING
  const [activeTab, setActiveTab] = useState(project?.auditStandard || 'EXISTING');
  const [existingFolder, setExistingFolder] = useState('ALL');
  const [selectedFolder, setSelectedFolder] = useState('ALL');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'READY' | 'MISSING' | 'STARTER_15' | 'AI_SPECIFIC'
  const [selectedPreviewId, setSelectedPreviewId] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // 프로젝트 전환 시 해당 고객사의 목표 규격 탭으로 자동 초기화
  useEffect(() => {
    if (project?.auditStandard) {
      setActiveTab(project.auditStandard);
      setSelectedFolder('ALL');
      setFilterMode('ALL');
      setSelectedPreviewId(null);
    }
  }, [project?.id, project?.auditStandard]);

  // 1. 이 고객사(`project.companyId`)에 등록된 모든 사내 문서 (현재 존재하는 문서)
  const companyDocs = useMemo(() => {
    if (!documents || !project) return [];
    return documents.filter(d => {
      if (d.companyId && project.companyId && d.companyId === project.companyId) return true;
      if (project.companyId === 'comp-1' && (!d.companyId || d.companyId === 'comp-1')) return true;
      return false;
    });
  }, [documents, project]);

  // 2. 고객사 규격별 통계 헬퍼 함수
  const getStandardStats = (stdCode) => {
    let totalCount = 0;
    let readyCount = 0;

    if (stdCode === 'ISO_9001') {
      totalCount = ISO_9001_MASTER_BLUEPRINT.length;
      ISO_9001_MASTER_BLUEPRINT.forEach(item => {
        const isMatched = companyDocs.some(d => {
          const matchStd = !d.standards || d.standards.includes('ISO_9001') || d.standards.includes('ALL');
          if (!matchStd) return false;
          const codeUpper = (d.code || '').toUpperCase();
          const itemCodeUpper = (item.code || '').toUpperCase();
          if (codeUpper === itemCodeUpper) return true;
          if (item.code && codeUpper.includes(item.code)) return true;
          if (d.title && item.title && (d.title.includes(item.title.split(' ')[0]) || item.title.includes(d.title.split(' ')[0]))) return true;
          return false;
        });
        if (isMatched) readyCount++;
      });
    } else {
      const stdReqs = ISO_MANDATORY_REQUIREMENTS.filter(r => r.standard === stdCode);
      totalCount = stdReqs.length;
      stdReqs.forEach(req => {
        const isMatched = companyDocs.some(d => {
          const matchStd = !d.standards || d.standards.includes(req.standard) || d.standards.includes('ALL');
          if (!matchStd) return false;
          const codeUpper = (d.code || '').toUpperCase();
          const reqCodeUpper = (req.defaultCode || req.codePattern || '').toUpperCase();
          if (codeUpper && reqCodeUpper && (codeUpper === reqCodeUpper || codeUpper.includes(reqCodeUpper) || reqCodeUpper.includes(codeUpper))) return true;
          if (d.title && req.title && (d.title.includes(req.title.split(' ')[0]) || req.title.includes(d.title.split(' ')[0]))) return true;
          return false;
        });
        if (isMatched) readyCount++;
      });
    }

    const percent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;
    return { totalCount, readyCount, percent };
  };

  // 3. 현재 활성화된 규격 메타 정보 (activeTab이 ISO 규격일 때)
  const currentStandardCode = activeTab.startsWith('ISO_') ? activeTab : 'ISO_9001';
  const currentStandardInfo = useMemo(() => {
    return ISO_STANDARDS_INFO.find(s => s.code === currentStandardCode) || ISO_STANDARDS_INFO[0];
  }, [currentStandardCode]);

  // 4. 선택된 규격의 전체 마스터 블루프린트 항목과 고객사 문서 1:1 매핑
  const clientChecklistItems = useMemo(() => {
    if (!activeTab.startsWith('ISO_')) return [];

    if (activeTab === 'ISO_9001') {
      return ISO_9001_MASTER_BLUEPRINT.map(item => {
        const matched = companyDocs.find(d => {
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
          standard: 'ISO_9001',
          isRegistered: Boolean(matched),
          registeredDoc: matched || null,
          displayContent: matched?.contentDraft || matched?.content || item.templateDraft
        };
      });
    }

    // ISO 14001, 45001, 27001, 13485
    const reqs = ISO_MANDATORY_REQUIREMENTS.filter(r => r.standard === activeTab);
    const reqItems = reqs.map(req => {
      const matched = companyDocs.find(d => {
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
        standard: req.standard,
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

    // 고객사가 직접 등록한 추가 문서 병합
    const customDocs = companyDocs.filter(d => {
      const matchStd = d.standards && (d.standards.includes(activeTab) || d.standards.includes('ALL'));
      if (!matchStd) return false;
      return !reqItems.some(r => r.registeredDoc?.id === d.id);
    }).map(d => ({
      id: d.id,
      standard: activeTab,
      code: d.code,
      title: d.title,
      category: d.category || '고객사 등록 문서',
      subCategory: d.hierarchyLevel === 'LEVEL_1' ? '매뉴얼' : d.hierarchyLevel === 'LEVEL_2' ? '절차서' : d.hierarchyLevel === 'LEVEL_3' ? '지침서' : d.hierarchyLevel === 'LEVEL_4' ? '기록' : '인증서',
      level: d.hierarchyLevel,
      clause: d.clauseNumber || '전 조항',
      summary: d.summary || '',
      legalAuditReason: '고객사 정식 승인 문서',
      penaltyRisk: d.penaltyRisk || '',
      templateDraft: d.contentDraft || d.content,
      isRegistered: true,
      registeredDoc: d,
      displayContent: d.contentDraft || d.content
    }));

    return [...reqItems, ...customDocs];
  }, [activeTab, companyDocs]);

  // 5. 폴더 통계 계산
  const folders = useMemo(() => {
    if (activeTab === 'ISO_9001') {
      return [
        { 
          id: 'BASE', 
          name: '1. 기본체계 문서 (기준 문서)', 
          subText: '품질방침, 프로세스맵, 리스크관리, 기후변화검토서 등',
          count: clientChecklistItems.filter(d => d.category === 'BASE' || d.level === 'LEVEL_1').length, 
          registeredCount: clientChecklistItems.filter(d => (d.category === 'BASE' || d.level === 'LEVEL_1') && d.isRegistered).length,
          color: 'text-blue-600 fill-blue-500/20' 
        },
        { 
          id: 'PROCEDURE', 
          name: '2. 주요 절차서 (12+7종)', 
          subText: '표준 12종 + AI/AX 컨설팅 특화 7종',
          count: clientChecklistItems.filter(d => d.category === 'PROCEDURE' || d.level === 'LEVEL_2').length, 
          registeredCount: clientChecklistItems.filter(d => (d.category === 'PROCEDURE' || d.level === 'LEVEL_2') && d.isRegistered).length,
          color: 'text-emerald-600 fill-emerald-500/20' 
        },
        { 
          id: 'RECORD', 
          name: '3. 업무 기록 (실제 운영 증거)', 
          subText: '경영검토회의록, 내부심사, 적격성평가 등 7대 영역',
          count: clientChecklistItems.filter(d => d.category === 'RECORD' || d.level === 'LEVEL_4' || d.level === 'LEVEL_3').length, 
          registeredCount: clientChecklistItems.filter(d => (d.category === 'RECORD' || d.level === 'LEVEL_4' || d.level === 'LEVEL_3') && d.isRegistered).length,
          color: 'text-purple-600 fill-purple-500/20' 
        },
        { 
          id: 'CERT', 
          name: '00. 정식 인증서 원본', 
          subText: '한국인정지원센터(KAB) 공인 인증서 원본',
          count: clientChecklistItems.filter(d => d.level === 'CERT').length || 1, 
          registeredCount: clientChecklistItems.filter(d => d.level === 'CERT' && d.isRegistered).length,
          color: 'text-rose-600 fill-rose-500/20' 
        },
      ];
    }

    // 일반 규격 폴더
    return [
      { 
        id: 'LEVEL_1', 
        name: '01. 매뉴얼 (Manual)', 
        count: clientChecklistItems.filter(d => d.level === 'LEVEL_1').length,
        registeredCount: clientChecklistItems.filter(d => d.level === 'LEVEL_1' && d.isRegistered).length,
        color: 'text-blue-500 fill-blue-500/20' 
      },
      { 
        id: 'LEVEL_2', 
        name: '02. 절차서 (Procedure)', 
        count: clientChecklistItems.filter(d => d.level === 'LEVEL_2').length,
        registeredCount: clientChecklistItems.filter(d => d.level === 'LEVEL_2' && d.isRegistered).length,
        color: 'text-emerald-500 fill-emerald-500/20' 
      },
      { 
        id: 'LEVEL_3', 
        name: '03. 지침서 (Instruction)', 
        count: clientChecklistItems.filter(d => d.level === 'LEVEL_3').length,
        registeredCount: clientChecklistItems.filter(d => d.level === 'LEVEL_3' && d.isRegistered).length,
        color: 'text-amber-500 fill-amber-500/20' 
      },
      { 
        id: 'LEVEL_4', 
        name: '04. 기록 / 양식 (Records)', 
        count: clientChecklistItems.filter(d => d.level === 'LEVEL_4').length,
        registeredCount: clientChecklistItems.filter(d => d.level === 'LEVEL_4' && d.isRegistered).length,
        color: 'text-purple-500 fill-purple-500/20' 
      },
      { 
        id: 'CERT', 
        name: '00. 인증서 원본', 
        count: clientChecklistItems.filter(d => d.level === 'CERT').length || 1,
        registeredCount: clientChecklistItems.filter(d => d.level === 'CERT' && d.isRegistered).length,
        color: 'text-rose-500 fill-rose-500/20' 
      },
    ];
  }, [activeTab, clientChecklistItems]);

  // 6. 필터링된 체크리스트 목록
  const displayedChecklist = useMemo(() => {
    return clientChecklistItems.filter(item => {
      // 1) 폴더 필터
      if (selectedFolder !== 'ALL') {
        if (activeTab === 'ISO_9001') {
          if ((selectedFolder === 'BASE' || selectedFolder === 'LEVEL_1') && item.category !== 'BASE' && item.level !== 'LEVEL_1') return false;
          if ((selectedFolder === 'PROCEDURE' || selectedFolder === 'LEVEL_2') && item.category !== 'PROCEDURE' && item.level !== 'LEVEL_2') return false;
          if ((selectedFolder === 'RECORD' || selectedFolder === 'LEVEL_4' || selectedFolder === 'LEVEL_3') && item.category !== 'RECORD' && item.level !== 'LEVEL_4' && item.level !== 'LEVEL_3') return false;
          if (selectedFolder === 'CERT' && item.level !== 'CERT') return false;
        } else {
          if (item.level !== selectedFolder) return false;
        }
      }

      // 2) 준비 상태 및 서브 필터
      if (filterMode === 'READY' && !item.isRegistered) return false;
      if (filterMode === 'MISSING' && item.isRegistered) return false;
      if (filterMode === 'STARTER_15' && !item.isStarter15) return false;
      if (filterMode === 'AI_SPECIFIC' && item.subCategory !== 'AI·컨설팅 특화') return false;

      return true;
    });
  }, [clientChecklistItems, activeTab, selectedFolder, filterMode]);

  // 7. 실시간 미리보기 활성 항목
  const activePreviewItem = useMemo(() => {
    if (selectedPreviewId) {
      const found = clientChecklistItems.find(i => i.id === selectedPreviewId);
      if (found) return found;
    }
    if (displayedChecklist.length > 0) return displayedChecklist[0];
    return null;
  }, [selectedPreviewId, clientChecklistItems, displayedChecklist]);

  // [현재 존재하는 문서] 탭용 4계층 폴더 목록
  const existingFolders = [
    { id: 'ALL', name: '전체 보기', count: companyDocs.length, color: 'text-slate-600 fill-slate-500/20' },
    { id: 'CERT', name: '00. 인증서 원본', count: companyDocs.filter(d => d.hierarchyLevel === 'CERT').length, color: 'text-rose-500 fill-rose-500/20' },
    { id: 'LEVEL_1', name: '01. 매뉴얼 (Manual)', count: companyDocs.filter(d => d.hierarchyLevel === 'LEVEL_1').length, color: 'text-blue-500 fill-blue-500/20' },
    { id: 'LEVEL_2', name: '02. 절차서 (Procedure)', count: companyDocs.filter(d => d.hierarchyLevel === 'LEVEL_2').length, color: 'text-emerald-500 fill-emerald-500/20' },
    { id: 'LEVEL_3', name: '03. 지침서 (Instruction)', count: companyDocs.filter(d => d.hierarchyLevel === 'LEVEL_3').length, color: 'text-amber-500 fill-amber-500/20' },
    { id: 'LEVEL_4', name: '04. 기록 / 양식', count: companyDocs.filter(d => d.hierarchyLevel === 'LEVEL_4').length, color: 'text-purple-500 fill-purple-500/20' },
  ];

  const displayedExistingDocs = useMemo(() => {
    if (existingFolder === 'ALL') return companyDocs;
    return companyDocs.filter(d => d.hierarchyLevel === existingFolder);
  }, [companyDocs, existingFolder]);

  // 표준 예시를 이 고객사 사내 문서로 즉시 정식 등록
  const handleAdoptExampleForProject = (item) => {
    const targetStandard = activeTab.startsWith('ISO_') ? activeTab : 'ISO_9001';
    const newDoc = {
      id: `doc-${Date.now()}`,
      companyId: project.companyId,
      hierarchyLevel: item.level || 'LEVEL_2',
      standards: [targetStandard],
      code: item.code || 'QP-NEW',
      title: item.title,
      category: item.subCategory || item.category || '표준 규격 문서',
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
      author: project.ceo || '품질담당관',
      approver: `${project.clientName} 대표이사`,
      clauseNumber: item.clause || '전 조항',
      path: `/${currentStandardInfo.name}/${item.title}`,
      commentsCount: 0,
      coverGradient: 'from-blue-600 via-indigo-600 to-sky-700',
      penaltyRisk: item.penaltyRisk || '정기 사후심사 필수 점검 대상',
      summary: item.summary || `${item.title} 공식 표준 규정`,
      contentDraft: item.templateDraft || item.displayContent || `# ${item.title}\n\n${project.clientName} 사내 표준 규정 본문`,
      isStarred: false,
    };

    onAddDocument && onAddDocument(newDoc);
  };

  const handleCopyExample = (text) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // 통계 집계
  const totalItemsCount = clientChecklistItems.length;
  const readyItemsCount = clientChecklistItems.filter(i => i.isRegistered).length;
  const missingItemsCount = totalItemsCount - readyItemsCount;
  const readyPercentage = totalItemsCount > 0 ? Math.round((readyItemsCount / totalItemsCount) * 100) : 0;

  return (
    <div className="space-y-5 pb-12">
      
      {/* 1. 상단 브레드크럼 네비게이션 */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBackToDrive}
            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>내 드라이브 홈</span>
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-700">고객사 심사 프로젝트</span>
          <span>/</span>
          <span className="font-bold text-blue-600 font-mono">
            {project.clientName}
          </span>
        </div>

        <span className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">
          고객사 식별코드: {project.companyId || project.id}
        </span>
      </div>

      {/* 2. 고객사 프로필 카드 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              {project.clientName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {project.clientName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  주 목표 규격: {project.auditStandardName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700">
                  {project.activityDomainTitle}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                사업자번호: <b className="font-mono text-slate-700">{project.bizNumber}</b> · 대표자: <b className="text-slate-700">{project.ceo}</b> · 임직원수: <b className="text-blue-700">{project.employeeCount}</b> · {project.industry}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-[#fffdf5] border border-amber-300/80 text-right">
              <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
                목표 심사 수검일
              </div>
              <div className="text-base font-black text-amber-900 font-mono mt-0.5">
                {project.targetAuditDate} <span className="text-rose-600">(D-{project.dDay})</span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">
                배정 심사원: {project.leadAuditor}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* [사용자 핵심 요구] "현재 존재하는 문서 / ISO 9001 / ISO 14001 / ISO 45001 / ... 이렇게 탭을 전환해서 보는 느낌" */}
      {/* ======================================================== */}
      <div className="space-y-4">
        
        {/* 상단 탭 바 */}
        <div className="flex items-center justify-between border-b border-slate-200/90 pb-px overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 min-w-max">
            
            {/* 1. 현재 존재하는 문서 */}
            <button
              onClick={() => {
                setActiveTab('EXISTING');
                setSelectedFolder('ALL');
                setFilterMode('ALL');
              }}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'EXISTING'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/70 shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Folder className="w-4 h-4 text-blue-600" />
              <span>현재 존재하는 문서</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'EXISTING' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {companyDocs.length}
              </span>
            </button>

            {/* 2. ISO 9001 */}
            <button
              onClick={() => {
                setActiveTab('ISO_9001');
                setSelectedFolder('ALL');
                setFilterMode('ALL');
                setSelectedPreviewId(null);
              }}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'ISO_9001'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/70 shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Award className="w-4 h-4 text-blue-600" />
              <span>ISO 9001</span>
              {project.auditStandard === 'ISO_9001' && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-600 text-white">
                  목표
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                ({getStandardStats('ISO_9001').readyCount}/{getStandardStats('ISO_9001').totalCount})
              </span>
            </button>

            {/* 3. ISO 14001 */}
            <button
              onClick={() => {
                setActiveTab('ISO_14001');
                setSelectedFolder('ALL');
                setFilterMode('ALL');
                setSelectedPreviewId(null);
              }}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'ISO_14001'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/70 shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>ISO 14001</span>
              {project.auditStandard === 'ISO_14001' && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-600 text-white">
                  목표
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                ({getStandardStats('ISO_14001').readyCount}/{getStandardStats('ISO_14001').totalCount})
              </span>
            </button>

            {/* 4. ISO 45001 */}
            <button
              onClick={() => {
                setActiveTab('ISO_45001');
                setSelectedFolder('ALL');
                setFilterMode('ALL');
                setSelectedPreviewId(null);
              }}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'ISO_45001'
                  ? 'border-amber-600 text-amber-700 bg-amber-50/70 shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>ISO 45001</span>
              {project.auditStandard === 'ISO_45001' && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-600 text-white">
                  목표
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                ({getStandardStats('ISO_45001').readyCount}/{getStandardStats('ISO_45001').totalCount})
              </span>
            </button>

            {/* 5. ISO 27001 */}
            <button
              onClick={() => {
                setActiveTab('ISO_27001');
                setSelectedFolder('ALL');
                setFilterMode('ALL');
                setSelectedPreviewId(null);
              }}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'ISO_27001'
                  ? 'border-rose-600 text-rose-700 bg-rose-50/70 shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              <span>ISO 27001</span>
              {project.auditStandard === 'ISO_27001' && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-600 text-white">
                  목표
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                ({getStandardStats('ISO_27001').readyCount}/{getStandardStats('ISO_27001').totalCount})
              </span>
            </button>

            {/* 6. ISO 13485 */}
            <button
              onClick={() => {
                setActiveTab('ISO_13485');
                setSelectedFolder('ALL');
                setFilterMode('ALL');
                setSelectedPreviewId(null);
              }}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'ISO_13485'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/70 shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-indigo-600" />
              <span>ISO 13485</span>
              {project.auditStandard === 'ISO_13485' && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-600 text-white">
                  목표
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                ({getStandardStats('ISO_13485').readyCount}/{getStandardStats('ISO_13485').totalCount})
              </span>
            </button>

            {/* 7. 정부지원사업 (53선) */}
            <button
              onClick={() => setActiveTab('GOV_PROGRAMS')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'GOV_PROGRAMS'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/70 shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>지원사업 매핑 (53선)</span>
            </button>
          </div>

          <button
            onClick={() => onOpenNewDoc && onOpenNewDoc('BLANK')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all shrink-0 ml-2 mb-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 문서 등록</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* VIEW A: [현재 존재하는 문서] 탭 선택 시 화면             */}
        {/* ======================================================== */}
        {activeTab === 'EXISTING' && (
          <div className="space-y-4">
            
            {/* 4계층 폴더 요약 바 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {existingFolders.map(folder => {
                const isSelected = existingFolder === folder.id;
                return (
                  <div
                    key={folder.id}
                    onClick={() => setExistingFolder(folder.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-[#c2e7ff]/40 border-blue-400 shadow-xs ring-2 ring-blue-200'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Folder className={`w-4 h-4 shrink-0 ${folder.color}`} />
                      <span className="text-xs font-black font-mono px-2 py-0.2 rounded-full bg-slate-100 text-slate-700">
                        {folder.count}건
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                      {folder.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 고객사 보유 문서 목록 테이블 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800">
                    {project.clientName} 사내 정식 승인 문서 목록 ({displayedExistingDocs.length}건)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  암호화 클라우드 격리 보관 중
                </span>
              </div>

              {displayedExistingDocs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 select-none">
                    <thead className="text-[11px] font-bold text-slate-400 bg-slate-50 border-b border-slate-200 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">문서명 / 코드</th>
                        <th className="py-2.5 px-3">계층 / 구분</th>
                        <th className="py-2.5 px-3">적용 규격</th>
                        <th className="py-2.5 px-3">상태</th>
                        <th className="py-2.5 px-3">만료 D-Day</th>
                        <th className="py-2.5 px-3">작성자 / 승인자</th>
                        <th className="py-2.5 px-2 text-right">열람 / 편집</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {displayedExistingDocs.map(doc => (
                        <tr 
                          key={doc.id}
                          onClick={() => onOpenDetail(doc)}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs hover:text-blue-600">
                                  {doc.title}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {doc.code} · {doc.version || 'v1.0'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              {doc.hierarchyLevel}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                              {(doc.standards || []).join(', ') || '전 규격'}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {doc.docStatus || '승인 완료'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono whitespace-nowrap">
                            {doc.dDay !== undefined ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                doc.dDay <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                D-{doc.dDay}
                              </span>
                            ) : '상시'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                            {doc.author || '담당자'} / {doc.approver || '대표'}
                          </td>
                          <td className="py-3 px-2 text-right whitespace-nowrap">
                            <button className="text-blue-600 hover:underline font-bold text-xs">
                              열람 / 수정 →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <Folder className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>선택된 폴더에 등록된 문서가 없습니다.</p>
                  <p className="text-[11px] text-slate-400">
                    상단의 <b>[ISO 9001]</b>, <b>[ISO 14001]</b> 등 규격 탭을 눌러 전체 마스터 틀 안에서 표준 서식을 즉시 사내 문서로 등록해 보세요!
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW B: [ISO 9001 / 14001 / 45001 / 27001 / 13485] 탭   */}
        {/* "전체 틀 안에서 내가 그 서류가 준비되어있는지 아닌지가 목록형으로 확인" */}
        {/* ======================================================== */}
        {activeTab.startsWith('ISO_') && (
          <div className="space-y-4">
            
            {/* 1. 규격 메타 배너 & 준비도 현황 */}
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
                    {activeTab === 'ISO_9001' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ★ 2024 기후변화(Climate Change) 개정 공식 반영
                      </span>
                    )}
                    {project.auditStandard === activeTab && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                        ★ {project.clientName} 목표 심사 규격
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {currentStandardInfo.description} · <b className="text-blue-900">{project.clientName}</b> 전용 서류 구비 검증 목록
                  </p>
                </div>

                {/* 준비도 상태 요약 게이지 */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">규격 준비율</div>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      {readyItemsCount} / {totalItemsCount}종 <span className="text-blue-600">({readyPercentage}%)</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-slate-200 flex items-center justify-center font-black text-xs font-mono relative overflow-hidden bg-white">
                    <span className={readyPercentage >= 70 ? 'text-emerald-600' : 'text-amber-600'}>
                      {readyPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 빠른 필터 칩 바 */}
              <div className="pt-2 border-t border-blue-200/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0">빠른 필터:</span>
                
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    filterMode === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  전체 ({totalItemsCount})
                </button>

                <button
                  onClick={() => setFilterMode('READY')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                    filterMode === 'READY'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>✅ 구비 완료 ({readyItemsCount})</span>
                </button>

                <button
                  onClick={() => setFilterMode('MISSING')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                    filterMode === 'MISSING'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>⚠️ 미비/준비필요 ({missingItemsCount})</span>
                </button>

                {activeTab === 'ISO_9001' && (
                  <>
                    <button
                      onClick={() => setFilterMode('STARTER_15')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        filterMode === 'STARTER_15'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                      }`}
                    >
                      🌟 네오앤피터 15종 우선 세트
                    </button>

                    <button
                      onClick={() => setFilterMode('AI_SPECIFIC')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        filterMode === 'AI_SPECIFIC'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      🤖 AI·컨설팅 특화 7종
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 2. 전체 틀 폴더 구조 요약 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {folders.map(folder => {
                const isSelected = selectedFolder === folder.id;
                return (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolder(selectedFolder === folder.id ? 'ALL' : folder.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-[#c2e7ff]/40 border-blue-400 shadow-xs ring-2 ring-blue-200'
                        : 'bg-[#f0f4f9]/60 hover:bg-[#edf2fc] border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 truncate">
                        <Folder className={`w-5 h-5 shrink-0 ${folder.color}`} />
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                          {folder.name}
                        </span>
                      </div>
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs shrink-0">
                        {folder.registeredCount} / {folder.count}종
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

            {/* 3. "목록형으로 확인" (Split Layout: Checklist Table + Live Inspector) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span>{currentStandardInfo.name} 전체 틀 기준 서류 구비 검증 목록</span>
                  <span className="text-xs font-normal text-slate-400 font-mono">
                    ({displayedChecklist.length}개 항목)
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  행을 클릭하면 오른쪽에 <b className="text-blue-600">{project.clientName}</b> 사내 문서 및 공식 표준 예시가 표시됩니다
                </div>
              </div>

              {/* Split Layout: Left Table (7 cols) + Right Live Inspector (5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* LEFT: Checklist Table */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-700 select-none">
                      <thead className="text-[11px] font-bold text-slate-500 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">코드 / 규격 문서명</th>
                          <th className="py-2.5 px-3">구분 / 조항</th>
                          <th className="py-2.5 px-3">준비 여부</th>
                          <th className="py-2.5 px-2 text-right">확인 / 조치</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {displayedChecklist.map((item) => {
                          const isSelected = activePreviewItem && (activePreviewItem.id === item.id || activePreviewItem.code === item.code);
                          const isRegistered = item.isRegistered;

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
                                    isRegistered ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
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

                              {/* 준비 여부 (구비 완료 vs 미비) */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                {isRegistered ? (
                                  <div>
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300 inline-flex items-center gap-1 shadow-2xs">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>구비 완료</span>
                                    </span>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {item.registeredDoc?.version || 'v1.0'} · {item.registeredDoc?.approvalDate || '승인완료'}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center gap-1 shadow-2xs">
                                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                      <span>미비 (예시 완비)</span>
                                    </span>
                                    <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                                      클릭 시 즉시 생성
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Action Button */}
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
                                  {isRegistered ? '등록본 확인' : '예시 확인'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT: Live Inspector for Customer Document & Template Preview */}
                <div className="lg:col-span-5 bg-white rounded-2xl border-2 border-blue-200/90 shadow-md p-5 flex flex-col space-y-4 sticky top-4">
                  {activePreviewItem ? (
                    <>
                      {/* Header */}
                      <div className="border-b border-slate-100 pb-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded font-mono font-black text-xs text-white ${
                              activePreviewItem.isRegistered ? 'bg-emerald-600' : 'bg-blue-600'
                            }`}>
                              {activePreviewItem.code || 'QM-01'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              {activePreviewItem.clause || activePreviewItem.clauseNumber || 'ISO 규격'}
                            </span>
                            {activePreviewItem.isRegistered && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                                {project.clientName} 구비 완료
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopyExample(activePreviewItem.displayContent || activePreviewItem.templateDraft || activePreviewItem.contentDraft)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                              title="전문 복사"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {activePreviewItem.isRegistered && (
                              <button
                                onClick={() => onOpenDetail(activePreviewItem.registeredDoc || activePreviewItem)}
                                className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                                title="사내 등록본 편집"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <h3 className="text-base font-black text-slate-900 leading-snug">
                          {activePreviewItem.title}
                        </h3>

                        {copiedToast && (
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-scale-up">
                            <Check className="w-3.5 h-3.5" />
                            <span>문서 전문이 클립보드에 복사되었습니다!</span>
                          </div>
                        )}
                      </div>

                      {/* Legal Audit Criteria & Penalty Risk */}
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

                      {/* Full-Text Formatted Markdown Viewer */}
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                          <span>
                            {activePreviewItem.isRegistered 
                              ? `[${project.clientName} 사내 등록본]` 
                              : '[공식 표준 규격 예시 본문]'}
                          </span>
                          <span className="text-[10px] text-blue-600 font-normal">
                            {activePreviewItem.isRegistered ? '승인 완료 상태' : '즉시 채택하여 등록 가능'}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap selection:bg-blue-500 selection:text-white border border-slate-800">
                          {activePreviewItem.displayContent || activePreviewItem.templateDraft || activePreviewItem.contentDraft || '문서 본문 로딩중...'}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        {activePreviewItem.isRegistered ? (
                          <button
                            onClick={() => onOpenDetail(activePreviewItem.registeredDoc || activePreviewItem)}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{project.clientName} 사내 등록본 편집하기</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAdoptExampleForProject(activePreviewItem)}
                            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>✨ 이 예시로 {project.clientName} 문서 바로 등록하기</span>
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
                      <p className="text-xs">왼쪽 목록에서 서류를 선택하면 상세 예시 및 등록본이 표시됩니다.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW C: [지원사업 매핑 (53선)] 탭                        */}
        {/* ======================================================== */}
        {activeTab === 'GOV_PROGRAMS' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-2 overflow-hidden shadow-xs">
            <GovernmentProgramsView
              documents={documents}
              onSelectDocument={onOpenDetail}
              onAddDocument={onAddDocument}
              onCreateProjectWithProgram={null}
            />
          </div>
        )}

      </div>

    </div>
  );
}
