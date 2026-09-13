import assert from 'node:assert/strict';
import {parseData} from '../../lib/companion.ts';
import {defaultPomodoro,pomodoroFocus,finishFocus} from '../../lib/focus.ts';
let data={name:'我',since:'2023-07-08',messages:[],notes:[],tasks:[],checks:[],focus:pomodoroFocus({...defaultPomodoro})};
function finish(){const end=Date.now();data.focus={...data.focus,endsAt:end};data={...data,...finishFocus(data,end)};assert.deepEqual(finishFocus(data,end),{});data=parseData(JSON.stringify(data));}
for(let i=1;i<=4;i++){finish();assert.equal(data.focus.pomodoro.completed,i);assert.equal(data.focusLog.length,i);assert.equal(data.focus.pomodoro.phase,i===4?'long':'short');assert.equal(data.focus.minutes,i===4?15:5);assert.equal(data.focus.endsAt,undefined);finish();assert.equal(data.focus.pomodoro.phase,'work');assert.equal(data.focus.minutes,25);assert.equal(data.focus.pomodoro.completed,i===4?0:i);assert.equal(data.focusLog.length,i);}
assert.equal(data.focusLog.reduce((n,l)=>n+l.minutes,0),100);assert.ok(data.focusLog.every(l=>l.kind==='pomodoro'));
data.focus=pomodoroFocus({...defaultPomodoro,work:40,short:8,long:20,rounds:1});finish();assert.equal(data.focus.minutes,20);assert.equal(data.focus.pomodoro.phase,'long');
for(const patch of [{rounds:0},{completed:99},{phase:'invalid'},{phase:'short',completed:0},{work:0}])assert.throws(()=>parseData(JSON.stringify({...data,focus:{...data.focus,pomodoro:{...data.focus.pomodoro,...patch}}})));
console.log('PASS: four work/break cycles, long rest/reset, exactly-once focus-only logs, manual phase start, custom durations/rounds, backup roundtrip/validation');
