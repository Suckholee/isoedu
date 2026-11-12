'use client';
import {useState,useEffect,useRef} from 'react';
import {PLAN_TYPES} from '../../lib/businessPlans/model.mjs';
import {readPlanSource} from '../../lib/businessPlans/readSource.mjs';
import {suggestCompanySources,finishAutomaticImages} from '../../lib/businessPlans/oneClickClient.mjs';
const KIND={'official-form':'공식 빈 양식','official-online-fields':'온라인 입력 항목','guide-outline':'공식 안내 기반 구성','video-script':'현장 촬영 대본'};
export default function ApplicationPlanSetup({api,canEdit,busy,onBusy,onResult,onError}){
 const [catalog,setCatalog]=useState(null),[loadError,setLoadError]=useState(''),[reload,setReload]=useState(0),[template,setTemplate]=useState(''),[business,setBusiness]=useState(''),[facts,setFacts]=useState(''),[ids,setIds]=useState([]),[progress,setProgress]=useState(''),[showStored,setShowStored]=useState(false);
 const alive=useRef(true),pending=useRef(null),active=useRef(false),abort=useRef();
 useEffect(()=>{alive.current=true;setLoadError('');api({action:'application-catalog'}).then(d=>{if(!alive.current)return;setCatalog(d);setBusiness(d.previousInput?.business||'');setFacts(d.previousInput?.facts||'');}).catch(e=>{if(alive.current)setLoadError(e.message);});return()=>{alive.current=false;abort.current?.abort();};},[reload]);
 const chosen=catalog?.templates.find(t=>t.id===template),coverage=catalog?.coverage.find(c=>c.type===chosen?.type);
 function choose(id){const f=catalog.templates.find(t=>t.id===id);setTemplate(id);setIds(f?suggestCompanySources(catalog.sources.filter(s=>s.id!==id),f.type):[]);pending.current=null;}
 async function generate(){
  if(active.current||busy||!canEdit||!chosen||!business.trim())return;active.current=true;const ac=new AbortController();abort.current=ac;onBusy('회사 자료를 읽고 있습니다…');onError('');
  let lastDocument;
  try{
   if(!pending.current){
    const sourceWarnings=[],sources=[];let total=0;
    const read=await readPlanSource(chosen,{signal:ac.signal,onProgress:setProgress});
    for(const id of ids){if(!alive.current||ac.signal.aborted)return;const source=catalog.sources.find(s=>s.id===id);setProgress(`회사 자료 읽는 중: ${source.title}`);
     try{const item=await readPlanSource(source,{signal:ac.signal,onProgress:setProgress});if(total+item.text.length>120000)throw Error('자료 본문 합계 한도를 넘어 이번 작성에서 제외했습니다.');sources.push(item);total+=item.text.length;}catch(e){if(ac.signal.aborted)throw e;sourceWarnings.push(`${source.title}: ${e.message}`.slice(0,1000));}
    }
    if(!alive.current||ac.signal.aborted)return;
    pending.current={payload:{action:'application-generate',documentId:crypto.randomUUID(),type:chosen.type,template:read,sources,business,facts,sourceWarnings,consent:true,autoCompose:true},retry:false};
   }
   onBusy('본문·표·그래프를 작성하고 있습니다…');setProgress('양식 문항에 맞춰 내용을 구성하고 있습니다.');
   const request=pending.current;request.retry=Boolean(request.sent);request.sent=true;
   const result=await api({...request.payload,retry:request.retry});lastDocument=result.document;
   if(!alive.current)return;
   const completed=await finishAutomaticImages({document:result.document,api,onProgress:label=>{if(alive.current){onBusy(label);setProgress(label);}},isActive:()=>alive.current});lastDocument=completed.document;
   if(alive.current){pending.current=null;onResult(completed.document);if(completed.failures.length)onError('본문과 완성된 시각 자료를 저장했습니다. 일부 그림은 문서에서 이어서 작성할 수 있습니다.');}
  }catch(e){if(alive.current){if(e.document||lastDocument){pending.current=null;onResult(e.document||lastDocument);}onError(e.message);}}
  finally{active.current=false;if(alive.current){onBusy('');setProgress('');}}
 }
 if(loadError)return <div role="alert"><p>{loadError}</p><button className="underline" onClick={()=>setReload(n=>n+1)}>회사 정보 다시 불러오기</button></div>;
 if(!catalog)return <p>회사 정보와 신청 사업을 불러오는 중입니다…</p>;
 return <div className="space-y-4 text-sm">
  <p className="font-medium">{catalog.company?.name||'선택한 회사'}{catalog.company?.industry&&` · ${catalog.company.industry}`}</p>
  <label className="block">회사 사업·제품 정보<textarea aria-label="회사 사업·제품 정보" className="block w-full border rounded p-2 mt-1" rows={3} maxLength={4000} value={business} disabled={!!busy||!canEdit} placeholder="무엇을 만들고, 누구에게 제공하나요?" onChange={e=>{setBusiness(e.target.value);pending.current=null;}}/></label>
  <label className="block">확인된 실적·수치와 앞으로의 계획<textarea aria-label="회사 실적과 계획" className="block w-full border rounded p-2 mt-1" rows={3} maxLength={16000} value={facts} disabled={!!busy||!canEdit} placeholder="매출·인력·개발 현황·자금·일정 등. 수치는 연도와 단위를 함께 적어 주세요." onChange={e=>{setFacts(e.target.value);pending.current=null;}}/></label>
  <label className="block">신청 사업<select aria-label="자동작성 신청 사업" className="block w-full border rounded p-2 mt-1" value={template} disabled={!!busy||!canEdit} onChange={e=>choose(e.target.value)}><option value="">신청할 사업·세부 유형을 선택하세요</option>{PLAN_TYPES.map(t=>{const options=catalog.templates.filter(f=>f.type===t.id&&f.source==='official-catalog');return options.length>0&&<optgroup key={t.id} label={t.label}>{options.map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</optgroup>;})}{showStored&&<optgroup label="보관 양식 · 해당 공고와 일치 여부 확인">{catalog.templates.filter(f=>f.source!=='official-catalog').map(f=><option key={f.id} value={f.id}>{f.title}</option>)}</optgroup>}</select></label>
  <details><summary>다른 사업·보관 양식과 준비 현황</summary><label className="block my-2"><input type="checkbox" checked={showStored} disabled={!!busy} onChange={e=>setShowStored(e.target.checked)}/> 회사·공통 자료함의 보관 빈 양식도 표시</label><p className="text-xs">보관 양식은 최신 공식 공고와 대조한 후 선택하세요. 목록에 없는 사업은 회사 문서함에 해당 빈 양식을 보관해 연결할 수 있습니다.</p>{catalog.coverage.filter(c=>c.pending?.length).map(c=><div key={c.type} className="border-t mt-2 pt-2">{c.pending.map(p=><p key={p.title}><a className="underline" href={p.sourceUrl} target="_blank" rel="noreferrer">{p.title}</a> — {p.reason}</p>)}</div>)}</details>
  {chosen&&<div className="rounded border bg-slate-50 p-3 space-y-1"><p>{KIND[chosen.documentKind]||'보관 양식 · 적용 여부 확인'}{chosen.versionLabel&&` · ${chosen.versionLabel}`}</p>{chosen.requirements?.bodyPages&&<p>본문 {chosen.requirements.bodyPages.value}쪽 {chosen.requirements.bodyPages.mode==='maximum'?'이내':'내외'}</p>}{chosen.requirements?.notes?.map(n=><p className="text-xs" key={n}>{n}</p>)}<div className="flex flex-wrap gap-3">{chosen.sourceUrl&&<a className="underline" href={chosen.sourceUrl} target="_blank" rel="noreferrer">신청 공고 확인</a>}{(chosen.originalUrl||chosen.originalPath)&&<a className="underline" href={chosen.originalUrl||'/api/vault-file?path='+encodeURIComponent(chosen.originalPath)} target="_blank" rel="noreferrer">원문 양식 보기</a>}</div><details><summary>사업별 준비 안내</summary><p>{coverage?.note}</p></details></div>}
  {chosen&&<details><summary>자동 선택한 회사 자료 {ids.length}개 · 변경 가능</summary><p className="text-xs text-slate-500 my-2">해당 사업으로 분류된 자료와 최근 자료를 최대 5개 골랐습니다. 읽지 못한 자료는 결과에 표시합니다.</p><div className="max-h-48 overflow-auto">{catalog.sources.filter(s=>s.id!==template).map(s=><label className="block py-1" key={s.id}><input type="checkbox" disabled={!!busy||(!ids.includes(s.id)&&ids.length>=5)} checked={ids.includes(s.id)} onChange={e=>{setIds(e.target.checked?[...ids,s.id]:ids.filter(id=>id!==s.id));pending.current=null;}}/> {s.title}</label>)}</div></details>}
  <p className="text-xs text-slate-600">자동작성을 누르면 회사 정보·선택 자료를 OpenAI에 전달해 글·표·그래프와 필요한 개념 그림을 작성하고 회사 문서함에 저장합니다. 수치가 없는 그래프와 실제 사진이 필요한 부분은 확인 항목으로 남깁니다.</p>
  {progress&&<p role="status" className="text-emerald-800">{progress}</p>}
  <button className="rounded bg-emerald-800 text-white px-5 py-3 disabled:opacity-40" disabled={!!busy||!canEdit||!chosen||!business.trim()} onClick={generate}>{pending.current?.sent?'같은 입력으로 이어서 작성':'자동작성'}</button>
 </div>;
}
