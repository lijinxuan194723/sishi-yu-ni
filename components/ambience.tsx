'use client';
import {memo,useMemo,startTransition,useEffect,useState,useRef,type CSSProperties} from 'react';
import {swapPhoto} from '@/lib/photo-transition';
import {Flower2,Leaf,Snowflake,Sparkles,Sunrise,Sun,Sunset,Moon} from 'lucide-react';
import {ambienceAt,seasonPhotos,seasons,autoAppearance,readAppearance,type Appearance} from '@/lib/ambience';
export function useAmbience(paused=false,preview=false){
 const [options,setOptionsState]=useState<Appearance>(autoAppearance),[loaded,setLoaded]=useState(false),[appearanceError,setAppearanceError]=useState('');
 useEffect(()=>{try{setOptionsState(readAppearance(JSON.parse(localStorage.getItem('luke-appearance-v1')||'null')));}catch{}setLoaded(true);},[]);
 function setOptions(next:Appearance){setOptionsState(next);try{localStorage.setItem('luke-appearance-v1',JSON.stringify(next));setAppearanceError('');}catch{setAppearanceError('外观已切换，但当前设备未能保存设置。');}}
 const [scene,setScene]=useState<ReturnType<typeof ambienceAt>|null>(null);
 useEffect(()=>{if(!loaded||paused)return;let alive=true;const update=async()=>{let current=options;try{if(!preview)current=readAppearance(JSON.parse(localStorage.getItem('luke-appearance-v1')||'null'));}catch{}const next=ambienceAt(new Date(),current);const target=preview?document.querySelector<HTMLElement>('.settings'):document.documentElement;if(!target)return;if(target.dataset.season!==next.season){const photo=new Image();photo.src=seasonPhotos[next.season];try{await photo.decode();}catch{}}if(!alive)return;startTransition(()=>setScene(next));target.dataset.season=next.season;target.dataset.effects=current.effects===false?'off':'on';target.dataset.manual=current.period==='auto'?'false':'true';target.dataset.night=next.night>.5?'true':'false';if(!preview)window.LukeAndroid?.systemTheme?.(next.night>.5?'#202c37':({spring:'#f3fcf7',summer:'#f2fbff',autumn:'#fff5e5',winter:'#f8f9ff'})[next.season],next.night>.5);};update();const timer=setInterval(()=>{if(!document.hidden)update();},30000);const wake=()=>{document.documentElement.dataset.paused=document.hidden?'true':'false';if(!document.hidden)update();};document.addEventListener('visibilitychange',wake);window.addEventListener('focus',update);return()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange',wake);window.removeEventListener('focus',update);};},[options,loaded,paused,preview]);
 return {scene,options,setOptions,appearanceError};
}
export const Ambience=memo(function Ambience({scene}:{scene:ReturnType<typeof ambienceAt>|null}){
 const particles=useMemo(()=>{const icons=[Flower2,Sparkles,Leaf,Snowflake];return seasons.map((season,k)=>{const Icon=icons[k];return <div className={'season-particles particles-'+season} key={season}>{Array.from({length:18},(_,i)=><span key={i} style={{'--x':`${(7+i*37)%100}%`,'--delay':`${-i*3.7}s`,'--duration':`${12+(i%6)*4}s`,'--size':`${4+(i%5)*3}px`,'--drift':`${i%2?35:-45}px`} as CSSProperties}><Icon strokeWidth={1.2}/></span>)}</div>});},[]);
 return <><div className="ambience" data-season={scene?.season} aria-hidden="true">{['morning','day','evening','night'].map((name,i)=><div key={name} className={'light-layer light-'+name} style={{opacity:scene?.lights[i]??(i===1?1:0)}}/>)}{particles}</div><div className="scene-label">{scene&&(scene.night>.5?<Moon size={15}/>:scene.period==='傍晚'?<Sunset size={15}/>:['清晨','早上'].includes(scene.period)?<Sunrise size={15}/>:<Sun size={15}/>)}<span>{scene?`${scene.seasonName} · ${scene.period}`:'夏彦与你'}</span><time>{scene?.time}</time></div></>;
});

// Two permanent image nodes. A newer request aborts the current fade instead of waiting in a queue.
export function SeasonPhoto({season,className="",src}:{season:typeof seasons[number];className?:string;src?:string}){
 const photo=src??seasonPhotos[season];
 const initialPhoto=useRef(photo);
 const first=useRef<HTMLImageElement>(null),second=useRef<HTMLImageElement>(null),initial=useRef(season),shown=useRef(photo),front=useRef(0),active=useRef<AbortController|null>(null);
 useEffect(()=>{
  active.current?.abort();
  const controller=new AbortController();active.current=controller;
  void (async()=>{
   if(shown.current===photo||!first.current||!second.current)return;
   const nodes=[first.current,second.current],position='center '+({spring:'40%',summer:'32%',autumn:'32%',winter:'40%'})[season];
   try{const changed=await swapPhoto(nodes[front.current],nodes[1-front.current],photo,position,controller.signal);if(changed&&!controller.signal.aborted){front.current=1-front.current;shown.current=photo;}}catch{/* Keep the currently visible photograph if loading fails. */}
  })();
  return()=>controller.abort();
 },[season,photo]);
 const position='center '+({spring:'40%',summer:'32%',autumn:'32%',winter:'40%'})[initial.current];
 return <div className={"season-photo "+className}><img ref={first} src={initialPhoto.current} alt="四季中的夏彦" style={{objectPosition:position}}/><img ref={second} alt="" style={{opacity:0,objectPosition:position}}/></div>;
}
