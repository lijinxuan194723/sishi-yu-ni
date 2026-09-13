'use client';
import {useEffect,useLayoutEffect,useState,useRef,type ReactNode} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import {seasonAlbums} from '@/lib/season-albums';
export function HeroGallery({season,children}:{season:keyof typeof seasonAlbums;children:ReactNode}){
 const reduced=false,gallery=useRef<HTMLElement|null>(null);
 const [viewport,carousel]=useEmblaCarousel({loop:true,container:'.hero-track',slides:'.hero-slide',duration:reduced?0:25,watchDrag:(_api,event)=>!(event.target as HTMLElement)?.closest('button,input,a')});
 const [selected,setSelected]=useState(0);
 useEffect(()=>{if(!carousel)return;const update=()=>setSelected(carousel.selectedScrollSnap());update();carousel.on('select',update);carousel.on('reInit',update);return()=>{carousel.off('select',update);carousel.off('reInit',update);};},[carousel]);
 useLayoutEffect(()=>{carousel?.reInit();carousel?.scrollTo(0,true);},[carousel,season]);
 return <section ref={node=>{viewport(node);gallery.current=node;}} className="hero hero-gallery" aria-label="四季相册" tabIndex={0} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowLeft'){e.preventDefault();carousel?.scrollPrev(!!reduced);}if(e.key==='ArrowRight'){e.preventDefault();carousel?.scrollNext(!!reduced);}}}><div className="hero-track">{seasonAlbums[season].map((src,i)=>{const distance=Math.abs(i-selected),near=distance<=1||distance===seasonAlbums[season].length-1;return <div className="hero-slide season-photo" key={src}><img src={src} alt={`${season==='spring'?'春':season==='summer'?'夏':season==='autumn'?'秋':'冬'}日夏彦 ${i+1}`} loading={near?'eager':'lazy'} decoding="async" draggable={false}/></div>;})}</div>{children}<div className="photo-navigation" aria-label="相册翻页"><button type="button" aria-label="上一张照片" onClick={()=>carousel?.scrollPrev(!!reduced)}><ChevronLeft size={16}/></button><div className="photo-dots">{seasonAlbums[season].map((src,i)=><button type="button" key={src} aria-label={`查看第 ${i+1} 张照片`} aria-current={i===selected?'true':undefined} onClick={()=>carousel?.scrollTo(i,!!reduced)}><span/></button>)}</div><span className="sr-only" role="status">第 {selected+1} 张，共 {seasonAlbums[season].length} 张</span><button type="button" aria-label="下一张照片" onClick={()=>carousel?.scrollNext(!!reduced)}><ChevronRight size={16}/></button></div></section>;
}

