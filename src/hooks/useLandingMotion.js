'use client';
import {useEffect} from 'react';

// Progressive enhancement: the page remains readable without JS or motion support.
export function useLandingMotion(rootRef,styles){
 useEffect(()=>{
  const root=rootRef.current;
  if(!root||!window.IntersectionObserver||!Element.prototype.animate)return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact=window.matchMedia('(max-width: 700px), (hover: none) and (pointer: coarse)');
  let dispose=()=>{};
  function setup(){
   dispose();
   if(preference.matches)return;
   const mobile=compact.matches;
   const animations=new Set(),seen=new WeakSet(),targets=new Map();
   let previousY=window.scrollY,previousTime=performance.now(),fastUntil=0;
   function settle(){for(const animation of animations)animation.finish();animations.clear();}
   function trackScroll(){const now=performance.now(),distance=Math.abs(window.scrollY-previousY),elapsed=Math.max(1,now-previousTime);if(mobile&&(distance>120||distance/elapsed>1.5)){fastUntil=now+220;settle();}previousY=window.scrollY;previousTime=now;}
   window.addEventListener('scroll',trackScroll,{passive:true});
   const add=(selector,kind='up',stagger=false)=>{
    root.querySelectorAll(selector).forEach((element,index)=>{
     if(!targets.has(element))targets.set(element,{kind,delay:stagger&&!mobile?(index%4)*85:0});
    });
   };
   const cls=key=>'.'+styles[key];
   add(`${cls('hero')} > div:first-child`,'up');
   add(cls('heroArt'),'scale');
   add('[data-landing-program-preview]');
   add(`${cls('section')} > h2, ${cls('section')} > .${styles.eyebrow}, ${cls('section')} > .${styles.description}`);
   add(`${cls('areas')} > button`,'up',true);
   add(cls('storyHeading'),'left');add(cls('connectionArt'),'scale');
   add(cls('showcaseIntro'));add(`${cls('bento')} > article`,'up',true);
   add(`${cls('formSection')} > div:first-child`,'up'); // Inputs never fade or move while being edited.
   add(`${cls('process')} > div`,'up',true);
   add(cls('salesContent'),'left');add(cls('footerTop'));add(cls('footerWordmark'),'up');
   const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
     if(!entry.isIntersecting||seen.has(entry.target))continue;
     seen.add(entry.target);observer.unobserve(entry.target);
     const {kind,delay}=targets.get(entry.target);
     // A fast swipe must not turn readable content into an animation queue.
     if(mobile&&performance.now()<fastUntil)continue;
     const from=mobile?'translateY(10px)':kind==='left'?'translateX(-24px)':kind==='scale'?'translateY(22px) scale(.96)':'translateY(28px)';
     const animation=entry.target.animate([{opacity:mobile?.7:0,transform:from},{opacity:1,transform:'none'}],{duration:mobile?340:760,delay,easing:'cubic-bezier(.2,.75,.25,1)',fill:'backwards'});
     animations.add(animation);animation.onfinish=()=>animations.delete(animation);
    }
   },{threshold:mobile?0:.08,rootMargin:mobile?'0px 0px 96px 0px':'0px 0px -24px 0px'});
   targets.forEach((_,element)=>{const rect=element.getBoundingClientRect();if(mobile&&rect.top<window.innerHeight&&rect.bottom>0){seen.add(element);return;}observer.observe(element);});
   // Scroll-linked motion applies only to decorative art, never form controls.
   const artKeys=['connectionArt','fileScene','startArt','ctaOrbit'];
   const arts=mobile?[]:artKeys.flatMap(key=>Array.from(root.querySelectorAll(cls(key))));
   const visibleArts=new Set();let frame=0;
   function paint(){frame=0;for(const element of visibleArts){const rect=element.getBoundingClientRect();const progress=Math.max(-1,Math.min(1,(window.innerHeight/2-(rect.top+rect.height/2))/window.innerHeight));element.style.translate=`0 ${progress*28}px`;}}
   function schedule(){if(!frame&&visibleArts.size)frame=requestAnimationFrame(paint);}
   const artObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visibleArts.add(entry.target);else visibleArts.delete(entry.target);}schedule();});
   arts.forEach(element=>artObserver.observe(element));
   const finishFocused=event=>{for(const animation of animations){const element=animation.effect?.target;if(element?.contains(event.target)){animation.finish();animations.delete(animation);}}};
   if(!mobile){window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);}root.addEventListener('focusin',finishFocused);
   dispose=()=>{window.removeEventListener('scroll',trackScroll);observer.disconnect();artObserver.disconnect();cancelAnimationFrame(frame);animations.forEach(animation=>animation.cancel());arts.forEach(element=>element.style.removeProperty('translate'));window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);root.removeEventListener('focusin',finishFocused);};
  }
  setup();preference.addEventListener('change',setup);compact.addEventListener('change',setup);
  return()=>{dispose();preference.removeEventListener('change',setup);compact.removeEventListener('change',setup);};
 },[rootRef,styles]);
}
