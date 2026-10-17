function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('파일 저장에 필요한 IndexedDB를 사용할 수 없습니다.')); return; }
    const request = indexedDB.open('isoedu-local-vault-v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('다른 탭을 닫고 다시 시도해 주세요.'));
  });
}
async function transact(mode, action) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', mode);
    const request = action(tx.objectStore('files'));
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error || new Error('파일 저장에 실패했습니다.')); };
  });
}
export const saveLocalFile = record => transact('readwrite', store => store.put(record));
export const readLocalFile = id => transact('readonly', store => store.get(id));
export const listLocalFiles = async (companyId, docId) => (await transact('readonly', store => store.getAll()))
  .filter(record => record.companyId === companyId && record.docId === docId)
  .map(({ blob, ...metadata }) => metadata);
