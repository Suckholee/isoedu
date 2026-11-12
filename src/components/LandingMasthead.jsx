'use client';

import Image from 'next/image';
import Link from 'next/link';
import {ArrowDown, ArrowUpRight} from 'lucide-react';
import styles from './LandingMasthead.module.css';

export default function LandingMasthead({user, onLogin, onStart}) {
  return <div className={styles.masthead}>
    <a className={styles.skipLink} href="#start">우리 회사 준비 시작으로 건너뛰기</a>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="어니스톤 홈">
        <span>Honestone<span className={styles.brandPeriod}>.</span></span>
        <small>어니스톤</small>
      </Link>
      <nav className={styles.navigation} aria-label="서비스 안내">
        <a href="#honestone-story">어니스톤 소개</a>
        <a href="#areas">기업인증·ISO</a>
        <Link href="/programs">정부지원사업</Link>
      </nav>
      <div className={styles.account}>
        {user ? <Link href="/dashboard">내 업무 <ArrowUpRight size={15}/></Link> : <button onClick={onLogin}>로그인 <ArrowUpRight size={15}/></button>}
      </div>
    </header>

    <section className={styles.hero} aria-labelledby="honestone-heading">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}><span/> BUSINESS, WITH SINCERITY.</p>
        <h1 id="honestone-heading">기업의 가능성에,<br/><em>진심을 더하다.</em></h1>
        <p className={styles.description}>한 장의 사업계획서에서 기업의 다음 성장까지.<br/>흩어진 정보와 서류를 연결하고,<br className={styles.mobileBreak}/> 우리 회사의 준비를 함께합니다.</p>
        <div className={styles.actions}>
          <button className={styles.startButton} onClick={()=>onStart()}>우리 회사 준비 시작 <ArrowUpRight size={18}/></button>
          <Link className={styles.calendarLink} href="/programs">지원사업 둘러보기 <ArrowUpRight size={16}/></Link>
        </div>
        <p className={styles.accessNote}>지원사업 공고는 가입 없이 살펴보실 수 있습니다.</p>
      </div>

      <figure className={styles.founder}>
        <div className={styles.photo}>
          <Image src="/instructors/cho-youngbin.png" alt="어니스톤 조영빈 대표" fill priority sizes="(max-width: 650px) 88vw, (max-width: 1000px) 42vw, 460px" quality={85}/>
          <span className={styles.photoLabel} aria-hidden="true">THE PEOPLE BEHIND HONESTONE</span>
        </div>
        <figcaption><span>기업의 다음을 함께 준비하는 사람</span><strong>조영빈 <small>어니스톤 대표</small></strong></figcaption>
      </figure>
      <div className={styles.wordmark} aria-hidden="true">Honestone</div>
      <a className={styles.scrollCue} href="#honestone-story"><ArrowDown size={14}/> OUR STORY</a>
    </section>

    <div id="honestone-story" className={styles.introduction}>
      <p className={styles.sectionLabel}>OUR APPROACH <span>01 —</span></p>
      <h2>좋은 준비가,<br/>다음 가능성을 만듭니다.</h2>
      <div><p>우리 회사에 필요한 기회를 찾고, 자료를 모으고,<br className={styles.desktopBreak}/> 다음 할 일을 정리하는 것부터.</p><p>어니스톤은 지원사업과 기업인증, ISO 준비를<br className={styles.desktopBreak}/> 하나의 업무 흐름으로 연결합니다.</p><a href="#areas">준비 분야 살펴보기 <ArrowUpRight size={15}/></a></div>
    </div>
  </div>;
}
