import assert from 'node:assert/strict';
import {parseData,moods} from './lib/companion.ts';
const old={name:'我',since:'2023-07-08',messages:[{who:'luke',text:'我在。',at:'2026-09-09T10:00:00Z'}],notes:[{date:'2026-09-09',text:'旧手记'}],tasks:[],checks:[]};
assert.deepEqual(parseData(JSON.stringify(old)),old);
for(const mood of moods){const data={...old,messages:[{...old.messages[0],favorite:true}],notes:[{date:'2026-09-09',text:'',mood},...old.notes]};assert.deepEqual(parseData(JSON.stringify(data)),data);}
assert.throws(()=>parseData(JSON.stringify({...old,messages:[{...old.messages[0],favorite:'yes'}]})),/收藏/);
assert.throws(()=>parseData(JSON.stringify({...old,notes:[{...old.notes[0],mood:'invalid'}]})),/心情/);
assert.equal(parseData(JSON.stringify({...old,messages:[{...old.messages[0],favorite:false}]})).messages[0].favorite,false);
console.log('PASS: legacy backup compatibility, every mood and mood-only entry roundtrip, favorite timestamp preservation, invalid fields rejected');
