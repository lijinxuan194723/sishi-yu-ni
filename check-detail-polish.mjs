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
 await call('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});
 await call('Page.navigate',{url:'http://127.0.0.1:9335/'});await new Promise(r=>setTimeout(r,1500));
 await js("[...document.querySelectorAll('.main-nav button')].find(b=>b.textContent.includes('计时')).click()");await new Promise(r=>setTimeout(r,100));
 await js("document.querySelector('.study-picker').click()");await new Promise(r=>setTimeout(r,100));
 assert.equal(await js("!!document.querySelector('.study-popover')"),true);
 await js("document.querySelector('.focus-clock').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))");await new Promise(r=>setTimeout(r,100));
 assert.equal(await js("!!document.querySelector('.study-popover')"),false);
 await js("document.querySelector('.study-picker').click()");await new Promise(r=>setTimeout(r,100));
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await new Promise(r=>setTimeout(r,100));
 assert.equal(await js("!!document.querySelector('.study-popover')"),false);
 assert.equal(await js("document.activeElement.classList.contains('study-picker')"),true);
 assert.equal(await js("document.documentElement.scrollWidth<=innerWidth"),true);
 console.log('PASS: outside press and Escape dismiss subject menu; keyboard focus restored; no horizontal overflow at 360px');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();}
