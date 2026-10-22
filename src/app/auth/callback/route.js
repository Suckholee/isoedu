import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';
import { safeAuthNext } from '../../../lib/socialAuth.mjs';

export async function GET(request) {
  const url = new URL(request.url);
  const next = safeAuthNext(url.searchParams.get('next'), url.origin);
  const code = url.searchParams.get('code');
  if (code && !url.searchParams.has('error')) {
    try {
      const client = createClient(cookies());
      if (client) {
        const { data, error } = await client.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
          // Authentication succeeded even if the optional audit write fails.
          try { await client.rpc('record_auth_event', { event_type: 'LOGIN' }); } catch { /* Optional audit only. */ }
          const response = NextResponse.redirect(new URL(next, url.origin));
          response.headers.set('Cache-Control', 'no-store');
          return response;
        }
      }
    } catch { /* Never include provider codes, tokens or raw errors in the URL. */ }
  }
  const response = NextResponse.redirect(new URL('/auth/error', url.origin));
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
