import { SEED_DOCUMENTS } from './mockData.js';

export const LOCAL_DOCUMENTS_KEY = 'isoedu_local_documents_v1';
const LEGACY_KEY = 'isoedu_documents_v6';

export function readLocalDocuments(storage) {
  if (!storage) throw new Error('브라우저 저장소를 사용할 수 없습니다.');
  const saved = storage.getItem(LOCAL_DOCUMENTS_KEY) ?? storage.getItem(LEGACY_KEY);
  const documents = saved === null ? SEED_DOCUMENTS : JSON.parse(saved);
  if (!Array.isArray(documents)) throw new Error('저장된 문서 형식이 올바르지 않습니다.');
  storage.setItem(LOCAL_DOCUMENTS_KEY, JSON.stringify(documents));
  return documents;
}

export function writeLocalCompanyDocuments(storage, companyId, documents) {
  const others = readLocalDocuments(storage).filter(doc => doc.companyId !== companyId);
  storage.setItem(LOCAL_DOCUMENTS_KEY, JSON.stringify([...others, ...documents.map(doc => ({ ...doc, companyId }))]));
}
