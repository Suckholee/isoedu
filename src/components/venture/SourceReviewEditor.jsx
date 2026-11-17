'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {includedSourceVisuals} from '../../lib/businessPlans/sourceVisuals.mjs';
import {visualSvg} from '../../lib/venture/visuals.mjs';
import VisionReviewPanel from './VisionReviewPanel';
import SourceReviewHistory from './SourceReviewHistory';
import {hasCurrentSourceReview} from '../../lib/businessPlans/sourceReview.mjs';

export default function SourceReviewEditor({source, api, canEdit, onClose, onUse}) {
  const [row, setRow] = useState(source);
  const [actorId,setActorId]=useState(null);
  const [content, setContent] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coaching, setCoaching] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const alive = useRef(true), latestRow=useRef(source), queue=useRef(Promise.resolve()), draftVersion=useRef(0), backupKey=useRef(null), latestEdit=useRef(null), savedEdit=useRef(null), draftFlight=useRef(null);
  const [position,setPosition]=useState({pageId:1,point:0,message:'',cardMessages:{},activePriority:null}),[autosave,setAutosave]=useState(''),[conflict,setConflict]=useState(false);
  const onRow=useCallback(value=>{latestRow.current=value;if(alive.current)setRow(value);},[]);
  const editorApi=useCallback(body=>{
    const job=queue.current.catch(()=>{}).then(async()=>{
      const payload={...body};if('expectedUpdatedAt' in payload)payload.expectedUpdatedAt=latestRow.current.updated_at;
      const result=await api(payload);if(result.source)onRow(result.source);return result;
    });queue.current=job;return job;
  },[api,onRow]);
  function backup(value){latestEdit.current=value;if(!backupKey.current)return;try{localStorage.setItem(backupKey.current,JSON.stringify({...value,version:draftVersion.current,at:Date.now()}));setAutosave('이 기기에 저장됨 · 계정에 자동 저장 중…');}catch{setAutosave('이 기기 저장 공간이 부족합니다. 계정 자동 저장을 확인해 주세요.');}}
  async function flush(){
    if(draftFlight.current){await draftFlight.current;return flush();}
    const job=saveDraft();draftFlight.current=job;try{await job;}finally{draftFlight.current=null;}
  }
  async function saveDraft(){
    const value=latestEdit.current;if(!canEdit||!value||conflict||JSON.stringify(value)===savedEdit.current)return;
    try{const result=await editorApi({action:'source-draft-save',sourceId:source.id,...value,expectedDraftVersion:draftVersion.current,requestId:crypto.randomUUID()});
      draftVersion.current=result.draft.version;savedEdit.current=JSON.stringify(value);
      if(backupKey.current&&latestEdit.current)localStorage.setItem(backupKey.current,JSON.stringify({...latestEdit.current,version:draftVersion.current,at:Date.now()}));
      if(alive.current)setAutosave(JSON.stringify(latestEdit.current)===savedEdit.current?'자동 저장 완료':'새 입력을 자동 저장 중…');
    }catch(e){if(alive.current){setAutosave(e.message);if(e.status===409){setConflict(true);try{const fresh=await editorApi({action:'source-review-preview',sourceId:source.id});draftVersion.current=fresh.workingDraft?.version||0;}catch{}}}throw e;}
  }
  useEffect(()=>{if(loading||busy||conflict)return;const timer=setTimeout(()=>flush().catch(()=>{}),700);return()=>clearTimeout(timer);},[content,position,loading,saving,coaching,conflict,autosave]);

  useEffect(()=>{const retry=()=>{if(!loading&&!saving&&!coaching&&!conflict)flush().catch(()=>{});};window.addEventListener('online',retry);const timer=setInterval(retry,15000);return()=>{window.removeEventListener('online',retry);clearInterval(timer);};},[loading,saving,coaching,conflict]);

  useEffect(() => {
    alive.current = true;
    api({action:'source-review-preview', sourceId:source.id}).then(result => {
      if (!alive.current) return;
      setActorId(result.actorId);onRow(result.source);draftVersion.current=result.workingDraft?.version||0;
      backupKey.current=`certimento:source-draft:${result.actorId}:${source.company_id}:${source.id}`;
      const remote=result.workingDraft&&!result.workingDraft.cleared?result.workingDraft:null;
      let local;try{local=JSON.parse(localStorage.getItem(backupKey.current)||'null');}catch{}
      const fallback={content:result.source.metadata.sourceCoach?.proposal?.baseContent||result.content,message:'',pageId:1,point:0,cardMessages:result.workingDraft?.cardMessages||{},activePriority:result.workingDraft?.activePriority??null};
      const value=local&&typeof local.content==='string'&&local.version===draftVersion.current?local:remote||fallback;
      const clean={content:value.content,message:value.message||'',pageId:value.pageId||1,point:value.point||0,cardMessages:value.cardMessages||{},activePriority:value.activePriority??null};
      setContent(clean.content);setPosition({message:clean.message,pageId:clean.pageId,point:clean.point,cardMessages:clean.cardMessages,activePriority:clean.activePriority});latestEdit.current=clean;
      savedEdit.current=JSON.stringify(remote?{content:remote.content,message:remote.message,pageId:remote.pageId,point:remote.point,cardMessages:remote.cardMessages||{},activePriority:remote.activePriority??null}:fallback);
      if(local&&local.version!==draftVersion.current&&JSON.stringify({content:local.content,message:local.message,pageId:local.pageId,point:local.point,cardMessages:local.cardMessages||{},activePriority:local.activePriority??null})!==savedEdit.current){latestEdit.current={content:local.content,message:local.message||'',pageId:local.pageId||1,point:local.point||0,cardMessages:local.cardMessages||{},activePriority:local.activePriority??null};setContent(local.content);setPosition({message:local.message||'',pageId:local.pageId||1,point:local.point||0,cardMessages:local.cardMessages||{},activePriority:local.activePriority??null});setConflict(true);setAutosave('다른 창의 저장본과 이 기기의 입력이 다릅니다. 자동 덮어쓰기를 멈췄습니다.');}
      else if(remote||local)setAutosave('이전에 수정하던 내용을 복원했습니다.');
      if (result.stale) setNotice('분석이 갱신됐습니다. 이전 보완본을 보존했습니다. 최신 쪽별 결과와 대조한 뒤 다시 저장해 주세요.');
    }).catch(failure => {if (alive.current) setError(failure.message);})
      .finally(() => {if (alive.current) setLoading(false);});
    return () => {alive.current = false;};
  }, [source.id]);

  const dirty = content !== (row.content_draft || '');
  const usable = !dirty && hasCurrentSourceReview(row) && !row.metadata.sourceCoach?.proposal;
  const busy = saving || coaching;
  function edit(value){setContent(value);backup({content:value,...position});setReviewed(false);setNotice('');}
  function move(value){setPosition(value);backup({content:latestEdit.current?.content??content,...value});}
  async function save(continueToProgram=false) {
    if (busy || loading || !canEdit || !reviewed || !content.trim()) return;
    setSaving(true); setError(''); setNotice('');
    try {
      await flush();
      const result = await editorApi({action:'source-review-save',sourceId:row.id,
        expectedUpdatedAt:row.updated_at,content,reviewed});
      if (alive.current) {
        onRow(result.source); setContent(result.source.content_draft); setReviewed(false);draftVersion.current=result.source.metadata.sourceWorkingDrafts?.[result.source.metadata.sourceReview.actor]?.version||0;latestEdit.current={content:result.source.content_draft,...position};savedEdit.current=JSON.stringify(latestEdit.current);if(backupKey.current)localStorage.removeItem(backupKey.current);setAutosave('검토한 보완본 저장 완료');
        setNotice('보완본을 저장했습니다. 다른 사업의 양식을 선택해 작성할 수 있습니다.');
        if(continueToProgram)onUse(result.source);
      }
    } catch (failure) {if (alive.current) setError(failure.message);}
    finally {if (alive.current) setSaving(false);}
  }

  return <section className="space-y-3 p-4 text-sm" aria-label="사업계획서 보완">
    <header className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-semibold">내용 보완 · {row.title}</h2>
      <button className="underline" disabled={busy} onClick={()=>{flush().catch(()=>{});onClose();}}>분석 목록으로</button>
    </header>
    <p>전체 문서를 먼저 분석하고 종합 평가를 확인한 뒤, 원문 위치별 의미·맥락·평가기준과 보완 질문을 살펴보세요. AI 수정안은 적용하고 검토 저장한 내용만 다음 사업 작성에 사용합니다.</p>
    {loading && <p role="status">보완본을 불러오는 중입니다…</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {notice && <p role="status" className="text-emerald-800">{notice}</p>}
    {!loading&&<SourceReviewHistory row={row} api={editorApi}/>}
    {!loading&&<VisionReviewPanel actorId={actorId} row={row} onRow={onRow} content={content} onContent={edit} api={editorApi} position={position} onPosition={move} canEdit={canEdit} disabled={saving||conflict} onBusy={setCoaching} autosave={autosave} onReview={()=>document.getElementById('plan-review-finish')?.scrollIntoView({behavior:'smooth',block:'center'})}/>}
    {autosave&&<p role="status">{autosave}</p>}
    {conflict&&<div role="alert"><p>현재 입력을 복사해 보관하거나 아래 선택으로 충돌을 해결하세요.</p><button onClick={()=>{setConflict(false);savedEdit.current=null;backup(latestEdit.current);}}>현재 입력을 내 계정 초안으로 저장</button><button onClick={()=>{if(backupKey.current)localStorage.removeItem(backupKey.current);onClose();}}>계정 저장본 다시 열기</button></div>}
    <label className="block">보완할 내용
      <textarea className="mt-2 block min-h-[24rem] w-full rounded border p-3 leading-7"
        value={content} maxLength={60000} disabled={loading||busy||!canEdit}
        onChange={event=>edit(event.target.value)} />
    </label>
    <p className="text-xs text-slate-500">{content.length.toLocaleString()} / 60,000자 · 저장된 보완본 {row.metadata.sourceReview?.revision||0}차</p>
    {includedSourceVisuals(row).length>0&&<section className="border rounded-xl p-4 space-y-3" aria-label="보완본에 포함한 시각 자료"><h3 className="font-semibold">보완본에 포함한 시각 자료 {includedSourceVisuals(row).length}개</h3>{includedSourceVisuals(row).map(v=><figure key={v.id} className="border rounded p-3"><h4>{v.title}</h4>{v.type==='table'?<div className="overflow-auto"><table className="w-full border-collapse"><thead><tr>{v.columns.map((c,i)=><th className="border p-2" key={i}>{c}</th>)}</tr></thead><tbody>{v.rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td className="border p-2" key={j}>{c}</td>)}</tr>)}</tbody></table></div>:<img className="max-w-full max-h-96 object-contain" alt={v.title} src={v.type==='image'?'/api/vault-file?path='+encodeURIComponent(v.path):'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(visualSvg(v))}/>}<figcaption>{v.caption} · 출처: {v.source}</figcaption></figure>)}</section>}
    <div id="plan-review-finish" className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3"><h3 className="font-semibold">보완을 마치고 다음 지원사업으로</h3><p className="text-xs text-slate-600">수정 내용은 자동 저장됩니다. 원문과 확인한 뒤 보완 완료를 누르면, 지원사업과 양식을 선택해 새 신청서를 만들 수 있습니다.</p>
    {canEdit && <label className="block"><input type="checkbox" checked={reviewed} disabled={loading||busy} onChange={event=>setReviewed(event.target.checked)}/> 원문과 보완 내용을 검토하고, 미확인 정보는 구분했습니다.</label>}
    <div className="flex flex-wrap gap-2">
      <button className="work-primary disabled:opacity-40" disabled={!canEdit||loading||busy||conflict||!reviewed||!content.trim()} onClick={()=>save()}>{saving?'저장 중…':'보완본 저장'}</button>
      <button className="rounded border px-3 py-2 disabled:opacity-40" disabled={!canEdit||loading||busy||conflict||(!usable&&(!reviewed||!content.trim()))} onClick={()=>usable?onUse(row):save(true)}>보완 완료 · 지원사업 선택 →</button>
    </div>
    </div>
    {row.metadata.sourceReview?.history?.length>0 && <details><summary>이전 보완본 {row.metadata.sourceReview.history.length}개</summary>{[...row.metadata.sourceReview.history].reverse().map(item=><details key={item.revision} className="mt-2 border-t p-2"><summary>{item.revision}차 · {new Date(item.at).toLocaleString('ko-KR')}</summary><pre className="max-h-80 overflow-auto whitespace-pre-wrap">{item.content}</pre></details>)}</details>}
  </section>;
}
