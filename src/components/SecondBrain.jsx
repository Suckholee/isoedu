'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {Search,X,FileText,RotateCcw,List,Network,RefreshCw,Square} from 'lucide-react';
import {manualGraph,isManual} from '../lib/secondBrain/manuals.mjs';
import {conceptKey} from '../lib/secondBrain/concepts.mjs';
import KnowledgeGraph from './KnowledgeGraph';
import ArticleEditor from './ArticleEditor';
import {useAuth} from '../context/AuthContext';
import {conceptQuestions,questionDraft} from '../lib/secondBrain/questions.mjs';
import styles from './SecondBrain.module.css';

const locationLabel=value=>String(value||'본문').replace(/^ppt\/slides\/slide(\d+)\.xml$/, '슬라이드 $1').replace(/^BodyText\/Section(\d+)$/,(_,n)=>`본문 구간 ${Number(n)+1}`).replace(/^word\/document\.xml$/, '본문').replace(/^Contents\/section(\d+)\.xml$/,(_,n)=>`본문 구간 ${Number(n)+1}`);

export default function SecondBrain({accountId,onOpenDocument}) {
 const {profile}=useAuth();
 const [editor,setEditor]=useState(null),[editorDirty,setEditorDirty]=useState(false),[closeWarning,setCloseWarning]=useState(false);
 const router=useRouter(),params=useSearchParams(),pending=useRef(params.toString());
 const [snapshot,setSnapshot]=useState(null),[attempt,setAttempt]=useState(0),[error,setError]=useState('');
 const [progress,setProgress]=useState(''),[busy,setBusy]=useState(false),[failures,setFailures]=useState({});
 const [rotating,setRotating]=useState(false),[resetToken,setResetToken]=useState(0);
 const controller=useRef(null),scope=useRef(accountId);scope.current=accountId;
 useEffect(()=>{pending.current=params.toString();},[params]);
 const patch=values=>{const next=new URLSearchParams(pending.current);for(const [k,v]of Object.entries(values))v?next.set(k,v):next.delete(k);pending.current=next.toString();router.replace('/second-brain'+(next.size?'?'+next:''),{scroll:false});};
 useEffect(()=>{
  // The graph is exclusively the saved reference library. Retire record/link navigation state.
  const next=new URLSearchParams(pending.current);let changed=false;
  for(const key of ['note','kbq','kbtag','kbkind','kbview','kbproject','kblens','kbdocs','kbconcept','kbdisplay'])if(next.has(key)){next.delete(key);changed=true;}
  if(changed){pending.current=next.toString();router.replace('/second-brain'+(next.size?'?'+next:''),{scroll:false});}
 },[]);
 useEffect(()=>{
  if(!accountId){setSnapshot(null);return;}
  const ac=new AbortController();setError('');setFailures({});
  fetch('/api/knowledge-manuals',{cache:'no-store',signal:ac.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error||'참조문서를 불러오지 못했습니다.');if(!ac.signal.aborted)setSnapshot({accountId,attempt,documents:data.documents});}).catch(e=>{if(!ac.signal.aborted)setError(e.message);});
  return()=>{ac.abort();controller.current?.abort();};
 },[accountId,attempt]);
 const ready=snapshot?.accountId===accountId&&snapshot?.attempt===attempt;
 const documents=ready?snapshot.documents:[],query=params.get('manualq')||'',allReferences=params.get('manualscope')==='all',listMode=params.get('manualview')==='list';
 const selectedId=params.get('manual'),selectedConceptId=params.get('concept');
 const visible=useMemo(()=>documents.filter(d=>(allReferences||d.manual||isManual(d.title))&&`${d.title} ${d.analysis?.concepts.map(c=>c.label).join(' ')||''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())),[documents,allReferences,query]);
 const graph=useMemo(()=>manualGraph(visible),[visible]);
 const concepts=graph.nodes.filter(n=>n.type==='concept').sort((a,b)=>b.documentIds.length-a.documentIds.length);
 const selected=visible.find(d=>d.id===selectedId),concept=concepts.find(c=>c.id===selectedConceptId);
 const analyzed=visible.filter(d=>d.analysis),unread=visible.filter(d=>!d.analysis);
 const chooseDocument=d=>patch({manual:d.id,concept:''});
 const chooseNode=n=>n.type==='concept'?patch({concept:n.id,manual:''}):chooseDocument(visible.find(d=>d.id===n.documentId));
 const related=selected?.analysis?visible.filter(d=>d.id!==selected.id&&d.analysis?.concepts.some(c=>selected.analysis.concepts.some(s=>s.key===c.key))):[];
 async function analyze(targets){
  if(busy||!targets.length)return;const owner=accountId,ac=new AbortController();controller.current=ac;
  setBusy(true);setError('');setFailures(old=>Object.fromEntries(Object.entries(old).filter(([id])=>!targets.some(d=>d.id===id))));let done=0,failed=0;
  try{
   const {readManualSource}=await import('../lib/secondBrain/readManual.mjs');
   for(let i=0;i<targets.length;i++){
    if(ac.signal.aborted||scope.current!==owner)break;const doc=targets[i];
    try{
     const result=await readManualSource(doc,{signal:ac.signal,onProgress:message=>{if(scope.current===owner)setProgress(`${i+1}/${targets.length} · ${doc.title} · ${message}`);}});
     if(ac.signal.aborted||scope.current!==owner)break;setProgress(`${i+1}/${targets.length} · ${doc.title} · 개념 연결 저장 중`);
     const response=await fetch('/api/knowledge-manuals',{method:'POST',signal:ac.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({documentId:doc.id,updatedAt:doc.updatedAt,sourceKey:doc.sourceKey,...result})});
     const data=await response.json();if(!response.ok||!data.document)throw Error(data.error||'분석 결과를 저장하지 못했습니다.');
     if(scope.current!==owner)break;setSnapshot(old=>old?.accountId===owner?{...old,documents:old.documents.map(d=>d.id===doc.id?data.document:d)}:old);done++;
    }catch(e){if(ac.signal.aborted)break;failed++;if(scope.current===owner)setFailures(old=>({...old,[doc.id]:e.message}));}
   }
  }catch(e){if(scope.current===owner)setError(e.message);}
  finally{if(scope.current===owner){setBusy(false);setProgress(`${done}개 본문 연결 저장${failed?` · ${failed}개 읽기 실패`:''}${ac.signal.aborted?' · 중지됨':''}`);}controller.current=null;}
 }
 if(!accountId)return <div className={styles.gate}><h1>참조 매뉴얼 지식 그래프</h1><p>로그인하면 접근 권한이 있는 참조 매뉴얼을 연결할 수 있습니다.</p></div>;
 return <section className={styles.brain} aria-label="참조 매뉴얼 지식 그래프">
  <aside className={styles.filters}>
   <small>저장된 참조문서</small><h1>CERTIMENTO BRAIN</h1><p className={styles.company}>참조 매뉴얼의 개념 연결</p>
   <p className={styles.stats}>{ready?`${visible.length} 문서 · ${concepts.length} 개념 · ${graph.edges.length} 연결`:'참조문서 불러오는 중'}</p>
   <div className={styles.chips}><button aria-pressed={!allReferences} onClick={()=>patch({manualscope:'',manual:'',concept:''})}>매뉴얼·가이드</button><button aria-pressed={allReferences} onClick={()=>patch({manualscope:'all',manual:'',concept:''})}>모든 참조문서</button></div>
   <div className={styles.linkImport}><strong>본문에서 개념 연결</strong><p>{analyzed.length}개 분석됨 · {unread.length}개 읽기 전</p><button disabled={busy||!unread.some(d=>d.canEdit)} onClick={()=>analyze(unread.filter(d=>d.canEdit))}>미분석 문서 읽고 연결</button>{busy&&<button onClick={()=>controller.current?.abort()}><Square size={12}/> 읽기 중지</button>}<small>저장된 PDF·한글·Word 등의 본문을 읽습니다. 분석 결과와 쪽·구간 근거를 문서에 저장합니다.</small></div>
   <h2>질문과 답변</h2><p className={styles.explain}>개념을 선택해 사람들이 물을 질문과 답변을 준비합니다. 검토 후 발행한 답변은 공개 지식 페이지로 이어집니다.</p>{profile?.role==='ADMIN'&&<button className={styles.source} onClick={()=>setEditor({key:crypto.randomUUID(),draft:null})}>질문·답변 발행 관리</button>}<a className={styles.source} href="/knowledge" target="_blank" rel="noopener noreferrer">공개 지식 페이지 ↗</a><h2>핵심 개념</h2><div className={styles.chips}>{concepts.slice(0,36).map(n=><button key={n.id} aria-pressed={concept?.id===n.id} onClick={()=>chooseNode(n)}>{n.label}<span>{n.documentIds.length}</span></button>)}</div>
   <h2>연결의 기준</h2><p className={styles.explain}>문서 → 본문 개념 → 같은 개념이 나온 다른 매뉴얼로 이어집니다. 개념 사이의 선은 본문에서 함께 언급된 관계이며 공식 기준의 동등함을 의미하지 않습니다. 읽기 전 문서는 개념을 추정하지 않습니다.</p>
   <div className={styles.legend}><span>● 참조 매뉴얼</span><span>● 본문 개념</span></div>
   <h2>움직임</h2><div className={styles.chips}><button aria-pressed={rotating} onClick={()=>setRotating(!rotating)}>자동 회전</button><button onClick={()=>setResetToken(n=>n+1)}><RotateCcw size={12}/> 정면으로</button><button disabled={busy} onClick={()=>setAttempt(n=>n+1)}><RefreshCw size={12}/> 다시 불러오기</button></div>
   <small className={styles.storage}>현재 계정이 열람할 수 있는 참조문서만 표시합니다.</small>
  </aside>
  <div className={styles.space}>
   <div className={styles.searchBar}><Search size={16}/><input aria-label="매뉴얼·개념 검색" placeholder="매뉴얼 제목·본문 개념 검색" value={query} onChange={e=>patch({manualq:e.target.value})}/><button aria-label={listMode?'그래프 보기':'문서 목록 보기'} onClick={()=>patch({manualview:listMode?'':'list'})}>{listMode?<Network size={17}/>:<List size={17}/>}</button></div>
   {(error||progress)&&<div className={error?styles.error:styles.notice} role={error?'alert':'status'}>{error||progress}{error&&<button disabled={busy} onClick={()=>setAttempt(n=>n+1)}>다시 불러오기</button>}</div>}
   {!ready&&!error?<div className={styles.empty} role="status">저장된 참조 매뉴얼을 불러오고 있습니다.</div>:!visible.length?<div className={styles.empty}><FileText size={32}/><h2>조건에 맞는 참조 매뉴얼이 없습니다</h2><p>모든 참조문서를 보거나 검색어를 바꿔 주세요.</p><button onClick={()=>patch({manualscope:'all',manualq:''})}>모든 참조문서 보기</button></div>:listMode?<div className={styles.recordList}>{visible.map(d=><button key={d.id} onClick={()=>chooseDocument(d)}><small>{d.analysis?`본문 ${d.analysis.characters.toLocaleString()}자 · ${d.analysis.unitCount}구간 분석`:'본문 읽기 전'}</small><strong>{d.title}</strong><span>{d.analysis?.concepts.slice(0,6).map(c=>c.label).join(' · ')}</span>{failures[d.id]&&<p role="alert">{failures[d.id]}</p>}</button>)}</div>:<KnowledgeGraph graph={graph} selectedId={concept?.id||(selected?`document:${selected.id}`:'')} onSelect={chooseNode} rotating={rotating} resetToken={resetToken}/>}
   <div className={styles.graphFooter}>드래그로 회전 · 스크롤로 확대 · 개념을 눌러 연결 근거 확인<button onClick={()=>patch({manualview:listMode?'':'list'})}>{listMode?'그래프 보기':'문서 목록 보기'}</button></div>
  </div>
  {concept&&<aside className={styles.detail} aria-label="매뉴얼 개념 상세"><header><span>개념과 출처</span><button aria-label="개념 상세 닫기" onClick={()=>patch({concept:''})}><X size={18}/></button></header><h2>{concept.label}</h2><p className={styles.meta}>{concept.documentIds.length}개 참조문서에서 확인</p><h3>이 개념으로 답변할 질문</h3>{conceptQuestions(concept,graph).map(q=><div key={q.id} className={styles.evidence}><p>{q.question}</p>{profile?.role==='ADMIN'&&<button onClick={()=>setEditor({key:crypto.randomUUID(),draft:questionDraft(q,graph,visible)})}>근거와 함께 답변 준비</button>}</div>)}<h3>연결된 매뉴얼</h3>{concept.documentIds.map(id=>{const d=visible.find(d=>d.id===id);return d&&<button className={styles.source} key={id} onClick={()=>chooseDocument(d)}>{d.title}</button>;})}<h3>본문 근거</h3>{concept.evidence.map((e,i)=><blockquote className={styles.evidence} key={i}><small>{visible.find(d=>d.id===e.documentId)?.title} · {locationLabel(e.location)}</small><p>{e.text}</p><button onClick={()=>onOpenDocument(visible.find(d=>d.id===e.documentId))}>원문 열기</button></blockquote>)}<h3>함께 등장한 개념</h3>{graph.edges.filter(e=>e.type==='같은 문맥'&&(e.source===concept.id||e.target===concept.id)).slice(0,16).map(e=>{const n=concepts.find(n=>n.id===(e.source===concept.id?e.target:e.source));return n&&<div className={styles.evidence} key={n.id}><button onClick={()=>chooseNode(n)}>{n.label} ↗</button><p>{e.evidence[0]?.text}</p><small>{locationLabel(e.evidence[0]?.location)}</small></div>;})}</aside>}
  {selected&&!concept&&<aside className={styles.detail} aria-label="참조 매뉴얼 상세"><header><span>저장된 참조 매뉴얼</span><button aria-label="매뉴얼 상세 닫기" onClick={()=>patch({manual:''})}><X size={18}/></button></header><h2>{selected.title}</h2><button className={styles.source} onClick={()=>onOpenDocument(selected)}><FileText size={14}/> 원문 열기</button><p className={styles.meta}>{selected.analysis?`본문 ${selected.analysis.characters.toLocaleString()}자 · ${selected.analysis.unitCount}구간 · ${new Date(selected.analysis.readAt).toLocaleDateString('ko-KR')} 분석`:'본문을 아직 읽지 않았습니다.'}</p>{selected.canEdit&&<button className={styles.source} disabled={busy} onClick={()=>analyze([selected])}>{selected.analysis?'본문 다시 읽고 연결':'본문 읽고 개념 연결'}</button>}{failures[selected.id]&&<p role="alert">{failures[selected.id]}</p>}{selected.analysis&&<><h3>본문 개념</h3><div className={styles.chips}>{selected.analysis.concepts.map(c=><button key={c.key} onClick={()=>patch({concept:`concept:${conceptKey(c.label)}`,manual:''})}>{c.label}</button>)}</div><h3>같은 개념의 매뉴얼</h3>{related.map(d=><button key={d.id} className={styles.source} onClick={()=>chooseDocument(d)}>{d.title}</button>)}{selected.analysis.warnings?.map((w,i)=><p key={i} className={styles.meta}>{w}</p>)}</>}</aside>}
 {editor&&<div className={styles.editorOverlay} role="dialog" aria-modal="true" aria-label="질문 답변 편집"><button className={styles.editorClose} onClick={()=>editorDirty?setCloseWarning(true):setEditor(null)}>그래프로 돌아가기 ×</button>{closeWarning&&<div role="alert" className="m-5 rounded border border-amber-300 bg-amber-50 p-4"><p>저장하지 않은 입력이 있습니다.</p><button className="m-2 underline" onClick={()=>setCloseWarning(false)}>계속 작성</button><button className="m-2 underline" onClick={()=>{setCloseWarning(false);setEditor(null);}}>입력 버리고 닫기</button></div>}<ArticleEditor key={editor.key} initialDraft={editor.draft} knowledgeMode onDirtyChange={setEditorDirty}/></div>}
 </section>;
}
