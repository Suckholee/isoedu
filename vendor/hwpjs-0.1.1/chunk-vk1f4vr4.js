import {
  paragraphMarginArgs,
  validateAvailableSectionCopyOption,
  decodeAvailableSectionCopyInfo,
  characterUnderlineArg
} from "./chunk-c8kv1wt8.js";
import {
  cellBorderStyleCode,
  validateCellBorder,
  encodeCellBorders,
  encodeCellDiagonals,
  encodeCellBorderPatches,
  validateCellFills,
  encodeCellFills,
  validateCellStyles,
  createAtomicFormattingApi,
  EXPERIMENTAL_EDITOR_FUNCTIONS,
  validateAbi,
  encodeCellSizes,
  validateCellBackground,
  validateCellAppearance,
  textTransactionArgs,
  namedFontTextArgs,
  createMemory,
  inputBytes,
  createHistoryApi,
  createParagraphBreakApi,
  validateCreatedTables,
  decodeTableCreationResources,
  captureTableTextRequest,
  captureTableInitialTexts,
  encodeTableTextRequest
} from "./chunk-d6j1r7hv.js";
import {
  characterEffectMode,
  characterEffectArgs,
  hwp5CharacterOutlineArg
} from "./chunk-6ffsr0y9.js";
import {
  decodeFontFaces,
  paragraphSpacingArgs,
  characterColorArg,
  picturePrefixArg,
  decodeHwp5PictureSources
} from "./chunk-jk4tbr51.js";
import {
  decodeHwp5StructuralAnchors,
  decodeHwp5PageAreaSources,
  decodeHwp5MasterPageSources,
  decodeHwp5DocumentProperties,
  decodeHwp5PageControlSources,
  decodeHwp5NoteSources,
  decodeHwp5FormSources,
  decodeHwp5FormAnchors,
  decodeHwp5FormProperties,
  decodeHwp5DrawingSources,
  decodeHwp5DrawingComponentSources,
  decodeHwp5DrawingListSources,
  decodeHwp5DrawingLocalTransforms,
  decodeHwp5DrawingRectangleCorners,
  polygonLayoutArg,
  decodeHwp5DrawingPolygonPoints,
  drawingStyleLayoutArgs,
  decodeHwp5DrawingStyleSources,
  pictureTailLayoutArg,
  decodeHwp5PictureTailSources,
  decodeHwp5PageSettings,
  decodeHwp5TableLayoutSources
} from "./chunk-x8k5ryaa.js";
import {
  encodeCharacterRanges,
  encodeParagraphReplacement,
  characterShadeArgs
} from "./chunk-vq9qdwke.js";
import {
  characterFontArgs,
  characterFontNameArgs,
  characterPropertyArgs
} from "./chunk-bnqtzsr8.js";
import {
  decodeHwp5AutomaticNumberSources,
  decodeHwp5NoteShapeSources,
  decodeHwp5CaptionSources,
  decodeHwp5DrawingAnchors,
  decodeHwp5DrawingMatrixSources,
  curveLayoutArg,
  decodeHwp5DrawingCurvePoints,
  decodeHwp5DrawingLineEndpoints,
  decodeFontFaceMetadata
} from "./chunk-rmgwrdxt.js";
import {
  decodeCharacterFontMetrics,
  decodeCharacterEffects,
  decodeCharacterOutlines,
  decodeCharacterShades,
  decodeCharacterUnderlines,
  decodeCharacterStrikes,
  decodeCharacterStrikeStyles,
  decodeCharacterTextColors,
  decodeCharacterFontReferences,
  decodeCharacterUnderlineStyles,
  decodeCharacterShapes,
  decodeCharacterRanges,
  decodeTableBindings,
  decodeTablePlacements
} from "./chunk-gx7k5hbb.js";

// js/hwp5-text-wire.mjs
var decoder = new TextDecoder("utf-16le", { fatal: true, ignoreBOM: true });
function decodeHwp5Text(bytes, { allowGenerated = false } = {}) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  function word() {
    if (offset + 4 > bytes.length)
      throw new Error("InvalidHwp5TextWire");
    const value = view.getUint32(offset, true);
    offset += 4;
    return value;
  }
  function raw(length) {
    if (length > bytes.length - offset)
      throw new Error("InvalidHwp5TextWire");
    const result = bytes.slice(offset, offset + length);
    offset += length;
    return result;
  }
  if (new TextDecoder().decode(raw(4)) !== "H5T1")
    throw new Error("InvalidHwp5TextWire");
  const versionRaw = word();
  const sectionCount = word();
  if (sectionCount > 1024)
    throw new Error("InvalidHwp5TextWire");
  const sections = [];
  for (let s = 0;s < sectionCount; s++) {
    const index = word();
    const paragraphCount = word();
    if (index !== s || paragraphCount > bytes.length / 20)
      throw new Error("InvalidHwp5TextWire");
    const paragraphs = [];
    for (let p = 0;p < paragraphCount; p++) {
      const nodeRaw = word();
      const nodeIndex = allowGenerated && nodeRaw === 4294967295 ? null : nodeRaw;
      const parentRaw = word();
      const declaredUnits = word();
      const present = word();
      if (present > 1)
        throw new Error("InvalidHwp5TextWire");
      const tokenCount = word();
      if (tokenCount > bytes.length / 12)
        throw new Error("InvalidHwp5TextWire");
      const tokens = [];
      const textParts = [];
      for (let t = 0;t < tokenCount; t++) {
        const kind = word();
        const startUnit = word();
        const data = raw(word());
        if (kind === 0) {
          if (data.length % 2)
            throw new Error("InvalidHwp5TextWire");
          const value = decoder.decode(data);
          textParts.push(value);
          tokens.push({ type: "text", startUnit, text: value, raw: data });
        } else if (kind === 1 && (data.length === 2 || data.length === 16)) {
          const code = data[0] | data[1] << 8;
          tokens.push({ type: "control", startUnit, code, raw: data });
        } else
          throw new Error("InvalidHwp5TextWire");
      }
      if (!present && tokenCount)
        throw new Error("InvalidHwp5TextWire");
      paragraphs.push({
        nodeIndex,
        parentNodeIndex: parentRaw === 4294967295 ? null : parentRaw,
        declaredUnits,
        textPresent: Boolean(present),
        text: textParts.join(""),
        tokens
      });
    }
    sections.push({ index, paragraphs });
  }
  if (offset !== bytes.length)
    throw new Error("InvalidHwp5TextWire");
  return {
    version: [
      versionRaw >>> 24,
      versionRaw >>> 16 & 255,
      versionRaw >>> 8 & 255,
      versionRaw & 255
    ],
    sections
  };
}

// js/hwp5-text-source-protection.mjs
function validateHwp5TextSourceProtection(value, count) {
  const fail = () => {
    throw new Error("InvalidHwp5TextSourceProtection");
  };
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!uint(count) || !value || !Array.isArray(value.protected_paragraphs) || value.protected_paragraphs.length !== count)
    fail();
  let any = false;
  for (const bit of value.protected_paragraphs) {
    if (typeof bit !== "boolean")
      fail();
    any ||= bit;
  }
  if (value.mode === "strict") {
    if (value.retained_headers !== null || any)
      fail();
  } else if (value.mode === "retained_click" || value.mode === "retained_memo") {
    if (!uint(value.retained_headers) || value.retained_headers === 0 || !any)
      fail();
  } else
    fail();
  return {
    mode: value.mode,
    protected_paragraphs: value.protected_paragraphs,
    retained_headers: value.retained_headers
  };
}
function decodeHwp5TextSourceProtection(bytes, count) {
  return validateHwp5TextSourceProtection(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)), count);
}

// js/hwp5-drawing-object-extras.mjs
function decodeHwp5DrawingObjectExtras(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!Array.isArray(rows) || rows.length > 1e6)
    throw new Error("InvalidHwp5DrawingObjectExtras");
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  let previous = -1;
  for (const row of rows) {
    if (!row || ![row.control_node, row.paragraph_node, row.extra_bytes].every(uint) || row.paragraph_node >= row.control_node || row.control_node <= previous || typeof row.extra_hex !== "string" || row.extra_hex.length !== row.extra_bytes * 2 || !/^[0-9a-f]*$/.test(row.extra_hex))
      throw new Error("InvalidHwp5DrawingObjectExtras");
    previous = row.control_node;
  }
  return rows;
}

// js/paragraph-shapes-wire.mjs
function decodeParagraphShapes(bytes) {
  const fail = () => {
    throw new Error("InvalidParagraphShapes");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length < 8)
    return fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(4, true);
  const magic = view.getUint32(0, true);
  const stride = magic === 827543624 ? 48 : magic === 844320840 ? 72 : 0;
  if (!stride || count > 1e5 || bytes.length !== 8 + count * stride)
    return fail();
  return Array.from({ length: count }, (_, index) => {
    const at = 8 + index * stride, uint = (offset) => view.getUint32(at + offset, true), int = (offset) => view.getInt32(at + offset, true);
    if (uint(0) !== index || uint(4) > 7 || uint(28) > 3 || uint(36) > 1 || !uint(36) && (uint(40) !== 0 || int(44) !== 0))
      return fail();
    const shape = {
      id: index,
      alignment: uint(4),
      left: int(8),
      right: int(12),
      indent: int(16),
      before: int(20),
      after: int(24),
      legacySpacingKind: uint(28),
      legacySpacing: int(32),
      modernSpacing: uint(36) ? { attributes: uint(40), value: int(44) } : null
    };
    if (stride === 72) {
      if (uint(48) > 3 || uint(52) > 65535 || uint(56) > 7 || uint(60) > 1 || !uint(60) && uint(64) !== 0 || uint(68) !== (uint(60) ? uint(64) : uint(56)))
        return fail();
      Object.assign(shape, {
        headingKind: uint(48),
        headingId: uint(52),
        packedHeadingLevel: uint(56),
        extendedHeadingLevel: uint(60) ? uint(64) : null,
        headingLevel: uint(68)
      });
    }
    return shape;
  });
}

// js/hwp5-section-settings.mjs
function decodeHwp5SectionSettings(bytes) {
  const row = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const uint = (value, max = 4294967295) => Number.isInteger(value) && value >= 0 && value <= max;
  if (!row || !["source_node", "flags", "tab_spacing", "extra_bytes"].every((key) => uint(row[key])) || !["column_gap", "vertical_grid", "horizontal_grid"].every((key) => Number.isInteger(row[key]) && row[key] >= -32768 && row[key] <= 32767) || !["numbering_id", "page_start", "picture_start", "table_start", "equation_start"].every((key) => uint(row[key], 65535)) || !(row.language === null || uint(row.language, 65535)) || typeof row.extra_nonzero !== "boolean" || row.extra_bytes === 0 && row.extra_nonzero)
    throw new Error("InvalidHwp5SectionSettings");
  if (Object.hasOwn(row, "extra_raw") && (!Array.isArray(row.extra_raw) || row.extra_raw.length !== row.extra_bytes || !Array.from(row.extra_raw).every((byte) => uint(byte, 255)) || row.extra_raw.some((byte) => byte !== 0) !== row.extra_nonzero))
    throw new Error("InvalidHwp5SectionSettings");
  if (Object.hasOwn(row, "memo_shape_count") && row.memo_shape_count !== null && !uint(row.memo_shape_count))
    throw new Error("InvalidHwp5SectionSettings");
  if (Object.hasOwn(row, "memo_list_count") && !uint(row.memo_list_count))
    throw new Error("InvalidHwp5SectionSettings");
  if (Object.hasOwn(row, "observed_extension") && row.observed_extension !== null) {
    const extension = row.observed_extension;
    if (!extension || typeof extension !== "object" || Array.isArray(extension) || row.language === null || row.extra_bytes !== 17 || !Array.isArray(row.extra_raw))
      throw new Error("InvalidHwp5SectionSettings");
    const view = new DataView(Uint8Array.from(row.extra_raw).buffer);
    for (const [key, offset, method] of [
      ["leading_count_raw", 0, "getUint32"],
      ["memo_shape_id_ref", 4, "getUint16"],
      ["flags_raw", 6, "getUint16"],
      ["line_number_restart_raw", 8, "getUint8"],
      ["line_number_count_by", 9, "getUint16"],
      ["line_number_distance_raw", 11, "getUint32"],
      ["line_number_start", 15, "getUint16"]
    ]) {
      if (extension[key] !== view[method](offset, true))
        throw new Error("InvalidHwp5SectionSettings");
    }
    const direction = extension.flags_raw >>> 1 & 7;
    const hasDirection = [
      "text_direction_raw",
      "text_direction",
      "text_vertical_width_head",
      "unknown_flags"
    ].some((key) => Object.hasOwn(extension, key));
    if (hasDirection && (extension.text_direction_raw !== direction || extension.text_direction !== (["HORIZONTAL", "VERTICAL", "VERTICALALL"][direction] ?? null) || extension.text_vertical_width_head !== Boolean(extension.flags_raw & 16) || extension.unknown_flags !== (extension.flags_raw & 65505)))
      throw new Error("InvalidHwp5SectionSettings");
    if (!Array.isArray(extension.trailing_raw) || extension.trailing_raw.length !== 11 || Array.from(extension.trailing_raw).some((byte, index) => byte !== row.extra_raw[index + 6]))
      throw new Error("InvalidHwp5SectionSettings");
  }
  return row;
}

// js/hwp5-cell-layout-sources.mjs
function decodeHwp5CellLayoutSources(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const uint = (value, max = 4294967295) => Number.isInteger(value) && value >= 0 && value <= max;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5CellLayoutSources");
  const lists = new Set;
  for (const row of rows) {
    if (!row || !["table_record_node", "list_node", "attributes", "extra_bytes"].every((key) => uint(row[key])) || !uint(row.border_fill_id, 65535) || !(row.unknown === null || uint(row.unknown, 65535)) || !Array.isArray(row.margins) || row.margins.length !== 4 || !row.margins.every((value) => Number.isInteger(value) && value >= -32768 && value <= 32767) || row.text_direction !== (row.attributes & 7) || row.line_wrap !== (row.attributes >>> 3 & 3) || row.vertical_alignment !== (row.attributes >>> 5 & 3))
      throw new Error("InvalidHwp5CellLayoutSources");
    for (const [field, bit] of [
      ["has_margin", 16],
      ["protected", 17],
      ["header", 18],
      ["editable", 19]
    ])
      if (row[field] !== Boolean(row.attributes & 1 << bit))
        throw new Error("InvalidHwp5CellLayoutSources");
    if (lists.has(row.list_node))
      throw new Error("InvalidHwp5CellLayoutSources");
    lists.add(row.list_node);
  }
  return rows;
}

// js/hwp5-border-fill-sources.mjs
function decodeHwp5BorderFillSources(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length > 64 * 1024 * 1024)
    throw new Error("InvalidHwp5BorderFillSources");
  return validateHwp5BorderFillSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}
function validateHwp5BorderFillSources(rows) {
  const integer = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  const uint = (v) => integer(v, 0, 4294967295), byte = (v) => integer(v, 0, 255), signed = (v) => integer(v, -2147483648, 2147483647);
  const optional = (v, check) => v === null || check(v), fail = () => {
    throw new Error("InvalidHwp5BorderFillSources");
  };
  if (!Array.isArray(rows) || rows.length > 1e6)
    fail();
  for (const [i, r] of rows.entries()) {
    if (!r || r.id !== i + 1 || !uint(r.record_index) || r.record_index < i || i > 0 && r.record_index <= rows[i - 1].record_index || !integer(r.attributes, 0, 65535) || !Array.isArray(r.borders) || r.borders.length !== 5 || !Array.from(r.borders).every((b) => b && byte(b.kind) && byte(b.width) && uint(b.color)) || !uint(r.fill_flags) || typeof r.fill_known !== "boolean" || r.fill_known !== ((r.fill_flags & ~7) === 0))
      fail();
    if (!r.fill_known) {
      if (!uint(r.unknown_fill_bytes) || [
        r.pattern,
        r.gradient,
        r.image,
        r.alpha,
        r.additional_present,
        r.additional_bytes,
        r.extra_bytes
      ].some((v) => v !== null))
        fail();
      continue;
    }
    if (r.unknown_fill_bytes !== null || typeof r.additional_present !== "boolean" || !uint(r.additional_bytes) || !uint(r.extra_bytes) || !r.additional_present && (r.additional_bytes !== 0 || r.fill_flags > 1) || r.pattern !== null !== !!(r.fill_flags & 1) || r.gradient !== null !== !!(r.fill_flags & 4) || r.image !== null !== !!(r.fill_flags & 2))
      fail();
    const { pattern: p, gradient: g, image } = r;
    if (p !== null && (!p || !uint(p.background) || !uint(p.foreground) || !signed(p.kind)))
      fail();
    if (g !== null && (!g || !byte(g.kind) || !["angle", "center_x", "center_y", "blur"].every((k) => uint(g[k])) || !optional(g.blur_center, byte) || !Array.isArray(g.colors) || g.colors.length > 1e6 || !Array.from(g.colors).every(uint) || !Array.isArray(g.positions) || g.positions.length !== (g.colors.length > 2 ? g.colors.length : 0) || !Array.from(g.positions).every(signed)))
      fail();
    if (g !== null && g.blur_center !== null !== (r.additional_bytes === 1))
      fail();
    if (image !== null && (!image || !byte(image.mode) || !image.picture || !integer(image.picture.contrast, -128, 127) || !integer(image.picture.brightness, -128, 127) || !byte(image.picture.effect) || !integer(image.picture.bin_data_id, 0, 65535)))
      fail();
    if (r.alpha !== null && (!r.alpha || r.extra_bytes !== 0 || r.fill_flags === 0 || ![
      ["pattern", 1],
      ["gradient", 4],
      ["image", 2]
    ].every(([k, flag]) => r.fill_flags & flag ? byte(r.alpha[k]) : r.alpha[k] === null)))
      fail();
  }
  return rows;
}

// js/hwp5-table-anchors.mjs
function decodeHwp5TableAnchors(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5TableAnchors");
  const seen = new Set;
  for (const row of rows) {
    if (!row || !["table_record_node", "control_node", "paragraph", "source_unit", "current_unit"].every((key) => uint(row[key])) || row.control_node >= row.table_record_node || row.source_unit > 4294967287 || row.current_unit > 4294967287 || seen.has(row.table_record_node))
      throw new Error("InvalidHwp5TableAnchors");
    seen.add(row.table_record_node);
  }
  return rows;
}

// js/hwp5-flow-sources.mjs
var uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var parse = (bytes) => JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
function decodeHwp5ParagraphFlow(bytes) {
  const rows = parse(bytes);
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5ParagraphFlow");
  for (const [index, row] of rows.entries()) {
    if (row?.empty_line_eligible !== undefined && (typeof row.empty_line_eligible !== "boolean" || row.empty_line_eligible && row.top_level !== true))
      throw new Error("InvalidHwp5ParagraphFlow");
    if (row && (Object.hasOwn(row, "memo_index") || Object.hasOwn(row, "memo_node"))) {
      if (!(row.memo_index === null && row.memo_node === null) && !(uint(row.memo_index) && uint(row.memo_node) && row.host === "other" && row.top_level === false && uint(row.list_node) && row.memo_node + 1 === row.list_node))
        throw new Error("InvalidHwp5ParagraphFlow");
    }
    if (row?.host !== undefined) {
      if (![
        "body",
        "table_cell",
        "table_caption",
        "header",
        "footer",
        "footnote",
        "endnote",
        "master_page",
        "drawing",
        "other"
      ].includes(row.host) || !(row.list_node === null || uint(row.list_node)) || row.top_level !== (row.host === "body") || row.host === "body" !== (row.list_node === null))
        throw new Error("InvalidHwp5ParagraphFlow");
    }
    if (!row || row.paragraph !== index || !uint(row.template_node) || !(row.source_node === null || uint(row.source_node)) || !(row.parent_node === null || uint(row.parent_node)) || !Number.isInteger(row.break_flags) || row.break_flags < 0 || row.break_flags > 255 || typeof row.generated !== "boolean" || row.generated !== (row.source_node === null) || row.top_level !== (row.parent_node === null) || row.generated && (![0, 4, 8].includes(row.break_flags) || row.break_flags !== 0 && !row.top_level) || !row.generated && row.source_node !== row.template_node)
      throw new Error("InvalidHwp5ParagraphFlow");
    for (const [name, mask] of [
      ["section_break", 1],
      ["multicolumn_break", 2],
      ["page_break", 4],
      ["column_break", 8]
    ])
      if (row[name] !== Boolean(row.break_flags & mask))
        throw new Error("InvalidHwp5ParagraphFlow");
  }
  return rows;
}
function decodeHwp5ColumnSources(bytes) {
  const rows = parse(bytes);
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5ColumnSources");
  for (const row of rows) {
    if (!row || !uint(row.current_paragraph) || !uint(row.current_unit))
      throw new Error("InvalidHwp5ColumnSources");
    if (!row || !["source_node", "paragraph_node", "flags", "color", "extra_bytes"].every((name) => uint(row[name])) || !Number.isInteger(row.count) || row.count < 1 || row.count > 255 || ![0, 1, 2, 3].includes(row.kind) || ![0, 1, 2, 3].includes(row.direction) || typeof row.same_width !== "boolean" || !(row.spacing === null || Number.isInteger(row.spacing) && row.spacing >= -32768 && row.spacing <= 32767) || ![row.line_type, row.line_width].every((value) => Number.isInteger(value) && value >= 0 && value <= 255) || !Array.isArray(row.columns))
      throw new Error("InvalidHwp5ColumnSources");
    if ((row.flags >>> 2 & 255) !== row.count || (row.flags & 3) !== row.kind || (row.flags >>> 10 & 3) !== row.direction || Boolean(row.flags & 4096) !== row.same_width || row.columns.length !== (row.count < 2 || row.same_width ? 0 : row.count) || row.columns.length > 0 !== (row.spacing === null))
      throw new Error("InvalidHwp5ColumnSources");
    for (const value of row.columns)
      if (!value || ![value.width, value.gap].every((number) => Number.isInteger(number) && number >= 0 && number <= 65535))
        throw new Error("InvalidHwp5ColumnSources");
  }
  return rows;
}

// js/hwp5-formula-sources.mjs
var decoder2 = new TextDecoder("utf-8", { fatal: true });
var uint2 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
function decodeHwp5FormulaSources(bytes) {
  const rows = JSON.parse(decoder2.decode(bytes));
  if (!Array.isArray(rows) || rows.length > 1e6)
    throw new Error("InvalidHwp5FormulaSources");
  const seen = new Set;
  for (const row of rows) {
    if (!row || !uint2(row.source_node) || row.source_node === 0 || !uint2(row.paragraph) || seen.has(row.source_node) || typeof row.formula !== "string" || !row.formula.startsWith("=") || row.formula.length < 2 || typeof row.last_result !== "string" || typeof row.derived !== "boolean" || !row.formula.isWellFormed() || !row.last_result.isWellFormed())
      throw new Error("InvalidHwp5FormulaSources");
    seen.add(row.source_node);
  }
  return rows;
}

// js/hwp5-field-spans.mjs
function validateHwp5FieldSpans(rows) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const sources = new Set;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5FieldSpans");
  for (const row of rows) {
    if (!row || ![row.source_node, row.field_id, row.ordinal].every(uint) || ![row.begin, row.end].every((position) => position && uint(position.paragraph) && uint(position.unit)) || row.begin.paragraph > row.end.paragraph || row.begin.paragraph === row.end.paragraph && row.begin.unit > row.end.unit || sources.has(row.source_node))
      throw new Error("InvalidHwp5FieldSpans");
    sources.add(row.source_node);
  }
  return rows;
}
function decodeHwp5FieldSpans(bytes) {
  return validateHwp5FieldSpans(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-field-topology.mjs
var uint3 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var position = (value) => value && uint3(value.paragraph) && uint3(value.unit);
var before = (lhs, rhs) => lhs.paragraph < rhs.paragraph || lhs.paragraph === rhs.paragraph && lhs.unit < rhs.unit;
function validateHwp5FieldTopology(value) {
  const fail = () => {
    throw new Error("InvalidHwp5FieldTopology");
  };
  if (!value || !Array.isArray(value.spans) || !Array.isArray(value.unresolved))
    fail();
  const starts = new Set;
  for (const row of value.spans) {
    if (!row || !uint3(row.field_id) || !uint3(row.ordinal) || !position(row.begin) || !position(row.end) || before(row.end, row.begin))
      fail();
    const key = row.begin.paragraph + ":" + row.ordinal;
    if (starts.has(key))
      fail();
    starts.add(key);
  }
  let previous = null;
  for (const row of value.unresolved) {
    if (!row || !position(row.position) || !uint3(row.marker_id) || !(row.list_node === null || uint3(row.list_node)))
      fail();
    if (previous && !before(previous, row.position))
      fail();
    previous = row.position;
    if (row.kind === "unclosed_start") {
      if (!uint3(row.ordinal))
        fail();
      const key = row.position.paragraph + ":" + row.ordinal;
      if (starts.has(key))
        fail();
      starts.add(key);
    } else if (row.kind === "orphan_end") {
      if (row.ordinal !== null)
        fail();
    } else
      fail();
  }
  return { spans: value.spans, unresolved: value.unresolved };
}
function decodeHwp5FieldTopology(bytes) {
  return validateHwp5FieldTopology(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-normalization-info.mjs
var decoder3 = new TextDecoder("utf-8", { fatal: true });
var counts = [
  "zero_fat_tail_slots",
  "off_by_one_fat_markers",
  "zero_unclaimed_fat_slots",
  "orphan_end_fat_slots",
  "zero_mini_tail_slots",
  "zero_unclaimed_mini_slots",
  "zero_unused_entries",
  "stale_unused_entries"
];
function decodeHwp5NormalizationInfo(bytes) {
  const value = JSON.parse(decoder3.decode(bytes));
  if (value === null)
    return { normalized: false, historyBaseline: "original", deviations: null };
  const invalid = () => {
    throw new Error("InvalidHwp5NormalizationInfo");
  };
  if (!value || typeof value !== "object" || Array.isArray(value))
    invalid();
  for (const key of counts)
    if (!Number.isSafeInteger(value[key]) || value[key] < 0)
      invalid();
  const root = value.original_root_created;
  if (!(typeof root === "string" && /^(0|[1-9][0-9]*)$/.test(root)) && !(Number.isSafeInteger(root) && root >= 0))
    invalid();
  if (BigInt(root) > 0xffffffffffffffffn)
    invalid();
  return {
    normalized: true,
    historyBaseline: "normalized",
    deviations: { ...value, original_root_created: String(root) }
  };
}

// js/hwp5-observed-docinfo.mjs
function validateObservedDocInfoOption(value, distribution, availableSectionCopy) {
  if (typeof value !== "boolean")
    throw new TypeError("Invalid observed DocInfo option");
  if (value && (distribution || availableSectionCopy))
    throw new TypeError("Unsupported observed DocInfo option combination");
}
function decodeObservedDocInfoDiagnostics(bytes) {
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (value === null)
    return null;
  const fields = [
    "absent_carets",
    "unresolved_font_types",
    "unresolved_style_characters",
    "unresolved_character_tails",
    "absent_fill_additionals"
  ];
  if (!value || typeof value !== "object" || fields.some((key) => !Number.isInteger(value[key]) || value[key] < 0 || value[key] > 4294967295) || typeof value.resource_count_mismatch !== "boolean")
    throw new Error("InvalidObservedDocInfoDiagnostics");
  return value;
}

// js/hwp5-exclusive-text-delta.mjs
var uint4 = (x) => Number.isSafeInteger(x) && x >= 0 && x < 4294967295;
var epoch = (x) => typeof x === "string" && /^[1-9][0-9]{0,19}$/.test(x) && BigInt(x) <= 0xffffffffffffffffn;
var bad = () => {
  throw Error("InvalidExclusiveTextDelta");
};
function decodeHwp5TextWindow(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 48)
    bad();
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const n = (i) => v.getUint32(4 + i * 4, true);
  const e = (BigInt(n(2)) << 32n | BigInt(n(1))).toString();
  if (String.fromCharCode(...bytes.slice(0, 4)) !== "H5W1" || n(0) !== 1 || !epoch(e) || !uint4(n(3)) || !uint4(n(4)) || n(7) > n(8) || n(8) > n(6) || n(8) - n(7) > 4096 || n(9) !== 1 || n(10) !== (n(8) - n(7)) * 2 || bytes.length !== 48 + n(10))
    bad();
  const text = new TextDecoder("utf-16le", { fatal: true, ignoreBOM: true }).decode(bytes.slice(48));
  return {
    epoch: e,
    section: n(3),
    sourceNode: n(4),
    parentNode: n(5) === 4294967295 ? null : n(5),
    totalUnits: n(6),
    startUnit: n(7),
    endUnit: n(8),
    text
  };
}
function decodeHwp5TextDelta(bytes) {
  const r = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!r || Object.keys(r).sort().join() !== [
    "version",
    "exclusive",
    "beforeEpoch",
    "epoch",
    "beforeRevision",
    "revision",
    "section",
    "paragraph",
    "sourceNode",
    "parentNode",
    "startUnit",
    "removed",
    "inserted",
    "totalUnits",
    "runs"
  ].sort().join() || r.version !== 1 || r.exclusive !== true || !epoch(r.beforeEpoch) || !epoch(r.epoch) || BigInt(r.epoch) <= BigInt(r.beforeEpoch))
    bad();
  for (const k of [
    "beforeRevision",
    "revision",
    "section",
    "paragraph",
    "sourceNode",
    "startUnit",
    "totalUnits"
  ])
    if (!uint4(r[k]))
      bad();
  if (r.parentNode !== null && !uint4(r.parentNode))
    bad();
  for (const k of ["removed", "inserted"])
    if (!Array.isArray(r[k]) || r[k].length > 4096 || r[k].some((x) => !Number.isInteger(x) || x < 0 || x > 65535))
      bad();
  if (!Array.isArray(r.runs) || !r.runs.length || r.runs.length > 4096)
    bad();
  let prev = -1;
  for (const run of r.runs) {
    if (Object.keys(run).sort().join() !== "char_shape_id,start_unit" || !uint4(run.start_unit) || !uint4(run.char_shape_id) || run.start_unit <= prev || run.start_unit > r.totalUnits)
      bad();
    prev = run.start_unit;
  }
  if (r.runs[0].start_unit !== 0 || r.totalUnits < 1 || r.totalUnits > 4096)
    bad();
  return r;
}
function createHwp5ExclusiveTextApi({
  wasm,
  output,
  check,
  encode,
  currentSourceReferences
}) {
  const window = (reference, start, end) => output((ptr, size) => wasm.hwp5_edit_copy_current_text_window(ptr, size, start, end), encode(reference));
  return {
    captureExclusiveTextOwner(section, paragraph) {
      check();
      if (typeof wasm.hwp5_edit_last_text_delta_receipt !== "function" || typeof wasm.hwp5_edit_copy_current_text_window !== "function")
        return null;
      const references = currentSourceReferences(section, { first: paragraph, count: 1 });
      const reference = references.references[0];
      if (reference?.kind !== "original")
        return null;
      const w = decodeHwp5TextWindow(window(reference, 0, 0));
      return { section, paragraph, reference, window: w };
    },
    readCurrentOwnerWindow(section, paragraph) {
      check();
      if (typeof wasm.hwp5_edit_copy_current_text_window !== "function" || typeof wasm.hwp5_edit_character_ranges !== "function")
        return null;
      const captured = this.captureExclusiveTextOwner(section, paragraph);
      if (!captured || captured.window.totalUnits < 2 || captured.window.totalUnits > 4096)
        return null;
      const reference = captured.reference;
      const w = decodeHwp5TextWindow(window(reference, 0, captured.window.totalUnits));
      if (w.epoch !== captured.window.epoch || w.sourceNode !== captured.window.sourceNode || w.parentNode !== captured.window.parentNode || w.section !== section || w.totalUnits !== captured.window.totalUnits || w.startUnit !== 0 || w.endUnit !== w.totalUnits || w.text.length !== w.totalUnits || w.text.at(-1) !== "\r" || !w.text.isWellFormed() || Array.from(w.text.slice(0, -1)).some((c) => c.charCodeAt(0) < 32 || c === "￼"))
        bad();
      const raw = decodeCharacterRanges(output(() => wasm.hwp5_edit_character_ranges(section, paragraph)));
      if (!raw.length || raw.length > 4096)
        bad();
      const characterRanges = [];
      const length = w.text.length - 1;
      let cursor = 0;
      for (const range of raw) {
        if (range.start !== cursor || range.end < range.start || range.end > w.totalUnits || !uint4(range.charShapeId))
          bad();
        cursor = range.end;
        const start = Math.min(length, range.start), end = Math.min(length, range.end), charShapeId = range.charShapeId;
        if (start === end) {
          if (start === length)
            characterRanges.push({ start, end, charShapeId });
          continue;
        }
        const last = characterRanges.at(-1);
        if (last?.charShapeId === charShapeId)
          last.end = end;
        else
          characterRanges.push({ start, end, charShapeId });
      }
      if (cursor !== w.totalUnits)
        bad();
      const final = currentSourceReferences(section, { first: paragraph, count: 1 }).references[0];
      if (!final || Object.keys(reference).some((k) => final[k] !== reference[k]) || Object.keys(final).length !== Object.keys(reference).length)
        bad();
      return { reference, window: w, characterRanges };
    },
    readExclusiveTextDelta(before) {
      check();
      if (!before)
        return null;
      const r = decodeHwp5TextDelta(output(() => wasm.hwp5_edit_last_text_delta_receipt()));
      const q = currentSourceReferences(r.section, { first: r.paragraph, count: 1 });
      const reference = q.references[0];
      if (r.section !== before.section || r.paragraph !== before.paragraph || r.beforeEpoch !== before.window.epoch || r.sourceNode !== before.window.sourceNode || r.parentNode !== before.window.parentNode || reference?.kind !== "original" || reference.epoch !== r.epoch || reference.id !== String(r.sourceNode) || r.startUnit + r.removed.length > before.window.totalUnits - 1 || r.totalUnits !== before.window.totalUnits - r.removed.length + r.inserted.length)
        bad();
      const after = decodeHwp5TextWindow(window(reference, 0, r.totalUnits));
      if (after.epoch !== r.epoch || after.sourceNode !== r.sourceNode || after.parentNode !== r.parentNode || after.section !== r.section || after.totalUnits !== r.totalUnits || after.text.at(-1) !== "\r" || Array.from(after.text.slice(0, -1)).some((c) => c.charCodeAt(0) < 32))
        bad();
      return { receipt: r, before: before.window, window: after, reference };
    }
  };
}

// js/hwp5-current-references.mjs
var utf8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
var utf16 = new TextDecoder("utf-16le", { fatal: true, ignoreBOM: true });
var encoder = new TextEncoder;
var fields = ["epoch", "kind", "section", "id", "row", "column"];
var scopeSequence = 0n;
var invalid = () => {
  throw new Error("InvalidHwp5CurrentReference");
};
var uint5 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var decimal = (value) => typeof value === "string" && /^(0|[1-9][0-9]{0,19})$/.test(value) && BigInt(value) <= 0xffffffffffffffffn;
function validate(reference) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference))
    invalid();
  if (Object.keys(reference).length !== fields.length || fields.some((key) => !Object.hasOwn(reference, key)))
    invalid();
  const { epoch, kind, section, id, row, column } = reference;
  if (!decimal(epoch) || epoch === "0" || !decimal(id) || !uint5(section) || !uint5(row) || !uint5(column))
    invalid();
  if (!["original", "generated", "cell"].includes(kind))
    invalid();
  if (kind !== "cell" && (row !== 0 || column !== 0 || BigInt(id) > 0xffffffffn))
    invalid();
  if (kind !== "original" && id === "0")
    invalid();
  return reference;
}
function decodeHwp5CurrentReferences(bytes) {
  const value = JSON.parse(utf8.decode(bytes));
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join() !== "first,references,total,version")
    invalid();
  if (value.version !== 1 || !uint5(value.total) || !uint5(value.first) || value.first > value.total || !Array.isArray(value.references) || value.references.length > 1024 || value.first + value.references.length > value.total)
    invalid();
  for (const reference of value.references)
    validate(reference);
  if (value.references.some((reference) => reference.epoch !== value.references[0].epoch))
    invalid();
  return value;
}
function createHwp5CurrentReferenceApi({
  wasm,
  memory,
  check,
  output,
  success,
  u32,
  referenceScope
}) {
  const scope = referenceScope === undefined ? String(++scopeSequence) : `${referenceScope}:${++scopeSequence}`;
  const available = () => [
    "hwp5_edit_current_references",
    "hwp5_edit_copy_current_text",
    "hwp5_edit_splice_current"
  ].every((name) => typeof wasm[name] === "function");
  const ready = () => {
    check();
    if (!available())
      throw new Error("Hwp5CurrentReferenceAbiUnavailable");
  };
  const encode = (reference) => {
    if (!reference || reference.scope !== scope || Object.keys(reference).length !== fields.length + 1)
      throw new Error("InvalidCurrentReferenceScope");
    const wire = Object.fromEntries(fields.map((key) => [key, reference[key]]));
    validate(wire);
    return encoder.encode(JSON.stringify(wire));
  };
  const copyCurrentText = (reference) => {
    ready();
    return memory.withBytes(encode(reference), (ptr, size) => output(() => wasm.hwp5_edit_copy_current_text(ptr, size)).bytes);
  };
  const windowQuery = (name, section, options = {}) => {
    ready();
    if (typeof wasm[name] !== "function")
      throw new Error("Hwp5CurrentSourceReferenceAbiUnavailable");
    if (!options || typeof options !== "object" || Array.isArray(options))
      throw new TypeError("InvalidCurrentWindow");
    const { first = 0, count = 256 } = options;
    const args = [u32(section, "section"), u32(first, "first"), u32(count, "count")];
    if (count > 1024)
      throw new RangeError("LimitExceeded");
    const window = decodeHwp5CurrentReferences(output(() => wasm[name](...args)).bytes);
    if (window.first !== args[1] || window.references.length !== Math.min(args[2], window.total - args[1]) || window.references.some((ref) => ref.section !== args[0]))
      invalid();
    return {
      ...window,
      references: window.references.map((reference) => Object.freeze({ ...reference, scope }))
    };
  };
  const exclusive = createHwp5ExclusiveTextApi({
    wasm,
    check,
    encode,
    currentSourceReferences: (section, options) => windowQuery("hwp5_edit_current_source_references", section, options),
    output: (action, bytes) => bytes === undefined ? output(action).bytes : memory.withBytes(bytes, (ptr, size) => output(() => action(ptr, size)).bytes)
  });
  return {
    ...exclusive,
    supportsCurrentReferences() {
      check();
      return available();
    },
    supportsCurrentSourceReferences() {
      check();
      return available() && typeof wasm.hwp5_edit_current_source_references === "function";
    },
    currentSourceReferences(section, options) {
      const window = windowQuery("hwp5_edit_current_source_references", section, options);
      if (window.references.some((ref) => ref.kind === "cell"))
        invalid();
      return window;
    },
    currentReferences(section, options = {}) {
      return windowQuery("hwp5_edit_current_references", section, options);
    },
    copyCurrentText,
    currentText(reference) {
      return utf16.decode(copyCurrentText(reference));
    },
    spliceCurrent(options) {
      ready();
      if (!options || typeof options !== "object" || Array.isArray(options))
        throw new TypeError("InvalidCurrentEdit");
      const { reference, startUnit, endUnit, text } = options;
      const range = [u32(startUnit, "startUnit"), u32(endUnit, "endUnit")];
      if (startUnit > endUnit)
        throw new RangeError("InvalidTextPosition");
      if (typeof text !== "string")
        throw new TypeError("Text must be a string");
      if (!text.isWellFormed())
        throw new Error("InvalidUnicodeEncoding");
      if (text.length > 4 * 1024 * 1024)
        throw new RangeError("LimitExceeded");
      const bytes = encoder.encode(text);
      if (bytes.length > 4 * 1024 * 1024)
        throw new RangeError("LimitExceeded");
      memory.withBytes(encode(reference), (ptr, size) => memory.withBytes(bytes, (textPtr, textSize) => success(wasm.hwp5_edit_splice_current(ptr, size, ...range, textPtr, textSize))));
    }
  };
}

// js/hwp5-created-tables.mjs
var decoder4 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
var keys = (v, names) => v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === names.length && names.every((k) => Object.hasOwn(v, k));
var integer = (v, low, high) => Number.isInteger(v) && v >= low && v <= high;
var margins = (v) => Array.isArray(v) && v.length === 4 && v.every((n) => integer(n, -32768, 32767));
function decodeHwp5CreatedTables(bytes) {
  const fail = () => {
    throw new Error("InvalidHwp5CreatedTables");
  };
  const rows = JSON.parse(decoder4.decode(bytes));
  if (!Array.isArray(rows) || rows.length > 1e5 || rows.some((r) => !keys(r, ["table", "options"])))
    fail();
  validateCreatedTables(rows.map((row) => row.table), { hostBase: 0 });
  for (const row of rows) {
    const o = row.options;
    if (!keys(o, ["common", "table", "cell"]))
      fail();
    const { common: c, table: t, cell: l } = o;
    if (!keys(c, [
      "flags",
      "offset_y",
      "offset_x",
      "z_order",
      "margins",
      "prevent_page_break",
      "description"
    ]) || !integer(c.flags, 0, 4294967295) || ![c.offset_y, c.offset_x, c.z_order].every((n) => integer(n, -2147483648, 2147483647)) || !margins(c.margins) || typeof c.prevent_page_break !== "boolean" || typeof c.description !== "string" || !c.description.isWellFormed())
      fail();
    if (!keys(t, ["page_break", "repeat_header", "cell_spacing", "margins"]) || !integer(t.page_break, 0, 2) || typeof t.repeat_header !== "boolean" || !integer(t.cell_spacing, -32768, 32767) || !margins(t.margins))
      fail();
    if (!keys(l, ["layout", "unknown", "attributes", "margins"]) || !integer(l.attributes, 0, 4294967295) || !margins(l.margins) || !(l.layout === "spec6" && l.unknown === null || l.layout === "observed8" && integer(l.unknown, 0, 65535)))
      fail();
  }
  return rows;
}

// js/hwp5-table-creation.mjs
var encoder2 = new TextEncoder;
var decoder5 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
function createHwp5TableCreationApi({ wasm, memory, check, output, u32 }) {
  return {
    supportsTableInitialTexts() {
      check();
      return typeof wasm.hwp5_edit_insert_table_with_texts === "function";
    },
    supportsTableCreation() {
      check();
      return typeof wasm.hwp5_edit_insert_table === "function";
    },
    tableCreationResources() {
      check();
      if (typeof wasm.hwp5_edit_table_creation_resources !== "function")
        throw new Error("Hwp5TableCreationResourcesAbiUnavailable");
      return decodeTableCreationResources(output(() => wasm.hwp5_edit_table_creation_resources()).bytes);
    },
    createdTables(section) {
      check();
      if (typeof wasm.hwp5_edit_created_tables !== "function")
        throw new Error("Hwp5CreatedTablesAbiUnavailable");
      return decodeHwp5CreatedTables(output(() => wasm.hwp5_edit_created_tables(u32(section, "section"))).bytes);
    },
    insertTable(request) {
      check();
      if (typeof wasm.hwp5_edit_insert_table !== "function")
        throw new Error("Hwp5TableCreationAbiUnavailable");
      if (!request || typeof request !== "object" || Array.isArray(request))
        throw new TypeError("InvalidTableCreationRequest");
      const withTexts = Object.hasOwn(request, "cell_texts");
      let bytes;
      if (withTexts) {
        if (typeof wasm.hwp5_edit_insert_table_with_texts !== "function")
          throw new Error("Hwp5TableInitialTextsAbiUnavailable");
        const captured = captureTableTextRequest(request);
        captured.cell_texts = captureTableInitialTexts(captured.rows, captured.columns, captured.cell_texts);
        bytes = encodeTableTextRequest(captured);
      } else {
        const json = JSON.stringify(request);
        if (json.length > 1024 * 1024)
          throw new RangeError("LimitExceeded");
        bytes = encoder2.encode(json);
        if (bytes.length > 1024 * 1024)
          throw new RangeError("LimitExceeded");
      }
      const response = memory.withBytes(bytes, (ptr, size) => output(() => withTexts ? wasm.hwp5_edit_insert_table_with_texts(ptr, size) : wasm.hwp5_edit_insert_table(ptr, size)).bytes);
      const value = JSON.parse(decoder5.decode(response));
      if (!value || Object.keys(value).join() !== "identity" || typeof value.identity !== "string" || !/^[1-9][0-9]{0,19}$/.test(value.identity) || BigInt(value.identity) > 0xffffffffffffffffn)
        throw new Error("InvalidCreatedTableIdentity");
      return value.identity;
    }
  };
}

// js/hwp5-editor.mjs
var encoder3 = new TextEncoder;
var decoder6 = new TextDecoder("utf-16le", { fatal: true, ignoreBOM: true });
var u32 = (value, name) => {
  if (!Number.isInteger(value) || value < 0 || value > 4294967295)
    throw new RangeError(`Invalid ${name}`);
  return value;
};
async function createExperimentalHwp5Editor2(source, input, {
  distribution = false,
  normalizeObservedCfb = false,
  availableSectionCopy = false,
  retainObservedDocInfo = false,
  referenceScope
} = {}) {
  validateObservedDocInfoOption(retainObservedDocInfo, distribution, availableSectionCopy);
  if (typeof distribution !== "boolean")
    throw new TypeError("Invalid distribution option");
  if (referenceScope !== undefined && (typeof referenceScope !== "string" || !referenceScope.length))
    throw new TypeError("InvalidCurrentReferenceScope");
  if (typeof normalizeObservedCfb !== "boolean")
    throw new TypeError("Invalid normalization option");
  validateAvailableSectionCopyOption(availableSectionCopy, distribution, normalizeObservedCfb);
  const module = source instanceof WebAssembly.Module ? source : await WebAssembly.compile(source);
  const { exports: wasm } = await WebAssembly.instantiate(module, {});
  validateAbi(wasm);
  for (const name of EXPERIMENTAL_EDITOR_FUNCTIONS)
    if (typeof wasm[name] !== "function")
      throw new Error(`Missing experimental editor export: ${name}`);
  const memory = createMemory(wasm);
  let closed = false;
  const check = () => {
    if (closed)
      throw new Error("EditorClosed");
  };
  const success = (value) => {
    if (!value)
      throw memory.error();
  };
  const count = (value) => {
    if (value >>> 0 === 4294967295)
      throw memory.error();
    return value >>> 0;
  };
  const output = (action) => {
    try {
      success(action());
      return {
        bytes: memory.copy(wasm.hwp5_edit_output_ptr(), wasm.hwp5_edit_output_len()),
        layoutRequiresReflow: Boolean(wasm.hwp5_edit_reflow())
      };
    } finally {
      wasm.hwp5_edit_output_free();
    }
  };
  const bytes = inputBytes(input);
  if (bytes.length > 64 * 1024 * 1024)
    throw new RangeError("LimitExceeded");
  const open = retainObservedDocInfo ? wasm.hwp5_edit_open_observed_docinfo : availableSectionCopy ? wasm.hwp5_edit_open_available_section_copy : normalizeObservedCfb ? distribution ? wasm.hwp5_edit_open_normalized_distribution : wasm.hwp5_edit_open_normalized : distribution ? wasm.hwp5_edit_open_distribution : wasm.hwp5_edit_open;
  if (normalizeObservedCfb && distribution && typeof open !== "function")
    throw new Error("Hwp5NormalizedDistributionAbiUnavailable");
  if (retainObservedDocInfo && (typeof open !== "function" || typeof wasm.hwp5_edit_observed_docinfo_diagnostics !== "function"))
    throw new Error("Hwp5ObservedDocInfoAbiUnavailable");
  if (normalizeObservedCfb && typeof open !== "function")
    throw new Error("Hwp5NormalizationAbiUnavailable");
  if (availableSectionCopy && (typeof open !== "function" || typeof wasm.hwp5_edit_available_section_copy_info !== "function"))
    throw new Error("Hwp5AvailableSectionCopyAbiUnavailable");
  if (typeof open !== "function")
    throw new Error("Hwp5DistributionEditorAbiUnavailable");
  memory.withBytes(bytes, (ptr, size) => success(retainObservedDocInfo ? open(ptr, size, normalizeObservedCfb ? 1 : 0) : open(ptr, size)));
  const copyText = (section, paragraph) => {
    check();
    return output(() => wasm.hwp5_edit_copy_text(u32(section, "section"), u32(paragraph, "paragraph"))).bytes;
  };
  return {
    ...createAtomicFormattingApi({ wasm, memory, check, prefix: "hwp5_edit" }),
    observedDocInfoDiagnostics() {
      check();
      if (typeof wasm.hwp5_edit_observed_docinfo_diagnostics !== "function")
        throw new Error("Hwp5ObservedDocInfoAbiUnavailable");
      return decodeObservedDocInfoDiagnostics(output(() => wasm.hwp5_edit_observed_docinfo_diagnostics()).bytes);
    },
    ...createParagraphBreakApi({
      wasm,
      memory,
      check,
      uint: u32,
      prefix: "hwp5_edit",
      endAsCount: false,
      unavailable: "Hwp5ParagraphBreakAbiUnavailable"
    }),
    supportsNormalizationInfo() {
      check();
      return typeof wasm[availableSectionCopy ? "hwp5_edit_available_section_copy_info" : "hwp5_edit_normalization_info"] === "function";
    },
    normalizationInfo() {
      check();
      if (availableSectionCopy) {
        const info = decodeAvailableSectionCopyInfo(output(() => wasm.hwp5_edit_available_section_copy_info()).bytes);
        if (!info)
          throw new Error("InvalidAvailableSectionCopyInfo");
        return info;
      }
      if (typeof wasm.hwp5_edit_normalization_info !== "function")
        throw new Error("Hwp5NormalizationAbiUnavailable");
      return decodeHwp5NormalizationInfo(output(() => wasm.hwp5_edit_normalization_info()).bytes);
    },
    supportsTextSourcePolicy() {
      check();
      return typeof wasm.hwp5_edit_validate_text_source_policy === "function";
    },
    supportsTextSourceProtection() {
      check();
      return typeof wasm.hwp5_edit_text_source_protection === "function";
    },
    textSourceProtection(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_text_source_protection !== "function")
        throw new Error("Hwp5TextSourceProtectionAbiUnavailable");
      const bytes = output(() => wasm.hwp5_edit_text_source_protection(index)).bytes;
      return decodeHwp5TextSourceProtection(bytes, wasm.hwp5_edit_paragraph_count(index));
    },
    validateTextSourcePolicy(section) {
      check();
      u32(section, "section");
      if (typeof wasm.hwp5_edit_validate_text_source_policy !== "function")
        throw new Error("Hwp5TextSourcePolicyAbiUnavailable");
      success(wasm.hwp5_edit_validate_text_source_policy(section));
    },
    ...createHistoryApi({
      wasm,
      memory,
      check,
      uint: u32,
      prefix: "hwp5_edit",
      unavailable: "Hwp5HistoryAbiUnavailable"
    }),
    ...createHwp5CurrentReferenceApi({ wasm, memory, check, output, success, u32, referenceScope }),
    ...createHwp5TableCreationApi({ wasm, memory, check, output, u32 }),
    supportsCurrentTextPreview() {
      check();
      return typeof wasm.hwp5_edit_current_text_preview === "function";
    },
    currentTextPreview() {
      check();
      if (typeof wasm.hwp5_edit_current_text_preview !== "function")
        throw new Error("Hwp5CurrentTextPreviewAbiUnavailable");
      return decodeHwp5Text(output(() => wasm.hwp5_edit_current_text_preview()).bytes, {
        allowGenerated: true
      });
    },
    sectionCount() {
      check();
      return count(wasm.hwp5_edit_section_count());
    },
    paragraphCount(section) {
      check();
      return count(wasm.hwp5_edit_paragraph_count(u32(section, "section")));
    },
    characterShapeCount() {
      check();
      return count(wasm.hwp5_edit_char_shape_count());
    },
    paragraphShapeCount() {
      check();
      if (typeof wasm.hwp5_edit_para_shape_count !== "function")
        throw new Error("Hwp5ParagraphFormatAbiUnavailable");
      return count(wasm.hwp5_edit_para_shape_count());
    },
    paragraphShapeId(section, paragraph) {
      check();
      if (typeof wasm.hwp5_edit_para_shape_id !== "function")
        throw new Error("Hwp5ParagraphFormatAbiUnavailable");
      return count(wasm.hwp5_edit_para_shape_id(u32(section, "section"), u32(paragraph, "paragraph")));
    },
    setParagraphFormat({ section, paragraph, paraShapeId }) {
      check();
      const values = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        u32(paraShapeId, "paraShapeId")
      ];
      if (typeof wasm.hwp5_edit_set_paragraph_format !== "function")
        throw new Error("Hwp5ParagraphFormatAbiUnavailable");
      success(wasm.hwp5_edit_set_paragraph_format(...values));
    },
    setParagraphAlignment({ section, paragraph, alignment }) {
      check();
      const value = [
        "JUSTIFY",
        "LEFT",
        "RIGHT",
        "CENTER",
        "DISTRIBUTE",
        "DISTRIBUTE_SPACE"
      ].indexOf(alignment);
      if (value < 0)
        throw new RangeError("InvalidParagraphAlignment");
      const values = [u32(section, "section"), u32(paragraph, "paragraph"), value];
      if (typeof wasm.hwp5_edit_set_paragraph_alignment !== "function")
        throw new Error("Hwp5ParagraphAlignmentAbiUnavailable");
      success(wasm.hwp5_edit_set_paragraph_alignment(...values));
    },
    setParagraphMargins({ section, paragraph, margins }) {
      check();
      const args = [u32(section, "section"), u32(paragraph, "paragraph")];
      const [mask, ...values] = paragraphMarginArgs(margins);
      if (typeof wasm.hwp5_edit_set_paragraph_margins !== "function")
        throw new Error("Hwp5ParagraphMarginsAbiUnavailable");
      success(wasm.hwp5_edit_set_paragraph_margins(...args, mask, ...values));
    },
    setParagraphSpacing({ section, paragraph, type, value }) {
      check();
      const args = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        ...paragraphSpacingArgs(type, value)
      ];
      if (typeof wasm.hwp5_edit_set_paragraph_spacing !== "function")
        throw new Error("Hwp5ParagraphSpacingAbiUnavailable");
      success(wasm.hwp5_edit_set_paragraph_spacing(...args));
    },
    paragraphShapes() {
      check();
      if (typeof wasm.hwp5_edit_paragraph_shapes !== "function")
        throw new Error("Hwp5ParagraphShapesAbiUnavailable");
      return decodeParagraphShapes(output(() => wasm.hwp5_edit_paragraph_shapes()).bytes);
    },
    characterShapes() {
      check();
      if (typeof wasm.hwp5_edit_character_shapes !== "function")
        throw new Error("Hwp5CharacterShapesAbiUnavailable");
      return decodeCharacterShapes(output(() => wasm.hwp5_edit_character_shapes()).bytes);
    },
    fontFaces() {
      check();
      if (typeof wasm.hwp5_edit_font_faces !== "function")
        throw new Error("Hwp5FontFacesAbiUnavailable");
      return decodeFontFaces(output(() => wasm.hwp5_edit_font_faces()).bytes);
    },
    fontFaceMetadata() {
      check();
      if (typeof wasm.hwp5_edit_font_face_metadata !== "function")
        throw new Error("Hwp5FontFaceMetadataAbiUnavailable");
      return decodeFontFaceMetadata(output(() => wasm.hwp5_edit_font_face_metadata()).bytes);
    },
    characterFontReferences() {
      check();
      if (typeof wasm.hwp5_edit_character_font_references !== "function")
        throw new Error("Hwp5CharacterFontReferencesAbiUnavailable");
      return decodeCharacterFontReferences(output(() => wasm.hwp5_edit_character_font_references()).bytes);
    },
    characterFontMetrics() {
      check();
      if (typeof wasm.hwp5_edit_character_font_metrics !== "function")
        throw new Error("Hwp5CharacterFontMetricsAbiUnavailable");
      return decodeCharacterFontMetrics(output(() => wasm.hwp5_edit_character_font_metrics()).bytes, "hwp5");
    },
    characterTextColors() {
      check();
      if (typeof wasm.hwp5_edit_character_text_colors !== "function")
        throw new Error("Hwp5CharacterTextColorsAbiUnavailable");
      return decodeCharacterTextColors(output(() => wasm.hwp5_edit_character_text_colors()).bytes);
    },
    characterShades() {
      check();
      if (typeof wasm.hwp5_edit_character_shades !== "function")
        throw new Error("Hwp5CharacterShadesAbiUnavailable");
      return decodeCharacterShades(output(() => wasm.hwp5_edit_character_shades()).bytes);
    },
    characterEffects() {
      check();
      if (typeof wasm.hwp5_edit_character_effects !== "function")
        throw new Error("Hwp5CharacterEffectsAbiUnavailable");
      return decodeCharacterEffects(output(() => wasm.hwp5_edit_character_effects()).bytes);
    },
    characterOutlines() {
      check();
      if (typeof wasm.hwp5_edit_character_outlines !== "function")
        throw new Error("Hwp5CharacterOutlinesAbiUnavailable");
      return decodeCharacterOutlines(output(() => wasm.hwp5_edit_character_outlines()).bytes);
    },
    characterStrikeStyles() {
      check();
      if (typeof wasm.hwp5_edit_character_strike_styles !== "function")
        throw new Error("Hwp5CharacterStrikeStylesAbiUnavailable");
      return decodeCharacterStrikeStyles(output(() => wasm.hwp5_edit_character_strike_styles()).bytes);
    },
    characterStrikes() {
      check();
      if (typeof wasm.hwp5_edit_character_strikes !== "function")
        throw new Error("Hwp5CharacterStrikesAbiUnavailable");
      return decodeCharacterStrikes(output(() => wasm.hwp5_edit_character_strikes()).bytes);
    },
    characterUnderlines() {
      check();
      if (typeof wasm.hwp5_edit_character_underlines !== "function")
        throw new Error("Hwp5CharacterUnderlinesAbiUnavailable");
      return decodeCharacterUnderlines(output(() => wasm.hwp5_edit_character_underlines()).bytes);
    },
    characterUnderlineStyles() {
      check();
      if (typeof wasm.hwp5_edit_character_underline_styles !== "function")
        throw new Error("Hwp5CharacterUnderlineStylesAbiUnavailable");
      return decodeCharacterUnderlineStyles(output(() => wasm.hwp5_edit_character_underline_styles()).bytes);
    },
    characterRanges(section, paragraph) {
      check();
      if (typeof wasm.hwp5_edit_character_ranges !== "function")
        throw new Error("Hwp5CharacterRangesAbiUnavailable");
      return decodeCharacterRanges(output(() => wasm.hwp5_edit_character_ranges(u32(section, "section"), u32(paragraph, "paragraph"))).bytes);
    },
    tableBindings(section) {
      check();
      if (typeof wasm.hwp5_edit_table_bindings !== "function")
        throw new Error("Hwp5TableBindingsAbiUnavailable");
      return decodeTableBindings(output(() => wasm.hwp5_edit_table_bindings(u32(section, "section"))).bytes);
    },
    setCellStyles(input) {
      check();
      const value = validateCellStyles(input), borders = encodeCellBorderPatches(value.borders), fills = encodeCellFills(value.fills);
      if (Object.hasOwn(value, "diagonals")) {
        if (typeof wasm.hwp5_edit_set_cell_styles_v2 !== "function")
          throw Error("CellDiagonalAbiUnavailable");
        const diagonals = encodeCellDiagonals(value.diagonals);
        memory.withBytes(borders, (borderPtr, borderLength) => memory.withBytes(fills, (fillPtr, fillLength) => memory.withBytes(diagonals, (diagonalPtr, diagonalLength) => {
          success(wasm.hwp5_edit_set_cell_styles_v2(borderPtr, borderLength, fillPtr, fillLength, diagonalPtr, diagonalLength));
        })));
        return;
      }
      if (typeof wasm.hwp5_edit_set_cell_styles !== "function")
        throw Error("CellStylesAbiUnavailable");
      memory.withBytes(borders, (borderPtr, borderLength) => memory.withBytes(fills, (fillPtr, fillLength) => {
        success(wasm.hwp5_edit_set_cell_styles(borderPtr, borderLength, fillPtr, fillLength));
      }));
    },
    setCellFills(input) {
      check();
      const values = validateCellFills(input), bytes = encodeCellFills(values);
      if (typeof wasm.hwp5_edit_set_cell_fills !== "function")
        throw Error("CellFillBatchAbiUnavailable");
      memory.withBytes(bytes, (ptr, length) => success(wasm.hwp5_edit_set_cell_fills(ptr, length)));
    },
    setCellAppearance(input) {
      check();
      const value = validateCellAppearance(input), bytes = encodeCellBorders(value.cells), bg = value.background;
      if (typeof wasm.hwp5_edit_set_cell_appearance !== "function")
        throw Error("Hwp5CellAppearanceAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        success(wasm.hwp5_edit_set_cell_appearance(ptr, size, bg ? 1 : 0, bg?.section ?? 0, bg?.tableNode ?? 0, bg?.listNode ?? 0, bg?.color ?? 0));
      });
    },
    setCellBorders(cells) {
      check();
      const bytes = encodeCellBorders(cells);
      if (typeof wasm.hwp5_edit_set_cell_borders !== "function")
        throw Error("Hwp5CellBorderBatchAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => success(wasm.hwp5_edit_set_cell_borders(ptr, size)));
    },
    setCellBorder(input) {
      check();
      const value = validateCellBorder(input);
      if (typeof wasm.hwp5_edit_set_cell_border !== "function")
        throw new Error("Hwp5CellBorderAbiUnavailable");
      success(wasm.hwp5_edit_set_cell_border(value.section, value.tableNode, value.listNode, value.edges, cellBorderStyleCode(value.style), value.width, value.color));
    },
    setCellBackground(input) {
      check();
      const value = validateCellBackground(input);
      if (typeof wasm.hwp5_edit_set_cell_background !== "function")
        throw new Error("Hwp5CellBackgroundAbiUnavailable");
      success(wasm.hwp5_edit_set_cell_background(value.section, value.tableNode, value.listNode, value.color));
    },
    setCellSize({ section, listNode, width, height }) {
      check();
      const values = [
        u32(section, "section"),
        u32(listNode, "listNode"),
        u32(width, "width"),
        u32(height, "height")
      ];
      if (typeof wasm.hwp5_edit_set_cell_size !== "function")
        throw new Error("Hwp5CellSizeAbiUnavailable");
      success(wasm.hwp5_edit_set_cell_size(...values));
    },
    setCellSizes(cells) {
      check();
      const bytes = encodeCellSizes(cells);
      if (typeof wasm.hwp5_edit_set_cell_sizes !== "function")
        throw new Error("Hwp5CellSizeBatchAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => success(wasm.hwp5_edit_set_cell_sizes(ptr, size)));
    },
    setPictureCurrentSize({ section, pictureNode, width, height }) {
      check();
      const values = [
        u32(section, "section"),
        u32(pictureNode, "pictureNode"),
        u32(width, "width"),
        u32(height, "height")
      ];
      if (typeof wasm.hwp5_edit_set_picture_current_size !== "function")
        throw new Error("Hwp5PictureCurrentSizeAbiUnavailable");
      success(wasm.hwp5_edit_set_picture_current_size(...values));
    },
    resizePicture({ section, pictureNode, width, height }) {
      check();
      const values = [
        u32(section, "section"),
        u32(pictureNode, "pictureNode"),
        u32(width, "width"),
        u32(height, "height")
      ];
      if (typeof wasm.hwp5_edit_resize_picture !== "function")
        throw new Error("Hwp5PictureResizeAbiUnavailable");
      success(wasm.hwp5_edit_resize_picture(...values));
    },
    tablePlacements(section) {
      check();
      if (typeof wasm.hwp5_edit_table_placements !== "function")
        throw new Error("Hwp5TablePlacementsAbiUnavailable");
      return decodeTablePlacements(output(() => wasm.hwp5_edit_table_placements(u32(section, "section"))).bytes, "hwp5");
    },
    tableLayoutSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_table_layout_sources !== "function")
        throw new Error("Hwp5TableLayoutSourcesAbiUnavailable");
      return decodeHwp5TableLayoutSources(output(() => wasm.hwp5_edit_table_layout_sources(index)).bytes);
    },
    cellLayoutSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_cell_layout_sources !== "function")
        throw new Error("Hwp5CellLayoutSourcesAbiUnavailable");
      return decodeHwp5CellLayoutSources(output(() => wasm.hwp5_edit_cell_layout_sources(index)).bytes);
    },
    borderFillSources() {
      check();
      if (typeof wasm.hwp5_edit_border_fill_sources !== "function")
        throw new Error("Hwp5BorderFillSourcesAbiUnavailable");
      return decodeHwp5BorderFillSources(output(() => wasm.hwp5_edit_border_fill_sources()).bytes);
    },
    tableAnchors(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_table_anchors !== "function")
        throw new Error("Hwp5TableAnchorsAbiUnavailable");
      return decodeHwp5TableAnchors(output(() => wasm.hwp5_edit_table_anchors(index)).bytes);
    },
    structuralAnchors(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_structural_anchors !== "function")
        throw new Error("Hwp5StructuralAnchorsAbiUnavailable");
      return decodeHwp5StructuralAnchors(output(() => wasm.hwp5_edit_structural_anchors(index)).bytes);
    },
    noteShapeSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_note_shape_sources !== "function")
        throw new Error("Hwp5NoteShapeSourcesAbiUnavailable");
      return decodeHwp5NoteShapeSources(output(() => wasm.hwp5_edit_note_shape_sources(index)).bytes);
    },
    captionSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_caption_sources !== "function")
        throw new Error("Hwp5CaptionSourcesAbiUnavailable");
      return decodeHwp5CaptionSources(output(() => wasm.hwp5_edit_caption_sources(index)).bytes);
    },
    supportsFormSources() {
      check();
      return ["hwp5_edit_form_sources", "hwp5_edit_form_anchors"].every((name) => typeof wasm[name] === "function");
    },
    supportsFormProperties() {
      check();
      return typeof wasm.hwp5_edit_form_properties === "function";
    },
    supportsFormTextEdit() {
      check();
      return typeof wasm.hwp5_edit_set_form_text === "function";
    },
    supportsFormTextLayoutRetention() {
      check();
      return typeof wasm.hwp5_edit_set_form_text === "function" && typeof wasm.hwp5_edit_form_text_retains_layout_flags === "function" && wasm.hwp5_edit_form_text_retains_layout_flags() === 1;
    },
    supportsRadioButtonSelect() {
      check();
      return typeof wasm.hwp5_edit_select_form_radio === "function";
    },
    supportsUnnamedRadioSelect() {
      check();
      return typeof wasm.hwp5_edit_select_form_radio === "function" && typeof wasm.hwp5_edit_radio_unnamed_singleton === "function" && wasm.hwp5_edit_radio_unnamed_singleton() === 1;
    },
    selectRadioButton(section, formNode) {
      check();
      const positions = [u32(section, "section"), u32(formNode, "formNode")];
      if (typeof wasm.hwp5_edit_select_form_radio !== "function")
        throw new Error("Hwp5RadioSelectAbiUnavailable");
      success(wasm.hwp5_edit_select_form_radio(...positions));
    },
    supportsCheckBoxStateEdit() {
      check();
      return typeof wasm.hwp5_edit_set_form_choice === "function";
    },
    setCheckBoxState(section, formNode, state) {
      check();
      const positions = [u32(section, "section"), u32(formNode, "formNode")];
      if (typeof wasm.hwp5_edit_set_form_choice !== "function")
        throw new Error("Hwp5FormChoiceEditAbiUnavailable");
      const states = ["UNCHECKED", "CHECKED", "INDETERMINATE"], value = states.indexOf(state);
      if (value < 0)
        throw new TypeError("InvalidFormChoiceState");
      success(wasm.hwp5_edit_set_form_choice(...positions, value));
    },
    setFormText({ section, formNode, text }) {
      check();
      const positions = [u32(section, "section"), u32(formNode, "formNode")];
      if (typeof wasm.hwp5_edit_set_form_text !== "function")
        throw new Error("Hwp5FormTextEditAbiUnavailable");
      if (typeof text !== "string")
        throw new TypeError("Form text must be a string");
      if (!text.isWellFormed())
        throw new Error("InvalidUnicodeEncoding");
      if (text.length > 65535)
        throw new RangeError("LimitExceeded");
      const bytes = encoder3.encode(text);
      if (bytes.length > 196605)
        throw new RangeError("LimitExceeded");
      memory.withBytes(bytes, (ptr, size) => success(wasm.hwp5_edit_set_form_text(...positions, ptr, size)));
    },
    formProperties(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_form_properties !== "function")
        throw new Error("Hwp5FormPropertiesAbiUnavailable");
      return decodeHwp5FormProperties(output(() => wasm.hwp5_edit_form_properties(index)).bytes);
    },
    formSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_form_sources !== "function")
        throw new Error("Hwp5FormSourcesAbiUnavailable");
      return decodeHwp5FormSources(output(() => wasm.hwp5_edit_form_sources(index)).bytes);
    },
    formAnchors(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_form_anchors !== "function")
        throw new Error("Hwp5FormSourcesAbiUnavailable");
      return decodeHwp5FormAnchors(output(() => wasm.hwp5_edit_form_anchors(index)).bytes);
    },
    drawingSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_drawing_sources !== "function")
        throw new Error("Hwp5DrawingSourcesAbiUnavailable");
      return decodeHwp5DrawingSources(output(() => wasm.hwp5_edit_drawing_sources(index)).bytes);
    },
    drawingObjectExtras(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_drawing_object_extras !== "function")
        throw new Error("Hwp5DrawingObjectExtrasAbiUnavailable");
      return decodeHwp5DrawingObjectExtras(output(() => wasm.hwp5_edit_drawing_object_extras(index)).bytes);
    },
    drawingComponentSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_drawing_component_sources !== "function")
        throw new Error("Hwp5DrawingComponentSourcesAbiUnavailable");
      return decodeHwp5DrawingComponentSources(output(() => wasm.hwp5_edit_drawing_component_sources(index)).bytes);
    },
    drawingAnchors(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_drawing_anchors !== "function")
        throw new Error("Hwp5DrawingAnchorsAbiUnavailable");
      return decodeHwp5DrawingAnchors(output(() => wasm.hwp5_edit_drawing_anchors(index)).bytes);
    },
    drawingListSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_drawing_list_sources !== "function")
        throw new Error("Hwp5DrawingListSourcesAbiUnavailable");
      return decodeHwp5DrawingListSources(output(() => wasm.hwp5_edit_drawing_list_sources(index)).bytes);
    },
    drawingMatrixSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_drawing_matrix_sources !== "function")
        throw new Error("Hwp5DrawingMatrixSourcesAbiUnavailable");
      return decodeHwp5DrawingMatrixSources(output(() => wasm.hwp5_edit_drawing_matrix_sources(index)).bytes);
    },
    drawingLocalTransforms(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_drawing_local_transforms !== "function")
        throw new Error("Hwp5DrawingLocalTransformsAbiUnavailable");
      return decodeHwp5DrawingLocalTransforms(output(() => wasm.hwp5_edit_drawing_local_transforms(index)).bytes);
    },
    drawingRectangleCorners(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_drawing_rectangle_corners !== "function")
        throw new Error("Hwp5DrawingRectangleCornersAbiUnavailable");
      return decodeHwp5DrawingRectangleCorners(output(() => wasm.hwp5_edit_drawing_rectangle_corners(index)).bytes);
    },
    drawingCurvePoints(section, layout) {
      check();
      const index = u32(section, "section"), selected = curveLayoutArg(layout);
      if (typeof wasm.hwp5_edit_drawing_curve_points !== "function")
        throw new Error("Hwp5DrawingCurvePointsAbiUnavailable");
      return decodeHwp5DrawingCurvePoints(output(() => wasm.hwp5_edit_drawing_curve_points(index, selected)).bytes);
    },
    drawingPolygonPoints(section, layout) {
      check();
      const index = u32(section, "section"), layoutId = polygonLayoutArg(layout);
      if (typeof wasm.hwp5_edit_drawing_polygon_points !== "function")
        throw new Error("Hwp5DrawingPolygonPointsAbiUnavailable");
      return decodeHwp5DrawingPolygonPoints(output(() => wasm.hwp5_edit_drawing_polygon_points(index, layoutId)).bytes);
    },
    drawingLineEndpoints(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_drawing_line_endpoints !== "function")
        throw new Error("Hwp5DrawingLineEndpointsAbiUnavailable");
      return decodeHwp5DrawingLineEndpoints(output(() => wasm.hwp5_edit_drawing_line_endpoints(index)).bytes);
    },
    noteSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_note_sources !== "function")
        throw new Error("Hwp5NoteSourcesAbiUnavailable");
      return decodeHwp5NoteSources(output(() => wasm.hwp5_edit_note_sources(index)).bytes);
    },
    drawingStyleSources(section, options) {
      check();
      const index = u32(section, "section"), [border, tail] = drawingStyleLayoutArgs(options);
      if (typeof wasm.hwp5_edit_drawing_style_sources !== "function")
        throw new Error("Hwp5DrawingStyleSourcesAbiUnavailable");
      return decodeHwp5DrawingStyleSources(output(() => wasm.hwp5_edit_drawing_style_sources(index, border, tail)).bytes);
    },
    fileVersion() {
      check();
      if (typeof wasm.hwp5_edit_file_version !== "function")
        throw new Error("Hwp5FileVersionAbiUnavailable");
      const version = wasm.hwp5_edit_file_version();
      if (version === 0)
        throw memory.error();
      return version;
    },
    pictureSources(section, prefix) {
      check();
      const index = u32(section, "section"), selection = picturePrefixArg(prefix);
      if (typeof wasm.hwp5_edit_picture_sources !== "function")
        throw new Error("Hwp5PictureSourcesAbiUnavailable");
      return decodeHwp5PictureSources(output(() => wasm.hwp5_edit_picture_sources(index, selection)).bytes);
    },
    pictureTailSources(section, layout) {
      check();
      const index = u32(section, "section"), selection = pictureTailLayoutArg(layout);
      if (typeof wasm.hwp5_edit_picture_tail_sources !== "function")
        throw new Error("Hwp5PictureTailSourcesAbiUnavailable");
      return decodeHwp5PictureTailSources(output(() => wasm.hwp5_edit_picture_tail_sources(index, selection)).bytes);
    },
    binaryResource(ordinal, options = {}) {
      check();
      if (!options || typeof options !== "object" || Array.isArray(options) || Object.keys(options).some((key) => key !== "maxBytes"))
        throw new Error("Invalid binary options");
      const { maxBytes = 32 * 1024 * 1024 } = options;
      const id = u32(ordinal, "binary ordinal"), limit = u32(maxBytes, "binary limit");
      if (id > 65535)
        throw new RangeError("Invalid binary ordinal");
      if (limit > 32 * 1024 * 1024)
        throw new RangeError("Invalid binary limit");
      if (typeof wasm.hwp5_edit_binary_resource !== "function")
        throw new Error("Hwp5BinaryResourceAbiUnavailable");
      return output(() => wasm.hwp5_edit_binary_resource(id, limit)).bytes;
    },
    automaticNumberSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_automatic_number_sources !== "function")
        throw new Error("Hwp5AutomaticNumberSourcesAbiUnavailable");
      return decodeHwp5AutomaticNumberSources(output(() => wasm.hwp5_edit_automatic_number_sources(index)).bytes);
    },
    pageControlSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_page_control_sources !== "function")
        throw new Error("Hwp5PageControlSourcesAbiUnavailable");
      return decodeHwp5PageControlSources(output(() => wasm.hwp5_edit_page_control_sources(index)).bytes);
    },
    documentProperties() {
      check();
      if (typeof wasm.hwp5_edit_document_properties !== "function")
        throw new Error("Hwp5DocumentPropertiesAbiUnavailable");
      return decodeHwp5DocumentProperties(output(() => wasm.hwp5_edit_document_properties()).bytes);
    },
    masterPageSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_master_page_sources !== "function")
        throw new Error("Hwp5MasterPageSourcesAbiUnavailable");
      return decodeHwp5MasterPageSources(output(() => wasm.hwp5_edit_master_page_sources(index)).bytes);
    },
    pageAreaSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_page_area_sources !== "function")
        throw new Error("Hwp5PageAreaSourcesAbiUnavailable");
      return decodeHwp5PageAreaSources(output(() => wasm.hwp5_edit_page_area_sources(index)).bytes);
    },
    pageSettings(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_page_settings !== "function")
        throw new Error("Hwp5PageSettingsAbiUnavailable");
      return decodeHwp5PageSettings(output(() => wasm.hwp5_edit_page_settings(index)).bytes);
    },
    sectionSettings(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_section_settings !== "function")
        throw new Error("Hwp5SectionSettingsAbiUnavailable");
      return decodeHwp5SectionSettings(output(() => wasm.hwp5_edit_section_settings(index)).bytes);
    },
    paragraphFlow(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_paragraph_flow !== "function")
        throw new Error("Hwp5ParagraphFlowAbiUnavailable");
      return decodeHwp5ParagraphFlow(output(() => wasm.hwp5_edit_paragraph_flow(index)).bytes);
    },
    columnSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_column_sources !== "function")
        throw new Error("Hwp5ColumnSourcesAbiUnavailable");
      return decodeHwp5ColumnSources(output(() => wasm.hwp5_edit_column_sources(index)).bytes);
    },
    copyText,
    fieldSpans(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_field_spans !== "function")
        throw new Error("Hwp5FieldSpansAbiUnavailable");
      return decodeHwp5FieldSpans(output(() => wasm.hwp5_edit_field_spans(index)).bytes);
    },
    supportsFieldTopology() {
      check();
      return typeof wasm.hwp5_edit_field_topology === "function";
    },
    fieldTopology(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_field_topology !== "function")
        throw new Error("Hwp5FieldTopologyAbiUnavailable");
      return decodeHwp5FieldTopology(output(() => wasm.hwp5_edit_field_topology(index)).bytes);
    },
    formulaSources(section) {
      check();
      const index = u32(section, "section");
      if (typeof wasm.hwp5_edit_formula_sources !== "function")
        throw new Error("Hwp5FormulaSourcesAbiUnavailable");
      return decodeHwp5FormulaSources(output(() => wasm.hwp5_edit_formula_sources(index)).bytes);
    },
    setFormulaDefinition({ section, sourceNode, formula }) {
      check();
      const positions = [u32(section, "section"), u32(sourceNode, "sourceNode")];
      if (typeof wasm.hwp5_edit_set_formula_definition !== "function")
        throw new Error("Hwp5FormulaDefinitionAbiUnavailable");
      if (typeof formula !== "string")
        throw new TypeError("Formula must be a string");
      if (!formula.isWellFormed())
        throw new Error("InvalidUnicodeEncoding");
      if (formula.length > 4096)
        throw new RangeError("LimitExceeded");
      const bytes = encoder3.encode(formula);
      if (bytes.length > 4096)
        throw new RangeError("LimitExceeded");
      memory.withBytes(bytes, (ptr, size) => success(wasm.hwp5_edit_set_formula_definition(...positions, ptr, size)));
    },
    text(section, paragraph) {
      check();
      return decoder6.decode(copyText(section, paragraph));
    },
    splice({ section, paragraph, startUnit, endUnit, text, rangePolicy = "reject" }) {
      check();
      const values = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        u32(startUnit, "startUnit"),
        u32(endUnit, "endUnit")
      ];
      if (typeof text !== "string")
        throw new TypeError("Text must be a string");
      if (!text.isWellFormed())
        throw new Error("InvalidUnicodeEncoding");
      if (rangePolicy !== "reject" && rangePolicy !== "half-open")
        throw new Error("InvalidRangePolicy");
      if (text.length > 4 * 1024 * 1024)
        throw new RangeError("LimitExceeded");
      const bytes = encoder3.encode(text);
      if (bytes.length > 4 * 1024 * 1024)
        throw new RangeError("LimitExceeded");
      memory.withBytes(bytes, (ptr, size) => success(wasm.hwp5_edit_splice(...values, ptr, size, rangePolicy === "half-open" ? 1 : 0)));
    },
    splitParagraph({ section, paragraph, atUnit, endUnit = atUnit }) {
      check();
      const values = [u32(section, "section"), u32(paragraph, "paragraph"), u32(atUnit, "atUnit")];
      u32(endUnit, "endUnit");
      if (endUnit < atUnit)
        throw new RangeError("InvalidTextPosition");
      if (endUnit !== atUnit) {
        if (typeof wasm.hwp5_edit_split_range !== "function")
          throw new Error("Hwp5StructureAbiUnavailable");
        success(wasm.hwp5_edit_split_range(...values, endUnit));
        return;
      }
      if (typeof wasm.hwp5_edit_split !== "function")
        throw new Error("Hwp5StructureAbiUnavailable");
      success(wasm.hwp5_edit_split(...values));
    },
    mergeParagraph({ section, paragraph }) {
      check();
      const values = [u32(section, "section"), u32(paragraph, "paragraph")];
      if (typeof wasm.hwp5_edit_merge !== "function")
        throw new Error("Hwp5StructureAbiUnavailable");
      success(wasm.hwp5_edit_merge(...values));
    },
    setCharacterFormat({ section, paragraph, startUnit, endUnit, charShapeId }) {
      check();
      success(wasm.hwp5_edit_format(u32(section, "section"), u32(paragraph, "paragraph"), u32(startUnit, "startUnit"), u32(endUnit, "endUnit"), u32(charShapeId, "charShapeId")));
    },
    setCharacterProperties({ section, paragraph, startUnit, endUnit, properties }) {
      check();
      const positions = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        u32(startUnit, "startUnit"),
        u32(endUnit, "endUnit")
      ];
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const args = characterPropertyArgs(properties);
      if (typeof wasm.hwp5_edit_set_character_properties !== "function")
        throw new Error("Hwp5CharacterPropertiesAbiUnavailable");
      success(wasm.hwp5_edit_set_character_properties(...positions, ...args));
    },
    replaceParagraphRangesWithFontName({ ranges, text, language, name, properties }) {
      check();
      const bytes = encodeCharacterRanges(ranges), inserted = encodeParagraphReplacement(text), font = characterFontNameArgs(language, name);
      const args = properties === undefined ? null : characterPropertyArgs(properties);
      const action = args ? wasm.hwp5_edit_replace_paragraph_ranges_font_name_properties : wasm.hwp5_edit_replace_paragraph_ranges_font_name;
      if (typeof action !== "function")
        throw new Error(args ? "Hwp5NamedFontPropertyReplacementAbiUnavailable" : "Hwp5NamedFontReplacementAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => memory.withBytes(inserted, (tp, ts) => memory.withBytes(font.bytes, (np, ns) => success(action(ptr, size, tp, ts, font.language, np, ns, ...args ?? [])))));
    },
    replaceParagraphRanges({ ranges, text, properties }) {
      check();
      const bytes = encodeCharacterRanges(ranges), inserted = encodeParagraphReplacement(text);
      const args = properties === undefined ? null : characterPropertyArgs(properties);
      const action = args ? wasm.hwp5_edit_replace_paragraph_ranges_properties : wasm.hwp5_edit_replace_paragraph_ranges;
      if (typeof action !== "function")
        throw new Error(args ? "Hwp5PropertyReplacementAbiUnavailable" : "Hwp5ParagraphReplacementAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => memory.withBytes(inserted, (tp, ts) => success(action(ptr, size, tp, ts, ...args ?? []))));
    },
    setCharacterStrikeRanges({ ranges, enabled }) {
      check();
      const bytes = encodeCharacterRanges(ranges);
      if (typeof enabled !== "boolean")
        throw new TypeError("InvalidCharacterProperties");
      if (typeof wasm.hwp5_edit_set_character_strike_ranges !== "function")
        throw new Error("Hwp5CharacterStrikeRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => success(wasm.hwp5_edit_set_character_strike_ranges(ptr, size, Number(enabled))));
    },
    setCharacterUnderlineRanges({ ranges, kind }) {
      check();
      const bytes = encodeCharacterRanges(ranges), value = characterUnderlineArg(kind);
      if (typeof wasm.hwp5_edit_set_character_underline_ranges !== "function")
        throw new Error("Hwp5CharacterUnderlineRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwp5_edit_set_character_underline_ranges(ptr, size, value))
          throw memory.error();
      });
    },
    setCharacterPropertiesRanges({ ranges, properties }) {
      check();
      const bytes = encodeCharacterRanges(ranges);
      const args = characterPropertyArgs(properties);
      if (typeof wasm.hwp5_edit_set_character_properties_ranges !== "function")
        throw new Error("Hwp5CharacterPropertiesRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => success(wasm.hwp5_edit_set_character_properties_ranges(ptr, size, ...args)));
    },
    setCharacterFontNameRanges({ ranges, language, name }) {
      check();
      const bytes = encodeCharacterRanges(ranges), args = characterFontNameArgs(language, name);
      if (typeof wasm.hwp5_edit_set_character_font_name_ranges !== "function")
        throw new Error("Hwp5CharacterFontNameRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => memory.withBytes(args.bytes, (namePtr, nameSize) => {
        if (!wasm.hwp5_edit_set_character_font_name_ranges(ptr, size, args.language, namePtr, nameSize))
          throw memory.error();
      }));
    },
    setCharacterFontRanges({ ranges, language, fontId }) {
      check();
      const bytes = encodeCharacterRanges(ranges), args = characterFontArgs(language, fontId);
      if (fontId > 65535)
        throw new RangeError("InvalidFontId");
      if (typeof wasm.hwp5_edit_set_character_font_ranges !== "function")
        throw new Error("Hwp5CharacterFontRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => success(wasm.hwp5_edit_set_character_font_ranges(ptr, size, ...args)));
    },
    setCharacterTextColorRanges({ ranges, color }) {
      check();
      const bytes = encodeCharacterRanges(ranges), value = characterColorArg(color);
      if (typeof wasm.hwp5_edit_set_character_text_color_ranges !== "function")
        throw new Error("Hwp5CharacterTextColorRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => success(wasm.hwp5_edit_set_character_text_color_ranges(ptr, size, value)));
    },
    setCharacterShadeRanges({ ranges, color }) {
      check();
      const bytes = encodeCharacterRanges(ranges), args = characterShadeArgs(color);
      if (typeof wasm.hwp5_edit_set_character_shade_ranges !== "function")
        throw new Error("Hwp5CharacterShadeRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => success(wasm.hwp5_edit_set_character_shade_ranges(ptr, size, ...args)));
    },
    setCharacterEffectRanges({ ranges, effect, enabled, exclusive = false }) {
      check();
      const bytes = encodeCharacterRanges(ranges), args = characterEffectArgs(effect, enabled);
      const method = characterEffectMode(exclusive) ? wasm.hwp5_edit_set_character_effect_ranges_exclusive : wasm.hwp5_edit_set_character_effect_ranges;
      if (typeof method !== "function")
        throw new Error(exclusive ? "Hwp5CharacterEffectRangesExclusiveAbiUnavailable" : "Hwp5CharacterEffectRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => success(method(ptr, size, ...args)));
    },
    setCharacterOutlineRanges({ ranges, kind }) {
      check();
      const bytes = encodeCharacterRanges(ranges), value = hwp5CharacterOutlineArg(kind);
      const action = value > 1 ? wasm.hwp5_edit_set_character_outline_ranges_extended : wasm.hwp5_edit_set_character_outline_ranges;
      if (typeof action !== "function")
        throw new Error(value > 1 ? "Hwp5CharacterOutlineRangesExtendedAbiUnavailable" : "Hwp5CharacterOutlineRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => success(action(ptr, size, value)));
    },
    setCharacterStrike({ section, paragraph, startUnit, endUnit, enabled }) {
      check();
      const positions = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        u32(startUnit, "startUnit"),
        u32(endUnit, "endUnit")
      ];
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      if (typeof enabled !== "boolean")
        throw new TypeError("InvalidCharacterProperties");
      if (typeof wasm.hwp5_edit_set_character_strike !== "function")
        throw new Error("Hwp5CharacterStrikeAbiUnavailable");
      success(wasm.hwp5_edit_set_character_strike(...positions, Number(enabled)));
    },
    setCharacterUnderline({ section, paragraph, startUnit, endUnit, kind }) {
      check();
      const positions = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        u32(startUnit, "startUnit"),
        u32(endUnit, "endUnit")
      ];
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const value = characterUnderlineArg(kind);
      if (typeof wasm.hwp5_edit_set_character_underline !== "function")
        throw new Error("Hwp5CharacterUnderlineAbiUnavailable");
      success(wasm.hwp5_edit_set_character_underline(...positions, value));
    },
    setCharacterStrikeColor({ section, paragraph, startUnit, endUnit, color }) {
      check();
      const positions = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        u32(startUnit, "startUnit"),
        u32(endUnit, "endUnit")
      ];
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const value = characterColorArg(color);
      if (typeof wasm.hwp5_edit_set_character_strike_color !== "function")
        throw new Error("Hwp5CharacterStrikeColorAbiUnavailable");
      success(wasm.hwp5_edit_set_character_strike_color(...positions, value));
    },
    setCharacterUnderlineColor({ section, paragraph, startUnit, endUnit, color }) {
      check();
      const positions = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        u32(startUnit, "startUnit"),
        u32(endUnit, "endUnit")
      ];
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const value = characterColorArg(color);
      if (typeof wasm.hwp5_edit_set_character_underline_color !== "function")
        throw new Error("Hwp5CharacterUnderlineColorAbiUnavailable");
      success(wasm.hwp5_edit_set_character_underline_color(...positions, value));
    },
    setCharacterFont({ section, paragraph, startUnit, endUnit, language, fontId }) {
      check();
      const positions = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        u32(startUnit, "startUnit"),
        u32(endUnit, "endUnit")
      ];
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const args = characterFontArgs(language, fontId);
      if (fontId > 65535)
        throw new RangeError("InvalidFontId");
      if (typeof wasm.hwp5_edit_set_character_font !== "function")
        throw new Error("Hwp5CharacterFontAbiUnavailable");
      success(wasm.hwp5_edit_set_character_font(...positions, ...args));
    },
    setCharacterFontName({ section, paragraph, startUnit, endUnit, language, name }) {
      check();
      const positions = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        u32(startUnit, "startUnit"),
        u32(endUnit, "endUnit")
      ];
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const args = characterFontNameArgs(language, name);
      if (typeof wasm.hwp5_edit_set_character_font_name !== "function")
        throw new Error("Hwp5CharacterFontNameAbiUnavailable");
      memory.withBytes(args.bytes, (ptr, size) => success(wasm.hwp5_edit_set_character_font_name(...positions, args.language, ptr, size)));
    },
    spliceWithCharacterProperties(input) {
      check();
      const { positions, bytes } = textTransactionArgs(input);
      const properties = characterPropertyArgs(input.properties);
      const action = wasm.hwp5_edit_splice_character_properties;
      if (typeof action !== "function")
        throw new Error("Hwp5CharacterPropertyTextAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => success(action(...positions, ptr, size, ...properties)));
    },
    spliceWithFontName(input) {
      check();
      const { positions, bytes, font } = namedFontTextArgs(input);
      const properties = input.properties === undefined ? null : characterPropertyArgs(input.properties);
      const action = properties ? wasm.hwp5_edit_splice_font_name_properties : wasm.hwp5_edit_splice_font_name;
      if (typeof action !== "function")
        throw new Error(properties ? "Hwp5NamedFontPropertyTextAbiUnavailable" : "Hwp5NamedFontTextAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => memory.withBytes(font.bytes, (namePtr, nameSize) => success(action(...positions, ptr, size, font.language, namePtr, nameSize, ...properties ?? []))));
    },
    setCharacterTextColor({ section, paragraph, startUnit, endUnit, color }) {
      check();
      const positions = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        u32(startUnit, "startUnit"),
        u32(endUnit, "endUnit")
      ];
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const value = characterColorArg(color);
      if (typeof wasm.hwp5_edit_set_character_text_color !== "function")
        throw new Error("Hwp5CharacterTextColorAbiUnavailable");
      success(wasm.hwp5_edit_set_character_text_color(...positions, value));
    },
    setCharacterShade({ section, paragraph, startUnit, endUnit, color }) {
      check();
      const positions = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        u32(startUnit, "startUnit"),
        u32(endUnit, "endUnit")
      ];
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const args = characterShadeArgs(color);
      if (typeof wasm.hwp5_edit_set_character_shade !== "function")
        throw new Error("Hwp5CharacterShadeAbiUnavailable");
      success(wasm.hwp5_edit_set_character_shade(...positions, ...args));
    },
    setCharacterEffect({
      section,
      paragraph,
      startUnit,
      endUnit,
      effect,
      enabled,
      exclusive = false
    }) {
      check();
      const positions = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        u32(startUnit, "startUnit"),
        u32(endUnit, "endUnit")
      ];
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const args = characterEffectArgs(effect, enabled);
      const method = characterEffectMode(exclusive) ? wasm.hwp5_edit_set_character_effect_exclusive : wasm.hwp5_edit_set_character_effect;
      if (typeof method !== "function")
        throw new Error(exclusive ? "Hwp5CharacterEffectExclusiveAbiUnavailable" : "Hwp5CharacterEffectAbiUnavailable");
      success(method(...positions, ...args));
    },
    setCharacterOutline({ section, paragraph, startUnit, endUnit, kind }) {
      check();
      const positions = [
        u32(section, "section"),
        u32(paragraph, "paragraph"),
        u32(startUnit, "startUnit"),
        u32(endUnit, "endUnit")
      ];
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const value = hwp5CharacterOutlineArg(kind);
      const action = value > 1 ? wasm.hwp5_edit_set_character_outline_extended : wasm.hwp5_edit_set_character_outline;
      if (typeof action !== "function")
        throw new Error(value > 1 ? "Hwp5CharacterOutlineExtendedAbiUnavailable" : "Hwp5CharacterOutlineAbiUnavailable");
      success(action(...positions, value));
    },
    save({ allowStaleLayout = false } = {}) {
      check();
      if (typeof allowStaleLayout !== "boolean")
        throw new TypeError("allowStaleLayout must be boolean");
      return output(() => wasm.hwp5_edit_save(allowStaleLayout ? 1 : 0));
    },
    close() {
      if (!closed)
        wasm.hwp5_edit_close();
      closed = true;
    }
  };
}

export { validateHwp5FieldSpans, validateHwp5FieldTopology, validateHwp5TextSourceProtection, decodeHwp5Text, createExperimentalHwp5Editor2 };
