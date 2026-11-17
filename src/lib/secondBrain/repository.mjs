import { cleanRecord } from './model.mjs';

function failure(error) {
  if (!error) return;
  if (['40001', '23505'].includes(error.code)) throw Error('다른 창에서 수정한 기록입니다. 작성 내용을 복사한 뒤 최신 기록을 다시 열어 주세요.');
  if (error.code === '42501') throw Error('이 회사의 기록을 수정할 권한이 없습니다.');
  if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(error.code)) throw Error('기록 저장소 설정이 아직 적용되지 않았습니다. 관리자에게 설정 적용을 요청해 주세요.');
  throw Error('기록을 처리하지 못했습니다. 연결과 회사 권한을 확인하고 다시 시도해 주세요.');
}

export function cloudRecords(client) {
  return {
    async load(companyId) {
      if (!client) throw Error('로그인이 필요합니다.');
      const permission = await client.rpc('can_edit_company', { c_id: companyId });
      failure(permission.error);
      const records = [];
      for (let from = 0; ; from += 500) {
        const result = await client.from('knowledge_records').select('*').eq('company_id', companyId).order('id').range(from, from + 499);
        failure(result.error);
        records.push(...result.data);
        if (result.data.length < 500) break;
      }
      return { records, canEdit: permission.data === true };
    },
    async save(record, context) {
      const payload = cleanRecord(record, context);
      const result = await client.rpc('save_knowledge_record', { p_id: record.id, p_revision: record.revision, p_record: payload });
      failure(result.error);
      const saved = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!saved?.id) throw Error('저장 결과를 확인하지 못했습니다. 최신 기록을 다시 불러와 주세요.');
      return saved;
    },
  };
}

// One read/write transaction protects revision checks across browser tabs.
export function localRecords(indexedDB, name = 'honestone-second-brain-v1') {
  const open = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('records', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(Error('브라우저 저장소를 열지 못했습니다.'));
  });
  async function transaction(mode, work) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('records', mode); let result, error;
      tx.oncomplete = () => { db.close(); resolve(result); };
      tx.onabort = tx.onerror = () => { db.close(); reject(error || Error('브라우저 저장에 실패했습니다. 작성 내용을 복사해 보관해 주세요.')); };
      work(tx.objectStore('records'), value => { result = value; }, reason => { error = reason; tx.abort(); });
    });
  }
  return {
    async load(companyId) {
      return transaction('readonly', (store, done) => {
        const request = store.getAll();
        request.onsuccess = () => done({ records: request.result.filter(r => r.company_id === companyId), canEdit: true });
      });
    },
    async save(record, context) {
      const payload = cleanRecord(record, context);
      return transaction('readwrite', (store, done, abort) => {
        const request = store.get(record.id);
        request.onsuccess = () => {
          const old = request.result;
          if ((old && old.company_id !== context.companyId) || (old?.revision || 0) !== record.revision) return abort(Error('다른 창에서 수정한 기록입니다. 작성 내용을 복사한 뒤 최신 기록을 다시 열어 주세요.'));
          const saved = { ...payload, id: record.id, revision: record.revision + 1, created_at: old?.created_at || new Date().toISOString(), updated_at: new Date().toISOString() };
          store.put(saved); done(saved);
        };
      });
    },
  };
}
