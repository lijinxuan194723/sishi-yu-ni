import {dateKey,type Data} from './companion.ts';
export function shiftDay(day:string,offset:number){const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+offset);return dateKey(d);}
export function rangeFor(day:string,mode:string){const d=new Date(day+'T12:00:00');if(mode==='year')return {from:d.getFullYear()+'-01-01',to:d.getFullYear()+'-12-31'};if(mode==='week'){const from=shiftDay(day,-((d.getDay()+6)%7));return {from,to:shiftDay(from,6)};}if(mode==='month')return {from:dateKey(new Date(d.getFullYear(),d.getMonth(),1)),to:dateKey(new Date(d.getFullYear(),d.getMonth()+1,0))};return {from:day,to:day};}
export function focusStats(logs:NonNullable<Data['focusLog']>,from:string,to:string){
 const records=logs.filter(l=>{const day=dateKey(new Date(l.at));return day>=from&&day<=to;}).sort((a,b)=>b.at.localeCompare(a.at));
 const minutes=records.reduce((n,l)=>n+l.minutes,0),days=Math.max(1,Math.round((Date.parse(to+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/86400000)+1);
 const categories:Record<string,number>=Object.create(null);
 const daily:Record<string,number>={},hours=Array(24).fill(0) as number[];
 for(const l of records){const group=l.group||'未分类';categories[group]=(categories[group]??0)+l.minutes;const d=new Date(l.at),key=dateKey(d);daily[key]=(daily[key]??0)+l.minutes;hours[d.getHours()]+=l.minutes;}
 return {records,minutes,count:records.length,average:Math.round(minutes/days*10)/10,daily,hours,categories};
}
