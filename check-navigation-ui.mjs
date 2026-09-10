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
 for(let i=0;i<50&&await js("document.querySelectorAll('.main-nav button').length")!==6;i++)await new Promise(r=>setTimeout(r,100));
 assert.equal(await js("document.querySelectorAll('.main-nav button').length"),6);
 for(const width of [320,360,412]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:true});
 for(let i=0;i<6;i++){
 await js(`document.querySelectorAll('.main-nav button')[${i}].click()`);await new Promise(r=>setTimeout(r,60));
 const cells=await js(`[...document.querySelectorAll('.main-nav button')].map(b=>{const r=b.getBoundingClientRect(),s=getComputedStyle(b),icon=b.querySelector('svg');return {x:r.x,y:r.y,w:r.width,h:r.height,iy:icon.getBoundingClientRect().y,transform:s.transform,iconTransform:getComputedStyle(icon).transform,bg:s.backgroundColor}})`);
 assert.equal(cells.length,6);assert.ok(cells.every(c=>c.transform==='none'&&c.iconTransform==='none'&&c.bg==='rgba(0, 0, 0, 0)'&&Math.abs(c.w-cells[0].w)<1&&c.h>=44&&c.iy===cells[0].iy));
 assert.ok(cells[5].x+cells[5].w<=width);
 }
 }
 await js("document.querySelector('.main-nav button').click()");await new Promise(r=>setTimeout(r,100));
 await writeFile('outputs/android/navigation-1.8.15.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
 console.log('PASS: six equal navigation cells, stable icon baseline, no transforms or solid blocks, all pages at 320/360/412px');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();}
