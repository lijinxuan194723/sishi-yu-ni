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
 await call('Page.navigate',{url:'http://127.0.0.1:9335/'});await new Promise(r=>setTimeout(r,1300));
 const audit=async()=>{const checks=await js(`(()=>{document.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));return [...document.querySelectorAll('button,input,textarea,summary,a[href]')].filter(e=>e.getBoundingClientRect().width&&!e.disabled).map(e=>{const before=getComputedStyle(e).boxShadow;e.focus({preventScroll:true});const s=getComputedStyle(e);return {name:e.getAttribute('aria-label')||e.textContent.slice(0,20),outline:s.outlineStyle,shadow:s.boxShadow,before};});})()`);assert.ok(checks.length);assert.ok(checks.every(c=>c.outline==='none'&&(c.shadow==='none'||c.shadow===c.before)),JSON.stringify(checks));};
 await audit();
 for(let i=0;i<6;i++){await js(`document.querySelectorAll('.main-nav button')[${i}].click()`);await new Promise(r=>setTimeout(r,80));await audit();}
 await js("document.querySelector('.main-nav button').click()");await new Promise(r=>setTimeout(r,80));
 await js("document.querySelector('[aria-label=打开设置]').click()");await new Promise(r=>setTimeout(r,150));await audit();
 await js("document.querySelector('[data-slot=dialog-close]').click()");await new Promise(r=>setTimeout(r,150));
 await js("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}))");assert.equal(await js("document.documentElement.dataset.keyboardFocus"),'true');
 await js("document.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))");assert.equal(await js("document.documentElement.dataset.keyboardFocus"),undefined);
 await js("document.querySelector('.together-edit').focus({preventScroll:true})");assert.equal(await js("getComputedStyle(document.querySelector('.together-edit')).outlineStyle"),'none');
 console.log('PASS: touch focus has no outline/shadow on home and settings controls; keyboard navigation mode retained; companion date focus clean');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();}
