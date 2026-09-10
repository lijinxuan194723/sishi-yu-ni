import type {Data} from './companion.ts';
export type Pomodoro={work:number;short:number;long:number;rounds:number;completed:number;phase:'work'|'short'|'long'};
export const defaultPomodoro:Pomodoro={work:25,short:5,long:15,rounds:4,completed:0,phase:'work'};
export type Focus={minutes:number;remainingMs:number;endsAt?:number;title?:string;group?:string;pomodoro?:Pomodoro};
export function pomodoroFocus(p:Pomodoro,title?:string,group?:string):Focus{const minutes=p[p.phase];return {minutes,remainingMs:minutes*60000,pomodoro:p,...(title?{title}:{}),...(group?{group}:{})};}
export function remainingFocus(focus:Focus,now=Date.now()){return Math.max(0,Math.min(focus.minutes*60000,focus.endsAt===undefined?focus.remainingMs:focus.endsAt-now));}
export function finishFocus(data:Data,end:number):Partial<Data>{
 if(data.focus?.endsAt!==end)return {};
 const p=data.focus.pomodoro,label={...(data.focus.title?{title:data.focus.title}:{}),...(data.focus.group?{group:data.focus.group}:{})};
 if(p){
  if(p.phase!=='work')return {focus:pomodoroFocus({...p,phase:'work',completed:p.phase==='long'?0:p.completed},data.focus.title,data.focus.group)};
  const completed=p.completed+1;
  return {focus:pomodoroFocus({...p,completed,phase:completed>=p.rounds?'long':'short'},data.focus.title,data.focus.group),focusLog:[...(data.focusLog??[]),{at:new Date(end).toISOString(),minutes:data.focus.minutes,kind:'pomodoro',...label}]};
 }
 return {focus:{minutes:data.focus.minutes,remainingMs:0,...label},focusLog:[...(data.focusLog??[]),{at:new Date(end).toISOString(),minutes:data.focus.minutes,...label}]};
}
