'use client';

import React, { useState } from 'react';
import { X, Plus, FileText, Check } from 'lucide-react';
import { HIERARCHY_LEVELS, CERTIFICATION_CATEGORIES } from '../lib/mockData';

export default function AddDocumentModal({ isOpen, onClose, onAddDocument, currentCompany }) {
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    certificationCode: 'ISO_9001',
    hierarchyLevel: 'LEVEL_2',
    clauseNumber: '',
    expiryDate: '',
    dDay: 90,
    penaltyRisk: '',
    summary: '',
    contentDraft: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.code.trim()) {
      alert('문서 제목과 문서 코드를 입력해주세요.');
      return;
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      companyId: currentCompany.id,
      title: formData.title,
      code: formData.code.toUpperCase(),
      certificationCode: formData.certificationCode,
      hierarchyLevel: formData.hierarchyLevel,
      clauseNumber: formData.clauseNumber,
      status: 'READY',
      expiryDate: formData.expiryDate || '2027-12-31',
      dDay: Number(formData.dDay) || 120,
      penaltyRisk: formData.penaltyRisk || '만기 누락 시 규정 위반 및 감사 지적 대상',
      summary: formData.summary || '신규 등록된 관리 대상 규격 문서입니다.',
      checklist: [
        { text: '최신 개정본 승인 확인', done: true },
        { text: '현장 배포 및 실무자 교육 이행', done: false },
      ],
      contentDraft: formData.contentDraft || `# ${formData.title} (${formData.code})\n1. 목적: 본 규정은 회사의 표준 업무 프로세스를 규정함.\n2. 적용 범위: 전 부서 공통.`
    };

    onAddDocument(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up">
        
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">신규 규격 문서 등록</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">문서명 *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 내부심사 절차서, 공급자 평가 지침서"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                placeholder="예: SOP-07, QM-02"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">표준 조항 번호</label>
              <input
                type="text"
                value={formData.clauseNumber}
                onChange={(e) => setFormData({ ...formData, clauseNumber: e.target.value })}
                placeholder="예: Clause 9.2"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">인증 규격</label>
              <select
                value={formData.certificationCode}
                onChange={(e) => setFormData({ ...formData, certificationCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                {CERTIFICATION_CATEGORIES.filter(c => c.code !== 'ALL').map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">문서 계층</label>
              <select
                value={formData.hierarchyLevel}
                onChange={(e) => setFormData({ ...formData, hierarchyLevel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                {HIERARCHY_LEVELS.filter(l => l.id !== 'ALL').map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">만기 일자</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">D-Day 잔여일수</label>
              <input
                type="number"
                value={formData.dDay}
                onChange={(e) => setFormData({ ...formData, dDay: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">만기 누락 시 리스크/불이익</label>
            <input
              type="text"
              value={formData.penaltyRisk}
              onChange={(e) => setFormData({ ...formData, penaltyRisk: e.target.value })}
              placeholder="예: 공공입찰 감점, 과태료 부과 등"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">문서 요약</label>
            <textarea
              rows={2}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="문서의 핵심 목적 및 개요"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>문서 등록</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
