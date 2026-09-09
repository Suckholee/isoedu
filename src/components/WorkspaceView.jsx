'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  HardDrive, 
  RotateCcw, 
  Plus, 
  Download, 
  Search, 
  AlertOctagon, 
  CheckCircle2, 
  ShieldAlert,
  X,
  Sparkles
} from 'lucide-react';
import { WORKSPACES_DATA } from '../lib/mockData';

export default function WorkspaceView({ onResetData }) {
  const [workspaces, setWorkspaces] = useState(WORKSPACES_DATA);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Workspace form state
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [newWsQuota, setNewWsQuota] = useState('20.0 GB');

  const handleExecuteReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      onResetData && onResetData();
      setIsResetting(false);
      setIsResetModalOpen(false);
    }, 900);
  };

  const handleCreateWorkspace = (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-indigo-600', 'bg-purple-600', 'bg-amber-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const created = {
      id: `ws-${Date.now()}`,
      name: newWsName.trim(),
      desc: newWsDesc.trim() || '신규 프로젝트 팀 문서 보관함',
      members: 1,
      docCount: 0,
      storage: `0.1 / ${newWsQuota}`,
      status: '활성',
      createdAt: new Date().toISOString().split('T')[0],
      color: randomColor
    };

    setWorkspaces([...workspaces, created]);
    setNewWsName('');
    setNewWsDesc('');
    setIsCreateModalOpen(false);
    alert(`'${created.name}' 워크스페이스가 성공적으로 생성되었습니다.`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Top KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>전체 워크스페이스</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">🏢</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{workspaces.length}<span className="text-xs font-normal text-slate-500 ml-1">개</span></div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">활성 {workspaces.filter(w => w.status === '활성').length} · 비활성 {workspaces.filter(w => w.status !== '활성').length}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>총 구성원</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">👥</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">248<span className="text-xs font-normal text-slate-500 ml-1">명</span></div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">활성 구성원 기준</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>누적 문서 수</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">📑</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">1,432<span className="text-xs font-normal text-slate-500 ml-1">건</span></div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">전체 워크스페이스 합계</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>저장 용량 사용량</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">💾</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">245.6<span className="text-xs font-normal text-slate-500 ml-1">GB</span></div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">총 2,000 GB 중 12.0%</div>
        </div>

      </div>

      {/* 2. Workspace Management Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              워크스페이스 목록 및 스토리지 할당 현황
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              사내 각 부서 및 프로젝트별 격리된 클라우드 드라이브 관리
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>데모 데이터 초기화/복구</span>
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>워크스페이스 생성</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3">워크스페이스명</th>
                <th className="py-3 px-3">설명</th>
                <th className="py-3 px-3 text-center">구성원</th>
                <th className="py-3 px-3 text-center">문서 수</th>
                <th className="py-3 px-3">저장 용량</th>
                <th className="py-3 px-3 text-center">상태</th>
                <th className="py-3 px-3">생성일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {workspaces.map((ws) => (
                <tr key={ws.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs ${ws.color || 'bg-blue-600'}`}>
                        {ws.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{ws.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-500">
                    {ws.desc}
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                    {ws.members}명
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                    {ws.docCount}건
                  </td>
                  <td className="py-3.5 px-3 font-mono font-semibold text-slate-600">
                    {ws.storage}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ws.status === '활성' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {ws.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-400 font-mono">
                    {ws.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* 3. New Workspace Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>신규 워크스페이스 생성</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">워크스페이스 명 *</label>
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="예: 품질관리팀, 스마트팩토리 연구실"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">설명</label>
                <input
                  type="text"
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="예: 사내 ISO 9001 수검 및 업무 관리 전용"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">스토리지 할당 쿼터</label>
                <select
                  value={newWsQuota}
                  onChange={(e) => setNewWsQuota(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                >
                  <option value="10.0 GB">10.0 GB</option>
                  <option value="20.0 GB">20.0 GB</option>
                  <option value="50.0 GB">50.0 GB</option>
                  <option value="100.0 GB">100.0 GB</option>
                </select>
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  생성 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Demo Reset & Rollback Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">
                데모 데이터 초기화 및 롤백 (Reset)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                본 기능은 신규 워크스페이스 관리자를 위한 샌드박스 환경 기능입니다. 
                모든 변경 사항을 삭제하고 <b>표준 ISO 4계층 초기 시드 데이터</b>로 복구합니다.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleExecuteReset}
                disabled={isResetting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-1.5"
              >
                {isResetting ? (
                  <span>트랜잭션 복구 중...</span>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>초기 데이터로 복구</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
