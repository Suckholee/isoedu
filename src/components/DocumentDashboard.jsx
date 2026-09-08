'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  FilePlus, 
  BookOpen, 
  Scroll, 
  FileText, 
  ClipboardList, 
  Award,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { HIERARCHY_LEVELS, CERTIFICATION_CATEGORIES } from '../lib/mockData';
import DocumentCard from './DocumentCard';

export default function DocumentDashboard({ 
  documents, 
  onOpenDetail, 
  onAddNewDoc,
  activeStatusFilter,
  onClearStatusFilter
}) {
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedCert, setSelectedCert] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // 필터링된 문서 목록
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // 1. 계층 필터
      if (selectedLevel !== 'ALL' && doc.hierarchyLevel !== selectedLevel) {
        return false;
      }
      // 2. 인증 규격 필터
      if (selectedCert !== 'ALL' && doc.certificationCode !== selectedCert) {
        return false;
      }
      // 3. 상태 필터 (배너에서 클릭한 상태)
      if (activeStatusFilter && activeStatusFilter !== 'ALL') {
        if (activeStatusFilter === 'EXPIRING' && doc.status !== 'EXPIRING' && (!doc.dDay || doc.dDay > 40)) {
          return false;
        }
        if (activeStatusFilter === 'ACTION_NEEDED' && doc.status !== 'ACTION_NEEDED' && doc.status !== 'DRAFT') {
          return false;
        }
        if (activeStatusFilter === 'READY' && doc.status !== 'READY') {
          return false;
        }
      }
      // 4. 검색어 필터
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = doc.title?.toLowerCase().includes(query);
        const matchCode = doc.code?.toLowerCase().includes(query);
        const matchClause = doc.clauseNumber?.toLowerCase().includes(query);
        const matchSummary = doc.summary?.toLowerCase().includes(query);
        if (!matchTitle && !matchCode && !matchClause && !matchSummary) {
          return false;
        }
      }
      return true;
    });
  }, [documents, selectedLevel, selectedCert, activeStatusFilter, searchQuery]);

  // 각 계층별 문서 카운트 계산
  const getLevelCount = (levelId) => {
    if (levelId === 'ALL') return documents.length;
    return documents.filter(d => d.hierarchyLevel === levelId).length;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
      
      {/* 1. Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              체계적 인증 문서 체계 (ISO 4계층 분류)
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              총 {filteredDocuments.length}건
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            국제표준 4계층 문서 체계(매뉴얼-절차서-지침서-기록) 및 만기일 기준 자동 정리
          </p>
        </div>

        {/* View Toggle & Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="카드형 그리드 뷰"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">카드</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="목록형 테이블 뷰"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">테이블</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ISO 4-Hierarchy Level Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {HIERARCHY_LEVELS.map(lvl => {
          const count = getLevelCount(lvl.id);
          const isSelected = selectedLevel === lvl.id;
          return (
            <button
              key={lvl.id}
              onClick={() => setSelectedLevel(lvl.id)}
              className={`text-xs px-3 py-2 rounded-xl font-medium shrink-0 transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{lvl.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Certification Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="문서명, 문서코드(QP-01), 조항 번호(Clause 7.5) 검색..."
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Certification Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCert}
              onChange={(e) => setSelectedCert(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-medium text-slate-800"
            >
              {CERTIFICATION_CATEGORIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Active Status Filter Clear Pill */}
          {activeStatusFilter && activeStatusFilter !== 'ALL' && (
            <div className="flex items-center gap-1.5 text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1.5 rounded-lg border border-indigo-200">
              <span className="font-semibold">상태: {activeStatusFilter}</span>
              <button
                onClick={onClearStatusFilter}
                className="text-indigo-600 hover:text-indigo-900 font-bold ml-1"
                title="상태 필터 해제"
              >
                ✕
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 4. Document List Rendering (Grid or Table) */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 mb-1">조건에 맞는 문서가 없습니다</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            검색어나 필터를 변경하시거나, 우측 <strong>AI 어시스턴트</strong>와의 대화를 통해 필요한 규격 문서 세트를 즉시 불러오세요.
          </p>
          <button
            onClick={() => {
              setSelectedLevel('ALL');
              setSelectedCert('ALL');
              setSearchQuery('');
              onClearStatusFilter();
            }}
            className="text-xs px-3 py-1.5 rounded-lg font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            모든 필터 초기화
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {filteredDocuments.map(doc => (
            <DocumentCard
              key={doc.id || doc.code}
              doc={doc}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      ) : (
        /* Condensed Table View */
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">계층</th>
                <th className="py-2.5 px-3">문서코드</th>
                <th className="py-2.5 px-3">문서명 / 조항</th>
                <th className="py-2.5 px-3">규격</th>
                <th className="py-2.5 px-3">상태</th>
                <th className="py-2.5 px-3">만기/D-Day</th>
                <th className="py-2.5 px-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocuments.map(doc => (
                <tr 
                  key={doc.id || doc.code}
                  onClick={() => onOpenDetail(doc)}
                  className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 font-medium text-slate-500 whitespace-nowrap">
                    {doc.hierarchyLevel}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {doc.code}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{doc.title}</div>
                    {doc.clauseNumber && (
                      <div className="text-[11px] text-indigo-600">{doc.clauseNumber}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                    {doc.certificationCode}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                    {doc.dDay ? `D-${doc.dDay}` : (doc.expiryDate || '-')}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <span className="text-indigo-600 font-semibold hover:underline">상세보기</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
