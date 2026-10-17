import { supabase } from './supabaseClient.js';
import { isCloudMode } from './dataConfig.js';
import { INITIAL_COMPANIES } from './mockData.js';
import { getStoredProjects, saveStoredProjects } from './auditProjectData.js';

function cloud() {
  if (!supabase) throw new Error('Supabase 연결 설정을 확인해 주세요.');
  return supabase;
}
const projectFromRow = row => ({ ...row.data, id: row.id, companyId: row.company_id });

export async function loadWorkspace() {
  if (!isCloudMode) {
    const projects = getStoredProjects();
    const companies = [...INITIAL_COMPANIES];
    for (const project of projects) {
      if (!companies.some(company => company.id === project.companyId)) {
        companies.push({ id: project.companyId, name: project.clientName, industry: project.industry });
      }
    }
    return { companies, projects };
  }
  const results = await Promise.all([
    cloud().from('companies').select('*').order('name'),
    cloud().from('audit_projects').select('*').order('created_at', { ascending: false }),
  ]);
  for (const result of results) if (result.error) throw result.error;
  return { companies: results[0].data, projects: results[1].data.map(projectFromRow) };
}

export async function createProject(project) {
  if (!isCloudMode) {
    saveStoredProjects([project, ...getStoredProjects()]);
    return project;
  }
  const { data, error } = await cloud().rpc('create_audit_project', { project_data: project });
  if (error) throw error;
  return projectFromRow(Array.isArray(data) ? data[0] : data);
}

export async function updateProject(project) {
  if (!isCloudMode) {
    saveStoredProjects(getStoredProjects().map(item => item.id === project.id ? project : item));
    return project;
  }
  const { data, error } = await cloud().from('audit_projects').update({ data: project })
    .eq('id', project.id).eq('company_id', project.companyId).select().single();
  if (error) throw error;
  return projectFromRow(Array.isArray(data) ? data[0] : data);
}
