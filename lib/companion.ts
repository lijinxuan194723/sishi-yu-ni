export type Memory={summary:string;through:number;pinned:string;updatedAt:string};
export type Data = {name:string; since:string; messages:{who:string;text:string;source?:string;at?:string}[]; tasks:{id:string;date:string;text:string;done:boolean}[]; notes:{date:string;text:string}[]; checks:string[]; memory?:Memory};
export const emptyMemory:Memory={summary:'',through:0,pinned:'',updatedAt:''};
export function dateKey(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function validDate(value:unknown):value is string{return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&dateKey(new Date(value+'T12:00:00'))===value;}
export function parseData(text:string):Data{
 const p=JSON.parse(text);const str=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max;
 if(!p||!str(p.name,12)||!validDate(p.since)||!Array.isArray(p.messages)||!p.messages.every((m:any)=>m&&['me','luke'].includes(m.who)&&str(m.text,20000)&&(m.source===undefined||['model','demo'].includes(m.source))&&(m.at===undefined||str(m.at,40)))||!Array.isArray(p.tasks)||!p.tasks.every((t:any)=>t&&str(t.id,100)&&validDate(t.date)&&str(t.text,150)&&typeof t.done==='boolean')||!Array.isArray(p.notes)||!p.notes.every((n:any)=>n&&validDate(n.date)&&str(n.text,5000))||!Array.isArray(p.checks)||!p.checks.every(validDate))throw new Error('备份格式不正确');
 const m=p.memory;if(m&&(!str(m.summary,14000)||!str(m.pinned,5000)||!str(m.updatedAt,40)||!Number.isSafeInteger(m.through)||m.through<0||m.through>p.messages.length||(!m.summary&&m.through!==0)))throw new Error('记忆格式不正确');
 return {name:p.name,since:p.since,messages:p.messages.map((x:any)=>({who:x.who,text:x.text,...(x.source?{source:x.source}:{}),...(x.at?{at:x.at}:{})})),tasks:p.tasks.map((x:any)=>({id:x.id,date:x.date,text:x.text,done:x.done})),notes:p.notes.map((x:any)=>({date:x.date,text:x.text})),checks:p.checks,...(m?{memory:{summary:m.summary,pinned:m.pinned,through:m.through,updatedAt:m.updatedAt}}:{})};
}
export function companionReply(text:string){return /累|难过|伤心/.test(text)?'辛苦啦。先在这里休息一下吧，我陪着你。':/晚安|睡/.test(text)?'晚安，明天也一起度过吧。祝你做个好梦。':/想你|喜欢/.test(text)?'我也很想见到你。和你一起的每一天，都值得好好珍藏。':'嗯，我在听。今天的小事，也可以慢慢说给我听。';}

export function togetherDays(since:string,now=new Date()){return Math.max(1,Math.floor((Date.parse(dateKey(now)+'T00:00:00Z')-Date.parse(since+'T00:00:00Z'))/86400000)+1);}
