import {ArrowUpRight} from 'lucide-react';
import styles from './FeaturedInsights.module.css';

// Titles, publication dates and both URLs checked against honestone.kr on 2026-11-12.
const articles = [
 {id:'224473222331',date:'2026-11-11',category:'ISO 준비',title:"거래처 요구를 받은 날 먼저 정할 '3가지'"},
 {id:'224470038591',date:'2026-11-09',category:'ISO 이해',title:'인증서가 있어도 불량이 나올 수 있는 이유'},
 {id:'224447142360',date:'2026-10-20',category:'준비와 심사',title:"컨설팅해 준 회사를 2년간 심사할 수 없는 '이유'"},
 {id:'224425309366',date:'2026-09-28',category:'사업계획·정책자금',title:'신청서에 v3가 붙기까지'},
 {id:'224360668675',date:'2026-07-28',category:'기업인증',title:'창업 3년 안에 짚어야 할 세제 정리'},
 {id:'224359633624',date:'2026-07-27',category:'정책자금',title:'운전자금과 시설자금 두 갈래로 정리'},
];

export default function FeaturedInsights(){
 return <section id="insights" className={styles.section} aria-labelledby="insights-title">
  <div className={styles.heading}>
   <div><p className={styles.eyebrow}>JOURNAL / INSIGHTS</p><h2 id="insights-title">사진 너머의 이야기,<br/>글로 이어집니다.</h2></div>
   <p className={styles.intro}>사업계획과 자금, 인증을 준비하는 분들을 위해.<br/>어니스톤의 홈페이지와 블로그에서 더 읽어보세요.</p>
  </div>
  <div className={styles.grid}>{articles.map((article,index)=><article key={article.id} className={styles.article}>
   <div className={styles.meta}><span>{article.category}</span><time dateTime={article.date}>{article.date.replaceAll('-','.')}</time></div>
   <span className={styles.number} aria-hidden="true">{String(index+1).padStart(2,'0')}</span>
   <h3><a href={`https://honestone.kr/insights/${article.id}`} target="_blank" rel="noopener noreferrer" aria-label={`${article.title} — 홈페이지에서 읽기 (새 창)`}>{article.title}</a></h3>
   <div className={styles.links}><a href={`https://honestone.kr/insights/${article.id}`} target="_blank" rel="noopener noreferrer" aria-label={`${article.title} — 홈페이지에서 읽기 (새 창)`}>홈페이지에서 읽기 <ArrowUpRight size={14}/></a><a href={`https://blog.naver.com/honest_stone/${article.id}`} target="_blank" rel="noopener noreferrer" aria-label={`${article.title} — 블로그 원문 (새 창)`}>블로그 원문 <ArrowUpRight size={14}/></a></div>
  </article>)}</div>
  <div className={styles.channelRow}><span>더 많은 이야기를 만나보세요.</span><a href="https://honestone.kr/insights" target="_blank" rel="noopener noreferrer">홈페이지 글 전체 보기 <ArrowUpRight size={16}/></a><a href="https://blog.naver.com/honest_stone" target="_blank" rel="noopener noreferrer">네이버 블로그 전체 보기 <ArrowUpRight size={16}/></a><a href="https://honestone.kr/" target="_blank" rel="noopener noreferrer">어니스톤 공식 홈페이지 <ArrowUpRight size={16}/></a></div>
  <p className={styles.note}>2026.11.12 확인한 글을 선별했습니다. 글의 게시일과 현재 적용 기준은 원문에서 확인해 주세요.</p>
 </section>;
}
