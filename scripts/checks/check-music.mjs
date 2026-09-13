import assert from 'node:assert/strict';
import {songs,shuffledSongs} from '../../lib/music.ts';
import {defaultDates} from '../../lib/default-dates.ts';
import {parseData,togetherDays} from '../../lib/companion.ts';
assert.equal(songs.length,30);
assert.equal(new Set(songs.map(s=>s[0])).size,30);
for(let last=0;last<30;last++){const deck=shuffledSongs(last);assert.equal(new Set(deck).size,30);assert.notEqual(deck[0],last);assert.ok(deck.every(i=>i>=0&&i<30));}
const data={name:'我',...defaultDates,messages:[],tasks:[],notes:[],checks:[]};
assert.equal(parseData(JSON.stringify(data)).birthday,'2002-10-05');
assert.equal(togetherDays(defaultDates.since,new Date('2023-07-08T12:00:00')),1);
assert.equal(parseData(JSON.stringify({...data,since:'2020-01-01',birthday:'1999-02-03'})).since,'2020-01-01');
console.log('PASS: 30 unique songs, shuffled cycles with no adjacent repeat, built-in dates and editable dates round-trip');
