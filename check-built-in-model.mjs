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
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`window.LukeAndroid={defaultModel:()=>JSON.stringify({baseUrl:'https://example.com/v1',model:'gpt-5.6-luna',key:'test-only',fallback:{baseUrl:'https://example.com/v1',model:'gpt-5.3-codex-spark',key:'test-only'}})}`});
 await call('Emulation.setDeviceMetricsOverride',{width:412,height:892,deviceScaleFactor:2.5,mobile:true});
 await call('Page.navigate',{url:'http://127.0.0.1:9335/'});await new Promise(r=>setTimeout(r,1800));
 await js("localStorage.removeItem('luke-connections-v1');localStorage.removeItem('luke-model-key');location.reload()");await new Promise(r=>setTimeout(r,1600));
 const open=async()=>{await js("document.querySelector('[aria-label=打开设置]').click()");await new Promise(r=>setTimeout(r,200));await js("[...document.querySelectorAll('.settings-tabs button')].find(b=>b.textContent==='聊天模型').click()");await new Promise(r=>setTimeout(r,200));};
 await open();
 assert.deepEqual(await js("[...document.querySelectorAll('.connection-form fieldset input')].map(i=>i.value)"),['https://example.com/v1','gpt-5.6-luna','test-only','https://example.com/v1','gpt-5.3-codex-spark','test-only']);
 await js("const input=document.querySelectorAll('.connection-form fieldset input')[1];Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'custom-model');input.dispatchEvent(new Event('input',{bubbles:true}));");await new Promise(r=>setTimeout(r,100));
 await js("document.querySelector('.connection-form .primary').click()");await new Promise(r=>setTimeout(r,100));await js('location.reload()');await new Promise(r=>setTimeout(r,1600));await open();
 assert.equal(await js("document.querySelectorAll('.connection-form fieldset input')[1].value"),'custom-model');
 await js("[...document.querySelectorAll('.connection-form button')].find(b=>b.textContent==='恢复内置配置').click()");await new Promise(r=>setTimeout(r,100));
 assert.equal(await js("document.querySelectorAll('.connection-form fieldset input')[1].value"),'gpt-5.6-luna');
 console.log('PASS: clean install uses native defaults, model priority populated, user override survives reload, restore defaults works (test credentials only)');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();}
