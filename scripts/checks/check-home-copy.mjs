import assert from 'node:assert/strict';
import {quotePool,officialQuotes,originalQuotes,littleMoments,homeCopy,weatherCopy} from '../../lib/home-copy.ts';
assert.equal(officialQuotes.length,8);assert.equal(originalQuotes.length,40);assert.equal(quotePool.length,48);assert.equal(littleMoments.length,24);
assert.equal(new Set(quotePool.map(q=>q.text)).size,48);
const now=new Date(2026,8,9,12),w={kind:'sun',temperature:20,rainSoon:false};
assert.equal(new Set(Array.from({length:48},(_,i)=>homeCopy(now,'正午',i).quote.text)).size,48);
assert.notEqual(homeCopy(now,'正午').greeting,homeCopy(now,'夜晚').greeting);
for(let day=1;day<=4;day++){
 const date=new Date(2026,8,day,12);
 assert.match(weatherCopy({...w,kind:'rain'},date),/雨/);
 assert.match(weatherCopy({...w,kind:'storm'},date),/雷雨/);
 assert.match(weatherCopy({...w,kind:'snow'},date),/雪/);
 assert.match(weatherCopy({...w,rainSoon:true},date),/伞/);
 assert.match(weatherCopy({...w,temperature:35},date),/热|气温偏高/);
 assert.match(weatherCopy({...w,temperature:0},date),/冷|保暖|气温偏低/);
 assert.match(weatherCopy({...w,kind:'fog'},date),/雾|能见度/);
 assert.match(weatherCopy({...w,kind:'cloud'},date),/云/);
 assert.doesNotMatch(weatherCopy(w,new Date(2026,8,day,22)),/防晒|太阳|晴天/);
}
console.log('PASS: 48 unique quotes, provenance, period rotation, all weather branches and clear-night wording');
