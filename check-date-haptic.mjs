import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const server=createServer(async(req,res)=>{try{const root=resolve('work/mobile-web'),path=resolve(root,'.'+decodeURI(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!path.startsWith(root))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(9335,'127.0.0.1',r));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--remote-debugging-port=9336','--user-data-dir='+resolve('work/ui-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});let ws;const pending=new Map();let id=0;
try{let tabs;for(let i=0;i<50;i++){try{tabs=await(await fetch('http://127.0.0.1:9336/json')).json();break;}catch{await new Promise(r=>setTimeout(r,100));}}ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});const call=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});const js=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await call('Emulation.setDeviceMetricsOverride',{width:412,height:892,deviceScaleFactor:2.5,mobile:true});await call('Page.navigate',{url:'http://127.0.0.1:9335/'});await new Promise(r=>setTimeout(r,1600));
 for(let i=0;i<40&&!await js("!!document.querySelector('.main-nav [role=tab]')");i++)await new Promise(r=>setTimeout(r,250));
 await js("[...document.querySelectorAll('.main-nav [role=tab]')].find(b=>b.textContent==='计时').click()");await new Promise(r=>setTimeout(r,180));

 await js("window.hapticCalls=0;window.LukeAndroid={haptic:()=>window.hapticCalls++}");
 assert.equal(await js("document.querySelector('[aria-label=学习统计日期]').type"),'date');
 await js("const date=document.querySelector('[aria-label=学习统计日期]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(date,'2026-08-12');date.dispatchEvent(new Event('input',{bubbles:true}))");
 await new Promise(r=>setTimeout(r,100));
 assert.match(await js("document.querySelector('.study-period').textContent"),/2026-08-12/);
 const point=await js("(()=>{const r=document.querySelector('.study-picker').getBoundingClientRect();return {x:r.x+20,y:r.y+20}})()");
 await call('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
 await call('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
 assert.equal(await js('window.hapticCalls'),1);
 await js("document.querySelector('.study-picker').click()");assert.equal(await js('window.hapticCalls'),1);
 assert.equal(await js("!!document.querySelector('.study-date-popover')"),false);
 console.log('PASS: restored native date input updates selected period; trusted button tap sends one haptic; scripted clicks do not vibrate');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();}
