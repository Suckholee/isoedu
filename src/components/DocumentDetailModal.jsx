'use client';

import React, { useState } from 'react';
import { 
  X, 
  CheckSquare, 
  Square, 
  FileText, 
  ShieldAlert, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Clock, 
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function DocumentDetailModal({ 
  doc, 
  onClose, 
  onToggleChecklist, 
  onDeleteDocument 
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!doc) return null;

  const handleCopy = () => {
    if (!doc.contentDraft) return;
    navigator.clipboard.writeText(doc.contentDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert(`[${doc.code} ${doc.title}] 문서가 표준 서식(.docx)으로 다운로드되었습니다.`);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                {doc.code}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {doc.certificationCode}
              </span>
              {doc.clauseNumber && (
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {doc.clauseNumber}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{doc.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Penalty Risk Banner */}
          {doc.penaltyRisk && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3 text-xs sm:text-sm text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-700 block mb-0.5">⚠️ 만기/누락 시 법적·사업상 리스크</span>
                <p className="text-rose-800 leading-relaxed">{doc.penaltyRisk}</p>
              </div>
            </div>
          )}

          {/* Document Summary & Schedule Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-medium block mb-1">문서 요약 및 목적</span>
              <p className="text-slate-700 font-medium leading-relaxed">{doc.summary}</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">유효기간/만기:</span>
                <span className="font-semibold text-slate-800">{doc.expiryDate || '상시'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">D-Day 상태:</span>
                <span className="font-bold text-indigo-700">
                  {doc.dDay ? `D-${doc.dDay}` : '안전 유지'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">관리 상태:</span>
                <span className="font-semibold text-slate-800">{doc.status}</span>
              </div>
            </div>
          </div>

          {/* Interactive Checklist */}
          {doc.checklist && doc.checklist.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  필수 구비 항목 체크리스트 (실시간 반영)
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  클릭하여 이행 여부 체크
                </span>
              </div>

              <div className="space-y-1.5 bg-white border border-slate-200 rounded-xl p-3">
                {doc.checklist.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onToggleChecklist(doc.id, idx)}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-xs sm:text-sm text-slate-700"
                  >
                    {item.done ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={item.done ? 'line-through text-slate-400' : 'font-medium'}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI-Generated Draft Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI 생성 표준 규격 초안 (Preview)
              </h4>
              <button
                onClick={handleCopy}
                className="text-xs px-2.5 py-1 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '복사 완료' : '초안 복사'}</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border border-slate-800">
              {doc.contentDraft || '등록된 초안 텍스트가 없습니다.'}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('이 문서를 관리 리스트에서 삭제하시겠습니까?')) {
                onDeleteDocument(doc.id);
                onClose();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 p-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>문서 삭제</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="text-xs px-3.5 py-2 rounded-lg font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? '다운로드 중...' : '표준 서식 다운로드'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-xs px-4 py-2 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
