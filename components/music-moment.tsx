'use client';
import {useEffect,useState} from 'react';
import {Music2,Shuffle} from 'lucide-react';
import {songs,shuffledSongs} from '@/lib/music';

export function MusicMoment(){
 const [queue,setQueue]=useState<number[]>([]);
 useEffect(()=>{setQueue(shuffledSongs());},[]);
 const song=songs[queue[0]??0];
 return <section className="music-moment" aria-label="夏彦的随身歌单">
  <div className="section-label"><Music2 size={18}/> 夏彦的随身歌单 <small>30 首</small></div>
  <div className="song-detail" aria-live="polite"><strong>{song[0]}</strong><small>{song[1]}</small></div>
  <p>听一首歌，慢慢放松下来。</p>
  <button className="soft-button" disabled={!queue.length} onClick={()=>setQueue(q=>q.length>1?q.slice(1):shuffledSongs(q[0]))}><Shuffle size={16}/> 换一首</button>
 </section>;
}
