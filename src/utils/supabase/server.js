import { createServerClient } from '@supabase/ssr';
import { dataConfig, isCloudMode } from '../../lib/dataConfig.js';

export const createClient = (cookieStore) => {
  if (!isCloudMode || !dataConfig.configured) return null;
  return createServerClient(dataConfig.url, dataConfig.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
};
