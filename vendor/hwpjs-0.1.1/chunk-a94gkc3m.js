import {
  sourceDisplayPosition,
  paragraphSpacingTypes,
  paragraphSpacingArgs,
  paragraphAlignmentKey,
  validateHwp5PictureSources
} from "./chunk-jk4tbr51.js";
import {
  HWP5_STRUCTURAL_ANCHOR_KINDS,
  validateHwp5PageAreaSources,
  validateHwp5MasterPageSources,
  validateHwp5DocumentProperties,
  validateHwp5PageControlSources,
  validateHwp5NoteSources,
  validateHwp5DrawingSources,
  validateHwp5DrawingComponentSources,
  validateHwp5DrawingListSources,
  validateHwp5DrawingLocalTransforms,
  validateHwp5DrawingRectangleCorners,
  validateHwp5DrawingPolygonPoints,
  validateHwp5DrawingStyleSources,
  validateHwp5PictureShadowSource,
  validateHwp5PictureTailSources,
  validateHwp5TableLayoutSources
} from "./chunk-x8k5ryaa.js";

// web/preview/table-source-columns.mjs
function sourceTableColumns(table) {
  const unavailable = (error) => ({ state: "unavailable", error });
  if (!Number.isSafeInteger(table?.columns) || table.columns < 1 || table.columns > 1e4 || !Array.isArray(table.cells) || table.cells.length > 1e5)
    return unavailable("InvalidSourceTableColumns");
  const edges = Array.from({ length: table.columns + 1 }, () => []);
  for (const cell of table.cells) {
    if (!cell || !Number.isSafeInteger(cell.column) || !Number.isSafeInteger(cell.columnSpan) || cell.column < 0 || cell.columnSpan < 1 || cell.column > table.columns - cell.columnSpan || !(cell.width === null || Number.isSafeInteger(cell.width) && cell.width >= 0 && cell.width <= 4294967295))
      return unavailable("InvalidSourceTableColumns");
    if (cell.width === null)
      continue;
    const end = cell.column + cell.columnSpan;
    edges[cell.column].push({ end, delta: cell.width });
    edges[end].push({ end: cell.column, delta: -cell.width });
  }
  for (const list of edges)
    list.sort((a, b) => a.end - b.end || a.delta - b.delta);
  const positions = Array(table.columns + 1).fill(null), pending = [0];
  positions[0] = 0;
  for (let cursor = 0;cursor < pending.length; cursor++) {
    const start = pending[cursor];
    for (const edge of edges[start]) {
      const expected = positions[start] + edge.delta;
      if (!Number.isSafeInteger(expected))
        return unavailable("InvalidSourceTableColumns");
      if (positions[edge.end] === null) {
        positions[edge.end] = expected;
        pending.push(edge.end);
      } else if (positions[edge.end] !== expected)
        return {
          ...unavailable("ConflictingSourceTableColumns"),
          start,
          end: edge.end,
          expected,
          actual: positions[edge.end]
        };
    }
  }
  const missing = positions.flatMap((value, index) => value === null ? [index] : []);
  if (missing.length)
    return { ...unavailable("UnderdeterminedSourceTableColumns"), missing };
  const columns = positions.slice(1).map((position, index) => position - positions[index]);
  if (columns.some((width) => width <= 0))
    return {
      ...unavailable("InvalidSourceTableColumns"),
      reason: "NonPositiveSourceColumnSolution"
    };
  return { state: "resolved", columns, positions, width: positions.at(-1) };
}

// web/preview/source-table-row-horizontals.mjs
function sourceTableRowHorizontals(table, { maxCoveredCells = 1e6 } = {}) {
  const fail = (error) => ({ state: "unavailable", error });
  if (!Number.isSafeInteger(table?.rows) || table.rows < 1 || table.rows > 1e4 || !Number.isSafeInteger(table.columns) || table.columns < 1 || table.columns > 1e4 || !Array.isArray(table.cells) || !table.cells.length || table.cells.length > 1e5 || !Number.isSafeInteger(maxCoveredCells) || maxCoveredCells < 1)
    return fail("InvalidSourceTableRowHorizontals");
  if (table.pagination?.cell_spacing !== undefined && table.pagination.cell_spacing !== 0)
    return fail("UnsupportedSourceTableRowSpacing");
  const rows = Array.from({ length: table.rows }, () => []), ids = new Set;
  let work = 0;
  for (const cell of table.cells) {
    if (!cell || !Number.isSafeInteger(cell.listNode) || cell.listNode < 0 || ids.has(cell.listNode) || !Number.isSafeInteger(cell.row) || !Number.isSafeInteger(cell.rowSpan) || cell.row < 0 || cell.rowSpan < 1 || cell.row > table.rows - cell.rowSpan || !Number.isSafeInteger(cell.column) || !Number.isSafeInteger(cell.columnSpan) || cell.column < 0 || cell.columnSpan < 1 || cell.column > table.columns - cell.columnSpan || !Number.isSafeInteger(cell.width) || cell.width <= 0 || cell.width > 4294967295)
      return fail("InvalidSourceTableRowHorizontals");
    ids.add(cell.listNode);
    work += cell.rowSpan;
    if (work > maxCoveredCells)
      return fail("SourceTableRowHorizontalLimit");
    for (let row = cell.row;row < cell.row + cell.rowSpan; row++)
      rows[row].push(cell);
  }
  const boxes = new Map, rowWidths = [];
  for (const [row, cells] of rows.entries()) {
    cells.sort((a, b) => a.column - b.column);
    let column = 0, x = 0;
    for (const cell of cells) {
      if (cell.column !== column)
        return { ...fail("IncompleteSourceTableRowCoverage"), row, column };
      const end = x + cell.width;
      if (!Number.isSafeInteger(end))
        return fail("InvalidSourceTableRowHorizontals");
      const previous = boxes.get(cell.listNode);
      if (previous && (previous.x !== x || previous.width !== cell.width))
        return { ...fail("ConflictingSourceSpanningCellPosition"), row, listNode: cell.listNode };
      boxes.set(cell.listNode, { listNode: cell.listNode, x, width: cell.width });
      x = end;
      column += cell.columnSpan;
    }
    if (column !== table.columns)
      return { ...fail("IncompleteSourceTableRowCoverage"), row, column };
    rowWidths.push(x);
  }
  return {
    state: "resolved",
    cells: table.cells.map((cell) => boxes.get(cell.listNode)),
    rowWidths,
    width: Math.max(...rowWidths),
    evidence: { kind: "source-row-cell-boundaries" }
  };
}

// web/preview/equation-font-measure.mjs
function equationFont(request, family) {
  if (typeof family !== "string" || !family.trim() || /[\x00-\x1f\x7f]/u.test(family))
    throw new Error("InvalidEquationFontFamily");
  if (!Number.isFinite(request?.size) || request.size <= 0 || request.size > 1e6 || typeof request?.style?.italic !== "boolean" || typeof request?.style?.bold !== "boolean")
    throw new Error("InvalidEquationFontRequest");
  const quoted = family.replaceAll("\\", "\\\\").replaceAll('"', "\\\"");
  return `${request.style.italic ? "italic" : "normal"} ${request.style.bold ? "bold" : "normal"} ${request.size}px "${quoted}"`;
}
function configureEquationText(ctx) {
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.direction = "ltr";
  ctx.letterSpacing = "0px";
  ctx.wordSpacing = "0px";
  ctx.fontKerning = "normal";
  ctx.fontStretch = "normal";
  ctx.fontVariantCaps = "normal";
}
function measureEquationRequests(ctx, requests, family, { maxRequests = 65536, maxBytes = 4 * 1024 * 1024, maxExtent = 1e6 } = {}) {
  if (!Number.isSafeInteger(maxRequests) || maxRequests < 0 || !Number.isSafeInteger(maxBytes) || maxBytes < 0 || !Number.isFinite(maxExtent) || maxExtent <= 0)
    throw new Error("InvalidEquationMeasurementLimit");
  if (!Array.isArray(requests) || requests.length > maxRequests)
    throw new Error("EquationMeasurementLimitExceeded");
  let bytes = 0;
  const encoder = new TextEncoder;
  const fonts = requests.map((request) => {
    if (typeof request?.text !== "string" || !request.text.isWellFormed())
      throw new Error("InvalidEquationMeasurementText");
    if (request.text.length > maxBytes - bytes)
      throw new Error("EquationMeasurementLimitExceeded");
    bytes += encoder.encode(request.text).length;
    if (bytes > maxBytes)
      throw new Error("EquationMeasurementLimitExceeded");
    return equationFont(request, family);
  });
  ctx.save();
  try {
    configureEquationText(ctx);
    return requests.map((request, index) => {
      ctx.font = fonts[index];
      const value = ctx.measureText(request.text);
      const raw = [value.width, value.actualBoundingBoxAscent, value.actualBoundingBoxDescent];
      if (raw.some((n) => !Number.isFinite(n)) || raw[0] < 0)
        throw new Error("InvalidEquationLayoutMetric");
      const box = { width: raw[0], ascent: Math.max(0, raw[1]), descent: Math.max(0, raw[2]) };
      if (Math.max(box.width, box.ascent + box.descent) > maxExtent)
        throw new Error("EquationLayoutLimitExceeded");
      return { request: index, box };
    });
  } finally {
    ctx.restore();
  }
}

// web/preview/hwp-units.mjs
var hwpUnitPixels = (value) => value * 96 / 7200;

// web/preview/equation-display-style.mjs
var EQUATION_PREVIEW_FAMILY = "Times New Roman";
function equationDisplayStyle(source = null) {
  if (source?.error_name)
    throw new Error(source.error_name);
  let size = 16;
  if (source?.base_unit !== null && source?.base_unit !== undefined) {
    if (!/^\d+$/.test(source.base_unit) || source.base_unit.length > 32)
      throw new Error("InvalidEquationBaseUnit");
    const units = Number(source.base_unit);
    if (!Number.isSafeInteger(units) || units <= 0 || units > 4294967295)
      throw new Error("InvalidEquationBaseUnit");
    size = hwpUnitPixels(units);
    if (size > 1e6)
      throw new Error("EquationMeasurementLimitExceeded");
  }
  const family = source?.font ?? EQUATION_PREVIEW_FAMILY;
  if (!family.trim())
    throw new Error("InvalidEquationFontFamily");
  const rawColor = source?.text_color;
  if (rawColor !== null && rawColor !== undefined && !/^#?[0-9a-fA-F]{6}$/.test(rawColor))
    throw new Error("InvalidEquationTextColor");
  const color = rawColor === null || rawColor === undefined ? null : `#${rawColor.replace(/^#/, "")}`;
  return {
    settings: { size, script_scale: 0.7, fraction_scale: 0.9 },
    family,
    color,
    sourceStyle: source
  };
}

// web/preview/equation-render-content.mjs
var options = {
  fraction: { padding: 0.1, gap: 0.1, rule_thickness: 0.05, axis: 0.25 },
  script: { gap: 0.05, superscript_shift: 0.5, subscript_shift: 0.3, clearance: 0.1 },
  normal_space: 0.25,
  thin_space: 0.1
};
var radical = { hook_width: 0.5, gap: 0.1, padding: 0.1, thickness: 0.05 };
var grid = { column_gap: 0.6, row_gap: 0.3, padding: 0.1, thickness: 0.05, axis: 0.25 };
var delimiters = { width: 0.4, gap: 0.15, thickness: 0.05 };
var decoration = { gap: 0.1, height: 0.25, thickness: 0.05 };
var integral = { width: 0.5, height: 1.8, gap: 0.1, thickness: 0.05 };
var limit = { gap: 0.1 };
var EQUATION_PREVIEW_MAX_PLANS = 4096;
var context;
function hostContext() {
  if (!context) {
    if (typeof OffscreenCanvas !== "function")
      throw new Error("EquationFontMeasurementUnavailable");
    context = new OffscreenCanvas(1, 1).getContext("2d");
    if (!context)
      throw new Error("EquationFontMeasurementUnavailable");
  }
  return context;
}
function attachEquationRendering(editor, content, available, getContext = hostContext, sourceStyles = false) {
  content.equationPaintAvailable = available;
  content.equationSourceStylesAvailable = sourceStyles;
  content.equationPaintErrors = [];
  content.equationPaintWarnings = [];
  for (const paragraph of content.paragraphs)
    paragraph.equationPaint = [];
  if (!available)
    return content;
  let count = 0, addresses = 0, bytes = 0, requests = 0;
  const encoder = new TextEncoder;
  const snapshots = new Map;
  const styles = new Map;
  const layouts = new Map;
  for (const paragraph of content.paragraphs)
    for (const anchor of paragraph.equations ?? []) {
      const { section } = paragraph, { node, unit } = anchor;
      try {
        if (++addresses > 65536)
          throw new Error("EquationPreviewLimitExceeded");
        if (!snapshots.has(section))
          snapshots.set(section, new Map(editor.equationScripts(section).rows.map((row) => [row.source.node, row])));
        if (sourceStyles && !styles.has(section))
          styles.set(section, new Map(editor.equationStyles(section).map((row) => [row.node, row])));
        const row = snapshots.get(section).get(node);
        if (!row || row.source.issue !== null || typeof row.value !== "string")
          throw new Error("EquationScriptUnavailable");
        const style = sourceStyles ? styles.get(section).get(node) : null;
        if (sourceStyles && !style)
          throw new Error("EquationStyleUnavailable");
        const { settings, family, color, sourceStyle } = equationDisplayStyle(style);
        bytes += encoder.encode(row.value).length;
        if (bytes > 1024 * 1024)
          throw new Error("EquationPreviewLimitExceeded");
        const key = JSON.stringify([row.value, settings, family]);
        let cached = layouts.get(key);
        if (!cached) {
          if (++count > EQUATION_PREVIEW_MAX_PLANS)
            throw new Error("EquationPreviewLimitExceeded");
          cached = { plan: editor.measureEquation(row.value, settings), settings };
          layouts.set(key, cached);
          if (!cached.plan.ready && cached.plan.open_group_recovery === true && cached.plan.blockers?.length && cached.plan.blockers.every((b) => b.kind === "unclosed_group")) {
            if (++count > EQUATION_PREVIEW_MAX_PLANS) {
              cached.error = "EquationPreviewLimitExceeded";
              throw new Error(cached.error);
            }
            cached.settings = { ...settings, allow_unclosed_groups: true };
            try {
              cached.plan = editor.measureEquation(row.value, cached.settings);
            } catch (error) {
              cached.error = error.message;
              throw error;
            }
          }
        }
        if (cached.error)
          throw new Error(cached.error);
        const plan = cached.plan;
        if (!plan.ready) {
          content.equationPaintErrors.push({
            section,
            node,
            error: "UnsupportedEquationLayout",
            blockers: plan.blockers
          });
          continue;
        }
        requests += plan.requests.length;
        if (requests > 65536)
          throw new Error("EquationPreviewLimitExceeded");
        if (!cached.layout) {
          const values = measureEquationRequests(getContext(), plan.requests, family);
          const layoutOptions = { ...options };
          if (plan.radical_layout === true)
            layoutOptions.radical = radical;
          if (plan.grid_layout === true)
            layoutOptions.grid = grid;
          if (plan.pile_layout === true)
            layoutOptions.grid = { ...grid, minimum_row_height: 1 };
          if (plan.matrix_delimiters === true)
            layoutOptions.delimiters = delimiters;
          if (plan.decoration_layout === true)
            layoutOptions.decoration = decoration;
          if (plan.integral_layout === true)
            layoutOptions.integral = integral;
          if (plan.limit_layout === true)
            layoutOptions.limit = limit;
          cached.layout = editor.layoutEquation(row.value, cached.settings, values, layoutOptions);
        }
        paragraph.equationPaint.push({
          node,
          unit,
          family,
          color,
          sourceStyle,
          plan,
          layout: cached.layout
        });
        if (plan.recovered_open_groups > 0)
          content.equationPaintWarnings.push({
            section,
            node,
            warning: "UnclosedEquationGroupAtEnd",
            recoveredOpenGroups: plan.recovered_open_groups,
            diagnostics: plan.recovery_diagnostics
          });
      } catch (error) {
        content.equationPaintErrors.push({ section, node, error: error.message });
      }
    }
  return content;
}
function equationPaintAt(paragraph, unit) {
  if (paragraph?.text?.[unit] !== "￼")
    return null;
  const rows = paragraph.equationPaint?.filter((row) => row.unit === unit) ?? [];
  return rows.length === 1 ? rows[0] : null;
}

// js/xml-integer-text.mjs
function integer(raw, minimum, maximum) {
  if (typeof raw !== "string" || raw.length > 4096 || !/^[ \t\r\n]*[+-]?\d+[ \t\r\n]*$/.test(raw))
    return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= minimum && value <= maximum ? value === 0 ? 0 : value : null;
}
var xmlSigned32 = (raw) => integer(raw, -2147483648, 2147483647);
var xmlUnsigned32 = (raw) => integer(raw, 0, 4294967295);

// web/preview/hwp5-object-flags.mjs
function hwp5UnsupportedObjectFlags(flags, { allowObservedLock = false } = {}) {
  if (!Number.isInteger(flags) || flags < 0 || flags > 4294967295)
    return null;
  const mask = allowObservedLock === true ? 2147483650 : 3221225474;
  return (flags & mask) >>> 0;
}
function hwp5ObjectFlags(flags, options) {
  if (hwp5UnsupportedObjectFlags(flags, options) !== 0)
    throw new Error("UnsupportedHwp5ObjectFlags");
  const vertical_relative = flags >>> 3 & 3, vertical_alignment = flags >>> 5 & 7;
  const horizontal_relative = flags >>> 8 & 3, horizontal_alignment = flags >>> 10 & 7;
  const width_relative = flags >>> 15 & 7, height_relative = flags >>> 18 & 3, text_wrap = flags >>> 21 & 7;
  if (vertical_relative > 2 || vertical_alignment > 4 || horizontal_alignment > 4 || width_relative > 4 || height_relative > 2 || text_wrap > 3)
    throw new Error("UnsupportedHwp5ObjectEnum");
  const flow_with_text = Boolean(flags & 1 << 13);
  return {
    vertical_relative,
    vertical_alignment,
    horizontal_relative,
    horizontal_alignment,
    width_relative,
    height_relative,
    size_protected: vertical_relative === 2 && Boolean(flags & 1 << 20),
    treat_as_character: Boolean(flags & 1),
    text_wrap,
    text_flow: flags >>> 24 & 3,
    has_caption: Boolean(flags & 1 << 29),
    affect_line_spacing: Boolean(flags & 4),
    flow_with_text,
    allow_overlap: flow_with_text ? false : Boolean(flags & 1 << 14),
    hold_anchor: null,
    ...options?.allowObservedLock === true ? { locked: Boolean(flags & 1073741824) } : {}
  };
}

// web/preview/hwp5-table-flags.mjs
function hwp5TableFlags(flags) {
  if (!Number.isInteger(flags) || flags < 0 || flags > 4294967295)
    throw new Error("InvalidHwp5TableFlags");
  return {
    page_break: ["none", "table", "cell", null][flags & 3],
    repeat_header: Boolean(flags & 4),
    no_adjust: Boolean(flags & 8),
    inner_margin_setup: Boolean(flags & 67108864),
    unknown_flags: (flags & ~67108879) >>> 0
  };
}

// web/preview/hwp5-table-object-tail.mjs
function hasObservedZeroTableObjectTail(source) {
  return source?.object_extra_bytes === 2 && Object.hasOwn(source, "object_extra_u16") && source.object_extra_u16 === 0;
}

// web/preview/hwp5-table-geometry.mjs
function hwp5TableUnsupportedObjectFlags(flags) {
  return hwp5UnsupportedObjectFlags(flags, { allowObservedLock: true });
}
function hwp5TableGeometry(source, { allowOpaqueTableFlags = false, allowObservedZeroObjectTail = false } = {}) {
  if (typeof allowOpaqueTableFlags !== "boolean" || typeof allowObservedZeroObjectTail !== "boolean")
    throw new Error("InvalidOpaqueTablePolicy");
  validateHwp5TableLayoutSources([source]);
  const flags = source.object_flags, table = hwp5TableFlags(source.table_flags);
  if (hwp5TableUnsupportedObjectFlags(flags) !== 0 || !allowOpaqueTableFlags && table.unknown_flags !== 0 || source.object_extra_bytes !== 0 && !(allowObservedZeroObjectTail && hasObservedZeroTableObjectTail(source)) || source.table_extra_bytes !== 0)
    throw new Error("UnsupportedHwp5TableExtension");
  let decoded;
  try {
    decoded = hwp5ObjectFlags(flags, { allowObservedLock: true });
  } catch {
    throw new Error("UnsupportedHwp5TableEnum");
  }
  if (table.page_break === null)
    throw new Error("UnsupportedHwp5TableEnum");
  return {
    size_protected: decoded.size_protected,
    geometry: {
      width: source.width,
      height: source.height,
      width_relative: decoded.width_relative,
      height_relative: decoded.height_relative,
      treat_as_character: decoded.treat_as_character,
      vertical_offset: source.offset_y,
      horizontal_offset: source.offset_x
    },
    text_wrap: decoded.text_wrap,
    text_flow: decoded.text_flow,
    has_caption: decoded.has_caption,
    inner_margin_setup: table.inner_margin_setup,
    no_adjust: table.no_adjust,
    locked: decoded.locked,
    affect_line_spacing: decoded.affect_line_spacing,
    flow_with_text: decoded.flow_with_text,
    allow_overlap: decoded.allow_overlap,
    hold_anchor: decoded.hold_anchor,
    vertical_relative: decoded.vertical_relative,
    horizontal_relative: decoded.horizontal_relative,
    vertical_alignment: decoded.vertical_alignment,
    horizontal_alignment: decoded.horizontal_alignment,
    out_margin: [...source.outer_margins],
    in_margin: [...source.inner_margins]
  };
}
function hwp5TablePagination(source, { allowOpaqueTableFlags = false } = {}) {
  if (typeof allowOpaqueTableFlags !== "boolean")
    throw new Error("InvalidOpaqueTablePolicy");
  validateHwp5TableLayoutSources([source]);
  const table = hwp5TableFlags(source.table_flags);
  if (!allowOpaqueTableFlags && table.unknown_flags !== 0 || table.page_break === null)
    throw new Error("UnsupportedHwp5TablePagination");
  return {
    page_break: table.page_break,
    repeat_header: table.repeat_header,
    no_adjust: table.no_adjust,
    cell_spacing: source.cell_spacing
  };
}

// web/preview/integer-mul-div.mjs
var isInt32 = (value) => Number.isInteger(value) && value >= -2147483648 && value <= 2147483647;
function roundedMulDiv(a, b, divisor) {
  if (!isInt32(a) || !isInt32(b) || !isInt32(divisor) || divisor <= 0)
    return null;
  const product = BigInt(a) * BigInt(b), half = BigInt(divisor) / 2n;
  const result = Number((product + (product < 0n ? -half : half)) / BigInt(divisor));
  return isInt32(result) ? result : null;
}

// web/preview/hwp5-line-spacing.mjs
function hwp5LineSpacing(kind, value, height, { basisHeight = height, relativeBase } = {}) {
  if (![kind, value, height, basisHeight].every(isInt32) || kind < 0 || kind > 3 || value < 0 || height < 0 || basisHeight < 0)
    return null;
  let extra;
  if (kind === 0) {
    const rounded = roundedMulDiv(Math.trunc(basisHeight / 4), value - 100, 100);
    if (rounded === null)
      return null;
    extra = rounded * 4;
  } else {
    let distance = Math.trunc(value / 2);
    if (value % 2) {
      if (!isInt32(relativeBase) || relativeBase <= 0)
        return null;
      distance = roundedMulDiv(distance, relativeBase, 100);
      if (distance === null)
        return null;
    }
    extra = kind === 1 ? distance - height : kind === 2 ? distance : Math.max(0, distance - height);
  }
  const advance = height + extra;
  return isInt32(extra) && isInt32(advance) ? { extra, advance } : null;
}

// web/preview/paragraph-spacing-source.mjs
function currentParagraphSpacing(shape) {
  const modern = shape?.modernSpacing;
  const hasModern = modern !== undefined && modern !== null;
  if (hasModern && (typeof modern !== "object" || Array.isArray(modern) || !Number.isInteger(modern.attributes) || modern.attributes < 0 || modern.attributes > 4294967295))
    return null;
  let kind = hasModern ? modern.attributes & 31 : shape?.legacySpacingKind;
  let value = hasModern ? modern.value : shape?.legacySpacing;
  if (hasModern && (!Number.isInteger(value) || value < -2147483648 || value > 2147483647))
    return null;
  if (shape?.spacingFormat !== "hwpx" && hasModern && kind === 0 && Number.isInteger(shape?.legacySpacingKind) && Number.isInteger(shape?.legacySpacing)) {
    kind = shape.legacySpacingKind;
    value = shape.legacySpacing;
  }
  if (!Number.isInteger(kind) || kind < 0 || kind >= paragraphSpacingTypes.length)
    return null;
  try {
    paragraphSpacingArgs(paragraphSpacingTypes[kind], value);
  } catch {
    return null;
  }
  return { kind, value };
}

// web/preview/paragraph-geometry.mjs
var paragraphSpacing = (shape) => currentParagraphSpacing(shape) ?? { kind: undefined, value: undefined };
var paragraphMarginPixels = (value) => Number.isInteger(value) ? hwpUnitPixels(value) / 2 : 0;
var paragraphSpacePixels = (value) => Math.max(0, paragraphMarginPixels(value));
function paragraphLineAdvance(shape, textHeight, baselineHeight, { spacingBasisHeight = textHeight } = {}) {
  if (!shape)
    return baselineHeight;
  const { kind, value } = paragraphSpacing(shape);
  if (!Number.isInteger(value) || value < 0)
    return baselineHeight;
  if (!Number.isFinite(textHeight) || textHeight < 0)
    return baselineHeight;
  if (shape.spacingFormat === "hwpx") {
    return kind === 0 ? textHeight * value / 100 : kind === 1 ? hwpUnitPixels(value) : kind === 2 ? textHeight + hwpUnitPixels(value) : kind === 3 ? Math.max(textHeight, hwpUnitPixels(value)) : baselineHeight;
  }
  if (!Number.isFinite(spacingBasisHeight) || spacingBasisHeight < 0)
    return baselineHeight;
  const result = hwp5LineSpacing(kind, value, Math.round(textHeight * 75), {
    basisHeight: Math.round(spacingBasisHeight * 75)
  });
  return result && result.advance >= 0 ? hwpUnitPixels(result.advance) : baselineHeight;
}
function paragraphLineGeometry(shape, width, measuredWidth, firstLine) {
  const pixels = paragraphMarginPixels;
  const left = pixels(shape?.left), right = pixels(shape?.right);
  const declaredIndent = pixels(shape?.indent);
  const indent = declaredIndent < 0 ? firstLine ? 0 : -declaredIndent : firstLine ? declaredIndent : 0;
  const start = Math.min(Math.max(0, width - 1), Math.max(0, left + indent));
  const available = Math.max(1, width - start - Math.max(0, right));
  const slack = Math.max(0, available - Math.max(1, measuredWidth));
  const alignment = paragraphAlignmentKey(shape?.alignment);
  const offset = alignment === "RIGHT" ? slack : alignment === "CENTER" ? slack / 2 : 0;
  return { x: start + offset, width: available };
}
function paragraphReferenceGeometry(shape, width) {
  return paragraphLineGeometry({ ...shape, alignment: 0, indent: 0 }, width, 0, false);
}

// web/preview/table-insets.mjs
function tableInsets(value) {
  const insets = typeof value === "number" ? { left: value, right: value, top: value, bottom: value } : value;
  if (!insets || ![insets.left, insets.right, insets.top, insets.bottom].every((v) => Number.isFinite(v) && v >= 0) || !Number.isFinite(insets.left + insets.right) || !Number.isFinite(insets.top + insets.bottom))
    return null;
  return { left: insets.left, right: insets.right, top: insets.top, bottom: insets.bottom };
}
function tableCellInsets(value, cell) {
  return tableInsets(value instanceof Map ? value.get(cell.listNode) : value);
}

// web/preview/table-source-insets.mjs
function sourceTableCellInsets(table, cell) {
  const flag = cell?.sourceMargin?.has_margin;
  const values = flag === true ? cell.sourceMargin.margin : flag === false ? table?.sourceGeometry?.in_margin : null;
  if (!Array.isArray(values) || values.length !== 4 || !values.every((v) => Number.isSafeInteger(v) && v >= 0 && v <= 4294967295))
    return null;
  // Keep glyph ink away from cell borders when substituting unavailable fonts.
  // Bound the preview inset by cell size so narrow/short source cells remain valid.
  const minX = Number.isFinite(cell.width) ? Math.min(4, hwpUnitPixels(cell.width) / 8) : 0;
  const minY = Number.isFinite(cell.height) ? Math.min(3, hwpUnitPixels(cell.height) / 8) : 0;
  const [left, right, top, bottom] = values.map((value, i) => Math.max(hwpUnitPixels(value), i < 2 ? minX : minY));
  return tableInsets({ left, right, top, bottom });
}
function resolveTablePadding(table, padding) {
  if (padding !== "source")
    return padding;
  if (!Array.isArray(table?.cells) || table.cells.some((cell) => !cell))
    return null;
  const values = new Map;
  for (const cell of table.cells) {
    if (values.has(cell.listNode))
      return null;
    const insets = sourceTableCellInsets(table, cell);
    if (!insets)
      return null;
    values.set(cell.listNode, insets);
  }
  return values;
}

// web/preview/hwp5-drawing-paint-tail.mjs
function hwp5DrawingPaintTail(style) {
  if (!style?.fill_known)
    return { state: "unavailable", error: "UnselectedHwp5DrawingPaintTail" };
  if (style.alpha === null || style.shadow === null || style.metadata === null) {
    const absent = style.fileVersion === 83886343 && style.tailLayout === "fill_only" && style.borderLayout === "observed13" && style.alpha === null && style.shadow === null && style.metadata === null && style.extra_bytes === 0 && style.fill_flags === 0 && style.additional_bytes === 0;
    return absent ? { state: "selected", policy: "observed-absent-empty-fill", shadowType: 0 } : { state: "unavailable", error: "UnselectedHwp5DrawingPaintTail" };
  }
  if (style.extra_bytes !== 0 || style.metadata.reserved !== 0 || style.shadow.kind !== 0)
    return { state: "unavailable", error: "UnsupportedHwp5DrawingPaintTail" };
  return { state: "selected", policy: "selected-tail", shadowType: style.shadow.kind };
}

// web/preview/hwp5-drawing-object-extension.mjs
var version = 83951872;
var uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
function hasObservedDrawingObjectExtension(source) {
  const proof = source?.observedObjectExtension;
  return source?.object_extra_bytes === 2 && proof?.fileVersion === version && proof.extraBytes === 2 && proof.extraHex === "0000" && uint(source.control_node) && uint(source.paragraph_node) && proof.controlNode === source.control_node && proof.paragraphNode === source.paragraph_node;
}
function withObservedDrawingObjectExtensions(editor, sources, section) {
  if (!sources.some((source) => source.object_extra_bytes === 2) || editor.fileVersion() !== version)
    return sources;
  if (!uint(section))
    throw new Error("InvalidDrawingObjectExtensionSection");
  const extras = editor.drawingObjectExtras(section);
  if (!Array.isArray(extras) || extras.length !== sources.length)
    throw new Error("MismatchedDrawingObjectExtensionSources");
  const byControl = new Map(extras.map((row) => [row?.control_node, row]));
  if (byControl.size !== extras.length)
    throw new Error("AmbiguousDrawingObjectExtensionSources");
  const prepared = [];
  for (const source of sources) {
    const row = byControl.get(source.control_node);
    if (!row || row.paragraph_node !== source.paragraph_node || row.extra_bytes !== source.object_extra_bytes || typeof row.extra_hex !== "string" || row.extra_hex.length !== row.extra_bytes * 2 || !/^[0-9a-f]*$/.test(row.extra_hex))
      throw new Error("MismatchedDrawingObjectExtensionSources");
    prepared.push(source.object_extra_bytes === 2 && row.extra_hex === "0000" ? {
      ...source,
      observedObjectExtension: {
        fileVersion: version,
        controlNode: row.control_node,
        paragraphNode: row.paragraph_node,
        extraBytes: row.extra_bytes,
        extraHex: row.extra_hex
      }
    } : source);
  }
  return prepared;
}

// web/preview/hwp5-drawing-geometry.mjs
function hwp5DrawingGeometry(source) {
  validateHwp5DrawingSources([source]);
  if (source.object_extra_bytes !== 0 && !hasObservedDrawingObjectExtension(source) || !Array.isArray(source.outer_margins))
    throw new Error("UnsupportedHwp5DrawingObjectExtension");
  const flags = hwp5ObjectFlags(source.flags);
  return {
    size_protected: flags.size_protected,
    geometry: {
      width: source.width,
      height: source.height,
      width_relative: flags.width_relative,
      height_relative: flags.height_relative,
      treat_as_character: flags.treat_as_character,
      horizontal_offset: source.offset_x,
      vertical_offset: source.offset_y
    },
    position: {
      relations: [
        flags.vertical_relative,
        flags.horizontal_relative,
        flags.vertical_alignment,
        flags.horizontal_alignment
      ],
      flags: [
        flags.affect_line_spacing,
        flags.flow_with_text,
        flags.allow_overlap,
        flags.hold_anchor
      ]
    },
    flow: {
      text_wrap: flags.text_wrap,
      text_flow: flags.text_flow,
      z_order: source.z_order,
      outside_margins: [...source.outer_margins]
    },
    text_wrap: flags.text_wrap,
    text_flow: flags.text_flow,
    flow_with_text: flags.flow_with_text,
    allow_overlap: flags.allow_overlap,
    affect_line_spacing: flags.affect_line_spacing,
    hold_anchor: flags.hold_anchor,
    has_caption: flags.has_caption,
    out_margin: [...source.outer_margins],
    z_order: source.z_order
  };
}
function attachHwp5DrawingGeometry(content) {
  content.hwp5DrawingGeometry = [];
  content.hwp5DrawingGeometryErrors = [];
  for (const section of new Set((content.hwp5Drawings ?? []).map((row) => row.section))) {
    try {
      const prepared = content.hwp5Drawings.filter((row) => row.section === section).map((row) => ({
        section,
        controlNode: row.controlNode,
        componentNode: row.componentNode,
        source: hwp5DrawingGeometry(row.source)
      }));
      content.hwp5DrawingGeometry.push(...prepared);
    } catch (error) {
      content.hwp5DrawingGeometryErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/stroke-dash-pattern.mjs
var patterns = Object.freeze([
  null,
  ...[[], [2, 2], [6, 3], [6, 3, 2, 3], [6, 3, 2, 3, 2, 3]].map(Object.freeze)
]);
function strokeDashPattern(style) {
  return Number.isInteger(style) && style >= 1 && style < patterns.length ? patterns[style] : null;
}

// web/preview/colorref-css.mjs
function colorrefCss(raw) {
  return Number.isInteger(raw) && raw >= 0 && raw <= 16777215 ? `#${[raw & 255, raw >>> 8 & 255, raw >>> 16 & 255].map((value) => value.toString(16).padStart(2, "0")).join("")}` : null;
}

// web/preview/hwp5-stroke-display.mjs
function hwp5StrokeDisplay(border) {
  const raw = border?.attributes?.raw, width = border?.width, color = border?.color;
  if (!Number.isInteger(raw) || raw < 0 || raw > 4294967295 || !Number.isInteger(width) || width < -2147483648 || width > 2147483647 || !Number.isInteger(color) || color < 0 || color > 4294967295)
    return null;
  const kind = raw & 63, css = colorrefCss(color);
  if (kind > 5 || kind !== 0 && (width <= 0 || css === null))
    return null;
  return {
    color: css === null ? color : Number.parseInt(css.slice(1), 16),
    width,
    style: kind === 2 ? 3 : kind === 3 ? 2 : kind
  };
}

// web/preview/table-geometry-failure-evidence.mjs
function tableGeometryFailureEvidence(table, diagnostics = []) {
  if (!table || !Array.isArray(diagnostics))
    return {};
  const matches = diagnostics.filter((row) => row?.section === table.section && row?.tableNode === table.tableNode);
  if (matches.length !== 1)
    return {};
  const row = matches[0], evidence = {};
  if (typeof row.error === "string")
    evidence.sourceError = row.error.slice(0, 256);
  for (const key of ["rawTableFlags", "unknownTableFlags"])
    if (Number.isInteger(row[key]) && row[key] >= 0 && row[key] <= 4294967295)
      evidence[key] = row[key];
  return evidence;
}

// web/preview/mixed-inline-table-policy.mjs
function mixedInlineTablePolicy(table, { whole = false, captions = false, diagnostics = [] } = {}) {
  const reasons = [];
  if (table.parentTableNode !== null)
    reasons.push("NestedTable");
  if (typeof table.sourceGeometry?.geometry?.treat_as_character !== "boolean")
    reasons.push("MissingTableGeometry");
  else if (table.sourceGeometry.geometry.treat_as_character !== true)
    reasons.push("FloatingTable");
  if (table.sourceCaption && !(whole === true && captions === true))
    reasons.push("TableCaption");
  if (!table.pagination)
    reasons.push("MissingTablePagination");
  else {
    if (!["cell", "none"].includes(table.pagination.page_break) && !(whole && table.pagination.page_break === "table"))
      reasons.push("TablePageBreak");
    if (table.pagination.cell_spacing !== 0)
      reasons.push("TableCellSpacing");
  }
  if (table.cells?.some((cell) => cell.sourceMargin?.header !== false))
    reasons.push("TableHeaderCell");
  return reasons.length ? {
    state: "unavailable",
    error: "UnsupportedMixedInlineTable",
    section: table.section,
    tableNode: table.tableNode,
    reasons,
    ...reasons.includes("MissingTableGeometry") ? tableGeometryFailureEvidence(table, diagnostics) : {}
  } : { state: "supported" };
}

// web/preview/note-source-table-owners.mjs
function selectNoteSourceTables(content, { floatingNotes = false } = {}) {
  const fail = (error) => ({ state: "unavailable", error });
  if (!content || typeof content !== "object")
    return fail("InvalidNoteSourceBodyTables");
  if (typeof floatingNotes !== "boolean")
    return fail("InvalidNoteSourceBodyTables");
  const tables = content.tables ?? [], cells = new Set, bodyCells = new Set, noteCells = new Set;
  const bodyTables = [], noteTables = [], noteTablesByNote = new Map;
  const selected = () => ({
    state: "selected",
    cellParagraphs: cells,
    bodyCellParagraphs: bodyCells,
    noteCellParagraphs: noteCells,
    bodyTables,
    noteTables,
    noteTablesByNote,
    hasTables: tables.length > 0
  });
  if (!Array.isArray(tables))
    return fail("InvalidNoteSourceBodyTables");
  if (!tables.length)
    return selected();
  if (!["hwpx", "hwp5"].includes(content.format) || !Array.isArray(content.paragraphs) || !Array.isArray(content.paragraphFlows) || content.pageSettings?.length !== 1)
    return fail("UnsupportedNoteSourceBodyTables");
  const section = content.pageSettings[0]?.section_ordinal;
  if (!Number.isSafeInteger(section) || section < 0)
    return fail("InvalidNoteSourceBodyTables");
  const group = (rows) => {
    const result = new Map;
    for (const row of rows) {
      if (!row || !Number.isSafeInteger(row.section) || row.section < 0 || !Number.isSafeInteger(row.paragraph) || row.paragraph < 0)
        return null;
      const key = `${row.section}:${row.paragraph}`, matches = result.get(key) ?? [];
      matches.push(row);
      result.set(key, matches);
    }
    return result;
  };
  const paragraphs = group(content.paragraphs), flows = group(content.paragraphFlows), tableIds = new Set;
  if (!paragraphs || !flows)
    return fail("InvalidNoteSourceBodyTables");
  for (const table of tables) {
    if (!table || table.section !== section || !Number.isSafeInteger(table.tableNode) || table.tableNode < 0 || tableIds.has(table.tableNode) || !Array.isArray(table.cells) || !table.cells.length || table.cells.some((cell) => !cell))
      return fail("InvalidNoteSourceBodyTables");
    tableIds.add(table.tableNode);
    const hosts = flows.get(`${section}:${table.hostParagraph}`) ?? [];
    const policy = mixedInlineTablePolicy(table, {
      whole: true,
      diagnostics: content.tableGeometryErrors
    });
    const floatingNote = floatingNotes && policy.reasons?.length === 1 && policy.reasons[0] === "FloatingTable" && hosts.length === 1 && ["footnote", "endnote"].includes(hosts[0].host);
    if (policy.state !== "supported" && !floatingNote) {
      const host = hosts.length === 1 ? hosts[0] : null, context = host?.note_context;
      return {
        ...policy,
        ...["footnote", "endnote"].includes(host?.host) && host.top_level === false && context?.kind === host.host && Number.isSafeInteger(context.note_node) && context.note_node >= 0 && Number.isSafeInteger(context.list_node) && context.list_node >= 0 ? {
          noteKind: context.kind,
          noteNode: context.note_node,
          noteListNode: context.list_node,
          hostParagraph: table.hostParagraph
        } : {}
      };
    }
    if (hosts.length !== 1)
      return fail("UnsupportedNoteSourceTableOwner");
    const host = hosts[0], body = host.host === "body";
    if (body ? host.top_level !== true : !["footnote", "endnote"].includes(host.host) || host.top_level !== false || host.note_context?.kind !== host.host || !Number.isSafeInteger(host.note_context.note_node) || host.note_context.note_node < 0 || !Number.isSafeInteger(host.note_context.list_node) || host.note_context.list_node < 0)
      return fail("UnsupportedNoteSourceTableOwner");
    (body ? bodyTables : noteTables).push(table);
    if (!body) {
      const key = `${section}:${host.note_context.note_node}`, group = noteTablesByNote.get(key) ?? [];
      group.push(table);
      noteTablesByNote.set(key, group);
    }
    for (const cell of table.cells) {
      if (!cell || !Array.isArray(cell.paragraphs) || !cell.paragraphs.length)
        return fail("InvalidNoteSourceBodyTables");
      for (const paragraph of cell.paragraphs) {
        const owners = paragraphs.get(`${section}:${paragraph}`) ?? [];
        const cellFlows = flows.get(`${section}:${paragraph}`) ?? [];
        if (cells.has(paragraph) || owners.length !== 1 || owners[0].tableCell?.tableNode !== table.tableNode || owners[0].tableCell?.listNode !== cell.listNode || cellFlows.length !== 1 || cellFlows[0].host !== (content.format === "hwp5" ? "table_cell" : body ? "other" : host.host) || cellFlows[0].top_level !== false || cellFlows[0].note_context != null)
          return fail("InvalidNoteSourceTableCellOwner");
        cells.add(paragraph);
        (body ? bodyCells : noteCells).add(paragraph);
      }
    }
  }
  return selected();
}

// web/preview/drawing-column-context.mjs
function drawingColumnContext(drawing, paragraphs, flows) {
  const unavailable = (error) => ({ state: "unavailable", error });
  if (!drawing?.source || !Array.isArray(paragraphs) || !Array.isArray(flows))
    return unavailable("InvalidDrawingColumnContext");
  const members = paragraphs.filter((p) => p.section === drawing.section && p.drawingText?.drawingNode === drawing.drawingNode);
  if (drawing.source.text === null)
    return members.length ? unavailable("DrawingTextDisplayBindingMismatch") : { state: "selected", source: "no-text-list", declaration: null };
  if (!drawing.source.text)
    return unavailable("InvalidDrawingColumnContext");
  if (!members.length)
    return unavailable("MissingDrawingTextContent");
  let selected, signature;
  for (const member of members) {
    if (member.drawingText.listNode !== drawing.source.text.list_node)
      return unavailable("DrawingTextDisplayBindingMismatch");
    const candidates = flows.filter((f) => f.section === member.section && f.paragraph === member.paragraph);
    if (candidates.length !== 1 || candidates[0].host !== "drawing" || candidates[0].top_level !== false)
      return unavailable("AmbiguousDrawingColumnContext");
    const declaration = candidates[0].column_declaration;
    if (declaration === undefined)
      return unavailable("MissingDrawingColumnContext");
    const current = JSON.stringify(declaration);
    if (signature !== undefined && signature !== current)
      return unavailable("UnsupportedDrawingColumnChange");
    signature = current;
    selected = declaration;
  }
  if (selected === null)
    return {
      state: "selected",
      source: "implicit-single-list",
      declaration: {
        count: 1,
        same_size: true,
        gap: 0,
        direction: "left",
        kind: "newspaper",
        ambiguous: false
      }
    };
  return { state: "selected", source: "list-declaration", declaration: structuredClone(selected) };
}

// web/preview/drawing-note-reference-owners.mjs
function selectDrawingNoteReferenceOwners(content) {
  const fail = (error) => ({ state: "unavailable", error });
  if (!Array.isArray(content?.paragraphs) || !Array.isArray(content.paragraphFlows) || !Array.isArray(content.drawings))
    return fail("InvalidDrawingNoteReferenceOwners");
  const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  if (content.paragraphs.some((p) => !record(p) || typeof p.text !== "string" || p.automaticNumbers !== undefined && (!Array.isArray(p.automaticNumbers) || p.automaticNumbers.some((n) => !record(n)))) || content.paragraphFlows.some((f) => !record(f)) || content.drawings.some((d) => !record(d)) || content.hwp5Notes !== undefined && (!Array.isArray(content.hwp5Notes) || content.hwp5Notes.some((n) => !record(n))))
    return fail("InvalidDrawingNoteReferenceOwners");
  const owners = new Map;
  for (const paragraph of content.paragraphs) {
    if (!paragraph.drawingText)
      continue;
    const references = paragraph.automaticNumbers?.some((n) => ["note-reference", "hwp5-note-reference"].includes(n.kind)) || content.hwp5Notes?.some((n) => n.section === paragraph.section && n.hostParagraph === paragraph.paragraph);
    if (!references)
      continue;
    const candidates = content.drawings.filter((d) => d.section === paragraph.section && d.drawingNode === paragraph.drawingText.drawingNode);
    if (candidates.length !== 1)
      return fail("AmbiguousDrawingNoteReferenceOwner");
    const drawing = candidates[0];
    if (drawing.source?.group_context)
      return fail("UnsupportedGroupedDrawingNoteReference");
    const columns = drawingColumnContext(drawing, content.paragraphs, content.paragraphFlows);
    if (columns.state !== "selected")
      return columns;
    const hosts = content.paragraphs.filter((p) => p.section === drawing.section && p.paragraph === drawing.hostParagraph);
    const flows = content.paragraphFlows.filter((f) => f.section === drawing.section && f.paragraph === drawing.hostParagraph);
    if (hosts.length !== 1 || flows.length !== 1 || flows[0].host !== "body" || flows[0].top_level !== true || hosts[0].drawingText || hosts[0].tableCell || !Number.isSafeInteger(drawing.anchorUnit) || drawing.anchorUnit < 0 || hosts[0].text[drawing.anchorUnit] !== "￼")
      return fail("InvalidDrawingNoteReferenceAnchor");
    const key = `${paragraph.section}:${paragraph.paragraph}`;
    if (owners.has(key))
      return fail("AmbiguousDrawingNoteReferenceOwner");
    owners.set(key, { hostParagraph: drawing.hostParagraph, anchorUnit: drawing.anchorUnit });
  }
  return { state: "selected", owners };
}

// web/preview/note-body-bindings.mjs
function bindSourceNoteBodies(content, sourceTables, maxNotes = 1e4, options = {}) {
  if (!sourceTables)
    return bindNoteBodies(content, maxNotes, options);
  if (sourceTables.state !== "selected" || !(sourceTables.noteCellParagraphs instanceof Set) || !Array.isArray(sourceTables.bodyTables))
    return { state: "unavailable", error: "InvalidNoteBodyBindings" };
  const cells = sourceTables.noteCellParagraphs;
  const direct = cells.size ? {
    ...content,
    paragraphs: content.paragraphs.filter((p) => !cells.has(p.paragraph)),
    paragraphFlows: content.paragraphFlows.filter((p) => !cells.has(p.paragraph))
  } : content;
  return bindNoteBodies(direct, maxNotes, { ...options, bodyCellTables: sourceTables.bodyTables });
}
function bindNoteBodies(content, maxNotes = 1e4, { bodyCellTables = [], allowDrawingReferences = false } = {}) {
  const unavailable = (error) => ({ state: "unavailable", error });
  if (!Array.isArray(content?.paragraphs) || !Array.isArray(content.paragraphFlows) || !Number.isSafeInteger(maxNotes) || maxNotes < 1 || content.limited || content.noteReferenceErrors?.length || content.paragraphFlowErrors?.length)
    return unavailable("InvalidNoteBodyBindings");
  const paragraphs = new Map, flows = new Map, notes = new Map, references = new Map;
  const key = (section, node) => `${section}:${node}`;
  const uint = (value) => Number.isSafeInteger(value) && value >= 0 && value <= 4294967295;
  if (!Array.isArray(bodyCellTables))
    return unavailable("InvalidNoteBodyBindings");
  const cellReferences = new Set;
  if (typeof allowDrawingReferences !== "boolean")
    return unavailable("InvalidNoteBodyBindings");
  const drawingReferences = allowDrawingReferences ? selectDrawingNoteReferenceOwners(content) : null;
  if (drawingReferences && drawingReferences.state !== "selected")
    return drawingReferences;
  if (bodyCellTables.length) {
    const selected = selectNoteSourceTables({ ...content, tables: bodyCellTables });
    if (selected.state !== "selected")
      return selected;
    if (selected.noteTables.length)
      return unavailable("InvalidNoteBodyBindings");
    for (const table of selected.bodyTables)
      for (const cell of table.cells)
        for (const paragraph of cell.paragraphs)
          cellReferences.add(key(table.section, paragraph));
  }
  for (const paragraph of content.paragraphs) {
    if (!paragraph || !uint(paragraph.section) || !uint(paragraph.paragraph) || typeof paragraph.text !== "string" || paragraph.clipped || paragraphs.has(key(paragraph.section, paragraph.paragraph)))
      return unavailable("InvalidNoteBodyBindings");
    paragraphs.set(key(paragraph.section, paragraph.paragraph), paragraph);
  }
  for (const flow of content.paragraphFlows) {
    if (!flow || !uint(flow.section) || !uint(flow.paragraph) || flows.has(key(flow.section, flow.paragraph)))
      return unavailable("InvalidNoteBodyBindings");
    flows.set(key(flow.section, flow.paragraph), flow);
    const context = flow.note_context;
    if (!["footnote", "endnote"].includes(flow.host)) {
      if (context != null)
        return unavailable("InvalidNoteBodyBindings");
      continue;
    }
    if (!context || !uint(context.note_node) || !uint(context.list_node) || context.kind !== flow.host || flow.top_level !== false)
      return unavailable("MissingNoteBodyOwnership");
    const paragraph = paragraphs.get(key(flow.section, flow.paragraph));
    if (!paragraph || paragraph.tableCell || paragraph.drawingText || paragraph.tableCaption || paragraph.drawingCaption)
      return unavailable("InvalidNoteBodyBindings");
    const owner = key(flow.section, context.note_node);
    let note = notes.get(owner);
    if (!note) {
      if (notes.size >= maxNotes)
        return unavailable("NoteBodyBindingLimit");
      note = {
        section: flow.section,
        noteNode: context.note_node,
        listNode: context.list_node,
        kind: context.kind,
        paragraphs: []
      };
      notes.set(owner, note);
    }
    if (note.listNode !== context.list_node || note.kind !== context.kind)
      return unavailable("AmbiguousNoteBodyOwnership");
    note.paragraphs.push(paragraph.paragraph);
  }
  const referenceAllowed = (section, paragraph) => {
    const flow = flows.get(key(section, paragraph));
    return flow?.host === "body" && flow.top_level === true || cellReferences.has(key(section, paragraph)) || drawingReferences?.owners.has(key(section, paragraph));
  };
  for (const paragraph of content.paragraphs) {
    if (paragraph.automaticNumbers !== undefined && !Array.isArray(paragraph.automaticNumbers))
      return unavailable("InvalidNoteBodyBindings");
    for (const reference of paragraph.automaticNumbers ?? []) {
      if (!reference)
        return unavailable("InvalidNoteBodyBindings");
      if (reference.kind !== "note-reference")
        continue;
      const owner = key(paragraph.section, reference.noteNode), note = notes.get(owner);
      if (!note || !referenceAllowed(paragraph.section, paragraph.paragraph) || !uint(reference.unit) || paragraph.text[reference.unit] !== "￼" || !uint(reference.numberNode) || reference.source?.values?.raw?.[1] !== (note.kind === "footnote" ? "FOOTNOTE" : "ENDNOTE"))
        return unavailable("NoteBodyReferenceMismatch");
      if (references.has(owner))
        return unavailable("AmbiguousNoteBodyReference");
      references.set(owner, {
        hostParagraph: paragraph.paragraph,
        anchorUnit: reference.unit,
        numberNode: reference.numberNode
      });
    }
  }
  if (content.hwp5NoteErrors?.length || content.hwp5Notes !== undefined && !Array.isArray(content.hwp5Notes))
    return unavailable("InvalidNoteBodyBindings");
  for (const reference of content.hwp5Notes ?? []) {
    if (!reference || !uint(reference.section) || !uint(reference.controlNode) || !uint(reference.listNode) || !uint(reference.hostParagraph))
      return unavailable("NoteBodyReferenceMismatch");
    const owner = key(reference.section, reference.controlNode), note = notes.get(owner);
    const paragraph = paragraphs.get(key(reference.section, reference.hostParagraph));
    if (!note || note.kind !== reference.kind || note.listNode !== reference.listNode || !referenceAllowed(reference.section, reference.hostParagraph) || !uint(reference.anchorUnit) || paragraph?.text[reference.anchorUnit] !== "￼" || !uint(reference.controlNode) || !Array.isArray(reference.paragraphs) || reference.paragraphs.length !== note.paragraphs.length || new Set(reference.paragraphs).size !== reference.paragraphs.length || reference.paragraphs.some((id) => !note.paragraphs.includes(id)))
      return unavailable("NoteBodyReferenceMismatch");
    if (references.has(owner))
      return unavailable("AmbiguousNoteBodyReference");
    references.set(owner, {
      hostParagraph: reference.hostParagraph,
      anchorUnit: reference.anchorUnit,
      numberNode: reference.controlNode
    });
  }
  if (notes.size !== references.size)
    return unavailable("MissingNoteBodyReference");
  return {
    state: "bound",
    notes: [...notes.entries()].map(([owner, note]) => ({
      ...note,
      paragraphs: note.paragraphs.toSorted((a, b) => a - b),
      ...references.get(owner)
    }))
  };
}

// web/preview/hwp5-page-area-content.mjs
function attachHwp5PageAreas(editor, content) {
  content.pageAreaSources = [];
  content.pageAreaSourceErrors = [];
  if (!editor)
    return content;
  const flows = content.currentParagraphFlows ?? [];
  for (const section of new Set(flows.filter((row) => ["header", "footer"].includes(row.host)).map((row) => row.section))) {
    try {
      const areas = validateHwp5PageAreaSources(editor.pageAreaSources(section)), seen = new Set;
      const members = flows.filter((row) => row.section === section && ["header", "footer"].includes(row.host));
      for (const area of areas) {
        if (seen.has(area.list_node))
          throw new Error("AmbiguousHwp5PageAreaSource");
        seen.add(area.list_node);
        const current = members.filter((row) => row.host === area.kind && row.list_node === area.list_node && row.parent_node === area.owner_node);
        if (!current.length)
          throw new Error("MissingHwp5PageAreaOwner");
      }
      if (members.some((row) => !areas.some((area) => area.kind === row.host && area.list_node === row.list_node && area.owner_node === row.parent_node)))
        throw new Error("Hwp5PageAreaBindingMismatch");
      content.pageAreaSources.push(...areas.map((row) => ({ ...row, section })));
    } catch (error) {
      content.pageAreaSourceErrors.push({ section, error: error.message });
    }
  }
  return content;
}
function hwp5PageArea(source) {
  validateHwp5PageAreaSources([source]);
  if (!source || !["header", "footer"].includes(source.kind) || (source.control_attributes & ~3) !== 0 || (source.control_attributes & 3) === 3 || (source.list_attributes & ~96) !== 0 || (source.list_attributes >> 5 & 3) === 3 || source.list_unknown !== 0 || source.width <= 0 || source.height < 0)
    throw new Error("UnsupportedHwp5PageArea");
  if (source.text_references !== 0 || source.number_references !== 0)
    throw new Error("UnsupportedHwp5PageAreaReferences");
  const identityOnly = source.control_extra_bytes === 4 && Number.isInteger(source.control_instance_id) && source.control_instance_id >= 0 && source.control_instance_id <= 4294967295 && source.control_extra_nonzero === (source.control_instance_id !== 0);
  if (source.control_extra_nonzero !== false && !identityOnly || source.list_extra_nonzero !== false || ![0, 4].includes(source.control_extra_bytes) || ![0, 16].includes(source.list_extra_bytes))
    throw new Error("UnsupportedHwp5PageAreaExtension");
  return {
    owner_node: source.owner_node,
    list_node: source.list_node,
    apply: ["both", "even", "odd"][source.control_attributes & 3],
    width: source.width,
    height: source.height,
    vertical_alignment: ["top", "center", "bottom"][source.list_attributes >> 5 & 3]
  };
}

// web/preview/normalized-note-page-policy.mjs
function normalizedNotePagePolicy({
  section,
  kind,
  sourceNode,
  placement,
  beneathText,
  between,
  below,
  above,
  length,
  type,
  width,
  color
}) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const allowed = kind === "footnote" ? ["EACH_COLUMN", "MERGED_COLUMN", "RIGHT_MOST_COLUMN"] : kind === "endnote" ? ["END_OF_DOCUMENT", "END_OF_SECTION"] : [];
  if (!Number.isSafeInteger(section) || section < 0 || !allowed.includes(placement) || typeof beneathText !== "boolean" || ![between, below, above].every(uint) || !Number.isInteger(length) || length < -1 || length > 2147483647)
    return { state: "unavailable", error: "UnsupportedNotePagePolicy" };
  return {
    state: "selected",
    section,
    kind,
    sourceNode,
    placement,
    beneathText,
    betweenNotes: hwpUnitPixels(between),
    belowLine: hwpUnitPixels(below),
    aboveLine: hwpUnitPixels(above),
    separator: { length: length === -1 ? "full" : hwpUnitPixels(length), type, width, color }
  };
}

// web/preview/hwp5-caption-geometry.mjs
function hwp5CaptionGeometry(source) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!source || ![source.flags, source.attributes, source.list_node].every(uint) || ![0, 8].includes(source.extra_bytes) || source.extra_bytes === 8 && source.extra_nonzero !== false || (source.flags & ~7) !== 0 || (source.attributes & ~127) !== 0 || !Number.isInteger(source.width) || source.width < 0 || source.width > 4294967295 || !Number.isInteger(source.gap) || source.gap < -32768 || source.gap > 32767)
    throw new Error("UnsupportedHwp5CaptionGeometry");
  return {
    caption_node: source.list_node,
    list_node: source.list_node,
    side: source.flags & 3,
    full_size: Boolean(source.flags & 4),
    width: source.width,
    gap: source.gap,
    text_direction: source.attributes & 7,
    line_wrap: source.attributes >>> 3 & 3,
    vertical_alignment: source.attributes >>> 5 & 3
  };
}
function attachHwp5CaptionGeometry(content) {
  content.hwp5CaptionGeometryErrors = [];
  for (const table of content.tables ?? []) {
    delete table.sourceCaption;
    table.captionParagraphs = [];
  }
  for (const paragraph of content.paragraphs ?? [])
    delete paragraph.tableCaption;
  const captions = content.hwp5Captions ?? [];
  const sections = new Set([
    ...captions.map((row) => row.section),
    ...(content.tables ?? []).filter((row) => row.sourceGeometry).map((row) => row.section)
  ]);
  for (const section of sections) {
    let currentCaption = null;
    try {
      for (const table of content.tables.filter((row) => row.section === section && row.sourceGeometry?.has_caption !== undefined)) {
        const present = captions.some((row) => row.section === section && row.tableNode === table.tableNode);
        if (table.sourceGeometry.has_caption !== present)
          throw new Error("Hwp5CaptionPresenceMismatch");
      }
      const prepared = [], seenTables = new Set, seenParagraphs = new Set;
      for (const caption of captions.filter((row) => row.section === section)) {
        currentCaption = caption;
        const tables = content.tables.filter((row) => row.section === section && row.tableNode === caption.tableNode);
        if (tables.length !== 1 || seenTables.has(caption.tableNode))
          throw new Error("AmbiguousHwp5TableCaption");
        const table = tables[0], source = hwp5CaptionGeometry(caption.source), paragraphs = [];
        for (const id of caption.paragraphs) {
          const matches = content.paragraphs.filter((row) => row.section === section && row.paragraph === id);
          if (matches.length !== 1 || matches[0].clipped || matches[0].tableCell || seenParagraphs.has(id))
            throw new Error("InvalidHwp5CaptionParagraph");
          seenParagraphs.add(id);
          paragraphs.push(matches[0]);
        }
        seenTables.add(caption.tableNode);
        prepared.push({ table, source, paragraphs, ids: caption.paragraphs });
      }
      for (const { table, source, paragraphs, ids } of prepared) {
        table.sourceCaption = source;
        table.captionParagraphs = [...ids];
        for (const paragraph of paragraphs)
          paragraph.tableCaption = {
            tableNode: table.tableNode,
            captionNode: source.caption_node,
            listNode: source.list_node
          };
      }
    } catch (error) {
      const evidence = {};
      if (error.message === "UnsupportedHwp5CaptionGeometry" && currentCaption) {
        for (const [key, value] of [
          ["tableNode", currentCaption.tableNode],
          ["listNode", currentCaption.listNode],
          ["rawCaptionFlags", currentCaption.source?.flags],
          ["rawCaptionAttributes", currentCaption.source?.attributes]
        ]) {
          if (Number.isInteger(value) && value >= 0 && value <= 4294967295)
            evidence[key] = value;
        }
      }
      content.hwp5CaptionGeometryErrors.push({ section, error: error.message, ...evidence });
    }
  }
  return content;
}

// web/preview/structural-anchor-units.mjs
function structuralAnchorUnits(paragraph) {
  const anchors = paragraph.structuralAnchors ?? [];
  if (!Array.isArray(anchors))
    throw new Error("InvalidStructuralAnchorUnits");
  const units = new Set, controls = new Set;
  for (const anchor of anchors) {
    if (!anchor || !HWP5_STRUCTURAL_ANCHOR_KINDS.includes(anchor.kind) || anchor.paragraph !== paragraph.paragraph || !Number.isSafeInteger(anchor.control_node) || anchor.control_node < 0 || controls.has(anchor.control_node) || !Number.isSafeInteger(anchor.unit) || anchor.unit < 0 || units.has(anchor.unit) || paragraph.text[anchor.unit] !== "￼")
      throw new Error("InvalidStructuralAnchorUnits");
    controls.add(anchor.control_node);
    units.add(anchor.unit);
  }
  return units;
}
function isStructuralAnchor(paragraph, unit) {
  return paragraph?.structuralAnchors?.some((anchor) => anchor.unit === unit && anchor.paragraph === paragraph.paragraph && HWP5_STRUCTURAL_ANCHOR_KINDS.includes(anchor.kind)) === true;
}

// web/preview/hwp5-numbering-note-units.mjs
function hwp5NumberingNoteUnits(content, paragraph) {
  const fail = () => {
    throw new Error("AmbiguousHwp5NumberingNoteAnchor");
  };
  if ((content.hwp5NoteErrors ?? []).some((row) => row.section === paragraph.section))
    fail();
  const notes = (content.hwp5Notes ?? []).filter((row) => row.section === paragraph.section);
  try {
    validateHwp5NoteSources(notes.map((row) => row.source));
  } catch {
    fail();
  }
  const result = new Map;
  for (const note of notes) {
    const source = note.source;
    if (note.kind !== source.kind || note.controlNode !== source.control_node || note.listNode !== source.list_node || note.hostParagraph !== source.paragraph)
      fail();
    if (note.hostParagraph !== paragraph.paragraph)
      continue;
    let unit, end;
    try {
      unit = sourceDisplayPosition(source.current_unit, paragraph.sourceOffsets, paragraph.text.length);
      end = sourceDisplayPosition(source.current_unit + 8, paragraph.sourceOffsets, paragraph.text.length);
    } catch {
      fail();
    }
    if (paragraph.clipped || note.anchorUnit !== unit || end !== unit + 1 || paragraph.text[unit] !== "￼")
      fail();
    const members = (content.currentParagraphFlows ?? []).filter((row) => row.section === note.section && row.host === note.kind && row.list_node === note.listNode && row.parent_node === note.controlNode);
    if (!members.length || !Array.isArray(note.paragraphs) || members.length !== note.paragraphs.length || new Set(note.paragraphs).size !== note.paragraphs.length || members.some((row, i) => row.paragraph !== note.paragraphs[i] || content.paragraphs.filter((p) => p.section === note.section && p.paragraph === row.paragraph && !p.clipped).length !== 1))
      fail();
    if (result.has(note.controlNode) && result.get(note.controlNode) !== unit)
      fail();
    result.set(note.controlNode, unit);
  }
  return result;
}

// web/preview/hwp5-numbering-object-units.mjs
function hwp5NumberingObjectUnits(content, paragraph) {
  const units = new Set, identities = new Set;
  const fail = () => {
    throw new Error("AmbiguousHwp5NumberingObjectAnchor");
  };
  const add = (kind, node, unit) => {
    if (!Number.isInteger(node) || node < 0 || node > 4294967295 || !Number.isInteger(unit) || unit < 0 || paragraph.text[unit] !== "￼" || units.has(unit) || identities.has(`${kind}:${node}`))
      fail();
    units.add(unit);
    identities.add(`${kind}:${node}`);
  };
  for (const drawing of content.hwp5Drawings ?? []) {
    if (drawing.section !== paragraph.section || drawing.hostParagraph !== paragraph.paragraph)
      continue;
    if (drawing.source?.control_node !== drawing.controlNode || drawing.source?.component_node !== drawing.componentNode)
      fail();
    add("drawing", drawing.controlNode, drawing.anchorUnit);
  }
  for (const table of content.tables ?? []) {
    if (table.section !== paragraph.section || table.hostParagraph !== paragraph.paragraph)
      continue;
    add("table", table.tableNode, table.anchorUnit);
  }
  for (const [node, unit] of hwp5NumberingNoteUnits(content, paragraph))
    add("note", node, unit);
  return units;
}

// web/preview/hwp5-master-page-policy.mjs
function hwp5MasterPageProfiles(section, sources) {
  validateHwp5MasterPageSources(sources);
  let applies;
  if (section && [83951617, 83951872].includes(section.fileVersion) && section.flags === 536870912 && sources.length === 1)
    applies = ["both"];
  else if (section?.fileVersion === 83951872 && section.flags === 3221225472 && sources.length === 2 && sources[0].list_node < sources[1].list_node)
    applies = ["even", "odd"];
  else
    throw new Error("UnsupportedHwp5MasterPageProfile");
  return sources.map((source, index) => {
    if (source.owner_node !== section.source_node || source.list_attributes !== 0 || source.list_unknown !== 0 || source.width <= 0 || source.height <= 0 || source.text_reference !== 0 || source.number_reference !== 0 || source.extra_bytes !== 16 || source.extra_nonzero !== false)
      throw new Error("UnsupportedHwp5MasterPageProfile");
    return {
      apply: applies[index],
      width: source.width,
      height: source.height,
      owner_node: source.owner_node,
      list_node: source.list_node
    };
  });
}

// web/preview/hwp5-section-display-flags.mjs
var hideEmptyLines = 524288;
function hwp5SectionDisplayFlags(source, content, hasMasterPage = false) {
  const flags = source?.flags;
  if (!Number.isInteger(flags) || flags < 0 || flags > 4294967295 || !hasMasterPage && (flags & ~hideEmptyLines) !== 0)
    return { supported: false };
  if (!(flags & hideEmptyLines))
    return { supported: true, hideFirstEmptyLine: false };
  const flows = content.currentParagraphFlows?.filter((row) => row.section === source.section && row.top_level === true);
  if (!flows?.length || content.flowSourceErrors?.some((row) => row.section === source.section) || flows.some((row) => typeof row.empty_line_eligible !== "boolean"))
    return { supported: false };
  return { supported: true, hideFirstEmptyLine: true };
}

// web/preview/hwp5-document-numbering.mjs
function attachHwp5DocumentProperties(editor, content) {
  content.documentPropertySource = null;
  content.documentPropertySourceError = null;
  if (!editor || !(content.pageAreaSources?.length || content.pageControlSources?.length || content.masterPageSources?.length))
    return content;
  try {
    content.documentPropertySource = validateHwp5DocumentProperties(editor.documentProperties());
  } catch (error) {
    content.documentPropertySourceError = error.message;
  }
  return content;
}
function hwp5EffectivePageNumberSource(content) {
  if (content.documentPropertySourceError || !content.documentPropertySource)
    throw new Error("MissingHwp5DocumentProperties");
  const document = validateHwp5DocumentProperties(content.documentPropertySource), sections = content.sectionSources;
  if (document.section_count !== 1 || sections?.length !== 1 || sections[0].section !== 0)
    throw new Error("UnsupportedHwp5SectionNumbering");
  if (document.extra_bytes !== 0 || document.extra_nonzero)
    throw new Error("UnsupportedHwp5DocumentPropertiesExtension");
  const section = sections[0];
  if (!hwp5SectionDisplayFlags(section, content).supported || !Number.isInteger(section.page_start) || section.page_start < 0 || section.page_start > 65535)
    throw new Error("UnsupportedHwp5SectionNumbering");
  const start = section.page_start === 0 ? document.page_start : section.page_start;
  if (start < 1)
    throw new Error("MissingEffectivePageNumber");
  const controls = validateHwp5PageControlSources(content.pageControlSources ?? []);
  if (content.pageControlSourceErrors?.length)
    throw new Error("IncompleteHwp5PageNumberControls");
  validateControlAnchors(content, controls);
  return {
    supported: true,
    start_page: start,
    hide_first_header: false,
    hide_first_footer: false,
    ...controls.length ? { page_controls: controls } : {}
  };
}
function hwp5EffectiveSectionPageNumberSource(content) {
  if (content.documentPropertySourceError || !content.documentPropertySource)
    throw new Error("MissingHwp5DocumentProperties");
  const document = validateHwp5DocumentProperties(content.documentPropertySource);
  if (document.extra_bytes !== 0 || document.extra_nonzero)
    throw new Error("UnsupportedHwp5DocumentPropertiesExtension");
  const sections = content.sectionSources;
  if (!Array.isArray(sections) || !sections.length || sections.length !== document.section_count)
    throw new Error("UnsupportedHwp5SectionNumbering");
  if (content.pageControlSourceErrors?.length)
    throw new Error("IncompleteHwp5PageNumberControls");
  const controls = content.pageControlSources ?? [];
  if (!Array.isArray(controls) || controls.some((c) => !Number.isInteger(c?.section) || c.section < 0 || c.section >= sections.length))
    throw new Error("UnsupportedHwp5SectionNumbering");
  const starts = sections.map((section, index) => {
    if (section.section !== index || !Number.isInteger(section.page_start) || section.page_start < 0 || section.page_start > 65535)
      throw new Error("UnsupportedHwp5SectionNumbering");
    if (!hwp5SectionDisplayFlags(section, content).supported) {
      hwp5MasterPageProfiles(section, (content.masterPageSources ?? []).filter((row) => row.section === index));
      if (!hwp5SectionDisplayFlags(section, content, true).supported)
        throw new Error("UnsupportedHwp5SectionNumbering");
    }
    validateHwp5PageControlSources(controls.filter((c) => c.section === index));
    return { section: index, start: section.page_start };
  });
  const start = starts[0].start || document.page_start;
  if (start < 1)
    throw new Error("MissingEffectivePageNumber");
  validateControlAnchors(content, controls);
  return {
    supported: true,
    start_page: start,
    section_starts: starts,
    page_controls: controls,
    hide_first_header: false,
    hide_first_footer: false
  };
}
function validateControlAnchors(content, controls) {
  for (const flow of content.currentParagraphFlows ?? []) {
    if (flow.host !== "body")
      continue;
    const paragraph = content.paragraphs.find((row) => row.section === flow.section && row.paragraph === flow.paragraph);
    if (!paragraph || paragraph.clipped)
      throw new Error("IncompleteHwp5PageNumberControls");
    const declarations = structuralAnchorUnits(paragraph);
    const objects = hwp5NumberingObjectUnits(content, paragraph);
    if ([...objects].some((unit) => declarations.has(unit)))
      throw new Error("AmbiguousHwp5NumberingObjectAnchor");
    const pageUnits = new Set;
    for (const control of controls.filter((row) => row.section === paragraph.section && row.paragraph === paragraph.paragraph)) {
      if (!Number.isInteger(control.unit) || paragraph.text[control.unit] !== "￼" || declarations.has(control.unit) || objects.has(control.unit) || pageUnits.has(control.unit))
        throw new Error("AmbiguousHwp5PageNumberAnchor");
      pageUnits.add(control.unit);
    }
    for (let unit = 0;unit < paragraph.text.length; unit++)
      if (paragraph.text[unit] === "￼" && !declarations.has(unit) && !objects.has(unit) && !pageUnits.has(unit))
        throw new Error("UnsupportedHwp5PageNumberControls");
  }
}

// web/preview/cardinal-number.mjs
function cardinalNumber(number, language) {
  if (!Number.isInteger(number) || number < 0 || number > 4294967295 || !["hangul", "hanja"].includes(language))
    return null;
  const hangul = language === "hangul", digits = hangul ? "일이삼사오육칠팔구" : "一二三四五六七八九";
  const small = hangul ? ["", "십", "백", "천"] : ["", "十", "百", "千"];
  const large = hangul ? ["", "만", "억"] : ["", "萬", "億"];
  if (number === 0)
    return hangul ? "영" : "零";
  const parts = [];
  for (let groupIndex = 0, remaining = number;remaining > 0; groupIndex++, remaining = Math.floor(remaining / 1e4)) {
    const group = remaining % 1e4;
    if (group === 0)
      continue;
    let text = "";
    for (let position = 3;position >= 0; position--) {
      const digit = Math.floor(group / 10 ** position) % 10;
      if (digit !== 0)
        text += (digit === 1 && position > 0 ? "" : digits[digit - 1]) + small[position];
    }
    parts.unshift(text + large[groupIndex]);
  }
  return parts.join("");
}

// web/preview/number-format.mjs
var binaryNames = Object.freeze([
  "DIGIT",
  "CIRCLED_DIGIT",
  "ROMAN_CAPITAL",
  "ROMAN_SMALL",
  "LATIN_CAPITAL",
  "LATIN_SMALL",
  "CIRCLED_LATIN_CAPITAL",
  "CIRCLED_LATIN_SMALL",
  "HANGUL_SYLLABLE",
  "CIRCLED_HANGUL_SYLLABLE",
  "HANGUL_JAMO",
  "CIRCLED_HANGUL_JAMO",
  "HANGUL_PHONETIC",
  "IDEOGRAPH",
  "CIRCLED_IDEOGRAPH",
  "DECAGON_CIRCLE",
  "DECAGON_CIRCLE_HANJA"
]);
var hwp5NumberFormat = (code) => Number.isInteger(code) && code >= 0 && code <= 255 ? binaryNames[code] ?? (code === 128 ? "SYMBOL" : code === 129 ? "USER_CHAR" : null) : null;
var finite = Object.freeze({
  HANGUL_SYLLABLE: "가나다라마바사아자차카타파하",
  HANGUL_JAMO: "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ",
  DECAGON_CIRCLE: "갑을병정무기경신임계",
  DECAGON_CIRCLE_HANJA: "甲乙丙丁戊己庚辛壬癸"
});
var circles = Object.freeze({
  CIRCLED_DIGIT: [9312, 20],
  CIRCLED_LATIN_CAPITAL: [9398, 26],
  CIRCLED_LATIN_SMALL: [9424, 26],
  CIRCLED_HANGUL_SYLLABLE: [12910, 14],
  CIRCLED_HANGUL_JAMO: [12896, 14],
  CIRCLED_IDEOGRAPH: [12928, 10]
});
function formatNumber(number, kind, symbol = "") {
  if (!Number.isInteger(number) || number < 0 || number > 4294967295 || typeof kind !== "string")
    return null;
  if (kind === "DIGIT")
    return String(number);
  if (kind === "HANGUL_PHONETIC" || kind === "IDEOGRAPH")
    return cardinalNumber(number, kind === "HANGUL_PHONETIC" ? "hangul" : "hanja");
  if (number === 0)
    return null;
  if (kind === "USER_CHAR")
    return typeof symbol === "string" && [...symbol].length === 1 && ![...symbol].some((char) => char.codePointAt(0) >= 55296 && char.codePointAt(0) <= 57343) ? symbol : null;
  if (Object.hasOwn(circles, kind)) {
    const [start, count] = circles[kind];
    return number <= count ? String.fromCodePoint(start + number - 1) : null;
  }
  if (Object.hasOwn(finite, kind))
    return [...finite[kind]][number - 1] ?? null;
  if (["LATIN_CAPITAL", "LATIN_SMALL"].includes(kind)) {
    const base = kind === "LATIN_CAPITAL" ? 65 : 97;
    let result = "", remaining = number;
    while (remaining > 0) {
      remaining--;
      result = String.fromCharCode(base + remaining % 26) + result;
      remaining = Math.floor(remaining / 26);
    }
    return result;
  }
  if (["ROMAN_CAPITAL", "ROMAN_SMALL"].includes(kind)) {
    if (number > 3999)
      return null;
    let result = "", remaining = number;
    for (const [value, text] of [
      [1000, "M"],
      [900, "CM"],
      [500, "D"],
      [400, "CD"],
      [100, "C"],
      [90, "XC"],
      [50, "L"],
      [40, "XL"],
      [10, "X"],
      [9, "IX"],
      [5, "V"],
      [4, "IV"],
      [1, "I"]
    ]) {
      while (remaining >= value) {
        result += text;
        remaining -= value;
      }
    }
    return kind === "ROMAN_SMALL" ? result.toLowerCase() : result;
  }
  return null;
}

// web/preview/automatic-number-text.mjs
function automaticNumberSource(paragraph, unit, kind = "text") {
  if (kind === "number-prefix") {
    const rows = paragraph?.automaticNumberPrefixes;
    return unit === 0 && rows?.length === 1 ? rows[0].source : null;
  }
  if (kind !== "text" || paragraph?.text?.[unit] !== "￼")
    return null;
  const rows = paragraph?.automaticNumbers?.filter((number) => number.unit === unit) ?? [];
  return rows.length === 1 ? rows[0].source : null;
}
function automaticNumberText(paragraph, unit, pageNumber) {
  const source = automaticNumberSource(paragraph, unit);
  if (source?.hwp5PageNumber === true && pageNumber !== undefined) {
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 4294967295)
      return null;
    return storedAutomaticNumberText({ ...source, values: { ...source.values, num: pageNumber } });
  }
  return storedAutomaticNumberText(source);
}
function storedAutomaticNumberText(source) {
  const { values, format } = source ?? {};
  if (!values?.type_known || !format?.type_known || !Array.isArray(format.raw) || typeof format.supscript !== "boolean" || typeof format.raw[2] !== "string" || typeof format.raw[3] !== "string")
    return null;
  const text = formatNumber(values.num, format.raw[0], format.raw[1]);
  return text === null ? null : format.raw[2] + text + format.raw[3];
}

// web/preview/hwp5-rectangle-geometry-projection.mjs
function projectHwp5RectangleGeometry(content) {
  const fail = (error) => ({ state: "unavailable", error });
  try {
    if (content.hwp5DrawingErrors?.length || content.hwp5DrawingLocalErrors?.length || content.hwp5DrawingCornerErrors?.length)
      throw new Error("IncompleteHwp5RectangleGeometry");
    const drawings = [], seen = new Set;
    for (const drawing of content.hwp5Drawings ?? []) {
      if (drawing.source?.kind_id !== 611476835)
        throw new Error("UnsupportedHwp5RectangleRoot");
      const key = `${drawing.section}:${drawing.componentNode}`;
      if (seen.has(key) || drawing.source.component_node !== drawing.componentNode || drawing.source.control_node !== drawing.controlNode)
        throw new Error("AmbiguousHwp5RectangleGeometry");
      seen.add(key);
      const locals = (content.hwp5DrawingLocalTransforms ?? []).filter((row) => row.section === drawing.section && row.component_node === drawing.componentNode);
      const corners = (content.hwp5DrawingCorners ?? []).filter((row) => row.section === drawing.section && row.component_node === drawing.componentNode);
      if (locals.length !== 1 || corners.length !== 1)
        throw new Error("MissingHwp5RectangleGeometry");
      validateHwp5DrawingLocalTransforms(locals);
      validateHwp5DrawingRectangleCorners(corners);
      if (locals[0].owner_node !== drawing.controlNode)
        throw new Error("UnsupportedHwp5RectangleComponent");
      const source = hwp5DrawingGeometry(drawing.source);
      source.group_context = null;
      source.rendering = {
        matrix: [...locals[0].matrix],
        angle: drawing.source.rotation_angle,
        flip: [
          !!(drawing.source.component_attributes & 1),
          !!(drawing.source.component_attributes & 2)
        ],
        reverse: null,
        unknown_component_attributes: (drawing.source.component_attributes & ~3) >>> 0
      };
      source.rendering_corners = corners[0].points.map((point) => [...point]);
      if (corners[0].raw_points !== undefined)
        source.rectangle = { points: corners[0].raw_points.map((point) => [...point]) };
      source.round_rate = corners[0].round_rate;
      drawings.push({
        section: drawing.section,
        drawingNode: drawing.componentNode,
        controlNode: drawing.controlNode,
        hostParagraph: drawing.hostParagraph,
        anchorUnit: drawing.anchorUnit,
        source
      });
    }
    return { state: "projected", drawings };
  } catch (error) {
    return fail(error.message);
  }
}

// web/preview/projection-pair-index.mjs
var none = Object.freeze({ count: 0, first: undefined });
function createProjectionPairIndex(rows, firstKey, secondKey, { enabled = true } = {}) {
  rows ??= [];
  let built = false, index = null, entryVisits = 0, fallbackEntryVisits = 0, queries = 0;
  function build() {
    built = true;
    if (!enabled || !Array.isArray(rows))
      return;
    const arrayDescriptors = Object.getOwnPropertyDescriptors(rows), length = arrayDescriptors.length?.value;
    if (!Number.isSafeInteger(length) || length < 0)
      return;
    const groups = new Map;
    for (let position = 0;position < length; position++) {
      const item = arrayDescriptors[String(position)];
      if (!item || !Object.hasOwn(item, "value"))
        return;
      const row = item.value;
      entryVisits++;
      if (!row || ![Object.prototype, null].includes(Object.getPrototypeOf(row)))
        return;
      const descriptors = Object.getOwnPropertyDescriptors(row);
      if (Reflect.ownKeys(descriptors).some((key) => !Object.hasOwn(descriptors[key], "value")))
        return;
      const observed = Object.isFrozen(row) ? row : Object.freeze(Object.defineProperties(Object.create(Object.getPrototypeOf(row)), descriptors));
      const first = descriptors[firstKey], second = descriptors[secondKey];
      if (!first || !second)
        return;
      const a = first.value, b = second.value;
      if (Number.isNaN(a) || Number.isNaN(b))
        continue;
      let group = groups.get(a);
      if (!group) {
        group = new Map;
        groups.set(a, group);
      }
      const old = group.get(b);
      if (old)
        old.count++;
      else
        group.set(b, { count: 1, first: observed });
    }
    index = groups;
  }
  return {
    find(first, second) {
      queries++;
      if (!built) {
        try {
          build();
        } catch {
          built = true;
          index = null;
        }
      }
      if (index)
        return Number.isNaN(first) || Number.isNaN(second) ? none : index.get(first)?.get(second) ?? none;
      const matches = rows.filter((row) => {
        fallbackEntryVisits++;
        return row[firstKey] === first && row[secondKey] === second;
      });
      return matches.length ? { count: matches.length, first: matches[0] } : none;
    },
    stats: () => ({ entryVisits, fallbackEntryVisits, queries, indexed: index !== null })
  };
}
function isProjectionDataOnly(value) {
  const active = new WeakSet, seen = new WeakSet, stack = [{ value, exit: false }];
  try {
    while (stack.length) {
      const item = stack.pop(), node = item.value;
      if (node === null || ["undefined", "string", "number", "boolean"].includes(typeof node))
        continue;
      if (typeof node !== "object")
        return false;
      if (item.exit) {
        active.delete(node);
        seen.add(node);
        continue;
      }
      if (active.has(node))
        return false;
      if (seen.has(node))
        continue;
      const proto = Object.getPrototypeOf(node);
      if (![Object.prototype, Array.prototype, null].includes(proto))
        return false;
      active.add(node);
      stack.push({ value: node, exit: true });
      const descriptors = Object.getOwnPropertyDescriptors(node);
      for (const key of Reflect.ownKeys(descriptors)) {
        if (typeof key !== "string")
          return false;
        const d = descriptors[key];
        if (!Object.hasOwn(d, "value"))
          return false;
        stack.push({ value: d.value, exit: false });
      }
    }
    return true;
  } catch {
    return false;
  }
}

// web/preview/hwp5-drawing-text-source.mjs
function hwp5DrawingTextSource(source) {
  validateHwp5DrawingListSources([source]);
  if (source.kind !== "body")
    throw new Error("UnsupportedHwp5DrawingTextList");
  if ((source.attributes & ~127) !== 0)
    throw new Error("UnsupportedHwp5DrawingTextAttributes");
  return {
    list_node: source.list_node,
    text_direction: source.attributes & 7,
    line_wrap: source.attributes >>> 3 & 3,
    vertical_alignment: source.attributes >>> 5 & 3,
    margin_present: true,
    margins: [...source.margins],
    extra_bytes: source.body_extra_bytes
  };
}

// web/preview/hwp5-drawing-text-projection.mjs
function projectHwp5DrawingText(content) {
  const fail = (error) => ({ state: "unavailable", error });
  try {
    if (!Array.isArray(content?.paragraphs) || content.hwp5DrawingErrors?.length || content.hwp5DrawingBodyErrors?.length)
      throw new Error("IncompleteHwp5DrawingTextSources");
    const paragraphs = new Map, owners = new Map, bindings = [];
    for (const paragraph of content.paragraphs) {
      const key = `${paragraph.section}:${paragraph.paragraph}`;
      if (paragraphs.has(key))
        throw new Error("AmbiguousHwp5DrawingTextParagraph");
      paragraphs.set(key, paragraph);
    }
    const bodies = content.hwp5DrawingBodies ?? [];
    const rootsData = Object.getOwnPropertyDescriptor(content, "hwp5Drawings");
    const flowsData = Object.getOwnPropertyDescriptor(content, "currentParagraphFlows");
    const stableBodies = Array.isArray(bodies) && bodies.length > 0 && rootsData && Object.hasOwn(rootsData, "value") && flowsData && Object.hasOwn(flowsData, "value") && Array.isArray(rootsData.value ?? []) && Array.isArray(flowsData.value ?? []) && isProjectionDataOnly([bodies, content.paragraphs, rootsData.value, flowsData.value]);
    const rootsByOwner = stableBodies ? createProjectionPairIndex(rootsData.value ?? [], "section", "controlNode") : null;
    const flowsByParagraph = stableBodies ? createProjectionPairIndex(flowsData.value ?? [], "section", "paragraph") : null;
    const lists = new Set;
    for (const body of bodies) {
      validateHwp5DrawingListSources([body.source]);
      const source = body.source, listKey = `${body.section}:${body.listNode}`;
      if (lists.has(listKey) || body.kind !== source.kind || body.ownerNode !== source.owner_node || body.controlNode !== source.control_node || body.listNode !== source.list_node)
        throw new Error("Hwp5DrawingTextSourceMismatch");
      lists.add(listKey);
      const rootMatches = stableBodies ? null : (content.hwp5Drawings ?? []).filter((row) => row.section === body.section && row.controlNode === body.controlNode);
      const roots = !stableBodies ? { count: rootMatches.length, first: rootMatches[0] } : rootsByOwner.find(body.section, body.controlNode);
      if (roots.count !== 1)
        throw new Error("MissingHwp5DrawingTextRoot");
      const drawingNode = body.kind === "body" ? body.ownerNode : roots.first.componentNode;
      const text = body.kind === "body" ? hwp5DrawingTextSource(source) : null;
      const caption = body.kind === "caption" ? hwp5CaptionGeometry({
        ...source.caption,
        attributes: source.attributes,
        list_node: body.listNode
      }) : null;
      if (!Array.isArray(body.paragraphs))
        throw new Error("InvalidHwp5DrawingTextMembers");
      for (const id of body.paragraphs) {
        const key = `${body.section}:${id}`, paragraph = paragraphs.get(key);
        const flowMatches = stableBodies ? null : (content.currentParagraphFlows ?? []).filter((row) => row.section === body.section && row.paragraph === id);
        const flows = !stableBodies ? { count: flowMatches.length, first: flowMatches[0] } : flowsByParagraph.find(body.section, id);
        if (!Number.isInteger(id) || id < 0 || id > 4294967295 || owners.has(key) || !paragraph || paragraph.clipped || paragraph.tableCell || paragraph.tableCaption || flows.count !== 1 || flows.first.host !== "drawing" || flows.first.parent_node !== body.ownerNode || flows.first.list_node !== body.listNode || flows.first.top_level !== false)
          throw new Error("Hwp5DrawingTextMemberMismatch");
        owners.set(key, {
          kind: body.kind,
          drawingNode,
          listNode: body.listNode,
          captionNode: caption?.caption_node
        });
      }
      bindings.push({
        section: body.section,
        kind: body.kind,
        controlNode: body.controlNode,
        drawingNode,
        listNode: body.listNode,
        text,
        caption
      });
    }
    for (const flow of content.currentParagraphFlows ?? [])
      if (flow.host === "drawing" && !owners.has(`${flow.section}:${flow.paragraph}`))
        throw new Error("MissingHwp5DrawingTextMember");
    const projected = content.paragraphs.map((paragraph) => {
      if (Object.isFrozen(paragraph) && [Object.prototype, null].includes(Object.getPrototypeOf(paragraph)) && !("drawingText" in paragraph) && !("drawingCaption" in paragraph) && Reflect.ownKeys(paragraph).every((key) => typeof key === "string" && Object.hasOwn(Object.getOwnPropertyDescriptor(paragraph, key), "value")) && !owners.has(`${paragraph.section}:${paragraph.paragraph}`))
        return paragraph;
      const {
        drawingText: _previousDrawingText,
        drawingCaption: _previousDrawingCaption,
        ...copy
      } = paragraph;
      const owner = owners.get(`${paragraph.section}:${paragraph.paragraph}`);
      if (owner)
        copy[owner.kind === "body" ? "drawingText" : "drawingCaption"] = {
          drawingNode: owner.drawingNode,
          listNode: owner.listNode,
          ...owner.kind === "caption" ? { captionNode: owner.captionNode } : {}
        };
      return copy;
    });
    return { state: "projected", paragraphs: projected, bindings };
  } catch (error) {
    return fail(error.message);
  }
}

// web/preview/gradient-step-stops.mjs
function gradientStepStops(colors, steps, centerPercent) {
  if (!Array.isArray(colors) || colors.length < 2 || colors.length > 256 || !colors.every((c) => /^#[0-9a-f]{6}$/i.test(c)) || !Number.isInteger(steps) || steps < 0 || steps > 255 || !Number.isInteger(centerPercent) || centerPercent < 0 || centerPercent > 100)
    throw new Error("InvalidGradientStepStops");
  if (steps === 0)
    return [];
  if (steps === 1)
    throw new Error("UnsupportedSingleGradientStep");
  const rgb = colors.map((c) => [1, 3, 5].map((i) => Number.parseInt(c.slice(i, i + 2), 16)));
  const colorAt = (position) => {
    const coordinate = position * (rgb.length - 1), index = Math.min(Math.floor(coordinate), rgb.length - 2), fraction = coordinate - index;
    return "#" + rgb[index].map((channel, axis) => Math.round(channel + (rgb[index + 1][axis] - channel) * fraction).toString(16).padStart(2, "0")).join("");
  };
  const center = centerPercent / 100;
  const inverse = (t) => t <= 0.5 ? t * 2 * center : center + (t - 0.5) * 2 * (1 - center);
  const stops = [{ offset: 0, color: colorAt(0) }];
  for (let i = 0;i < steps - 1; i++) {
    const offset = inverse((i + 0.5) / (steps - 1));
    stops.push({ offset, color: colorAt(i / (steps - 1)) }, { offset, color: colorAt((i + 1) / (steps - 1)) });
  }
  stops.push({ offset: 1, color: colorAt(1) });
  return stops;
}

// web/preview/hwp5-drawing-paint-plan.mjs
var hatches = ["HORIZONTAL", "VERTICAL", "BACK_SLASH", "SLASH", "CROSS", "CROSS_DIAGONAL"];
function hwp5DrawingPaintPlan(style) {
  const fail = (error) => ({ state: "unavailable", error });
  try {
    validateHwp5DrawingStyleSources([style]);
  } catch (error) {
    return fail(error.message);
  }
  const tail = hwp5DrawingPaintTail(style);
  if (tail.state !== "selected")
    return tail;
  const color = colorrefCss;
  const line = style.border.attributes.raw & 63;
  const cap = style.border.attributes.raw >>> 6 & 15;
  const stroke = hwp5StrokeDisplay(style.border);
  if (!stroke || (line === 0 ? cap > 1 : cap !== 1) || (style.border.attributes.raw >>> 10 & 63) !== 0 || (style.border.attributes.raw >>> 16 & 63) !== 0 || style.border.outline !== 0)
    return fail("UnsupportedHwp5DrawingStroke");
  let fill;
  if (style.fill_flags === 0 && style.additional_bytes === 0)
    fill = { state: "none" };
  else if (style.fill_flags === 1 && style.additional_bytes === 0 && style.alpha.pattern === 0) {
    const pattern = style.pattern, background = color(pattern.background), foreground = color(pattern.foreground);
    if (!background || !foreground)
      return fail("UnsupportedHwp5DrawingFillColor");
    if (pattern.kind === -1)
      fill = { state: "solid", color: background };
    else if (hatches[pattern.kind])
      fill = {
        state: "pattern",
        background,
        color: foreground,
        kind: hatches[pattern.kind],
        rasterParity: "unverified"
      };
    else
      return fail("UnsupportedHwp5DrawingHatch");
  } else if (style.fill_flags === 4 && style.additional_bytes === 1 && style.alpha.gradient === 0) {
    const g = style.gradient;
    if (!g || g.kind !== 1 || g.positions.length !== 0 || g.blur_center === null)
      return fail("UnsupportedHwp5DrawingGradient");
    try {
      const stops = gradientStepStops(g.colors.map(color), g.blur, g.blur_center);
      fill = stops.length ? { state: "linear_gradient", angle: g.angle, stops, rasterParity: "unverified" } : { state: "none" };
    } catch (error) {
      return fail(error.message);
    }
  } else
    return fail("UnsupportedHwp5DrawingFill");
  return { state: "planned", stroke, fill, shadowType: tail.shadowType, tailPolicy: tail.policy };
}

// web/preview/hwp5-rectangle-content-projection.mjs
function projectHwp5RectangleContent(content) {
  const geometry = projectHwp5RectangleGeometry(content);
  if (geometry.state !== "projected")
    return geometry;
  const text = projectHwp5DrawingText(content);
  if (text.state !== "projected")
    return text;
  return assembleHwp5RectangleContent(content, geometry, text);
}
function assembleHwp5RectangleContent(content, geometry, text) {
  const fail = (error) => ({ state: "unavailable", error });
  if (geometry?.state !== "projected" || text?.state !== "projected")
    return fail("IncompleteHwp5RectangleProjection");
  if (content.hwp5DrawingStyleErrors?.length)
    return fail("IncompleteHwp5DrawingPaintSources");
  const drawings = [];
  for (const drawing of geometry.drawings) {
    const styles = (content.hwp5DrawingStyles ?? []).filter((row) => row.section === drawing.section && row.component_node === drawing.drawingNode && row.owner_node === drawing.controlNode);
    if (styles.length !== 1)
      return fail("MissingHwp5DrawingPaintSource");
    const paint = hwp5DrawingPaintPlan(styles[0]);
    if (paint.state !== "planned")
      return paint;
    const bindings = text.bindings.filter((row) => row.section === drawing.section && row.drawingNode === drawing.drawingNode);
    const bodies = bindings.filter((row) => row.kind === "body"), captions = bindings.filter((row) => row.kind === "caption");
    if (bodies.length > 1 || captions.length > 1 || drawing.source.has_caption !== (captions.length === 1))
      return fail("AmbiguousHwp5RectangleText");
    drawing.source.text = bodies[0]?.text ?? null;
    drawing.source.caption = captions[0]?.caption ?? null;
    drawing.source.stroke = paint.stroke;
    drawing.source.paint = { shadow_type: paint.shadowType };
    drawing.source.flow.outside_margins = [...drawing.source.out_margin];
    drawings.push({ ...drawing, hwp5Style: structuredClone(styles[0]), fillPlan: paint.fill });
  }
  return {
    state: "projected",
    content: { ...content, paragraphs: text.paragraphs, drawings, containers: [] }
  };
}

// web/preview/hwp5-polygon-path-source.mjs
function hwp5PolygonPathSource(row) {
  try {
    validateHwp5DrawingPolygonPoints([row]);
  } catch (error) {
    return { state: "unavailable", error: error.message };
  }
  if (row.points.length < 2)
    return { state: "unavailable", error: "UnsupportedHwp5PolygonPointCount" };
  const first = row.raw_points[0], last = row.raw_points.at(-1);
  const strokeOnly = row.points.length === 2;
  if (strokeOnly && (first[0] === last[0] && first[1] === last[1] || row.points[0][0] === row.points[1][0] && row.points[0][1] === row.points[1][1]))
    return { state: "unavailable", error: "DegenerateHwp5PolygonSegment" };
  return {
    state: "planned",
    source: {
      rendering_polygon: row.points.map((point) => [...point]),
      polygon_closed: first[0] === last[0] && first[1] === last[1],
      polygon_tail: { extra_bytes: row.extra_bytes, interpreted: false }
    }
  };
}

// web/preview/affine-point-geometry.mjs
var valid = (matrix) => Array.isArray(matrix) && matrix.length === 6 && Array.from(matrix).every(Number.isFinite);
function hwpRenderingMatrix(matrix) {
  if (!valid(matrix))
    return null;
  const [a, c, e, b, d, f] = matrix;
  return [a, b, c, d, e, f];
}
function affinePoint(matrix, point) {
  if (!valid(matrix) || !Array.isArray(point) || point.length !== 2 || !Array.from(point).every(Number.isFinite))
    return null;
  const [a, b, c, d, e, f] = matrix, [x, y] = point;
  const result = [a * x + c * y + e, b * x + d * y + f];
  return result.every(Number.isFinite) ? result : null;
}
function inverseAffine(matrix) {
  if (!valid(matrix))
    return null;
  const [a, b, c, d, e, f] = matrix;
  const det = a * d - b * c;
  if (!Number.isFinite(det) || det === 0)
    return null;
  const result = [
    d / det,
    -b / det,
    -c / det,
    a / det,
    (c * f - d * e) / det,
    (b * e - a * f) / det
  ];
  return result.every(Number.isFinite) ? result : null;
}
function affineBox(matrix, box) {
  if (!box || ![box.x, box.y, box.width, box.height].every(Number.isFinite) || box.width < 0 || box.height < 0)
    return null;
  const { x, y, width, height } = box;
  const points = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height]
  ].map((point) => affinePoint(matrix, point));
  if (points.some((point) => !point))
    return null;
  const xs = points.map((point) => point[0]), ys = points.map((point) => point[1]);
  const left = Math.min(...xs), top = Math.min(...ys);
  const result = { x: left, y: top, width: Math.max(...xs) - left, height: Math.max(...ys) - top };
  return Object.values(result).every(Number.isFinite) ? result : null;
}

// web/preview/hwp5-group-polygon-geometry.mjs
function projectHwp5GroupPolygonGeometry(content, component, local) {
  const fail = (error) => ({ state: "unavailable", error });
  if (!component || !local || component.kind_id !== 611348332 || component.second_id !== null || component.component_node !== local.component_node || component.owner_node !== local.owner_node)
    return fail("Hwp5GroupPolygonOwnerMismatch");
  if (content.hwp5PolygonPointErrors?.some((row) => row.section === component.section))
    return fail("IncompleteHwp5GroupPolygonPoints");
  const points = (content.hwp5PolygonPoints ?? []).filter((row) => row.section === component.section && row.component_node === component.component_node);
  if (points.length !== 1)
    return fail("MissingHwp5GroupPolygonPoints");
  if (points[0].layout !== "observed_i32_points")
    return fail("UnsupportedHwp5GroupPolygonLayout");
  const path = hwp5PolygonPathSource(points[0]);
  if (path.state !== "planned")
    return path;
  const { original_width: width, original_height: height } = component, m = local.matrix;
  if (![width, height].every((value) => Number.isSafeInteger(value) && value > 0 && value <= 4294967295) || !Array.isArray(m) || m.length !== 6 || !Array.from(m).every(Number.isFinite))
    return fail("InvalidHwp5GroupPolygonBounds");
  const matrix = [m[0], m[3], m[1], m[4], m[2], m[5]];
  const corners = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height]
  ].map((point) => affinePoint(matrix, point));
  if (corners.some((point) => point === null))
    return fail("InvalidHwp5GroupPolygonBounds");
  return {
    state: "projected",
    source: { ...path.source, rendering_corners: corners, component: structuredClone(component) }
  };
}

// web/preview/hwp5-group-geometry-projection.mjs
var kinds = new Map([
  [610496366, "container"],
  [611476835, "rectangle"],
  [611346787, "picture"],
  [611084654, "line"],
  [611348332, "polygon"]
]);
function projectHwp5GroupGeometry(content) {
  try {
    if ([
      "hwp5DrawingErrors",
      "hwp5DrawingComponentErrors",
      "hwp5DrawingLocalErrors",
      "hwp5DrawingCornerErrors"
    ].some((key) => content[key]?.length))
      throw new Error("IncompleteHwp5GroupGeometry");
    const containers = [], rectangles = [], polygons = [], pictureBindings = [], lineBindings = [];
    for (const section of new Set((content.hwp5DrawingComponents ?? []).map((row) => row.section))) {
      const rows = validateHwp5DrawingComponentSources(content.hwp5DrawingComponents.filter((row) => row.section === section));
      const byNode = new Map(rows.map((row) => [row.component_node, row]));
      const rootFor = (row) => {
        let current = row;
        while (current.second_id === null)
          current = byNode.get(current.owner_node);
        return current;
      };
      for (const row of rows) {
        const root = rootFor(row);
        if (root.kind_id !== 610496366)
          continue;
        const kind = kinds.get(row.kind_id);
        if (!kind)
          throw new Error("UnsupportedHwp5GroupChild");
        const anchors = (content.hwp5Drawings ?? []).filter((item) => item.section === section && item.componentNode === root.component_node);
        if (anchors.length !== 1 || anchors[0].controlNode !== root.owner_node)
          throw new Error("MissingHwp5GroupRootAnchor");
        const anchor = anchors[0];
        const locals = (content.hwp5DrawingLocalTransforms ?? []).filter((item) => item.section === section && item.component_node === row.component_node);
        if (locals.length !== 1 || locals[0].owner_node !== row.owner_node)
          throw new Error("MissingHwp5GroupLocalTransform");
        validateHwp5DrawingLocalTransforms(locals);
        const context = row.second_id !== null ? null : { parent_container: row.owner_node, root_anchor: root.component_node };
        const rendering = {
          matrix: [...locals[0].matrix],
          angle: row.rotation_angle,
          flip: [!!(row.attributes & 1), !!(row.attributes & 2)],
          reverse: null,
          unknown_component_attributes: (row.attributes & ~3) >>> 0
        };
        const binding = {
          section,
          hostParagraph: anchor.hostParagraph,
          anchorUnit: anchor.anchorUnit
        };
        if (kind === "container") {
          const source = row.second_id !== null ? hwp5DrawingGeometry(anchor.source) : {};
          Object.assign(source, {
            container_node: row.component_node,
            group_context: context,
            rendering,
            component: structuredClone(row),
            shape_children: rows.filter((child) => child.owner_node === row.component_node).map((child) => ({
              node: child.component_node,
              kind: kinds.get(child.kind_id) ?? "unsupported"
            }))
          });
          containers.push({ ...binding, containerNode: row.component_node, source });
        } else if (kind === "rectangle") {
          const corners = (content.hwp5DrawingCorners ?? []).filter((item) => item.section === section && item.component_node === row.component_node);
          if (corners.length !== 1 || !corners[0].raw_points)
            throw new Error("MissingHwp5GroupRectangleCorners");
          validateHwp5DrawingRectangleCorners(corners);
          rectangles.push({
            ...binding,
            drawingNode: row.component_node,
            source: {
              group_context: context,
              rendering,
              rendering_corners: corners[0].points.map((point) => [...point]),
              rectangle: { points: corners[0].raw_points.map((point) => [...point]) },
              round_rate: corners[0].round_rate,
              component: structuredClone(row)
            }
          });
        } else if (kind === "polygon") {
          const polygon = projectHwp5GroupPolygonGeometry(content, row, locals[0]);
          if (polygon.state !== "projected")
            throw new Error(polygon.error);
          polygons.push({
            ...binding,
            drawingNode: row.component_node,
            source: { ...polygon.source, group_context: context, rendering }
          });
        } else if (kind === "line")
          lineBindings.push({
            ...binding,
            lineNode: row.component_node,
            parentContainer: row.owner_node,
            rootAnchor: root.component_node,
            component: structuredClone(row)
          });
        else
          pictureBindings.push({
            ...binding,
            pictureNode: row.component_node,
            parentContainer: row.owner_node,
            rootAnchor: root.component_node,
            component: structuredClone(row)
          });
      }
    }
    const declaredRoots = (content.hwp5Drawings ?? []).filter((row) => row.source?.kind_id === 610496366);
    if (declaredRoots.length !== containers.filter((row) => row.source.group_context === null).length)
      throw new Error("IncompleteHwp5GroupRoots");
    return { state: "projected", containers, rectangles, polygons, pictureBindings, lineBindings };
  } catch (error) {
    return { state: "unavailable", error: error.message };
  }
}

// web/preview/hwp5-picture-geometry-owner.mjs
function hwp5PictureGeometryOwner(content, item) {
  const roots = (content.hwp5Drawings ?? []).filter((row) => row.section === item.section && row.componentNode === item.pictureNode);
  if (roots.length === 1) {
    const root = roots[0];
    if (root.source.kind_id !== 611346787 || root.controlNode !== item.source.owner_node)
      throw new Error("Hwp5PictureGeometryOwnerMismatch");
    return {
      root,
      grouped: false,
      anchorNode: item.pictureNode,
      attributes: root.source.component_attributes,
      angle: root.source.rotation_angle
    };
  }
  if (roots.length)
    throw new Error("AmbiguousHwp5PictureGeometryOwner");
  const groups = projectHwp5GroupGeometry(content);
  if (groups.state !== "projected")
    throw new Error(groups.error);
  const bindings = groups.pictureBindings.filter((row) => row.section === item.section && row.pictureNode === item.pictureNode);
  if (bindings.length !== 1)
    throw new Error("MissingHwp5GroupedPictureBinding");
  const binding = bindings[0];
  if (binding.parentContainer !== item.source.owner_node)
    throw new Error("Hwp5PictureGeometryOwnerMismatch");
  if (binding.parentContainer !== binding.rootAnchor)
    throw new Error("UnsupportedNestedHwp5Picture");
  const anchors = content.hwp5Drawings.filter((row) => row.section === item.section && row.componentNode === binding.rootAnchor);
  if (anchors.length !== 1)
    throw new Error("MissingHwp5GroupRootAnchor");
  return {
    root: anchors[0],
    grouped: true,
    anchorNode: binding.rootAnchor,
    attributes: binding.component.attributes,
    angle: binding.component.rotation_angle
  };
}

// web/preview/hwp5-picture-resize-geometry.mjs
function hwp5PictureResizeGeometry(corners, rootGeometry) {
  if (rootGeometry?.width_relative !== 4 || rootGeometry?.height_relative !== 2)
    return null;
  if (!Array.isArray(corners) || corners.length !== 4 || corners.some((point) => !Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)))
    return null;
  const x = corners[1].map((value, i) => value - corners[0][i]);
  const y = corners[3].map((value, i) => value - corners[0][i]);
  const determinant = x[0] * y[1] - x[1] * y[0];
  if (!Number.isFinite(determinant) || determinant === 0)
    return null;
  const [width, height] = [x, y].map((axis) => Math.round(Math.hypot(...axis)));
  if (![width, height].every((value) => Number.isInteger(value) && value > 0 && value <= 4294967295))
    return null;
  return { width, height, widthRelative: 4, heightRelative: 2 };
}

// web/preview/hwp5-picture-border-plan.mjs
function hwp5PictureBorderPlan(picture) {
  const source = picture?.source;
  if (!source || source.border_width === undefined)
    return { state: "none" };
  if (source.border_width === 0 && source.border_attributes === 0)
    return { state: "none" };
  const raw = source.border_attributes;
  if (Number.isInteger(raw) && raw >= 0 && raw <= 4294967295 && (raw & 63) === 0 && (raw >>> 6 & 15) <= 1 && (raw >>> 10 & 4095) === 0 && (raw >>> 22 & 15) <= 8 && (raw >>> 26 & 15) <= 8 && Number.isInteger(source.border_width) && source.border_width >= 0 && source.border_width <= 2147483647)
    return { state: "none" };
  const fail = () => ({ state: "unavailable", error: "UnsupportedHwp5PictureBorder" });
  const attributes = source.border_attributes;
  if (!Number.isInteger(attributes) || attributes < 0 || attributes > 4294967295 || (attributes & 63) !== 1 || (attributes >>> 6 & 15) > 1 || (attributes >>> 10 & 4095) !== 0 || (attributes >>> 22 & 15) > 8 || (attributes >>> 26 & 15) > 8 || !Number.isInteger(source.border_width) || source.border_width <= 0 || !Number.isInteger(source.border_color) || source.border_color < 0 || source.border_color > 16777215 || picture.tailSource?.border_opacity !== 0)
    return fail();
  const points = source.points;
  if (!Array.isArray(points) || points.length !== 4 || !points.every((point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)))
    return fail();
  const [[x, y], [right, top], [farRight, bottom], [left, farBottom]] = points;
  if (x !== 0 || y !== 0 || top !== 0 || left !== 0 || right <= 0 || bottom <= 0 || farRight !== right || farBottom !== bottom)
    return fail();
  return {
    state: "solid",
    color: colorrefCss(source.border_color),
    width: source.border_width,
    rectangleWidth: right,
    rectangleHeight: bottom
  };
}

// web/preview/picture-shadow-bounds.mjs
function pictureShadowBounds(plan, borderWidth = 0) {
  if (plan?.state !== "outer" || ![plan.width, plan.height, plan.blur, plan.offsetX, plan.offsetY, borderWidth].every(Number.isFinite) || plan.width <= 0 || plan.height <= 0 || plan.blur < 0 || borderWidth < 0)
    return null;
  const spread = 2 * plan.blur + borderWidth / 2;
  const left = Math.ceil(Math.max(borderWidth / 2, spread - plan.offsetX));
  const right = Math.ceil(Math.max(borderWidth / 2, spread + plan.offsetX));
  const top = Math.ceil(Math.max(borderWidth / 2, spread - plan.offsetY));
  const bottom = Math.ceil(Math.max(borderWidth / 2, spread + plan.offsetY));
  const width = plan.width + left + right, height = plan.height + top + bottom;
  return [left, right, top, bottom, width, height].every(Number.isFinite) ? { left, right, top, bottom, width, height } : null;
}

// web/preview/picture-shadow-raster-budget.mjs
function pictureShadowRasterSize(bounds, scale) {
  if (!bounds || ![bounds.width, bounds.height, scale].every(Number.isFinite) || bounds.width <= 0 || bounds.height <= 0 || !Number.isSafeInteger(scale) || scale < 1 || scale > 16)
    return null;
  const width = Math.ceil(bounds.width * scale), height = Math.ceil(bounds.height * scale);
  if (width > 8192 || height > 8192 || width * height * 8 > 64 * 1024 * 1024)
    return null;
  return { width, height };
}

// web/preview/hwp5-picture-shadow-plan.mjs
function hwp5PictureShadowPlan(picture) {
  const tail = picture?.tailSource;
  if (!tail || tail.effects_flags === 0)
    return { state: "none" };
  const fail = () => ({ state: "unavailable", error: "UnsupportedHwp5PictureShadow" });
  if (tail.effects_flags !== 1 || !tail.shadow)
    return fail();
  try {
    validateHwp5PictureShadowSource(tail.shadow, tail.effects_flags);
  } catch {
    return fail();
  }
  const shadow = tail.shadow, p = shadow.properties;
  const bits = new DataView(new ArrayBuffer(4));
  const float = (value) => {
    bits.setUint32(0, value, true);
    return bits.getFloat32(0, true);
  };
  const alpha = float(p.transparency_bits), blur = float(p.blur_bits), direction = float(p.direction_bits), distance = float(p.distance_bits);
  if (p.style !== 0 || p.alignment !== 0 || p.rotate_with_shape !== 0 || float(p.skew_x_bits) !== 0 || float(p.skew_y_bits) !== 0 || float(p.scale_x_bits) !== 1 || float(p.scale_y_bits) !== 1 || shadow.color_type !== 0 || shadow.color_effect_count !== 0 || shadow.color_value > 16777215 || ![alpha, blur, direction, distance].every(Number.isFinite) || alpha < 0 || alpha > 1 || blur < 0 || distance < 0 || direction < 0 || direction > 360 || picture.transform?.angle !== 0 || !Array.isArray(picture.transform?.flip) || picture.transform.flip.length !== 2 || !Array.from(picture.transform.flip).every((value) => value === false))
    return fail();
  const points = picture.source?.points;
  if (!Array.isArray(points) || points.length !== 4 || !Array.from(points).every((point) => Array.isArray(point) && point.length === 2 && Array.from(point).every(Number.isFinite)))
    return fail();
  const [[x, y], [right, top], [farRight, bottom], [left, farBottom]] = points;
  if (x !== 0 || y !== 0 || top !== 0 || left !== 0 || right <= 0 || bottom <= 0 || farRight !== right || farBottom !== bottom)
    return fail();
  const corners = picture.renderingCorners;
  if (corners !== undefined && (!Array.isArray(corners) || corners.length !== 4 || !Array.from(corners).every((point) => Array.isArray(point) && point.length === 2 && Array.from(point).every(Number.isFinite)) || corners[0][1] !== corners[1][1] || corners[1][0] !== corners[2][0] || corners[2][1] !== corners[3][1] || corners[3][0] !== corners[0][0] || corners[1][0] <= corners[0][0] || corners[3][1] <= corners[0][1]))
    return fail();
  const radians = direction * Math.PI / 180;
  const plan = {
    state: "outer",
    opacity: 1 - alpha,
    blur: blur / 75,
    offsetX: Math.cos(radians) * distance / 75,
    offsetY: Math.sin(radians) * distance / 75,
    color: shadow.color_value,
    width: right / 75,
    height: bottom / 75,
    rasterParity: "unverified"
  };
  if (!pictureShadowRasterSize(pictureShadowBounds(plan, Math.max(0, (picture.source.border_width ?? 0) / 75)), 1))
    return fail();
  return plan;
}

// web/preview/hwp5-picture-absent-tail-profile.mjs
var profiles = Object.freeze([
  Object.freeze({
    version: 83886343,
    baseExtra: 0,
    prefix: "base73",
    layout: "absent_base73",
    opacity: false,
    instance: false
  }),
  Object.freeze({
    version: 83886596,
    baseExtra: 1,
    prefix: "with_opacity74",
    layout: "absent_opacity74",
    opacity: true,
    instance: false
  }),
  Object.freeze({
    version: 83886596,
    baseExtra: 5,
    prefix: "with_instance78",
    layout: "absent_instance78",
    opacity: true,
    instance: true
  })
]);
var uint2 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
function selectedSourceMatches(profile, source) {
  return source?.extra_bytes === 0 && (profile.opacity ? uint2(source.border_opacity) && source.border_opacity <= 255 : source.border_opacity === null) && (profile.instance ? uint2(source.instance_id) : source.instance_id === null);
}
function hwp5PictureAbsentVersion(version) {
  return profiles.some((profile) => profile.version === version);
}
function hwp5PictureAbsentProfile(version, source) {
  return profiles.find((profile) => profile.version === version && (selectedSourceMatches(profile, source) || source?.border_opacity === null && source.instance_id === null && source.extra_bytes === profile.baseExtra)) ?? null;
}
function hwp5PictureAbsentSourceMatches(proof, source) {
  const profile = profiles.find((profile) => profile.version === proof?.fileVersion && profile.layout === proof.layout);
  return Boolean(profile && selectedSourceMatches(profile, source));
}
var baseFields = [
  "component_node",
  "owner_node",
  "picture_node",
  "border_color",
  "border_width",
  "border_attributes",
  "points",
  "crop",
  "margins",
  "contrast",
  "brightness",
  "effect",
  "bin_data_id"
];
function hwp5PictureBaseMatches(base, selected) {
  return baseFields.every((field) => JSON.stringify(base[field]) === JSON.stringify(selected[field]));
}

// web/preview/hwp5-picture-tail-profile.mjs
function hwp5PictureTailLayout(version) {
  return version === 83951617 || version === 83951872 ? "with_alpha9" : version === 83887360 || version === 83886852 ? "dimensions8" : version === 83886848 ? "effects_only" : null;
}
function hwp5PictureTailAlphaSupported(tail) {
  if (tail?.image_alpha === 0)
    return true;
  const layout = hwp5PictureTailLayout(tail?.fileVersion);
  if (layout === null || tail.layout !== layout)
    return false;
  return ["dimensions8", "effects_only"].includes(layout) && tail.image_alpha === null;
}

// web/preview/hwp5-picture-geometry.mjs
function projectHwp5PictureGeometry(content) {
  const fail = (error) => ({ state: "unavailable", error });
  try {
    if (content.hwp5PictureErrors?.length || content.hwp5DrawingErrors?.length || content.hwp5DrawingLocalErrors?.length)
      throw new Error("IncompleteHwp5PictureGeometry");
    const pictures = [], seen = new Set;
    for (const item of content.hwp5Pictures ?? []) {
      const raw = item.source;
      validateHwp5PictureSources([raw]);
      if (raw.component_node !== item.pictureNode || raw.picture_node !== item.recordNode)
        throw new Error("Hwp5PictureIdentityMismatch");
      const key = `${item.section}:${item.pictureNode}`;
      if (seen.has(key))
        throw new Error("AmbiguousHwp5PictureGeometry");
      seen.add(key);
      const owner = hwp5PictureGeometryOwner(content, item), root = owner.root;
      const locals = (content.hwp5DrawingLocalTransforms ?? []).filter((row) => row.section === item.section && row.component_node === item.pictureNode);
      if (locals.length !== 1)
        throw new Error("MissingHwp5PictureTransform");
      validateHwp5DrawingLocalTransforms(locals);
      if (locals[0].owner_node !== raw.owner_node)
        throw new Error("Hwp5PictureTransformOwnerMismatch");
      const source = hwp5DrawingGeometry(root.source), g = source.geometry, m = locals[0].matrix;
      const tails = (content.hwp5PictureTails ?? []).filter((row) => row.section === item.section && row.component_node === item.pictureNode);
      if (tails.length > 1)
        throw new Error("AmbiguousHwp5PictureTail");
      const tail = tails[0] ?? null;
      const absentRows = (content.hwp5PictureAbsentTails ?? []).filter((row) => row.section === item.section && row.component_node === item.pictureNode);
      if (absentRows.length > 1 || tail && absentRows.length)
        throw new Error("AmbiguousHwp5PictureTail");
      const absent = absentRows[0] ?? null;
      if (absent && (!hwp5PictureAbsentSourceMatches(absent, raw) || absent.picture_node !== item.recordNode || absent.owner_node !== raw.owner_node))
        throw new Error("InvalidHwp5PictureAbsentTail");
      if (tail) {
        validateHwp5PictureTailSources([tail]);
        if (tail.picture_node !== item.recordNode || tail.owner_node !== raw.owner_node)
          throw new Error("Hwp5PictureTailOwnerMismatch");
      }
      const zeroSizePolicy = tail?.fileVersion === 83951617 && tail.image_width === 0 && tail.image_height === 0 && owner.attributes === 536870912;
      const canvasMatrix = [m[0], m[3], m[1], m[4], m[2], m[5]];
      const corners = raw.points.map((point) => affinePoint(canvasMatrix, point));
      if (corners.some((point) => point === null))
        throw new Error("InvalidHwp5PictureTransform");
      const flip = [!!(owner.attributes & 1), !!(owner.attributes & 2)];
      const identity = owner.angle === 0 && flip.every((value) => value === false) && m.every((value, index) => value === [1, 0, 0, 0, 1, 0][index]);
      const borderPlan = hwp5PictureBorderPlan({ source: raw, tailSource: tail });
      const shadowPlan = hwp5PictureShadowPlan({
        source: raw,
        tailSource: tail,
        transform: { angle: owner.angle, flip },
        renderingCorners: corners
      });
      pictures.push({
        section: item.section,
        pictureNode: item.pictureNode,
        recordNode: item.recordNode,
        resizeRecordNode: item.recordNode,
        resizeGeometry: owner.grouped ? hwp5PictureResizeGeometry(corners, g) : null,
        sizeProtected: source.size_protected,
        state: "located",
        paragraph: root.hostParagraph,
        anchorUnit: root.anchorUnit,
        owner: {
          anchorNode: owner.anchorNode,
          paragraph: root.hostParagraph,
          anchorUnit: root.anchorUnit
        },
        geometry: owner.grouped ? null : {
          width: g.width,
          height: g.height,
          widthRelative: g.width_relative,
          heightRelative: g.height_relative,
          treatAsCharacter: g.treat_as_character,
          horizontalOffset: g.horizontal_offset,
          verticalOffset: g.vertical_offset
        },
        position: source.position,
        flow: {
          textWrap: source.text_wrap,
          textFlow: source.text_flow,
          zOrder: source.z_order,
          outsideMargins: [...source.out_margin]
        },
        crop: {
          clip: [raw.crop[0], raw.crop[2], raw.crop[1], raw.crop[3]],
          imageDimensions: [tail?.image_width ?? null, tail?.image_height ?? null],
          zeroSizeUnitsPerPixel: zeroSizePolicy ? 75 : null
        },
        transform: {
          identity,
          angle: owner.angle,
          flip,
          reverse: null,
          reverseApplicable: false,
          unknownMatrixNodes: 0,
          unknownComponentAttributes: (owner.attributes & ~3) >>> 0
        },
        renderingCorners: corners,
        paintError: raw.contrast !== 0 || raw.brightness !== 0 || raw.effect !== 0 ? "UnsupportedHwp5PictureAdjustment" : absent && (raw.border_width !== 0 || raw.border_attributes !== 0) ? "UnsupportedHwp5PictureBorder" : !tail && !absent || content.hwp5PictureTailErrors?.some((row) => row.section === item.section) ? "UnselectedHwp5PictureTail" : tail && (shadowPlan.state === "unavailable" || !hwp5PictureTailAlphaSupported(tail) || tail.border_opacity !== 0 && borderPlan.state !== "none" || tail.extra_bytes !== 0) ? "UnsupportedHwp5PictureTail" : borderPlan.state === "unavailable" ? borderPlan.error : tail && !zeroSizePolicy && (tail.image_width === 0 || tail.image_height === 0) ? "UnsupportedHwp5ZeroImageDimensions" : null,
        unselectedPictureTail: tail ? tail.extra_bytes : raw.extra_bytes,
        source: structuredClone(raw),
        tailSource: tail ? structuredClone(tail) : null,
        tailPolicy: absent ? `observed-${absent.layout.replaceAll("_", "-")}` : "selected-tail"
      });
    }
    return { state: "projected", pictures };
  } catch (error) {
    return fail(error.message);
  }
}

// web/preview/hwp5-picture-caption-bindings.mjs
function bindHwp5RootPictureCaptions(content, pictures, bindings) {
  const fail = (error) => ({ state: "unavailable", error });
  const projected = new Map;
  for (const root of (content.hwp5Drawings ?? []).filter((row) => row.source.kind_id === 611346787)) {
    const matches = pictures.filter((row) => row.section === root.section && row.pictureNode === root.componentNode);
    const owned = bindings.filter((row) => row.section === root.section && row.drawingNode === root.componentNode);
    const captions = owned.filter((row) => row.kind === "caption"), key = `${root.section}:${root.componentNode}`;
    if (matches.length !== 1 || owned.some((row) => row.kind !== "caption") || captions.length > 1 || projected.has(key))
      return fail("AmbiguousHwp5MixedPictureOwnership");
    if (hwp5ObjectFlags(root.source.flags).has_caption !== (captions.length === 1))
      return fail("Hwp5MixedPictureCaptionMismatch");
    projected.set(key, { ...matches[0], caption: captions[0]?.caption ?? null });
  }
  return {
    state: "projected",
    rootCount: projected.size,
    pictures: pictures.map((row) => projected.get(`${row.section}:${row.pictureNode}`) ?? row)
  };
}

// web/preview/hwp5-group-caption-bindings.mjs
function bindHwp5RootGroupCaptions(content, containers, bindings) {
  const fail = (error) => ({ state: "unavailable", error });
  if (!Array.isArray(containers) || !Array.isArray(bindings))
    return fail("InvalidHwp5GroupCaptionInputs");
  try {
    const projected = new Map, lists = new Set;
    const roots = (content.hwp5Drawings ?? []).filter((root) => root.source.kind_id === 610496366);
    for (const root of roots) {
      const key = `${root.section}:${root.componentNode}`;
      const matches = containers.filter((row) => row.section === root.section && row.containerNode === root.componentNode && row.source.group_context === null);
      const owned = bindings.filter((row) => row.section === root.section && (row.drawingNode === root.componentNode || row.kind === "caption" && row.controlNode === root.controlNode));
      if (projected.has(key) || matches.length !== 1 || owned.length > 1 || owned.some((row) => row.kind !== "caption" || row.drawingNode !== root.componentNode || row.controlNode !== root.controlNode) || matches[0].source.component?.owner_node !== root.controlNode)
        return fail("AmbiguousHwp5GroupCaptionOwnership");
      const present = owned.length === 1;
      if (hwp5ObjectFlags(root.source.flags).has_caption !== present || matches[0].source.has_caption !== present)
        return fail("Hwp5GroupCaptionPresenceMismatch");
      let caption = null;
      if (present) {
        const binding = owned[0], listKey = `${root.section}:${binding.listNode}`;
        const bodies = (content.hwp5DrawingBodies ?? []).filter((body) => body.section === root.section && body.listNode === binding.listNode);
        if (lists.has(listKey) || bodies.length !== 1 || bodies[0].kind !== "caption" || bodies[0].controlNode !== root.controlNode || bodies[0].source.control_node !== root.controlNode || bodies[0].source.list_node !== binding.listNode)
          return fail("Hwp5GroupCaptionSourceMismatch");
        const body = bodies[0];
        caption = hwp5CaptionGeometry({
          ...body.source.caption,
          attributes: body.source.attributes,
          list_node: body.listNode
        });
        if (!binding.caption || Object.keys(caption).some((key) => caption[key] !== binding.caption[key]))
          return fail("Hwp5GroupCaptionSourceMismatch");
        lists.add(listKey);
      }
      projected.set(key, { ...matches[0], source: { ...matches[0].source, caption } });
    }
    if (containers.filter((row) => row.source.group_context === null).length !== projected.size)
      return fail("MissingHwp5GroupCaptionRoot");
    return {
      state: "projected",
      rootCount: projected.size,
      captionCount: lists.size,
      containers: containers.map((row) => row.source.group_context === null ? projected.get(`${row.section}:${row.containerNode}`) : row)
    };
  } catch (error) {
    return fail(error.message);
  }
}

// web/preview/hwp5-group-content-projection.mjs
function projectHwp5GroupContent(content) {
  if ((content.hwp5Drawings ?? []).some((row) => row.source.kind_id !== 610496366))
    return { state: "unavailable", error: "UnsupportedMixedHwp5GroupRoots" };
  return assembleHwp5GroupContent(content);
}
function assembleHwp5GroupContent(content) {
  const fail = (error) => ({ state: "unavailable", error });
  const geometry = projectHwp5GroupGeometry(content);
  if (geometry.state !== "projected")
    return geometry;
  for (const binding of geometry.lineBindings) {
    const lines = (content.lines ?? []).filter((row) => row.section === binding.section && row.anchorNode === binding.lineNode && row.groupContext?.rootAnchor === binding.rootAnchor && row.groupContext?.parentContainer === binding.parentContainer);
    if (lines.length !== 1 || content.lineErrors?.some((row) => row.section === binding.section))
      return fail("IncompleteHwp5GroupedLineSources");
  }
  const text = projectHwp5DrawingText(content);
  if (text.state !== "projected")
    return text;
  const rectangleRoots = (content.hwp5Drawings ?? []).filter((row) => row.source.kind_id === 611476835);
  let rootDrawings = [];
  if (rectangleRoots.length) {
    const rootGeometry = projectHwp5RectangleGeometry({ ...content, hwp5Drawings: rectangleRoots });
    if (rootGeometry.state !== "projected")
      return rootGeometry;
    const rootContent = assembleHwp5RectangleContent(content, rootGeometry, text);
    if (rootContent.state !== "projected")
      return rootContent;
    rootDrawings = rootContent.content.drawings;
  }
  const captionedGroups = bindHwp5RootGroupCaptions(content, geometry.containers, text.bindings);
  if (captionedGroups.state !== "projected")
    return captionedGroups;
  const pictureRoots = new Set((content.hwp5Drawings ?? []).filter((row) => row.source.kind_id === 611346787).map((row) => `${row.section}:${row.componentNode}`));
  const groupRoots = new Set(captionedGroups.containers.filter((row) => row.source.group_context === null).map((row) => `${row.section}:${row.containerNode}`));
  const rectangleKeys = new Set(rootDrawings.map((row) => `${row.section}:${row.drawingNode}`));
  if (text.bindings.some((row) => row.kind === "caption" && !pictureRoots.has(`${row.section}:${row.drawingNode}`) && !groupRoots.has(`${row.section}:${row.drawingNode}`) && !rectangleKeys.has(`${row.section}:${row.drawingNode}`)))
    return fail("UnsupportedHwp5GroupCaption");
  if (content.hwp5DrawingStyleErrors?.length)
    return fail("IncompleteHwp5GroupPaintSources");
  const pictures = projectHwp5PictureGeometry(content);
  if (pictures.state !== "projected")
    return pictures;
  if (pictures.pictures.some((row) => row.paintError))
    return fail("UnsupportedHwp5GroupPicturePaint");
  const captionedPictures = bindHwp5RootPictureCaptions(content, pictures.pictures, text.bindings);
  if (captionedPictures.state !== "projected")
    return captionedPictures;
  const rectangles = [...rootDrawings], polygons = [], drawings = [...rootDrawings];
  for (const shape of [...geometry.rectangles, ...geometry.polygons]) {
    const styles = (content.hwp5DrawingStyles ?? []).filter((row) => row.section === shape.section && row.component_node === shape.drawingNode && row.owner_node === shape.source.component.owner_node);
    if (styles.length !== 1)
      return fail("MissingHwp5GroupPaintSource");
    const paint = hwp5DrawingPaintPlan(styles[0]);
    if (paint.state !== "planned")
      return paint;
    const bindings = text.bindings.filter((row) => row.section === shape.section && row.drawingNode === shape.drawingNode);
    if (bindings.length > 1)
      return fail("AmbiguousHwp5GroupText");
    const polygon = shape.source.rendering_polygon !== undefined;
    if (polygon && bindings.length)
      return fail("UnsupportedHwp5GroupPolygonText");
    if (shape.source.rendering_polygon?.length === 2 && paint.fill.state !== "none")
      return fail("UnsupportedHwp5PolylineFill");
    const source = {
      ...shape.source,
      text: bindings[0]?.text ?? null,
      caption: null,
      stroke: paint.stroke,
      paint: { shadow_type: paint.shadowType }
    };
    const current = {
      ...shape,
      source,
      hwp5Style: structuredClone(styles[0]),
      fillPlan: paint.fill
    };
    (polygon ? polygons : rectangles).push(current);
    if (bindings.length)
      drawings.push(current);
  }
  if (text.bindings.some((binding) => !drawings.some((row) => row.section === binding.section && row.drawingNode === binding.drawingNode) && !captionedPictures.pictures.some((row) => binding.kind === "caption" && row.section === binding.section && row.pictureNode === binding.drawingNode && row.caption?.caption_node === binding.caption?.caption_node) && !captionedGroups.containers.some((row) => binding.kind === "caption" && row.section === binding.section && row.containerNode === binding.drawingNode && row.source.caption?.caption_node === binding.caption?.caption_node)))
    return fail("MissingHwp5GroupTextGeometry");
  return {
    state: "projected",
    content: {
      ...content,
      paragraphs: text.paragraphs,
      containers: captionedGroups.containers,
      rectangles,
      polygons,
      drawings,
      pictures: captionedPictures.pictures
    }
  };
}

// web/preview/hwp5-mixed-root-content-projection.mjs
function projectHwp5MixedRootContent(content) {
  const fail = (error) => ({ state: "unavailable", error });
  const roots = content.hwp5Drawings ?? [];
  if (!roots.length || roots.some((row) => ![611476835, 611346787].includes(row.source?.kind_id)))
    return fail("UnsupportedHwp5MixedRootKind");
  const text = projectHwp5DrawingText(content);
  if (text.state !== "projected")
    return text;
  const geometry = projectHwp5RectangleGeometry({
    ...content,
    hwp5Drawings: roots.filter((row) => row.source.kind_id === 611476835)
  });
  if (geometry.state !== "projected")
    return geometry;
  const pictures = projectHwp5PictureGeometry(content);
  if (pictures.state !== "projected")
    return pictures;
  const projected = bindHwp5RootPictureCaptions(content, pictures.pictures, text.bindings);
  if (projected.state !== "projected")
    return projected;
  if (projected.rootCount !== pictures.pictures.length)
    return fail("UnsupportedHwp5MixedPictureChildren");
  const rectangles = assembleHwp5RectangleContent(content, geometry, text);
  if (rectangles.state !== "projected")
    return rectangles;
  return { state: "projected", content: { ...rectangles.content, pictures: projected.pictures } };
}

// web/preview/hwp5-grouped-mixed-content.mjs
function projectHwp5GroupedMixedContent(content) {
  const fail = (error) => ({ state: "unavailable", error });
  try {
    const roots = content.hwp5Drawings ?? [];
    if (!roots.some((row) => row.source?.kind_id === 610496366) || roots.some((row) => ![610496366, 611476835, 611346787, 611348332].includes(row.source?.kind_id)))
      return fail("UnsupportedHwp5GroupedMixedRoots");
    if (["hwp5PolygonPointErrors", "hwp5DrawingStyleErrors"].some((key) => content[key]?.length))
      return fail("IncompleteHwp5GroupedPolygonSources");
    const groups = assembleHwp5GroupContent(content);
    if (groups.state !== "projected")
      return groups;
    const polygons = [...groups.content.polygons ?? []];
    for (const root of roots.filter((row) => row.source.kind_id === 611348332)) {
      const rows = (content.hwp5PolygonPoints ?? []).filter((row) => row.section === root.section && row.component_node === root.componentNode);
      const locals = (content.hwp5DrawingLocalTransforms ?? []).filter((row) => row.section === root.section && row.component_node === root.componentNode);
      const styles = (content.hwp5DrawingStyles ?? []).filter((row) => row.section === root.section && row.component_node === root.componentNode && row.owner_node === root.controlNode);
      if (rows.length !== 1 || locals.length !== 1 || locals[0].owner_node !== root.controlNode || styles.length !== 1)
        return fail("MissingHwp5GroupedPolygonSource");
      const path = hwp5PolygonPathSource(rows[0]);
      if (path.state !== "planned")
        return path;
      if (root.source.rotation_angle !== 0 || root.source.component_attributes !== 0 || !Array.isArray(locals[0].matrix) || locals[0].matrix.length !== 6 || !Array.from(locals[0].matrix).every((value, i) => value === [1, 0, 0, 0, 1, 0][i]))
        return fail("UnsupportedHwp5GroupedPolygonTransform");
      const source = hwp5DrawingGeometry(root.source), { width, height } = source.geometry;
      if (source.has_caption || ![2, 3].includes(source.text_wrap) || rows[0].points.some(([x, y]) => x < 0 || y < 0 || x > width || y > height))
        return fail("UnsupportedHwp5GroupedPolygonFlow");
      const paint = hwp5DrawingPaintPlan(styles[0]);
      if (paint.state !== "planned")
        return paint;
      if (path.source.rendering_polygon.length === 2 && paint.fill.state !== "none")
        return fail("UnsupportedHwp5PolylineFill");
      Object.assign(source, path.source, {
        group_context: null,
        text: null,
        caption: null,
        rendering: {
          matrix: [...locals[0].matrix],
          angle: 0,
          flip: [false, false],
          reverse: null,
          unknown_component_attributes: 0
        },
        rendering_corners: [
          [0, 0],
          [width, 0],
          [width, height],
          [0, height]
        ],
        stroke: paint.stroke,
        paint: { shadow_type: paint.shadowType }
      });
      polygons.push({
        section: root.section,
        drawingNode: root.componentNode,
        controlNode: root.controlNode,
        hostParagraph: root.hostParagraph,
        anchorUnit: root.anchorUnit,
        source,
        hwp5Style: structuredClone(styles[0])
      });
    }
    return { state: "projected", content: { ...groups.content, polygons } };
  } catch (error) {
    return fail(error.message);
  }
}

// web/preview/hwp5-root-content-projection.mjs
function projectHwp5RootContent(content) {
  const roots = content.hwp5Drawings ?? [];
  if (!roots.length)
    return content.currentParagraphFlows?.some((row) => row.host === "drawing") ? { state: "unavailable", error: "IncompleteHwp5RootSources" } : { state: "projected", content };
  const lines = roots.filter((row) => row.source?.kind_id === 611084654);
  const nonLines = roots.filter((row) => row.source?.kind_id !== 611084654);
  if (lines.length && nonLines.length && roots.every((row) => [611084654, 610496366, 611476835, 611346787, 611348332].includes(row.source?.kind_id))) {
    if ((content.hwp5DrawingBodies ?? []).some((body) => lines.some((line) => line.section === body.section && line.controlNode === body.controlNode)))
      return { state: "unavailable", error: "UnsupportedHwp5LineTextRoot" };
    const projected = projectHwp5RootContent({ ...content, hwp5Drawings: nonLines });
    return projected.state === "projected" ? { ...projected, content: { ...projected.content, hwp5Drawings: roots } } : projected;
  }
  if (roots.some((row) => row.source?.kind_id === 610496366) && roots.some((row) => [611476835, 611346787, 611348332].includes(row.source?.kind_id)) && roots.every((row) => [610496366, 611476835, 611346787, 611348332].includes(row.source?.kind_id)))
    return projectHwp5GroupedMixedContent(content);
  if (roots.every((row) => row.source?.kind_id === 611476835))
    return projectHwp5RectangleContent(content);
  if (roots.every((row) => row.source?.kind_id === 610496366))
    return projectHwp5GroupContent(content);
  if (roots.every((row) => [611476835, 611346787].includes(row.source?.kind_id)))
    return projectHwp5MixedRootContent(content);
  return {
    state: content.currentParagraphFlows?.some((row) => row.host === "drawing") ? "unavailable" : "unhandled",
    error: "UnsupportedHwp5RectangleRoot"
  };
}

// web/preview/hwp5-window-selection.mjs
function validateHwp5WindowSelection(content) {
  const window = content.window, uint = (value) => Number.isSafeInteger(value) && value >= 0;
  if (!window || !Array.isArray(content.paragraphs) || ![
    content.totalParagraphs,
    window.requestedOffset,
    window.requestedCount,
    window.contextCount
  ].every(uint) || window.requestedOffset > content.totalParagraphs || window.requestedCount > content.totalParagraphs - window.requestedOffset || window.paragraphOffset !== window.requestedOffset || window.paragraphCount !== window.requestedCount || content.paragraphs.length !== window.requestedCount + window.contextCount)
    throw new Error("InvalidHwp5WindowSelection");
  const identities = new Set;
  let previous = -1, selected = 0;
  for (const row of content.paragraphs) {
    if (!row || ![row.section, row.paragraph, row.windowOrdinal].every(uint) || row.windowOrdinal >= content.totalParagraphs || row.windowOrdinal <= previous || row.clipped || typeof row.text !== "string")
      throw new Error("InvalidHwp5WindowSelection");
    previous = row.windowOrdinal;
    const key = `${row.section}:${row.paragraph}`;
    if (identities.has(key))
      throw new Error("InvalidHwp5WindowSelection");
    identities.add(key);
    const context = row.windowOrdinal < window.requestedOffset || row.windowOrdinal >= window.requestedOffset + window.requestedCount;
    if (row.windowContext !== context || context && (row.editable !== false || row.selectable !== false) || content.readOnly && row.editable !== false)
      throw new Error("InvalidHwp5WindowSelection");
    if (!context) {
      if (row.windowOrdinal !== window.requestedOffset + selected)
        throw new Error("InvalidHwp5WindowSelection");
      selected++;
    }
  }
  if (selected !== window.requestedCount)
    throw new Error("InvalidHwp5WindowSelection");
  return {
    offset: window.requestedOffset,
    count: selected,
    contextCount: window.contextCount,
    completeDocument: content.paragraphs.length === content.totalParagraphs
  };
}

export { sourceTableColumns, sourceTableRowHorizontals, equationFont, configureEquationText, hwpUnitPixels, attachEquationRendering, equationPaintAt, xmlSigned32, xmlUnsigned32, hwp5ObjectFlags, hwp5TableFlags, hasObservedZeroTableObjectTail, hwp5TableUnsupportedObjectFlags, hwp5TableGeometry, hwp5TablePagination, roundedMulDiv, paragraphSpacing, paragraphMarginPixels, paragraphSpacePixels, paragraphLineAdvance, paragraphLineGeometry, paragraphReferenceGeometry, tableInsets, tableCellInsets, sourceTableCellInsets, resolveTablePadding, hwp5DrawingPaintTail, hasObservedDrawingObjectExtension, withObservedDrawingObjectExtensions, hwp5DrawingGeometry, attachHwp5DrawingGeometry, strokeDashPattern, colorrefCss, hwp5StrokeDisplay, tableGeometryFailureEvidence, mixedInlineTablePolicy, selectNoteSourceTables, drawingColumnContext, selectDrawingNoteReferenceOwners, bindSourceNoteBodies, attachHwp5PageAreas, hwp5PageArea, normalizedNotePagePolicy, attachHwp5CaptionGeometry, structuralAnchorUnits, isStructuralAnchor, hwp5MasterPageProfiles, hwp5SectionDisplayFlags, attachHwp5DocumentProperties, hwp5EffectivePageNumberSource, hwp5EffectiveSectionPageNumberSource, hwp5NumberFormat, formatNumber, automaticNumberSource, automaticNumberText, storedAutomaticNumberText, gradientStepStops, hwp5DrawingPaintPlan, hwpRenderingMatrix, affinePoint, inverseAffine, affineBox, projectHwp5GroupGeometry, hwp5PictureBorderPlan, pictureShadowBounds, pictureShadowRasterSize, hwp5PictureShadowPlan, hwp5PictureAbsentVersion, hwp5PictureAbsentProfile, hwp5PictureAbsentSourceMatches, hwp5PictureBaseMatches, hwp5PictureTailLayout, projectHwp5PictureGeometry, projectHwp5RootContent, validateHwp5WindowSelection };
