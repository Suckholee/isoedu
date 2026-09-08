'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  FileCheck, 
  ArrowRight, 
  Layers, 
  Clock, 
  AlertCircle,
  HelpCircle,
  FolderDown
} from 'lucide-react';
import { DEMO_SCENARIOS } from '../lib/mockData';

export default function AIConsultantPanel({ onImportDocuments, currentCompany }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `안녕하세요! **인증 레이더 AI 어시스턴트**입니다. 🤖\n\n귀사의 **업종, 업력, 당면 목표(조달청 공공입찰, 투자 유치, 대기업 납품 등)**를 말씀해주시면, 국제표준 및 법정 기준에 맞춘 **필수 문서 패키지(매뉴얼, 절차서, 점검표)**를 즉시 진단하고 문서함에 자동으로 불러와 드립니다.\n\n아래 **시연 시나리오**를 클릭하시거나 직접 질문을 입력해보세요!`,
      scenarios: DEMO_SCENARIOS,
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [importedIds, setImportedIds] = useState(new Set());
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // 시연용 프리셋 클릭 처리
  const handleSelectScenario = (scenario) => {
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: scenario.prompt,
      tag: scenario.tag
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    setTimeout(() => {
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: scenario.responseAnalysis,
        recommendedDocs: scenario.recommendedDocs,
        scenarioId: scenario.id
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsThinking(false);
    }, 600);
  };

  // 일반 텍스트 질문 처리
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;

    const query = inputText.trim();
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    // AI 질문 분석 및 상황 매칭 시뮬레이션
    setTimeout(() => {
      let matchedScenario = DEMO_SCENARIOS.find(s => 
        query.includes('제조') || query.includes('조달') || query.includes('9001') || query.includes('14001')
      );

      if (query.includes('SaaS') || query.includes('보안') || query.includes('IT') || query.includes('27001') || query.includes('투자')) {
        matchedScenario = DEMO_SCENARIOS[1];
      } else if (query.includes('식품') || query.includes('HACCP') || query.includes('위생') || query.includes('22000')) {
        matchedScenario = DEMO_SCENARIOS[2];
      } else if (query.includes('만기') || query.includes('과태료') || query.includes('갱신') || query.includes('리스크')) {
        matchedScenario = DEMO_SCENARIOS[3];
      } else if (!matchedScenario) {
        matchedScenario = DEMO_SCENARIOS[0];
      }

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `**[${currentCompany.name} 맞춤형 컨설팅 진단]**\n입력해주신 질의(\"${query}\")를 바탕으로 규격 요구사항과 최신 심사 기준을 분석했습니다.\n\n` + matchedScenario.responseAnalysis,
        recommendedDocs: matchedScenario.recommendedDocs,
        scenarioId: matchedScenario.id
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsThinking(false);
    }, 800);
  };

  // 문서 세트 메인 화면으로 임포트
  const handleImportToBoard = (msgId, docs) => {
    if (!docs || docs.length === 0) return;
    setImportingId(msgId);

    setTimeout(() => {
      onImportDocuments(docs);
      setImportingId(null);
      setImportedIds(prev => new Set([...prev, msgId]));
    }, 700);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[750px] overflow-hidden">
      
      {/* 1. Panel Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                인증 컨설팅 AI 어시스턴트
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded-full">
                실시간 분석중
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              상황에 맞춘 필수 규격 문서 패키지 자동 호출
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-mono">
            Vercel AI Edge Engine
          </span>
        </div>
      </div>

      {/* 2. Chat Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Message Bubble */}
            <div
              className={`max-w-[92%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-sm rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tl-none'
              }`}
            >
              {msg.tag && (
                <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-700/80 text-indigo-100 mb-1.5">
                  {msg.tag}
                </span>
              )}

              {/* Formatted Text */}
              <div className="whitespace-pre-wrap space-y-2">
                {msg.text}
              </div>

              {/* Scenario Preset Chips (Welcome Message) */}
              {msg.scenarios && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    시연용 4대 즉시 실행 프리셋 (클릭 시 자동 분석):
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {msg.scenarios.map((sc) => (
                      <button
                        key={sc.id}
                        onClick={() => handleSelectScenario(sc)}
                        className="text-left p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 transition-all text-xs group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 group-hover:text-indigo-700">
                            {sc.title}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${sc.badgeColor}`}>
                            {sc.tag}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Docs Action Box (AI Recommendation) */}
              {msg.recommendedDocs && (
                <div className="mt-4 pt-3.5 border-t border-slate-100 bg-slate-50/90 rounded-xl p-3 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      추천 필수 문서 세트 ({msg.recommendedDocs.length}종)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ISO/법정 표준 규격 매핑
                    </span>
                  </div>

                  {/* List of recommended docs */}
                  <div className="space-y-1.5 mb-3">
                    {msg.recommendedDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-mono font-bold text-indigo-600 shrink-0 text-[11px]">
                            {doc.code}
                          </span>
                          <span className="font-medium text-slate-800 truncate">
                            {doc.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          {doc.hierarchyLevel}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* The Core Feature Action: Import to Document List */}
                  <div className="pt-2 border-t border-slate-200">
                    {importedIds.has(msg.id) ? (
                      <div className="w-full py-2 px-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>좌측 문서함에 반영 완료! (총 {msg.recommendedDocs.length}건 추가됨)</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleImportToBoard(msg.id, msg.recommendedDocs)}
                        disabled={importingId === msg.id}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        {importingId === msg.id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>문서함에 규격 세트 불러오는 중...</span>
                          </>
                        ) : (
                          <>
                            <FolderDown className="w-4 h-4" />
                            <span>📦 이 문서 세트를 내 문서함에 불러오기</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        ))}

        {/* Thinking Spinner */}
        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
            <span>기업 상황 분석 및 규격 문서 패키지 조합 중...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="예: 제조업 공공입찰용 ISO 9001 절차서 불러와줘..."
          className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isThinking}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white transition-colors shrink-0 shadow-sm"
          title="질문 전송"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
