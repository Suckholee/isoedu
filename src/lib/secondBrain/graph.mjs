import {extractConcepts,recordConcepts,recordRelations,conceptKey} from './concepts.mjs';
export function knowledgeGraph(records, documents, projects, includedDocuments = []) {
 const nodes=new Map(), edges=new Map();
 const add=node=>{if(!nodes.has(node.id))nodes.set(node.id,node);return nodes.get(node.id);};
 const edge=(source,target,type,evidence='',recordId=null,documentId=null)=>{
  if(source===target)return;const key=[source,target].sort().join('|')+'|'+type;
  if(!edges.has(key))edges.set(key,{source,target,type,evidence:[],recordIds:[],documentIds:[]});
  const e=edges.get(key);if(evidence&&!e.evidence.includes(evidence)&&e.evidence.length<4)e.evidence.push(evidence);
  if(recordId&&!e.recordIds.includes(recordId))e.recordIds.push(recordId);if(documentId&&!e.documentIds.includes(documentId))e.documentIds.push(documentId);
 };
 const conceptsFor=(id,concepts,basis,recordId=null,documentId=null)=>{
  for(const c of concepts){const key=conceptKey(c.label);if(!key)continue;
   const node=add({id:`concept:${key}`,label:c.label,type:'concept',recordIds:[],documentIds:[],evidence:[]});
   if(recordId&&!node.recordIds.includes(recordId))node.recordIds.push(recordId);if(documentId&&!node.documentIds.includes(documentId))node.documentIds.push(documentId);
   if(node.evidence.length<6)node.evidence.push({text:c.evidence,basis,recordId,documentId});
   edge(id,node.id,basis,c.evidence,recordId,documentId);
  }
 };
 for(const document of includedDocuments){
  const id=`document:${document.id}`,title=document.title||document.name||'문서';
  add({id,label:title,type:'document',documentId:document.id});
  // File/category metadata such as CLIENT_FILE is never a semantic concept.
  conceptsFor(id,extractConcepts(title.replace(/\[[^\]]+\]/g,'').replace(/\.[a-z0-9]+$/i,''),title,6),'문서 제목',null,document.id);
 }
 for(const record of records){
  const id=`record:${record.id}`;add({id,label:record.title,type:'record',recordId:record.id});
  const concepts=recordConcepts(record);conceptsFor(id,concepts,record.analysis?'읽은 원문':'기록 제목·본문',record.id);
  const keys=new Map(concepts.map(c=>[c.key,conceptKey(c.label)]));
  for(const relation of recordRelations(record,concepts))if(keys.has(relation.source)&&keys.has(relation.target))edge(`concept:${keys.get(relation.source)}`,`concept:${keys.get(relation.target)}`,'같은 문맥',relation.evidence,record.id);
  for(const tag of record.tags){const target=`tag:${tag}`;add({id:target,label:tag,type:'tag'});edge(id,target,'직접 지정한 주제');}
  const project=projects.find(p=>p.id===record.project_id&&(p.companyId||p.company_id)===record.company_id);
  if(project){const target=`project:${project.id}`;add({id:target,label:project.name||project.title||project.clientName||'프로젝트',type:'project',projectId:project.id});edge(id,target,'프로젝트');}
  const document=documents.find(d=>d.id===record.document_id&&(d.companyId||d.company_id)===record.company_id);
  if(document){const target=`document:${document.id}`;add({id:target,label:document.title||document.name||'문서',type:'document',documentId:document.id});edge(id,target,'문서');}
 }
 return {nodes:[...nodes.values()],edges:[...edges.values()]};
}
// A bounded force layout brings linked concepts together; positions are stable across rotations.
export function graphPositions(graph){
 const n=graph.nodes.length,byId=new Map();
 const points=graph.nodes.map((node,i)=>{const y=1-(i+.5)*2/Math.max(n,1),r=Math.sqrt(1-y*y),a=i*2.399963;const p={...node,x:Math.cos(a)*r,y,z:Math.sin(a)*r};byId.set(node.id,p);return p;});
 const links=graph.edges.map(e=>[byId.get(e.source),byId.get(e.target)]).filter(([a,b])=>a&&b);
 for(let step=0;step<65;step++){
  const delta=points.map(()=>[0,0,0]);
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j+=Math.max(1,Math.floor(n/350))){const a=points[i],b=points[j],v=[a.x-b.x,a.y-b.y,a.z-b.z],d=Math.max(.02,v.reduce((s,x)=>s+x*x,0)),f=.0008/d;for(let k=0;k<3;k++){delta[i][k]+=v[k]*f;delta[j][k]-=v[k]*f;}}
  for(let i=0;i<n;i++){points[i].x+=Math.min(.04,Math.max(-.04,delta[i][0]));points[i].y+=Math.min(.04,Math.max(-.04,delta[i][1]));points[i].z+=Math.min(.04,Math.max(-.04,delta[i][2]));}
  for(const [a,b] of links){const d=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)||1,f=(d-.35)*.018;for(const key of ['x','y','z']){const move=(b[key]-a[key])/d*f;a[key]+=move;b[key]-=move;}}
  for(const p of points)for(const key of ['x','y','z'])p[key]*=.996;
 }
 const max=Math.max(1,...points.map(p=>Math.hypot(p.x,p.y,p.z)));return points.map(p=>({...p,x:p.x/max,y:p.y/max,z:p.z/max}));
}
