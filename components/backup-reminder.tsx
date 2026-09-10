'use client';
import {useEffect,useState} from 'react';
import {legacyAppInstalled,openLegacyApp} from '@/lib/mobile';
export function BackupReminder(){
 const [stamp,setStamp]=useState(0),[dismissed,setDismissed]=useState(0),[legacy,setLegacy]=useState(false);
 useEffect(()=>{const update=()=>{try{setStamp(Number(localStorage.getItem('luke-backup-confirmed'))||0);setDismissed(Number(localStorage.getItem('luke-backup-reminded'))||0);}catch{}};update();setLegacy(legacyAppInstalled());window.addEventListener('luke-backup-saved',update);return()=>window.removeEventListener('luke-backup-saved',update);},[]);
 const now=Date.now(),due=now-Math.max(stamp,dismissed)>14*86400000;
 return <div className="backup-reminder">
  {legacy&&<div className="legacy-data-rescue" role="status"><strong>检测到旧版“ 四时与你 ”</strong><p>旧版使用的是另一个 Android 数据空间。旧聊天和手记不会自动出现在新版里。请先打开旧版，在“设置 → 日常与数据”导出“软件完整备份”，再回到这里用“从备份恢复”导入。</p><button type="button" className="soft-button" onClick={openLegacyApp}>打开旧版，导出原数据</button><small>不要卸载旧版，也不要清除旧版应用数据，直到确认备份已经恢复成功。</small></div>}
  <small>{stamp?'最近确认备份：'+new Date(stamp).toLocaleDateString('zh-CN'):'尚未确认过数据备份'}</small>{due&&<p>给这些小日常留一份备份吧。<button className="text-button" onClick={()=>{localStorage.setItem('luke-backup-reminded',String(now));setDismissed(now);}}>两周后再提醒</button></p>}<button className="text-button" onClick={()=>{if(window.confirm('确认备份文件已经保存到你选择的位置？')){localStorage.setItem('luke-backup-confirmed',String(now));setStamp(now);}}}>我已确认备份文件</button>
 </div>;
}
