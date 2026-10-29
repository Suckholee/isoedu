'use client';
import {useEffect,useRef,useState} from 'react';
import {supabase} from '../../lib/supabaseClient';
import {companyRpc} from '../../lib/companyProjectRepository';
import {readDocumentDates} from '../../lib/meeting/readDocumentDates.mjs';
import {pendingDateDocuments,currentDateReading,readingSource,compactReading,textDateReading} from '../../lib/meeting/documentDateBackfill.mjs';
import CloudFileViewer from '../CloudFileViewer';
import {fromDocumentRow} from '../../lib/documentModel';
import {FileText,ChevronLeft,ChevronRight,ChevronDown,RefreshCw} from 'lucide-react';
import styles from './DocumentDateInbox.module.css';
import {useAuth} from '../../context/AuthContext';
const states={review:'확인 대기',no_candidates:'날짜 후보 없음',failed:'읽기 실패',confirmed:'확인 완료'};
export default function DocumentDateInbox({companyId,clients,onOpen,onReload}){
 const {user}=useAuth();const [names,setNames]=useState([]),[docs,setDocs]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[progress,setProgress]=useState(''),[open,setOpen]=useState(false),[filter,setFilter]=useState('candidates'),[page,setPage]=useState(1),[selectedId,setSelectedId]=useState(null),[drafts,setDrafts]=useState({}),[query,setQuery]=useState('');
 const selectedRef=useRef(selectedId);selectedRef.current=selectedId;
 useEffect(()=>{if(new URL(window.location.href).searchParams.get('dateReview')==='1')setOpen(true);},[]);
 const job=useRef(null),identity=useRef('');identity.current=`${user?.id}/${companyId||'all'}`;
 async function load(){if(!supabase||!user)return;const key=identity.current;let q=supabase.from('documents').select('id,company_id,title,file_url,content_draft,metadata,updated_at').order('company_id').order('id');if(companyId)q=q.eq('company_id',companyId);const {data,error}=await q.limit(1000);if(error)throw error;if(key===identity.current){setDocs(data);const companies=await supabase.from('companies').select('id,name');if(!companies.error&&key===identity.current)setNames(companies.data);}return data;}
 useEffect(()=>{setDocs([]);setError('');load().catch(e=>setError(e.message));return()=>{job.current?.abort();};},[user?.id,companyId]);
 function put(doc){setDocs(list=>list.map(d=>d.id===doc.id?doc:d));}
 async function analyze(d,signal){
  const path=readingSource(d),format=(d.metadata?.format||path.split('.').pop()||'').toLowerCase();let candidate;
  if(path){const response=await fetch('/api/vault-file?path='+encodeURIComponent(path),{signal});if(!response.ok){
    if(d.content_draft?.trim()&&/^[a-f0-9]{64}$/.test(d.metadata?.migration?.sha256||'')){
     candidate=await textDateReading(d.content_draft,['클라우드 원본을 읽지 못해 저장된 추출 본문만 분석했습니다. 원본 이관 상태와 누락된 이미지·도형은 별도 확인이 필요합니다.']);
     candidate.textHash=candidate.sourceHash;candidate.sourceHash=d.metadata.migration.sha256;candidate.sourceUnavailable=true;
     return companyRpc('save_document_date_reading',{d_id:d.id,expected_path:path,expected_updated_at:d.updated_at,reading:compactReading(candidate)});
    }
    throw Error('원본을 읽을 권한이 없거나 파일이 없습니다.');
   }const blob=await response.blob();const file=new File([blob],`original.${format}`,{type:blob.type});
   if(d.content_draft?.trim()&&(d.metadata?.migration?.status==='complete'||['doc','xls','ppt','pptx'].includes(format))){
    candidate=await textDateReading(d.content_draft,['기존에 저장한 추출 본문을 활용했습니다. 원본 파일 해시를 대조했으며, 본문에 누락된 삽입 이미지·도형의 날짜는 원문 확인이 필요합니다.']);
    candidate.sourceHash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');
   }else candidate=await readDocumentDates(file,{signal,onProgress:p=>setProgress(`${d.title} · ${p}`)});
  }else if(d.content_draft?.trim())candidate=await textDateReading(d.content_draft,['첨부 원본 없이 문서함 저장 본문을 읽었습니다.']);
  else throw Error('분석할 원본 파일이나 저장 본문이 없습니다.');
  if(signal.aborted)throw new DOMException('취소됨','AbortError');
  return companyRpc('save_document_date_reading',{d_id:d.id,expected_path:path,expected_updated_at:d.updated_at,reading:compactReading(candidate)});
 }
 async function run(list){if(busy||!user)return;const controller=new AbortController(),key=identity.current;job.current=controller;setBusy(true);setError('');setOpen(true);let done=0,failed=0;const permissions=new Map();
  try{for(const d of list){if(controller.signal.aborted||key!==identity.current)break;setProgress(`${done+failed+1}/${list.length} · ${d.title}`);
   try{if(!permissions.has(d.company_id))permissions.set(d.company_id,await companyRpc('can_edit_company',{c_id:d.company_id}));if(!permissions.get(d.company_id)){failed++;continue;}
    const saved=await analyze(d,controller.signal);if(key===identity.current)put(saved);done++;
   }catch(e){if(controller.signal.aborted||key!==identity.current||e.name==='AbortError')break;failed++;try{const saved=await companyRpc('save_document_date_reading',{d_id:d.id,expected_path:readingSource(d),expected_updated_at:d.updated_at,reading:{status:'failed',error:e.message}});if(key===identity.current)put(saved);}catch{}if(key===identity.current)setError(e.message);}
  }if(key===identity.current){setProgress(`저장 ${done}건 · 실패/권한 없음 ${failed}건${controller.signal.aborted?' · 중지됨':''}. 저장된 후보부터 확인할 수 있습니다.`);await onReload?.();}}
  finally{if(job.current===controller){setBusy(false);job.current=null;}}
 }
 useEffect(()=>{setPage(1);},[filter,companyId,query]);
 useEffect(()=>{setSelectedId(null);setDrafts({});},[companyId,user?.id]);
 const remaining=pendingDateDocuments(docs),pending=docs.filter(d=>['review','no_candidates'].includes(currentDateReading(d)?.status));
 const companyName=d=>(clients.find(c=>c.id===d.company_id)||names.find(c=>c.id===d.company_id))?.name||'거래처';
 const matches=(d,key)=>{const r=currentDateReading(d);return key==='all'||(key==='candidates'?r?.status==='review':key==='empty'?r?.status==='no_candidates':key==='unavailable'?r?.sourceUnavailable===true:key==='failed'?r?.status==='failed':r?.status==='confirmed');};
 const tabs=[['candidates','날짜 후보'],['empty','후보 없음'],['unavailable','원본 미확인'],['confirmed','확인 완료'],...(docs.some(d=>matches(d,'failed'))?[['failed','읽기 실패']]:[]),['all','전체']];
 const visible=docs.filter(d=>matches(d,filter)&&`${d.title} ${companyName(d)}`.toLowerCase().includes(query.toLowerCase()));
 const selected=docs.find(d=>d.id===selectedId),position=visible.findIndex(d=>d.id===selectedId);
 const makeDraft=d=>{const r=currentDateReading(d),v=r?.status==='confirmed'?d.metadata?.dateFacts:r;return {stamp:d.updated_at,issue:v?.issuedOn||'',expiry:v?.validUntil||'',years:(v?.coveredYears||[]).join(', '),checked:false};};
 const draft=selected?(drafts[selected.id]?.stamp===selected.updated_at?drafts[selected.id]:makeDraft(selected)):null;
 function changeDraft(patch){if(!selected)return;setDrafts(all=>({...all,[selected.id]:{...draft,...patch}}));}
 function viewerDocument(d){const doc=fromDocumentRow(d),path=readingSource(d);return {...doc,originalPath:path,format:doc.format||path.split('.').pop()?.toUpperCase(),previewPath:doc.previewPath||(/\.(pdf|png|jpe?g)$/i.test(path)?path:null),previewFormat:doc.previewFormat||'PDF'};}
 return <section className={styles.inbox} aria-label="문서 날짜 확인함">
  <div className={styles.toolbar}><div className={styles.heading}><strong>문서 날짜 검토</strong><span className={styles.muted}>확인 대기 {pending.length}건</span></div><div className={styles.actions}>{remaining.length>0&&<button type="button" className={styles.button} disabled={busy} onClick={async()=>{try{const all=await load();run(pendingDateDocuments(all));}catch(e){setError(e.message);}}}><RefreshCw size={13}/>미분석 {remaining.length}건 읽기</button>}{busy&&<button type="button" className={styles.button} onClick={()=>job.current?.abort()}>중지</button>}<button type="button" className={styles.button} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?'접기':'후보 검토'}<ChevronDown size={14}/></button></div></div>
  {progress&&<p role="status" className={styles.message}>{progress}</p>}{error&&<p role="alert" className={`${styles.message} ${styles.error}`}>{error}</p>}
  {open&&<><div className={styles.filters}>{tabs.map(([key,name])=><button key={key} type="button" className={`${styles.tab} ${key===filter?styles.active:''}`} aria-pressed={key===filter} onClick={()=>setFilter(key)}>{name}<span className={styles.count}>{docs.filter(d=>matches(d,key)).length}</span></button>)}</div>
  <div className={styles.toolbar}><span className={styles.muted}>문서를 선택하면 원문과 후보를 함께 확인합니다.</span><input aria-label="검토 문서 검색" placeholder="거래처·문서 검색" value={query} onChange={e=>setQuery(e.target.value)} style={{border:'1px solid #dfe6ef',borderRadius:6,padding:'6px 9px',fontSize:12,width:200}}/></div>
  <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th className={styles.docCell}>문서 / 거래처</th><th className={styles.dateCell}>발급일 후보</th><th className={styles.dateCell}>유효기한 후보</th><th className={styles.yearCell}>자료 연도</th><th className={styles.statusCell}>상태</th><th style={{width:64}}/></tr></thead><tbody>{visible.slice((page-1)*20,page*20).map(d=>{const r=currentDateReading(d),v=r?.status==='confirmed'?d.metadata?.dateFacts:r;return <tr key={d.id}><td><button type="button" className={styles.rowButton} onClick={()=>setSelectedId(d.id)} aria-label={`${d.title} 검토`}><FileText size={18} className={styles.fileIcon}/><span className={styles.docText}><span className={styles.docTitle} title={d.title}>{d.title}</span><span className={styles.client}>{companyName(d)}</span></span></button></td><td className={!v?.issuedOn?styles.muted:''}>{v?.issuedOn||'—'}</td><td className={!v?.validUntil?styles.muted:''}>{v?.validUntil||'—'}</td><td>{v?.coveredYears?.length?v.coveredYears.join(', '):<span className={styles.muted}>—</span>}</td><td><span className={`${styles.pill} ${r?.sourceUnavailable?styles.warning:r?.status==='confirmed'?styles.done:r?.status==='review'?'':styles.neutral}`}>{r?.sourceUnavailable?'원본 미확인':states[r?.status]||'미분석'}</span></td><td><button type="button" className={styles.reviewLink} onClick={()=>setSelectedId(d.id)}>검토 →</button></td></tr>;})}</tbody></table>{!visible.length&&<p className={styles.empty}>해당하는 문서가 없습니다.</p>}</div>
  <footer className={styles.footer}><span>확인 전에는 확정값과 인증 만료일이 바뀌지 않습니다.</span><div className={styles.pagination}><span>{visible.length}건</span><button type="button" aria-label="이전 목록" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={15}/></button><span>{page} / {Math.max(1,Math.ceil(visible.length/20))}</span><button type="button" aria-label="다음 목록" disabled={page*20>=visible.length} onClick={()=>setPage(p=>p+1)}><ChevronRight size={15}/></button></div></footer></>}
  {selected&&<CloudFileViewer document={viewerDocument(selected)} onClose={()=>setSelectedId(null)} reviewNavigation={<div className={styles.nav}><button type="button" aria-label="이전 문서 검토" disabled={position<=0} onClick={()=>setSelectedId(visible[position-1].id)}>‹</button><span>{position+1} / {visible.length}</span><button type="button" aria-label="다음 문서 검토" disabled={position<0||position>=visible.length-1} onClick={()=>setSelectedId(visible[position+1].id)}>›</button></div>} reviewPanel={<DateReviewForm key={selected.id} doc={selected} client={companyName(selected)} draft={draft} onChange={changeDraft} busy={busy} onRead={()=>run([selected])} onSaved={async saved=>{const next=visible[position+1]||visible[position-1];put(saved);setDrafts(all=>{const copy={...all};delete copy[saved.id];return copy;});if(selectedRef.current===saved.id)setSelectedId(next?.id||null);await onReload?.();}}/>}/>}
 </section>;
}
function DateReviewForm({doc:d,client,draft,onChange,busy,onRead,onSaved}){
 const r=currentDateReading(d),[saving,setSaving]=useState(false),[error,setError]=useState(''),[showEvidence,setShowEvidence]=useState(false);
 async function save(){setSaving(true);setError('');try{const years=draft.years.trim()?draft.years.split(',').map(x=>Number(x.trim())):[];if(years.some(y=>!Number.isInteger(y))||new Set(years).size!==years.length)throw Error('자료 연도를 확인해 주세요.');const saved=await companyRpc('confirm_document_date_reading',{d_id:d.id,reading_id:r.id,expected_updated_at:d.updated_at,issue_date:draft.issue||null,expiry_date:draft.expiry||null,years,checked:draft.checked});await onSaved(saved);}catch(e){setError(e.message);}finally{setSaving(false);}}
 const locked=saving||r?.status==='confirmed';
 return <div className={styles.form}><div className={styles.formContent}><h3>날짜 검토</h3><p className={styles.muted}>{client}</p><p className={styles.sectionLabel}>자동으로 읽은 후보 · 원문과 대조해 주세요</p>
 {r&&r.status!=='failed'?<><label className={styles.field}>발급일<input type="date" value={draft.issue} disabled={locked} onChange={e=>onChange({issue:e.target.value,checked:false})}/></label><label className={styles.field}>유효기한<input type="date" value={draft.expiry} disabled={locked} onChange={e=>onChange({expiry:e.target.value,checked:false})}/></label><label className={styles.field}>자료 연도<input placeholder="예: 2023, 2024, 2025" value={draft.years} disabled={locked} onChange={e=>onChange({years:e.target.value,checked:false})}/></label>
 {r.status==='no_candidates'&&<p className={styles.notice}>명확한 후보를 찾지 못했습니다. 원문에 날짜가 있으면 입력하고, 없으면 빈칸으로 확인해 주세요.</p>}{r.sourceUnavailable&&<p className={styles.notice}>원본이 이관되지 않아 저장된 본문만 읽었습니다. 원본 파일과 별도로 대조해 주세요.</p>}{r.conflicts?.map((v,i)=><p className={styles.notice} key={i}>{v}</p>)}
 <details className={styles.evidence} onToggle={e=>setShowEvidence(e.currentTarget.open)}><summary>읽은 근거 확인</summary>{showEvidence&&Object.entries(r.evidence||{}).map(([field,list])=><div key={field}><strong>{{issuedOn:'발급일',validUntil:'유효기한',coveredYears:'자료 연도'}[field]}</strong>{Array.isArray(list)&&list.filter(e=>e&&typeof e==='object').map((e,i)=><p key={i}><button type="button" disabled={locked} onClick={()=>onChange({...(field==='issuedOn'?{issue:e.value}:field==='validUntil'?{expiry:e.value}:{years:[...new Set([...draft.years.split(',').map(y=>y.trim()).filter(Boolean),String(e.value)])].sort().join(', ')}),checked:false})}>{e.value} 입력</button> · {e.location}<br/>{e.excerpt}</p>)}</div>)}</details>
 {r.warnings?.length>0&&<details className={styles.evidence}><summary>자동 읽기 참고사항</summary>{r.warnings.map((w,i)=><p key={i}>{w}</p>)}</details>}</>:<p className={styles.notice}>{r?.error||'아직 분석하지 않은 문서입니다.'}</p>}
 <button type="button" className={styles.button} disabled={busy||saving} onClick={onRead}><RefreshCw size={13}/>다시 읽기</button>{error&&<p role="alert" className={styles.notice}>{error}</p>}</div>
 <div className={styles.formFooter}>{r&&r.status!=='failed'&&r.status!=='confirmed'?<><label className={styles.check}><input type="checkbox" checked={draft.checked} onChange={e=>onChange({checked:e.target.checked})}/>원문과 입력값을 대조했습니다.</label><button type="button" className={styles.primary} disabled={!draft.checked||saving} onClick={save}>{saving?'저장 중…':'확인 저장 · 다음 문서'}</button></>:<span className={styles.muted}>{r?.status==='confirmed'?'확인이 완료된 문서입니다.':'다시 읽은 후 확인할 수 있습니다.'}</span>}</div></div>;
}
