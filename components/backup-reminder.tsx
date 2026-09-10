'use client';
import {useEffect,useState} from 'react';
export function BackupReminder(){
 const [stamp,setStamp]=useState(0),[dismissed,setDismissed]=useState(0);
 useEffect(()=>{const update=()=>{try{setStamp(Number(localStorage.getItem('luke-backup-confirmed'))||0);setDismissed(Number(localStorage.getItem('luke-backup-reminded'))||0);}catch{}};update();window.addEventListener('luke-backup-saved',update);return()=>window.removeEventListener('luke-backup-saved',update);},[]);
 const now=Date.now(),due=now-Math.max(stamp,dismissed)>14*86400000;
 return <div className="backup-reminder"><small>{stamp?'最近确认备份：'+new Date(stamp).toLocaleDateString('zh-CN'):'尚未确认过数据备份'}</small>{due&&<p>给这些小日常留一份备份吧。<button className="text-button" onClick={()=>{localStorage.setItem('luke-backup-reminded',String(now));setDismissed(now);}}>两周后再提醒</button></p>}<button className="text-button" onClick={()=>{if(window.confirm('确认备份文件已经保存到你选择的位置？')){localStorage.setItem('luke-backup-confirmed',String(now));setStamp(now);}}}>我已确认备份文件</button></div>;
}
