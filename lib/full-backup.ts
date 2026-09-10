import {parseData,type Data} from './companion';
import {MEMO_STORAGE_KEY,parseMemoWorkspace} from './memos';

export const FULL_BACKUP_FORMAT='four-seasons-luke-full-backup';
export const FULL_BACKUP_VERSION=1 as const;
const MAIN_STORAGE_KEY='luke-companion-v1';
const MAX_TOTAL_CHARS=14_000_000;
const sensitiveKey=/(?:api[-_]?key|token|secret|password|credential|authorization|auth[-_]?key)/i;
const sensitiveField=/^(?:key|apiKey|api_key|token|secret|password|credential|authorization)$/i;

export type FullBackup={
 format:typeof FULL_BACKUP_FORMAT;
 version:typeof FULL_BACKUP_VERSION;
 exportedAt:string;
 storage:Record<string,string>;
 excludedSensitiveKeys:string[];
};

function scrub(value:unknown):unknown{
 if(Array.isArray(value))return value.map(scrub);
 if(value&&typeof value==='object'){
  const result:Record<string,unknown>={};
  for(const [key,item] of Object.entries(value as Record<string,unknown>)){
   if(sensitiveField.test(key))continue;
   result[key]=scrub(item);
  }
  return result;
 }
 return value;
}

function safeStorageValue(raw:string){
 try{return JSON.stringify(scrub(JSON.parse(raw)));}
 catch{return raw;}
}

export function buildFullBackup(mainData?:Data):FullBackup{
 const storage:Record<string,string>={},excludedSensitiveKeys:string[]=[];
 for(let i=0;i<localStorage.length;i++){
  const key=localStorage.key(i);
  if(!key||!key.startsWith('luke-'))continue;
  if(sensitiveKey.test(key)){excludedSensitiveKeys.push(key);continue;}
  const raw=localStorage.getItem(key);
  if(raw===null)continue;
  storage[key]=safeStorageValue(raw);
 }
 if(mainData)storage[MAIN_STORAGE_KEY]=JSON.stringify(mainData);
 else{
  const main=localStorage.getItem(MAIN_STORAGE_KEY);
  if(main!==null)storage[MAIN_STORAGE_KEY]=safeStorageValue(main);
 }
 return {format:FULL_BACKUP_FORMAT,version:FULL_BACKUP_VERSION,exportedAt:new Date().toISOString(),storage,excludedSensitiveKeys};
}

export function stringifyFullBackup(mainData?:Data){return JSON.stringify(buildFullBackup(mainData),null,2);}

export function isFullBackup(value:unknown):value is FullBackup{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const p=value as Partial<FullBackup>;
 return p.format===FULL_BACKUP_FORMAT&&p.version===FULL_BACKUP_VERSION&&typeof p.exportedAt==='string'&&!!p.storage&&typeof p.storage==='object'&&!Array.isArray(p.storage);
}

export function parseFullBackup(text:string):FullBackup{
 if(text.length>MAX_TOTAL_CHARS)throw Error('完整备份文件过大');
 const parsed:unknown=JSON.parse(text);
 if(!isFullBackup(parsed))throw Error('不是四时与你完整备份');
 const storage:Record<string,string>={};
 let total=0;
 for(const [key,value] of Object.entries(parsed.storage)){
  if(!key.startsWith('luke-')||sensitiveKey.test(key)||typeof value!=='string'||value.length>10_000_000)throw Error('完整备份包含无效数据');
  total+=key.length+value.length;if(total>MAX_TOTAL_CHARS)throw Error('完整备份文件过大');
  storage[key]=value;
 }
 const main=storage[MAIN_STORAGE_KEY];
 if(!main)throw Error('完整备份缺少主数据');
 parseData(main);
 if(storage[MEMO_STORAGE_KEY])parseMemoWorkspace(storage[MEMO_STORAGE_KEY]);
 return {...parsed,storage,excludedSensitiveKeys:Array.isArray(parsed.excludedSensitiveKeys)?parsed.excludedSensitiveKeys.filter((x):x is string=>typeof x==='string').slice(0,100):[]};
}

export function fullBackupSummary(backup:FullBackup){
 const data=parseData(backup.storage[MAIN_STORAGE_KEY]);
 let memoCount=0,folderCount=0;
 if(backup.storage[MEMO_STORAGE_KEY]){const memos=parseMemoWorkspace(backup.storage[MEMO_STORAGE_KEY]);memoCount=memos.memos.length;folderCount=memos.folders.length;}
 return {messages:data.messages.length,tasks:data.tasks.length,legacyNotes:data.notes.length,memos:memoCount,folders:folderCount,storageKeys:Object.keys(backup.storage).length};
}

export function restoreFullBackup(backup:FullBackup){
 const checked=parseFullBackup(JSON.stringify(backup));
 const currentKeys:string[]=[];
 for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith('luke-')&&!sensitiveKey.test(key))currentKeys.push(key);}
 for(const key of currentKeys)localStorage.removeItem(key);
 for(const [key,value] of Object.entries(checked.storage))localStorage.setItem(key,value);
 localStorage.setItem('luke-backup-confirmed',Date.now().toString());
}

export function parseLegacyMainBackup(text:string):Data{return parseData(text);}
