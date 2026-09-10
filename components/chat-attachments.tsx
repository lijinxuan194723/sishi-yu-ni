'use client';

import {useRef,useState} from 'react';
import {FileText,Image as ImageIcon,Paperclip,X} from 'lucide-react';
import styles from './chat-attachments.module.css';

export type ChatAttachment={id:string;name:string;kind:'image'|'text'|'file';size:number;mime:string;content:string;truncated?:boolean};

const textExt=new Set(['txt','md','markdown','json','csv','log','xml','yaml','yml','ts','tsx','js','jsx','py','java','c','cc','cpp','h','hpp','css','html','htm','sql','sh','ps1']);
const ext=(name:string)=>name.split('.').pop()?.toLowerCase()??'';
const sizeLabel=(bytes:number)=>bytes<1024?`${bytes} B`:bytes<1024*1024?`${(bytes/1024).toFixed(bytes<10240?1:0)} KB`:`${(bytes/1024/1024).toFixed(1)} MB`;

async function loadImage(file:File){
 if(file.size>12*1024*1024)throw Error('单张图片不能超过 12 MB。');
 const url=URL.createObjectURL(file),image=new Image();
 try{
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('图片无法读取。'));image.src=url;});
  const ratio=Math.min(1,900/Math.max(image.naturalWidth,image.naturalHeight));
  let width=Math.max(1,Math.round(image.naturalWidth*ratio)),height=Math.max(1,Math.round(image.naturalHeight*ratio));
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('图片处理失败。');
  for(const scale of [1,.82,.68])for(const quality of [.68,.56,.46]){
   canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
   ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
   const data=canvas.toDataURL('image/jpeg',quality);if(data.length<=115000)return data;
  }
  throw Error('图片压缩后仍然过大，请换一张尺寸更小的图片。');
 }finally{URL.revokeObjectURL(url);}
}

async function prepare(file:File):Promise<ChatAttachment>{
 const id=crypto.randomUUID(),mime=file.type||'application/octet-stream';
 if(mime.startsWith('image/'))return{id,name:file.name||'图片',kind:'image',size:file.size,mime:'image/jpeg',content:await loadImage(file)};
 if(mime.startsWith('text/')||textExt.has(ext(file.name))){
  if(file.size>512*1024)throw Error(`“${file.name}”超过 512 KB，请选择更小的文本文件。`);
  const raw=await file.text(),truncated=raw.length>30000;
  return{id,name:file.name||'文本文件',kind:'text',size:file.size,mime,content:raw.slice(0,30000),...(truncated?{truncated:true}:{})};
 }
 return{id,name:file.name||'文件',kind:'file',size:file.size,mime,content:''};
}

export function storedChatText(text:string,items:ChatAttachment[]){
 const labels=items.map(item=>item.kind==='image'?`[图片：${item.name}]`:`[文件：${item.name}]`);
 return [text.trim(),...labels].filter(Boolean).join('\n')||'发送了附件';
}

export function attachmentChatContent(text:string,items:ChatAttachment[]):any{
 const sections:string[]=[];
 if(text.trim())sections.push(text.trim());
 for(const item of items){
  if(item.kind==='text')sections.push(`[文本附件：${item.name}${item.truncated?'（内容过长，仅发送前 30000 字符）':''}]\n${item.content}`);
  else if(item.kind==='file')sections.push(`[文件附件：${item.name}，${sizeLabel(item.size)}。当前通用 Chat Completions 接口不能直接读取此二进制文件，只能看到文件信息。]`);
 }
 if(!sections.length)sections.push('请看看我发的附件。');
 const images=items.filter(item=>item.kind==='image');
 if(!images.length)return sections.join('\n\n');
 return [{type:'text',text:sections.join('\n\n')},...images.map(item=>({type:'image_url',image_url:{url:item.content,detail:'low'}}))];
}

export function useChatAttachments(setError:(message:string)=>void){
 const [items,setItems]=useState<ChatAttachment[]>([]),[loading,setLoading]=useState(false);
 async function add(files:FileList|null){
  if(!files?.length)return;
  const selected=[...files];
  if(items.length+selected.length>3){setError('一次最多添加 3 个附件。');return;}
  if(items.some(i=>i.kind==='image')||selected.filter(f=>f.type.startsWith('image/')).length>1){setError('一次最多添加 1 张图片，其余可以添加文本或文件。');return;}
  setLoading(true);setError('');
  try{const next:ChatAttachment[]=[];for(const file of selected)next.push(await prepare(file));setItems(current=>[...current,...next]);}
  catch(e){setError(e instanceof Error?e.message:'附件读取失败。');}
  finally{setLoading(false);}
 }
 return{items,loading,add,remove:(id:string)=>setItems(current=>current.filter(item=>item.id!==id)),clear:()=>setItems([])};
}

export function ChatAttachmentPicker({items,loading,onAdd,onRemove,disabled}:{items:ChatAttachment[];loading:boolean;onAdd:(files:FileList|null)=>void;onRemove:(id:string)=>void;disabled?:boolean}){
 const input=useRef<HTMLInputElement>(null);
 return <>
  {!!items.length&&<div className={styles.tray}>{items.map(item=><div className={styles.item} key={item.id}>{item.kind==='image'?<img src={item.content} alt=""/>:<span className={styles.fileIcon}><FileText size={18}/></span>}<div><strong>{item.name}</strong><small>{item.kind==='file'?'文件信息 · ':item.kind==='text'?'文本 · ':'图片 · '}{sizeLabel(item.size)}</small></div><button type="button" aria-label={`移除附件 ${item.name}`} onClick={()=>onRemove(item.id)}><X size={15}/></button></div>)}</div>}
  <button type="button" className={styles.attach} aria-label="添加图片或文件" title="添加图片或文件" disabled={disabled||loading} onClick={()=>input.current?.click()}>{loading?<span className={styles.loading}/>:<Paperclip size={20}/>}</button>
  <input ref={input} className={styles.input} type="file" multiple accept="image/*,.txt,.md,.markdown,.json,.csv,.log,.xml,.yaml,.yml,.ts,.tsx,.js,.jsx,.py,.java,.c,.cc,.cpp,.h,.hpp,.css,.html,.htm,.sql,.sh,.ps1,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={e=>{onAdd(e.currentTarget.files);e.currentTarget.value='';}}/>
 </>;
}
