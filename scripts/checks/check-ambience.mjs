import assert from 'node:assert/strict';
import {ambienceAt} from '../../lib/ambience.ts';
for(const [month,season] of [[0,'winter'],[2,'spring'],[5,'summer'],[8,'autumn'],[11,'winter']])assert.equal(ambienceAt(new Date(2026,month,1)).season,season);
for(const [hour,period] of [[0,'深夜'],[5,'清晨'],[7,'早上'],[11,'正午'],[14,'午后'],[17,'傍晚'],[19,'夜晚'],[22,'深夜']])assert.equal(ambienceAt(new Date(2026,8,9,hour)).period,period);
let previous;
for(let second=0;second<86400;second+=30){const s=ambienceAt(new Date(2026,8,9,0,0,second));assert.ok(Math.abs(s.lights.reduce((a,b)=>a+b,0)-1)<1e-10);assert.ok(s.lights.every(x=>x>=0&&x<=1));if(previous)assert.ok(s.lights.every((x,i)=>Math.abs(x-previous[i])<.02));previous=s.lights;}
assert.deepEqual(ambienceAt(new Date(2026,8,9,23,59)).lights,ambienceAt(new Date(2026,8,10,0)).lights);
console.log('PASS: four seasons, all time boundaries, continuous normalized light blends, midnight continuity');
