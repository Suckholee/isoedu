import {createHash} from 'node:crypto';
import {normalizeProfile,curateCertifications,CurationError} from './engine.mjs';
import {CURATION_VERSION} from './catalog.mjs';
import {taskToday} from '../workTaskDates.mjs';
export const isCompanyId=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function reportId(companyId){const h=createHash('sha256').update('honestone/certification-curation/v1/'+companyId).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;}
function checked(r){if(r.error)throw new CurationError('회사 정보 저장소 요청에 실패했습니다. 연결과 권한을 확인해 주세요.',503);return r.data;}
export async function curationContext(db,companyId,{write=false}={}){
 if(!isCompanyId(companyId))throw new CurationError('대상 회사를 확인해 주세요.');
 if(!db)throw new CurationError('회사 저장소 연결이 필요합니다.',503);
 const auth=await db.auth.getUser();if(auth.error||!auth.data?.user)throw new CurationError('로그인이 필요합니다.',401);
 const company=checked(await db.from('companies').select('id,name,industry').eq('id',companyId).maybeSingle());if(!company)throw new CurationError('접근할 수 없는 회사입니다.',404);
 const canEdit=checked(await db.rpc('can_edit_company',{c_id:companyId}))===true;if(write&&!canEdit)throw new CurationError('회사 정보 편집 권한이 필요합니다.',403);
 return {db,company,user:auth.data.user,canEdit};
}
export async function readCuration(ctx){
 const row=checked(await ctx.db.from('documents').select('*').eq('id',reportId(ctx.company.id)).eq('company_id',ctx.company.id).maybeSingle());
 if(row&&(!Number.isSafeInteger(row.metadata?.curation?.revision)||row.metadata.curation.revision<1))throw new CurationError('추천 기록의 수정번호를 확인해 주세요.',409);
 if(row&&(row.metadata?.kind!=='certification-curation'||row.metadata?.curation?.companyId!==ctx.company.id))throw new CurationError('추천 기록의 회사 연결을 확인해 주세요.',409);
 return row;
}
export function publicReport(row){if(!row)return null;const r=row.metadata.curation;return {id:row.id,revision:r.revision,companyId:row.company_id,profile:normalizeProfile(r.profile),evaluatedAt:r.evaluatedAt,sourceVersion:r.sourceVersion,results:r.results,history:(r.history||[]).map(h=>({revision:h.revision,evaluatedAt:h.evaluatedAt,sourceVersion:h.sourceVersion})),updatedAt:row.updated_at};}
export async function saveCuration(ctx,body,{now=new Date().toISOString()}={}){
 if(!ctx.canEdit)throw new CurationError('회사 정보 편집 권한이 필요합니다.',403);
 const profile=normalizeProfile(body.profile,taskToday(new Date(now))),results=curateCertifications(profile,{today:taskToday(new Date(now))});
 if(!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0)throw new CurationError('저장본 수정번호를 확인해 주세요.');
 const row=await readCuration(ctx),previous=row?.metadata.curation;
 if((previous?.revision||0)!==body.expectedRevision)throw new CurationError('다른 곳에서 회사 정보가 변경되었습니다. 입력을 복사한 뒤 최신 저장본을 다시 불러와 주세요.',409);
 const revision=(previous?.revision||0)+1,record={companyId:ctx.company.id,profile,results,revision,sourceVersion:CURATION_VERSION,evaluatedAt:now,actor:ctx.user.id,history:previous?[...(previous.history||[]),{revision:previous.revision,profile:previous.profile,results:previous.results,sourceVersion:previous.sourceVersion,evaluatedAt:previous.evaluatedAt,actor:previous.actor}].slice(-20):[]};
 const content=`# ${ctx.company.name} 인증 큐레이션\n\n입력 정보 기반 준비 검토 · 수정 ${revision} · ${now}\n\n`+results.map(r=>`## ${r.name}\n${r.status}\n${r.reasons.join('\n')}\n확인할 정보: ${r.missing.map(x=>x.label).join(', ')||'기관 평가·실제 증빙'}\n${r.url}`).join('\n\n');
 const payload={title:`${ctx.company.name} 인증 큐레이션`,content_draft:content,updated_at:now,metadata:{...row?.metadata,kind:'certification-curation',curation:record}};
 let response;if(row)response=await ctx.db.from('documents').update(payload).eq('id',row.id).eq('company_id',ctx.company.id).eq('updated_at',row.updated_at).select('*').maybeSingle();
 else response=await ctx.db.from('documents').insert({...payload,id:reportId(ctx.company.id),company_id:ctx.company.id,code:'CERTIFICATION-CURATION',certification_code:'ISO_9001',hierarchy_level:'LEVEL_1',status:'DRAFT',summary:'회사 입력 정보에 따른 인증 준비 검토. 공식 적합·인증 결과 아님.'}).select('*').maybeSingle();
 if(response.error?.code==='23505')throw new CurationError('다른 곳에서 추천 기록을 먼저 저장했습니다. 최신 저장본을 불러와 주세요.',409);
 const saved=checked(response);if(!saved)throw new CurationError('저장 중 기록이 변경되어 덮어쓰지 않았습니다.',409);
 return publicReport(saved);
}
