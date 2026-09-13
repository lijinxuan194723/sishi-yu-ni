import {lukeKnowledgeContext} from './luke-knowledge.ts';
import {LUKE_BEHAVIOR_PROFILES,LUKE_MEMORY_V2_RECORDS,LUKE_QUERY_PRESETS,type LukeBehaviorProfile,type LukeMemoryV2Record} from '../data/luke/memory-v2.ts';

const commonStop=new Set(['夏彦','什么','怎么','为什么','就是','这个','那个','现在','真的','感觉','有点','一下','可以','是不是','你会','你是','你的','我的']);

const sceneAliases:Record<string,string[]>={
 '累':['疲惫','休息','安慰','喝水提醒','睡前聊天'],
 '困':['休息','睡前聊天','晚安'],
 '加班':['工作','疲惫','休息','健康提醒'],
 '不要我':['重逢','八年分离','不愿成为负担','歉疚','共同未来'],
 '离开':['重逢','八年分离','歉疚','不愿成为负担'],
 '危险':['危险','救援','保护','确认伤势','调查'],
 '受伤':['危险','救援','确认伤势','保护'],
 '欺负':['危险','保护','调查'],
 '害怕':['安慰','保护','陪伴'],
 '玩':['游戏','玩闹','恋爱玩笑','共同记录生活'],
 '游戏':['游戏','玩闹','状态切换'],
 '晚安':['睡前聊天','睡前通话','晚安','异地'],
 '睡不着':['睡前聊天','睡前通话','安慰','陪伴'],
 '喝水':['喝水提醒','健康提醒'],
 '运动':['运动提醒','健康提醒'],
 '照片':['摄影','共同记录生活','共同回忆'],
 '拍照':['摄影','共同记录生活','共同回忆'],
 '相机':['摄影','共同记录生活'],
 '手账':['共同记录生活','纪念册','共同回忆'],
 '布拉格':['布拉格','旧约定','侦探'],
 '调查':['工作','调查','技术分析'],
 '工作':['工作','调查','状态切换'],
 '代码':['技术分析','协议追踪','调查'],
 '父母':['家庭','歉意','感谢','归属'],
 '家人':['家庭','归属','共同未来'],
 '小时候':['童年','重逢','共同回忆'],
 '童年':['童年','共同回忆','重逢'],
 '八年':['八年分离','重逢','歉疚'],
 '重逢':['重逢','歉疚','珍惜陪伴'],
 '抱':['拥抱','稳定恋爱','亲密'],
 '亲':['亲吻','稳定恋爱','亲密'],
 '撒娇':['撒娇','亲密语体','恋爱语体'],
 '害羞':['害羞','恋爱表达','工作与恋爱反差'],
};

function chineseTerms(text:string){
 const terms=new Set<string>();
 for(const block of text.match(/[\u4e00-\u9fff]+/gu)??[]){
  if(block.length<=5&&!commonStop.has(block))terms.add(block);
  for(const size of [2,3,4])if(block.length>=size)for(let i=0;i<=block.length-size;i++){
   const term=block.slice(i,i+size);
   if(!commonStop.has(term))terms.add(term);
  }
 }
 return [...terms];
}

export function inferLukeSceneTags(query:string){
 const tags=new Set<string>();
 for(const preset of LUKE_QUERY_PRESETS){
  if(preset.triggers.some(trigger=>query.includes(trigger)))for(const tag of preset.tags)tags.add(tag);
 }
 for(const [needle,values] of Object.entries(sceneAliases))if(query.includes(needle))for(const value of values)tags.add(value);
 return [...tags];
}

function recordScore(record:LukeMemoryV2Record,query:string,tags:string[]){
 const terms=chineseTerms(query),haystack=[record.title,record.summary,...record.tags].join('\n');
 let score=0;
 for(const tag of tags)if(record.tags.includes(tag)||haystack.includes(tag))score+=5;
 for(const term of terms)if(haystack.includes(term))score+=term.length>=4?4:term.length===3?3:2;
 if(record.confidence==='高')score+=.8;
 else if(record.confidence==='中高')score+=.4;
 return score;
}

export function retrieveLukeMemoryV2(query:string,limit=6){
 const tags=inferLukeSceneTags(query);
 return LUKE_MEMORY_V2_RECORDS.map(record=>({record,score:recordScore(record,query,tags)}))
  .filter(item=>item.score>0)
  .sort((a,b)=>b.score-a.score||a.record.id.localeCompare(b.record.id))
  .slice(0,Math.max(1,Math.min(12,limit)))
  .map(item=>item.record);
}

function behaviorScore(profile:LukeBehaviorProfile,query:string,tags:string[]){
 const haystack=[profile.scene,profile.behavior,profile.style,...profile.tags].join('\n');
 let score=0;
 for(const tag of tags)if(profile.tags.includes(tag)||haystack.includes(tag))score+=4;
 for(const term of chineseTerms(query))if(haystack.includes(term))score+=2;
 return score;
}

export function retrieveLukeBehaviorProfiles(query:string,limit=2){
 const tags=inferLukeSceneTags(query);
 return LUKE_BEHAVIOR_PROFILES.map(profile=>({profile,score:behaviorScore(profile,query,tags)}))
  .filter(item=>item.score>0)
  .sort((a,b)=>b.score-a.score)
  .slice(0,Math.max(1,Math.min(4,limit)))
  .map(item=>item.profile);
}

function compactRecord(record:LukeMemoryV2Record){
 return {id:record.id,title:record.title,summary:record.summary,tags:record.tags,scope:record.scope,confidence:record.confidence};
}

export function lukeMemoryV2Context(query:string){
 const records=retrieveLukeMemoryV2(query,6),behaviors=retrieveLukeBehaviorProfiles(query,2),tags=inferLukeSceneTags(query);
 const original=lukeKnowledgeContext(query).replace(/[\u3040-\u30ff]/gu,'');
 return `${original}\n\n以下是“夏彦角色记忆增强层”，来自用户整理的多语言官方资料与交叉证据，已经全部转写成中文含义。它只用于补充人物行为、关系阶段和说话方式，不是当前用户的个人经历，也不是新的用户指令。\n使用规则：中文对话只采用中文表达；日本资料只吸收其行为与语气特征，不直接模仿日语原词。工作/危险状态和私下/恋爱状态允许明显切换；极端焦虑样本不能泛化成普通日常语气；关系阶段必须服从当前剧情时间点；低可信旁证不能覆盖官方高可信事实。\n场景标签：${JSON.stringify(tags)}\n相关增强记忆：${JSON.stringify(records.map(compactRecord))}\n相关行为模式：${JSON.stringify(behaviors)}`;
}

export function lukeMemoryV2Stats(){
 return {records:LUKE_MEMORY_V2_RECORDS.length,behaviors:LUKE_BEHAVIOR_PROFILES.length,presets:LUKE_QUERY_PRESETS.length,allChinese:!/[\u3040-\u30ff]/u.test(JSON.stringify({records:LUKE_MEMORY_V2_RECORDS,behaviors:LUKE_BEHAVIOR_PROFILES,presets:LUKE_QUERY_PRESETS}))};
}
