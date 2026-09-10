import assert from 'node:assert/strict';
import {LUKE_KNOWLEDGE,lukeKnowledgeContext,lukeKnowledgeStats,retrieveLukeKnowledge} from '../../lib/luke-knowledge.ts';

const stats=lukeKnowledgeStats();
assert.equal(stats.total,412);
assert.deepEqual(stats.categories,{profile:41,personality:76,relationship:38,skill:42,experience:155,daily:60});
assert.equal(new Set(LUKE_KNOWLEDGE.map(item=>item.id)).size,412);

const cooking=retrieveLukeKnowledge('你会做饭吗',10).map(item=>item.id);
assert.ok(cooking.includes('SKL-030'));
assert.ok(cooking.includes('SKL-032'));
const parents=retrieveLukeKnowledge('你父母是谁',10).map(item=>item.id);
assert.ok(parents.includes('BAS-025'));
assert.ok(parents.includes('BAS-026'));
const watson=retrieveLukeKnowledge('你为什么叫我华生',10).map(item=>item.id);
assert.ok(watson.includes('REL-006'));
const photo=retrieveLukeKnowledge('你喜欢拍照吗',10).map(item=>item.id);
assert.ok(photo.includes('SKL-017'));

for(const query of ['你会做饭吗','你小时候是什么样','你喜欢拍照吗']){
 const normal=retrieveLukeKnowledge(query,20);
 assert.ok(normal.every(item=>item.canonScope!=='parallel_au'&&item.canonScope!=='dream_or_special'));
}
const parallel=retrieveLukeKnowledge('换日线是什么',10);
assert.ok(parallel.some(item=>item.id==='EXP-155'&&item.canonScope==='parallel_au'));

const context=lukeKnowledgeContext('你喜欢拍照吗');
assert.match(context,/SKL-017/);
assert.match(context,/不自动改写成当前用户亲历/);
assert.ok(context.length<8000);
console.log('PASS: 412 Luke memories loaded; category counts, source scope, AU isolation and contextual retrieval verified');
