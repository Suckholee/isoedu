import {
  characterPropertyArgs
} from "./chunk-bnqtzsr8.js";
import {
  isSourceCharacterSize
} from "./chunk-2q1tayv5.js";

// js/hwp5-structural-edit-boundary.mjs
var uint32 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
function hwp5StructuralEditableStart(row) {
  if (!row || !uint32(row.section) || !uint32(row.paragraph) || row.selectionOwner !== `section:${row.section}:body` || row.clipped || row.tableCell || row.drawingText || row.drawingCaption || row.createdCell || row.textSourcePolicyError != null || typeof row.text !== "string" || row.text.charCodeAt(0) !== 65532 || row.text.charCodeAt(1) !== 65532)
    return 0;
  const ref = row.currentReference;
  if (!ref || ref.kind !== "original" || ref.section !== row.section || typeof ref.id !== "string" || ref.id.length === 0 || typeof ref.epoch !== "string" || ref.epoch.length === 0 || ref.row !== 0 || ref.column !== 0 || typeof ref.scope !== "string" || ref.scope.length === 0)
    return 0;
  const { sourceOffsets: offsets, structuralAnchors: anchors } = row;
  if (!Array.isArray(offsets) || offsets.length < 3 || !Array.isArray(anchors) || anchors.length !== 2)
    return 0;
  for (let i = 0;i < 3; i++)
    if (offsets[i]?.at !== i || offsets[i]?.source !== i * 8)
      return 0;
  for (let i = 0;i < 2; i++) {
    const anchor = anchors[i];
    if (anchor?.kind !== (i === 0 ? "section" : "column") || anchor.paragraph !== row.paragraph || anchor.source_unit !== i * 8 || anchor.current_unit !== i * 8 || anchor.unit !== i || !uint32(anchor.control_node))
      return 0;
  }
  return anchors[0].control_node !== anchors[1].control_node ? 2 : 0;
}

// web/preview/character-typing-properties.mjs
function scalarStart(text, unit) {
  const previous = text.charCodeAt(unit - 1), current = text.charCodeAt(unit);
  return previous >= 55296 && previous <= 56319 && current >= 56320 && current <= 57343 ? unit - 1 : unit;
}
function typingSourceSpan(text, unit) {
  if (typeof text !== "string" || !text.length || !Number.isInteger(unit) || unit < 0 || unit > text.length)
    return null;
  const at = scalarStart(text, unit);
  return {
    start: at > 0 ? scalarStart(text, at - 1) : 0,
    end: at > 0 ? at : text.codePointAt(0) > 65535 ? 2 : 1
  };
}
function mergeTypingProperties(previous, requested) {
  characterPropertyArgs(requested);
  const patch = Object.fromEntries(Object.entries(requested).filter(([, value]) => value !== null));
  return { ...previous, ...patch };
}
function characterTypingState(text, unit, property, properties, read) {
  if (!["bold", "italic"].includes(property) || typeof text !== "string" || !Number.isInteger(unit) || unit < 0 || unit > text.length)
    return null;
  if (typeof properties?.[property] === "boolean")
    return properties[property];
  if (text.length === 0)
    return false;
  const { start, end } = typingSourceSpan(text, unit);
  const state = read(start, end, property);
  return typeof state === "boolean" ? state : null;
}
function characterTypingSize(text, unit, properties, read) {
  if (typeof text !== "string" || !Number.isInteger(unit) || unit < 0 || unit > text.length)
    return null;
  if (properties?.size !== undefined && properties.size !== null) {
    try {
      characterPropertyArgs({ size: properties.size });
      return properties.size;
    } catch {
      return null;
    }
  }
  if (!text.length)
    return null;
  const { start, end } = typingSourceSpan(text, unit);
  const state = read(start, end);
  return isSourceCharacterSize(state) ? state : null;
}

export { hwp5StructuralEditableStart, typingSourceSpan, mergeTypingProperties, characterTypingState, characterTypingSize };
