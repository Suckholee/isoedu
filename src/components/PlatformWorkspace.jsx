'use client';
import ModalLayer from './ui/ModalLayer';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { navFromPath, platformHref } from '../lib/platformRoutes.mjs';
import Header from '../components/Header';
import PlatformUtilityView from '../components/PlatformUtilityView';
import Sidebar from '../components/PlatformSidebar';
import DriveExplorer from '../components/DriveExplorer';
import ClientDrive from './ClientDrive';
import ManagedClientDrive from './ManagedClientDrive';
import IsoComplianceMatrixView from '../components/IsoComplianceMatrixView';
import MyWorkView from './MyWorkView';
import EnterpriseWorkspace from './EnterpriseWorkspace';
import GrowthIntakeHandoff from './GrowthIntakeHandoff';
import {useMemberPortal} from '../hooks/useMemberPortal';
import AgentSchedulesView from './AgentSchedulesView';
import RadarView from '../components/RadarView';
import WorkspaceView from '../components/WorkspaceView';
import GlobalSearchModal from '../components/GlobalSearchModal';
import RealtimeEditorModal from '../components/RealtimeEditorModal';
import AddDocumentModal from '../components/AddDocumentModal';
import AIConsultantPanel from '../components/AIConsultantPanel';
import NewProjectModal from '../components/NewProjectModal';
import CompanyProjects from './CompanyProjects';
import ProjectPreparationView from './ProjectPreparationView';
import ProjectDetailView from '../components/ProjectDetailView';
import GovernmentProgramsView from '../components/GovernmentProgramCalendar';
import AdminCenterView from './AdminCenterView';
import { resolveAdminTab } from '../lib/adminCenter.mjs';

import { INITIAL_COMPANIES, SEED_DOCUMENTS } from '../lib/mockData';
import { useAuth } from '../context/AuthContext';
import { useDocuments } from '../hooks/useDocuments';
import { isCloudMode } from '../lib/dataConfig';
import { mergeImportedDocuments } from '../lib/documentModel';
import { loadWorkspace, createProject, updateProject } from '../lib/workspaceRepository';
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
  Briefcase,
  PanelLeftOpen,
  ChevronRight
} from 'lucide-react';

import {managedClients,resolveClient,clientContextSearch} from '../lib/clientContext.mjs';

export default function PlatformWorkspace() {
  const contentRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => { contentRef.current?.scrollTo({top:0,left:0}); }, [pathname]);
  const activeNav = navFromPath(pathname) || 'dashboard';
  const selectedStandard = searchParams.get('standard') || 'ISO_9001';
  const selectedFolder = searchParams.get('folder') || 'ALL';
  const navigate = (nav, patch = {}) => router.push(platformHref(nav, searchParams.toString(), patch), { scroll: false });
  const setActiveNav = nav => navigate(nav);
  const setSelectedStandard = standard => router.replace(platformHref(activeNav, searchParams.toString(), {standard}), {scroll:false});
  const setSelectedFolder = folder => router.replace(platformHref(activeNav, searchParams.toString(), {folder}), {scroll:false});
  const { user, profile, isLoading: authLoading, authError, auditWarning } = useAuth();
  const memberPortal=useMemberPortal();
  const [companies, setCompanies] = useState(isCloudMode ? [] : INITIAL_COMPANIES);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [workspaceError, setWorkspaceError] = useState(null);
  const clientCompanies = memberPortal.enterprise?companies.filter(c=>memberPortal.context.companies.some(p=>p.id===c.id)):managedClients(companies,isCloudMode?profile?.company?.id:null);
  const requestedClientId = searchParams.get('company');
  const accountId = isCloudMode ? user?.id : 'local';
  const accountRef = useRef(accountId);
  accountRef.current = accountId;
  const documentStore = useDocuments({
    companyId: currentCompany?.id, userId: accountId,
    enabled: !authLoading && (!isCloudMode || Boolean(user && profile)),
  });
  const documents = documentStore.documents;

  // Navigation & View States

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

  // Left Sidebar Collapse/Expand State with localStorage persistence
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('isoedu_sidebar_open');
      if (saved !== null) {
        setIsSidebarOpen(saved === 'true');
      }
    } catch (e) {}
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('isoedu_sidebar_open', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Keyboard shortcut: [ or Ctrl/Cmd + B to toggle left sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      const targetTag = e.target?.tagName?.toUpperCase();
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || e.target?.isContentEditable) {
        return;
      }
      if (e.key === '[' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCompanies([]);
    setProjects([]);
    setCurrentCompany(null);
    setActiveProject(null);
    setActiveDoc(null);
    setIsEditorOpen(false);
    setWorkspaceError(null);
    if (authLoading || (isCloudMode && (!user || !profile))) return;
    loadWorkspace().then(({ companies: loadedCompanies, projects: loadedProjects }) => {
      if (cancelled) return;
      setCompanies(loadedCompanies);
      setProjects(loadedProjects);
      setCurrentCompany(null);
    }).catch(error => { if (!cancelled) setWorkspaceError(error.message); });
    return () => { cancelled = true; };
  }, [accountId, authLoading, profile?.id]);

  useEffect(() => { setCurrentCompany(resolveClient(clientCompanies,requestedClientId)||(memberPortal.enterprise?clientCompanies.find(c=>c.id===profile?.company?.id)||clientCompanies[0]||null:null)); }, [requestedClientId,companies,profile?.company?.id,memberPortal.context]);

  useEffect(() => {
    setActiveDoc(null);
    setIsEditorOpen(false);
  }, [currentCompany?.id]);

  useEffect(() => {
    if (activeNav !== 'project') return;
    const id = decodeURIComponent(pathname.split('/')[2] || '');
    const project = projects.find(item => item.id === id);
    setActiveProject(project || null);
    if (project) setCurrentCompany(companies.find(company => company.id === project.companyId) || null);
  }, [pathname, projects, companies, activeNav]);

  useEffect(() => {
    if (!isCloudMode || !user || !profile) return;
    let active=true;
    const refresh=async()=>{const uid=accountId;try{const w=await loadWorkspace();if(active&&accountRef.current===uid){setCompanies(w.companies);setProjects(w.projects);}}catch{if(active){setCompanies([]);setProjects([]);setCurrentCompany(null);setActiveProject(null);}}};
    window.addEventListener('focus',refresh);
    return ()=>{active=false;window.removeEventListener('focus',refresh);};
  }, [accountId,profile?.id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenDoc = (doc) => {
    setActiveDoc(doc);
    setIsEditorOpen(true);
  };

  // 신규 고객사 심사 프로젝트 생성 핸들러 (사용자 핵심 요구 기능)
  const handleCreateProject = async (newProj) => {
    const requestedAccount = accountId;
    try {
      const saved = await createProject(newProj);
      if (accountRef.current !== requestedAccount) return null;
      const workspace = await loadWorkspace();
      if (accountRef.current !== requestedAccount) return null;
      setProjects(workspace.projects);
      setCompanies(workspace.companies);
      setCurrentCompany(workspace.companies.find(company => company.id === saved.companyId));
      setActiveProject(saved);
      navigate('project', {projectId: saved.id,company:saved.companyId});
      showToast(`'${saved.clientName}' 프로젝트가 ${isCloudMode ? 'Supabase에' : '이 브라우저에'} 저장되었습니다.`);
      return saved;
    } catch (error) { showToast(`프로젝트 저장 실패: ${error.message}`); return null; }
  };

  const handleSelectProject = (proj) => {
    setActiveProject(proj);
    navigate('project', {projectId: proj.id,company:proj.companyId});
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

  const handleUpdateProjectStage = async (projId, newStage) => {
    const project = projects.find(item => item.id === projId);
    if (!project) return;
    try {
      const saved = await updateProject({ ...project, currentStage: newStage });
      setProjects(prev => prev.map(item => item.id === saved.id ? saved : item));
      setActiveProject(prev => prev?.id === saved.id ? saved : prev);
      showToast('프로젝트 진행 단계를 저장했습니다.');
    } catch (error) { showToast(`저장 실패: ${error.message}`); }
  };

  const saveDocuments = async (changes, message) => {
    try {
      const saved = await documentStore.save(changes);
      setActiveDoc(prev => saved.find(doc => doc.id === prev?.id) || prev);
      showToast(message || `${isCloudMode ? 'Supabase에' : '이 브라우저에'} 문서를 저장했습니다.`);
      return saved;
    } catch (error) { showToast(`문서 저장 실패: ${error.message}`); return null; }
  };

  const handleAddDocument = async newDoc => {
    const saved = await handleAddDocuments([newDoc]);
    return saved?.[0] || null;
  };

  const handleAddDocuments = async (newDocs = []) => {
    if (!newDocs.length) return [];
    const targetCompanyId = currentCompany?.id || newDocs[0]?.companyId;
    if (!targetCompanyId) { showToast('회사를 선택해 주세요.'); return null; }
    if (newDocs.some(doc => doc.companyId && currentCompany?.id && doc.companyId !== currentCompany.id)) {
      showToast('현재 선택한 거래처의 문서만 추가할 수 있습니다.');
      return null;
    }
    const prepared = newDocs.map(newDoc => {
      const validUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newDoc.id || '');
      return {
        ...newDoc, id: validUuid ? newDoc.id : crypto.randomUUID(), companyId: targetCompanyId,
        title: newDoc.title || newDoc.name, contentDraft: newDoc.contentDraft || newDoc.content || '',
        standards: newDoc.standards || [newDoc.standard || selectedStandard],
      };
    });
    const saved = await saveDocuments(prepared, `${prepared.length}개 문서를 저장했습니다.`);
    if (!saved) return null;
    const savedIds = new Set(prepared.map(doc => doc.id));
    return saved.filter(doc => savedIds.has(doc.id));
  };

  const handleUpdateDocument = async updatedDoc => {
    const saved = await saveDocuments(current => {
      const old = current.find(doc => doc.id === updatedDoc.id);
      if (!old) throw new Error('현재 회사의 문서가 아닙니다.');
      return [{ ...old, ...updatedDoc, companyId: old.companyId }];
    });
    return saved?.[0] || null;
  };

  const updateExisting = (id, patch) => saveDocuments(current => {
    const doc = current.find(item => item.id === id);
    if (!doc) throw new Error('문서를 찾을 수 없습니다.');
    return [{ ...doc, ...patch(doc) }];
  });
  const handleToggleStar = id => updateExisting(id, doc => ({ isStarred: !doc.isStarred }));
  const handleDuplicateDocument = doc => handleAddDocument({ ...doc, code: `${doc.code}-COPY`, title: `${doc.title} (초안 복사본)`, version: 'v1.0-draft', revisionNo: 'Rev. Draft', docStatus: '작성 중' });
  const handleSaveEditor = (id, contentDraft) => updateExisting(id, () => ({ contentDraft, lastModified: new Date().toISOString() }));
  const handleToggleChecklist = (id, index) => updateExisting(id, doc => ({
    checklist: doc.checklist.map((check, i) => i === index ? { ...check, done: !check.done } : check),
  }));

  const handleDeleteDocument = async id => {
    try {
      await documentStore.remove(id);
      setIsEditorOpen(false);
      setActiveDoc(null);
      showToast('문서를 삭제했습니다.');
      return true;
    } catch (error) { showToast(`문서 삭제 실패: ${error.message}`); return false; }
  };

  const handleResetData = async () => {
    if (isCloudMode) { showToast('클라우드 모드에서는 데모 데이터 초기화를 사용할 수 없습니다.'); return; }
    const seeds = SEED_DOCUMENTS.filter(doc => doc.companyId === currentCompany?.id);
    await saveDocuments(seeds, '현재 회사의 데모 문서를 복원했습니다.');
  };

  const handleImportAiDocs = newDocs => saveDocuments(current => {
    const merged = mergeImportedDocuments(current, newDocs, currentCompany?.id);
    const codes = new Set(newDocs.map(doc => doc.code));
    return merged.filter(doc => codes.has(doc.code));
  });

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

  const selectCompany = comp => {setCurrentCompany(comp);setActiveProject(comp?projects.find(p=>p.companyId===comp.id)||null:null);const p=clientContextSearch(searchParams.toString(),comp);router.push((activeNav==='project'?'/certifications':pathname)+(p.size?'?'+p:''),{scroll:false});showToast(comp?`${comp.name} 기준으로 전환했습니다.`:'전체 거래처로 전환했습니다.');};
  return (
    <div className="iso-app ppt-layout h-screen flex flex-col text-slate-800 font-sans overflow-hidden">

      {/* 2. Main Workspace (Sidebar + Floating Card in Canvas + Companion Bar) */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Left Google Drive Sidebar (Collapsible) */}
        <Sidebar
          enterprise={memberPortal.enterprise}
          companies={clientCompanies}
          onSelectCompany={selectCompany}
        onCreateClient={memberPortal.enterprise?undefined:()=>setIsNewProjectModalOpen(true)}
          currentCompany={currentCompany}
          isOpen={isSidebarOpen}
          onToggle={handleToggleSidebar}
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
          projects={currentCompany?projects.filter(p=>p.companyId===currentCompany.id):projects}
          activeProject={activeProject}
          onSelectProject={handleSelectProject}
          onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        />

        {/* Center: The Floating White Canvas Panel (핵심 고급스러움 요소) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="platform-workspace-topbar">
      {/* 1. Google Drive Material 3 Header */}
      <Header
        enterprise={memberPortal.enterprise}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        currentCompany={currentCompany}
        companies={clientCompanies}
        onSelectCompany={selectCompany}
        onCreateClient={memberPortal.enterprise?undefined:()=>setIsNewProjectModalOpen(true)}
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

      {(authError || auditWarning || workspaceError || documentStore.error || (isCloudMode && !user)) && (
        <div role="alert" className="platform-connection-notice">
          {authError || workspaceError || documentStore.error || auditWarning || '클라우드 문서를 보려면 오른쪽 프로필 메뉴에서 로그인해 주세요.'}
        </div>
      )}

          </div>


          <div className="iso-workspace flex-1 flex flex-col overflow-hidden">

            {/* Scrollable View Content Canvas */}
            <div ref={contentRef} className="platform-scroll flex-1 overflow-auto">
              {searchParams.get("intake")==="1"&&<GrowthIntakeHandoff companies={(memberPortal.context?.companies||[]).filter(c=>memberPortal.enterprise||clientCompanies.some(client=>client.id===c.id))} currentCompany={currentCompany}/>}

              {isCloudMode&&user&&(memberPortal.loading||memberPortal.error)?<div className="p-6"><p role={memberPortal.error?'alert':'status'}>{memberPortal.error?'회원 화면을 불러오지 못했습니다. 회사 연결 설정을 확인해 주세요.':'회원·회사 정보를 확인하고 있습니다.'}</p>{memberPortal.error&&<button className="text-blue-700 underline mt-3" onClick={memberPortal.reload}>다시 불러오기</button>}</div>:memberPortal.enterprise?<EnterpriseWorkspace context={memberPortal.context} company={currentCompany} projects={projects} documents={documents} activeNav={activeNav} activeProject={activeProject} onSelectCompany={c=>{selectCompany(c);if(activeNav==='settings')setActiveNav('dashboard');}} onSelectProject={handleSelectProject} onRefresh={async()=>{const uid=accountRef.current;const w=await loadWorkspace();if(accountRef.current===uid){setCompanies(w.companies);setProjects(w.projects);memberPortal.reload();}}} onOpenDocument={handleOpenDoc} onAddDocument={handleAddDocument} onUpdateDocument={handleUpdateDocument} onOpenUpload={()=>setIsAddModalOpen(true)} onOpenDocuments={()=>setActiveNav('drive')}/>:<>
              {currentCompany&&<div className="managed-context-bar"><strong>현재 거래처 · {currentCompany.name}</strong><button onClick={()=>selectCompany(null)}>전체 거래처로 전환</button></div>}
              {activeNav==='gov_programs'&&currentCompany&&<p className="px-8 text-sm text-slate-500">{currentCompany.name} 작업 중 · 공고는 전체 목록이며 회사 정보에 따른 신청 적합성 판정은 아직 제공되지 않습니다.</p>}

              {['schedule', 'radar', 'notifications', 'reports'].includes(activeNav) && (
                <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-6 md:px-8 pt-3">
                  <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 overflow-x-auto" role="tablist" aria-label="사후·일정 관리 탭">
                      {[
                        { id: 'schedule', label: '심사 일정', sub: 'S23·S28', count: projects.length },
                        { id: 'radar', label: '유효기간 · 리스크', sub: 'S26·S29', count: projects.length + documents.filter(d => d.expiryDate || d.hierarchyLevel === 'CERT').length },
                        { id: 'notifications', label: '알림 센터', sub: 'S27·S25', count: documents.filter(d => d.reviewStatus !== 'VERIFIED' && d.docStatus !== '승인 완료').length },
                        { id: 'reports', label: '준비 보고서', sub: 'S09', count: null },
                      ].map(tab => {
                        const isActive = activeNav === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => navigate(tab.id)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                              isActive
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                          >
                            <span>{tab.label}</span>
                            {typeof tab.count === 'number' && (
                              <span
                                className={`text-[11px] px-1.5 py-0.5 rounded-full font-extrabold ${
                                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {tab.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pb-2 text-xs text-slate-500 hidden sm:block">
                      심사 일정 · 유효기간 리스크 · 문서/규격 알림 · 준비 보고서 통합 관리
                    </div>
                  </div>
                </div>
              )}

              {['settings', 'agent_schedules'].includes(activeNav) && (
                <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-6 md:px-8 pt-3">
                  <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2" role="tablist" aria-label="설정 및 자동화 탭">
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'settings', label: '계정 · 팀 권한 설정' },
                        { id: 'agent_schedules', label: '예약된 에이전트 실행목록' },
                      ].map(tab => {
                        const isActive = activeNav === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => navigate(tab.id)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                              isActive
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('admin')}
                      className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 cursor-pointer"
                    >
                      <span>관리자 센터 (회원 · 권한 · 전자발송) 열기 →</span>
                    </button>
                  </div>
                </div>
              )}

              {activeNav === 'admin' && (
                <AdminCenterView
                  activeTab={resolveAdminTab(pathname, searchParams)}
                  onSelectTab={adminTab =>
                    router.push(
                      platformHref('admin', searchParams.toString(), {
                        adminTab: adminTab === 'members' ? null : adminTab,
                      }),
                      { scroll: false }
                    )
                  }
                  companies={companies}
                  currentCompany={currentCompany}
                  onSelectCompany={selectCompany}
                  projects={projects}
                  documents={documents}
                  onCreateClient={memberPortal.enterprise?undefined:()=>setIsNewProjectModalOpen(true)}
                  onWorkspaceChanged={async () => {
                    const w = await loadWorkspace();
                    setCompanies(w.companies);
                    setProjects(w.projects);
                  }}
                  onShowToast={showToast}
                />
              )}

              {activeNav === 'agent_schedules' && <AgentSchedulesView/>}

              {['schedule', 'notifications', 'reports', 'settings'].includes(activeNav) && (
                <PlatformUtilityView
                  key={activeNav}
                  view={activeNav}
                  documents={documents}
                  projects={projects}
                  companies={clientCompanies}
                  currentCompany={currentCompany}
                  onSelectCompany={selectCompany}
                  onSelectProject={handleSelectProject}
                  onCreateProject={() => setIsNewProjectModalOpen(true)}
                  onWorkspaceChanged={async () => {
                    const w = await loadWorkspace();
                    setCompanies(w.companies);
                    setProjects(w.projects);
                  }}
                  onOpenDetail={handleOpenDoc}
                  onNavigate={(nav, standard) => navigate(nav, standard ? { standard } : {})}
                />
              )}

              {/* VIEW 1: Google Drive Document Explorer (핵심 기본 뷰) */}
              {activeNav === 'drive' && pathname !== '/documents/iso' && (isCloudMode?<ManagedClientDrive clients={clientCompanies} selectedClient={currentCompany} documents={documents} onSelectClient={selectCompany} onOpenDocument={handleOpenDoc} onAddDocument={()=>setIsAddModalOpen(true)} onCreateClient={()=>setIsNewProjectModalOpen(true)}/>:<ClientDrive selectedClient={currentCompany}/>)}
              {activeNav === 'drive' && pathname === '/documents/iso' && (
                <DriveExplorer
                  documents={documents}
                  selectedStandard={selectedStandard}
                  onSelectStandard={standard => router.replace(platformHref('drive', searchParams.toString(), {standard,folder:'ALL'}), {scroll:false})}
                  selectedFolder={selectedFolder}
                  onSelectFolder={folder => router.replace(platformHref('drive', searchParams.toString(), {standard:selectedStandard,folder}), {scroll:false})}
                  onOpenDetail={handleOpenDoc}
                  onOpenNewDoc={(level) => {
                    setAddTemplateLevel(level);
                    setIsAddModalOpen(true);
                  }}
                  activeStatusFilter={activeStatusFilter}
                  onClearStatusFilter={() => setActiveStatusFilter('ALL')}
                  currentCompany={currentCompany || { name: '회사 선택 필요' }}
                  onAddDocument={handleAddDocument}
                  onUpdateDocument={handleUpdateDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onToggleStar={handleToggleStar}
                  onDuplicateDoc={handleDuplicateDocument}
                />
              )}

              {activeNav === 'project' && !activeProject && <div role="status" className="p-8 text-sm text-slate-500">로그인 및 회사 권한을 확인한 뒤 프로젝트를 불러올 수 있습니다. 프로젝트가 없거나 접근 권한이 없을 수 있습니다.</div>}

              {/* VIEW 2: 고객사 심사 프로젝트 매니징 폴더 전용 뷰 (사용자 핵심 요구 기능) */}
              {activeNav === 'project' && activeProject?.workflowVersion === 2 && <ProjectPreparationView key={activeProject.id} project={activeProject} documents={documents} onOpenDetail={handleOpenDoc} onAddDocument={handleAddDocument} onAddDocuments={handleAddDocuments} onUpdateDocument={handleUpdateDocument} onWorkspaceChanged={async()=>{const uid=accountRef.current;const w=await loadWorkspace();if(accountRef.current===uid){setCompanies(w.companies);setProjects(w.projects);}}}/>}
              {activeNav === 'project' && activeProject && activeProject.workflowVersion !== 2 && (
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
              {activeNav === 'compliance' && <CompanyProjects projects={projects} company={currentCompany} companies={clientCompanies} documents={documents} onCreate={()=>setIsNewProjectModalOpen(true)} onSelect={handleSelectProject}/>}
              {activeNav === 'compliance' && !currentCompany && <div className="platform-card m-8"><h1>인증 관리</h1><p className="my-4 text-slate-500">관리할 거래처를 선택하면 해당 거래처의 인증과 구비문서 현황을 확인할 수 있습니다.</p><button className="work-primary" onClick={()=>setIsNewProjectModalOpen(true)}>거래처·프로젝트 추가</button></div>}
              {activeNav === 'compliance' && currentCompany && (
                <IsoComplianceMatrixView
                  key={selectedStandard}
                  initialStandard={selectedStandard}
                  onSelectStandard={setSelectedStandard}
                  documents={documents}
                  currentCompany={currentCompany || { name: '회사 선택 필요' }}
                  onOpenDetail={handleOpenDoc}
                  onAddDocument={handleAddDocument}
                  onUpdateDocument={handleUpdateDocument}
                />
              )}

              {/* VIEW 4: ISO Certification Dashboard */}
              {activeNav === 'dashboard' && (
                <MyWorkView selectedClient={currentCompany} clients={clientCompanies} projects={projects} onCreateProject={()=>setIsNewProjectModalOpen(true)} onSelectProject={handleSelectProject}/>
              )}

              {/* VIEW 5: Expiry Radar & Risk Analysis */}
              {activeNav === 'radar' && (
                <RadarView
                  documents={documents}
                  projects={projects}
                  currentCompany={currentCompany}
                  companies={clientCompanies}
                  onSelectCompany={selectCompany}
                  onSelectProject={handleSelectProject}
                  onCreateProject={() => setIsNewProjectModalOpen(true)}
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
                  currentCompany={currentCompany}
                  onSelectDocument={handleOpenDoc}
                  onAddDocument={handleAddDocument}
                  onCreateProjectWithProgram={handleCreateProjectWithProgram}
                />
              )}

              </>}
            </div>

          </div>

        </div>

        {/* 3. Google Drive Signature Right Companion Bar (우측 아이콘 레일) */}
        <div className="hidden w-14 bg-slate-50 flex-col items-center py-4 space-y-4 shrink-0 border-l border-slate-200/50 select-none">

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
                currentCompany={currentCompany || { name: '회사 선택 필요' }}
              />
            </div>
          </aside>
        )}

      </div>

      {/* 4. Google Keep Style ISO Audit Memo Drawer */}
      {isKeepOpen && (
        <ModalLayer
          onClose={() => setIsKeepOpen(false)} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fade-in"
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
        </ModalLayer>
      )}

      {/* 5. Google Workspace Add-on Marketplace Modal */}
      {isAddonModalOpen && (
        <ModalLayer onClose={() => setIsAddonModalOpen(false)} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
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
        </ModalLayer>
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
        companies={clientCompanies}
        currentCompany={currentCompany}
      />

      {/* 7. Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        documents={documents}
        onSelectDoc={handleOpenDoc}
      />

      <RealtimeEditorModal
        key={activeDoc?.id || "closed"}
        doc={activeDoc}
        currentCompany={currentCompany}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setActiveDoc(null);
        }}
        onSave={handleSaveEditor}
        onUpdateDocument={handleUpdateDocument}
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
