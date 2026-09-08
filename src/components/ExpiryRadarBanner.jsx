'use client';

import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, FileEdit, BellRing, ChevronRight } from 'lucide-react';

export default function ExpiryRadarBanner({ documents, onFilterStatus }) {
  // 통계 계산
  const totalCount = documents.length;
  const expiringCount = documents.filter(d => d.status === 'EXPIRING' || (d.dDay !== undefined && d.dDay <= 40 && d.dDay > 0)).length;
  const actionNeededCount = documents.filter(d => d.status === 'ACTION_NEEDED' || d.status === 'DRAFT').length;
  const readyCount = documents.filter(d => d.status === 'READY').length;

  // 가장 시급한 리스크 서류 1건
  const urgentDoc = documents
    .filter(d => d.status === 'EXPIRING' || (d.dDay && d.dDay <= 40))
    .sort((a, b) => (a.dDay || 999) - (b.dDay || 999))[0];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg mb-6 border border-slate-800">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Headline & Urgent Alert Ticker */}
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <BellRing className="w-3 h-3 text-rose-400 animate-bounce" />
              만기 레이더 실시간 감시중
            </span>
            <span className="text-xs text-slate-400">
              규정 미준수 및 만기 누락 시 과태료·불이익 방지 가동
            </span>
          </div>

          {urgentDoc ? (
            <div className="flex items-start sm:items-center gap-2 bg-rose-950/40 border border-rose-800/50 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-rose-100">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
              <div className="flex-1">
                <span className="font-bold text-rose-300">[{urgentDoc.title}]</span> 만기{' '}
                <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded font-black">
                  D-{urgentDoc.dDay}
                </span>{' '}
                — <span className="text-slate-200">{urgentDoc.penaltyRisk}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              현재 만기 30일 이내 도래 서류가 없습니다. 모든 인허가 및 규격 서류가 정상 유지되고 있습니다.
            </p>
          )}
        </div>

        {/* Right: Quick Stat Badges with Clickable Filter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          <button
            onClick={() => onFilterStatus('EXPIRING')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 transition-all text-center group"
          >
            <div className="flex items-center gap-1 text-amber-400 text-xs font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>갱신 임박</span>
            </div>
            <span className="text-xl font-bold text-white mt-0.5 group-hover:scale-105 transition-transform">
              {expiringCount}
            </span>
          </button>

          <button
            onClick={() => onFilterStatus('ACTION_NEEDED')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-rose-500/30 transition-all text-center group"
          >
            <div className="flex items-center gap-1 text-rose-400 text-xs font-medium">
              <FileEdit className="w-3.5 h-3.5" />
              <span>조치/작성필요</span>
            </div>
            <span className="text-xl font-bold text-white mt-0.5 group-hover:scale-105 transition-transform">
              {actionNeededCount}
            </span>
          </button>

          <button
            onClick={() => onFilterStatus('READY')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/30 transition-all text-center group"
          >
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>정상 보관</span>
            </div>
            <span className="text-xl font-bold text-white mt-0.5 group-hover:scale-105 transition-transform">
              {readyCount}
            </span>
          </button>

          <button
            onClick={() => onFilterStatus('ALL')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all text-center group"
          >
            <span className="text-slate-400 text-xs font-medium">관리 총계</span>
            <span className="text-xl font-bold text-white mt-0.5 group-hover:scale-105 transition-transform">
              {totalCount}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
