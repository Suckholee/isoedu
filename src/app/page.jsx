'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ExpiryRadarBanner from '../components/ExpiryRadarBanner';
import DocumentDashboard from '../components/DocumentDashboard';
import AIConsultantPanel from '../components/AIConsultantPanel';
import DocumentDetailModal from '../components/DocumentDetailModal';
import AddDocumentModal from '../components/AddDocumentModal';
import { INITIAL_COMPANIES, SEED_DOCUMENTS } from '../lib/mockData';
import { 
  getStoredDocuments, 
  saveStoredDocuments, 
  resetStoredDocuments, 
  supabase, 
  isSupabaseConfigured 
} from '../lib/supabaseClient';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [companies] = useState(INITIAL_COMPANIES);
  const [currentCompany, setCurrentCompany] = useState(INITIAL_COMPANIES[0]);
  const [documents, setDocuments] = useState([]);
  const [activeDetailDoc, setActiveDetailDoc] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  // 1. 초기 문서 로딩 (Supabase 또는 로컬 스토리지)
  useEffect(() => {
    async function loadDocuments() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            setDocuments(data);
            return;
          }
        } catch (e) {
          console.warn('Supabase fetch failed, falling back to local storage:', e);
        }
      }
      // 로컬 스토리지 또는 목 데이터 로드
      setDocuments(getStoredDocuments());
    }

    loadDocuments();
  }, []);

  // 2. 토스트 알림 헬퍼
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 3. AI 어시스턴트로부터 문서 세트 불러오기 (핵심 기능)
  const handleImportDocuments = (newDocs) => {
    setDocuments(prevDocs => {
      // 기존 문서 중 동일 코드가 있으면 업데이트, 없으면 추가
      const existingCodes = new Set(prevDocs.map(d => d.code));
      const freshDocs = newDocs.map((d, index) => ({
        ...d,
        id: d.id || `doc-ai-${Date.now()}-${index}`,
        companyId: currentCompany.id,
      }));

      // 겹치지 않는 문서들 필터링
      const toAdd = freshDocs.filter(d => !existingCodes.has(d.code));
      // 겹치는 문서들은 최신본으로 갱신
      const updatedExisting = prevDocs.map(d => {
        const found = freshDocs.find(f => f.code === d.code);
        return found ? { ...d, ...found } : d;
      });

      const merged = [...toAdd, ...updatedExisting];
      saveStoredDocuments(merged);
      return merged;
    });

    showToast(`🎉 AI 어시스턴트가 추천한 ${newDocs.length}종의 필수 규격 문서가 내 문서함에 체계적으로 반영되었습니다!`);
  };

  // 4. 체크리스트 토글 핸들러
  const handleToggleChecklist = (docId, checkIdx) => {
    setDocuments(prev => {
      const updated = prev.map(doc => {
        if (doc.id !== docId) return doc;
        const newChecklist = [...(doc.checklist || [])];
        if (newChecklist[checkIdx]) {
          newChecklist[checkIdx] = {
            ...newChecklist[checkIdx],
            done: !newChecklist[checkIdx].done
          };
        }
        return { ...doc, checklist: newChecklist };
      });
      saveStoredDocuments(updated);
      
      // 현재 모달창의 문서도 갱신
      if (activeDetailDoc && activeDetailDoc.id === docId) {
        const target = updated.find(d => d.id === docId);
        setActiveDetailDoc(target);
      }

      return updated;
    });
  };

  // 5. 문서 삭제 핸들러
  const handleDeleteDocument = (docId) => {
    setDocuments(prev => {
      const updated = prev.filter(d => d.id !== docId);
      saveStoredDocuments(updated);
      return updated;
    });
    showToast('문서가 정상적으로 삭제되었습니다.');
  };

  // 6. 새 문서 수동 추가 핸들러
  const handleAddDocument = (newDoc) => {
    setDocuments(prev => {
      const updated = [newDoc, ...prev];
      saveStoredDocuments(updated);
      return updated;
    });
    showToast(`신규 문서 [${newDoc.code} ${newDoc.title}]가 등록되었습니다.`);
  };

  // 7. 데이터 초기화
  const handleResetData = () => {
    if (confirm('모든 문서 데이터를 초기 데모 샘플 데이터로 복원하시겠습니까?')) {
      const reset = resetStoredDocuments();
      setDocuments(reset);
      setActiveStatusFilter('ALL');
      showToast('기본 샘플 데이터로 초기화되었습니다.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      
      {/* 1. Header */}
      <Header
        companies={companies}
        currentCompany={currentCompany}
        onSelectCompany={(comp) => {
          setCurrentCompany(comp);
          showToast(`관리 기업이 '${comp.name}'(으)로 전환되었습니다.`);
        }}
        onResetData={handleResetData}
        onAddNewDoc={() => setIsAddModalOpen(true)}
        documentCount={documents.length}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Urgent D-Day Expiry Radar Banner */}
        <ExpiryRadarBanner
          documents={documents}
          onFilterStatus={(status) => {
            setActiveStatusFilter(status);
            showToast(`상태 필터: '${status}' 적용됨`);
          }}
        />

        {/* 2-Column Split: [좌측 60%: 체계적 문서 정리 화면] vs [우측 40%: AI 어시스턴트 패널] */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: 1. 각 문서를 체계적으로 정리하는 화면 */}
          <section className="lg:col-span-7 xl:col-span-7 space-y-4">
            <DocumentDashboard
              documents={documents}
              onOpenDetail={(doc) => setActiveDetailDoc(doc)}
              onAddNewDoc={() => setIsAddModalOpen(true)}
              activeStatusFilter={activeStatusFilter}
              onClearStatusFilter={() => setActiveStatusFilter('ALL')}
            />
          </section>

          {/* Right Column: 2. AI 어시스턴트 대화 및 맞춤형 문서 자동 로더 */}
          <section className="lg:col-span-5 xl:col-span-5 sticky top-20">
            <AIConsultantPanel
              onImportDocuments={handleImportDocuments}
              currentCompany={currentCompany}
            />
          </section>

        </div>

      </main>

      {/* 3. Modals */}
      <DocumentDetailModal
        doc={activeDetailDoc}
        onClose={() => setActiveDetailDoc(null)}
        onToggleChecklist={handleToggleChecklist}
        onDeleteDocument={handleDeleteDocument}
      />

      <AddDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddDocument={handleAddDocument}
        currentCompany={currentCompany}
      />

      {/* 4. Real-time Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-scale-up">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 5. Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 text-center text-xs text-slate-400 bg-white">
        <p>© 2026 ISOEdu 인증 레이더 (Certification Radar) — 시연 및 강의 교육용 프로토타입</p>
        <p className="mt-1">GitHub, Supabase & Vercel Native Architecture</p>
      </footer>

    </div>
  );
}
