export const requestMatches = (request, filter) => filter === 'all' ||
  (filter === 'todo' ? ['requested', 'changes'].includes(request.status) :
    filter === 'submitted' ? request.status === 'submitted' : ['accepted', 'not_applicable'].includes(request.status));

export function enterpriseProjectSummary(project, requests, tasks, documents) {
  const own = row => row.company_id === project.companyId && row.project_id === project.id;
  const related = requests.filter(own), work = tasks.filter(own);
  const drafts = documents.filter(d => d.companyId === project.companyId &&
    (d.ai?.projectId || d.projectOrigin?.projectId) === project.id && d.ai?.state === 'ready');
  return {
    total: related.length,
    pending: related.filter(r => ['requested', 'changes'].includes(r.status)).length,
    submitted: related.filter(r => r.status === 'submitted').length,
    accepted: related.filter(r => r.status === 'accepted').length,
    excluded: related.filter(r => r.status === 'not_applicable').length,
    drafts: drafts.length,
    reviewed: drafts.filter(d => d.ai?.review?.reviewed === true).length,
    tasks: work.length,
    doneTasks: work.filter(t => t.status === 'done').length,
  };
}

export async function loadEnterpriseOverview(client, companyId) {
  const results = await Promise.all([
    client.from('audit_projects').select('id,company_id,data').eq('company_id', companyId).order('created_at', {ascending:false}),
    client.from('project_document_requests').select('*').eq('company_id', companyId).order('updated_at', {ascending:false}),
    client.from('work_tasks').select('*').eq('company_id', companyId).order('due_date', {nullsFirst:false}),
  ]);
  for (const result of results) if (result.error) throw result.error;
  return {
    projects: results[0].data.map(row => ({...row.data, id:row.id, companyId:row.company_id})),
    requests: results[1].data,
    tasks: results[2].data,
  };
}
