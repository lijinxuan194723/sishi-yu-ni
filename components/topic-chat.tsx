'use client';
import {useEffect,useRef,useState} from 'react';
import {Send,Square} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {complete,type ModelConfig} from '@/lib/model';
import {readTopicThreads,topicContext,topicKey,TOPIC_STORAGE_KEY,type Topic,type TopicThread} from '@/lib/topic-chat';

export function TopicChat({topic,config,onClose}:{topic:Topic;config:ModelConfig;onClose:()=>void}){
 const [thread,setThread]=useState<TopicThread>({messages:[],draft:''}),[ready,setReady]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[live,setLive]=useState(''),[editing,setEditing]=useState<number|null>(null),[query,setQuery]=useState('');
 const current=useRef(thread),controller=useRef<AbortController|null>(null),sending=useRef(false),pane=useRef<HTMLDivElement>(null),following=useRef(true);
 useEffect(()=>{try{const saved=readTopicThreads()[topicKey(topic)]??{messages:[],draft:''};current.current=saved;setThread(saved);setReady(true);}catch(e){setError((e as Error).message);}return()=>controller.current?.abort();},[topic]);
 useEffect(()=>{if(pane.current&&following.current)pane.current.scrollTop=pane.current.scrollHeight;},[thread.messages,live]);
 function persist(next:TopicThread){current.current=next;setThread(next);try{const all=readTopicThreads();all[topicKey(topic)]=next;localStorage.setItem(TOPIC_STORAGE_KEY,JSON.stringify(all));return true;}catch{setError('保存失败，当前内容仍在窗口中。请释放存储空间后重试保存。');return false;}}
 async function send(retry=false){
  if(!ready||sending.current||(!retry&&!current.current.draft.trim()))return;
  if(!config.baseUrl||!config.model||!config.key){setError('请先在设置中配置聊天模型。');return;}
  const editIndex=editing,edited=editIndex!==null&&!retry;
  const baseMessages=edited?current.current.messages.slice(0,editIndex):current.current.messages;
  const messages=retry?current.current.messages:[...baseMessages,{role:'user' as const,content:current.current.draft.trim()}];
  if(!persist({...current.current,messages,draft:retry?current.current.draft:''}))return;
  if(edited)setEditing(null);
  sending.current=true;setBusy(true);setError('');setLive('');following.current=true;const request=new AbortController();controller.current=request;let received='';
  try{const reply=await complete(config,topicContext(topic,messages),request.signal,1500,text=>{received=text;setLive(text);});persist({...current.current,messages:[...messages,{role:'assistant',content:reply}]});}
  catch(e){if(received)persist({...current.current,messages:[...messages,{role:'assistant',content:received}]});setError(request.signal.aborted?'已停止，收到的内容已保留。':(e as Error).message);}
  finally{sending.current=false;setBusy(false);setLive('');}
 }
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="topic-chat"><DialogTitle>{topic.title}</DialogTitle><DialogDescription>在这里接着聊，记录单独保存。</DialogDescription><details className="topic-background"><summary>查看话题</summary><p>{topic.context}</p></details><details><summary>查看会话记录（{thread.messages.length}）</summary><input placeholder="搜索会话记录" value={query} onChange={e=>setQuery(e.target.value)}/>{thread.messages.filter(m=>!query||m.content.includes(query)).map((m,i)=><p key={i}>{m.content}</p>)}</details><div className="topic-messages" role="log" ref={pane} onScroll={e=>{const p=e.currentTarget;following.current=p.scrollHeight-p.scrollTop-p.clientHeight<70;}}>{!thread.messages.length&&<p className="empty">想从哪一句开始？</p>}{thread.messages.map((m,i)=><div key={i} className={'message '+(m.role==='user'?'mine':'')}><small>{m.role==='user'?'你':'夏彦'} {m.role==='user'&&<button type="button" className="message-edit" disabled={busy} onClick={()=>{setEditing(i);persist({...current.current,draft:m.content});}}>修改</button>}</small><p>{m.content}</p></div>)}{busy&&<div className="message"><small>夏彦</small><p>{live||'正在输入…'}</p></div>}</div>{editing!==null&&<div className="edit-status" role="status">正在修改这条消息<button type="button" className="text-button" onClick={()=>{setEditing(null);persist({...current.current,draft:''});}}>取消修改</button></div>}{error&&<p role="alert">{error}<button className="text-button" onClick={()=>{if(persist(current.current))setError('');}}>重试保存</button></p>}{!busy&&thread.messages.at(-1)?.role==='user'&&<button className="soft-button" onClick={()=>void send(true)}>重试回复</button>}<form className="topic-composer" onSubmit={e=>{e.preventDefault();void send();}}><textarea aria-label="独立对话消息" rows={2} maxLength={2000} disabled={!ready} placeholder={editing!==null?'修改后发送…':'想和你聊聊…'} value={thread.draft} onChange={e=>persist({...current.current,draft:e.target.value})}/>{busy?<button type="button" className="primary" aria-label="停止独立回复" onClick={()=>controller.current?.abort()}><Square size={20}/></button>:<button className="primary" aria-label={editing!==null?'发送修改后的消息':'发送独立消息'} disabled={!ready||!thread.draft.trim()}><Send size={20}/></button>}</form></DialogContent></Dialog>;
}

