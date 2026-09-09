'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, FileText, ChevronRight, Hash, Clock, CornerDownLeft } from 'lucide-react';
import { SEARCH_CLAUSE_RESULTS } from '../lib/mockData';

export default function GlobalSearchModal({ isOpen, onClose, documents, onSelectDoc }) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(['QM-01', '4.2.1', 'PR-03', 'A.5.15', 'WI-05']);

  // ESC 키 닫기 및 Cmd+K 바인딩
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle outside
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 문서 검색 결과
  const matchedDocs = documents.filter(d => {
    if (!query.trim()) return false;
    const q = query.toLowerCase();
    return d.title?.toLowerCase().includes(q) || 
           d.code?.toLowerCase().includes(q) || 
           d.clauseNumber?.toLowerCase().includes(q) ||
           d.summary?.toLowerCase().includes(q);
  });

  // 조항 검색 결과
  const matchedClauses = SEARCH_CLAUSE_RESULTS.filter(c => {
    if (!query.trim()) return false;
    const q = query.toLowerCase();
    return c.clauseId.toLowerCase().includes(q) || 
           c.title.toLowerCase().includes(q) || 
           c.snippet.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 p-4 animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-scale-up">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="문서 코드, 조항 번호, 문서명으로 검색하세요 (예: QM-01, 4.2.1, 절차서)"
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-white text-slate-400 rounded border border-slate-200 shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Modal Body: Left Guide + Right Results */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 flex-1 overflow-hidden">
          
          {/* Left Guide Panel (40%) */}
          <div className="md:col-span-5 p-4 bg-slate-50/40 overflow-y-auto space-y-4 text-xs">
            
            {/* Recent Searches */}
            <div>
              <div className="flex items-center justify-between font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">
                <span>최근 검색어</span>
                <button onClick={() => setRecentSearches([])} className="hover:text-slate-600 cursor-pointer">전체 삭제</button>
              </div>
              <div className="space-y-1">
                {recentSearches.map(item => (
                  <button
                    key={item}
                    onClick={() => setQuery(item)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-medium">{item}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                  </button>
                ))}
              </div>
            </div>

            {/* ISO 9001 Clause Guide (시안 13번 매핑) */}
            <div className="pt-3 border-t border-slate-200/70">
              <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">
                📖 ISO 9001 주요 조항 가이드
              </div>
              <div className="space-y-1">
                {[
                  { id: '4', name: '4. 조직의 상황', std: 'ISO 9001:2015' },
                  { id: '5', name: '5. 리더십', std: 'ISO 9001:2015' },
                  { id: '6', name: '6. 기획', std: 'ISO 9001:2015' },
                  { id: '7', name: '7. 지원', std: 'ISO 9001:2015' },
                  { id: '8', name: '8. 운용', std: 'ISO 9001:2015' },
                  { id: '9', name: '9. 성과평가', std: 'ISO 9001:2015' },
                  { id: '10', name: '10. 개선', std: 'ISO 9001:2015' },
                ].map(clause => (
                  <button
                    key={clause.id}
                    onClick={() => setQuery(clause.id)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-left transition-colors"
                  >
                    <span className="font-semibold">{clause.name}</span>
                    <span className="text-[10px] text-slate-400">{clause.std}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Results Panel (60%) */}
          <div className="md:col-span-7 p-4 overflow-y-auto space-y-4">
            
            {query.trim() ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-100">
                  <span>&quot;<b className="text-slate-900">{query}</b>&quot; 검색 결과</span>
                  <span>문서 {matchedDocs.length} · 조항 {matchedClauses.length}</span>
                </div>

                {/* Section 1: Documents */}
                {matchedDocs.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      📄 문서 결과 ({matchedDocs.length})
                    </div>
                    <div className="space-y-1.5">
                      {matchedDocs.map(doc => (
                        <div
                          key={`search-doc-${doc.id}`}
                          onClick={() => {
                            onSelectDoc(doc);
                            onClose();
                          }}
                          className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600">
                                <span className="font-mono text-blue-700 mr-1.5">[{doc.code}]</span>
                                {doc.title}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {doc.path} · {doc.revisionNo || doc.version}
                              </div>
                            </div>
                          </div>
                          <CornerDownLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Clauses */}
                {matchedClauses.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      📑 ISO 조항 및 본문 결과 ({matchedClauses.length})
                    </div>
                    <div className="space-y-1.5">
                      {matchedClauses.map(clause => {
                        const targetDoc = documents.find(d => 
                          (clause.docTitle && d.title?.includes(clause.docTitle)) ||
                          (d.clauseNumber && d.clauseNumber.includes(clause.clauseId)) ||
                          d.code === 'QM-01'
                        ) || documents[0];

                        return (
                          <div
                            key={`clause-${clause.clauseId}`}
                            onClick={() => {
                              if (targetDoc) {
                                onSelectDoc(targetDoc);
                                onClose();
                              }
                            }}
                            className="p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/40 bg-slate-50/60 space-y-1 cursor-pointer transition-all group"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900 font-mono text-blue-700 group-hover:text-blue-800">
                                § {clause.clauseId} {clause.title}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {clause.docTitle} ({clause.page}) · 열람 →
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed italic">
                              {clause.snippet}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {matchedDocs.length === 0 && matchedClauses.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400">
                    일치하는 문서나 규격 조항이 없습니다.
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-300" />
                <p>문서 코드(예: QM-01) 또는 조항 번호(예: 4.2.1)를 입력해 보세요.</p>
              </div>
            )}

          </div>

        </div>

        {/* Footer Shortcut Bar */}
        <div className="p-3 bg-slate-100/80 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span>↑↓ 이동</span>
            <span>Enter 선택</span>
            <span>Esc 닫기</span>
          </div>
          <span className="text-slate-400">isoedu Cloud Drive Search Engine</span>
        </div>

      </div>
    </div>
  );
}
