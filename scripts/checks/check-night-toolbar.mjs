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
 await call('Page.navigate',{url:'http://127.0.0.1:9335/'});await new Promise(r=>setTimeout(r,1500));
 const metrics=()=>js(`[...document.querySelectorAll('.page-bar .round')].filter(e=>e.getBoundingClientRect().width).map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bg:s.backgroundColor,border:s.borderTopColor};})`);
 for(const season of ['spring','summer','autumn','winter']){
  await js(`document.documentElement.dataset.season='${season}';document.documentElement.dataset.night='false'`);
  const day=await metrics();
  await js("document.documentElement.dataset.night='true'");
  const night=await metrics();
  assert.deepEqual(night,day);
  assert.ok(night.every(s=>s.bg==='rgba(0, 0, 0, 0)'&&s.border==='rgba(0, 0, 0, 0)'));
 }
 await js("document.documentElement.dataset.season='autumn'");
 const shot=await call('Page.captureScreenshot',{format:'png'});
 await writeFile('outputs/android/night-1.8.6.png',Buffer.from(shot.data,'base64'));
 console.log('PASS: four seasons preserve toolbar geometry and transparent backgrounds/borders across day and night');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();}
