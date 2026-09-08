import { NextResponse } from 'next/server';
import { DEMO_SCENARIOS } from '../../../lib/mockData';

export async function POST(request) {
  try {
    const { message } = await request.json();

    const query = (message || '').toLowerCase();
    let matched = DEMO_SCENARIOS[0];

    if (query.includes('saas') || query.includes('보안') || query.includes('it') || query.includes('27001')) {
      matched = DEMO_SCENARIOS[1];
    } else if (query.includes('식품') || query.includes('haccp') || query.includes('위생') || query.includes('22000')) {
      matched = DEMO_SCENARIOS[2];
    } else if (query.includes('만기') || query.includes('과태료') || query.includes('갱신')) {
      matched = DEMO_SCENARIOS[3];
    }

    return NextResponse.json({
      success: true,
      analysis: matched.responseAnalysis,
      recommendedDocs: matched.recommendedDocs,
      scenarioTag: matched.tag
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
