import { validTaskDate } from "../workTaskDates.mjs";
export const MEETING_SOURCE = "meeting-2026-10-23";
export const OPERATION_STATES = {
  quoteStatus: {
    none: "견적 전",
    draft: "견적 작성",
    sent: "견적 전달",
    accepted: "견적 합의",
  },
  paymentStatus: { unpaid: "미입금", partial: "일부 입금", paid: "입금 확인" },
  scheduleStatus: {
    unscheduled: "일정 미정",
    tentative: "가예약",
    confirmed: "일정 확정",
    completed: "심사 진행 기록",
  },
};
export const OPERATION_FIELDS = {
  companyEnglishName: "회사 영문명",
  address: "사업장 주소",
  businessNumber: "사업자등록번호",
  representative: "대표자",
  contactName: "품질·업무 담당자",
  contactEmail: "담당자 이메일",
  phone: "회사 전화",
  fax: "회사 팩스",
  managementRepresentative: "경영대리인 성명·직함",
  managementRepresentativeEmail: "경영대리인 이메일",
  departments: "부서명·부서별 인원·합계",
  suppliers: "주요 매입 거래처 (안내 기준 2곳)",
  customers: "주요 판매 거래처 (안내 기준 2곳 이상)",
  equipment: "제조·검사 설비 목록",
  scope: "고객 확인 인증 범위",
  process: "전체 공정",
  rawMaterials: "주요 원자재·서비스 (안내 기준 3개 이상)",
  outsourcedProcess: "외주 공정",
  billingContact: "계산서 담당자",
  billingTitle: "계산서 담당자 직함",
  billingPhone: "계산서 담당자 휴대폰",
  billingEmail: "계산서 이메일",
  issuer: "인증서 발급기관",
};
export const EMPTY_OPERATIONS = {
  quoteStatus: "none",
  paymentStatus: "unpaid",
  scheduleStatus: "unscheduled",
  scopeConfirmed: false,
  auditDate: "",
  certificateIssuedAt: "",
  certificateExpiresAt: "",
  nextAuditDate: "",
  certificateDocumentId: "",
  applicationType: "OTHER",
  applicationDate: "",
  companyFoundedDate: "",
  applicationSubmittedAt: "",
  documentMonitoring: false,
};
export const ISO_INTAKE_REQUESTS = [
  ["iso-application", "ISO 인증 신청서", "251210 안내 양식. 작성이 어려운 항목은 비워두고 컨설턴트와 함께 확인합니다."],
  [
    "business-registration",
    "사업자등록증",
    "현재 사업장과 업종을 확인할 수 있는 최신본",
  ],
  [
    "insurance-roster",
    "4대보험 가입자 명부",
    "대표자·외부 인원·교대 인원은 별도로 확인합니다.",
  ],
  ["permits", "인허가 서류", "해당 업종에 필요한 경우 제출합니다.", true],
  ["company-stamp", "회사 명판·직인", "명판과 직인을 식별할 수 있는 자료"],
  [
    "representative-signature",
    "대표자 서명",
    "해당 신청·심사 목적의 서명 자료",
  ],
  ["quality-signature", "품질 담당자 서명", "담당자의 역할과 서명 확인"],
  ["manual", "회사 매뉴얼·절차서", "실제 운영 문서 또는 변경된 최신본"],
  [
    "improvement",
    "개선보고서·실행 증빙",
    "실제 개선 활동과 근거 자료. 최초·갱신 적용 여부는 기관 확인",
    true,
  ],
  [
    "onsite-signature",
    "현장 심사 서명 기록",
    "실제 현장 심사 후 심사원·고객 서명 기록",
    true,
  ],
].map(([key, title, guidance, conditional = false]) => ({
  key,
  title,
  guidance,
  conditional,
  source: MEETING_SOURCE,
}));
export function validateOperations(input = {}) {
  const data = { ...EMPTY_OPERATIONS };
  for (const k of Object.keys(OPERATION_FIELDS))
    data[k] = String(input[k] ?? "")
      .trim()
      .slice(0, 2000);
  for (const [k, states] of Object.entries(OPERATION_STATES)) {
    if (!Object.hasOwn(states, input[k] ?? data[k]))
      throw Error("진행 상태를 확인해 주세요.");
    data[k] = input[k] ?? data[k];
  }
  for (const k of [
    "auditDate",
    "certificateIssuedAt",
    "certificateExpiresAt",
    "nextAuditDate",
    "applicationDate",
    "companyFoundedDate",
    "applicationSubmittedAt",
  ]) {
    data[k] = input[k] || "";
    if (!validTaskDate(data[k])) throw Error("날짜를 확인해 주세요.");
  }
  data.applicationType=input.applicationType||'OTHER';
  if(!['ISO','VENTURE_GROWTH','VENTURE_INVEST','INNOBIZ','MAINBIZ','RESEARCH','OTHER'].includes(data.applicationType))throw Error('신청 유형을 확인해 주세요.');
  data.documentMonitoring=input.documentMonitoring===true;
  data.scopeConfirmed = input.scopeConfirmed === true;
  data.certificateDocumentId = String(input.certificateDocumentId || "");
  if (data.scheduleStatus !== "unscheduled" && !data.auditDate)
    throw Error("가예약·확정 일정에는 심사일이 필요합니다.");
  if (
    ["confirmed", "completed"].includes(data.scheduleStatus) &&
    (!data.scopeConfirmed || !data.scope)
  )
    throw Error("인증 범위를 고객에게 확인한 뒤 일정을 확정해 주세요.");
  if (
    data.certificateIssuedAt &&
    data.certificateExpiresAt &&
    data.certificateExpiresAt < data.certificateIssuedAt
  )
    throw Error("인증 만료일은 발급일 이후여야 합니다.");
  return data;
}
export function renewalNoticeDate(data) {
  const date = data.nextAuditDate || data.certificateExpiresAt;
  if (!date || !validTaskDate(date)) return "";
  const [y, m, d] = date.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 2, Math.min(d, end)))
    .toISOString()
    .slice(0, 10);
}
export function crmImportPreview(payload, companies = []) {
  if (
    !payload ||
    payload.version !== 1 ||
    !Array.isArray(payload.projects) ||
    payload.projects.length > 100
  )
    throw Error(
      "version: 1과 projects 목록(최대 100개)이 있는 CRM 내보내기 파일을 선택해 주세요.",
    );
  const seen = new Set();
  return payload.projects.map((row) => {
    const company = companies.find((c) => c.id === row.companyId);
    if (
      !company ||
      !row.externalId ||
      typeof row.externalId !== "string" ||
      row.externalId.length > 100 ||
      !row.title?.trim() ||
      row.title.length > 120
    )
      throw Error(
        "원본 ID·프로젝트명·접근 가능한 거래처 연결을 확인해 주세요.",
      );
    const key = `${company.id}/${row.externalId}`;
    if (seen.has(key)) throw Error("같은 거래처의 원본 ID가 중복되었습니다.");
    seen.add(key);
    return {
      companyId: company.id,
      companyName: company.name,
      externalId: row.externalId,
      title: row.title.trim(),
      notes: String(row.notes || "").slice(0, 10000),
      kind: ["ISO", "DOMESTIC", "SUPPORT", "GENERAL"].includes(row.kind)
        ? row.kind
        : "GENERAL",
      targetDate: validTaskDate(row.targetDate || "")
        ? row.targetDate || ""
        : (() => {
            throw Error("CRM 목표일을 확인해 주세요.");
          })(),
      documentIds: Array.isArray(row.documentIds) ? row.documentIds : [],
    };
  });
}
