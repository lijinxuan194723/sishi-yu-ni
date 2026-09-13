'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {ModelConfig} from '@/lib/model';
import type {DailySong,DailyBook} from '@/lib/daily-picks';
import {dateKey} from '@/lib/companion';
import {appendHistory,generateRecommendation,migrateHistory,readHistory,type Recommendation} from '@/lib/recommendation-history';
export type DailyState={picks?:{date:string;updatedAt:string;songs:DailySong[];book?:DailyBook};loading:boolean;error:string;refresh:()=>void};
export function useDailyPicks(config:ModelConfig|undefined,enabled:boolean,context:string){
 const [history,setHistory]=useState<Recommendation[]>([]),[loading,setLoading]=useState({song:false,book:false}),[error,setError]=useState({song:'',book:''});
 const busy=useRef({song:false,book:false}),latest=useRef(context);latest.current=context;
 const request=useCallback(async(kind:'song'|'book',force=false)=>{
  if(!enabled||busy.current[kind])return;
  if(!config?.baseUrl||!config.model||!config.key){setError(v=>({...v,[kind]:'模型配置未就绪，请检查主备模型。'}));return;}
  try{if(!force&&readHistory().some(v=>v.kind===kind&&v.date===dateKey(new Date())))return;}catch{setError(v=>({...v,[kind]:'历史记录无法读取，已暂停更新以保护数据。'}));return;}
  busy.current[kind]=true;setLoading(v=>({...v,[kind]:true}));setError(v=>({...v,[kind]:''}));
  try{const result=await generateRecommendation(config,latest.current,kind);appendHistory(result);setHistory(readHistory());}
  catch(e){setError(v=>({...v,[kind]:e instanceof Error?e.message:'更新失败，历史记录已保留。'}));}
  finally{busy.current[kind]=false;setLoading(v=>({...v,[kind]:false}));}
 },[config,enabled]);
 useEffect(()=>{
  try{migrateHistory();setHistory(readHistory());}catch{setError({song:'历史读取失败，原数据已保留。',book:'历史读取失败，原数据已保留。'});return;}
  const wake=()=>{if(document.visibilityState==='visible'){void request('song');void request('book');}};
  wake();window.addEventListener('online',wake);document.addEventListener('visibilitychange',wake);
  const timer=setInterval(wake,60000);
  return()=>{clearInterval(timer);window.removeEventListener('online',wake);document.removeEventListener('visibilitychange',wake);};
 },[request]);
 function state(kind:'song'|'book'):DailyState{const item=history.find(v=>v.kind===kind);return {loading:loading[kind],error:error[kind],refresh:()=>{void request(kind,true);},picks:item?{date:item.date,updatedAt:item.updatedAt,songs:kind==='song'?[{title:item.title,artist:item.creator,thought:item.thought}]:[],book:kind==='book'?{title:item.title,author:item.creator,thought:item.thought,about:item.about??'',kind:item.bookKind??'在读'}:undefined}:undefined};}
 return {music:state('song'),reading:state('book')};
}
