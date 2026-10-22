'use client';

import React, { useMemo, useState } from 'react';
import {
  Compass,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Clock,
  FileText,
  Calendar,
  Search,
  RotateCcw,
  Plus,
  ExternalLink,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { RADAR_RISK_METRICS } from '../lib/mockData';
import { ISO_STANDARDS_INFO } from '../lib/isoRequirementsData';

function parseDateValue(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function computeDDayFromToday(dateStr) {
  const target = parseDateValue(dateStr);
  if (!target) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function addMonthsIso(dateStr, months) {
  const base = parseDateValue(dateStr);
  if (!base) return '미정';
  const next = new Date(base.getTime());
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
}

export default function RadarView({
  documents = [],
  projects = [],
  currentCompany = null,
  companies = [],
  onSelectCompany,
  onSelectProject,
  onCreateProject,
  onOpenDetail,
}) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [standardFilter, setStandardFilter] = useState('ALL');
  const [cycleFilter, setCycleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cycleOverrides, setCycleOverrides] = useState({});
  const [showRadarChart, setShowRadarChart] = useState(false);

  const scopedProjects = useMemo(
    () => (currentCompany ? projects.filter((p) => p.companyId === currentCompany.id) : projects),
    [projects, currentCompany]
  );

  // Build unified validity & risk rows from projects and documents (PPT S26 & S29)
  const riskRows = useMemo(() => {
    const rows = [];

    for (const proj of scopedProjects) {
      const stdList = Array.isArray(proj.standards) && proj.standards.length
        ? proj.standards
        : proj.standard
        ? [proj.standard]
        : ['ISO 9001'];
      const targetDate = proj.targetDate || proj.auditDate || '';
      const dDay = computeDDayFromToday(targetDate);
      const defaultCycle = proj.projectType === 'ISO' ? '1년' : '3년';
      const cycle = cycleOverrides[`proj-${proj.id}`] || defaultCycle;
      const nextReviewDate = targetDate
        ? addMonthsIso(targetDate, cycle === '1년' ? 12 : cycle === '2년' ? 24 : 36)
        : '목표일 설정 필요';

      let riskState = 'NORMAL';
      let badgeLabel = '정상';
      if (!targetDate) {
        riskState = 'WARNING';
        badgeLabel = '일정 미지정';
      } else if (dDay !== null && dDay < 0) {
        riskState = 'EXPIRED';
        badgeLabel = `기한 경과 (D+${Math.abs(dDay)})`;
      } else if (dDay !== null && dDay <= 30) {
        riskState = 'WARNING';
        badgeLabel = `임박 (D-${dDay})`;
      } else if (dDay !== null) {
        riskState = 'NORMAL';
        badgeLabel = `정상 (D-${dDay})`;
      }

      rows.push({
        id: `proj-${proj.id}`,
        kind: 'PROJECT',
        title: proj.title || `${proj.clientName || '거래처'} ${stdList.join('·')} 인증 프로젝트`,
        clientName: proj.clientName || currentCompany?.name || '거래처',
        companyId: proj.companyId,
        categoryLabel: proj.projectType || 'ISO 인증',
        standardLabel: stdList.join(', '),
        agencyLabel: proj.assignedAuditor ? `담당: ${proj.assignedAuditor}` : '내부 준비 · 기관 신청 전',
        periodLabel: targetDate ? `목표일 ${targetDate}` : '목표일 미정',
        cycle,
        nextReviewDate,
        dDay,
        riskState,
        badgeLabel,
        recommendedType: dDay !== null && dDay <= 90 ? '사후·갱신 대비 점검' : '정기 준비 점검',
        rawProject: proj,
      });
    }

    for (const doc of documents) {
      const stdList = Array.isArray(doc.standards) && doc.standards.length
        ? doc.standards
        : doc.standard
        ? [doc.standard]
        : ['ISO_9001'];
      const expiryDate = doc.expiryDate || '';
      const dDay = Number.isFinite(doc.dDay) ? doc.dDay : computeDDayFromToday(expiryDate);
      const reviewStatus = String(doc.reviewStatus || doc.docStatus || '').toUpperCase();
      const isDraft = reviewStatus === 'DRAFT' || doc.docStatus === '작성 중' || doc.docStatus === '초안';
      const defaultCycle = doc.folder === 'CERT' ? '3년' : '1년';
      const cycle = cycleOverrides[`doc-${doc.id}`] || defaultCycle;
      const baseDate = expiryDate || (doc.lastModified ? String(doc.lastModified).slice(0, 10) : '');
      const nextReviewDate = baseDate
        ? addMonthsIso(baseDate, cycle === '1년' ? 12 : cycle === '2년' ? 24 : 36)
        : '검토일 미정';

      let riskState = 'NORMAL';
      let badgeLabel = '정상 (확인 완료)';
      if (dDay !== null && dDay < 0) {
        riskState = 'EXPIRED';
        badgeLabel = `만료 (D+${Math.abs(dDay)})`;
      } else if (dDay !== null && dDay <= 30) {
        riskState = 'WARNING';
        badgeLabel = `임박 (D-${dDay})`;
      } else if (isDraft) {
        riskState = 'WARNING';
        badgeLabel = '검토 필요 (초안)';
      } else if (reviewStatus === 'REVIEW' || doc.docStatus === '검토 중') {
        riskState = 'WARNING';
        badgeLabel = '내부 검토 중';
      }

      rows.push({
        id: `doc-${doc.id}`,
        kind: 'DOCUMENT',
        title: `${doc.code ? `[${doc.code}] ` : ''}${doc.title || doc.name || '문서'}`,
        clientName: currentCompany?.name || '현재 거래처',
        companyId: doc.companyId || currentCompany?.id,
        categoryLabel: doc.folder === 'CERT' ? '인증서' : '구비문서',
        standardLabel: stdList.map((s) => String(s).replace('_', ' ')).join(', '),
        agencyLabel: doc.owner || '내부 문서함',
        periodLabel: expiryDate ? `~ ${expiryDate}` : baseDate ? `최근 수정 ${baseDate}` : '유효기간 미지정',
        cycle,
        nextReviewDate,
        dDay,
        riskState,
        badgeLabel,
        recommendedType: doc.folder === 'CERT' ? '갱신 심사' : '정기 문서 개정 검토',
        rawDoc: doc,
      });
    }

    return rows;
  }, [scopedProjects, documents, currentCompany, cycleOverrides]);

  const counts = useMemo(() => {
    const total = riskRows.length;
    const normal = riskRows.filter((r) => r.riskState === 'NORMAL').length;
    const warning = riskRows.filter((r) => r.riskState === 'WARNING').length;
    const expired = riskRows.filter((r) => r.riskState === 'EXPIRED').length;
    const pct = (n) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0.0%');
    return {
      total,
      normal,
      warning,
      expired,
      normalPct: pct(normal),
      warningPct: pct(warning),
      expiredPct: pct(expired),
    };
  }, [riskRows]);

  const filteredRows = useMemo(() => {
    return riskRows.filter((row) => {
      if (statusFilter !== 'ALL' && row.riskState !== statusFilter) return false;
      if (standardFilter !== 'ALL') {
        const normalizedStd = standardFilter.replace('_', ' ');
        if (!row.standardLabel.includes(normalizedStd) && !row.standardLabel.includes(standardFilter)) {
          return false;
        }
      }
      if (cycleFilter !== 'ALL' && row.cycle !== cycleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${row.title} ${row.clientName} ${row.standardLabel} ${row.agencyLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [riskRows, statusFilter, standardFilter, cycleFilter, searchQuery]);

  // Radar chart geometry
  const { categories } = RADAR_RISK_METRICS;
  const cx = 160;
  const cy = 160;
  const r = 105;
  const count = categories.length;
  const getCoordinates = (index, value) => {
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
    const distance = (value / 100) * r;
    return { x: cx + distance * Math.cos(angle), y: cy + distance * Math.sin(angle) };
  };
  const bgPolygons = [0.33, 0.66, 1.0].map((level) =>
    categories
      .map((_, i) => {
        const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
        return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`;
      })
      .join(' ')
  );
  const dataPolygon = categories
    .map((cat, i) => {
      const coord = getCoordinates(i, cat.score);
      return `${coord.x},${coord.y}`;
    })
    .join(' ');

  return (
    <div className="platform-dashboard space-y-6" style={{ minWidth: 0 }}>
      {/* Breadcrumb & Page Heading (PPT S26) */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
            <span>인증·사후 관리</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700">유효기간 및 갱신 주기 · 리스크 관리 (S26·S29)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            유효기간 및 갱신 주기 관리
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {currentCompany
              ? `${currentCompany.name}의 프로젝트 목표일·문서 유효기간과 갱신 주기를 설정하고 리스크를 점검합니다.`
              : '전체 관리 거래처의 프로젝트 목표일과 선택 거래처 문서의 유효기간·갱신 주기를 통합 점검합니다.'}
          </p>
        </div>

        {/* Inline Client Selector & Action */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>대상 거래처</span>
            <select
              aria-label="리스크 관리 대상 거래처 선택"
              value={currentCompany?.id || ''}
              onChange={(e) => {
                const next = companies.find((c) => c.id === e.target.value) || null;
                onSelectCompany?.(next);
              }}
              className="bg-transparent font-bold text-slate-900 focus:outline-hidden"
            >
              <option value="">전체 거래처 ({companies.length}곳)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {onCreateProject && (
            <button
              type="button"
              onClick={onCreateProject}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>인증·프로젝트 등록</span>
            </button>
          )}
        </div>
      </div>

      {/* Compact Inline Status Summary & S29 Renewal Bar (UX-007: compact badges instead of bulky KPI cards) */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="유효기간 상태 빠른 필터">
          {[
            { id: 'ALL', label: '전체 항목', count: counts.total, activeCls: 'bg-slate-900 text-white', badgeCls: 'bg-slate-700 text-white' },
            { id: 'NORMAL', label: '정상 (유효·확인 완료)', count: counts.normal, activeCls: 'bg-emerald-600 text-white', badgeCls: 'bg-emerald-50 text-emerald-700' },
            { id: 'WARNING', label: '임박·검토 필요', count: counts.warning, activeCls: 'bg-amber-500 text-white', badgeCls: 'bg-amber-50 text-amber-700' },
            { id: 'EXPIRED', label: '만료·기한 경과', count: counts.expired, activeCls: 'bg-rose-600 text-white', badgeCls: 'bg-rose-50 text-rose-700' },
          ].map((pill) => {
            const active = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  active ? pill.activeCls : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                    active ? 'bg-white/20 text-white' : pill.badgeCls
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>D-90 사후·갱신 심사 사전 점검</span>
          <button
            type="button"
            onClick={() => setShowRadarChart((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-100/70 transition-colors cursor-pointer"
          >
            {showRadarChart ? '방사형 리스크 차트 접기' : '카테고리별 리스크 차트 보기'}
          </button>
        </div>
      </div>

      {/* Main Validity & Renewal Table Card (PPT S26) */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-slate-900">인증·프로젝트 및 구비문서 유효기간 목록</h2>
          {!currentCompany && companies.length > 0 && (
            <span className="text-xs text-slate-500">
              개별 거래처의 세부 구비문서 만기까지 함께 보려면 상단에서 거래처를 선택하세요.
            </span>
          )}
        </div>

        {/* Filter Bar (PPT S26) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="리스크 상태 필터"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
          >
            <option value="ALL">상태 전체</option>
            <option value="NORMAL">정상 (유효·확인 완료)</option>
            <option value="WARNING">임박·검토 필요</option>
            <option value="EXPIRED">만료·기한 경과</option>
          </select>

          <select
            aria-label="인증 규격 필터"
            value={standardFilter}
            onChange={(e) => setStandardFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
          >
            <option value="ALL">인증 구분 전체</option>
            {ISO_STANDARDS_INFO.map((std) => (
              <option key={std.code} value={std.code}>
                {std.name}
              </option>
            ))}
          </select>

          <select
            aria-label="갱신 주기 필터"
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
          >
            <option value="ALL">갱신·점검 주기 전체</option>
            <option value="1년">1년 (사후관리 주기)</option>
            <option value="2년">2년 주기</option>
            <option value="3년">3년 (갱신심사 주기)</option>
          </select>

          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              aria-label="인증명 또는 거래처 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="인증명, 문서명, 거래처명 검색"
              className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setStandardFilter('ALL');
              setCycleFilter('ALL');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>초기화</span>
          </button>
        </div>

        {/* Table (PPT S26 & S29 columns) */}
        {filteredRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="platform-table w-full text-left text-xs">
              <thead>
                <tr>
                  <th>인증·문서명</th>
                  <th>거래처 · 구분</th>
                  <th>대상 규격 · 담당</th>
                  <th>목표·유효기간</th>
                  <th>갱신·점검 주기</th>
                  <th>다음 권장 점검일</th>
                  <th>상태</th>
                  <th className="text-right">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td>
                      <div className="font-bold text-slate-900">{row.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{row.recommendedType}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-800">{row.clientName}</div>
                      <div className="text-[11px] text-slate-400">{row.categoryLabel}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-blue-700">{row.standardLabel}</div>
                      <div className="text-[11px] text-slate-400">{row.agencyLabel}</div>
                    </td>
                    <td className="font-mono text-slate-700 whitespace-nowrap">{row.periodLabel}</td>
                    <td>
                      <select
                        aria-label={`${row.title} 갱신 주기`}
                        value={row.cycle}
                        onChange={(e) =>
                          setCycleOverrides((prev) => ({ ...prev, [row.id]: e.target.value }))
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
                      >
                        <option value="1년">1년</option>
                        <option value="2년">2년</option>
                        <option value="3년">3년</option>
                      </select>
                    </td>
                    <td className="font-mono text-slate-700 whitespace-nowrap">{row.nextReviewDate}</td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${
                          row.riskState === 'EXPIRED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : row.riskState === 'WARNING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {row.badgeLabel}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {row.kind === 'PROJECT' && row.rawProject ? (
                        <button
                          type="button"
                          onClick={() => onSelectProject?.(row.rawProject)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                        >
                          <span>준비 현황 열기</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : row.rawDoc ? (
                        <button
                          type="button"
                          onClick={() => onOpenDetail?.(row.rawDoc)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          <span>문서 점검</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
            <div className="text-sm font-bold text-slate-700">
              {riskRows.length === 0
                ? '등록된 프로젝트나 선택 거래처의 문서가 아직 없습니다.'
                : '선택한 필터 조건에 해당하는 항목이 없습니다.'}
            </div>
            <p className="text-xs text-slate-500">
              {!currentCompany && companies.length > 0
                ? '상단에서 관리 거래처를 선택하거나 새 인증 프로젝트를 추가해 유효기간과 구비서류 리스크를 관리하세요.'
                : '새 인증 프로젝트를 등록하거나 구비서류 초안을 생성하면 유효기간·갱신 주기가 자동으로 집계됩니다.'}
            </p>
            {onCreateProject && (
              <button
                type="button"
                onClick={onCreateProject}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>거래처·프로젝트 추가</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* PPT S29 Bottom 5-Step Renewal / Next Audit Process Guide */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-5">
        <div className="text-xs font-bold text-blue-600 mb-3 flex items-center gap-1.5">
          <span>ℹ️ 차기 심사 · 사후관리 연계 프로세스 (S29)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {[
            ['01. 대상 확인', 'D-90 이내 도래 프로젝트·인증 및 미결 보완사항 확인'],
            ['02. 기존 정보 연계', '기존 거래처 운영 정보·적용 범위·구비서류 목록 매핑'],
            ['03. 변경사항 검토·개정', '개정 법규·조직 변경사항을 반영해 절차서·매뉴얼 수정'],
            ['04. 내부 확인 완료', '빠른 점검 패널에서 내부 검토 완료(VERIFIED) 확정'],
            ['05. 심사 일정 조율', '준비 요약표·통합 바인더 출력 후 심사 일정 진행'],
          ].map(([stepTitle, stepDesc]) => (
            <div key={stepTitle} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900">{stepTitle}</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{stepDesc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Expandable Category Radar Chart (Preserved) */}
      {showRadarChart && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-rose-600" />
                카테고리별 만기 레이더 (시연 참고 차트)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                규격 카테고리별 만기 임박도 방사형 시연 분포입니다.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative w-[260px] h-[260px] shrink-0">
              <svg viewBox="0 0 320 320" className="w-full h-full">
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
                <polygon
                  points={dataPolygon}
                  fill="rgba(59, 130, 246, 0.25)"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
            <div className="w-full sm:w-56 space-y-2 text-xs">
              {categories.map((cat) => (
                <div
                  key={cat.label}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <span className="font-medium text-slate-700">{cat.label}</span>
                  <span className="font-bold text-slate-900">{cat.score}점</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
