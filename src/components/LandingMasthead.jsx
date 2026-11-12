'use client';
import {useEffect,useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowUp,ArrowUpRight,ArrowLeft,ArrowRight,Building2,CalendarDays,ChevronLeft,Compass,Files,LayoutGrid,LogIn,Menu,PanelLeftOpen,Pause,Play,ShieldCheck,Sparkles,UserRound,X} from 'lucide-react';
import styles from './LandingMasthead.module.css';
const slides=[
 {eyebrow:'HONESTONE / BUSINESS PLAN',title:<>생각을 계획으로.<br/>계획을 다음 기회로.</>,description:'사업계획서부터 기업인증까지, 어니스톤.',action:'우리 회사 준비 시작',type:'plan'},
 {eyebrow:'HONESTONE / OUR PEOPLE',title:<>기업의 가능성에,<br/>진심을 더합니다.</>,description:'조영빈 대표와 함께하는 기업의 다음 준비.',action:'어니스톤 소개',type:'people'},
 {eyebrow:'HONESTONE / NEXT OPPORTUNITY',title:<>우리 회사의 다음,<br/>기회에서 시작됩니다.</>,description:'정부지원사업 공고와 일정을 한눈에.',action:'지원사업 둘러보기',type:'programs'}
];
const representativePhotos=[
 {file:'press-portrait.jpg',title:'조영빈 대표 프로필',kind:'PRESS PORTRAIT',credit:'어니스톤 제공 · 알파경제',href:'https://alphabiz.co.kr/news/view/1065580439174902'},
 {file:'ep03.jpg',title:'허가증 이후의 다음 제안',kind:'OFFICIAL CONTENT',credit:'어니스톤 공식 영상 썸네일',href:'https://honestone.kr/'},
 {file:'ep04.jpg',title:'기존 고객과 이어가는 대화',kind:'OFFICIAL CONTENT',credit:'어니스톤 공식 영상 썸네일',href:'https://honestone.kr/'},
 {file:'ep05.jpg',title:'고객이 궁금해하는 ISO',kind:'OFFICIAL CONTENT',credit:'어니스톤 공식 영상 썸네일',href:'https://honestone.kr/'},
 {file:'ep07.jpg',title:'고객의 다음 과제 찾기',kind:'OFFICIAL CONTENT',credit:'어니스톤 공식 영상 썸네일',href:'https://honestone.kr/'},
 {file:'ep09.jpg',title:'ISO 심사원 교육 이야기',kind:'OFFICIAL CONTENT',credit:'어니스톤 공식 영상 썸네일',href:'https://honestone.kr/'}
];
function Mark(){return <svg viewBox="0 0 40 48" fill="none" aria-hidden="true"><rect x="3" y="2" width="34" height="44" rx="16" stroke="currentColor" strokeWidth="2"/><path d="M12 13v22m16-22v22M12 24h16M4 37h32" stroke="currentColor" strokeWidth="2"/></svg>;}
function Caption({label,title}){return <span className={styles.tileCaption}><small>{label}</small><strong>{title}</strong><ArrowUpRight size={21}/></span>;}
export default function LandingMasthead({user,onLogin,onStart,children}){
 const [open,setOpen]=useState(true),[mobileOpen,setMobileOpen]=useState(false),[slide,setSlide]=useState(0),[paused,setPaused]=useState(false),[hovered,setHovered]=useState(false),[reduced,setReduced]=useState(true);
 useEffect(()=>{try{const saved=localStorage.getItem('isoedu_sidebar_open');if(saved!==null)setOpen(saved!=='false');}catch{}const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 function toggle(){setOpen(value=>{const next=!value;try{localStorage.setItem('isoedu_sidebar_open',String(next));}catch{}return next;});}
 useEffect(()=>{const handler=event=>{if(event.isComposing||event.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;if(event.key==='['||((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='b')){event.preventDefault();toggle();}if(event.key==='Escape')setMobileOpen(false);};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[]);
 useEffect(()=>{if(paused||hovered||reduced)return;const timer=setInterval(()=>{if(!document.hidden)setSlide(value=>(value+1)%slides.length);},6500);return()=>clearInterval(timer);},[paused,hovered,reduced]);
 const close=()=>setMobileOpen(false),start=key=>{close();onStart(key);};
 const nav=(label,Icon,href,key)=>href?<Link href={href} title={label} onClick={close}><Icon size={17}/><span>{label}</span></Link>:<button title={label} onClick={()=>start(key)}><Icon size={17}/><span>{label}</span></button>;
 const current=slides[slide];
 return <div className={`${styles.layout} ${!open?styles.collapsed:''}`}>
  <a className={styles.skipLink} href="#landing-content">본문으로 건너뛰기</a>
  <header className={styles.mobileHeader}><Link href="/" aria-label="어니스톤 홈"><Mark/><strong>HONESTONE</strong></Link><button aria-label={mobileOpen?'메뉴 닫기':'메뉴 열기'} aria-expanded={mobileOpen} aria-controls="public-navigation" onClick={()=>setMobileOpen(value=>!value)}>{mobileOpen?<X size={23}/>:<Menu size={23}/>}</button></header>
  {mobileOpen&&<button className={styles.backdrop} aria-label="메뉴 닫기" onClick={close}/>}
  <aside id="public-navigation" className={`${styles.sidebar} ${mobileOpen?styles.mobileOpen:''}`} aria-label="어니스톤 공개 메뉴">
   <div className={styles.sidebarTop}><Link href="/" className={styles.logo} aria-label="어니스톤 홈"><Mark/><span>HONESTONE<small>어니스톤</small></span></Link><button className={styles.toggle} aria-label={open?'사이드바 접기':'사이드바 펼치기'} aria-expanded={open} title="사이드바 접기·펼치기 ([ 또는 Ctrl/Cmd+B)" onClick={toggle}>{open?<ChevronLeft size={17}/>:<PanelLeftOpen size={19}/>}</button></div>
   <nav className={styles.nav} aria-label="서비스 메뉴"><div>{nav('서비스 둘러보기',LayoutGrid,'#areas')}{nav('어니스톤 소개',UserRound,'#honestone-story')}{nav('대표 사진·콘텐츠',UserRound,'#people-gallery')}{nav('우리 회사 준비 시작',Compass)}</div><div>{nav('사업계획서',Files,null,'government')}{nav('기업인증',Building2,null,'certification')}{nav('ISO 인증',ShieldCheck,null,'iso')}{nav('정부지원사업',CalendarDays,'/programs')}{nav('회사 문서함',Files,'/documents')}{nav('AI 문서 작성',Sparkles,null,'government')}</div><div>{nav('이용 방법',Compass,'#process')}{nav('내 업무 공간',LayoutGrid,'/dashboard')}</div></nav>
   <div className={styles.sidebarPromos}><Link href="/programs" className={styles.bluePromo}>정부지원사업 일정<small>가입 없이 공고 확인</small><ArrowUpRight size={17}/></Link><button className={styles.orangePromo} onClick={()=>start()}>우리 회사 준비 시작<small>정보부터 문서·일정까지</small><ArrowUpRight size={17}/></button></div>
   <div className={styles.sidebarBottom}><p>기업의 다음 준비를 연결합니다.</p><div>{user?<Link href="/dashboard" aria-label="내 업무"><LogIn size={14}/><span>MY WORK</span></Link>:<button aria-label="로그인" onClick={()=>{close();onLogin();}}><LogIn size={14}/><span>LOGIN</span></button>}<a href="#honestone-story" onClick={close}><span>ABOUT US</span></a></div></div>
  </aside>
  <div id="landing-content" className={styles.content}>
   <div className={styles.announcement}>사업계획서 · 정부지원사업 · 기업인증 · ISO <span>기업의 다음 준비, 어니스톤</span></div>
   <section id="areas" className={styles.portfolio} aria-label="어니스톤 서비스 둘러보기">
    <div className={`${styles.mainVisual} ${styles[current.type]}`} aria-roledescription="캐러셀" aria-label="어니스톤 주요 서비스" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setPaused(true)}>
     {current.type==='plan'?<Image src="/images/honestone/business-plan-concept.png" alt="사업계획서와 문서 준비를 표현한 콘셉트 이미지" fill priority sizes="(max-width: 600px) 100vw, 50vw"/>:current.type==='people'?<Image src="/images/honestone/cho-youngbin/hero-ceo.jpg" alt="어니스톤 공식 프로필 — 조영빈 대표" fill sizes="(max-width: 600px) 100vw, 50vw"/>:<div className={styles.opportunityArt} aria-hidden="true"><span>THE<br/>NEXT.</span><i/><i/><i/></div>}
     <div className={styles.heroShade}/><div className={styles.heroCopy} key={slide} role="group" aria-roledescription="슬라이드" aria-label={`${slide+1} / ${slides.length}`}><p>{current.eyebrow}</p><h1>{current.title}</h1><p className={styles.heroDescription}>{current.description}</p>{current.type==='people'?<a href="#honestone-story">{current.action}<ArrowUpRight size={17}/></a>:current.type==='programs'?<Link href="/programs">{current.action}<ArrowUpRight size={17}/></Link>:<button onClick={()=>start()}>{current.action}<ArrowUpRight size={17}/></button>}</div>
     <div className={styles.slideControls}><div>{slides.map((item,index)=><button key={item.type} className={index===slide?styles.selectedDot:''} aria-label={`${index+1}번 배너 보기`} aria-pressed={index===slide} onClick={()=>{setSlide(index);setPaused(true);}}/>)}</div><span>{String(slide+1).padStart(2,'0')} / 03</span><button aria-label="이전 배너" onClick={()=>setSlide((slide+2)%3)}><ArrowLeft size={15}/></button><button aria-label="다음 배너" onClick={()=>setSlide((slide+1)%3)}><ArrowRight size={15}/></button>{!reduced&&<button aria-label={paused?'배너 자동 재생':'배너 일시 정지'} onClick={()=>setPaused(value=>!value)}>{paused?<Play size={13}/>:<Pause size={13}/>}</button>}</div>
    </div>
    <button className={`${styles.tile} ${styles.planTile}`} onClick={()=>start('government')}><div className={styles.planPapers} aria-hidden="true"><div/><div><span>HONESTONE</span><strong>BUSINESS<br/>PLAN.</strong><i/><i/><small>IDEA → PLAN → NEXT</small></div></div><Caption label="BUSINESS PLAN" title="사업계획서"/></button>
    <Link href="/programs" className={`${styles.tile} ${styles.programTile}`}><div className={styles.calendarArt} aria-hidden="true"><span>YOUR NEXT</span><strong>{new Date().getFullYear()}</strong><p>OPPORTUNITY</p><div>{Array.from({length:21},(_,i)=><i key={i} className={i===10?styles.datePicked:''}>{i+1}</i>)}</div></div><Caption label="GOVERNMENT SUPPORT" title="정부지원사업"/></Link>
    <button className={`${styles.tile} ${styles.isoTile}`} onClick={()=>start('iso')}><div className={styles.isoArt} aria-hidden="true"><div/><strong>ISO</strong><span>BUILD YOUR STANDARD</span></div><Caption label="CERTIFICATION" title="ISO 인증 준비"/></button>
    <a href="#honestone-story" className={`${styles.tile} ${styles.peopleTile}`}><Image src="/instructors/cho-youngbin.png" alt="조영빈 대표" fill sizes="(max-width: 600px) 50vw, 25vw"/><Caption label="PEOPLE & HONESTONE" title="조영빈 대표"/></a>
    <button className={`${styles.tile} ${styles.ventureTile}`} onClick={()=>start('certification')}><span className={styles.bigV} aria-hidden="true">V<span>ENTURE</span></span><Caption label="BUSINESS CERTIFICATION" title="기업인증 준비"/></button>
    <Link href="/documents" className={`${styles.tile} ${styles.driveTile}`}><div className={styles.driveArt} aria-hidden="true"><div><Files size={28}/><span>COMPANY<br/>ARCHIVE</span></div><div/><div/></div><Caption label="COMPANY ARCHIVE" title="회사 문서함"/></Link>
    <button className={`${styles.tile} ${styles.aiTile}`} onClick={()=>start('government')}><div className={styles.aiArt} aria-hidden="true"><i/><i/><i/><strong>Ai.</strong><span>THINK. WRITE. REFINE.</span></div><Caption label="AI DOCUMENT WORKSPACE" title="AI 문서 작성"/></button>
    <a href="#process" className={`${styles.tile} ${styles.workflowTile}`}><div className={styles.workflowArt} aria-hidden="true"><span>MAKE<br/>IT<br/>HAPPEN.</span><ArrowUpRight size={88}/></div><Caption label="YOUR NEXT STEP" title="준비부터 실행까지"/></a>
   </section>
   <p className={styles.visualNote}>서비스를 소개하는 이미지입니다. 실제 고객 사례나 인증·선정 결과를 뜻하지 않습니다.</p>
   <section id="honestone-story" className={styles.about}><p className={styles.aboutLabel}>About Honestone</p><h2>기업의 가능성을 발견하고,<br/>생각이 계획이 되는 모든 과정에<br/><strong>어니스톤이 함께합니다.</strong></h2><div className={styles.aboutBrand}><Mark/><span>HONESTONE</span></div><div className={styles.founder}><div className={styles.founderPhoto}><Image src="/images/honestone/cho-youngbin/ceo-standing.jpg" alt="어니스톤 공식 전신 프로필 — 조영빈 대표" fill sizes="(max-width: 600px) 80vw, 270px"/></div><div className={styles.founderCopy}><p>THE PERSON BEHIND HONESTONE</p><h3>좋은 준비가,<br/>다음 기회를 만듭니다.</h3><p>공고를 찾고, 회사의 자료를 모으고, 사업의 방향을 정리하는 일.<br/>복잡하게 흩어져 있던 준비를 하나의 흐름으로 연결합니다.</p><div><strong>조영빈</strong><span>어니스톤 대표</span></div><button onClick={()=>start()}>우리 회사 준비 시작 <ArrowUpRight size={16}/></button></div></div></section>
   <section id="people-gallery" className={styles.photoSection} aria-labelledby="photo-gallery-title">
    <div className={styles.photoHeading}><div><p>PEOPLE / STORIES</p><h2 id="photo-gallery-title">사진과 이야기로 만나는<br/>조영빈 대표.</h2></div><p>공식 프로필부터 영상 속 이야기까지.<br/>어니스톤이 공개한 다양한 모습을 모았습니다.</p></div>
    <div className={styles.photoGrid}>{representativePhotos.map((photo,index)=><a key={photo.file} href={photo.href} target="_blank" rel="noopener noreferrer" className={styles.photoCard} aria-label={`${photo.title} — 출처 보기 (새 창)`}><div className={styles.photoImage}><Image src={`/images/honestone/cho-youngbin/${photo.file}`} alt={`${photo.title} — 조영빈 대표${photo.kind==='OFFICIAL CONTENT'?' 공식 영상 썸네일':''}`} fill sizes="(max-width: 600px) 44vw, (max-width: 1150px) 28vw, 15vw"/><span>{String(index+1).padStart(2,'0')}</span></div><div className={styles.photoCaption}><small>{photo.kind}</small><h3>{photo.title}</h3><p>{photo.credit}<ArrowUpRight size={13}/></p></div></a>)}</div>
    <div className={styles.photoLinks}><span>영상 썸네일을 누르면 원문 사이트로 이동합니다.</span><a href="https://www.youtube.com/channel/UC4bv_sw6JudKORw7lbLxe6w" target="_blank" rel="noopener noreferrer">조영빈의 사업은 처음이라 <ArrowUpRight size={15}/></a><a href="https://www.instagram.com/honestone_kevin/" target="_blank" rel="noopener noreferrer">인스타그램 <ArrowUpRight size={15}/></a></div>
   </section>
   {children}
   <section id="process" className={styles.process}><div><p>HOW WE WORK</p><h2>준비의 시작부터,<br/>다음 단계까지.</h2></div><ol>{[['방향을 정리합니다','관심 분야와 회사의 기본 정보를 바탕으로 준비할 일을 확인합니다.'],['자료를 모읍니다','회사별 문서함에 원본을 보관하고 필요한 내용을 확인합니다.'],['업무를 이어갑니다','회사·프로젝트의 준비 업무와 문서, 일정을 연결합니다.']].map(([title,text],index)=><li key={title}><span>0{index+1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol></section>
   <div className={styles.serviceStrip}><span>BUSINESS PLAN</span><span>CERTIFICATION</span><span>GOVERNMENT SUPPORT</span><span>COMPANY WORKSPACE</span></div>
   <footer className={styles.footer}><div className={styles.footerBrand}><Mark/><strong>어니스톤</strong></div><div><p>사업계획서 · 기업인증 · ISO · 정부지원사업 준비</p><p>기업의 다음 준비를 연결합니다.</p><small>공식 신청·심사·인증서 발급은 해당 기관의 절차에 따릅니다.</small><span>© {new Date().getFullYear()} HONESTONE. ALL RIGHTS RESERVED.</span></div><nav aria-label="하단 메뉴"><Link href="/programs">지원사업 일정</Link><Link href="/dashboard">내 업무 공간</Link><a href="#start">준비 시작</a></nav></footer>
   <div className={styles.quickActions}><button onClick={()=>start()} title="우리 회사 준비 시작" aria-label="우리 회사 준비 시작"><Compass size={22}/><span>시작</span></button><Link href="/programs" title="지원사업 일정" aria-label="지원사업 일정"><CalendarDays size={21}/></Link><a href="#landing-content" title="맨 위로" aria-label="맨 위로"><ArrowUp size={20}/></a></div>
  </div>
 </div>;
}
