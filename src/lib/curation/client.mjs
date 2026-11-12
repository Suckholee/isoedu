import {normalizeProfile,curateCertifications} from './engine.mjs';
import {CURATION_VERSION} from './catalog.mjs';
export function createCurationClient({cloud=true,storage,fetcher=fetch}){
 const key=id=>'honestone_curation_v1:'+id;
 async function call(url,options){const response=await fetcher(url,{credentials:'same-origin',cache:'no-store',...options});let data;try{data=await response.json();}catch{throw Error('저장소 응답을 확인하지 못했습니다.');}if(!response.ok)throw Object.assign(Error(data.error||'요청에 실패했습니다.'),{status:response.status});return data;}
 return {
  async load(company){if(cloud)return call('/api/certification-curation?companyId='+encodeURIComponent(company.id));const report=JSON.parse(storage.getItem(key(company.id))||'null');return {company,canEdit:true,report};},
  async save(company,profile,expectedRevision){if(cloud)return (await call('/api/certification-curation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({companyId:company.id,profile,expectedRevision})})).report;
   const previous=JSON.parse(storage.getItem(key(company.id))||'null');if((previous?.revision||0)!==expectedRevision)throw Error('다른 화면에서 정보가 변경되었습니다. 최신 저장본을 불러와 주세요.');const normalized=normalizeProfile(profile),report={id:'local-curation-'+company.id,companyId:company.id,profile:normalized,revision:expectedRevision+1,evaluatedAt:new Date().toISOString(),sourceVersion:CURATION_VERSION,results:curateCertifications(normalized),history:previous?[...(previous.history||[]),{revision:previous.revision,evaluatedAt:previous.evaluatedAt,sourceVersion:previous.sourceVersion}].slice(-20):[]};storage.setItem(key(company.id),JSON.stringify(report));return report;
  },
 };
}
