'use client';
import ModalLayer from './ui/ModalLayer';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  HelpCircle,
  Settings,
  Sparkles,
  Grid,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Building2,
  FolderOpen,
  Plus,
  X,
  ShieldCheck,
  Bell,
  RefreshCw,
  ExternalLink,
  User,
  LogOut,
  Mail,
  Phone,
  BookOpen,
  Award,
  Layers,
  Menu,
  Database,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import CompanySwitcher from './CompanySwitcher';
import { isCloudMode } from '../lib/dataConfig';

export default function Header({
  enterprise=false,
  companies = [],
  isSidebarOpen = true,
  onToggleSidebar,
  currentCompany,
  onSelectCompany,
  onCreateClient,
  onOpenSearch,
  onOpenAddModal,
  onToggleAiPanel,
  isAiPanelOpen,
  onResetData,
  onSelectNav
}) {
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isAppsDropdownOpen, setIsAppsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { profile, logout, switchDemoRole, isDemoMode } = useAuth();

  // Settings State
  const [alertThreshold, setAlertThreshold] = useState('30');

  const dropdownRef = useRef(null);
  const appsRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCompanyDropdownOpen(false);
      }
      if (appsRef.current && !appsRef.current.contains(event.target)) {
        setIsAppsDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="iso-header h-16 px-4 sm:px-6 flex items-center justify-between text-slate-800 select-none relative z-40 gap-2">

      {/* 1. Left: Google Drive Signature Brand Identity */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Google Drive Standard Hamburger Menu Button to Toggle Sidebar */}
        <button
          onClick={onToggleSidebar}
          className={`p-2.5 rounded-full hover:bg-slate-200/70 text-slate-600 transition-colors cursor-pointer shrink-0 ${
            !isSidebarOpen ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : ''
          }`}
          title={isSidebarOpen ? "사이드바 접기 (단축키: [ )" : "사이드바 펼치기 (단축키: [ )"}
          aria-label={isSidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
        >
          <Menu className="w-5 h-5" />
        </button>

        <button type="button" className="iso-brand" onClick={() => onSelectNav?.('dashboard')} aria-label="어니스톤 전체 현황">
          <span className="iso-brand-mark"><ShieldCheck className="w-6 h-6" aria-hidden="true" /></span>
          <span className="text-left"><span className="block text-lg font-bold tracking-tight">어니스톤</span><span className="block text-[11px] text-slate-500">인증 준비와 사후 관리</span></span>
        </button>
      </div>

      {/* 2. Center: Google Drive Signature Huge Pill-shaped Search Bar */}
      <div className="flex-1 min-w-0 max-w-2xl mx-2 hidden sm:block">
        <div
          onClick={onOpenSearch}
          className="w-full h-10 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer border border-transparent focus-within:border-slate-300 focus-within:bg-white focus-within:shadow-md"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-slate-600 text-[15px] font-normal select-none">
              문서 및 ISO 규격 조항 검색
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSearch();
              }}
              title="고급 검색 필터 열기"
              className="p-2 rounded-full hover:bg-slate-200/60 text-slate-600 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-bold bg-white text-slate-500 rounded-md border border-slate-200 shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* 3. Right: Enterprise Tenant Chip + Google Workspace Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

        {/* Tenant Switcher (Pill Chip) */}
        <CompanySwitcher enterprise={enterprise} companies={companies} currentCompany={currentCompany} onSelectCompany={onSelectCompany} onCreateClient={onCreateClient}/>

        {/* Gemini / AI Assistant Sparkle Button */}
        <button
          onClick={onToggleAiPanel}
          title="Gemini AI 규격 어시스턴트"
          className={`p-2.5 rounded-full transition-all ${
            isAiPanelOpen
              ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-400'
              : 'hover:bg-slate-200/70 text-slate-600'
          }`}
        >
          <Sparkles className="w-5 h-5 text-purple-600" />
        </button>

        {/* Help Icon -> Opens Help Modal */}
        <button
          onClick={() => setIsHelpModalOpen(true)}
          title="지원 및 고객센터"
          className="p-2.5 rounded-full hover:bg-slate-200/70 text-slate-600 transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Settings Icon -> Opens Settings Modal */}
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          title="환경설정 및 알림 기준"
          className="p-2.5 rounded-full hover:bg-slate-200/70 text-slate-600 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Google 9-Dots Apps Icon -> Opens Apps Dropdown */}
        <div className="relative" ref={appsRef}>
          <button
            onClick={() => setIsAppsDropdownOpen(!isAppsDropdownOpen)}
            title="어니스톤 도구"
            className="p-2.5 rounded-full hover:bg-slate-200/70 text-slate-600 transition-colors"
          >
            <Grid className="w-5 h-5" />
          </button>

          {isAppsDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-scale-up">
              <div className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
                어니스톤 서비스
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div
                  onClick={() => {
                    setIsAppsDropdownOpen(false);
                    onSelectNav && onSelectNav('drive');
                  }}
                  className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors flex flex-col items-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg mb-1">
                    📁
                  </div>
                  <span className="text-xs font-semibold text-slate-800">AI 드라이브</span>
                </div>

                <div
                  onClick={() => {
                    setIsAppsDropdownOpen(false);
                    onSelectNav && onSelectNav('radar');
                  }}
                  className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors flex flex-col items-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg mb-1">
                    🧭
                  </div>
                  <span className="text-xs font-semibold text-slate-800">만기 레이더</span>
                </div>

                <div
                  onClick={() => {
                    setIsAppsDropdownOpen(false);
                    onSelectNav && onSelectNav('dashboard');
                  }}
                  className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors flex flex-col items-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg mb-1">
                    📊
                  </div>
                  <span className="text-xs font-semibold text-slate-800">심사 대시보드</span>
                </div>

                <div
                  onClick={() => {
                    setIsAppsDropdownOpen(false);
                    onToggleAiPanel();
                  }}
                  className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors flex flex-col items-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg mb-1">
                    🤖
                  </div>
                  <span className="text-xs font-semibold text-slate-800">AI 어시스턴트</span>
                </div>

                <div
                  onClick={() => {
                    setIsAppsDropdownOpen(false);
                    alert('KOITA 한국산업기술진흥협회 연구개발지원시스템 연동 포털로 이동합니다.');
                  }}
                  className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors flex flex-col items-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg mb-1">
                    🔬
                  </div>
                  <span className="text-xs font-semibold text-slate-800">연구소 포털</span>
                </div>

                <div
                  onClick={() => {
                    setIsAppsDropdownOpen(false);
                    alert('KAB 한국인정지원센터 공식 인증서 조회 시스템으로 이동합니다.');
                  }}
                  className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors flex flex-col items-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg mb-1">
                    🏆
                  </div>
                  <span className="text-xs font-semibold text-slate-800">KAB 인증조회</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Storage Sync Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isCloudMode ? 'Supabase 저장 모드' : '이 브라우저에 저장'}</span>
        </div>

        {/* User Avatar -> Opens User Profile Menu */}
        <div className="ml-1 relative" ref={userRef}>
          <button type="button" aria-label="계정 메뉴" aria-expanded={isUserMenuOpen}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer"
            title={`사용자 프로필: ${profile?.fullName || '회원'} (${profile?.title || '사용자'})`}
          >
            {profile?.fullName?.substring(0, 2) || '회원'}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-scale-up space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {profile?.fullName?.substring(0, 2) || '회원'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-slate-900 truncate">{profile?.fullName}</div>
                  <div className="text-xs text-slate-500 truncate">{profile?.title}</div>
                  <div className="text-[11px] text-blue-600 font-medium truncate">{currentCompany?.name || profile?.company?.name}</div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-slate-700">
                  <span>보안 권한</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {profile?.securityLevel || '로그인 필요'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-slate-700">
                  <span>MFA 2단계 인증</span>
                  <span className="font-bold text-emerald-600">{profile?.mfaEnabled ? '활성화됨' : '미설정'}</span>
                </div>
              </div>

              {/* Role Switcher */}
              {isDemoMode && <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  시연 역할 즉시 전환
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => switchDemoRole('ADMIN')}
                    className={`py-1 px-1.5 rounded-md text-[10px] font-bold transition-all ${
                      profile?.role === 'ADMIN'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    👑 최고관리
                  </button>
                  <button
                    type="button"
                    onClick={() => switchDemoRole('AUDITOR')}
                    className={`py-1 px-1.5 rounded-md text-[10px] font-bold transition-all ${
                      profile?.role === 'AUDITOR'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    🔍 KAB심사
                  </button>
                  <button
                    type="button"
                    onClick={() => switchDemoRole('MEMBER')}
                    className={`py-1 px-1.5 rounded-md text-[10px] font-bold transition-all ${
                      profile?.role === 'MEMBER'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    🏢 기업실무
                  </button>
                </div>
              </div>}

              <div className="pt-2 border-t border-slate-100 space-y-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>회원 로그인 / 계정 전환</span>
                </button>

                {!isCloudMode && (
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onResetData && onResetData();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>데모 표준 데이터 초기화</span>
                </button>
                )}

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 4. Help & Support Modal */}
      {isHelpModalOpen && (
        <ModalLayer onClose={() => setIsHelpModalOpen(false)} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>어니스톤 고객지원 및 심사 핫라인</span>
              </h3>
              <button onClick={() => setIsHelpModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                <span className="font-bold text-blue-900 block">📞 사후심사 긴급 핫라인 (전담 선임심사원 배정)</span>
                <p className="text-blue-800">평일 09:00 ~ 18:00 (점심시간 12:00~13:00 제외) | 직통: 02-555-8942</p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900">자주 묻는 질문 (FAQ)</div>
                <div className="p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800">Q. D-Day 만기 알림 기준은 어떻게 산정되나요?</div>
                  <div className="text-slate-500">A. ISO 9001/14001 인증 만료일 기준 90일 전 Warning, 30일 전 Critical 상태로 자동 전환됩니다.</div>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800">Q. 연구원 변경 시 KOITA 신고 기한은?</div>
                  <div className="text-slate-500">A. 변경일로부터 14일 이내 필수이며, 미신고 시 연구소 인정 취소 및 세액공제 추징 리스크가 발생합니다.</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </ModalLayer>
      )}

      {/* 5. Settings Modal */}
      {isSettingsModalOpen && (
        <ModalLayer onClose={() => setIsSettingsModalOpen(false)} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-700" />
                <span>환경설정 및 알림 정책</span>
              </h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">만기 긴급 알림 임계일수</label>
                <select
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                >
                  <option value="15">만기 15일 전 (초긴급 집중 관리)</option>
                  <option value="30">만기 30일 전 (권장 표준값)</option>
                  <option value="60">만기 60일 전 (공공조달 및 사전심의 대비)</option>
                  <option value="90">만기 90일 전 (종합 갱신 로드맵)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">문서 저장 위치</label>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="font-bold text-slate-800">{isCloudMode ? 'Supabase' : '이 브라우저'}</div>
                  <div className="text-[11px] text-slate-500">편집기의 저장 버튼으로 변경 내용을 저장합니다.</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  alert('설정이 성공적으로 저장되었습니다.');
                }}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-colors"
              >
                설정 저장
              </button>
            </div>
          </div>
        </ModalLayer>
      )}

      {/* 5. Auth & Membership Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

    </header>
  );
}
