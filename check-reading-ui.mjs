import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const server=createServer(async(req,res)=>{try{const root=resolve('work/mobile-web'),path=resolve(root,'.'+decodeURI(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!path.startsWith(root))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(9335,'127.0.0.1',r));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--remote-debugging-port=9336','--user-data-dir='+resolve('work/ui-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});let ws;const pending=new Map();let id=0;
try{let tabs;for(let i=0;i<50;i++){try{tabs=await(await fetch('http://127.0.0.1:9336/json')).json();break;}catch{await new Promise(r=>setTimeout(r,100));}}ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});const call=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});const js=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};




 await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});
 await call('Page.navigate',{url:'http://127.0.0.1:9335/'});await new Promise(r=>setTimeout(r,1400));
 const quote=await js("document.querySelector('.quote-card p').textContent");
 await js("document.querySelector('.quote-next').click()");await new Promise(r=>setTimeout(r,100));
 assert.notEqual(await js("document.querySelector('.quote-card p').textContent"),quote);
 const nav=async name=>{await js(`[...document.querySelectorAll('.main-nav button')].find(b=>b.textContent.includes('${name}')).click()`);await new Promise(r=>setTimeout(r,150));};
 await nav('他的此刻');assert.ok(await js("document.querySelector('.reading-book').textContent.includes('活着')"));
 await js("document.querySelector('[aria-label=下一本书]').click()");await new Promise(r=>setTimeout(r,100));
 assert.ok(await js("document.querySelector('.reading-book').textContent.includes('海子诗全集')"));
 await js("document.querySelector('.reading-actions [aria-pressed]').click()");await new Promise(r=>setTimeout(r,100));
 assert.equal(await js("JSON.parse(localStorage.getItem('luke-companion-v1')).reading.title"),'海子诗全集');
 await js("document.querySelector('.reading-actions .soft-button').click()");await new Promise(r=>setTimeout(r,150));
 assert.ok(await js("document.querySelector('#note').value.includes('海子诗全集')"));
 assert.equal(await js("document.documentElement.scrollWidth<=innerWidth"),true);
 await nav('计时');assert.equal(await js("document.documentElement.scrollWidth<=innerWidth"),true);
 await writeFile('outputs/android/timer-1.8.12.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await nav('时光手记');await js("document.activeElement.blur()");
 await writeFile('outputs/android/journal-1.8.12.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
 console.log('PASS: quote change, book navigation, reading draft transfer, 360px timer and journal layout');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();}
