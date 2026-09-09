'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, FileText, Check, BookOpen, GitPullRequest, ClipboardCheck } from 'lucide-react';
import { HIERARCHY_LEVELS, CERTIFICATION_CATEGORIES } from '../lib/mockData';

export default function AddDocumentModal({ isOpen, onClose, onAddDocument, currentCompany, initialLevel }) {
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    certificationCode: 'ISO_9001',
    hierarchyLevel: 'LEVEL_2',
    clauseNumber: '',
    department: '품질경영팀',
    author: '김준호',
    expiryDate: '2026-06-30',
    dDay: 365,
    penaltyRisk: '',
    summary: '',
    contentDraft: '',
  });

  useEffect(() => {
    if (initialLevel && initialLevel !== 'BLANK') {
      let defaultTitle = '';
      let defaultCode = '';
      let defaultClause = '';
      let defaultDraft = '';

      if (initialLevel === 'LEVEL_1') {
        defaultTitle = '품질 및 경영 기본 방침 매뉴얼';
        defaultCode = 'QM-06';
        defaultClause = 'Clause 4~10';
        defaultDraft = '# 품질경영시스템 매뉴얼\n1. 최고경영자 의지표명\n2. 고객 중심 경영 체계';
      } else if (initialLevel === 'LEVEL_2') {
        defaultTitle = '표준 업무 관리 절차서';
        defaultCode = 'QMS-P-005';
        defaultClause = 'Clause 7.5';
        defaultDraft = '# 업무 절차서\n1. 목적 및 적용범위\n2. 주관 부서 및 관련 부서 책임\n3. 상세 업무 처리 절차';
      } else if (initialLevel === 'LEVEL_3') {
        defaultTitle = '현장 작업 실무 지침서';
        defaultCode = 'QMS-I-20';
        defaultClause = 'Clause 8.5';
        defaultDraft = '# 현장 작업 지침서\n1. 작업 전 안전 점검\n2. 세부 작업 공정 순서\n3. 이상 발생 시 조치 요령';
      } else if (initialLevel === 'LEVEL_4') {
        defaultTitle = '심사 및 이행 점검 기록 양식';
        defaultCode = 'QMS-F-30';
        defaultClause = 'Clause 9.1';
        defaultDraft = '# 점검 기록부 서식\n- 점검 일자:\n- 점검자 서명:\n- 점검 항목 및 결과 (적합/부적합)';
      }

      setFormData(prev => ({
        ...prev,
        hierarchyLevel: initialLevel,
        title: defaultTitle,
        code: defaultCode,
        clauseNumber: defaultClause,
        contentDraft: defaultDraft
      }));
    }
  }, [initialLevel]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.code.trim()) {
      alert('문서 제목과 문서 코드를 입력해주세요.');
      return;
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      companyId: currentCompany?.id || 'comp-1',
      title: formData.title,
      code: formData.code.toUpperCase(),
      standards: [formData.certificationCode],
      hierarchyLevel: formData.hierarchyLevel,
      clauseNumber: formData.clauseNumber || '표준 조항',
      department: formData.department || '품질경영팀',
      author: formData.author || '담당자',
      version: 'v1.0',
      revisionNo: 'Rev. 1.0',
      status: 'READY',
      docStatus: '승인 대기',
      expiryDate: formData.expiryDate || '2026-12-31',
      dDay: Number(formData.dDay) || 365,
      penaltyRisk: formData.penaltyRisk || '만기 미갱신 시 심사 지적 및 규격 불일치 리스크',
      summary: formData.summary || '신규 등록된 ISO 규격 관리 문서입니다.',
      checklist: [
        { text: '최신 표준 규격 요구사항 대조 완료', done: true },
        { text: '담당 부서장 검토 및 승인 서명', done: false },
        { text: '관련 실무자 교육 및 사내 공지', done: false },
      ],
      contentDraft: formData.contentDraft || `# ${formData.title} (${formData.code})\n\n1. 목적: 본 규격 문서는 사내 표준을 정의함.\n2. 적용 범위: 전사 임직원.`,
      coverGradient: formData.hierarchyLevel === 'LEVEL_1' ? 'from-blue-600 to-indigo-700' :
                     formData.hierarchyLevel === 'LEVEL_2' ? 'from-emerald-600 to-teal-700' :
                     formData.hierarchyLevel === 'LEVEL_3' ? 'from-amber-600 to-orange-700' : 'from-purple-600 to-indigo-800'
    };

    onAddDocument(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up">
        
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">신규 ISO 규격 문서 등록</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm max-h-[80vh] overflow-y-auto">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">문서명 *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 내부심사 관리 절차서, 작업안전 지침서"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">문서 코드 *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="예: QM-05, QMS-P-003"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">표준 조항 번호</label>
              <input
                type="text"
                value={formData.clauseNumber}
                onChange={(e) => setFormData({ ...formData, clauseNumber: e.target.value })}
                placeholder="예: Clause 9.2"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">문서 계층 *</label>
              <select
                value={formData.hierarchyLevel}
                onChange={(e) => setFormData({ ...formData, hierarchyLevel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="LEVEL_1">1계층: 매뉴얼 (Manual)</option>
                <option value="LEVEL_2">2계층: 절차서 (Procedure)</option>
                <option value="LEVEL_3">3계층: 지침서 (Instruction)</option>
                <option value="LEVEL_4">4계층: 기록/양식 (Records)</option>
                <option value="CERT">00: 인증서 원본 (Cert)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">인증 규격 *</label>
              <select
                value={formData.certificationCode}
                onChange={(e) => setFormData({ ...formData, certificationCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="ISO_9001">ISO 9001 (품질경영)</option>
                <option value="ISO_14001">ISO 14001 (환경경영)</option>
                <option value="ISO_27001">ISO 27001 (정보보안)</option>
                <option value="ISO_45001">ISO 45001 (안전보건)</option>
                <option value="ISO_50001">ISO 50001 (에너지)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">관리 부서</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">유효 만료일 *</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">만기 누락 시 법적·사업상 리스크 (과태료/제재)</label>
            <input
              type="text"
              value={formData.penaltyRisk}
              onChange={(e) => setFormData({ ...formData, penaltyRisk: e.target.value })}
              placeholder="예: 미갱신 시 과태료 500만원 부과 및 입찰 가점 제외"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">문서 요약</label>
            <textarea
              rows={2}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="문서의 주요 목적과 범위를 요약하세요..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-200 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>문서 등록 완료</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
