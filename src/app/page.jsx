'use client';

import React, { useState, useEffect } from 'react';
import GlobalTopBanner from '../components/GlobalTopBanner';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DriveExplorer from '../components/DriveExplorer';
import IsoComplianceMatrixView from '../components/IsoComplianceMatrixView';
import DashboardView from '../components/DashboardView';
import RadarView from '../components/RadarView';
import WorkspaceView from '../components/WorkspaceView';
import GlobalSearchModal from '../components/GlobalSearchModal';
import RealtimeEditorModal from '../components/RealtimeEditorModal';
import AddDocumentModal from '../components/AddDocumentModal';
import AIConsultantPanel from '../components/AIConsultantPanel';
import NewProjectModal from '../components/NewProjectModal';
import ProjectDetailView from '../components/ProjectDetailView';
import GovernmentProgramsView from '../components/GovernmentProgramsView';

import { INITIAL_COMPANIES, SEED_DOCUMENTS } from '../lib/mockData';
import { 
  getStoredProjects, 
  saveStoredProjects, 
  INITIAL_AUDIT_PROJECTS 
} from '../lib/auditProjectData';
import { 
  getStoredDocuments, 
  saveStoredDocuments, 
  resetStoredDocuments, 
  supabase, 
  isSupabaseConfigured 
} from '../lib/supabaseClient';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  UserCheck, 
  Plus, 
  Compass, 
  X,
  Lightbulb,
  CheckCircle2,
  Trash2,
  Layers,
  ExternalLink,
  ShieldCheck,
  Zap,
  Briefcase
} from 'lucide-react';

export default function HomePage() {
  const [companies, setCompanies] = useState(INITIAL_COMPANIES);
  const [currentCompany, setCurrentCompany] = useState(INITIAL_COMPANIES[0]);
  const [documents, setDocuments] = useState(SEED_DOCUMENTS);
  const [projects, setProjects] = useState(INITIAL_AUDIT_PROJECTS);
  const [activeProject, setActiveProject] = useState(null);
  
  // Navigation & View States
  const [activeNav, setActiveNav] = useState('drive'); // 'drive' | 'compliance' | 'project' | 'dashboard' | 'radar' | 'workspace'
  const [selectedFolder, setSelectedFolder] = useState('ALL');
  const [selectedStandard, setSelectedStandard] = useState('ISO_9001');
  
  // Modal & Drawer States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [selectedGovProgram, setSelectedGovProgram] = useState(null);
  const [addTemplateLevel, setAddTemplateLevel] = useState('BLANK');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isKeepOpen, setIsKeepOpen] = useState(false);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  
  // Keep Memos State
  const [keepNotes, setKeepNotes] = useState([
    {
      id: 'note-1',
      title: '사후심사 D-26 필수 결재선 마감',
      tag: '긴급',
      content: '내부품질심사 보고서(QMS-P-004) 및 최고경영자 경영검토(QMS-P-002) 5월 30일까지 대표이사 전자 결재 완료 필요.',
      date: '2025-05-20'
    },
    {
      id: 'note-2',
      title: '위험성평가표 현장 서명 전수 점검',
      tag: '중대재해',
      content: 'ISO 45001 사후심사 대비 공정별 작업자 서명 누락 여부 확인 (근로자 참여 입증 필수).',
      date: '2025-05-19'
    },
    {
      id: 'note-3',
      title: '계측기 3종 국가공인 검교정 성적서 수령',
      tag: '품질',
      content: '정밀 저울 및 온습도계 한국표준과학연구원 성적서 사내 AI 드라이브 업로드 완료할 것.',
      date: '2025-05-18'
    }
  ]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Add-ons State
  const [addons, setAddons] = useState([
    {
      id: 'addon-1',
      name: '모두싸인 (Modusign) 전자결재',
      desc: 'ISO 기안자·검토자·대표이사 직인 전자서명 공인인증 연동',
      icon: '✍️',
      active: true
    },
    {
      id: 'addon-2',
      name: '올바로시스템 (Allbaro) 폐기물 연동',
      desc: '환경부 지정 폐기물 인계내역 ISO 14001 드라이브 자동 전송',
      icon: '♻️',
      active: false
    },
    {
      id: 'addon-3',
      name: 'KAB 한국인정지원센터 실시간 조회',
      desc: '공인 인증서 상태, 사후심사 일정 및 인증기관 변동 자동 알림',
      icon: '🏛️',
      active: true
    },
    {
      id: 'addon-4',
      name: '카카오톡 / Slack 심사 D-Day 알림봇',
      desc: '만기 30일 전 담당자 및 최고경영자에게 자동 알림 발송',
      icon: '🔔',
      active: true
    }
  ]);

  // Filters & Toast
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  // 1. Initial Load Documents & Projects
  useEffect(() => {
    try {
      const cached = getStoredDocuments();
      if (cached && cached.length > 0) {
        setDocuments(cached);
      } else {
        saveStoredDocuments(SEED_DOCUMENTS);
        setDocuments(SEED_DOCUMENTS);
      }
    } catch (e) {
      console.warn('Storage read fallback to seed:', e);
      setDocuments(SEED_DOCUMENTS);
    }

    try {
      const cachedProjects = getStoredProjects();
      if (cachedProjects && cachedProjects.length > 0) {
        setProjects(cachedProjects);
      }
    } catch (e) {
      console.warn('Projects read fallback:', e);
    }

    const isConfig = typeof isSupabaseConfigured === 'function' ? isSupabaseConfigured() : Boolean(isSupabaseConfigured);
    if (isConfig && supabase) {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase fetch timed out')), 1500)
      );

      Promise.race([
        supabase.from('documents').select('*'),
        timeoutPromise
      ])
      .then(({ data, error }) => {
        if (!error && data && data.length >= 20) {
          setDocuments(data);
          saveStoredDocuments(data);
        } else {
          console.log('Preserving full 29 enterprise documents instead of partial remote data');
        }
      })
      .catch((err) => {
        console.warn('Supabase fetch skipped, using robust local state:', err?.message);
      });
    }
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenDoc = (doc) => {
    setActiveDoc(doc);
    setIsEditorOpen(true);
  };

  // 신규 고객사 심사 프로젝트 생성 핸들러 (사용자 핵심 요구 기능)
  const handleCreateProject = (newProj) => {
    const updatedProjects = [newProj, ...projects];
    setProjects(updatedProjects);
    saveStoredProjects(updatedProjects);

    // 새 고객사를 테넌트 목록에도 동기화
    const newComp = {
      id: newProj.companyId,
      name: newProj.clientName,
      industry: newProj.industry,
      status: 'Active',
      isCurrent: true
    };
    setCompanies(prev => [newComp, ...prev]);
    setCurrentCompany(newComp);

    // 해당 프로젝트 매니징 폴더로 즉시 화면 전환
    setActiveProject(newProj);
    setActiveNav('project');
    showToast(`🎉 '${newProj.clientName}' 고객사 심사 프로젝트 매니징 폴더가 생성되었습니다!`);
  };

  const handleSelectProject = (proj) => {
    setActiveProject(proj);
    setActiveNav('project');
    const matchedComp = companies.find(c => c.id === proj.companyId) || {
      id: proj.companyId,
      name: proj.clientName,
      industry: proj.industry
    };
    setCurrentCompany(matchedComp);
    showToast(`'${proj.clientName}' 심사 매니징 폴더로 이동했습니다.`);
  };

  const handleCreateProjectWithProgram = (program) => {
    setSelectedGovProgram(program);
    setIsNewProjectModalOpen(true);
  };

  const handleUpdateProjectStage = (projId, newStage) => {
    const updated = projects.map(p => {
      if (p.id === projId) {
        return { ...p, currentStage: newStage };
      }
      return p;
    });
    setProjects(updated);
    saveStoredProjects(updated);
    if (activeProject && activeProject.id === projId) {
      setActiveProject({ ...activeProject, currentStage: newStage });
    }
    showToast(`심사 수검 진행 단계가 '${newStage}단계'로 갱신되었습니다.`);
  };

  const handleAddDocument = (newDoc) => {
    setDocuments(prev => {
      const updated = [newDoc, ...prev];
      saveStoredDocuments(updated);
      return updated;
    });
    showToast(`'${newDoc.title}' 문서가 클라우드 드라이브에 안전하게 등록되었습니다.`);
  };

  const handleUpdateDocument = (updatedDoc) => {
    setDocuments(prev => {
      const updated = prev.map(d => d.id === updatedDoc.id ? updatedDoc : d);
      saveStoredDocuments(updated);
      return updated;
    });
    showToast(`'${updatedDoc.title}' 문서가 성공적으로 업데이트되었습니다.`);
  };

  const handleToggleStar = (docId) => {
    setDocuments(prev => {
      const updated = prev.map(d => d.id === docId ? { ...d, isStarred: !d.isStarred } : d);
      saveStoredDocuments(updated);
      return updated;
    });
    showToast('중요 문서 보관 상태가 변경되었습니다.');
  };

  const handleDuplicateDocument = (doc) => {
    const duplicated = {
      ...doc,
      id: `doc-${Date.now()}`,
      code: `${doc.code}-COPY`,
      title: `${doc.title} (초안 복사본)`,
      version: 'v1.0-draft',
      revisionNo: 'Rev. Draft',
      docStatus: '작성 중'
    };
    handleAddDocument(duplicated);
  };

  const handleSaveEditor = (docId, updatedContent) => {
    setDocuments(prev => {
      const updated = prev.map(d => {
        if (d.id === docId) {
          return {
            ...d,
            contentDraft: updatedContent,
            lastModified: new Date().toISOString(),
          };
        }
        return d;
      });
      saveStoredDocuments(updated);
      return updated;
    });
    showToast('공문서가 클라우드에 실시간 암호화 동기화되었습니다.');
  };

  const handleToggleChecklist = (docId, checkIdx) => {
    setDocuments(prev => {
      const updated = prev.map(d => {
        if (d.id === docId && d.checklist) {
          const newChecklist = [...d.checklist];
          newChecklist[checkIdx] = {
            ...newChecklist[checkIdx],
            done: !newChecklist[checkIdx].done,
          };
          return { ...d, checklist: newChecklist };
        }
        return d;
      });
      saveStoredDocuments(updated);
      if (activeDoc && activeDoc.id === docId) {
        setActiveDoc(updated.find(d => d.id === docId));
      }
      return updated;
    });
  };

  const handleDeleteDocument = (docId) => {
    setDocuments(prev => {
      const updated = prev.filter(d => d.id !== docId);
      saveStoredDocuments(updated);
      return updated;
    });
    setIsDetailModalOpen(false);
    setIsEditorOpen(false);
    showToast('문서가 드라이브에서 삭제되었습니다.');
  };

  const handleResetData = () => {
    const reset = resetStoredDocuments();
    setDocuments(reset);
    setActiveStatusFilter('ALL');
    setSelectedFolder('ALL');
    showToast('🔄 시스템 표준 4계층 데모 데이터로 복구되었습니다.');
  };

  const handleImportAiDocs = (newDocs) => {
    setDocuments(prevDocs => {
      const existingCodes = new Set(prevDocs.map(d => d.code));
      const freshDocs = newDocs.map((d, idx) => ({
        ...d,
        id: d.id || `doc-ai-${Date.now()}-${idx}`,
        companyId: currentCompany.id,
        standards: d.standards || ['ISO_9001'],
        hierarchyLevel: d.hierarchyLevel || 'LEVEL_2',
        version: d.version || 'v1.0',
        revisionNo: 'Rev. 1.0',
        docStatus: '승인 대기',
        department: d.department || '품질경영팀',
        author: 'AI Consultant',
        expiryDate: d.expiryDate || '2026-12-31',
        dDay: d.dDay || 240
      }));

      const toAdd = freshDocs.filter(d => !existingCodes.has(d.code));
      const updatedExisting = prevDocs.map(d => {
        const found = freshDocs.find(f => f.code === d.code);
        return found ? { ...d, ...found } : d;
      });

      const merged = [...toAdd, ...updatedExisting];
      saveStoredDocuments(merged);
      return merged;
    });

    showToast(`🎉 AI가 추천한 ${newDocs.length}종의 필수 규격 문서가 내 드라이브에 체계적으로 반영되었습니다!`);
  };

  const handleAddKeepNote = (e) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    const note = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      tag: '심사메모',
      content: newNoteContent.trim() || '세부 메모 내용이 없습니다.',
      date: new Date().toISOString().split('T')[0]
    };
    setKeepNotes([note, ...keepNotes]);
    setNewNoteTitle('');
    setNewNoteContent('');
    showToast('새 심사 메모가 저장되었습니다.');
  };

  const handleDeleteKeepNote = (noteId) => {
    setKeepNotes(keepNotes.filter(n => n.id !== noteId));
    showToast('메모가 삭제되었습니다.');
  };

  const handleToggleAddon = (addonId) => {
    setAddons(addons.map(a => {
      if (a.id === addonId) {
        const nextState = !a.active;
        showToast(`'${a.name}' 연동이 ${nextState ? '활성화' : '비활성화'}되었습니다.`);
        return { ...a, active: nextState };
      }
      return a;
    }));
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafd] text-slate-800 font-sans overflow-hidden">
      
      {/* 1. Google Drive Material 3 Header */}
      <Header
        currentCompany={currentCompany}
        onSelectCompany={(comp) => {
          setCurrentCompany(comp);
          // 만약 프로젝트 목록에 해당 회사가 있으면 activeProject 동기화
          const matchedProj = projects.find(p => p.companyId === comp.id);
          if (matchedProj) {
            setActiveProject(matchedProj);
          }
          showToast(`관리 테넌트가 '${comp.name}'(으)로 전환되었습니다.`);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAddModal={(level) => {
          setAddTemplateLevel(level);
          setIsAddModalOpen(true);
        }}
        onToggleAiPanel={() => setIsAiPanelOpen(!isAiPanelOpen)}
        isAiPanelOpen={isAiPanelOpen}
        onResetData={handleResetData}
        onSelectNav={setActiveNav}
      />

      {/* 2. Main Workspace (Sidebar + Floating Card in Canvas + Companion Bar) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Google Drive Sidebar */}
        <Sidebar
          activeNav={activeNav}
          onSelectNav={(nav) => {
            setActiveNav(nav);
            if (nav !== 'project') setActiveProject(null);
          }}
          selectedStandard={selectedStandard}
          onSelectStandard={(std) => setSelectedStandard(std)}
          selectedFolder={selectedFolder}
          onSelectFolder={(folder) => setSelectedFolder(folder)}
          onOpenNewDoc={(level) => {
            setAddTemplateLevel(level);
            setIsAddModalOpen(true);
          }}
          documents={documents}
          projects={projects}
          activeProject={activeProject}
          onSelectProject={handleSelectProject}
          onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        />

        {/* Center: The Floating White Canvas Panel (핵심 고급스러움 요소) */}
        <div className="flex-1 flex flex-col min-w-0 pr-1 pb-3 pl-1 overflow-hidden">
          
          <div className="flex-1 bg-white rounded-[28px] border border-slate-200/70 shadow-xs flex flex-col overflow-hidden">
            
            {/* Inline Google Promo-style Urgent Penalty Ticker */}
            <div className="pt-2">
              <GlobalTopBanner
                onSelectDoc={(docId) => {
                  const target = documents.find(d => d.id === docId) || documents[0];
                  if (target) handleOpenDoc(target);
                }}
              />
            </div>

            {/* Scrollable View Content Canvas */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-8">
              
              {/* VIEW 1: Google Drive Document Explorer (핵심 기본 뷰) */}
              {activeNav === 'drive' && (
                <DriveExplorer
                  documents={documents}
                  selectedStandard={selectedStandard}
                  onSelectStandard={(std) => setSelectedStandard(std)}
                  selectedFolder={selectedFolder}
                  onSelectFolder={(folder) => setSelectedFolder(folder)}
                  onOpenDetail={handleOpenDoc}
                  onOpenNewDoc={(level) => {
                    setAddTemplateLevel(level);
                    setIsAddModalOpen(true);
                  }}
                  activeStatusFilter={activeStatusFilter}
                  onClearStatusFilter={() => setActiveStatusFilter('ALL')}
                  currentCompany={currentCompany}
                  onAddDocument={handleAddDocument}
                  onUpdateDocument={handleUpdateDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onToggleStar={handleToggleStar}
                  onDuplicateDoc={handleDuplicateDocument}
                />
              )}

              {/* VIEW 2: 고객사 심사 프로젝트 매니징 폴더 전용 뷰 (사용자 핵심 요구 기능) */}
              {activeNav === 'project' && activeProject && (
                <ProjectDetailView
                  project={activeProject}
                  documents={documents}
                  onBackToDrive={() => {
                    setActiveNav('drive');
                    setActiveProject(null);
                  }}
                  onOpenDetail={handleOpenDoc}
                  onOpenNewDoc={(level) => {
                    setAddTemplateLevel(level);
                    setIsAddModalOpen(true);
                  }}
                  onAddDocument={handleAddDocument}
                  onUpdateDocument={handleUpdateDocument}
                  onUpdateProjectStage={handleUpdateProjectStage}
                />
              )}

              {/* VIEW 3: ISO Statutory Compliance & Mandatory Requirements Binder */}
              {activeNav === 'compliance' && (
                <IsoComplianceMatrixView
                  documents={documents}
                  currentCompany={currentCompany}
                  onOpenDetail={handleOpenDoc}
                  onAddDocument={handleAddDocument}
                  onUpdateDocument={handleUpdateDocument}
                />
              )}

              {/* VIEW 4: ISO Certification Dashboard */}
              {activeNav === 'dashboard' && (
                <DashboardView
                  documents={documents}
                  onOpenDetail={handleOpenDoc}
                  onNavigateDrive={(folder) => {
                    setActiveNav('drive');
                    setSelectedFolder(folder);
                  }}
                />
              )}

              {/* VIEW 5: Expiry Radar & Risk Analysis */}
              {activeNav === 'radar' && (
                <RadarView
                  documents={documents}
                  onOpenDetail={handleOpenDoc}
                />
              )}

              {/* VIEW 6: Workspace Management & Sandbox Reset */}
              {activeNav === 'workspace' && (
                <WorkspaceView
                  onResetData={handleResetData}
                />
              )}

              {/* VIEW 7: Government & Local Gov Grant Programs (53 Programs) */}
              {activeNav === 'gov_programs' && (
                <GovernmentProgramsView
                  documents={documents}
                  onSelectDocument={handleOpenDoc}
                  onAddDocument={handleAddDocument}
                  onCreateProjectWithProgram={handleCreateProjectWithProgram}
                />
              )}

            </div>

          </div>

        </div>

        {/* 3. Google Drive Signature Right Companion Bar (우측 아이콘 레일) */}
        <div className="w-14 bg-[#f8fafd] flex flex-col items-center py-4 space-y-4 shrink-0 border-l border-slate-200/50 select-none">
          
          {/* Calendar (사후심사 D-26) */}
          <button 
            onClick={() => setActiveNav('dashboard')}
            title="ISO 사후심사 일정 (D-26)"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200/70 transition-colors relative group"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex flex-col items-center justify-center font-bold text-[9px] shadow-2xs">
              <span className="text-[7px] leading-none">6월</span>
              <span className="leading-tight">15</span>
            </div>
            <span className="absolute right-12 bg-slate-900 text-white text-[11px] px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              사후심사 D-26일
            </span>
          </button>

          {/* Keep / Memo Button -> Opens ISO Audit Keep Drawer */}
          <button 
            onClick={() => setIsKeepOpen(true)}
            title="ISO 심사 메모 (Google Keep)"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200/70 transition-colors relative group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-white flex items-center justify-center shadow-2xs">
              <Lightbulb className="w-4 h-4" />
            </div>
            <span className="absolute right-12 bg-slate-900 text-white text-[11px] px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              심사 메모 ({keepNotes.length})
            </span>
          </button>

          {/* Tasks / Checklist -> Navigates to Compliance Binder */}
          <button 
            onClick={() => setActiveNav('compliance')}
            title="ISO 법정 필수 규격 바인더 진단"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200/70 transition-colors relative group"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="absolute right-12 bg-slate-900 text-white text-[11px] px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              필수 규격 바인더
            </span>
          </button>

          {/* Radar Quick View */}
          <button 
            onClick={() => setActiveNav('radar')}
            title="만기 레이더 리스크 분석"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200/70 transition-colors relative group"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-2xs">
              <Compass className="w-4 h-4" />
            </div>
            <span className="absolute right-12 bg-slate-900 text-white text-[11px] px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              만기 레이더
            </span>
          </button>

          {/* Gemini AI Co-pilot */}
          <button 
            onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
            title="Gemini AI 규격 어시스턴트"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors relative group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="absolute right-12 bg-slate-900 text-white text-[11px] px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              AI 규격 어시스턴트
            </span>
          </button>

          <div className="w-6 h-px bg-slate-200 my-2"></div>

          {/* Add Add-on Icon -> Opens Workspace Add-on Marketplace Modal */}
          <button 
            onClick={() => setIsAddonModalOpen(true)}
            title="추가 부가기능 (Google Workspace Add-ons)"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 transition-colors relative group"
          >
            <Plus className="w-5 h-5" />
            <span className="absolute right-12 bg-slate-900 text-white text-[11px] px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              ISO 부가기능 마켓플레이스
            </span>
          </button>

        </div>

        {/* Right Drawer: AI Co-pilot Consultant Panel */}
        {isAiPanelOpen && (
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slide-left">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Gemini AI 규격 어시스턴트</h3>
                  <div className="text-[10px] text-purple-700">ISO 인증 진단 및 규격 문서 자동 편성</div>
                </div>
              </div>
              <button
                onClick={() => setIsAiPanelOpen(false)}
                aria-label="AI 패널 닫기"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <AIConsultantPanel
                onImportDocuments={handleImportAiDocs}
                currentCompany={currentCompany}
              />
            </div>
          </aside>
        )}

      </div>

      {/* 4. Google Keep Style ISO Audit Memo Drawer */}
      {isKeepOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fade-in"
          onClick={() => setIsKeepOpen(false)}
        >
          <aside 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-white flex items-center justify-center shadow-xs">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ISO 심사 준비 메모 (Keep)</h3>
                  <p className="text-[11px] text-slate-500">사후심사 전 부서간 확인 필요 사항 퀵 메모</p>
                </div>
              </div>
              <button onClick={() => setIsKeepOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddKeepNote} className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-2">
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="메모 제목 (예: 3층 소화기 정기 점검표 첨부)"
                className="w-full px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
              />
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="세부 조치 내용..."
                rows={2}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white resize-none"
              />
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={!newNoteTitle.trim()}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                >
                  메모 저장
                </button>
              </div>
            </form>

            {/* Notes Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {keepNotes.map(note => (
                <div key={note.id} className="p-3.5 rounded-2xl bg-[#fffdf5] border border-amber-200/90 shadow-2xs space-y-1.5 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {note.tag}
                    </span>
                    <button 
                      onClick={() => handleDeleteKeepNote(note.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">{note.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{note.content}</p>
                  <div className="text-[10px] text-slate-400 pt-1">{note.date}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* 5. Google Workspace Add-on Marketplace Modal */}
      {isAddonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">ISO Enterprise Add-on 마켓플레이스</h3>
                  <p className="text-xs text-slate-400">외부 공인 기관 및 전자서명 시스템 실시간 연동</p>
                </div>
              </div>
              <button onClick={() => setIsAddonModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {addons.map(item => (
                <div key={item.id} className="p-3.5 rounded-xl border border-slate-200/90 flex items-center justify-between hover:border-blue-400 transition-colors">
                  <div className="flex items-center gap-3 pr-2">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-snug">{item.desc}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleAddon(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      item.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    {item.active ? '✓ 활성화됨' : '설치 및 연동'}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t flex justify-end">
              <button onClick={() => setIsAddonModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. New Client Project Creation Modal (사용자 핵심 요구 기능) */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => {
          setIsNewProjectModalOpen(false);
          setSelectedGovProgram(null);
        }}
        onCreateProject={handleCreateProject}
        initialProgram={selectedGovProgram}
      />

      {/* 7. Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        documents={documents}
        onSelectDoc={handleOpenDoc}
      />

      <RealtimeEditorModal
        doc={activeDoc}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setActiveDoc(null);
        }}
        onSave={handleSaveEditor}
        onToggleChecklist={handleToggleChecklist}
        onDeleteDocument={handleDeleteDocument}
      />

      <AddDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddDocument={handleAddDocument}
        currentCompany={currentCompany}
        initialLevel={addTemplateLevel}
      />

      {/* 8. Real-time Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-scale-up">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
