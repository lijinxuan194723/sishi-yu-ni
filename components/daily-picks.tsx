'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {ModelConfig} from '@/lib/model';
import {dailyPicksStale,generateDailyPicks,loadDailyPicks,saveDailyPicks,type DailyPicks} from '@/lib/daily-picks';

export type DailyState={picks?:DailyPicks;loading:boolean;error:string;refresh:()=>void};

function usable(config:ModelConfig|undefined):config is ModelConfig{
 return !!config&&!!config.baseUrl.trim()&&!!config.model.trim()&&!!config.key.trim();
}

/**
 * 每日推荐：打开应用时读本地缓存，若缓存不是今天的就用内置模型 API 生成一份新的。
 * 没有配置模型、或请求失败时保留空状态，界面回退到内置的本地内容。
 */
export function useDailyPicks(config:ModelConfig|undefined,enabled:boolean,context:string):DailyState{
 const [picks,setPicks]=useState<DailyPicks|undefined>(undefined);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const busy=useRef(false);

 const refresh=useCallback(async(force:boolean)=>{
  if(!usable(config)||busy.current)return;
  const cached=loadDailyPicks();
  if(!force&&!dailyPicksStale(cached))return;
  busy.current=true;
  setLoading(true);
  setError('');
  try{
   const next=await generateDailyPicks(config,context);
   saveDailyPicks(next);
   setPicks(next);
  }catch(e){
   setError(e instanceof Error?e.message:'今天的推荐暂时取不到，先用内置的内容。');
  }finally{
   busy.current=false;
   setLoading(false);
  }
 },[config,context]);

 useEffect(()=>{
  const cached=loadDailyPicks();
  const fresh=cached&&!dailyPicksStale(cached)?cached:undefined;
  if(fresh)setPicks(fresh);
  if(enabled&&usable(config)&&!fresh)void refresh(false);
 },[enabled,config,refresh]);

 return {picks,loading,error,refresh:()=>{void refresh(true);}};
}
