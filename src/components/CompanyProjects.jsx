'use client';
import Link from 'next/link';
import {PROJECT_KINDS,summarizeQuickstartProgress} from '../lib/projectWorkflow.mjs';
export default function CompanyProjects({projects=[],company,companies=[],documents=[],onCreate,onSelect}){
 const rows=company?projects.filter(p=>p.companyId===company.id):projects;
 const quickstart=summarizeQuickstartProgress({companies,projects:rows,documents});
 const firstProject=rows[0]||null;
 return <div className="m-5 space-y-4">
  <section role="region" aria-label="ISO 인증 준비 3단계 퀵스타트" className="platform-card border border-blue-200 bg-blue-50/40">
   <header className="flex justify-between items-center gap-3 flex-wrap mb-3">
    <div>
     <span className="text-xs font-bold text-blue-700">실무 3단계 워크플로우 가이드 · 진행률 {quickstart.progressPercent}% ({quickstart.completedSteps}/3단계)</span>
     <h2 className="text-base font-bold text-slate-900 mt-0.5">거래처 프로젝트 생성부터 구비서류 자동 편성·통합 바인더 다운로드까지 순서대로 진행하세요</h2>
    </div>
    <button type="button" className="work-primary" onClick={onCreate}>+ 새 거래처·프로젝트 만들기</button>
   </header>
   <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
    <li className={`p-3 rounded-xl border ${quickstart.step1Done?'bg-emerald-50/80 border-emerald-200':'bg-white border-slate-200'}`}>
     <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
      <span>1단계 · 거래처·프로젝트 생성</span>
      <span className={quickstart.step1Done?'text-emerald-700':'text-blue-700'}>{quickstart.step1Done?`완료 (${quickstart.projectCount}건)`:'시작 필요'}</span>
     </div>
     <p className="text-slate-600 mb-2">대상 거래처와 준비할 ISO 규격·목표일을 선택하면 필수 구비서류와 30·14·3일 전 준비 일정이 자동 구성됩니다.</p>
     <button type="button" onClick={onCreate} className="text-blue-700 font-semibold underline">거래처·프로젝트 추가 →</button>
    </li>
    <li className={`p-3 rounded-xl border ${quickstart.step2Done?'bg-emerald-50/80 border-emerald-200':'bg-white border-slate-200'}`}>
     <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
      <span>2단계 · 구비서류 자동 매칭·일괄 초안</span>
      <span className={quickstart.step2Done?'text-emerald-700':'text-slate-500'}>{quickstart.step2Done?`문서 ${quickstart.docCount}건 준비`:'1단계 후 진행'}</span>
     </div>
     <p className="text-slate-600 mb-2">기존 보유 문서를 자동 매칭하거나 미연결 구비서류 전체 초안을 1클릭 생성하고 좌우 분할 편집기로 보완합니다.</p>
     {firstProject?<button type="button" onClick={()=>onSelect(firstProject)} className="text-blue-700 font-semibold underline">{firstProject.title} 구비서류 열기 →</button>:<span className="text-slate-400">프로젝트 생성 후 바로 이동할 수 있습니다</span>}
    </li>
    <li className={`p-3 rounded-xl border ${quickstart.step3Done?'bg-emerald-50/80 border-emerald-200':'bg-white border-slate-200'}`}>
     <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
      <span>3단계 · 내부 검토 완료·바인더 다운로드</span>
      <span className={quickstart.step3Done?'text-emerald-700':'text-slate-500'}>{quickstart.step3Done?`확인 완료 ${quickstart.verifiedDocCount}건`:'검토 대기'}</span>
     </div>
     <p className="text-slate-600 mb-2">빠른 점검 패널에서 체크리스트·보완 메모를 기록하고 현황표(.csv) 및 통합 바인더(.doc)로 다운로드합니다.</p>
     {firstProject?<button type="button" onClick={()=>onSelect(firstProject)} className="text-blue-700 font-semibold underline">점검 및 바인더 다운로드 이동 →</button>:<span className="text-slate-400">구비서류 연결 후 활성화됩니다</span>}
    </li>
   </ol>
  </section>
  <section className="platform-card"><header className="flex justify-between items-center gap-3 mb-3"><h2>{company?.name||'전체 거래처'} · 프로젝트 <small className="text-slate-500">{rows.length}</small></h2><button className="work-primary" onClick={onCreate}>프로젝트 추가</button></header>
  <div className="overflow-auto"><table className="platform-table"><thead><tr><th scope="col">프로젝트</th><th scope="col">거래처</th><th scope="col">진행 종류</th><th scope="col">내부 목표일</th><th scope="col">업무</th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td><button className="text-blue-700 underline font-semibold" onClick={()=>onSelect(p)}>{p.title||p.auditStandardName||'기존 프로젝트'}</button></td><td>{p.clientName}</td><td>{PROJECT_KINDS[p.kind]||'기존 심사 준비'}</td><td>{p.targetDate||p.targetAuditDate||'미정'}</td><td>{p.workflowVersion===2&&<Link className="text-blue-700" href={`/dashboard?company=${encodeURIComponent(p.companyId)}&project=${encodeURIComponent(p.id)}`}>목록·달력</Link>}</td></tr>)}</tbody></table></div>{!rows.length&&<p className="text-sm text-slate-500 py-4">거래처에 여러 프로젝트를 연결하고 구비서류와 준비 일정을 관리하세요.</p>}</section>
 </div>;
}
