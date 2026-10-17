import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
const root = new URL('../data/government-programs/', import.meta.url);
const records = JSON.parse(await readFile(new URL('records.json', root), 'utf8'));
const at = new Date().toISOString();
for (const record of records) {
  try {
    const response = await fetch(record.sourceUrl, { signal: AbortSignal.timeout(25000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    if (!html.includes(record.sourceId)) throw new Error('Announcement identity not present');
    const dir = new URL(`evidence/${record.id}/`, root);
    await mkdir(dir, { recursive: true });
    await writeFile(new URL('detail.html', dir), html);
    const links = [...new Set([...html.matchAll(/href="([^"]*(?:\/common\/board\/Download\.do\?|\/afile\/fileDownload\/)[^"]+)"/g)].map(m => new URL(m[1].replaceAll('&amp;', '&'), record.sourceUrl).href))];
    record.detailReview = { fetchedAt: at, status: '본문 확보·내용 분석 대기', evidence: `evidence/${record.id}/detail.html`, attachmentUrls: links };
    await appendFile(new URL('runs.jsonl', root), JSON.stringify({at, id:record.id, stage:'detail-fetch', status:'partial-success', attachments:links.length, coverage:'HTML captured; attachment content analysis tracked separately'})+'\n');
    console.log(record.id, links.length, 'attachment links');
  } catch (error) {
    await appendFile(new URL('runs.jsonl', root), JSON.stringify({at,id:record.id,stage:'detail-fetch',status:'failed',error:error.message})+'\n');
    console.error(record.id, error.message);
  }
}
await writeFile(new URL('records.json', root), JSON.stringify(records, null, 2)+'\n');
