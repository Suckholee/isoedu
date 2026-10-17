'use client';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import Button from './ui/Button';
import { isCloudMode } from '../lib/dataConfig';
import { ISO_STANDARDS_INFO } from '../lib/isoRequirementsData';
import { evaluateComplianceReadiness } from '../lib/complianceEngine';

const titles = { schedule: '심사 일정', notifications: '알림 센터', reports: '보고서', settings: '설정' };
export default function PlatformUtilityView({ view, documents = [], currentCompany, onOpenDetail, onNavigate }) {
  const { profile, user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const deadlines = documents.filter(d => Number.isFinite(d.dDay)).sort((a,b)=>a.dDay-b.dDay);
  const alerts = deadlines.filter(d=>d.dDay<=30 && (filter !== 'OVERDUE' || d.dDay<0));
  return <div className="platform-dashboard" style={{minWidth:0}}>
    <div className="platform-page-heading"><div><h1>{titles[view]}</h1><p>{currentCompany?.name || '회사를 선택해 주세요.'}</p></div></div>
    {view === 'schedule' && <section className="platform-card"><h2>공식 심사 일정</h2><p className="my-5 text-sm text-slate-500">인증기관의 심사 예약·확정 연동은 아직 제공하지 않습니다. 문서 만기일은 심사 확정일과 다릅니다.</p><Button variant="secondary" onClick={()=>onNavigate('radar')}>문서 유효기간 확인</Button></section>}
    {view === 'notifications' && <section className="platform-card"><h2>문서 만기 알림</h2><p className="text-xs text-slate-500 my-4">현재 등록 문서에서 계산한 안내입니다. 이메일·알림톡 발송과 읽음 저장은 미연동입니다.</p><div className="flex gap-2 mb-5">{[['ALL','30일 이내 전체'],['OVERDUE','만기 경과']].map(([id,label])=><Button key={id} variant={filter===id?'primary':'secondary'} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</Button>)}</div>{alerts.length ? alerts.map(d=><button key={d.id} className="platform-list-row" onClick={()=>onOpenDetail(d)}><strong>{d.title || d.name}</strong><span>{d.dDay<0?`만기 ${Math.abs(d.dDay)}일 경과`:`만기 ${d.dDay}일 전`}</span></button>) : <p className="py-8 text-sm text-slate-500">해당하는 알림이 없습니다.</p>}</section>}
    {view === 'reports' && <section className="platform-card"><h2>인증별 문서 준비 현황</h2><p className="text-xs text-slate-500 my-4">등록된 문서와 기준 목록의 대조 결과이며 공식 심사 결과 보고서가 아닙니다.</p><div className="overflow-auto"><table className="platform-table"><thead><tr><th>인증 표준</th><th>보유 / 전체 요건</th><th>문서 보유율</th><th>상세</th></tr></thead><tbody>{ISO_STANDARDS_INFO.map(s=>{const r=evaluateComplianceReadiness(documents,s.code);return <tr key={s.code}><td>{s.name}</td><td>{r.readyCount} / {r.totalRequired}</td><td>{r.totalRequired?`${r.readinessScore}%`:'기준 미등록'}</td><td><button className="text-blue-600" onClick={()=>onNavigate('compliance',s.code)}>진단 보기</button></td></tr>;})}</tbody></table></div></section>}
    {view === 'settings' && <section className="platform-card"><h2>계정 및 데이터 연결</h2><dl className="text-sm grid grid-cols-[120px_1fr] gap-5 my-6"><dt>로그인</dt><dd>{user ? (profile?.fullName || '로그인됨') : '로그인 필요'}</dd><dt>선택한 회사</dt><dd>{currentCompany?.name || '선택 안 됨'}</dd><dt>저장 위치</dt><dd>{isCloudMode?'Supabase':'이 브라우저'}</dd></dl><Button onClick={()=>setAuthOpen(true)}>{user?'계정 전환':'로그인 / 회원가입'}</Button><p className="mt-5 text-xs text-slate-500">권한 변경·알림 발송 설정은 아직 제공하지 않습니다.</p></section>}
    <AuthModal isOpen={authOpen} onClose={()=>setAuthOpen(false)}/>
  </div>;
}
