'use client';
import {useEffect,useRef,useState} from 'react';
import {parseData,type Data} from './companion';
const key='luke-companion-v1';
export function useLocalData(initial:Data){
 const [data,setData]=useState(initial),[ready,setReady]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('正在读取本地记忆'),[tick,setTick]=useState(0);const saved=useRef<string|null>(null);
 useEffect(()=>{try{const raw=localStorage.getItem(key);saved.current=raw;if(raw)setData(parseData(raw));setReady(true);}catch{setError('原有存档无法读取，暂不覆盖。请先导出原始存档。');setStatus('本地记忆未载入');}
 const changed=(e:StorageEvent)=>{if(e.key===key&&e.newValue!==saved.current){setReady(false);setError('另一个页面修改了存档。请导出本页备份，再重新载入，避免覆盖。');setStatus('检测到另一个页面的更改');}};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[]);
 useEffect(()=>{if(!ready)return;const payload=JSON.stringify(data);if(payload===saved.current){setStatus('已保存在本地');return;}try{if(localStorage.getItem(key)!==saved.current){setReady(false);throw Error('另一个页面已更新存档，请导出本页备份后重新载入。');}localStorage.setItem(key,payload);saved.current=payload;setStatus('已保存在本地');setError('');}catch(e){setStatus('保存未完成');setError(e instanceof Error?e.message:'保存失败，请导出备份后重试。');}},[data,ready,tick]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(ready&&JSON.stringify(data)!==saved.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[data,ready]);
 const save=(patch:Partial<Data>|((current:Data)=>Partial<Data>))=>{if(ready)setData(current=>({...current,...(typeof patch==='function'?patch(current):patch)}));};
 function reload(){if(window.confirm('重新载入会放弃本页未保存的更改。请先导出备份。继续吗？'))window.location.reload();}
 const restore=(value:Data)=>{saved.current=localStorage.getItem(key);setData(value);setReady(true);};
 return {data,setData,restore,ready,error,setError,status,save,reload,retry:()=>{if(ready)setTick(t=>t+1);else window.location.reload();}};
}
