'use client';
import {useEffect} from 'react';

// Progressive enhancement: the page remains readable without JS or motion support.
export function useLandingMotion(rootRef,styles){
 useEffect(()=>{
  const root=rootRef.current;
  if(!root||!window.IntersectionObserver||!Element.prototype.animate)return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  let dispose=()=>{};
  function setup(){
   dispose();
   if(preference.matches)return;
   const animations=new Set(),seen=new WeakSet(),targets=new Map();
   const add=(selector,kind='up',stagger=false)=>{
    root.querySelectorAll(selector).forEach((element,index)=>{
     if(!targets.has(element))targets.set(element,{kind,delay:stagger?(index%4)*85:0});
    });
   };
   const cls=key=>'.'+styles[key];
   add(`${cls('hero')} > div:first-child`,'up');
   add(cls('heroArt'),'scale');
   add(`${cls('section')} > h2, ${cls('section')} > .${styles.eyebrow}, ${cls('section')} > .${styles.description}`);
   add(`${cls('areas')} > button`,'up',true);
   add(cls('storyHeading'),'left');add(cls('connectionArt'),'scale');
   add(cls('showcaseIntro'));add(`${cls('bento')} > article`,'up',true);
   add(`${cls('formSection')} > div`,'up',true);
   add(`${cls('process')} > div`,'up',true);
   add(cls('salesContent'),'left');add(cls('footerTop'));add(cls('footerWordmark'),'up');
   const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
     if(!entry.isIntersecting||seen.has(entry.target))continue;
     seen.add(entry.target);observer.unobserve(entry.target);
     const {kind,delay}=targets.get(entry.target);
     const from=kind==='left'?'translateX(-24px)':kind==='scale'?'translateY(22px) scale(.96)':'translateY(28px)';
     const animation=entry.target.animate([{opacity:0,transform:from},{opacity:1,transform:'none'}],{duration:760,delay,easing:'cubic-bezier(.2,.75,.25,1)',fill:'backwards'});
     animations.add(animation);animation.onfinish=()=>animations.delete(animation);
    }
   },{threshold:.08,rootMargin:'0px 0px -24px 0px'});
   targets.forEach((_,element)=>observer.observe(element));
   // Scroll-linked motion applies only to decorative art, never form controls.
   const artKeys=['connectionArt','fileScene','startArt','ctaOrbit'];
   const arts=artKeys.flatMap(key=>Array.from(root.querySelectorAll(cls(key))));
   const visibleArts=new Set();let frame=0;
   function paint(){frame=0;for(const element of visibleArts){const rect=element.getBoundingClientRect();const progress=Math.max(-1,Math.min(1,(window.innerHeight/2-(rect.top+rect.height/2))/window.innerHeight));element.style.translate=`0 ${progress*28}px`;}}
   function schedule(){if(!frame&&visibleArts.size)frame=requestAnimationFrame(paint);}
   const artObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visibleArts.add(entry.target);else visibleArts.delete(entry.target);}schedule();});
   arts.forEach(element=>artObserver.observe(element));
   const finishFocused=event=>{for(const animation of animations){const element=animation.effect?.target;if(element?.contains(event.target)){animation.finish();animations.delete(animation);}}};
   window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);root.addEventListener('focusin',finishFocused);
   dispose=()=>{observer.disconnect();artObserver.disconnect();cancelAnimationFrame(frame);animations.forEach(animation=>animation.cancel());arts.forEach(element=>element.style.removeProperty('translate'));window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);root.removeEventListener('focusin',finishFocused);};
  }
  setup();preference.addEventListener('change',setup);
  return()=>{dispose();preference.removeEventListener('change',setup);};
 },[rootRef,styles]);
}
