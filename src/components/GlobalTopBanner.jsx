'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, ChevronLeft, ChevronRight, X, ArrowRight } from 'lucide-react';
import { EMERGENCY_RISK_TICKERS } from '../lib/mockData';

export default function GlobalTopBanner({ onSelectDoc }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % EMERGENCY_RISK_TICKERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  const current = EMERGENCY_RISK_TICKERS[currentIndex];

  return (
    <div className="mx-4 sm:mx-6 mb-4 mt-2">
      <div className="bg-[#fef2f2] border border-red-200/90 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between shadow-2xs gap-3 transition-all animate-fade-in">
        
        {/* Left: Icon & Text (Google Drive Promo Banner Style) */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base truncate">
                {current.title}
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-red-600 text-white shadow-2xs shrink-0">
                {current.severity}
              </span>
            </div>
            <p className="text-xs text-red-700 font-medium truncate mt-0.5">
              {current.consequence}
            </p>
          </div>
        </div>

        {/* Right: Action Pill Button & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectDoc && onSelectDoc(current.docId)}
            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 shrink-0"
          >
            <span>지금 조치하기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Navigation & Close */}
          <div className="hidden sm:flex items-center gap-0.5 ml-1 text-slate-400">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + EMERGENCY_RISK_TICKERS.length) % EMERGENCY_RISK_TICKERS.length)}
              className="p-1.5 rounded-full hover:bg-red-100 text-slate-600"
              title="이전 알림"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % EMERGENCY_RISK_TICKERS.length)}
              className="p-1.5 rounded-full hover:bg-red-100 text-slate-600"
              title="다음 알림"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            title="배너 닫기"
            className="p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-slate-700 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
