import { createBrowserClient } from '@supabase/ssr';
import { dataConfig, isCloudMode } from './dataConfig.js';

export const isSupabaseConfigured = isCloudMode && dataConfig.configured;
export const supabase = isSupabaseConfigured
  ? createBrowserClient(dataConfig.url, dataConfig.key)
  : null;

// Cloud audit identity is resolved by the database from auth.uid().
export async function recordAuditLog({ actionType }) {
  if (!isCloudMode) return;
  if (!supabase) throw new Error('클라우드 연결 설정을 확인해 주세요.');
  const { error } = await supabase.rpc('record_auth_event', { event_type: actionType });
  if (error) throw error;
}
