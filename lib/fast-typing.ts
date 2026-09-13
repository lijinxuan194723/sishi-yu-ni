export function fastTyping(publish:(text:string)=>void,signal?:AbortSignal){
 let target='',shown='',timer:ReturnType<typeof setTimeout>|undefined,done:(()=>void)|undefined;
 function flush(){if(timer)clearTimeout(timer);timer=undefined;shown=target;publish(shown);done?.();done=undefined;}
 function tick(){
  timer=undefined;
  if(signal?.aborted||(typeof document!=='undefined'&&document.hidden)){flush();return;}
  if(shown.length<target.length){shown+=String.fromCodePoint(target.codePointAt(shown.length)!);publish(shown);}
  if(shown.length<target.length)timer=setTimeout(tick,8);else{done?.();done=undefined;}
 }
 return {update(text:string){target=text;if(!target.startsWith(shown))shown='';if(!timer)tick();},async finish(){if(signal?.aborted)flush();if(shown!==target)await new Promise<void>(resolve=>{done=resolve;});if(timer)clearTimeout(timer);}};
}
