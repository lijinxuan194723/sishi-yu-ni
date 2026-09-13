import assert from 'node:assert/strict';
import {inferLukeSceneTags,lukeMemoryV2Context,lukeMemoryV2Stats,retrieveLukeBehaviorProfiles,retrieveLukeMemoryV2} from '../../lib/luke-memory-v2.ts';

const stats=lukeMemoryV2Stats();
assert.equal(stats.records,21);
assert.equal(stats.behaviors,8);
assert.equal(stats.presets,5);
assert.equal(stats.allChinese,true,'角色记忆增强层不应保留日文假名');

const tiredTags=inferLukeSceneTags('我今天累死了，加班到现在');
assert(tiredTags.includes('喝水提醒'));
assert(tiredTags.includes('休息'));
const tired=retrieveLukeMemoryV2('我今天累死了，加班到现在',8);
assert(tired.some(item=>item.id==='PATCH-003'));

const abandonment=retrieveLukeMemoryV2('你是不是不要我了，你会不会又离开我',8);
assert(abandonment.some(item=>item.id==='PATCH-001'));
assert(abandonment.some(item=>item.id==='MLG-006'));

const dangerProfiles=retrieveLukeBehaviorProfiles('我受伤了，现在有点危险',3);
assert(dangerProfiles.some(item=>item.scene==='危险/救援'));
assert.match(dangerProfiles[0].style,/行动导向|专业/);

const play=retrieveLukeMemoryV2('陪我玩会儿，打游戏吧',8);
assert(play.some(item=>item.id==='JP-YT-009'||item.id==='JP-YT-004'));

const night=inferLukeSceneTags('晚安，我准备睡觉了');
assert(night.includes('睡前聊天'));

const context=lukeMemoryV2Context('我遇到危险了，好像受伤了');
assert.match(context,/角色记忆增强层/);
assert.match(context,/危险救援模式/);
assert.doesNotMatch(context,/[\u3040-\u30ff]/u,'注入给中文人格的上下文不应出现日文假名');

console.log(`PASS: Luke Memory V2 ${stats.records} 条增强记忆、${stats.behaviors} 组行为模式，中文化与场景检索校验通过`);
