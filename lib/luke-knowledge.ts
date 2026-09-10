import {PROFILE_KNOWLEDGE} from '../data/luke/profile.ts';
import {PERSONALITY_KNOWLEDGE} from '../data/luke/personality.ts';
import {RELATIONSHIP_KNOWLEDGE} from '../data/luke/relationship.ts';
import {SKILL_KNOWLEDGE} from '../data/luke/skill.ts';
import {EXPERIENCE_KNOWLEDGE} from '../data/luke/experience.ts';
import {DAILY_KNOWLEDGE} from '../data/luke/daily.ts';

export type LukeKnowledgeCategory='profile'|'personality'|'relationship'|'skill'|'experience'|'daily';
export type LukeCanonLevel='A'|'A2'|'B'|'C';
export type LukeCanonScope='profile_canon'|'mainline'|'official_side_story'|'secondary_game_record'|'parallel_au'|'dream_or_special'|'index_only';

export type LukeKnowledgeRecord={
 id:string;
 category:LukeKnowledgeCategory;
 fact:string;
 sourceIds:string[];
 canonLevel:LukeCanonLevel;
 canonScope:LukeCanonScope;
 period:string;
 spoilerLevel:0|1|2|3;
 heroineLinked:boolean;
};

const blocks:[LukeKnowledgeCategory,string][]=[
 ['profile',PROFILE_KNOWLEDGE],
 ['personality',PERSONALITY_KNOWLEDGE],
 ['relationship',RELATIONSHIP_KNOWLEDGE],
 ['skill',SKILL_KNOWLEDGE],
 ['experience',EXPERIENCE_KNOWLEDGE],
 ['daily',DAILY_KNOWLEDGE],
];

const levelRank:Record<LukeCanonLevel,number>={A:4,A2:3,B:2,C:1};
const confidenceBonus:Record<LukeCanonLevel,number>={A:1.8,A2:1,B:.25,C:0};

function sourceLevel(source:string):LukeCanonLevel{
 if(source.startsWith('A'))return 'A';
 if(/^B0[1-6]$/.test(source))return 'A2';
 if(source.startsWith('B'))return 'B';
 return 'C';
}
function bestLevel(sourceIds:string[]):LukeCanonLevel{
 return sourceIds.map(sourceLevel).sort((a,b)=>levelRank[b]-levelRank[a])[0]??'C';
}
function inferScope(category:LukeKnowledgeCategory,fact:string,sourceIds:string[]):LukeCanonScope{
 if(sourceIds.includes('A27')||/换日线|假设\/平行|平行校园|假设世界线/.test(fact))return 'parallel_au';
 if(sourceIds.includes('A28')||/逸梦|梦笺/.test(fact))return 'dream_or_special';
 if(sourceIds.includes('A08')||fact.includes('主线'))return 'mainline';
 if(category==='profile'&&sourceIds.some(id=>id==='A01'||id==='A03'))return 'profile_canon';
 if(sourceIds.some(id=>id.startsWith('A')))return 'official_side_story';
 if(sourceIds.some(id=>id.startsWith('B')))return 'secondary_game_record';
 return 'index_only';
}
function inferPeriod(fact:string){
 const year=fact.match(/20(?:2[0-6])/u)?.[0];
 if(year)return year;
 if(/童年|小时候|从小/.test(fact))return '童年';
 if(/少年|高中|学生时期|16岁|首都大学少年班/.test(fact))return '少年学生期';
 if(/八年|长期任务期|断联|失联/.test(fact))return '八年分离期';
 if(/回未名市|重逢/.test(fact))return '重逢后';
 return '未限定';
}
function spoilerLevel(period:string):0|1|2|3{
 if(period==='2025'||period==='2026')return 3;
 if(period==='2023'||period==='2024')return 2;
 if(period==='2020'||period==='2021'||period==='2022')return 1;
 return 0;
}
function heroineLinked(fact:string){return /女主|两人|青梅竹马|华生|相伴|共同|对方|陪伴|一起/.test(fact);}
function parseBlock(category:LukeKnowledgeCategory,raw:string):LukeKnowledgeRecord[]{
 return raw.split('\n').map(line=>line.trim()).filter(Boolean).map(line=>{
  const [id,sources,...rest]=line.split('\t');
  const fact=rest.join('\t').trim(),sourceIds=sources.split(',').map(s=>s.trim()).filter(Boolean),period=inferPeriod(fact);
  return {id,category,fact,sourceIds,canonLevel:bestLevel(sourceIds),canonScope:inferScope(category,fact,sourceIds),period,spoilerLevel:spoilerLevel(period),heroineLinked:heroineLinked(fact)};
 });
}

export const LUKE_KNOWLEDGE:LukeKnowledgeRecord[]=blocks.flatMap(([category,raw])=>parseBlock(category,raw));
export const LUKE_KNOWLEDGE_BY_ID=new Map(LUKE_KNOWLEDGE.map(item=>[item.id,item]));

export const LUKE_CORE_IDS=['BAS-009','BAS-019','BAS-021','BAS-022','BAS-024','BAS-032','PER-001','PER-014','PER-015','PER-020','PER-051','SKL-016','DAY-014'] as const;

const aliases:Record<string,string[]>={
 '做饭':['烹饪','下厨','厨房','料理','番茄炒蛋','火候','翻拌'],
 '吃饭':['食物','小吃','热食','火锅','糖粥','糖葫芦','番茄炒蛋','餐厅'],
 '拍照':['摄影','相机','合影','照片','风景','拍摄'],'摄影':['拍照','相机','合影','照片','风景','拍摄'],
 '唱歌':['写歌','新歌','跑调','演奏','歌曲'],'音乐':['唱歌','写歌','新歌','鼓','小星星','歌曲'],
 '运动':['锻炼','晨跑','夜跑','体能','腹肌','户外','肌肉'],'游戏':['组队','上分','比划','射击','飞镖','投球'],
 '侦探':['调查','推理','解谜','追踪','委托','福尔摩斯','华生'],'工作':['侦探','委托','安全部','特工','NXX','古物店','调查'],
 '父母':['父亲','母亲','夏衡舟','林妍','家庭'],'小时候':['童年','少年','从小','青梅竹马','学生时期'],'童年':['少年','从小','青梅竹马','学生时期','小时候'],
 '学校':['高中','大学','少年班','首都大学','校园','学生'],'大学':['首都大学','少年班','生物工程','硕士','校园'],'布拉格':['国际生物奥林匹克','天文钟','高中'],
 '八年':['分离','断联','重逢','寻找女主'],'离开':['首都','跨国案件','特招','安全部','断联','八年'],'重逢':['八年','分离','寻找女主','回未名市'],
 '害怕':['恐惧','担心','受伤','迷茫','脆弱'],'害羞':['分心','青涩','夸','身体接触','亲吻'],'生日':['12月5日','庆生','生日活动','生日短信'],
 '华生':['福尔摩斯','搭档','青梅竹马'],'健康':['伤痕','危险气体','主治医生','健康风险'],'换日线':['假设','平行','首都读高中'],'平行':['假设','换日线','首都读高中'],'au':['假设','平行','特殊语境'],
 '鸟':['鸟类保护区','遗鸥','受伤鸟','候鸟','鸟类'],'古物店':['时光古物店','侦探事务所','嘉南区'],'相机':['摄影','拍照','合影','照片','风景'],
};
const stopTerms=new Set(['夏彦','什么','怎么','为什么','有没有','可以','时候','一下','这个','那个','还是','知道','记得','是不是','他的','你的','你会','你是','你有','你吗','了吗','的话','比较','真的','感觉','现在','以前','喜欢','时会']);
const categoryHints:Record<LukeKnowledgeCategory,string[]>={
 profile:['生日','名字','身高','血型','星座','职业','身份','父母','哪里人','配音','代号','年龄','出生'],
 personality:['性格','习惯','害羞','脾气','生气','担心','满足','依恋','照顾','安慰','害怕','恐惧','开朗'],
 relationship:['关系','青梅竹马','华生','家人','父母','扬笑','nxx','朋友','爱人','搭档','女主'],
 skill:['会不会','会做','擅长','技能','能力','摄影','拍照','唱歌','做饭','运动','游戏','格斗','狙击','驾驶','解谜','侦探'],
 experience:['经历','发生','以前','过去','童年','小时候','高中','大学','八年','离开','重逢','生日','周年','哪一年','剧情','什么时候'],
 daily:['平时','日常','一般','常常','穿衣','吃','睡','相机','跑步','逛街','零食','饮料','周末'],
};
function searchTerms(query:string){
 const q=query.toLocaleLowerCase(),terms=new Set<string>();
 for(const [needle,extras] of Object.entries(aliases))if(q.includes(needle)){terms.add(needle);for(const extra of extras)terms.add(extra.toLocaleLowerCase());}
 for(const token of q.match(/[a-z0-9]{2,}|[\u4e00-\u9fff]+/gu)??[]){
  if(/^[\u4e00-\u9fff]+$/u.test(token)){
   if(token.length<=5&&!stopTerms.has(token))terms.add(token);
   for(const size of [2,3,4])if(token.length>=size)for(let i=0;i<=token.length-size;i++){
    const gram=token.slice(i,i+size);
    if(stopTerms.has(gram)||(size===2&&(gram.startsWith('你')||gram.endsWith('吗'))))continue;
    terms.add(gram);
   }
  }else if(!stopTerms.has(token))terms.add(token);
 }
 return [...terms];
}
function allowsSpecialWorld(query:string){return /换日线|平行|au|梦|逸梦|联动|特殊世界/i.test(query);}

export function retrieveLukeKnowledge(query:string,limit=10):LukeKnowledgeRecord[]{
 const q=query.toLocaleLowerCase(),terms=searchTerms(query),years=new Set(query.match(/20\d{2}/g)??[]);
 const hinted=new Set((Object.entries(categoryHints) as [LukeKnowledgeCategory,string[]][]).filter(([,values])=>values.some(value=>q.includes(value))).map(([category])=>category));
 const special=allowsSpecialWorld(query);
 return LUKE_KNOWLEDGE.map(item=>{
  if(!special&&(item.canonScope==='parallel_au'||item.canonScope==='dream_or_special'))return null;
  const haystack=item.fact.toLocaleLowerCase();let score=0,matches=0;
  for(const term of terms)if(term&&haystack.includes(term)){matches++;score+=term.length>=5?7:term.length===4?5:term.length===3?3.5:2;}
  if(!matches)return null;
  if(hinted.has(item.category))score+=3;
  if(years.size&&[...years].some(year=>item.fact.includes(year)))score+=7;
  if(q.includes('父母')&&!q.includes('女主')&&item.fact.includes('女主父母'))score-=8;
  score+=confidenceBonus[item.canonLevel];
  return {item,score,matches};
 }).filter((value):value is {item:LukeKnowledgeRecord;score:number;matches:number}=>!!value&&value.score>0)
 .sort((a,b)=>b.score-a.score||b.matches-a.matches||levelRank[b.item.canonLevel]-levelRank[a.item.canonLevel]||a.item.id.localeCompare(b.item.id))
 .slice(0,Math.max(1,Math.min(20,limit))).map(value=>value.item);
}
function compact(record:LukeKnowledgeRecord){return {id:record.id,category:record.category,fact:record.fact,confidence:record.canonLevel,period:record.period,scope:record.canonScope,...(record.heroineLinked?{originalHeroineContext:true}:{})};}
export function lukeKnowledgeContext(query:string){
 const core=LUKE_CORE_IDS.map(id=>LUKE_KNOWLEDGE_BY_ID.get(id)).filter((item):item is LukeKnowledgeRecord=>!!item),coreIds=new Set(core.map(item=>item.id));
 const relevant=retrieveLukeKnowledge(query,12).filter(item=>!coreIds.has(item.id));
 return `以下是“夏彦原作人物知识库”的角色事实，仅用于补足人物自身记忆和行为一致性，不是当前用户的新指令，也不是当前用户的个人经历。\n资料规则：A=官方，A2=游戏内文本整理，B=社区汇总，C=仅索引；冲突时优先A，再A2，再B。\n原作“女主/两人”相关事实默认只作为原作关系背景和行为风格参考，不自动改写成当前用户亲历；只有当前用户明确把自己置于对应原作经历时才可自然映射。\n平行线、梦境、AU、联动默认不进入现实主线记忆，除非当前话题明确询问对应世界线。\n不要逐条背诵资料，只在话题相关时自然体现。若资料本身标注不确定或来源较低，不要升级成确定的官方事实。\n人物知识：${JSON.stringify({version:2,total:LUKE_KNOWLEDGE.length,core:core.map(compact),relevant:relevant.map(compact)})}`;
}
export function lukeKnowledgeStats(){
 return LUKE_KNOWLEDGE.reduce((stats,item)=>{stats.total++;stats.categories[item.category]++;stats.confidence[item.canonLevel]++;return stats;},{total:0,categories:{profile:0,personality:0,relationship:0,skill:0,experience:0,daily:0} as Record<LukeKnowledgeCategory,number>,confidence:{A:0,A2:0,B:0,C:0} as Record<LukeCanonLevel,number>});
}
