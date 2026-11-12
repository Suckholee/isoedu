'use client';
import {useEffect,useState} from 'react';
import styles from './VenturePatentSearch.module.css';
const labels={keyword:'기술 키워드',applicant:'출원인',application:'출원번호',rightholder:'등록권자'};
export default function VenturePatentSearch({row,canEdit,busy,api,onApply}){
 const [mode,setMode]=useState('applicant'),[query,setQuery]=useState(row.metadata.ai.companyName||''),[configured,setConfigured]=useState(null),[result,setResult]=useState(null),[selected,setSelected]=useState([]),[searching,setSearching]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;api({action:'patent-status'}).then(r=>{if(active)setConfigured(r.configured);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[row.id]);
 async function search(page=1){if(searching||busy)return;setSearching(true);setError('');try{const result=await api({action:'search-patents',documentId:row.id,mode,query,page});setResult(result);setSelected([]);setConfigured(true);}catch(e){setError(e.message);setResult(null);setSelected([]);}finally{setSearching(false);}}
 const canPage=result&&result.mode===mode&&result.query===query.trim();
 return <section className={styles.panel} aria-label="KIPRIS 특허 자료">
  <form className={styles.search} onSubmit={e=>{e.preventDefault();search();}}><div><label>검색 구분<select aria-label="특허 검색 구분" value={mode} disabled={searching} onChange={e=>{setMode(e.target.value);setSelected([]);}}>{Object.entries(labels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label className={styles.query}>검색어<input aria-label="특허 검색어" maxLength={150} value={query} disabled={searching} onChange={e=>{setQuery(e.target.value);setSelected([]);}} placeholder={mode==='application'?'예: 출원번호 13자리':'회사명 또는 기술 키워드'}/></label></div><button type="submit" disabled={!canEdit||!!busy||searching||!query.trim()}>{searching?'KIPRIS 조회 중…':'특허 검색'}</button><p>공개 조회 결과를 참고자료로 연결합니다. 현재 권리자와 회사 보유 여부는 원부로 확인해 주세요.</p></form>
  <div className={styles.results}>
   {configured===false&&<p role="status">KIPRIS 키 설정 대기 중입니다. 키와 이용 상품을 확인하면 실제 검색을 사용할 수 있습니다.</p>}
   {error&&<p role="alert" className={styles.error}>{error}</p>}
   {result&&<p className={styles.count}>‘{result.query}’ · 전체 {result.total.toLocaleString('ko-KR')}건 · {result.page}페이지 · {new Date(result.queriedAt).toLocaleString('ko-KR')}</p>}
   {result?.total===0&&<p>검색 결과가 없습니다. 다른 검색어·출원인 표기로 다시 검색해 주세요.</p>}
   {result?.patents.map(p=><article key={p.applicationNumber}><label><input type="checkbox" aria-label={`${p.title} 참고자료 선택`} checked={selected.includes(p.applicationNumber)} disabled={!canEdit||!!busy||searching} onChange={e=>setSelected(old=>e.target.checked?[...old,p.applicationNumber]:old.filter(n=>n!==p.applicationNumber))}/><strong>{p.title}</strong></label><dl><dt>출원번호</dt><dd>{p.applicationNumber}</dd><dt>출원인</dt><dd>{p.applicantName||'확인 필요'}</dd><dt>출원일</dt><dd>{p.applicationDate||'확인 필요'}</dd><dt>조회 상태</dt><dd>{p.registerStatus||'확인 필요'}</dd><dt>등록번호</dt><dd>{p.registerNumber||'확인 필요'}</dd></dl>{p.abstract&&<details><summary>초록 확인</summary><p>{p.abstract}</p></details>}</article>)}
   {result&&result.total>10&&<div className={styles.pages}><button disabled={!canPage||result.page<=1||searching} onClick={()=>search(result.page-1)}>이전</button><button disabled={!canPage||result.page*10>=result.total||result.page>=100||searching} onClick={()=>search(result.page+1)}>다음</button></div>}
  </div>
  <footer><button disabled={!canEdit||!!busy||searching||!selected.length} onClick={()=>onApply(result,selected)}>선택 {selected.length}건 문서에 반영</button><small>기존 내용을 보존해 참고자료 칸에 추가합니다. 확인 후 수정본을 저장해 주세요.</small><a href="https://plus.kipris.or.kr/portal/main.do" target="_blank" rel="noreferrer">KIPRIS Plus 열기 ↗</a></footer>
 </section>;
}
