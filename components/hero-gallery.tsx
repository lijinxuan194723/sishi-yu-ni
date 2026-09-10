'use client';
import {useEffect,useState,type ReactNode} from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import {seasonAlbums} from '@/lib/season-albums';
export function HeroGallery({season,children}:{season:keyof typeof seasonAlbums;children:ReactNode}){
 const [viewport,carousel]=useEmblaCarousel({loop:true,container:'.hero-track',slides:'.hero-slide',duration:28,watchDrag:(_api,event)=>!(event.target as HTMLElement)?.closest('button,input,a')});
 const [selected,setSelected]=useState(0);
 useEffect(()=>{if(!carousel)return;const update=()=>setSelected(carousel.selectedScrollSnap());update();carousel.on('select',update);carousel.on('reInit',update);return()=>{carousel.off('select',update);carousel.off('reInit',update);};},[carousel]);
 useEffect(()=>{if(!carousel)return;carousel.reInit();const frame=requestAnimationFrame(()=>carousel.scrollTo(0,false));return()=>cancelAnimationFrame(frame);},[carousel,season]);
 return <section ref={viewport} className="hero hero-gallery" aria-label="四季相册" tabIndex={0} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowLeft'){e.preventDefault();carousel?.scrollPrev();}if(e.key==='ArrowRight'){e.preventDefault();carousel?.scrollNext();}}}><div className="hero-track">{seasonAlbums[season].map((src,i)=>{const distance=Math.abs(i-selected),near=distance<=1||distance===seasonAlbums[season].length-1;return <div className="hero-slide season-photo" key={src}><img src={src} alt={`${season==='spring'?'春':season==='summer'?'夏':season==='autumn'?'秋':'冬'}日夏彦 ${i+1}`} loading={near?'eager':'lazy'} decoding="async" draggable={false}/></div>;})}</div>{children}</section>;
}
