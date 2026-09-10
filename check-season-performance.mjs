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
 if(process.env.STARTUP){const boot=await js('window.bootProbe');console.log(boot);assert.ok(boot.frames>0,'Home did not render');assert.equal(boot.animatedFrames,0,'Root palette animates while the first home frame appears');}
 if(process.env.MUSIC){
  await js("localStorage.removeItem('luke-companion-v1');location.reload()");await new Promise(r=>setTimeout(r,1400));
  const saved=await js("JSON.parse(localStorage.getItem('luke-companion-v1'))");assert.equal(saved.since,'2023-07-08');assert.equal(saved.birthday,'2002-10-05');
  await js("[...document.querySelectorAll('[role=tab]')].find(b=>b.textContent==='他的此刻').click()");await new Promise(r=>setTimeout(r,200));
  const names=await js(`(async()=>{const names=[];for(let i=0;i<30;i++){names.push(document.querySelector('.song-detail strong').textContent);document.querySelector('.music-moment button').click();await new Promise(r=>setTimeout(r,25));}return names;})()`);
  assert.equal(new Set(names).size,30);console.log('PASS: fresh install dates and 30 distinct songs through the real UI');
 }


 if(process.env.STUDY){
  await js("localStorage.setItem('luke-companion-v1',JSON.stringify({name:'我',since:'2023-07-08',messages:[],notes:[],tasks:[],checks:[],focusLog:[{at:new Date().toISOString(),minutes:25,group:'数学'},{at:new Date().toISOString(),minutes:10,group:'英语'}]}));location.reload()");await new Promise(r=>setTimeout(r,1400));
  await js("document.querySelector('[aria-label=下一张夏彦照片]').click()");await new Promise(r=>setTimeout(r,700));assert.match(await js("document.querySelector('.gallery-controls span').textContent"),/^2 /);
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:310,y:195}]});await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:100,y:196}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await new Promise(r=>setTimeout(r,700));assert.match(await js("document.querySelector('.gallery-controls span').textContent"),/^3 /);
  await writeFile('work/gallery-mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  const timers=async()=>{await js("[...document.querySelectorAll('.main-nav [role=tab]')].find(b=>b.textContent==='计时').click()");await new Promise(r=>setTimeout(r,200));};await timers();
  assert.equal(await js("document.querySelector('.study-workspace').textContent.includes('番茄')"),false);
  await js("document.querySelector('.study-timer .primary').click()");await new Promise(r=>setTimeout(r,1300));assert.equal(await js("JSON.parse(localStorage.getItem('luke-companion-v1')).study.subject"),'数学');
  await js('location.reload()');await new Promise(r=>setTimeout(r,1400));await timers();assert.match(await js("document.querySelector('.study-timer .primary').textContent"),/结束并保存/);
  await js("document.querySelector('.study-timer .primary').click()");await new Promise(r=>setTimeout(r,250));assert.equal(await js("JSON.parse(localStorage.getItem('luke-companion-v1')).study"),undefined);
  for(const period of ['日','周','月','年']){await js("[...document.querySelectorAll('[aria-label=学习统计周期] button')].find(b=>b.textContent==='"+period+"').click()");await new Promise(r=>setTimeout(r,100));assert.match(await js("document.querySelector('[aria-label=各科学习时长]').textContent"),/英语10分/);}
  for(const width of [320,412]){await call('Emulation.setDeviceMetricsOverride',{width,height:892,deviceScaleFactor:2.5,mobile:true});assert.equal(await js('document.documentElement.scrollWidth<=innerWidth'),true);}
  await writeFile('work/study-mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  console.log('PASS: gallery button and touch swipe; simple timer start/reload/stop; daily/weekly/monthly/annual subject totals; mobile width');
 }
 if(process.env.KEYBOARD){
  await js("[...document.querySelectorAll('.main-nav [role=tab]')].find(b=>b.textContent==='悄悄话').click()");await new Promise(r=>setTimeout(r,200));
  await js("document.querySelector('.chat-page textarea').focus();document.documentElement.dataset.keyboard='true'");
  await call('Emulation.setDeviceMetricsOverride',{width:412,height:500,deviceScaleFactor:2.5,mobile:true});
  await js("document.documentElement.dataset.keyboard='true'");
  assert.equal(await js("getComputedStyle(document.querySelector('.sidebar')).display"),'none');
  assert.equal(await js("getComputedStyle(document.querySelector('main')).paddingBottom"),'0px');
  assert.ok(await js("document.querySelector('.chat-page textarea').getBoundingClientRect().bottom<=innerHeight"));
  await writeFile('work/keyboard-mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await js("document.querySelector('textarea').blur();document.documentElement.dataset.keyboard='false'");
  await call('Emulation.setDeviceMetricsOverride',{width:412,height:892,deviceScaleFactor:2.5,mobile:true});
  assert.notEqual(await js("getComputedStyle(document.querySelector('.sidebar')).display"),'none');
  await js("localStorage.setItem('luke-companion-v1',JSON.stringify({name:'我',since:'2023-07-08',messages:[],notes:[],tasks:[],checks:[],focusLog:[{at:new Date().toISOString(),minutes:25,group:'数学'},{at:new Date().toISOString(),minutes:10,group:'英语'}]}));location.reload()");await new Promise(r=>setTimeout(r,1400));
  await js("[...document.querySelectorAll('.main-nav [role=tab]')].find(b=>b.textContent==='计时').click()");await new Promise(r=>setTimeout(r,150));
  await js("[...document.querySelectorAll('[aria-label=专注页面分区] button')].find(b=>b.textContent==='统计数据').click()");await new Promise(r=>setTimeout(r,150));
  assert.match(await js("document.querySelector('[aria-label=分类时长分布]').textContent"),/数学25 分钟/);
  assert.match(await js("document.querySelector('[aria-label=分类时长分布]').textContent"),/英语10 分钟/);
  await js("const sel=document.querySelector('[aria-label=统计专注分类]');sel.value='英语';sel.dispatchEvent(new Event('change',{bubbles:true}))");await new Promise(r=>setTimeout(r,150));
  assert.equal(await js("document.querySelector('.focus-statistics .stat-values p:nth-child(2) strong').textContent"),'10');
  assert.equal(await js("document.documentElement.scrollWidth<=innerWidth"),true);
  console.log('PASS: simulated native keyboard hides/restores nav and frees composer space; persisted math/English totals and category filter');
 }
 if(process.env.DASHBOARD){
  await js(`localStorage.setItem('luke-companion-v1',JSON.stringify({name:'我',since:'2023-07-08',messages:[],notes:[],tasks:[],checks:[],focusLog:[{at:new Date().toISOString(),minutes:25,kind:'pomodoro',title:'旧记录'}]}));location.reload()`);await new Promise(r=>setTimeout(r,1500));
  const click=async selector=>{await js(selector+'.click()');await new Promise(r=>setTimeout(r,170));};
  const timers=()=>click(`[...document.querySelectorAll('.main-nav [role=tab]')].find(b=>b.textContent==='计时')`);
  const section=label=>click(`[...document.querySelectorAll('[aria-label="专注页面分区"] button')].find(b=>b.textContent==='${label}')`);
  const fill=async(label,value)=>{await js(`(()=>{const i=document.querySelector('[aria-label="${label}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,${JSON.stringify(value)});i.dispatchEvent(new Event('input',{bubbles:true}));})()`);await new Promise(r=>setTimeout(r,100));};
  await timers();await section('专注待办');await click(`document.querySelector('.focus-task-section .stats-heading button')`);await fill('专注事项','读十页书');await fill('待办专注时长','10');await fill('专注待办分组','阅读');await click(`document.querySelector('.focus-task-form .primary')`);await click(`document.querySelector('[aria-label="编辑专注待办"]')`);await fill('专注事项','读二十页书');await click(`document.querySelector('.focus-task-form .primary')`);await click(`document.querySelector('.focus-task-card .primary')`);
  assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focus.title`),'读二十页书');assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focus.minutes`),10);
  await click(`document.querySelector('.focus-room-button')`);assert.equal(await js(`!!document.querySelector('.focus-room .focus-clock')`),true);await click(`document.querySelector('.focus-room [data-luke-back]')`);
  await js(`(()=>{const d=JSON.parse(localStorage.getItem('luke-companion-v1'));d.focus.endsAt=Date.now()-500;localStorage.setItem('luke-companion-v1',JSON.stringify(d));location.reload();})()`);await new Promise(r=>setTimeout(r,1500));await timers();await section('统计数据');assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focusLog.at(-1).title`),'读二十页书');
  assert.equal(await js(`document.querySelector('.focus-statistics .stat-values p:nth-child(2) strong').textContent`),'35');await click(`[...document.querySelectorAll('.focus-statistics .journal-filters button')].find(b=>b.textContent==='周')`);assert.ok(await js(`document.querySelector('.focus-bars').textContent.includes('35')`));
  await click(`[...document.querySelectorAll('.focus-statistics .journal-filters button')].find(b=>b.textContent==='自定义')`);await fill('统计开始日期','2026-12-01');await fill('统计结束日期','2026-01-01');assert.match(await js(`document.querySelector('.focus-statistics [role=alert]').textContent`),/不能早于/);
  await click(`[...document.querySelectorAll('.focus-statistics .journal-filters button')].find(b=>b.textContent==='日')`);await js(`document.querySelector('.focus-statistics').scrollIntoView({block:'start'})`);await writeFile('work/focus-stats-mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await section('专注待办');await js(`document.querySelector('.focus-task-section').scrollIntoView({block:'start'})`);await writeFile('work/focus-tasks-mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));await js('window.confirm=()=>true');await click(`document.querySelector('[aria-label="删除专注待办"]')`);assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focusTasks.length`),0);assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focusLog.length`),2);assert.equal(await js(`document.documentElement.scrollWidth<=innerWidth`),true);
  console.log('PASS: task create/group/edit/start/title snapshot, immersive enter/exit, completed totals, week/custom range, deletion preserves history, mobile width');
 }
 if(process.env.COUNTDOWN){
  await js(`localStorage.setItem('luke-companion-v1',JSON.stringify({name:'我',since:'2023-07-08',messages:[],notes:[],tasks:[],checks:[],focus:{minutes:25,remainingMs:1500000,endsAt:Date.now()+1500000}}));location.reload()`);await new Promise(r=>setTimeout(r,1500));
  const click=async selector=>{await js(selector+'.click()');await new Promise(r=>setTimeout(r,140));};
  const timers=()=>click(`[...document.querySelectorAll('.main-nav [role=tab]')].find(b=>b.textContent==='计时')`);
  await timers();assert.equal(await js(`document.querySelectorAll('.main-nav [role=tab]').length`),6);
  const initialEnd=await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focus.endsAt`);
  const fill=async(label,value)=>{await js(`(()=>{const input=document.querySelector('[aria-label="倒计时${label}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'${value}');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);await new Promise(r=>setTimeout(r,100));};
  await fill('小时',1);await fill('分钟',2);await fill('秒',3);assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).countdown.seconds`),3723);
  await click(`document.querySelector('.countdown-panel .primary')`);await click(`document.querySelector('.countdown-panel .primary')`);assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).countdown.endsAt`),undefined);await click(`document.querySelector('.countdown-panel .primary')`);
  await js('location.reload()');await new Promise(r=>setTimeout(r,1500));await timers();assert.match(await js(`document.querySelector('.countdown-panel .primary').textContent`),/暂停/);assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focus.endsAt`),initialEnd);
  await js(`(()=>{const d=JSON.parse(localStorage.getItem('luke-companion-v1'));d.countdown={seconds:1,remainingMs:1000};localStorage.setItem('luke-companion-v1',JSON.stringify(d));location.reload();})()`);await new Promise(r=>setTimeout(r,1500));await timers();await click(`document.querySelector('.countdown-panel .primary')`);await new Promise(r=>setTimeout(r,1300));assert.match(await js(`document.querySelector('.countdown-panel [role=status]').textContent`),/时间到/);assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focusLog?.length??0`),0);
  await js(`document.querySelector('.countdown-panel').scrollIntoView({block:'start'})`);await writeFile('work/countdown-mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  for(const width of [320,412]){await call('Emulation.setDeviceMetricsOverride',{width,height:892,deviceScaleFactor:2.5,mobile:true});assert.equal(await js(`document.documentElement.scrollWidth<=innerWidth`),true);assert.ok(await js(`[...document.querySelectorAll('.main-nav button span')].every(s=>s.scrollWidth<=s.parentElement.clientWidth)`));}
  await click(`[...document.querySelectorAll('.main-nav [role=tab]')].find(b=>b.textContent==='他的此刻')`);assert.equal(await js(`document.querySelectorAll('.focus-moment').length`),0);
  console.log('PASS: six bottom tabs fit 320/412px, old location removed, countdown hours/minutes/seconds pause/reload/finish, independent running focus preserved');
 }
 if(process.env.TOMATO){
  await js(`localStorage.setItem('luke-companion-v1',JSON.stringify({name:'我',since:'2023-07-08',messages:[],notes:[],tasks:[],checks:[]}));location.reload()`);await new Promise(r=>setTimeout(r,1500));
  const click=async selector=>{await js(selector+'.click()');await new Promise(r=>setTimeout(r,180));};
  const heart=()=>click(`[...document.querySelectorAll('.main-nav [role=tab]')].find(b=>b.textContent==='计时')`);
  await heart();await click(`[...document.querySelectorAll('[aria-label="计时模式"] button')].find(b=>b.textContent==='番茄钟')`);await click(`document.querySelector('.pomodoro-settings summary')`);
  assert.deepEqual(await js(`[...document.querySelectorAll('.pomodoro-settings input')].map(i=>i.value)`),['25','5','15','4']);
  await click(`document.querySelector('.focus-actions .primary')`);await click(`document.querySelector('.focus-actions .primary')`);assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focus.pomodoro.phase`),'work');await click(`document.querySelector('.focus-actions .primary')`);
  async function expire(){await js(`(()=>{const d=JSON.parse(localStorage.getItem('luke-companion-v1'));d.focus.endsAt=Date.now()-1000;localStorage.setItem('luke-companion-v1',JSON.stringify(d));location.reload();})()`);await new Promise(r=>setTimeout(r,1500));await heart();}
  await expire();assert.equal(await js(`document.querySelector('.pomodoro-phase strong').textContent`),'短休息');assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focusLog.length`),1);assert.equal(await js(`document.querySelector('.focus-actions .primary').textContent.trim()`),'开始休息');
  await click(`document.querySelector('.focus-actions .primary')`);await expire();assert.equal(await js(`document.querySelector('.pomodoro-phase strong').textContent`),'专注');assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focusLog.length`),1);
  await js(`(()=>{const d=JSON.parse(localStorage.getItem('luke-companion-v1'));d.focus.pomodoro.completed=3;d.focus.endsAt=Date.now()-1000;localStorage.setItem('luke-companion-v1',JSON.stringify(d));location.reload();})()`);await new Promise(r=>setTimeout(r,1500));await heart();assert.equal(await js(`document.querySelector('.pomodoro-phase strong').textContent`),'长休息');
  await js(`document.querySelector('.focus-moment').scrollIntoView({block:'start'})`);await writeFile('work/pomodoro-mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await click(`[...document.querySelectorAll('.focus-actions button')].find(b=>b.textContent==='跳过休息')`);assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focus.pomodoro.completed`),0);assert.equal(await js(`document.documentElement.scrollWidth<=innerWidth`),true);
  console.log('PASS: pomodoro mobile defaults, pause/resume, restart into short/long rest, focus-only records, skip long rest resets cycle');
 }
 if(process.env.EXTRAS){
  await js(`localStorage.setItem('luke-companion-v1',JSON.stringify({name:'我',since:'2023-07-08',messages:[],notes:[],tasks:[],checks:[]}));location.reload()`);await new Promise(r=>setTimeout(r,1600));
  const click=async selector=>{await js(selector+'.click()');await new Promise(r=>setTimeout(r,160));};
  const tab=label=>click(`[...document.querySelectorAll('.main-nav [role=tab]')].find(b=>b.textContent==='${label}')`);
  const fill=async(selector,value)=>{await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await new Promise(r=>setTimeout(r,100));};
  await tab('悄悄话');await fill('.composer textarea','明天想和你一起散步');await js('location.reload()');await new Promise(r=>setTimeout(r,1500));await tab('悄悄话');assert.equal(await js(`document.querySelector('.composer textarea').value`),'明天想和你一起散步');
  await tab('一起计划');await fill('[aria-label="待办内容"]','读书');await click(`document.querySelector('[aria-label="添加待办"]')`);await click(`document.querySelector('[aria-label="标记重要计划"]')`);await click(`document.querySelector('[aria-label="编辑或改期"]')`);await fill('[aria-label="编辑计划内容"]','读十页书');await fill('[aria-label="计划日期"]','2026-10-03');await click(`document.querySelector('.plan-edit .primary')`);assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).tasks[0].date`),'2026-10-03');
  await click(`document.querySelector('.quick-plans summary')`);await click(`document.querySelector('.plan-chips button')`);await click(`document.querySelector('.plan-item .task input')`);
  await js('window.confirm=()=>true');await click(`document.querySelector('[aria-label="删除计划"]')`);await click(`document.querySelector('.plan-manager [role=status] button')`);assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).tasks.length`),2);
  await js(`document.querySelector('.plan-manager').scrollIntoView({block:'start'})`);await writeFile('work/plans-mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await tab('计时');await fill('[aria-label="专注时长"]','1');await click(`document.querySelector('.focus-actions .primary')`);assert.ok(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focus.endsAt`));await click(`document.querySelector('.focus-actions .primary')`);assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focus.endsAt`),undefined);await click(`document.querySelector('.focus-actions .primary')`);
  await js('location.reload()');await new Promise(r=>setTimeout(r,1600));await tab('计时');assert.equal(await js(`document.querySelector('.focus-actions .primary').textContent.trim()`),'暂停');
  await js(`document.querySelector('.focus-moment').scrollIntoView({block:'start'})`);await writeFile('work/focus-mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await js(`(()=>{const d=JSON.parse(localStorage.getItem('luke-companion-v1'));d.focus.endsAt=Date.now()-1000;localStorage.setItem('luke-companion-v1',JSON.stringify(d));location.reload();})()`);await new Promise(r=>setTimeout(r,1500));await tab('计时');await new Promise(r=>setTimeout(r,1200));assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focusLog.length`),1);
  await tab('回到身边');assert.ok(await js(`document.querySelector('.week-review').textContent.includes('1 分钟')`));await tab('计时');assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).focusLog.length`),1);assert.equal(await js(`document.documentElement.scrollWidth<=innerWidth`),true);
  console.log('PASS: draft reload, plan create/priority/edit/reschedule/delete/undo, timer pause/resume/reload/finish exactly once, weekly totals, mobile width');
 }
 if(process.env.JOURNAL){
  await js(`localStorage.setItem('luke-companion-v1',JSON.stringify({name:'我',since:'2023-07-08',messages:[{who:'luke',text:'今天的晚霞很好看。',at:'2026-09-09T10:00:00Z'}],notes:[],tasks:[],checks:[]}));location.reload()`);await new Promise(r=>setTimeout(r,1600));
  const click=async selector=>{await js(selector+'.click()');await new Promise(r=>setTimeout(r,150));};
  const tab=label=>click(`[...document.querySelectorAll('.main-nav [role=tab]')].find(b=>b.textContent==='${label}')`);
  const fill=async(selector,value)=>{await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await new Promise(r=>setTimeout(r,100));};
  await tab('悄悄话');await click(`document.querySelector('[aria-label="收藏这句话"]')`);
  await tab('时光手记');assert.equal(await js(`document.querySelectorAll('.saved-message').length`),1);
  await click(`[...document.querySelectorAll('.journal .mood-choices button')].find(b=>b.textContent==='开心')`);await fill('#note','和夏彦一起看晚霞');await click(`document.querySelector('.journal button.primary')`);
  assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).notes[0].mood`),'开心');
  await click(`document.querySelector('[aria-label="编辑手记"]')`);await fill('[aria-label="编辑手记内容"]','晚霞和一杯热茶');await click(`document.querySelector('.note-edit button.primary')`);
  await fill('[aria-label="搜索手记与收藏"]','热茶');assert.equal(await js(`document.querySelectorAll('.journal-space article').length`),1);
  await fill('[aria-label="搜索手记与收藏"]','');await click(`[...document.querySelectorAll('.journal-filters button')].find(b=>b.textContent.startsWith('收藏'))`);
  await click(`document.querySelector('.saved-message .text-button')`);assert.equal(await js(`document.querySelector('.message[data-highlight="true"] p').textContent`),'今天的晚霞很好看。');
  await js('location.reload()');await new Promise(r=>setTimeout(r,1600));await tab('时光手记');
  assert.equal(await js(`document.querySelector('.saved-message p').textContent`),'今天的晚霞很好看。');assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).notes[0].text`),'晚霞和一杯热茶');
  await click(`[...document.querySelectorAll('.journal .mood-choices button')].find(b=>b.textContent==='平静')`);await click(`document.querySelector('.journal button.primary')`);
  assert.equal(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).notes[0].mood`),'平静');
  assert.equal(await js(`document.documentElement.scrollWidth<=innerWidth`),true);
  await js('window.scrollTo(0,0)');await writeFile('work/journal-mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await click(`document.querySelector('[aria-label="编辑手记"]')`);await fill('[aria-label="编辑手记内容"]','修改的是原手记');
  await fill('#note','新插入的手记');await click(`document.querySelector('.journal button.primary')`);await click(`document.querySelector('.note-edit button.primary')`);
  assert.deepEqual(await js(`JSON.parse(localStorage.getItem('luke-companion-v1')).notes.slice(0,2).map(n=>n.text)`),['新插入的手记','修改的是原手记']);
  console.log('PASS: mobile favorite/jump, mood and text save, editing across insert, searching, reload, mood-only save and width');
 }
 if(process.env.MODELS){
  await js(`localStorage.setItem('luke-connections-v1',JSON.stringify({model:{baseUrl:'https://primary.example/v1',model:'first'}}));localStorage.setItem('luke-model-key','test-first');location.reload()`);await new Promise(r=>setTimeout(r,1800));
  const openModel=async()=>{await js(`document.querySelector('[aria-label="打开设置"]').click()`);await new Promise(r=>setTimeout(r,200));await js(`[...document.querySelectorAll('[role=tab]')].find(b=>b.textContent==='聊天模型').click()`);await new Promise(r=>setTimeout(r,200));};
  await openModel();
  await js(`document.querySelector('.connection-form input[type=checkbox]').click()`);await new Promise(r=>setTimeout(r,100));
  await js(`(()=>{const fields=document.querySelectorAll('.connection-form fieldset');const values=['https://backup.example/v1','second','test-second'];[...fields[1].querySelectorAll('input')].forEach((input,i)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,values[i]);input.dispatchEvent(new Event('input',{bubbles:true}));});})()`);await new Promise(r=>setTimeout(r,150));
  await js(`document.querySelector('.connection-form button.primary').click()`);await new Promise(r=>setTimeout(r,150));
  assert.deepEqual(await js(`JSON.parse(localStorage.getItem('luke-connections-v1')).model.fallback`),{baseUrl:'https://backup.example/v1',model:'second'});
  assert.equal(await js(`localStorage.getItem('luke-fallback-key')`),'test-second');assert.equal(await js(`localStorage.getItem('luke-model-key')`),'test-first');
  await js('location.reload()');await new Promise(r=>setTimeout(r,1800));await openModel();
  assert.deepEqual(await js(`[...document.querySelectorAll('.connection-form fieldset:nth-of-type(2) input')].map(i=>i.value)`),['https://backup.example/v1','second','test-second']);
  assert.equal(await js(`document.querySelector('.connection-form').scrollWidth<=document.querySelector('.settings').clientWidth`),true);
  await js(`document.querySelector('.settings [data-slot=dialog-close]').click()`);
  console.log('PASS: real settings form saves separate models/keys, old primary survives, restart restores backup, mobile layout fits');
 }
 await js(`localStorage.setItem('luke-appearance-v1',JSON.stringify({season:'spring',period:'正午',effects:true}));location.reload()`);
 await new Promise(r=>setTimeout(r,1800));
 await js(`document.querySelector('[aria-label="打开设置"]').click()`);
 await new Promise(r=>setTimeout(r,400));
 await js(`[...document.querySelectorAll('[role="tab"]')].find(x=>x.textContent==='四季与昼夜').click()`);
 await new Promise(r=>setTimeout(r,800));
 if(process.env.UIFIX){
  for(const label of ['夜晚','正午','深夜','早上']){
   await js(`[...document.querySelectorAll('.appearance-options button')].find(b=>b.textContent===${JSON.stringify(label)}).click()`);
   await new Promise(r=>setTimeout(r,140));
   assert.equal(await js("document.querySelector('.settings').getAnimations({subtree:true}).filter(a=>a.constructor.name==='CSSTransition'&&(/color|background|--/.test(a.transitionProperty)||a.effect.target.classList.contains('light-layer'))).length"),0,'Day/night still animates page colors or light layers');
  }
  await js("[...document.querySelectorAll('.appearance-options button')].find(b=>b.textContent==='冬').click()");await new Promise(r=>setTimeout(r,200));
  await js("[...document.querySelectorAll('.appearance-options button')].find(b=>b.textContent==='随时间').click()");await new Promise(r=>setTimeout(r,200));
  assert.deepEqual(await js("(({season,period})=>({season,period}))(JSON.parse(localStorage.getItem('luke-appearance-v1')))"),{season:'winter',period:'auto'});
  await js("document.querySelector('.settings [data-slot=dialog-close]').click()");await new Promise(r=>setTimeout(r,300));
  assert.equal(await js("document.documentElement.getAnimations().filter(a=>a.constructor.name==='CSSTransition').length"),0);
  const positions=[];
  for(const label of ['回到身边','悄悄话','他的此刻','一起计划','时光手记']){
   await js(`[...document.querySelectorAll('.main-nav [role=tab]')].find(b=>b.textContent===${JSON.stringify(label)}).click();window.scrollTo(0,0)`);await new Promise(r=>setTimeout(r,200));
   positions.push(await js("(()=>{const r=document.querySelector('.page-bar [aria-label=打开设置]').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()"));
  }
  console.log('Header button positions:',positions);for(const p of positions)assert.deepEqual(p,positions[0],'Settings button moves between pages');
  await js("document.querySelector('.page-bar [aria-label=打开设置]').click()");await new Promise(r=>setTimeout(r,200));
  await js("[...document.querySelectorAll('[role=tab]')].find(b=>b.textContent==='四季与昼夜').click()");await new Promise(r=>setTimeout(r,200));
  console.log('PASS: no day/night transition, independently saved season/time, identical header settings positions');
 }

 await call('Emulation.setCPUThrottlingRate',{rate:Number(process.env.CPU_RATE||4)});
 await call('Performance.enable');
 
 const before=await call('Performance.getMetrics');
 const result=await js(`(async()=>{const gaps=[];let last=performance.now(),running=true;function frame(t){if(!running)return;gaps.push(t-last);last=t;requestAnimationFrame(frame)}requestAnimationFrame(frame);const buttons=[...document.querySelectorAll('.appearance-options:first-of-type button')];for(const label of ['夏','秋','冬','春']){buttons.find(b=>b.textContent===label).click();await new Promise(r=>setTimeout(r,1800));}running=false;return {frames:gaps.length,over50:gaps.filter(x=>x>50).length,max:Math.max(...gaps),p95:gaps.sort((a,b)=>a-b)[Math.floor(gaps.length*.95)],season:document.querySelector('.settings').dataset.season||document.documentElement.dataset.season};})()`);
 const after=await call('Performance.getMetrics');
 for(const key of ['RecalcStyleDuration','LayoutDuration','TaskDuration'])result[key]=Math.round((after.metrics.find(x=>x.name===key).value-before.metrics.find(x=>x.name===key).value)*1000);
 console.log(JSON.stringify(result));
 assert.equal(result.season,'spring');
 // Three missed 60 Hz frames is a visible hitch; allow at most one scheduling outlier.
 assert.ok(result.over50<=1,`Season switch stutters: ${result.over50} frames over 50 ms`);
 await js(`(async()=>{const buttons=[...document.querySelectorAll('.appearance-options:first-of-type button')];for(const label of ['夏','冬','秋']){buttons.find(b=>b.textContent===label).click();await new Promise(r=>setTimeout(r,80));}await new Promise(r=>setTimeout(r,1700));})()`);
 assert.equal(await js("document.querySelector('.settings').dataset.season"),'autumn');
 await js("[...document.querySelectorAll('.appearance-options button')].find(b=>b.textContent==='夜晚').click()");
 await new Promise(r=>setTimeout(r,400));
 assert.equal(await js("document.querySelector('.settings').dataset.night"),'true');
 await js("document.querySelector('.settings [role=switch]').click()");await new Promise(r=>setTimeout(r,400));
 assert.equal(await js("getComputedStyle(document.querySelector('.appearance-preview .season-particles')).display"),'none');
 await js("document.querySelector('.settings [role=switch]').click()");await new Promise(r=>setTimeout(r,400));
 assert.notEqual(await js("getComputedStyle(document.querySelector('.appearance-preview .particles-autumn')).display"),'none');
 assert.ok(await js("[...document.querySelectorAll('.appearance-preview .season-photo img')].some(i=>i.src.endsWith('/autumn.png')&&getComputedStyle(i).opacity==='1')"));
 await js("document.querySelector('.settings [data-slot=dialog-close]').click()");
 await new Promise(r=>setTimeout(r,1200));
 assert.equal(await js("document.documentElement.dataset.season"),'autumn');
 await js('location.reload()');await new Promise(r=>setTimeout(r,1800));
 assert.equal(await js("document.documentElement.dataset.season"),'autumn');
 console.log('PASS: rapid selection keeps the latest photo; close and reload preserve the chosen theme');
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();}




