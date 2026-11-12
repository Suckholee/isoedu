'use client';
import {useEffect,useRef,useState} from 'react';
import {definitionForAi} from '../../lib/venture/catalog.mjs';
import styles from './VentureConversation.module.css';

export default function VentureConversation({row,content,canEdit,busy,onBusy,onResult,onError,api,focus,onFocus,documentFields}){
 const [answer,setAnswer]=useState(''),[sending,setSending]=useState(''),[localError,setLocalError]=useState('');
 const turns=row.metadata.ai.chat?.turns||[],last=turns.at(-1),pending=useRef(null),end=useRef(null),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[turns.length,last?.state]);
 async function send(message=answer,retryTurn=null){
  if(busy||!message.trim())return;
  const request=retryTurn?{turnId:retryTurn.id,message:retryTurn.message,content:retryTurn.content,focus:retryTurn.focus,...(retryTurn.documentFields?{documentFields:retryTurn.documentFields}:{}),retry:true}:(pending.current?.message===message&&pending.current?.content===content&&pending.current?.focus===focus&&JSON.stringify(pending.current?.documentFields)===JSON.stringify(documentFields)?pending.current:{turnId:crypto.randomUUID(),message,content,focus,documentFields});
  pending.current=request;setSending(request.message);setLocalError('');onBusy('AI가 답변과 문서 반영 내용을 준비하고 있습니다…');onError('');
  try{
   const result=await api({action:'chat',documentId:row.id,expectedUpdatedAt:row.updated_at,...request});
   if(alive.current){onResult(result.document);setAnswer('');pending.current=null;}
  }catch(e){if(alive.current){pending.current={...request,retry:true};if(e.document)onResult(e.document,{preserveContent:request.content});onError(e.message);setLocalError(e.message);}}
  finally{if(alive.current){setSending('');onBusy('');}}
 }
 return <aside className={styles.chat} aria-label="AI 대화 가이드">
  <header><h4>AI와 함께 작성</h4><p>답변하면 옆 문서에 반영됩니다. 확인 후 저장해 주세요.</p><label className={styles.focus}>현재 문항<select aria-label="AI 가이드 문항" value={focus} disabled={!!busy} onChange={e=>{onFocus(e.target.value);pending.current=null;}}><option value="all">전체 문서</option>{definitionForAi(row.metadata.ai).sections.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label></header>
  <div className={styles.messages} role="log" aria-label="사업계획서 대화 기록" aria-live="polite">
   {!turns.length&&<div className={styles.assistant}><strong>어니스톤 AI</strong><p>현재 초안에서 부족한 정보를 한 가지씩 정리해 볼게요.</p><p>‘부족한 정보 물어보기’를 누르면 현재 문서와 선택 문항을 읽고 질문합니다. 보완할 내용을 바로 답해 주셔도 됩니다.</p></div>}
   {turns.map(t=><div key={t.id} className={styles.exchange}>
    <div className={styles.user}><strong>나</strong><p>{t.message}</p></div>
    {t.state==='ready'?<div className={styles.assistant}><strong>어니스톤 AI</strong><p>{t.reply}</p>{t.questions.map((q,i)=><p key={i} className={styles.question}>{q}</p>)}
     {t.changes.length>0&&<details><summary>문서 반영 {t.changes.length}곳 {t.discarded?'· 되돌림':t.savedRevision?`· 수정 ${t.savedRevision} 저장`:''}</summary>{t.changes.map((c,i)=><div key={i} className={styles.change}><p>{c.reason}</p><del>{c.before}</del><ins>{c.after}</ins></div>)}</details>}
    </div>:<div className={styles.assistant}><p>{t.state==='failed'?t.error:'답변을 준비하고 있습니다. 오래 걸리면 저장 목록을 새로고침해 확인해 주세요.'}</p><button disabled={!!busy||!canEdit} onClick={()=>send(t.message,t)}>이 답변 재시도</button></div>}
   </div>)}{sending&&<><div className={styles.user}><strong>나</strong><p>{sending}</p></div><p role="status">AI가 답변과 문서 반영 내용을 준비하고 있습니다…</p></>}{localError&&<p role="alert">{localError}</p>}<div ref={end}/>
  </div>
  {last?.state==='ready'&&last.choices?.length>0&&<div className={styles.choices}>{last.choices.map(c=><button key={c} disabled={!!busy||!canEdit} onClick={()=>setAnswer(c)}>{c}</button>)}</div>}
  <form className={styles.composer} onSubmit={e=>{e.preventDefault();send();}}>
   <label htmlFor={`answer-${row.id}`}>AI에게 답변하거나 수정 요청</label>
   <textarea id={`answer-${row.id}`} rows={3} maxLength={4000} value={answer} onChange={e=>{setAnswer(e.target.value);pending.current=null;}} disabled={!!busy||!canEdit} placeholder="답변을 적어 주세요. 모르는 내용은 모른다고 알려주셔도 됩니다." onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&!e.nativeEvent.isComposing){e.preventDefault();send();}}}/>
   <div><button type="button" disabled={!!busy||!canEdit} onClick={()=>send('현재 사업계획서에서 가장 먼저 확인할 부족한 정보를 한두 가지 질문해 주세요. 아직 본문은 수정하지 마세요.')}>부족한 정보 물어보기</button><button type="submit" disabled={!!busy||!canEdit||!answer.trim()}>답변 보내기</button></div>
   <small>답변·현재 본문은 OpenAI에 전달됩니다. 대화는 보관되며 본문은 검토 후 저장됩니다.</small>
  </form>
 </aside>;
}
