import {readFile,writeFile,mkdir,rename,open,stat} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import {referenceEntries,referenceContent} from './referenceLibrary.mjs';
import {createReferenceDraft} from './referenceStandards.mjs';
export function createClientDrive(root=path.join(process.cwd(),'data/client-drive'),{entries=referenceEntries,readContent=referenceContent}={}){
 const statePath=path.join(root,'state.json');
 const digest=b=>createHash('sha256').update(b).digest('hex');
 const clean=name=>{if(typeof name!=='string'||!name.trim()||name.trim().length>180||/[\\/\x00-\x1f]/.test(name)||['.','..'].includes(name.trim()))throw Error('이름은 1~180자이며 경로 문자를 포함할 수 없습니다.');return name.trim();};
 async function lock(fn){await mkdir(root,{recursive:true});let handle;
 for(let i=0;i<200;i++){try{handle=await open(path.join(root,'.lock'),'wx');break;}catch(e){if(e.code!=='EEXIST')throw e;await new Promise(r=>setTimeout(r,25));}}
 if(!handle)throw Error('다른 작업을 처리 중입니다. 다시 시도해 주세요.');
 try{return await fn();}finally{await handle.close();await import('node:fs/promises').then(fs=>fs.unlink(path.join(root,'.lock')));}}
 async function write(state){const tmp=statePath+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(state,null,2)+'\n');await rename(tmp,statePath);}
 async function read(){try{return JSON.parse(await readFile(statePath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;return null;}}
 async function initialize(){return lock(async()=>{let state=await read();if(state)return state;const refs=await entries();const at=new Date().toISOString();const folders=new Map();const nodes=[];
 for(const ref of refs){let folder=folders.get(ref.customer);if(!folder){folder={id:'client-'+digest(ref.customer).slice(0,16),name:ref.customer,type:'folder',parentId:null,kind:'client',identityStatus:'가져온 거래처명 · 법인 관계 확인 필요',createdAt:at,updatedAt:at};folders.set(ref.customer,folder);nodes.push(folder);}const sourceStat=await stat(ref.source);nodes.push({id:ref.id,name:ref.title,type:'file',parentId:folder.id,sourceId:ref.id,format:ref.format,sourcePath:ref.source,sha256:ref.sha256,size:sourceStat.size,createdAt:at,updatedAt:sourceStat.mtime.toISOString()});}
 state={version:1,nodes};await write(state);return state;});}
 async function state(){return await read()||initialize();}
 function requireNode(s,id,type){const n=s.nodes.find(n=>n.id===id&&!n.trashedAt);if(!n||type&&n.type!==type)throw Error('항목이 없거나 휴지통에 있습니다.');return n;}
 function parent(s,id){if(id===null)return null;return requireNode(s,id,'folder');}
 function client(s,id){let n=requireNode(s,id);let seen=new Set();while(n.parentId){if(seen.has(n.id))throw Error('폴더 순환 오류');seen.add(n.id);n=requireNode(s,n.parentId);}return n.kind==='client'?n:null;}
 function descendants(s,id){const found=new Set([id]);let changed=true;while(changed){changed=false;for(const n of s.nodes)if(found.has(n.parentId)&&!found.has(n.id)){found.add(n.id);changed=true;}}return found;}
 function unique(s,name,parentId,exclude){if(s.nodes.some(n=>!n.trashedAt&&n.parentId===parentId&&n.name===name&&n.id!==exclude))throw Error('같은 이름의 항목이 이미 있습니다.');}
 async function mutate(fn){await state();return lock(async()=>{const s=await read();const result=await fn(s);await write(s);return result;});}
 return {
  async list(){const s=await state();return s.nodes.map(({sourcePath,...n})=>n);},
  async file(id){const s=await state();return requireNode(s,id,'file');},
  async content(id){const s=await state(),n=requireNode(s,id,'file');if(n.sourceId){const ref=(await entries()).find(r=>r.id===n.sourceId);if(!ref)throw Error('원문 연결을 찾을 수 없습니다.');return readContent(ref);}
   if(n.format==='MD'||n.format==='TXT'){const text=await readFile(n.sourcePath,'utf8');const {referenceStandard}=await import('./referenceStandards.mjs');return {units:[{location:n.name,text}],standard:referenceStandard(n.name,text,client(s,n.id)?.name||'')};}
   try{const cached=JSON.parse(await readFile(path.join(root,n.id+'.content.json'),'utf8'));return cached;}catch{}
   const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');const os=await import('node:os');
   const python=process.env.ISOEDU_PYTHON||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3');
   try{const {stdout}=await promisify(execFile)(python,[path.join(process.cwd(),'scripts/extract-drive-file.py'),n.sourcePath,n.format],{timeout:45000,maxBuffer:5*1024*1024});const data=JSON.parse(stdout);const {referenceStandard}=await import('./referenceStandards.mjs');const result={units:data.units,standard:referenceStandard(n.name,data.units.map(u=>u.text).join('\n'),client(s,n.id)?.name||'')};await writeFile(path.join(root,n.id+'.content.json'),JSON.stringify(result));return result;}
   catch{return {units:[],standard:null,notice:'본문 변환을 완료하지 못했습니다. PDF는 원본 보기로 열고, 다른 형식은 원본을 다운로드해 확인해 주세요.'};}
  },
  async action(body){return mutate(async s=>{const at=new Date().toISOString();let node;
   if(body.action==='createFolder'){const p=parent(s,body.parentId??null);const name=clean(body.name);unique(s,name,p?.id||null);node={id:'folder-'+randomUUID(),name,type:'folder',kind:p?'folder':'client',parentId:p?.id||null,createdAt:at,updatedAt:at};s.nodes.push(node);return node;}
   if(body.action==='restore'){node=s.nodes.find(n=>n.id===body.id&&n.trashedAt);if(!node)throw Error('휴지통 항목을 찾지 못했습니다.');parent(s,node.parentId);unique(s,node.name,node.parentId,node.id);for(const n of s.nodes)if(n.deletedWith===node.id){delete n.trashedAt;delete n.deletedWith;n.updatedAt=at;}return node;}
   node=requireNode(s,body.id);
   if(body.action==='rename'){let name=clean(body.name);if(node.type==='file'){const ext=path.extname(node.name);if(!name.toLowerCase().endsWith(ext.toLowerCase()))name+=ext;}unique(s,name,node.parentId,node.id);node.name=name;}
   else if(body.action==='move'){const p=parent(s,body.parentId??null);if(node.kind==='client')throw Error('거래처 폴더는 다른 폴더 안으로 이동할 수 없습니다.');if(node.type==='file'&&!p)throw Error('파일은 거래처 폴더 안으로 이동해 주세요.');if(descendants(s,node.id).has(p?.id))throw Error('자기 자신이나 하위 폴더로 이동할 수 없습니다.');unique(s,node.name,p?.id||null,node.id);node.parentId=p?.id||null;}
   else if(body.action==='updateText'){if(node.sourceId||!['TXT','MD'].includes(node.format))throw Error('이 파일은 원본 보존 대상입니다.');if(typeof body.text!=='string'||Buffer.byteLength(body.text)>2*1024*1024)throw Error('본문은 2MB 이하여야 합니다.');const previous=await readFile(node.sourcePath);await mkdir(path.join(root,'revisions'),{recursive:true});const version=randomUUID();await writeFile(path.join(root,'revisions',node.id+'-'+version),previous);const tmp=node.sourcePath+'.'+randomUUID()+'.tmp';await writeFile(tmp,body.text);await rename(tmp,node.sourcePath);node.versions=[...(node.versions||[]),{id:version,at:node.updatedAt,sha256:node.sha256}];node.sha256=digest(body.text);node.size=Buffer.byteLength(body.text);}
   else if(body.action==='trash'){const ids=descendants(s,node.id);for(const n of s.nodes)if(ids.has(n.id)&&!n.trashedAt){n.trashedAt=at;n.deletedWith=node.id;n.updatedAt=at;}}
   else throw Error('지원하지 않는 작업입니다.');node.updatedAt=at;return node;
  });},
  async upload({parentId,name,bytes}){if(!bytes.length||bytes.length>50*1024*1024)throw Error('파일은 0바이트 초과, 50MB 이하여야 합니다.');name=clean(name);const format=path.extname(name).slice(1).toUpperCase();if(!['PDF','HWP','HWPX','DOC','DOCX','PPT','PPTX','TXT','MD','PNG','JPG','JPEG','WEBP','XLS','XLSX'].includes(format))throw Error('지원하지 않는 파일 형식입니다.');return mutate(async s=>{parent(s,parentId);if(!parentId)throw Error('파일을 보관할 거래처 폴더를 선택해 주세요.');unique(s,name,parentId);const id='file-'+randomUUID(),sourcePath=path.join(root,id+'.'+format.toLowerCase());await writeFile(sourcePath,bytes,{flag:'wx'});const at=new Date().toISOString(),n={id,name,type:'file',format,parentId,sourcePath,size:bytes.length,sha256:digest(bytes),createdAt:at,updatedAt:at};s.nodes.push(n);return n;});},
  async draft(body){const s=await state();const source=requireNode(s,body.sourceId,'file'),target=parent(s,body.parentId);if(!target)throw Error('작성 대상 거래처 폴더를 선택해 주세요.');const owner=client(s,target.id);if(!owner)throw Error('거래처를 찾지 못했습니다.');if(body.confirmed!==true)throw Error('문서의 작성 기준을 확인해 주세요.');const content=await this.content(source.id);if(!content.standard)throw Error('작성 기준을 먼저 확인해 주세요.');const draft=createReferenceDraft({company:{id:owner.id,name:owner.name},item:body.item,headings:body.headings,standard:content.standard,reference:{id:source.id,sha256:source.sha256}});const name=draft.title.replace(/[\\/]/g,'-')+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.md';const n=await this.upload({parentId:target.id,name,bytes:Buffer.from(draft.contentDraft)});await mutate(async latest=>{const saved=requireNode(latest,n.id);saved.referenceOrigin=draft.referenceOrigin;saved.businessItem=draft.businessItem;saved.docStatus='작성 중';});return n;
  }
 };
}
export const clientDrive=createClientDrive();
