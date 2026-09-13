'use client';
import {useMemo,useState} from 'react';
import {LUKE_KNOWLEDGE,lukeKnowledgeStats} from '@/lib/luke-knowledge';
import {LUKE_MEMORY_V2_RECORDS} from '@/data/luke/memory-v2';
export function LukeMemorySettings(){
 const records=useMemo(()=>[...LUKE_KNOWLEDGE.map(r=>({id:r.id,title:r.id,fact:r.fact,category:r.category,scope:r.canonScope,confidence:r.canonLevel,period:r.period,source:r.sourceIds.join('、')})),...LUKE_MEMORY_V2_RECORDS.map(r=>({id:r.id,title:r.title,fact:r.summary,category:'增强记忆',scope:r.scope,confidence:r.confidence,period:'未限定',source:r.source}))],[ ]);
 const [query,setQuery]=useState(''),[category,setCategory]=useState('全部'),[disabled,setDisabled]=useState<Set<string>>(()=>new Set(typeof window==='undefined'?[]:JSON.parse(localStorage.getItem('luke-disabled-memory-v1')||'[]')));
 const categories=[...new Set(records.map(r=>r.category))],visible=records.filter(r=>(category==='全部'||r.category===category)&&(!query||JSON.stringify(r).toLocaleLowerCase().includes(query.toLocaleLowerCase())));
 return <div className="settings-stack luke-memory-settings"><p>角色事实仅用于保持夏彦的人物和行为一致，不会被当作你的真实经历。当前共 {records.length} 条，原作知识 {lukeKnowledgeStats().total} 条。</p><input aria-label="搜索夏彦记忆" placeholder="搜索记忆、标签或来源" value={query} onChange={e=>setQuery(e.target.value)}/><select value={category} onChange={e=>setCategory(e.target.value)}><option>全部</option>{categories.map(c=><option key={c}>{c}</option>)}</select><div className="luke-memory-list">{visible.map(r=><details key={r.id} className={disabled.has(r.id)?'memory-disabled':''}><summary><strong>{r.title}</strong><small>{r.confidence} · {r.scope}</small></summary><p>{r.fact}</p><small>分类：{r.category} · 阶段：{r.period} · 来源：{r.source}</small><button className="soft-button" onClick={()=>setDisabled(v=>{const n=new Set(v);n.has(r.id)?n.delete(r.id):n.add(r.id);localStorage.setItem('luke-disabled-memory-v1',JSON.stringify([...n]));return n;})}>{disabled.has(r.id)?'启用记忆':'停用记忆'}</button></details>)}</div></div>;
}

