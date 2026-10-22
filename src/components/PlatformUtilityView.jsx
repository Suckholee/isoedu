'use client';

import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Info,
  CheckCircle2,
  Bell,
  FileText,
  ExternalLink,
  Plus,
  Building2,
  Filter,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import CompanyTeamPanel from './CompanyTeamPanel';
import SocialLoginButtons from './SocialLoginButtons';
import Button from './ui/Button';
import { isCloudMode } from '../lib/dataConfig';
import { ISO_STANDARDS_INFO } from '../lib/isoRequirementsData';
import { evaluateComplianceReadiness } from '../lib/complianceEngine';
import { suggestedProjectTasks } from '../lib/projectWorkflow.mjs';

const titles = {
  schedule: '심사 일정 및 진행 현황',
  notifications: '알림 센터',
  reports: '보고서',
  settings: '설정',
};

function parseIsoDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const d = new Date(`${clean}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function calcDDay(dateStr) {
  const d = parseIsoDate(dateStr);
  if (!d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function buildMonthGrid(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();
  const cells = [];

  for (let i = startOffset - 1; i >= 0; i -= 1) {
    const dayNum = prevMonthDays - i;
    const d = new Date(year, monthIndex - 1, dayNum);
    cells.push({
      iso: d.toISOString().slice(0, 10),
      day: dayNum,
      inMonth: false,
    });
  }
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum += 1) {
    const m = String(monthIndex + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    cells.push({
      iso: `${year}-${m}-${dayStr}`,
      day: dayNum,
      inMonth: true,
    });
  }
  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - (startOffset + daysInMonth) + 1;
    const d = new Date(year, monthIndex + 1, nextDay);
    cells.push({
      iso: d.toISOString().slice(0, 10),
      day: d.getDate(),
      inMonth: false,
    });
  }
  return cells;
}

export default function PlatformUtilityView({
  view,
  documents = [],
  projects = [],
  currentCompany = null,
  companies = [],
  onSelectCompany,
  onSelectProject,
  onCreateProject,
  onOpenDetail,
  onNavigate,
  onWorkspaceChanged,
}) {
  const { profile, user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // Scoped projects for currentCompany (or all accessible projects if currentCompany is null)
  const scopedProjects = useMemo(
    () => (currentCompany ? projects.filter((p) => p.companyId === currentCompany.id) : projects),
    [projects, currentCompany]
  );

  // ============================================================================
  // VIEW 1: 심사 일정 (PPT S23 심사 일정 및 진행 현황 + S28 사후/갱신 자동 일정 안내)
  // ============================================================================
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const activeScheduleProject = useMemo(() => {
    if (selectedProjectId) {
      const found = scopedProjects.find((p) => p.id === selectedProjectId);
      if (found) return found;
    }
    return scopedProjects[0] || null;
  }, [scopedProjects, selectedProjectId]);

  const scheduleMilestones = useMemo(() => {
    const items = [];
    const targetProjects = activeScheduleProject ? [activeScheduleProject] : scopedProjects;

    for (const proj of targetProjects) {
      const targetDate = proj.targetDate || proj.auditDate || '';
      const stdText = Array.isArray(proj.standards) && proj.standards.length
        ? proj.standards.join(', ')
        : proj.standard || 'ISO 9001:2015';
      const suggested = suggestedProjectTasks(targetDate);
      for (const task of suggested) {
        if (task.dueDate) {
          items.push({
            id: `${proj.id}-${task.key}`,
            date: task.dueDate,
            title: `${proj.clientName || proj.title || '프로젝트'} · ${task.title}`,
            stageLabel:
              task.key === 'preparation-1'
                ? '1단계 · 회사 현황·준비 범위 확인 (D-30)'
                : task.key === 'preparation-2'
                ? '2단계 · 구비서류 작성·증적 정리 (D-14)'
                : '3단계 · 내부 검토·보완 (D-3)',
            project: proj,
            standardText: stdText,
            isTargetDay: false,
          });
        }
      }
      if (targetDate) {
        items.push({
          id: `${proj.id}-target`,
          date: targetDate,
          title: `${proj.clientName || '거래처'} 내부 목표 심사일`,
          stageLabel: '목표일 · 심사 준비 완료 기준일',
          project: proj,
          standardText: stdText,
          isTargetDay: true,
        });
      }
    }

    for (const doc of documents) {
      if (doc.expiryDate) {
        items.push({
          id: `doc-exp-${doc.id}`,
          date: String(doc.expiryDate).slice(0, 10),
          title: `${doc.title || doc.name} 유효기간 만기일`,
          stageLabel: '문서 유효기간 만기 점검',
          doc,
          standardText: doc.standard || 'ISO 9001',
          isTargetDay: false,
        });
      }
    }

    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [activeScheduleProject, scopedProjects, documents]);

  const initialCalendarDate = useMemo(() => {
    const firstDate =
      activeScheduleProject?.targetDate ||
      scheduleMilestones[0]?.date ||
      new Date().toISOString().slice(0, 10);
    return parseIsoDate(firstDate) || new Date();
  }, [activeScheduleProject, scheduleMilestones]);

  const [calYear, setCalYear] = useState(() => initialCalendarDate.getFullYear());
  const [calMonth, setCalMonth] = useState(() => initialCalendarDate.getMonth());
  const [selectedIsoDate, setSelectedIsoDate] = useState('');

  const monthCells = useMemo(() => buildMonthGrid(calYear, calMonth), [calYear, calMonth]);
  const milestoneByDate = useMemo(() => {
    const map = new Map();
    for (const m of scheduleMilestones) {
      const list = map.get(m.date) || [];
      list.push(m);
      map.set(m.date, list);
    }
    return map;
  }, [scheduleMilestones]);

  const activeDateIso =
    selectedIsoDate ||
    activeScheduleProject?.targetDate ||
    scheduleMilestones[0]?.date ||
    new Date().toISOString().slice(0, 10);

  const selectedDateEvents = milestoneByDate.get(activeDateIso) || [];
  const targetDDay = calcDDay(activeScheduleProject?.targetDate || activeDateIso);

  // Stepper steps for S23 Right Column
  const scheduleSteps = useMemo(() => {
    const hasProject = Boolean(activeScheduleProject);
    const hasDocs = documents.length > 0;
    const verifiedCount = documents.filter(
      (d) => String(d.reviewStatus || '').toUpperCase() === 'VERIFIED' || d.docStatus === '승인 완료'
    ).length;
    const hasTargetDate = Boolean(activeScheduleProject?.targetDate);

    return [
      {
        num: '01',
        title: '프로젝트 · 구비서류 요건 등록',
        desc: hasProject
          ? `${activeScheduleProject.clientName || '거래처'} 프로젝트 등록 완료`
          : '신규 거래처·인증 프로젝트를 등록해 주세요.',
        sub: activeScheduleProject?.createdAt
          ? String(activeScheduleProject.createdAt).slice(0, 10)
          : '',
        state: hasProject ? 'DONE' : 'ACTIVE',
      },
      {
        num: '02',
        title: '내부 목표일 및 준비 일정 수립',
        desc: hasTargetDate
          ? `목표일(${activeScheduleProject.targetDate}) 기준 30·14·3일 전 일정 산정`
          : '프로젝트 목표일을 지정하면 준비 마일스톤이 자동 계산됩니다.',
        sub: hasTargetDate ? `예정 목표일: ${activeScheduleProject.targetDate}` : '',
        state: hasTargetDate ? 'ACTIVE' : 'PENDING',
      },
      {
        num: '03',
        title: '구비서류 초안 작성 · 내부 검토',
        desc: hasDocs
          ? `현재 거래처 문서 ${documents.length}건 (내부 확인 ${verifiedCount}건)`
          : '일괄 초안 생성 또는 기존 보유 문서를 매칭·연결합니다.',
        sub: '',
        state: hasDocs && verifiedCount > 0 ? 'DONE' : hasDocs ? 'ACTIVE' : 'PENDING',
      },
      {
        num: '04',
        title: '준비 요약표 · 통합 바인더 점검',
        desc: '심사 신청 전 구비서류 연결 현황표와 통합 Word 바인더를 출력·점검합니다.',
        sub: '',
        state: verifiedCount > 0 ? 'ACTIVE' : 'PENDING',
      },
      {
        num: '05',
        title: '공식 인증기관 심사 및 인증서 기록',
        desc: '공식 인증기관 심사 수행 후 발급된 인증서를 보관함에 등록합니다.',
        sub: '인증기관 실시간 예약 연동은 별도 절차',
        state: 'PENDING',
      },
    ];
  }, [activeScheduleProject, documents]);

  // ============================================================================
  // VIEW 2: 알림 센터 (PPT S27 알림 센터 + S25 알림 설정 요약)
  // ============================================================================
  const [alertTab, setAlertTab] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [readIds, setReadIds] = useState(() => new Set());
  const [selectedAlertId, setSelectedAlertId] = useState('');

  const notificationItems = useMemo(() => {
    const list = [];

    // 1. Document review / draft / expiry notifications from real documents
    for (const doc of documents) {
      const reviewStatus = String(doc.reviewStatus || '').toUpperCase();
      const isDraft = reviewStatus === 'DRAFT' || doc.docStatus === '작성 중' || doc.docStatus === '초안';
      const dDay = Number.isFinite(doc.dDay) ? doc.dDay : calcDDay(doc.expiryDate);

      if (dDay !== null && dDay <= 30) {
        list.push({
          id: `alert-doc-exp-${doc.id}`,
          category: 'SCHEDULE',
          categoryLabel: '일정·만기',
          severity: dDay < 0 ? 'Critical' : 'Warning',
          title:
            dDay < 0
              ? `[만기 경과] ${doc.title || doc.name} 유효기간 ${Math.abs(dDay)}일 경과`
              : `[만기 임박] ${doc.title || doc.name} 만기 D-${dDay} 도래`,
          summary: `${currentCompany?.name || '거래처'} · ${doc.code || '문서'} 정기 개정 및 유효기간 갱신 점검이 필요합니다.`,
          authority: currentCompany?.name || '문서 관리',
          dateLabel: doc.expiryDate || '만기 점검',
          clauseText: `관련 규격: ${(doc.standards || [doc.standard || 'ISO 9001']).join(', ')}`,
          changes: [
            '문서 유효기간 만료 전 최신 운영 현황 및 조직도 반영 여부 확인',
            '개정 이력(Revision) 업데이트 및 내부 검토 상태(VERIFIED) 갱신',
            '사후관리 심사 시 유효본 증빙 제시 가능 여부 확인',
          ],
          affectedDocs: [
            {
              id: doc.id,
              title: doc.title || doc.name,
              code: doc.code || 'DOC',
              requirement: '유효기간 및 최신본 유지 관리 (조항 7.5 문서화된 정보)',
              lastReviewed: doc.lastModified ? String(doc.lastModified).slice(0, 10) : '-',
              statusLabel: dDay < 0 ? '만기 경과' : '갱신 필요',
              rawDoc: doc,
            },
          ],
        });
      } else if (isDraft || reviewStatus === 'REVIEW') {
        list.push({
          id: `alert-doc-review-${doc.id}`,
          category: 'DOC_REVIEW',
          categoryLabel: '문서 검토',
          severity: isDraft ? 'Warning' : 'Info',
          title: `${doc.title || doc.name} ${isDraft ? '초안 작성 및 미입력 항목 점검' : '내부 검토 확정 대기'}`,
          summary: `${doc.code || '구비문서'} · 본문 내 미입력 항목([...]) 치환 및 빠른 점검 체크리스트 확인이 필요합니다.`,
          authority: currentCompany?.name || '품질·인증 담당',
          dateLabel: doc.lastModified ? String(doc.lastModified).slice(0, 10) : '작성 중',
          clauseText: `문서 코드: ${doc.code || '표준 초안'} · 상태: ${isDraft ? '초안 작성 중(DRAFT)' : '내부 검토 중(REVIEW)'}`,
          changes: [
            '초안 내 대괄호([...]) 미입력 항목을 실제 거래처 부서명·수립일자로 치환',
            '조직의 상황·리더십·운용 조항 필수 기재사항 포함 여부 확인',
            '점검 완료 후 내부 확인 완료(VERIFIED) 상태로 변경하여 준비 일정에 반영',
          ],
          affectedDocs: [
            {
              id: doc.id,
              title: doc.title || doc.name,
              code: doc.code || 'DRAFT',
              requirement: `${doc.standard || 'ISO 9001'} 필수 구비문서 내부 검토`,
              lastReviewed: doc.lastModified ? String(doc.lastModified).slice(0, 10) : '초안',
              statusLabel: isDraft ? '초안 점검 필요' : '검토 중',
              rawDoc: doc,
            },
          ],
        });
      }
    }

    // 2. Project target-date & preparation notifications from real projects
    for (const proj of scopedProjects) {
      const dDay = calcDDay(proj.targetDate);
      const stdText = Array.isArray(proj.standards) && proj.standards.length
        ? proj.standards.join(', ')
        : proj.standard || 'ISO 9001';
      list.push({
        id: `alert-proj-${proj.id}`,
        category: dDay !== null && dDay <= 14 ? 'CORRECTIVE' : 'DOC_REVIEW',
        categoryLabel: dDay !== null && dDay <= 14 ? '시정·보완 조치' : '문서 검토',
        severity: dDay !== null && dDay < 0 ? 'Critical' : dDay !== null && dDay <= 30 ? 'Warning' : 'Info',
        title: `[${proj.clientName || '거래처'}] ${proj.title || stdText} 구비서류 및 준비 일정 점검`,
        summary: proj.targetDate
          ? `내부 목표일(${proj.targetDate}${dDay !== null ? `, D-${dDay}` : ''}) 대비 구비서류 연결 및 확인 상태를 점검하세요.`
          : '내부 목표일과 구비서류 연결 현황을 확인하고 일괄 초안 생성을 진행하세요.',
        authority: proj.clientName || '프로젝트 관리',
        dateLabel: proj.targetDate || '일정 점검',
        clauseText: `대상 규격: ${stdText} · 프로젝트 준비 워크플로우`,
        changes: [
          '미연결 필수 구비서류에 대해 기존 문서 자동 매칭 또는 일괄 초안 생성 수행',
          '구비서류 행별 빠른 점검 패널에서 체크리스트 확인 및 검토 메모 기록',
          '구비서류 확인 상태를 준비 일정(work_tasks)과 동기화하고 통합 바인더(.doc) 점검',
        ],
        affectedDocs: [
          {
            id: proj.id,
            title: proj.title || `${proj.clientName} ${stdText} 구비서류 바인더`,
            code: stdText,
            requirement: '프로젝트 필수 구비서류 연결 및 내부 확인 완료',
            lastReviewed: proj.targetDate || '진행 중',
            statusLabel: '프로젝트 점검',
            rawProject: proj,
          },
        ],
      });
    }

    // 3. Statutory & ISO Standard compliance reference notices (PPT S27 exact style)
    list.push(
      {
        id: 'alert-legal-osh',
        category: 'LEGAL',
        categoryLabel: '법적 요구사항',
        severity: 'Critical',
        title: '산업안전보건법 시행규칙 및 위험성평가 지침 준수 점검 안내 (ISO 45001 연계)',
        summary: '도급에 따른 산업재해 예방 조치 및 근로자 참여 기반 정기·상시 위험성평가 기록 보존 점검',
        authority: '고용노동부 · ISO 45001 조항 6.1.2 / 8.1.4',
        dateLabel: '상시 법규 점검',
        clauseText: '관련 조항: ISO 45001:2018 조항 6.1.2(위험요인 파악 및 리스크 평가) · 제67조(도급인 안전조치)',
        changes: [
          '도급인의 안전보건관리 책임 범위 및 수급인 근로자 안전보건 교육 지원 절차 명시',
          '위험성평가 절차서 및 현장 점검표 내 근로자 참여 증빙 기록 보존',
          '구매 및 외주 관리 절차서(조항 8.1.4) 내 안전보건 요구사항 반영 여부 확인',
        ],
        affectedDocs: [
          {
            id: 'ref-osh-1',
            title: '위험성평가 절차서 및 실행 기록표',
            code: 'OHS-P-601',
            requirement: 'ISO 45001 조항 6.1.2 위험요인 파악 및 평가',
            lastReviewed: '정기 점검 대상',
            statusLabel: '검토 권장',
            standardCode: 'ISO_45001',
          },
          {
            id: 'ref-osh-2',
            title: '구매 및 외주(도급) 안전보건 관리 절차서',
            code: 'OHS-P-802',
            requirement: '산업안전보건법 제67조 · 조항 8.1.4 외주관리',
            lastReviewed: '정기 점검 대상',
            statusLabel: '검토 권장',
            standardCode: 'ISO_45001',
          },
        ],
      },
      {
        id: 'alert-legal-env',
        category: 'LEGAL',
        categoryLabel: '법적 요구사항',
        severity: 'Warning',
        title: '폐기물관리법 및 환경측면 중요도 평가 기준 점검 안내 (ISO 14001 연계)',
        summary: '사업장 지정·일반 폐기물 보관 기준 및 환경측면 규명·비상사태 대응 절차서 최신성 확인',
        authority: '환경부 · ISO 14001 조항 6.1.2 / 8.2',
        dateLabel: '정기 법규 점검',
        clauseText: '관련 조항: ISO 14001:2015 조항 6.1.2(환경측면) · 조항 6.1.3(준수의무) · 조항 8.2(비상사태 대비)',
        changes: [
          '환경측면 규명 및 환경영향평가 절차서 내 최신 법적 준수의무 등록부 현행화',
          '폐기물 위탁처리 계약서 및 인계내역 증빙과 절차서 기준 일치 여부 점검',
          '환경 비상사태 대응 시나리오 및 정기 훈련 결과 보고서 구비 확인',
        ],
        affectedDocs: [
          {
            id: 'ref-env-1',
            title: '환경측면 규명 및 영향평가 절차서',
            code: 'EMS-P-601',
            requirement: 'ISO 14001 조항 6.1.2 환경측면 및 준수의무',
            lastReviewed: '정기 점검 대상',
            statusLabel: '검토 권장',
            standardCode: 'ISO_14001',
          },
        ],
      },
      {
        id: 'alert-legal-qms',
        category: 'LEGAL',
        categoryLabel: '법적 요구사항',
        severity: 'Info',
        title: 'ISO 9001:2015 기후변화 고려사항(Amendment 1:2024) 매뉴얼 반영 안내',
        summary: '조항 4.1(조직과 조직의 상황) 및 4.2(이해관계자의 니즈와 기대)에 기후변화 관련성 검토 문구 반영 권장',
        authority: 'ISO/TC 176 · 조항 4.1 / 4.2 개정 추록',
        dateLabel: '규격 추록 안내',
        clauseText: '관련 조항: ISO 9001:2015/Amd 1:2024 조항 4.1 및 4.2 기후변화(Climate Change) 고려사항',
        changes: [
          '품질매뉴얼 또는 경영매뉴얼 4.1절 내 기후변화가 경영시스템에 미치는 영향 검토 여부 명시',
          '4.2절 이해관계자 요구사항 표에 환경·기후변화 관련 고객/법적 요구사항 유무 기록',
          '경영검토(조항 9.3) 입력사항에 외부 이슈 변화로 함께 점검',
        ],
        affectedDocs: [
          {
            id: 'ref-qms-1',
            title: '품질매뉴얼 (조직의 상황 및 이해관계자 요구사항)',
            code: 'QMS-M-001',
            requirement: 'ISO 9001 조항 4.1 / 4.2 기후변화 추록 반영',
            lastReviewed: '상시 점검 대상',
            statusLabel: '확인 권장',
            standardCode: 'ISO_9001',
          },
        ],
      }
    );

    return list;
  }, [documents, scopedProjects, currentCompany]);

  const tabCounts = useMemo(() => {
    return {
      ALL: notificationItems.length,
      DOC_REVIEW: notificationItems.filter((i) => i.category === 'DOC_REVIEW').length,
      LEGAL: notificationItems.filter((i) => i.category === 'LEGAL').length,
      SCHEDULE: notificationItems.filter((i) => i.category === 'SCHEDULE').length,
      CORRECTIVE: notificationItems.filter((i) => i.category === 'CORRECTIVE').length,
    };
  }, [notificationItems]);

  const filteredNotifications = useMemo(() => {
    return notificationItems.filter((item) => {
      if (alertTab !== 'ALL' && item.category !== alertTab) return false;
      if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;
      return true;
    });
  }, [notificationItems, alertTab, severityFilter]);

  const activeAlert = useMemo(() => {
    if (selectedAlertId) {
      const found = filteredNotifications.find((a) => a.id === selectedAlertId);
      if (found) return found;
    }
    return filteredNotifications[0] || notificationItems[0] || null;
  }, [filteredNotifications, notificationItems, selectedAlertId]);

  return (
    <div className="platform-dashboard space-y-6" style={{ minWidth: 0 }}>
      {/* ==================================================================== */}
      {/* 1. SCHEDULE VIEW (PPT S23 심사 일정 및 진행 현황 + S28 자동 일정 안내) */}
      {/* ==================================================================== */}
      {view === 'schedule' && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
                <span>인증 관리</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-700">심사 일정 및 진행 현황 (S23·S28)</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                심사 일정 및 진행 현황
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                프로젝트별 내부 목표일·구비서류 준비 마일스톤(30·14·3일 전)과 진행 단계를 달력에서 확인합니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>거래처</span>
                <select
                  aria-label="심사 일정 거래처 선택"
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

              {scopedProjects.length > 0 && (
                <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
                  <span>프로젝트</span>
                  <select
                    aria-label="심사 일정 프로젝트 선택"
                    value={activeScheduleProject?.id || ''}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="bg-transparent font-bold text-blue-700 focus:outline-hidden"
                  >
                    {scopedProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.clientName ? `[${p.clientName}] ` : ''}
                        {p.title || p.standard || '인증 프로젝트'}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {onCreateProject && (
                <button
                  type="button"
                  onClick={onCreateProject}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>신규 프로젝트 일정 추가</span>
                </button>
              )}
            </div>
          </div>

          {/* PPT S23 Top 4-Column Project Summary Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="sm:pr-4">
              <div className="text-xs font-semibold text-slate-400">인증 표준 · 구분</div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-base font-extrabold text-slate-900">
                  {activeScheduleProject
                    ? Array.isArray(activeScheduleProject.standards) && activeScheduleProject.standards.length
                      ? activeScheduleProject.standards.join(' · ')
                      : activeScheduleProject.standard || 'ISO 9001:2015'
                    : 'ISO 9001 / 14001 / 45001'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                  {activeScheduleProject?.projectType || '준비 일정'}
                </span>
              </div>
            </div>

            <div className=" pt-3 sm:pt-0 sm:px-4">
              <div className="text-xs font-semibold text-slate-400">대상 거래처 · 프로젝트</div>
              <div className="mt-2 text-sm font-bold text-slate-900 truncate">
                {activeScheduleProject
                  ? `${activeScheduleProject.clientName || currentCompany?.name || '거래처'} · ${
                      activeScheduleProject.title || '인증 준비'
                    }`
                  : currentCompany?.name || '등록된 프로젝트를 선택하거나 추가하세요'}
              </div>
            </div>

            <div className="pt-3 sm:pt-0 sm:px-4">
              <div className="text-xs font-semibold text-slate-400">담당 심사원 · 내부 담당</div>
              <div className="mt-2 text-sm font-bold text-slate-900">
                {activeScheduleProject?.assignedAuditor || '내부 준비 단계 (공식 심사원 배정 전)'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                공식 인증기관 심사 예약·배정은 별도 절차로 진행됩니다
              </div>
            </div>

            <div className="pt-3 sm:pt-0 sm:pl-4">
              <div className="text-xs font-semibold text-slate-400">내부 목표 심사일</div>
              <div className="mt-2 text-base font-extrabold text-blue-700 font-mono">
                {activeScheduleProject?.targetDate || '목표일 미지정'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                목표일 기준 30·14·3일 전 준비 일정 자동 연동
              </div>
            </div>
          </div>

          {/* PPT S23 Main 2-Column Grid: Calendar + Selected Detail (Left) | Stepper + D-Day (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Monthly Calendar + Selected Schedule Detail */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">제안된 심사 · 준비 마일스톤 일정</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    날짜를 클릭하면 해당 일자의 구비서류 준비·내부 검토·목표일 상세를 확인합니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="이전 달"
                    onClick={() => {
                      if (calMonth === 0) {
                        setCalYear((y) => y - 1);
                        setCalMonth(11);
                      } else {
                        setCalMonth((m) => m - 1);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-extrabold text-slate-900 min-w-[100px] text-center">
                    {calYear}년 {calMonth + 1}월
                  </span>
                  <button
                    type="button"
                    aria-label="다음 달"
                    onClick={() => {
                      if (calMonth === 11) {
                        setCalYear((y) => y + 1);
                        setCalMonth(0);
                      } else {
                        setCalMonth((m) => m + 1);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setCalYear(now.getFullYear());
                      setCalMonth(now.getMonth());
                      setSelectedIsoDate(now.toISOString().slice(0, 10));
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    오늘
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Calendar Grid (7 cols) */}
                <div className="md:col-span-7">
                  <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 pb-2">
                    {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                      <div key={d} className="py-1">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {monthCells.map((cell) => {
                      const events = milestoneByDate.get(cell.iso) || [];
                      const isSelected = cell.iso === activeDateIso;
                      const hasTarget = events.some((e) => e.isTargetDay);
                      return (
                        <button
                          type="button"
                          key={cell.iso}
                          onClick={() => {
                            setSelectedIsoDate(cell.iso);
                            if (!cell.inMonth) {
                              const parsed = parseIsoDate(cell.iso);
                              if (parsed) {
                                setCalYear(parsed.getFullYear());
                                setCalMonth(parsed.getMonth());
                              }
                            }
                          }}
                          className={`h-11 rounded-xl flex flex-col items-center justify-center relative text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : hasTarget
                              ? 'bg-blue-50 text-blue-700 border border-blue-300'
                              : events.length > 0
                              ? 'bg-indigo-50/70 text-indigo-900 hover:bg-indigo-100/80'
                              : cell.inMonth
                              ? 'text-slate-700 hover:bg-slate-100'
                              : 'text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span>{cell.day}</span>
                          {events.length > 0 && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                                isSelected ? 'bg-white' : hasTarget ? 'bg-blue-600' : 'bg-indigo-500'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      준비 마일스톤 (30·14·3일 전)
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      선택/목표 일정
                    </span>
                  </div>
                </div>

                {/* Selected Date Detail Panel (PPT S23 Center-Right) */}
                <div className="md:col-span-5 flex flex-col justify-between bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-slate-900">선택된 일정 상세</h3>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        {selectedDateEvents.length > 0 ? `${selectedDateEvents.length}건 일정` : '일정 확인'}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-700">
                      <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                        <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{activeDateIso}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>09:00 ~ 18:00 (내부 준비·점검 기준)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          {activeScheduleProject?.clientName ||
                            currentCompany?.name ||
                            '대상 거래처 사업장'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          {activeScheduleProject?.assignedAuditor || '내부 품질·인증 준비 담당'}
                        </span>
                      </div>
                    </div>

                    {selectedDateEvents.length > 0 ? (
                      <div className="space-y-2 pt-2 border-t border-slate-200/70">
                        {selectedDateEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1"
                          >
                            <div className="font-bold text-blue-700">{ev.stageLabel}</div>
                            <div className="font-bold text-slate-900">{ev.title}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-500">
                        선택한 날짜에 등록된 마감 일정이 없습니다. 아래 전체 마일스톤 목록에서 일정을 클릭해 이동할 수 있습니다.
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-[11px] text-slate-600 space-y-1">
                      <div className="font-bold text-blue-700 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>일정 운영 안내</span>
                      </div>
                      <p>• 표시된 일정은 내부 준비 목표일과 권장 마일스톤(30·14·3일 전)입니다.</p>
                      <p>• 공식 인증기관 심사 예약·확정은 구비서류 내부 확인 완료 후 별도 진행됩니다.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {activeScheduleProject && onSelectProject && (
                      <button
                        type="button"
                        onClick={() => onSelectProject(activeScheduleProject)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center cursor-pointer transition-colors"
                      >
                        구비서류 · 준비 일정 열기 →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigate('radar')}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      유효기간 · 리스크 보기
                    </button>
                  </div>
                </div>
              </div>

              {/* Milestone Quick Jump List */}
              {scheduleMilestones.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-500 mb-2.5">
                    등록된 준비 마일스톤 바로가기 ({scheduleMilestones.length}건)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {scheduleMilestones.slice(0, 6).map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => {
                          setSelectedIsoDate(m.date);
                          const parsed = parseIsoDate(m.date);
                          if (parsed) {
                            setCalYear(parsed.getFullYear());
                            setCalMonth(parsed.getMonth());
                          }
                        }}
                        className={`text-left p-3 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          activeDateIso === m.date
                            ? 'border-blue-500 bg-blue-50/70'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-blue-600">{m.stageLabel}</div>
                          <div className="font-bold text-slate-900 truncate">{m.title}</div>
                        </div>
                        <span className="font-mono text-slate-600 shrink-0">{m.date}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 Cols: 5-Step Vertical Stepper + Large D-Day Card (PPT S23 Right Column) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-extrabold text-slate-900">심사 · 준비 진행 상태</h2>
                  <span className="text-xs font-semibold text-blue-600">실시간 연동</span>
                </div>

                <ol className="space-y-4 relative">
                  {scheduleSteps.map((step, idx) => {
                    const isDone = step.state === 'DONE';
                    const isActive = step.state === 'ACTIVE';
                    return (
                      <li
                        key={step.num}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-blue-50/80 border-blue-200'
                            : isDone
                            ? 'bg-white border-slate-200'
                            : 'bg-slate-50/50 border-slate-100 opacity-75'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                              isDone || isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-blue-600">{step.num}</span>
                              <span className="text-xs font-extrabold text-slate-900">
                                {step.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              {step.desc}
                            </p>
                            {step.sub && (
                              <div className="text-[11px] font-semibold text-blue-600 mt-1">
                                {step.sub}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* PPT S23 Bottom-Right D-Day Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 pb-3 border-b border-slate-100">
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                  <span>D-Day</span>
                </div>
                <div className="pt-4 flex items-baseline justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-700">목표 심사일까지</div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">
                      {activeScheduleProject?.targetDate
                        ? `${activeScheduleProject.targetDate} 기준`
                        : `${activeDateIso} 선택 기준`}
                    </div>
                  </div>
                  <div className="text-4xl font-black text-blue-600 tracking-tight">
                    {targetDDay === null
                      ? '미정'
                      : targetDDay === 0
                      ? 'D-Day'
                      : targetDDay > 0
                      ? `D-${targetDDay}`
                      : `D+${Math.abs(targetDDay)}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================================================================== */}
      {/* 2. NOTIFICATIONS VIEW (PPT S27 알림 센터 + S25 사후관리 알림 요약)   */}
      {/* ==================================================================== */}
      {view === 'notifications' && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
                <span>사후 관리</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-700">알림 센터 · 문서 검토 및 법적 요구사항 알림 (S27·S25)</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">알림 센터</h1>
              <p className="text-sm text-slate-500 mt-1">
                구비문서 초안 검토, 유효기간 도래, 프로젝트 준비 일정 및 ISO 규격·법적 요구사항 점검 항목을 확인하고 해당 문서로 바로 이동합니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>대상 거래처</span>
                <select
                  aria-label="알림 센터 거래처 선택"
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
            </div>
          </div>

          {/* PPT S27 Top Category Tabs with Badges */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            {[
              ['ALL', '전체', tabCounts.ALL],
              ['DOC_REVIEW', '문서 검토', tabCounts.DOC_REVIEW],
              ['LEGAL', '법적·규격 요구사항', tabCounts.LEGAL],
              ['SCHEDULE', '일정·만기', tabCounts.SCHEDULE],
              ['CORRECTIVE', '시정·보완 조치', tabCounts.CORRECTIVE],
            ].map(([id, label, count]) => {
              const active = alertTab === id;
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => setAlertTab(id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      active ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filter & Action Toolbar (PPT S27) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600">
                <Filter className="w-3.5 h-3.5" />
                <span>필터</span>
              </span>
              <select
                aria-label="알림 중요도 필터"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
              >
                <option value="ALL">중요도 전체</option>
                <option value="Critical">Critical (긴급)</option>
                <option value="Warning">Warning (주의)</option>
                <option value="Info">Info (안내)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setReadIds(new Set(notificationItems.map((item) => item.id)))
                }
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
              >
                모두 읽음 처리
              </button>
            </div>
          </div>

          {/* PPT S27 2-Column Split Layout: Left Alert List | Right Detail & Affected Documents */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 5 Cols: Alert Feed Cards */}
            <div className="lg:col-span-5 space-y-3">
              {filteredNotifications.map((item) => {
                const isSelected = activeAlert?.id === item.id;
                const isUnread = !readIds.has(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setSelectedAlertId(item.id);
                      setReadIds((prev) => {
                        const next = new Set(prev);
                        next.add(item.id);
                        return next;
                      });
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-100'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                            item.severity === 'Critical'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : item.severity === 'Warning'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {item.severity}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {item.categoryLabel}
                        </span>
                      </div>
                      {isUnread && (
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-blue-600"
                          title="미확인 알림"
                        />
                      )}
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 leading-snug">
                      {item.title}
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{item.summary}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                      <span>{item.authority}</span>
                      <span>{item.dateLabel}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right 7 Cols: Selected Alert Detail & Affected Documents Table (PPT S27) */}
            {activeAlert && (
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-extrabold ${
                          activeAlert.severity === 'Critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : activeAlert.severity === 'Warning'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {activeAlert.severity}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                        {activeAlert.categoryLabel}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{activeAlert.dateLabel}</span>
                  </div>

                  <h2 className="text-lg font-extrabold text-slate-900">{activeAlert.title}</h2>
                  <p className="text-xs text-slate-500 mt-1.5">
                    {activeAlert.authority} · {activeAlert.clauseText}
                  </p>
                </div>

                {/* PPT S27 Rose Box: 주요 변경 / 점검 내용 */}
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-2">
                  <div className="text-xs font-extrabold text-rose-700">주요 변경 · 필수 점검 사항</div>
                  <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                    {activeAlert.changes.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>

                {/* PPT S27 Affected Documents Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900">영향받는 문서 · 구비서류</h3>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                        {activeAlert.affectedDocs.length}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">문서 · 프로젝트명</th>
                          <th className="py-2.5 px-3">관련 요구사항 · 조항</th>
                          <th className="py-2.5 px-3">기준일</th>
                          <th className="py-2.5 px-3">상태</th>
                          <th className="py-2.5 px-3 text-right">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeAlert.affectedDocs.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{item.title}</div>
                              <div className="text-[11px] text-slate-400">{item.code}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-600">{item.requirement}</td>
                            <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                              {item.lastReviewed}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold whitespace-nowrap">
                                {item.statusLabel}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              {item.rawDoc ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenDetail?.(item.rawDoc)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs cursor-pointer"
                                >
                                  <span>문서 열기</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              ) : item.rawProject ? (
                                <button
                                  type="button"
                                  onClick={() => onSelectProject?.(item.rawProject)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs cursor-pointer"
                                >
                                  <span>구비서류 열기</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onNavigate?.('compliance', item.standardCode || 'ISO_9001')
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs cursor-pointer"
                                >
                                  <span>규격 진단 이동</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div>
                      현재 등록된 프로젝트·문서 및 ISO 규격 기준에서 실시간 계산한 플랫폼 내 점검 알림입니다.
                    </div>
                    <div className="text-[11px] text-blue-700 mt-0.5">
                      이메일·SMS·카카오 알림톡 외부 자동 발송은 아직 연동되지 않았습니다.
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const first = activeAlert.affectedDocs[0];
                      if (first?.rawDoc) onOpenDetail?.(first.rawDoc);
                      else if (first?.rawProject) onSelectProject?.(first.rawProject);
                      else onNavigate?.('compliance', first?.standardCode || 'ISO_9001');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <span>관련 문서 · 규격 검토 시작</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PPT S25 Bottom Alert Rule Summary Table */}
          <section className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">사후 관리 알림 항목 요약 (S25)</h3>
                <p className="text-xs text-slate-500">
                  플랫폼 내 자동 집계 기준이며 외부 메시지(이메일·SMS·알림톡) 발송은 별도 연동 대상입니다.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="platform-table w-full text-left text-xs">
                <thead>
                  <tr>
                    <th>알림 항목</th>
                    <th>집계 방식</th>
                    <th>사전 안내 시점</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-slate-900">심사 목표일 · 사후관리 일정</td>
                    <td>플랫폼 내 알림 센터 · 내 업무 연동</td>
                    <td>목표일 30일 / 14일 / 3일 전</td>
                    <td>
                      <span className="text-emerald-700 font-bold">● 플랫폼 내 활성</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-900">구비문서 초안 · 미입력 항목 점검</td>
                    <td>플랫폼 내 알림 센터 · 빠른 점검 연동</td>
                    <td>초안 생성 및 검토 대기 시 즉시</td>
                    <td>
                      <span className="text-emerald-700 font-bold">● 플랫폼 내 활성</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-900">문서 유효기간 만료 안내</td>
                    <td>플랫폼 내 알림 센터 · 리스크 관리 연동</td>
                    <td>만료 30일 전 및 경과 시</td>
                    <td>
                      <span className="text-emerald-700 font-bold">● 플랫폼 내 활성</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ==================================================================== */}
      {/* 3. REPORTS VIEW                                                       */}
      {/* ==================================================================== */}
      {view === 'reports' && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{titles[view]}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {currentCompany?.name || '전체 거래처 (개별 거래처 선택 시 보유 문서 기준으로 집계합니다)'}
              </p>
            </div>
            <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>대상 거래처</span>
              <select
                aria-label="보고서 거래처 선택"
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
          </div>

          <section className="platform-card">
            <h2>인증별 문서 준비 현황</h2>
            <p className="text-xs text-slate-500 my-4">
              등록된 문서와 기준 목록의 대조 결과이며 공식 심사 결과 보고서가 아닙니다.
            </p>
            <div className="overflow-auto">
              <table className="platform-table">
                <thead>
                  <tr>
                    <th>인증 표준</th>
                    <th>보유 / 전체 요건</th>
                    <th>문서 보유율</th>
                    <th>상세</th>
                  </tr>
                </thead>
                <tbody>
                  {ISO_STANDARDS_INFO.map((s) => {
                    const r = evaluateComplianceReadiness(documents, s.code);
                    return (
                      <tr key={s.code}>
                        <td>{s.name}</td>
                        <td>
                          {r.readyCount} / {r.totalRequired}
                        </td>
                        <td>{r.totalRequired ? `${r.readinessScore}%` : '기준 미등록'}</td>
                        <td>
                          <button
                            className="text-blue-600 font-bold"
                            onClick={() => onNavigate('compliance', s.code)}
                          >
                            진단 보기
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ==================================================================== */}
      {/* 4. SETTINGS VIEW                                                      */}
      {/* ==================================================================== */}
      {view === 'settings' && (
        <>
          <div className="platform-page-heading">
            <div>
              <h1>{titles[view]}</h1>
              <p>{currentCompany?.name || '회사를 선택해 주세요.'}</p>
            </div>
          </div>
          <section className="platform-card">
            <h2>계정 및 데이터 연결</h2>
            <dl className="text-sm grid grid-cols-[120px_1fr] gap-5 my-6">
              <dt>로그인</dt>
              <dd>{user ? profile?.fullName || '로그인됨' : '로그인 필요'}</dd>
              <dt>선택한 회사</dt>
              <dd>{currentCompany?.name || '선택 안 됨'}</dd>
              <dt>저장 위치</dt>
              <dd>{isCloudMode ? 'Supabase' : '이 브라우저'}</dd>
            </dl>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setAuthOpen(true)}>
                {user ? '계정 전환' : '로그인 / 회원가입'}
              </Button>
              <button
                type="button"
                onClick={() => onNavigate?.('admin')}
                className="px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer"
              >
                관리자 센터 (회원 · 기업권한 · 전자발송 · 감사로그) 이동
              </button>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              전자발송(이메일·알림톡·SMS) 큐 및 알림 발송 규칙은 관리자 센터의 전자발송 탭에서 설정할 수 있습니다.
            </p>
          </section>
          {user && isCloudMode && (
            <section className="platform-card">
              <h2 className="mb-3">로그인 방식 연결</h2>
              <SocialLoginButtons link />
            </section>
          )}
          {isCloudMode && (
            <CompanyTeamPanel company={currentCompany} onChanged={onWorkspaceChanged} />
          )}
        </>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
