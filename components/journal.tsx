'use client';

import {MemoBoard} from '@/components/memo-board';
import type {Data} from '@/lib/companion';

export function Journal({data}:{data:Data;ready:boolean;save:(patch:Partial<Data>|((current:Data)=>Partial<Data>))=>void;today:string;text:string;setText:(text:string)=>void;openMessage:(index:number)=>void}){
 return <MemoBoard legacyNotes={data.notes}/>;
}
