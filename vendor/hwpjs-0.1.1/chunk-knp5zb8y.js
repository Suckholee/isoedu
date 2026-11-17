import {
  paragraphMarginArgs,
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
  decodeCreatedTables,
  decodeTableCreationResources,
  captureTableInitialTexts,
  encodeTableTextRequest
} from "./chunk-d6j1r7hv.js";
import {
  characterEffectMode,
  characterEffectArgs,
  characterOutlineArg,
  createdTableIdentity
} from "./chunk-6ffsr0y9.js";
import {
  decodeFontFaces,
  paragraphSpacingArgs,
  characterColorArg
} from "./chunk-jk4tbr51.js";
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
  decodeTableCaption,
  validateShapeSourceValues,
  validDrawingTextValues,
  decodeDrawingTextSnapshot,
  decodeLineGeometry,
  decodePictureGeometry,
  decodePicturePosition,
  decodePictureFlow,
  decodeDrawingPlacement,
  decodeLinePlacement,
  decodeLineNodes,
  decodeLineDisplay,
  decodeFillBrushes,
  decodeTableBorderSources,
  validShapeCommonSource,
  decodeSectionTabs,
  decodePictureOwners,
  decodePageAreaDeclarations,
  decodeHwpxFontFaceMetadata,
  decodeHwpxParagraphShapes,
  decodeDrawingTextBindings,
  decodeDrawingTextSnapshots,
  decodeContainerSource,
  decodeRectangleRenderingSource,
  decodeRectangleRenderingSources,
  decodeEllipseSources,
  decodePictureSites,
  decodePictureOwner,
  decodePictureRenderingCorners,
  decodeConnectorNodes,
  decodeConnectorSource,
  decodeConnectorOwner,
  decodeConnectorRenderingSource,
  decodeDrawingStrokeSource,
  decodeParagraphFlow,
  decodePageSettings,
  decodeNoteShapes,
  decodeTablePagination,
  decodeTableGeometry,
  decodeCaptionBindings,
  decodeTableCaptionBindings,
  decodeNoteReferenceSites,
  decodeParagraphTextSnapshot,
  decodeFormulaFieldSources,
  decodeTableCellMargin,
  decodePictureCrop,
  decodePictureTransform
} from "./chunk-mff70c55.js";
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
import {
  validShapeLayoutValues,
  validGroupContext,
  decodeTabSources,
  decodeTabDefinitions,
  object,
  uint2,
  text,
  nullableUint,
  oneOf,
  field,
  number,
  scaling,
  validChartView3D,
  decodeDocumentProvenance
} from "./chunk-wvrkyaca.js";

// js/hwpx-drawing-text-requested.mjs
var uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
function drawingTextRequest(nodes, limit) {
  if (!uint(limit) || limit < 1 || limit > 1024)
    throw Error("InvalidDrawingTextRequestLimit");
  if (!Array.isArray(nodes))
    throw Error("InvalidDrawingTextRequest");
  const count = nodes.length;
  if (!uint(count) || count > limit)
    throw Error("InvalidDrawingTextRequest");
  const requested = [];
  for (let index = 0;index < count; index++) {
    if (!Object.hasOwn(nodes, index))
      throw Error("InvalidDrawingTextRequest");
    const node = nodes[index];
    if (!uint(node))
      throw Error("InvalidDrawingTextRequest");
    requested.push(node);
  }
  if (nodes.length !== count)
    throw Error("InvalidDrawingTextRequest");
  return { requested, bytes: new TextEncoder().encode(JSON.stringify(requested)) };
}
function decodeDrawingTextRequested(bytes, requested) {
  const fail = () => {
    throw Error("InvalidDrawingTextRequested");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length > 1024 * (65536 + 256) + 2)
    fail();
  let rows;
  try {
    rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  if (!Array.isArray(rows) || rows.length !== requested.length || rows.length > 1024)
    fail();
  const encoder = new TextEncoder;
  return rows.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row) || row.node !== requested[index] || Object.keys(row).length !== 2)
      fail();
    if (Object.hasOwn(row, "unavailable")) {
      if (typeof row.unavailable !== "string" || !/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(row.unavailable) || row.unavailable === "OutOfMemory")
        fail();
      return { node: row.node, unavailable: row.unavailable };
    }
    if (!Object.hasOwn(row, "source"))
      fail();
    const source = decodeDrawingTextSnapshot(encoder.encode(JSON.stringify(row.source)));
    if (source.drawing_node !== row.node)
      fail();
    return { node: row.node, source };
  });
}

// js/u32-index-request.mjs
function encodeU32IndexRequest(indices, limit, limitError, requestError) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!uint(limit) || limit === 0)
    throw Error(limitError);
  if (!Array.isArray(indices) || indices.length > limit)
    throw RangeError(requestError);
  for (let at = 0;at < indices.length; at++)
    if (!Object.hasOwn(indices, at) || !uint(indices[at]))
      throw RangeError(requestError);
  const bytes = new Uint8Array(4 + indices.length * 4), view = new DataView(bytes.buffer);
  view.setUint32(0, indices.length, true);
  indices.forEach((index, at) => view.setUint32(4 + at * 4, index, true));
  return bytes;
}

// js/hwpx-line-display-batch.mjs
function encodeLineDisplayNodes(nodes, limit) {
  return encodeU32IndexRequest(nodes, limit, "InvalidLineDisplayBatchLimit", "InvalidLineDisplayBatchNodes");
}
var errorName = (value) => typeof value === "string" && /^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(value) && value !== "OutOfMemory";
function decodeLineDisplayBatch(bytes, nodes) {
  const fail = () => {
    throw Error("InvalidLineDisplayBatch");
  };
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!Array.isArray(rows) || rows.length !== nodes.length)
    fail();
  return rows.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row) || row.node !== nodes[index])
      fail();
    if (Object.hasOwn(row, "error")) {
      if (Object.keys(row).length !== 2 || !errorName(row.error))
        fail();
      return row;
    }
    if (Object.keys(row).length !== 3 || !Object.hasOwn(row, "geometry"))
      fail();
    const geometry = decodeLineGeometry(new TextEncoder().encode(JSON.stringify(row.geometry)), nodes[index]);
    if (Object.hasOwn(row, "displayError")) {
      if (!errorName(row.displayError))
        fail();
      return { node: row.node, geometry, displayError: row.displayError };
    }
    if (!Array.isArray(row.display) || row.display.length !== 72 || !row.display.every((n) => Number.isInteger(n) && n >= 0 && n <= 255))
      fail();
    const display = decodeLineDisplay(Uint8Array.from(row.display)), g = geometry.geometry;
    if (display.lineNode !== row.node || display.paragraph !== g.paragraph || display.anchorNode !== g.anchor_node || display.anchorUnit !== g.anchor_unit || display.endpoints.some((p, i) => p.some((n, j) => n !== g.endpoints[i][j])))
      fail();
    return { node: row.node, geometry, display };
  });
}

// js/hwpx-table-border-batch.mjs
var uint3 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
function encodeTableBorderSections(sections, limit) {
  return encodeU32IndexRequest(sections, limit, "InvalidTableBorderBatchLimit", "InvalidTableBorderSections");
}
function decodeTableBorderBatch(bytes, sections) {
  const fail = () => {
    throw Error("InvalidTableBorderBatch");
  };
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!Array.isArray(value) || value.length !== sections.length)
    fail();
  for (const [index, entry] of value.entries()) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || entry.section !== sections[index] || !uint3(entry.section))
      fail();
    if (Object.hasOwn(entry, "error")) {
      if (Object.hasOwn(entry, "value") || Object.keys(entry).length !== 2 || typeof entry.error !== "string" || !/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(entry.error) || entry.error === "OutOfMemory")
        fail();
    } else {
      if (Object.keys(entry).length !== 2 || !Object.hasOwn(entry, "value"))
        fail();
      entry.value = decodeTableBorderSources(new TextEncoder().encode(JSON.stringify(entry.value)));
    }
  }
  return value;
}

// js/hwpx-curve-geometry.mjs
var object2 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var uint4 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var coordinate = (value) => value === null || Number.isInteger(value) && value >= -2147483648 && value <= 4294967295;
function decodeCurveGeometry(bytes) {
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!object2(value) || value.sourceOnly !== true || !uint4(value.node) || Object.hasOwn(value, "common") && (!validShapeCommonSource(value.common) || !validGroupContext(value.common.group_context, value.node)) || Object.hasOwn(value, "text") && value.text !== null && !validDrawingTextValues(value.text, value.node) || !Array.isArray(value.segments) || value.segments.length > 65536 || !Array.from(value.segments).every((segment) => object2(segment) && (segment.kind === null || typeof segment.kind === "string" && new TextEncoder().encode(segment.kind).length <= 4096) && ["x1", "y1", "x2", "y2"].every((key) => coordinate(segment[key]))))
    throw new Error("InvalidCurveGeometry");
  return value;
}

// js/hwpx-curve-owner.mjs
var uint5 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var object3 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
function decodeCurveOwner(bytes) {
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const owner = value?.owner;
  if (!object3(value) || value.sourceOnly !== true || !uint5(value.node) || owner !== null && (!object3(owner) || ![owner.paragraph, owner.anchor_node, owner.anchor_unit].every(uint5) || owner.paragraph === 0 || owner.anchor_node >= value.node))
    throw new Error("InvalidCurveOwner");
  return value;
}

// js/equation-engine.mjs
function createEquationEngine(wasm) {
  for (const name of [
    "equation_process",
    "equation_output_ptr",
    "equation_output_len",
    "equation_output_free",
    "equation_error_ptr",
    "equation_error_len"
  ])
    if (typeof wasm?.[name] !== "function")
      throw new Error("EquationEngineAbiUnavailable");
  const memory = createMemory(wasm);
  const encoder = new TextEncoder, decoder = new TextDecoder("utf-8", { fatal: true });
  function run(operation, source, settings, extra = {}) {
    if (typeof source !== "string" || !source.isWellFormed())
      throw new Error("InvalidEquationSource");
    if (source.length > 1024 * 1024)
      throw new Error("EquationProtocolLimitExceeded");
    for (const key of ["size", "script_scale", "fraction_scale"])
      if (!Number.isFinite(settings?.[key]) || settings[key] <= 0)
        throw new Error("InvalidEquationMeasurementSize");
    if (settings.allow_unclosed_groups !== undefined && typeof settings.allow_unclosed_groups !== "boolean")
      throw new Error("InvalidEquationRecoveryPolicy");
    const json = JSON.stringify({
      operation,
      source,
      size: settings.size,
      script_scale: settings.script_scale,
      fraction_scale: settings.fraction_scale,
      ...settings.allow_unclosed_groups === true ? { allow_unclosed_groups: true } : {},
      ...extra
    });
    if (json.length > 16 * 1024 * 1024)
      throw new Error("EquationProtocolLimitExceeded");
    const input = encoder.encode(json);
    if (input.length > 16 * 1024 * 1024)
      throw new Error("EquationProtocolLimitExceeded");
    try {
      return memory.withBytes(input, (ptr, size) => {
        if (!wasm.equation_process(ptr, size))
          throw new Error(decoder.decode(memory.copy(wasm.equation_error_ptr(), wasm.equation_error_len())));
        const length = wasm.equation_output_len();
        if (!Number.isInteger(length) || length < 0 || length > 32 * 1024 * 1024)
          throw new Error("InvalidEquationOutputLength");
        return JSON.parse(decoder.decode(memory.copy(wasm.equation_output_ptr(), length)));
      });
    } finally {
      wasm.equation_output_free();
    }
  }
  return {
    measure: (source, settings) => run("measure", source, settings),
    layout: (source, settings, measurements, layout) => run("layout", source, settings, { measurements, layout })
  };
}

// js/hwpx-equation-styles.mjs
function decodeEquationStyles(bytes) {
  const fail = () => {
    throw new Error("InvalidHwpxEquationStyles");
  };
  let rows;
  try {
    rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  if (!Array.isArray(rows) || rows.length > 1e5)
    return fail();
  const seen = new Set;
  const sizes = new Set, uint = (n) => Number.isInteger(n) && n >= 0 && n <= 4294967295;
  for (const row of rows) {
    if (!Number.isInteger(row?.node) || row.node < 0 || row.node > 4294967295 || seen.has(row.node))
      return fail();
    seen.add(row.node);
    for (const key of ["font", "base_unit", "base_line", "text_color", "line_mode", "error_name"])
      if (row[key] !== null && (typeof row[key] !== "string" || !row[key].isWellFormed() || row[key].length > 4096))
        return fail();
    if (row.error_name !== null && !/^[A-Za-z][A-Za-z0-9_]{0,127}$/.test(row.error_name))
      return fail();
    if (row.error_name !== null && ["font", "base_unit", "base_line", "text_color", "line_mode"].some((key) => row[key] !== null))
      return fail();
    if (row.size_error !== undefined && row.size_error !== null && (typeof row.size_error !== "string" || !/^[A-Za-z][A-Za-z0-9_]{0,127}$/.test(row.size_error) || row.source_size !== null))
      return fail();
    const size = row.source_size;
    if (size !== undefined && size !== null) {
      if (!size || typeof size !== "object" || Array.isArray(size) || !uint(size.node) || size.node <= row.node || sizes.has(size.node) || !uint(size.other_attributes) || !uint(size.direct_children) || row.error_name !== null || ["width", "height", "width_relative_to", "height_relative_to", "protect"].some((key) => size[key] !== null && (typeof size[key] !== "string" || !size[key].isWellFormed() || size[key].length > 4096)))
        return fail();
      sizes.add(size.node);
    }
  }
  return rows;
}

// js/chart-point-batch.mjs
function readChartPointBatchLimits(wasm) {
  if (![
    "hwpx_edit_set_chart_points",
    "hwpx_edit_chart_point_batch_max_edits",
    "hwpx_edit_chart_point_batch_max_bytes",
    "hwpx_edit_chart_point_max_bytes"
  ].every((name) => typeof wasm[name] === "function"))
    throw new Error("HwpxChartBatchEditAbiUnavailable");
  const limits = {
    maxEdits: wasm.hwpx_edit_chart_point_batch_max_edits(),
    maxBytes: wasm.hwpx_edit_chart_point_batch_max_bytes(),
    maxValueBytes: wasm.hwpx_edit_chart_point_max_bytes()
  };
  validateLimits(limits);
  if (!Number.isInteger(limits.maxValueBytes) || limits.maxValueBytes <= 0 || limits.maxValueBytes > 4294967295)
    throw new Error("InvalidChartBatchLimit");
  return limits;
}
function validateLimits({ maxEdits, maxBytes }) {
  if (!Number.isInteger(maxEdits) || maxEdits <= 0 || maxEdits > 4294967295 || !Number.isInteger(maxBytes) || maxBytes < 4 || maxBytes > 4294967295)
    throw new Error("InvalidChartBatchLimit");
}
function encodeChartPointBatch(edits, { maxEdits, maxBytes }, encodeValue) {
  validateLimits({ maxEdits, maxBytes });
  if (!Array.isArray(edits))
    throw new TypeError("InvalidChartPointBatch");
  if (edits.length > maxEdits)
    throw new RangeError("LimitExceeded");
  const seen = new Set, rows = [];
  let size = 4;
  for (const edit of edits) {
    if (!edit || typeof edit !== "object" || Array.isArray(edit))
      throw new TypeError("InvalidChartPointBatch");
    const { point, value } = edit;
    if (!Number.isInteger(point) || point < 0 || point > 4294967295)
      throw new RangeError("InvalidInteger");
    if (seen.has(point))
      throw new Error("DuplicateChartPointEdit");
    seen.add(point);
    const bytes = encodeValue(value);
    if (!(bytes instanceof Uint8Array))
      throw new TypeError("InvalidChartPointBytes");
    size += 8 + bytes.length;
    if (!Number.isSafeInteger(size) || size > maxBytes)
      throw new RangeError("LimitExceeded");
    rows.push({ point, bytes });
  }
  const output = new Uint8Array(size), view = new DataView(output.buffer);
  view.setUint32(0, rows.length, true);
  let offset = 4;
  for (const row of rows) {
    view.setUint32(offset, row.point, true);
    view.setUint32(offset + 4, row.bytes.length, true);
    output.set(row.bytes, offset + 8);
    offset += 8 + row.bytes.length;
  }
  return output;
}

// js/hwpx-chart-series-text.mjs
function decodeChartSeriesText(bytes) {
  return validateChartSeriesText(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}
function validateChartSeriesText(value) {
  if (value?.kind !== "direct_series" || !Array.isArray(value.values))
    throw new Error("InvalidChartSeriesText");
  const seen = new Set;
  for (const row of value.values) {
    if (!row || ![row.series_node, row.text_node, row.value_node].every((n) => Number.isInteger(n) && n >= 0 && n <= 4294967295) || !(row.series_node < row.text_node && row.text_node < row.value_node) || typeof row.text !== "string" || !row.text.isWellFormed() || seen.has(row.value_node))
      throw new Error("InvalidChartSeriesText");
    seen.add(row.value_node);
  }
  return value;
}

// js/hwpx-chart-rich-text.mjs
function decodeChartRichText(bytes) {
  return validateChartRichText(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}
function validateChartRichText(value) {
  if (value?.kind !== "rich_text" || !Array.isArray(value.values))
    throw new Error("InvalidChartRichText");
  let previousLeaf = -1;
  const runs = new Set;
  for (const row of value.values) {
    if (row?.owner_role !== undefined && !["chart_title", "axis_title", "data_label", "unclassified"].includes(row.owner_role))
      throw new Error("InvalidChartRichText");
    if (row?.plain_text_complete !== undefined && (typeof row.plain_text_complete !== "boolean" || row.owner_role === undefined))
      throw new Error("InvalidChartRichText");
    const nodes = row && [
      row.owner_node,
      row.text_node,
      row.rich_node,
      row.paragraph_node,
      row.run_node,
      row.value_node
    ];
    if (!nodes || !nodes.every((n) => Number.isInteger(n) && n >= 0 && n <= 4294967295) || !nodes.every((n, i) => i === 0 || nodes[i - 1] < n) || row.value_node <= previousLeaf || runs.has(row.run_node) || typeof row.text !== "string" || !row.text.isWellFormed())
      throw new Error("InvalidChartRichText");
    previousLeaf = row.value_node;
    runs.add(row.run_node);
  }
  return value;
}

// js/chart-display-host.mjs
var optional = (accepts) => (value) => value === null || accepts(value);
var bounded = (max) => (value) => uint2(value) && value <= max;
var boolean = (value) => typeof value === "boolean";
var offset = (value) => Number.isInteger(value) && value >= -2147483648 && value <= 4294967295;
function chartDisplayHost(value, wrapper) {
  if (!object(value) || value.wrapper_node !== wrapper || !uint2(value.chart_node) || value.chart_node <= wrapper)
    return false;
  const { geometry: g, position: p } = value;
  return object(g) && object(p) && [g.width, g.height].every(optional(uint2)) && optional(bounded(4))(g.width_relative) && optional(bounded(2))(g.height_relative) && optional(boolean)(g.treat_as_character) && [g.horizontal_offset, g.vertical_offset].every(optional(offset)) && Array.isArray(p.flags) && p.flags.length === 4 && p.flags.every(optional(boolean)) && Array.isArray(p.relations) && p.relations.length === 4 && p.relations.every((v, i) => optional(bounded([2, 3, 4, 4][i]))(v));
}

// js/chart-series-settings.mjs
var symbols = [
  "auto",
  "circle",
  "dash",
  "diamond",
  "dot",
  "none",
  "picture",
  "plus",
  "square",
  "star",
  "triangle",
  "x"
];
function validChartSeriesSettings(values, plots, series, occupied = null) {
  if (!Array.isArray(values) || values.length !== series.size)
    return false;
  let index = 0;
  for (const [node, plotNode] of series) {
    const row = values[index++], kind = plots.get(plotNode)?.kind;
    if (!object(row) || row.series_node !== node || row.plot_node !== plotNode || !field(row.smooth, (v) => typeof v === "boolean", node))
      return false;
    if (!field(row.index, uint2, node) || !field(row.order, uint2, node))
      return false;
    const line = ["lineChart", "line3DChart", "stockChart", "scatterChart"].includes(kind);
    if (row.smooth !== null && !line)
      return false;
    if (!field(row.explosion, uint2, node))
      return false;
    if (row.explosion !== null && !["pieChart", "pie3DChart", "ofPieChart", "doughnutChart"].includes(kind))
      return false;
    const marker = row.marker;
    if (marker !== null && (!line && kind !== "radarChart" || !object(marker) || !uint2(marker.node) || marker.node <= node || !field(marker.symbol, oneOf(symbols), marker.node) || !field(marker.size, (v) => uint2(v) && v >= 2 && v <= 72, marker.node)))
      return false;
    const leaves = [
      row.index,
      row.order,
      row.smooth,
      row.explosion,
      ...marker ? [marker, marker.symbol, marker.size] : []
    ].filter((value) => value !== null);
    const stroke = row.stroke, strokeNodes = [];
    if (stroke !== undefined && stroke !== null) {
      if (!object(stroke) || !uint2(stroke.node) || stroke.node <= node || !(stroke.no_fill_node === null || uint2(stroke.no_fill_node) && stroke.no_fill_node > stroke.node))
        return false;
      strokeNodes.push(stroke.node);
      if (stroke.no_fill_node !== null)
        strokeNodes.push(stroke.no_fill_node);
    }
    const identities = [...leaves.map((value) => value.node), ...strokeNodes];
    if (new Set(identities).size !== identities.length)
      return false;
    for (const leaf of leaves)
      occupied?.add(leaf.node);
  }
  return true;
}

// js/chart-point-settings.mjs
function validChartPointSettings(values, series, occupied = null) {
  if (!Array.isArray(values))
    return false;
  let previous = -1;
  for (const row of values) {
    if (!object(row) || !uint2(row.node) || row.node <= previous || !series.has(row.series_node) || series.get(row.series_node) !== row.plot_node || row.node <= row.series_node || typeof row.unparsed_children !== "boolean" || !field(row.index, uint2, row.node) || !field(row.explosion, uint2, row.node))
      return false;
    if (row.index !== null && row.explosion !== null && row.index.node === row.explosion.node)
      return false;
    occupied?.add(row.node);
    if (row.index !== null)
      occupied?.add(row.index.node);
    if (row.explosion !== null)
      occupied?.add(row.explosion.node);
    previous = row.node;
  }
  return true;
}

// js/chart-stock-settings.mjs
function validChartStockSettings(stock, kind, plotNode, usedNodes) {
  if (kind !== "stockChart")
    return stock === null;
  if (!object(stock))
    return false;
  for (const key of ["high_low_node", "up_down_node", "up_node", "down_node"])
    if (!nullableUint(stock[key]))
      return false;
  if (stock.up_down_node === null && (stock.up_node !== null || stock.down_node !== null || stock.gap_width !== null))
    return false;
  const parent = stock.up_down_node ?? plotNode;
  if (!field(stock.gap_width, (value) => uint2(value) && value <= 500, parent))
    return false;
  for (const key of ["up_node", "down_node"])
    if (stock[key] !== null && stock[key] <= parent)
      return false;
  for (const node of [
    stock.high_low_node,
    stock.up_down_node,
    stock.up_node,
    stock.down_node,
    stock.gap_width?.node ?? null
  ]) {
    if (node === null)
      continue;
    if (node <= plotNode || usedNodes.has(node))
      return false;
    usedNodes.add(node);
  }
  return true;
}

// js/chart-spatial-settings.mjs
function validChartSpatialSettings(value, kind, owner, leaves) {
  if (value === undefined)
    return true;
  const spatial = ["bar3DChart", "line3DChart", "area3DChart"].includes(kind);
  if (!spatial)
    return value === null;
  if (!object(value) || !field(value.gap_depth, (v) => uint2(v) && v <= 500, owner) || !field(value.shape, oneOf(["box", "cone", "coneToMax", "cylinder", "pyramid", "pyramidToMax"]), owner))
    return false;
  if (kind !== "bar3DChart" && value.shape !== null)
    return false;
  for (const leaf of [value.gap_depth, value.shape])
    if (leaf !== null) {
      if (leaves.has(leaf.node))
        return false;
      leaves.add(leaf.node);
    }
  return true;
}

// js/hwpx-chart-display.mjs
var plotKinds = new Set([
  "areaChart",
  "area3DChart",
  "lineChart",
  "line3DChart",
  "stockChart",
  "radarChart",
  "scatterChart",
  "pieChart",
  "pie3DChart",
  "doughnutChart",
  "barChart",
  "bar3DChart",
  "ofPieChart",
  "surfaceChart",
  "surface3DChart",
  "bubbleChart"
]);
var pointKinds = new Set([
  "numeric_cache",
  "numeric_literal",
  "string_cache",
  "string_literal",
  "multilevel_cache"
]);
var roles = new Set(["name", "category", "value", "x", "y", "bubble_size", "unclassified"]);
var fail = () => {
  throw new Error("InvalidChartDisplay");
};
var require2 = (condition) => {
  if (!condition)
    fail();
};
function decodeChartDisplay(bytes) {
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  require2(object(value) && value.kind === "chart_display");
  for (const name of [
    "plots",
    "plot_settings",
    "axes",
    "axis_links",
    "points",
    "bindings",
    "series_text",
    "rich_text"
  ])
    require2(Array.isArray(value[name]));
  const pair = value.pair;
  require2(object(pair) && text(pair.chart_path) && pair.chart_path.length > 0 && text(pair.ole_path) && pair.ole_path.length > 0 && uint2(pair.wrapper_node) && uint2(pair.section_ordinal) && typeof pair.declared_external === "boolean" && Array.isArray(pair.section_sha256) && pair.section_sha256.length === 32 && pair.section_sha256.every((n) => uint2(n) && n <= 255));
  require2(chartDisplayHost(value.host, pair.wrapper_node));
  require2(value.plots.length === value.plot_settings.length);
  const plots = new Map, series = new Map, references = new Map;
  const hasStrokes = Array.isArray(value.series_settings) && value.series_settings.some((row) => row?.stroke != null);
  const hasMajorTicks = value.axes.some((axis) => axis?.major_tick_mark != null);
  const occupied = value.view_3d == null && value.blank_policy == null && !hasStrokes && !hasMajorTicks ? null : new Set;
  let previousPlot = -1;
  for (const [index, plot] of value.plots.entries()) {
    require2(object(plot) && uint2(plot.node) && plot.node > previousPlot && uint2(plot.area_node) && plot.area_node < plot.node && plotKinds.has(plot.kind) && Array.isArray(plot.series_nodes));
    plots.set(plot.node, plot);
    previousPlot = plot.node;
    occupied?.add(plot.node);
    occupied?.add(plot.area_node);
    let previousSeries = plot.node;
    for (const node of plot.series_nodes) {
      require2(uint2(node) && node > previousSeries && !series.has(node));
      series.set(node, plot.node);
      previousSeries = node;
      occupied?.add(node);
    }
    const settings = value.plot_settings[index];
    require2(object(settings) && field(settings.direction, oneOf(["bar", "col"]), plot.node) && field(settings.grouping, oneOf(["standard", "clustered", "stacked", "percentStacked"]), plot.node) && field(settings.vary_colors, (v) => typeof v === "boolean", plot.node) && Array.isArray(settings.axis_references));
    require2(field(settings.gap_width, (v) => uint2(v) && v <= 500, plot.node) && field(settings.overlap, (v) => Number.isInteger(v) && v >= -100 && v <= 100, plot.node));
    require2(field(settings.scatter_style, oneOf(["line", "lineMarker", "marker", "smooth", "smoothMarker"]), plot.node));
    if (settings.scatter_style !== null)
      require2(plot.kind === "scatterChart");
    require2(field(settings.first_slice_angle, (v) => uint2(v) && v <= 360, plot.node));
    if (settings.first_slice_angle !== null)
      require2(["pieChart", "doughnutChart"].includes(plot.kind));
    require2(field(settings.of_pie_type, oneOf(["pie", "bar"]), plot.node) && field(settings.second_pie_size, (v) => uint2(v) && v >= 5 && v <= 200, plot.node) && field(settings.split_type, oneOf(["auto", "cust", "percent", "pos", "val"]), plot.node) && field(settings.split_position, number, plot.node) && nullableUint(settings.custom_split_node) && (settings.custom_split_node === null || settings.custom_split_node > plot.node));
    if ([
      settings.of_pie_type,
      settings.second_pie_size,
      settings.split_type,
      settings.split_position,
      settings.custom_split_node
    ].some((value) => value !== null))
      require2(plot.kind === "ofPieChart");
    const bar = ["barChart", "bar3DChart"].includes(plot.kind);
    if (settings.direction !== null)
      require2(bar);
    if (settings.grouping !== null)
      require2(bar || ["lineChart", "line3DChart", "areaChart", "area3DChart"].includes(plot.kind));
    if (!bar && settings.grouping?.value === "clustered")
      fail();
    if (settings.gap_width !== null)
      require2(["barChart", "bar3DChart", "ofPieChart"].includes(plot.kind));
    if (settings.overlap !== null)
      require2(plot.kind === "barChart");
    const leaves = new Set;
    for (const leaf of [
      settings.direction,
      settings.grouping,
      settings.vary_colors,
      settings.gap_width,
      settings.overlap,
      settings.scatter_style,
      settings.first_slice_angle,
      settings.of_pie_type,
      settings.second_pie_size,
      settings.split_type,
      settings.split_position,
      ...settings.custom_split_node === null ? [] : [{ node: settings.custom_split_node }],
      ...settings.axis_references
    ])
      if (leaf !== null) {
        require2(object(leaf) && uint2(leaf.node) && !leaves.has(leaf.node));
        leaves.add(leaf.node);
      }
    require2(validChartStockSettings(settings.stock, plot.kind, plot.node, leaves));
    require2(validChartSpatialSettings(settings.spatial, plot.kind, plot.node, leaves));
    for (const node of leaves)
      occupied?.add(node);
    for (const reference of settings.axis_references) {
      require2(reference !== null && field(reference, uint2, plot.node));
      const key = plot.node + ":" + reference.node;
      require2(!references.has(key));
      references.set(key, reference.value);
    }
  }
  const axes = new Map, definitions = new Map;
  require2(validChartSeriesSettings(value.series_settings, plots, series, occupied));
  require2(validChartPointSettings(value.point_settings, series, occupied));
  for (const axis of value.axes) {
    require2(object(axis) && uint2(axis.node) && !axes.has(axis.node) && uint2(axis.area_node) && axis.area_node < axis.node && ["catAx", "valAx", "dateAx", "serAx"].includes(axis.kind) && field(axis.id, uint2, axis.node) && field(axis.cross_axis, uint2, axis.node) && field(axis.position, oneOf(["b", "l", "r", "t"]), axis.node) && field(axis.deleted, (v) => typeof v === "boolean", axis.node) && scaling(axis.scaling, axis.node) && (axis.major_tick_mark === undefined || field(axis.major_tick_mark, oneOf(["cross", "in", "none", "out"]), axis.node)));
    axes.set(axis.node, axis);
    occupied?.add(axis.node);
    occupied?.add(axis.area_node);
    for (const leaf of [
      axis.id,
      axis.cross_axis,
      axis.position,
      axis.deleted,
      axis.scaling,
      ...axis.scaling ? [
        axis.scaling.orientation,
        axis.scaling.minimum,
        axis.scaling.maximum,
        axis.scaling.log_base
      ] : []
    ])
      if (leaf !== null)
        occupied?.add(leaf.node);
    if (axis.id?.value !== null && axis.id?.value !== undefined) {
      const key = axis.area_node + ":" + axis.id.value;
      const rows = definitions.get(key) ?? [];
      rows.push(axis.node);
      definitions.set(key, rows);
    }
  }
  require2(value.axis_links.length === references.size);
  const seenLinks = new Set;
  for (const link of value.axis_links) {
    require2(object(link) && uint2(link.plot_node) && plots.has(link.plot_node) && uint2(link.reference_node) && nullableUint(link.id) && object(link.target));
    const key = link.plot_node + ":" + link.reference_node;
    require2(references.has(key) && !seenLinks.has(key) && references.get(key) === link.id);
    seenLinks.add(key);
    const matches = link.id === null ? [] : definitions.get(plots.get(link.plot_node).area_node + ":" + link.id) ?? [];
    const status = link.id === null ? "missing_value" : matches.length === 0 ? "missing_definition" : matches.length > 1 ? "ambiguous" : "resolved";
    require2(link.target.status === status && link.target.node === (status === "resolved" ? matches[0] : null));
  }
  require2(value.bindings.length === value.points.length);
  let previousLeaf = -1;
  const pointNodes = new Set;
  for (const [index, point] of value.points.entries()) {
    require2(object(point) && [point.cache_node, point.point_node, point.value_node, point.index].every(uint2) && point.cache_node < point.point_node && point.point_node < point.value_node && point.value_node > previousLeaf && !pointNodes.has(point.point_node) && pointKinds.has(point.kind) && text(point.value) && nullableUint(point.level_node) && (point.level_node === null || point.cache_node < point.level_node && point.level_node < point.point_node) && point.kind === "multilevel_cache" === (point.level_node !== null));
    previousLeaf = point.value_node;
    pointNodes.add(point.point_node);
    for (const node of [point.cache_node, point.point_node, point.value_node, point.level_node])
      if (node !== null)
        occupied?.add(node);
    const binding = value.bindings[index];
    require2(object(binding) && binding.point === index && [binding.series_node, binding.plot_node, binding.role_node].every(nullableUint) && roles.has(binding.role));
    for (const node of [binding.series_node, binding.plot_node, binding.role_node])
      if (node !== null)
        occupied?.add(node);
    if (binding.series_node === null)
      require2(binding.plot_node === null && binding.role_node === null && binding.role === "unclassified");
    else {
      require2(binding.plot_node !== null);
      if (series.has(binding.series_node))
        require2(series.get(binding.series_node) === binding.plot_node);
      if (binding.role_node === null)
        require2(binding.role === "unclassified");
      else
        require2(binding.role_node > binding.series_node && binding.role_node < point.cache_node);
    }
  }
  try {
    validateChartSeriesText({ kind: "direct_series", values: value.series_text });
    validateChartRichText({ kind: "rich_text", values: value.rich_text });
  } catch {
    fail();
  }
  for (const row of value.series_text)
    for (const node of [row.series_node, row.text_node, row.value_node])
      occupied?.add(node);
  for (const row of value.rich_text)
    for (const node of [
      row.owner_node,
      row.text_node,
      row.rich_node,
      row.paragraph_node,
      row.run_node,
      row.value_node
    ])
      occupied?.add(node);
  for (const row of value.series_settings)
    if (row.stroke != null) {
      for (const node of [row.stroke.node, row.stroke.no_fill_node].filter((node) => node !== null)) {
        require2(!occupied.has(node));
        occupied.add(node);
      }
    }
  for (const axis of value.axes) {
    if (axis.major_tick_mark != null) {
      require2(!occupied.has(axis.major_tick_mark.node));
      occupied.add(axis.major_tick_mark.node);
    }
  }
  if (value.blank_policy !== undefined && value.blank_policy !== null) {
    require2(field(value.blank_policy, oneOf(["gap", "zero", "span"]), 0) && !occupied.has(value.blank_policy.node));
    occupied.add(value.blank_policy.node);
  }
  require2(validChartView3D(value.view_3d, occupied));
  return value;
}

// js/hwpx-chart-api.mjs
function createHwpxChartApi({ wasm, memory, ready, uint, encodedText }) {
  function chartPointBytes(text, legacyNumeric = false) {
    const nativeLimit = typeof wasm.hwpx_edit_chart_point_max_bytes === "function";
    if (!nativeLimit && !legacyNumeric)
      throw new Error("HwpxChartEditAbiUnavailable");
    const maxBytes = nativeLimit ? wasm.hwpx_edit_chart_point_max_bytes() : 1024 * 1024;
    if (!Number.isInteger(maxBytes) || maxBytes <= 0 || maxBytes > 4294967295)
      throw new Error("InvalidChartPointLimit");
    const bytes = encodedText(text);
    if (bytes.length > maxBytes)
      throw new Error("LimitExceeded");
    return bytes;
  }
  return {
    chartPoints(section, wrapper) {
      ready();
      [section, wrapper].forEach(uint);
      if (typeof wasm.hwpx_edit_chart_points !== "function")
        throw new Error("HwpxChartEditAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_chart_points(section, wrapper))
          throw memory.error();
        return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len())));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    chartSeriesText(section, wrapper) {
      ready();
      [section, wrapper].forEach(uint);
      if (typeof wasm.hwpx_edit_chart_series_text !== "function")
        throw new Error("HwpxChartSeriesTextAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_chart_series_text(section, wrapper))
          throw memory.error();
        return decodeChartSeriesText(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    chartRichText(section, wrapper) {
      ready();
      [section, wrapper].forEach(uint);
      if (typeof wasm.hwpx_edit_chart_rich_text !== "function")
        throw new Error("HwpxChartRichTextAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_chart_rich_text(section, wrapper))
          throw memory.error();
        return decodeChartRichText(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    chartDisplay(section, wrapper) {
      ready();
      [section, wrapper].forEach(uint);
      if (typeof wasm.hwpx_edit_chart_display !== "function")
        throw new Error("HwpxChartDisplayAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_chart_display(section, wrapper))
          throw memory.error();
        return decodeChartDisplay(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    setChartRichText(section, wrapper, ordinal, text) {
      ready();
      [section, wrapper, ordinal].forEach(uint);
      if (typeof wasm.hwpx_edit_set_chart_rich_text !== "function" || typeof wasm.hwpx_edit_chart_rich_text_max_bytes !== "function")
        throw new Error("HwpxChartRichTextAbiUnavailable");
      const maxBytes = wasm.hwpx_edit_chart_rich_text_max_bytes();
      if (!Number.isInteger(maxBytes) || maxBytes <= 0 || maxBytes > 4294967295)
        throw new Error("InvalidChartRichTextLimit");
      const bytes = encodedText(text);
      if (bytes.length > maxBytes)
        throw new Error("LimitExceeded");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_chart_rich_text(section, wrapper, ordinal, ptr, size))
          throw memory.error();
      });
    },
    setChartSeriesText(section, wrapper, ordinal, text) {
      ready();
      [section, wrapper, ordinal].forEach(uint);
      if (typeof wasm.hwpx_edit_set_chart_series_text !== "function" || typeof wasm.hwpx_edit_chart_series_text_max_bytes !== "function")
        throw new Error("HwpxChartSeriesTextAbiUnavailable");
      const maxBytes = wasm.hwpx_edit_chart_series_text_max_bytes();
      if (!Number.isInteger(maxBytes) || maxBytes <= 0 || maxBytes > 4294967295)
        throw new Error("InvalidChartSeriesTextLimit");
      const bytes = encodedText(text);
      if (bytes.length > maxBytes)
        throw new Error("LimitExceeded");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_chart_series_text(section, wrapper, ordinal, ptr, size))
          throw memory.error();
      });
    },
    chartNodes(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_chart_nodes !== "function")
        throw new Error("HwpxChartEditAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_chart_nodes(section))
          throw memory.error();
        return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len())));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    chartSites(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_chart_sites !== "function")
        throw new Error("HwpxChartEditAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_chart_sites(section))
          throw memory.error();
        return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len())));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    setChartNumericPoint(section, wrapper, point, value) {
      ready();
      [section, wrapper, point].forEach(uint);
      if (typeof wasm.hwpx_edit_set_chart_numeric_point !== "function")
        throw new Error("HwpxChartEditAbiUnavailable");
      const bytes = chartPointBytes(value, true);
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_chart_numeric_point(section, wrapper, point, ptr, size))
          throw memory.error();
      });
    },
    setChartPoint(section, wrapper, point, value) {
      ready();
      [section, wrapper, point].forEach(uint);
      if (typeof wasm.hwpx_edit_set_chart_point !== "function" || typeof wasm.hwpx_edit_chart_point_max_bytes !== "function")
        throw new Error("HwpxChartEditAbiUnavailable");
      const bytes = chartPointBytes(value);
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_chart_point(section, wrapper, point, ptr, size))
          throw memory.error();
      });
    },
    setChartPoints(section, wrapper, edits) {
      ready();
      [section, wrapper].forEach(uint);
      const bytes = encodeChartPointBatch(edits, readChartPointBatchLimits(wasm), chartPointBytes);
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_chart_points(section, wrapper, ptr, size))
          throw memory.error();
      });
    },
    chartPointBatchLimits() {
      ready();
      return readChartPointBatchLimits(wasm);
    }
  };
}

// js/hwpx-inline-string-sources.mjs
function decodeInlineStringSources(bytes) {
  const fail = () => {
    throw new Error("InvalidHwpxInlineStringSources");
  };
  let value;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  const uint = (n) => Number.isInteger(n) && n >= 0 && n <= 4294967295;
  const string = (s) => typeof s === "string";
  if (!value || value.sourceOnly !== true || !Array.isArray(value.controls) || !Array.isArray(value.texts))
    return fail();
  if (value.controls.length > 1e5 || value.texts.length > 200000)
    return fail();
  let cursor = 0;
  const seen = new Set;
  for (const [index, control] of value.controls.entries()) {
    if (!control || !["indexmark", "dutmal"].includes(control.kind))
      return fail();
    for (const key of [
      "section_ordinal",
      "element_index",
      "parent_element_index",
      "first_text",
      "text_count",
      "direct_children",
      "unknown_children",
      "other_attributes"
    ])
      if (!uint(control[key]))
        return fail();
    for (const key of ["parent_uri", "parent_local_name", "raw_xml", "direct_text"])
      if (!string(control[key]))
        return fail();
    if (control.parent_element_index >= control.element_index || control.first_text !== cursor || control.text_count > value.texts.length - cursor || control.direct_children !== control.text_count + control.unknown_children)
      return fail();
    const identity = `${control.section_ordinal}:${control.element_index}`;
    if (seen.has(identity))
      return fail();
    seen.add(identity);
    if (!control.attributes || typeof control.attributes !== "object" || Array.isArray(control.attributes))
      return fail();
    for (const key of ["pos_type", "sz_ratio", "option", "style_id_ref", "alignment"])
      if (control.attributes[key] !== null && !string(control.attributes[key]))
        return fail();
    const kinds = control.kind === "dutmal" ? ["main_text", "sub_text"] : ["first_key", "second_key"];
    for (const text of value.texts.slice(cursor, cursor + control.text_count)) {
      if (!text || text.control_index !== index || !kinds.includes(text.kind))
        return fail();
      for (const key of ["element_index", "direct_children", "other_attributes"])
        if (!uint(text[key]))
          return fail();
      if (!string(text.raw_xml) || !string(text.value) || text.element_index <= control.element_index)
        return fail();
      const textIdentity = `${control.section_ordinal}:${text.element_index}`;
      if (seen.has(textIdentity))
        return fail();
      seen.add(textIdentity);
    }
    cursor += control.text_count;
  }
  if (cursor !== value.texts.length)
    return fail();
  return value;
}

// js/hwpx-dutmal-kind.mjs
function dutmalKind(value) {
  if (value === "mainText")
    return 0;
  if (value === "subText")
    return 1;
  throw new RangeError("InvalidDutmalTextKind");
}

// js/hwpx-dutmal-sites.mjs
function decodeDutmalSites(bytes) {
  const fail = () => {
    throw new Error("InvalidHwpxDutmalSites");
  };
  let rows;
  try {
    rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  if (!Array.isArray(rows) || rows.length > 1e5)
    return fail();
  const nodes = new Set;
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  for (const row of rows) {
    if (!row || !uint(row.node) || !uint(row.paragraph) || row.paragraph === 0 || !uint(row.anchor_unit) || nodes.has(row.node))
      return fail();
    nodes.add(row.node);
  }
  return rows;
}

// js/hwpx-equation-sources.mjs
function decodeEquationSources(bytes) {
  const fail = () => {
    throw new Error("InvalidHwpxEquationSources");
  };
  let rows;
  try {
    rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  return validateEquationSources(rows);
}
function validateEquationSources(rows) {
  const fail = () => {
    throw new Error("InvalidHwpxEquationSources");
  };
  if (!Array.isArray(rows) || rows.length > 1e5)
    return fail();
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const seen = new Set;
  const issues = new Set([
    null,
    "inactive",
    "inline_text_descendant",
    "unsupported_encoding",
    "missing_script",
    "multiple_scripts",
    "nested_script"
  ]);
  let previous = -1;
  for (const row of rows) {
    if (!row || !uint(row.node) || row.node <= previous || typeof row.active !== "boolean" || !uint(row.script_count) || !issues.has(row.issue))
      return fail();
    if (row.script_count === 0 ? row.script_node !== null : !uint(row.script_node) || row.script_node <= row.node)
      return fail();
    if (row.issue === null && (!row.active || row.script_count !== 1))
      return fail();
    if (!row.active && !["inactive", "inline_text_descendant"].includes(row.issue))
      return fail();
    if (row.issue === "inactive" && row.active || row.issue === "missing_script" && row.script_count !== 0 || row.issue === "multiple_scripts" && row.script_count < 2 || row.issue === "nested_script" && row.script_count !== 1)
      return fail();
    for (const node of [row.node, row.script_node])
      if (node !== null) {
        if (seen.has(node))
          return fail();
        seen.add(node);
      }
    previous = row.node;
  }
  return rows;
}

// js/hwpx-equation-scripts.mjs
function decodeEquationScripts(bytes) {
  const fail = () => {
    throw new Error("InvalidHwpxEquationScripts");
  };
  let value;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  if (!value || !Array.isArray(value.rows) || !Number.isInteger(value.script_bytes) || value.script_bytes < 0 || value.script_bytes > 4294967295)
    return fail();
  try {
    validateEquationSources(value.rows.map((row) => row?.source));
  } catch {
    return fail();
  }
  let total = 0;
  const encode = new TextEncoder;
  for (const row of value.rows) {
    if (row.source.issue !== null) {
      if (row.value !== null)
        return fail();
      continue;
    }
    if (typeof row.value !== "string" || !row.value.isWellFormed())
      return fail();
    const count = encode.encode(row.value).length;
    if (count > 4294967295 - total)
      return fail();
    total += count;
  }
  if (total !== value.script_bytes)
    return fail();
  return value;
}

// js/hwpx-equation-sites.mjs
function decodeEquationSites(bytes) {
  const fail = () => {
    throw new Error("InvalidHwpxEquationSites");
  };
  let rows;
  try {
    rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!Array.isArray(rows))
      return fail();
    validateEquationSources(rows.map((row) => row?.source));
  } catch {
    return fail();
  }
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const paragraph = (value) => uint(value) && value > 0;
  for (const row of rows) {
    if (row.source.issue !== null) {
      if (row.paragraph !== null || row.anchor_unit !== null || row.error_name !== null)
        return fail();
    } else if (row.error_name === null) {
      if (!paragraph(row.paragraph) || !uint(row.anchor_unit))
        return fail();
    } else {
      if (typeof row.error_name !== "string" || !/^[A-Za-z][A-Za-z0-9_]{0,127}$/.test(row.error_name) || row.anchor_unit !== null || row.paragraph !== null && !paragraph(row.paragraph))
        return fail();
    }
  }
  return rows;
}

// js/hwpx-field-target-wire.mjs
function validateFieldTargets(targets) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!Array.isArray(targets) || targets.length > 4096 || Array.from(targets).some((target) => !target || ![target.beginElement, target.start, target.end].every(uint) || target.end < target.start))
    throw new Error("InvalidFieldTargets");
  return targets;
}
function decodeFieldTargets(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 4)
    throw new Error("InvalidFieldTargets");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(0, true);
  if (count > 4096 || bytes.length !== 4 + count * 12)
    throw new Error("InvalidFieldTargets");
  return validateFieldTargets(Array.from({ length: count }, (_, index) => {
    const offset = 4 + index * 12;
    const target = {
      beginElement: view.getUint32(offset, true),
      start: view.getUint32(offset + 4, true),
      end: view.getUint32(offset + 8, true)
    };
    if (target.end < target.start)
      throw new Error("InvalidFieldTargets");
    return target;
  }));
}

// js/formula-result-paragraphs.mjs
function decodeFormulaResultParagraphs(bytes) {
  const values = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!Array.isArray(values))
    throw new Error("InvalidFormulaResultParagraphs");
  let previous = 0;
  for (const value of values) {
    if (!Number.isInteger(value) || value <= previous || value > 4294967295)
      throw new Error("InvalidFormulaResultParagraphs");
    previous = value;
  }
  return values;
}

// js/formula-result-display-snapshot.mjs
function decodeFormulaResultDisplaySnapshot(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const invalid = () => {
    throw new Error("InvalidFormulaResultDisplaySnapshot");
  };
  if (!Array.isArray(rows) || rows.length > 1e5)
    invalid();
  let previous = 0;
  return rows.map((row) => {
    if (!row || !Number.isInteger(row.paragraph) || row.paragraph <= previous || row.paragraph > 4294967295 || typeof row.text !== "string" || !Array.isArray(row.targets) || !row.targets.length)
      invalid();
    previous = row.paragraph;
    const targets = validateFieldTargets(row.targets.map((target) => ({
      beginElement: target?.begin_element,
      start: target?.start,
      end: target?.end
    })));
    if (targets.some((target) => target.end > row.text.length))
      invalid();
    return { paragraph: row.paragraph, text: row.text, targets };
  });
}

// js/hwpx-form-source.mjs
var kinds = new Set(["button", "check_button", "combo_box", "radio_button", "edit_box"]);
var uint6 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var object4 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
function decode(bytes, maximum) {
  if (!(bytes instanceof Uint8Array) || bytes.length > maximum)
    throw new Error("InvalidFormSource");
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error("InvalidFormSource");
  }
}
function decodeFormSourceNodes(bytes) {
  const value = decode(bytes, 8 * 1024 * 1024);
  if (!object4(value) || value.sourceOnly !== true || !Array.isArray(value.nodes) || value.nodes.length > 1e5 || !value.nodes.every((row, i) => object4(row) && uint6(row.formNode) && kinds.has(row.kind) && (i === 0 || row.formNode > value.nodes[i - 1].formNode)))
    throw new Error("InvalidFormSource");
  return value;
}
function decodeFormSourceAttributes(bytes) {
  const value = decode(bytes, 1024 * 1024);
  const group = (data, check) => object4(data) && Object.keys(data).length <= 128 && Object.entries(data).every(([key, item]) => /^[A-Za-z][A-Za-z0-9]*$/.test(key) && key.length <= 128 && (item === null || check(item)));
  if (!object4(value) || value.sourceOnly !== true || !kinds.has(value.kind) || !group(value.strings, (item) => typeof item === "string" && item.isWellFormed() && new TextEncoder().encode(item).length <= 65536) || !group(value.booleans, (item) => typeof item === "boolean") || !group(value.integers, uint6))
    throw new Error("InvalidFormSource");
  return value;
}
function decodeFormSites(bytes) {
  const sites = decode(bytes, 16 * 1024 * 1024);
  if (!Array.isArray(sites) || sites.length > 1e5 || !sites.every((site, i) => {
    if (!object4(site) || !uint6(site.formNode) || !kinds.has(site.kind) || i > 0 && site.formNode <= sites[i - 1].formNode)
      return false;
    if (site.state === "located")
      return uint6(site.paragraph) && site.paragraph > 0 && uint6(site.anchorUnit);
    if (site.state === "unsupported_anchor")
      return uint6(site.paragraph) && site.paragraph > 0 && site.anchorUnit === null;
    return ["conditional", "missing_host", "ambiguous_host"].includes(site.state) && site.paragraph === null && site.anchorUnit === null;
  }))
    throw new Error("InvalidFormSource");
  return sites;
}
function decodeFormSourceLayout(bytes) {
  const value = decode(bytes, 65536);
  const bool = (value) => value === null || typeof value === "boolean";
  if (!object4(value) || value.sourceOnly !== true || !uint6(value.formNode) || !kinds.has(value.kind) || !validShapeLayoutValues(value) || !object4(value.character) || !(value.character.id === null || uint6(value.character.id)) || ![
    value.character.follow_context,
    value.character.auto_size,
    value.character.word_wrap,
    value.sizeProtected
  ].every(bool))
    throw new Error("InvalidFormSource");
  return value;
}

// js/hwpx-ole-source.mjs
var uint7 = (v) => Number.isInteger(v) && v >= 0 && v <= 4294967295;
var errors = new Set([
  "UnsupportedOleDisplayHost",
  "MissingCurrentParagraphDisplayHost",
  "AmbiguousParagraphDisplayHost",
  "MissingProtectedDisplayAnchor",
  "UnsupportedJoinedParagraphLocations",
  "UnsupportedInlineControl",
  "UnsupportedTextPositionProjection",
  "MissingTextSite"
]);
function parse(bytes, maxBytes, message) {
  if (!(bytes instanceof Uint8Array) || bytes.length > maxBytes)
    throw new Error(message);
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error(message);
  }
}
function decodeOleSites(bytes) {
  const fail = () => {
    throw new Error("InvalidOleSites");
  };
  const value = parse(bytes, 16 * 1024 * 1024, "InvalidOleSites"), seen = new Set;
  if (!Array.isArray(value) || value.length > 1e5)
    fail();
  for (const row of value) {
    if (!row || !uint7(row.ole_node) || seen.has(row.ole_node) || !(row.paragraph === null || uint7(row.paragraph) && row.paragraph > 0) || !(row.anchor_unit === null || uint7(row.anchor_unit)))
      fail();
    if (Object.hasOwn(row, "chart_wrapper") && row.chart_wrapper !== null && !uint7(row.chart_wrapper))
      fail();
    if (row.error_name === null ? row.paragraph === null || row.anchor_unit === null : !errors.has(row.error_name) || row.anchor_unit !== null)
      fail();
    seen.add(row.ole_node);
  }
  return value;
}
function decodeOleSource(bytes) {
  const fail = () => {
    throw new Error("InvalidOleSource");
  };
  const value = parse(bytes, 65536, "InvalidOleSource");
  if (!value || !Object.hasOwn(value, "position") || !Object.hasOwn(value, "flow"))
    fail();
  try {
    validateShapeSourceValues(value);
  } catch {
    fail();
  }
  for (const name of ["binary_item_id", "object_type", "draw_aspect"]) {
    const text = value[name];
    if (text !== null && (typeof text !== "string" || !text.isWellFormed() || new TextEncoder().encode(text).length > 4096))
      fail();
  }
  if (![null, false, true].includes(value.has_moniker))
    fail();
  if (Object.hasOwn(value, "transform_identity") && ![null, false, true].includes(value.transform_identity))
    fail();
  return value;
}
function decodeOleBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 1 || bytes.length > 64 * 1024 * 1024 + 1 || bytes[0] > 1) {
    throw new Error("InvalidOleBytes");
  }
  return { declaredExternal: bytes[0] === 1, bytes: bytes.slice(1) };
}

// js/hwpx-automatic-number-sites.mjs
function decodeAutomaticNumberSites(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const optional = (value) => value === null || uint(value);
  if (!Array.isArray(rows) || rows.length > 1e5)
    throw new Error("InvalidAutomaticNumberSites");
  const nodes = new Set;
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row) || !uint(row.number_node) || nodes.has(row.number_node) || !optional(row.anchor_node) || !optional(row.paragraph) || !optional(row.anchor_unit) || row.paragraph === null !== (row.anchor_unit === null) || row.paragraph === 0 || row.anchor_node === null && row.paragraph !== null)
      throw new Error("InvalidAutomaticNumberSites");
    nodes.add(row.number_node);
  }
  return rows;
}

// js/hwpx-automatic-number-sources.mjs
function decodeAutomaticNumberSources(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const uint = (v) => Number.isInteger(v) && v >= 0 && v <= 4294967295;
  const object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const flag = (v) => v === null || typeof v === "boolean";
  const raw = (v, n) => Array.isArray(v) && v.length === n && v.every((s) => s === null || typeof s === "string");
  const nodes = new Set;
  if (!Array.isArray(rows) || rows.length > 1e5)
    throw new Error("InvalidAutomaticNumberSources");
  for (const row of rows) {
    const value = row?.values, format = row?.format;
    if (!object(row) || !uint(row.number_node) || nodes.has(row.number_node) || !(row.anchor_node === null || uint(row.anchor_node)) || !object(value) || !raw(value.raw, 2) || !uint(value.other_attributes) || !flag(value.type_known) || !(value.num === null || Number.isInteger(value.num) && value.num >= -2147483648 && value.num <= 2147483647) || !(format === null || object(format) && raw(format.raw, 5) && uint(format.other_attributes) && flag(format.type_known) && flag(format.supscript)))
      throw new Error("InvalidAutomaticNumberSources");
    nodes.add(row.number_node);
  }
  return rows;
}

// js/hwpx-formula-sources.mjs
function decodeFormulaSources(bytes, { current = false } = {}) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!Array.isArray(rows) || rows.length > 4096)
    throw new Error("InvalidFormulaSources");
  let previous = -1;
  for (const row of rows) {
    if (!row || !Number.isInteger(row.begin_element) || row.begin_element <= previous || row.begin_element > 4294967295 || !row.values || !["command", "formula", "result_format", "last_result"].every((key) => row.values[key] === null || typeof row.values[key] === "string"))
      throw new Error("InvalidFormulaSources");
    previous = row.begin_element;
    if (current) {
      const owner = row.owner;
      const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
      if (!owner || ![
        owner.table,
        owner.cell,
        owner.columns,
        owner.rows,
        owner.origin?.column,
        owner.origin?.row
      ].every(uint) || owner.columns === 0 || owner.rows === 0 || owner.origin.column >= owner.columns || owner.origin.row >= owner.rows)
        throw new Error("InvalidFormulaSources");
    }
  }
  return rows;
}

// js/hwpx-editor.mjs
async function createHwpxEditor2(source) {
  const module = source instanceof WebAssembly.Module ? source : await WebAssembly.compile(source);
  const { exports: wasm } = await WebAssembly.instantiate(module, {});
  validateAbi(wasm);
  for (const suffix of [
    "open",
    "close",
    "section_count",
    "can_edit",
    "splice",
    "save",
    "output_ptr",
    "output_len",
    "output_free"
  ])
    if (typeof wasm[`hwpx_edit_${suffix}`] !== "function")
      throw new Error("HwpxEditAbiUnavailable");
  const memory = createMemory(wasm);
  let closed = false;
  function ready() {
    if (closed)
      throw new Error("EditorClosed");
  }
  function uint(value) {
    if (!Number.isInteger(value) || value < 0 || value > 4294967295)
      throw new RangeError("InvalidInteger");
    return value;
  }
  function encodedText(text) {
    if (typeof text !== "string" || !text.isWellFormed())
      throw new TypeError("InvalidText");
    const bytes = new TextEncoder().encode(text);
    if (bytes.length > 4 * 1024 * 1024)
      throw new RangeError("LimitExceeded");
    return bytes;
  }
  function manualFormulaResultBytes(text, action, unavailable) {
    if (typeof wasm[action] !== "function" || typeof wasm.hwpx_edit_manual_formula_result_max_bytes !== "function")
      throw new Error(unavailable);
    const maxBytes = wasm.hwpx_edit_manual_formula_result_max_bytes();
    if (!Number.isInteger(maxBytes) || maxBytes <= 0 || maxBytes > 4294967295)
      throw new Error("InvalidManualFormulaResultLimit");
    const bytes = encodedText(text);
    if (bytes.length > maxBytes)
      throw new Error("LimitExceeded");
    return bytes;
  }
  function fieldLabels(section, paragraph) {
    ready();
    uint(section);
    uint(paragraph);
    if (typeof wasm.hwpx_edit_field_labels !== "function")
      throw new Error("HwpxFieldEditAbiUnavailable");
    try {
      if (!wasm.hwpx_edit_field_labels(section, paragraph))
        throw memory.error();
      return decodeFieldTargets(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
    } finally {
      wasm.hwpx_edit_output_free();
    }
  }
  function paragraphIds(suffix, args = []) {
    ready();
    args.forEach(uint);
    const action = wasm[`hwpx_edit_${suffix}`];
    if (typeof action !== "function")
      throw new Error("HwpxParagraphFormatAbiUnavailable");
    try {
      if (!action(...args))
        throw memory.error();
      const bytes = memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len());
      if (bytes.length % 4 || suffix === "paragraph_shape_id" && bytes.length !== 4)
        throw new Error("InvalidParagraphShapeIds");
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return Array.from({ length: bytes.length / 4 }, (_, index) => view.getUint32(index * 4, true));
    } finally {
      wasm.hwpx_edit_output_free();
    }
  }
  return {
    ...createAtomicFormattingApi({ wasm, memory, check: ready, prefix: "hwpx_edit" }),
    ...createParagraphBreakApi({
      wasm,
      memory,
      check: ready,
      uint,
      prefix: "hwpx_edit",
      endAsCount: true,
      unavailable: "HwpxParagraphBreakAbiUnavailable"
    }),
    paragraphShapeIds() {
      return paragraphIds("paragraph_shape_ids");
    },
    paragraphNeighbors(section) {
      const values = paragraphIds("paragraph_neighbors", [section]);
      if (values.length < 2 || values[0] < 1 || values[1] !== values.length - 2)
        throw new Error("InvalidParagraphNeighbors");
      const firstParagraph = values[0], next = values.slice(2);
      for (const [index, value] of next.entries())
        if (value !== 0 && (value <= firstParagraph + index || value >= firstParagraph + next.length))
          throw new Error("InvalidParagraphNeighbors");
      return { firstParagraph, next: next.map((value) => value === 0 ? null : value) };
    },
    paragraphShapeRefs(section) {
      const values = paragraphIds("paragraph_shape_refs", [section]);
      if (values.length < 2 || values[0] < 1 || values[1] !== values.length - 2)
        throw new Error("InvalidParagraphShapeIds");
      return { firstParagraph: values[0], ids: values.slice(2) };
    },
    paragraphShapeId(section, paragraph) {
      return paragraphIds("paragraph_shape_id", [section, paragraph])[0];
    },
    setParagraphFormat({ section, paragraph, paraShapeId }) {
      ready();
      [section, paragraph, paraShapeId].forEach(uint);
      if (typeof wasm.hwpx_edit_set_paragraph_format !== "function")
        throw new Error("HwpxParagraphFormatAbiUnavailable");
      if (!wasm.hwpx_edit_set_paragraph_format(section, paragraph, paraShapeId))
        throw memory.error();
    },
    setParagraphAlignment({ section, paragraph, alignment }) {
      ready();
      [section, paragraph].forEach(uint);
      const value = [
        "LEFT",
        "RIGHT",
        "CENTER",
        "JUSTIFY",
        "DISTRIBUTE",
        "DISTRIBUTE_SPACE"
      ].indexOf(alignment);
      if (value < 0)
        throw new RangeError("InvalidParagraphAlignment");
      if (typeof wasm.hwpx_edit_set_paragraph_alignment !== "function")
        throw new Error("HwpxParagraphAlignmentAbiUnavailable");
      if (!wasm.hwpx_edit_set_paragraph_alignment(section, paragraph, value))
        throw memory.error();
    },
    setParagraphMargins({ section, paragraph, margins }) {
      ready();
      [section, paragraph].forEach(uint);
      const args = paragraphMarginArgs(margins);
      if (typeof wasm.hwpx_edit_set_paragraph_margins !== "function")
        throw new Error("HwpxParagraphMarginsAbiUnavailable");
      if (!wasm.hwpx_edit_set_paragraph_margins(section, paragraph, ...args))
        throw memory.error();
    },
    setParagraphSpacing({ section, paragraph, type, value }) {
      ready();
      [section, paragraph].forEach(uint);
      const args = paragraphSpacingArgs(type, value);
      if (typeof wasm.hwpx_edit_set_paragraph_spacing !== "function")
        throw new Error("HwpxParagraphSpacingAbiUnavailable");
      if (!wasm.hwpx_edit_set_paragraph_spacing(section, paragraph, ...args))
        throw memory.error();
    },
    ...createHistoryApi({
      wasm,
      memory,
      check: ready,
      uint,
      prefix: "hwpx_edit",
      unavailable: "HwpxHistoryAbiUnavailable"
    }),
    canEditOutsideField(section, paragraph, startUnit, endUnit) {
      ready();
      [section, paragraph, startUnit, endUnit].forEach(uint);
      if (typeof wasm.hwpx_edit_can_edit_outside_field !== "function")
        throw new Error("HwpxOutsideFieldQueryAbiUnavailable");
      const result = wasm.hwpx_edit_can_edit_outside_field(section, paragraph, startUnit, endUnit);
      if (result > 1)
        throw memory.error();
      return result === 1;
    },
    createdTableHostMode(section, anchored = false) {
      ready();
      uint(section);
      if (typeof anchored !== "boolean")
        throw new TypeError("InvalidCreatedTableHostMode");
      if (typeof wasm.hwpx_edit_created_table_host_mode !== "function")
        return false;
      const result = wasm.hwpx_edit_created_table_host_mode(section, Number(anchored));
      if (result > 1)
        throw memory.error();
      return result === 1;
    },
    createdTableFieldLabelMode(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_created_table_field_label_mode !== "function")
        return false;
      const result = wasm.hwpx_edit_created_table_field_label_mode(section);
      if (result > 1)
        throw memory.error();
      return result === 1;
    },
    canEdit(section, paragraph) {
      ready();
      uint(section);
      uint(paragraph);
      const result = wasm.hwpx_edit_can_edit(section, paragraph);
      if (result > 1)
        throw memory.error();
      return result === 1;
    },
    canSplitParagraph({ section, paragraph, atUnit, endUnit = atUnit }) {
      ready();
      [section, paragraph, atUnit, endUnit].forEach(uint);
      if (endUnit < atUnit)
        throw new RangeError("InvalidTextPosition");
      if (typeof wasm.hwpx_edit_can_split !== "function")
        throw new Error("HwpxSplitQueryAbiUnavailable");
      const result = wasm.hwpx_edit_can_split(section, paragraph, atUnit, endUnit - atUnit);
      if (result > 1)
        throw memory.error();
      return result === 1;
    },
    supportsAnchoredSplitQuery() {
      return typeof wasm.hwpx_edit_can_split_anchored === "function";
    },
    canSplitParagraphAnchored({ section, paragraph, atUnit, endUnit = atUnit }) {
      ready();
      [section, paragraph, atUnit, endUnit].forEach(uint);
      if (endUnit < atUnit)
        throw new RangeError("InvalidTextPosition");
      if (typeof wasm.hwpx_edit_can_split_anchored !== "function")
        throw new Error("HwpxAnchoredSplitQueryAbiUnavailable");
      const result = wasm.hwpx_edit_can_split_anchored(section, paragraph, atUnit, endUnit - atUnit);
      if (result > 1)
        throw memory.error();
      return result === 1;
    },
    open(data, options = {}) {
      ready();
      if (!options || typeof options !== "object" || Array.isArray(options))
        throw new TypeError("InvalidEditorOptions");
      const allow = options.allowObservedChartOleDeviations === undefined ? false : options.allowObservedChartOleDeviations;
      if (typeof allow !== "boolean")
        throw new TypeError("InvalidChartOlePolicy");
      if (allow && typeof wasm.hwpx_edit_open_with_chart_ole_policy !== "function")
        throw new Error("HwpxChartOlePolicyAbiUnavailable");
      const bytes = inputBytes(data);
      if (bytes.length > 64 * 1024 * 1024)
        throw new RangeError("LimitExceeded");
      memory.withBytes(bytes, (ptr, size) => {
        const result = allow ? wasm.hwpx_edit_open_with_chart_ole_policy(ptr, size, 1) : wasm.hwpx_edit_open(ptr, size);
        if (!result)
          throw memory.error();
      });
      return { sectionCount: wasm.hwpx_edit_section_count() };
    },
    splice(section, paragraph, start, deleted, text) {
      ready();
      [section, paragraph, start, deleted].forEach(uint);
      const bytes = encodedText(text);
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_splice(section, paragraph, start, deleted, ptr, size))
          throw memory.error();
      });
    },
    splitParagraph({ section, paragraph, atUnit, endUnit = atUnit }) {
      ready();
      [section, paragraph, atUnit, endUnit].forEach(uint);
      if (endUnit < atUnit)
        throw new RangeError("InvalidTextPosition");
      if (typeof wasm.hwpx_edit_split !== "function")
        throw new Error("HwpxStructureAbiUnavailable");
      if (!wasm.hwpx_edit_split(section, paragraph, atUnit, endUnit - atUnit))
        throw memory.error();
    },
    splitParagraphAnchored({ section, paragraph, atUnit, endUnit = atUnit }) {
      ready();
      [section, paragraph, atUnit, endUnit].forEach(uint);
      if (endUnit < atUnit)
        throw new RangeError("InvalidTextPosition");
      if (typeof wasm.hwpx_edit_split_anchored !== "function")
        throw new Error("HwpxStructureAbiUnavailable");
      if (!wasm.hwpx_edit_split_anchored(section, paragraph, atUnit, endUnit - atUnit))
        throw memory.error();
    },
    mergeParagraph({ section, paragraph }) {
      ready();
      [section, paragraph].forEach(uint);
      if (typeof wasm.hwpx_edit_merge !== "function")
        throw new Error("HwpxStructureAbiUnavailable");
      if (!wasm.hwpx_edit_merge(section, paragraph))
        throw memory.error();
    },
    mergeParagraphPair({ section, paragraph, rightParagraph }) {
      ready();
      [section, paragraph, rightParagraph].forEach(uint);
      if (typeof wasm.hwpx_edit_merge_pair !== "function")
        throw new Error("HwpxStructureAbiUnavailable");
      if (!wasm.hwpx_edit_merge_pair(section, paragraph, rightParagraph))
        throw memory.error();
    },
    setCharacterFormat({ section, paragraph, startUnit, endUnit, charShapeId }) {
      ready();
      [section, paragraph, startUnit, endUnit, charShapeId].forEach(uint);
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      if (typeof wasm.hwpx_edit_set_character_format !== "function")
        throw new Error("HwpxCharacterFormatAbiUnavailable");
      if (!wasm.hwpx_edit_set_character_format(section, paragraph, startUnit, endUnit, charShapeId))
        throw memory.error();
    },
    setCharacterProperties({ section, paragraph, startUnit, endUnit, properties }) {
      ready();
      [section, paragraph, startUnit, endUnit].forEach(uint);
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const args = characterPropertyArgs(properties);
      if (typeof wasm.hwpx_edit_set_character_properties !== "function")
        throw new Error("HwpxCharacterPropertiesAbiUnavailable");
      if (!wasm.hwpx_edit_set_character_properties(section, paragraph, startUnit, endUnit, ...args))
        throw memory.error();
    },
    replaceParagraphRangesWithFontName({ ranges, text, language, name, properties }) {
      ready();
      const bytes = encodeCharacterRanges(ranges), inserted = encodeParagraphReplacement(text), font = characterFontNameArgs(language, name);
      const args = properties === undefined ? null : characterPropertyArgs(properties);
      const action = args ? wasm.hwpx_edit_replace_paragraph_ranges_font_name_properties : wasm.hwpx_edit_replace_paragraph_ranges_font_name;
      if (typeof action !== "function")
        throw new Error(args ? "HwpxNamedFontPropertyReplacementAbiUnavailable" : "HwpxNamedFontReplacementAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => memory.withBytes(inserted, (tp, ts) => memory.withBytes(font.bytes, (np, ns) => {
        if (!action(ptr, size, tp, ts, font.language, np, ns, ...args ?? []))
          throw memory.error();
      })));
    },
    replaceParagraphRanges({ ranges, text, properties }) {
      ready();
      const bytes = encodeCharacterRanges(ranges), inserted = encodeParagraphReplacement(text);
      const args = properties === undefined ? null : characterPropertyArgs(properties);
      const action = args ? wasm.hwpx_edit_replace_paragraph_ranges_properties : wasm.hwpx_edit_replace_paragraph_ranges;
      if (typeof action !== "function")
        throw new Error(args ? "HwpxPropertyReplacementAbiUnavailable" : "HwpxParagraphReplacementAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => memory.withBytes(inserted, (tp, ts) => {
        if (!action(ptr, size, tp, ts, ...args ?? []))
          throw memory.error();
      }));
    },
    setCharacterStrikeRanges({ ranges, enabled }) {
      ready();
      const bytes = encodeCharacterRanges(ranges);
      if (typeof enabled !== "boolean")
        throw new TypeError("InvalidCharacterProperties");
      if (typeof wasm.hwpx_edit_set_character_strike_ranges !== "function")
        throw new Error("HwpxCharacterStrikeRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_character_strike_ranges(ptr, size, Number(enabled)))
          throw memory.error();
      });
    },
    setCharacterUnderlineRanges({ ranges, kind }) {
      ready();
      const bytes = encodeCharacterRanges(ranges), value = characterUnderlineArg(kind);
      if (typeof wasm.hwpx_edit_set_character_underline_ranges !== "function")
        throw new Error("HwpxCharacterUnderlineRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_character_underline_ranges(ptr, size, value))
          throw memory.error();
      });
    },
    setCharacterPropertiesRanges({ ranges, properties }) {
      ready();
      const bytes = encodeCharacterRanges(ranges);
      const args = characterPropertyArgs(properties);
      if (typeof wasm.hwpx_edit_set_character_properties_ranges !== "function")
        throw new Error("HwpxCharacterPropertiesRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_character_properties_ranges(ptr, size, ...args))
          throw memory.error();
      });
    },
    setCharacterFontNameRanges({ ranges, language, name }) {
      ready();
      const bytes = encodeCharacterRanges(ranges), args = characterFontNameArgs(language, name);
      if (typeof wasm.hwpx_edit_set_character_font_name_ranges !== "function")
        throw new Error("HwpxCharacterFontNameRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => memory.withBytes(args.bytes, (namePtr, nameSize) => {
        if (!wasm.hwpx_edit_set_character_font_name_ranges(ptr, size, args.language, namePtr, nameSize))
          throw memory.error();
      }));
    },
    setCharacterFontRanges({ ranges, language, fontId }) {
      ready();
      const bytes = encodeCharacterRanges(ranges), args = characterFontArgs(language, fontId);
      if (typeof wasm.hwpx_edit_set_character_font_ranges !== "function")
        throw new Error("HwpxCharacterFontRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_character_font_ranges(ptr, size, ...args))
          throw memory.error();
      });
    },
    setCharacterTextColorRanges({ ranges, color }) {
      ready();
      const bytes = encodeCharacterRanges(ranges), value = characterColorArg(color);
      if (typeof wasm.hwpx_edit_set_character_text_color_ranges !== "function")
        throw new Error("HwpxCharacterTextColorRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_character_text_color_ranges(ptr, size, value))
          throw memory.error();
      });
    },
    setCharacterShadeRanges({ ranges, color }) {
      ready();
      const bytes = encodeCharacterRanges(ranges), args = characterShadeArgs(color);
      if (typeof wasm.hwpx_edit_set_character_shade_ranges !== "function")
        throw new Error("HwpxCharacterShadeRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_character_shade_ranges(ptr, size, ...args))
          throw memory.error();
      });
    },
    setCharacterEffectRanges({ ranges, effect, enabled, exclusive = false }) {
      ready();
      const bytes = encodeCharacterRanges(ranges), args = characterEffectArgs(effect, enabled);
      const method = characterEffectMode(exclusive) ? wasm.hwpx_edit_set_character_effect_ranges_exclusive : wasm.hwpx_edit_set_character_effect_ranges;
      if (typeof method !== "function")
        throw new Error(exclusive ? "HwpxCharacterEffectRangesExclusiveAbiUnavailable" : "HwpxCharacterEffectRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!method(ptr, size, ...args))
          throw memory.error();
      });
    },
    setCharacterOutlineRanges({ ranges, kind }) {
      ready();
      const bytes = encodeCharacterRanges(ranges), value = characterOutlineArg(kind);
      if (typeof wasm.hwpx_edit_set_character_outline_ranges !== "function")
        throw new Error("HwpxCharacterOutlineRangesAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_character_outline_ranges(ptr, size, value))
          throw memory.error();
      });
    },
    setCharacterStrike({ section, paragraph, startUnit, endUnit, enabled }) {
      ready();
      [section, paragraph, startUnit, endUnit].forEach(uint);
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      if (typeof enabled !== "boolean")
        throw new TypeError("InvalidCharacterProperties");
      if (typeof wasm.hwpx_edit_set_character_strike !== "function")
        throw new Error("HwpxCharacterStrikeAbiUnavailable");
      if (!wasm.hwpx_edit_set_character_strike(section, paragraph, startUnit, endUnit, Number(enabled)))
        throw memory.error();
    },
    setCharacterUnderline({ section, paragraph, startUnit, endUnit, kind }) {
      ready();
      [section, paragraph, startUnit, endUnit].forEach(uint);
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const value = characterUnderlineArg(kind);
      if (typeof wasm.hwpx_edit_set_character_underline !== "function")
        throw new Error("HwpxCharacterUnderlineAbiUnavailable");
      if (!wasm.hwpx_edit_set_character_underline(section, paragraph, startUnit, endUnit, value))
        throw memory.error();
    },
    setCharacterStrikeColor({ section, paragraph, startUnit, endUnit, color }) {
      ready();
      [section, paragraph, startUnit, endUnit].forEach(uint);
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const value = characterColorArg(color);
      if (typeof wasm.hwpx_edit_set_character_strike_color !== "function")
        throw new Error("HwpxCharacterStrikeColorAbiUnavailable");
      if (!wasm.hwpx_edit_set_character_strike_color(section, paragraph, startUnit, endUnit, value))
        throw memory.error();
    },
    setCharacterUnderlineColor({ section, paragraph, startUnit, endUnit, color }) {
      ready();
      [section, paragraph, startUnit, endUnit].forEach(uint);
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const value = characterColorArg(color);
      if (typeof wasm.hwpx_edit_set_character_underline_color !== "function")
        throw new Error("HwpxCharacterUnderlineColorAbiUnavailable");
      if (!wasm.hwpx_edit_set_character_underline_color(section, paragraph, startUnit, endUnit, value))
        throw memory.error();
    },
    setCharacterFont({ section, paragraph, startUnit, endUnit, language, fontId }) {
      ready();
      for (const [name, value] of Object.entries({ section, paragraph, startUnit, endUnit })) {
        if (!Number.isInteger(value) || value < 0 || value > 4294967295)
          throw new RangeError(`Invalid ${name}`);
      }
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const args = characterFontArgs(language, fontId);
      if (typeof wasm.hwpx_edit_set_character_font !== "function")
        throw new Error("HwpxCharacterFontAbiUnavailable");
      if (!wasm.hwpx_edit_set_character_font(section, paragraph, startUnit, endUnit, ...args))
        throw memory.error();
    },
    setCharacterFontName({ section, paragraph, startUnit, endUnit, language, name }) {
      ready();
      for (const [key, value] of Object.entries({ section, paragraph, startUnit, endUnit })) {
        if (!Number.isInteger(value) || value < 0 || value > 4294967295)
          throw new RangeError(`Invalid ${key}`);
      }
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const args = characterFontNameArgs(language, name);
      if (typeof wasm.hwpx_edit_set_character_font_name !== "function")
        throw new Error("HwpxCharacterFontNameAbiUnavailable");
      memory.withBytes(args.bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_character_font_name(section, paragraph, startUnit, endUnit, args.language, ptr, size))
          throw memory.error();
      });
    },
    spliceWithCharacterProperties(input) {
      ready();
      const { positions, bytes } = textTransactionArgs(input);
      const properties = characterPropertyArgs(input.properties);
      const mode = input.textMode ?? "plain";
      if (!["plain", "anchored", "field"].includes(mode))
        throw new RangeError("InvalidTextKind");
      const begin = input.beginElement ?? 0;
      uint(begin);
      const action = mode === "plain" ? wasm.hwpx_edit_splice_character_properties : wasm.hwpx_edit_splice_character_properties_protected;
      if (typeof action !== "function")
        throw new Error("HwpxCharacterPropertyTextAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        const extra = mode === "plain" ? [] : [mode === "anchored" ? 1 : 2, begin];
        if (!action(...positions, ptr, size, ...properties, ...extra))
          throw memory.error();
      });
    },
    spliceWithFontName(input) {
      ready();
      const { positions, bytes, font } = namedFontTextArgs(input);
      const mode = input.textMode ?? "plain", begin = input.beginElement ?? 0;
      if (!["plain", "anchored", "field"].includes(mode))
        throw new RangeError("InvalidTextKind");
      uint(begin);
      const properties = input.properties === undefined ? null : characterPropertyArgs(input.properties);
      const action = properties ? wasm.hwpx_edit_splice_font_name_properties : mode === "plain" ? wasm.hwpx_edit_splice_font_name : wasm.hwpx_edit_splice_font_name_protected;
      if (typeof action !== "function")
        throw new Error(properties ? "HwpxNamedFontPropertyTextAbiUnavailable" : "HwpxNamedFontTextAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => memory.withBytes(font.bytes, (namePtr, nameSize) => {
        const extra = properties ? [...properties, mode === "plain" ? 0 : mode === "anchored" ? 1 : 2, begin] : mode === "plain" ? [] : [mode === "anchored" ? 1 : 2, begin];
        if (!action(...positions, ptr, size, font.language, namePtr, nameSize, ...extra))
          throw memory.error();
      }));
    },
    setCharacterTextColor({ section, paragraph, startUnit, endUnit, color }) {
      ready();
      [section, paragraph, startUnit, endUnit].forEach(uint);
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const value = characterColorArg(color);
      if (typeof wasm.hwpx_edit_set_character_text_color !== "function")
        throw new Error("HwpxCharacterTextColorAbiUnavailable");
      if (!wasm.hwpx_edit_set_character_text_color(section, paragraph, startUnit, endUnit, value))
        throw memory.error();
    },
    setCharacterShade({ section, paragraph, startUnit, endUnit, color }) {
      ready();
      [section, paragraph, startUnit, endUnit].forEach(uint);
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const args = characterShadeArgs(color);
      if (typeof wasm.hwpx_edit_set_character_shade !== "function")
        throw new Error("HwpxCharacterShadeAbiUnavailable");
      if (!wasm.hwpx_edit_set_character_shade(section, paragraph, startUnit, endUnit, ...args))
        throw memory.error();
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
      ready();
      [section, paragraph, startUnit, endUnit].forEach(uint);
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const args = characterEffectArgs(effect, enabled);
      const method = characterEffectMode(exclusive) ? wasm.hwpx_edit_set_character_effect_exclusive : wasm.hwpx_edit_set_character_effect;
      if (typeof method !== "function")
        throw new Error(exclusive ? "HwpxCharacterEffectExclusiveAbiUnavailable" : "HwpxCharacterEffectAbiUnavailable");
      if (!method(section, paragraph, startUnit, endUnit, ...args))
        throw memory.error();
    },
    setCharacterOutline({ section, paragraph, startUnit, endUnit, kind }) {
      ready();
      [section, paragraph, startUnit, endUnit].forEach(uint);
      if (endUnit < startUnit)
        throw new RangeError("InvalidTextPosition");
      const value = characterOutlineArg(kind);
      if (typeof wasm.hwpx_edit_set_character_outline !== "function")
        throw new Error("HwpxCharacterOutlineAbiUnavailable");
      if (!wasm.hwpx_edit_set_character_outline(section, paragraph, startUnit, endUnit, value))
        throw memory.error();
    },
    setCellStyles(input) {
      ready();
      const value = validateCellStyles(input), borders = encodeCellBorderPatches(value.borders), fills = encodeCellFills(value.fills);
      if (Object.hasOwn(value, "diagonals")) {
        if (typeof wasm.hwpx_edit_set_cell_styles_v2 !== "function")
          throw Error("CellDiagonalAbiUnavailable");
        const diagonals = encodeCellDiagonals(value.diagonals);
        memory.withBytes(borders, (borderPtr, borderLength) => memory.withBytes(fills, (fillPtr, fillLength) => memory.withBytes(diagonals, (diagonalPtr, diagonalLength) => {
          if (!wasm.hwpx_edit_set_cell_styles_v2(borderPtr, borderLength, fillPtr, fillLength, diagonalPtr, diagonalLength))
            throw memory.error();
        })));
        return;
      }
      if (typeof wasm.hwpx_edit_set_cell_styles !== "function")
        throw Error("CellStylesAbiUnavailable");
      memory.withBytes(borders, (borderPtr, borderLength) => memory.withBytes(fills, (fillPtr, fillLength) => {
        if (!wasm.hwpx_edit_set_cell_styles(borderPtr, borderLength, fillPtr, fillLength))
          throw memory.error();
      }));
    },
    setCellFills(input) {
      ready();
      const values = validateCellFills(input), bytes = encodeCellFills(values);
      if (typeof wasm.hwpx_edit_set_cell_fills !== "function")
        throw Error("CellFillBatchAbiUnavailable");
      memory.withBytes(bytes, (ptr, length) => {
        if (!wasm.hwpx_edit_set_cell_fills(ptr, length))
          throw memory.error();
      });
    },
    setCellAppearance(input) {
      ready();
      const value = validateCellAppearance(input), bytes = encodeCellBorders(value.cells), bg = value.background;
      if (typeof wasm.hwpx_edit_set_cell_appearance !== "function")
        throw Error("HwpxCellAppearanceAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_cell_appearance(ptr, size, bg ? 1 : 0, bg?.section ?? 0, bg?.tableNode ?? 0, bg?.listNode ?? 0, bg?.color ?? 0))
          throw memory.error();
      });
    },
    setCellBorders(cells) {
      ready();
      const bytes = encodeCellBorders(cells);
      if (typeof wasm.hwpx_edit_set_cell_borders !== "function")
        throw Error("HwpxCellBorderBatchAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_cell_borders(ptr, size))
          throw memory.error();
      });
    },
    setCellBorder(input) {
      ready();
      const value = validateCellBorder(input);
      if (typeof wasm.hwpx_edit_set_cell_border !== "function")
        throw new Error("HwpxCellBorderAbiUnavailable");
      if (!wasm.hwpx_edit_set_cell_border(value.section, value.tableNode, value.listNode, value.edges, cellBorderStyleCode(value.style), value.width, value.color))
        throw memory.error();
    },
    setCellBackground(input) {
      ready();
      const value = validateCellBackground(input);
      if (typeof wasm.hwpx_edit_set_cell_background !== "function")
        throw new Error("HwpxCellBackgroundAbiUnavailable");
      if (!wasm.hwpx_edit_set_cell_background(value.section, value.tableNode, value.listNode, value.color))
        throw memory.error();
    },
    setCellSize({ section, listNode, width, height }) {
      ready();
      [section, listNode, width, height].forEach(uint);
      if (typeof wasm.hwpx_edit_set_cell_size !== "function")
        throw new Error("HwpxCellSizeAbiUnavailable");
      if (!wasm.hwpx_edit_set_cell_size(section, listNode, width, height))
        throw memory.error();
    },
    setCellSizes(cells) {
      ready();
      const bytes = encodeCellSizes(cells);
      if (typeof wasm.hwpx_edit_set_cell_sizes !== "function")
        throw new Error("HwpxCellSizeBatchAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_cell_sizes(ptr, size))
          throw memory.error();
      });
    },
    setPictureDimensions({ section, pictureNode, display, original, current }) {
      ready();
      [section, pictureNode].forEach(uint);
      let mask = 0;
      const values = [];
      for (const [index, pair] of [display, original, current].entries()) {
        if (pair === undefined || pair === null) {
          values.push(0, 0);
          continue;
        }
        if (!Array.isArray(pair) || pair.length !== 2)
          throw new TypeError("InvalidPictureDimensionPair");
        const width = pair[0], height = pair[1];
        uint(width);
        uint(height);
        mask |= 1 << index;
        values.push(width, height);
      }
      if (typeof wasm.hwpx_edit_set_picture_dimensions !== "function")
        throw new Error("HwpxPictureDimensionsAbiUnavailable");
      if (!wasm.hwpx_edit_set_picture_dimensions(section, pictureNode, mask, ...values))
        throw memory.error();
    },
    resizePicture({ section, pictureNode, width, height }) {
      ready();
      [section, pictureNode, width, height].forEach(uint);
      if (width === 0 || height === 0)
        throw new RangeError("InvalidResizeAxisSize");
      if (typeof wasm.hwpx_edit_resize_picture !== "function")
        throw new Error("HwpxPictureResizeAbiUnavailable");
      if (!wasm.hwpx_edit_resize_picture(section, pictureNode, width, height))
        throw memory.error();
    },
    groupedPictureResizeAvailable(section, pictureNode) {
      ready();
      [section, pictureNode].forEach(uint);
      if (typeof wasm.hwpx_edit_group_picture_resize_available !== "function")
        throw new Error("HwpxGroupedPictureResizeAbiUnavailable");
      if (!wasm.hwpx_edit_group_picture_resize_available(section, pictureNode))
        throw memory.error();
      return true;
    },
    characterShapeIds() {
      ready();
      if (typeof wasm.hwpx_edit_character_shape_ids !== "function")
        throw new Error("HwpxCharacterFormatAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_character_shape_ids())
          throw memory.error();
        const bytes = memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len());
        if (bytes.length % 4 !== 0)
          throw new Error("InvalidCharacterShapeIds");
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        return Array.from({ length: bytes.length / 4 }, (_, index) => view.getUint32(index * 4, true));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    paragraphShapes() {
      ready();
      if (typeof wasm.hwpx_edit_paragraph_shapes !== "function")
        throw new Error("HwpxParagraphShapesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_paragraph_shapes())
          throw memory.error();
        return decodeHwpxParagraphShapes(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    characterShapes() {
      ready();
      if (typeof wasm.hwpx_edit_character_shapes !== "function")
        throw new Error("HwpxCharacterShapesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_character_shapes())
          throw memory.error();
        return decodeCharacterShapes(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    characterFontReferences() {
      ready();
      if (typeof wasm.hwpx_edit_character_font_references !== "function")
        throw new Error("HwpxCharacterFontReferencesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_character_font_references())
          throw memory.error();
        return decodeCharacterFontReferences(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    fontFaces() {
      ready();
      if (typeof wasm.hwpx_edit_font_faces !== "function")
        throw new Error("HwpxFontFacesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_font_faces())
          throw memory.error();
        return decodeFontFaces(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    fontFaceMetadata() {
      ready();
      if (typeof wasm.hwpx_edit_font_face_metadata !== "function")
        throw new Error("HwpxFontFaceMetadataAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_font_face_metadata())
          throw memory.error();
        return decodeHwpxFontFaceMetadata(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    characterFontMetrics() {
      ready();
      if (typeof wasm.hwpx_edit_character_font_metrics !== "function")
        throw new Error("HwpxCharacterFontMetricsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_character_font_metrics())
          throw memory.error();
        return decodeCharacterFontMetrics(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()), "hwpx");
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    supportsDocumentProvenance() {
      return typeof wasm.hwpx_edit_document_provenance === "function";
    },
    documentProvenance() {
      ready();
      if (typeof wasm.hwpx_edit_document_provenance !== "function")
        throw new Error("HwpxDocumentProvenanceAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_document_provenance())
          throw memory.error();
        return decodeDocumentProvenance(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    characterTextColors() {
      ready();
      if (typeof wasm.hwpx_edit_character_text_colors !== "function")
        throw new Error("HwpxCharacterTextColorsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_character_text_colors())
          throw memory.error();
        return decodeCharacterTextColors(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    characterShades() {
      ready();
      if (typeof wasm.hwpx_edit_character_shades !== "function")
        throw new Error("HwpxCharacterShadesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_character_shades())
          throw memory.error();
        return decodeCharacterShades(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    characterEffects() {
      ready();
      if (typeof wasm.hwpx_edit_character_effects !== "function")
        throw new Error("HwpxCharacterEffectsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_character_effects())
          throw memory.error();
        return decodeCharacterEffects(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    characterOutlines() {
      ready();
      if (typeof wasm.hwpx_edit_character_outlines !== "function")
        throw new Error("HwpxCharacterOutlinesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_character_outlines())
          throw memory.error();
        return decodeCharacterOutlines(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    characterStrikeStyles() {
      ready();
      if (typeof wasm.hwpx_edit_character_strike_styles !== "function")
        throw new Error("HwpxCharacterStrikeStylesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_character_strike_styles())
          throw memory.error();
        return decodeCharacterStrikeStyles(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    characterStrikes() {
      ready();
      if (typeof wasm.hwpx_edit_character_strikes !== "function")
        throw new Error("HwpxCharacterStrikesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_character_strikes())
          throw memory.error();
        return decodeCharacterStrikes(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    characterUnderlines() {
      ready();
      if (typeof wasm.hwpx_edit_character_underlines !== "function")
        throw new Error("HwpxCharacterUnderlinesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_character_underlines())
          throw memory.error();
        return decodeCharacterUnderlines(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    characterUnderlineStyles() {
      ready();
      if (typeof wasm.hwpx_edit_character_underline_styles !== "function")
        throw new Error("HwpxCharacterUnderlineStylesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_character_underline_styles())
          throw memory.error();
        return decodeCharacterUnderlineStyles(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    tableBindings(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_table_bindings !== "function")
        throw new Error("HwpxTableBindingsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_table_bindings(section))
          throw memory.error();
        return decodeTableBindings(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    tablePlacements(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_table_placements !== "function")
        throw new Error("HwpxTablePlacementsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_table_placements(section))
          throw memory.error();
        return decodeTablePlacements(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    drawingTextBindings(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_drawing_text_bindings !== "function")
        throw new Error("HwpxDrawingTextBindingsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_drawing_text_bindings(section))
          throw memory.error();
        return decodeDrawingTextBindings(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    drawingTextSnapshot(section, drawingNode) {
      ready();
      uint(section);
      uint(drawingNode);
      if (typeof wasm.hwpx_edit_drawing_text_snapshot !== "function")
        throw new Error("HwpxDrawingTextSnapshotAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_drawing_text_snapshot(section, drawingNode))
          throw memory.error();
        return decodeDrawingTextSnapshot(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    ...typeof wasm.hwpx_edit_drawing_text_requested === "function" && typeof wasm.hwpx_edit_drawing_text_requested_max_nodes === "function" ? {
      drawingTextRequestedMaxNodes: wasm.hwpx_edit_drawing_text_requested_max_nodes(),
      drawingTextRequested(section, nodes) {
        ready();
        uint(section);
        const { requested, bytes } = drawingTextRequest(nodes, wasm.hwpx_edit_drawing_text_requested_max_nodes());
        return memory.withBytes(bytes, (ptr, size) => {
          try {
            if (!wasm.hwpx_edit_drawing_text_requested(section, ptr, size))
              throw memory.error();
            return decodeDrawingTextRequested(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()), requested);
          } finally {
            wasm.hwpx_edit_output_free();
          }
        });
      }
    } : {},
    drawingTextSnapshots(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_drawing_text_snapshots !== "function")
        throw new Error("HwpxDrawingTextSnapshotsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_drawing_text_snapshots(section))
          throw memory.error();
        return decodeDrawingTextSnapshots(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    sectionFillBrushes(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_section_fill_brushes !== "function")
        throw new Error("HwpxFillBrushesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_section_fill_brushes(section))
          throw memory.error();
        return decodeFillBrushes(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    rectangleNodes(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_rectangle_nodes !== "function")
        throw new Error("HwpxRectangleNodesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_rectangle_nodes(section))
          throw memory.error();
        const nodes = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len())));
        if (!Array.isArray(nodes) || !nodes.every((n, i) => Number.isInteger(n) && n >= 0 && n <= 4294967295 && (i === 0 || n > nodes[i - 1])))
          throw new Error("InvalidRectangleNodes");
        return nodes;
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    rectangleRenderingSource(section, rectangleNode) {
      ready();
      uint(section);
      uint(rectangleNode);
      if (typeof wasm.hwpx_edit_rectangle_rendering_source !== "function")
        throw new Error("HwpxRectangleRenderingSourceAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_rectangle_rendering_source(section, rectangleNode))
          throw memory.error();
        return decodeRectangleRenderingSource(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    rectangleRenderingSources(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_rectangle_rendering_sources !== "function")
        throw new Error("HwpxRectangleRenderingSourcesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_rectangle_rendering_sources(section))
          throw memory.error();
        return decodeRectangleRenderingSources(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    ellipseSources(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_ellipse_sources !== "function")
        throw new Error("HwpxEllipseSourcesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_ellipse_sources(section))
          throw memory.error();
        return decodeEllipseSources(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    curveGeometry(section, node) {
      ready();
      uint(section);
      uint(node);
      if (typeof wasm.hwpx_edit_curve_geometry !== "function")
        throw new Error("HwpxCurveGeometryAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_curve_geometry(section, node))
          throw memory.error();
        const value = decodeCurveGeometry(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
        if (value.node !== node)
          throw new Error("CurveGeometryNodeMismatch");
        return value;
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    curveOwner(section, node) {
      ready();
      uint(section);
      uint(node);
      if (typeof wasm.hwpx_edit_curve_owner !== "function")
        throw new Error("HwpxCurveOwnerAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_curve_owner(section, node))
          throw memory.error();
        const value = decodeCurveOwner(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
        if (value.node !== node)
          throw new Error("CurveOwnerNodeMismatch");
        return value;
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    tabSources(section, paragraph) {
      ready();
      uint(section);
      uint(paragraph);
      if (typeof wasm.hwpx_edit_tab_sources !== "function")
        throw new Error("HwpxTabSourcesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_tab_sources(section, paragraph))
          throw memory.error();
        const value = decodeTabSources(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
        if (value.section !== section || value.paragraph !== paragraph)
          throw new Error("TabSourcesParagraphMismatch");
        return value;
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    tabDefinitions() {
      ready();
      if (typeof wasm.hwpx_edit_tab_definitions !== "function")
        throw new Error("HwpxTabDefinitionsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_tab_definitions())
          throw memory.error();
        return decodeTabDefinitions(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    sectionTabSources() {
      ready();
      if (typeof wasm.hwpx_edit_section_tabs !== "function")
        throw new Error("HwpxSectionTabsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_section_tabs())
          throw memory.error();
        return decodeSectionTabs(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    supportsCreatedCellSoftLineBreaks() {
      return typeof wasm.hwpx_edit_created_cell_soft_line_breaks === "function" && wasm.hwpx_edit_created_cell_soft_line_breaks() === 1;
    },
    tableCreationResources() {
      ready();
      if (typeof wasm.hwpx_edit_table_creation_resources !== "function")
        throw new Error("HwpxTableCreationResourcesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_table_creation_resources())
          throw memory.error();
        return decodeTableCreationResources(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    saveForDisplay() {
      ready();
      try {
        const save = typeof wasm.hwpx_edit_save_for_display === "function" ? wasm.hwpx_edit_save_for_display : wasm.hwpx_edit_save;
        if (!save())
          throw memory.error();
        return memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len());
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    supportsTableInitialTexts() {
      ready();
      return typeof wasm.hwpx_edit_insert_table_with_texts === "function";
    },
    insertTable(section, paragraph, unit, options) {
      ready();
      [section, paragraph, unit].forEach(uint);
      if (!options || typeof options !== "object" || Array.isArray(options))
        throw new TypeError("InvalidTableCreationOptions");
      const { rows, columns, width, rowHeight, resources } = options;
      if (!resources || typeof resources !== "object" || Array.isArray(resources))
        throw new TypeError("InvalidTableCreationResources");
      const args = [
        rows,
        columns,
        width,
        rowHeight,
        resources.paragraph,
        resources.character,
        resources.style,
        resources.border_fill
      ];
      args.forEach(uint);
      if (typeof wasm.hwpx_edit_insert_table !== "function")
        throw new Error("HwpxTableCreationAbiUnavailable");
      const withTexts = Object.hasOwn(options, "cellTexts");
      let request;
      if (withTexts) {
        if (typeof wasm.hwpx_edit_insert_table_with_texts !== "function")
          throw new Error("HwpxTableInitialTextsAbiUnavailable");
        request = encodeTableTextRequest({
          version: 1,
          section,
          paragraph,
          unit,
          rows,
          columns,
          width,
          row_height: rowHeight,
          resources: {
            paragraph: args[4],
            character: args[5],
            style: args[6],
            border_fill: args[7]
          },
          cell_texts: captureTableInitialTexts(rows, columns, options.cellTexts)
        });
      }
      try {
        const changed = withTexts ? memory.withBytes(request, (ptr, size) => wasm.hwpx_edit_insert_table_with_texts(ptr, size)) : wasm.hwpx_edit_insert_table(section, paragraph, unit, ...args);
        if (!changed)
          throw memory.error();
        const identity = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len())));
        createdTableIdentity(identity);
        return identity;
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    createdTables(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_created_tables !== "function")
        throw new Error("HwpxCreatedTablesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_created_tables(section))
          throw memory.error();
        return decodeCreatedTables(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    setCreatedCellText(section, identity, row, column, text) {
      ready();
      [section, row, column].forEach(uint);
      const id = createdTableIdentity(identity);
      const bytes = encodedText(text);
      if (typeof wasm.hwpx_edit_set_created_cell_text !== "function")
        throw new Error("HwpxCreatedCellTextAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_created_cell_text(section, Number(id & 0xffffffffn), Number(id >> 32n), row, column, ptr, size))
          throw memory.error();
      });
    },
    containerSourceSnapshot(section, containerNode) {
      ready();
      uint(section);
      uint(containerNode);
      if (typeof wasm.hwpx_edit_container_source_snapshot !== "function")
        throw new Error("HwpxContainerSourceAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_container_source_snapshot(section, containerNode))
          throw memory.error();
        return decodeContainerSource(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    containerCaptionBindings(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_container_caption_bindings !== "function")
        throw new Error("HwpxContainerCaptionBindingsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_container_caption_bindings(section))
          throw memory.error();
        return decodeCaptionBindings(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()), "container_node", "InvalidContainerCaptionBindings");
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    oleBytes(section, oleNode, { allowExternalPackagedCopy = false } = {}) {
      ready();
      uint(section);
      uint(oleNode);
      if (typeof allowExternalPackagedCopy !== "boolean")
        throw new Error("InvalidOleSourceOptions");
      if (typeof wasm.hwpx_edit_ole_bytes !== "function")
        throw new Error("HwpxOleBytesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_ole_bytes(section, oleNode, Number(allowExternalPackagedCopy)))
          throw memory.error();
        return decodeOleBytes(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    oleSites(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_ole_sites !== "function")
        throw new Error("HwpxOleSourceAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_ole_sites(section))
          throw memory.error();
        return decodeOleSites(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    oleSource(section, oleNode) {
      ready();
      uint(section);
      uint(oleNode);
      if (typeof wasm.hwpx_edit_ole_source !== "function")
        throw new Error("HwpxOleSourceAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_ole_source(section, oleNode))
          throw memory.error();
        return decodeOleSource(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    pictureSites(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_picture_sites !== "function")
        throw new Error("HwpxPictureSitesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_picture_sites(section))
          throw memory.error();
        return decodePictureSites(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    pictureFlow(section, pictureNode) {
      ready();
      uint(section);
      uint(pictureNode);
      if (typeof wasm.hwpx_edit_picture_flow !== "function")
        throw new Error("HwpxPictureFlowAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_picture_flow(section, pictureNode))
          throw memory.error();
        return decodePictureFlow(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    picturePosition(section, pictureNode) {
      ready();
      uint(section);
      uint(pictureNode);
      if (typeof wasm.hwpx_edit_picture_position !== "function")
        throw new Error("HwpxPicturePositionAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_picture_position(section, pictureNode))
          throw memory.error();
        return decodePicturePosition(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    pictureRenderingCorners(section, pictureNode) {
      ready();
      uint(section);
      uint(pictureNode);
      if (typeof wasm.hwpx_edit_picture_rendering_corners !== "function")
        throw new Error("HwpxPictureCornersAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_picture_rendering_corners(section, pictureNode))
          throw memory.error();
        return decodePictureRenderingCorners(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    pictureOwner(section, pictureNode) {
      ready();
      uint(section);
      uint(pictureNode);
      if (typeof wasm.hwpx_edit_picture_owner !== "function")
        throw new Error("HwpxPictureOwnerAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_picture_owner(section, pictureNode))
          throw memory.error();
        return decodePictureOwner(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    pictureOwners(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_picture_owners !== "function")
        throw new Error("HwpxPictureOwnersAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_picture_owners(section))
          throw memory.error();
        return decodePictureOwners(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    lineNodes(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_line_nodes !== "function")
        throw new Error("HwpxLineDisplayAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_line_nodes(section))
          throw memory.error();
        return decodeLineNodes(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    lineGeometry(section, node) {
      ready();
      uint(section);
      uint(node);
      if (typeof wasm.hwpx_edit_line_geometry !== "function")
        throw new Error("HwpxLineGeometryAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_line_geometry(section, node))
          throw memory.error();
        return decodeLineGeometry(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()), node);
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    connectorNodes(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_connector_nodes !== "function")
        throw new Error("HwpxConnectorSourceAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_connector_nodes(section))
          throw memory.error();
        return decodeConnectorNodes(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    connectorGeometrySource(section, node) {
      ready();
      uint(section);
      uint(node);
      if (typeof wasm.hwpx_edit_connector_geometry_source !== "function")
        throw new Error("HwpxConnectorSourceAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_connector_geometry_source(section, node))
          throw memory.error();
        return decodeConnectorSource(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    drawingStrokeSource(section, node) {
      ready();
      uint(section);
      uint(node);
      if (typeof wasm.hwpx_edit_drawing_stroke_source !== "function")
        throw new Error("HwpxDrawingStrokeSourceAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_drawing_stroke_source(section, node))
          throw memory.error();
        return decodeDrawingStrokeSource(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()), node);
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    connectorOwner(section, node) {
      ready();
      uint(section);
      uint(node);
      if (typeof wasm.hwpx_edit_connector_owner !== "function")
        throw new Error("HwpxConnectorOwnerAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_connector_owner(section, node))
          throw memory.error();
        return decodeConnectorOwner(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()), node);
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    connectorRenderingSource(section, node) {
      ready();
      uint(section);
      uint(node);
      if (typeof wasm.hwpx_edit_connector_rendering_source !== "function")
        throw new Error("HwpxConnectorRenderingSourceAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_connector_rendering_source(section, node))
          throw memory.error();
        return decodeConnectorRenderingSource(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()), node);
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    connectorPlacementSource(section, node) {
      ready();
      uint(section);
      uint(node);
      if (typeof wasm.hwpx_edit_connector_placement_source !== "function")
        throw new Error("HwpxConnectorPlacementSourceAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_connector_placement_source(section, node))
          throw memory.error();
        return {
          sourceOnly: true,
          ...decodeDrawingPlacement(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()), "InvalidConnectorPlacementSource")
        };
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    pageSettings() {
      ready();
      if (typeof wasm.hwpx_edit_page_settings !== "function")
        throw new Error("HwpxPageSettingsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_page_settings())
          throw memory.error();
        return decodePageSettings(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    noteShapes() {
      ready();
      if (typeof wasm.hwpx_edit_note_shapes !== "function")
        throw new Error("HwpxNoteShapesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_note_shapes())
          throw memory.error();
        return decodeNoteShapes(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    paragraphFlow(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_paragraph_flow !== "function")
        throw new Error("HwpxParagraphFlowAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_paragraph_flow(section))
          throw memory.error();
        return decodeParagraphFlow(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    tablePagination(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_table_pagination !== "function")
        throw new Error("HwpxTablePaginationAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_table_pagination(section))
          throw memory.error();
        return decodeTablePagination(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    ...typeof wasm.hwpx_edit_line_display_batch === "function" && typeof wasm.hwpx_edit_line_display_batch_max_nodes === "function" ? {
      lineDisplayBatchMaxNodes: wasm.hwpx_edit_line_display_batch_max_nodes(),
      lineDisplayBatch(section, nodes) {
        ready();
        uint(section);
        const bytes = encodeLineDisplayNodes(nodes, wasm.hwpx_edit_line_display_batch_max_nodes());
        return memory.withBytes(bytes, (ptr, size) => {
          try {
            if (!wasm.hwpx_edit_line_display_batch(section, ptr, size))
              throw memory.error();
            return decodeLineDisplayBatch(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()), nodes);
          } finally {
            wasm.hwpx_edit_output_free();
          }
        });
      }
    } : {},
    ...typeof wasm.hwpx_edit_table_border_sources_batch === "function" && typeof wasm.hwpx_edit_table_border_sources_batch_max_sections === "function" ? {
      tableBorderSourcesBatchMaxSections: wasm.hwpx_edit_table_border_sources_batch_max_sections(),
      tableBorderSourcesBatch(sections) {
        ready();
        const bytes = encodeTableBorderSections(sections, wasm.hwpx_edit_table_border_sources_batch_max_sections());
        return memory.withBytes(bytes, (ptr, size) => {
          try {
            if (!wasm.hwpx_edit_table_border_sources_batch(ptr, size))
              throw memory.error();
            return decodeTableBorderBatch(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()), sections);
          } finally {
            wasm.hwpx_edit_output_free();
          }
        });
      }
    } : {},
    tableBorderSources(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_table_border_sources !== "function")
        throw new Error("HwpxTableBorderSourcesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_table_border_sources(section))
          throw memory.error();
        return decodeTableBorderSources(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    tableGeometry(section, tableNode) {
      ready();
      uint(section);
      uint(tableNode);
      if (typeof wasm.hwpx_edit_table_geometry !== "function")
        throw new Error("HwpxTableGeometryAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_table_geometry(section, tableNode))
          throw memory.error();
        return decodeTableGeometry(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    automaticNumberSources(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_automatic_number_sources !== "function")
        throw new Error("HwpxAutomaticNumberSourcesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_automatic_number_sources(section))
          throw memory.error();
        return decodeAutomaticNumberSources(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    automaticNumberSites(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_automatic_number_sites !== "function")
        throw new Error("HwpxAutomaticNumberSitesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_automatic_number_sites(section))
          throw memory.error();
        return decodeAutomaticNumberSites(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    noteReferenceSites(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_note_reference_sites !== "function")
        throw new Error("HwpxNoteReferenceSitesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_note_reference_sites(section))
          throw memory.error();
        return decodeNoteReferenceSites(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    paragraphTextSnapshot(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_paragraph_text_snapshot !== "function")
        throw new Error("HwpxParagraphTextSnapshotAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_paragraph_text_snapshot(section))
          throw memory.error();
        return decodeParagraphTextSnapshot(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    formulaFieldSources(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_formula_field_sources !== "function")
        throw new Error("HwpxFormulaFieldSourcesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_formula_field_sources(section))
          throw memory.error();
        return decodeFormulaFieldSources(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    tableCaptionBindings(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_table_caption_bindings !== "function")
        throw new Error("HwpxTableCaptionBindingsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_table_caption_bindings(section))
          throw memory.error();
        return decodeTableCaptionBindings(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    tableCaption(section, tableNode) {
      ready();
      uint(section);
      uint(tableNode);
      if (typeof wasm.hwpx_edit_table_caption !== "function")
        throw new Error("HwpxTableCaptionAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_table_caption(section, tableNode))
          throw memory.error();
        return decodeTableCaption(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    pictureCaptionBindings(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_picture_caption_bindings !== "function")
        throw new Error("HwpxPictureCaptionBindingsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_picture_caption_bindings(section))
          throw memory.error();
        return decodeCaptionBindings(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()), "picture_node", "InvalidPictureCaptionBindings");
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    pictureCaption(section, pictureNode) {
      ready();
      uint(section);
      uint(pictureNode);
      if (typeof wasm.hwpx_edit_picture_caption !== "function")
        throw new Error("HwpxPictureCaptionAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_picture_caption(section, pictureNode))
          throw memory.error();
        return decodeTableCaption(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    tableCellMargin(section, listNode) {
      ready();
      uint(section);
      uint(listNode);
      if (typeof wasm.hwpx_edit_table_cell_margin !== "function")
        throw new Error("HwpxTableCellMarginAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_table_cell_margin(section, listNode))
          throw memory.error();
        return decodeTableCellMargin(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    formulaSources(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_formula_sources !== "function")
        throw new Error("HwpxFormulaSourcesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_formula_sources(section))
          throw memory.error();
        return decodeFormulaSources(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    formulaCurrent(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_formula_current !== "function")
        throw new Error("HwpxFormulaCurrentAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_formula_current(section))
          throw memory.error();
        return decodeFormulaSources(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()), { current: true });
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    linePlacement(section, lineNode) {
      ready();
      uint(section);
      uint(lineNode);
      if (typeof wasm.hwpx_edit_line_placement !== "function")
        throw new Error("HwpxLinePlacementAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_line_placement(section, lineNode))
          throw memory.error();
        return decodeLinePlacement(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    lineDisplay(section, lineNode) {
      ready();
      uint(section);
      uint(lineNode);
      if (typeof wasm.hwpx_edit_line_display !== "function")
        throw new Error("HwpxLineDisplayAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_line_display(section, lineNode))
          throw memory.error();
        return decodeLineDisplay(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    tableBackgroundBytes(section, listNode) {
      ready();
      uint(section);
      uint(listNode);
      if (typeof wasm.hwpx_edit_table_background_bytes !== "function")
        throw new Error("HwpxTableBackgroundBytesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_table_background_bytes(section, listNode))
          throw memory.error();
        return memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len());
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    pictureBytes(section, pictureNode) {
      ready();
      uint(section);
      uint(pictureNode);
      if (typeof wasm.hwpx_edit_picture_bytes !== "function")
        throw new Error("HwpxPictureBytesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_picture_bytes(section, pictureNode))
          throw memory.error();
        return memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len());
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    pictureGeometry(section, pictureNode) {
      ready();
      uint(section);
      uint(pictureNode);
      if (typeof wasm.hwpx_edit_picture_geometry !== "function")
        throw new Error("HwpxPictureGeometryAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_picture_geometry(section, pictureNode))
          throw memory.error();
        return decodePictureGeometry(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    pictureSizeProtection(section, pictureNode) {
      ready();
      uint(section);
      uint(pictureNode);
      if (typeof wasm.hwpx_edit_picture_size_protection !== "function")
        throw new Error("HwpxPictureSizeProtectionAbiUnavailable");
      const value = wasm.hwpx_edit_picture_size_protection(section, pictureNode);
      if (value === 3)
        throw memory.error();
      if (![0, 1, 2].includes(value))
        throw new Error("InvalidPictureSizeProtection");
      return value === 0 ? null : value === 2;
    },
    pictureCrop(section, pictureNode) {
      ready();
      uint(section);
      uint(pictureNode);
      if (typeof wasm.hwpx_edit_picture_crop !== "function")
        throw new Error("HwpxPictureCropAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_picture_crop(section, pictureNode))
          throw memory.error();
        return decodePictureCrop(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    pictureTransform(section, pictureNode) {
      ready();
      uint(section);
      uint(pictureNode);
      if (typeof wasm.hwpx_edit_picture_transform !== "function")
        throw new Error("HwpxPictureTransformAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_picture_transform(section, pictureNode))
          throw memory.error();
        return decodePictureTransform(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    characterRanges(section, paragraph) {
      ready();
      uint(section);
      uint(paragraph);
      if (typeof wasm.hwpx_edit_character_ranges !== "function")
        throw new Error("HwpxCharacterRangesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_character_ranges(section, paragraph))
          throw memory.error();
        return decodeCharacterRanges(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    anchorText(section, paragraph) {
      ready();
      uint(section);
      uint(paragraph);
      if (typeof wasm.hwpx_edit_anchor_text !== "function")
        throw new Error("HwpxAnchorEditAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_anchor_text(section, paragraph))
          throw memory.error();
        return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    spliceAnchored(section, paragraph, start, deleted, text) {
      ready();
      [section, paragraph, start, deleted].forEach(uint);
      if (typeof wasm.hwpx_edit_splice_anchored !== "function")
        throw new Error("HwpxAnchorEditAbiUnavailable");
      const bytes = encodedText(text);
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_splice_anchored(section, paragraph, start, deleted, ptr, size))
          throw memory.error();
      });
    },
    spliceFieldLabel(section, paragraph, beginElement, start, deleted, text) {
      ready();
      [section, paragraph, beginElement, start, deleted].forEach(uint);
      if (typeof wasm.hwpx_edit_splice_field_label !== "function")
        throw new Error("HwpxFieldEditAbiUnavailable");
      const bytes = encodedText(text);
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_splice_field_label(section, paragraph, beginElement, start, deleted, ptr, size))
          throw memory.error();
      });
    },
    setFormulaDefinition(section, beginElement, formula) {
      ready();
      [section, beginElement].forEach(uint);
      if (typeof wasm.hwpx_edit_set_formula_definition !== "function")
        throw new Error("HwpxFormulaEditAbiUnavailable");
      const bytes = encodedText(formula);
      if (bytes.length > 4096)
        throw new Error("LimitExceeded");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_formula_definition(section, beginElement, ptr, size))
          throw memory.error();
      });
    },
    setManualFormulaResult(section, beginElement, display) {
      ready();
      [section, beginElement].forEach(uint);
      const bytes = manualFormulaResultBytes(display, "hwpx_edit_set_manual_formula_result", "HwpxManualFormulaResultAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_manual_formula_result(section, beginElement, ptr, size))
          throw memory.error();
      });
    },
    spliceManualFormulaResult(section, beginElement, start, deleted, text) {
      ready();
      [section, beginElement, start, deleted].forEach(uint);
      const bytes = manualFormulaResultBytes(text, "hwpx_edit_splice_manual_formula_result", "HwpxManualFormulaResultSpliceAbiUnavailable");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_splice_manual_formula_result(section, beginElement, start, deleted, ptr, size))
          throw memory.error();
      });
    },
    ...createHwpxChartApi({ wasm, memory, ready, uint, encodedText }),
    formSourceNodes(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_form_source_nodes !== "function")
        throw new Error("HwpxFormSourceAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_form_source_nodes(section))
          throw memory.error();
        return decodeFormSourceNodes(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    inlineStringSources() {
      ready();
      if (typeof wasm.hwpx_edit_inline_string_sources !== "function")
        throw new Error("HwpxInlineStringSourcesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_inline_string_sources())
          throw memory.error();
        return decodeInlineStringSources(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    dutmalText(section, node, kind) {
      ready();
      [section, node].forEach(uint);
      const selected = dutmalKind(kind);
      if (typeof wasm.hwpx_edit_dutmal_text !== "function")
        throw new Error("HwpxDutmalTextAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_dutmal_text(section, node, selected))
          throw memory.error();
        return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    equationScript(section, node) {
      ready();
      [section, node].forEach(uint);
      if (typeof wasm.hwpx_edit_equation_script !== "function")
        throw new Error("HwpxEquationScriptAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_equation_script(section, node))
          throw memory.error();
        return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    measureEquation(source, settings) {
      ready();
      return createEquationEngine(wasm).measure(source, settings);
    },
    equationStyles(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_equation_styles !== "function")
        throw new Error("HwpxEquationStylesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_equation_styles(section))
          throw memory.error();
        return decodeEquationStyles(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    layoutEquation(source, settings, measurements, options) {
      ready();
      return createEquationEngine(wasm).layout(source, settings, measurements, options);
    },
    equationSources(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_equation_sources !== "function")
        throw new Error("HwpxEquationSourcesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_equation_sources(section))
          throw memory.error();
        return decodeEquationSources(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    equationScripts(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_equation_scripts !== "function")
        throw new Error("HwpxEquationSnapshotAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_equation_scripts(section))
          throw memory.error();
        return decodeEquationScripts(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    setEquationScript(section, node, value) {
      ready();
      [section, node].forEach(uint);
      if (typeof wasm.hwpx_edit_set_equation_script !== "function" || typeof wasm.hwpx_edit_equation_script_max_bytes !== "function")
        throw new Error("HwpxEquationScriptAbiUnavailable");
      const maxBytes = wasm.hwpx_edit_equation_script_max_bytes();
      if (!Number.isInteger(maxBytes) || maxBytes <= 0 || maxBytes > 4294967295)
        throw new Error("InvalidEquationScriptLimit");
      const bytes = encodedText(value);
      if (bytes.length > maxBytes)
        throw new Error("LimitExceeded");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_equation_script(section, node, ptr, size))
          throw memory.error();
      });
    },
    equationSites(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_equation_sites !== "function")
        throw new Error("HwpxEquationSitesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_equation_sites(section))
          throw memory.error();
        return decodeEquationSites(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    dutmalSites(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_dutmal_sites !== "function")
        throw new Error("HwpxDutmalSitesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_dutmal_sites(section))
          throw memory.error();
        return decodeDutmalSites(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    dutmalDisplayText(section, node) {
      ready();
      [section, node].forEach(uint);
      if (typeof wasm.hwpx_edit_dutmal_display_text !== "function")
        throw new Error("HwpxDutmalDisplayTextAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_dutmal_display_text(section, node))
          throw memory.error();
        return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    fieldLabelDisplayText(section, paragraph) {
      ready();
      [section, paragraph].forEach(uint);
      if (typeof wasm.hwpx_edit_field_label_display_text !== "function")
        throw new Error("HwpxFieldLabelDisplayTextAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_field_label_display_text(section, paragraph))
          throw memory.error();
        return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    setDutmalText(section, node, kind, value) {
      ready();
      [section, node].forEach(uint);
      const selected = dutmalKind(kind);
      if (typeof wasm.hwpx_edit_set_dutmal_text !== "function" || typeof wasm.hwpx_edit_dutmal_text_max_bytes !== "function")
        throw new Error("HwpxDutmalTextAbiUnavailable");
      const maxBytes = wasm.hwpx_edit_dutmal_text_max_bytes();
      if (!Number.isInteger(maxBytes) || maxBytes <= 0 || maxBytes > 4294967295)
        throw new Error("InvalidDutmalTextLimit");
      const bytes = encodedText(value);
      if (bytes.length > maxBytes)
        throw new Error("LimitExceeded");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_dutmal_text(section, node, selected, ptr, size))
          throw memory.error();
      });
    },
    formSites(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_form_sites !== "function")
        throw new Error("HwpxFormSitesAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_form_sites(section))
          throw memory.error();
        return decodeFormSites(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    formSourceAttributes(section, formNode) {
      ready();
      [section, formNode].forEach(uint);
      if (typeof wasm.hwpx_edit_form_source_attributes !== "function")
        throw new Error("HwpxFormSourceAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_form_source_attributes(section, formNode))
          throw memory.error();
        return decodeFormSourceAttributes(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    checkBoxState(section, formNode) {
      ready();
      [section, formNode].forEach(uint);
      if (typeof wasm.hwpx_edit_checkbox_state !== "function")
        throw new Error("HwpxCheckBoxStateAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_checkbox_state(section, formNode))
          throw memory.error();
        return new TextDecoder("utf-8", { fatal: true }).decode(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    formSourceLayout(section, formNode) {
      ready();
      [section, formNode].forEach(uint);
      if (typeof wasm.hwpx_edit_form_source_layout !== "function")
        throw new Error("HwpxFormLayoutAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_form_source_layout(section, formNode))
          throw memory.error();
        return decodeFormSourceLayout(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    setCheckBoxState(section, formNode, state) {
      ready();
      [section, formNode].forEach(uint);
      if (typeof wasm.hwpx_edit_set_checkbox_state !== "function")
        throw new Error("HwpxCheckBoxStateAbiUnavailable");
      const bytes = encodedText(state);
      if (bytes.length > 32)
        throw new RangeError("LimitExceeded");
      memory.withBytes(bytes, (ptr, size) => {
        if (!wasm.hwpx_edit_set_checkbox_state(section, formNode, ptr, size))
          throw memory.error();
      });
    },
    fieldLabels,
    manualFormulaResultDisplaySnapshot(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_manual_formula_result_display_snapshot !== "function")
        throw new Error("HwpxFormulaResultSnapshotAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_manual_formula_result_display_snapshot(section))
          throw memory.error();
        return decodeFormulaResultDisplaySnapshot(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    pageAreaDeclarations(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_page_area_declarations !== "function")
        throw new Error("HwpxPageAreaDeclarationsAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_page_area_declarations(section))
          throw memory.error();
        return decodePageAreaDeclarations(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    manualFormulaResultParagraphs(section) {
      ready();
      uint(section);
      if (typeof wasm.hwpx_edit_manual_formula_result_paragraphs !== "function")
        throw new Error("HwpxManualFormulaResultParagraphAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_manual_formula_result_paragraphs(section))
          throw memory.error();
        return decodeFormulaResultParagraphs(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    manualFormulaResultTargets(section, paragraph) {
      ready();
      [section, paragraph].forEach(uint);
      if (typeof wasm.hwpx_edit_manual_formula_result_targets !== "function")
        throw new Error("HwpxManualFormulaResultTargetAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_manual_formula_result_targets(section, paragraph))
          throw memory.error();
        return decodeFieldTargets(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    manualFormulaResultDisplayText(section, paragraph) {
      ready();
      [section, paragraph].forEach(uint);
      if (typeof wasm.hwpx_edit_manual_formula_result_display_text !== "function")
        throw new Error("HwpxManualFormulaResultTargetAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_manual_formula_result_display_text(section, paragraph))
          throw memory.error();
        return new TextDecoder("utf-8", { fatal: true }).decode(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    manualFormulaResultRangeTarget(section, paragraph, start, end) {
      ready();
      [section, paragraph, start, end].forEach(uint);
      if (end < start)
        throw new Error("InvalidTextPosition");
      if (typeof wasm.hwpx_edit_manual_formula_result_range_target !== "function")
        throw new Error("HwpxManualFormulaResultTargetAbiUnavailable");
      try {
        if (!wasm.hwpx_edit_manual_formula_result_range_target(section, paragraph, start, end))
          throw memory.error();
        const targets = decodeFieldTargets(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
        if (targets.length > 1)
          throw new Error("InvalidFieldTargets");
        return targets[0] ?? null;
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    fieldRangeTarget(section, paragraph, start, end) {
      ready();
      [section, paragraph, start, end].forEach(uint);
      if (end < start)
        throw new Error("InvalidTextPosition");
      if (typeof wasm.hwpx_edit_field_range_target !== "function") {
        const targets = fieldLabels(section, paragraph).filter((t) => start >= t.start && end <= t.end);
        if (targets.length > 1)
          throw new Error("UnsupportedFieldLabelRange");
        return targets[0] ?? null;
      }
      try {
        if (!wasm.hwpx_edit_field_range_target(section, paragraph, start, end))
          throw memory.error();
        const targets = decodeFieldTargets(memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len()));
        if (targets.length > 1)
          throw new Error("InvalidFieldTargets");
        return targets[0] ?? null;
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    save() {
      ready();
      try {
        if (!wasm.hwpx_edit_save())
          throw memory.error();
        return memory.copy(wasm.hwpx_edit_output_ptr(), wasm.hwpx_edit_output_len());
      } finally {
        wasm.hwpx_edit_output_free();
      }
    },
    close() {
      if (!closed)
        wasm.hwpx_edit_close();
      closed = true;
    }
  };
}

export { createHwpxEditor2 };
