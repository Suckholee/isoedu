"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { companyRpc } from "../../lib/companyProjectRepository";
import {
  EMPTY_OPERATIONS,
  OPERATION_STATES,
  OPERATION_FIELDS,
  validateOperations,
  renewalNoticeDate,
} from "../../lib/meeting/workflow.mjs";
import { buildApplicationWorkbook } from "../../lib/meeting/applicationWorkbook.mjs";
import {
  safeDownloadFileName,
  triggerBrowserDownload,
} from "../../lib/documentExport.mjs";
import { validateUploadFile, uploadDocumentFile } from "../../lib/storageVault";
import CloudFileViewer from "../CloudFileViewer";
import DocumentChecksPanel,{DocumentDateFields} from "./DocumentChecksPanel";
export default function ProjectOperationsPanel({
  project,
  documents = [],
  onAddDocument,
  onUpdateDocument,
  canEdit,
  onChanged,
}) {
  const { user, profile } = useAuth();
  const [record, setRecord] = useState(null),
    [data, setData] = useState({ ...EMPTY_OPERATIONS }),
    [requests, setRequests] = useState([]),
    [team, setTeam] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [reader, setReader] = useState(null),
    [feedback, setFeedback] = useState({}),
    [selected, setSelected] = useState({});
  const identity = useRef("");
  identity.current = `${user?.id}/${project.id}`;
  async function load() {
    const id = identity.current;
    setLoaded(false);
    setError("");
    try {
      const [ops, req, access] = await Promise.all([
        supabase
          .from("project_operations")
          .select("*")
          .eq("project_id", project.id)
          .maybeSingle(),
        supabase
          .from("project_document_requests")
          .select("*")
          .eq("project_id", project.id)
          .order("request_key"),
        companyRpc("consultant_team", { c_id: project.companyId }),
      ]);
      if (ops.error) throw ops.error;
      if (req.error) throw req.error;
      if (id !== identity.current) return;
      setRecord(ops.data);
      setData({ ...EMPTY_OPERATIONS,applicationType:project.kind==='ISO'?'ISO':'OTHER', ...ops.data?.data });
      setRequests(req.data);
      setTeam(access);
      setLoaded(true);
    } catch (e) {
      if (id === identity.current)
        setError(
          e.code === "42P01" || e.code === "PGRST205"
            ? "10월 23일 회의 기능의 서버 설정 적용이 필요합니다."
            : e.message,
        );
    }
  }
  useEffect(() => {
    setRecord(null);
    setRequests([]);
    setData({ ...EMPTY_OPERATIONS });
    setNotice("");
    setFeedback({});
    setSelected({});
    setReader(null);
    (async()=>{try{await companyRpc('refresh_project_document_checks',{p_id:project.id});}catch{}await load();})();
  }, [project.id, user?.id]);
  async function run(fn, success) {
    if (busy) return;
    const id = identity.current;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn(id);
      if (id === identity.current) setNotice(success);
    } catch (e) {
      if (id === identity.current) setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function viewFile(doc, path) {
    const originalPath = path || doc.originalPath || doc.fileUrl;
    const format = String(
      doc.format ||
        doc.fileName?.split(".").pop() ||
        originalPath?.split(".").pop() ||
        "",
    ).toUpperCase();
    setReader({
      ...doc,
      originalPath,
      format,
      previewPath: ["PDF", "PNG", "JPG", "JPEG"].includes(format)
        ? originalPath
        : path
          ? null
          : doc.previewPath,
      previewFormat: format,
    });
  }
  async function reloadChecks(){await load();await onChanged?.();}
  const files = documents.filter((d) => d.companyId === project.companyId),
    prepare = team?.canPrepare === true;
  async function review(r, status, documentId) {
    await run(
      async (id) => {
        const saved = await companyRpc("review_project_document", {
          r_id: r.id,
          expected_revision: r.revision,
          next_status: status,
          doc_id: documentId || null,
          note: feedback[r.id] || "",
        });
        if (id === identity.current)
          setRequests((list) => list.map((x) => (x.id === r.id ? saved : x)));
      },
      status === "submitted"
        ? "제출 자료를 저장했습니다."
        : "검토 결과를 저장했습니다.",
    );
  }
  async function upload(r, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const check = validateUploadFile(file);
    if (!check.valid) {
      setError(check.error);
      return;
    }
    await run(async (id) => {
      if (!onAddDocument || !onUpdateDocument)
        throw Error("문서 저장 경로를 확인해 주세요.");
      let doc = await onAddDocument({
        companyId: project.companyId,
        title: `${r.title} · ${file.name}`,
        code: `INTAKE-${r.request_key}`,
        standards: project.standards || [],
        hierarchyLevel: "LEVEL_4",
        status: "DRAFT",
        reviewStatus: "REVIEW",
        summary: r.guidance,
        projectOrigin: { projectId: project.id, intakeRequestId: r.id },
      });
      if (!doc?.id) throw Error("문서를 저장하지 못했습니다.");
      const uploaded = await uploadDocumentFile(file, {
        companyId: project.companyId,
        docId: doc.id,
        version: 1,
        user: profile || user,
      });
      doc = await onUpdateDocument({
        ...doc,
        fileUrl: uploaded.filePath,
        fileName: file.name,
        fileSize: file.size,
      });
      if (!doc?.fileUrl)
        throw Error(
          "첨부 파일 연결을 저장하지 못했습니다. 문서함에서 다시 연결해 주세요.",
        );
      const saved = await companyRpc("review_project_document", {
        r_id: r.id,
        expected_revision: r.revision,
        next_status: "submitted",
        doc_id: doc.id,
        note: "",
      });
      if (id === identity.current)
        setRequests((list) => list.map((x) => (x.id === r.id ? saved : x)));
    }, "원본 파일을 보관하고 제출했습니다. 컨설턴트 검토 대기입니다.");
  }
  return (
    <section className="platform-card space-y-3">
      <header className="flex justify-between gap-2">
        <h2>고객 제출·심사 운영</h2>
        <button
          disabled={busy}
          className="text-sm underline text-blue-700"
          onClick={load}
        >
          저장 내용 다시 불러오기
        </button>
      </header>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-emerald-700">
          {notice}
        </p>
      )}
      {loaded && (
        <>
          <div className="flex gap-2 flex-wrap text-xs">
            {Object.entries(OPERATION_STATES).map(([key, states]) => (
              <span className="bg-slate-100 rounded px-2 py-1" key={key}>
                {states[record?.data?.[key] || EMPTY_OPERATIONS[key]]}
              </span>
            ))}
            <span>
              사전 안내 기준일 {renewalNoticeDate(record?.data || {}) || "미정"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            가예약은 입금 상태와 별도로 기록합니다. 사전 안내 기준일은 차기
            심사일(없으면 인증 만료일)의 한 달 전이며 자동 발송·기관 접수는
            별도입니다.
          </p>
          {project.kind==='ISO'&&<p className="text-xs text-slate-500"><a className="text-blue-700 underline" href="https://honestone.notion.site/" target="_blank" rel="noreferrer">노션 ISO 신청 안내 원문</a> · 입력이 어려운 부분은 비워 두고 함께 확인합니다. 선입금 후 진행 안내와 가예약 기록은 구분합니다.</p>}
          <details>
            <summary className="cursor-pointer font-semibold text-sm">
              회사 정보·견적·입금·일정·인증서
            </summary>
            <form
              className="space-y-3 mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(async (id) => {
                  const payload = validateOperations(data);
                    if(project.kind === 'ISO') payload.guidanceOrigin = {sourceUrl:'https://honestone.notion.site/',reviewedAt:'2026-10-29',basis:'meeting-2026-10-23 + notion-iso-13-items'};
                  const saved = await companyRpc("save_project_operations", {
                    p_id: project.id,
                    expected_revision: record?.revision || 0,
                    payload,
                  });
                  if (id === identity.current) {
                    setRecord(saved);
                    setData({ ...EMPTY_OPERATIONS, ...saved.data });
                    await onChanged?.();
                  }
                }, "운영 정보를 저장했습니다.");
              }}
            >
              <fieldset
                disabled={!prepare || busy}
                className="grid grid-cols-1 md:grid-cols-3 gap-3"
              >
                {Object.entries(OPERATION_STATES).map(([key, states]) => (
                  <label className="text-sm" key={key}>
                    {
                      {
                        quoteStatus: "견적",
                        paymentStatus: "입금",
                        scheduleStatus: "심사 일정",
                      }[key]
                    }
                    <select
                      className="border rounded p-2 w-full"
                      value={data[key]}
                      onChange={(e) =>
                        setData({ ...data, [key]: e.target.value })
                      }
                    >
                      {Object.entries(states).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                {Object.entries(OPERATION_FIELDS).map(([key, label]) => (
                  <label key={key} className="text-sm">
                    {label}
                    <input
                      className="border rounded p-2 w-full"
                      maxLength={2000}
                      value={data[key] || ""}
                      onChange={(e) =>
                        setData({
                          ...data,
                          [key]: e.target.value,
                          ...(key === "scope" ? { scopeConfirmed: false } : {}),
                        })
                      }
                    />
                  </label>
                ))}
                {Object.entries({
                  auditDate: "심사일",
                  certificateIssuedAt: "인증서 발급일",
                  certificateExpiresAt: "인증 만료일",
                  nextAuditDate: "차기 심사일",
                }).map(([key, label]) => (
                  <label key={key} className="text-sm">
                    {label}
                    <input
                      type="date"
                      className="border rounded p-2 w-full"
                      value={data[key] || ""}
                      onChange={(e) =>
                        setData({ ...data, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
                <label className="text-sm">
                  발급된 인증서 원본
                  <select
                    className="border rounded p-2 w-full"
                    value={data.certificateDocumentId}
                    onChange={(e) =>
                      setData({
                        ...data,
                        certificateDocumentId: e.target.value,
                      })
                    }
                  >
                    <option value="">미연결</option>
                    {files
                      .filter(
                        (d) =>
                          d.hierarchyLevel === "CERT" &&
                          (d.fileUrl || d.originalPath),
                      )
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="text-sm flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={data.scopeConfirmed}
                    onChange={(e) =>
                      setData({ ...data, scopeConfirmed: e.target.checked })
                    }
                  />{" "}
                  인증 범위를 고객에게 확인했습니다.
                </label>
                <label className="text-sm">실제 접수 기록일 (입력 시 자동 재요청 중지)<input type="date" className="border rounded p-2 w-full" value={data.applicationSubmittedAt||''} onChange={e=>setData({...data,applicationSubmittedAt:e.target.value})}/></label>
                <label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={data.documentMonitoring===true} onChange={e=>setData({...data,documentMonitoring:e.target.checked})}/> 서류 최신본 자동 검사 활성</label>
              </fieldset>
              {prepare && (
                <button
                  disabled={busy}
                  className="text-blue-700 underline text-sm"
                >
                  운영 정보 저장
                </button>
              )}
              <p className="text-xs text-slate-500">
                인증서 등록은 기관의 공식 발급 행위를 대신하지 않습니다. 고객
                제출 자료와 실제 현장을 대조해 작성하세요.
              </p>
            </form>
          </details>
          {record?.data?.certificateDocumentId &&
            files.find((d) => d.id === record.data.certificateDocumentId) && (
              <button
                className="text-sm text-blue-700 underline"
                onClick={() =>
                  viewFile(
                    files.find(
                      (d) => d.id === record.data.certificateDocumentId,
                    ),
                  )
                }
              >
                발급 인증서 열람
              </button>
            )}
          <div className="flex justify-between flex-wrap gap-2 border-t pt-3">
            <strong className="text-sm">
              고객 제출 요청 · {requests.length}개
            </strong>

          </div>
          <DocumentChecksPanel project={project} record={record} canPrepare={prepare} canEdit={canEdit} onChanged={reloadChecks}/>
          <div className="overflow-auto">
            <table className="platform-table">
              <thead>
                <tr>
                  <th>요청 서류·안내</th>
                  <th>제출·원본</th>
                  <th>기간·자료 연도</th>
                  <th>검토·보완</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const doc = files.find((d) => d.id === r.document_id);
                  return (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.title}</strong>
                        {r.conditional && (
                          <span className="text-xs ml-1">(해당 시)</span>
                        )}
                        <p className="text-xs text-slate-500">{r.guidance}</p>
                      </td>
                      <td>
                        {doc && (
                          <button
                            className="text-blue-700 underline block"
                            onClick={() => viewFile(doc, r.submitted_file_path)}
                          >
                            {doc.title} 열람
                          </button>
                        )}
                        {canEdit && !["accepted", "not_applicable"].includes(r.status) && (
                          <div className="flex flex-wrap gap-2">
                            <select
                              aria-label={`${r.title} 제출 문서`}
                              className="border rounded text-xs max-w-52"
                              value={selected[r.id] || ""}
                              onChange={(e) =>
                                setSelected({
                                  ...selected,
                                  [r.id]: e.target.value,
                                })
                              }
                            >
                              <option value="">보관된 첨부 선택</option>
                              {files
                                .filter((d) => d.fileUrl)
                                .map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.title}
                                  </option>
                                ))}
                            </select>
                            <button
                              disabled={busy || !selected[r.id]}
                              className="text-xs text-blue-700"
                              onClick={() =>
                                review(r, "submitted", selected[r.id])
                              }
                            >
                              선택 문서 제출
                            </button>
                            <label className="text-xs text-blue-700 underline cursor-pointer">
                              파일 업로드·제출
                              <input
                                type="file"
                                className="sr-only"
                                disabled={busy}
                                onChange={(e) => upload(r, e)}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp,.hwpx,.png,.jpg,.jpeg"
                              />
                            </label>
                          </div>
                        )}
                      </td>
                      <td><DocumentDateFields request={r} canEdit={canEdit} canPrepare={prepare} onChanged={reloadChecks}/></td>
                      <td>
                        <span className="text-sm">
                          {
                            {
                              requested: "제출 요청",
                              submitted: "검토 대기",
                              changes: "보완 요청",
                              accepted: "내부 확인 완료",
                      not_applicable: "해당 없음 · 근거 기록",
                            }[r.status]
                          }
                        </span>
                        {r.submitted_at && (
                          <small className="block text-slate-400">
                            제출 당시 원본 보존
                          </small>
                        )}
                        {r.feedback && (
                          <p className="text-xs whitespace-pre-wrap text-rose-700">
                            {r.feedback}
                          </p>
                        )}
                        {prepare && (r.status === "submitted" || r.conditional) && (
                          <div className="space-y-1">
                            <input
                              aria-label={`${r.title} 보완 의견`}
                              placeholder="보완 내용 또는 해당 없음의 근거"
                              maxLength={2000}
                              value={feedback[r.id] || ""}
                              onChange={(e) =>
                                setFeedback({
                                  ...feedback,
                                  [r.id]: e.target.value,
                                })
                              }
                              className="border rounded p-1 text-xs"
                            />
                            <div className="flex gap-2 flex-wrap">
                              {r.status === "submitted" && <><button disabled={busy || !feedback[r.id]?.trim()} onClick={() => review(r, "changes")} className="text-xs text-rose-700">보완 요청</button><button disabled={busy} onClick={() => review(r, "accepted")} className="text-xs text-emerald-700">내부 확인 완료</button></>}
                              {r.conditional && (r.status === 'not_applicable' ? <button disabled={busy} onClick={()=>review(r,'requested')} className="text-xs text-blue-700">다시 제출 요청</button> : <button disabled={busy || !feedback[r.id]?.trim()} onClick={()=>review(r,'not_applicable')} className="text-xs text-slate-700">근거 기록 후 해당 없음</button>)}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!requests.length && (
                  <tr>
                    <td colSpan={4} className="text-sm text-slate-500 py-3">
                      아직 요청한 서류가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {project.kind === "ISO" && (
            <div className="text-sm border-t pt-3 space-y-2">
              <button
                disabled={busy || !record}
                className="text-blue-700 underline"
                onClick={() =>
                  run(async () => {
                    const response = await fetch(
                      "/templates/iso-application-251210.xlsx",
                    );
                    if (!response.ok)
                      throw Error("원본 신청서 양식을 불러오지 못했습니다.");
                    const bytes = buildApplicationWorkbook(
                      await response.arrayBuffer(),
                      { ...record.data, companyName: project.clientName },
                    );
                    triggerBrowserDownload(
                      new Blob([bytes], {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                      }),
                      safeDownloadFileName(
                        `${project.clientName}_ISO신청서_검토용`,
                        "xlsx",
                      ),
                    );
                  }, "저장한 회사 정보로 신청서 초안을 내려받았습니다. 미입력 항목·기관 작성란을 검토하세요.")
                }
              >
                저장된 정보로 실제 ISO 신청서 엑셀 내려받기
              </button>
              <p className="text-xs text-slate-500">
                251210 원본 양식의 확인된 입력란만 채웁니다.
                심사보고서·개선보고서·서명은 자동 작성하지 않습니다. 미확인
                정보는 빈칸으로 유지합니다.
              </p>
            </div>
          )}
        </>
      )}
      {reader && (
        <CloudFileViewer document={reader} onClose={() => setReader(null)} />
      )}
    </section>
  );
}
