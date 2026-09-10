import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,mkdtemp} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';
const root=resolve('work/mobile-web');
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+(req.url==='/'?'/index.html':req.url));if(!path.startsWith(root))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(9344,'127.0.0.1',r));
const profile=await mkdtemp(join(tmpdir(),'luke-theme-test-'));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--remote-debugging-port=9343','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
try{
 let tabs;for(let i=0;i<50;i++){try{tabs=await(await fetch('http://127.0.0.1:9343/json')).json();break;}catch{await new Promise(r=>setTimeout(r,100));}}
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 const pending=new Map();let id=0;
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const js=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await call('Emulation.setDeviceMetricsOverride',{width:393,height:852,deviceScaleFactor:1,mobile:true});
 await call('Page.enable');
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`window.navFailures=[];window.everSplash=false;function sample(){if(document.querySelector('.startup-splash'))everSplash=true;const d=document.documentElement.dataset;if(d.started==='true'&&!d.startupPhase&&!d.startupNav){const n=document.querySelector('.sidebar');if(n){const s=getComputedStyle(n),r=n.getBoundingClientRect();if(s.opacity!=='1'||s.visibility!=='visible'||r.bottom>innerHeight+1||r.top>=innerHeight)navFailures.push({opacity:s.opacity,top:r.top,bottom:r.bottom});}}requestAnimationFrame(sample)}requestAnimationFrame(sample);`});
 await call('Page.navigate',{url:'http://127.0.0.1:9344/'});await new Promise(r=>setTimeout(r,2800));
 assert.equal(await js('everSplash'),true);
 assert.equal(await js("document.documentElement.dataset.started"),'true');
 assert.deepEqual(await js('navFailures'),[]);
 assert.equal(await js("!!document.querySelector('.startup-splash')||!!document.documentElement.dataset.startupPhase"),false);
 await js(`[...document.querySelectorAll('.main-nav button')].find(b=>b.textContent.includes('时光手记')).click()`);
 await new Promise(r=>setTimeout(r,500));
 const results=await js(`(()=>{const results=[];const el=part=>document.querySelector('[class*="'+part+'"]');for(const season of ['spring','summer','autumn','winter'])for(const night of ['false','true']){document.documentElement.dataset.season=season;document.documentElement.dataset.night=night;const probe=document.createElement('span');document.body.append(probe);const color=token=>{probe.style.backgroundColor='var('+token+')';return getComputedStyle(probe).backgroundColor};const search=el('searchBar'),chip=document.querySelector('[class*="chipRail"] button[data-active="true"]'),fab=el('fab');results.push({season,night,search:getComputedStyle(search).backgroundColor,paper:color('--scene-paper'),chip:getComputedStyle(chip).backgroundColor,fab:getComputedStyle(fab).backgroundColor,accent:color('--season-accent'),input:getComputedStyle(search.querySelector('input')).backgroundColor});probe.remove()}return results})()`);
 for(const r of results){assert.equal(r.search,r.paper,JSON.stringify(r));assert.equal(r.chip,r.accent,JSON.stringify(r));assert.equal(r.fab,r.accent,JSON.stringify(r));assert.equal(r.input,'rgba(0, 0, 0, 0)');}
 console.log('PASS: startup splash presents and cleans up after itself; navigation visible once startup finishes; module search/chips/FAB match all 8 season/night palettes.');
 await js(`[...document.querySelectorAll('.main-nav button')].find(b=>b.textContent.includes('回到身边')).click()`);
 await new Promise(r=>setTimeout(r,200));
 await js(`document.querySelector('[aria-label="打开设置"]').click()`);
 await new Promise(r=>setTimeout(r,300));
 await js(`[...document.querySelectorAll('[role=tab]')].find(b=>b.textContent==='四季与昼夜').click()`);
 await new Promise(r=>setTimeout(r,800));
 const switching=await js(`(async()=>{let running=true;const failures=[];function sample(){if(!running)return;const box=document.querySelector('.appearance-preview');const images=[...box.querySelectorAll('.season-photo img')];if(!images.some(i=>i.complete&&i.naturalWidth>0&&getComputedStyle(i).opacity==='1'))failures.push('blank image');if(document.querySelector('.settings').getAnimations({subtree:true}).some(a=>a.constructor.name==='CSSTransition'))failures.push('transition');requestAnimationFrame(sample)}requestAnimationFrame(sample);for(const label of ['夏','冬','春','秋']){[...document.querySelectorAll('.appearance-options button')].find(b=>b.textContent===label).click();await new Promise(r=>setTimeout(r,90))}await new Promise(r=>setTimeout(r,1000));running=false;return {failures,season:document.querySelector('.settings').dataset.season}})()`);
 assert.deepEqual(switching.failures,[]);assert.equal(switching.season,'autumn');
 console.log('PASS: rapid season selection ends on autumn; every sampled preview frame has an opaque decoded image; no CSS transitions.');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();}
