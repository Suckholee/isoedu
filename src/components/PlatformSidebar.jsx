'use client';
import CompanySwitcher from './CompanySwitcher';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LayoutDashboard, ClipboardCheck, Files, CalendarDays, Bell, Settings, FolderKanban, ChevronLeft, PanelLeftOpen, ShieldAlert, FileChartColumn, ChevronDown, UserRound, Landmark } from 'lucide-react';
const items = [
  ['dashboard', '내 업무', LayoutDashboard], ['compliance', '인증 관리', ClipboardCheck],
  ['drive', '거래처 드라이브', Files], ['schedule', '심사 일정', CalendarDays],
  ['radar', '리스크 관리', ShieldAlert], ['notifications', '알림 센터', Bell],
  ['gov_programs', '정부지원사업', Landmark], ['reports', '보고서', FileChartColumn], ['settings', '설정', Settings],
];
export default function PlatformSidebar({ isOpen, onToggle, activeNav, onSelectNav, currentCompany, companies = [], onSelectCompany, onCreateClient, projects = [], onSelectProject, onOpenNewProjectModal }) {
  const { profile } = useAuth();
  if (!isOpen) return <aside id="platform-navigation" className="platform-sidebar-collapsed" aria-label="접힌 탐색 메뉴">
    <button type="button" className="platform-sidebar-toggle" onClick={onToggle} aria-label="사이드바 펼치기" aria-expanded={false} aria-controls="platform-navigation" title="사이드바 펼치기 ([ 또는 Ctrl/Cmd+B)"><PanelLeftOpen className="w-5 h-5" aria-hidden="true" /></button>
    <button type="button" className="platform-icon-button" onClick={() => onSelectNav('dashboard')} aria-label="어니스톤 홈으로 이동" title="어니스톤 홈"><ShieldCheck className="w-5 h-5 text-blue-400" aria-hidden="true" /></button>
    <nav className="platform-icon-nav" aria-label="주 메뉴">
      {items.map(([id, label, Icon]) => <button type="button" key={id}
        aria-label={label} aria-current={activeNav === id ? 'page' : undefined}
        className={`platform-icon-button ${activeNav === id ? 'is-active' : ''}`}
        onClick={() => onSelectNav(id)}>
        <Icon className="w-5 h-5" aria-hidden="true" />
        <span className="platform-icon-tooltip" role="tooltip">{label}</span>
      </button>)}
    </nav>
  </aside>;
  return <aside id="platform-navigation" className="platform-sidebar">
    <div className="flex items-center justify-between px-2 mb-7"><button type="button" onClick={() => onSelectNav('dashboard')} aria-label="어니스톤 홈으로 이동" className="flex items-center gap-2 rounded text-lg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"><ShieldCheck className="text-blue-400" aria-hidden="true" /> 어니스톤</button><button type="button" className="platform-sidebar-toggle" onClick={onToggle} aria-label="사이드바 접기" aria-expanded={true} aria-controls="platform-navigation" title="사이드바 접기 ([ 또는 Ctrl/Cmd+B)"><ChevronLeft className="w-4 h-4" /></button></div>
    <CompanySwitcher sidebar companies={companies} currentCompany={currentCompany} onSelectCompany={onSelectCompany} onCreateClient={onCreateClient}/>
    <nav aria-label="주 메뉴" className="space-y-2 mt-7">{items.map(([id, label, Icon]) => <button key={id} aria-current={activeNav === id ? 'page' : undefined} onClick={() => onSelectNav(id)} className={`platform-nav ${activeNav === id ? 'is-active' : ''}`}><Icon className="w-5 h-5" />{label}</button>)}</nav>
    <div className="platform-sidebar-profile"><UserRound className="w-8 h-8"/><div><strong>{profile?.full_name || profile?.name || '로그인 필요'}</strong><small className="block mt-1 text-slate-300">기업 담당자</small></div></div>
  </aside>;
}
