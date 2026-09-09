import { createClient } from '@supabase/supabase-js';
import { SEED_DOCUMENTS } from './mockData.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseKey.includes('your-anon-key')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// LocalStorage Key updated to v5 to guarantee rich enterprise contents load immediately
const LOCAL_STORAGE_KEY = 'isoedu_documents_v5';

export const getStoredDocuments = () => {
  if (typeof window === 'undefined') return SEED_DOCUMENTS;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 유효한 문서는 최소 20건 이상의 배열이어야 함 (4건짜리 구형 원격 데이터 오염 방지)
      if (Array.isArray(parsed) && parsed.length >= 20) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('LocalStorage load error, using seed data:', err);
  }
  // 29종 공문서 시드로 채우고 저장
  saveStoredDocuments(SEED_DOCUMENTS);
  return SEED_DOCUMENTS;
};

export const saveStoredDocuments = (docs) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(docs));
  } catch (err) {
    console.error('LocalStorage save error:', err);
  }
};

export const resetStoredDocuments = () => {
  if (typeof window === 'undefined') return SEED_DOCUMENTS;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    saveStoredDocuments(SEED_DOCUMENTS);
  } catch (e) {
    // ignore
  }
  return SEED_DOCUMENTS;
};
