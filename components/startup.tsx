'use client';
import {useEffect} from 'react';


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
  const root=document.documentElement;
  root.dataset.started='true';
  window.LukeAndroid?.pageReady?.();
 },[ready]);
}
