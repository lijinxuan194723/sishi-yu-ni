// Real mobile UI replay. Build first: npx vite build --config mobile/vite.config.mts
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const server=createServer(async(req,res)=>{try{const path=resolve(process.env.PERF_WEB_ROOT||'work/mobile-web','.'+decodeURI(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!path.startsWith(resolve(process.env.PERF_WEB_ROOT||'work/mobile-web')))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(9334,'127.0.0.1',r));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--remote-debugging-port=9333','--user-data-dir='+resolve('work/perf-profile'),'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;const pending=new Map();let id=0;
try{
 let tabs;for(let i=0;i<50;i++){try{tabs=await(await fetch('http://127.0.0.1:9333/json')).json();break;}catch{await new Promise(r=>setTimeout(r,100));}}
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const js=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await call('Emulation.setDeviceMetricsOverride',{width:412,height:892,deviceScaleFactor:2.5,mobile:true});
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await call('Page.enable');
 if(process.env.STARTUP)await call('Page.addScriptToEvaluateOnNewDocument',{source:`window.bootProbe={frames:0,animatedFrames:0};function sample(){if(document.querySelector('.app-shell')){bootProbe.frames++;if(document.documentElement.getAnimations().some(a=>a.playState==='running'))bootProbe.animatedFrames++;}requestAnimationFrame(sample)}requestAnimationFrame(sample);`});
 await call('Page.navigate',{url:'http://127.0.0.1:9334/'});
 await new Promise(r=>setTimeout(r,1800));

 assert.equal(await js("document.querySelectorAll('.gallery-controls').length"),0);
 const before=await js("document.querySelector('.hero-track').getBoundingClientRect().x");
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:330,y:280}]});
 for(const x of [300,250,190,120]){await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:280}]});await new Promise(r=>setTimeout(r,35));}
 const dragging=await js("document.querySelector('.hero-track').getBoundingClientRect().x");assert.ok(Math.abs(dragging-before)>100,'Photo must follow finger before release');
 await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await new Promise(r=>setTimeout(r,1000));
 const settled=await js("document.querySelector('.hero-track').getBoundingClientRect().x");console.log({before,dragging,settled});assert.ok(Math.abs(settled-before)>300,'Swipe must settle on next photo');
 const width=await js("document.querySelector('.hero-gallery').clientWidth");assert.ok(Math.abs(Math.abs(settled-before)%width)<2,'Slide snaps to full photo');
 await writeFile('work/swipe-mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:450}]});for(const y of [400,320,240]){await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y}]});await new Promise(r=>setTimeout(r,40));}await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await new Promise(r=>setTimeout(r,400));assert.ok(await js('window.scrollY>50'),'Vertical page scroll must remain available');
 console.log('PASS: no click controls; real touch drag follows finger, release snaps to next photo, vertical scroll works');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();}

