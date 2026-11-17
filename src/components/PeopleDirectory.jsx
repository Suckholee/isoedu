'use client';
import {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowUpRight,Search} from 'lucide-react';
import {filterProfiles,profilePath} from '../lib/people/model.mjs';
import styles from './PeopleDirectory.module.css';
const groups=['전체','경영 · AX · IT','세무 · 회계','행정','안전 · 노무','소개 준비 중'];
export default function PeopleDirectory({compact=false}){
 const [query,setQuery]=useState(''),[group,setGroup]=useState('전체');
 const matches=filterProfiles(query,group),profiles=compact?matches.slice(0,8):matches;
 return <section id="people" className={styles.section} aria-label="파트너스">
  <div className={styles.heading}><div>{compact?<h2>파트너스</h2>:<h1>파트너스</h1>}<p>단단 스터디의 프로필과 공개 글</p></div>{compact&&<Link href="/people" className={styles.all}>파트너스 전체 보기 <ArrowUpRight size={16}/></Link>}{!compact&&<label className={styles.search}><Search size={18}/><input type="search" aria-label="이름 또는 전문 분야 검색" value={query} onChange={e=>setQuery(e.target.value)} placeholder="이름, 소속, 전문 분야로 찾기"/></label>}</div>
  {!compact&&<div className={styles.toolbar}><div className={styles.filters} aria-label="전문 분야 필터">{groups.map(g=><button key={g} aria-pressed={g===group} onClick={()=>setGroup(g)}>{g}</button>)}</div><p className={styles.result} role="status">프로필 {matches.length}개</p></div>}
  <div className={styles.grid}>{profiles.map((p,i)=><article key={p.slug} className={styles.card}><Link href={profilePath(p)} aria-label={`${p.name} 프로필 보기`}><div className={`${styles.visual} ${styles['tone'+i%4]}`}>{p.portrait?<Image src={p.portrait} alt={`${p.name} 프로필`} fill sizes="72px"/>:<><span className={styles.initial} aria-hidden="true">{p.name.replace(/[^가-힣A-Za-z]/g,'').slice(0,2)}</span></>}</div><div className={styles.copy}><p>{p.field}</p>{compact?<h3>{p.name}</h3>:<h2>{p.name}</h2>}<span>{p.org||'단단 스터디'}</span><div className={styles.cardFooter}>브랜딩 페이지 보기 <ArrowUpRight size={14}/></div></div></Link></article>)}</div>
  {!matches.length&&<div className={styles.empty}><p>검색 결과가 없습니다.</p><button onClick={()=>{setQuery('');setGroup('전체');}}>파트너스 전체 보기</button></div>}
  <p className={styles.note}>써티멘토 공개 프로필 기준 · 소개된 분야와 소속을 표시합니다. 스터디 참여는 써티멘토 소속·공식 자격 검증·심사 배정을 뜻하지 않습니다.</p>
 </section>;
}
