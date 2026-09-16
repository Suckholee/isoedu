// The workshop is local to this browser. Blobs stay in IndexedDB, not localStorage.
const DATABASE = 'isoedu-one-to-one-v1';
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('records', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('다른 탭을 닫고 다시 시도해 주세요.'));
  });
}
async function transaction(mode, action) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', mode);
    const request = action(tx.objectStore('records'));
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error || new Error('저장 공간을 확인해 주세요.')); };
  });
}
export const readWorkshop = () => transaction('readonly', store => store.get('workshop'));
export const saveWorkshop = data => transaction('readwrite', store => store.put({ ...data, id: 'workshop' }));
