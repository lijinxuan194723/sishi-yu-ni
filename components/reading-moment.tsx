'use client';
import type {Data} from '@/lib/companion';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {useState} from 'react';
import {BookOpen,ChevronLeft,ChevronRight,Pencil} from 'lucide-react';
export const readingBooks=[
 {title:'活着',author:'余华',kind:'小说',about:'跟着福贵的一生，读普通人在生活变故中的坚持与牵挂。',thought:'如果读到难过的地方，就先停一停。可以聊聊书里哪个小细节让你舍不得翻页。',source:'https://www.qzlib.com.cn/opac/book/900111169'},
 {title:'海子诗全集',author:'海子',kind:'诗歌',about:'从短诗到长诗，慢慢走近海子笔下的土地、麦地和远方。',thought:'诗不必一下读懂。挑一个留在脑海里的画面，写下它让你想起了什么。',source:'https://cir.nii.ac.jp/crid/1970023484937140627/holdings'},
 {title:'许三观卖血记',author:'余华',kind:'小说',about:'透过许三观与家人的日常，看看困境中的承担、亲情与生活韧性。',thought:'读完一段，想想人物做出的选择。我们不急着给他一个结论。',source:'https://www.thepaper.cn/newsDetail_forward_12655799'},
] as const;
export function ReadingMoment({onNote,data,save}:{onNote:(text:string)=>void;data:Data;save:(patch:Partial<Data>)=>void}){
 const [index,setIndex]=useState(0),[editing,setEditing]=useState(false),[title,setTitle]=useState(''),[author,setAuthor]=useState(''),[progress,setProgress]=useState(''),[thought,setThought]=useState('');
 const books=[...readingBooks,...(data.books??[]).filter(b=>!readingBooks.some(r=>r.title===b.title&&r.author===b.author)).map(b=>({...b,kind:'我的书',about:b.progress||'还没有记录进度',thought:b.thought||'',source:''}))];
 const book=books[Math.min(index,books.length-1)],reading=data.reading,same=(b:{title:string;author:string})=>b.title===book.title&&b.author===book.author;
 const saved=data.books?.find(same)??(reading&&same(reading)?reading:undefined);
 function edit(add=false){setTitle(add?'':book.title);setAuthor(add?'':book.author);setProgress(add?'':saved?.progress??'');setThought(add?'':saved?.thought??'');setEditing(true);}
 return <section className="reading-moment"><div className="section-label"><BookOpen size={18}/> 最近在读 <button onClick={()=>edit(true)}>添加书籍</button></div>
 <div className="reading-book" key={book.title+book.author}><div className="book-spine" aria-hidden="true">{book.kind}</div><div><h3>《{book.title}》</h3><small>{book.author} · {book.kind}</small><p>{saved?.progress||book.about}</p></div></div>
 <p className="reading-thought">{saved?.thought||book.thought||'把读到的那一刻留在这里。'}</p>
 <div className="reading-actions"><button className="round" aria-label="上一本书" onClick={()=>setIndex((index+books.length-1)%books.length)}><ChevronLeft size={18}/></button><small>{index+1} / {books.length}</small><button className="round" aria-label="下一本书" onClick={()=>setIndex((index+1)%books.length)}><ChevronRight size={18}/></button><button className="soft-button" onClick={()=>onNote(`读《${book.title}》 · ${book.author}\n${saved?.progress??''}\n${saved?.thought??''}\n`)}><Pencil size={15}/> 写点读后感</button></div>
 <div className="reading-actions"><button className="soft-button" aria-pressed={!!reading&&same(reading)} onClick={()=>save({reading:reading&&same(reading)?undefined:{...saved,title:book.title,author:book.author,updatedAt:new Date().toISOString()}})}>{reading&&same(reading)?'正在读 · 结束阅读':'设为正在读'}</button><button className="soft-button" onClick={()=>edit()}>更新进度</button>{reading&&<small>正在读：《{reading.title}》</small>}</div>
 <Dialog open={editing} onOpenChange={setEditing}><DialogContent className="settings book-dialog"><DialogTitle>书籍与阅读进度</DialogTitle><DialogDescription>填写书名和作者，进度与感想可以稍后补充。</DialogDescription><form className="settings-stack reading-editor" onSubmit={e=>{e.preventDefault();if(!title.trim()||!author.trim())return;const entry={title:title.trim(),author:author.trim(),progress:progress.trim(),thought:thought.trim(),updatedAt:new Date().toISOString()};const entries=[...(data.books??[]).filter(b=>b.title!==entry.title||b.author!==entry.author),entry];save({books:entries,reading:entry});setEditing(false);setIndex(readingBooks.findIndex(b=>b.title===entry.title&&b.author===entry.author)>=0?readingBooks.findIndex(b=>b.title===entry.title&&b.author===entry.author):readingBooks.length+entries.filter(b=>!readingBooks.some(r=>r.title===b.title&&r.author===b.author)).length-1);}}>
 <label>书名<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="例如：活着"/></label><label>作者<input required maxLength={80} value={author} onChange={e=>setAuthor(e.target.value)} placeholder="例如：余华"/></label><label>阅读进度<input maxLength={80} value={progress} onChange={e=>setProgress(e.target.value)} placeholder="例如：第 3 章 / 第 52 页"/></label><label>这一刻的感想<textarea maxLength={1000} value={thought} onChange={e=>setThought(e.target.value)} rows={3}/></label><div className="reading-actions"><button type="button" className="soft-button" onClick={()=>setEditing(false)}>取消</button><button className="primary">保存并设为正在读</button></div></form></DialogContent></Dialog>
 {book.source&&<details><summary>关于这本书</summary><p>共读文字为原创，不是书中摘录，也不是夏彦的官方阅读设定。<a href={book.source} target="_blank" rel="noreferrer">查看书目信息 ↗</a></p></details>}</section>;
}
