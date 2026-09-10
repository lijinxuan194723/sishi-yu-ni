'use client';
import { useEffect } from 'react';
import { flushSync } from 'react-dom';
type Context = {registerTool:(tool:{name:string;title:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>unknown};
export function usePageTool(navigate:(page:string)=>void){
 useEffect(()=>{const context=(document as Document & {modelContext?:Context}).modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();
 try{Promise.resolve(context.registerTool({name:'open_companion_page',title:'打开夏日来信页面',description:'打开首页、悄悄话、他的此刻、日历、手记或计时，不创建或更改记录。',inputSchema:{type:'object',properties:{page:{type:'string',enum:['home','chat','heart','calendar','notes','timers']}},required:['page'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){const page=(input as {page?:unknown})?.page;if(typeof page!=='string'||!['home','chat','heart','calendar','notes','timers'].includes(page))throw Error('未知页面');flushSync(()=>navigate(page));return {page};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
 return ()=>lifecycle.abort();
 },[navigate]);
}
