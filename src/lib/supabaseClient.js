import { createClient } from '@supabase/supabase-js';
import { SEED_DOCUMENTS } from './mockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// LocalStorage Helper for Hybrid/Demo Mode
const LOCAL_STORAGE_KEY = 'isoedu_documents_v1';

export const getStoredDocuments = () => {
  if (typeof window === 'undefined') return SEED_DOCUMENTS;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('LocalStorage load error, using seed data:', err);
  }
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
  } catch (e) {
    // ignore
  }
  return SEED_DOCUMENTS;
};
