'use client';
import {useEffect,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {useAuth} from '../context/AuthContext';
import {PROFILES,getProfile,profilePath} from '../lib/people/model.mjs';
import {brandingDefaults,brandingInput,publishedBranding} from '../lib/people/branding.mjs';
import {PartnerBrandPage} from './PartnerBrandPage';
import styles from './PartnerBrandEditor.module.css';
const initial=slug=>({slug,revision:0,content:brandingDefaults(slug),published_at:null});
export default function PartnerBrandEditor(){
 const {profile}=useAuth(),params=useSearchParams(),admin=profile?.role==='ADMIN';
 const [draft,setDraft]=useState(()=>initial(getProfile(params.get('partner'))?.slug||PROFILES[0].slug));
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false),[reviewed,setReviewed]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[preview,setPreview]=useState(false),[instagramConfigured,setInstagramConfigured]=useState(false),[pendingSlug,setPendingSlug]=useState(null);
 useEffect(()=>{if(!admin){setLoading(false);return;}const abort=new AbortController();setLoading(true);
  fetch('/api/admin-partners',{cache:'no-store',signal:abort.signal}).then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error);setRows(data.profiles);setDraft(d=>data.profiles.find(p=>p.slug===d.slug)||d);}).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});return()=>abort.abort();
 },[admin]);
 useEffect(()=>{if(!admin)return;const abort=new AbortController();setInstagramConfigured(false);
  fetch('/api/admin-partners',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'connection',slug:draft.slug,revision:draft.revision}),signal:abort.signal}).then(r=>r.json()).then(d=>setInstagramConfigured(Boolean(d.instagramConfigured))).catch(()=>{});return()=>abort.abort();
 },[admin,draft.slug]);
 useEffect(()=>{if(!dirty)return;const guard=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[dirty]);
 function patch(update){setDraft(d=>({...d,content:{...d.content,...update}}));setDirty(true);setReviewed(false);setMessage('');}
 function openPartner(slug){setDraft(rows.find(r=>r.slug===slug)||initial(slug));setDirty(false);setReviewed(false);setMessage('');setPendingSlug(null);}
 function pick(slug){if(dirty){setPendingSlug(slug);return;}openPartner(slug);}
 function itemChange(key,index,update){patch({[key]:draft.content[key].map((item,i)=>i===index?{...item,...update}:item)});}
 function add(key){patch({[key]:[...draft.content[key],{id:crypto.randomUUID(),isPublic:false,url:'',...(key==='clients'?{name:'',summary:''}:{title:'',client:'',period:'',role:'',description:''})}]});}
 async function act(action){setError('');setMessage('');setBusy(true);
  try{const content=brandingInput(draft.content);if(action==='publish'&&(!reviewed||dirty))throw Error('최신 초안을 저장하고 공개 내용을 확인해 주세요.');
   const response=await fetch('/api/admin-partners',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,slug:draft.slug,revision:draft.revision,content,reviewed})}),data=await response.json();if(!response.ok)throw Error(data.error);
   setDraft(data.profile);setRows(r=>[data.profile,...r.filter(x=>x.slug!==data.profile.slug)]);setDirty(false);setReviewed(false);setMessage(action==='save'?'초안을 저장했습니다. 공개 페이지는 발행 후 바뀝니다.':action==='publish'?'개인 브랜딩 페이지에 반영했습니다.':'추가 소개를 비공개로 전환했습니다. 기존 공개 프로필 소개는 유지됩니다.');
  }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 if(!admin)return <p className="p-4 text-sm text-slate-600">관리자 계정으로 로그인하면 파트너스 페이지를 수정할 수 있습니다.</p>;
 const b=draft.content,p=getProfile(draft.slug),disabled=busy||loading;
 let publicPreview;try{publicPreview=publishedBranding(b);}catch{}
 return <section className={styles.editor}>
  <header className={styles.toolbar}><h2>파트너스 브랜딩</h2><select aria-label="편집할 파트너" disabled={disabled} value={draft.slug} onChange={e=>pick(e.target.value)}>{PROFILES.map(p=><option key={p.slug} value={p.slug}>{p.name} · {p.field}</option>)}</select><span className={styles.status}>{loading?'불러오는 중':dirty?'미저장 변경':draft.published_at?'추가 소개 공개 중':draft.revision?'비공개 초안':'기존 공개 소개'}</span><button disabled={disabled} onClick={()=>act('save')}>초안 저장</button><button aria-pressed={preview} onClick={()=>setPreview(v=>!v)}>공개 미리보기</button><a href={profilePath(p)} target="_blank" rel="noopener noreferrer">개인 페이지 ↗</a></header>
  {pendingSlug&&<div className={styles.error} role="alert"><p>저장하지 않은 변경이 있습니다. 다른 파트너를 열면 현재 변경은 사라집니다.</p><div className={styles.toolbar}><button onClick={()=>setPendingSlug(null)}>계속 편집</button><button onClick={()=>openPartner(pendingSlug)}>변경 버리고 이동</button></div></div>}
  {error&&<p className={styles.error} role="alert">{error}</p>}{message&&<p className={styles.message} role="status">{message}</p>}
  <div className={preview?styles.withPreview:styles.formOnly}><fieldset disabled={disabled} className={styles.form}>
   <section><h3>소개 프로필</h3><label>한 줄 소개<input maxLength={160} value={b.headline} onChange={e=>patch({headline:e.target.value})}/></label><label>나를 소개하는 글<textarea rows={4} maxLength={5000} value={b.about} onChange={e=>patch({about:e.target.value})}/></label><label>전문 분야 · 함께할 수 있는 일<input value={b.services.join(',')} onChange={e=>patch({services:e.target.value.split(',')})} placeholder="쉼표로 구분해 주세요"/></label></section>
   <section><h3>SNS · 채널 연결</h3>{[['website','웹사이트'],['instagram','인스타그램 주소'],['youtube','유튜브 채널 주소']].map(([key,label])=><label key={key}>{label}<input type="url" maxLength={1000} value={b.links[key]} onChange={e=>patch({links:{...b.links,[key]:e.target.value}})} placeholder="https://"/></label>)}<label>유튜브 채널 ID<input maxLength={24} value={b.youtubeChannelId} onChange={e=>patch({youtubeChannelId:e.target.value})} placeholder="UC로 시작하는 채널 ID"/></label><p className={styles.help}>채널 주소와 ID를 공개하면 페이지 방문 시 최신 공개 영상을 자동 확인합니다. 한 번 확인한 콘텐츠는 최대 15분간 재사용합니다. @주소를 쓰는 채널도 ID를 입력해 주세요.</p><p className={styles.help}>{instagramConfigured?'인스타그램 계정 연결이 설정되어 있습니다. 등록 주소와 연결 계정이 일치할 때 공개 게시물을 가져옵니다.':'인스타그램 주소는 바로 연결할 수 있습니다. 게시물 자동 수집은 해당 비즈니스·크리에이터 계정의 연결 승인이 필요합니다.'}</p></section>
   <section><div className={styles.sectionTitle}><h3>함께한 고객사</h3><button type="button" disabled={b.clients.length>=24} onClick={()=>add('clients')}>고객사 추가</button></div><p className={styles.help}>공개할 고객사만 직접 등록하세요. 업무 공간의 거래처 정보는 자동으로 가져오지 않습니다.</p>{b.clients.map((c,i)=><div className={styles.item} key={c.id}><div className={styles.row}><label>고객사 이름<input value={c.name} maxLength={100} onChange={e=>itemChange('clients',i,{name:e.target.value})}/></label><label>관련 링크<input type="url" value={c.url} maxLength={1000} onChange={e=>itemChange('clients',i,{url:e.target.value})}/></label></div><label>함께한 내용<input value={c.summary} maxLength={300} onChange={e=>itemChange('clients',i,{summary:e.target.value})}/></label><ItemActions item={c} onPublic={v=>itemChange('clients',i,{isPublic:v})} onRemove={()=>patch({clients:b.clients.filter((_,n)=>n!==i)})}/></div>)}</section>
   <section><div className={styles.sectionTitle}><h3>작업 이력</h3><button type="button" disabled={b.work.length>=24} onClick={()=>add('work')}>작업 이력 추가</button></div>{b.work.map((w,i)=><div className={styles.item} key={w.id}><label>작업 제목<input value={w.title} maxLength={160} onChange={e=>itemChange('work',i,{title:e.target.value})}/></label><div className={styles.row}>{[['client','고객사',100],['period','기간',80],['role','담당 역할',100],['url','결과물 링크',1000]].map(([key,label,max])=><label key={key}>{label}<input type={key==='url'?'url':'text'} maxLength={max} value={w[key]} onChange={e=>itemChange('work',i,{[key]:e.target.value})}/></label>)}</div><label>수행 내용·성과<textarea rows={3} maxLength={2000} value={w.description} onChange={e=>itemChange('work',i,{description:e.target.value})}/></label><ItemActions item={w} onPublic={v=>itemChange('work',i,{isPublic:v})} onRemove={()=>patch({work:b.work.filter((_,n)=>n!==i)})}/></div>)}</section>
   <section><h3>확인 후 공개</h3><label>소개·고객사·작업 이력의 공개 확인 근거 (비공개)<textarea rows={2} maxLength={2000} value={b.publicationNote} onChange={e=>patch({publicationNote:e.target.value})} placeholder="본인 확인과 고객사·작업 내용의 공개 승인 근거를 남겨 주세요."/></label><label className={styles.check}><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>공개할 소개·채널·고객사·작업 이력을 확인했습니다.</label><div className={styles.row}><button disabled={disabled} onClick={()=>act('save')}>초안 저장</button><button className={styles.primary} disabled={disabled||dirty||!draft.revision||!reviewed} onClick={()=>act('publish')}>개인 페이지에 공개</button>{draft.published_at&&<button disabled={disabled||dirty} onClick={()=>act('withdraw')}>추가 소개 비공개</button>}</div></section>
  </fieldset>{preview&&<aside className={styles.preview}><strong>공개 미리보기 · 저장 전</strong>{publicPreview?<PartnerBrandPage profile={p} branding={publicPreview} preview/>:<p className={styles.help}>항목 이름과 주소를 입력하면 공개될 내용을 미리 볼 수 있습니다.</p>}</aside>}</div>
 </section>;
}
function ItemActions({item,onPublic,onRemove}){return <div className={styles.itemActions}><label className={styles.check}><input type="checkbox" checked={item.isPublic} onChange={e=>onPublic(e.target.checked)}/>개인 페이지에 공개</label><button type="button" onClick={onRemove}>항목 제거</button></div>;}
