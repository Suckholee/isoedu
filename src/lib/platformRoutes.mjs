export const NAV_PATHS = Object.freeze({
 dashboard:'/dashboard', compliance:'/certifications', drive:'/documents', schedule:'/audit-schedule',
 radar:'/risks', notifications:'/notifications', gov_programs:'/government-programs', reports:'/reports', settings:'/settings', workspace:'/workspaces', project:'/projects',
});
export function navFromPath(pathname) { return Object.entries(NAV_PATHS).find(([,path])=>pathname===path||pathname.startsWith(`${path}/`))?.[0] || null; }
export function validPlatformPath(section, detail=[]) {
 const nav=navFromPath(`/${section}`);
 if(!nav)return false;
 if(nav==='drive')return detail.length===0 || (detail.length===1 && ['references','iso'].includes(detail[0]));
 if(nav==='project')return detail.length===1 && Boolean(detail[0]);
 if(nav==='gov_programs')return detail.length===0 || (detail.length===1 && ['calendar','list'].includes(detail[0]));
 return detail.length===0;
}
export function platformHref(nav, currentSearch='', patch={}) {
 const base=NAV_PATHS[nav];if(!base)throw new Error(`Unknown navigation: ${nav}`);
 const params=new URLSearchParams(currentSearch);
 for(const [key,value] of Object.entries(patch)) { if(value==null||value==='')params.delete(key);else params.set(key,value); }
 const projectId=params.get('projectId');params.delete('projectId');
 const isoDocumentTarget=nav==='drive'&&(Object.hasOwn(patch,'standard')||['CERT','BASE','PROCEDURE','RECORD','LEVEL_1','LEVEL_2','LEVEL_3','LEVEL_4','STARRED'].includes(patch.folder));
 const path=nav==='project'&&projectId?`${base}/${encodeURIComponent(projectId)}`:isoDocumentTarget?'/documents/iso':base;
 return params.size?`${path}?${params}`:path;
}
