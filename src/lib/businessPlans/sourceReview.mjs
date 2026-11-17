import {sourceVisualSignature} from './sourceVisuals.mjs';
export function sourceReviewKey(row) {
  const analysis = row.metadata?.sourceAnalysis;
  return JSON.stringify([row.metadata?.sourceUpload?.fingerprint,
    (analysis?.units || []).map(unit => [unit.id, unit.textHash, unit.outputPath]),
    ...(row.metadata?.sourceVision?.key ? [row.metadata.sourceVision.key] : [])]);
}

export function hasCurrentSourceReview(row) {
  return row.metadata?.sourceUpload?.state === 'ready' &&
    (row.metadata?.sourceAnalysis?.state === 'ready' || row.metadata?.sourceVision?.prepared === true) &&
    Boolean(row.content_draft?.trim()) &&
    (row.metadata.sourceReview?.visualSignature||'[]')===sourceVisualSignature(row) &&
    row.metadata?.sourceReview?.reviewedContent === row.content_draft &&
    row.metadata?.sourceReview?.analysisKey === sourceReviewKey(row);
}

export function reviewDraftText(source, units) {
  return [`${source.title} · 분석 기반 보완본`,
    '원문 전체를 복제한 문서가 아닙니다. 아래 분석과 원본을 대조하고 사실·계획·확인 필요를 구분해 보완하세요.',
    ...units.map(({unit, result}) => [
      `[${source.title} · ${unit.location}]`, result.companyMatch==='different'?'[확인 필요: 자료의 회사명이 다릅니다. 대상 회사의 실적으로 사용하지 마세요.]':'', result.summary,
      ...(result.fields || []).map(field => `${field.certainty === 'uncertain' ? '[확인 필요]' : field.certainty === 'plan' ? '[계획안]' : '[원문 근거]'} ${field.value}\n근거: ${field.evidence}`),
      ...(result.tables || []).map(table => `${table.title} (단위: ${table.unit || '확인 필요'})\n${table.columns.join(' | ')}\n${table.rows.map(row => row.join(' | ')).join('\n')}\n${table.notes || ''}`),
      ...(result.charts || []).map(chart => `${chart.title}\n${chart.xAxis} / ${chart.yAxis}\n${chart.series.map(series => `${series.name}: ${series.points.map(point => `${point.label} ${point.value} ${point.unit}`).join(', ')}`).join('\n')}\n${chart.interpretation}\n${chart.uncertainties.map(text => '[확인 필요] ' + text).join('\n')}`),
      ...(result.warnings || []).map(text => '[확인 필요] ' + text),
    ].filter(Boolean).join('\n\n')),
  ].join('\n\n');
}
