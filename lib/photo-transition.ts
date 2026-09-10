function reducedMotion(){return typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;}

export async function swapPhoto(front:HTMLImageElement,back:HTMLImageElement,src:string,position:string,signal?:AbortSignal){
 if(signal?.aborted)return false;
 back.getAnimations?.().forEach(animation=>animation.cancel());
 front.getAnimations?.().forEach(animation=>animation.cancel());
 front.style.opacity='1';front.style.zIndex='1';
 back.style.opacity='0';back.style.zIndex='2';back.style.objectPosition=position;back.src=src;
 await back.decode();
 if(signal?.aborted)return false;
 const duration=reducedMotion()?0:420;
 if(!duration){back.style.opacity='1';back.style.zIndex='1';front.style.opacity='0';front.style.zIndex='0';return true;}
 const incoming=back.animate([{opacity:0},{opacity:1}],{duration,easing:'cubic-bezier(.22,.72,.24,1)',fill:'forwards'});
 const outgoing=front.animate([{opacity:1},{opacity:0}],{duration,easing:'cubic-bezier(.22,.72,.24,1)',fill:'forwards'});
 let aborted=false;
 const abort=()=>{aborted=true;incoming.cancel();outgoing.cancel();front.style.opacity='1';front.style.zIndex='1';back.style.opacity='0';back.style.zIndex='0';};
 signal?.addEventListener('abort',abort,{once:true});
 try{await Promise.all([incoming.finished,outgoing.finished]);}catch{if(aborted||signal?.aborted)return false;throw Error('图片切换被中断');}finally{signal?.removeEventListener('abort',abort);}
 if(signal?.aborted)return false;
 back.style.opacity='1';back.style.zIndex='1';front.style.opacity='0';front.style.zIndex='0';incoming.cancel();outgoing.cancel();
 return true;
}
