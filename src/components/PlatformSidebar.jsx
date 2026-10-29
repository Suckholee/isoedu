'use client';
import CompanySwitcher from './CompanySwitcher';
import { ShieldCheck, LayoutDashboard, ClipboardCheck, Files, CalendarDays, Settings, ChevronLeft, PanelLeftOpen, Landmark, UserCog } from 'lucide-react';

const items = [
  ['dashboard', '내 업무', LayoutDashboard, ['dashboard']],
  ['compliance', '인증 관리', ClipboardCheck, ['compliance', 'project']],
  ['drive', '거래처 드라이브', Files, ['drive']],
  ['schedule', '사후·일정 관리', CalendarDays, ['schedule', 'radar', 'notifications', 'reports']],
  ['gov_programs', '정부지원사업', Landmark, ['gov_programs']],
  ['admin', '관리자 센터', UserCog, ['admin']],
  ['settings', '설정', Settings, ['settings', 'agent_schedules', 'workspace']],
];

export default function PlatformSidebar({ enterprise=false, isOpen, onToggle, activeNav, onSelectNav, currentCompany, companies = [], onSelectCompany, onCreateClient, projects = [], onSelectProject, onOpenNewProjectModal }) {
  const navigationItems=enterprise?items.filter(([id])=>['dashboard','compliance','drive','settings'].includes(id)).map(item=>[item[0],{dashboard:'우리 회사 준비',compliance:'진행 현황',drive:'회사 문서함',settings:'회사·계정'}[item[0]],...item.slice(2)]):items;
  const isItemActive = (id, group = [id]) => activeNav === id || group.includes(activeNav);

  if (!isOpen) return <aside id="platform-navigation" className="platform-sidebar-collapsed" aria-label="접힌 탐색 메뉴">
    <button type="button" className="platform-sidebar-toggle" onClick={onToggle} aria-label="사이드바 펼치기" aria-expanded={false} aria-controls="platform-navigation" title="사이드바 펼치기 ([ 또는 Ctrl/Cmd+B)"><PanelLeftOpen className="w-5 h-5" aria-hidden="true" /></button>
    <button type="button" className="platform-icon-button" onClick={() => onSelectNav('dashboard')} aria-label="어니스톤 홈으로 이동" title="어니스톤 홈"><ShieldCheck className="w-5 h-5 text-blue-400" aria-hidden="true" /></button>
    <nav className="platform-icon-nav" aria-label="주 메뉴">
      {navigationItems.map(([id, label, Icon, group]) => <button type="button" key={id}
        aria-label={label} aria-current={isItemActive(id, group) ? 'page' : undefined}
        className={`platform-icon-button ${isItemActive(id, group) ? 'is-active' : ''}`}
        onClick={() => onSelectNav(id)}>
        <Icon className="w-5 h-5" aria-hidden="true" />
        <span className="platform-icon-tooltip" role="tooltip">{label}</span>
      </button>)}
    </nav>
  </aside>;
  return <aside id="platform-navigation" className="platform-sidebar">
    <div className="flex items-center justify-between px-2 mb-7"><button type="button" onClick={() => onSelectNav('dashboard')} aria-label="어니스톤 홈으로 이동" className="flex items-center gap-2 rounded text-lg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"><ShieldCheck className="text-blue-400" aria-hidden="true" /> 어니스톤</button><button type="button" className="platform-sidebar-toggle" onClick={onToggle} aria-label="사이드바 접기" aria-expanded={true} aria-controls="platform-navigation" title="사이드바 접기 ([ 또는 Ctrl/Cmd+B)"><ChevronLeft className="w-4 h-4" /></button></div>
    <CompanySwitcher enterprise={enterprise} sidebar companies={companies} currentCompany={currentCompany} onSelectCompany={onSelectCompany} onCreateClient={onCreateClient}/>
    <nav aria-label="주 메뉴" className="space-y-1.5 mt-7">
      {navigationItems.map(([id, label, Icon, group]) => {
        const active = isItemActive(id, group);
        return (
          <button
            key={id}
            aria-current={active ? 'page' : undefined}
            onClick={() => onSelectNav(id)}
            className={`platform-nav ${active ? 'is-active' : ''}`}
          >
            <Icon className="w-5 h-5" />
            <span className="flex-1 text-left">{label}</span>
            {id === 'schedule' && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                일정·리스크·알림
              </span>
            )}
            {id === 'admin' && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-950/90 text-blue-300">
                회원·권한·발송
              </span>
            )}
          </button>
        );
      })}
    </nav>
  </aside>;
}
