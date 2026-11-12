'use client';

import {useEffect, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, ArrowUp, ArrowUpRight, Building2, CalendarDays, ChevronLeft, Compass,
  Factory, Files, Globe2, Link2, LogIn, Menu, PackageCheck, PanelLeftOpen, Plane, ShieldCheck,
  UserRound, X,
} from 'lucide-react';
import styles from './LandingMasthead.module.css';
import FeaturedInsights from './FeaturedInsights';
import {INTERESTS} from '../lib/growthIntake.mjs';
import {SMART_FACTORY_NOTICE} from '../lib/certificationReport.mjs';

const certificationAreas = [
  {
    key: 'certification', title: '국내 기업인증', Icon: Building2, tone: 'domesticBusiness',
    description: '벤처기업확인·기업부설연구소 등 국내 제도와 회사 요건을 확인합니다.',
    sourceLabel: '벤처기업확인제도 공식 안내', sourceUrl: 'https://www.smes.go.kr/venturein/institution/systemGuide',
  },
  {
    key: 'internationalCertification', title: '해외 기업인증', Icon: Globe2, tone: 'globalBusiness',
    description: '해외 거래처의 요구사항과 경영시스템 인증 범위를 정리합니다.',
    sourceLabel: 'ISO 공식 인증 안내', sourceUrl: 'https://www.iso.org/certification.html',
  },
  {
    key: 'domesticProduct', title: '국내 제품인증', Icon: PackageCheck, tone: 'domesticProduct',
    description: '국내 판매를 위한 제품별 시험, 표시, 신청 자료를 준비합니다.',
    sourceLabel: '제품안전정보센터 공식 안내', sourceUrl: 'https://www.safetykorea.kr/',
  },
  {
    key: 'internationalProduct', title: '해외 제품인증', Icon: Plane, tone: 'globalProduct',
    description: '수출 대상국을 기준으로 제품 시험과 적합성 요건을 확인합니다.',
    sourceLabel: '유럽연합 CE 표시 안내', sourceUrl: 'https://single-market-economy.ec.europa.eu/single-market/goods/ce-marking/manufacturers_en',
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

const reportSteps = [
  {title:'무료 인증 리포트', badge:'무료', detail:'회사와 제품 정보를 바탕으로 필요한 준비 항목을 확인하고 리포트를 내려받습니다.'},
  {title:'전문가 검토', badge:'선택', detail:'적용 요건과 보유 자료를 전문가와 확인하고, 준비 순서를 구체화합니다.'},
  {title:'인증 준비 용역', badge:'선택', detail:'시험·심사 준비, 신청 서류, 일정 관리에 필요한 지원 범위와 견적을 협의합니다.'},
];

function Mark() {
  return <span className={styles.brandMark} aria-hidden="true">C</span>;
}

export default function LandingMasthead({user, onLogin, onStart, children}) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  async function copyReportLink() {
    const url = new URL('/#start', window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('고객에게 보낼 링크를 복사했습니다.');
      setShareUrl('');
    } catch {
      setShareUrl(url);
      setShareStatus('아래 링크를 복사해서 고객에게 보내세요.');
    }
  }

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
          <a href="#areas" aria-label="분야별 인증 가이드" title="분야별 인증 가이드" onClick={close}><ShieldCheck size={17}/><span>분야별 인증 가이드</span></a>
          <a href="#honestone-story" aria-label="써티멘토 소개" title="써티멘토 소개" onClick={close}><UserRound size={17}/><span>써티멘토 소개</span></a>
          <a href="#insights" aria-label="블로그·홈페이지 글" title="블로그·홈페이지 글" onClick={close}><Files size={17}/><span>블로그·홈페이지 글</span></a>
        </div>
      </nav>
      <div className={styles.sidebarPromos}>
        <a href="#smart-factory" className={styles.smartFactoryPromo} onClick={close}>스마트공장 지원사업<small>공식 공고·사업계획서 준비</small><ArrowUpRight size={17}/></a>
      </div>
      <div className={styles.sidebarBottom}>
        {user
          ? <Link href="/dashboard" aria-label="내 업무"><LogIn size={14}/><span>내 업무</span></Link>
          : <button aria-label="로그인" onClick={() => {close(); onLogin();}}><LogIn size={14}/><span>로그인</span></button>}
      </div>
    </aside>

    <div id="landing-content" className={styles.content}>
      <section id="process" className={styles.reportHero} aria-labelledby="report-hero-title">
        <span className={styles.reportMark}><ShieldCheck size={30} strokeWidth={1.6} aria-hidden="true"/></span>
        <p className={styles.reportHeroScope}>국내외 기업인증 · 제품인증</p>
        <h1 id="report-hero-title">인증 준비, 무료 리포트부터.</h1>
        <p className={styles.reportHeroIntro}>전문자격사와 컨설턴트가 고객에게 공유하는 인증 준비 리포트. 기업은 직접 작성하고, 필요할 때 전문가 검토와 준비 용역을 문의할 수 있습니다.</p>
        <ol className={styles.serviceSteps}>
          {reportSteps.map(({title, detail, badge}, index) =>
            <li key={title}>
              <div className={styles.serviceStepMeta}>
                <span className={styles.serviceStepNumber}>{index + 1}</span>
                <span className={index === 0 ? styles.freeStep : styles.optionalStep}>{badge}</span>
              </div>
              <h2>{title}</h2>
              <p>{detail}</p>
              {index < reportSteps.length - 1 && <span className={styles.serviceStepArrow} aria-hidden="true"><ArrowRight size={16}/></span>}
            </li>
          )}
        </ol>
        <button className={styles.reportHeroButton} type="button" onClick={() => start()}>무료 인증 리포트 받기 <ArrowUpRight size={19}/></button>
        <div className={styles.reportHeroLinks}>
          <button type="button" onClick={copyReportLink}><Link2 size={16}/> 고객에게 리포트 링크 복사</button>
          <Link href="/business-plan">사업계획서 만들기 <ArrowUpRight size={15}/></Link>
        </div>
        {shareStatus && <p className={styles.shareStatus} role="status">{shareStatus}</p>}
        {shareUrl && <input className={styles.shareInput} aria-label="복사할 리포트 링크" value={shareUrl} readOnly onFocus={event => event.target.select()}/>}
      </section>

      {children}

      <section id="areas" className={styles.certGuide} aria-labelledby="cert-guide-title">
        <h2 id="cert-guide-title">분야별 인증 가이드</h2>
        <p>고객 상담에서 확인할 항목과 공식 안내를 분야별로 모았습니다.</p>
        <div className={styles.certAreas}>
          {certificationAreas.map(({key, title, Icon, tone, description, sourceLabel, sourceUrl}) =>
            <article className={`${styles.certCard} ${styles[tone]}`} key={key}>
              <Icon className={styles.certIcon} size={25} strokeWidth={1.5} aria-hidden="true"/>
              <div className={styles.certCardCopy}><h3>{title}</h3><p>{description}</p></div>
              <ul>{INTERESTS[key].steps.map(step => <li key={step}>{step}</li>)}</ul>
              <div className={styles.guideActions}>
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{sourceLabel} <ArrowUpRight size={15}/></a>
                <button type="button" onClick={() => start(key)}>이 분야 리포트 받기 <ArrowRight size={15}/></button>
              </div>
            </article>
          )}
        </div>
      </section>

      <section id="smart-factory" className={styles.smartFactory} aria-labelledby="smart-factory-title">
        <Factory size={30} strokeWidth={1.6} aria-hidden="true"/>
        <div>
          <h2 id="smart-factory-title">스마트공장 지원사업</h2>
          <p>도입하려는 공정과 현장의 개선 과제를 정리하고, 통합 안내와 세부사업 공고를 확인하세요.</p>
          <div className={styles.guideActions}>
            <a href={SMART_FACTORY_NOTICE} target="_blank" rel="noopener noreferrer">2027 통합공고 안내 <ArrowUpRight size={16}/></a>
            <a href="https://www.smart-factory.kr/" target="_blank" rel="noopener noreferrer">스마트공장 사업관리시스템 <ArrowUpRight size={16}/></a>
            <Link href="/business-plan">사업계획서 만들기 <ArrowUpRight size={16}/></Link>
          </div>
        </div>
      </section>

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
        <button onClick={() => start()} title="무료 리포트 받기" aria-label="무료 리포트 받기"><Compass size={22}/><span>리포트</span></button>
        <a href="#landing-content" title="맨 위로" aria-label="맨 위로"><ArrowUp size={20}/></a>
      </div>
    </div>
  </div>;
}
