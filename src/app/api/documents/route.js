import { NextResponse } from 'next/server';
import { SEED_DOCUMENTS } from '../../../lib/mockData';
import { supabase, isSupabaseConfigured } from '../../../lib/supabaseClient';

export async function GET(request) {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return NextResponse.json({ success: true, data });
      }
    }
    return NextResponse.json({ success: true, data: SEED_DOCUMENTS });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .insert([body])
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
    return NextResponse.json({ success: true, message: 'Document saved to demo state', data: body });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
