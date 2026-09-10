export const seasons=['spring','summer','autumn','winter'] as const;
export const periods=['清晨','早上','正午','午后','傍晚','夜晚','深夜'] as const;
export type Appearance={season:'auto'|typeof seasons[number];period:'auto'|typeof periods[number];effects?:boolean};
export const autoAppearance:Appearance={season:'auto',period:'auto',effects:true};
export function readAppearance(value:any):Appearance{return {season:['auto',...seasons].includes(value?.season)?value.season:'auto',period:['auto',...periods].includes(value?.period)?value.period:'auto',effects:value?.effects!==false};}
export const seasonPhotos={spring:'/images/seasons/spring.png',summer:'/images/seasons/summer.png',autumn:'/images/seasons/autumn.png',winter:'/images/seasons/winter.png'};
export function ambienceAt(date:Date,options:Appearance=autoAppearance){
 const season=options.season==='auto'?seasons[Math.floor(((date.getMonth()+10)%12)/3)]:options.season;
 const hour=options.period==='auto'?date.getHours()+date.getMinutes()/60+date.getSeconds()/3600:({清晨:6.5,早上:9,正午:12,午后:15,傍晚:18,夜晚:20,深夜:23})[options.period];
 const period=hour<5?'深夜':hour<7?'清晨':hour<11?'早上':hour<14?'正午':hour<17?'午后':hour<19?'傍晚':hour<22?'夜晚':'深夜';
 // Local civil time, not an astronomical sunrise estimate. Adjacent light layers crossfade continuously.
 const stops=[{at:0,light:3},{at:5,light:3},{at:6.5,light:0},{at:9,light:1},{at:16,light:1},{at:18,light:2},{at:20,light:3},{at:24,light:3}];
 const end=stops.findIndex(s=>s.at>hour),a=stops[end-1],b=stops[end];
 const t=(hour-a.at)/(b.at-a.at),blend=t*t*(3-2*t),lights=[0,0,0,0];lights[a.light]+=1-blend;lights[b.light]+=blend;
 const seasonName={spring:'春日',summer:'盛夏',autumn:'秋日',winter:'冬日'}[season];
 const greeting=hour<5||hour>=22?'夜已经深了，让心事慢慢落下。':hour<11?'早安，今天也想第一个见到你。':hour<17?'把这一刻的光，留在我们之间。':hour<19?'晚霞很温柔，身边有你就更好了。':'夜色安静下来，我陪你慢慢聊。';
 return {season,seasonName,period,lights,greeting,night:lights[3],time:date.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})};
}
