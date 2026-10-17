import { fromDocumentRow, toDocumentRow } from './documentModel.js';
import { readLocalDocuments, writeLocalCompanyDocuments } from './localDocuments.js';

export function createDocumentRepository({ mode, client, storage }) {
  function requireClient() {
    if (!client) throw new Error('클라우드 연결 설정을 확인해 주세요.');
    return client;
  }
  function checkCompany(companyId) {
    if (!companyId) throw new Error('문서를 저장할 회사를 선택해 주세요.');
  }
  return {
    async list(companyId) {
      checkCompany(companyId);
      if (mode === 'local') return readLocalDocuments(storage).filter(doc => doc.companyId === companyId);
      const { data, error } = await requireClient().from('documents').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(fromDocumentRow);
    },
    async save(companyId, documents) {
      checkCompany(companyId);
      if (documents.some(doc => doc.companyId !== companyId)) throw new Error('다른 회사의 문서를 저장할 수 없습니다.');
      if (!documents.length) return [];
      if (mode === 'local') {
        const current = readLocalDocuments(storage).filter(doc => doc.companyId === companyId);
        const updates = new Map(documents.map(doc => [doc.id, doc]));
        const merged = current.map(doc => updates.get(doc.id) || doc);
        merged.push(...documents.filter(doc => !current.some(item => item.id === doc.id)));
        writeLocalCompanyDocuments(storage, companyId, merged);
        return documents;
      }
      const { data, error } = await requireClient().from('documents').upsert(documents.map(toDocumentRow)).select();
      if (error) throw error;
      return data.map(fromDocumentRow);
    },
    async remove(companyId, id) {
      checkCompany(companyId);
      if (mode === 'local') {
        writeLocalCompanyDocuments(storage, companyId, readLocalDocuments(storage).filter(doc => doc.companyId === companyId && doc.id !== id));
        return;
      }
      const { data, error } = await requireClient().from('documents').delete().eq('company_id', companyId).eq('id', id).select('id');
      if (error) throw error;
      if (!data.length) throw new Error('문서가 없거나 삭제 권한이 없습니다.');
    },
  };
}
