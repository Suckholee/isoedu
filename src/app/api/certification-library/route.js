import { cookies } from 'next/headers';
import { createClient } from '../../../utils/supabase/server';
import { certificationGuides } from '../../../lib/certification-library/catalog.mjs';

export const dynamic = 'force-dynamic';

function reply(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function GET() {
  try {
    const client = createClient(cookies());
    if (!client) return reply({ error: '회원 인증 서비스에 연결할 수 없습니다.' }, 503);
    const { data, error } = await client.auth.getUser();
    if (error && error.name !== 'AuthSessionMissingError' && ![401, 403].includes(error.status)) {
      return reply({ error: '로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.' }, 503);
    }
    if (error || !data?.user) return reply({ error: '로그인 후 자료를 열람할 수 있습니다.' }, 401);
    return reply({ guides: certificationGuides });
  } catch {
    return reply({ error: '인증 자료를 불러오지 못했습니다. 다시 시도해 주세요.' }, 503);
  }
}
