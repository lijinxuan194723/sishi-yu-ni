'use client';
import {useEffect,useState} from 'react';
import {Music2,Shuffle,RefreshCw} from 'lucide-react';
import {songs} from '@/lib/music';
import type {DailyState} from '@/components/daily-picks';

type Track=[string,string];

function localTracks():Track[]{return songs.map(song=>[song[0] as string,song[1] as string]);}

function order(size:number,previous=-1){
 const list=Array.from({length:size},(_,i)=>i);
 for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
 if(size>1&&list[0]===previous)[list[0],list[1]]=[list[1],list[0]];
 return list;
}

export function MusicMoment({daily}:{daily?:DailyState}){
 const today=daily?.picks?.songs;
 const tracks:Track[]=today?.length?today.map(song=>[song.title,song.artist]):localTracks();
 const signature=`${daily?.picks?.date??''}:${tracks.length}`;
 const [queue,setQueue]=useState<number[]>([]);
 useEffect(()=>{setQueue(order(tracks.length));},[signature,tracks.length]);
 const track=tracks[queue[0]??0]??tracks[0];
 return <section className="music-moment" aria-label="夏彦的随身歌单">
  <div className="section-label"><Music2 size={18}/> 夏彦的随身歌单 <small>{daily?.picks?`今日 · ${tracks.length} 首`:`${tracks.length} 首`}</small>{daily&&<button className="round" aria-label="更新今日歌单" onClick={daily.refresh} disabled={daily.loading}><RefreshCw size={16} className={daily.loading?'spinning':''}/></button>}</div>
  <div className="song-detail" aria-live="polite"><strong>{track[0]}</strong><small>{track[1]}</small></div>
  <p>{daily?.error||'听一首歌，慢慢放松下来。'}</p>
  <button className="soft-button" disabled={!queue.length} onClick={()=>setQueue(q=>q.length>1?q.slice(1):order(tracks.length,q[0]))}><Shuffle size={16}/> 换一首</button>
 </section>;
}
