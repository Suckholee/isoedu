'use client';

import {useEffect, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUp, ArrowUpRight, Building2, CalendarDays, ChevronLeft, Compass,
  Files, Globe2, LogIn, Menu, PackageCheck, PanelLeftOpen, Plane, ShieldCheck,
  UserRound, X,
} from 'lucide-react';
import styles from './LandingMasthead.module.css';
import FeaturedInsights from './FeaturedInsights';

const certificationAreas = [
  {
    key: 'certification', title: '국내 기업인증', Icon: Building2, tone: 'domesticBusiness',
    description: '벤처기업확인·기업부설연구소 등 국내 제도와 회사 요건을 확인합니다.',
  },
  {
    key: 'internationalCertification', title: '해외 기업인증', Icon: Globe2, tone: 'globalBusiness',
    description: '해외 거래처의 요구사항과 경영시스템 인증 범위를 정리합니다.',
  },
  {
    key: 'domesticProduct', title: '국내 제품인증', Icon: PackageCheck, tone: 'domesticProduct',
    description: '국내 판매를 위한 제품별 시험, 표시, 신청 자료를 준비합니다.',
  },
  {
    key: 'internationalProduct', title: '해외 제품인증', Icon: Plane, tone: 'globalProduct',
    description: '수출 대상국을 기준으로 제품 시험과 적합성 요건을 확인합니다.',
  },
];

const representativePhotos = [
  {file:'press-portrait.jpg',title:'조영빈 대표 프로필',kind:'PRESS PORTRAIT',credit:'어니스톤 제공 · 알파경제',href:'https://alphabiz.co.kr/news/view/1065580439174902'},
  {file:'ep03.jpg',title:'허가증 이후의 다음 제안',kind:'OFFICIAL CONTENT',credit:'어니스톤 공식 영상 썸네일',href:'https://honestone.kr/'},
  {file:'ep04.jpg',title:'기존 고객과 이어가는 대화',kind:'OFFICIAL CONTENT',credit:'어니스톤 공식 영상 썸네일',href:'https://honestone.kr/'},
  {file:'ep05.jpg',title:'고객이 궁금해하는 ISO',kind:'OFFICIAL CONTENT',credit:'어니스톤 공식 영상 썸네일',href:'https://honestone.kr/'},
  {file:'ep07.jpg',title:'고객의 다음 과제 찾기',kind:'OFFICIAL CONTENT',credit:'어니스톤 공식 영상 썸네일',href:'https://honestone.kr/'},
  {file:'ep09.jpg',title:'ISO 심사원 교육 이야기',kind:'OFFICIAL CONTENT',credit:'어니스톤 공식 영상 썸네일',href:'https://honestone.kr/'},
];

const preparationSteps = [
  ['적용 범위 확인', '기업의 인증 목적이나 제품의 판매 국가와 용도를 확인합니다.'],
  ['자료와 일정 정리', '필요한 서류와 시험·심사 준비 항목을 정리합니다.'],
  ['신청 준비', '제출 자료를 검토하고 해당 기관의 신청 절차를 확인합니다.'],
];

function Mark() {
  return <span className={styles.brandMark} aria-hidden="true">C</span>;
}

export default function LandingMasthead({user, onLogin, onStart, children}) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('isoedu_sidebar_open');
      if (saved !== null) setOpen(saved !== 'false');
    } catch {}
  }, []);

  function toggle() {
    setOpen(value => {
      const next = !value;
      try { localStorage.setItem('isoedu_sidebar_open', String(next)); } catch {}
      return next;
    });
  }

  useEffect(() => {
    function handleKey(event) {
      if (event.isComposing || event.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
      if (event.key === '[' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b')) {
        event.preventDefault();
        toggle();
      }
      if (event.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const close = () => setMobileOpen(false);
  function start(key) {
    close();
    onStart(key);
  }

  return <div className={`${styles.layout} ${!open ? styles.collapsed : ''}`}>
    <a className={styles.skipLink} href="#landing-content">본문으로 건너뛰기</a>
    <header className={styles.mobileHeader}>
      <Link href="/" aria-label="써티멘토 홈"><Mark/><strong>써티멘토</strong></Link>
      <button aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={mobileOpen}
        aria-controls="public-navigation" onClick={() => setMobileOpen(value => !value)}>
        {mobileOpen ? <X size={23}/> : <Menu size={23}/>}
      </button>
    </header>
    {mobileOpen && <button className={styles.backdrop} aria-label="메뉴 닫기" onClick={close}/>}
    <aside id="public-navigation" className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`} aria-label="써티멘토 공개 메뉴">
      <div className={styles.sidebarTop}>
        <Link href="/" className={styles.logo} aria-label="써티멘토 홈">
          <Mark/><span>써티멘토<small>CERTIMENTO</small></span>
        </Link>
        <button className={styles.toggle} aria-label={open ? '사이드바 접기' : '사이드바 펼치기'}
          aria-expanded={open} aria-controls="public-navigation" onClick={toggle}>
          {open ? <ChevronLeft size={17}/> : <PanelLeftOpen size={19}/>}
        </button>
      </div>
      <nav className={styles.nav} aria-label="서비스 메뉴">
        <div>
          {certificationAreas.map(({key, title, Icon}) =>
            <button key={key} type="button" title={title} aria-label={title} onClick={() => start(key)}>
              <Icon size={17}/><span>{title}</span>
            </button>
          )}
          <button type="button" title="ISO 인증 준비" aria-label="ISO 인증 준비" onClick={() => start('iso')}>
            <ShieldCheck size={17}/><span>ISO 인증 준비</span>
          </button>
        </div>
        <div>
          <Link href="/business-plan" aria-label="사업계획서 만들기" title="사업계획서 만들기" onClick={close}><Files size={17}/><span>사업계획서 만들기</span></Link>
          <Link href="/programs" aria-label="정부지원사업" title="정부지원사업" onClick={close}><CalendarDays size={17}/><span>정부지원사업</span></Link>
          <Link href="/dashboard" aria-label="내 업무 공간" title="내 업무 공간" onClick={close}><Compass size={17}/><span>내 업무 공간</span></Link>
        </div>
        <div>
          <a href="#honestone-story" aria-label="써티멘토 소개" title="써티멘토 소개" onClick={close}><UserRound size={17}/><span>써티멘토 소개</span></a>
          <a href="#insights" aria-label="블로그·홈페이지 글" title="블로그·홈페이지 글" onClick={close}><Files size={17}/><span>블로그·홈페이지 글</span></a>
        </div>
      </nav>
      <div className={styles.sidebarPromos}>
        <button className={styles.certPromo} onClick={() => start()}>인증 준비 시작<ArrowUpRight size={17}/></button>
      </div>
      <div className={styles.sidebarBottom}>
        {user
          ? <Link href="/dashboard" aria-label="내 업무"><LogIn size={14}/><span>내 업무</span></Link>
          : <button aria-label="로그인" onClick={() => {close(); onLogin();}}><LogIn size={14}/><span>로그인</span></button>}
      </div>
    </aside>

    <div id="landing-content" className={styles.content}>
      <section id="areas" className={styles.certPortfolio} aria-label="써티멘토 인증 준비 서비스">
        <div className={styles.certHero}>
          <Image src="/images/honestone/cho-youngbin/hero-ceo.jpg" alt="조영빈 대표" fill priority sizes="(max-width: 760px) 100vw, 55vw"/>
          <div className={styles.certHeroCopy}>
            <p className={styles.certEyebrow}>써티멘토 · CERTIMENTO</p>
            <h1>국내외 기업인증과<br/>제품인증 준비</h1>
            <p className={styles.certDescription}>국내 판매부터 해외 진출까지.<br/>필요한 인증을 확인하고 시험·심사 자료와 신청 서류를 준비하세요.</p>
            <div className={styles.certActions}>
              <button type="button" onClick={() => start()}>인증 준비 시작 <ArrowUpRight size={17}/></button>
              <Link href="/business-plan">사업계획서 만들기 <ArrowUpRight size={15}/></Link>
            </div>
          </div>
        </div>
        <div className={styles.certAreas}>
          {certificationAreas.map(({key, title, Icon, tone, description}) =>
            <button className={`${styles.certCard} ${styles[tone]}`} key={key} type="button" onClick={() => start(key)}>
              <Icon className={styles.certIcon} size={25} strokeWidth={1.5} aria-hidden="true"/>
              <span className={styles.certCardCopy}><strong>{title}</strong><span>{description}</span></span>
              <ArrowUpRight className={styles.certArrow} size={19} aria-hidden="true"/>
            </button>
          )}
        </div>
      </section>

      <section id="process" className={styles.process}>
        <div><h2>인증 준비 절차</h2><p>시험·심사와 인증서 발급은 해당 기관의 절차에 따릅니다.</p></div>
        <ol>{preparationSteps.map(([title, description]) =>
          <li key={title}><h3>{title}</h3><p>{description}</p></li>
        )}</ol>
      </section>

      {children}

      <section id="honestone-story" className={styles.about}>
        <p className={styles.aboutLabel}>써티멘토 소개</p>
        <h2>기업과 제품의 인증 준비를 돕습니다.</h2>
        <div className={styles.founder}>
          <div className={styles.founderPhoto}>
            <Image src="/images/honestone/cho-youngbin/ceo-standing.jpg" alt="조영빈 대표 프로필" fill sizes="(max-width: 600px) 80vw, 270px"/>
          </div>
          <div className={styles.founderCopy}>
            <h3>조영빈 대표</h3>
            <p>기업이 필요한 인증을 찾고, 목표 시장에 맞는 자료를 준비할 수 있도록 돕습니다.</p>
            <a href="#people-gallery">사진과 콘텐츠 보기 <ArrowUpRight size={16}/></a>
          </div>
        </div>
      </section>
   <section id="people-gallery" className={styles.photoSection} aria-labelledby="photo-gallery-title">
    <div className={styles.photoHeading}><div><h2 id="photo-gallery-title">사진과 이야기로 만나는<br/>조영빈 대표.</h2></div><p>공식 프로필과 영상에서 인증 준비 이야기를 만나보세요.</p></div>
    <div className={styles.photoGrid}>{representativePhotos.map(photo=><a key={photo.file} href={photo.href} target="_blank" rel="noopener noreferrer" className={styles.photoCard} aria-label={`${photo.title} — 출처 보기 (새 창)`}><div className={styles.photoImage}><Image src={`/images/honestone/cho-youngbin/${photo.file}`} alt={`${photo.title} — 조영빈 대표${photo.kind==='OFFICIAL CONTENT'?' 공식 영상 썸네일':''}`} fill sizes="(max-width: 600px) 44vw, (max-width: 1150px) 28vw, 15vw"/></div><div className={styles.photoCaption}><small>{photo.kind}</small><h3>{photo.title}</h3><p>{photo.credit}<ArrowUpRight size={13}/></p></div></a>)}</div>
    <div className={styles.photoLinks}><span>영상 썸네일을 누르면 원문 사이트로 이동합니다.</span><a href="https://www.youtube.com/channel/UC4bv_sw6JudKORw7lbLxe6w" target="_blank" rel="noopener noreferrer">조영빈의 사업은 처음이라 <ArrowUpRight size={15}/></a><a href="https://www.instagram.com/honestone_kevin/" target="_blank" rel="noopener noreferrer">인스타그램 <ArrowUpRight size={15}/></a></div>
   </section>
      <FeaturedInsights/>
      <footer className={styles.footer}>
        <div className={styles.footerBrand}><Mark/><strong>써티멘토</strong></div>
        <div><p>국내외 기업인증·제품인증 준비</p><span>© {new Date().getFullYear()} CERTIMENTO</span></div>
        <nav aria-label="하단 메뉴"><Link href="/business-plan">사업계획서 만들기</Link><Link href="/dashboard">내 업무 공간</Link></nav>
      </footer>
      <div className={styles.quickActions}>
        <button onClick={() => start()} title="인증 준비 시작" aria-label="인증 준비 시작"><Compass size={22}/><span>시작</span></button>
        <a href="#landing-content" title="맨 위로" aria-label="맨 위로"><ArrowUp size={20}/></a>
      </div>
    </div>
  </div>;
}
