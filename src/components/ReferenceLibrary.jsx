'use client';
import {useEffect,useMemo,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {FolderOpen,FileText,Search,Download,ArrowLeft,Plus} from 'lucide-react';
import {createReferenceDraft} from '../lib/referenceStandards.mjs';
import Button from './ui/Button';
async function readJson(response){
 if(!response.headers.get('content-type')?.includes('application/json'))throw Error('문서를 불러오지 못했습니다. 다시 시도해 주세요.');
 const data=await response.json();if(!response.ok)throw Error(data.error || '문서를 불러오지 못했습니다.');return data;
}
export default function ReferenceLibrary({currentCompany,onAddDocument,onOpenDetail}){
 const router=useRouter(),params=useSearchParams();const id=params.get('reference');
 const [documents,setDocuments]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const [query,setQuery]=useState(''),[customer,setCustomer]=useState('ALL'),[format,setFormat]=useState('ALL');
 const [content,setContent]=useState(null),[contentLoading,setContentLoading]=useState(false),[view,setView]=useState('text');
 const [headings,setHeadings]=useState(''),[confirmed,setConfirmed]=useState(false),[item,setItem]=useState(''),[draft,setDraft]=useState(null),[saving,setSaving]=useState(false);
 useEffect(()=>{const ac=new AbortController();setLoading(true);setError('');fetch('/api/reference-library',{signal:ac.signal,cache:'no-store'}).then(readJson).then(d=>setDocuments(d.documents)).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!ac.signal.aborted)setLoading(false);});return()=>ac.abort();},[retry]);
 const selected=documents.find(d=>d.id===id);
 useEffect(()=>{setDraft(null);setConfirmed(false);setContent(null);setError('');if(!id)return;const ac=new AbortController();setContentLoading(true);fetch(`/api/reference-library/${encodeURIComponent(id)}`,{signal:ac.signal,cache:'no-store'}).then(readJson).then(d=>{setContent(d);setHeadings(d.standard.headings.join('\n'));}).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!ac.signal.aborted)setContentLoading(false);});return()=>ac.abort();},[id,retry]);
 useEffect(()=>{setDraft(null);},[currentCompany?.id]);
 const customers=useMemo(()=>[...new Set(documents.map(d=>d.customer))].sort((a,b)=>a.localeCompare(b,'ko')),[documents]);
 const filtered=documents.filter(d=>(customer==='ALL'||d.customer===customer)&&(format==='ALL'||d.format===format)&&`${d.customer} ${d.title}`.toLowerCase().includes(query.trim().toLowerCase()));
 function select(d){setView(d.format==='PDF'?'original':'text');router.push(`/documents/references?reference=${d.id}`,{scroll:false});}
 async function save(){setSaving(true);setError('');try{if(draft?.companyId!==currentCompany?.id)throw Error('작성 대상 회사가 바뀌었습니다. 초안을 다시 만들어 주세요.');const saved=await onAddDocument({...draft,code:`${draft.code}-${crypto.randomUUID().slice(0,8)}`});if(!saved)throw Error('저장하지 못했습니다. 회사 선택·로그인·문서 작성 권한을 확인해 주세요.');setDraft(null);onOpenDetail(saved);}catch(e){setError(e.message);}finally{setSaving(false);}}
 return <div className="reference-library">
  <div className="platform-page-heading"><div><h1>사업계획서 참고 문서함</h1><p>고객별 원문을 확인하고, 선택한 문서의 구성 기준으로 회사별 초안을 작성하세요.</p></div><Button variant="secondary" onClick={()=>router.push('/documents')}><ArrowLeft size={16}/>ISO 문서함</Button></div>
  <div className="reference-summary"><FolderOpen size={20}/><strong>{documents.length}개 문서</strong><span>고객·프로젝트 {customers.length}개 묶음</span><span>로컬 참고자료 · 원본 보존</span></div>
  <div className="reference-filters"><label><Search size={16}/><input aria-label="참고문서 검색" placeholder="고객명·문서명 검색" value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="참고 고객 묶음" value={customer} onChange={e=>setCustomer(e.target.value)}><option value="ALL">전체 고객·프로젝트</option>{customers.map(c=><option key={c}>{c}</option>)}</select><select aria-label="참고문서 형식" value={format} onChange={e=>setFormat(e.target.value)}><option value="ALL">모든 형식</option>{['PDF','HWP','HWPX','DOC','DOCX','PPT','PPTX'].map(f=><option key={f}>{f}</option>)}</select><span>{filtered.length}개</span></div>
  {error&&<div role="alert" className="reference-error">{error}<button onClick={()=>setRetry(n=>n+1)}>다시 시도</button></div>}
  {loading?<p role="status">참고문서를 불러오는 중입니다.</p>:<div className="reference-layout"><section className="reference-files" aria-label="참고문서 목록">{filtered.map(d=><button key={d.id} className={`reference-file ${d.id===id?'is-active':''}`} onClick={()=>select(d)} aria-pressed={d.id===id}><span className="reference-format">{d.format}</span><span><small>{d.customer}</small><strong>{d.title}</strong></span><FileText size={17}/></button>)}{!filtered.length&&<p className="p-5 text-sm text-slate-500">조건에 맞는 문서가 없습니다.</p>}</section>
  <section className="reference-viewer" aria-label="참고문서 뷰어">{!selected?<div className="reference-empty"><FileText size={36}/><h2>참고할 문서를 선택하세요</h2><p>PDF 원본 보기, 전체 본문 검색, 작성 기준 확인을 할 수 있습니다.<br/>HWP·Word·PPT는 추출 본문으로 열고 원본 파일도 내려받을 수 있습니다.</p></div>:<><header><small>{selected.customer}</small><h2>{selected.title}</h2><a href={`/api/reference-library/${selected.id}?file=1&download=1`}><Download size={15}/>원본 다운로드</a></header>
   <nav className="reference-tabs" aria-label="문서 보기 방식">{selected.format==='PDF'&&<button aria-pressed={view==='original'} onClick={()=>setView('original')}>PDF 원본</button>}<button aria-pressed={view==='text'} onClick={()=>setView('text')}>전체 본문</button><button aria-pressed={view==='standard'} onClick={()=>setView('standard')}>이 문서로 작성</button></nav>
   {contentLoading?<p role="status" className="p-5">본문과 작성 기준을 불러오는 중입니다.</p>:content&&<>
    {view==='original'&&selected.format==='PDF'&&<iframe title={`${selected.title} PDF 원본`} src={`/api/reference-library/${selected.id}?file=1`} className="reference-pdf"/>}
    {view==='text'&&<div className="reference-text"><p className="reference-note">전체 구간에서 추출한 본문입니다. 표 배치와 이미지 속 숫자는 원본을 함께 확인해 주세요. 브라우저 찾기(Ctrl/Cmd+F)를 사용할 수 있습니다.</p>{content.units.map((u,i)=><section key={i}><h3>{u.location}{u.ocr?' · OCR 보완':''}</h3><pre>{u.text||'이 위치에는 추출된 텍스트가 없습니다. 원본을 확인해 주세요.'}</pre></section>)}</div>}
    {view==='standard'&&<div className="reference-standard"><h3>{content.standard.family} 작성 기준</h3><p>{content.standard.basis} · 구성 검토 필요</p><p className="reference-note">참고 회사의 본문·수치·개인정보는 초안에 복사하지 않습니다. 원문에서 뽑은 목차 후보를 확인·수정한 뒤, 작성 대상 회사에 적용하세요. 현재 신청 공고의 공식 양식이 우선입니다.</p><label>작성 대상 회사<input readOnly value={currentCompany?.id?currentCompany.name:'상단에서 회사를 선택해 주세요'}/></label><label>작성할 사업 아이템<input value={item} onChange={e=>{setItem(e.target.value);setDraft(null);}} placeholder="예: 기능성 원단 수출 사업" maxLength={150}/></label><label>작성 목차 · 한 줄에 한 항목<textarea value={headings} onChange={e=>{setHeadings(e.target.value);setConfirmed(false);setDraft(null);}} rows={12}/></label><ul>{content.standard.rules.map(r=><li key={r}>• {r}</li>)}</ul><label className="reference-confirm"><input type="checkbox" checked={confirmed} onChange={e=>{setConfirmed(e.target.checked);if(!e.target.checked)setDraft(null);}}/>원문과 목차를 확인했고 이 구성을 작성 기준으로 사용합니다.</label><Button disabled={!currentCompany?.id||!confirmed||!item.trim()} onClick={()=>{try{setDraft(createReferenceDraft({company:currentCompany,item,headings:headings.split('\n'),standard:content.standard,reference:selected}));setError('');}catch(e){setError(e.message);}}}><Plus size={16}/>회사별 작성 초안 만들기</Button>
     {draft&&<div className="reference-draft"><h3>저장 전 초안 미리보기</h3><p>확인되지 않은 내용은 입력 항목으로 남깁니다. 저장 후 문서 편집기에서 작성합니다.</p><pre>{draft.contentDraft}</pre><Button disabled={saving} onClick={save}>{saving?'저장 중…':'회사 문서함에 초안 저장'}</Button></div>}
    </div>}
   </>}
  </>}</section></div>}
 </div>;
}
