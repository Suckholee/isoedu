import {
  metadataKeys,
  metadataText,
  decodeMetadataWire
} from "./chunk-gx7k5hbb.js";
import {
  countedPointLayoutArg
} from "./chunk-x8k5ryaa.js";

// js/hwp5-drawing-line-endpoints.mjs
function validateHwp5DrawingLineEndpoints(rows) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const pair = (value, valid) => Array.isArray(value) && value.length === 2 && Array.from(value).every((point) => Array.isArray(point) && point.length === 2 && Array.from(point).every(valid));
  const components = new Set, lines = new Set;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5DrawingLineEndpoints");
  for (const row of rows) {
    if (!row || ![row.component_node, row.owner_node, row.line_node, row.attributes, row.extra_bytes].every(uint) || row.owner_node >= row.component_node || row.component_node >= row.line_node || row.attributes > 65535 || typeof row.extra_nonzero !== "boolean" || row.extra_bytes === 0 && row.extra_nonzero || !pair(row.points, Number.isFinite) || !pair(row.raw_points, (value) => Number.isInteger(value) && value >= -2147483648 && value <= 2147483647) || components.has(row.component_node) || lines.has(row.line_node))
      throw new Error("InvalidHwp5DrawingLineEndpoints");
    components.add(row.component_node);
    lines.add(row.line_node);
  }
  return rows;
}
function decodeHwp5DrawingLineEndpoints(bytes) {
  return validateHwp5DrawingLineEndpoints(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-note-shape-sources.mjs
function validateHwp5NoteShapeSources(rows) {
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  if (!Array.isArray(rows) || rows.length !== 2)
    throw new Error("InvalidHwp5NoteShapeSources");
  for (const [index, row] of rows.entries()) {
    if (!row || row.kind !== ["footnote", "endnote"][index] || !["source_node", "owner_node", "flags", "color", "extra_bytes"].every((key) => integer(row[key], 0, 4294967295)) || row.owner_node >= row.source_node || !["user_char", "prefix", "suffix", "start_number"].every((key) => integer(row[key], 0, 65535)) || !integer(row.separator_length, -2147483648, 2147483647) || !["above", "below", "between"].every((key) => integer(row[key], -32768, 32767)) || !["line_type", "line_width"].every((key) => integer(row[key], 0, 255)) || typeof row.extra_nonzero !== "boolean" || row.extra_bytes === 0 && row.extra_nonzero)
      throw new Error("InvalidHwp5NoteShapeSources");
  }
  if (rows[0].owner_node !== rows[1].owner_node || rows[0].source_node >= rows[1].source_node)
    throw new Error("InvalidHwp5NoteShapeSources");
  return rows;
}
function decodeHwp5NoteShapeSources(bytes) {
  return validateHwp5NoteShapeSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-caption-sources.mjs
function validateHwp5CaptionSources(rows) {
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5CaptionSources");
  const lists = new Set, owners = new Map;
  for (const row of rows) {
    if (!row || ![
      "control_node",
      "table_record_node",
      "list_node",
      "attributes",
      "flags",
      "width",
      "max_text_width",
      "extra_bytes"
    ].every((key) => integer(row[key], 0, 4294967295)) || !(row.control_node < row.list_node && row.list_node < row.table_record_node) || !integer(row.paragraph_count, 0, 65535) || row.unknown !== null && !integer(row.unknown, 0, 65535) || !integer(row.gap, -32768, 32767) || typeof row.extra_nonzero !== "boolean" || row.extra_bytes === 0 && row.extra_nonzero || lists.has(row.list_node) || owners.has(row.control_node) && owners.get(row.control_node) !== row.table_record_node)
      throw new Error("InvalidHwp5CaptionSources");
    lists.add(row.list_node);
    owners.set(row.control_node, row.table_record_node);
  }
  return rows;
}
function decodeHwp5CaptionSources(bytes) {
  return validateHwp5CaptionSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-drawing-anchors.mjs
function validateHwp5DrawingAnchors(rows) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5DrawingAnchors");
  const controls = new Set, components = new Set;
  for (const row of rows) {
    if (!row || !["control_node", "component_node", "paragraph", "source_unit", "current_unit"].every((key) => uint(row[key])) || row.control_node >= row.component_node || row.source_unit > 4294967287 || row.current_unit > 4294967287 || controls.has(row.control_node) || components.has(row.component_node))
      throw new Error("InvalidHwp5DrawingAnchors");
    controls.add(row.control_node);
    components.add(row.component_node);
  }
  return rows;
}
function decodeHwp5DrawingAnchors(bytes) {
  return validateHwp5DrawingAnchors(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-drawing-matrix-sources.mjs
function validateHwp5DrawingMatrixSources(rows) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5DrawingMatrixSources");
  const seen = new Set;
  let current;
  for (const row of rows) {
    if (!row || !uint(row.component_node) || !uint(row.owner_node) || row.owner_node >= row.component_node || !["translation", "scale", "rotation"].includes(row.kind) || !Array.isArray(row.bits) || row.bits.length !== 6 || !Array.from(row.bits).every((pair) => Array.isArray(pair) && pair.length === 2 && Array.from(pair).every(uint)))
      throw new Error("InvalidHwp5DrawingMatrixSources");
    if (!current || current.node !== row.component_node) {
      if (current?.next === "rotation" || seen.has(row.component_node) || row.kind !== "translation" || row.pair !== null)
        throw new Error("InvalidHwp5DrawingMatrixSources");
      seen.add(row.component_node);
      current = { node: row.component_node, owner: row.owner_node, next: "scale", ordinal: 0 };
    } else {
      if (row.owner_node !== current.owner || row.kind !== current.next || row.pair !== current.ordinal || !uint(row.pair) || row.pair >= 65535)
        throw new Error("InvalidHwp5DrawingMatrixSources");
      if (row.kind === "rotation") {
        current.next = "scale";
        current.ordinal++;
      } else
        current.next = "rotation";
    }
  }
  if (current?.next === "rotation")
    throw new Error("InvalidHwp5DrawingMatrixSources");
  return rows;
}
function decodeHwp5DrawingMatrixSources(bytes) {
  return validateHwp5DrawingMatrixSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-drawing-curve-points.mjs
var curveLayoutArg = (layout) => countedPointLayoutArg(layout, "InvalidCurvePointLayout");
function validateHwp5DrawingCurvePoints(rows) {
  const uint = (v) => Number.isInteger(v) && v >= 0 && v <= 4294967295;
  const signed = (v) => Number.isInteger(v) && v >= -2147483648 && v <= 2147483647;
  const fail = () => {
    throw new Error("InvalidHwp5DrawingCurvePoints");
  };
  if (!Array.isArray(rows) || rows.length > 1e6)
    fail();
  const owners = new Set;
  for (const [i, r] of rows.entries()) {
    if (!r || !uint(r.component_node) || !uint(r.curve_node) || r.component_node >= r.curve_node || owners.has(r.component_node) || i > 0 && r.curve_node <= rows[i - 1].curve_node || !uint(r.extra_bytes) || !Array.isArray(r.raw_points) || r.raw_points.length > 1e6 || !Array.from(r.raw_points).every((p) => Array.isArray(p) && p.length === 2 && Array.from(p).every(signed)) || !Array.isArray(r.segments) || r.segments.length !== Math.max(0, r.raw_points.length - 1) || !Array.from(r.segments).every((v) => uint(v) && v <= 255))
      fail();
    owners.add(r.component_node);
  }
  return rows;
}
function decodeHwp5DrawingCurvePoints(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length > 64 * 1024 * 1024)
    throw new Error("InvalidHwp5DrawingCurvePoints");
  return validateHwp5DrawingCurvePoints(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-automatic-number-sources.mjs
function validateHwp5AutomaticNumberSources(rows) {
  const uint = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5AutomaticNumberSources");
  const seen = new Set, positions = new Set;
  for (const row of rows) {
    if (!row || ![
      "control_node",
      "paragraph",
      "source_unit",
      "current_unit",
      "attributes",
      "extra_bytes"
    ].every((key) => uint(row[key], 4294967295)) || row.source_unit > 4294967287 || row.current_unit > 4294967287 || !["number", "symbol", "prefix", "suffix"].every((key) => uint(row[key], 65535)) || row.kind !== (row.attributes & 15) || row.shape !== (row.attributes >>> 4 & 255) || row.superscript !== Boolean(row.attributes & 4096) || typeof row.extra_nonzero !== "boolean" || row.extra_bytes === 0 && row.extra_nonzero || seen.has(row.control_node))
      throw new Error("InvalidHwp5AutomaticNumberSources");
    const position = `${row.paragraph}:${row.current_unit}`;
    if (positions.has(position))
      throw new Error("InvalidHwp5AutomaticNumberSources");
    seen.add(row.control_node);
    positions.add(position);
  }
  return rows;
}
function decodeHwp5AutomaticNumberSources(bytes) {
  return validateHwp5AutomaticNumberSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/font-face-metadata.mjs
function decodeFontFaceMetadata(bytes) {
  const fail = () => {
    throw new Error("InvalidFontFaceMetadata");
  };
  const rows = decodeMetadataWire(bytes, "InvalidFontFaceMetadata");
  for (const row of rows) {
    if (!metadataKeys(row, ["language", "id", "attributes", "substitute", "typeInfo", "defaultName"]))
      return fail();
    if (!Number.isInteger(row.attributes) || row.attributes < 0 || row.attributes > 255)
      return fail();
    if (row.attributes & 128) {
      if (!metadataKeys(row.substitute, ["kind", "name"]) || !Number.isInteger(row.substitute.kind) || row.substitute.kind < 0 || row.substitute.kind > 255 || !metadataText(row.substitute.name))
        return fail();
    } else if (row.substitute !== null)
      return fail();
    if (row.attributes & 64) {
      if (!Array.isArray(row.typeInfo) || row.typeInfo.length !== 10 || row.typeInfo.some((value) => !Number.isInteger(value) || value < 0 || value > 255))
        return fail();
    } else if (row.typeInfo !== null)
      return fail();
    if (!metadataText(row.defaultName) || !(row.attributes & 32) && row.defaultName !== null)
      return fail();
  }
  return rows;
}

export { validateHwp5AutomaticNumberSources, decodeHwp5AutomaticNumberSources, validateHwp5NoteShapeSources, decodeHwp5NoteShapeSources, validateHwp5CaptionSources, decodeHwp5CaptionSources, validateHwp5DrawingAnchors, decodeHwp5DrawingAnchors, validateHwp5DrawingMatrixSources, decodeHwp5DrawingMatrixSources, curveLayoutArg, validateHwp5DrawingCurvePoints, decodeHwp5DrawingCurvePoints, validateHwp5DrawingLineEndpoints, decodeHwp5DrawingLineEndpoints, decodeFontFaceMetadata };
