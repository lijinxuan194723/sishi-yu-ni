import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const server=createServer(async(req,res)=>{try{const root=resolve('work/mobile-web'),path=resolve(root,'.'+decodeURI(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!path.startsWith(root))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(9335,'127.0.0.1',r));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--remote-debugging-port=9336','--user-data-dir='+resolve('work/ui-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});let ws;const pending=new Map();let id=0;
try{let tabs;for(let i=0;i<50;i++){try{tabs=await(await fetch('http://127.0.0.1:9336/json')).json();break;}catch{await new Promise(r=>setTimeout(r,100));}}ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});const call=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});const js=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};




 await call('Page.enable');
 await call('Emulation.setDeviceMetricsOverride',{width:412,height:892,deviceScaleFactor:1,mobile:true});
 await call('Page.navigate',{url:'http://127.0.0.1:9335/'});await new Promise(r=>setTimeout(r,1400));
 await js(`localStorage.setItem('luke-companion-v1',JSON.stringify({name:'测试',since:'2023-07-08',birthday:'2002-10-05',messages:Array.from({length:35},(_,i)=>({who:i%2?'me':'luke',text:'测试聊天 '+i+'，今天一起认真生活。'.repeat(8)})),draft:'待续草稿',tasks:[{id:'1',date:'2026-09-09',text:'散步',done:false}],notes:[{date:'2026-09-09',text:'今天很开心'}],checks:[],anniversaries:[{id:'1',date:'2023-07-08',title:'初见'}],focusLog:[{at:'2026-09-09T10:00:00Z',minutes:25,group:'数学'}]}));location.reload()`);
 await new Promise(r=>setTimeout(r,1400));
 const chat=async()=>{await js("[...document.querySelectorAll('.main-nav button')].find(b=>b.textContent.includes('悄悄话')).click()");await new Promise(r=>setTimeout(r,150));};
 await chat();
 assert.equal(await js("document.querySelector('.composer textarea').value"),'待续草稿');
 assert.deepEqual(await js("[document.querySelector('.composer textarea'),document.querySelector('.composer>.primary')].map(e=>e.getBoundingClientRect().height)"),[46,46]);
 for(const season of ['spring','summer','autumn','winter'])for(const night of ['false','true']){
  await js(`document.documentElement.dataset.season='${season}';document.documentElement.dataset.night='${night}';document.querySelector('.composer textarea').blur()`);
  const before=await js("getComputedStyle(document.querySelector('.composer textarea')).borderColor");
  await js("document.querySelector('.composer textarea').focus()");
  assert.equal(await js("getComputedStyle(document.querySelector('.composer textarea')).borderColor"),before);
  assert.equal(await js("getComputedStyle(document.querySelector('.composer textarea')).outlineStyle"),'none');
 }
 await js("const el=document.querySelector('.composer textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'重开仍在的草稿');el.dispatchEvent(new Event('input',{bubbles:true}));");await new Promise(r=>setTimeout(r,100));
 await js('location.reload()');await new Promise(r=>setTimeout(r,1400));await chat();
 assert.equal(await js("document.querySelector('.composer textarea').value"),'重开仍在的草稿');
 await js("document.querySelector('.messages').scrollTop=0");await new Promise(r=>setTimeout(r,150));
 assert.equal(await js("!!document.querySelector('.latest-message')"),true);
 await js("document.querySelector('.latest-message').click()");await new Promise(r=>setTimeout(r,150));
 assert.equal(await js("!!document.querySelector('.latest-message')"),false);
 await js("document.querySelector('[aria-label=搜索聊天记录]').click()");await new Promise(r=>setTimeout(r,100));
 assert.equal(await js('window.__lukeBack()'),true);await new Promise(r=>setTimeout(r,100));
 assert.equal(await js("!!document.querySelector('.search-page')"),false);
 await js("document.querySelector('.chat-head [aria-label=打开设置]').click()");await new Promise(r=>setTimeout(r,150));
 await js("window.LukeAndroid={saveBackup:(name,text)=>window.testBackup=JSON.parse(text)};[...document.querySelectorAll('.settings button')].find(b=>b.textContent.includes('导出完整数据备份')).click()");
 const backup=await js('window.testBackup');
 assert.equal(backup.draft,'重开仍在的草稿');assert.equal(backup.messages.length,35);assert.equal(backup.notes.length,1);assert.equal(backup.focusLog[0].group,'数学');assert.equal(backup.anniversaries.length,1);assert.equal(backup.birthday,'2002-10-05');
 assert.equal(await js('window.__lukeBack()'),true);await new Promise(r=>setTimeout(r,150));
 assert.equal(await js('window.__lukeBack()'),true);await new Promise(r=>setTimeout(r,150));
 assert.equal(await js('window.__lukeBack()'),false);
 const photos=await js("[...document.querySelectorAll('.hero-slide img')].map(i=>({loading:i.loading,decoding:i.decoding}))");
 assert.equal(photos.filter(i=>i.loading==='eager').length,3);assert.ok(photos.every(i=>i.decoding==='async'));
 console.log('PASS: draft survives reload, 46px composer, latest-message navigation, layered JS back, complete backup contents, adjacent-photo eager loading');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();}
