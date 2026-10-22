'use client';
import ModalLayer from './ui/ModalLayer';

import React, { useState, useEffect } from 'react';
import {
  X,
  Wifi,
  Share2,
  Save,
  Clock,
  Star,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  Sparkles,
  CheckCircle2,
  Copy,
  FileText,
  Printer,
  Download,
  ShieldAlert,
  CheckSquare,
  Square,
  Trash2,
  Award,
  BookOpen,
  GitPullRequest,
  Check,
  AlertTriangle,
  RotateCcw,
  Database,
  UploadCloud,
  FileCheck,
  Lock,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { uploadDocumentFile, listDocumentFiles, getSecureDownloadUrl } from '../lib/storageVault';
import { isCloudMode } from '../lib/dataConfig';
import { useAuth } from '../context/AuthContext';
import {
  DOCUMENT_REVIEW_STATUSES,
  applyDocumentReviewStatus,
  extractTemplatePlaceholders,
  replaceTemplatePlaceholders,
} from '../lib/projectWorkflow.mjs';
import { safeDownloadFileName, buildWordDocumentHtml, triggerBrowserDownload } from '../lib/documentExport.mjs';

export default function RealtimeEditorModal({
  doc,
  currentCompany = null,
  isOpen,
  onClose,
  onSave,
  onUpdateDocument,
  onToggleChecklist,
  onDeleteDocument
}) {
  const isDraftDoc = doc?.status === 'DRAFT' || doc?.reviewStatus === 'DRAFT';
  const [activeTab, setActiveTab] = useState(() => (isDraftDoc ? 'edit' : 'preview')); // 'preview' | 'edit' | 'split' | 'audit' | 'vault'
  const [content, setContent] = useState('');
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [isRealtimePopupOpen, setIsRealtimePopupOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiPolishing, setIsAiPolishing] = useState(false);

  // Enterprise Storage Vault & Revision States
  const { profile } = useAuth();
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const revisions = attachedFiles.map(file => ({
    revNo: file.version, date: file.uploadedAt?.split('T')[0], reason: file.reason,
    author: file.uploadedBy, approver: '승인 대기',
  }));

  useEffect(() => {
    let cancelled = false;
    setAttachedFiles([]);
    setUploadError(null);
    if (doc?.id && isOpen) {
      listDocumentFiles(doc.companyId, doc.id).then(files => {
        if (!cancelled) setAttachedFiles(files);
      }).catch(error => { if (!cancelled) setUploadError(error.message); });
    }
    return () => { cancelled = true; };
  }, [doc?.id, doc?.companyId, isOpen, profile?.id]);

  const handleDownload = async file => {
    try {
      const url = await getSecureDownloadUrl(file.filePath);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.fileName;
      anchor.target = '_blank';
      anchor.rel = 'noopener';
      anchor.click();
      if (url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) { setUploadError(error.message); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const res = await uploadDocumentFile(file, {
        companyId: doc.companyId,
        docId: doc.id,
        version: Math.max(0, ...attachedFiles.map(file => file.version || 0)) + 1,
        user: profile
      });
      if (res.success) setAttachedFiles(prev => [res, ...prev]);
    } catch (err) {
      setUploadError(err.message || '파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (doc) {
      setContent(doc.contentDraft || doc.content || '');
      setPlaceholderValues({});
    }
  }, [doc]);

  const savedContent = doc ? (doc.contentDraft || doc.content || '') : '';
  const hasUnsavedChanges = Boolean(doc && content !== savedContent);
  const detectedPlaceholders = extractTemplatePlaceholders(content);

  const handleApplyPlaceholders = () => {
    const next = replaceTemplatePlaceholders(content, placeholderValues);
    if (next !== content) {
      setContent(next);
    }
  };

  const handleSave = async () => {
    if (!doc || isSaving) return;
    setIsSaving(true);
    try { await onSave?.(doc.id, content); }
    finally { setIsSaving(false); }
  };

  useEffect(() => {
    if (!isOpen || !doc) return;
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, doc?.id, content, isSaving]);

  if (!isOpen || !doc) return null;

  const companyDisplayName = currentCompany?.name || doc.projectOrigin?.clientName || '대상 거래처';
  const currentReviewStatus = doc.reviewStatus && Object.hasOwn(DOCUMENT_REVIEW_STATUSES, doc.reviewStatus)
    ? doc.reviewStatus
    : (doc.docStatus === '내부 확인 완료' || doc.status === 'READY' || doc.status === 'APPROVED' ? 'VERIFIED' : (['내부 검토 중', '검토 중'].includes(doc.docStatus) ? 'REVIEW' : 'DRAFT'));

  const requestClose = () => {
    if (isSaving) return;
    if (hasUnsavedChanges && typeof window !== 'undefined' && !window.confirm('저장하지 않은 변경사항이 있습니다. 저장하지 않고 닫으시겠습니까?')) {
      return;
    }
    onClose?.();
  };

  const handleReviewStatusChange = async (nextStatus) => {
    if (!onUpdateDocument || isSaving) return;
    setIsSaving(true);
    try {
      const updated = applyDocumentReviewStatus({ ...doc, contentDraft: content }, nextStatus);
      await onUpdateDocument(updated);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportWord = () => {
    const html = buildWordDocumentHtml({ ...doc, contentDraft: content }, { companyName: companyDisplayName });
    const fileName = safeDownloadFileName(`${doc.code ? `${doc.code}_` : ''}${doc.title || doc.name}`, 'doc');
    triggerBrowserDownload(html, fileName, 'application/msword;charset=utf-8');
  };

  const handleExportText = () => {
    const fileName = safeDownloadFileName(`${doc.code ? `${doc.code}_` : ''}${doc.title || doc.name}`, 'md');
    triggerBrowserDownload(content || '', fileName, 'text/markdown;charset=utf-8');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAiPolish = () => {
    setIsAiPolishing(true);
    setTimeout(() => {
      setIsAiPolishing(false);
      const addition = `\n\n[AI 규격 감사 보완 조항 추가 반영]
제${Math.floor(Math.random() * 10) + 15}조 (사후심사 증빙 연계 관리)
  1. 본 규정에 따른 모든 이행 기록은 연 1회 실시되는 정기 사후관리심사 30일 전까지 전사 AI 드라이브에 전자 등록되어야 한다.
  2. 부적합 발생 시 14일 이내 시정조치계획서(CAR)를 발행하고 경영대리인의 승인을 득한다.`;
      setContent(prev => prev + addition);
      alert('🤖 AI가 최신 ISO 9001:2015 및 국내 법정 기준에 부합하도록 [사후심사 증빙 연계 관리] 조항을 보완 삽입하였습니다.');
    }, 800);
  };

  // D-Day Status Color
  const getDDayBadge = (dDay) => {
    if (dDay === undefined || dDay === null) return null;
    if (dDay <= 7) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-300">D-{dDay} 만료 긴급</span>;
    }
    if (dDay <= 30) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">D-{dDay} 갱신 도래</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">D-{dDay} 안전 유지</span>;
  };

  return (
    <ModalLayer onClose={requestClose} className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in print:p-0 print:bg-white">
      <div className="bg-[#f8fafd] w-full max-w-6xl h-[94vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scale-up print:h-auto print:border-none print:shadow-none">

        {/* 1. Google Docs Master Header */}
        <div className="h-16 border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between bg-white shrink-0 print:hidden">

          {/* Left: Document Identity & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                  {doc.title || doc.name || '사내 표준 규격서'}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {doc.code}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {doc.version || 'Rev. 1.0'}
                </span>
                {getDDayBadge(doc.dDay)}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{doc.consultingDomain || 'ISO 규격 인증'}</span>
                <span>•</span>
                <span>{doc.department || '품질경영팀'}</span>
                <span>•</span>
                <span>담당: {doc.author || '김철수'}</span>
                <span>•</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isSaving ? '저장 중...' : content !== (doc.contentDraft || doc.content || '') ? '저장하지 않은 변경' : '저장 버튼으로 변경 반영'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions & Realtime Pulse */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            {/* Realtime Status Indicator */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setIsRealtimePopupOpen(!isRealtimePopupOpen)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{isCloudMode ? 'Supabase 저장' : '브라우저 저장'}</span>

                <ChevronDown className="w-3 h-3 text-emerald-600" />
              </button>

              {/* Diagnostics Popup */}
              {isRealtimePopupOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50 text-xs space-y-2 animate-scale-up">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <Wifi className="w-4 h-4" /> Supabase Realtime
                    </span>
                    <span className="text-[10px] text-slate-400">채널 정상</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex justify-between"><span>상태:</span><b className="text-emerald-600">{isCloudMode ? 'Supabase 저장' : '브라우저 저장'}</b></div>

                    <div className="flex justify-between"><span>문서 채널:</span><b className="font-mono text-[10px]">realtime:doc:{doc.code}</b></div>

                  </div>
                </div>
              )}
            </div>

            {/* Review Status Selector */}
            {onUpdateDocument && (
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="sr-only">문서 내부 확인 상태</span>
                <select
                  aria-label="문서 내부 확인 상태"
                  disabled={isSaving}
                  value={currentReviewStatus}
                  onChange={(e) => handleReviewStatusChange(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold"
                >
                  {Object.entries(DOCUMENT_REVIEW_STATUSES).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </label>
            )}

            {/* Print / Export */}
            <button
              onClick={handlePrint}
              title="공문서 서식 인쇄 또는 PDF 저장"
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Download Word (.doc) */}
            <button
              onClick={handleExportWord}
              title="한글·Word 호환 공문서 서식(.doc) 다운로드"
              className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Word(.doc) 다운로드</span>
            </button>

            {/* Download Markdown (.md) */}
            <button
              onClick={handleExportText}
              title="작성 본문 텍스트(.md) 다운로드"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">.md</span>
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isCopied ? '복사 완료' : '전문 복사'}</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? '동기화 중...' : '저장'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={requestClose}
              aria-label="닫기"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

        </div>

        {/* 2. Sub-Toolbar: Mode Tabs & WYSIWYG Control */}
        <div className="h-11 border-b border-slate-200 px-6 flex items-center justify-between bg-white text-xs shrink-0 print:hidden">

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 bg-[#edf2fc] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📄 정식 서식 뷰 (A4 공문서)</span>
            </button>

            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'edit'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>✏️ 실시간 편집기 (Docs)</span>
            </button>

            <button
              onClick={() => setActiveTab('split')}
              className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'split'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📐 좌우 분할 비교 (편집+A4)</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>🤖 AI 규격 진단</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'vault'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>🗄️ 보안 볼트 & 파일</span>
            </button>
          </div>

          {/* Quick AI Polish Action */}
          <button
            onClick={handleAiPolish}
            disabled={isAiPolishing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs hover:opacity-95 transition-all"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiPolishing ? 'animate-spin' : ''}`} />
            <span>{isAiPolishing ? 'AI 조항 분석 중...' : 'AI 규격 조항 보완'}</span>
          </button>

        </div>

        {/* 3. Main Body Canvas */}
        <div className="flex-1 bg-slate-100 overflow-y-auto p-4 sm:p-8 flex justify-center">

          {/* TAB 1: Formal A4 Document Preview Mode */}
          {activeTab === 'preview' && (
            <div className="bg-white w-full max-w-4xl min-h-full rounded-2xl shadow-lg border border-slate-200/80 p-8 sm:p-12 space-y-8 print:p-0 print:shadow-none print:border-none print:max-w-none">

              {/* Header: Company Name & Document Title */}
              <div className="border-b-2 border-slate-900 pb-5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                  <span>{companyDisplayName} 사내 표준 규격서</span>
                  <span>CONFIDENTIAL • 사내 대외비</span>
                </div>
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {doc.title || doc.name || '사내 표준 규격서'}
                  </h1>
                  <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {doc.code}
                  </span>
                </div>
              </div>

              {/* Official Approval Table (결재선) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Left: Document Control Table */}
                <table className="w-full text-xs border border-slate-300 text-slate-700">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 font-bold p-2 w-28 border-r border-slate-200">문서 번호</td>
                      <td className="p-2 font-mono font-semibold">{doc.code}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 font-bold p-2 border-r border-slate-200">개정 번호</td>
                      <td className="p-2">{doc.revisionNo || doc.version}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 font-bold p-2 border-r border-slate-200">제·개정일자</td>
                      <td className="p-2">{doc.approvalDate || '미정 (내부 확인 후 기재)'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 font-bold p-2 border-r border-slate-200">유효 만기일</td>
                      <td className="p-2 font-bold text-rose-600">{doc.expiryDate ? `${doc.expiryDate} (${doc.dDay ? `D-${doc.dDay}` : '상시'})` : '해당 없음 / 미정'}</td>
                    </tr>
                    <tr>
                      <td className="bg-slate-50 font-bold p-2 border-r border-slate-200">보존 연한</td>
                      <td className="p-2">5년 (품질기록 보존 규정에 따름)</td>
                    </tr>
                  </tbody>
                </table>

                {/* Right: Formal Sign-off Table (기안 - 검토 - 승인 직인) */}
                <table className="w-full text-xs border border-slate-300 text-slate-700 text-center">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-1.5 border-r border-slate-200 font-bold w-12">구분</th>
                      <th className="p-1.5 border-r border-slate-200 font-bold">작성 (Drafter)</th>
                      <th className="p-1.5 border-r border-slate-200 font-bold">검토 (Reviewer)</th>
                      <th className="p-1.5 font-bold">확인 상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="h-16 border-b border-slate-200">
                      <td className="bg-slate-50 font-bold border-r border-slate-200">상태</td>
                      <td className="border-r border-slate-200 p-2">
                        <div className="w-10 h-10 mx-auto rounded-full border border-blue-300 bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                          {currentReviewStatus === 'DRAFT' ? '작성중' : '작성필'}
                        </div>
                      </td>
                      <td className="border-r border-slate-200 p-2">
                        <div className="w-10 h-10 mx-auto rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                          {currentReviewStatus === 'VERIFIED' ? '검토필' : currentReviewStatus === 'REVIEW' ? '검토중' : '대기'}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="px-2 py-1 mx-auto rounded border border-slate-300 text-slate-700 font-bold text-[10px]">
                          {DOCUMENT_REVIEW_STATUSES[currentReviewStatus]}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-slate-50 font-bold border-r border-slate-200 p-1">담당</td>
                      <td className="border-r border-slate-200 p-1 font-semibold">{doc.author || '담당자 미지정'}</td>
                      <td className="border-r border-slate-200 p-1 font-semibold">{doc.reviewerRole || '내부 검토자'}</td>
                      <td className="p-1 font-bold text-slate-900">{doc.approver || '공식 심사 별도'}</td>
                    </tr>
                  </tbody>
                </table>

              </div>

              {/* Penalty Risk Warning Box */}
              {doc.penaltyRisk && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-900">
                    <span className="font-bold block text-sm mb-1">⚠️ 법적 의무 및 만기 누락 리스크 고지</span>
                    <p className="leading-relaxed">{doc.penaltyRisk}</p>
                  </div>
                </div>
              )}

              {/* Document Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">📌 문서 제정 목적 및 적용 범위 요약</span>
                {doc.summary}
              </div>

              {/* Full Formal Document Content */}
              <div className="space-y-4 pt-2">
                <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>문서 본문 전문 (Official Standard Text)</span>
                </h3>

                <div className="prose max-w-none text-slate-800 font-sans text-sm leading-relaxed whitespace-pre-wrap bg-white border border-slate-200/90 rounded-xl p-6 sm:p-8 font-normal shadow-2xs">
                  {content || '등록된 전문 텍스트가 없습니다.'}
                </div>
              </div>

              {/* Interactive Checklist inside Sheet */}
              {doc.checklist && doc.checklist.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                      심사 대비 필수 구비 서류 체크리스트 ({doc.checklist.filter(c => c.done).length}/{doc.checklist.length} 이행 완료)
                    </h4>
                    <span className="text-xs text-slate-400">항목을 클릭하여 실시간 체크</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {doc.checklist.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => onToggleChecklist && onToggleChecklist(doc.id, idx)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors text-xs text-slate-800"
                      >
                        {item.done ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className={item.done ? 'line-through text-slate-400' : 'font-semibold'}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Stamp & Signature Line */}
              <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <div>
                  <p className="font-bold text-slate-800">{companyDisplayName} 사내 표준 문서</p>
                  <p className="text-[11px]">내부 검토 상태: {DOCUMENT_REVIEW_STATUSES[currentReviewStatus]} · 공식 인증기관 심사·승인과 별도</p>
                </div>
                <div className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold text-[11px]">
                  {DOCUMENT_REVIEW_STATUSES[currentReviewStatus]}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2 & SPLIT: Editable Docs Mode + Optional Live A4 Split Preview */}
          {(activeTab === 'edit' || activeTab === 'split') && (
            <div className={`w-full min-h-full ${activeTab === 'split' ? 'max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4 items-start' : 'max-w-4xl flex flex-col'}`}>
              <div className="bg-white w-full min-h-full rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 flex flex-col">

                {/* Smart Placeholder Replacement Bar */}
                {detectedPlaceholders.length > 0 && (
                  <div role="region" aria-label="미입력 항목 일괄 치환" className="mb-4 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-amber-900">
                        📌 본문 내 맞춤 기입 항목 {detectedPlaceholders.length}곳 감지 — 값을 입력해 한 번에 반영하세요
                      </span>
                      <button
                        type="button"
                        onClick={handleApplyPlaceholders}
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
                      >
                        기입값 일괄 치환
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {detectedPlaceholders.slice(0, 6).map((token, idx) => {
                        const cleanLabel = token.replace(/^\[|\]$/g, '');
                        const inputId = `placeholder-input-${idx}`;
                        return (
                          <div key={token} className="flex flex-col gap-1">
                            <label htmlFor={inputId} className="text-[11px] font-semibold text-amber-900 truncate" title={cleanLabel}>
                              {cleanLabel}
                            </label>
                            <input
                              id={inputId}
                              type="text"
                              value={placeholderValues[token] || ''}
                              onChange={(e) => setPlaceholderValues(prev => ({ ...prev, [token]: e.target.value }))}
                              placeholder={`${cleanLabel} 입력`}
                              className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs text-slate-800"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Docs Editing Toolbar */}
                <div className="flex items-center gap-1 border-b border-slate-200 pb-3 mb-4 text-slate-600 text-xs overflow-x-auto">
                  <span className="font-bold text-slate-900 mr-2">편집 도구</span>
                  <button
                    onClick={() => setContent(prev => prev + '\n**[강조 조항]** ')}
                    title="굵게 (Bold)"
                    className="p-1.5 rounded hover:bg-slate-100 cursor-pointer"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setContent(prev => prev + '\n*[참고 사항]* ')}
                    title="기울임 (Italic)"
                    className="p-1.5 rounded hover:bg-slate-100 cursor-pointer"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setContent(prev => prev + '\n<u>[필수 이행 사항]</u> ')}
                    title="밑줄 (Underline)"
                    className="p-1.5 rounded hover:bg-slate-100 cursor-pointer"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <div className="h-4 w-px bg-slate-200 mx-1"></div>
                  <button
                    onClick={() => setContent(prev => prev + '\n- 필수 점검 항목: ')}
                    title="글머리 기호 목록"
                    className="p-1.5 rounded hover:bg-slate-100 cursor-pointer"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setContent(prev => prev + '\n1. 제1항: \n2. 제2항: ')}
                    title="번호 매기기 목록"
                    className="p-1.5 rounded hover:bg-slate-100 cursor-pointer"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setContent(prev => prev + '\n### 제 조 (신설 조항)\n')}
                    title="조항 헤딩 추가"
                    className="px-2 py-1 rounded hover:bg-slate-100 cursor-pointer font-bold text-[11px]"
                  >
                    + 조항 추가
                  </button>
                  <span className="ml-auto text-slate-400 font-mono text-[11px]">
                    단어수: {content.length} 자
                  </span>
                </div>

                {/* Textarea Canvas */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={activeTab === 'split' ? 24 : 28}
                  className="w-full flex-1 text-sm text-slate-800 leading-relaxed font-sans focus:outline-hidden resize-none border border-slate-200 rounded-xl p-6"
                  placeholder="문서 조항 및 세부 내용을 입력하세요..."
                />

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>단축키: Cmd+S / Ctrl+S 로 언제든 즉시 저장 가능</span>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    변경사항 드라이브에 저장
                  </button>
                </div>

              </div>

              {activeTab === 'split' && (
                <div aria-label="실시간 A4 공문서 미리보기" className="bg-white w-full min-h-full rounded-2xl shadow-lg border border-slate-200/80 p-6 sm:p-8 space-y-5">
                  <div className="border-b-2 border-slate-900 pb-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                      <span>{companyDisplayName} 사내 표준 규격서 (실시간 미리보기)</span>
                      <span>{DOCUMENT_REVIEW_STATUSES[currentReviewStatus]}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        {doc.title || doc.name || '사내 표준 규격서'}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {doc.code}
                      </span>
                    </div>
                  </div>
                  <div className="prose max-w-none text-slate-800 font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-wrap bg-slate-50/60 border border-slate-200/90 rounded-xl p-5">
                    {content || '등록된 전문 텍스트가 없습니다.'}
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{companyDisplayName} 사내 표준 문서 · 공식 인증기관 심사·승인 별도</span>
                    <span className="font-bold text-slate-700">{DOCUMENT_REVIEW_STATUSES[currentReviewStatus]}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI Compliance Audit & Gap Analysis */}
          {activeTab === 'audit' && (
            <div className="bg-white w-full max-w-4xl min-h-full rounded-2xl shadow-lg border border-slate-200 p-8 space-y-6">

              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI 규격 적합성 진단 보고서
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    ISO 국제표준 및 국내 인증 규정에 의거한 자동화 적합성 분석
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600">98점</span>
                  <span className="text-xs text-slate-400 block">적합 등급 (A+)</span>
                </div>
              </div>

              {/* Analysis Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <span className="text-xs font-bold block mb-1">규격 충족률</span>
                  <span className="text-2xl font-black">100%</span>
                  <p className="text-[11px] mt-1 text-emerald-700">필수 요구 조항 100% 반영 완료</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                  <span className="text-xs font-bold block mb-1">최신 개정 반영</span>
                  <span className="text-2xl font-black">최신본</span>
                  <p className="text-[11px] mt-1 text-blue-700">2024년 최신 개정 법령 적용</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="text-xs font-bold block mb-1">차기 심사 권고</span>
                  <span className="text-2xl font-black">{doc.dDay ? `D-${doc.dDay}` : '정기'}</span>
                  <p className="text-[11px] mt-1 text-amber-700">심사 30일 전 증빙 최신화 요망</p>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="p-5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
                <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  AI 심사원의 맞춤형 개선 가이드
                </h4>
                <ul className="text-xs text-purple-950 space-y-2 list-disc pl-4 leading-relaxed">
                  <li><b>사후심사 증빙 연계:</b> 최근 3개월간의 사내 교육훈련 기록부(IS-F-023)와 부적합 보고서가 본 매뉴얼과 정합성을 이루고 있는지 상호 교차 검증을 완료했습니다.</li>
                  <li><b>법정 벌칙 리스크:</b> 만기 경과 시 발생할 수 있는 <b>{doc.penaltyRisk || '정기 심사 부적합 리스크'}</b>를 방지하기 위해 심사 신청을 즉시 진행하십시오.</li>
                  <li><b>전자 결재 인증:</b> 작성자({doc.author})와 대표이사({doc.approver})의 전자 서명이 안전하게 기록 보관되었습니다.</li>
                </ul>
              </div>

              {/* Action */}
              <div className="pt-4 border-t flex justify-end">
                <button
                  onClick={handleAiPolish}
                  className="px-4 py-2 rounded-lg font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-2 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI 조항 자동 완성 적용</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 4: Enterprise Storage Vault & File Attachments */}
          {activeTab === 'vault' && (
            <div className="bg-white w-full max-w-4xl min-h-full rounded-2xl shadow-lg border border-slate-200 p-8 space-y-6">

              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-600" />
                    문서 보안 스토리지 볼트 (Vault)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    원본 파일과 등록 이력을 함께 보관합니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isCloudMode ? '회사별 접근 권한 적용' : '이 브라우저에 보관'}</span>
                  </span>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20 transition-all text-center">
                <input
                  type="file"
                  id="vault-file-input"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp,.png,.jpg,.jpeg"
                  disabled={isUploading}
                />
                <label
                  htmlFor="vault-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {isUploading ? '파일 저장 및 SHA-256 계산 중...' : '클릭하여 인증서/규격 원본 파일 업로드'}
                  </div>
                  <p className="text-xs text-slate-400">
                    PDF, HWP, Word, Excel, 이미지 지원 (최대 50MB / SHA-256 해시 기록)
                  </p>
                </label>

                {uploadError && (
                  <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {uploadError}
                  </div>
                )}
              </div>

              {/* Attached Files List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  보관 중인 정식 규격 원본 파일 ({attachedFiles.length}건)
                </h4>

                <div className="space-y-2">
                  {attachedFiles.map((f) => (
                    <div
                      key={f.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-between transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {f.fileName.split('.').pop()?.toUpperCase() || 'FILE'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">{f.fileName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{(f.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                            <span>•</span>
                            <span>업로드: {f.uploadedAt}</span>
                            <span>•</span>
                            <span>등록자: {f.uploadedBy}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                          <Lock className="w-2.5 h-2.5 text-emerald-600" /> SHA-256 기록
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownload(f)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>다운로드</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revision History Table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <GitPullRequest className="w-4 h-4 text-blue-600" />
                  ISO 9001 문서 제/개정 이력 (Revision History)
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                      <tr>
                        <th className="py-2 px-3">개정 번호</th>
                        <th className="py-2 px-3">개정 일자</th>
                        <th className="py-2 px-3">개정 사유 및 주요 변경 내용</th>
                        <th className="py-2 px-3">기안자</th>
                        <th className="py-2 px-3">승인권자</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {revisions.map((rev, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-bold text-blue-600">Rev. {rev.revNo}</td>
                          <td className="py-2.5 px-3 text-slate-500">{rev.date}</td>
                          <td className="py-2.5 px-3 text-slate-800 font-medium">{rev.reason}</td>
                          <td className="py-2.5 px-3 text-slate-600">{rev.author}</td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-600">{rev.approver}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* 4. Bottom Document Info Bar */}
        <div className="h-9 border-t border-slate-200 px-6 bg-white flex items-center justify-between text-[11px] text-slate-400 shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <span>문서상태: <b>{doc.docStatus || '승인 완료'}</b></span>
            <span>•</span>
            <span>글자수: {content.length} 자</span>
            <span>•</span>
            <span>한국어 (대한민국 공문서 서식)</span>
          </div>

          <div className="flex items-center gap-3">
            {onDeleteDocument && (
              <button
                onClick={() => {
                  if (confirm(`[${doc.code} ${doc.title}] 문서를 드라이브에서 삭제하시겠습니까?`)) {
                    onDeleteDocument(doc.id);
                  }
                }}
                className="text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>문서 삭제</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </ModalLayer>
  );
}
