'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {fallbackCards} from '../lib/articles/fallback.mjs';
import styles from './FeaturedInsights.module.css';

export default function FeaturedInsights(){
 const {profile}=useAuth(),[articles,setArticles]=useState(fallbackCards),[filter,setFilter]=useState('all'),[limit,setLimit]=useState(9),[notice,setNotice]=useState('최신 글을 불러오는 중입니다.');
 useEffect(()=>{let stopped=false,running=false,last=0;const controller=new AbortController();
  async function refresh(force=false){if(running||(!force&&Date.now()-last<60000)||document.hidden)return;running=true;last=Date.now();try{const r=await fetch('/api/public-articles',{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error();const data=await r.json();if(stopped)return;setArticles(data.articles);setNotice(!data.blog.available?'블로그 연결이 지연되어 이전에 확인한 글을 표시합니다.':!data.site.available?'홈페이지 글을 불러오지 못했습니다. 잠시 후 다시 확인합니다.':'블로그 새 글과 홈페이지에서 발행한 글을 최신순으로 보여드립니다.');}catch{if(!stopped)setNotice('최신 글 연결이 지연되고 있습니다. 표시된 글은 원문에서 읽을 수 있습니다.');}finally{running=false;}}
  const onVisible=()=>refresh(),onPublished=()=>refresh(true);refresh(true);const timer=setInterval(()=>refresh(true),300000);window.addEventListener('focus',onVisible);document.addEventListener('visibilitychange',onVisible);window.addEventListener('honestone-articles-updated',onPublished);return()=>{stopped=true;controller.abort();clearInterval(timer);window.removeEventListener('focus',onVisible);document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('honestone-articles-updated',onPublished);};
 },[]);
 const filtered=articles.filter(a=>filter==='all'||a.source===filter);
 return <section id="insights" className={styles.section} aria-labelledby="insights-title">
  <div className={styles.heading}><div><p className={styles.eyebrow}>JOURNAL / INSIGHTS</p><h2 id="insights-title">사진 너머의 이야기,<br/>글로 이어집니다.</h2></div><p className={styles.intro}>사업계획과 자금, 인증을 준비하는 분들을 위해.<br/>새로운 소식을 이곳에서 만나보세요.</p></div>
  <div className={styles.filters}><div role="group" aria-label="글 출처">{[['all','전체'],['blog','네이버 블로그'],['site','이 사이트 글']].map(([key,label])=><button key={key} aria-pressed={filter===key} onClick={()=>{setFilter(key);setLimit(9);}}>{label}</button>)}</div>{profile?.role==='ADMIN'&&<a href="/admin/articles">글 작성 · AI 발행 <ArrowUpRight size={14}/></a>}</div>
  <p className={styles.status} role="status">{notice}</p>
  <div className={styles.grid}>{filtered.slice(0,limit).map((article,index)=>{const primary=article.siteUrl||article.blogUrl,external=primary?.startsWith('https:');return <article key={article.id} className={styles.article}>
   <div className={styles.meta}><span>{article.category}{article.aiGenerated?' · AI 작성':''}</span><time dateTime={article.date}>{new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date(article.date)).replaceAll('-','.')}</time></div>
   <span className={styles.number} aria-hidden="true">{String(index+1).padStart(2,'0')}</span><h3><a href={primary} target={external?'_blank':undefined} rel={external?'noopener noreferrer':undefined}>{article.title}</a></h3>
   <div className={styles.links}>{article.siteUrl&&<a href={article.siteUrl} target={external?'_blank':undefined} rel={external?'noopener noreferrer':undefined}>{article.source==='site'?'이 사이트에서 읽기':'홈페이지에서 읽기'} <ArrowUpRight size={14}/></a>}{article.blogUrl&&<a href={article.blogUrl} target="_blank" rel="noopener noreferrer">블로그 원문 <ArrowUpRight size={14}/></a>}</div>
  </article>;})}</div>
  {!filtered.length&&<p className={styles.empty}>아직 공개된 글이 없습니다. 새 글이 발행되면 이곳에 표시됩니다.</p>}
  {filtered.length>limit&&<button className={styles.more} onClick={()=>setLimit(n=>n+9)}>글 더 보기 ({filtered.length-limit})</button>}
  <div className={styles.channelRow}><span>더 많은 이야기를 만나보세요.</span><a href="https://honestone.kr/insights" target="_blank" rel="noopener noreferrer">기존 홈페이지 글 <ArrowUpRight size={16}/></a><a href="https://blog.naver.com/honest_stone" target="_blank" rel="noopener noreferrer">네이버 블로그 전체 보기 <ArrowUpRight size={16}/></a><a href="https://honestone.kr/" target="_blank" rel="noopener noreferrer">어니스톤 공식 홈페이지 <ArrowUpRight size={16}/></a></div>
  <p className={styles.note}>블로그 공개 피드를 약 5분 간격으로 확인합니다. 네이버의 피드 반영 시간에 따라 늦게 표시될 수 있습니다. 글의 게시일과 현재 적용 기준은 원문에서 확인해 주세요.</p>
 </section>;
}
