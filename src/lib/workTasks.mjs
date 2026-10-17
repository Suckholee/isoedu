import {readFile,writeFile,mkdir,rename,open,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {TASK_STATUSES,validTaskDate} from './workTaskDates.mjs';
export {TASK_STATUSES,validTaskDate,taskToday,taskBucket} from './workTaskDates.mjs';
export function createTaskStore(root=path.join(process.cwd(),'data/client-drive/tasks')){
 const file=path.join(root,'tasks.json');
 async function read(){try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return [];throw e;}}
 return {list:read,async save(input,nodes){await mkdir(root,{recursive:true});let lock;for(let i=0;i<200;i++){try{lock=await open(path.join(root,'.lock'),'wx');break;}catch(e){if(e.code!=='EEXIST')throw e;await new Promise(r=>setTimeout(r,25));}}if(!lock)throw Error('다른 변경을 저장 중입니다. 다시 시도해 주세요.');
 try{const tasks=await read(),old=input.id?tasks.find(t=>t.id===input.id):null;if(input.id&&!old)throw Error('업무를 찾을 수 없습니다.');const n={...old,...input};
 if(typeof n.title!=='string'||!n.title.trim()||n.title.length>180)throw Error('업무명을 180자 이내로 입력해 주세요.');
 if(!Object.hasOwn(TASK_STATUSES,n.status))throw Error('업무 상태를 확인해 주세요.');
 if(!validTaskDate(n.dueDate)||!validTaskDate(n.officialDueDate))throw Error('날짜를 확인해 주세요.');
 if(n.clientId&&!nodes.some(x=>x.id===n.clientId&&x.kind==='client'&&!x.trashedAt))throw Error('거래처를 확인해 주세요.');
 if(n.documentId){let doc=nodes.find(x=>x.id===n.documentId&&x.type==='file'&&!x.trashedAt),seen=new Set();if(!doc)throw Error('연결 문서를 확인해 주세요.');while(doc.parentId&&!seen.has(doc.id)){seen.add(doc.id);doc=nodes.find(x=>x.id===doc.parentId&&!x.trashedAt);if(!doc)throw Error('문서 폴더를 확인해 주세요.');}if(doc.id!==n.clientId)throw Error('선택한 거래처의 문서만 연결할 수 있습니다.');}
 if(n.sourceUrl){try{if(!['http:','https:'].includes(new URL(n.sourceUrl).protocol))throw Error();}catch{throw Error('공고 링크는 http 또는 https 주소를 입력해 주세요.');}}
 const task={id:old?.id||randomUUID(),title:n.title.trim(),clientId:n.clientId||null,status:n.status,dueDate:n.dueDate||'',officialDueDate:n.officialDueDate||'',assignee:String(n.assignee||'나').trim().slice(0,80)||'나',documentId:n.documentId||null,notes:String(n.notes||'').slice(0,10000),sourceUrl:n.sourceUrl||'',checklist:(Array.isArray(n.checklist)?n.checklist:[]).slice(0,50).map(c=>({id:String(c.id||randomUUID()).slice(0,80),text:String(c.text||'').slice(0,200),done:c.done===true})),createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
 if(old)tasks.splice(tasks.indexOf(old),1,task);else tasks.push(task);const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(tasks,null,2)+'\n');await rename(temp,file);return task;
 }finally{await lock.close();await unlink(path.join(root,'.lock'));}}};
}
export const taskStore=createTaskStore();
