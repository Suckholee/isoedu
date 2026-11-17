import {
  FONT_LANGUAGES,
  validFontFaceOrder
} from "./chunk-jk4tbr51.js";
import {
  CHARACTER_EFFECTS
} from "./chunk-6ffsr0y9.js";

// js/font-metadata-wire.mjs
var metadataKeys = (row, names) => row !== null && typeof row === "object" && !Array.isArray(row) && Object.keys(row).length === names.length && names.every((name) => Object.hasOwn(row, name));
var metadataText = (value) => value === null || typeof value === "string" && value.isWellFormed() && new TextEncoder().encode(value).length <= 4096;
function decodeMetadataWire(bytes, errorName) {
  const fail = () => {
    throw new Error(errorName);
  };
  if (!(bytes instanceof Uint8Array))
    return fail();
  let wire;
  try {
    wire = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  if (!metadataKeys(wire, ["version", "fonts"]) || wire.version !== 1 || !Array.isArray(wire.fonts) || wire.fonts.length > 1e6 || !validFontFaceOrder(wire.fonts))
    return fail();
  return wire.fonts;
}

// js/character-font-metrics.mjs
var fields = ["ratio", "spacing", "relativeSize", "offset"];
function decodeCharacterFontMetrics(bytes, format) {
  const fail = () => {
    throw new Error("InvalidCharacterFontMetrics");
  };
  let wire;
  try {
    if (!(bytes instanceof Uint8Array))
      return fail();
    wire = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  if (!metadataKeys(wire, ["version", "format", "shapes"]) || wire.version !== 1 || wire.format !== format || !["hwp5", "hwpx"].includes(format) || !Array.isArray(wire.shapes) || wire.shapes.length > 1e5)
    return fail();
  let previous = -1;
  for (const row of wire.shapes) {
    if (!metadataKeys(row, ["id", "values"]) || !Number.isInteger(row.id) || row.id < 0 || row.id > 4294967295 || row.id <= previous || !metadataKeys(row.values, fields))
      return fail();
    previous = row.id;
    for (const key of fields) {
      const values = row.values[key];
      if (values === null && format === "hwpx")
        continue;
      if (!Array.isArray(values) || values.length !== 7)
        return fail();
      const signed = key === "spacing" || key === "offset";
      const lower = format === "hwpx" ? -2147483648 : signed ? -128 : 0;
      const upper = format === "hwpx" ? 2147483647 : signed ? 127 : 255;
      if (values.some((value) => !(value === null && format === "hwpx") && (!Number.isInteger(value) || value < lower || value > upper)))
        return fail();
    }
  }
  return wire.shapes;
}

// js/character-snapshot-json.mjs
function decodeCharacterSnapshot(bytes, keys, errorName) {
  const fail = () => {
    throw new Error(errorName);
  };
  if (!(bytes instanceof Uint8Array))
    return fail();
  let rows;
  try {
    rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  if (!Array.isArray(rows) || rows.length > 1e6)
    return fail();
  let previous = -1;
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row) || Object.keys(row).length !== keys.length || keys.some((key) => !Object.hasOwn(row, key)) || !Number.isInteger(row.id) || row.id <= previous || row.id > 4294967295)
      return fail();
    previous = row.id;
  }
  return rows;
}

// js/character-effects.mjs
function decodeCharacterEffects(bytes) {
  const flags = CHARACTER_EFFECTS;
  const rows = decodeCharacterSnapshot(bytes, ["id", ...flags], "InvalidCharacterEffects");
  if (rows.some((row) => flags.some((flag) => typeof row[flag] !== "boolean")))
    throw new Error("InvalidCharacterEffects");
  return rows;
}

// js/character-outlines.mjs
function decodeCharacterOutlines(bytes) {
  const rows = decodeCharacterSnapshot(bytes, ["id", "state", "rawKind"], "InvalidCharacterOutlines");
  for (const row of rows) {
    if (!["absent", "none", "solid", "other", "unknown"].includes(row.state))
      throw new Error("InvalidCharacterOutlines");
    if (row.rawKind !== null) {
      if (!Number.isInteger(row.rawKind) || row.rawKind < 0 || row.rawKind > 7 || row.state !== (row.rawKind === 0 ? "none" : row.rawKind === 1 ? "solid" : row.rawKind === 7 ? "unknown" : "other"))
        throw new Error("InvalidCharacterOutlines");
    } else if (row.state === "other")
      throw new Error("InvalidCharacterOutlines");
  }
  return rows;
}

// js/character-shades.mjs
function decodeCharacterShades(bytes) {
  const rows = decodeCharacterSnapshot(bytes, ["id", "state", "color"], "InvalidCharacterShades");
  for (const row of rows) {
    if (!["absent", "none", "color", "unknown"].includes(row.state) || (row.state === "color" ? !Number.isInteger(row.color) || row.color < 0 || row.color > 16777215 : row.color !== null))
      throw new Error("InvalidCharacterShades");
  }
  return rows;
}

// js/character-underlines.mjs
function decodeCharacterUnderlines(bytes) {
  const rows = decodeCharacterSnapshot(bytes, ["id", "kind"], "InvalidCharacterUnderlines");
  for (const row of rows) {
    if (![null, "none", "bottom", "center", "top"].includes(row.kind))
      throw new Error("InvalidCharacterUnderlines");
  }
  return rows;
}

// js/character-strikes.mjs
function decodeCharacterStrikes(bytes) {
  const rows = decodeCharacterSnapshot(bytes, ["id", "enabled"], "InvalidCharacterStrikes");
  for (const row of rows)
    if (row.enabled !== null && typeof row.enabled !== "boolean")
      throw new Error("InvalidCharacterStrikes");
  return rows;
}

// js/character-strike-styles.mjs
function decodeCharacterStrikeStyles(bytes) {
  const rows = decodeCharacterSnapshot(bytes, ["id", "raw_style", "raw_color", "shape", "color"], "InvalidCharacterStrikeStyles");
  const text = (value) => value === null || typeof value === "string" && new TextEncoder().encode(value).length <= 4096;
  const color = (value) => value === null || Number.isInteger(value) && value >= 0 && value <= 4294967295;
  for (const row of rows) {
    if (row.raw_style !== null ? !Number.isInteger(row.raw_style) || row.raw_style < 0 || row.raw_style > 15 || !color(row.raw_color) || row.shape !== null || row.color !== null : row.raw_color !== null || !text(row.shape) || !text(row.color))
      throw new Error("InvalidCharacterStrikeStyles");
  }
  return rows;
}

// js/character-text-colors.mjs
function decodeCharacterTextColors(bytes) {
  const rows = decodeCharacterSnapshot(bytes, ["id", "color"], "InvalidCharacterTextColors");
  for (const row of rows) {
    if (row.color !== null && (!Number.isInteger(row.color) || row.color < 0 || row.color > 16777215)) {
      throw new Error("InvalidCharacterTextColors");
    }
  }
  return rows;
}

// js/character-font-references.mjs
function decodeCharacterFontReferences(bytes) {
  const rows = decodeCharacterSnapshot(bytes, ["id", "fontIds"], "InvalidCharacterFontReferences");
  for (const row of rows) {
    if (row.fontIds !== null && (!Array.isArray(row.fontIds) || row.fontIds.length !== FONT_LANGUAGES.length || row.fontIds.some((id) => id !== null && (!Number.isInteger(id) || id < 0 || id > 4294967295))))
      throw new Error("InvalidCharacterFontReferences");
  }
  return rows;
}

// js/character-underline-styles.mjs
function decodeCharacterUnderlineStyles(bytes) {
  const rows = decodeCharacterSnapshot(bytes, ["id", "raw_style", "raw_color", "shape", "color"], "InvalidCharacterUnderlineStyles");
  const text = (value) => value === null || typeof value === "string" && new TextEncoder().encode(value).length <= 4096;
  for (const row of rows) {
    const raw = row.raw_style !== null;
    if (raw && (!Number.isInteger(row.raw_style) || row.raw_style < 0 || row.raw_style > 15 || !Number.isInteger(row.raw_color) || row.raw_color < 0 || row.raw_color > 4294967295 || row.shape !== null || row.color !== null) || !raw && (row.raw_color !== null || !text(row.shape) || !text(row.color)))
      throw new Error("InvalidCharacterUnderlineStyles");
  }
  return rows;
}

// js/table-bindings-wire.mjs
function decodeTableBindings(bytes) {
  const fail = () => {
    throw new Error("InvalidTableBindings");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length < 8)
    return fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = view.getUint32(0, true), optional = magic === 827872328;
  if (!optional && magic !== 826430536)
    return fail();
  const stride = optional ? 48 : 44;
  const count = view.getUint32(4, true);
  if (count > 1e5 || bytes.length !== 8 + count * stride)
    return fail();
  let previous = -1;
  return Array.from({ length: count }, (_, index) => {
    const row = {};
    for (const [column, field] of [
      "paragraph",
      "tableNode",
      "listNode",
      "rows",
      "columns",
      "row",
      "column",
      "rowSpan",
      "columnSpan",
      "width",
      "height"
    ].entries())
      row[field] = view.getUint32(8 + index * stride + column * 4, true);
    if (optional) {
      const flags = view.getUint32(8 + index * stride + 44, true);
      if (flags & ~3 || !(flags & 1) && row.width !== 0 || !(flags & 2) && row.height !== 0 || row.paragraph === 0)
        return fail();
      if (!(flags & 1))
        row.width = null;
      if (!(flags & 2))
        row.height = null;
    }
    if (row.paragraph <= previous || !row.rows || !row.columns || !row.rowSpan || !row.columnSpan || row.row >= row.rows || row.column >= row.columns || row.rowSpan > row.rows - row.row || row.columnSpan > row.columns - row.column)
      return fail();
    previous = row.paragraph;
    return row;
  });
}

// js/table-placements-wire.mjs
function decodeTablePlacements(bytes, format = "hwpx") {
  const fail = () => {
    throw new Error("InvalidTablePlacements");
  };
  if (!["hwp5", "hwpx"].includes(format) || !(bytes instanceof Uint8Array) || bytes.length < 8)
    return fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), count = view.getUint32(4, true);
  const magic = view.getUint32(0, true), hasAnchor = format === "hwpx" && magic === 844125256, stride = hasAnchor ? 28 : 20;
  if (!hasAnchor && magic !== (format === "hwp5" ? 894456904 : 827348040) || count > 1e5 || bytes.length !== 8 + count * stride)
    return fail();
  const seen = new Set;
  const rows = Array.from({ length: count }, (_, index) => {
    const at = 8 + index * stride, values = Array.from({ length: 5 }, (_, column) => view.getUint32(at + column * 4, true));
    const [tableNode, paragraph, parentTable, parentList, flags] = values;
    if (format === "hwpx" && !paragraph || flags > 1 || seen.has(tableNode) || !flags && (parentTable || parentList) || flags && parentTable === tableNode)
      return fail();
    seen.add(tableNode);
    const anchorUnit = hasAnchor ? view.getUint32(at + 20, true) : 0, anchorPresent = hasAnchor ? view.getUint32(at + 24, true) : 0;
    if (anchorPresent > 1 || !anchorPresent && anchorUnit !== 0)
      return fail();
    return {
      tableNode,
      paragraph,
      parentTableNode: flags ? parentTable : null,
      parentListNode: flags ? parentList : null,
      ...hasAnchor ? { anchorUnit: anchorPresent ? anchorUnit : null } : {}
    };
  });
  const byNode = new Map(rows.map((row) => [row.tableNode, row])), checked = new Set;
  for (const row of rows) {
    let node = row;
    const path = new Set;
    while (node && !checked.has(node.tableNode)) {
      if (path.has(node.tableNode))
        return fail();
      path.add(node.tableNode);
      if (node.parentTableNode === null)
        break;
      node = byNode.get(node.parentTableNode);
      if (!node)
        return fail();
    }
    for (const node of path)
      checked.add(node);
  }
  return rows;
}

// js/character-shapes-wire.mjs
function decodeCharacterShapes(bytes) {
  const fail = () => {
    throw new Error("InvalidCharacterShapes");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length < 8)
    return fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 827540296)
    return fail();
  const count = view.getUint32(4, true);
  if (count > 1e6 || bytes.length !== 8 + count * 12)
    return fail();
  let previous = -1;
  return Array.from({ length: count }, (_, index) => {
    const offset = 8 + index * 12, id = view.getUint32(offset, true), rawHeight = view.getInt32(offset + 4, true), flags = view.getUint32(offset + 8, true);
    if (id <= previous || flags > 7 || !(flags & 1) && rawHeight !== 0)
      return fail();
    previous = id;
    return {
      id,
      height: flags & 1 ? rawHeight : null,
      bold: Boolean(flags & 2),
      italic: Boolean(flags & 4)
    };
  });
}
function decodeCharacterRanges(bytes) {
  const fail = () => {
    throw new Error("InvalidCharacterRanges");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length < 8)
    return fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 827474760)
    return fail();
  const count = view.getUint32(4, true);
  if (count > 1e6 || bytes.length !== 8 + count * 16)
    return fail();
  let cursor = 0;
  return Array.from({ length: count }, (_, index) => {
    const offset = 8 + index * 16, start = view.getUint32(offset, true), end = view.getUint32(offset + 4, true), id = view.getUint32(offset + 8, true), flags = view.getUint32(offset + 12, true);
    if (start !== cursor || end < start || flags > 1 || flags === 0 && id !== 0)
      return fail();
    cursor = end;
    return { start, end, charShapeId: flags ? id : null };
  });
}

export { metadataKeys, metadataText, decodeMetadataWire, decodeCharacterFontMetrics, decodeCharacterEffects, decodeCharacterOutlines, decodeCharacterShades, decodeCharacterUnderlines, decodeCharacterStrikes, decodeCharacterStrikeStyles, decodeCharacterTextColors, decodeCharacterFontReferences, decodeCharacterUnderlineStyles, decodeCharacterShapes, decodeCharacterRanges, decodeTableBindings, decodeTablePlacements };
