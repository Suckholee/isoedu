// Authenticated, resumable private migration. No service-role key; credentials are environment-only.
import {readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {createClient} from '@supabase/supabase-js';
const state=JSON.parse(await readFile('data/client-drive/state.json','utf8'));
const only=process.argv.find(a=>a.startsWith('--source='))?.slice(9);
const files=state.nodes.filter(n=>n.type==='file'&&!n.deletedAt&&(!only||n.id===only));
const apply=process.argv.includes('--apply');
const mime={PDF:'application/pdf',DOC:'application/msword',DOCX:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',XLS:'application/vnd.ms-excel',XLSX:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',HWP:'application/x-hwp',HWPX:'application/hwp+zip',PPT:'application/vnd.ms-powerpoint',PPTX:'application/vnd.openxmlformats-officedocument.presentationml.presentation'};
const uuid=(key)=>{let h=createHash('sha256').update(key).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
const clientId=file=>{let p=state.nodes.find(n=>n.id===file.parentId);const seen=new Set();while(p&&p.kind!=='client'){if(seen.has(p.id))throw Error('Folder cycle');seen.add(p.id);p=state.nodes.find(n=>n.id===p.parentId);}if(!p)throw Error('Missing client');return p.id;};
const manifest=[];
for(const file of files){const bytes=await readFile(file.sourcePath);const hash=createHash('sha256').update(bytes).digest('hex');if(file.sha256&&file.sha256!==hash)throw Error(`Source checksum mismatch: ${file.id}`);manifest.push({file,sourceClientId:clientId(file),hash,size:bytes.length});}
console.log(JSON.stringify({files:manifest.length,bytes:manifest.reduce((n,f)=>n+f.size,0),over50MiB:manifest.filter(f=>f.size>50*1024**2).map(f=>f.file.id),apply}));
if(!apply)process.exit(0);
if(!process.env.ISOEDU_MIGRATION_PASSWORD)throw Error('ISOEDU_MIGRATION_PASSWORD required');
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:true}});
const must=result=>{if(result.error)throw result.error;return result.data;};
const {user}=must(await sb.auth.signInWithPassword({email:process.env.ISOEDU_MIGRATION_EMAIL||'ceo@honestone.kr',password:process.env.ISOEDU_MIGRATION_PASSWORD}));
const links=must(await sb.from('managed_client_links').select('company_id,source_client_id').eq('user_id',user.id));
const report={startedAt:new Date().toISOString(),completed:[],failed:[]};
for(const item of manifest){const {file,hash,size}=item;try{
 const company=links.find(l=>l.source_client_id===item.sourceClientId)?.company_id;if(!company)throw Error('No authorized client mapping');
 const id=uuid(`${user.id}:${file.id}`),prefix=`companies/${company}/${id}`,originalPath=`${prefix}/original.${file.format.toLowerCase()}`;
 const old=must(await sb.from('documents').select('id,metadata').eq('id',id).maybeSingle());
 if(old?.metadata?.migration?.sha256===hash&&old.metadata.migration.status==='complete'){report.completed.push({sourceId:file.id,id,skipped:true});continue;}
 const corpus=await readFile(`data/business-plan-corpus/${file.sourceId}.txt`,'utf8').catch(()=> '');
 const metadata={standards:[],kind:'client-file',format:file.format,sourceId:file.id,originalName:file.name,originalPath,migration:{sha256:hash,status:'pending'},fileSize:size};
 must(await sb.from('documents').upsert({id,company_id:company,certification_code:'CLIENT_FILE',hierarchy_level:'LEVEL_4',code:file.id,title:file.name,status:'DRAFT',summary:'거래처 보관 원본 · ISO 준비 완료 판정 대상 아님',content_draft:corpus,metadata}));
 const put=async (objectPath,bytes,contentType)=>{const result=await sb.storage.from('iso-vault').upload(objectPath,bytes,{contentType,upsert:false});if(result.error&&!/already exists|Duplicate/i.test(result.error.message))throw result.error;const downloaded=must(await sb.storage.from('iso-vault').download(objectPath));if(createHash('sha256').update(Buffer.from(await downloaded.arrayBuffer())).digest('hex')!==createHash('sha256').update(bytes).digest('hex'))throw Error('Uploaded checksum mismatch');};
 await put(originalPath,await readFile(file.sourcePath),mime[file.format]||'application/octet-stream');
 if(file.format==='PDF'){metadata.previewPath=originalPath;metadata.previewFormat='PDF';}else{
  for(const ext of ['pdf','html']){const preview=path.join('data/client-drive/previews',`${hash}.${ext}`);try{await stat(preview);}catch{continue;}const previewPath=`${prefix}/preview.${ext==='html'?'gzip.txt':ext}`;const previewBytes=await readFile(preview);const payload=ext==='html'?Buffer.from(gzipSync(previewBytes).toString('base64')):previewBytes;await put(previewPath,payload,ext==='pdf'?'application/pdf':'text/plain');metadata.previewPath=previewPath;metadata.previewFormat=ext.toUpperCase();if(ext==='html')metadata.previewEncoding='gzip-base64';break;}
 }
 const versionId=uuid(`${id}:${hash}`);const existing=must(await sb.from('document_versions').select('id').eq('id',versionId).maybeSingle());
 if(!existing)must(await sb.from('document_versions').insert({id:versionId,document_id:id,rev_no:1,change_reason:'기존 거래처 원본 이관',author_id:user.id,author_name:'조영빈',file_path:originalPath,file_name:file.name,file_size:size,checksum:hash}));
 metadata.migration={sha256:hash,status:'complete',verifiedAt:new Date().toISOString()};must(await sb.from('documents').update({metadata}).eq('id',id).eq('company_id',company));report.completed.push({sourceId:file.id,id,preview:Boolean(metadata.previewPath)});
 }catch(e){report.failed.push({sourceId:file.id,error:e.message});const id=uuid(`${user.id}:${file.id}`);const previous=await sb.from('documents').select('metadata').eq('id',id).maybeSingle();if(previous.data)await sb.from('documents').update({metadata:{...previous.data.metadata,migration:{...previous.data.metadata.migration,status:'failed',error:e.message}}}).eq('id',id);}
 await writeFile(`data/client-drive/cloud-migration-report${only?'-'+only:''}.json`,JSON.stringify(report,null,2));console.log(`${file.id}: ${report.failed.at(-1)?.sourceId===file.id?'failed':'verified'}`);
}
console.log(JSON.stringify({completed:report.completed.length,failed:report.failed.length}));await sb.auth.signOut({scope:'local'});
