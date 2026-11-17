'use client';
import {useState} from 'react';
import {useAuth} from '../../context/AuthContext';

const date=value=>value?new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'이전 기록 · 시각 미기록';
export default function SourceReviewHistory({row,api}) {
  const {user}=useAuth();
  const [mine,setMine]=useState(true),[result,setResult]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const coach=row.metadata.sourceCoach||{},review=row.metadata.sourceReview;
  const visible=entry=>!mine||entry.actor===user?.id;
  const who=actor=>actor===user?.id?'내 기록':actor?`작업자 ${actor.slice(0,8)}`:'이전 기록 · 작업자 미기록';
  const evaluations=(coach.evaluations||[]).filter(visible),turns=(coach.turns||[]).filter(visible);
  const versions=[...(review?.history||[]),...(review?[{...review,content:review.reviewedContent,at:review.savedAt}]:[])].filter(visible);
  async function open(entry){setLoading(true);setError('');try{setResult((await api({action:'source-page-result',sourceId:row.id,evaluationKey:entry.key})).evaluation);}catch(e){setError(e.message);}finally{setLoading(false);}}
  async function openReport(entry){setLoading(true);setError('');try{setResult((await api({action:'source-document-result',sourceId:row.id,reportKey:entry.key})).report);}catch(e){setError(e.message);}finally{setLoading(false);}}
  return <details className="rounded border bg-slate-50 p-3 text-sm">
    <summary className="cursor-pointer font-semibold">저장된 활동 기록 · 평가 {coach.evaluations?.length||0} · 대화 {coach.turns?.length||0} · 보완본 {review?.revision||0}차</summary>
    <p className="my-2">평가와 대화는 계정·시간과 함께 서버에 보관됩니다. 새로고침 후에도 다시 확인할 수 있습니다. 수정 중 본문과 답변은 자동 저장되며, 검토를 마친 내용은 ‘보완본 저장’으로 버전을 남깁니다.</p>
    <label><input type="checkbox" checked={mine} onChange={e=>setMine(e.target.checked)}/> 내 활동만 보기</label>
    <p>원본 등록: {who(row.metadata.sourceOrigin?.actor)} · {date(row.metadata.sourceOrigin?.at||row.created_at)}</p>
    <h3 className="mt-3 font-semibold">페이지 평가 기록</h3>
    {(coach.documents||[]).filter(visible).map(e=><p key={e.key}><button className="underline" disabled={loading} onClick={()=>openReport(e)}>전체 {e.total}쪽 종합 평가 · {date(e.at)} · {who(e.actor)}</button></p>)}
    {!evaluations.length&&<p>표시할 평가 기록이 없습니다.</p>}
    {evaluations.map(e=><p key={e.key}><button className="underline" disabled={loading} onClick={()=>open(e)}>{e.pageId}쪽 평가 · {date(e.readAt)} · {who(e.actor)}</button></p>)}
    {loading&&<p role="status">평가 기록을 불러오는 중…</p>}{error&&<p role="alert">{error}</p>}
    {result&&<section className="my-2 rounded border bg-white p-3" aria-label="보관된 평가 결과"><strong>{result.total?`전체 ${result.total}`:result.pageId}쪽 · {date(result.readAt||result.at)} · {result.program?.title||'공통 기준'}</strong><p>{result.summary}</p>{result.scores.map(s=><p key={s.criterionId}>{result.criteria?.find(c=>c.id===s.criterionId)?.title||s.criterionId}: {s.score??'점수 미산정'} · {s.reason}</p>)}{result.annotations?.map((a,i)=><details key={i}><summary>{i+1}. {a.role}</summary><p>{a.context}</p><p>근거: {a.evidence}</p><p>개선: {a.suggestion}</p><p>질문: {a.question}</p></details>)}</section>}
    <h3 className="mt-3 font-semibold">AI 질문·답변과 수정안</h3>
    {[...turns].reverse().map(t=><details key={t.id} className="mt-2 border-t pt-2"><summary>{t.priorityIndex!==undefined?`보완 카드 ${t.priorityIndex+1}`:`${t.pageId}쪽`} · {date(t.at)} · {who(t.actor)} · {t.reviewedRevision?`${t.reviewedRevision}차 검토 저장`:t.discarded?'보류':t.applied?'본문 적용':'수정 제안'}</summary><p>내 답변: {t.message}</p><p>AI: {t.reply}</p>{t.questions.map((q,i)=><p key={i}>추가 질문: {q}</p>)}{t.changes.map((c,i)=><div key={i}><p>{c.reason}</p><pre className="whitespace-pre-wrap">변경 전: {c.before}{'\n'}제안: {c.after}</pre></div>)}</details>)}
    <h3 className="mt-3 font-semibold">검토 저장한 보완본</h3>
    {[...versions].reverse().map(v=><details key={v.revision} className="mt-2 border-t pt-2"><summary>{v.revision}차 · {date(v.at)} · {who(v.actor)}</summary><pre className="max-h-80 overflow-auto whitespace-pre-wrap">{v.content}</pre></details>)}
    {(coach.programHistory||[]).filter(visible).map((h,i)=><p key={i}>평가기준 변경 · {date(h.at)} · {who(h.actor)} · {h.program?.title||'공통 기준'}</p>)}
  </details>;
}
