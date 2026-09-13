import assert from 'node:assert/strict';
import {complete,prepareMemory} from '../../lib/model.ts';
import {emptyMemory} from '../../lib/companion.ts';
const config={baseUrl:'https://primary.example/v1',model:'first',key:'test-first',fallback:{baseUrl:'https://backup.example/v1',model:'second',key:'test-second'}};
const messages=[{role:'system',content:'夏彦与记忆'},{role:'user',content:'你好'}];
const original=globalThis.fetch;let calls=[],handler;
globalThis.fetch=async(url,options)=>{calls.push({url,body:JSON.parse(options.body),headers:options.headers});return handler(calls.length,options);};
const ok=()=>Response.json({choices:[{message:{content:'你好，我在。'}}]});
try{
 handler=ok;assert.equal(await complete(config,messages),'你好，我在。');assert.equal(calls.length,1);
 for(const status of [401,403,404,429,500]){
  calls=[];handler=n=>n===1?new Response('',{status}):ok();let text='';
  await complete(config,messages,undefined,1500,t=>text=t);assert.equal(text,'你好，我在。');assert.equal(calls.length,2);
  assert.equal(calls[1].url,'https://backup.example/v1/chat/completions');assert.equal(calls[1].headers.Authorization,'Bearer test-second');assert.equal(calls[1].body.model,'second');assert.deepEqual(calls[1].body.messages,messages);
 }
 calls=[];handler=n=>{if(n===1)throw Error('network');return ok();};await complete(config,messages);assert.equal(calls.length,2);
 calls=[];handler=()=>new Response('',{status:429});await assert.rejects(complete(config,messages),/首选模型.*备用模型/);assert.equal(calls.length,2);
 calls=[];const abort=new AbortController();handler=()=>{abort.abort();throw Error('abort');};await assert.rejects(complete(config,messages,abort.signal),/已停止/);assert.equal(calls.length,1);
 calls=[];handler=()=>new Response('data: {"choices":[{"delta":{"content":"已经输出"}}]}\n\ndata: {"error":"failed"}\n\n',{headers:{'content-type':'text/event-stream'}});
 let partial='';await assert.rejects(complete(config,messages,undefined,1500,t=>partial=t),/回复过程中/);assert.equal(partial,'已经输出');assert.equal(calls.length,1);
 calls=[];handler=n=>n===1?new Response('',{status:503}):ok();const saved=[];
 await prepareMemory({messages:Array.from({length:26},()=>({who:'me',text:'聊天'})),memory:emptyMemory},config,m=>saved.push(m));assert.equal(calls.length,2);assert.equal(saved.length,1);
 calls=[];handler=ok;await complete(config,messages);assert.equal(calls[0].body.model,'first');assert.equal(calls.length,1);
 console.log('PASS: primary preference, independent backup credentials/context, HTTP/network failover, cancellation, partial-stream preservation, both failures, memory fallback, primary retried next request');
}finally{globalThis.fetch=original;}
