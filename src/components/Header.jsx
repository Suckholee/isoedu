'use client';

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
  Layers
} from 'lucide-react';
import { INITIAL_COMPANIES } from '../lib/mockData';

export default function Header({
  currentCompany,
  onSelectCompany,
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

  // Settings State
  const [alertThreshold, setAlertThreshold] = useState('30');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

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
    <header className="h-16 px-4 sm:px-6 flex items-center justify-between bg-[#f8fafd] text-slate-800 select-none relative z-40">
      
      {/* 1. Left: Google Drive Signature Brand Identity */}
      <div className="flex items-center gap-3 w-60 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Google Drive Multi-Color Triangle Logo */}
          <div className="w-10 h-10 flex items-center justify-center">
            <svg viewBox="0 0 87.3 78" className="w-8 h-8">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44C.4 49.9 0 51.45 0 53h27.5z" fill="#00ac47"/>
              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.1z" fill="#ea4335"/>
              <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2z" fill="#00832d"/>
              <path d="M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5L72.35 25l-13.75 23.8z" fill="#ffba00"/>
              <path d="m73.55 76.8-13.75-23.8H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#2684fc"/>
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[22px] font-normal tracking-tight text-slate-700 font-sans">
              드라이브
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 tracking-wider">
              ISO
            </span>
          </div>
        </div>
      </div>

      {/* 2. Center: Google Drive Signature Huge Pill-shaped Search Bar */}
      <div className="flex-1 max-w-2xl mx-4">
        <div 
          onClick={onOpenSearch}
          className="w-full h-12 px-4 rounded-full bg-[#edf2fc] hover:bg-[#e1e9f8] hover:shadow-xs transition-all flex items-center justify-between cursor-pointer border border-transparent focus-within:border-slate-300 focus-within:bg-white focus-within:shadow-md"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-slate-600 text-[15px] font-normal select-none">
              Drive에서 답변 받기 (문서 및 ISO 규격 조항 검색)
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
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-2xs transition-all"
          >
            <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black">
              {currentCompany?.name?.charAt(0) || '아'}
            </div>
            <span className="truncate max-w-[130px] hidden md:inline">
              {currentCompany?.name || '(주)아이소에듀'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Tenant Dropdown */}
          {isCompanyDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-up">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                관리 테넌트 전환
              </div>
              <div className="space-y-0.5">
                {INITIAL_COMPANIES.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => {
                      onSelectCompany(comp);
                      setIsCompanyDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                      currentCompany?.id === comp.id
                        ? 'bg-blue-50 text-blue-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-left truncate">
                      <div>{comp.name}</div>
                      <div className="text-[10px] text-slate-400">{comp.industry}</div>
                    </div>
                    {currentCompany?.id === comp.id && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
            title="Google Workspace & ISO 앱스"
            className="p-2.5 rounded-full hover:bg-slate-200/70 text-slate-600 transition-colors"
          >
            <Grid className="w-5 h-5" />
          </button>

          {isAppsDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-scale-up">
              <div className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
                ISO EDU Enterprise Suite
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

        {/* User Avatar -> Opens User Profile Menu */}
        <div className="ml-1 relative" ref={userRef}>
          <div 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-9 h-9 rounded-full bg-[#e8710a] text-white flex items-center justify-center font-bold text-sm shadow-xs hover:ring-2 hover:ring-slate-300 transition-all cursor-pointer"
            title="사용자 프로필: 홍준호 (품질경영본부)"
          >
            준호
          </div>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-scale-up space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-[#e8710a] text-white flex items-center justify-center font-bold text-base shadow-xs">
                  준호
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">홍준호 선임연구원</div>
                  <div className="text-xs text-slate-400">품질경영본부 / 최고심사관</div>
                  <div className="text-[11px] text-blue-600 font-medium">{currentCompany?.name}</div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-slate-700">
                  <span>보안 등급</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 최고관리자 (Level 5)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-slate-700">
                  <span>MFA 2단계 인증</span>
                  <span className="font-bold text-emerald-600">활성화됨</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1">
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

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    alert('로그아웃 시뮬레이션: 세션이 안전하게 유지됩니다.');
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>ISO EDU 고객지원 및 심사 핫라인</span>
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
        </div>
      )}

      {/* 5. Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
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
                <label className="font-bold text-slate-800 block">클라우드 실시간 동기화 (Supabase Realtime)</label>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-800">초저지연 24ms 무중단 자동 저장</div>
                    <div className="text-[11px] text-slate-400">문서 편집 시 실시간으로 클라우드에 암호화 보관</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
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
        </div>
      )}

    </header>
  );
}
