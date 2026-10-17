export function resolveDataConfig({ mode, url, key } = {}) {
  const configured = Boolean(url && key && url !== 'https://your-project.supabase.co' && !key.includes('your-anon-key'));
  if (mode && !['local', 'cloud'].includes(mode)) {
    throw new Error('NEXT_PUBLIC_DATA_MODE must be local or cloud.');
  }
  return { mode: mode || (configured ? 'cloud' : 'local'), configured, url, key };
}

export const dataConfig = resolveDataConfig({
  mode: process.env.NEXT_PUBLIC_DATA_MODE,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
export const isCloudMode = dataConfig.mode === 'cloud';
