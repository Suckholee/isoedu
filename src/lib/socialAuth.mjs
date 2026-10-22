export const SOCIAL_PROVIDERS = ['kakao', 'google'];

// OAuth return destinations must remain inside this application.
export function safeAuthNext(value, origin) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return '/dashboard';
  try {
    const target = new URL(value, origin);
    if (target.origin !== origin || target.pathname.startsWith('/auth/')) return '/dashboard';
    return target.pathname + target.search + target.hash;
  } catch { return '/dashboard'; }
}

export function socialAuthOptions(provider, location) {
  if (!SOCIAL_PROVIDERS.includes(provider)) throw new Error('지원하지 않는 로그인 방식입니다.');
  const callback = new URL('/auth/callback', location.origin);
  callback.searchParams.set('next', safeAuthNext(location.pathname + location.search, location.origin));
  return { provider, options: { redirectTo: callback.href, ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}) } };
}

export function socialAuthError(error) {
  if (/provider.*not enabled|unsupported provider/i.test(error?.message || '')) return '이 로그인 방식은 아직 연결 설정 중입니다. 이메일로 로그인해 주세요.';
  if (/manual.*link|linking.*disabled/i.test(error?.message || '')) return '계정 연결 설정이 아직 활성화되지 않았습니다. 기존 이메일 로그인을 이용해 주세요.';
  if (/identity_already_exists|already.*linked/i.test(error?.code || error?.message || '')) return '이미 다른 계정에 연결된 로그인입니다. 기존 계정으로 로그인해 주세요.';
  return '소셜 로그인을 시작하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.';
}

export async function loadSocialProviders(config, fetcher = fetch) {
  if (!config.configured || config.mode !== 'cloud') return {};
  const response = await fetcher(`${config.url}/auth/v1/settings`, { headers: { apikey: config.key }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('로그인 설정을 불러오지 못했습니다.');
  const settings = await response.json();
  return Object.fromEntries(SOCIAL_PROVIDERS.map(provider => [provider, settings.external?.[provider] === true]));
}
