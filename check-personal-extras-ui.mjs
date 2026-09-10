import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const server=createServer(async(req,res)=>{try{const root=resolve('work/mobile-web'),path=resolve(root,'.'+decodeURI(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!path.startsWith(root))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(9335,'127.0.0.1',r));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--remote-debugging-port=9336','--user-data-dir='+resolve('work/ui-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});let ws;const pending=new Map();let id=0;
try{let tabs;for(let i=0;i<50;i++){try{tabs=await(await fetch('http://127.0.0.1:9336/json')).json();break;}catch{await new Promise(r=>setTimeout(r,100));}}ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});const call=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});const js=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};







 await call('Page.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});await call('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});
 await call('Page.navigate',{url:'http://127.0.0.1:9335/'});await new Promise(r=>setTimeout(r,1200));
 await js(`localStorage.setItem('luke-companion-v1',JSON.stringify({name:'冬清',since:'2023-07-08',messages:[{who:'luke',text:'你好'}],tasks:[],notes:[],checks:[],focusLog:[{at:new Date(new Date().setHours(9,0,0,0)).toISOString(),minutes:60,group:'数学'}]}));localStorage.setItem('luke-connections-v1',JSON.stringify({model:{baseUrl:'https://example.com/v1',model:'test'}}));localStorage.setItem('luke-model-key','test-only');localStorage.removeItem('luke-backup-confirmed');localStorage.removeItem('luke-backup-reminded');location.reload()`);
 await new Promise(r=>setTimeout(r,1200));
 const click=async text=>{await js(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='${text}').click()`);await new Promise(r=>setTimeout(r,80));};
 const nav=async text=>{await js(`[...document.querySelectorAll('.main-nav button')].find(b=>b.textContent.includes('${text}')).click()`);await new Promise(r=>setTimeout(r,100));};
 const input=async(selector,value)=>{await js(`(()=>{const e=document.querySelector('${selector}');Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);};
 await nav('他的此刻');await click('添加书籍');
 await input('.reading-editor input[placeholder="例如：活着"]','测试书');await input('.reading-editor input[placeholder="例如：余华"]','测试作者');await input('.reading-editor input[placeholder="例如：第 3 章 / 第 52 页"]','第 52 页');await input('.reading-editor textarea','很喜欢这一段');
 await js("document.querySelector('.reading-editor').requestSubmit()");await new Promise(r=>setTimeout(r,100));
 assert.equal(await js("JSON.parse(localStorage.getItem('luke-companion-v1')).reading.progress"),'第 52 页');
 assert.equal(await js("JSON.parse(localStorage.getItem('luke-companion-v1')).books.length"),1);
 await js("document.querySelector('[aria-label=打开设置]').click()");await new Promise(r=>setTimeout(r,100));
 assert.ok(await js("document.querySelector('.backup-reminder').textContent.includes('备份')"));await click('两周后再提醒');assert.ok(await js("Number(localStorage.getItem('luke-backup-reminded'))>0"));
 await click('聊天近况');assert.ok(await js("document.querySelector('.context-preview').textContent.includes('测试书')"));
 await js("document.querySelectorAll('.sharing-choice input')[1].click()");await new Promise(r=>setTimeout(r,100));assert.ok(!await js("document.querySelector('.context-preview').textContent.includes('测试书')"));
 await writeFile('outputs/android/context-1.8.16.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await js("document.querySelector('[data-slot=dialog-close]').click()");await new Promise(r=>setTimeout(r,150));
 await nav('计时');await js("document.querySelector('.study-records summary').click()");await click('修改');
 await input('.study-records form input[maxlength="30"]','英语');await js("document.querySelector('.study-records form').requestSubmit()");await new Promise(r=>setTimeout(r,100));
 assert.equal(await js("JSON.parse(localStorage.getItem('luke-companion-v1')).focusLog[0].group"),'英语');
 await nav('悄悄话');
 await js(`window.calls=[];window.fetch=async(url,options)=>{window.calls.push(JSON.parse(options.body));if(window.calls.length===1){return new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('data: '+JSON.stringify({choices:[{delta:{content:'我刚才想说'}}]})+'\\n\\n'));setTimeout(()=>c.error(new Error('断网')),150);}}),{headers:{'Content-Type':'text/event-stream'}});}return Response.json({choices:[{message:{content:'接着说完。'},finish_reason:'stop'}]});};Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false});window.dispatchEvent(new Event('offline'));`);
 await input('.composer textarea','你好呀');await js("document.querySelector('.composer').requestSubmit()");await new Promise(r=>setTimeout(r,100));assert.equal(await js("window.calls.length"),0);assert.equal(await js("document.querySelector('.composer textarea').value"),'你好呀');
 await js("Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>true});window.dispatchEvent(new Event('online'));document.querySelector('.composer').requestSubmit()");await new Promise(r=>setTimeout(r,400));
 assert.equal(await js("JSON.parse(localStorage.getItem('luke-companion-v1')).messages.at(-1).interrupted"),true);
 await click('继续未完成的回复');await new Promise(r=>setTimeout(r,200));
 assert.equal(await js("window.calls.length"),2);assert.equal(await js("JSON.parse(localStorage.getItem('luke-companion-v1')).messages.filter(m=>m.who==='me').length"),1);
 assert.ok(!await js("JSON.stringify(window.calls).includes('测试书')"));assert.ok(await js("window.calls[1].messages.at(-1).content.includes('继续')"));
 assert.equal(await js("document.documentElement.scrollWidth<=innerWidth"),true);
 console.log('PASS: custom book form and persistence, sharing preview/filter, reminder snooze, study edit, offline draft, partial recovery without duplicate user message');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();}
