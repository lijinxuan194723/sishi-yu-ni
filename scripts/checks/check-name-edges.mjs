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
 await js("localStorage.removeItem('luke-companion-v1');localStorage.removeItem('luke-name-default-v2');location.reload()");await new Promise(r=>setTimeout(r,1400));
 assert.ok(await js("document.querySelector('.hero h1').textContent.includes('冬清')"));
 await js("document.querySelector('[aria-label=打开设置]').click()");await new Promise(r=>setTimeout(r,150));
 await js("const input=[...document.querySelectorAll('.settings label')].find(e=>e.textContent.includes('你的称呼')).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'小清');input.dispatchEvent(new Event('input',{bubbles:true}));");await new Promise(r=>setTimeout(r,100));
 await js('location.reload()');await new Promise(r=>setTimeout(r,1400));assert.ok(await js("document.querySelector('.hero h1').textContent.includes('小清')"));
 await js("const p=JSON.parse(localStorage.getItem('luke-companion-v1'));p.name='我';localStorage.setItem('luke-companion-v1',JSON.stringify(p));localStorage.removeItem('luke-name-default-v2');location.reload()");await new Promise(r=>setTimeout(r,1400));assert.ok(await js("document.querySelector('.hero h1').textContent.includes('冬清')"));
 assert.equal(await js("getComputedStyle(document.querySelector('main>.page-bar')).borderBottomColor"),'rgba(0, 0, 0, 0)');
 assert.equal(await js("getComputedStyle(document.querySelector('.sidebar')).borderTopColor"),'rgba(0, 0, 0, 0)');
 await writeFile('outputs/android/edges-1.8.9.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
 console.log('PASS: default name, editable name persistence, old placeholder migration, transparent toolbar boundaries');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();}
