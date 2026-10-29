"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { companyRpc } from "../../lib/companyProjectRepository";
export default function ConsultantTeamPanel({ company }) {
  const { user } = useAuth();
  const [team, setTeam] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [code, setCode] = useState("");
  const identity = useRef("");
  identity.current = `${company?.id}/${user?.id}`;
  async function load() {
    const id = identity.current;
    setError("");
    try {
      const data = await companyRpc("consultant_team", { c_id: company.id });
      if (id === identity.current) setTeam(data);
    } catch (e) {
      if (id === identity.current) setError(e.message);
    }
  }
  useEffect(() => {
    setTeam(null);
    setCode("");
    if (company && user) load();
  }, [company?.id, user?.id]);
  async function run(fn) {
    if (busy) return;
    const id = identity.current;
    setBusy(true);
    setError("");
    try {
      await fn();
      if (id === identity.current) await load();
    } catch (e) {
      if (id === identity.current) setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!company || !user) return null;
  return (
    <section className="platform-card space-y-3">
      <h2>공동 컨설턴트 · {company.name}</h2>
      <p className="text-xs text-slate-500">
        주 담당자와 공동 담당자가 같은 회사의 문서·업무를 관리합니다. 주 담당
        이관은 지정받은 사람의 수락 후 반영됩니다.
      </p>
      {error && (
        <p role="alert" className="text-rose-700 text-sm">
          {error}{" "}
          <button onClick={load} className="underline">
            다시 확인
          </button>
        </p>
      )}
      {team && (
        <>
          <div className="overflow-auto">
            <table className="platform-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>담당</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {team.members.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>
                      {m.primary
                        ? "주 담당"
                        : m.consultant
                          ? "공동 담당"
                          : "회사 구성원"}
                      {m.nominated ? " · 이관 수락 대기" : ""}
                    </td>
                    <td className="space-x-3">
                      {team.canManage && !m.consultant && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              companyRpc("manage_consultant", {
                                c_id: company.id,
                                member_id: m.id,
                                operation: "add",
                              }),
                            )
                          }
                        >
                          {team.members.some((member) => member.primary) ? '공동 담당 지정' : '주 담당 지정'}
                        </button>
                      )}
                      {team.canManage && m.consultant && !m.primary && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() =>
                              run(() =>
                                companyRpc("manage_consultant", {
                                  c_id: company.id,
                                  member_id: m.id,
                                  operation: "nominate",
                                }),
                              )
                            }
                          >
                            주 담당 이관 요청
                          </button>
                          {m.id !== user.id && (
                            <button
                              disabled={busy}
                              className="text-rose-700"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `${m.name} 님의 이 회사 접근을 해제합니다. 자료는 보존됩니다.`,
                                  )
                                )
                                  run(() =>
                                    companyRpc("manage_consultant", {
                                      c_id: company.id,
                                      member_id: m.id,
                                      operation: "remove",
                                    }),
                                  );
                              }}
                            >
                              담당·접근 해제
                            </button>
                          )}
                        </>
                      )}
                      {m.id === user.id && m.nominated && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              companyRpc("manage_consultant", {
                                c_id: company.id,
                                member_id: m.id,
                                operation: "accept",
                              }),
                            )
                          }
                        >
                          주 담당 이관 수락
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {team.canManage && (
            <>
              <button
                disabled={busy}
                className="text-sm text-blue-700 underline"
                onClick={() =>
                  run(async () => {
                    const id = identity.current;
                    const value = await companyRpc("consultant_join_code", {
                      c_id: company.id,
                    });
                    if (id === identity.current) setCode(value);
                  })
                }
              >
                공동 담당 신청 코드
              </button>
              {code && (
                <p className="text-xs break-all">
                  <code>{code}</code> · 설정의 회사 소속 신청에 입력 · 승인 후
                  접근
                </p>
              )}
              {team.requests.map((r) => (
                <div key={r.id} className="text-sm flex gap-3">
                  <span>{r.name} · 소속 신청 대기</span>
                  <button
                    disabled={busy}
                    className="text-blue-700"
                    onClick={() => {
                      if (
                        window.confirm(
                          `${r.name} 님을 공동 컨설턴트로 승인하고 회사 문서 편집 권한을 부여합니다.`,
                        )
                      )
                        run(() =>
                          companyRpc("approve_consultant", {
                            request_id: r.id,
                          }),
                        );
                    }}
                  >
                    공동 담당으로 승인
                  </button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </section>
  );
}
