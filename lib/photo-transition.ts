export async function swapPhoto(front:HTMLImageElement,back:HTMLImageElement,src:string,position:string,cancelled:()=>boolean){
 back.style.opacity='0';back.style.zIndex='1';back.style.objectPosition=position;back.src=src;
 await back.decode();
 if(cancelled())return false;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 // Keep the outgoing frame fully opaque until the incoming frame has finished.
 const fade=back.animate([{opacity:0},{opacity:1}],{duration:reduced?0:650,easing:'linear',fill:'forwards'});
 try{await fade.finished;}catch{return false;}
 back.style.opacity='1';back.style.zIndex='0';front.style.opacity='0';fade.cancel();
 return true;
}
