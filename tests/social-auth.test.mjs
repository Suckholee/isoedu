import test from 'node:test';
import assert from 'node:assert/strict';
import { safeAuthNext, socialAuthOptions, loadSocialProviders, socialAuthError } from '../src/lib/socialAuth.mjs';

const origin = 'https://isoedu-cyan.vercel.app';
test('OAuth returns to the selected document and company without granting access', () => {
  const options = socialAuthOptions('kakao', { origin, pathname: '/documents', search: '?company=client-1&file=doc-2' });
  const callback = new URL(options.options.redirectTo);
  assert.equal(callback.origin, origin);
  assert.equal(callback.pathname, '/auth/callback');
  assert.equal(callback.searchParams.get('next'), '/documents?company=client-1&file=doc-2');
  assert.equal(options.provider, 'kakao');
});
test('OAuth rejects external redirects, backslash URLs, controls and callback loops', () => {
  for (const value of [null, 'https://evil.test', '//evil.test', '/\\evil.test', '/\n/evil.test', '/auth/callback?next=//evil.test', 'javascript:alert(1)']) {
    assert.equal(safeAuthNext(value, origin), '/dashboard', String(value));
  }
  assert.equal(safeAuthNext('/documents?company=x#file', origin), '/documents?company=x#file');
});
test('Google selects the account and unsupported providers never initiate OAuth', () => {
  assert.equal(socialAuthOptions('google', { origin, pathname: '/settings', search: '' }).options.queryParams.prompt, 'select_account');
  assert.throws(() => socialAuthOptions('unknown', { origin }), /지원하지/);
});
test('only actual enabled providers are presented as available', async () => {
  const config = { mode: 'cloud', configured: true, url: 'https://example.supabase.co', key: 'public-key' };
  let called = false;
  const result = await loadSocialProviders(config, async (url, init) => {
    called = true;
    assert.equal(url, config.url + '/auth/v1/settings');
    assert.equal(init.headers.apikey, config.key);
    return { ok: true, json: async () => ({ external: { kakao: false, google: true, email: true } }) };
  });
  assert.ok(called); assert.deepEqual(result, { kakao: false, google: true });
  assert.deepEqual(await loadSocialProviders({ mode: 'local', configured: true }), {});
  await assert.rejects(loadSocialProviders(config, async () => ({ ok: false })), /불러오지/);
});
test('provider errors do not expose secrets or grant account permissions', () => {
  assert.match(socialAuthError({ message: 'provider is not enabled' }), /설정 중/);
  assert.match(socialAuthError({ message: 'manual linking disabled' }), /활성화/);
  assert.match(socialAuthError({ code: 'identity_already_exists' }), /다른 계정/);
  assert.ok(!socialAuthError({ message: 'secret-private-provider-response' }).includes('secret-private'));
});
