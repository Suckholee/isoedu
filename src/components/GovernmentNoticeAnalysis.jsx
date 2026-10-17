export default function GovernmentNoticeAnalysis({ analysis }) {
 if (!analysis) return null;
 return <section className="my-5 border-t pt-4 text-sm space-y-4" aria-label="모집공고 첨부 분석">
  <h3 className="font-bold">모집공고 첨부 분석</h3>
  <p className="text-xs text-slate-500">분석일 {analysis.analyzedAt?.slice(0,10)} · {analysis.reviewScope}</p>
  <p><strong>신청 대상</strong><br/>{analysis.eligibility?.summary} <small>({analysis.eligibility?.reference})</small></p>
  <p><strong>지원금·자부담</strong><br/>{analysis.support?.summary} <small>({analysis.support?.reference})</small></p>
  <p><strong>마감</strong><br/>{analysis.period?.end} {analysis.period?.deadlineTime} ({analysis.period?.timezone})</p>
  <details><summary className="cursor-pointer font-semibold">필수·조건부 제출서류 {analysis.requiredDocuments?.length || 0}개 항목</summary><ul className="list-disc pl-5 mt-3 space-y-3">{analysis.requiredDocuments?.map(d=><li key={d.name}>{d.name}<p className="text-xs text-slate-500">{d.condition} · {d.reference}</p></li>)}</ul></details>
  <details><summary className="cursor-pointer font-semibold">사업계획서 작성 항목</summary><p className="mt-3">{analysis.businessPlan?.format} · {analysis.businessPlan?.reference}</p><ul className="list-disc pl-5 mt-2">{analysis.businessPlan?.sections?.map(s=><li key={s.name}>{s.name}: {s.items?.join(' · ')} {s.limit}</li>)}</ul></details>
  <details><summary className="cursor-pointer font-semibold">평가 기준·제외 조건</summary><p className="mt-3">{analysis.evaluation?.summary} ({analysis.evaluation?.reference})</p><ul className="list-disc pl-5 mt-2">{analysis.exclusions?.items?.map(s=><li key={s}>{s}</li>)}</ul></details>
  <a href={analysis.pdfUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600">분석한 모집공고 PDF 열기 ↗</a>
  <p className="text-xs text-amber-800">{analysis.unresolved?.join(' · ')}</p>
 </section>;
}
