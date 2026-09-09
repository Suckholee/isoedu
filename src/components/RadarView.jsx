'use client';

import React from 'react';
import { Compass, AlertTriangle, TrendingUp, ShieldAlert, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { RADAR_RISK_METRICS } from '../lib/mockData';

export default function RadarView({ documents, onOpenDetail }) {
  const { categories, trend, maxScore, minScore } = RADAR_RISK_METRICS;

  // SVG Radar Polygon 계산 (오각형)
  // center: (150, 150), radius: 100
  const cx = 160;
  const cy = 160;
  const r = 110;
  const count = categories.length; // 5

  const getCoordinates = (index, value) => {
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
    const distance = (value / 100) * r;
    return {
      x: cx + distance * Math.cos(angle),
      y: cy + distance * Math.sin(angle)
    };
  };

  // 배경 3단계 다각형 (33%, 66%, 100%)
  const bgPolygons = [0.33, 0.66, 1.0].map(level => {
    return categories.map((_, i) => {
      const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
      const x = cx + r * level * Math.cos(angle);
      const y = cy + r * level * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  });

  // 실제 데이터 다각형 좌표 문자열
  const dataPolygon = categories.map((cat, i) => {
    const coord = getCoordinates(i, cat.score);
    return `${coord.x},${coord.y}`;
  }).join(' ');

  // 시급한 리스크 서류 목록
  const urgentDocs = documents
    .filter(d => d.dDay !== undefined && d.dDay <= 40)
    .sort((a, b) => (a.dDay ?? 999) - (b.dDay ?? 999));

  return (
    <div className="space-y-6">
      
      {/* 1. Header Metrics Banner (시안 6번 매핑) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>전체 관리 문서</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">📄</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">1,248<span className="text-xs font-normal text-slate-500 ml-1">개</span></div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> 전월 대비 8.3% ↑
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>30일 이내 만기</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">📅</span>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">128<span className="text-xs font-normal text-slate-500 ml-1">개</span></div>
          <div className="flex items-center gap-1 text-[11px] text-rose-600 font-bold mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> 전월 대비 15.7% ↑
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>고위험 규격 문서</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">🚨</span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">32<span className="text-xs font-normal text-slate-500 ml-1">개</span></div>
          <div className="flex items-center gap-1 text-[11px] text-rose-600 font-bold mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> 전월 대비 23.1% ↑
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>평균 리스크 지수</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">📈</span>
          </div>
          <div className="text-2xl font-black text-indigo-900 mt-2">57<span className="text-xs font-normal text-slate-500 ml-1">/ 100</span></div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> 전월 대비 6.5% ↓
          </div>
        </div>

      </div>

      {/* 2. Middle Row: Spider Radar Chart (Left) + Risk Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Spider Radar Chart (시안 6번 방사형 차트) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-rose-600" />
                카테고리별 만기 레이더 (Radar Risk Chart)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                규격 카테고리별 만기 임박도 및 법적 리스크 점수 방사형 분석
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              전체 회사
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            
            {/* SVG Radar */}
            <div className="relative w-[280px] h-[280px] shrink-0">
              <svg viewBox="0 0 320 320" className="w-full h-full">
                {/* Background Grid Polygons */}
                {bgPolygons.map((pts, i) => (
                  <polygon
                    key={`bg-poly-${i}`}
                    points={pts}
                    fill={i === 2 ? '#f8fafc' : 'none'}
                    stroke="#e2e8f0"
                    strokeWidth="1.5"
                    strokeDasharray={i < 2 ? '3 3' : 'none'}
                  />
                ))}

                {/* Grid Axis Lines */}
                {categories.map((_, i) => {
                  const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
                  const x = cx + r * Math.cos(angle);
                  const y = cy + r * Math.sin(angle);
                  return (
                    <line
                      key={`axis-${i}`}
                      x1={cx}
                      y1={cy}
                      x2={x}
                      y2={y}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Data Polygon */}
                <polygon
                  points={dataPolygon}
                  fill="rgba(59, 130, 246, 0.25)"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                />

                {/* Data Points */}
                {categories.map((cat, i) => {
                  const coord = getCoordinates(i, cat.score);
                  return (
                    <circle
                      key={`point-${i}`}
                      cx={coord.x}
                      cy={coord.y}
                      r="4.5"
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Labels */}
                {categories.map((cat, i) => {
                  const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
                  const labelDist = r + 24;
                  const lx = cx + labelDist * Math.cos(angle);
                  const ly = cy + labelDist * Math.sin(angle);
                  return (
                    <text
                      key={`label-${i}`}
                      x={lx}
                      y={ly + 4}
                      textAnchor="middle"
                      className="text-[11px] font-bold fill-slate-700"
                    >
                      {cat.label}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Score Legend List */}
            <div className="w-full sm:w-48 space-y-2 text-xs">
              <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] pb-1">
                카테고리별 리스크 점수
              </div>
              {categories.map((cat) => (
                <div key={cat.label} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-700">{cat.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{cat.score}점</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      cat.status === '고위험' 
                        ? 'bg-rose-100 text-rose-800' 
                        : cat.status === '위험' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {cat.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Right: Urgent Risk Document Table (시안 6번 리스크 분석) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                긴급 조치 대상 문서 리스트
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                D-Day 40일 이내 도래 문서 및 과태료 리스크 대상
              </p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
              총 {urgentDocs.length}건 시급
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">문서명</th>
                  <th className="py-2.5 px-2">만기일</th>
                  <th className="py-2.5 px-2 text-center">D-Day</th>
                  <th className="py-2.5 px-2 text-center">위험도</th>
                  <th className="py-2.5 px-2 text-right">조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {urgentDocs.map((doc) => (
                  <tr 
                    key={`urgent-${doc.id}`}
                    onClick={() => onOpenDetail(doc)}
                    className="hover:bg-rose-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 line-clamp-1">{doc.title}</div>
                      <div className="text-[10px] text-rose-600 line-clamp-1">{doc.penaltyRisk}</div>
                    </td>
                    <td className="py-3 px-2 font-mono text-slate-500 whitespace-nowrap">
                      {doc.expiryDate}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded font-black text-[11px] ${
                        doc.dDay <= 7 
                          ? 'bg-rose-600 text-white animate-pulse' 
                          : 'bg-amber-500 text-white'
                      }`}>
                        D-{doc.dDay}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {doc.dDay <= 7 ? 'Critical' : 'Warning'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetail(doc);
                        }}
                        className="text-blue-600 hover:underline font-bold text-xs whitespace-nowrap cursor-pointer"
                      >
                        검토 →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* 3. Bottom Trend Chart (시안 6번 리스크 트렌드) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              최근 30일 리스크 트렌드 시계열 추이
            </h4>
            <div className="text-xs text-slate-400">규격 이행 및 문서 갱신에 따른 전사 리스크 점수 변동 추이</div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400">최고 리스크:</span>{' '}
              <b className="text-rose-600">{maxScore} / 100</b>
            </div>
            <div>
              <span className="text-slate-400">최저 리스크:</span>{' '}
              <b className="text-emerald-600">{minScore} / 100</b>
            </div>
          </div>
        </div>

        {/* Mini SVG Trend Line */}
        <div className="h-28 w-full pt-4">
          <svg viewBox="0 0 600 80" className="w-full h-full overflow-visible">
            {/* Horizontal Grid lines */}
            <line x1="0" y1="20" x2="600" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="50" x2="600" y2="50" stroke="#f1f5f9" strokeWidth="1" />

            {/* Line Path */}
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              points="0,45 120,30 240,15 360,35 480,55 600,70"
            />

            {/* Data dots */}
            {[
              { cx: 0, cy: 45, label: '5/19 (58)' },
              { cx: 120, cy: 30, label: '5/23 (70)' },
              { cx: 240, cy: 15, label: '5/30 (78)', high: true },
              { cx: 360, cy: 35, label: '6/06 (64)' },
              { cx: 480, cy: 55, label: '6/13 (52)' },
              { cx: 600, cy: 70, label: '6/20 (42)', low: true },
            ].map((pt, i) => (
              <g key={i}>
                <circle cx={pt.cx} cy={pt.cy} r="4" fill={pt.high ? '#ef4444' : pt.low ? '#10b981' : '#2563eb'} />
                <text x={pt.cx} y={pt.cy - 8} textAnchor="middle" className="text-[10px] font-bold fill-slate-500">
                  {pt.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

    </div>
  );
}
