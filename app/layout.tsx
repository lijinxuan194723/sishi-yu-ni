import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'夏日来信 · 夏彦与你',description:'属于夏彦和你的日常：悄悄话、日历与时光手记。',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'夏日来信',statusBarStyle:'default'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
