'use client';
import { CalendarDays, Bell, ArrowRight, Info, RefreshCw } from 'lucide-react';
import { evaluateComplianceReadiness } from '../lib/complianceEngine';
import { ISO_STANDARDS_INFO } from '../lib/isoRequirementsData';

export default function DashboardView({ documents = [], onOpenDetail, onNavigateDrive, onNavigate, currentCompany }) {
  const reports = ISO_STANDARDS_INFO.map(s => evaluateComplianceReadiness(documents, s.code));
  const total = reports.reduce((n,r) => n+r.totalRequired,0);
  const ready = reports.reduce((n,r) => n+r.readyCount,0);
  const rate = total ? Math.round(ready/total*100) : 0;
  const deadlines = documents.filter(d => Number.isFinite(d.dDay)).sort((a,b)=>a.dDay-b.dDay);
  const alerts = deadlines.filter(d=>d.dDay<=30).slice(0,4);
  const pending = documents.filter(d=>d.dDay === undefined || d.dDay === null);
  return <div className="platform-dashboard">
    <div className="platform-page-heading"><div><h1>대시보드</h1><p>기업의 인증 및 컴플라이언스 현황을 한눈에 확인하세요.</p></div><span className="platform-update">등록 문서 기준 <RefreshCw className="w-4 h-4" aria-hidden="true"/></span></div>
    <div className="platform-top-grid">
      <section className="platform-card"><h2>전체 준비율 <Info className="w-4 h-4 text-slate-400"/></h2><div className="platform-readiness-body"><div className="platform-donut" style={{background:`conic-gradient(#1560ff ${rate}%, #e8edf5 0)`}}><div><strong>{documents.length ? rate : '—'}<small>{documents.length ? '%' : ''}</small></strong><span>전체 준비율</span></div></div><div className="space-y-4 text-xs text-slate-600"><p><i className="platform-dot bg-blue-600"/>보유 요건 <b>{ready}</b></p><p><i className="platform-dot bg-slate-300"/>미보유 요건 <b>{total-ready}</b></p><p className="text-[11px] max-w-36 leading-relaxed">문서 보유 여부 기준이며 심사 적합 판정을 의미하지 않습니다.</p></div></div><button className="platform-card-link" onClick={()=>onNavigateDrive('ALL')}>문서 관리로 이동 <ArrowRight className="w-4 h-4" /></button></section>
      <section className="platform-card"><div className="platform-card-title"><h2><CalendarDays className="w-5 h-5"/>주요 일정</h2><button onClick={()=>onNavigate('schedule')}>전체 일정 보기</button></div><div className="divide-y divide-slate-100">{deadlines.slice(0,4).map(d=><button className="platform-list-row" key={d.id} onClick={()=>onOpenDetail(d)}><span className={`platform-badge ${d.dDay<=30?'is-warning':''}`}>{d.dDay<0?`D+${Math.abs(d.dDay)}`:`D-${d.dDay}`}</span><span className="min-w-0"><strong className="block truncate">{d.title || d.name}</strong><small>문서 유효기간 확인</small></span></button>)}{!deadlines.length&&<Empty>유효기간이 등록된 문서가 없습니다.</Empty>}</div></section>
      <section className="platform-card"><div className="platform-card-title"><h2><Bell className="w-5 h-5"/>최근 알림</h2><button onClick={()=>onNavigate('notifications')}>전체 알림 보기</button></div><div className="divide-y divide-slate-100">{alerts.map(d=><button key={d.id} className="platform-list-row" onClick={()=>onOpenDetail(d)}><span className="text-amber-600">◎</span><span><strong className="block">{d.title || d.name}</strong><small>{d.dDay<0?'유효기간이 지났습니다.':'만료가 가까워지고 있습니다.'} 원본을 확인해 주세요.</small></span></button>)}{!alerts.length&&<Empty>현재 만기 임박 항목이 없습니다.</Empty>}</div><p className="text-[11px] text-slate-400 mt-4">등록 문서 기준 · 외부 알림 발송 미연동</p></section>
    </div>
    <div className="platform-bottom-grid"><section className="platform-card"><div className="platform-card-title"><h2>인증별 현황</h2><button onClick={()=>onNavigate('compliance')}>전체 인증 관리</button></div><div className="overflow-x-auto"><table className="platform-table"><thead><tr><th>인증 표준</th><th>문서 준비율</th><th>보유 요건</th><th>미보유 요건</th><th>점검</th></tr></thead><tbody>{reports.map(r=><tr key={r.standardCode}><td><strong>{r.standardInfo.name}</strong></td><td>{r.readinessScore}%<div className="platform-progress"><span style={{width:`${r.readinessScore}%`}}/></div></td><td>{r.readyCount} / {r.totalRequired}</td><td>{r.missingCount}</td><td><button className="text-blue-600" onClick={()=>onNavigate('compliance',r.standardCode)}>진단 보기 →</button></td></tr>)}</tbody></table></div></section>
    <section className="platform-card"><h2>컴플라이언스 요약</h2><div className="grid grid-cols-2 gap-4 mt-6">{[['전체 문서 수',documents.length],['인증 표준',reports.length],['만기 임박·경과',deadlines.filter(d=>d.dDay<=30).length],['유효기간 미등록',pending.length]].map(([label,value])=><div className="platform-metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><button className="platform-card-link mt-6" onClick={()=>onNavigate('compliance')}>인증 준비 상태 점검 <ArrowRight className="w-4 h-4"/></button></section></div>
  </div>;
}
function Empty({children}) {return <div className="py-12 text-center text-xs text-slate-500">{children}</div>;}
