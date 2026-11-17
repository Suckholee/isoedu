// Canvas "top" is a font baseline, not a guarantee that all glyph ink is below
// y. Color emoji can have positive ascent; some fallback glyphs have negative
// ascent. Use the same box for measurement and painting at page/cell breaks.
export function topBaselineInk(metrics) {
  const ascent=metrics.actualBoundingBoxAscent,descent=metrics.actualBoundingBoxDescent;
  if(!Number.isFinite(ascent)||!Number.isFinite(descent))return {offset:0,height:0};
  const offset=Math.max(0,ascent);
  return {offset,height:Math.max(0,offset+descent)};
}
