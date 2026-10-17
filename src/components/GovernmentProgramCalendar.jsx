'use client';
import { useMemo, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, CalendarDays, List, Search, X } from 'lucide-react';
import { ALL_GOV_PROGRAMS } from '../lib/governmentProgramsData';
import { dateKey, monthCells, programPeriod, programsOnDate } from '../lib/programCalendar.mjs';
import GovernmentProgramsView from './GovernmentProgramsView';
import Button from './ui/Button';
import GovernmentNoticeAnalysis from './GovernmentNoticeAnalysis';

export default function GovernmentProgramCalendar(props) {
  const [month,setMonth] = useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1,12));
  const pathname=usePathname();
  const router=useRouter();
  const searchParams=useSearchParams();
  const view=pathname.endsWith('/list')?'list':'calendar';
  function setView(next) {
    const params=new URLSearchParams(searchParams.toString());
    if(selected)params.set('program',selected.id);
    router.push(`/government-programs/${next}${params.size?'?'+params:''}`,{scroll:false});
  }
  const [collected,setCollected] = useState([]);
  const [loading,setLoading] = useState(true);
  const [feedError,setFeedError] = useState('');
  const [coverage,setCoverage] = useState('');
  const [lastChecked,setLastChecked] = useState(null);
  const [sourceMode,setSourceMode] = useState('collected');
  const [reload,setReload] = useState(0);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setFeedError('');
    fetch('/api/government-programs',{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error('공고를 불러오지 못했습니다. 다시 시도해 주세요.');return r.json();}).then(data=>{if(!Array.isArray(data.programs))throw new Error('공고 형식 오류');setCollected(data.programs);setCoverage(data.coverage);setLastChecked(data.lastChecked);}).catch(e=>{if(e.name!=='AbortError')setFeedError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[reload]);
  const sourcePrograms=sourceMode==='collected'?collected:ALL_GOV_PROGRAMS;
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('ALL');
  const [selected,setSelected] = useState(null);
  const [day,setDay] = useState(null);
  const programs=useMemo(()=>sourcePrograms.filter(p=>(category==='ALL'||p.category===category)&&`${p.title} ${p.agency||p.ministry||''} ${p.region||''} ${(p.tags||[]).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())),[category,query,sourcePrograms]);
  const undated=programs.filter(p=>{const period=programPeriod(p);return !period.start&&!period.end;});
  const cells=monthCells(month.getFullYear(),month.getMonth());
  const dayPrograms=day?programsOnDate(programs,day):[];
  function move(offset){setMonth(new Date(month.getFullYear(),month.getMonth()+offset,1,12));setDay(null);}
  return <div className="gov-calendar-page">
    <div className="platform-page-heading"><div><h1>정부지원사업</h1><p>모집 기간과 마감일을 달력에서 확인하고 필요한 서류를 준비하세요.</p></div><div className="flex gap-2"><Button variant={view==='calendar'?'primary':'secondary'} onClick={()=>setView('calendar')} aria-pressed={view==='calendar'}><CalendarDays className="w-4 h-4"/>달력 보기</Button><Button variant={view==='list'?'primary':'secondary'} onClick={()=>setView('list')} aria-pressed={view==='list'}><List className="w-4 h-4"/>목록 보기</Button></div></div>
    <p className="mb-5 p-3 border border-amber-200 bg-amber-50 rounded-lg text-xs text-amber-900">{sourceMode==='collected' ? (coverage || '공식 공고 수집본을 불러오는 중입니다.') : '기존 53개 참고사업은 공고 날짜가 확인되지 않은 자료입니다.'} 모집 기간은 원문을 확인해 주세요. 기업별 신청 자격 판별은 미연동입니다.</p>
    <div className="flex flex-wrap items-center gap-3 mb-4"><Button variant={sourceMode==='collected'?'primary':'secondary'} onClick={()=>{setSourceMode('collected');setSelected(null);}}>공식 수집 공고 {collected.length}건</Button><Button variant={sourceMode==='reference'?'primary':'secondary'} onClick={()=>{setSourceMode('reference');setSelected(null);}}>기존 참고사업 53건</Button><Button variant="secondary" onClick={()=>setReload(n=>n+1)} disabled={loading}>저장된 수집본 새로고침</Button>{lastChecked&&<span className="text-xs text-slate-500">확인: {new Date(lastChecked).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</span>}</div>
    {loading&&<p role="status" className="text-sm mb-3">공고를 불러오는 중입니다.</p>}
    {feedError&&<p role="alert" className="text-sm mb-3 text-red-700">{feedError}</p>}
    {view==='list' ? <GovernmentProgramsView {...props} key={sourceMode} programs={sourcePrograms} initialProgramId={selected?.id || searchParams.get('program')}/> : <>
      <div className="gov-calendar-toolbar"><div className="flex items-center gap-3"><Button variant="secondary" aria-label="이전 달" onClick={()=>move(-1)}><ChevronLeft className="w-4 h-4"/></Button><h2 className="text-lg font-bold" aria-live="polite">{month.getFullYear()}년 {month.getMonth()+1}월</h2><Button variant="secondary" aria-label="다음 달" onClick={()=>move(1)}><ChevronRight className="w-4 h-4"/></Button><Button variant="secondary" onClick={()=>{const now=new Date();setMonth(new Date(now.getFullYear(),now.getMonth(),1,12));setDay(dateKey(now));}}>오늘</Button></div><div className="flex gap-2 flex-wrap"><select aria-label="사업 구분" value={category} onChange={e=>{setCategory(e.target.value);setSelected(null);}} className="border rounded-lg px-3 py-2 text-sm"><option value="ALL">전체 사업</option><option value="CENTRAL">중앙정부</option><option value="LOCAL">지자체</option><option value="PRIVATE">민간·유관기관</option></select><input aria-label="지원사업 검색" value={query} onChange={e=>{setQuery(e.target.value);setSelected(null);}} placeholder="사업명·기관·지역 검색" className="border rounded-lg px-3 py-2 text-sm"/></div></div>
      <div className="text-xs text-slate-500 mb-3" aria-live="polite">전체 {programs.length}건 · 일정 등록 {programs.length-undated.length}건 · 일정 미확인 {undated.length}건</div>
      <div className="gov-calendar-layout"><div className="min-w-0"><div className="gov-month" role="group" aria-label="지원사업 월간 달력"><div className="gov-weekdays">{['일','월','화','수','목','금','토'].map(d=><span key={d}>{d}</span>)}</div><div className="gov-days">{cells.map(d=>{const key=dateKey(d);const events=programsOnDate(programs,key);return <div className={`gov-day ${d.getMonth()!==month.getMonth()?'is-outside':''} ${day===key?'is-selected':''}`} key={key}><button aria-label={`${key} 사업 ${events.length}건`} aria-pressed={day===key} className={key===dateKey(new Date())?'is-today':''} onClick={()=>{setDay(key);setSelected(null);}}>{d.getDate()}</button>{events.slice(0,3).map(p=><button className="gov-event" key={p.id} onClick={()=>{setSelected(p);setDay(key);}} title={p.title}>{programPeriod(p).end===key?'마감 · ':''}{p.title}</button>)}{events.length>3&&<button className="text-xs text-blue-600" onClick={()=>{setDay(key);setSelected(null);}}>+{events.length-3}건 더 보기</button>}</div>;})}</div></div>
      <section className="platform-card mt-5"><h2>일정 미확인 사업 <span className="text-slate-400">{undated.length}건</span></h2><p className="text-xs text-slate-500 my-3">모집 날짜 확인 후 달력에 표시할 사업입니다. 현재 열람 가능한 전체 자료를 확인할 수 있습니다.</p><div className="gov-undated">{undated.map(p=><button key={p.id} className={`gov-program-row ${selected?.id===p.id?'is-active':''}`} onClick={()=>{setSelected(p);setDay(null);}}><span className="block font-semibold">{p.title}</span><small>{p.agency||p.ministry||p.region} · 일정 미확인</small></button>)}{!undated.length&&<p className="py-4 text-sm text-slate-500">조건에 맞는 일정 미확인 사업이 없습니다.</p>}</div></section></div>
      <aside className="platform-card gov-calendar-detail" aria-label="지원사업 상세"><div className="platform-card-title"><h2>{selected?'사업 상세':day||'날짜·사업 선택'}</h2>{selected&&<button aria-label="사업 상세 닫기" onClick={()=>setSelected(null)}><X className="w-4 h-4"/></button>}</div>{selected?<><h3 className="font-bold text-base my-4">{selected.title}</h3><p className="text-xs text-slate-500">{selected.agency||selected.ministry||selected.region}</p><dl className="space-y-4 text-sm mt-5"><div><dt className="text-xs text-slate-500">모집 기간</dt><dd className="mt-1">{programPeriod(selected).start||'시작일 미확인'} ~ {programPeriod(selected).end||'마감일 미확인'}</dd></div><div><dt className="text-xs text-slate-500">자료상 지원 대상</dt><dd className="mt-1">{selected.targetIndustry}</dd></div><div><dt className="text-xs text-slate-500">자료상 지원 규모</dt><dd className="mt-1">{selected.budgetLimit}</dd></div></dl><p className="text-sm leading-relaxed my-5">{selected.description}</p>{selected.sourceUrl&&<a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex text-sm font-semibold text-blue-600 mb-4">공식 공고 원문 열기 ↗</a>}<p className="text-xs text-slate-500 mb-4">{selected.verificationLevel || '참고자료'}{selected.verifiedAt ? ` · 확인일 ${selected.verifiedAt.slice(0,10)}`:''}</p><GovernmentNoticeAnalysis analysis={selected.analysis}/><Button onClick={()=>setView('list')}>필요 서류 확인</Button></>:day?<><p className="text-xs text-slate-500 mb-4">해당 날짜에 모집 중이거나 시작·마감되는 사업</p>{dayPrograms.length?dayPrograms.map(p=><button key={p.id} className="gov-program-row" onClick={()=>setSelected(p)}>{p.title}</button>):<p className="text-sm text-slate-500">등록된 일정이 없습니다. 일정 미확인 목록도 확인해 주세요.</p>}</>:<p className="text-sm text-slate-500 leading-relaxed">날짜를 누르면 당일 사업을, 사업을 누르면 지원 대상·모집 기간·필요 서류를 확인할 수 있습니다.</p>}</aside></div>
    </>}
  </div>;
}
