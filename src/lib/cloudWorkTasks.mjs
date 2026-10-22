import {TASK_STATUSES,validTaskDate} from './workTaskDates.mjs';
export const taskFromRow=r=>({id:r.id,projectId:r.project_id||'',createdBy:r.created_by,clientId:r.company_id,documentId:r.document_id,title:r.title,status:r.status,dueDate:r.due_date||'',officialDueDate:r.official_due_date||'',assignee:r.assignee,notes:r.notes,sourceUrl:r.source_url,checklist:r.checklist,createdAt:r.created_at,updatedAt:r.updated_at});
export function taskToRow(input,nodes){
 if(typeof input.title!=='string'||!input.title.trim()||input.title.length>180)throw Error('업무명을 180자 이내로 입력해 주세요.');
 if(!Object.hasOwn(TASK_STATUSES,input.status))throw Error('업무 상태를 확인해 주세요.');
 if(!validTaskDate(input.dueDate)||!validTaskDate(input.officialDueDate))throw Error('날짜를 확인해 주세요.');
 if(input.clientId&&!nodes.some(n=>n.kind==='client'&&n.id===input.clientId))throw Error('접근 가능한 회사를 선택해 주세요.');
 if(input.documentId&&!nodes.some(n=>n.type==='file'&&n.id===input.documentId&&n.parentId===input.clientId))throw Error('선택한 회사의 문서만 연결할 수 있습니다.');
 if(input.sourceUrl){try{if(!['http:','https:'].includes(new URL(input.sourceUrl).protocol))throw Error();}catch{throw Error('공고 링크는 http 또는 https 주소를 입력해 주세요.');}}
 return {...(input.projectId !== undefined ? {project_id:input.projectId||null} : {}),company_id:input.clientId||null,document_id:input.documentId||null,title:input.title.trim(),status:input.status,due_date:input.dueDate||null,official_due_date:input.officialDueDate||null,assignee:String(input.assignee||'나').trim().slice(0,80)||'나',notes:String(input.notes||'').slice(0,10000),source_url:input.sourceUrl||'',checklist:(Array.isArray(input.checklist)?input.checklist:[]).slice(0,50).map((c,i)=>({id:String(c.id||i).slice(0,80),text:String(c.text||'').slice(0,200),done:c.done===true}))};
}
function fail(error){if(error)throw Error(['PGRST205','42P01'].includes(error.code)?'업무 저장소 설정을 적용하는 중입니다. 잠시 후 다시 불러와 주세요.':'업무를 처리하지 못했습니다. 로그인 상태와 회사 권한을 확인해 주세요.');}
export function createCloudTaskRepository(client){
 return {
  async load(){
   const [tasks,companies,documents]=await Promise.all([client.from('work_tasks').select('*').order('created_at',{ascending:false}),client.from('companies').select('id,name').order('name'),client.from('documents').select('id,company_id,title')]);
   for(const result of [tasks,companies,documents])fail(result.error);
   return {tasks:tasks.data.map(taskFromRow),nodes:[...companies.data.map(c=>({id:c.id,name:c.name,kind:'client',type:'folder',parentId:null})),...documents.data.map(d=>({id:d.id,name:d.title,type:'file',parentId:d.company_id}))]};
  },
  async save(input,nodes){
   const row=taskToRow(input,nodes);
   const result=input.id?await client.from('work_tasks').update(row).eq('id',input.id).select().single():await client.from('work_tasks').insert(row).select().single();
   fail(result.error);return {task:taskFromRow(result.data)};
  }
 };
}
