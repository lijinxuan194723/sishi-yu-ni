'use client';
import {Ambience,SeasonPhoto,useAmbience} from './ambience';
import {seasons,periods} from '@/lib/ambience';
import {useEffect} from 'react';
export function AppearanceSettings(){
 const {scene,options,setOptions,appearanceError}=useAmbience(false,true);
 useEffect(()=>{try{const photo=localStorage.getItem('luke-chat-background-v1');if(photo)document.documentElement.style.setProperty('--chat-user-background',`url(${photo})`);}catch{}},[]);
 if(!scene)return <div className="appearance-preview" aria-busy="true"/>;
 return <div className="settings-stack"><div className="appearance-preview"><SeasonPhoto season={scene?.season??"spring"}/><Ambience scene={scene}/></div><fieldset className="appearance-options"><legend>季节主题</legend><div>{(['auto',...seasons] as const).map((v,i)=><button type="button" key={v} aria-pressed={options.season===v} onClick={()=>setOptions({...options,season:v})}>{['随日期','春','夏','秋','冬'][i]}</button>)}</div></fieldset><fieldset className="appearance-options"><legend>昼夜光照</legend><div>{(['auto',...periods] as const).map(v=><button type="button" key={v} aria-pressed={options.period===v} onClick={()=>setOptions({...options,period:v})}>{v==='auto'?'随时间':v}</button>)}</div></fieldset><label className="inline-label"><input type="checkbox" role="switch" aria-checked={options.effects!==false} checked={options.effects!==false} onChange={e=>setOptions({...options,effects:e.target.checked})}/> 季节动画</label><label>悄悄话背景<input type="file" accept="image/*" onChange={e=>{const file=e.currentTarget.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const value=String(reader.result);try{localStorage.setItem('luke-chat-background-v1',value);document.documentElement.style.setProperty('--chat-user-background',`url(${value})`);}catch{};};reader.readAsDataURL(file);}}/></label>{appearanceError&&<p role="alert">{appearanceError}</p>}</div>;
}
