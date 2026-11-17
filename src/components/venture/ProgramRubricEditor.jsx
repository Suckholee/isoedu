'use client';
import {useState} from 'react';
import {COMMON_CRITERIA} from '../../lib/businessPlans/visionReview.mjs';
import styles from './VisionReviewPanel.module.css';
const emptyCriterion=()=>({title:'',description:'',maxScore:null});
export default function ProgramRubricEditor({program,onSave,disabled}){
  const [draft,setDraft]=useState(program||{title:'',version:'',sourceUrl:'',confirmed:false,criteria:[emptyCriterion()]});
  const update=(key,value)=>setDraft(old=>({...old,[key]:value,confirmed:key==='confirmed'?value:false}));
  const criterion=(index,key,value)=>update('criteria',draft.criteria.map((item,i)=>i===index?{...item,[key]:value}:item));
  return <details className={styles.rubric}><summary>채점 기준 · 공통 완성도 + {program?program.title:'개별 사업 기준 미등록'}</summary>
    {program&&<p className="my-2"><a href={program.sourceUrl} target="_blank" rel="noreferrer" className="underline">{program.title} · {program.version} · 공개 원문</a></p>}
    <p className="my-2">공통 완성도는 써티멘토의 참고 기준입니다. 문서 전체 기준 100점이며, 한 페이지에서는 적용 가능한 항목만 표시합니다.</p>
    <ul>{COMMON_CRITERIA.map(c=><li key={c.id}>{c.title} · {c.maxScore}점 — {c.description}</li>)}</ul>
    <p className="my-3">개별 사업은 공개 공고의 평가항목·배점을 그대로 등록하세요. 양식의 작성 목차를 평가기준으로 간주하지 않습니다. 공개 배점이 없으면 비워 두고 정성 의견만 제공합니다.</p>
    <fieldset disabled={disabled}>
      <label>사업명<input value={draft.title} maxLength={200} onChange={e=>update('title',e.target.value)}/></label>
      <label>연도·차수·평가기준 위치<input value={draft.version} maxLength={200} placeholder="예: 2026년 2차 공고 7쪽" onChange={e=>update('version',e.target.value)}/></label>
      <label>공개 원문 주소<input type="url" value={draft.sourceUrl} maxLength={1000} placeholder="https://…" onChange={e=>update('sourceUrl',e.target.value)}/></label>
      {draft.criteria.map((item,i)=><div className={styles.criterion} key={i}><label>평가항목 {i+1}<input maxLength={200} value={item.title} onChange={e=>criterion(i,'title',e.target.value)}/></label><label>공개 평가기준 원문<textarea maxLength={3000} value={item.description} onChange={e=>criterion(i,'description',e.target.value)}/></label><label>공개 배점 · 없으면 비움<input type="number" min={1} max={1000} value={item.maxScore??''} onChange={e=>criterion(i,'maxScore',e.target.value===''?null:Number(e.target.value))}/></label><button disabled={draft.criteria.length===1} onClick={()=>update('criteria',draft.criteria.filter((_,n)=>n!==i))}>항목 제거</button></div>)}
      <div className="my-3"><button disabled={draft.criteria.length>=15} onClick={()=>update('criteria',[...draft.criteria,emptyCriterion()])}>평가항목 추가</button></div>
      <label><input type="checkbox" checked={draft.confirmed} onChange={e=>update('confirmed',e.target.checked)}/> 해당 공고의 공개 원문과 항목·배점을 대조했습니다.</label>
      <div className="mt-3"><button disabled={!draft.confirmed} onClick={()=>onSave(draft)}>공개 기준 저장</button>{program&&<button onClick={()=>onSave(null)}>공통 기준만 사용</button>}</div>
    </fieldset>
    <p className="mt-2 text-xs">등록 기준은 사용자 확인 자료입니다. 서버가 원문 사이트를 자동 검증한 것은 아니며, AI 점수는 공식 심사 점수가 아닙니다.</p>
  </details>;
}
