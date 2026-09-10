'use client';
import {useEffect} from 'react';
import {isAndroid} from '@/lib/mobile';
export function useKeyboardLayout(){useEffect(()=>{
 if(isAndroid())return;
 const viewport=window.visualViewport;if(!viewport)return;
 let baseline=window.innerHeight;
 const update=()=>{const editing=document.activeElement?.matches('textarea,input:not([type=checkbox]):not([type=radio]),[contenteditable=true]');if(!editing)baseline=window.innerHeight;const open=!!editing&&baseline-viewport.height>100;document.documentElement.dataset.keyboard=String(open);if(open)document.documentElement.style.setProperty('--keyboard-height',viewport.height+'px');else document.documentElement.style.removeProperty('--keyboard-height');};
 viewport.addEventListener('resize',update);document.addEventListener('focusin',update);document.addEventListener('focusout',update);update();return()=>{viewport.removeEventListener('resize',update);document.removeEventListener('focusin',update);document.removeEventListener('focusout',update);};
 },[]);}
