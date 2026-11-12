import {proposalParents} from './proposalLineage.mjs';
import {createHash} from 'node:crypto';
import {VentureError,uuid,inputHash} from './generation.mjs';
import {SOURCE_MAX_BYTES,SOURCE_PART_BYTES,validateSourceBundle} from './sourceBundle.mjs';
import {analyzeSourceUnit} from './sourceAnalysis.mjs';
import {emptySourcePlan,mapSourceCells} from './sourceMapping.mjs';
import {PLAN_SUBFIELDS} from './planSubfields.mjs';
import {readDocumentFields,validateDocumentFields} from './documentFields.mjs';
import {DOCUMENT_TYPES,VENTURE_VERSION,VENTURE_BOOK_URL} from './catalog.mjs';
const must=result=>{if(result.error)throw new VentureError('자료 저장에 실패했습니다. 회사 권한과 연결 상태를 확인해 주세요.',503);return result.data;};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const scoped=(db,project)=>db.from('documents').select('*').eq('company_id',project.company_id).eq('metadata->sourceOrigin->>projectId',project.id);
async function persist(db,row,metadata,other={}){const saved=must(await db.from('documents').update({metadata,updated_at:new Date().toISOString(),...other}).eq('id',row.id).eq('company_id',row.company_id).eq('updated_at',row.updated_at).select('*').maybeSingle());if(!saved)throw new VentureError('다른 곳에서 자료가 변경되었습니다. 새로 불러온 뒤 이어가 주세요.',409);return saved;}
async function download(db,path,max){const blob=must(await db.storage.from('iso-vault').download(path));if(!blob||blob.size>max)throw new VentureError('자료 조각의 크기를 확인해 주세요.');return Buffer.from(await blob.arrayBuffer());}
const plainUpload=async(db,path,value)=>must(await db.storage.from('iso-vault').upload(path,new Blob([JSON.stringify(value)],{type:'text/plain'}),{contentType:'text/plain',upsert:false}));
const prefix=(project,id)=>`companies/${project.company_id}/${id}/`;
async function sourceWithEvidence(db,source){
 // A rolling AI summary is a convenience, not the complete source of facts.
 const cells={};
 const units=source.metadata.sourceAnalysis.units;
 for(let start=0;start<units.length;start+=3){
  const group=units.slice(start,start+3);
  const results=await Promise.all(group.map(async unit=>({unit,result:JSON.parse((await download(db,unit.outputPath,1000000)).toString('utf8'))})));
  for(const {unit,result} of results)for(const field of result.fields||[]){
   const key=field.sectionId+'/'+field.fieldId;
   const certainty=result.companyMatch==='different'?'uncertain':field.certainty,previous=cells[key];
   const titleKey=value=>String(value||'').replace(/[\s\p{P}\p{S}]/gu,''),label=PLAN_SUBFIELDS[field.sectionId]?.find(f=>f.id===field.fieldId)?.label;
   const direct=!!label&&(result.tables||[]).some(t=>titleKey(t.title).includes(titleKey(label)));
   cells[key]={...(previous||field),...(certainty!=='uncertain'||!previous?{...field,certainty,location:unit.location}:{}),unitIds:[...(previous?.unitIds||[]),unit.id],sourceId:source.id,evidenceByUnit:[...(previous?.evidenceByUnit||[]),{unitId:unit.id,location:unit.location,value:field.value,evidence:field.evidence,certainty,direct}]};
  }
 }
 return {...source,metadata:{...source.metadata,sourceAnalysis:{...source.metadata.sourceAnalysis,cells}}};
}
export async function handleSourceAction({body,db,project,user}){
 if(body.action==='source-list')return {sources:must(await scoped(db,project).order('created_at',{ascending:false}).limit(1000))};
 if(body.action==='source-fill')return fill({body,db,project,user});
 if(!uuid(body.sourceId))throw new VentureError('자료 식별자를 확인해 주세요.');
 let row=must(await scoped(db,project).eq('id',body.sourceId).maybeSingle());
 if(body.action==='source-begin'){
  const f=body.file;if(!f||typeof f.name!=='string'||!f.name||f.name.length>255||!Number.isSafeInteger(f.size)||f.size<=0||f.size>SOURCE_MAX_BYTES||typeof f.fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(f.fingerprint)||!['pdf','doc','docx','hwp','hwpx','pptx','xlsx','png','jpg','jpeg','txt','md','csv'].includes(f.name.split('.').pop().toLowerCase()))throw new VentureError('자료는 PDF·Word·한글·PPTX·XLSX·이미지·텍스트, 파일당 500MB까지 올릴 수 있습니다.');
  if(row){if(row.metadata.sourceUpload.fingerprint!==f.fingerprint||row.metadata.sourceUpload.size!==f.size)throw new VentureError('이전 원본과 다른 파일입니다. 새 자료로 올려 주세요.',409);return {source:row};}
  const types={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',hwp:'application/x-hwp',hwpx:'application/hwp+zip',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg'};
  const ext=f.name.split('.').pop().toLowerCase(),mime=types[ext]||'text/plain';
  row=must(await db.from('documents').insert({id:body.sourceId,company_id:project.company_id,title:f.name,code:'SRC-'+body.sourceId.slice(0,8),hierarchy_level:'LEVEL_4',certification_code:'VENTURE',status:'DRAFT',content_draft:'',metadata:{kind:'venture-source',format:ext.toUpperCase(),fileName:f.name,fileSize:f.size,sourceOrigin:{projectId:project.id,actor:user.id},sourceUpload:{fingerprint:f.fingerprint,size:f.size,contentType:mime,partSize:SOURCE_PART_BYTES,parts:[],state:'uploading'},sourceAnalysis:{units:[],cells:{},basicFields:{},prepared:false,state:'new'}}}).select('*').single());return {source:row};
 }
 if(!row)throw new VentureError('자료가 없거나 회사 접근 권한이 없습니다.',404);
 let upload=row.metadata.sourceUpload,analysis=row.metadata.sourceAnalysis;
 if(body.action==='source-part'){
  if(!Number.isInteger(body.index)||body.index<0||body.index>=Math.ceil(upload.size/SOURCE_PART_BYTES)||!/^[a-f0-9]{64}$/.test(body.sha256))throw new VentureError('원본 조각을 확인해 주세요.');
  const path=prefix(project,row.id)+`source-original/part-${String(body.index).padStart(5,'0')}`,expected=Math.min(SOURCE_PART_BYTES,upload.size-body.index*SOURCE_PART_BYTES),old=upload.parts[body.index];
  if(old){if(old.sha256!==body.sha256)throw new VentureError('동일 파일의 이전 조각과 내용이 다릅니다.',409);return {source:row};}
  const bytes=await download(db,path,SOURCE_PART_BYTES);if(bytes.length!==expected||hash(bytes)!==body.sha256)throw new VentureError('원본 전송 검증에 실패했습니다. 같은 파일로 다시 이어가 주세요.');
  const parts=[...upload.parts];parts[body.index]={path,size:bytes.length,sha256:body.sha256};row=await persist(db,row,{...row.metadata,sourceUpload:{...upload,parts}});return {source:row};
 }
 if(body.action==='source-complete'){
  const bundle=validateSourceBundle({version:1,size:upload.size,partSize:SOURCE_PART_BYTES,contentType:upload.contentType,fileName:row.title,parts:upload.parts,originalPath:prefix(project,row.id)+'source-original/original.'+row.metadata.format.toLowerCase()},{companyId:project.company_id,documentId:row.id});
  const {parts,...base}=bundle;const clean={...base,parts:parts.map(({start,end,...p})=>p)};
  row=await persist(db,row,{...row.metadata,sourceUpload:{...upload,state:'ready'},sourceBundle:clean,originalPath:bundle.originalPath,...(row.metadata.format==='PDF'?{previewPath:bundle.originalPath,previewFormat:'PDF'}:{})},{file_url:bundle.originalPath});return {source:row};
 }
 if(upload.state!=='ready')throw new VentureError('원본 업로드를 먼저 완료해 주세요.',409);
 if(body.action==='source-unit'){
  const unit=body.unit;if(!unit||!Number.isInteger(unit.id)||unit.id<1||unit.id>2000||typeof unit.location!=='string'||!unit.location||unit.location.length>300||!Array.isArray(unit.images)||unit.images.length>3)throw new VentureError('분석 단위·위치를 확인해 주세요. 파일당 최대 2,000개 단위를 지원합니다.');
  const base=prefix(project,row.id)+`analysis-input/unit-${unit.id}/`;
  if(unit.textPath!==base+'text.txt'||unit.images.some((p,i)=>p!==base+`image-${i}.jpg`))throw new VentureError('분석 자료 경로가 올바르지 않습니다.');
  const bytes=await download(db,unit.textPath,100000),text=bytes.toString('utf8');if(text.length>20000)throw new VentureError('한 분석 단위의 본문이 너무 큽니다.');
  const old=analysis.units.find(u=>u.id===unit.id),checksum=hash(bytes);if(old){if(old.textHash!==checksum)throw new VentureError('이전 분석 원문과 다릅니다.',409);return {source:row};}
  if(analysis.prepared)throw new VentureError('준비가 완료된 자료의 단위를 바꿀 수 없습니다.',409);
  const imageHashes=[];for(const path of unit.images){const image=await download(db,path,4000000);if(image[0]!==255||image[1]!==216)throw new VentureError('분석 이미지 형식을 확인해 주세요.');imageHashes.push(hash(image));}
  const units=[...analysis.units,{...unit,imageHashes,textHash:checksum,state:'new',attempts:0}].sort((a,b)=>a.id-b.id);row=await persist(db,row,{...row.metadata,sourceAnalysis:{...analysis,units,state:'preparing'}});return {source:row};
 }
 if(body.action==='source-prepared'){
  if(!Number.isInteger(body.total)||body.total<1||body.total>2000||analysis.units.length!==body.total||analysis.units.some((u,i)=>u.id!==i+1))throw new VentureError('준비한 쪽이 누락되었습니다. 원본을 다시 선택해 이어가 주세요.');
  row=await persist(db,row,{...row.metadata,sourceAnalysis:{...analysis,prepared:true,total:body.total,state:analysis.units.every(u=>u.state==='ready')?'ready':'prepared'}});return {source:row};
 }
 if(body.action==='source-result'){
  const unit=analysis.units.find(u=>u.id===body.unitId);if(!unit?.outputPath)throw new VentureError('분석 결과가 없습니다.',404);return {unit,result:JSON.parse((await download(db,unit.outputPath,1000000)).toString('utf8'))};
 }
 if(body.action!=='source-analyze')throw new VentureError('지원하지 않는 자료 작업입니다.');
 if(!analysis.prepared)throw new VentureError('분석할 원문 준비를 먼저 마쳐 주세요.',409);
 const unit=analysis.units.find(u=>u.id===body.unitId);if(!unit)throw new VentureError('분석할 쪽을 확인해 주세요.');if(unit.state==='ready'&&body.reread!==true)return {source:row};
 if(body.reread===true&&unit.state!=='ready')throw new VentureError('진행 중인 쪽은 완료된 뒤 다시 분석해 주세요.',409);
 if(analysis.units.some(u=>u.state==='pending'&&Date.now()-Date.parse(u.startedAt)<130000))throw new VentureError('다른 분석이 진행 중입니다. 잠시 후 이어가 주세요.',409);
 if(unit.attempts>=3)throw new VentureError('같은 부분 분석을 세 번 시도했습니다. 원문을 확인해 주세요.',429);
 const pending={...unit,state:'pending',startedAt:new Date().toISOString(),attempts:unit.attempts+1,error:null};row=await persist(db,row,{...row.metadata,sourceAnalysis:{...analysis,state:'analyzing',units:analysis.units.map(u=>u.id===unit.id?pending:u)}});analysis=row.metadata.sourceAnalysis;
 try{
  const textBytes=await download(db,unit.textPath,100000);if(hash(textBytes)!==unit.textHash)throw new VentureError('준비 당시 본문과 다릅니다.');
  const images=[];for(const [index,path] of unit.images.entries()){const bytes=await download(db,path,4000000);if(unit.imageHashes?.[index]&&hash(bytes)!==unit.imageHashes[index])throw new VentureError('준비 당시 이미지와 다릅니다. 원본을 다시 확인해 주세요.');if(bytes[0]!==255||bytes[1]!==216)throw new VentureError('분석 이미지 형식을 확인해 주세요.');images.push('data:image/jpeg;base64,'+bytes.toString('base64'));}
  const company=must(await db.from('companies').select('name').eq('id',project.company_id).single());
  const result=await analyzeSourceUnit({companyName:company.name,sourceName:row.title,unit:{...unit,text:textBytes.toString('utf8')},previousCells:analysis.cells,images});
  const outputPath=prefix(project,row.id)+`analysis-output/unit-${unit.id}-${pending.attempts}.txt`;await plainUpload(db,outputPath,{...result,location:unit.location,textHash:unit.textHash,readAt:new Date().toISOString()});
  const cells={...analysis.cells};for(const field of result.fields)cells[field.sectionId+'/'+field.fieldId]={...field,certainty:result.companyMatch==='different'?'uncertain':field.certainty,location:unit.location,unitIds:[...new Set([...(cells[field.sectionId+'/'+field.fieldId]?.unitIds||[]),unit.id])],sourceId:row.id};
  const basicFields={...analysis.basicFields};if(result.companyMatch!=='different')for(const field of result.basicFields)basicFields[field.key]={...field,location:unit.location};
  const units=analysis.units.map(u=>u.id===unit.id?{...pending,state:'ready',outputPath,previousOutputs:unit.outputPath?[...(unit.previousOutputs||[]),unit.outputPath]:unit.previousOutputs,summary:result.summary,tables:result.tables.length,charts:result.charts.length,warnings:result.warnings,provider:result.provider}:u);
  row=await persist(db,row,{...row.metadata,sourceAnalysis:{...analysis,units,cells,basicFields,companyMatch:result.companyMatch,provider:result.provider,state:units.every(u=>u.state==='ready')?'ready':'prepared'}});return {source:row};
 }catch(e){try{const units=analysis.units.map(u=>u.id===unit.id?{...pending,state:unit.state==='ready'?'ready':'failed',error:e.message}:u);row=await persist(db,row,{...row.metadata,sourceAnalysis:{...analysis,state:units.every(u=>u.state==='ready')?'ready':'failed',units}});}catch{}throw e;}
}
async function fill({body,db,project,user}){
 if(!uuid(body.documentId)||!uuid(body.importId)||!Array.isArray(body.sourceIds)||body.sourceIds.length<1||body.sourceIds.length>10||body.sourceIds.some(id=>!uuid(id))||new Set(body.sourceIds).size!==body.sourceIds.length||!['fill','supplement'].includes(body.mode))throw new VentureError('연결할 자료와 반영 방식을 확인해 주세요.');
 let sources=must(await scoped(db,project).in('id',body.sourceIds));if(sources.length!==body.sourceIds.length)throw new VentureError('다른 회사·프로젝트 자료에 접근할 수 없습니다.',403);if(sources.some(s=>s.metadata.sourceAnalysis.state!=='ready'))throw new VentureError('선택한 자료의 전체 분석이 완료되어야 양식에 반영할 수 있습니다.',409);
 let row=must(await db.from('documents').select('*').eq('company_id',project.company_id).eq('id',body.documentId).maybeSingle());
 const company=must(await db.from('companies').select('name').eq('id',project.company_id).single());
 const requestHash=inputHash({sourceIds:body.sourceIds,mode:body.mode,content:body.content??null,documentFields:body.documentFields??null,type:body.type??null});
 if(row?.metadata.ai?.sourceImport?.requestId===body.importId){if(row.metadata.ai.sourceImport.requestHash!==requestHash)throw new VentureError('이전 자료 반영 요청과 내용이 다릅니다.',409);return {document:row};}
 if(row&&(row.metadata.ai?.projectId!==project.id||row.metadata.ai.state!=='ready'))throw new VentureError('현재 프로젝트의 작성 문서를 확인해 주세요.',403);
 if(row&&row.updated_at!==body.expectedUpdatedAt)throw new VentureError('문서가 변경되었습니다. 최신 저장본에서 이어가 주세요.',409);
 // Reconstruct from the immutable outputs, including sources analyzed before this fix.
 sources=await Promise.all(sources.map(source=>sourceWithEvidence(db,source)));
 const type=row?.metadata.ai.input.type||body.type||'business_plan';if(!DOCUMENT_TYPES[type])throw new VentureError('작성 문서 유형을 확인해 주세요.');
 const content=body.content??row?.metadata.ai.chat?.proposal?.content??row?.content_draft??emptySourcePlan(type);if(typeof content!=='string'||content.length>80000)throw new VentureError('현재 본문을 확인해 주세요.');
 let fields;try{fields=body.documentFields?validateDocumentFields(body.documentFields):(row?.metadata.ai.chat?.proposal?.documentFields||readDocumentFields(row?.metadata.ai||{companyName:company.name}));}catch(e){throw new VentureError(e.message);}
 let mapped;try{mapped=mapSourceCells({content,type,sources,fields,mode:body.mode});validateDocumentFields(mapped.documentFields);}catch(e){throw new VentureError(e.message);}
 const turnId=crypto.randomUUID(),now=new Date().toISOString(),aiSources=sources.map(s=>({id:s.id,title:s.title,updated_at:s.updated_at,sourceOrigin:s.metadata.sourceOrigin,analysis:s.metadata.sourceAnalysis.cells,rawUnitCount:s.metadata.sourceAnalysis.units.length}));
 const turn={id:turnId,kind:'source-import',state:'ready',at:now,actor:user.id,message:`자료 ${sources.length}개 분석 결과를 양식에 반영`,reply:`자료에서 확인한 ${mapped.changes.length}개 항목을 반영했습니다. 이미 작성된 내용은 ${body.mode==='fill'?'보존했습니다':'유지하며 자료 내용을 덧붙였습니다'}. 판독이 불확실한 내용은 자료 패널에서 확인해 주세요.`,questions:mapped.questions,choices:['추가 자료를 올리겠습니다.','아직 확인되지 않아 확인 필요로 남깁니다.'],changes:mapped.changes,sourceIds:body.sourceIds};
 const parentTurnIds=proposalParents(row?.metadata.ai.chat,turnId);
 const proposal={turnId,content:mapped.content,documentFields:mapped.documentFields,changes:mapped.changes,parentTurnIds};
 if(!row){
  const {count,error}=await db.from('documents').select('id',{count:'exact',head:true}).eq('company_id',project.company_id).eq('metadata->ai->>kind','venture-document').gte('created_at',new Date(Date.now()-3600000).toISOString());if(error||count>=10)throw new VentureError('회사당 한 시간의 새 문서 생성 한도를 확인해 주세요.',429);
  const base=emptySourcePlan(type);row=must(await db.from('documents').insert({id:body.documentId,company_id:project.company_id,title:`${company.name} · ${DOCUMENT_TYPES[type].title}`,code:'VG-'+body.documentId.slice(0,8),certification_code:'VENTURE',hierarchy_level:'LEVEL_2',status:'DRAFT',content_draft:base,metadata:{reviewStatus:'DRAFT',revisionNo:1,standards:['VENTURE'],projectOrigin:{projectId:project.id,clientName:company.name},ai:{kind:'venture-document',projectId:project.id,state:'ready',companyName:company.name,input:{type,application:'unknown',business:'업로드한 회사 자료를 기반으로 작성',facts:'',sourceIds:[]},inputHash:inputHash(body.sourceIds),sources:aiSources,documentFields:fields,createdBy:user.id,basis:{version:VENTURE_VERSION,url:VENTURE_BOOK_URL},output:{sections:[],questions:mapped.questions,checks:[],provider:sources.at(-1).metadata.sourceAnalysis.provider},history:[],chat:{turns:[turn],proposal},sourceImport:{requestId:body.importId,requestHash,sourceIds:body.sourceIds,missingFields:mapped.missing,at:now}}}}).select('*').single());
 }else{
  const ai=row.metadata.ai,turns=ai.chat?.turns||[];if(turns.length>=20)throw new VentureError('대화가 20회입니다. 저장 후 새 문서로 이어가 주세요.',429);
  row=await persist(db,row,{...row.metadata,ai:{...ai,sources:[...(ai.sources||[]).filter(s=>!body.sourceIds.includes(s.id)),...aiSources],chat:{...ai.chat,turns:[...turns,turn],proposal},sourceImport:{requestId:body.importId,requestHash,sourceIds:body.sourceIds,missingFields:mapped.missing,at:now}}});
 }
 return {document:row,filled:mapped.changes.length};
}
