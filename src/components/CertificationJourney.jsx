'use client';

import { LayoutDashboard, ClipboardCheck, Files, CalendarClock } from 'lucide-react';

const steps = [
  { nav: 'dashboard', label: '전체 현황', description: '준비 상태 확인', icon: LayoutDashboard },
  { nav: 'compliance', label: '인증 진단', description: '조항별 준비 점검', icon: ClipboardCheck },
  { nav: 'drive', label: '문서 준비', description: '작성·검토·증적', icon: Files },
  { nav: 'radar', label: '사후 관리', description: '만기·갱신 점검', icon: CalendarClock },
];

export default function CertificationJourney({ activeNav, onSelectNav, companyName }) {
  return (
    <section className="iso-journey" aria-label="인증 준비 작업 흐름">
      <div className="iso-journey-context">
        <span className="iso-eyebrow">인증 관리</span>
        <span className="truncate font-semibold text-slate-800">{companyName || '회사를 선택해 주세요'}</span>
      </div>
      <nav className="iso-journey-steps" aria-label="인증 관리 단계">
        {steps.map(({ nav, label, description, icon: Icon }) => (
          <button key={nav} type="button" onClick={() => onSelectNav(nav)}
            className={`iso-journey-step ${activeNav === nav ? 'is-active' : ''}`}
            aria-current={activeNav === nav ? 'page' : undefined}>
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span><span className="block font-semibold">{label}</span><span className="iso-step-description">{description}</span></span>
          </button>
        ))}
      </nav>
    </section>
  );
}
