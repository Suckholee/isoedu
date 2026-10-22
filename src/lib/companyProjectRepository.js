import { supabase } from './supabaseClient';
import { workflowError } from './projectWorkflow.mjs';
export async function companyRpc(name,args){
 if(!supabase)throw Error('클라우드 계정으로 로그인해 주세요.');
 const {data,error}=await supabase.rpc(name,args);
 if(error)throw Error(workflowError(error));return data;
}
export async function loadProjectDetail(projectId){
 if(!supabase)throw Error('클라우드 계정으로 로그인해 주세요.');
 const results=await Promise.all([
  supabase.from('audit_projects').select('*').eq('id',projectId).single(),
  supabase.from('project_requirements').select('*').eq('project_id',projectId).order('requirement_key'),
  supabase.from('work_tasks').select('*').eq('project_id',projectId).order('due_date'),
 ]);
 for(const r of results)if(r.error)throw Error(workflowError(r.error));
 const permission=await supabase.rpc('can_edit_company',{c_id:results[0].data.company_id});
 if(permission.error)throw Error(workflowError(permission.error));
 return {canEdit:permission.data===true,project:{...results[0].data.data,id:results[0].data.id,companyId:results[0].data.company_id},requirements:results[1].data,tasks:results[2].data};
}
export async function linkProjectRequirement(id,documentId){
 const {data,error}=await supabase.from('project_requirements').update({document_id:documentId||null}).eq('id',id).select().single();
 if(error)throw Error(workflowError(error));return data;
}
export async function linkProjectRequirementsBatch(links=[]){
 if(!supabase)throw Error('클라우드 계정으로 로그인해 주세요.');
 const saved=[];
 for(const item of links){
  const {data,error}=await supabase.from('project_requirements').update({document_id:item.documentId||null}).eq('id',item.id).select().single();
  if(error)throw Error(workflowError(error));
  saved.push(data);
 }
 return saved;
}
export async function updateProjectTask(id,patch={}){
 if(!supabase)throw Error('클라우드 계정으로 로그인해 주세요.');
 const payload={};
 if(patch.status!==undefined)payload.status=patch.status;
 if(patch.checklist!==undefined)payload.checklist=patch.checklist;
 const {data,error}=await supabase.from('work_tasks').update(payload).eq('id',id).select().single();
 if(error)throw Error(workflowError(error));
 return data;
}
export async function syncProjectTasksBatch(updates=[]){
 if(!supabase)throw Error('클라우드 계정으로 로그인해 주세요.');
 const saved=[];
 for(const item of updates){
  const {data,error}=await supabase.from('work_tasks').update({status:item.status,checklist:item.checklist}).eq('id',item.id).select().single();
  if(error)throw Error(workflowError(error));
  saved.push(data);
 }
 return saved;
}
