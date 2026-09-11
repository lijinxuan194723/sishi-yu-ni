import {complete,type ChatMessage,type ModelConfig} from './model.ts';
import {dateKey} from './companion.ts';

// 每天打开应用时，用内置的模型 API 生成一份「今日歌单」和一本「今日在读」，
// 按日期缓存在本地。当天已生成过就直接用缓存，不重复请求。

export type DailySong={title:string;artist:string};
export type DailyBook={title:string;author:string;kind:string;about:string;thought:string};
export type DailyPicks={date:string;songs:DailySong[];book:DailyBook;updatedAt:string};

const STORAGE_KEY='luke-daily-picks-v1';
const MIN_SONGS=6;
const MAX_SONGS=20;

const SYSTEM_PROMPT=[
 '你是「四时与你」中角色夏彦的日常推荐助手。',
 '用户每天打开应用时，你要为今天挑一份随身歌单和一本在读的书。',
 '要求：',
 '1. 歌单 8 到 10 首，以华语独立、民谣、摇滚为主，整体气质安静、克制、适合一个人慢慢听；歌名和演唱者必须真实准确。',
 '2. 只推荐一首书，必须是真实存在的出版物，给出准确书名与作者。',
 '3. about 用两三句自己的话概括这本书，不要摘抄原文；thought 是一句留给用户的阅读提示。',
 '4. 不要重复推荐同一批歌，每天尽量有变化。',
 '5. 只输出一个 JSON 对象，不要解释、不要 Markdown 代码块。',
 'JSON 格式：{"songs":[{"title":"歌名","artist":"演唱者"}],"book":{"title":"书名","author":"作者","kind":"小说/诗歌/散文等","about":"简介","thought":"阅读提示"}}',
].join('\n');

function text(value:unknown,max:number){
 return typeof value==='string'&&value.trim()&&value.trim().length<=max?value.trim():undefined;
}

function parse(value:unknown):DailyPicks|undefined{
 if(!value||typeof value!=='object')return;
 const source=value as Record<string,unknown>;
 const date=text(source.date,10);
 if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
 const rawSongs=Array.isArray(source.songs)?source.songs:[];
 const songs:DailySong[]=[];
 for(const item of rawSongs.slice(0,MAX_SONGS)){
  if(!item||typeof item!=='object')continue;
  const title=text((item as Record<string,unknown>).title,120);
  const artist=text((item as Record<string,unknown>).artist,80);
  if(title&&artist)songs.push({title,artist});
 }
 if(songs.length<MIN_SONGS)return;
 const rawBook=source.book as Record<string,unknown>|undefined;
 if(!rawBook||typeof rawBook!=='object')return;
 const title=text(rawBook.title,120),author=text(rawBook.author,80);
 if(!title||!author)return;
 const book:DailyBook={
  title,
  author,
  kind:text(rawBook.kind,20)??'在读',
  about:text(rawBook.about,300)??'',
  thought:text(rawBook.thought,400)??'',
 };
 return {date,songs,book,updatedAt:text(source.updatedAt,40)??new Date().toISOString()};
}

/** 从模型回复里取出 JSON 对象，容忍 ```json 包裹和前后多余文字。 */
function extractJSON(raw:string){
 const fenced=raw.replace(/```[a-zA-Z]*\s*/g,'').replace(/```/g,'');
 const start=fenced.indexOf('{'),end=fenced.lastIndexOf('}');
 if(start<0||end<=start)throw Error('模型没有返回可用的 JSON。');
 return JSON.parse(fenced.slice(start,end+1)) as unknown;
}

export function loadDailyPicks():DailyPicks|undefined{
 if(typeof window==='undefined')return;
 try{return parse(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'));}catch{return;}
}

export function saveDailyPicks(picks:DailyPicks){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(picks));}catch{}
}

/** 缓存为空，或缓存的日期不是今天，就认为需要更新。 */
export function dailyPicksStale(picks:DailyPicks|undefined,now=new Date()){
 return !picks||picks.date!==dateKey(now);
}

export async function generateDailyPicks(config:ModelConfig,context:string,signal?:AbortSignal):Promise<DailyPicks>{
 const messages:ChatMessage[]=[
  {role:'system',content:SYSTEM_PROMPT},
  {role:'user',content:`今天是 ${dateKey(new Date())}。${context}\n请输出今天的 JSON。`},
 ];
 const reply=await complete(config,messages,signal,1600);
 const generated=extractJSON(reply) as Record<string,unknown>;
 const picks=parse({...generated,date:dateKey(new Date()),updatedAt:new Date().toISOString()});
 if(!picks)throw Error('模型返回的推荐内容不完整，已保留上一次的结果。');
 return picks;
}
