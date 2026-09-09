'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Home, 
  Folder, 
  Users, 
  Clock, 
  Star, 
  Trash2, 
  Compass, 
  BarChart3, 
  ChevronRight, 
  ChevronDown, 
  Cloud,
  Award, 
  BookOpen, 
  GitPullRequest, 
  FileText, 
  ClipboardCheck, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  HardDrive,
  Briefcase,
  FolderPlus,
  Landmark,
  Sparkles
} from 'lucide-react';
import { ISO_STANDARDS_INFO, ISO_MANDATORY_REQUIREMENTS } from '../lib/isoRequirementsData.js';
import { ISO_9001_MASTER_BLUEPRINT } from '../lib/iso9001Blueprint.js';

export default function Sidebar({ 
  activeNav, 
  onSelectNav, 
  selectedStandard = 'ISO_9001',
  onSelectStandard,
  selectedFolder,
  onSelectFolder,
  onOpenNewDoc,
  documents,
  projects = [],
  activeProject = null,
  onSelectProject,
  onOpenNewProjectModal
}) {
  const [expandedStandards, setExpandedStandards] = useState({
    ISO_9001: true,
    ISO_14001: false,
    ISO_45001: false,
    ISO_27001: false,
    ISO_13485: false
  });
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // 규격별 & 계층별 문서 카운트 (메타 기준화)
  const getStandardCount = (stdCode, level = 'ALL') => {
    if (stdCode === 'ISO_9001') {
      if (level === 'ALL') return ISO_9001_MASTER_BLUEPRINT.length + 1;
      if (level === 'BASE' || level === 'LEVEL_1') return ISO_9001_MASTER_BLUEPRINT.filter(d => d.category === 'BASE').length;
      if (level === 'PROCEDURE' || level === 'LEVEL_2') return ISO_9001_MASTER_BLUEPRINT.filter(d => d.category === 'PROCEDURE').length;
      if (level === 'RECORD' || level === 'LEVEL_4' || level === 'LEVEL_3') return ISO_9001_MASTER_BLUEPRINT.filter(d => d.category === 'RECORD').length;
      if (level === 'CERT') return 1;
    }

    const stdReqs = ISO_MANDATORY_REQUIREMENTS.filter(r => r.standard === stdCode);
    if (level === 'ALL') {
      const baseReqCount = stdReqs.length || (documents ? documents.filter(d => d.standards?.includes(stdCode)).length : 0);
      return baseReqCount;
    }
    const reqLevelCount = stdReqs.filter(r => r.level === level).length;
    if (reqLevelCount > 0) return reqLevelCount;
    if (!documents) return 0;
    return documents.filter(d => (d.standards?.includes(stdCode) || d.standards?.includes('ALL')) && d.hierarchyLevel === level).length;
  };

  const getCount = (level) => {
    if (!documents) return 0;
    if (level === 'ALL') return documents.length;
    if (level === 'STARRED') return documents.filter(d => d.isStarred || (d.dDay !== undefined && d.dDay <= 30)).length;
    return documents.filter(d => d.hierarchyLevel === level).length;
  };

  const toggleStandardExpand = (stdCode, e) => {
    e.stopPropagation();
    setExpandedStandards(prev => ({
      ...prev,
      [stdCode]: !prev[stdCode]
    }));
  };

  return (
    <aside className="w-64 bg-[#f8fafd] flex flex-col justify-between p-3 select-none shrink-0 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="space-y-4">
        
        {/* 1. Google Drive '+ 신규' Floating Pill Button with Dropdown */}
        <div className="pt-2 px-1 relative">
          <button
            onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-md hover:shadow-lg border border-slate-200/60 transition-all group w-full"
          >
            {/* Google-colored Plus Icon */}
            <div className="w-6 h-6 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-6 h-6 group-hover:scale-110 transition-transform">
                <path fill="#4285F4" d="M16 16v14h4V16h14v-4H20V-2h-4v14H2v4h14z" transform="translate(0, 4)"/>
                <path fill="#34A853" d="M30 16H20v-4h10v4z"/>
                <path fill="#FBBC05" d="M16 30h4V20h-4v10z"/>
                <path fill="#EA4335" d="M16 16H6v4h10v-4z"/>
              </svg>
            </div>
            <span className="text-[14px] font-bold text-slate-700 tracking-tight">신규</span>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-auto" />
          </button>

          {/* New Actions Dropdown */}
          {isNewMenuOpen && (
            <div 
              onClick={() => setIsNewMenuOpen(false)}
              className="absolute left-1 right-1 top-16 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs space-y-1 animate-scale-up"
            >
              <button
                onClick={() => {
                  onOpenNewProjectModal && onOpenNewProjectModal();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-blue-50 text-blue-700 font-bold transition-colors text-left"
              >
                <FolderPlus className="w-4 h-4 text-blue-600" />
                <div>
                  <div>고객사 심사 프로젝트 생성</div>
                  <div className="text-[10px] text-slate-400 font-normal">매니징 폴더 자동 프로비저닝</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenNewDoc && onOpenNewDoc('BLANK');
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <div>
                  <div>새 ISO 규격 문서 작성</div>
                  <div className="text-[10px] text-slate-400 font-normal">표준 서식 템플릿 등록</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 2. Navigation Items with Google Drive Pill Capsules */}
        <nav className="space-y-0.5 text-xs font-semibold text-slate-700">
          
          {/* 홈 (드라이브 홈) */}
          <button
            onClick={() => {
              onSelectNav('drive');
              onSelectFolder('ALL');
            }}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full transition-all text-sm ${
              activeNav === 'drive' && selectedFolder === 'ALL'
                ? 'bg-[#c2e7ff] text-[#001d35] font-bold shadow-xs'
                : 'hover:bg-[#edf2fc] text-slate-700 font-medium'
            }`}
          >
            <Home className="w-4 h-4 text-slate-600" />
            <span>홈</span>
          </button>

          {/* ISO 규격별 메타 드라이브 (사용자 핵심 요구: 메타기준화) */}
          <div className="pt-1">
            <div className="px-3 py-1.5 text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-blue-600" />
                <span>ISO 규격 메타 드라이브</span>
              </span>
              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                메타 기준
              </span>
            </div>

            <div className="space-y-1 mt-1">
              {ISO_STANDARDS_INFO.map(std => {
                const isCurrentStd = activeNav === 'drive' && selectedStandard === std.code;
                const isExpanded = expandedStandards[std.code] ?? (std.code === 'ISO_9001');
                const totalStdCount = getStandardCount(std.code, 'ALL');

                return (
                  <div key={std.code} className="space-y-0.5">
                    {/* Standard Header Row */}
                    <div
                      onClick={() => {
                        onSelectNav('drive');
                        onSelectStandard && onSelectStandard(std.code);
                        onSelectFolder && onSelectFolder('ALL');
                        setExpandedStandards(prev => ({ ...prev, [std.code]: true }));
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        isCurrentStd && selectedFolder === 'ALL'
                          ? 'bg-[#c2e7ff] text-[#001d35] font-black shadow-2xs'
                          : isCurrentStd
                          ? 'bg-blue-50/80 text-blue-900 font-bold'
                          : 'hover:bg-[#edf2fc] text-slate-700 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span 
                          onClick={(e) => toggleStandardExpand(std.code, e)}
                          className="p-0.5 hover:bg-slate-200/60 rounded cursor-pointer shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </span>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${std.iconColor}`} />
                        <span className="truncate">{std.name.split(':')[0]} ({std.title.split(' ')[0]})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold shrink-0 ml-1 font-mono">
                        {totalStdCount}
                      </span>
                    </div>

                    {/* Standard Required Subfolders */}
                    {isExpanded && (
                      <div className="ml-5 pl-2 space-y-0.5 border-l-2 border-slate-200">
                        {std.code === 'ISO_9001' ? (
                          <>
                            {/* 1. 기본체계 문서 */}
                            <button
                              onClick={() => {
                                onSelectNav('drive');
                                onSelectStandard && onSelectStandard('ISO_9001');
                                onSelectFolder && onSelectFolder('BASE');
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                isCurrentStd && (selectedFolder === 'BASE' || selectedFolder === 'LEVEL_1')
                                  ? 'bg-[#c2e7ff] text-[#001d35] font-black shadow-2xs'
                                  : 'hover:bg-[#edf2fc] text-slate-600 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <BookOpen className="w-3 h-3 text-blue-500" />
                                <span className="truncate">1. 기본체계 문서</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">{getStandardCount('ISO_9001', 'BASE')}</span>
                            </button>

                            {/* 2. 주요 절차서 */}
                            <button
                              onClick={() => {
                                onSelectNav('drive');
                                onSelectStandard && onSelectStandard('ISO_9001');
                                onSelectFolder && onSelectFolder('PROCEDURE');
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                isCurrentStd && (selectedFolder === 'PROCEDURE' || selectedFolder === 'LEVEL_2')
                                  ? 'bg-[#c2e7ff] text-[#001d35] font-black shadow-2xs'
                                  : 'hover:bg-[#edf2fc] text-slate-600 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <GitPullRequest className="w-3 h-3 text-emerald-500" />
                                <span className="truncate">2. 주요 절차서</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">{getStandardCount('ISO_9001', 'PROCEDURE')}</span>
                            </button>

                            {/* 3. 업무 기록 */}
                            <button
                              onClick={() => {
                                onSelectNav('drive');
                                onSelectStandard && onSelectStandard('ISO_9001');
                                onSelectFolder && onSelectFolder('RECORD');
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                isCurrentStd && (selectedFolder === 'RECORD' || selectedFolder === 'LEVEL_4' || selectedFolder === 'LEVEL_3')
                                  ? 'bg-[#c2e7ff] text-[#001d35] font-black shadow-2xs'
                                  : 'hover:bg-[#edf2fc] text-slate-600 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <ClipboardCheck className="w-3 h-3 text-purple-500" />
                                <span className="truncate">3. 업무 기록</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">{getStandardCount('ISO_9001', 'RECORD')}</span>
                            </button>

                            {/* 00. 인증서 원본 */}
                            <button
                              onClick={() => {
                                onSelectNav('drive');
                                onSelectStandard && onSelectStandard('ISO_9001');
                                onSelectFolder && onSelectFolder('CERT');
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                isCurrentStd && selectedFolder === 'CERT'
                                  ? 'bg-[#c2e7ff] text-[#001d35] font-black shadow-2xs'
                                  : 'hover:bg-[#edf2fc] text-slate-600 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Award className="w-3 h-3 text-rose-500" />
                                <span className="truncate">00. 인증서 원본</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">{getStandardCount('ISO_9001', 'CERT')}</span>
                            </button>
                          </>
                        ) : (
                          <>
                            {/* 01. 매뉴얼 */}
                            <button
                              onClick={() => {
                                onSelectNav('drive');
                                onSelectStandard && onSelectStandard(std.code);
                                onSelectFolder && onSelectFolder('LEVEL_1');
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                isCurrentStd && selectedFolder === 'LEVEL_1'
                                  ? 'bg-[#c2e7ff] text-[#001d35] font-black shadow-2xs'
                                  : 'hover:bg-[#edf2fc] text-slate-600 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <BookOpen className="w-3 h-3 text-blue-500" />
                                <span className="truncate">01. 매뉴얼</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">{getStandardCount(std.code, 'LEVEL_1')}</span>
                            </button>

                            {/* 02. 절차서 */}
                            <button
                              onClick={() => {
                                onSelectNav('drive');
                                onSelectStandard && onSelectStandard(std.code);
                                onSelectFolder && onSelectFolder('LEVEL_2');
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                isCurrentStd && selectedFolder === 'LEVEL_2'
                                  ? 'bg-[#c2e7ff] text-[#001d35] font-black shadow-2xs'
                                  : 'hover:bg-[#edf2fc] text-slate-600 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <GitPullRequest className="w-3 h-3 text-emerald-500" />
                                <span className="truncate">02. 절차서</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">{getStandardCount(std.code, 'LEVEL_2')}</span>
                            </button>

                            {/* 03. 지침서 */}
                            <button
                              onClick={() => {
                                onSelectNav('drive');
                                onSelectStandard && onSelectStandard(std.code);
                                onSelectFolder && onSelectFolder('LEVEL_3');
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                isCurrentStd && selectedFolder === 'LEVEL_3'
                                  ? 'bg-[#c2e7ff] text-[#001d35] font-black shadow-2xs'
                                  : 'hover:bg-[#edf2fc] text-slate-600 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-3 h-3 text-amber-500" />
                                <span className="truncate">03. 지침서</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">{getStandardCount(std.code, 'LEVEL_3')}</span>
                            </button>

                            {/* 04. 기록/양식 */}
                            <button
                              onClick={() => {
                                onSelectNav('drive');
                                onSelectStandard && onSelectStandard(std.code);
                                onSelectFolder && onSelectFolder('LEVEL_4');
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                isCurrentStd && selectedFolder === 'LEVEL_4'
                                  ? 'bg-[#c2e7ff] text-[#001d35] font-black shadow-2xs'
                                  : 'hover:bg-[#edf2fc] text-slate-600 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <ClipboardCheck className="w-3 h-3 text-purple-500" />
                                <span className="truncate">04. 기록/양식</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">{getStandardCount(std.code, 'LEVEL_4')}</span>
                            </button>

                            {/* 00. 인증서 원본 */}
                            <button
                              onClick={() => {
                                onSelectNav('drive');
                                onSelectStandard && onSelectStandard(std.code);
                                onSelectFolder && onSelectFolder('CERT');
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                isCurrentStd && selectedFolder === 'CERT'
                                  ? 'bg-[#c2e7ff] text-[#001d35] font-black shadow-2xs'
                                  : 'hover:bg-[#edf2fc] text-slate-600 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Award className="w-3 h-3 text-rose-500" />
                                <span className="truncate">00. 인증서 원본</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">{getStandardCount(std.code, 'CERT')}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 전체 규격 통합 보기 */}
              <button
                onClick={() => {
                  onSelectNav('drive');
                  onSelectStandard && onSelectStandard('ALL');
                  onSelectFolder && onSelectFolder('ALL');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  activeNav === 'drive' && selectedStandard === 'ALL'
                    ? 'bg-[#c2e7ff] text-[#001d35] font-black shadow-2xs'
                    : 'hover:bg-[#edf2fc] text-slate-600 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                  <span>전체 규격 종합 보기</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold font-mono">{documents?.length || 0}</span>
              </button>
            </div>
          </div>

          {/* 3. 고객사 심사 프로젝트 폴더 (사용자 핵심 요구 기능) */}
          <div className="pt-2">
            <div 
              onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
              className="flex items-center justify-between px-4 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer select-none uppercase tracking-wider"
            >
              <div className="flex items-center gap-1.5">
                {isProjectsExpanded ? (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                )}
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>고객사 심사 프로젝트</span>
              </div>
              
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenNewProjectModal && onOpenNewProjectModal();
                }}
                className="p-1 hover:bg-slate-200 rounded text-blue-600 font-bold cursor-pointer"
                title="신규 심사 프로젝트 생성"
              >
                <Plus className="w-3.5 h-3.5" />
              </span>
            </div>

            {isProjectsExpanded && (
              <div className="ml-4 pl-2 space-y-0.5 mt-1 border-l border-blue-100">
                {projects.map((proj) => {
                  const isSelected = activeNav === 'project' && activeProject?.id === proj.id;
                  return (
                    <button
                      key={proj.id}
                      onClick={() => onSelectProject && onSelectProject(proj)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full text-xs transition-colors text-left group ${
                        isSelected
                          ? 'bg-[#c2e7ff] text-[#001d35] font-bold shadow-xs'
                          : 'hover:bg-[#edf2fc] text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-blue-600' : 'bg-slate-400 group-hover:bg-blue-500'}`} />
                        <span className="truncate">{proj.clientName}</span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-bold shrink-0 font-mono">
                        D-{proj.dDay}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. ISO 규격별 법정 필수 바인더 & 레디니스 진단 */}
          <button
            onClick={() => onSelectNav('compliance')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full transition-all text-sm ${
              activeNav === 'compliance'
                ? 'bg-[#c2e7ff] text-[#001d35] font-bold shadow-xs'
                : 'hover:bg-[#edf2fc] text-slate-700 font-medium'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <ClipboardCheck className="w-4 h-4 text-purple-600" />
              <span>규격별 필수 바인더</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-purple-100 text-purple-800 border border-purple-200">
              진단
            </span>
          </button>

          {/* 5. 정부·지자체 지원사업 매니저 (53선) */}
          <button
            onClick={() => onSelectNav('gov_programs')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full transition-all text-sm ${
              activeNav === 'gov_programs'
                ? 'bg-[#c2e7ff] text-[#001d35] font-bold shadow-xs'
                : 'hover:bg-[#edf2fc] text-slate-700 font-medium'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>정부·지자체 지원사업</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
              53선
            </span>
          </button>

          {/* 6. 공유 문서함 (워크스페이스) */}
          <button
            onClick={() => onSelectNav('workspace')}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full transition-all text-sm ${
              activeNav === 'workspace'
                ? 'bg-[#c2e7ff] text-[#001d35] font-bold shadow-xs'
                : 'hover:bg-[#edf2fc] text-slate-700 font-medium'
            }`}
          >
            <Users className="w-4 h-4 text-slate-600" />
            <span>공유 문서함 (팀별)</span>
          </button>

          {/* 6. 만기 레이더 & 리스크 분석 (ISO 특화 엔진) */}
          <button
            onClick={() => onSelectNav('radar')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full transition-all text-sm ${
              activeNav === 'radar'
                ? 'bg-[#c2e7ff] text-[#001d35] font-bold shadow-xs'
                : 'hover:bg-[#edf2fc] text-slate-700 font-medium'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Compass className="w-4 h-4 text-rose-500" />
              <span>만기 레이더</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </button>

          {/* 7. 심사 대시보드 (ISO 특화 엔진) */}
          <button
            onClick={() => onSelectNav('dashboard')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full transition-all text-sm ${
              activeNav === 'dashboard'
                ? 'bg-[#c2e7ff] text-[#001d35] font-bold shadow-xs'
                : 'hover:bg-[#edf2fc] text-slate-700 font-medium'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span>심사 현황</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600">68.4%</span>
          </button>

          {/* 8. 중요 문서함 */}
          <button
            onClick={() => {
              onSelectNav('drive');
              onSelectFolder('STARRED');
            }}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full transition-all text-sm ${
              activeNav === 'drive' && selectedFolder === 'STARRED'
                ? 'bg-[#c2e7ff] text-[#001d35] font-bold shadow-xs'
                : 'hover:bg-[#edf2fc] text-slate-700 font-medium'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Star className="w-4 h-4 text-amber-500" />
              <span>중요 문서함</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">{getCount('STARRED')}</span>
          </button>

          {/* 9. 휴지통 */}
          <button
            onClick={() => setIsTrashModalOpen(true)}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full hover:bg-[#edf2fc] text-slate-700 font-medium transition-all text-sm"
          >
            <Trash2 className="w-4 h-4 text-slate-600" />
            <span>휴지통</span>
          </button>

        </nav>

        {/* Storage Stats & Buy Storage */}
        <div className="pt-6 px-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Cloud className="w-4 h-4 text-slate-500" />
            <span>저장용량</span>
          </div>
          <div className="text-[13px] text-slate-700 font-normal pl-6">
            2TB 중 245.6GB 사용
          </div>

          <div className="pt-1 pl-1">
            <button 
              onClick={() => setIsStorageModalOpen(true)}
              className="px-5 py-2 rounded-full border border-slate-300 hover:bg-slate-100 hover:border-slate-400 text-blue-600 font-semibold text-xs transition-all shadow-2xs w-full text-center"
            >
              추가 저장용량 구매
            </button>
          </div>
        </div>

      </div>

      {/* 휴지통 모달 */}
      {isTrashModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-slate-600" />
                <span>드라이브 휴지통</span>
              </h3>
              <button onClick={() => setIsTrashModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                🗑️
              </div>
              <p className="text-sm font-semibold text-slate-700">휴지통에 항목이 없습니다.</p>
              <p className="text-xs text-slate-400">삭제된 문서는 30일 동안 보관된 후 영구 삭제됩니다.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setIsTrashModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 스토리지 구매 모달 */}
      {isStorageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-600" />
                <span>Google Workspace Enterprise 스토리지</span>
              </h3>
              <button onClick={() => setIsStorageModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-blue-900">현재 플랜: Enterprise Cloud 2TB</div>
                  <div className="text-blue-700 mt-0.5">245.6 GB 사용 중 (여유 공간 1,754.4 GB)</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">이용중</span>
              </div>

              <div className="border border-slate-200 rounded-xl p-3.5 hover:border-blue-400 transition-colors cursor-pointer space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>5TB Enterprise Pro 플랜</span>
                  <span className="text-blue-600">₩28,000 / 월</span>
                </div>
                <p className="text-slate-500">ISO 인증 감사 영상, 녹취록, 183개 증빙 파일 무제한 3중 백업</p>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setIsStorageModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100">
                취소
              </button>
              <button 
                onClick={() => {
                  alert('Enterprise Pro 5TB 플랜 변경 신청이 완료되었습니다.');
                  setIsStorageModalOpen(false);
                }} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
              >
                플랜 업그레이드
              </button>
            </div>
          </div>
        </div>
      )}

    </aside>
  );
}
