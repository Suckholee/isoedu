'use client';

import { useEffect, useRef, useState } from 'react';
import { createDocumentRepository } from '../lib/documentRepository.js';
import { supabase } from '../lib/supabaseClient.js';
import { dataConfig } from '../lib/dataConfig.js';

export function useDocuments({ companyId, userId, enabled }) {
  const key = `${userId || 'local'}:${companyId || ''}:${enabled}`;
  const scope = useRef(key);
  scope.current = key;
  const store = useRef({ key: null, documents: [], ready: false });
  const queue = useRef(Promise.resolve());
  const [snapshot, setSnapshot] = useState(store.current);
  const [error, setError] = useState(null);
  const repository = () => createDocumentRepository({
    mode: dataConfig.mode, client: supabase,
    storage: dataConfig.mode === 'local' ? window.localStorage : null,
  });

  useEffect(() => {
    let cancelled = false;
    store.current = { key, documents: [], ready: false };
    setSnapshot(store.current);
    setError(null);
    if (!enabled || !companyId) return;
    repository().list(companyId).then(documents => {
      if (cancelled || scope.current !== key) return;
      store.current = { key, documents, ready: true };
      setSnapshot(store.current);
    }).catch(err => {
      if (!cancelled && scope.current === key) setError(err.message);
    });
    return () => { cancelled = true; };
  }, [key, companyId, enabled]);

  function mutate(operation) {
    const requestedKey = key;
    const task = queue.current.catch(() => {}).then(async () => {
      if (scope.current !== requestedKey || !store.current.ready || store.current.key !== requestedKey) {
        throw new Error('회사 문서를 불러온 뒤 다시 시도해 주세요.');
      }
      const result = await operation(repository(), store.current.documents);
      if (scope.current === requestedKey) {
        store.current = { key: requestedKey, documents: result.documents, ready: true };
        setSnapshot(store.current);
      }
      return result.value;
    });
    queue.current = task;
    return task;
  }

  return {
    documents: snapshot.key === key ? snapshot.documents : [],
    error,
    ready: snapshot.key === key && snapshot.ready,
    save: build => mutate(async (repo, current) => {
      const changes = typeof build === 'function' ? build(current) : build;
      const saved = await repo.save(companyId, changes);
      const byId = new Map(saved.map(doc => [doc.id, doc]));
      return {
        documents: [...saved.filter(doc => !current.some(old => old.id === doc.id)), ...current.map(doc => byId.get(doc.id) || doc)],
        value: saved,
      };
    }),
    remove: id => mutate(async (repo, current) => {
      await repo.remove(companyId, id);
      return { documents: current.filter(doc => doc.id !== id), value: true };
    }),
  };
}
