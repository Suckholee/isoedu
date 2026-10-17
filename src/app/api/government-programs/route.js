import { readFile } from 'node:fs/promises';
import path from 'node:path';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET() {
 try {
  const records=JSON.parse(await readFile(path.join(process.cwd(),'data/government-programs/records.json'),'utf8'));
  if(!Array.isArray(records))throw new Error('Invalid records');
  await Promise.all(records.map(async record => {
   if (!/^[a-z0-9-]+$/.test(record.id)) return;
   try {
    const analysis = JSON.parse(await readFile(path.join(process.cwd(),'data/government-programs/analyses',`${record.id}.json`),'utf8'));
    if (analysis.programId === record.id) record.analysis = analysis;
   } catch { /* Missing analysis stays explicitly unreviewed. */ }
  }));
  return Response.json({programs:records,coverage:'K-Startup·중기부 공개 목록 1페이지 우선 수집. 전체 공고 수집 아님.',lastChecked:records.map(p=>p.verifiedAt).filter(Boolean).sort().at(-1)||null},{headers:{'Cache-Control':'no-store'}});
 } catch {return Response.json({error:'수집된 공고를 불러오지 못했습니다.'},{status:503});}
}
