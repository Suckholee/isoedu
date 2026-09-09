'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  FolderPlus, 
  Award, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Layers, 
  FileText,
  Briefcase,
  Landmark
} from 'lucide-react';
import { AUDITOR_ACTIVITY_DOMAINS } from '../lib/auditProjectData.js';
import { ALL_GOV_PROGRAMS } from '../lib/governmentProgramsData.js';

export default function NewProjectModal({ isOpen, onClose, onCreateProject, initialProgram = null }) {
  const [formData, setFormData] = useState({
    clientName: '',
    bizNumber: '',
    ceo: '',
    employeeCount: '5~20명 (중소기업 대상)',
    industry: '',
    address: '',
    activityDomainId: 'ISO_AUDIT',
    auditStandard: 'ISO_9001',
    auditType: '최초 인증심사 (1단계 서류 + 2단계 현장)',
    leadAuditor: '홍준호 수석심사원',
    targetAuditDate: '2025-07-20',
    notes: '',
    govProgramId: ''
  });

  useEffect(() => {
    if (initialProgram) {
      setFormData(prev => ({
        ...prev,
        activityDomainId: 'GOV_EVALUATION',
        auditStandard: initialProgram.id,
        auditType: '정부/지자체 해외인증 지원사업 신청 및 사내문서 크로스 매핑',
        govProgramId: initialProgram.id,
        notes: `${initialProgram.title} (${initialProgram.budgetLimit}) 신청을 위한 전용 관리 바인더 폴더입니다.`
      }));
    }
  }, [initialProgram]);

  if (!isOpen) return null;

  const currentDomain = AUDITOR_ACTIVITY_DOMAINS.find(d => d.id === formData.activityDomainId) || AUDITOR_ACTIVITY_DOMAINS[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      alert('고객기업명을 입력해 주세요.');
      return;
    }

    const newProject = {
      id: `proj-${Date.now()}`,
      companyId: `comp-${Date.now()}`,
      clientName: formData.clientName.trim(),
      bizNumber: formData.bizNumber.trim() || '101-81-00000',
      ceo: formData.ceo.trim() || '담당 대표',
      employeeCount: formData.employeeCount,
      industry: formData.industry.trim() || '제조 및 서비스업',
      address: formData.address.trim() || '사업장 주소 미입력',
      activityDomainId: formData.activityDomainId,
      activityDomainTitle: currentDomain.title,
      auditStandard: formData.auditStandard,
      auditStandardName: getStandardFullName(formData.auditStandard),
      auditType: formData.auditType,
      leadAuditor: formData.leadAuditor,
      targetAuditDate: formData.targetAuditDate,
      dDay: calculateDDay(formData.targetAuditDate),
      currentStage: 1, // 1단계 서류진단부터 시작
      readinessScore: 0,
      docCount: 0,
      status: 'ACTIVE',
      storageQuota: '50 GB',
      govProgramId: formData.govProgramId,
      notes: formData.notes.trim() || '신규 프로젝트 발족. 1단계 서류 진단 착수 예정.'
    };

    onCreateProject(newProject);
    onClose();
  };

  function calculateDDay(dateStr) {
    if (!dateStr) return 60;
    const target = new Date(dateStr).getTime();
    const today = new Date().getTime();
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  function getStandardFullName(code) {
    const govFound = ALL_GOV_PROGRAMS.find(p => p.id === code);
    if (govFound) return govFound.title;

    const map = {
      ISO_9001: 'ISO 9001:2015 품질경영시스템',
      ISO_14001: 'ISO 14001:2015 환경경영시스템',
      ISO_45001: 'ISO 45001:2018 안전보건경영시스템',
      ISO_27001: 'ISO 27001:2022 정보보안경영시스템',
      ISO_13485: 'ISO 13485 의료기기 품질인증',
      ISO_22000: 'ISO 22000 식품안전경영시스템',
      SME_QMS: '중소기업 5~20인 맞춤형 QMS 표준화',
      CE_MDR: '유럽 CE MDR 의료기기 기술문서 대행',
      FDA_510K: '미국 FDA 510(k) 시판전 허가 총괄',
      KC_SAFETY: 'KC 전기용품 및 생활용품 안전인증',
      KOITA_LAB: 'KOITA 기업부설연구소 설립 인증',
      VENTURE_CERT: '벤처기업확인 및 이노비즈 기술평가'
    };
    return map[code] || code;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>신규 고객사 심사/지원사업 매니징 폴더 생성</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  매니징 폴더 자동 프로비저닝
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                고객기업 정보와 심사·지원사업 종류를 입력하면 전용 4계층 문서함과 심사 파이프라인이 자동 생성됩니다.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          
          {/* SECTION 1: 고객기업 프로필 정보 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>1. 고객기업 정보 (Client Profile)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">고객 기업명 *</label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="예: (주)대성정밀, 메디바이오텍"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">사업자등록번호</label>
                <input
                  type="text"
                  value={formData.bizNumber}
                  onChange={(e) => setFormData({ ...formData, bizNumber: e.target.value })}
                  placeholder="예: 120-88-12345"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">대표자명</label>
                <input
                  type="text"
                  value={formData.ceo}
                  onChange={(e) => setFormData({ ...formData, ceo: e.target.value })}
                  placeholder="예: 홍길동 대표이사"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">임직원 규모 (컨설팅 영역 기준) *</label>
                <select
                  value={formData.employeeCount}
                  onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-xs font-medium"
                >
                  <option value="5~20명 (중소기업 대상)">5~20명 (중소기업 대상 컨설팅 맞춤)</option>
                  <option value="1~5명 (스타트업)">1~5명 (초기 스타트업)</option>
                  <option value="20~50명 (중기업)">20~50명 (강소기업)</option>
                  <option value="50명 이상 (중견/대기업)">50명 이상 (중견/대기업)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">업종 및 주요 품목</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="예: 정밀 금형 가공 및 자동차 부품 제조업"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">사업장 소재지 (심사 수검지)</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="예: 경기도 화성시 동탄첨단산업단지"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: 심사원 활동영역 및 특정 심사 종류 */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>2. 심사원 활동 영역 및 특정 심사 종류 선택</span>
            </div>

            {/* 6대 활동영역 그리드 선택 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AUDITOR_ACTIVITY_DOMAINS.map(domain => {
                const isSelected = formData.activityDomainId === domain.id;
                return (
                  <div
                    key={domain.id}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        activityDomainId: domain.id,
                        auditStandard: domain.standards[0] || 'ISO_9001'
                      }));
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-200 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{domain.icon}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />}
                    </div>
                    <div className="font-bold text-xs text-slate-900 leading-tight">
                      {domain.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {domain.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 세부 규격 및 심사 구분 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">세부 인증 규격 / 지원사업 *</label>
                <select
                  value={formData.auditStandard}
                  onChange={(e) => setFormData({ ...formData, auditStandard: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-xs font-semibold text-slate-800"
                >
                  {formData.activityDomainId === 'ISO_AUDIT' && (
                    <>
                      <option value="ISO_9001">ISO 9001:2015 (품질경영시스템)</option>
                      <option value="ISO_14001">ISO 14001:2015 (환경경영시스템)</option>
                      <option value="ISO_45001">ISO 45001:2018 (안전보건경영시스템)</option>
                      <option value="ISO_27001">ISO 27001:2022 (정보보안경영시스템)</option>
                      <option value="ISO_13485">ISO 13485 (의료기기 품질인증)</option>
                      <option value="ISO_22000">ISO 22000 (식품안전경영시스템)</option>
                    </>
                  )}
                  {formData.activityDomainId === 'SME_CONSULTING' && (
                    <>
                      <option value="SME_QMS">중소기업 5~20인 맞춤형 QMS 프로세스 표준화</option>
                      <option value="ISO_9001">ISO 9001 소규모 사업장 특별 패키지</option>
                    </>
                  )}
                  {formData.activityDomainId === 'PRODUCT_CERT' && (
                    <>
                      <option value="CE_MDR">유럽 CE MDR 의료기기 기술문서(TCF) 대행</option>
                      <option value="FDA_510K">미국 FDA 510(k) 시판전 허가 총괄</option>
                      <option value="KC_SAFETY">KC 전기용품 및 생활용품 안전인증</option>
                    </>
                  )}
                  {formData.activityDomainId === 'DOMESTIC_MGMT_CERT' && (
                    <>
                      <option value="KOITA_LAB">KOITA 기업부설연구소 / 연구전담부서 설립</option>
                      <option value="VENTURE_CERT">중소벤처기업부 벤처기업확인 및 이노비즈</option>
                    </>
                  )}
                  {formData.activityDomainId === 'CORPORATE_LECTURE' && (
                    <option value="ISO_9001">사내 ISO 내부심사원 실무 특강 (3시간)</option>
                  )}
                  {formData.activityDomainId === 'GOV_EVALUATION' && (
                    <>
                      <optgroup label="정부·지자체 지원사업 (53선 연계)">
                        {ALL_GOV_PROGRAMS.slice(0, 15).map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </optgroup>
                      <optgroup label="국책 R&D 기획">
                        <option value="RND_GOV_EVAL">정부 국책과제 연구개발 표준 프로세스 컨설팅</option>
                      </optgroup>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">심사 / 컨설팅 진행 종류 *</label>
                <select
                  value={formData.auditType}
                  onChange={(e) => setFormData({ ...formData, auditType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-xs font-semibold text-slate-800"
                >
                  <option value="정부/지자체 해외인증 지원사업 신청 및 사내문서 크로스 매핑">정부/지자체 해외인증 지원사업 신청 및 사내문서 크로스 매핑</option>
                  <option value="최초 인증심사 (1단계 서류 + 2단계 현장)">최초 인증심사 (1단계 서류 + 2단계 현장)</option>
                  <option value="정기 사후관리심사 (Surveillance Audit)">정기 사후관리심사 (Surveillance Audit)</option>
                  <option value="갱신심사 (Recertification Audit)">갱신심사 (Recertification Audit)</option>
                  <option value="특별심사 / 인증범위 확대 심사">특별심사 / 인증범위 확대 심사</option>
                  <option value="사전 모의심사 & 갭(GAP) 컨설팅">사전 모의심사 & 갭(GAP) 컨설팅</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">배정 심사원 / 수석 컨설턴트</label>
                <input
                  type="text"
                  value={formData.leadAuditor}
                  onChange={(e) => setFormData({ ...formData, leadAuditor: e.target.value })}
                  placeholder="예: 홍준호 수석심사원"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">목표 심사 수검 예정일 *</label>
                <input
                  type="date"
                  required
                  value={formData.targetAuditDate}
                  onChange={(e) => setFormData({ ...formData, targetAuditDate: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* 자동 생성 안내 박스 */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/90 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950 space-y-1">
              <span className="font-bold block">📦 [문서관리 매니징 폴더] 자동 프로비저닝 안내</span>
              <p className="leading-relaxed text-[11px] text-blue-800">
                생성 버튼을 누르면 해당 심사 규격 또는 지원사업에 부합하는 <b>00.인증서신청, 01.매뉴얼, 02.절차서, 03.지침서, 04.기록증빙</b> 4계층 폴더 트리와 <b>1~5단계 심사 파이프라인</b> 및 <b>기존 문서 크로스 재사용 바인더</b>가 즉시 활성화됩니다.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 border-t flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-200 flex items-center gap-2 transition-all hover:scale-[1.01]"
            >
              <FolderPlus className="w-4 h-4" />
              <span>문서관리 매니징 폴더 생성 및 열기</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
