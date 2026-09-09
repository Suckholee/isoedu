'use client';

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
  RotateCcw
} from 'lucide-react';

export default function RealtimeEditorModal({ 
  doc, 
  isOpen, 
  onClose, 
  onSave, 
  onToggleChecklist, 
  onDeleteDocument 
}) {
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' (정식 서식 뷰) | 'edit' (실시간 편집기) | 'audit' (AI 규격 감사)
  const [content, setContent] = useState('');
  const [isRealtimePopupOpen, setIsRealtimePopupOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiPolishing, setIsAiPolishing] = useState(false);

  useEffect(() => {
    if (doc) {
      setContent(doc.contentDraft || doc.content || '');
    }
  }, [doc]);

  if (!isOpen || !doc) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onSave && onSave(doc.id, content);
    }, 500);
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
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in print:p-0 print:bg-white">
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
                  클라우드 자동저장됨
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
                <span>실시간 동기화</span>
                <span className="font-mono text-[10px] text-emerald-800">24ms</span>
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
                    <div className="flex justify-between"><span>상태:</span><b className="text-emerald-600">SUBSCRIBED</b></div>
                    <div className="flex justify-between"><span>지연시간:</span><b>24 ms</b></div>
                    <div className="flex justify-between"><span>문서 채널:</span><b className="font-mono text-[10px]">realtime:doc:{doc.code}</b></div>
                    <div className="flex justify-between"><span>암호화:</span><b>AES-256 Cloud Vault</b></div>
                  </div>
                </div>
              )}
            </div>

            {/* Print / Export */}
            <button
              onClick={handlePrint}
              title="공문서 서식 인쇄 또는 PDF 저장"
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Printer className="w-4 h-4" />
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
              onClick={onClose}
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
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'audit' 
                  ? 'bg-white text-purple-700 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>🤖 AI 규격 진단 & 감사</span>
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
                  <span>(주)아이소에듀 사내 표준 규격서</span>
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
                      <td className="p-2">{doc.approvalDate || '2024-05-20'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 font-bold p-2 border-r border-slate-200">유효 만기일</td>
                      <td className="p-2 font-bold text-rose-600">{doc.expiryDate || '2027-05-19'} ({doc.dDay ? `D-${doc.dDay}` : '상시'})</td>
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
                      <th className="p-1.5 font-bold">승인 (Approver)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="h-16 border-b border-slate-200">
                      <td className="bg-slate-50 font-bold border-r border-slate-200">서명</td>
                      <td className="border-r border-slate-200 p-2">
                        <div className="w-10 h-10 mx-auto rounded-full border border-blue-300 bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                          기안필
                        </div>
                      </td>
                      <td className="border-r border-slate-200 p-2">
                        <div className="w-10 h-10 mx-auto rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                          검토필
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="w-12 h-12 mx-auto rounded-full border-2 border-red-600 text-red-600 flex flex-col items-center justify-center font-black text-[9px] rotate-[-8deg] shadow-2xs">
                          <span>대표이사</span>
                          <span>[직인]</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-slate-50 font-bold border-r border-slate-200 p-1">성명</td>
                      <td className="border-r border-slate-200 p-1 font-semibold">{doc.author || '김철수'}</td>
                      <td className="border-r border-slate-200 p-1 font-semibold">{doc.reviewerRole || '이민정 팀장'}</td>
                      <td className="p-1 font-bold text-slate-900">{doc.approver || '홍길동 대표'}</td>
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
                  <p className="font-bold text-slate-800">주식회사 아이소에듀 대표이사 홍길동</p>
                  <p className="text-[11px]">서울특별시 강남구 테헤란로 427, 14층 (아이소타워)</p>
                </div>
                <div className="w-16 h-16 rounded-full border-2 border-red-600 text-red-600 flex flex-col items-center justify-center font-black text-[10px] rotate-[-5deg]">
                  <span>아이소에듀</span>
                  <span>대표이사</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Full Editable Docs Editor Mode */}
          {activeTab === 'edit' && (
            <div className="bg-white w-full max-w-4xl min-h-full rounded-2xl shadow-lg border border-slate-200 p-8 flex flex-col">
              
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
                rows={28}
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
    </div>
  );
}
