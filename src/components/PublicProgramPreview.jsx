'use client';
import Link from 'next/link';
import {ArrowUpRight,CalendarDays} from 'lucide-react';
import {usePublicPrograms} from '../hooks/usePublicPrograms';
import {programPeriod} from '../lib/programCalendar.mjs';
import styles from './PublicPrograms.module.css';
export default function PublicProgramPreview(){
 const feed=usePublicPrograms(),today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
 const upcoming=feed.programs.filter(p=>programPeriod(p).end>=today).sort((a,b)=>programPeriod(a).end.localeCompare(programPeriod(b).end)).slice(0,3);
 return <section data-landing-program-preview className={styles.homePreview} aria-labelledby="program-preview-title"><div className={styles.previewHeading}><div><p>OPEN CALENDAR / 누구나 열람</p><h2 id="program-preview-title">다음 지원사업,<br/>일정부터 확인하세요.</h2></div><Link href="/programs">캘린더 전체 보기 <ArrowUpRight size={17}/></Link></div><div className={styles.previewCards}>{feed.loading?<p role="status">저장된 공고를 확인하고 있습니다.</p>:feed.error?<p role="alert">{feed.error}<button onClick={feed.reload}>다시 불러오기</button></p>:upcoming.length?upcoming.map(p=><Link href={'/programs?program='+encodeURIComponent(p.id)} key={p.id}><span><CalendarDays size={16}/>마감 {programPeriod(p).end}</span><h3>{p.title}</h3><p>{p.agency||p.ministry||p.sourceName}</p><small>지원 조건 확인 <ArrowUpRight size={13}/></small></Link>):<div className={styles.previewEmpty}>현재 저장된 자료에서 마감 예정 공고가 확인되지 않습니다. 캘린더에서 지난 공고와 일정 미확인 사업도 살펴보세요.</div>}</div><p className={styles.previewNote}>{feed.coverage||'기존 공식 공고 수집본을 활용합니다.'} 모집 일정과 신청 조건은 공식 원문을 확인해 주세요.</p></section>;
}
