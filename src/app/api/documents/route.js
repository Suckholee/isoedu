import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '../../../utils/supabase/server.js';
import { createDocumentRepository } from '../../../lib/documentRepository.js';
import { fromDocumentRow, toDocumentRow } from '../../../lib/documentModel.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function authenticated() {
  const client = createClient(cookies());
  if (!client) return { response: NextResponse.json({ success: false, error: 'Supabase is not configured.' }, { status: 503 }) };
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { response: NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 }) };
  return { client };
}

export async function GET(request) {
  try {
    const { client, response } = await authenticated();
    if (response) return response;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    if (!uuid.test(companyId || '')) return NextResponse.json({ success: false, error: 'A valid companyId is required.' }, { status: 400 });
    const repo = createDocumentRepository({ mode: 'cloud', client });
    let data = await repo.list(companyId);
    const standard = searchParams.get('standard');
    if (standard) data = data.filter(doc => doc.standards.includes(standard));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { client, response } = await authenticated();
    if (response) return response;
    let body;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON.' }, { status: 400 }); }
    if (!body || Array.isArray(body) || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200
      || !uuid.test(body.companyId || '') || (body.code != null && typeof body.code !== 'string')
      || (body.standards != null && (!Array.isArray(body.standards) || !body.standards.every(item => typeof item === 'string')))
      || (body.hierarchyLevel && !['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'CERT'].includes(body.hierarchyLevel))) {
      return NextResponse.json({ success: false, error: 'Invalid document payload (title, companyId, standards, hierarchyLevel).' }, { status: 400 });
    }
    const document = { ...body, id: crypto.randomUUID(), title: body.title.trim() };
    const { data, error } = await client.from('documents').insert(toDocumentRow(document)).select().single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data: fromDocumentRow(data) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
