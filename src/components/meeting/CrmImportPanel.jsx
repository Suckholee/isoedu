"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { crmImportPreview } from "../../lib/meeting/workflow.mjs";
import { companyRpc } from "../../lib/companyProjectRepository";
import { supabase } from "../../lib/supabaseClient";
export default function CrmImportPanel({ onChanged }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]),
    [source, setSource] = useState("기존 어니스톤 CRM"),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [checked, setChecked] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    setRows([]);
    setChecked(false);
    setError("");
    setMessage("");
  }, [user?.id]);
  async function preview(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const g = ++generation.current;
    setRows([]);
    setError("");
    setMessage("");
    setChecked(false);
    if (!file) return;
    try {
      if (file.size > 1024 * 1024)
        throw Error("CRM JSON 파일은 최대 1MB입니다.");
      const payload = JSON.parse(await file.text());
      const { data, error } = await supabase
        .from("companies")
        .select("id,name");
      if (error) throw error;
      const result = crmImportPreview(payload, data);
      if (g === generation.current) setRows(result);
    } catch (e) {
      if (g === generation.current) setError(e.message);
    }
  }
  if (!user) return null;
  return (
    <section className="platform-card space-y-3">
      <h2>기존 CRM 프로젝트 이관</h2>
      <p className="text-xs text-slate-500">
        원본 ID와 이미 등록된 거래처·문서를 연결합니다. 미리보기 후 회사
        관리자가 저장하며, 같은 원본의 재실행은 중복 생성하지 않습니다. 원본
        파일·연락처·과거 일정 전체의 이관은 별도 대조가 필요합니다.
      </p>
      <details className="text-xs">
        <summary>가져오기 형식</summary>
        <pre className="overflow-auto mt-2">
          {JSON.stringify(
            {
              version: 1,
              projects: [
                {
                  companyId: "접근 권한이 있는 기존 회사 UUID",
                  externalId: "원본 프로젝트 ID",
                  title: "프로젝트명",
                  kind: "ISO",
                  targetDate: "",
                  notes: "원본 메모",
                  documentIds: [],
                },
              ],
            },
            null,
            2,
          )}
        </pre>
      </details>
      <label className="text-sm block">
        CRM 내보내기 JSON{" "}
        <input
          disabled={busy}
          type="file"
          accept=".json,application/json"
          onChange={preview}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-emerald-700">
          {message}
        </p>
      )}
      {rows.length > 0 && (
        <>
          <label className="text-sm block">
            원본 시스템 이름{" "}
            <input
              className="border rounded p-1"
              value={source}
              maxLength={100}
              onChange={(e) => {
                setSource(e.target.value);
                setChecked(false);
              }}
            />
          </label>
          <div className="overflow-auto">
            <table className="platform-table">
              <thead>
                <tr>
                  <th>기존 거래처</th>
                  <th>원본 ID</th>
                  <th>프로젝트</th>
                  <th>연결 문서</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.companyId}/${r.externalId}`}>
                    <td>{r.companyName}</td>
                    <td>{r.externalId}</td>
                    <td>{r.title}</td>
                    <td>{r.documentIds.length}개</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="text-sm block">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />{" "}
            거래처 연결과 원본 ID를 대조했습니다.
          </label>
          <button
            className="text-blue-700 underline"
            disabled={busy || !checked || !source.trim()}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const g = generation.current;
                const result = await companyRpc("import_crm_projects", {
                  source_name: source.trim(),
                  items: rows.map(({ companyName, ...r }) => r),
                });
                if (g !== generation.current) return;
                setMessage(
                  `저장 ${result.saved}건 · 기존 동일 원본 ${result.skipped}건. 프로젝트 목록을 새로 불러와 확인하세요.`,
                );
                setRows([]);
                await onChanged?.();
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            확인한 {rows.length}건 이관
          </button>
        </>
      )}
    </section>
  );
}
