'use client';
import {useEffect} from 'react';

function splashMarkup(){
 return `<div class="startup-splash-core" aria-hidden="true">
  <div class="startup-orbit startup-orbit-a"></div>
  <div class="startup-orbit startup-orbit-b"></div>
  <div class="startup-particles">${Array.from({length:12},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>
  <div class="startup-mark">
   <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="39" cy="23" r="11" fill="none" stroke="currentColor" stroke-width="3.2"/><path d="M31 31 14 48v8h8v-6h6v-6h6v-6l5-5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="42.5" cy="19.5" r="1.8" fill="currentColor"/></svg>
  </div>
  <div class="startup-copy"><span>THROUGH THE SEASONS</span><h1>四时与你</h1><p>和夏彦一起，把日常慢慢珍藏</p></div>
  <div class="startup-season-word"></div>
 </div>`;
}

export function useStartup(ready:boolean){
 useEffect(()=>{
  const pointer=()=>{delete document.documentElement.dataset.keyboardFocus;};
  const keyboard=(event:KeyboardEvent)=>{if(event.key==='Tab')document.documentElement.dataset.keyboardFocus='true';};
  document.addEventListener('pointerdown',pointer,true);
  document.addEventListener('keydown',keyboard,true);
  let last=0;
  const tap=(event:MouseEvent)=>{
   if(!event.isTrusted)return;
   const button=(event.target as Element)?.closest('button,[role="button"],input[type="checkbox"],input[type="radio"]');
   if(!button||button.matches(':disabled,[aria-disabled="true"]'))return;
   const now=performance.now();if(now-last<70)return;last=now;
   window.LukeAndroid?.haptic?.();
  };
  document.addEventListener('click',tap,true);
  return()=>{document.removeEventListener('click',tap,true);document.removeEventListener('pointerdown',pointer,true);document.removeEventListener('keydown',keyboard,true);};
 },[]);
 useEffect(()=>{
  if(!ready||document.documentElement.dataset.started)return;
  let cancelled=false,leaveTimer=0,navTimer=0,fallbackTimer=0,cleanupTimer=0;
  const root=document.documentElement;
  root.dataset.startupPhase='cover';
  root.dataset.startupNav='hidden';
  const splash=document.createElement('div');
  splash.className='startup-splash';
  splash.setAttribute('role','status');
  splash.setAttribute('aria-label','四时与你正在开启');
  splash.innerHTML=splashMarkup();
  document.body.appendChild(splash);
  const finish=()=>{
   if(cancelled||root.dataset.started)return;
   root.dataset.started='true';root.dataset.startupPhase='done';root.dataset.startupNav='show';splash.remove();
   cleanupTimer=window.setTimeout(()=>{if(cancelled)return;delete root.dataset.startupPhase;delete root.dataset.startupNav;},80);
  };
  const onTransitionEnd=(event:TransitionEvent)=>{if(event.target===splash&&event.propertyName==='transform')finish();};
  splash.addEventListener('transitionend',onTransitionEnd);
  void (async()=>{
   const photo=document.querySelector<HTMLImageElement>('.hero .season-photo img[src]');
   try{await photo?.decode();}catch{/* A missing photo must not block the app. */}
   await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   if(cancelled)return;
   splash.dataset.show='true';
   window.LukeAndroid?.pageReady?.();
   const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   leaveTimer=window.setTimeout(()=>{
    if(cancelled)return;
    root.dataset.startupPhase='handoff';splash.dataset.leave='true';
    navTimer=window.setTimeout(()=>{if(!cancelled)root.dataset.startupNav='show';},reduced?40:110);
    fallbackTimer=window.setTimeout(finish,reduced?260:760);
   },reduced?260:820);
  })();
  return()=>{cancelled=true;clearTimeout(leaveTimer);clearTimeout(navTimer);clearTimeout(fallbackTimer);clearTimeout(cleanupTimer);splash.removeEventListener('transitionend',onTransitionEnd);splash.remove();delete root.dataset.startupPhase;delete root.dataset.startupNav;};
 },[ready]);
}
