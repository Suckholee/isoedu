'use client';

import React from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  ShieldAlert, 
  Award, 
  ChevronRight, 
  Calendar, 
  ArrowUpRight,
  TrendingUp,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import { CLAUSE_PROGRESS_DATA } from '../lib/mockData';

export default function DashboardView({ documents, onOpenDetail, onNavigateDrive }) {
  return (
    <div className="space-y-6">
      
      {/* 1. Top Severity Matrix (시안 10번: 리스크 수준별 요약) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              리스크 수준별 컴플라이언스 요약
            </h3>
            <p className="text-xs text-slate-400">문서 및 ISO 규격 준수 항목의 리스크 현황</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">전체 조직 기준</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Critical */}
          <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-red-700">
              <span className="flex items-center gap-1"><AlertOctagon className="w-3.5 h-3.5" /> Critical</span>
              <span>23건</span>
            </div>
            <div className="text-[11px] text-slate-500">전체의 8.1% (과태료·자격박탈)</div>
            <div className="w-full bg-red-200 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-red-600 h-full rounded-full" style={{ width: '8.1%' }}></div>
            </div>
          </div>

          {/* High */}
          <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-orange-700">
              <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> High</span>
              <span>67건</span>
            </div>
            <div className="text-[11px] text-slate-500">전체의 23.6% (갱신 지연 위험)</div>
            <div className="w-full bg-orange-200 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-orange-500 h-full rounded-full" style={{ width: '23.6%' }}></div>
            </div>
          </div>

          {/* Medium */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Medium</span>
              <span>112건</span>
            </div>
            <div className="text-[11px] text-slate-500">전체의 39.4% (일정 조율 필요)</div>
            <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '39.4%' }}></div>
            </div>
          </div>

          {/* Low */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Low</span>
              <span>82건</span>
            </div>
            <div className="text-[11px] text-slate-500">전체의 28.9% (안정적 보관)</div>
            <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '28.9%' }}></div>
            </div>
          </div>

        </div>

      </div>

      {/* 2. Middle Row: Semicircle Progress Gauge + Clause 4~10 Progress Bar (시안 15번) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: 68.4% Semicircle Progress Gauge */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                ISO 요구사항 체크리스트 진행률
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                인증 유지 단계
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">총 183개 규격 요구사항 이행률</p>
          </div>

          {/* Semi-circle Gauge Canvas representation */}
          <div className="py-2 flex flex-col items-center justify-center">
            <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
              <svg viewBox="0 0 200 110" className="w-full h-full">
                {/* Background arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="20"
                  strokeLinecap="round"
                />
                {/* Foreground arc (68.4%) */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset="79.3" // 251.2 * (1 - 0.684)
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute bottom-1 flex flex-col items-center">
                <span className="text-3xl font-black text-slate-900 tracking-tight">68.4%</span>
                <span className="text-[11px] text-slate-400 font-bold">전체 진행률</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" /> 지난 7일간 +5.7%p 상승
            </div>
          </div>

          {/* Stat Details */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-slate-100">
            <div className="p-2 rounded-xl bg-slate-50">
              <div className="text-[10px] text-slate-400">완료 항목</div>
              <div className="text-base font-bold text-blue-600 mt-0.5">118개</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <div className="text-[10px] text-slate-400">진행 중</div>
              <div className="text-base font-bold text-amber-600 mt-0.5">41개</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <div className="text-[10px] text-slate-400">미완료</div>
              <div className="text-base font-bold text-rose-600 mt-0.5">24개</div>
            </div>
          </div>
        </div>

        {/* Right: Clause 4~10 Progress Bars (시안 15번 분야별 진행률) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                ISO 9001 조항별(4~10) 세부 이행률
              </h4>
              <div className="text-xs text-slate-400">심사관 현장 검증 대비 조항별 완료율</div>
            </div>
            <button 
              onClick={() => onNavigateDrive('LEVEL_1')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              관련 매뉴얼 바로가기 →
            </button>
          </div>

          <div className="space-y-2.5">
            {CLAUSE_PROGRESS_DATA.map((item) => (
              <div key={item.clause} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.clause}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.rate}%</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      item.rate >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.rate >= 70 ? 'bg-emerald-500' : 'bg-blue-600'
                    }`} 
                    style={{ width: `${item.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Bottom Row: Official Certificate D-Day Card + Top 5 Incomplete Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Certificate Card (시안 15번 인증 정보) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-sm">공식 인증 및 심사 현황</h4>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              인증 유지 단계
            </span>
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-800">
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">인증 표준</span>
              <span className="font-bold text-slate-200">ISO 9001:2015</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">인증 번호</span>
              <span className="font-mono text-slate-200">IC-QMS-2024-0012</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">최초 취득일</span>
              <span className="font-mono text-slate-200">2024-06-15</span>
            </div>
            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-400">사후심사 예정일</span>
              <div className="text-right">
                <div className="font-mono font-bold text-amber-300">2025-06-15</div>
                <div className="text-[10px] text-amber-400 font-black">D-26일 임박</div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => onNavigateDrive('CERT')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-colors shadow-md"
            >
              인증서 원본 및 심사서류 확인 →
            </button>
          </div>
        </div>

        {/* Top 5 Urgent Actions (시안 15번 미완료 항목 상위 5개) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                차기 사후심사 대비 필수 미완료 과제 (상위 5건)
              </h4>
              <div className="text-xs text-slate-400">심사 전 100% 종결되어야 하는 필수 규격 요건</div>
            </div>
            <span className="text-xs font-bold text-rose-600">D-26 이내 조치</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">요구사항 조항</th>
                  <th className="py-2.5 px-2">분류</th>
                  <th className="py-2.5 px-2">중요도</th>
                  <th className="py-2.5 px-2">마감일</th>
                  <th className="py-2.5 px-2 text-right">진행률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {[
                  { clause: '7.5.1 문서화된 정보 (일반)', docCode: 'QMS-P-001', type: '필수', pri: '높음', due: '2025-05-25', rate: '50%' },
                  { clause: '8.5.1 운용의 관리', docCode: 'QM-01', type: '필수', pri: '높음', due: '2025-05-27', rate: '30%' },
                  { clause: '9.1.2 내부심사 수행', docCode: 'QMS-P-004', type: '필수', pri: '중간', due: '2025-05-30', rate: '60%' },
                  { clause: '10.2 부적합 및 시정조치', docCode: 'QMS-P-005', type: '필수', pri: '높음', due: '2025-06-01', rate: '40%' },
                  { clause: '7.4 대내외 의사소통', docCode: 'QMS-P-003', type: '권고', pri: '보통', due: '2025-06-05', rate: '20%' },
                ].map((row, i) => {
                  const targetDoc = documents.find(d => d.code === row.docCode) || documents[0];
                  return (
                    <tr 
                      key={i} 
                      onClick={() => targetDoc && onOpenDetail(targetDoc)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                      title="클릭하여 관련 문서 Docs 열람/편집"
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900 group-hover:text-blue-700">
                        {row.clause}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700">
                          {row.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="text-amber-700 font-semibold">{row.pri}</span>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-500">
                        {row.due}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-blue-600">
                        {row.rate} →
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
