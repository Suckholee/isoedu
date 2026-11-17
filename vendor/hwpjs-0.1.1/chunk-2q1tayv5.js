import {
  sourceTextChange
} from "./chunk-jk4tbr51.js";

// web/preview/paragraph-selection.mjs
function paragraphSelectionEdge(anchor, focus, end = false) {
  if (!anchor || !focus || anchor.section !== focus.section)
    return null;
  const forward = anchor.paragraph < focus.paragraph || anchor.paragraph === focus.paragraph && anchor.unit <= focus.unit;
  return end === forward ? focus : anchor;
}
function paragraphSelectionOwner(paragraph) {
  const cell = paragraph?.tableCell;
  const drawing = paragraph?.drawingText ?? paragraph?.drawingCaption;
  if (cell && drawing || paragraph?.drawingText && paragraph?.drawingCaption)
    return null;
  if (drawing) {
    if (![paragraph.section, drawing.drawingNode, drawing.listNode].every((value) => Number.isInteger(value) && value >= 0 && value <= 4294967295))
      return null;
    const kind = paragraph.drawingText ? "text" : "caption";
    return `section:${paragraph.section}:drawing:${drawing.drawingNode}:${kind}:list:${drawing.listNode}`;
  }
  if (cell) {
    if (![paragraph.section, cell.tableNode, cell.listNode].every((value) => Number.isInteger(value) && value >= 0))
      return null;
    return `section:${paragraph.section}:table:${cell.tableNode}:list:${cell.listNode}`;
  }
  return paragraph?.selectionOwner ?? null;
}
function paragraphSelectionRanges(paragraphs, anchor, focus, ownerOf = paragraphSelectionOwner, { sourcePositions = true, includeEmpty = false } = {}) {
  if (!anchor || !focus || anchor.section !== focus.section || typeof ownerOf !== "function" || !Array.isArray(paragraphs))
    return null;
  const identities = new Set;
  for (const paragraph of paragraphs) {
    if (!paragraph || !Number.isSafeInteger(paragraph.section) || paragraph.section < 0 || !Number.isSafeInteger(paragraph.paragraph) || paragraph.paragraph < 0 || typeof paragraph.text !== "string")
      return null;
    const identity = `${paragraph.section}:${paragraph.paragraph}`;
    if (identities.has(identity))
      return null;
    identities.add(identity);
  }
  const find = (point) => paragraphs.findIndex((row) => row.section === point.section && row.paragraph === point.paragraph);
  const ai = find(anchor), fi = find(focus);
  if (ai < 0 || fi < 0)
    return null;
  const backward = ai > fi || ai === fi && anchor.unit > focus.unit;
  const start = backward ? focus : anchor, end = backward ? anchor : focus;
  const low = Math.min(ai, fi), high = Math.max(ai, fi);
  const owner = ownerOf(paragraphs[low]);
  if (owner === null || owner === undefined)
    return null;
  const ranges = [];
  for (let i = low;i <= high; i++) {
    const row = paragraphs[i];
    if (row.section !== start.section || row.clipped || ownerOf(row) !== owner)
      return null;
    const from = i === low ? start.unit : 0, to = i === high ? end.unit : row.text.length;
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < from || to > row.text.length)
      return null;
    const boundary = (unit) => unit === 0 || unit === row.text.length || !(row.text.charCodeAt(unit - 1) >= 55296 && row.text.charCodeAt(unit - 1) <= 56319 && row.text.charCodeAt(unit) >= 56320 && row.text.charCodeAt(unit) <= 57343);
    if (!boundary(from) || !boundary(to))
      return null;
    if (from === to && !includeEmpty)
      continue;
    const mapped = sourcePositions ? sourceTextChange({ startUnit: from, endUnit: to, text: "" }, row.sourceOffsets) : { startUnit: from, endUnit: to };
    ranges.push({
      section: row.section,
      paragraph: row.paragraph,
      startUnit: mapped.startUnit,
      endUnit: mapped.endUnit
    });
  }
  return ranges;
}
function paragraphSelectionText(paragraphs, anchor, focus, ownerOf = paragraphSelectionOwner) {
  const ranges = paragraphSelectionRanges(paragraphs, anchor, focus, ownerOf, {
    sourcePositions: false,
    includeEmpty: true
  });
  if (ranges === null)
    return null;
  const text = new Map(paragraphs.map((row) => [`${row.section}:${row.paragraph}`, row.text]));
  return ranges.map((range) => text.get(`${range.section}:${range.paragraph}`).slice(range.startUnit, range.endUnit)).join(`
`);
}

// web/preview/observation-structure.mjs
var uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
function observationRows(rows) {
  if (!Array.isArray(rows))
    return null;
  const map = new Map;
  for (const row of rows) {
    if (!row || typeof row !== "object" || !uint(row.id) || map.has(row.id))
      return null;
    map.set(row.id, row);
  }
  return map;
}
function observationSpans(paragraph) {
  const spans = paragraph?.characterRanges;
  if (typeof paragraph?.text !== "string" || !Array.isArray(spans))
    return null;
  let previous = 0;
  for (const span of spans) {
    if (!span || !Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start < previous || span.start < 0 || span.start > span.end || span.end > paragraph.text.length)
      return null;
    previous = span.end;
  }
  return spans;
}

// web/preview/text-input.mjs
var segments;
var words;
function createSegmenter(granularity) {
  const Segmenter = globalThis.Intl?.Segmenter;
  if (typeof Segmenter !== "function")
    throw Error("IntlSegmenterUnavailable");
  return new Segmenter("ko", { granularity });
}
var splitScalar = (text, unit) => unit > 0 && unit < text.length && /[\uD800-\uDBFF]/u.test(text[unit - 1]) && /[\uDC00-\uDFFF]/u.test(text[unit]);
function textChange(before, after, selection = null) {
  if (before === after)
    return null;
  let first = selection?.startUnit, last = selection?.endUnit;
  if (Number.isInteger(first) && Number.isInteger(last) && first >= 0 && first <= last && last <= before.length) {
    if (first === last && after.length < before.length) {
      const removed = before.length - after.length;
      if (selection.inputType === "deleteContentBackward")
        first -= removed;
      else if (selection.inputType === "deleteContentForward")
        last += removed;
    }
    const inserted = after.length - (before.length - (last - first)), end = first + inserted;
    if (first >= 0 && last <= before.length && inserted >= 0 && !splitScalar(before, first) && !splitScalar(before, last) && !splitScalar(after, first) && !splitScalar(after, end) && before.slice(0, first) === after.slice(0, first) && before.slice(last) === after.slice(end)) {
      return { startUnit: first, endUnit: last, text: after.slice(first, end) };
    }
  }
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start])
    start++;
  while (splitScalar(before, start) || splitScalar(after, start))
    start--;
  let oldEnd = before.length, newEnd = after.length;
  while (oldEnd > start && newEnd > start && before[oldEnd - 1] === after[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }
  if (splitScalar(before, oldEnd) || splitScalar(after, newEnd)) {
    oldEnd++;
    newEnd++;
  }
  return { startUnit: start, endUnit: oldEnd, text: after.slice(start, newEnd) };
}
function graphemeUnits(text) {
  return [...(segments ??= createSegmenter("grapheme")).segment(text)].map((s) => s.index).concat(text.length);
}
function wordBoundary(text, unit, forward) {
  let previous = 0;
  for (const part of (words ??= createSegmenter("word")).segment(text)) {
    if (!part.isWordLike)
      continue;
    if (forward && part.index > unit)
      return part.index;
    if (!forward && part.index >= unit)
      break;
    previous = part.index;
  }
  return forward ? text.length : previous;
}
function snapUnit(text, unit, forward = false) {
  const bounds = graphemeUnits(text);
  return forward ? bounds.find((b) => b >= unit) ?? text.length : bounds.filter((b) => b <= unit).at(-1) ?? 0;
}

// web/preview/character-range-values.mjs
var graphemeBoundary = (text, unit, end = false) => snapUnit(text, unit, end) === unit;
function characterRangeValues(content, ranges, valueAt, { isBoundary = graphemeBoundary } = {}, paragraphAt = undefined) {
  if (!Array.isArray(content?.paragraphs) || content.paragraphs.some((row) => !row || typeof row !== "object") || !Array.isArray(ranges) || !ranges.length)
    return null;
  const values = [];
  for (const range of ranges) {
    if (!range)
      return null;
    const paragraph = typeof paragraphAt === "function" ? paragraphAt(range.section, range.paragraph) : content.paragraphs.find((row) => row.section === range.section && row.paragraph === range.paragraph);
    const { startUnit: start, endUnit: end } = range;
    if (!paragraph || paragraph.clipped || typeof paragraph.text !== "string" || !Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || end > paragraph.text.length || !isBoundary(paragraph.text, start) || !isBoundary(paragraph.text, end, true))
      return null;
    const spans = observationSpans(paragraph);
    if (!spans)
      return null;
    let cursor = start;
    for (const span of spans) {
      if (!span || !Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start < 0 || span.start > span.end || span.end > paragraph.text.length || !isBoundary(paragraph.text, span.start) || !isBoundary(paragraph.text, span.end, true))
        return null;
      const low = Math.max(start, span.start), high = Math.min(end, span.end);
      if (low >= high)
        continue;
      if (!uint(span.charShapeId))
        return null;
      const value = valueAt(span.charShapeId);
      if (low !== cursor || value === null || value === undefined)
        return null;
      values.push(value);
      cursor = high;
    }
    if (cursor !== end)
      return null;
  }
  return values.length ? values : null;
}

// web/preview/utf16-boundary.mjs
function isUtf16Boundary(text, unit) {
  if (typeof text !== "string" || !Number.isSafeInteger(unit) || unit < 0 || unit > text.length)
    return false;
  const previous = text.charCodeAt(unit - 1), current = text.charCodeAt(unit);
  return !(previous >= 55296 && previous <= 56319 && current >= 56320 && current <= 57343);
}

// web/preview/character-size-selection.mjs
var isSourceCharacterSize = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
function characterSizeState(content, paragraph, start, end, { isBoundary = (text, unit, last = false) => snapUnit(text, unit, last) === unit } = {}) {
  if (content?.characterPropertiesAvailable !== true || typeof paragraph?.text !== "string" || paragraph.clipped || !Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start >= end || end > paragraph.text.length || !isBoundary(paragraph.text, start) || !isBoundary(paragraph.text, end, true))
    return null;
  const shapes = observationRows(content.characterShapes);
  const spans = observationSpans(paragraph);
  if (!shapes || !spans)
    return null;
  let cursor = start, size, mixed = false;
  for (const span of spans) {
    const low = Math.max(start, span.start), high = Math.min(end, span.end);
    if (low >= high)
      continue;
    if (!uint(span.charShapeId))
      return null;
    const current = shapes.get(span.charShapeId)?.height;
    if (low !== cursor || !isSourceCharacterSize(current))
      return null;
    if (size === undefined)
      size = current;
    else if (size !== current)
      mixed = true;
    cursor = high;
  }
  return cursor === end && size !== undefined ? mixed ? "mixed" : size : null;
}
function characterSizeRangesState(content, ranges) {
  if (!Array.isArray(ranges) || !ranges.length || !Array.isArray(content?.paragraphs) || content.paragraphs.some((row) => !row || typeof row !== "object") || ranges.some((range) => !range))
    return null;
  let size;
  for (const range of ranges) {
    const row = content.paragraphs.find((paragraph) => paragraph.section === range.section && paragraph.paragraph === range.paragraph);
    const state = characterSizeState(content, row, range.startUnit, range.endUnit);
    if (state === null)
      return null;
    if (size === undefined)
      size = state;
    else if (size !== state)
      size = "mixed";
  }
  return size;
}

// web/preview/character-property-selection.mjs
function characterPropertyResourceValue(property, shape, underline, strike) {
  if (property === "strike")
    return strike?.enabled;
  if (property === "underline") {
    const kind = underline?.kind;
    return ["none", "bottom", "center", "top"].includes(kind) ? kind !== "none" : null;
  }
  return shape?.[property];
}
function characterSelectionState(content, paragraph, start, end, property) {
  const underline = property === "underline";
  const strike = property === "strike";
  if (typeof paragraph?.text !== "string" || (strike ? content?.characterStrikeAvailable : underline ? content?.characterUnderlineAvailable : content?.characterPropertiesAvailable) !== true || !["bold", "italic", "underline", "strike"].includes(property) || paragraph?.clipped || !Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start >= end || end > paragraph?.text?.length)
    return null;
  const spans = observationSpans(paragraph);
  const shapes = underline || strike ? null : observationRows(content.characterShapes);
  const underlines = underline ? observationRows(content.characterUnderlines) : null;
  const strikes = strike ? observationRows(content.characterStrikes) : null;
  if (!spans || !(strike ? strikes : underline ? underlines : shapes))
    return null;
  let cursor = start, allEnabled = true, anyEnabled = false;
  for (const span of spans) {
    const low = Math.max(start, span.start), high = Math.min(end, span.end);
    if (low >= high)
      continue;
    if (!uint(span.charShapeId))
      return null;
    const shape = shapes?.get(span.charShapeId);
    const enabled = characterPropertyResourceValue(property, shape, underlines?.get(span.charShapeId), strikes?.get(span.charShapeId));
    if (low !== cursor || typeof enabled !== "boolean")
      return null;
    allEnabled &&= enabled;
    anyEnabled ||= enabled;
    cursor = high;
  }
  return cursor === end ? allEnabled ? true : anyEnabled ? "mixed" : false : null;
}
function characterTogglePatch(content, paragraph, start, end, property) {
  const state = characterSelectionState(content, paragraph, start, end, property);
  return state === null ? null : { [property]: state !== true };
}
function characterRangesState(content, ranges, property) {
  if (!Array.isArray(ranges) || !ranges.length || !Array.isArray(content?.paragraphs) || content.paragraphs.some((row) => !row || typeof row !== "object") || ranges.some((range) => !range))
    return null;
  const states = ranges.map((range) => characterSelectionState(content, content.paragraphs.find((row) => row.section === range.section && row.paragraph === range.paragraph), range.startUnit, range.endUnit, property));
  if (states.some((state) => state === null))
    return null;
  if (states.every((state) => state === true))
    return true;
  return states.every((state) => state === false) ? false : "mixed";
}

export { paragraphSelectionEdge, paragraphSelectionOwner, paragraphSelectionRanges, paragraphSelectionText, uint, observationRows, textChange, graphemeUnits, wordBoundary, snapUnit, characterRangeValues, isUtf16Boundary, isSourceCharacterSize, characterSizeState, characterSizeRangesState, characterPropertyResourceValue, characterSelectionState, characterTogglePatch, characterRangesState };
