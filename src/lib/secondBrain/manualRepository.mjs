import {createHash} from 'node:crypto';
import {analyzeManual,isReference,isManual,validateUnits,cleanManualAnalysis} from './manuals.mjs';
export class ManualError extends Error {constructor(message,status=400){super(message);this.status=status;}}
const must=result=>{if(result.error)throw new ManualError('참조문서 권한과 저장소 연결을 확인해 주세요.',503);return result.data;};
export const sourceKey=row=>createHash('sha256').update(JSON.stringify([row.title,row.content_draft||'',row.metadata?.originalPath,row.metadata?.migration?.sha256])).digest('hex');
export function manualOption(row,canEdit=false){
 const m=row.metadata||{},key=sourceKey(row),cached=m.knowledgeAnalysis;
 return {id:row.id,title:row.title,companyId:row.company_id,updatedAt:row.updated_at,sourceKey:key,manual:isManual(row.title),canEdit,
  text:row.content_draft||'',kind:m.kind,format:m.format,originalName:m.originalName||row.title,originalPath:m.originalPath||null,fileSize:m.fileSize||0,sha256:m.migration?.sha256||null,
  previewPath:m.previewPath,previewFormat:m.previewFormat,previewEncoding:m.previewEncoding,sourceBundle:m.sourceBundle,
  contentDraft:row.content_draft||'',analysis:cached?.version===2&&cached.sourceKey===key?cleanManualAnalysis(cached):null};
}
export async function listManuals(db){
 const rows=must(await db.from('documents').select('id,title,company_id,content_draft,updated_at,metadata').eq('metadata->sourceImport->>category','reference').order('title').limit(1000)).filter(isReference);
 const editable=new Map();
 for(const id of new Set(rows.map(r=>r.company_id)))editable.set(id,Boolean(must(await db.rpc('can_edit_company',{c_id:id}))));
 return rows.map(row=>manualOption(row,editable.get(row.company_id)));
}
export async function saveManualAnalysis(db,body){
 if(!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(body?.documentId||''))throw new ManualError('참조문서를 선택해 주세요.');
 const row=must(await db.from('documents').select('id,title,company_id,content_draft,updated_at,metadata').eq('id',body.documentId).maybeSingle());
 if(!row||!isReference(row))throw new ManualError('열람 가능한 참조문서가 아닙니다.',404);
 if(!must(await db.rpc('can_edit_company',{c_id:row.company_id})))throw new ManualError('이 참조문서의 분석 저장 권한이 필요합니다.',403);
 if(row.updated_at!==body.updatedAt||sourceKey(row)!==body.sourceKey)throw new ManualError('원문이 변경되었습니다. 목록을 다시 불러온 뒤 읽어 주세요.',409);
 let units;
 try{units=validateUnits(row.content_draft?.trim()?[{location:'저장 본문',text:row.content_draft}]:body.units);}catch(e){throw new ManualError(e.message);}
 const analysis={...analyzeManual(units,row.title),sourceKey:sourceKey(row),readAt:new Date().toISOString(),warnings:Array.isArray(body.warnings)?body.warnings.filter(x=>typeof x==='string').slice(0,10).map(x=>x.slice(0,500)):[]};
 const saved=must(await db.from('documents').update({metadata:{...row.metadata,knowledgeAnalysis:analysis},updated_at:new Date(Math.max(Date.now(),Date.parse(row.updated_at)+1)).toISOString()}).eq('id',row.id).eq('company_id',row.company_id).eq('updated_at',row.updated_at).select('id,title,company_id,content_draft,updated_at,metadata').maybeSingle());
 if(!saved)throw new ManualError('다른 창에서 문서가 변경되었습니다. 목록을 다시 불러와 주세요.',409);
 return manualOption(saved,true);
}
