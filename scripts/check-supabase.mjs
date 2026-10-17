import { dataConfig } from '../src/lib/dataConfig.js';
if (dataConfig.mode !== 'cloud' || !dataConfig.configured) {
  console.error('Supabase cloud mode requires NEXT_PUBLIC_SUPABASE_URL and a publishable/anon key.');
  process.exit(1);
}
try {
  console.log(`Supabase host: ${new URL(dataConfig.url).hostname}`);
  const response = await fetch(`${dataConfig.url}/auth/v1/settings`, {
    headers: { apikey: dataConfig.key }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: check the project URL and publishable key.`);
  console.log('Supabase Auth endpoint is reachable. Schema and signed-in access still require validation.');
} catch (error) {
  console.error(`Connection failed: ${error.cause?.code || error.message}`);
  process.exitCode = 1;
}
