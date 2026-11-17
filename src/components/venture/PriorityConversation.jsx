'use client';
import {useEffect,useRef} from 'react';
import styles from './DocumentReviewSummary.module.css';
export default function PriorityConversation({report,index,row,content,onContent,message,onMessage,onSend,onDiscard,disabled,canEdit,autosave,onClose,onReview}){
  const panel=useRef(null);
  useEffect(()=>{panel.current?.scrollIntoView({behavior:'smooth',block:'nearest'});},[index,report.key]);
  const item=report.priorities[index],coach=row.metadata.sourceCoach||{};
  const turns=(coach.turns||[]).filter(t=>t.reportKey===report.key&&t.priorityIndex===index);
  const proposal=coach.proposal,ownProposal=proposal?.reportKey===report.key&&proposal?.priorityIndex===index;
  const applied=ownProposal&&content===proposal.content;
  const blockedProposal=proposal&&proposal.content!==content;
  return <section ref={panel} className={styles.conversation} aria-label={`${index+1}번 보완 카드 AI 대화`}>
    <header><div><span className={styles.eyebrow}>보완 카드 {index+1} · AI와 함께 수정</span><h4>{item.issue}</h4></div><button type="button" disabled={disabled} onClick={onClose}>접기</button></header>
    <div className={styles.question}><strong>AI의 첫 질문</strong><p>{item.question}</p></div>
    {turns.map(t=><div key={t.id} className={styles.exchange}><div><strong>내 답변</strong><p>{t.message}</p></div><div><strong>AI 코치</strong><p>{t.reply}</p>{t.questions.map((q,i)=><p key={i}>{q}</p>)}</div></div>)}
    {ownProposal&&<div className={styles.changeReview}><strong>{applied?'수정안이 보완본에 적용됐습니다':'AI 수정안 · 적용 전에 확인하세요'}</strong>{coach.turns.find(t=>t.id===proposal.turnId)?.changes.map((c,i)=><details key={i}><summary>{c.reason}</summary><div className={styles.beforeAfter}><div><small>수정 전</small><p>{c.before}</p></div><div><small>수정 후</small><p>{c.after}</p></div></div></details>)}<div className={styles.chatActions}><button type="button" disabled={!canEdit||disabled||content!==proposal.baseContent} onClick={()=>onContent(proposal.content)}>{applied?'보완본에 적용됨':'수정안 적용 · 자동 저장'}</button><button type="button" disabled={!canEdit||disabled} onClick={onDiscard}>{applied?'이 제안 정리':'수정안 보류'}</button></div>{content!==proposal.baseContent&&!applied&&<p>직접 수정한 내용이 있어 자동으로 덮어쓰지 않습니다. 수정안을 참고하거나 보류한 뒤 이어가세요.</p>}</div>}
    {blockedProposal&&!ownProposal&&<p role="status">다른 항목의 수정안이 남아 있습니다. 그 수정안을 적용하거나 아래에서 보류한 뒤 이어가세요. <button type="button" disabled={!canEdit||disabled} onClick={onDiscard}>이전 수정안 보류</button></p>}
    <label className={styles.replyLabel}>이 카드에 답하기<textarea value={message} maxLength={4000} disabled={!canEdit||disabled} onChange={e=>onMessage(e.target.value)} placeholder="확인한 사실을 알려 주세요. 모르는 내용은 ‘확인 필요’로 남길 수 있습니다."/></label>
    <div className={styles.chatActions}><button type="button" disabled={!canEdit||disabled||!message.trim()||Boolean(blockedProposal)} onClick={onSend}>{disabled?'처리 중…':'답변 보내고 수정안 받기'}</button><span role="status">{autosave||'답변과 적용한 수정 내용은 자동 저장됩니다.'}</span><button type="button" disabled={disabled} onClick={onReview}>보완 완료 단계로 →</button></div>
  </section>;
}
