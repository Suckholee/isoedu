'use client';
import {pageScoreSummary} from '../../lib/businessPlans/visionReview.mjs';
import styles from './DocumentReviewSummary.module.css';

function PageLinks({pages,onPage}) {
  return <div className={styles.pages}><span>원문 근거</span>{pages.map(n=><button type="button" key={n} onClick={()=>onPage(n)}>{n}쪽 ↗</button>)}</div>;
}
function Priority({item,index,onPage,onDiscuss,active,disabled}) {
  return <article className={styles.priority}>
    <div className={styles.priorityHeading}><span className={styles.number}>{String(index+1).padStart(2,'0')}</span><h5>{item.issue}</h5></div>
    <details className={styles.expand}><summary>보완 방법과 질문 보기</summary><div className={styles.detailBody}><strong>이렇게 보완하세요</strong><p>{item.suggestion}</p><div className={styles.question}><strong>확인할 질문</strong><p>{item.question}</p></div></div></details>
    <button type="button" className={styles.discuss} disabled={disabled} aria-expanded={active} onClick={()=>onDiscuss(index)}>AI와 이 항목 보완하기 →</button>
    <PageLinks pages={item.pages} onPage={onPage}/>
  </article>;
}
export default function DocumentReviewSummary({report,criteria,program,onPage,onDiscuss,activePriority,conversation,disabled,onVisual,visualState,activeVisual,visualWorkshop}) {
  const common=pageScoreSummary(report,criteria,'common'),specific=pageScoreSummary(report,criteria,'program');
  return <section className={styles.report} aria-label="전체 문서 종합 평가">
    <header className={styles.heading}><div><span className={styles.eyebrow}>문서 전체 분석 결과</span><h3>내 사업계획서, 어디부터 보완할까요?</h3></div><span className={styles.badge}>전체 {report.total}쪽 평가 완료</span></header>
    <div className={styles.overview}>
      <div className={styles.metric}><span>공통 완성도</span><div className={styles.score}><strong>{common.maximum?common.score:'—'}</strong><span>{common.maximum?`/ ${common.maximum}점`:'점수 미산정'}</span></div><span>{common.assessed}/{common.total}항목 점수 산정</span>{program&&<div className={styles.programScore}><span>지원사업 공개 기준</span><strong>{specific.maximum?`${specific.score} / ${specific.maximum}점`:'정성 평가'}</strong><small>{specific.assessed}/{specific.total}항목 점수 산정</small></div>}<p>전체 페이지를 연결한 AI 참고 평가<br/>공식 심사 점수가 아닙니다.</p></div>
      <div className={styles.criteria}><h4>항목별 완성도 <span>항목을 누르면 평가 근거가 열립니다</span></h4>
        {criteria.filter(c=>c.scope==='common'||program).map(c=>{const s=report.scores.find(s=>s.criterionId===c.id);const scored=typeof s?.score==='number'&&c.maxScore>0;return <details key={c.id} className={styles.criterion}><summary><span className={styles.criterionName}>{c.title}{c.scope==='program'&&<small>지원사업 기준</small>}</span><span className={styles.track} aria-hidden="true"><span style={{width:scored?`${Math.max(0,Math.min(100,s.score/c.maxScore*100))}%`:'0%'}}/></span><span className={styles.value}>{scored?<><b>{s.score}</b> / {c.maxScore}</>:c.maxScore?'미산정':'정성 평가'}</span><span className={styles.chevron} aria-hidden="true">⌄</span></summary><div className={styles.detailBody}><p>{s?.reason||'아직 평가 근거가 없습니다.'}</p>{s&&<PageLinks pages={s.pages} onPage={onPage}/>}</div></details>;})}
      </div>
    </div>
    {report.visualRecommendations?.length>0&&<section aria-label="추천 시각 자료"><div className={styles.priorityTitle}><h4>표·그래프·도표·이미지 보완 제안</h4><span>카드에서 만들고 보완본에 넣으세요</span></div><div className={styles.priorityGrid}>{report.visualRecommendations.map((v,i)=><article className={styles.priority} key={i}><span className={styles.eyebrow}>{{table:'표',chart:'그래프',diagram:'구조·흐름 도표',image:'이미지'}[v.kind]}</span><h5>{v.title}</h5><p>{v.purpose}</p><details className={styles.expand}><summary>구성과 필요한 자료 보기</summary><div className={styles.detailBody}><strong>이렇게 구성하세요</strong><p>{v.outline}</p><strong>먼저 확인할 자료</strong><p>{v.requiredData}</p></div></details><button type="button" className={styles.discuss} disabled={disabled} aria-expanded={activeVisual===i} onClick={()=>onVisual(i)}>{visualState?.[`${report.key}:${i}`]?.included?'보완본에 포함됨 · 수정하기':visualState?.[`${report.key}:${i}`]?.visual?'저장한 자료 수정·넣기 →':'이 자료 만들기 →'}</button><PageLinks pages={v.pages} onPage={onPage}/></article>)}</div></section>}
    {visualWorkshop}
    <details className={styles.overall}><summary>AI 종합 의견 전체 보기</summary><p>{report.summary}</p></details>
    <div className={styles.priorityTitle}><h4>먼저 보완할 {Math.min(3,report.priorities.length)}가지</h4><span>전체 {report.priorities.length}개 · AI 제안 순서</span></div>
    <div className={styles.priorityGrid}>{report.priorities.slice(0,3).map((item,index)=><Priority key={index} item={item} index={index} onPage={onPage} onDiscuss={onDiscuss} disabled={disabled} active={activePriority===index}/>)}</div>
    {activePriority!==null&&activePriority<3&&conversation}
    {report.priorities.length>3&&<details className={styles.more}><summary>나머지 {report.priorities.length-3}개 보완사항 보기</summary><div className={styles.priorityGrid}>{report.priorities.slice(3).map((item,index)=><Priority key={index+3} item={item} index={index+3} onPage={onPage} onDiscuss={onDiscuss} disabled={disabled} active={activePriority===index+3}/>)}</div></details>}
    {activePriority!==null&&activePriority>=3&&conversation}
  </section>;
}
