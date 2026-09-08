'use client';

import React from 'react';
import { 
  FileText, 
  Award, 
  BookOpen, 
  Scroll, 
  ClipboardList, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function DocumentCard({ doc, onOpenDetail }) {
  // 계층별 스타일 및 아이콘
  const getHierarchyMeta = (level) => {
    switch (level) {
      case 'CERT':
        return {
          label: '인증서 원본',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: Award
        };
      case 'LEVEL_1':
        return {
          label: '1계층: 매뉴얼',
          color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          icon: BookOpen
        };
      case 'LEVEL_2':
        return {
          label: '2계층: 절차서(SOP)',
          color: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: Scroll
        };
      case 'LEVEL_3':
        return {
          label: '3계층: 지침서',
          color: 'bg-teal-50 text-teal-800 border-teal-200',
          icon: FileText
        };
      case 'LEVEL_4':
        return {
          label: '4계층: 기록/양식',
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: ClipboardList
        };
      default:
        return {
          label: '문서',
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: FileText
        };
    }
  };

  // 상태 배지
  const getStatusBadge = (status, dDay) => {
    switch (status) {
      case 'EXPIRING':
        return {
          label: `갱신 임박 (D-${dDay})`,
          className: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
          icon: Clock
        };
      case 'ACTION_NEEDED':
        return {
          label: '조치 필요',
          className: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
          icon: AlertCircle
        };
      case 'DRAFT':
        return {
          label: '작성 중',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: FileText
        };
      case 'READY':
      default:
        return {
          label: dDay ? `정상 (D-${dDay})` : '정상 보관',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2
        };
    }
  };

  const meta = getHierarchyMeta(doc.hierarchyLevel);
  const statusBadge = getStatusBadge(doc.status, doc.dDay);
  const IconComponent = meta.icon;

  // 체크리스트 진척도
  const totalChecks = doc.checklist ? doc.checklist.length : 0;
  const completedChecks = doc.checklist ? doc.checklist.filter(c => c.done).length : 0;
  const checkPercent = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 100;

  return (
    <div 
      onClick={() => onOpenDetail(doc)}
      className="bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all duration-200 p-4 cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Top meta tags */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium border flex items-center gap-1 ${meta.color}`}>
              <IconComponent className="w-3 h-3" />
              {meta.label}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {doc.certificationCode}
            </span>
          </div>

          <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium border flex items-center gap-1 ${statusBadge.className}`}>
            <statusBadge.icon className="w-3 h-3" />
            {statusBadge.label}
          </span>
        </div>

        {/* Code & ISO Clause */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span className="font-mono font-medium text-slate-600">{doc.code}</span>
          {doc.clauseNumber && (
            <>
              <span>•</span>
              <span className="text-indigo-600 font-medium">{doc.clauseNumber}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
          {doc.title}
        </h3>

        {/* Summary */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
          {doc.summary}
        </p>
      </div>

      {/* Bottom Section: Risk info & Checklist progress */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        {doc.penaltyRisk && (
          <div className="flex items-start gap-1.5 text-[11px] text-rose-600 bg-rose-50/70 p-1.5 rounded-lg border border-rose-100">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
            <span className="line-clamp-1 font-medium">{doc.penaltyRisk}</span>
          </div>
        )}

        {totalChecks > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>필수 점검 항목</span>
              <span className={checkPercent === 100 ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
                {completedChecks}/{totalChecks} 완료 ({checkPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  checkPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${checkPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>만기/개정: {doc.expiryDate || '상시'}</span>
          <span className="text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
            상세/AI초안 <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
