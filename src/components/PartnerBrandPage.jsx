import Link from 'next/link';
import {ArrowUpRight,Instagram,Youtube,Globe,BriefcaseBusiness,Building2} from 'lucide-react';
import styles from './PartnerBrandPage.module.css';
const channelNames={website:'웹사이트',instagram:'Instagram',youtube:'YouTube'};
const channelIcons={website:Globe,instagram:Instagram,youtube:Youtube};
export function PartnerBrandPage({profile,branding,children,preview=false}){
 const p=profile,b=branding;
 return <article className={styles.page}>
  {!preview&&<nav className={styles.breadcrumb} aria-label="현재 위치"><Link href="/people">파트너스</Link><span>/</span><span>{p.name}</span></nav>}
  <header className={styles.hero}>
   <div className={styles.identity}>{p.portrait?<img className={styles.portrait} src={p.portrait} alt={`${p.name} 프로필`}/>:<span className={styles.initial} aria-hidden="true">{p.name.slice(0,2)}</span>}<div><p className={styles.affiliation}>{p.org||p.field}</p><h1>{p.name}</h1><p className={styles.headline}>{b.headline||p.field}</p></div></div>
   <div className={styles.channels} aria-label="공식 채널">{Object.entries(b.links).filter(([,url])=>url).map(([key,url])=>{const Icon=channelIcons[key];return <a key={key} href={url} target="_blank" rel="noopener noreferrer"><Icon size={16}/>{channelNames[key]}<ArrowUpRight size={14}/></a>;})}</div>
  </header>
  <nav className={styles.sectionNav} aria-label="프로필 섹션"><a href="#partner-about">소개</a><a href="#partner-work">작업 이력</a><a href="#partner-clients">고객사</a><a href="#partner-content">글·콘텐츠</a></nav>
  <div className={styles.aboutGrid}><section id="partner-about" className={styles.section}><h2>소개</h2><p className={styles.bio}>{b.about||p.bio}</p></section><section className={styles.section}><h2>함께할 수 있는 일</h2><ul className={styles.services}>{b.services.map(s=><li key={s}>{s}</li>)}</ul>{!b.services.length&&<p className={styles.empty}>전문 분야를 소개할 예정입니다.</p>}</section></div>
  <div className={styles.portfolioGrid}>
   <section id="partner-work" className={styles.section}><h2><BriefcaseBusiness size={18}/>작업 이력 {b.work.length>0&&<small>{b.work.length}</small>}</h2>{b.work.length?<ol className={styles.timeline}>{b.work.map(w=><li key={w.id}><div className={styles.workTitle}><h3>{w.title}</h3>{w.period&&<span>{w.period}</span>}</div>{(w.client||w.role)&&<p className={styles.meta}>{[w.client,w.role].filter(Boolean).join(' · ')}</p>}{w.description&&<p className={styles.bio}>{w.description}</p>}{w.url&&<a className={styles.textLink} href={w.url} target="_blank" rel="noopener noreferrer">작업 자세히 보기 <ArrowUpRight size={14}/></a>}</li>)}</ol>:<p className={styles.empty}>공개된 작업 이력이 아직 없습니다.</p>}</section>
   <section id="partner-clients" className={styles.section}><h2><Building2 size={18}/>함께한 고객사 {b.clients.length>0&&<small>{b.clients.length}</small>}</h2>{b.clients.length?<ul className={styles.clients}>{b.clients.map(c=><li key={c.id}><h3>{c.url?<a href={c.url} target="_blank" rel="noopener noreferrer">{c.name} ↗</a>:c.name}</h3>{c.summary&&<p>{c.summary}</p>}</li>)}</ul>:<p className={styles.empty}>공개된 고객사 소개가 아직 없습니다.</p>}</section>
  </div>
  <section id="partner-content" className={styles.contentSection}><h2>글·콘텐츠</h2>{children||<p className={styles.empty}>작성·검토한 글과 연결한 채널의 콘텐츠가 표시됩니다.</p>}</section>
  {!preview&&<details className={styles.source}><summary>소개 출처와 공개 기준</summary><p>{p.source} · <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">써티멘토 원본 프로필 ↗</a></p>{p.portraitNote&&<p>사진: {p.portraitNote}</p>}<p>고객사와 이력은 공개로 지정한 항목만 표시합니다. 스터디 참여는 써티멘토 소속이나 공식 심사·발급 권한을 뜻하지 않습니다. 작성·검토는 확인된 참여 내역을 기준으로 표시합니다.</p></details>}
 </article>;
}
export function PartnerPosts({groups,available}){
 const sections=[['작성한 글',groups.authored],['검토한 글',groups.reviewed],['원문을 제공한 글',groups.sourced]];
 return <div className={styles.articleSection}>{!available&&<p role="status" className={styles.notice}>써티멘토의 작성·검토 글 연결을 확인하지 못했습니다. 외부 원문은 아래에서 볼 수 있습니다.</p>}{sections.map(([title,posts])=>posts.length>0?<section key={title}><h3 className={styles.subheading}>{title} <small>{posts.length}</small></h3><div className={styles.articleGrid}>{posts.map(p=><a key={p.id} href={p.url} className={styles.post}><small>{p.sourceLabel} · {p.category}</small><h4>{p.title} ↗</h4><p>{p.reviewed_on?`검토 ${p.reviewed_on}`:p.sourceDate?.slice(0,10)}</p>{p.attributionLabel&&<p>{p.attributionLabel}</p>}</a>)}</div></section>:null)}{available&&!sections.some(([,p])=>p.length)&&<p className={styles.empty}>아직 연결된 공개 글이 없습니다.</p>}</div>;
}
export function PartnerSocialCards({feeds,links}){
 return <div className={styles.social}>{feeds.map(feed=><section key={feed.provider}><div className={styles.socialHeading}><h3>{channelNames[feed.provider]}</h3><a className={styles.textLink} href={links[feed.provider]} target="_blank" rel="noopener noreferrer">채널에서 보기 <ArrowUpRight size={14}/></a></div>{feed.items.length?<div className={styles.mediaGrid}>{feed.items.map(item=><a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className={styles.mediaCard}>{item.image&&<img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer"/>}<div><h4>{item.title}</h4><time dateTime={item.date}>{item.date.slice(0,10)}</time></div></a>)}</div>:<p className={styles.empty}>{feed.status==='unavailable'?'최근 콘텐츠를 불러오지 못했습니다. 채널에서 확인해 주세요.':feed.status==='connected'?'채널에 공개된 최신 콘텐츠가 없습니다.':'채널에서 공개 콘텐츠를 만나보세요.'}</p>}</section>)}</div>;
}
