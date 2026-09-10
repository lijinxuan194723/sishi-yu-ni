import assert from 'node:assert/strict';
import {ambienceAt,readAppearance,seasons} from './lib/ambience.ts';
for(const season of seasons){
 const saved=readAppearance({season,period:'auto',effects:true});
 const morning=ambienceAt(new Date(2026,8,9,9),saved),night=ambienceAt(new Date(2026,8,9,20),saved);
 assert.equal(morning.season,season);assert.equal(night.season,season);
 assert.equal(morning.period,'早上');assert.equal(night.period,'夜晚');
 assert.equal(morning.night,0);assert.equal(night.night,1);
}
const fixed=readAppearance({season:'auto',period:'夜晚'});
assert.equal(ambienceAt(new Date(2026,0,9,9),fixed).season,'winter');
assert.equal(ambienceAt(new Date(2026,6,9,9),fixed).season,'summer');
assert.equal(ambienceAt(new Date(2026,6,9,9),fixed).period,'夜晚');
console.log('PASS: every fixed season follows local day/night; automatic seasons preserve a fixed period');
