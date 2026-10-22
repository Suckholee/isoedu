import {clientSortName} from './clientInitials.mjs';
export function managedClients(companies,workspaceId){return companies.filter(c=>c.id!==workspaceId).sort((a,b)=>clientSortName(a.name).localeCompare(clientSortName(b.name),'ko'));}
export function resolveClient(companies,id){return companies.find(c=>c.id===id)||null;}
export function clientContextSearch(search,company){const p=new URLSearchParams(search);for(const k of ['task','file','reference','folder','client','projectId','project'])p.delete(k);if(company)p.set('company',company.id);else p.delete('company');return p;}
