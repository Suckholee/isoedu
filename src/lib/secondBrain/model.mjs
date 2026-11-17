export const KINDS = { note: '메모', meeting: '회의 기록', knowledge: '지식·가이드', link: '참고 링크' };

export const REFERENCES = [
  { title: 'BizManager · 원본과 양식으로 문서 작성', source_url: 'https://bizmanager.it/?kakao=1', tags: ['문서 작성'], body: '원본 자료와 작성 양식을 함께 활용하는 흐름을 참고합니다. 공개 화면 확인: 2026-11-15.' },
  { title: 'ZUZU · 사업계획서 AI 피드백', source_url: 'https://zuzu.network/resource/guide/businessplan-ai-feedback-service/', tags: ['사업계획서'], body: '공유된 작성·평가 참고 링크입니다. 현재 서비스 내용은 원문에서 확인해 주세요.' },
  { title: 'MakeDeck · 사업계획서 작성 참고', source_url: 'https://www.nextunicorn.kr/insight/94f7b8b89c3e2404', tags: ['사업계획서'], body: '공유된 작성 서비스 참고 링크입니다. 현재 서비스 내용은 원문에서 확인해 주세요.' },
  { title: 'Bizketch · 사업계획서 생성 참고', source_url: 'https://eopla.net/magazines/40959', tags: ['사업계획서'], body: '공유된 작성 서비스 참고 링크입니다. 현재 서비스 내용은 원문에서 확인해 주세요.' },
  { title: '아이노유 AI · 사업기획 참고', source_url: 'https://eopla.net/magazines/31111', tags: ['사업계획서'], body: '공유된 서비스 소개·후기 링크입니다. 현재 서비스 내용은 원문에서 확인해 주세요.' },
  { title: 'PrometAI · 사업계획 생성·평가 참고', source_url: 'https://aipure.ai/kr/products/prometai', tags: ['사업계획서'], body: '공유된 서비스 소개 링크입니다. 현재 서비스 내용은 원문에서 확인해 주세요.' },
];

export function cleanRecord(input, { companyId, projects = [], documents = [] }) {
  if (!companyId || input.company_id !== companyId) throw Error('현재 회사의 기록만 저장할 수 있습니다.');
  const text = (key, max) => {
    if (typeof input[key] !== 'string' || input[key].length > max) throw Error('입력 내용과 길이를 확인해 주세요.');
    return input[key].trim();
  };
  const title = text('title', 200), body = text('body', 50000), source_url = text('source_url', 2000);
  if (!title || !Object.hasOwn(KINDS, input.kind)) throw Error('제목과 기록 종류를 확인해 주세요.');
  if (source_url) {
    let url;
    try { url = new URL(source_url); } catch { throw Error('원문은 https 또는 http 주소로 입력해 주세요.'); }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw Error('원문은 로그인 정보가 없는 https 또는 http 주소로 입력해 주세요.');
  }
  if (input.kind === 'link' && !source_url) throw Error('참고 링크의 원문 주소를 입력해 주세요.');
  const event_date = input.event_date || null;
  if (event_date && (!/^\d{4}-\d{2}-\d{2}$/.test(event_date) || !Number.isFinite(Date.parse(event_date)) || new Date(event_date).toISOString().slice(0, 10) !== event_date)) throw Error('실제 기록 날짜를 확인해 주세요.');
  const project_id = input.project_id || null, document_id = input.document_id || null;
  if (project_id && !projects.some(p => p.id === project_id && (p.companyId || p.company_id) === companyId)) throw Error('현재 회사의 프로젝트만 연결할 수 있습니다.');
  if (document_id && !documents.some(d => d.id === document_id && (d.companyId || d.company_id) === companyId)) throw Error('현재 회사의 문서만 연결할 수 있습니다.');
  if (!Array.isArray(input.tags) || input.tags.length > 12 || input.tags.some(t => typeof t !== 'string' || t.length > 40)) throw Error('주제는 40자 이내로 최대 12개 입력해 주세요.');
  return { company_id: companyId, title, body, kind: input.kind, source_url, event_date, project_id, document_id,
    tags: [...new Set(input.tags.map(t => t.trim()).filter(Boolean))], pinned: input.pinned === true, archived: input.archived === true };
}

export function findRecords(records, { query = '', kind = '', view = 'all', tag = '', project = '' } = {}) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return records.filter(r => (view === 'archive' ? r.archived : !r.archived) && (view !== 'pinned' || r.pinned)
    && (!kind || r.kind === kind) && (!tag || r.tags.includes(tag)) && (!project || r.project_id === project)
    && terms.every(t => [r.title, r.body, r.source_url, r.event_date, ...r.tags, ...(r.analysis?.summary||[]), ...(r.analysis?.concepts||[]).map(c=>c.label)].join(' ').toLocaleLowerCase().includes(t)))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at));
}

export function recordText(record) {
  return [`# ${record.title}`, record.event_date ? `기록 날짜: ${record.event_date}` : '', `종류: ${KINDS[record.kind]}`, `주제: ${record.tags.join(', ')}`, record.source_url ? `원문: ${record.source_url}` : '', '', ...(record.analysis?.summary||[]), record.body].filter((line, i) => line || i === 5).join('\n');
}

export function newRecord(companyId, seed = {}) {
  return { id: crypto.randomUUID(), revision: 0, company_id: companyId, title: '', body: '', kind: 'note', source_url: '', tags: [], event_date: '', project_id: '', document_id: '', pinned: false, archived: false, ...seed };
}
