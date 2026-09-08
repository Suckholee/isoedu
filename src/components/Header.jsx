'use client';

import React from 'react';
import { ShieldCheck, Database, RefreshCw, PlusCircle, ExternalLink, Sparkles } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function Header({ 
  companies, 
  currentCompany, 
  onSelectCompany, 
  onResetData, 
  onAddNewDoc,
  documentCount 
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  인증 레이더 <span className="text-indigo-600 font-semibold text-sm px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-200">ISOEdu</span>
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  시연/교육 모드
                </span>
              </div>
              <p className="text-xs text-slate-500">
                체계적 인증 문서 관리 & AI 어시스턴트 기반 상황별 문서 자동 호출 플랫폼
              </p>
            </div>
          </div>

          {/* Center / Right: Company Selector & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Company Selector */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700">
              <span className="text-slate-400 font-medium">관리 대상 기업:</span>
              <select
                value={currentCompany.id}
                onChange={(e) => {
                  const comp = companies.find(c => c.id === e.target.value);
                  if (comp) onSelectCompany(comp);
                }}
                className="bg-transparent font-bold text-indigo-700 focus:outline-none cursor-pointer pr-2"
              >
                {companies.map(comp => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.industry})
                  </option>
                ))}
              </select>
            </div>

            {/* Supabase Status Pill */}
            <div 
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border flex items-center gap-1.5 ${
                isSupabaseConfigured 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title={isSupabaseConfigured ? 'Supabase 실시간 클라우드 DB 연결됨' : '로컬 스토리지 하이브리드 데모 모드로 작동 중'}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isSupabaseConfigured ? 'Supabase DB 연동' : '하이브리드 데모 DB'}</span>
            </div>

            {/* Reset Button */}
            <button
              onClick={onResetData}
              className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5"
              title="초기 샘플 데이터로 복원"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>초기화</span>
            </button>

            {/* New Document Button */}
            <button
              onClick={onAddNewDoc}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>문서 직접 등록</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
