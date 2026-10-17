'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Next.js Global Route Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <AlertCircle className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">
            시스템 오류가 감지되었습니다
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            요청하신 작업을 처리하는 도중 오류가 발생했습니다.
            데이터는 안전하게 저장되어 있으니 다시 시도해 주세요.
          </p>
        </div>

        {error?.message && (
          <div className="p-4 bg-slate-50 rounded-2xl text-left text-xs font-mono text-rose-600 border border-slate-200 overflow-x-auto max-h-32">
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>다시 시도하기</span>
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>홈으로 이동</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
