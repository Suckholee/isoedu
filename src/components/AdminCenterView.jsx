'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Building2,
  Send,
  ShieldCheck,
  FileSpreadsheet,
  Search,
  Plus,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Mail,
  UserPlus,
  Sliders,
  History,
  Award,
  BookOpen,
  BarChart3,
  ExternalLink,
  X,
  Trash2,
  LogIn,
  Paperclip,
  FileText,
} from 'lucide-react';
import ModalLayer from './ui/ModalLayer';
import AuthModal from './AuthModal';
import Button from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { isCloudMode } from '../lib/dataConfig';
import { ISO_STANDARDS_INFO, ISO_MANDATORY_REQUIREMENTS } from '../lib/isoRequirementsData';
import {
  ADMIN_TABS,
  PLATFORM_ROLE_LABELS,
  MEMBERSHIP_ROLE_LABELS,
  DISPATCH_CHANNELS,
  DISPATCH_STATUS_LABELS,
  DEFAULT_ADMIN_SENDER,
  COMPLETION_STATUS_LABELS,
  TRAINING_COURSE_PRESETS,
  OFFICIAL_ATTACHMENT_PRESETS,
  DISPATCH_TEMPLATES,
  normalizeCompanyProfile,
  validateCompanyProfileInput,
  filterMemberDirectory,
  buildMembersCsv,
  generateCompletionCertificateNumber,
  buildCompletionCertificateDoc,
  buildSampleRosterCsv,
  parseMemberRosterCsv,
  renderDispatchPreview,
  buildPersonalizedDispatchBatch,
  validateDispatchInput,
  buildMailtoHref,
  filterDispatchHistory,
  buildDispatchesCsv,
  buildAuditLogsCsv,
  summarizePlatformOperations,
} from '../lib/adminCenter.mjs';
import {
  loadAdminSnapshot,
  loadCompanyTeamAccess,
  fetchOrRotateCompanyJoinCode,
  decideCompanyJoinRequest,
  revokeCompanyMember,
  changeCompanyMemberRole,
  saveMemberProfileAdmin,
  registerMemberInviteCandidate,
  batchRegisterMembersAdmin,
  batchIssueMemberCompletion,
  saveCompanyProfileAdmin,
  recordElectronicDispatch,
  executeAdminDispatchBatch,
  fetchDispatchGatewayStatus,
  saveCustomDispatchTemplateAdmin,
  deleteCustomDispatchTemplateAdmin,
  retryQueuedOrFailedDispatches,
  saveNotificationRulesLocal,
  saveAuditorPoolItemLocal,
  saveCmsOverrideLocal,
} from '../lib/adminRepository';

function downloadCsvText(filename, csvContent) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadDocFile(filename, htmlContent) {
  if (typeof window === 'undefined') return;
  const blob = new Blob(['\uFEFF', htmlContent], {
    type: 'application/msword;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminCenterView({
  activeTab = 'members',
  onSelectTab,
  companies = [],
  currentCompany = null,
  onSelectCompany,
  projects = [],
  documents = [],
  onCreateClient,
  onWorkspaceChanged,
  onShowToast,
}) {
  const { user, profile } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Snapshot state
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [snapshot, setSnapshot] = useState({
    members: [],
    companies: [],
    dispatches: [],
    notificationRules: [],
    auditorPool: [],
    cmsOverrides: {},
    auditLogs: [],
    schemaStatus: 'LOCAL_MODE',
  });

  const notify = (msg) => {
    setStatusMessage(msg);
    onShowToast?.(msg);
  };

  const refreshSnapshot = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await loadAdminSnapshot({
        user,
        profile,
        companies,
      });
      setSnapshot(data);
    } catch (err) {
      setLoadError(err.message || '관리자 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSnapshot();
  }, [user?.id, profile?.id, companies.length]);

  const opSummary = useMemo(
    () =>
      summarizePlatformOperations({
        members: snapshot.members,
        companies: snapshot.companies,
        projects,
        documents,
        dispatches: snapshot.dispatches,
        auditLogs: snapshot.auditLogs,
      }),
    [snapshot, projects, documents]
  );

  // ============================================================================
  // TAB 1: 회원 · 계정 관리 (Members & Trainee Completion B01·B02)
  // ============================================================================
  const [memberRoleFilter, setMemberRoleFilter] = useState('ALL');
  const [memberStatusFilter, setMemberStatusFilter] = useState('ALL');
  const [memberCompanyFilter, setMemberCompanyFilter] = useState('');
  const [memberCohortFilter, setMemberCohortFilter] = useState('ALL');
  const [memberCompletionFilter, setMemberCompletionFilter] = useState('ALL');
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [checkedMemberIds, setCheckedMemberIds] = useState([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCsvRosterModalOpen, setIsCsvRosterModalOpen] = useState(false);

  // Member edit form state
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberPhone, setEditMemberPhone] = useState('');
  const [editMemberDept, setEditMemberDept] = useState('');
  const [editMemberRole, setEditMemberRole] = useState('MEMBER');
  const [editMemberActive, setEditMemberActive] = useState(true);
  const [editMemberCohort, setEditMemberCohort] = useState('');
  const [editMemberCourseName, setEditMemberCourseName] = useState('');
  const [editMemberCompletionStatus, setEditMemberCompletionStatus] = useState('NONE');
  const [editMemberCertNo, setEditMemberCertNo] = useState('');
  const [editMemberCompletionDate, setEditMemberCompletionDate] = useState('');
  const [editMemberMemo, setEditMemberMemo] = useState('');
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberFormError, setMemberFormError] = useState('');

  // Invite modal state (Single registration)
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteCompanyId, setInviteCompanyId] = useState('');
  const [inviteCustomCompanyName, setInviteCustomCompanyName] = useState('');
  const [inviteDept, setInviteDept] = useState('');
  const [inviteCohort, setInviteCohort] = useState('1기');
  const [inviteCourseName, setInviteCourseName] = useState(TRAINING_COURSE_PRESETS[0]);
  const [inviteCompletionStatus, setInviteCompletionStatus] = useState('ENROLLED');
  const [inviteOpenDispatchAfter, setInviteOpenDispatchAfter] = useState(true);
  const [inviteError, setInviteError] = useState('');

  // CSV Bulk Roster Modal state
  const [csvRosterText, setCsvRosterText] = useState('');
  const [csvRosterBusy, setCsvRosterBusy] = useState(false);
  const [csvRosterError, setCsvRosterError] = useState('');

  const availableCohorts = useMemo(() => {
    const set = new Set(['1기', '2기']);
    for (const m of snapshot.members) {
      if (m.cohort) set.add(m.cohort);
    }
    return Array.from(set);
  }, [snapshot.members]);

  const parsedCsvRoster = useMemo(
    () => parseMemberRosterCsv(csvRosterText),
    [csvRosterText]
  );

  const filteredMembers = useMemo(
    () =>
      filterMemberDirectory(snapshot.members, {
        role: memberRoleFilter,
        status: memberStatusFilter,
        companyId: memberCompanyFilter,
        cohort: memberCohortFilter,
        completionStatus: memberCompletionFilter,
        query: memberQuery,
      }),
    [
      snapshot.members,
      memberRoleFilter,
      memberStatusFilter,
      memberCompanyFilter,
      memberCohortFilter,
      memberCompletionFilter,
      memberQuery,
    ]
  );

  const activeMember = useMemo(() => {
    if (selectedMemberId) {
      const found = snapshot.members.find((m) => m.id === selectedMemberId);
      if (found) return found;
    }
    return filteredMembers[0] || snapshot.members[0] || null;
  }, [selectedMemberId, filteredMembers, snapshot.members]);

  useEffect(() => {
    if (!activeMember) return;
    setEditMemberName(activeMember.fullName || '');
    setEditMemberPhone(activeMember.phone || '');
    setEditMemberDept(activeMember.department || '');
    setEditMemberRole(activeMember.role || 'MEMBER');
    setEditMemberActive(activeMember.isActive !== false);
    setEditMemberCohort(activeMember.cohort || '');
    setEditMemberCourseName(activeMember.courseName || '');
    setEditMemberCompletionStatus(activeMember.completionStatus || 'NONE');
    setEditMemberCertNo(activeMember.certificateNo || '');
    setEditMemberCompletionDate(
      activeMember.completionDate || new Date().toISOString().slice(0, 10)
    );
    setEditMemberMemo(activeMember.adminMemo || '');
    setMemberFormError('');
  }, [activeMember?.id]);

  const roleCounts = useMemo(() => {
    const all = snapshot.members;
    return {
      ALL: all.length,
      MEMBER: all.filter((m) => m.role === 'MEMBER').length,
      AUDITOR: all.filter((m) => m.role === 'AUDITOR').length,
      ADMIN: all.filter((m) => m.role === 'ADMIN').length,
      COMPLETED: all.filter(
        (m) => m.completionStatus === 'COMPLETED' || m.completionStatus === 'CERTIFIED'
      ).length,
    };
  }, [snapshot.members]);

  const handleSaveMemberDetail = async (e) => {
    e.preventDefault();
    if (!activeMember || memberSaving) return;
    if (!editMemberName.trim()) {
      setMemberFormError('회원 성명을 입력해 주세요.');
      return;
    }
    setMemberSaving(true);
    setMemberFormError('');
    try {
      const autoCertNo =
        (editMemberCompletionStatus === 'COMPLETED' ||
          editMemberCompletionStatus === 'CERTIFIED') &&
        !editMemberCertNo.trim()
          ? generateCompletionCertificateNumber({
              cohort: editMemberCohort.trim() || '1기',
              sequence: snapshot.members.filter((m) => m.certificateNo).length + 1,
              dateStr: editMemberCompletionDate,
            })
          : editMemberCertNo.trim();

      const res = await saveMemberProfileAdmin({
        targetUserId: activeMember.id,
        email: activeMember.email,
        fullName: editMemberName.trim(),
        phone: editMemberPhone.trim(),
        role: editMemberRole,
        isActive: editMemberActive,
        companyId: activeMember.primaryCompanyId,
        companyName: activeMember.primaryCompanyName,
        metadata: {
          ...(activeMember.metadata || {}),
          department: editMemberDept.trim(),
          cohort: editMemberCohort.trim(),
          courseName: editMemberCourseName.trim(),
          completionStatus: editMemberCompletionStatus,
          certificateNo: autoCertNo,
          completionDate: editMemberCompletionDate,
          adminMemo: editMemberMemo.trim(),
        },
        currentUserId: user?.id,
      });
      setEditMemberCertNo(autoCertNo);
      await refreshSnapshot();
      notify(res.message);
    } catch (err) {
      setMemberFormError(err.message || '회원 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setMemberSaving(false);
    }
  };

  const handleBatchIssueCompletion = async (alsoDispatch = false) => {
    const targetMembers =
      checkedMemberIds.length > 0
        ? snapshot.members.filter((m) => checkedMemberIds.includes(m.id))
        : filteredMembers;
    if (targetMembers.length === 0) {
      notify('수료 처리할 회원을 선택해 주세요.');
      return;
    }
    setMemberSaving(true);
    try {
      const updated = await batchIssueMemberCompletion({
        members: targetMembers,
        cohort: memberCohortFilter !== 'ALL' ? memberCohortFilter : '',
        courseName: TRAINING_COURSE_PRESETS[0],
        completionDate: new Date().toISOString().slice(0, 10),
        currentUserId: user?.id,
      });
      await refreshSnapshot();
      notify(
        `선택된 회원 ${updated.length}명을 수료 완료 처리하고 고유 수료번호(HN-EDU-...)를 발급했습니다.`
      );
      if (alsoDispatch) {
        handoffToDispatch({
          templateKey: 'CERT_OR_COMPLETION_ISSUANCE',
          channel: 'EMAIL',
          members: updated,
          presetAttachmentId: 'preset-completion-cert',
        });
      }
    } catch (err) {
      setMemberFormError(err.message);
    } finally {
      setMemberSaving(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError('');
    try {
      const targetComp = snapshot.companies.find(
        (c) => c.id === (inviteCompanyId || currentCompany?.id)
      );
      const companyName =
        inviteCustomCompanyName.trim() || targetComp?.name || '어니스톤 교육생';
      const certNo =
        inviteCompletionStatus === 'COMPLETED' || inviteCompletionStatus === 'CERTIFIED'
          ? generateCompletionCertificateNumber({
              cohort: inviteCohort || '1기',
              sequence: snapshot.members.length + 1,
            })
          : '';
      const created = await registerMemberInviteCandidate({
        email: inviteEmail,
        fullName: inviteName,
        phone: invitePhone,
        role: inviteRole,
        companyId: targetComp?.id || null,
        companyName,
        department: inviteDept || (inviteCohort ? `${inviteCohort} 수강생` : ''),
        cohort: inviteCohort,
        courseName: inviteCourseName,
        completionStatus: inviteCompletionStatus,
        certificateNo: certNo,
        completionDate: certNo ? new Date().toISOString().slice(0, 10) : '',
      });
      await refreshSnapshot();
      setSelectedMemberId(created.id);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInvitePhone('');
      setInviteCustomCompanyName('');
      setInviteDept('');

      if (inviteOpenDispatchAfter) {
        handoffToDispatch({
          templateKey:
            inviteCompletionStatus === 'COMPLETED' || inviteCompletionStatus === 'CERTIFIED'
              ? 'CERT_OR_COMPLETION_ISSUANCE'
              : 'MEMBER_INVITE_CODE',
          channel: 'EMAIL',
          members: [
            {
              id: created.id,
              fullName: created.full_name,
              email: created.email,
              phone: created.phone,
              primaryCompanyId: created.company_id,
              primaryCompanyName: companyName,
              cohort: inviteCohort,
              courseName: inviteCourseName,
              certificateNo: certNo,
            },
          ],
          presetAttachmentId:
            inviteCompletionStatus === 'COMPLETED' || inviteCompletionStatus === 'CERTIFIED'
              ? 'preset-completion-cert'
              : 'preset-iso-kickoff-notice',
        });
        notify(
          `'${created.full_name}' 회원을 등록하고 즉시 전자발송 작성기로 이동했습니다.`
        );
      } else {
        notify(`'${created.full_name}' 회원을 관리 명부에 등록했습니다.`);
      }
    } catch (err) {
      setInviteError(err.message);
    }
  };

  const handleCsvRosterSubmit = async (openDispatchAfter = false) => {
    if (csvRosterBusy) return;
    if (parsedCsvRoster.validRows.length === 0) {
      setCsvRosterError('일괄 등록할 유효한 회원 행이 없습니다. 양식을 확인해 주세요.');
      return;
    }
    setCsvRosterBusy(true);
    setCsvRosterError('');
    try {
      const createdList = await batchRegisterMembersAdmin(parsedCsvRoster.validRows);
      await refreshSnapshot();
      setIsCsvRosterModalOpen(false);
      setCsvRosterText('');
      if (openDispatchAfter) {
        handoffToDispatch({
          templateKey: 'ADMIN_MEMBER_NOTICE',
          channel: 'EMAIL',
          members: createdList.map((c) => ({
            id: c.id,
            fullName: c.full_name,
            email: c.email,
            phone: c.phone,
            primaryCompanyId: c.company_id,
            primaryCompanyName: c.company_name || c.metadata?.companyName || '어니스톤 회원',
            cohort: c.metadata?.cohort || '',
            courseName: c.metadata?.courseName || '',
            certificateNo: c.metadata?.certificateNo || '',
          })),
        });
        notify(
          `CSV 명단 ${createdList.length}명을 일괄 등록하고 전자발송 수신자 목록에 탑재했습니다.`
        );
      } else {
        notify(`CSV 명단 ${createdList.length}명을 회원 관리 대장에 일괄 등록했습니다.`);
      }
    } catch (err) {
      setCsvRosterError(err.message);
    } finally {
      setCsvRosterBusy(false);
    }
  };

  // ============================================================================
  // TAB 2: 기업 · 소속 권한 (Companies & Team Access S01 · S03 · S04)
  // ============================================================================
  const [companySearch, setCompanySearch] = useState('');
  const [companySubTab, setCompanySubTab] = useState('team'); // 'team' | 'profile'
  const [teamAccess, setTeamAccess] = useState(null);
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [joinCodeValue, setJoinCodeValue] = useState('');
  const [approveRole, setApproveRole] = useState('VIEWER');
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // Company profile form state (S01, S03)
  const [compForm, setCompForm] = useState(() => normalizeCompanyProfile(currentCompany || companies[0]));
  const [compFieldError, setCompFieldError] = useState('');
  const [compSaving, setCompSaving] = useState(false);

  const selectedAdminCompany = useMemo(() => {
    if (currentCompany) {
      return snapshot.companies.find((c) => c.id === currentCompany.id) || currentCompany;
    }
    return snapshot.companies[0] || companies[0] || null;
  }, [currentCompany, snapshot.companies, companies]);

  const filteredCompanies = useMemo(() => {
    const q = companySearch.trim().toLowerCase();
    if (!q) return snapshot.companies;
    return snapshot.companies.filter((c) => {
      const norm = normalizeCompanyProfile(c);
      return [norm.name, norm.industry, norm.bizNo, norm.ceoName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [snapshot.companies, companySearch]);

  const refreshTeamAccess = async (companyId = selectedAdminCompany?.id) => {
    if (!companyId) {
      setTeamAccess(null);
      return;
    }
    setTeamError('');
    try {
      const data = await loadCompanyTeamAccess(companyId);
      setTeamAccess(data);
    } catch (err) {
      setTeamError(err.message);
    }
  };

  useEffect(() => {
    setJoinCodeValue('');
    setRevokeTarget(null);
    if (selectedAdminCompany) {
      setCompForm(normalizeCompanyProfile(selectedAdminCompany));
      setCompFieldError('');
      refreshTeamAccess(selectedAdminCompany.id);
    } else {
      setTeamAccess(null);
    }
  }, [selectedAdminCompany?.id, user?.id]);

  const handleLoadOrRotateCode = async (rotate = false) => {
    if (!selectedAdminCompany || teamBusy) return;
    setTeamBusy(true);
    setTeamError('');
    try {
      const code = await fetchOrRotateCompanyJoinCode(selectedAdminCompany.id, rotate);
      setJoinCodeValue(code);
      notify(rotate ? '새로운 직원 소속 신청 코드를 재발급했습니다.' : '직원 소속 신청 코드를 확인했습니다.');
    } catch (err) {
      setTeamError(err.message);
    } finally {
      setTeamBusy(false);
    }
  };

  const handleDecideJoinRequest = async (requestId, approve) => {
    if (teamBusy) return;
    setTeamBusy(true);
    setTeamError('');
    try {
      await decideCompanyJoinRequest({
        requestId,
        approve,
        memberRole: approveRole,
      });
      await refreshTeamAccess();
      await refreshSnapshot();
      await onWorkspaceChanged?.();
      notify(approve ? '회사 소속 신청을 승인했습니다.' : '회사 소속 신청을 반려했습니다.');
    } catch (err) {
      setTeamError(err.message);
    } finally {
      setTeamBusy(false);
    }
  };

  const handleChangeMemberRole = async (memberId, nextRole) => {
    if (!selectedAdminCompany || teamBusy) return;
    setTeamBusy(true);
    setTeamError('');
    try {
      await changeCompanyMemberRole({
        companyId: selectedAdminCompany.id,
        memberId,
        nextRole,
      });
      await refreshTeamAccess();
      await refreshSnapshot();
      notify(`구성원 역할을 ${MEMBERSHIP_ROLE_LABELS[nextRole] || nextRole}(으)로 변경했습니다.`);
    } catch (err) {
      setTeamError(err.message);
    } finally {
      setTeamBusy(false);
    }
  };

  const handleRevokeMember = async () => {
    if (!selectedAdminCompany || !revokeTarget || teamBusy) return;
    setTeamBusy(true);
    setTeamError('');
    try {
      await revokeCompanyMember({
        companyId: selectedAdminCompany.id,
        memberId: revokeTarget.userId,
      });
      setRevokeTarget(null);
      await refreshTeamAccess();
      await refreshSnapshot();
      await onWorkspaceChanged?.();
      notify(`${revokeTarget.name} 님의 회사 소속을 해제했습니다. (이력 보존)`);
    } catch (err) {
      setTeamError(err.message);
    } finally {
      setTeamBusy(false);
    }
  };

  const handleSaveCompanyProfile = async (e) => {
    e.preventDefault();
    if (!selectedAdminCompany || compSaving) return;
    const validation = validateCompanyProfileInput(compForm);
    if (!validation.valid) {
      setCompFieldError(validation.error);
      return;
    }
    setCompSaving(true);
    setCompFieldError('');
    try {
      const res = await saveCompanyProfileAdmin({
        companyId: selectedAdminCompany.id,
        ...compForm,
      });
      await refreshSnapshot();
      await onWorkspaceChanged?.();
      notify(res.message);
    } catch (err) {
      setCompFieldError(err.message);
    } finally {
      setCompSaving(false);
    }
  };

  // ============================================================================
  // TAB 3: 관리자(조영빈) → 회원 대상 전자발송 센터 & 알림 규칙 (S04 · S25 · S27 · S34)
  // ============================================================================
  const [dispatchChannel, setDispatchChannel] = useState('EMAIL');
  const [dispatchTemplateKey, setDispatchTemplateKey] = useState(DISPATCH_TEMPLATES[0].key);
  const [dispatchSenderName, setDispatchSenderName] = useState(
    () => profile?.fullName ? `어니스톤 관리자 ${profile.fullName}` : DEFAULT_ADMIN_SENDER.name
  );
  const [dispatchSenderEmail, setDispatchSenderEmail] = useState(
    () => user?.email || profile?.email || DEFAULT_ADMIN_SENDER.email
  );
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [dispatchRecipientName, setDispatchRecipientName] = useState('');
  const [dispatchRecipientContact, setDispatchRecipientContact] = useState('');
  const [dispatchRecipientCompany, setDispatchRecipientCompany] = useState('');
  const [dispatchRoleLabel, setDispatchRoleLabel] = useState('편집 권한 (EDITOR)');
  const [dispatchJoinCode, setDispatchJoinCode] = useState('');
  const [dispatchStandardName, setDispatchStandardName] = useState('ISO 9001:2015');
  const [dispatchTargetDate, setDispatchTargetDate] = useState(
    () => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [dispatchSupplementText, setDispatchSupplementText] = useState(
    '필수 구비서류 미입력 항목([...]) 치환 및 내부 확인 상태 점검'
  );
  const [dispatchAttachments, setDispatchAttachments] = useState([]);
  const [dispatchCustomSubject, setDispatchCustomSubject] = useState('');
  const [dispatchCustomBody, setDispatchCustomBody] = useState('');
  const [dispatchError, setDispatchError] = useState('');
  const [dispatchChannelFilter, setDispatchChannelFilter] = useState('ALL');
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState('ALL');
  const [dispatchHistoryQuery, setDispatchHistoryQuery] = useState('');
  const [dispatchBusy, setDispatchBusy] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState({
    emailConfigured: false,
    smsConfigured: false,
    emailProvider: 'Resend / SMTP API 키 대기 (발송 대장 + 메일앱 모드)',
    smsProvider: '알림톡·SMS API 키 대기 (발송 대장 기록 모드)',
  });
  const [showGatewayGuide, setShowGatewayGuide] = useState(false);
  const [inspectDispatchItem, setInspectDispatchItem] = useState(null);
  const [isCustomTplFormOpen, setIsCustomTplFormOpen] = useState(false);
  const [customTplTitle, setCustomTplTitle] = useState('');
  const [customTplCategory, setCustomTplCategory] = useState('관리자 커스텀 템플릿');

  const allDispatchTemplates = useMemo(
    () => [
      ...DISPATCH_TEMPLATES,
      ...(Array.isArray(snapshot.customTemplates) ? snapshot.customTemplates : []),
    ],
    [snapshot.customTemplates]
  );

  useEffect(() => {
    fetchDispatchGatewayStatus().then((st) => {
      if (st) setGatewayStatus(st);
    });
  }, []);

  const previewTargetRecipient = useMemo(() => {
    if (selectedRecipients.length > 0) {
      return selectedRecipients[0];
    }
    return {
      name: dispatchRecipientName || '홍길동 회원',
      contact: dispatchRecipientContact || '',
      companyName: dispatchRecipientCompany || selectedAdminCompany?.name || '어니스톤 관리 기업',
      cohort: '1기',
      courseName: TRAINING_COURSE_PRESETS[0],
      certificateNo: 'HN-EDU-202610-1기-001',
    };
  }, [
    selectedRecipients,
    dispatchRecipientName,
    dispatchRecipientContact,
    dispatchRecipientCompany,
    selectedAdminCompany?.name,
  ]);

  const previewedDispatch = useMemo(
    () =>
      renderDispatchPreview(
        dispatchTemplateKey,
        {
          channel: dispatchChannel,
          senderName: dispatchSenderName,
          senderEmail: dispatchSenderEmail,
          recipientName: previewTargetRecipient.name,
          companyName:
            previewTargetRecipient.companyName || selectedAdminCompany?.name || '어니스톤 관리 기업',
          joinCode: dispatchJoinCode || joinCodeValue || '(신청 코드 발급 후 자동 삽입)',
          roleLabel: dispatchRoleLabel,
          targetDate: dispatchTargetDate,
          standardName: dispatchStandardName,
          supplementText: dispatchSupplementText,
          cohort: previewTargetRecipient.cohort || '1기',
          courseName: previewTargetRecipient.courseName || TRAINING_COURSE_PRESETS[0],
          certificateNo: previewTargetRecipient.certificateNo || 'HN-EDU-202610-1기-001',
          completionDate: previewTargetRecipient.completionDate || dispatchTargetDate,
          attachments: dispatchAttachments,
          customSubject: dispatchCustomSubject,
          customBody: dispatchCustomBody,
        },
        snapshot.customTemplates
      ),
    [
      dispatchTemplateKey,
      dispatchChannel,
      dispatchSenderName,
      dispatchSenderEmail,
      previewTargetRecipient,
      selectedAdminCompany?.name,
      dispatchJoinCode,
      joinCodeValue,
      dispatchRoleLabel,
      dispatchTargetDate,
      dispatchStandardName,
      dispatchSupplementText,
      dispatchAttachments,
      dispatchCustomSubject,
      dispatchCustomBody,
      snapshot.customTemplates,
    ]
  );

  const filteredDispatches = useMemo(
    () =>
      filterDispatchHistory(snapshot.dispatches, {
        channel: dispatchChannelFilter,
        status: dispatchStatusFilter,
        query: dispatchHistoryQuery,
      }),
    [snapshot.dispatches, dispatchChannelFilter, dispatchStatusFilter, dispatchHistoryQuery]
  );

  const retryableDispatches = useMemo(
    () =>
      filteredDispatches.filter((d) =>
        ['QUEUED', 'QUEUED_LOCAL', 'FAILED'].includes(d.status)
      ),
    [filteredDispatches]
  );

  const activeMemberDispatches = useMemo(() => {
    if (!activeMember) return [];
    return filterDispatchHistory(snapshot.dispatches, {
      memberContact: activeMember.email || activeMember.phone || activeMember.fullName,
    }).slice(0, 6);
  }, [snapshot.dispatches, activeMember]);

  // Add members to recipient list (individual, multi-select, or group)
  const addMembersToRecipients = (memberList = []) => {
    setSelectedRecipients((prev) => {
      const map = new Map(prev.map((r) => [r.id || r.contact, r]));
      for (const m of memberList) {
        if (!m) continue;
        const contact =
          dispatchChannel === 'EMAIL'
            ? m.email || m.recipientContact || m.contact || ''
            : m.phone || m.recipientContact || m.contact || m.email || '';
        const key = m.id || contact;
        if (!key) continue;
        map.set(key, {
          id: m.id || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: m.fullName || m.name || m.recipientName || '회원',
          email: m.email || (contact.includes('@') ? contact : ''),
          phone: m.phone || (!contact.includes('@') ? contact : ''),
          contact,
          companyId: m.primaryCompanyId || m.companyId || selectedAdminCompany?.id || null,
          companyName:
            m.primaryCompanyName || m.companyName || selectedAdminCompany?.name || '어니스톤 회원',
          roleLabel: m.roleLabel || PLATFORM_ROLE_LABELS[m.role] || '회원',
          cohort: m.cohort || m.metadata?.cohort || '',
          courseName: m.courseName || m.metadata?.courseName || '',
          certificateNo: m.certificateNo || m.metadata?.certificateNo || '',
          completionDate: m.completionDate || m.metadata?.completionDate || '',
        });
      }
      return Array.from(map.values());
    });
    if (dispatchError) setDispatchError('');
  };

  // Handoff helper: jump from Member or Company tab into Electronic Dispatch composer
  const handoffToDispatch = ({
    templateKey = 'ADMIN_MEMBER_NOTICE',
    channel = 'EMAIL',
    recipientName = '',
    recipientContact = '',
    companyName = '',
    joinCode = '',
    members = null,
    presetAttachmentId = '',
  }) => {
    setDispatchTemplateKey(templateKey);
    setDispatchChannel(channel);
    if (Array.isArray(members) && members.length > 0) {
      const mapped = members.map((m) => ({
        id: m.id,
        name: m.fullName || m.name,
        email: m.email || '',
        phone: m.phone || '',
        contact: channel === 'EMAIL' ? m.email : m.phone || m.email,
        companyId: m.primaryCompanyId || m.companyId || null,
        companyName: m.primaryCompanyName || m.companyName || '어니스톤 회원',
        cohort: m.cohort || m.metadata?.cohort || '',
        courseName: m.courseName || m.metadata?.courseName || '',
        certificateNo: m.certificateNo || m.metadata?.certificateNo || '',
        completionDate: m.completionDate || m.metadata?.completionDate || '',
      }));
      setSelectedRecipients(mapped);
      setDispatchRecipientName(mapped[0].name || '');
      setDispatchRecipientContact(mapped[0].contact || '');
      setDispatchRecipientCompany(mapped[0].companyName || '');
    } else if (recipientContact || recipientName) {
      const single = {
        id: `single-${recipientContact || Date.now()}`,
        name: recipientName || '회원',
        email: recipientContact.includes('@') ? recipientContact : '',
        phone: !recipientContact.includes('@') ? recipientContact : '',
        contact: recipientContact,
        companyId: selectedAdminCompany?.id || null,
        companyName: companyName || selectedAdminCompany?.name || '어니스톤 회원',
      };
      setSelectedRecipients([single]);
      setDispatchRecipientName(recipientName);
      setDispatchRecipientContact(recipientContact);
      setDispatchRecipientCompany(single.companyName);
    }
    if (presetAttachmentId) {
      const preset = OFFICIAL_ATTACHMENT_PRESETS.find((p) => p.id === presetAttachmentId);
      if (preset) {
        setDispatchAttachments((prev) =>
          prev.some((a) => a.id === preset.id) ? prev : [...prev, preset]
        );
      }
    }
    if (joinCode) setDispatchJoinCode(joinCode);
    setDispatchCustomSubject('');
    setDispatchCustomBody('');
    setDispatchError('');
    onSelectTab?.('dispatch');
  };

  const handleToggleAttachmentPreset = (item) => {
    setDispatchAttachments((prev) =>
      prev.some((a) => a.id === item.id) ? prev.filter((a) => a.id !== item.id) : [...prev, item]
    );
  };

  const handleLocalFileAttach = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const added = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setDispatchError(`첨부 파일(${file.name})은 10MB 이하만 동봉할 수 있습니다.`);
        continue;
      }
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = String(reader.result || '');
          resolve(res.includes(',') ? res.split(',')[1] : '');
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
      added.push({
        id: `file-${Date.now()}-${file.name}`,
        code: 'LOCAL-FILE',
        title: file.name,
        fileName: file.name,
        category: '로컬 첨부파일',
        sizeBytes: file.size,
        contentBase64: base64,
      });
    }
    if (added.length > 0) {
      setDispatchAttachments((prev) => [...prev, ...added]);
    }
    e.target.value = '';
  };

  const handleExecuteDispatch = async (mode = 'SERVER_OR_QUEUE') => {
    if (dispatchBusy) return;

    // Build effective recipient list from multi-select OR manual input fields
    const effectiveList =
      selectedRecipients.length > 0
        ? selectedRecipients
        : dispatchRecipientContact.trim()
        ? [
            {
              id: `direct-${Date.now()}`,
              name: dispatchRecipientName.trim() || '회원',
              email: dispatchChannel === 'EMAIL' ? dispatchRecipientContact.trim() : '',
              phone: dispatchChannel !== 'EMAIL' ? dispatchRecipientContact.trim() : '',
              contact: dispatchRecipientContact.trim(),
              companyId: selectedAdminCompany?.id || null,
              companyName:
                dispatchRecipientCompany.trim() || selectedAdminCompany?.name || '어니스톤 회원',
            },
          ]
        : [];

    if (effectiveList.length === 0) {
      setDispatchError(
        '수신 대상 회원을 체크박스로 선택하거나 수신자 이메일/연락처를 1명 이상 추가해 주세요.'
      );
      return;
    }

    const { payloads, invalidRecipients } = buildPersonalizedDispatchBatch({
      recipients: effectiveList,
      templateKey: dispatchTemplateKey,
      channel: dispatchChannel,
      baseVariables: {
        senderName: dispatchSenderName,
        senderEmail: dispatchSenderEmail,
        companyId: selectedAdminCompany?.id || null,
        companyName: selectedAdminCompany?.name || '어니스톤 관리 기업',
        joinCode: dispatchJoinCode || joinCodeValue || '(신청 코드 발급 후 자동 삽입)',
        roleLabel: dispatchRoleLabel,
        targetDate: dispatchTargetDate,
        standardName: dispatchStandardName,
        supplementText: dispatchSupplementText,
        customSubject: dispatchCustomSubject,
        customBody: dispatchCustomBody,
      },
      attachments: dispatchAttachments,
      customTemplates: snapshot.customTemplates,
    });

    if (payloads.length === 0) {
      const reason = invalidRecipients[0]?.reason || '유효한 수신 연락처가 없습니다.';
      setDispatchError(`발송 가능한 수신자가 없습니다 (${reason}).`);
      return;
    }

    const firstCheck = validateDispatchInput({
      channel: dispatchChannel,
      recipientContact: payloads[0].recipientContact,
      subject: payloads[0].subject,
      body: payloads[0].body,
    });
    if (!firstCheck.valid) {
      setDispatchError(firstCheck.error);
      return;
    }

    setDispatchBusy(true);
    setDispatchError('');
    try {
      if (mode === 'MAILTO_OPENED' && typeof window !== 'undefined') {
        const primaryTo = payloads[0].recipientContact;
        const bccList = payloads.slice(1).map((p) => p.recipientContact);
        const href = buildMailtoHref({
          recipientContact: primaryTo,
          bccContacts: bccList,
          subject: payloads[0].subject,
          body: payloads[0].body,
        });
        window.location.href = href;
      } else if (mode === 'COPIED' && typeof navigator !== 'undefined' && navigator.clipboard) {
        const summaryHeader = `[발신: ${dispatchSenderName} <${dispatchSenderEmail}> | 수신 회원 ${payloads.length}명: ${payloads
          .map((p) => `${p.recipientName}(${p.recipientContact})`)
          .join(', ')}]`;
        await navigator.clipboard.writeText(
          `${summaryHeader}\n\n제목: ${payloads[0].subject}\n\n${payloads[0].body}`
        );
      }

      const batchRes = await executeAdminDispatchBatch({
        items: payloads,
        mode,
        userEmail: dispatchSenderEmail || user?.email || profile?.email || DEFAULT_ADMIN_SENDER.email,
      });

      await refreshSnapshot();
      notify(
        mode === 'MAILTO_OPENED'
          ? `수신 회원 ${payloads.length}명 앞 기본 메일 앱을 열고 발송 대장에 기록했습니다.`
          : mode === 'COPIED'
          ? `수신 회원 ${payloads.length}명 발송 전문을 복사하고 대장에 기록했습니다.`
          : batchRes.sentCount > 0
          ? `관리자(${dispatchSenderName}) 명의로 회원 ${batchRes.sentCount}명에게 실발송 완료했습니다.`
          : `관리자(${dispatchSenderName}) 명의로 회원 ${payloads.length}명 앞 전자발송 대장(큐)에 기록했습니다.`
      );
    } catch (err) {
      setDispatchError(err.message);
    } finally {
      setDispatchBusy(false);
    }
  };

  const handleResendDispatchRecord = async (record) => {
    if (!record || dispatchBusy) return;
    setDispatchBusy(true);
    setDispatchError('');
    try {
      const attachments = Array.isArray(record.attachments)
        ? record.attachments
        : Array.isArray(record.metadata?.attachments)
        ? record.metadata.attachments
        : [];
      const item = {
        companyId: record.company_id || null,
        companyName: record.companyName || record.metadata?.companyName || '',
        channel: record.channel || 'EMAIL',
        templateKey: record.template_key || 'ADMIN_MEMBER_NOTICE',
        recipientName: record.recipient_name || '회원',
        recipientContact: record.recipient_contact || '',
        senderName: record.metadata?.senderName || dispatchSenderName,
        senderEmail: record.sender_email || record.metadata?.senderEmail || dispatchSenderEmail,
        subject: record.subject || '',
        body: record.body || '',
        attachments,
      };
      const res = await executeAdminDispatchBatch({
        items: [item],
        mode: 'SERVER_OR_QUEUE',
        userEmail: dispatchSenderEmail,
      });
      await refreshSnapshot();
      notify(
        res.sentCount > 0
          ? `${item.recipientName} (${item.recipientContact}) 님에게 재발송을 완료했습니다.`
          : `${item.recipientName} (${item.recipientContact}) 님 재발송 요청을 발송 대장에 기록했습니다.`
      );
    } catch (err) {
      setDispatchError(err.message);
    } finally {
      setDispatchBusy(false);
    }
  };

  const handleBatchRetryDispatches = async () => {
    if (dispatchBusy || retryableDispatches.length === 0) return;
    setDispatchBusy(true);
    setDispatchError('');
    try {
      const res = await retryQueuedOrFailedDispatches(
        retryableDispatches,
        dispatchSenderEmail
      );
      await refreshSnapshot();
      notify(
        res.sentCount > 0
          ? `대기·실패 건 ${res.sentCount}건을 실발송 완료했습니다.`
          : `대기·실패 건 ${retryableDispatches.length}건을 재발송 큐에 갱신 기록했습니다.`
      );
    } catch (err) {
      setDispatchError(err.message);
    } finally {
      setDispatchBusy(false);
    }
  };

  const handleSaveCustomTemplate = async () => {
    if (!customTplTitle.trim()) {
      setDispatchError('저장할 커스텀 템플릿 이름을 입력해 주세요.');
      return;
    }
    try {
      const existingCustom = (snapshot.customTemplates || []).find(
        (t) => t.key === dispatchTemplateKey
      );
      const saved = await saveCustomDispatchTemplateAdmin({
        key: existingCustom ? existingCustom.key : '',
        title: customTplTitle.trim(),
        category: customTplCategory.trim() || '관리자 커스텀 템플릿',
        defaultChannel: dispatchChannel,
        subjectTemplate: dispatchCustomSubject || previewedDispatch.subject,
        bodyTemplate: dispatchCustomBody || previewedDispatch.body,
        attachments: dispatchAttachments,
      });
      await refreshSnapshot();
      setDispatchTemplateKey(saved.key);
      setIsCustomTplFormOpen(false);
      setCustomTplTitle('');
      notify(`'${saved.title}' 커스텀 발송 템플릿을 저장했습니다.`);
    } catch (err) {
      setDispatchError(err.message);
    }
  };

  const handleDeleteCustomTemplate = async (key) => {
    deleteCustomDispatchTemplateAdmin(key);
    await refreshSnapshot();
    setDispatchTemplateKey(DISPATCH_TEMPLATES[0].key);
    notify('커스텀 발송 템플릿을 삭제했습니다.');
  };

  const handleToggleNotificationRule = (ruleId) => {
    const updated = snapshot.notificationRules.map((r) =>
      r.id === ruleId ? { ...r, active: !r.active } : r
    );
    saveNotificationRulesLocal(updated);
    setSnapshot((prev) => ({ ...prev, notificationRules: updated }));
    notify('알림 발송 규칙 활성 상태를 변경했습니다.');
  };

  // ============================================================================
  // TAB 4: 심사원 · 기준 CMS · 운영 (Operations S21 · S31~S36)
  // ============================================================================
  const [opsSubTab, setOpsSubTab] = useState('auditors'); // 'auditors' | 'cms' | 'metrics'
  const [cmsStandardFilter, setCmsStandardFilter] = useState('ISO_9001');
  const [cmsQuery, setCmsQuery] = useState('');
  const [isAuditorModalOpen, setIsAuditorModalOpen] = useState(false);
  const [newAuditorName, setNewAuditorName] = useState('');
  const [newAuditorEmail, setNewAuditorEmail] = useState('');
  const [newAuditorGrade, setNewAuditorGrade] = useState('선임심사원 (Lead Auditor)');
  const [newAuditorLicense, setNewAuditorLicense] = useState('');
  const [newAuditorRegion, setNewAuditorRegion] = useState('서울·경기·인천');
  const [newAuditorStandards, setNewAuditorStandards] = useState(['ISO_9001']);

  const cmsRequirements = useMemo(() => {
    const list = ISO_MANDATORY_REQUIREMENTS.filter(
      (req) => cmsStandardFilter === 'ALL' || req.standard === cmsStandardFilter
    );
    const q = cmsQuery.trim().toLowerCase();
    return list
      .filter((req) => {
        if (!q) return true;
        return [req.code, req.title, req.clause, req.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .map((req) => {
        const override = snapshot.cmsOverrides[req.id] || {};
        return {
          ...req,
          releaseStatus: override.releaseStatus || 'Published',
          versionLabel: override.versionLabel || 'v2026.10',
          updatedAt: override.updatedAt || '2026-10-14',
        };
      });
  }, [cmsStandardFilter, cmsQuery, snapshot.cmsOverrides]);

  const handleAddAuditorPool = (e) => {
    e.preventDefault();
    if (!newAuditorName.trim() || !newAuditorEmail.trim()) return;
    saveAuditorPoolItemLocal({
      name: newAuditorName.trim(),
      email: newAuditorEmail.trim(),
      grade: newAuditorGrade,
      licenseNo: newAuditorLicense.trim() || '자격번호 확인 중',
      region: newAuditorRegion.trim() || '전국',
      standards: newAuditorStandards.length ? newAuditorStandards : ['ISO_9001'],
      conflictStatus: '이해상충 검토 완료',
      active: true,
      assignedCount: 0,
    });
    refreshSnapshot();
    setIsAuditorModalOpen(false);
    setNewAuditorName('');
    setNewAuditorEmail('');
    setNewAuditorLicense('');
    notify('심사원·전문가 인력 풀에 프로필을 등록했습니다.');
  };

  // ============================================================================
  // TAB 5: 보안 감사 로그 (Audit Logs S02 · S04 · S17 · S30)
  // ============================================================================
  const [logResourceFilter, setLogResourceFilter] = useState('ALL');
  const [logQuery, setLogQuery] = useState('');

  const filteredAuditLogs = useMemo(() => {
    const q = logQuery.trim().toLowerCase();
    return snapshot.auditLogs.filter((log) => {
      const targetRes = log.target_resource || log.targetResource || '';
      if (logResourceFilter !== 'ALL' && targetRes !== logResourceFilter) return false;
      if (q) {
        const hay = [
          log.user_email,
          log.action_type,
          targetRes,
          log.resource_title,
          JSON.stringify(log.details || {}),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [snapshot.auditLogs, logResourceFilter, logQuery]);

  return (
    <div className="min-h-full bg-slate-50/60 pb-12">
      {/* Sticky Top Admin Sub-Navigation Bar (UX-004, UX-007, UX-REGISTER-001) */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-6 md:px-8 pt-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs">
                관리
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold text-slate-900">어니스톤 관리자 센터</h1>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                    {isCloudMode ? (user ? 'Supabase 연동' : '로그인 필요') : '로컬 관리자 모드'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  회원·계정 권한 · 기업/사업장 및 소속 코드 · 전자발송(이메일/알림톡/SMS) · 심사원 풀/기준 CMS · 보안 감사 로그 통합 관리
                </p>
              </div>
            </div>

            {/* Compact single-line summary bar (UX-007) */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                가입 회원 <strong className="text-slate-900">{opSummary.totalMembers}</strong>명
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                관리 기업 <strong className="text-slate-900">{opSummary.totalCompanies}</strong>곳
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                전자발송 대장 <strong className="text-blue-700">{opSummary.totalDispatches}</strong>건
              </span>
              <button
                type="button"
                onClick={refreshSnapshot}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                title="관리자 데이터 새로고침"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>새로고침</span>
              </button>
              {isCloudMode && !user && (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>관리자 로그인</span>
                </button>
              )}
            </div>
          </div>

          {/* 5 Core Admin Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto" role="tablist" aria-label="관리자 센터 탭">
            {ADMIN_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const badgeCount =
                tab.id === 'members'
                  ? opSummary.totalMembers
                  : tab.id === 'companies'
                  ? opSummary.totalCompanies
                  : tab.id === 'dispatch'
                  ? opSummary.totalDispatches
                  : tab.id === 'operations'
                  ? snapshot.auditorPool.length
                  : opSummary.totalAuditLogs;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelectTab?.(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full font-extrabold ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {badgeCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-5 space-y-5">
        {loadError && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{loadError}</span>
            </div>
            <button
              type="button"
              onClick={refreshSnapshot}
              className="underline font-bold text-rose-700 cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        )}

        {statusMessage && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage('')}
              className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
              aria-label="알림 닫기"
            >
              닫기
            </button>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 1: 회원 · 계정 관리 (Members Directory & Detail Control)         */}
        {/* ================================================================== */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {/* Filter & Action Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="회원 역할 필터">
                {[
                  ['ALL', '전체 회원', roleCounts.ALL],
                  ['MEMBER', '기업실무·수강생', roleCounts.MEMBER],
                  ['AUDITOR', '공인심사원·전문가', roleCounts.AUDITOR],
                  ['ADMIN', '최고관리자', roleCounts.ADMIN],
                ].map(([roleKey, label, count]) => {
                  const active = memberRoleFilter === roleKey;
                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => setMemberRoleFilter(roleKey)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                          active ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="수강 기수 필터"
                  value={memberCohortFilter}
                  onChange={(e) => setMemberCohortFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">전체 기수</option>
                  {availableCohorts.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="교육 수료 상태 필터"
                  value={memberCompletionFilter}
                  onChange={(e) => setMemberCompletionFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">전체 수료상태</option>
                  <option value="ENROLLED">수강중</option>
                  <option value="COMPLETED">수료완료 ({roleCounts.COMPLETED})</option>
                  <option value="CERTIFIED">파트너검증완료</option>
                  <option value="NONE">해당없음</option>
                </select>

                <select
                  aria-label="계정 상태 필터"
                  value={memberStatusFilter}
                  onChange={(e) => setMemberStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">전체 상태</option>
                  <option value="ACTIVE">활성 (정상 이용)</option>
                  <option value="INACTIVE">비활성 (접근 정지)</option>
                </select>

                <select
                  aria-label="소속 기업 필터"
                  value={memberCompanyFilter}
                  onChange={(e) => setMemberCompanyFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 max-w-[180px]"
                >
                  <option value="">전체 소속 기업 ({snapshot.companies.length}곳)</option>
                  {snapshot.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="search"
                    name="memberSearch"
                    aria-label="회원 이름·이메일·연락처·기수·수료번호 검색"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder="이름, 이메일, 기수, 수료번호 검색"
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 w-52 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    downloadCsvText(
                      `honestone-members-${new Date().toISOString().slice(0, 10)}.csv`,
                      buildMembersCsv(filteredMembers)
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>명부 CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCsvRosterModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV·엑셀 일괄 등록</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>신규 회원·수강생 등록</span>
                </button>
              </div>
            </div>

            {/* Master-Detail Grid: Left Register Table + Right Member Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-4 items-start">
              {/* Left: Member Directory Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold text-slate-800">
                      회원 · 수강생 관리 대장 ({filteredMembers.length}명)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      체크박스로 회원을 선택해 일괄 수료 처리·수료번호 채번 또는 관리자(조영빈) 명의 전자발송을 수행합니다.
                    </div>
                  </div>

                  {/* Quick Batch Selection & Electronic Dispatch Action Bar */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCheckedMemberIds(filteredMembers.map((m) => m.id))}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 cursor-pointer"
                    >
                      전체 선택
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCheckedMemberIds(
                          filteredMembers.filter((m) => m.role === 'MEMBER').map((m) => m.id)
                        )
                      }
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 cursor-pointer"
                    >
                      기업·수강생만
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCheckedMemberIds(
                          filteredMembers
                            .filter(
                              (m) =>
                                m.completionStatus === 'COMPLETED' ||
                                m.completionStatus === 'CERTIFIED'
                            )
                            .map((m) => m.id)
                        )
                      }
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 cursor-pointer"
                    >
                      수료생만
                    </button>
                    {checkedMemberIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCheckedMemberIds([])}
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-500 cursor-pointer"
                      >
                        해제 ({checkedMemberIds.length})
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={memberSaving}
                      onClick={() => handleBatchIssueCompletion(false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-extrabold cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {checkedMemberIds.length > 0
                          ? `선택 수료처리·채번 (${checkedMemberIds.length}명)`
                          : '목록 수료처리·채번'}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={memberSaving}
                      onClick={() => handleBatchIssueCompletion(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-extrabold cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                      <span>수료증 일괄 전자발송</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const targetMembers =
                          checkedMemberIds.length > 0
                            ? snapshot.members.filter((m) => checkedMemberIds.includes(m.id))
                            : filteredMembers;
                        handoffToDispatch({
                          templateKey: 'ADMIN_MEMBER_NOTICE',
                          channel: 'EMAIL',
                          members: targetMembers,
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold shadow-2xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {checkedMemberIds.length > 0
                          ? `선택 회원 전자발송 (${checkedMemberIds.length}명)`
                          : `현재 목록 전자발송 (${filteredMembers.length}명)`}
                      </span>
                    </button>
                  </div>
                </div>

                <div
                  tabIndex={0}
                  role="region"
                  aria-label="전체 회원 관리 대장"
                  className="overflow-auto max-h-[560px]"
                >
                  <table className="w-full text-left text-xs border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 border-b border-slate-200 w-9 text-center">
                          <input
                            type="checkbox"
                            aria-label="전체 회원 선택"
                            checked={
                              filteredMembers.length > 0 &&
                              filteredMembers.every((m) => checkedMemberIds.includes(m.id))
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCheckedMemberIds(filteredMembers.map((m) => m.id));
                              } else {
                                setCheckedMemberIds([]);
                              }
                            }}
                            className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-3 border-b border-slate-200">회원 (성명 · 이메일)</th>
                        <th className="py-2.5 px-3 border-b border-slate-200">플랫폼 역할</th>
                        <th className="py-2.5 px-3 border-b border-slate-200">기수 · 수료현황 (B01)</th>
                        <th className="py-2.5 px-3 border-b border-slate-200">주 소속 기업</th>
                        <th className="py-2.5 px-3 border-b border-slate-200">연락처</th>
                        <th className="py-2.5 px-3 border-b border-slate-200 text-center">상태</th>
                        <th className="py-2.5 px-3 border-b border-slate-200 text-right">관리 · 전자발송</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-400">
                            조건에 맞는 회원이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((m) => {
                          const isSelected = activeMember?.id === m.id;
                          const isChecked = checkedMemberIds.includes(m.id);
                          return (
                            <tr
                              key={m.id}
                              onClick={() => setSelectedMemberId(m.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td
                                className="py-3 px-3 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  aria-label={`${m.fullName} 선택`}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    setCheckedMemberIds((prev) =>
                                      e.target.checked
                                        ? [...prev, m.id]
                                        : prev.filter((id) => id !== m.id)
                                    );
                                  }}
                                  className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                                />
                              </td>
                              <th
                                scope="row"
                                className={`py-3 px-3 font-normal text-left sticky left-0 ${
                                  isSelected ? 'bg-blue-50/95' : 'bg-white'
                                }`}
                              >
                                <div className="font-bold text-slate-900">{m.fullName}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{m.email}</div>
                              </th>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                    m.role === 'ADMIN'
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : m.role === 'AUDITOR'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {m.roleLabel}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {m.cohort && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                                      {m.cohort}
                                    </span>
                                  )}
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      m.completionStatus === 'CERTIFIED'
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                        : m.completionStatus === 'COMPLETED'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : m.completionStatus === 'ENROLLED'
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                        : 'bg-slate-50 text-slate-400'
                                    }`}
                                  >
                                    {m.completionStatusLabel || '해당없음'}
                                  </span>
                                </div>
                                {m.certificateNo && (
                                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                    {m.certificateNo}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-800 truncate max-w-[150px]">
                                  {m.primaryCompanyName}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  활성 소속 {m.activeCompanyCount}곳
                                </div>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">
                                {m.phone || '-'}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    m.isActive
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  {m.isActive ? '● 활성' : '○ 정지'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handoffToDispatch({
                                        templateKey:
                                          m.completionStatus === 'COMPLETED' ||
                                          m.completionStatus === 'CERTIFIED'
                                            ? 'CERT_OR_COMPLETION_ISSUANCE'
                                            : 'ADMIN_MEMBER_NOTICE',
                                        channel: 'EMAIL',
                                        members: [m],
                                        presetAttachmentId:
                                          m.completionStatus === 'COMPLETED' ||
                                          m.completionStatus === 'CERTIFIED'
                                            ? 'preset-completion-cert'
                                            : '',
                                      });
                                    }}
                                    className="px-2 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] cursor-pointer"
                                  >
                                    전자발송
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMemberId(m.id);
                                    }}
                                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] cursor-pointer"
                                  >
                                    상세·수료
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Selected Member Inspector & Control Form */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                {!activeMember ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    왼쪽 목록에서 회원을 선택해 주세요.
                  </div>
                ) : (
                  <form onSubmit={handleSaveMemberDetail} className="space-y-4 text-xs">
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[11px] font-bold text-blue-600 uppercase">
                          회원 상세 · 기수/수료 · 권한 제어 · 개별 전자발송
                        </span>
                        <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                          {activeMember.fullName}
                        </h2>
                        <p className="text-xs text-slate-500 font-mono">{activeMember.email}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handoffToDispatch({
                              templateKey: 'ADMIN_MEMBER_NOTICE',
                              channel: 'EMAIL',
                              members: [activeMember],
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>공지·안내 발송</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handoffToDispatch({
                              templateKey: 'CERT_OR_COMPLETION_ISSUANCE',
                              channel: 'EMAIL',
                              members: [activeMember],
                              presetAttachmentId: 'preset-completion-cert',
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] cursor-pointer"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>수료증·문서 발송</span>
                        </button>
                      </div>
                    </div>

                    {memberFormError && (
                      <div
                        role="alert"
                        className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs"
                      >
                        {memberFormError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="admin-member-name" className="block font-bold text-slate-700 mb-1">
                          성명 (필수)
                        </label>
                        <input
                          id="admin-member-name"
                          name="fullName"
                          type="text"
                          required
                          value={editMemberName}
                          onChange={(e) => {
                            setEditMemberName(e.target.value);
                            if (memberFormError) setMemberFormError('');
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                        />
                      </div>

                      <div>
                        <label htmlFor="admin-member-phone" className="block font-bold text-slate-700 mb-1">
                          연락처 (휴대전화)
                        </label>
                        <input
                          id="admin-member-phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          value={editMemberPhone}
                          onChange={(e) => setEditMemberPhone(e.target.value)}
                          placeholder="010-0000-0000"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="admin-member-dept" className="block font-bold text-slate-700 mb-1">
                        소속 부서 · 직책
                      </label>
                      <input
                        id="admin-member-dept"
                        name="department"
                        type="text"
                        value={editMemberDept}
                        onChange={(e) => setEditMemberDept(e.target.value)}
                        placeholder="예: 품질보증팀 과장 / 대표이사"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                      />
                    </div>

                    {/* B01·B02 Trainee Cohort, Course, Completion Status & Certificate Number Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-blue-600" />
                          <span>수강생 기수 · 교육과정 · 수료증 관리 (B01·B02)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const certNo =
                              editMemberCertNo.trim() ||
                              generateCompletionCertificateNumber({
                                cohort: editMemberCohort || '1기',
                                sequence: 1,
                                dateStr: editMemberCompletionDate,
                              });
                            setEditMemberCertNo(certNo);
                            if (editMemberCompletionStatus === 'NONE') {
                              setEditMemberCompletionStatus('COMPLETED');
                            }
                            const docHtml = buildCompletionCertificateDoc(activeMember, {
                              cohort: editMemberCohort || '1기',
                              courseName: editMemberCourseName || TRAINING_COURSE_PRESETS[0],
                              certificateNo: certNo,
                              completionDate: editMemberCompletionDate,
                            });
                            downloadDocFile(
                              `어니스톤_수료증_${activeMember.fullName}_${certNo}.doc`,
                              docHtml
                            );
                            notify(
                              `${activeMember.fullName} 님의 공식 수료증(${certNo}) 문서를 다운로드했습니다.`
                            );
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 font-bold text-[11px] cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>공식 수료증(.doc) 발급 다운로드</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label htmlFor="admin-member-cohort" className="block font-bold text-slate-600 mb-1">
                            수강 기수 (예: 1기, 2기)
                          </label>
                          <input
                            id="admin-member-cohort"
                            type="text"
                            value={editMemberCohort}
                            onChange={(e) => setEditMemberCohort(e.target.value)}
                            placeholder="예: 1기"
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                          />
                        </div>

                        <div>
                          <label htmlFor="admin-member-completion" className="block font-bold text-slate-600 mb-1">
                            교육 · 수료 상태
                          </label>
                          <select
                            id="admin-member-completion"
                            value={editMemberCompletionStatus}
                            onChange={(e) => setEditMemberCompletionStatus(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold"
                          >
                            {Object.entries(COMPLETION_STATUS_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor="admin-member-course" className="block font-bold text-slate-600 mb-1">
                            교육 과정명
                          </label>
                          <input
                            id="admin-member-course"
                            type="text"
                            list="honestone-course-presets"
                            value={editMemberCourseName}
                            onChange={(e) => setEditMemberCourseName(e.target.value)}
                            placeholder="교육 과정명을 선택하거나 직접 입력하세요"
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                          />
                          <datalist id="honestone-course-presets">
                            {TRAINING_COURSE_PRESETS.map((course) => (
                              <option key={course} value={course} />
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label htmlFor="admin-member-certno" className="block font-bold text-slate-600 mb-1">
                            수료번호
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              id="admin-member-certno"
                              type="text"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck={false}
                              value={editMemberCertNo}
                              onChange={(e) => setEditMemberCertNo(e.target.value)}
                              placeholder="HN-EDU-202610-1기-001"
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono text-[11px]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextNo = generateCompletionCertificateNumber({
                                  cohort: editMemberCohort || '1기',
                                  sequence: snapshot.members.filter((m) => m.certificateNo).length + 1,
                                  dateStr: editMemberCompletionDate,
                                });
                                setEditMemberCertNo(nextNo);
                                if (editMemberCompletionStatus === 'NONE') {
                                  setEditMemberCompletionStatus('COMPLETED');
                                }
                              }}
                              className="px-2 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] whitespace-nowrap cursor-pointer"
                            >
                              자동채번
                            </button>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="admin-member-certdate" className="block font-bold text-slate-600 mb-1">
                            수료(발급) 일자
                          </label>
                          <input
                            id="admin-member-certdate"
                            type="date"
                            value={editMemberCompletionDate}
                            onChange={(e) => setEditMemberCompletionDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Radio group for Platform Role (<6 options per forms guidance) */}
                    <fieldset className="space-y-1.5">
                      <legend className="font-bold text-slate-700">플랫폼 역할 등급 (RBAC)</legend>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {[
                          ['MEMBER', '기업실무·수강생', '기업 문서·프로젝트 실무'],
                          ['AUDITOR', '공인심사원·전문가', '배정 기업 검토·자문'],
                          ['ADMIN', '최고관리자', '플랫폼 전체 운영·권한'],
                        ].map(([rVal, rTitle, rSub]) => (
                          <label
                            key={rVal}
                            className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer ${
                              editMemberRole === rVal
                                ? 'border-blue-600 bg-blue-50/60 text-blue-900'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="memberRole"
                              value={rVal}
                              checked={editMemberRole === rVal}
                              onChange={() => setEditMemberRole(rVal)}
                              className="mt-0.5 accent-blue-600"
                            />
                            <div>
                              <div className="font-bold leading-tight">{rTitle}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{rSub}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    {/* Account Active / Suspended Toggle */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800">계정 활성 상태 제어</div>
                        <div className="text-[11px] text-slate-500">
                          비활성(정지) 시 해당 회원의 모든 기업·문서 RLS 접근이 즉시 차단됩니다.
                        </div>
                      </div>
                      <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          name="memberActive"
                          checked={editMemberActive}
                          onChange={(e) => setEditMemberActive(e.target.checked)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className={editMemberActive ? 'text-emerald-700' : 'text-rose-700'}>
                          {editMemberActive ? '활성 (정상)' : '정지 (비활성)'}
                        </span>
                      </label>
                    </div>

                    {/* Admin Private Consultation & Special Memo */}
                    <div>
                      <label htmlFor="admin-member-memo" className="block font-bold text-slate-700 mb-1">
                        관리자 전용 상담 · 특이사항 메모
                      </label>
                      <textarea
                        id="admin-member-memo"
                        rows={2}
                        value={editMemberMemo}
                        onChange={(e) => setEditMemberMemo(e.target.value)}
                        placeholder="수강 평가, 기업 상담 내역, 보완 필요 사항 등 관리자 메모를 기록하세요."
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                      />
                    </div>

                    {/* Member's Company Memberships List */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">
                          소속 기업 및 권한 내역 ({activeMember.memberships.length}곳)
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectTab?.('companies')}
                          className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          기업별 권한 관리로 이동 →
                        </button>
                      </div>
                      <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                        {activeMember.memberships.length === 0 ? (
                          <div className="p-3 text-slate-400 text-center">소속된 기업이 없습니다.</div>
                        ) : (
                          activeMember.memberships.map((m, idx) => (
                            <div
                              key={`${m.companyId}-${idx}`}
                              className="px-3 py-2 flex items-center justify-between gap-2"
                            >
                              <div className="truncate font-semibold text-slate-800">{m.companyName}</div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                                  {MEMBERSHIP_ROLE_LABELS[m.role] || m.role}
                                </span>
                                <span
                                  className={`text-[10px] font-bold ${
                                    m.active ? 'text-emerald-600' : 'text-rose-600'
                                  }`}
                                >
                                  {m.active ? '재직' : '해제됨'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <Button type="submit" disabled={memberSaving}>
                        {memberSaving ? '저장 중...' : '회원 정보 · 수료 · 권한 저장'}
                      </Button>
                    </div>

                    {/* Per-Member Electronic Dispatch History & Resend */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          이 회원에게 보낸 전자발송 내역 ({activeMemberDispatches.length}건)
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectTab?.('dispatch')}
                          className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          전자발송 대장 전체 보기 →
                        </button>
                      </div>
                      {activeMemberDispatches.length === 0 ? (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-slate-400">
                          아직 이 회원에게 발송된 전자발송 기록이 없습니다. 상단 [공지·안내 발송] 또는 [수료증·문서 발송]을 눌러 발송해 보세요.
                        </div>
                      ) : (
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                          {activeMemberDispatches.map((d) => (
                            <div
                              key={d.id}
                              className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-slate-50"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 truncate">{d.subject}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {d.channel} · {String(d.created_at || '').slice(0, 16).replace('T', ' ')}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                                  {DISPATCH_STATUS_LABELS[d.status] || d.status}
                                </span>
                                <button
                                  type="button"
                                  disabled={dispatchBusy}
                                  onClick={() => handleResendDispatchRecord(d)}
                                  className="px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-blue-50 text-blue-700 font-bold text-[10px] cursor-pointer"
                                >
                                  재발송
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: 기업 · 소속 권한 (Companies, Multi-Site S03 & Team Access S04) */}
        {/* ================================================================== */}
        {activeTab === 'companies' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.65fr] gap-4 items-start">
            {/* Left: Company Directory List */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    등록 기업 · 거래처 ({filteredCompanies.length}곳)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    기업을 선택해 소속 구성원·신청 코드·사업장 정보를 관리합니다.
                  </p>
                </div>
                {onCreateClient && (
                  <button
                    type="button"
                    onClick={onCreateClient}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>기업 추가</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="search"
                  name="companyDirectorySearch"
                  aria-label="기업명·업종·사업자번호 검색"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="기업명, 업종, 사업자번호 검색"
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div
                tabIndex={0}
                role="region"
                aria-label="등록 기업 목록"
                className="overflow-y-auto max-h-[520px] border border-slate-200 rounded-xl divide-y divide-slate-100"
              >
                {filteredCompanies.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    등록된 기업이 없습니다.
                  </div>
                ) : (
                  filteredCompanies.map((c) => {
                    const isSelected = selectedAdminCompany?.id === c.id;
                    const norm = normalizeCompanyProfile(c);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelectCompany?.(c)}
                        className={`w-full text-left px-3.5 py-3 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50/80 text-blue-950' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">{norm.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {norm.industry} {norm.bizNo ? `· ${norm.bizNo}` : ''}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {norm.sites.length}개 사업장
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Selected Company Team Access (S04) & Profile/Sites Form (S01·S03) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              {!selectedAdminCompany ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  왼쪽 목록에서 관리할 기업을 선택해 주세요.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[11px] font-bold text-blue-600">
                        선택된 기업 · 워크스페이스
                      </span>
                      <h2 className="text-base font-extrabold text-slate-900">
                        {selectedAdminCompany.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setCompanySubTab('team')}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          companySubTab === 'team'
                            ? 'bg-white text-blue-600 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        소속 구성원 · 신청코드 (S04)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompanySubTab('profile')}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          companySubTab === 'profile'
                            ? 'bg-white text-blue-600 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        기업 프로필 · 사업장 (S01·S03)
                      </button>
                    </div>
                  </div>

                  {companySubTab === 'team' ? (
                    <div className="space-y-4 text-xs">
                      {teamError && (
                        <div
                          role="alert"
                          className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between"
                        >
                          <span>{teamError}</span>
                          <button
                            type="button"
                            onClick={() => refreshTeamAccess(selectedAdminCompany.id)}
                            className="underline font-bold cursor-pointer"
                          >
                            다시 불러오기
                          </button>
                        </div>
                      )}

                      {/* Join Code Issue / Rotate / Electronic Dispatch Box */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <KeyRound className="w-4 h-4 text-blue-600" />
                              <span>직원 소속 신청 코드 관리 (S04)</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              코드를 입력한 직원은 승인 대기 상태로 등록되며, 회사 관리자가 승인하기 전에는 회사 문서에 접근할 수 없습니다.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              disabled={teamBusy}
                              onClick={() => handleLoadOrRotateCode(false)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                            >
                              신청 코드 확인
                            </button>
                            {joinCodeValue && (
                              <>
                                <button
                                  type="button"
                                  disabled={teamBusy}
                                  onClick={() => handleLoadOrRotateCode(true)}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                                >
                                  코드 재발급
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(joinCodeValue);
                                    notify('소속 신청 코드를 클립보드에 복사했습니다.');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>복사</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handoffToDispatch({
                                      templateKey: 'MEMBER_INVITE_CODE',
                                      channel: 'EMAIL',
                                      joinCode: joinCodeValue,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>전자발송으로 전달</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {joinCodeValue && (
                          <div className="p-2.5 rounded-lg bg-white border border-blue-200 font-mono text-xs text-blue-900 select-all break-all">
                            {joinCodeValue}
                          </div>
                        )}
                      </div>

                      {/* Pending Join Requests */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-extrabold text-slate-900">
                            소속 승인 대기 ({teamAccess?.requests?.length || 0}건)
                          </h3>
                          <fieldset className="flex items-center gap-2">
                            <legend className="sr-only">승인 시 부여할 역할</legend>
                            <span className="text-slate-500 font-semibold">승인 시 부여할 권한:</span>
                            <label className="inline-flex items-center gap-1 font-bold cursor-pointer">
                              <input
                                type="radio"
                                name="approveRoleRadio"
                                value="VIEWER"
                                checked={approveRole === 'VIEWER'}
                                onChange={() => setApproveRole('VIEWER')}
                                className="accent-blue-600"
                              />
                              <span>열람(VIEWER)</span>
                            </label>
                            <label className="inline-flex items-center gap-1 font-bold cursor-pointer">
                              <input
                                type="radio"
                                name="approveRoleRadio"
                                value="EDITOR"
                                checked={approveRole === 'EDITOR'}
                                onChange={() => setApproveRole('EDITOR')}
                                className="accent-blue-600"
                              />
                              <span>편집(EDITOR)</span>
                            </label>
                          </fieldset>
                        </div>

                        {!teamAccess?.requests?.length ? (
                          <div className="p-3 rounded-xl border border-slate-200 text-slate-400 text-center">
                            현재 대기 중인 소속 승인 요청이 없습니다.
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                            {teamAccess.requests.map((req) => (
                              <div
                                key={req.id}
                                className="p-3 flex flex-wrap items-center justify-between gap-2"
                              >
                                <div>
                                  <span className="font-bold text-slate-900">{req.name}</span>
                                  <span className="text-slate-500 ml-2 font-mono">{req.email}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={teamBusy}
                                    onClick={() => handleDecideJoinRequest(req.id, true)}
                                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                                  >
                                    승인 ({approveRole === 'EDITOR' ? '편집' : '열람'})
                                  </button>
                                  <button
                                    type="button"
                                    disabled={teamBusy}
                                    onClick={() => handleDecideJoinRequest(req.id, false)}
                                    className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold cursor-pointer"
                                  >
                                    반려
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Company Members Table */}
                      <div className="space-y-2">
                        <h3 className="font-extrabold text-slate-900">
                          소속 구성원 및 권한 대장 ({teamAccess?.members?.length || 0}명)
                        </h3>
                        <div
                          tabIndex={0}
                          role="region"
                          aria-label="기업 소속 구성원 표"
                          className="overflow-x-auto border border-slate-200 rounded-xl"
                        >
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-3">구성원</th>
                                <th className="py-2.5 px-3">이메일</th>
                                <th className="py-2.5 px-3">회사 권한</th>
                                <th className="py-2.5 px-3">상태</th>
                                <th className="py-2.5 px-3 text-right">관리</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {!teamAccess?.members?.length ? (
                                <tr>
                                  <td colSpan={5} className="py-6 text-center text-slate-400">
                                    로그인 후 기업 구성원 정보를 조회할 수 있습니다.
                                  </td>
                                </tr>
                              ) : (
                                teamAccess.members.map((m) => (
                                  <tr key={m.userId}>
                                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                                    <td className="py-2.5 px-3 font-mono text-slate-600">{m.email}</td>
                                    <td className="py-2.5 px-3">
                                      {teamAccess.canManage && m.active && m.role !== 'OWNER' ? (
                                        <select
                                          aria-label={`${m.name} 회사 권한 변경`}
                                          value={m.role}
                                          disabled={teamBusy}
                                          onChange={(e) =>
                                            handleChangeMemberRole(m.userId, e.target.value)
                                          }
                                          className="px-2 py-1 rounded border border-slate-200 bg-white font-bold text-slate-800"
                                        >
                                          <option value="EDITOR">편집 (EDITOR)</option>
                                          <option value="VIEWER">열람 (VIEWER)</option>
                                        </select>
                                      ) : (
                                        <span className="font-bold text-slate-800">
                                          {MEMBERSHIP_ROLE_LABELS[m.role] || m.role}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                          m.active
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}
                                      >
                                        {m.active ? '재직·활성' : '소속 해제'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right space-x-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handoffToDispatch({
                                            templateKey: 'MEMBER_JOIN_APPROVED',
                                            channel: 'ALIMTALK',
                                            recipientName: m.name,
                                            recipientContact: m.email,
                                          })
                                        }
                                        className="text-blue-600 font-bold hover:underline cursor-pointer"
                                      >
                                        안내 발송
                                      </button>
                                      {teamAccess.canManage && m.active && m.role !== 'OWNER' && (
                                        <button
                                          type="button"
                                          disabled={teamBusy}
                                          onClick={() => setRevokeTarget(m)}
                                          className="text-rose-700 font-bold hover:underline cursor-pointer"
                                        >
                                          소속 해제
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {revokeTarget && (
                        <div
                          role="group"
                          aria-label="소속 해제 확인"
                          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2"
                        >
                          <p className="text-rose-900 font-semibold">
                            {revokeTarget.name} ({revokeTarget.email}) 님의{' '}
                            <strong>{selectedAdminCompany.name}</strong> 문서·업무·프로젝트 접근을 해제합니다. 회사 자료는 삭제되지 않으며 감사 로그에 해제 이력이 남습니다.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={teamBusy}
                              onClick={handleRevokeMember}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                            >
                              확인 후 소속 해제
                            </button>
                            <button
                              type="button"
                              onClick={() => setRevokeTarget(null)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold cursor-pointer"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Join Another Company by Code */}
                      <form
                        className="pt-3 border-t border-slate-100 flex flex-wrap items-end gap-2"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const clean = joinCodeInput.trim();
                          if (
                            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                              clean
                            )
                          ) {
                            setTeamError('회사 관리자가 전달한 UUID 형식의 신청 코드를 확인해 주세요.');
                            return;
                          }
                          setTeamBusy(true);
                          setTeamError('');
                          try {
                            const { error } = await (await import('../lib/supabaseClient')).supabase.rpc(
                              'request_company_join',
                              { join_code: clean }
                            );
                            if (error) throw error;
                            setJoinCodeInput('');
                            notify('소속 승인 요청을 제출했습니다. 회사 관리자의 승인을 기다려 주세요.');
                          } catch (err) {
                            setTeamError(err.message || '소속 신청 처리 중 오류가 발생했습니다.');
                          } finally {
                            setTeamBusy(false);
                          }
                        }}
                      >
                        <div className="flex-1 min-w-[240px]">
                          <label
                            htmlFor="join-other-company-code"
                            className="block font-bold text-slate-700 mb-1"
                          >
                            타 기업 소속 신청 코드 입력
                          </label>
                          <input
                            id="join-other-company-code"
                            name="joinCode"
                            type="text"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            value={joinCodeInput}
                            onChange={(e) => setJoinCodeInput(e.target.value)}
                            placeholder="회사 관리자가 전달한 신청 코드 (UUID)"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={teamBusy}
                          className="px-3.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold cursor-pointer"
                        >
                          소속 승인 요청
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* Sub-tab 2: Company Profile & Multi-site Form (S01, S03) */
                    <form onSubmit={handleSaveCompanyProfile} className="space-y-4 text-xs">
                      {compFieldError && (
                        <div
                          role="alert"
                          className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700"
                        >
                          {compFieldError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="comp-name-input" className="block font-bold text-slate-700 mb-1">
                            기업·거래처명 (필수)
                          </label>
                          <input
                            id="comp-name-input"
                            name="companyName"
                            type="text"
                            required
                            value={compForm.name}
                            onChange={(e) => {
                              setCompForm({ ...compForm, name: e.target.value });
                              if (compFieldError) setCompFieldError('');
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200"
                          />
                        </div>

                        <div>
                          <label htmlFor="comp-bizno-input" className="block font-bold text-slate-700 mb-1">
                            사업자등록번호 (S03)
                          </label>
                          <input
                            id="comp-bizno-input"
                            name="bizNo"
                            type="text"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            value={compForm.bizNo}
                            onBlur={() => {
                              const check = validateCompanyProfileInput(compForm);
                              if (!check.valid && check.field === 'bizNo') setCompFieldError(check.error);
                            }}
                            onChange={(e) => {
                              setCompForm({ ...compForm, bizNo: e.target.value });
                              if (compFieldError) setCompFieldError('');
                            }}
                            placeholder="000-00-00000"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                          />
                        </div>

                        <div>
                          <label htmlFor="comp-ceo-input" className="block font-bold text-slate-700 mb-1">
                            대표자 성명
                          </label>
                          <input
                            id="comp-ceo-input"
                            name="ceoName"
                            type="text"
                            value={compForm.ceoName}
                            onChange={(e) => setCompForm({ ...compForm, ceoName: e.target.value })}
                            placeholder="예: 홍길동"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200"
                          />
                        </div>

                        <div>
                          <label htmlFor="comp-industry-input" className="block font-bold text-slate-700 mb-1">
                            주 업종 · 표준산업분류(KSIC)
                          </label>
                          <input
                            id="comp-industry-input"
                            name="industry"
                            type="text"
                            value={compForm.industry}
                            onChange={(e) => setCompForm({ ...compForm, industry: e.target.value })}
                            placeholder="예: 정밀기계 제조업 (C29)"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200"
                          />
                        </div>

                        <div>
                          <label htmlFor="comp-email-input" className="block font-bold text-slate-700 mb-1">
                            대표 이메일
                          </label>
                          <input
                            id="comp-email-input"
                            name="contactEmail"
                            type="email"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            value={compForm.contactEmail}
                            onChange={(e) => {
                              setCompForm({ ...compForm, contactEmail: e.target.value });
                              if (compFieldError) setCompFieldError('');
                            }}
                            placeholder="contact@company.co.kr"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                          />
                        </div>

                        <div>
                          <label htmlFor="comp-phone-input" className="block font-bold text-slate-700 mb-1">
                            대표 연락처
                          </label>
                          <input
                            id="comp-phone-input"
                            name="phone"
                            type="tel"
                            value={compForm.phone}
                            onChange={(e) => setCompForm({ ...compForm, phone: e.target.value })}
                            placeholder="02-000-0000"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                          />
                        </div>
                      </div>

                      {/* Multi-Site Management (PPT S03 다중 사업장 CRUD) */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-extrabold text-slate-900">
                              다중 사업장 (Site) 및 심사 범위 관리 ({compForm.sites.length}곳)
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              본사 외 공장·연구소·지사 등 ISO 인증 심사 범위(Scope)에 포함될 사업장을 관리합니다.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCompForm({
                                ...compForm,
                                sites: [
                                  ...compForm.sites,
                                  {
                                    id: `site-${Date.now()}`,
                                    name: `사업장 ${compForm.sites.length + 1}`,
                                    address: '',
                                    scope: '',
                                    headcount: 0,
                                    isHeadquarters: false,
                                  },
                                ],
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-bold cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>사업장 추가</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {compForm.sites.map((site, idx) => (
                            <div
                              key={site.id}
                              className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-[140px_1fr_1fr_80px_auto] gap-2 items-center"
                            >
                              <input
                                type="text"
                                aria-label={`사업장 ${idx + 1} 명칭`}
                                value={site.name}
                                onChange={(e) => {
                                  const next = [...compForm.sites];
                                  next[idx] = { ...site, name: e.target.value };
                                  setCompForm({ ...compForm, sites: next });
                                }}
                                placeholder="본사 / 제1공장"
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                              />
                              <input
                                type="text"
                                aria-label={`사업장 ${idx + 1} 주소`}
                                value={site.address}
                                onChange={(e) => {
                                  const next = [...compForm.sites];
                                  next[idx] = { ...site, address: e.target.value };
                                  setCompForm({ ...compForm, sites: next });
                                }}
                                placeholder="소재지 주소"
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                              />
                              <input
                                type="text"
                                aria-label={`사업장 ${idx + 1} 심사 범위`}
                                value={site.scope}
                                onChange={(e) => {
                                  const next = [...compForm.sites];
                                  next[idx] = { ...site, scope: e.target.value };
                                  setCompForm({ ...compForm, sites: next });
                                }}
                                placeholder="심사 적용 범위 (예: 설계·제조)"
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                              />
                              <input
                                type="text"
                                inputMode="numeric"
                                aria-label={`사업장 ${idx + 1} 상시 인원`}
                                value={site.headcount || ''}
                                onChange={(e) => {
                                  const next = [...compForm.sites];
                                  next[idx] = {
                                    ...site,
                                    headcount: Number(e.target.value.replace(/\D/g, '')) || 0,
                                  };
                                  setCompForm({ ...compForm, sites: next });
                                }}
                                placeholder="인원(명)"
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-right"
                              />
                              {compForm.sites.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCompForm({
                                      ...compForm,
                                      sites: compForm.sites.filter((s) => s.id !== site.id),
                                    })
                                  }
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  aria-label={`${site.name} 삭제`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">
                          ※ 공공데이터 사업자 상태 실시간 조회 API는 별도 연동 대상입니다.
                        </span>
                        <Button type="submit" disabled={compSaving}>
                          {compSaving ? '저장 중...' : '기업 프로필 · 사업장 저장'}
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: 관리자(조영빈) → 회원 전자발송 센터 & 알림 설정 (S04 · S25 · S27 · S34) */}
        {/* ================================================================== */}
        {activeTab === 'dispatch' && (
          <div className="space-y-5">
            {/* Top Admin Sender & Gateway Status Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold">
                  <Send className="w-3.5 h-3.5 text-blue-300" />
                  <span>발신 관리자: {dispatchSenderName} ({dispatchSenderEmail})</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] ${
                    gatewayStatus.emailConfigured
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  이메일: {gatewayStatus.emailProvider}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] ${
                    gatewayStatus.smsConfigured
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  알림톡·SMS: {gatewayStatus.smsProvider}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGatewayGuide((v) => !v)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  {showGatewayGuide ? '외부 발송 연동 설정 닫기' : '외부 발송(Resend·알림톡·SMS) 연동 설정 안내'}
                </button>
              </div>
            </div>

            {showGatewayGuide && (
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-blue-300">
                    실제 이메일(Resend/SMTP) 및 문자·카카오 알림톡 서버 직접 발송 연동 안내 (/api/admin-dispatch)
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGatewayGuide(false)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  서버 API 라우트(<code>/api/admin-dispatch</code>)가 준비되어 있습니다. 프로젝트 <code>.env.local</code> 또는 Vercel 환경변수에 아래 키를 등록하면 <strong>관리자 명의 일괄 전자발송 실행</strong> 클릭 시 외부 게이트웨이로 즉시 실발송되며, 미설정 시에는 거짓 성공 표시 없이 <strong>발송 대장 기록 + 메일앱(mailto) 일괄/개별 전달 모드</strong>로 동작합니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 font-mono text-[11px]">
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                    <div className="text-blue-300 font-sans font-bold">1) 이메일 실발송 + 파일 첨부 (Resend API)</div>
                    <div>RESEND_API_KEY=re_xxxxxxxxx</div>
                    <div>DISPATCH_FROM_EMAIL=ceo@honestone.kr</div>
                    <div>DISPATCH_SENDER_NAME=어니스톤 관리자 조영빈</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                    <div className="text-amber-300 font-sans font-bold">2) 카카오 알림톡 · SMS 웹훅/게이트웨이</div>
                    <div>DISPATCH_WEBHOOK_URL=https://...</div>
                    <div>SOLAPI_API_KEY=... / ALIGO_API_KEY=...</div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Grid: Left Composer (Admin -> Members) + Right Dispatch Ledger */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4 items-start">
              {/* Left: Admin-to-Members Electronic Dispatch Composer */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">
                      관리자(조영빈) → 회원 대상 전자발송 작성기
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      수신 회원을 개별·다중·전체·그룹별로 선택하고 문서·양식·수료증·공문을 동봉하여 일괄 또는 개별 전자발송합니다.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-extrabold">
                    수신 대상 {selectedRecipients.length > 0 ? `${selectedRecipients.length}명 선택됨` : dispatchRecipientContact ? '1명 입력됨' : '0명'}
                  </span>
                </div>

                {dispatchError && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700"
                  >
                    {dispatchError}
                  </div>
                )}

                {/* Sender Info + Channel Radio Buttons (<6 options) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="dispatch-sender-name" className="block font-bold text-slate-700 mb-1">
                      발신 관리자 성명 · 직함
                    </label>
                    <input
                      id="dispatch-sender-name"
                      type="text"
                      value={dispatchSenderName}
                      onChange={(e) => setDispatchSenderName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="dispatch-sender-email" className="block font-bold text-slate-700 mb-1">
                      발신 · 회신 이메일
                    </label>
                    <input
                      id="dispatch-sender-email"
                      type="email"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      value={dispatchSenderEmail}
                      onChange={(e) => setDispatchSenderEmail(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <fieldset className="space-y-1.5">
                  <legend className="font-bold text-slate-700">1. 발송 채널 선택</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {DISPATCH_CHANNELS.map((ch) => (
                      <label
                        key={ch.id}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border font-bold cursor-pointer ${
                          dispatchChannel === ch.id
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dispatchChannel"
                          value={ch.id}
                          checked={dispatchChannel === ch.id}
                          onChange={() => setDispatchChannel(ch.id)}
                          className="accent-blue-600"
                        />
                        <span>{ch.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Step 2: Multi-Recipient Member Selection (개별·다중·전체·그룹별) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-extrabold text-slate-800">
                      2. 수신 회원 선택 (개별 · 다중 · 그룹 일괄 선택)
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => addMembersToRecipients(snapshot.members)}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-blue-700 font-bold text-[11px] cursor-pointer"
                      >
                        + 전체 회원 ({snapshot.members.length}명)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          addMembersToRecipients(
                            snapshot.members.filter((m) => m.role === 'MEMBER' && m.isActive)
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-slate-700 font-bold text-[11px] cursor-pointer"
                      >
                        + 기업·수강생 전체
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          addMembersToRecipients(
                            snapshot.members.filter((m) => m.role === 'AUDITOR')
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-slate-700 font-bold text-[11px] cursor-pointer"
                      >
                        + 심사원·전문가 전체
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          addMembersToRecipients(
                            snapshot.members.filter(
                              (m) =>
                                m.completionStatus === 'COMPLETED' ||
                                m.completionStatus === 'CERTIFIED'
                            )
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 font-bold text-[11px] cursor-pointer"
                      >
                        + 수료생 전체
                      </button>
                      {selectedRecipients.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedRecipients([])}
                          className="px-2 py-1 rounded-lg bg-white border border-rose-200 text-rose-600 font-bold text-[11px] cursor-pointer"
                        >
                          전체 비우기
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Member Picker + Direct Contact Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.2fr_auto] gap-2 items-end">
                    <div>
                      <label htmlFor="dispatch-member-picker" className="block font-bold text-slate-600 mb-1">
                        회원 명부에서 추가
                      </label>
                      <select
                        id="dispatch-member-picker"
                        onChange={(e) => {
                          const found = snapshot.members.find((m) => m.id === e.target.value);
                          if (found) {
                            addMembersToRecipients([found]);
                            setDispatchRecipientName(found.fullName);
                            setDispatchRecipientContact(
                              dispatchChannel === 'EMAIL' ? found.email : found.phone || found.email
                            );
                            setDispatchRecipientCompany(found.primaryCompanyName || '');
                          }
                          e.target.value = '';
                        }}
                        defaultValue=""
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="">+ 등록 회원 선택 추가...</option>
                        {snapshot.members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.fullName} ({m.primaryCompanyName} · {m.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="dispatch-recipient-name" className="block font-bold text-slate-600 mb-1">
                        직접 입력: 수신자 성명
                      </label>
                      <input
                        id="dispatch-recipient-name"
                        name="recipientName"
                        type="text"
                        value={dispatchRecipientName}
                        onChange={(e) => setDispatchRecipientName(e.target.value)}
                        placeholder="홍길동 회원"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="dispatch-recipient-contact" className="block font-bold text-slate-600 mb-1">
                        {dispatchChannel === 'EMAIL' ? '직접 입력: 수신 이메일' : '직접 입력: 수신 연락처'}
                      </label>
                      <input
                        id="dispatch-recipient-contact"
                        name="recipientContact"
                        type="text"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        value={dispatchRecipientContact}
                        onChange={(e) => {
                          setDispatchRecipientContact(e.target.value);
                          if (dispatchError) setDispatchError('');
                        }}
                        placeholder={dispatchChannel === 'EMAIL' ? 'user@company.co.kr' : '010-0000-0000'}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!dispatchRecipientContact.trim()) {
                          setDispatchError('추가할 수신자의 이메일 또는 연락처를 입력해 주세요.');
                          return;
                        }
                        addMembersToRecipients([
                          {
                            id: `direct-${Date.now()}`,
                            fullName: dispatchRecipientName.trim() || '회원',
                            email: dispatchChannel === 'EMAIL' ? dispatchRecipientContact.trim() : '',
                            phone: dispatchChannel !== 'EMAIL' ? dispatchRecipientContact.trim() : '',
                            recipientContact: dispatchRecipientContact.trim(),
                            primaryCompanyName:
                              dispatchRecipientCompany.trim() || selectedAdminCompany?.name || '어니스톤 회원',
                          },
                        ]);
                        setDispatchRecipientName('');
                        setDispatchRecipientContact('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold whitespace-nowrap cursor-pointer"
                    >
                      + 수신 추가
                    </button>
                  </div>

                  {/* Selected Recipients Chip List */}
                  {selectedRecipients.length > 0 && (
                    <div className="pt-1 space-y-1.5">
                      <div className="text-[11px] font-bold text-blue-700">
                        선택된 수신 회원 명단 ({selectedRecipients.length}명 · 발송 시 각 회원의 성명·소속기업이 자동 치환됩니다)
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-white border border-slate-200">
                        {selectedRecipients.map((r) => (
                          <span
                            key={r.id || r.contact}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-semibold"
                          >
                            <span>{r.name}</span>
                            <span className="text-blue-600 font-mono">
                              ({r.companyName ? `${r.companyName} · ` : ''}
                              {dispatchChannel === 'EMAIL' ? r.email || r.contact : r.phone || r.contact})
                            </span>
                            <button
                              type="button"
                              aria-label={`${r.name} 수신 제외`}
                              onClick={() =>
                                setSelectedRecipients((prev) =>
                                  prev.filter((item) => (item.id || item.contact) !== (r.id || r.contact))
                                )
                              }
                              className="text-blue-500 hover:text-rose-600 font-bold cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 3: Template Selection + Custom Template Save/Delete (S32·S34) */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="dispatch-template-select" className="block font-bold text-slate-700">
                      3. 발송 목적 · 표준/커스텀 안내문 템플릿 선택 (S32)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {String(dispatchTemplateKey).startsWith('CUSTOM_') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomTemplate(dispatchTemplateKey)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>선택 템플릿 삭제</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const currentTpl = allDispatchTemplates.find((t) => t.key === dispatchTemplateKey);
                          if (!isSavingCustomTpl && currentTpl?.isCustom) {
                            setCustomTplTitle(currentTpl.title || '');
                            setCustomTplCategory(currentTpl.category || '커스텀');
                          }
                          setIsSavingCustomTpl((v) => !v);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] cursor-pointer"
                      >
                        <BookmarkPlus className="w-3 h-3" />
                        <span>{isSavingCustomTpl ? '템플릿 저장 닫기' : '+ 현재 문구를 내 템플릿으로 저장'}</span>
                      </button>
                    </div>
                  </div>
                  <select
                    id="dispatch-template-select"
                    name="templateKey"
                    value={dispatchTemplateKey}
                    onChange={(e) => {
                      const nextKey = e.target.value;
                      setDispatchTemplateKey(nextKey);
                      const tpl = allDispatchTemplates.find((t) => t.key === nextKey);
                      if (tpl) setDispatchChannel(tpl.defaultChannel || 'EMAIL');
                      setDispatchCustomSubject('');
                      setDispatchCustomBody('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900"
                  >
                    {allDispatchTemplates.map((tpl) => (
                      <option key={tpl.key} value={tpl.key}>
                        {tpl.isCustom ? '★ ' : ''}[{tpl.category}] {tpl.title}
                      </option>
                    ))}
                  </select>

                  {isSavingCustomTpl && (
                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                      <div className="font-extrabold text-indigo-950 text-[11px]">
                        현재 제목 · 본문 문구를 재사용 가능한 관리자 템플릿으로 저장 (치환 변수 &#123;&#123;수신자명&#125;&#125;, &#123;&#123;기업명&#125;&#125;, &#123;&#123;수강기수&#125;&#125;, &#123;&#123;수료번호&#125;&#125; 지원)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr_auto] gap-2">
                        <input
                          type="text"
                          aria-label="커스텀 템플릿 분류"
                          value={customTplCategory}
                          onChange={(e) => setCustomTplCategory(e.target.value)}
                          placeholder="분류 (예: 교육·수료)"
                          className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs font-bold"
                        />
                        <input
                          type="text"
                          aria-label="커스텀 템플릿 이름"
                          value={customTplTitle}
                          onChange={(e) => setCustomTplTitle(e.target.value)}
                          placeholder="저장할 템플릿 이름 (예: 2기 수료증 및 차기 심화과정 안내)"
                          className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleSaveCustomTemplate}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer"
                        >
                          템플릿 저장
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 4: Document / Template / Certificate / Local File Attachments */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                      <span>4. 동봉 문서 · 표준 양식 · 인증서/수료증 · 로컬 파일 첨부 ({dispatchAttachments.length}건)</span>
                    </div>
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-blue-700 font-bold text-[11px] cursor-pointer">
                      <Plus className="w-3 h-3" />
                      <span>내 PC 파일 첨부 (.pdf/.docx/.hwp)</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.hwp,.hwpx,.xlsx,.png,.jpg,.jpeg"
                        onChange={handleLocalFileAttach}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {/* Quick Official Presets (수료증, 착수공문, 보완요청서, 심사통보서, 갱신안내문) */}
                  <div className="flex flex-wrap gap-1.5">
                    {OFFICIAL_ATTACHMENT_PRESETS.map((preset) => {
                      const active = dispatchAttachments.some((a) => a.id === preset.id);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleToggleAttachmentPreset(preset)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer ${
                            active
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}
                          [{preset.category}] {preset.title}
                        </button>
                      );
                    })}
                  </div>

                  {/* Platform Stored Documents & ISO Standard Forms Picker */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      aria-label="플랫폼 보관 문서 동봉 추가"
                      defaultValue=""
                      onChange={(e) => {
                        const doc = documents.find((d) => String(d.id) === e.target.value);
                        if (doc) {
                          handleToggleAttachmentPreset({
                            id: `doc-${doc.id}`,
                            code: doc.code || doc.category || 'DOC',
                            title: doc.title || doc.name,
                            fileName: doc.fileName || `${doc.title || '문서'}.pdf`,
                            category: '기업 보관문서',
                          });
                        }
                        e.target.value = '';
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-[11px]"
                    >
                      <option value="">+ 플랫폼 등록 문서함에서 동봉 선택 ({documents.length}건)</option>
                      {documents.slice(0, 80).map((doc) => (
                        <option key={doc.id} value={String(doc.id)}>
                          [{doc.category || '문서'}] {doc.title || doc.name}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="ISO 표준 필수 양식 동봉 추가"
                      defaultValue=""
                      onChange={(e) => {
                        const req = ISO_MANDATORY_REQUIREMENTS.find((r) => r.id === e.target.value);
                        if (req) {
                          handleToggleAttachmentPreset({
                            id: `iso-${req.id}`,
                            code: req.code,
                            title: `${req.standard} · ${req.title}`,
                            fileName: `${req.code}_${req.title}.docx`,
                            category: 'ISO 표준양식',
                          });
                        }
                        e.target.value = '';
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-[11px]"
                    >
                      <option value="">+ ISO 표준 필수 양식 카탈로그에서 동봉 선택</option>
                      {ISO_MANDATORY_REQUIREMENTS.map((req) => (
                        <option key={req.id} value={req.id}>
                          [{req.standard}] {req.code} {req.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Active Attachments List */}
                  {dispatchAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {dispatchAttachments.map((att) => (
                        <span
                          key={att.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 text-[11px] font-bold"
                        >
                          <FileText className="w-3 h-3 text-indigo-600" />
                          <span>
                            [{att.category}] {att.title}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDispatchAttachments((prev) => prev.filter((a) => a.id !== att.id))
                            }
                            className="text-indigo-500 hover:text-rose-600 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Variable Inputs for Dynamic Substitution */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label htmlFor="dispatch-var-code" className="block font-bold text-slate-600 mb-1">
                      치환 변수: 신청 코드
                    </label>
                    <input
                      id="dispatch-var-code"
                      type="text"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      value={dispatchJoinCode || joinCodeValue}
                      onChange={(e) => setDispatchJoinCode(e.target.value)}
                      placeholder="UUID 신청 코드"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="dispatch-var-std" className="block font-bold text-slate-600 mb-1">
                      치환 변수: 대상 과정·규격
                    </label>
                    <input
                      id="dispatch-var-std"
                      type="text"
                      value={dispatchStandardName}
                      onChange={(e) => setDispatchStandardName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="dispatch-var-date" className="block font-bold text-slate-600 mb-1">
                      치환 변수: 기준/목표일
                    </label>
                    <input
                      id="dispatch-var-date"
                      type="date"
                      value={dispatchTargetDate}
                      onChange={(e) => setDispatchTargetDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="dispatch-var-supp" className="block font-bold text-slate-600 mb-1">
                      치환 변수: 주요 안내 · 발송 문서 · 보완 요청 내역
                    </label>
                    <input
                      id="dispatch-var-supp"
                      type="text"
                      value={dispatchSupplementText}
                      onChange={(e) => setDispatchSupplementText(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px]"
                    />
                  </div>
                </div>

                {/* Editable Subject & Body Preview */}
                <div className="space-y-2">
                  <div>
                    <label htmlFor="dispatch-subject-input" className="block font-bold text-slate-700 mb-1">
                      발송 제목 (미리보기 및 직접 수정 가능)
                    </label>
                    <input
                      id="dispatch-subject-input"
                      name="subject"
                      type="text"
                      value={dispatchCustomSubject || previewedDispatch.subject}
                      onChange={(e) => setDispatchCustomSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="dispatch-body-textarea" className="block font-bold text-slate-700 mb-1">
                      발송 본문 (수신 회원별 자동 치환 미리보기 · 직접 편집 가능)
                    </label>
                    <textarea
                      id="dispatch-body-textarea"
                      name="body"
                      rows={8}
                      value={dispatchCustomBody || previewedDispatch.body}
                      onChange={(e) => setDispatchCustomBody(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 font-sans text-xs leading-relaxed text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={dispatchBusy}
                    onClick={() => handleExecuteDispatch('COPIED')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>발송문 복사 + 대장 기록</span>
                  </button>
                  {dispatchChannel === 'EMAIL' && (
                    <button
                      type="button"
                      disabled={dispatchBusy}
                      onClick={() => handleExecuteDispatch('MAILTO_OPENED')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>
                        {selectedRecipients.length > 1
                          ? `메일 앱 일괄(BCC ${selectedRecipients.length}명) 열기`
                          : '메일 앱(mailto) 열기'}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={dispatchBusy}
                    onClick={() => handleExecuteDispatch('SERVER_OR_QUEUE')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-2xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {dispatchBusy
                        ? '전자발송 처리 중...'
                        : `관리자 명의 전자발송 실행 (${
                            selectedRecipients.length > 0
                              ? `${selectedRecipients.length}명`
                              : dispatchRecipientContact
                              ? '1명'
                              : '수신자 선택'
                          })`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Right: Member Electronic Dispatch History, Delivery Status, Resend & CSV */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">
                      회원별 전자발송 대장 · 수신 상태 ({filteredDispatches.length}건)
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      관리자(조영빈)가 회원에게 발송한 내역·첨부 문서·수신 상태를 조회하고 즉시 재발송하거나 CSV로 내려받습니다.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={dispatchBusy || retryableDispatches.length === 0}
                      onClick={handleBatchRetryDispatches}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-bold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>대기·실패 일괄 재발송 ({retryableDispatches.length}건)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadCsvText(
                          `honestone-dispatches-${new Date().toISOString().slice(0, 10)}.csv`,
                          buildDispatchesCsv(filteredDispatches)
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>발송 대장 CSV</span>
                    </button>
                  </div>
                </div>

                {/* Filters for Dispatch Ledger */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    aria-label="전자발송 채널 필터"
                    value={dispatchChannelFilter}
                    onChange={(e) => setDispatchChannelFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700"
                  >
                    <option value="ALL">전체 채널</option>
                    <option value="EMAIL">이메일 (EMAIL)</option>
                    <option value="ALIMTALK">카카오 알림톡</option>
                    <option value="SMS">문자 (SMS)</option>
                  </select>

                  <select
                    aria-label="전자발송 수신 상태 필터"
                    value={dispatchStatusFilter}
                    onChange={(e) => setDispatchStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700"
                  >
                    <option value="ALL">전체 상태</option>
                    <option value="SENT">발송 완료 (SENT)</option>
                    <option value="QUEUED">발송 대기/큐 (QUEUED)</option>
                    <option value="MAILTO_OPENED">메일 앱 전달됨</option>
                    <option value="FAILED">발송 실패 (FAILED)</option>
                  </select>

                  <input
                    type="search"
                    aria-label="발송 대장 회원·기업·제목 검색"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={dispatchHistoryQuery}
                    onChange={(e) => setDispatchHistoryQuery(e.target.value)}
                    placeholder="수신 회원, 기업, 제목 검색"
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div
                  tabIndex={0}
                  role="region"
                  aria-label="전자발송 이력 대장"
                  className="overflow-auto max-h-[560px] border border-slate-200 rounded-xl"
                >
                  <table className="w-full text-left text-xs border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 border-b border-slate-200">일시 · 채널</th>
                        <th className="py-2.5 px-3 border-b border-slate-200">수신 회원 · 소속</th>
                        <th className="py-2.5 px-3 border-b border-slate-200">제목 · 동봉문서</th>
                        <th className="py-2.5 px-3 border-b border-slate-200">상태</th>
                        <th className="py-2.5 px-3 border-b border-slate-200 text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDispatches.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            조건에 맞는 전자발송 이력이 없습니다. 왼쪽 작성기에서 수신 회원을 선택해 발송해 보세요.
                          </td>
                        </tr>
                      ) : (
                        filteredDispatches.map((d) => {
                          const attachments = Array.isArray(d.attachments)
                            ? d.attachments
                            : Array.isArray(d.metadata?.attachments)
                            ? d.metadata.attachments
                            : [];
                          return (
                            <tr key={d.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <div className="font-bold text-slate-800">{d.channel}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {String(d.created_at || '').slice(0, 16).replace('T', ' ')}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">
                                  {d.recipient_name || '회원'}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {d.recipient_contact}
                                </div>
                                {(d.company_name || d.metadata?.companyName) && (
                                  <div className="text-[10px] text-slate-400">
                                    {d.company_name || d.metadata?.companyName}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-800 line-clamp-1">
                                  {d.subject}
                                </div>
                                {attachments.length > 0 && (
                                  <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                    <Paperclip className="w-2.5 h-2.5" />
                                    첨부 {attachments.length}건
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                    d.status === 'SENT'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : d.status === 'FAILED'
                                      ? 'bg-rose-50 text-rose-700'
                                      : 'bg-blue-50 text-blue-700'
                                  }`}
                                >
                                  {DISPATCH_STATUS_LABELS[d.status] || d.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setInspectDispatchItem(d)}
                                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] cursor-pointer"
                                  >
                                    전문
                                  </button>
                                  <button
                                    type="button"
                                    disabled={dispatchBusy}
                                    onClick={() => handleResendDispatchRecord(d)}
                                    className="px-2 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] cursor-pointer"
                                  >
                                    재발송
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Section: PPT S34 Notification Trigger & Timing Rules */}
            <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    알림 발송 조건 및 시점 커스텀 규칙 설정 (PPT S34)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    워크플로우 이벤트별 트리거 조건, 발송 시점(즉시 / D-Day 오프셋), 대상 권한 및 발송 채널을 정의합니다.
                  </p>
                </div>
              </div>

              <div
                tabIndex={0}
                role="region"
                aria-label="알림 발송 조건 및 시점 규칙 표"
                className="overflow-x-auto border border-slate-200 rounded-xl"
              >
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">이벤트 트리거</th>
                      <th className="py-2.5 px-3">발송 필터 조건</th>
                      <th className="py-2.5 px-3">발송 시점 (Offset)</th>
                      <th className="py-2.5 px-3">수신 대상</th>
                      <th className="py-2.5 px-3">연동 채널</th>
                      <th className="py-2.5 px-3 text-center">규칙 상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {snapshot.notificationRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-bold text-slate-900">{rule.eventLabel}</td>
                        <td className="py-3 px-3 text-slate-600">{rule.conditionText}</td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-700">
                          {rule.timingOffset}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{rule.targetRole}</td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {rule.channels.map((c) => (
                              <span
                                key={c}
                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]"
                              >
                                {c === 'IN_APP' ? '플랫폼 알림' : c === 'EMAIL' ? '이메일' : c === 'ALIMTALK' ? '알림톡' : 'SMS'}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleNotificationRule(rule.id)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                              rule.active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {rule.active ? '● 활성' : '○ 비활성'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: 심사원 · 기준 CMS · 운영 (S21 · S31 · S32 · S33 · S35)        */}
        {/* ================================================================== */}
        {activeTab === 'operations' && (
          <div className="space-y-4">
            {/* Sub-tab Switcher */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  ['auditors', '심사원 · 전문가 자격 풀 (S21)', Award],
                  ['cms', '인증별 표준 템플릿 · 기준정보 CMS (S32)', BookOpen],
                  ['metrics', '통합 운영 지표 · 접수/정산 틀 (S31·S33·S35)', BarChart3],
                ].map(([key, label, Icon]) => {
                  const active = opsSubTab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setOpsSubTab(key)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {opsSubTab === 'auditors' && (
                <button
                  type="button"
                  onClick={() => setIsAuditorModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>심사원·전문가 프로필 추가</span>
                </button>
              )}
            </div>

            {/* Sub-tab 1: Auditor Qualification Pool (PPT S21) */}
            {opsSubTab === 'auditors' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    심사원 및 준비 지원 컨설턴트 자격 풀 (PPT S21 · B02)
                  </h2>
                  <p className="text-xs text-slate-500">
                    전문 분야(ISO 규격), 활동 지역, 자격 번호 및 이해상충 검토 상태를 관리합니다. (공식 인증기관 심사원과 내부 준비 지원 전문가를 구분하여 기록합니다.)
                  </p>
                </div>

                <div
                  tabIndex={0}
                  role="region"
                  aria-label="심사원 및 전문가 인력 풀 표"
                  className="overflow-x-auto border border-slate-200 rounded-xl"
                >
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">성명 · 이메일</th>
                        <th className="py-2.5 px-3">자격 등급 · 구분</th>
                        <th className="py-2.5 px-3">전문 규격</th>
                        <th className="py-2.5 px-3">자격증명 번호</th>
                        <th className="py-2.5 px-3">활동 지역</th>
                        <th className="py-2.5 px-3">이해상충 검토 (S22)</th>
                        <th className="py-2.5 px-3 text-center">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {snapshot.auditorPool.map((aud) => (
                        <tr key={aud.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{aud.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{aud.email}</div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{aud.grade}</td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {(aud.standards || []).map((s) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px]"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">{aud.licenseNo}</td>
                          <td className="py-3 px-3 text-slate-600">{aud.region}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                              {aud.conflictStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-emerald-700">
                              {aud.active ? '● 가용' : '○ 비활성'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Standard Template & Criteria CMS (PPT S32) */}
            {opsSubTab === 'cms' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">
                      인증별 표준 템플릿 및 기준 정보 CMS (PPT S32)
                    </h2>
                    <p className="text-xs text-slate-500">
                      ISO 규격별 필수 구비서류·체크리스트 마스터 기준과 배포 상태(Draft · Review · Published)를 관리합니다.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="CMS 규격 선택"
                      value={cmsStandardFilter}
                      onChange={(e) => setCmsStandardFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                    >
                      <option value="ALL">전체 규격 ({ISO_MANDATORY_REQUIREMENTS.length})</option>
                      {ISO_STANDARDS_INFO.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="search"
                      aria-label="CMS 템플릿 검색"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      value={cmsQuery}
                      onChange={(e) => setCmsQuery(e.target.value)}
                      placeholder="문서 코드, 제목, 조항 검색"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-52"
                    />
                  </div>
                </div>

                <div
                  tabIndex={0}
                  role="region"
                  aria-label="표준 템플릿 기준정보 CMS 표"
                  className="overflow-auto max-h-[520px] border border-slate-200 rounded-xl"
                >
                  <table className="w-full text-left text-xs border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 border-b border-slate-200">규격 · 코드</th>
                        <th className="py-2.5 px-3 border-b border-slate-200">표준 서식 · 구비서류명</th>
                        <th className="py-2.5 px-3 border-b border-slate-200">조항 · 계층</th>
                        <th className="py-2.5 px-3 border-b border-slate-200">버전</th>
                        <th className="py-2.5 px-3 border-b border-slate-200">배포 상태 (Workflow)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cmsRequirements.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                            <div>{req.standard}</div>
                            <div className="text-[11px] text-blue-600">{req.code}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{req.title}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">
                              {req.description}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                            조항 {req.clause || '-'} · {req.level}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                            {req.versionLabel}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <select
                              aria-label={`${req.title} 배포 상태`}
                              value={req.releaseStatus}
                              onChange={(e) => {
                                saveCmsOverrideLocal(req.id, { releaseStatus: e.target.value });
                                refreshSnapshot();
                                notify(`'${req.title}' 기준 상태를 ${e.target.value}(으)로 변경했습니다.`);
                              }}
                              className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] ${
                                req.releaseStatus === 'Published'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : req.releaseStatus === 'Review'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <option value="Published">Published (배포됨)</option>
                              <option value="Review">Review (검토 중)</option>
                              <option value="Draft">Draft (초안)</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Operational Metrics & Application/Settlement Register (S31·S33·S35) */}
            {opsSubTab === 'metrics' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                  <h2 className="text-sm font-extrabold text-slate-900">
                    플랫폼 운영 집계 및 프로젝트 접수 현황 (PPT S31 · S33)
                  </h2>
                  <p className="text-xs text-slate-500">
                    현재 등록된 실제 기업·프로젝트·문서 데이터를 기반으로 집계한 운영 대장입니다.
                  </p>

                  <div
                    tabIndex={0}
                    role="region"
                    aria-label="프로젝트 접수 및 보완 관리 표"
                    className="overflow-x-auto border border-slate-200 rounded-xl"
                  >
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">기업 · 프로젝트명</th>
                          <th className="py-2.5 px-3">적용 규격</th>
                          <th className="py-2.5 px-3">내부 목표일</th>
                          <th className="py-2.5 px-3">진행 단계 (S33)</th>
                          <th className="py-2.5 px-3">비고</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {projects.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              현재 등록된 프로젝트가 없습니다.
                            </td>
                          </tr>
                        ) : (
                          projects.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-bold text-slate-900">
                                {p.clientName || p.title}
                              </td>
                              <td className="py-2.5 px-3">
                                {Array.isArray(p.standards) ? p.standards.join(', ') : p.standard || 'ISO 9001'}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">
                                {p.targetDate || '미지정'}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px]">
                                  {p.status || '준비 진행 중'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                내부 준비 프로젝트 (공식 인증기관 심사 접수와 구분)
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 5: 보안 감사 로그 (Security Audit Logs S02 · S04 · S17 · S30)    */}
        {/* ================================================================== */}
        {activeTab === 'audit-logs' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  보안 및 권한 감사 추적 대장 (Audit Trail · {filteredAuditLogs.length}건)
                </h2>
                <p className="text-xs text-slate-500">
                  로그인(AUTH), 회원·기업 소속 변경(COMPANY_MEMBERSHIP), 문서 제·개정(DOCUMENT), 프로젝트(AUDIT_PROJECT), 전자발송(ELECTRONIC_DISPATCH) 이력을 조회합니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="감사 로그 리소스 필터"
                  value={logResourceFilter}
                  onChange={(e) => setLogResourceFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700"
                >
                  <option value="ALL">전체 리소스 유형</option>
                  <option value="AUTH">인증 · 로그인 (AUTH)</option>
                  <option value="COMPANY_MEMBERSHIP">기업 소속 · 권한 (COMPANY_MEMBERSHIP)</option>
                  <option value="MEMBER_PROFILE">회원 프로필 · 역할 (MEMBER_PROFILE)</option>
                  <option value="COMPANY_SETTINGS">기업 프로필 · 설정 (COMPANY_SETTINGS)</option>
                  <option value="ELECTRONIC_DISPATCH">전자발송 (ELECTRONIC_DISPATCH)</option>
                  <option value="DOCUMENT">문서 (DOCUMENT)</option>
                  <option value="AUDIT_PROJECT">프로젝트 (AUDIT_PROJECT)</option>
                </select>

                <input
                  type="search"
                  aria-label="감사 로그 검색"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={logQuery}
                  onChange={(e) => setLogQuery(e.target.value)}
                  placeholder="이메일, 리소스명, 액션 검색"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-52"
                />

                <button
                  type="button"
                  onClick={() =>
                    downloadCsvText(
                      `honestone-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
                      buildAuditLogsCsv(filteredAuditLogs)
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>감사 로그 CSV</span>
                </button>
              </div>
            </div>

            <div
              tabIndex={0}
              role="region"
              aria-label="보안 감사 로그 표"
              className="overflow-auto max-h-[560px] border border-slate-200 rounded-xl"
            >
              <table className="w-full text-left text-xs border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 border-b border-slate-200">발생 일시</th>
                    <th className="py-2.5 px-3 border-b border-slate-200">수행자</th>
                    <th className="py-2.5 px-3 border-b border-slate-200">작업 유형</th>
                    <th className="py-2.5 px-3 border-b border-slate-200">대상 리소스</th>
                    <th className="py-2.5 px-3 border-b border-slate-200">상세 내역</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        조회된 감사 로그가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {String(log.created_at || log.createdAt || '')
                            .slice(0, 19)
                            .replace('T', ' ')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800">
                          {log.user_email || log.userEmail || '인증 사용자'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[11px]">
                            {log.action_type || log.actionType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-700 whitespace-nowrap">
                          {log.target_resource || log.targetResource}
                          {log.resource_title ? ` · ${log.resource_title}` : ''}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 max-w-md truncate">
                          {typeof log.details === 'object'
                            ? JSON.stringify(log.details)
                            : String(log.details || '-')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Register / Invite New Member or Student (S02·B01) */}
      {isInviteModalOpen && (
        <ModalLayer
          onClose={() => setIsInviteModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>신규 회원 · 수강생 단건 등록 (S02 · B01)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                aria-label="닫기"
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteError && (
              <div
                role="alert"
                className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700"
              >
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="invite-member-name" className="block font-bold text-slate-700 mb-1">
                    성명 (필수)
                  </label>
                  <input
                    id="invite-member-name"
                    name="fullName"
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label htmlFor="invite-member-phone" className="block font-bold text-slate-700 mb-1">
                    휴대전화 번호
                  </label>
                  <input
                    id="invite-member-phone"
                    name="phone"
                    type="tel"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="invite-member-email" className="block font-bold text-slate-700 mb-1">
                  이메일 (필수 · 가입/전자발송 수신 주소)
                </label>
                <input
                  id="invite-member-email"
                  name="email"
                  type="email"
                  required
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@company.co.kr"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="invite-member-company" className="block font-bold text-slate-700 mb-1">
                    등록 기업 연결
                  </label>
                  <select
                    id="invite-member-company"
                    name="companyId"
                    value={inviteCompanyId}
                    onChange={(e) => setInviteCompanyId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">직접 입력 또는 미지정</option>
                    {snapshot.companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="invite-custom-company" className="block font-bold text-slate-700 mb-1">
                    소속 기업명 직접 표기
                  </label>
                  <input
                    id="invite-custom-company"
                    type="text"
                    value={inviteCustomCompanyName}
                    onChange={(e) => setInviteCustomCompanyName(e.target.value)}
                    placeholder="예: (주)대한정밀"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <fieldset className="space-y-1">
                <legend className="font-bold text-slate-700">부여 역할</legend>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    ['MEMBER', '기업실무·수강생'],
                    ['AUDITOR', '심사원·전문가'],
                    ['ADMIN', '최고관리자'],
                  ].map(([rVal, rLabel]) => (
                    <label
                      key={rVal}
                      className={`p-2 rounded-xl border text-center font-bold cursor-pointer ${
                        inviteRole === rVal
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="inviteRole"
                        value={rVal}
                        checked={inviteRole === rVal}
                        onChange={() => setInviteRole(rVal)}
                        className="sr-only"
                      />
                      <span>{rLabel}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* 수강 기수 · 교육 과정 · 수료 상태 (B01) */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-700" />
                  <span>수강생 기수 · 양성과정 · 수료 상태 (선택)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="invite-cohort" className="block font-bold text-slate-700 mb-1">
                      수강 기수
                    </label>
                    <input
                      id="invite-cohort"
                      type="text"
                      value={inviteCohort}
                      onChange={(e) => setInviteCohort(e.target.value)}
                      placeholder="예: 1기, 2기, 2026-상반기"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="invite-completion" className="block font-bold text-slate-700 mb-1">
                      수료 상태
                    </label>
                    <select
                      id="invite-completion"
                      value={inviteCompletionStatus}
                      onChange={(e) => setInviteCompletionStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white font-bold"
                    >
                      {Object.entries(COMPLETION_STATUS_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="invite-course-name" className="block font-bold text-slate-700 mb-1">
                    교육 과정명
                  </label>
                  <input
                    id="invite-course-name"
                    type="text"
                    list="training-course-presets-modal"
                    value={inviteCourseName}
                    onChange={(e) => setInviteCourseName(e.target.value)}
                    placeholder="예: ISO 9001·14001·45001 통합 내부심사원 양성과정"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white"
                  />
                  <datalist id="training-course-presets-modal">
                    {TRAINING_COURSE_PRESETS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label htmlFor="invite-member-dept" className="block font-bold text-slate-700 mb-1">
                  부서 · 직책
                </label>
                <input
                  id="invite-member-dept"
                  name="department"
                  type="text"
                  value={inviteDept}
                  onChange={(e) => setInviteDept(e.target.value)}
                  placeholder="예: 품질보증팀 / 팀장"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={inviteOpenDispatchAfter}
                  onChange={(e) => setInviteOpenDispatchAfter(e.target.checked)}
                  className="rounded border-blue-300 text-blue-600"
                />
                <span>등록 즉시 이 회원을 수신자로 지정하여 전자발송(가입/수료 안내) 작성기로 이동</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  명부 등록 완료
                </button>
              </div>
            </form>
          </div>
        </ModalLayer>
      )}

      {/* Modal 4: CSV / Excel Bulk Member & Trainee Roster Import Modal (S02·B01) */}
      {isCsvRosterModalOpen && (
        <ModalLayer
          onClose={() => setIsCsvRosterModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  <span>CSV · 엑셀 회원/수강생 명단 일괄 등록 (S02 · B01)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  엑셀(CSV) 파일을 업로드하거나 표 영역을 그대로 복사·붙여넣어 다수 회원·수강생을 한 번에 등록하고 일괄 전자발송으로 연계합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCsvRosterModalOpen(false)}
                aria-label="닫기"
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-600">
                지원 컬럼: <strong>성명, 이메일, 연락처, 소속기업, 부서, 역할, 수강기수, 교육과정명, 수료상태, 수료번호, 관리자메모</strong>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    downloadCsvText('honestone-member-roster-sample.csv', buildSampleRosterCsv())
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>샘플 양식(.csv) 다운로드</span>
                </button>
                <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>CSV 파일 불러오기</span>
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleCsvFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="csv-default-company" className="block font-bold text-slate-700 mb-1">
                  소속기업 미기재 행 기본 배정 기업 (선택)
                </label>
                <select
                  id="csv-default-company"
                  value={csvRosterDefaultCompanyId}
                  onChange={(e) => setCsvRosterDefaultCompanyId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">지정 안 함 (CSV 소속기업명 그대로 사용)</option>
                  {snapshot.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="csv-default-cohort" className="block font-bold text-slate-700 mb-1">
                  수강기수 미기재 행 기본 기수 (선택)
                </label>
                <input
                  id="csv-default-cohort"
                  type="text"
                  value={csvRosterDefaultCohort}
                  onChange={(e) => setCsvRosterDefaultCohort(e.target.value)}
                  placeholder="예: 2기"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="csv-roster-textarea" className="block font-bold text-slate-700 mb-1">
                CSV 또는 엑셀 복사 데이터 붙여넣기
              </label>
              <textarea
                id="csv-roster-textarea"
                rows={5}
                value={csvRosterText}
                onChange={(e) => setCsvRosterText(e.target.value)}
                placeholder={
                  '성명,이메일,연락처,소속기업,부서,역할,수강기수,교육과정명,수료상태\n김수강,trainee1@example.co.kr,010-1234-5678,(주)대한정밀,품질관리팀,수강생,2기,ISO 9001·14001·45001 통합 내부심사원 양성과정,수료완료'
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px] leading-relaxed"
              />
            </div>

            {/* Live Parsed Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800">
                  파싱 미리보기: 정상 {parsedCsvRoster.validRows.length}건
                  {parsedCsvRoster.invalidRows.length > 0 && (
                    <span className="text-rose-600 ml-2">
                      · 오류 {parsedCsvRoster.invalidRows.length}건
                    </span>
                  )}
                </span>
                {csvRosterText && (
                  <button
                    type="button"
                    onClick={() => setCsvRosterText('')}
                    className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    입력 초기화
                  </button>
                )}
              </div>

              {parsedCsvRoster.validRows.length > 0 && (
                <div className="max-h-44 overflow-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-[11px] border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-slate-50 text-slate-500 font-bold">
                      <tr>
                        <th className="py-1.5 px-2.5 border-b border-slate-200">성명</th>
                        <th className="py-1.5 px-2.5 border-b border-slate-200">이메일</th>
                        <th className="py-1.5 px-2.5 border-b border-slate-200">연락처</th>
                        <th className="py-1.5 px-2.5 border-b border-slate-200">소속기업</th>
                        <th className="py-1.5 px-2.5 border-b border-slate-200">기수 · 수료상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedCsvRoster.validRows.map((r, idx) => (
                        <tr key={`${r.email}-${idx}`}>
                          <td className="py-1.5 px-2.5 font-bold text-slate-900">{r.fullName}</td>
                          <td className="py-1.5 px-2.5 font-mono text-slate-600">{r.email}</td>
                          <td className="py-1.5 px-2.5 font-mono text-slate-600">{r.phone || '-'}</td>
                          <td className="py-1.5 px-2.5 text-slate-700">{r.companyName || '-'}</td>
                          <td className="py-1.5 px-2.5 text-amber-800 font-bold">
                            {r.cohort || csvRosterDefaultCohort || '-'} ·{' '}
                            {COMPLETION_STATUS_LABELS[r.completionStatus] || r.completionStatus}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {parsedCsvRoster.invalidRows.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] space-y-1">
                  {parsedCsvRoster.invalidRows.map((err, idx) => (
                    <div key={idx}>
                      {err.lineNumber}행 오류: {err.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCsvRosterModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                disabled={csvRosterBusy || parsedCsvRoster.validRows.length === 0}
                onClick={() => handleCsvRosterSubmit(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold cursor-pointer"
              >
                {csvRosterBusy
                  ? '일괄 등록 중...'
                  : `명단 일괄 등록 (${parsedCsvRoster.validRows.length}명)`}
              </button>
              <button
                type="button"
                disabled={csvRosterBusy || parsedCsvRoster.validRows.length === 0}
                onClick={() => handleCsvRosterSubmit(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>일괄 등록 후 전체 전자발송으로 이동</span>
              </button>
            </div>
          </div>
        </ModalLayer>
      )}

      {/* Modal 2: Auditor Pool Registration Modal (S21) */}
      {isAuditorModalOpen && (
        <ModalLayer
          onClose={() => setIsAuditorModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                심사원 · 전문가 자격 프로필 등록 (S21)
              </h3>
              <button
                type="button"
                onClick={() => setIsAuditorModalOpen(false)}
                aria-label="닫기"
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAuditorPool} className="space-y-3">
              <div>
                <label htmlFor="aud-name" className="block font-bold text-slate-700 mb-1">
                  성명 (필수)
                </label>
                <input
                  id="aud-name"
                  type="text"
                  required
                  value={newAuditorName}
                  onChange={(e) => setNewAuditorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label htmlFor="aud-email" className="block font-bold text-slate-700 mb-1">
                  이메일 (필수)
                </label>
                <input
                  id="aud-email"
                  type="email"
                  required
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={newAuditorEmail}
                  onChange={(e) => setNewAuditorEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label htmlFor="aud-grade" className="block font-bold text-slate-700 mb-1">
                  자격 등급
                </label>
                <input
                  id="aud-grade"
                  type="text"
                  value={newAuditorGrade}
                  onChange={(e) => setNewAuditorGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label htmlFor="aud-license" className="block font-bold text-slate-700 mb-1">
                  자격증명 번호
                </label>
                <input
                  id="aud-license"
                  type="text"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={newAuditorLicense}
                  onChange={(e) => setNewAuditorLicense(e.target.value)}
                  placeholder="KAB-LA-2026-0001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>
              <div>
                <label htmlFor="aud-region" className="block font-bold text-slate-700 mb-1">
                  활동 가능 지역
                </label>
                <input
                  id="aud-region"
                  type="text"
                  value={newAuditorRegion}
                  onChange={(e) => setNewAuditorRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAuditorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </ModalLayer>
      )}

      {/* Modal 3: Electronic Dispatch Full Record Inspector Modal */}
      {inspectDispatchItem && (
        <ModalLayer
          onClose={() => setInspectDispatchItem(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-600">
                  전자발송 대장 상세 · 전문 확인
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {inspectDispatchItem.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectDispatchItem(null)}
                aria-label="닫기"
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-400 font-bold">발신 관리자</div>
                <div className="font-bold text-slate-900">
                  {inspectDispatchItem.metadata?.senderName || DEFAULT_ADMIN_SENDER.name}
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  {inspectDispatchItem.sender_email ||
                    inspectDispatchItem.metadata?.senderEmail ||
                    DEFAULT_ADMIN_SENDER.email}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold">수신 회원</div>
                <div className="font-bold text-slate-900">
                  {inspectDispatchItem.recipient_name || '회원'}
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  {inspectDispatchItem.recipient_contact}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold">채널 · 발송일시</div>
                <div className="font-mono font-bold text-slate-800">
                  {inspectDispatchItem.channel} ·{' '}
                  {String(inspectDispatchItem.created_at || '').slice(0, 19).replace('T', ' ')}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold">수신·발송 상태</div>
                <div className="font-bold text-blue-700">
                  {DISPATCH_STATUS_LABELS[inspectDispatchItem.status] || inspectDispatchItem.status}
                </div>
                {inspectDispatchItem.metadata?.deliveryNote && (
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {inspectDispatchItem.metadata.deliveryNote}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-700 mb-1">발송 본문 전문</div>
              <pre className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-800 max-h-64 overflow-y-auto">
                {inspectDispatchItem.body}
              </pre>
            </div>

            {(inspectDispatchItem.attachments?.length > 0 ||
              inspectDispatchItem.metadata?.attachments?.length > 0) && (
              <div>
                <div className="font-bold text-slate-700 mb-1">동봉 · 첨부 문서 내역</div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    inspectDispatchItem.attachments ||
                    inspectDispatchItem.metadata?.attachments ||
                    []
                  ).map((att, idx) => (
                    <span
                      key={`${att.id || idx}`}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold text-[11px]"
                    >
                      [{att.category || '첨부'}] {att.title || att.fileName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
              {inspectDispatchItem.channel === 'EMAIL' && (
                <a
                  href={buildMailtoHref({
                    recipientContact: inspectDispatchItem.recipient_contact,
                    subject: inspectDispatchItem.subject,
                    body: inspectDispatchItem.body,
                  })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>메일 앱으로 열기</span>
                </a>
              )}
              <button
                type="button"
                disabled={dispatchBusy}
                onClick={async () => {
                  await handleResendDispatchRecord(inspectDispatchItem);
                  setInspectDispatchItem(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>동일 내용 즉시 재발송</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectDispatchItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </ModalLayer>
      )}

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
