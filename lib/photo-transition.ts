export async function swapPhoto(front:HTMLImageElement,back:HTMLImageElement,src:string,position:string,cancelled:()=>boolean){
 // CSS opacity transitions must not run a second fade during the handoff.
 front.style.setProperty('transition','none','important');
 back.style.setProperty('transition','none','important');
 back.style.opacity='0';back.style.zIndex='1';back.style.objectPosition=position;back.src=src;
 await back.decode();
 if(cancelled())return false;
 // Both writes are painted together, after decode; the old frame stays until then.
 back.style.opacity='1';back.style.zIndex='0';front.style.opacity='0';
 return true;
}
