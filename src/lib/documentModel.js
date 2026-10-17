const columns = {
  companyId: 'company_id', hierarchyLevel: 'hierarchy_level', clauseNumber: 'clause_number',
  expiryDate: 'expiry_date', dDay: 'd_day', penaltyRisk: 'penalty_risk', contentDraft: 'content_draft', fileUrl: 'file_url',
};

export function fromDocumentRow(row) {
  const doc = { ...row.metadata, id: row.id, code: row.code, title: row.title, status: row.status, summary: row.summary, checklist: row.checklist || [] };
  for (const [field, column] of Object.entries(columns)) doc[field] = row[column];
  doc.standards = row.metadata?.standards || [row.certification_code];
  doc.lastModified = row.updated_at;
  return doc;
}

export function toDocumentRow(doc) {
  const row = {
    id: doc.id, code: doc.code || '', title: doc.title, status: doc.status || 'READY',
    summary: doc.summary || '', checklist: doc.checklist || [],
    certification_code: doc.standards?.[0] || 'ISO_9001', metadata: { ...doc },
  };
  delete row.metadata.id;
  delete row.metadata.companyId;
  for (const [field, column] of Object.entries(columns)) row[column] = doc[field] ?? null;
  row.hierarchy_level ||= 'LEVEL_2';
  row.updated_at = new Date().toISOString();
  return row;
}

// Codes identify documents within a company, never across companies.
export function mergeImportedDocuments(existing, incoming, companyId, makeId = () => crypto.randomUUID()) {
  const merged = new Map(existing.filter(doc => doc.companyId === companyId).map(doc => [doc.code, doc]));
  for (const doc of incoming) {
    const previous = merged.get(doc.code);
    merged.set(doc.code, { ...previous, ...doc, standards: doc.standards || [doc.certificationCode || 'ISO_9001'], id: previous?.id || makeId(), companyId });
  }
  return [...merged.values()];
}
