import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chatContext,complete} from '../../lib/model.ts';
const config=JSON.parse(await readFile(process.env.LUKE_TEST_CONFIG,'utf8'));
const data={name:'冬清',since:'2023-07-08',messages:[],tasks:[],notes:[],checks:[]};
const results=[];
for(const question of ['夏彦，你是谁呀？','数学看得头都大了，今天不想学了。','你是真人还是AI？']){
 const messages=chatContext({...data,messages:[{who:'luke',text:'我是夏彦，陛下。在这里，我是由 AI 驱动的夏彦同人角色聊天。'},{who:'me',text:question}]},'');
 const answer=await complete({...config,fallback:undefined},messages,undefined,600);
 assert.ok(answer.trim());assert.doesNotMatch(answer,/陛下|主人/);
 if(question.includes('真人'))assert.match(answer,/AI|人工智能|人工智慧/i);
 else assert.doesNotMatch(answer,/官方授权|AI驱动|AI 驱动/);
 results.push({question,answer});
}
await writeFile('outputs/android/persona-1.8.13-check.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
