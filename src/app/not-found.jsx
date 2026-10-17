import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <FileQuestion className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">404</h1>
          <h2 className="text-base font-bold text-slate-800">페이지를 찾을 수 없습니다</h2>
          <p className="text-xs text-slate-500">
            존재하지 않거나 삭제된 경로입니다. 인증 레이더 홈으로 이동해 주세요.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all"
          >
            <Home className="w-4 h-4" />
            <span>메인 드라이브 홈으로 이동</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
