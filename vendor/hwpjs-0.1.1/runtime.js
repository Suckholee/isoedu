import {
  allowsOwnerWindowProjection,
  canonicalRuntimeDescriptors,
  nativeOrigin,
  sameRequestContext,
  bindNativeRuntimeOrigin,
  bindRuntimeAdmission,
  availableSectionExports,
  sectionInventory,
  checkedSectionInventory,
  availableSectionCopyCapability,
  availableSectionCopyRequest
} from "./chunk-c8kv1wt8.js";
import {
  validateCellBorderMessage,
  validateCellBordersMessage,
  validateCellStylesMessage,
  validateAbi,
  validateCellBackgroundMessage,
  validateCellAppearanceMessage,
  createMemory,
  inputBytes
} from "./chunk-d6j1r7hv.js";
import"./chunk-6ffsr0y9.js";
import {
  validateHwp5FieldSpans,
  validateHwp5FieldTopology,
  validateHwp5TextSourceProtection,
  decodeHwp5Text,
  createExperimentalHwp5Editor2
} from "./chunk-vk1f4vr4.js";
import {
  retainedTextView,
  sourceDisplayPosition
} from "./chunk-jk4tbr51.js";
import {
  createHwpxEditor2
} from "./chunk-knp5zb8y.js";
import {
  sourceTableColumns,
  sourceTableRowHorizontals,
  attachEquationRendering,
  sourceTableCellInsets,
  attachHwp5PageAreas,
  attachHwp5DocumentProperties,
  projectHwp5GroupGeometry,
  projectHwp5PictureGeometry,
  projectHwp5RootContent,
  validateHwp5WindowSelection
} from "./chunk-a94gkc3m.js";
import {
  validateHwp5PageAreaSources,
  validateHwp5MasterPageSources,
  validateHwp5PageControlSources,
  validateHwp5NoteSources,
  validateHwp5DrawingComponentSources,
  validateHwp5DrawingListSources
} from "./chunk-x8k5ryaa.js";
import {
  attachHwpxPageAreaDeclarations,
  attachHwpxStyles,
  attachTabDefinitions,
  attachSectionTabSources,
  attachHwp5Styles,
  attachHwp5Tables,
  hwp5ParagraphGeometry,
  attachHwp5ParagraphFormats,
  hwpxParagraphGeometry,
  attachHwpxParagraphFormats,
  attachHwp5Formulas,
  attachHwp5Forms,
  attachHwp5FormProperties,
  attachHwpxTables,
  attachHwpxTableBorders,
  attachDrawingTextBindings,
  attachEllipses,
  attachHwpxPictures,
  attachHwpxPictureCaptions,
  attachHwpxLines,
  attachHwpxConnectors,
  attachHwp5Lines,
  attachHwpxPageSettings,
  attachHwp5StructuralAnchors,
  attachHwp5MasterPages,
  attachHwp5Notes,
  attachHwp5Captions,
  attachHwp5Drawings,
  attachHwp5ColumnDisplay,
  attachHwp5AutomaticNumbers,
  attachHwp5PageControls,
  attachHwp5PageDeclarations,
  attachHwp5PageSources,
  attachHwp5Pictures,
  readHwp5PictureBytes,
  attachHwp5PictureTails
} from "./chunk-w5n0k031.js";
import {
  paragraphBreakIntent,
  applyParagraphSplit
} from "./chunk-c36s8813.js";
import {
  encodeCharacterRanges
} from "./chunk-vq9qdwke.js";
import"./chunk-bnqtzsr8.js";
import {
  validateHwp5AutomaticNumberSources,
  validateHwp5CaptionSources,
  validateHwp5DrawingAnchors
} from "./chunk-rmgwrdxt.js";
import"./chunk-mff70c55.js";
import"./chunk-gx7k5hbb.js";
import {
  copyOwned,
  ownObservation
} from "./chunk-w9ezghmp.js";

// js/new-document.mjs
async function createNewDocumentBytes(source, format = "hwpx") {
  if (!["hwp5", "hwpx"].includes(format))
    throw Error("InvalidDocumentFormat");
  const module = source instanceof WebAssembly.Module ? source : await WebAssembly.compile(source);
  const { exports: wasm } = await WebAssembly.instantiate(module, {});
  return copyNewDocumentOutput(wasm, format);
}
function copyNewDocumentOutput(wasm, format = "hwpx") {
  if (!["hwp5", "hwpx"].includes(format))
    throw Error("InvalidDocumentFormat");
  for (const name of [
    "new_document_create",
    "new_document_output_ptr",
    "new_document_output_len",
    "new_document_output_free",
    "cfb_error_ptr",
    "cfb_error_len"
  ]) {
    if (typeof wasm[name] !== "function")
      throw Error("NewDocumentUnsupported");
  }
  if (!(wasm.memory instanceof WebAssembly.Memory))
    throw Error("MissingNewDocumentMemory");
  const memory = createMemory(wasm);
  try {
    const status = wasm.new_document_create(format === "hwp5" ? 1 : 2);
    if (status !== 1)
      throw memory.error();
    const ptr = wasm.new_document_output_ptr();
    const len = wasm.new_document_output_len();
    if (!Number.isSafeInteger(ptr) || !Number.isSafeInteger(len) || ptr < 0 || len <= 0 || ptr > wasm.memory.buffer.byteLength - len)
      throw Error("InvalidNewDocumentOutput");
    return memory.copy(ptr, len);
  } finally {
    wasm.new_document_output_free();
  }
}

// web/preview/atomic-formatting-command.mjs
function formattingCapabilities(editor) {
  if (!editor?.supportsAtomicFormatting?.())
    return { atomic: false, reason: "AtomicFormattingUnavailable" };
  return editor.atomicFormattingCapabilities();
}
function queryAtomicFormatting(editor, format, message) {
  const cap = formattingCapabilities(editor);
  if (cap.atomic !== true)
    throw Error(cap.reason);
  if (message.selectors !== undefined) {
    if (message.selector !== undefined || !Array.isArray(message.selectors) || message.selectors.length === 0 || message.selectors.length > cap.limits.targets)
      throw Error("InvalidFormattingSelectors");
    const selectors = message.selectors.map((selector) => {
      if (!selector || selector.kind !== "original-paragraph" || !Number.isInteger(selector.section) || selector.section < 0 || selector.section > 4294967295 || !Number.isInteger(selector.paragraph) || selector.paragraph < 0 || selector.paragraph > 4294967295 - (format === "hwpx" ? 1 : 0))
        throw Error("InvalidFormattingSelector");
      return { ...selector, paragraph: selector.paragraph + (format === "hwpx" ? 1 : 0) };
    });
    return editor.queryFormatting({
      schemaVersion: 1,
      binding: cap.binding,
      selectors,
      ...message.fields === undefined ? {} : { fields: message.fields }
    });
  }
  const selector = message.selector;
  if (!selector || selector.kind !== "original-paragraph" || !Number.isInteger(selector.section) || selector.section < 0 || selector.section > 4294967295 || !Number.isInteger(selector.paragraph) || selector.paragraph < 0 || selector.paragraph > 4294967295 - (format === "hwpx" ? 1 : 0))
    throw Error("InvalidFormattingSelector");
  return editor.queryFormatting({
    schemaVersion: 1,
    binding: cap.binding,
    selectors: [{ ...selector, paragraph: selector.paragraph + (format === "hwpx" ? 1 : 0) }],
    ...message.fields === undefined ? {} : { fields: message.fields }
  });
}

// web/preview/display-resource-cache.mjs
var HEADER_READS = new Set([
  "characterShapes",
  "characterUnderlines",
  "characterUnderlineStyles",
  "characterStrikes",
  "characterStrikeStyles",
  "characterTextColors",
  "characterShades",
  "characterEffects",
  "characterOutlines",
  "fontFaces",
  "fontFaceMetadata",
  "characterFontReferences",
  "characterFontMetrics",
  "paragraphShapeIds",
  "paragraphShapes",
  "tabDefinitions",
  "tableCreationResources"
]);
var READ_ONLY_REQUESTS = new Set([
  "picture-bytes",
  "table-background-bytes",
  "query-edit-range",
  "query-split-range"
]);
function createDisplayResourceCache() {
  let owner = null, facade = null, failed = false, textOnlyHistory = false, pendingHistoryRoot = null;
  const values = new Map;
  const invalidate = () => values.clear();
  return {
    invalidate() {
      invalidate();
      textOnlyHistory = false;
      pendingHistoryRoot = null;
    },
    beginRequest(message, { format, editor, historyEnabled }) {
      failed = false;
      pendingHistoryRoot = null;
      if (format !== "hwpx" || owner !== editor)
        textOnlyHistory = false;
      const textSplice = format === "hwpx" && editor && historyEnabled && message.kind === "splice";
      const textHistoryTravel = format === "hwpx" && owner === editor && editor && historyEnabled && textOnlyHistory && (message.kind === "undo" || message.kind === "redo");
      if (format === "hwpx" && editor && !historyEnabled && message.kind === "enable")
        pendingHistoryRoot = editor;
      else if (!textSplice && !textHistoryTravel && !READ_ONLY_REQUESTS.has(message.kind))
        textOnlyHistory = false;
      if (!textSplice && !textHistoryTravel && !READ_ONLY_REQUESTS.has(message.kind))
        invalidate();
    },
    finishRequest(error = false, metadata) {
      if (error || failed) {
        invalidate();
        textOnlyHistory = false;
      } else if (pendingHistoryRoot && owner === pendingHistoryRoot && Number.isInteger(metadata?.historyRevision) && metadata.historyRevision >= 0 && metadata.historyRevision < 4294967295 && Array.isArray(metadata.historyRevisions) && metadata.historyRevisions.length === 1 && metadata.historyRevisions[0] === metadata.historyRevision) {
        textOnlyHistory = true;
      }
      pendingHistoryRoot = null;
    },
    reset() {
      invalidate();
      owner = facade = null;
      pendingHistoryRoot = null;
      failed = textOnlyHistory = false;
    },
    view(editor) {
      if (owner !== editor) {
        invalidate();
        textOnlyHistory = false;
        if (pendingHistoryRoot !== editor)
          pendingHistoryRoot = null;
        owner = editor;
        facade = null;
      }
      if (!editor)
        return editor;
      if (!facade)
        facade = new Proxy(Object.create(null), {
          get(_, key) {
            const method = Reflect.get(editor, key, editor);
            if (typeof method !== "function")
              return method;
            if (!HEADER_READS.has(key))
              return method.bind(editor);
            return (...args) => {
              if (owner !== editor)
                throw new Error("StaleDisplayResourceOwner");
              if (args.length)
                return method.apply(editor, args);
              try {
                if (!values.has(key))
                  values.set(key, structuredClone(method.call(editor)));
                return structuredClone(values.get(key));
              } catch (error) {
                failed = true;
                invalidate();
                throw error;
              }
            };
          }
        });
      return facade;
    }
  };
}

// js/hwp5.mjs
async function createHwp5Reader(source) {
  const module = source instanceof WebAssembly.Module ? source : await WebAssembly.compile(source);
  const { exports: wasm } = await WebAssembly.instantiate(module, {});
  validateAbi(wasm);
  const memory = createMemory(wasm);
  let closed = false;
  const readText = (data, availableOnly = false) => {
    if (closed)
      throw new Error("ReaderClosed");
    if (availableOnly && !availableSectionExports.every((name) => typeof wasm[name] === "function"))
      throw new Error("AvailableSectionsPreviewUnavailable");
    const bytes = inputBytes(data);
    if (bytes.length > 64 * 1024 * 1024)
      throw new RangeError("LimitExceeded");
    return memory.withBytes(bytes, (ptr, size) => {
      try {
        const read = availableOnly ? wasm.hwp5_text_read_available : wasm.hwp5_text_read;
        if (!read(ptr, size))
          throw memory.error();
        const result = decodeHwp5Text(memory.copy(wasm.hwp5_text_ptr(), wasm.hwp5_text_len()));
        if (typeof wasm.hwp5_text_distribution === "function" && wasm.hwp5_text_distribution() === 1) {
          result.readOnly = true;
          result.primarySource = "distribution_viewtext";
        }
        if (availableOnly) {
          const declared = wasm.hwp5_text_declared_sections(), available = result.sections.length;
          result.readOnly = true;
          result.primarySource = result.primarySource === "distribution_viewtext" ? "available_viewtext" : "available_bodytext";
          result.sectionInventory = sectionInventory(declared, available);
        }
        return result;
      } finally {
        wasm.hwp5_text_free();
      }
    });
  };
  return {
    readText(data) {
      return readText(data);
    },
    readAvailableText(data) {
      return readText(data, true);
    },
    close() {
      if (!closed)
        wasm.hwp5_text_free();
      closed = true;
    }
  };
}

// web/preview/content.mjs
function clipText(text, maxUnits) {
  let end = Math.min(text.length, maxUnits);
  if (end < text.length && end > 0 && text.charCodeAt(end - 1) >= 55296 && text.charCodeAt(end - 1) <= 56319)
    end--;
  return text.slice(0, end);
}
function displayContent(result, { maxUnits = 200000, maxParagraphs = 20000, paragraphOffset = 0, paragraphOrdinals = null } = {}) {
  if (![maxUnits, maxParagraphs, paragraphOffset].every((value) => Number.isSafeInteger(value) && value >= 0))
    throw new RangeError("InvalidDisplayBounds");
  const total = result.sections.reduce((sum, section) => sum + section.paragraphs.length, 0);
  if (paragraphOrdinals !== null && (paragraphOffset !== 0 || !Array.isArray(paragraphOrdinals) || paragraphOrdinals.some((value, index) => !Number.isSafeInteger(value) || value < 0 || value >= total || index > 0 && value <= paragraphOrdinals[index - 1])))
    throw new RangeError("InvalidDisplayBounds");
  if (paragraphOrdinals !== null && paragraphOrdinals.length > maxParagraphs)
    throw new RangeError("ParagraphWindowBudgetExceeded");
  const selected = paragraphOrdinals === null ? null : new Set(paragraphOrdinals);
  const paragraphs = [];
  let units = 0, totalParagraphs = 0, ordinal = 0, limited = paragraphOffset > 0 || selected !== null && selected.size < total;
  for (const section of result.sections) {
    totalParagraphs += section.paragraphs.length;
    for (const [index, p] of section.paragraphs.entries()) {
      const current = ordinal++;
      if (selected !== null ? !selected.has(current) : current < paragraphOffset)
        continue;
      if (paragraphs.length >= maxParagraphs) {
        limited = true;
        continue;
      }
      const room = maxUnits - units;
      const retainedView = retainedTextView(p), fullText = retainedView?.text ?? p.text;
      let text = fullText;
      if (text.length > room) {
        text = clipText(text, room);
        limited = true;
      }
      units += text.length;
      const controls = p.tokens.filter((t) => t.type === "control").length;
      const empty = !p.textPresent && p.declaredUnits <= 1;
      const editable = !result.readOnly && (p.textPresent || empty) && text.length === fullText.length && (retainedView !== null || p.tokens.every((t) => t.type !== "control" || t.code === 13));
      paragraphs.push({
        section: section.index,
        paragraph: index,
        editable,
        label: `구역 ${section.index + 1} · 문단 ${index + 1}${p.parentNodeIndex !== null ? " · 중첩" : ""}${empty ? " · 빈 문단" : ""}${controls ? ` · 제어 표식 ${controls}개 (표시 의미 미적용)` : ""}`,
        text: p.textPresent || empty ? text : "[직접 텍스트 없음]"
      });
      if (text.length !== fullText.length)
        paragraphs.at(-1).clipped = true;
      paragraphs.at(-1).selectionOwner = p.parentNodeIndex === null ? `section:${section.index}:body` : null;
      if (retainedView && text.length === fullText.length)
        paragraphs.at(-1).sourceOffsets = retainedView.offsets;
    }
  }
  return {
    format: "hwp5",
    version: result.version.join("."),
    paragraphs,
    totalParagraphs,
    limited,
    ...result.readOnly ? { readOnly: true, primarySource: result.primarySource } : {}
  };
}

// web/preview/hwp5-available-preview.mjs
function availableSectionsCapability(module) {
  if (!(module instanceof WebAssembly.Module))
    return false;
  const names = new Set(WebAssembly.Module.exports(module).filter((entry) => entry.kind === "function").map((entry) => entry.name));
  return availableSectionExports.every((name) => names.has(name));
}
function availableSectionsRequest(message) {
  const value = message.availableSectionsOnly ?? false;
  if (message.availableSectionsOnly === null || typeof value !== "boolean")
    throw new Error("InvalidAvailableSectionsPolicy");
  if (value && (message.format ?? "hwp5") !== "hwp5")
    throw new Error("UnsupportedAvailableSectionsFormat");
  return value;
}
function availableSectionsContent(preview) {
  if (preview?.readOnly !== true || !["available_bodytext", "available_viewtext"].includes(preview.primarySource))
    throw new Error("InvalidAvailableSectionsPreview");
  const inventory = checkedSectionInventory(preview.sectionInventory);
  return { ...displayContent(preview), availableSectionsOnly: true, sectionInventory: inventory };
}

// js/hwpx-text-wire.mjs
var kinds = [
  "paragraph_start",
  "paragraph_end",
  "run_start",
  "run_end",
  "text_start",
  "text_end",
  "content",
  "inline_start",
  "inline_end",
  "inline_empty"
];
var inlineKinds = [
  "tab",
  "fw_space",
  "nb_space",
  "line_break",
  "title_mark",
  "markpen_begin",
  "markpen_end",
  "hypen",
  "unknown"
];
var decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
function decodeHwpxText(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  const invalid = () => {
    throw new Error("InvalidHwpxTextWire");
  };
  const word = () => {
    if (offset + 4 > bytes.length)
      invalid();
    const value = view.getUint32(offset, true);
    offset += 4;
    return value;
  };
  if (word() !== 827611208)
    invalid();
  const sectionCount = word(), paragraphCount = word(), eventCount = word();
  if (sectionCount > 4096 || eventCount > (bytes.length - offset) / 32 || paragraphCount > eventCount / 2)
    invalid();
  const events = [];
  let starts = 0, ends = 0;
  for (let i = 0;i < eventCount; i++) {
    const section = word(), itemIndex = word(), paragraph = word(), run = word(), text = word();
    const kind = word(), inline = word(), length = word();
    if (section >= sectionCount || paragraph === 0 || kind >= kinds.length || length > bytes.length - offset)
      invalid();
    if (kind >= 7 ? inline >= inlineKinds.length : inline !== 4294967295)
      invalid();
    if (kind === 5 && length !== 0)
      invalid();
    const raw = Uint8Array.from(bytes.subarray(offset, offset + length));
    offset += length;
    let value;
    try {
      value = decoder.decode(raw);
    } catch {
      invalid();
    }
    if (kind === 0)
      starts++;
    if (kind === 1)
      ends++;
    events.push({
      section,
      itemIndex,
      paragraph,
      run,
      text,
      kind: kinds[kind],
      inlineKind: kind >= 7 ? inlineKinds[inline] : null,
      value,
      raw
    });
  }
  if (offset !== bytes.length || starts !== paragraphCount || ends !== paragraphCount)
    invalid();
  return { format: "hwpx", branchPolicy: "selected_default", sectionCount, paragraphCount, events };
}

// js/hwpx.mjs
async function createHwpxReader(source) {
  const module = source instanceof WebAssembly.Module ? source : await WebAssembly.compile(source);
  const { exports: wasm } = await WebAssembly.instantiate(module, {});
  validateAbi(wasm);
  for (const name of ["hwpx_text_read", "hwpx_text_ptr", "hwpx_text_len", "hwpx_text_free"])
    if (typeof wasm[name] !== "function")
      throw new Error("HwpxTextAbiUnavailable");
  const memory = createMemory(wasm);
  let closed = false;
  return {
    readTextEvents(data) {
      if (closed)
        throw new Error("ReaderClosed");
      const bytes = inputBytes(data);
      if (bytes.length > 64 * 1024 * 1024)
        throw new RangeError("LimitExceeded");
      return memory.withBytes(bytes, (ptr, size) => {
        try {
          if (!wasm.hwpx_text_read(ptr, size))
            throw memory.error();
          return decodeHwpxText(memory.copy(wasm.hwpx_text_ptr(), wasm.hwpx_text_len()));
        } finally {
          wasm.hwpx_text_free();
        }
      });
    },
    close() {
      if (!closed)
        wasm.hwpx_text_free();
      closed = true;
    }
  };
}

// web/preview/hwpx-chart-content.mjs
function attachHwpxCharts(editor, content, exports, allowObservedRepairs) {
  content.chartDisplayAvailable = exports.has("hwpx_edit_chart_display");
  content.chartEditAvailable = [
    "hwpx_edit_chart_nodes",
    "hwpx_edit_chart_points",
    "hwpx_edit_set_chart_numeric_point"
  ].every((name) => exports.has(name));
  content.chartStringEditAvailable = [
    "hwpx_edit_set_chart_point",
    "hwpx_edit_chart_point_max_bytes"
  ].every((name) => exports.has(name));
  content.chartPointBatchEditAvailable = content.chartEditAvailable && content.chartStringEditAvailable && [
    "hwpx_edit_set_chart_points",
    "hwpx_edit_chart_point_batch_max_edits",
    "hwpx_edit_chart_point_batch_max_bytes",
    "hwpx_edit_history_revision"
  ].every((name) => exports.has(name));
  content.chartPointBatchLimits = content.chartPointBatchEditAvailable ? editor.chartPointBatchLimits() : null;
  content.chartSeriesTextEditAvailable = [
    "hwpx_edit_chart_series_text",
    "hwpx_edit_set_chart_series_text",
    "hwpx_edit_chart_series_text_max_bytes"
  ].every((name) => exports.has(name));
  content.chartRichTextEditAvailable = [
    "hwpx_edit_chart_rich_text",
    "hwpx_edit_set_chart_rich_text",
    "hwpx_edit_chart_rich_text_max_bytes"
  ].every((name) => exports.has(name));
  content.chartOleObservedRepairsAllowed = allowObservedRepairs;
  content.chartTargets = [];
  if (!content.chartEditAvailable)
    return content;
  for (const section of new Set(content.paragraphs.map((row) => row.section))) {
    if (exports.has("hwpx_edit_chart_sites")) {
      for (const site of editor.chartSites(section))
        content.chartTargets.push({
          ...site,
          section,
          paragraph: site.paragraph === null ? null : site.paragraph - 1
        });
    } else
      for (const wrapper of editor.chartNodes(section))
        content.chartTargets.push({ section, wrapper });
  }
  return content;
}

// web/preview/chart-point-batch-command.mjs
function samePair(expected, current) {
  return expected && typeof expected === "object" && !Array.isArray(expected) && ["chart_path", "ole_path", "wrapper_node", "section_ordinal", "declared_external"].every((key) => expected[key] === current[key]) && Array.isArray(expected.section_sha256) && expected.section_sha256.length === current.section_sha256.length && Array.from(expected.section_sha256).every((byte, i) => byte === current.section_sha256[i]);
}
function applyChartPointBatchCommand(editor, message) {
  const limits = editor.chartPointBatchLimits();
  if (!Number.isInteger(message.expectedRevision) || message.expectedRevision < 0 || message.expectedRevision >= 4294967295 || !Array.isArray(message.changes) || message.changes.length > limits.maxEdits)
    throw new Error("InvalidChartBatchCommand");
  if (message.expectedRevision !== editor.historyRevision())
    throw new Error("StaleChartBatch");
  const current = editor.chartPoints(message.section, message.wrapper);
  if (!samePair(message.expectedPair, current.pair))
    throw new Error("StaleChartBatch");
  const edits = [];
  for (const change of message.changes) {
    if (!change || !Number.isInteger(change.point) || change.point < 0 || typeof change.before !== "string" || typeof change.value !== "string")
      throw new Error("InvalidChartBatchCommand");
    if (current.values.points[change.point]?.value !== change.before)
      throw new Error("StaleChartBatch");
    edits.push({ point: change.point, value: change.value });
  }
  editor.setChartPoints(message.section, message.wrapper, edits);
}

// web/preview/table-column-width-plan.mjs
function tableColumnWidthPlan(table, request) {
  const fail = (error) => ({ state: "unavailable", error });
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const resizeHeight = request?.height !== undefined || request?.expectedHeight !== undefined;
  if (!request || ![
    request.section,
    request.tableNode,
    request.listNode,
    request.width,
    request.expectedWidth
  ].every(uint) || request.width === 0 || table?.section !== request.section || table?.tableNode !== request.tableNode)
    return fail("InvalidTableColumnWidthRequest");
  if (resizeHeight && ![request.height, request.expectedHeight].every(uint))
    return fail("InvalidTableColumnWidthRequest");
  const local = sourceTableRowHorizontals(table);
  if (local.state !== "resolved")
    return local;
  const common = sourceTableColumns(table);
  if (common.state !== "resolved")
    return common;
  const selected = table.cells.find((cell) => cell.listNode === request.listNode);
  if (!selected)
    return fail("InvalidCellDisplayOwner");
  if (selected.width !== request.expectedWidth)
    return fail("StaleTableColumnWidth");
  if (resizeHeight && selected.height !== request.expectedHeight)
    return fail("StaleTableCellHeight");
  const boundary = selected.column + selected.columnSpan, delta = request.width - selected.width;
  if (common.columns[boundary - 1] + delta <= 0)
    return fail("InvalidTableColumnWidthRequest");
  const cells = [];
  for (const cell of table.cells) {
    if (cell.column >= boundary || cell.column + cell.columnSpan < boundary)
      continue;
    const width = cell.width + delta;
    if (!uint(width) || width === 0 || !uint(cell.height))
      return fail("InvalidTableColumnWidthRequest");
    const height = resizeHeight && cell.listNode === selected.listNode ? request.height : cell.height;
    if (delta !== 0 || height !== cell.height)
      cells.push({ section: table.section, listNode: cell.listNode, width, height });
  }
  if (cells.length > 4096)
    return fail("LimitExceeded");
  if (!Number.isSafeInteger(common.width + delta) || common.width + delta > 4294967295)
    return fail("InvalidTableColumnWidthRequest");
  return { state: "planned", cells, boundary, delta };
}

// web/preview/hwpx-field-range-target.mjs
function hwpxFieldRangeTarget(editor, createdTablesPending, section, paragraph, start, end) {
  if (createdTablesPending && !editor.createdTableFieldLabelMode(section))
    return null;
  return editor.fieldRangeTarget(section, paragraph, start, end);
}

// web/preview/checkbox-content.mjs
function attachCheckBoxes(editor, content, available) {
  content.checkBoxStateAvailable = available;
  content.checkBoxes = [];
  if (!available)
    return;
  for (const section of new Set(content.paragraphs.map((p) => p.section))) {
    for (const site of editor.formSites(section)) {
      if (site.kind !== "check_button")
        continue;
      const row = {
        section,
        formNode: site.formNode,
        paragraph: site.paragraph === null ? null : site.paragraph - 1,
        anchorUnit: site.anchorUnit,
        siteState: site.state,
        caption: null,
        state: null,
        editable: false,
        triState: false,
        error: null
      };
      row.sourceLayout = null;
      row.layoutError = null;
      if (typeof editor.formSourceLayout === "function") {
        try {
          row.sourceLayout = editor.formSourceLayout(section, site.formNode);
        } catch (error) {
          row.layoutError = error.message;
        }
      } else
        row.layoutError = "HwpxFormLayoutAbiUnavailable";
      try {
        const source = editor.formSourceAttributes(section, site.formNode);
        row.caption = source.strings.caption ?? source.strings.name;
        row.foreColor = source.strings.foreColor ?? null;
        row.backColor = source.strings.backColor ?? null;
        row.backStyle = source.strings.backStyle ?? null;
        row.triState = source.booleans.triState === true;
        if (site.state === "located") {
          row.state = editor.checkBoxState(section, site.formNode);
          row.editable = source.booleans.enabled === true && source.booleans.editable === true;
        } else
          row.error = site.state;
      } catch (error) {
        row.error = error.message;
      }
      content.checkBoxes.push(row);
    }
  }
}

// web/preview/hwpx-content.mjs
var inlineText = {
  tab: "\t",
  fw_space: "　",
  nb_space: " ",
  line_break: "↵",
  hypen: "­",
  unknown: "￼"
};
var HWPX_DISPLAY_BOUNDS = Object.freeze({ maxUnits: 200000, maxParagraphs: 20000 });
function displayHwpxContent(result, {
  maxUnits = HWPX_DISPLAY_BOUNDS.maxUnits,
  maxParagraphs = HWPX_DISPLAY_BOUNDS.maxParagraphs,
  paragraphOffset = 0
} = {}) {
  if (!Number.isSafeInteger(maxUnits) || maxUnits < 0 || !Number.isSafeInteger(maxParagraphs) || maxParagraphs < 0 || !Number.isSafeInteger(paragraphOffset) || paragraphOffset < 0 || paragraphOffset > result.paragraphCount)
    throw new RangeError("InvalidDisplayBounds");
  const paragraphs = [], stack = [], seen = new Set;
  let units = 0, limited = false, textClipped = false;
  const append = (frame, text) => {
    if (!frame.visible) {
      if (text)
        limited = true;
      return;
    }
    if (textClipped) {
      if (text)
        frame.value.clipped = true;
      return;
    }
    const clipped = clipText(text, maxUnits - units);
    if (clipped.length !== text.length) {
      limited = true;
      textClipped = true;
      frame.value.clipped = true;
    }
    frame.value.text += clipped;
    units += clipped.length;
  };
  for (const event of result.events) {
    if (event.kind === "paragraph_start") {
      const key = `${event.section}:${event.paragraph}`;
      if (seen.has(key))
        throw new Error("InvalidHwpxParagraphEvents");
      seen.add(key);
      const value = {
        section: event.section,
        paragraph: event.paragraph - 1,
        editable: false,
        label: `구역 ${event.section + 1} · 문단 ${event.paragraph}${stack.length ? " · 중첩" : ""} · HWPX 읽기 전용`,
        text: ""
      };
      const visible = seen.size - 1 >= paragraphOffset && paragraphs.length < maxParagraphs;
      value.selectionOwner = stack.length === 0 ? `section:${event.section}:body` : null;
      if (visible)
        paragraphs.push(value);
      else
        limited = true;
      stack.push({ section: event.section, paragraph: event.paragraph, value, visible });
      continue;
    }
    const frame = stack.at(-1);
    if (!frame || frame.section !== event.section || frame.paragraph !== event.paragraph)
      throw new Error("InvalidHwpxParagraphEvents");
    if (event.kind === "paragraph_end")
      stack.pop();
    else if (event.kind === "content")
      append(frame, event.value);
    else if (event.kind === "inline_start" || event.kind === "inline_empty")
      append(frame, inlineText[event.inlineKind] ?? "");
  }
  if (stack.length || seen.size !== result.paragraphCount)
    throw new Error("InvalidHwpxParagraphEvents");
  return {
    format: "hwpx",
    version: null,
    readOnly: true,
    paragraphs,
    totalParagraphs: result.paragraphCount,
    limited
  };
}

// web/preview/dutmal-content.mjs
function attachDutmal(editor, content, available) {
  content.dutmalAvailable = available;
  content.dutmalErrors = [];
  for (const paragraph of content.paragraphs)
    paragraph.dutmal = [];
  if (!available)
    return content;
  let sources;
  try {
    sources = editor.inlineStringSources();
  } catch (error) {
    content.dutmalErrors.push({ error: error.message });
    return content;
  }
  const controls = new Map(sources.controls.filter((row) => row.kind === "dutmal").map((row) => [`${row.section_ordinal}:${row.element_index}`, row]));
  const paragraphs = new Map(content.paragraphs.map((row) => [`${row.section}:${row.paragraph}`, row]));
  let units = content.paragraphs.reduce((sum, row) => sum + row.text.length, 0);
  for (const section of new Set(content.paragraphs.map((row) => row.section))) {
    try {
      for (const site of editor.dutmalSites(section)) {
        const paragraph = paragraphs.get(`${section}:${site.paragraph - 1}`);
        if (!paragraph || paragraph.clipped)
          continue;
        const source = controls.get(`${section}:${site.node}`);
        const projected = editor.dutmalDisplayText(section, site.node);
        if (projected.length > HWPX_DISPLAY_BOUNDS.maxUnits - units + paragraph.text.length)
          throw new Error("DutmalDisplayBudgetExceeded");
        if (source && projected[site.anchor_unit] === "￼") {
          units += projected.length - paragraph.text.length;
          paragraph.text = projected;
        }
        if (!source || projected[site.anchor_unit] !== "￼") {
          content.dutmalErrors.push({ section, node: site.node, error: "DutmalBindingMismatch" });
          continue;
        }
        try {
          paragraph.dutmal.push({
            node: site.node,
            unit: site.anchor_unit,
            mainText: editor.dutmalText(section, site.node, "mainText"),
            subText: editor.dutmalText(section, site.node, "subText"),
            sourceAttributes: { ...source.attributes }
          });
        } catch (error) {
          content.dutmalErrors.push({ section, node: site.node, error: error.message });
        }
      }
    } catch (error) {
      content.dutmalErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/equation-content.mjs
function attachEquations(editor, content, available) {
  content.equationAvailable = available;
  content.equationErrors = [];
  for (const paragraph of content.paragraphs)
    paragraph.equations = [];
  if (!available)
    return content;
  const paragraphs = new Map(content.paragraphs.map((row) => [`${row.section}:${row.paragraph}`, row]));
  for (const section of new Set(content.paragraphs.map((row) => row.section))) {
    try {
      const sites = editor.equationSites(section);
      const counts = new Map;
      for (const row of sites)
        if (row.source.issue === null && row.error_name === null) {
          const key = `${row.paragraph}:${row.anchor_unit}`;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      for (const row of sites) {
        const node = row.source.node;
        const error = row.source.issue ?? row.error_name;
        if (error !== null) {
          content.equationErrors.push({ section, node, error });
          continue;
        }
        const paragraph = paragraphs.get(`${section}:${row.paragraph - 1}`);
        if (!paragraph || paragraph.clipped)
          continue;
        if (counts.get(`${row.paragraph}:${row.anchor_unit}`) !== 1 || paragraph.text[row.anchor_unit] !== "￼") {
          content.equationErrors.push({ section, node, error: "EquationBindingMismatch" });
          continue;
        }
        paragraph.equations.push({ node, unit: row.anchor_unit });
      }
    } catch (error) {
      content.equationErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/field-label-display-content.mjs
function projectFieldLabelDisplay(editor, paragraph, maxUnits) {
  if (!paragraph.fieldLabels?.length)
    return 0;
  try {
    const text = editor.fieldLabelDisplayText(paragraph.section, paragraph.paragraph + 1);
    if (typeof text !== "string" || text.length > maxUnits)
      throw new Error("FieldLabelDisplayBudgetExceeded");
    const delta = text.length - paragraph.text.length;
    paragraph.text = text;
    return delta;
  } catch (error) {
    paragraph.fieldReadOnlyReason = error.message;
    paragraph.fieldLabels = [];
    return 0;
  }
}

// web/preview/formula-result-text-command.mjs
var exportsRequired = [
  "hwpx_edit_splice_manual_formula_result",
  "hwpx_edit_manual_formula_result_max_bytes",
  "hwpx_edit_manual_formula_result_targets",
  "hwpx_edit_manual_formula_result_range_target",
  "hwpx_edit_manual_formula_result_display_text"
];
function formulaResultTextAvailable(editor, module) {
  const names = new Set(WebAssembly.Module.exports(module).filter((entry) => entry.kind === "function").map((entry) => entry.name));
  return [
    "spliceManualFormulaResult",
    "manualFormulaResultTargets",
    "manualFormulaResultRangeTarget",
    "manualFormulaResultDisplayText"
  ].every((name) => typeof editor?.[name] === "function") && exportsRequired.every((name) => names.has(name));
}
function projectFormulaResultText(editor, paragraph, available, maxUnits, snapshot) {
  paragraph.manualFormulaResults = [];
  if (!available || paragraph.clipped || paragraph.plainEditable)
    return 0;
  const targets = snapshot === undefined ? editor.manualFormulaResultTargets(paragraph.section, paragraph.paragraph + 1) : snapshot.targets;
  if (!Array.isArray(targets))
    throw new Error("InvalidFormulaResultTarget");
  if (!targets.length)
    return 0;
  const text = snapshot === undefined ? editor.manualFormulaResultDisplayText(paragraph.section, paragraph.paragraph + 1) : snapshot.text;
  if (typeof text !== "string" || targets.some((target) => !uint(target.beginElement) || !uint(target.start) || !uint(target.end) || target.end < target.start || target.end > text.length))
    throw new Error("InvalidFormulaResultTarget");
  const before = paragraph.text.length;
  paragraph.text = clipText(text, maxUnits);
  if (paragraph.text !== text) {
    paragraph.clipped = true;
    paragraph.plainEditable = false;
    paragraph.anchorEditable = false;
    paragraph.fieldLabels = [];
  } else
    paragraph.manualFormulaResults = targets;
  return paragraph.text.length - before;
}
function spliceFormulaResultText(editor, module, message) {
  if (!formulaResultTextAvailable(editor, module))
    return false;
  const target = editor.manualFormulaResultRangeTarget(message.section, message.paragraph + 1, message.startUnit, message.endUnit);
  if (target === null)
    return false;
  if (!uint(target.beginElement) || !uint(target.start) || !uint(target.end) || target.start > message.startUnit || target.end < message.endUnit || target.end < target.start)
    throw new Error("InvalidFormulaResultTarget");
  editor.spliceManualFormulaResult(message.section, target.beginElement, message.startUnit - target.start, message.endUnit - message.startUnit, message.text);
  return true;
}
function formulaResultTextRangeAllowed(editor, module, section, nativeParagraph, start, end) {
  return formulaResultTextAvailable(editor, module) && editor.manualFormulaResultRangeTarget(section, nativeParagraph, start, end) !== null;
}
function uint(value) {
  return Number.isInteger(value) && value >= 0 && value <= 4294967295;
}

// web/preview/formula-result-paragraph-filter.mjs
function createFormulaResultParagraphFilter(editor, exportNames) {
  if (!exportNames.has("hwpx_edit_manual_formula_result_paragraphs") || typeof editor.manualFormulaResultParagraphs !== "function")
    return () => true;
  const sections = new Map;
  return (section, paragraph) => {
    if (!sections.has(section))
      sections.set(section, new Set(editor.manualFormulaResultParagraphs(section)));
    return sections.get(section).has(paragraph);
  };
}

// web/preview/formula-result-display-lookup.mjs
function createFormulaResultDisplayLookup(editor, exports) {
  const available = exports.has("hwpx_edit_manual_formula_result_display_snapshot") && typeof editor.manualFormulaResultDisplaySnapshot === "function";
  const sections = new Map;
  return {
    available,
    get(section, paragraph) {
      if (!available)
        throw new Error("HwpxFormulaResultSnapshotAbiUnavailable");
      if (!sections.has(section)) {
        let rows;
        try {
          rows = editor.manualFormulaResultDisplaySnapshot(section);
        } catch (error) {
          if (error.message !== "LimitExceeded")
            throw error;
          sections.set(section, null);
          return;
        }
        const current = new Map;
        for (const row of rows) {
          if (current.has(row.paragraph))
            throw new Error("InvalidFormulaResultDisplaySnapshot");
          current.set(row.paragraph, row);
        }
        sections.set(section, current);
      }
      return sections.get(section)?.get(paragraph) ?? (sections.get(section) === null ? undefined : null);
    }
  };
}

// web/preview/hwpx-ole-content.mjs
function attachHwpxOleSources(editor, content, available) {
  content.oleSourceAvailable = available === true;
  delete content.oles;
  delete content.oleSourceErrors;
  if (!content.oleSourceAvailable)
    return content;
  content.oles = [];
  content.oleSourceErrors = [];
  const owners = new Map, sections = new Set;
  for (const p of content.paragraphs) {
    const key = `${p.section}:${p.paragraph}`, group = owners.get(key) ?? [];
    group.push(p);
    owners.set(key, group);
    sections.add(p.section);
  }
  for (const section of sections) {
    let sites;
    try {
      sites = editor.oleSites(section);
    } catch (error) {
      if (["OutOfMemory", "LimitExceeded"].includes(error.message))
        throw error;
      content.oleSourceErrors.push({ section, error: error.message });
      continue;
    }
    for (const site of sites) {
      const paragraph = site.paragraph === null ? null : site.paragraph - 1;
      const matches = paragraph === null ? [] : owners.get(`${section}:${paragraph}`) ?? [];
      if (content.window && paragraph !== null && !matches.length)
        continue;
      const row = {
        section,
        oleNode: site.ole_node,
        paragraph,
        anchorUnit: site.anchor_unit,
        state: "unavailable",
        error: site.error_name,
        source: null,
        sourceError: null,
        paintable: false,
        chartWrapper: site.chart_wrapper ?? null,
        representation: site.chart_wrapper == null ? "standalone" : "unresolved-chart-alternative"
      };
      if (!row.error && (matches.length !== 1 || matches[0].clipped || typeof matches[0].text !== "string" || matches[0].text[site.anchor_unit] !== "￼"))
        row.error = "OleDisplayBindingMismatch";
      if (!row.error) {
        row.state = "located";
        if (row.chartWrapper !== null) {
          const targets = (content.chartTargets ?? []).filter((target) => target.section === section && target.wrapper === row.chartWrapper && target.paragraph === paragraph && target.anchorUnit === row.anchorUnit && target.error_name === null);
          if (targets.length === 1)
            row.representation = "chart-alternative";
        }
        try {
          row.source = editor.oleSource(section, site.ole_node);
        } catch (error) {
          if (["OutOfMemory", "LimitExceeded"].includes(error.message))
            throw error;
          row.sourceError = error.message;
        }
      }
      content.oles.push(row);
    }
  }
  return content;
}

// web/preview/dutmal-edit-command.mjs
function dutmalQueryIdentity(message) {
  if (message.kind === "inline-string-sources")
    return { requestId: message.requestId };
  if (!["dutmal-text-query", "dutmal-text"].includes(message.kind))
    return {};
  return {
    requestId: message.requestId,
    section: message.section,
    node: message.node,
    textKind: message.textKind
  };
}
function readDutmalText(editor, message) {
  return {
    section: message.section,
    node: message.node,
    textKind: message.textKind,
    value: editor.dutmalText(message.section, message.node, message.textKind)
  };
}
function writeDutmalText(editor, message) {
  editor.setDutmalText(message.section, message.node, message.textKind, message.value);
  return readDutmalText(editor, message);
}

// web/preview/equation-edit-command.mjs
function equationQueryIdentity(message) {
  if (!["equation-sources", "equation-script-query", "equation-script-set"].includes(message.kind))
    return {};
  return { requestId: message.requestId, section: message.section, node: message.node };
}
function readEquationScript(editor, message) {
  return {
    section: message.section,
    node: message.node,
    value: editor.equationScript(message.section, message.node),
    revision: editor.historyRevision()
  };
}
function writeEquationScript(editor, message) {
  if (!Number.isInteger(message.expectedRevision) || message.expectedRevision < 0 || message.expectedRevision > 4294967295 || typeof message.before !== "string")
    throw new Error("InvalidEquationScriptLease");
  if (editor.historyRevision() !== message.expectedRevision)
    throw new Error("EquationRevisionMismatch");
  if (editor.equationScript(message.section, message.node) !== message.before)
    throw new Error("EquationScriptMismatch");
  editor.setEquationScript(message.section, message.node, message.value);
}

// js/password-decoder.mjs
async function createPasswordDecoder(source, prefix, unavailable) {
  const module = source instanceof WebAssembly.Module ? source : await WebAssembly.compile(source);
  const { exports: wasm } = await WebAssembly.instantiate(module, {});
  validateAbi(wasm);
  const api = {};
  for (const name of ["decrypt", "ptr", "len", "free"]) {
    api[name] = wasm[`${prefix}_${name}`];
    if (typeof api[name] !== "function")
      throw new Error(unavailable);
  }
  const memory = createMemory(wasm);
  let closed = false;
  return {
    decryptToPlaintext(data, password) {
      if (closed)
        throw new Error("DecoderClosed");
      const bytes = inputBytes(data);
      if (bytes.length > 64 * 1024 * 1024)
        throw new RangeError("LimitExceeded");
      if (typeof password === "string" && !password.isWellFormed())
        throw new TypeError("InvalidPasswordUnicode");
      const secret = typeof password === "string" ? new TextEncoder().encode(password) : inputBytes(password).slice();
      try {
        if (secret.length > 4096)
          throw new RangeError("LimitExceeded");
        return memory.withBytes(bytes, (ptr, size) => memory.withSecretBytes(secret, (passwordPtr, passwordSize) => {
          try {
            const status = api.decrypt(ptr, size, passwordPtr, passwordSize);
            if (status === 0)
              throw memory.error();
            if (status === 2)
              return null;
            if (status !== 1)
              throw new Error("InvalidPasswordResult");
            return memory.copy(api.ptr(), api.len());
          } finally {
            api.free();
          }
        }));
      } finally {
        secret.fill(0);
      }
    },
    close() {
      if (!closed)
        api.free();
      closed = true;
    }
  };
}

// js/hwpx-password.mjs
function createHwpxPasswordDecoder(source) {
  return createPasswordDecoder(source, "hwpx_password", "HwpxPasswordAbiUnavailable");
}

// js/hwp5-password.mjs
function createHwp5PasswordDecoder(source) {
  return createPasswordDecoder(source, "hwp5_password", "Hwp5PasswordAbiUnavailable");
}

// web/preview/password-policy.mjs
function requirePasswordRemovalConsent(protectionRemoved, consent) {
  if (protectionRemoved && consent !== true)
    throw new Error("PasswordProtectionRemovalNotAcknowledged");
}

// web/preview/hwpx-window-dependencies.mjs
function hwpxWindowDependencies(editor, projection) {
  displayHwpxContent(projection, { maxUnits: 0, maxParagraphs: 0 });
  const ordinals = new Map, parents = new Map, sections = new Set, stack = [], groups = [];
  for (const event of projection.events) {
    if (event.kind === "paragraph_start") {
      const ordinal = ordinals.size;
      ordinals.set(`${event.section}:${event.paragraph}`, ordinal);
      sections.add(event.section);
      if (stack.length) {
        parents.set(ordinal, stack.at(-1));
        groups.push([stack.at(-1), ordinal]);
      }
      stack.push(ordinal);
    } else if (event.kind === "paragraph_end")
      stack.pop();
  }
  const resolve = (section, paragraph) => {
    const ordinal = ordinals.get(`${section}:${paragraph}`);
    if (ordinal === undefined)
      throw new Error("WindowDependencyBindingMismatch");
    return ordinal;
  };
  for (const section of sections) {
    const tables = new Map;
    const tableGroup = (node) => {
      if (!tables.has(node))
        tables.set(node, new Set);
      return tables.get(node);
    };
    for (const row of editor.tableBindings(section))
      tableGroup(row.tableNode).add(resolve(section, row.paragraph));
    for (const row of editor.tablePlacements(section))
      tableGroup(row.tableNode).add(resolve(section, row.paragraph));
    for (const row of editor.tableCaptionBindings(section))
      tableGroup(row.owner.table_node).add(resolve(section, row.paragraph));
    for (const values of tables.values())
      groups.push([...values]);
    const drawings = new Map;
    for (const row of editor.drawingTextBindings(section)) {
      if (!drawings.has(row.drawingNode))
        drawings.set(row.drawingNode, new Set);
      const ordinal = resolve(section, row.paragraph);
      const host = parents.get(ordinal);
      if (host === undefined)
        throw new Error("MissingWindowDrawingHost");
      drawings.get(row.drawingNode).add(ordinal);
      drawings.get(row.drawingNode).add(host);
    }
    for (const values of drawings.values())
      groups.push([...values]);
  }
  return groups;
}

// web/preview/paragraph-window-plan.mjs
function planParagraphWindow({ total, offset, count, groups, maxParagraphs }) {
  for (const value of [total, offset, count, maxParagraphs]) {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new RangeError("InvalidParagraphWindow");
  }
  if (offset > total || count > total - offset || !Array.isArray(groups))
    throw new RangeError("InvalidParagraphWindow");
  for (const group of groups) {
    if (!Array.isArray(group) || group.length === 0)
      throw new RangeError("InvalidParagraphDependencies");
    const seen = new Set;
    for (const ordinal of group) {
      if (!Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal >= total || seen.has(ordinal))
        throw new RangeError("InvalidParagraphDependencies");
      seen.add(ordinal);
    }
  }
  let start = offset, end = offset + count;
  if (count > maxParagraphs)
    throw new RangeError("ParagraphWindowBudgetExceeded");
  if (count === 0)
    return { paragraphOffset: start, maxParagraphs: 0 };
  let changed;
  do {
    changed = false;
    for (const group of groups) {
      if (!group.some((ordinal) => ordinal >= start && ordinal < end))
        continue;
      for (const ordinal of group) {
        if (ordinal < start) {
          start = ordinal;
          changed = true;
        }
        if (ordinal >= end) {
          end = ordinal + 1;
          changed = true;
        }
      }
      if (end - start > maxParagraphs)
        throw new RangeError("ParagraphWindowBudgetExceeded");
    }
  } while (changed);
  return { paragraphOffset: start, maxParagraphs: end - start };
}

// web/preview/hwpx-window-projection.mjs
function projectHwpxWindow(editor, projection, {
  offset,
  count,
  maxParagraphs = HWPX_DISPLAY_BOUNDS.maxParagraphs,
  maxUnits = HWPX_DISPLAY_BOUNDS.maxUnits
}) {
  planParagraphWindow({
    total: projection.paragraphCount,
    offset,
    count,
    groups: [],
    maxParagraphs
  });
  if (!Number.isSafeInteger(maxUnits) || maxUnits < 0)
    throw new RangeError("InvalidDisplayBounds");
  const groups = hwpxWindowDependencies(editor, projection);
  const plan = planParagraphWindow({
    total: projection.paragraphCount,
    offset,
    count,
    groups,
    maxParagraphs
  });
  const content = displayHwpxContent(projection, { ...plan, maxUnits });
  if (content.paragraphs.some((row) => row.clipped))
    throw new RangeError("ParagraphWindowTextBudgetExceeded");
  return {
    ...content,
    limited: false,
    window: {
      requestedOffset: offset,
      requestedCount: count,
      paragraphOffset: plan.paragraphOffset,
      paragraphCount: plan.maxParagraphs
    }
  };
}

// web/preview/hwp5-retained-click-policy.mjs
function retainedClickProtection(editor, section, failure) {
  if (!["UnsupportedCrossParagraphField", "UnsupportedSectionControl"].includes(failure) || editor.supportsTextSourceProtection?.() !== true)
    return null;
  const value = validateHwp5TextSourceProtection(editor.textSourceProtection(section), editor.paragraphCount(section));
  const expected = failure === "UnsupportedSectionControl" ? "retained_memo" : "retained_click";
  if (value.mode !== expected)
    throw new Error("InvalidHwp5TextSourceProtection");
  return value;
}
function restoreRetainedWindowCandidate(paragraph) {
  if (paragraph.fieldTopologyEditableCandidate === true && paragraph.windowContext !== true && paragraph.clipped !== true)
    paragraph.editable = true;
  delete paragraph.fieldTopologyEditableCandidate;
  if (paragraph.fieldTopologyError === "UnresolvedFieldMarkers")
    delete paragraph.fieldTopologyError;
}

// web/preview/hwp5-text-source-policy.mjs
function attachHwp5TextSourcePolicy(editor, content) {
  content.textSourcePolicyAvailable = editor?.supportsTextSourcePolicy?.() === true;
  if (!content.textSourcePolicyAvailable)
    return content;
  const sections = new Map;
  for (const paragraph of content.paragraphs) {
    if (!sections.has(paragraph.section)) {
      let error = null, protection = null;
      try {
        editor.validateTextSourcePolicy(paragraph.section);
      } catch (failure) {
        error = failure instanceof Error ? failure.message : "TextSourcePolicyQueryFailed";
      }
      if (error !== null) {
        try {
          protection = retainedClickProtection(editor, paragraph.section, error);
          if (protection) {
            error = null;
            if (protection.mode === "retained_memo")
              content.retainedMemoProtection = true;
            else
              content.retainedClickFieldProtection = true;
          }
        } catch (failure) {
          error = failure instanceof Error ? failure.message : "TextSourceProtectionQueryFailed";
        }
      }
      sections.set(paragraph.section, { error, protection });
    }
    const state = sections.get(paragraph.section);
    if (state.protection && (!Number.isInteger(paragraph.paragraph) || paragraph.paragraph < 0 || paragraph.paragraph >= state.protection.protected_paragraphs.length)) {
      paragraph.textSourcePolicyError = "InvalidHwp5TextSourceProtection";
      paragraph.editable = false;
      continue;
    }
    const protectedRow = state.protection?.protected_paragraphs[paragraph.paragraph];
    const error = state.error ?? (protectedRow === true ? state.protection?.mode === "retained_memo" ? "OutsideEditableMemo" : "UnsupportedCrossParagraphField" : null);
    if (state.protection && protectedRow === false)
      restoreRetainedWindowCandidate(paragraph);
    paragraph.textSourcePolicyError = error;
    if (error !== null) {
      paragraph.selectable = paragraph.clipped !== true && (paragraph.selectable === true || paragraph.editable === true);
      paragraph.editable = false;
    }
  }
  content.readOnly = !content.paragraphs.some((paragraph) => paragraph.editable === true);
  return content;
}

// web/preview/hwpx-formulas-content.mjs
function attachHwpxFormulas(editor, content) {
  if (content.window && !Array.isArray(content.tables))
    throw new Error("MissingWindowTableOwnership");
  content.formulas = [];
  content.formulaErrors = [];
  content.formulaDefinitionAvailable = typeof editor.setFormulaDefinition === "function";
  const sections = [...new Set(content.paragraphs.map((paragraph) => paragraph.section))];
  for (const section of sections) {
    try {
      if (editor.formulaSources(section).length === 0)
        continue;
      const selected = content.window ? new Set(content.tables.filter((table) => table.section === section).map((table) => table.tableNode)) : null;
      for (const row of editor.formulaCurrent(section)) {
        if (selected && !selected.has(row.owner.table))
          continue;
        content.formulas.push({
          section,
          beginElement: row.begin_element,
          owner: row.owner,
          ...row.values
        });
      }
    } catch (error) {
      content.formulaErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwpx-created-cell-display.mjs
function hwpxCreatedCellDisplay(table, shapes) {
  const shape = shapes?.find((shape) => shape.id === table.resources.paragraph);
  if (!shape)
    return {};
  const insets = sourceTableCellInsets({ sourceGeometry: { in_margin: [0, 0, 0, 0] } }, { sourceMargin: { has_margin: false } });
  return {
    displayFormat: "hwpx",
    displayParagraphShape: hwpxParagraphGeometry(shape),
    displayInsets: insets
  };
}

// web/preview/created-table-content.mjs
function attachCreatedTables(editor, content, available, maxUnits, sectionCount) {
  const visible = new Set(content.paragraphs.map((p) => `${p.section}:${p.paragraph}`));
  const rows = [];
  const pending = new Set;
  let units = 0;
  let paragraphShapes;
  const softLineBreakAvailable = available && editor.supportsCreatedCellSoftLineBreaks?.() === true;
  const sections = sectionCount === undefined ? new Set(content.paragraphs.map((p) => p.section)) : Array.from({ length: sectionCount }, (_, index) => index);
  if (available)
    for (const section of sections) {
      for (const table of editor.createdTables(section)) {
        pending.add(section);
        const hostParagraph = table.host_paragraph - 1;
        if (!visible.has(`${section}:${hostParagraph}`))
          continue;
        if (paragraphShapes === undefined) {
          try {
            paragraphShapes = typeof editor.paragraphShapes === "function" ? editor.paragraphShapes() : null;
          } catch (error) {
            paragraphShapes = null;
            content.createdTableParagraphDisplayError = error.message;
          }
        }
        for (const cell of table.cells) {
          units += cell.text.length;
          if (units > maxUnits)
            throw new Error("CreatedTableDisplayTextBudgetExceeded");
        }
        rows.push({
          ...table,
          ...hwpxCreatedCellDisplay(table, paragraphShapes),
          cells: table.cells.map((cell) => ({
            ...cell,
            ...softLineBreakAvailable ? { softLineBreakAvailable: true } : {}
          })),
          section,
          hostParagraph,
          anchorUnit: table.anchor_unit
        });
      }
    }
  content.createdTables = rows;
  content.createdTableHostPending = pending.size !== 0;
  const modes = new Map;
  if (pending.size)
    for (const section of new Set(content.paragraphs.map((p) => p.section))) {
      const query = typeof editor.createdTableHostMode === "function";
      modes.set(section, {
        plain: query && editor.createdTableHostMode(section),
        anchored: query && editor.createdTableHostMode(section, true),
        fields: typeof editor.createdTableFieldLabelMode === "function" && editor.createdTableFieldLabelMode(section)
      });
    }
  for (const paragraph of content.paragraphs)
    if (pending.size) {
      const mode = modes.get(paragraph.section);
      paragraph.plainEditable = !!paragraph.plainEditable && mode.plain === true;
      paragraph.anchorEditable = !!paragraph.anchorEditable && mode.anchored === true;
      paragraph.fieldLabels = mode.fields === true ? paragraph.fieldLabels ?? [] : [];
      paragraph.editable = paragraph.plainEditable || paragraph.anchorEditable || paragraph.fieldLabels.length > 0;
      paragraph.anchoredSplitAvailable = false;
      paragraph.nextMergeParagraph = null;
      paragraph.previousMergeParagraph = null;
      if (!paragraph.editable)
        paragraph.readOnlyReason = "UnsupportedCreatedTableHostEdit";
    }
  content.readOnly = !content.paragraphs.some((paragraph) => paragraph.editable);
  content.tableCreationAvailable = available;
  return content;
}

// web/preview/automatic-number-display-snapshot.mjs
function createAutomaticNumberDisplaySnapshot(editor) {
  const sections = new Map;
  return (section) => {
    if (!sections.has(section)) {
      const sources = new Map(editor.automaticNumberSources(section).map((row) => [row.number_node, row]));
      const sites = editor.automaticNumberSites(section);
      sections.set(section, { sources, sites });
    }
    return sections.get(section);
  };
}

// web/preview/automatic-number-content.mjs
function retainedNoteSource(source, site) {
  return source && source.anchor_node === site.anchor_node && site.anchor_unit === 0 && ["FOOTNOTE", "ENDNOTE"].includes(source.values?.raw?.[1]);
}
function retainedAutomaticNumberPlainText(editor, section, paragraph, _flattenedText, anchored, snapshot = createAutomaticNumberDisplaySnapshot(editor)) {
  if (!anchored.startsWith("￼"))
    return anchored;
  const { sources, sites } = snapshot(section);
  for (const site of sites) {
    if (site.paragraph === paragraph && retainedNoteSource(sources.get(site.number_node), site)) {
      if (editor.canEdit(section, paragraph) !== true)
        return anchored;
      return anchored.slice(1);
    }
  }
  return anchored;
}
function attachAutomaticNumbers(editor, content, snapshot = createAutomaticNumberDisplaySnapshot(editor)) {
  content.automaticNumberErrors = [];
  for (const paragraph of content.paragraphs) {
    paragraph.automaticNumbers = [];
    paragraph.automaticNumberPrefixes = [];
  }
  const paragraphs = new Map(content.paragraphs.map((p) => [`${p.section}:${p.paragraph}`, p]));
  const sections = [...new Set(content.paragraphs.map((p) => p.section))];
  for (const section of sections) {
    try {
      const { sources, sites } = snapshot(section);
      for (const site of sites) {
        if (site.paragraph === null)
          continue;
        const paragraph = paragraphs.get(`${section}:${site.paragraph - 1}`);
        if (!paragraph || paragraph.clipped)
          continue;
        const source = sources.get(site.number_node);
        if (retainedNoteSource(source, site) && paragraph.plainEditable && editor.canEdit(section, site.paragraph) && editor.anchorText(section, site.paragraph) === "￼" + paragraph.text) {
          paragraph.automaticNumberPrefixes.push({
            numberNode: site.number_node,
            anchorNode: site.anchor_node,
            source
          });
          continue;
        }
        if (!source || source.anchor_node !== site.anchor_node || paragraph.text[site.anchor_unit] !== "￼") {
          content.automaticNumberErrors.push({
            section,
            numberNode: site.number_node,
            error: "AutomaticNumberBindingMismatch"
          });
          continue;
        }
        paragraph.automaticNumbers.push({
          numberNode: site.number_node,
          anchorNode: site.anchor_node,
          unit: site.anchor_unit,
          source
        });
      }
    } catch (error) {
      content.automaticNumberErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/note-reference-content.mjs
function attachNoteReferences(editor, content) {
  content.noteReferenceErrors = [];
  for (const paragraph of content.paragraphs)
    paragraph.automaticNumbers = (paragraph.automaticNumbers ?? []).filter((row) => row.kind !== "note-reference");
  for (const section of new Set(content.paragraphs.map((p) => p.section))) {
    try {
      const sources = new Map(editor.automaticNumberSources(section).map((row) => [row.number_node, row]));
      for (const site of editor.noteReferenceSites(section)) {
        const paragraph = content.paragraphs.find((p) => p.section === section && p.paragraph === site.paragraph - 1);
        if (!paragraph || paragraph.clipped)
          continue;
        const source = sources.get(site.number_node);
        if (!source || !["FOOTNOTE", "ENDNOTE"].includes(source.values?.raw?.[1]) || paragraph.text[site.anchor_unit] !== "￼" || paragraph.automaticNumbers.some((row) => row.unit === site.anchor_unit)) {
          content.noteReferenceErrors.push({
            section,
            noteNode: site.note_node,
            error: "NoteReferenceBindingMismatch"
          });
          continue;
        }
        paragraph.automaticNumbers.push({
          numberNode: site.number_node,
          anchorNode: site.anchor_node,
          noteNode: site.note_node,
          unit: site.anchor_unit,
          source,
          kind: "note-reference"
        });
      }
    } catch (error) {
      content.noteReferenceErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/document-save.mjs
function saveDocument(editor, format, allowStaleLayout = false) {
  if (!editor)
    throw new Error("EditorNotOpen");
  if (typeof allowStaleLayout !== "boolean")
    throw new TypeError("InvalidStaleLayoutPolicy");
  if (format === "hwpx")
    return { bytes: editor.save(), format, layoutRequiresReflow: true };
  if (format === "hwp5")
    return { ...editor.save({ allowStaleLayout }), format };
  throw new Error("UnknownDocumentFormat");
}

// web/preview/field-link-display-guard.mjs
function createFieldLinkDisplayGuard() {
  const failures = new Map;
  const reasons = new Map;
  return {
    read(section, query, fallback, scope = "links") {
      if (failures.get(section)?.has(scope))
        return fallback;
      try {
        return query();
      } catch (error) {
        if (error.message !== "InvalidFieldLinks")
          throw error;
        if (!failures.has(section))
          failures.set(section, new Set);
        failures.get(section).add(scope);
        reasons.set(section, error.message);
        return fallback;
      }
    },
    reason(section) {
      return reasons.get(section) ?? null;
    }
  };
}

// web/preview/paragraph-dependency-plan.mjs
function planParagraphDependencies({ total, offset, count, dependencies, maxParagraphs }) {
  if (![total, offset, count, maxParagraphs].every((value) => Number.isSafeInteger(value) && value >= 0) || offset > total || count > total - offset || !(dependencies instanceof Map))
    throw new RangeError("InvalidParagraphWindow");
  const valid = (ordinal) => Number.isSafeInteger(ordinal) && ordinal >= 0 && ordinal < total;
  for (const [ordinal, required] of dependencies) {
    if (!valid(ordinal) || !Array.isArray(required) || required.some((value) => !valid(value)) || new Set(required).size !== required.length)
      throw new RangeError("InvalidParagraphDependencies");
  }
  if (count > maxParagraphs)
    throw new RangeError("ParagraphWindowBudgetExceeded");
  const selected = new Set, queue = [];
  const add = (ordinal) => {
    if (selected.has(ordinal))
      return;
    if (selected.size >= maxParagraphs)
      throw new RangeError("ParagraphWindowBudgetExceeded");
    selected.add(ordinal);
    queue.push(ordinal);
  };
  for (let ordinal = offset;ordinal < offset + count; ordinal++)
    add(ordinal);
  for (let index = 0;index < queue.length; index++)
    for (const ordinal of dependencies.get(queue[index]) ?? [])
      add(ordinal);
  return {
    requestedOffset: offset,
    requestedCount: count,
    ordinals: [...selected].sort((a, b) => a - b)
  };
}

// web/preview/hwp5-window-identities.mjs
function hwp5WindowIdentities(projection) {
  const ordinals = new Map;
  for (const [index, section] of projection.sections.entries()) {
    if (section.index !== index)
      throw new Error("WindowDependencyBindingMismatch");
    for (let paragraph = 0;paragraph < section.paragraphs.length; paragraph++)
      ordinals.set(`${index}:${paragraph}`, ordinals.size);
  }
  const resolve = (section, paragraph) => {
    if (!Number.isSafeInteger(section) || !Number.isSafeInteger(paragraph) || section < 0 || paragraph < 0)
      throw new Error("WindowDependencyBindingMismatch");
    const ordinal = ordinals.get(`${section}:${paragraph}`);
    if (ordinal === undefined)
      throw new Error("WindowDependencyBindingMismatch");
    return ordinal;
  };
  return { total: ordinals.size, ordinals, resolve };
}

// web/preview/hwp5-table-window-dependencies.mjs
function hwp5TableWindowDependencies(editor, projection) {
  const { ordinals, resolve } = hwp5WindowIdentities(projection), dependencies = new Map;
  const link = (child, parent) => {
    if (child === parent)
      return;
    if (!dependencies.has(child))
      dependencies.set(child, []);
    const values = dependencies.get(child);
    if (!values.includes(parent))
      values.push(parent);
  };
  for (const { index: section } of projection.sections) {
    const placements = new Map, owners = new Map, represented = new Set;
    for (const row of editor.tablePlacements(section)) {
      if (placements.has(row.tableNode))
        throw new Error("WindowDependencyBindingMismatch");
      resolve(section, row.paragraph);
      placements.set(row.tableNode, row);
    }
    for (const row of editor.tableBindings(section)) {
      const placement = placements.get(row.tableNode);
      if (!placement || owners.has(row.paragraph))
        throw new Error("WindowDependencyBindingMismatch");
      owners.set(row.paragraph, row);
      const child = resolve(section, row.paragraph), host = resolve(section, placement.paragraph);
      link(child, host);
      if (!represented.has(row.tableNode)) {
        represented.add(row.tableNode);
        link(host, child);
      }
    }
    for (const row of placements.values()) {
      if (row.parentTableNode == null) {
        if (row.parentListNode != null || owners.has(row.paragraph))
          throw new Error("WindowDependencyBindingMismatch");
      } else {
        const parent = placements.get(row.parentTableNode), owner = owners.get(row.paragraph);
        if (!parent || parent === row || owner?.tableNode !== parent.tableNode || owner.listNode !== row.parentListNode)
          throw new Error("WindowDependencyBindingMismatch");
      }
      const seen = new Set;
      let current = row;
      while (current) {
        if (seen.has(current.tableNode))
          throw new Error("WindowDependencyOwnershipCycle");
        seen.add(current.tableNode);
        current = current.parentTableNode == null ? null : placements.get(current.parentTableNode);
      }
    }
  }
  return { total: ordinals.size, ordinals, dependencies };
}

// web/preview/hwp5-list-window-dependencies.mjs
function hwp5ListWindowDependencies(editor, projection) {
  const { total, ordinals, resolve } = hwp5WindowIdentities(projection), dependencies = new Map;
  const link = (child, parent) => {
    if (child === parent)
      return;
    if (!dependencies.has(child))
      dependencies.set(child, []);
    const values = dependencies.get(child);
    if (!values.includes(parent))
      values.push(parent);
  };
  for (const section of projection.sections) {
    const flows = editor.paragraphFlow(section.index), claimed = new Set, lists = new Set;
    if (flows.length !== section.paragraphs.length || flows.some((row, index) => row.paragraph !== index))
      throw new Error("WindowDependencyBindingMismatch");
    const attach = (source, host, kind) => {
      if (lists.has(source.list_node))
        throw new Error("WindowDependencyBindingMismatch");
      lists.add(source.list_node);
      const hostOrdinal = resolve(section.index, host);
      const members = flows.filter((row) => row.host === kind && row.list_node === source.list_node && row.parent_node === source.control_node);
      if (!members.length && source.paragraph_count !== 0)
        throw new Error("MissingWindowListBody");
      for (const row of members) {
        if (claimed.has(row.paragraph))
          throw new Error("WindowDependencyBindingMismatch");
        claimed.add(row.paragraph);
        const child = resolve(section.index, row.paragraph);
        if (child === hostOrdinal)
          throw new Error("WindowDependencyBindingMismatch");
        link(child, hostOrdinal);
        link(hostOrdinal, child);
      }
    };
    const placements = new Map;
    for (const row of editor.tablePlacements(section.index)) {
      if (placements.has(row.tableNode))
        throw new Error("WindowDependencyBindingMismatch");
      placements.set(row.tableNode, row);
    }
    const captions = editor.captionSources(section.index), layouts = new Map;
    if (captions.length)
      for (const row of editor.tableLayoutSources(section.index)) {
        if (layouts.has(row.table_record_node))
          throw new Error("WindowDependencyBindingMismatch");
        layouts.set(row.table_record_node, row);
      }
    for (const caption of captions) {
      const placement = placements.get(caption.table_record_node);
      if (!placement || layouts.get(caption.table_record_node)?.table_node !== caption.control_node)
        throw new Error("WindowDependencyBindingMismatch");
      attach(caption, placement.paragraph, "table_caption");
    }
    for (const note of editor.noteSources(section.index)) {
      if (!["footnote", "endnote"].includes(note.kind))
        throw new Error("WindowDependencyBindingMismatch");
      attach(note, note.paragraph, note.kind);
    }
    if (flows.some((row) => ["table_caption", "footnote", "endnote"].includes(row.host) && !claimed.has(row.paragraph)))
      throw new Error("WindowDependencyBindingMismatch");
  }
  return { total, ordinals, dependencies };
}

// web/preview/hwp5-drawing-window-dependencies.mjs
function hwp5DrawingWindowDependencies(editor, projection) {
  const { total, ordinals, resolve } = hwp5WindowIdentities(projection), dependencies = new Map;
  const link = (child, parent) => {
    if (child === parent)
      throw new Error("WindowDependencyBindingMismatch");
    if (!dependencies.has(child))
      dependencies.set(child, []);
    const values = dependencies.get(child);
    if (!values.includes(parent))
      values.push(parent);
  };
  for (const section of projection.sections) {
    const flows = editor.paragraphFlow(section.index), claimed = new Set;
    if (flows.length !== section.paragraphs.length || flows.some((row, index) => row.paragraph !== index))
      throw new Error("WindowDependencyBindingMismatch");
    const drawingMembers = new Map;
    for (const row of flows) {
      if (row.host !== "drawing")
        continue;
      if (![row.parent_node, row.list_node].every((value) => Number.isInteger(value) && value >= 0 && value <= 4294967295))
        throw new Error("WindowDependencyBindingMismatch");
      const key = `${row.parent_node}:${row.list_node}`;
      if (!drawingMembers.has(key))
        drawingMembers.set(key, []);
      drawingMembers.get(key).push(row);
    }
    const lists = validateHwp5DrawingListSources(editor.drawingListSources(section.index));
    const anchors = new Map(validateHwp5DrawingAnchors(editor.drawingAnchors(section.index)).map((row) => [
      row.control_node,
      row
    ]));
    const components = lists.some((row) => row.kind === "body") ? new Map(validateHwp5DrawingComponentSources(editor.drawingComponentSources(section.index)).map((row) => [row.component_node, row])) : new Map;
    const root = (node) => {
      const seen = new Set;
      while (true) {
        if (seen.has(node))
          throw new Error("WindowDependencyOwnershipCycle");
        seen.add(node);
        const component = components.get(node);
        if (!component)
          throw new Error("WindowDependencyBindingMismatch");
        const anchor = anchors.get(component.owner_node);
        if (anchor) {
          if (anchor.component_node !== component.component_node)
            throw new Error("WindowDependencyBindingMismatch");
          return anchor.control_node;
        }
        node = component.owner_node;
      }
    };
    for (const source of lists) {
      const anchor = anchors.get(source.control_node);
      if (!anchor || source.kind === "body" && root(source.owner_node) !== source.control_node)
        throw new Error("WindowDependencyBindingMismatch");
      const host = resolve(section.index, anchor.paragraph);
      const members = drawingMembers.get(`${source.owner_node}:${source.list_node}`) ?? [];
      if (!members.length && source.paragraph_count !== 0)
        throw new Error("MissingWindowDrawingBody");
      for (const row of members) {
        if (claimed.has(row.paragraph))
          throw new Error("WindowDependencyBindingMismatch");
        claimed.add(row.paragraph);
        const child = resolve(section.index, row.paragraph);
        link(child, host);
        link(host, child);
      }
    }
    if (flows.some((row) => row.host === "drawing" && !claimed.has(row.paragraph)))
      throw new Error("WindowDependencyBindingMismatch");
  }
  return { total, ordinals, dependencies };
}

// web/preview/hwp5-field-window-topology.mjs
function readHwp5WindowFields(editor, section) {
  try {
    return { spans: validateHwp5FieldSpans(editor.fieldSpans(section)), unresolved: [] };
  } catch (error) {
    if (error?.message !== "UnsupportedCrossParagraphField" || editor.supportsFieldTopology?.() !== true)
      throw error;
    const report = validateHwp5FieldTopology(editor.fieldTopology(section));
    if (report.unresolved.length === 0)
      throw error;
    return report;
  }
}

// web/preview/hwp5-unresolved-field-dependencies.mjs
var key = (row) => JSON.stringify([row.host, row.parent_node, row.list_node]);
function linkHwp5UnresolvedFieldOwners(section, flows, markers, resolve, link) {
  if (markers.length === 0)
    return;
  const groups = new Map, linked = new Set;
  for (const row of flows) {
    const owner = key(row);
    if (!groups.has(owner))
      groups.set(owner, []);
    groups.get(owner).push(row.paragraph);
  }
  for (const marker of markers) {
    const anchor = resolve(section.index, marker.position.paragraph), owner = flows[marker.position.paragraph];
    const units = section.paragraphs[marker.position.paragraph].declaredUnits;
    if (!Number.isSafeInteger(units) || units < 0 || owner.list_node !== marker.list_node || marker.position.unit > units)
      throw new Error("WindowDependencyBindingMismatch");
    const identity = key(owner);
    if (linked.has(identity))
      continue;
    linked.add(identity);
    for (const paragraph of groups.get(identity)) {
      const member = resolve(section.index, paragraph);
      link(member, anchor);
      link(anchor, member);
    }
  }
}

// web/preview/hwp5-field-window-dependencies.mjs
function hwp5FieldWindowDependencies(editor, projection) {
  const { total, ordinals, resolve } = hwp5WindowIdentities(projection), dependencies = new Map;
  const fieldTopologyDiagnostics = new Map;
  const link = (child, parent) => {
    if (child === parent)
      return;
    if (!dependencies.has(child))
      dependencies.set(child, []);
    const values = dependencies.get(child);
    if (!values.includes(parent))
      values.push(parent);
  };
  const sameOwner = (a, b) => a.host === b.host && a.parent_node === b.parent_node && a.list_node === b.list_node;
  for (const section of projection.sections) {
    const flows = editor.paragraphFlow(section.index);
    if (flows.length !== section.paragraphs.length || flows.some((row, index) => row.paragraph !== index))
      throw new Error("WindowDependencyBindingMismatch");
    const report = readHwp5WindowFields(editor, section.index);
    linkHwp5UnresolvedFieldOwners(section, flows, report.unresolved, resolve, link);
    if (report.unresolved.length)
      fieldTopologyDiagnostics.set(section.index, report.unresolved);
    for (const span of report.spans) {
      const first = resolve(section.index, span.begin.paragraph);
      resolve(section.index, span.end.paragraph);
      const owner = flows[span.begin.paragraph];
      if (!sameOwner(owner, flows[span.end.paragraph]))
        throw new Error("WindowDependencyBindingMismatch");
      for (let paragraph = span.begin.paragraph;paragraph <= span.end.paragraph; paragraph++) {
        if (!sameOwner(owner, flows[paragraph]))
          continue;
        const member = resolve(section.index, paragraph);
        link(member, first);
        link(first, member);
      }
    }
  }
  return { total, ordinals, dependencies, fieldTopologyDiagnostics };
}

// web/preview/hwp5-column-window-dependencies.mjs
function boundHwp5ColumnSources(editor, section, flows) {
  const declarations = new Map;
  for (const source of editor.columnSources(section)) {
    const owner = flows[source.current_paragraph];
    if (!owner || owner.generated || owner.source_node !== source.paragraph_node || declarations.has(source.current_paragraph))
      throw new Error("WindowDependencyBindingMismatch");
    declarations.set(source.current_paragraph, source);
  }
  return declarations;
}
function hwp5ColumnWindowDependencies(editor, projection) {
  const { total, ordinals, resolve } = hwp5WindowIdentities(projection), dependencies = new Map;
  for (const section of projection.sections) {
    const flows = editor.paragraphFlow(section.index), active = new Map;
    if (flows.length !== section.paragraphs.length || flows.some((row, index) => row.paragraph !== index))
      throw new Error("WindowDependencyBindingMismatch");
    const declarations = boundHwp5ColumnSources(editor, section.index, flows);
    for (const flow of flows) {
      const scope = `${flow.host}:${flow.parent_node}:${flow.list_node}`;
      const previous = active.get(scope);
      if (declarations.has(flow.paragraph) && previous !== undefined && previous !== flow.paragraph) {
        dependencies.set(resolve(section.index, flow.paragraph), [
          resolve(section.index, previous)
        ]);
      }
      if (declarations.has(flow.paragraph))
        active.set(scope, flow.paragraph);
      const owner = active.get(scope);
      if (owner === undefined || owner === flow.paragraph)
        continue;
      dependencies.set(resolve(section.index, flow.paragraph), [resolve(section.index, owner)]);
    }
  }
  return { total, ordinals, dependencies };
}

// web/preview/hwp5-repeated-window-dependencies.mjs
function hwp5RepeatedWindowDependencies(editor, projection) {
  const { total, ordinals, resolve } = hwp5WindowIdentities(projection), dependencies = new Map;
  const link = (child, parent) => {
    if (child === parent)
      return;
    if (!dependencies.has(child))
      dependencies.set(child, []);
    const values = dependencies.get(child);
    if (!values.includes(parent))
      values.push(parent);
  };
  for (const section of projection.sections) {
    const flows = editor.paragraphFlow(section.index), claimed = new Set;
    if (flows.length !== section.paragraphs.length || flows.some((row, index) => row.paragraph !== index))
      throw new Error("WindowDependencyBindingMismatch");
    const anchors = new Map(editor.structuralAnchors(section.index).map((row) => [row.control_node, row]));
    const sources = [
      ...validateHwp5PageAreaSources(editor.pageAreaSources(section.index)).map((row) => ({
        ...row,
        anchorKind: row.kind
      })),
      ...validateHwp5MasterPageSources(editor.masterPageSources(section.index)).map((row) => ({
        ...row,
        kind: "master_page",
        anchorKind: "section"
      }))
    ];
    for (const source of sources) {
      const anchor = anchors.get(source.owner_node);
      if (!anchor || anchor.kind !== source.anchorKind)
        throw new Error("WindowDependencyBindingMismatch");
      const host = resolve(section.index, anchor.paragraph);
      const members = flows.filter((row) => row.host === source.kind && row.parent_node === source.owner_node && row.list_node === source.list_node);
      if (!members.length && source.paragraph_count !== 0)
        throw new Error("MissingWindowRepeatedBody");
      for (const row of members) {
        if (claimed.has(row.paragraph))
          throw new Error("WindowDependencyBindingMismatch");
        claimed.add(row.paragraph);
        const child = resolve(section.index, row.paragraph);
        link(child, host);
        link(host, child);
      }
      for (const row of flows)
        if (row.host === "body")
          link(resolve(section.index, row.paragraph), host);
    }
    if (flows.some((row) => ["header", "footer", "master_page"].includes(row.host) && !claimed.has(row.paragraph)))
      throw new Error("WindowDependencyBindingMismatch");
  }
  return { total, ordinals, dependencies };
}

// web/preview/hwp5-page-control-window-dependencies.mjs
function hwp5PageControlWindowDependencies(editor, projection) {
  const { total, ordinals, resolve } = hwp5WindowIdentities(projection), dependencies = new Map;
  for (const section of projection.sections) {
    const flows = editor.paragraphFlow(section.index);
    if (flows.length !== section.paragraphs.length || flows.some((row, index) => row.paragraph !== index))
      throw new Error("WindowDependencyBindingMismatch");
    const hosts = [
      ...new Set(validateHwp5PageControlSources(editor.pageControlSources(section.index)).map((row) => resolve(section.index, row.paragraph)))
    ];
    for (const row of flows)
      if (row.host === "body") {
        const child = resolve(section.index, row.paragraph), parents = hosts.filter((host) => host !== child);
        if (parents.length)
          dependencies.set(child, parents);
      }
  }
  return { total, ordinals, dependencies };
}

// web/preview/hwp5-window-flows.mjs
function memoHwp5WindowFlows(editor) {
  const scoped = Object.create(editor), flows = new Map;
  scoped.paragraphFlow = (section) => {
    if (!flows.has(section))
      flows.set(section, editor.paragraphFlow(section));
    return flows.get(section);
  };
  return scoped;
}
function hwp5WindowFlows(editor, content) {
  if (!content.window)
    throw new Error("MissingParagraphWindow");
  const displayed = new Set(content.paragraphs.map((row) => `${row.section}:${row.paragraph}`));
  if (displayed.size !== content.paragraphs.length)
    throw new Error("WindowDependencyBindingMismatch");
  const completeFlows = new Map, selectedFlows = [];
  for (const section of new Set(content.paragraphs.map((row) => row.section))) {
    const flows = editor.paragraphFlow(section);
    if (flows.length !== editor.paragraphCount(section) || flows.some((row, index) => row.paragraph !== index))
      throw new Error("WindowDependencyBindingMismatch");
    completeFlows.set(section, flows);
    selectedFlows.push(...flows.filter((row) => displayed.has(`${section}:${row.paragraph}`)).map((row) => ({ ...row, section })));
  }
  if (selectedFlows.length !== displayed.size)
    throw new Error("WindowDependencyBindingMismatch");
  return { displayed, completeFlows, selectedFlows };
}

// web/preview/hwp5-owned-window-dependencies.mjs
function compose([first, ...rest]) {
  for (const found of rest)
    if (first.total !== found.total || first.ordinals.size !== found.ordinals.size || [...first.ordinals].some(([key, ordinal]) => found.ordinals.get(key) !== ordinal))
      throw new Error("WindowDependencyBindingMismatch");
  const dependencies = new Map;
  for (const source of [first, ...rest])
    for (const [child, required] of source.dependencies) {
      if (!dependencies.has(child))
        dependencies.set(child, []);
      const values = dependencies.get(child);
      for (const parent of required)
        if (!values.includes(parent))
          values.push(parent);
    }
  return { total: first.total, ordinals: first.ordinals, dependencies };
}
function hwp5OwnedWindowDependencies(editor, projection) {
  return compose([
    hwp5TableWindowDependencies(editor, projection),
    hwp5ListWindowDependencies(editor, projection),
    hwp5DrawingWindowDependencies(editor, projection)
  ]);
}
function hwp5FieldOwnedWindowDependencies(editor, projection) {
  editor = memoHwp5WindowFlows(editor);
  const fields = hwp5FieldWindowDependencies(editor, projection);
  return {
    ...compose([
      hwp5OwnedWindowDependencies(editor, projection),
      fields,
      hwp5ColumnWindowDependencies(editor, projection),
      hwp5RepeatedWindowDependencies(editor, projection),
      hwp5PageControlWindowDependencies(editor, projection)
    ]),
    fieldTopologyDiagnostics: fields.fieldTopologyDiagnostics
  };
}

// web/preview/hwp5-window-projection.mjs
function projectHwp5DependencyWindow(editor, projection, { offset, count, maxParagraphs = 20000, maxUnits = 200000 }, discover) {
  if (!Number.isSafeInteger(maxUnits) || maxUnits < 0)
    throw new RangeError("InvalidDisplayBounds");
  const total = projection.sections.reduce((sum, section) => sum + section.paragraphs.length, 0);
  planParagraphDependencies({ total, offset, count, maxParagraphs, dependencies: new Map });
  const found = discover(editor, projection);
  const plan = planParagraphDependencies({ ...found, offset, count, maxParagraphs });
  const content = displayContent(projection, {
    paragraphOrdinals: plan.ordinals,
    maxParagraphs,
    maxUnits
  });
  if (content.paragraphs.some((row) => row.clipped))
    throw new RangeError("ParagraphWindowTextBudgetExceeded");
  for (const paragraph of content.paragraphs) {
    const ordinal = found.ordinals.get(`${paragraph.section}:${paragraph.paragraph}`);
    if (!Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal >= total)
      throw new Error("WindowDependencyBindingMismatch");
    paragraph.windowOrdinal = ordinal;
    paragraph.windowContext = ordinal < offset || ordinal >= offset + count;
    if (found.fieldTopologyDiagnostics?.has(paragraph.section)) {
      paragraph.fieldTopologyEditableCandidate = paragraph.editable === true;
      paragraph.selectable = !paragraph.windowContext && (paragraph.selectable === true || paragraph.editable === true);
      paragraph.editable = false;
      paragraph.fieldTopologyError = "UnresolvedFieldMarkers";
    }
    if (paragraph.windowContext) {
      paragraph.editable = false;
      paragraph.selectable = false;
    }
  }
  const diagnostics = [...found.fieldTopologyDiagnostics ?? []].filter(([section]) => content.paragraphs.some((row) => row.section === section)).map(([section, unresolved]) => ({ section, unresolved }));
  if (diagnostics.length) {
    content.fieldTopologyDiagnostics = diagnostics;
    content.readOnly = !content.paragraphs.some((row) => row.editable === true);
  }
  return {
    ...content,
    window: {
      requestedOffset: offset,
      requestedCount: count,
      paragraphOffset: offset,
      paragraphCount: count,
      contextCount: plan.ordinals.length - count
    }
  };
}
function projectHwp5FieldOwnedWindow(editor, projection, options) {
  return projectHwp5DependencyWindow(editor, projection, options, hwp5FieldOwnedWindowDependencies);
}

// web/preview/hwp5-window-note-content.mjs
function attachHwp5WindowNotes(editor, content) {
  const { displayed, completeFlows, selectedFlows } = hwp5WindowFlows(editor, content);
  content.currentParagraphFlows = selectedFlows;
  const scoped = Object.create(editor);
  scoped.noteSources = (section) => {
    const rows = validateHwp5NoteSources(editor.noteSources(section)).filter((row) => displayed.has(`${section}:${row.paragraph}`));
    for (const source of rows) {
      const members = completeFlows.get(section).filter((row) => row.host === source.kind && row.parent_node === source.control_node && row.list_node === source.list_node);
      if (members.some((row) => !displayed.has(`${section}:${row.paragraph}`)))
        throw new Error("MissingHwp5NoteBody");
    }
    return rows;
  };
  for (const section of completeFlows.keys())
    scoped.noteSources(section);
  return attachHwp5Notes(scoped, content);
}

// web/preview/hwp5-window-caption-content.mjs
function attachHwp5WindowCaptions(editor, content) {
  const { displayed, completeFlows, selectedFlows } = hwp5WindowFlows(editor, content);
  content.currentParagraphFlows = selectedFlows;
  const scoped = Object.create(editor);
  scoped.captionSources = (section) => {
    const selected = new Set((content.tables ?? []).filter((row) => row.section === section).map((row) => row.tableNode));
    const rows = validateHwp5CaptionSources(editor.captionSources(section)).filter((row) => selected.has(row.table_record_node));
    for (const source of rows) {
      const members = completeFlows.get(section).filter((row) => row.host === "table_caption" && row.parent_node === source.control_node && row.list_node === source.list_node);
      if (members.some((row) => !displayed.has(`${section}:${row.paragraph}`)))
        throw new Error("MissingHwp5CaptionBody");
    }
    return rows;
  };
  for (const section of completeFlows.keys())
    scoped.captionSources(section);
  return attachHwp5Captions(scoped, content);
}

// web/preview/hwp5-window-drawing-content.mjs
function attachHwp5WindowDrawings(editor, content) {
  const { displayed, completeFlows, selectedFlows } = hwp5WindowFlows(editor, content);
  content.currentParagraphFlows = selectedFlows;
  const sections = new Map, scoped = Object.create(editor);
  const selected = (section) => {
    if (sections.has(section))
      return sections.get(section);
    const anchors = editor.drawingAnchors(section).filter((row) => displayed.has(`${section}:${row.paragraph}`));
    const controls = new Set(anchors.map((row) => row.control_node)), components = new Set;
    const rows = editor.drawingComponentSources(section);
    for (const row of rows) {
      if (row.second_id !== null ? controls.has(row.owner_node) : components.has(row.owner_node))
        components.add(row.component_node);
    }
    const result = { anchors, controls, components, rows };
    sections.set(section, result);
    return result;
  };
  scoped.drawingAnchors = (section) => selected(section).anchors;
  scoped.drawingSources = (section) => editor.drawingSources(section).filter((row) => selected(section).controls.has(row.control_node));
  scoped.drawingComponentSources = (section) => selected(section).rows.filter((row) => selected(section).components.has(row.component_node));
  scoped.drawingListSources = (section) => {
    const rows = editor.drawingListSources(section).filter((row) => selected(section).controls.has(row.control_node));
    for (const source of rows) {
      const members = completeFlows.get(section).filter((row) => row.host === "drawing" && row.parent_node === source.owner_node && row.list_node === source.list_node);
      if (members.some((row) => !displayed.has(`${section}:${row.paragraph}`)))
        throw new Error("MissingHwp5DrawingBodyParagraph");
    }
    return rows;
  };
  for (const name of [
    "drawingMatrixSources",
    "drawingLocalTransforms",
    "drawingRectangleCorners",
    "drawingStyleSources"
  ]) {
    scoped[name] = (section, ...options) => editor[name](section, ...options).filter((row) => selected(section).components.has(row.component_node));
  }
  return attachHwp5Drawings(scoped, content);
}

// web/preview/hwp5-window-picture-content.mjs
function attachHwp5WindowPictures(editor, content) {
  if (!content.window)
    throw new Error("MissingParagraphWindow");
  const scoped = Object.create(editor);
  const selected = (section) => new Set((content.hwp5DrawingComponents ?? []).filter((row) => row.section === section).map((row) => row.component_node));
  for (const name of ["pictureSources", "pictureTailSources"]) {
    scoped[name] = (section, ...options) => editor[name](section, ...options).filter((row) => selected(section).has(row.component_node));
  }
  return attachHwp5PictureTails(scoped, attachHwp5Pictures(scoped, content));
}

// web/preview/hwp5-window-object-content.mjs
function attachHwp5WindowObjects(editor, preview, content) {
  if (!content.window)
    throw new Error("MissingParagraphWindow");
  const scoped = memoHwp5WindowFlows(editor);
  attachHwp5Tables(scoped, preview, content);
  attachHwp5WindowNotes(scoped, content);
  attachHwp5WindowCaptions(scoped, content);
  attachHwp5WindowDrawings(scoped, content);
  return attachHwp5WindowPictures(scoped, content);
}

// web/preview/hwp5-window-column-content.mjs
function attachHwp5WindowColumns(editor, content) {
  const { displayed, completeFlows } = hwp5WindowFlows(editor, content);
  content.columnSources = [];
  for (const [section, flows] of completeFlows) {
    const sources = boundHwp5ColumnSources(editor, section, flows);
    for (const source of sources.values())
      if (displayed.has(`${section}:${source.current_paragraph}`))
        content.columnSources.push({ ...source, section });
  }
  return attachHwp5ColumnDisplay(content);
}

// web/preview/hwp5-window-structural-content.mjs
function attachHwp5WindowStructuralAnchors(editor, content) {
  const { displayed, completeFlows } = hwp5WindowFlows(editor, content), scoped = Object.create(editor);
  scoped.structuralAnchors = (section) => {
    if (!completeFlows.has(section))
      return [];
    const rows = editor.structuralAnchors(section), controls = new Set;
    for (const row of rows) {
      if (controls.has(row.control_node))
        throw new Error("StructuralDisplayAnchorBindingMismatch");
      controls.add(row.control_node);
    }
    return rows.filter((row) => displayed.has(`${section}:${row.paragraph}`));
  };
  return attachHwp5StructuralAnchors(scoped, content);
}

// web/preview/hwp5-window-repeated-content.mjs
function attachHwp5WindowRepeatedAreas(editor, content) {
  const { displayed, completeFlows, selectedFlows } = hwp5WindowFlows(editor, content);
  const areas = new Map, masters = new Map, scoped = Object.create(editor);
  for (const [section, flows] of completeFlows) {
    const pageAreas = validateHwp5PageAreaSources(editor.pageAreaSources(section));
    const masterPages = validateHwp5MasterPageSources(editor.masterPageSources(section));
    for (const source of [
      ...pageAreas,
      ...masterPages.map((row) => ({ ...row, kind: "master_page" }))
    ]) {
      const members = flows.filter((row) => row.host === source.kind && row.parent_node === source.owner_node && row.list_node === source.list_node);
      if (source.paragraph_count !== 0 && !members.length || members.some((row) => !displayed.has(`${section}:${row.paragraph}`)))
        throw new Error("MissingHwp5WindowRepeatedBody");
    }
    areas.set(section, pageAreas);
    masters.set(section, masterPages);
  }
  content.currentParagraphFlows = selectedFlows;
  scoped.pageAreaSources = (section) => areas.get(section) ?? [];
  scoped.masterPageSources = (section) => masters.get(section) ?? [];
  return attachHwp5MasterPages(scoped, attachHwp5PageAreas(scoped, content));
}

// web/preview/hwp5-window-numbering-content.mjs
function attachHwp5WindowNumbering(editor, content) {
  const { displayed, completeFlows } = hwp5WindowFlows(editor, content), scoped = Object.create(editor);
  scoped.automaticNumberSources = (section) => completeFlows.has(section) ? validateHwp5AutomaticNumberSources(editor.automaticNumberSources(section)).filter((row) => displayed.has(`${section}:${row.paragraph}`)) : [];
  scoped.pageControlSources = (section) => {
    if (!completeFlows.has(section))
      return [];
    const rows = validateHwp5PageControlSources(editor.pageControlSources(section));
    if (rows.some((row) => !displayed.has(`${section}:${row.paragraph}`)))
      throw new Error("MissingHwp5WindowPageControl");
    return rows;
  };
  for (const section of completeFlows.keys())
    scoped.pageControlSources(section);
  return attachHwp5DocumentProperties(scoped, attachHwp5PageControls(scoped, attachHwp5AutomaticNumbers(scoped, content)));
}

// web/preview/hwp5-window-query-content.mjs
function queryHwp5WindowContent(editor, preview, options, paragraphFormatsAvailable) {
  editor = memoHwp5WindowFlows(editor);
  const content = projectHwp5FieldOwnedWindow(editor, preview, options);
  content.documentWindowAvailable = true;
  attachHwp5Styles(editor, preview, content);
  attachHwp5ParagraphFormats(editor, content, paragraphFormatsAvailable);
  attachHwp5PageDeclarations(editor, content, new Set(content.paragraphs.map((row) => row.section)));
  attachHwp5WindowObjects(editor, preview, content);
  attachHwp5WindowRepeatedAreas(editor, content);
  attachHwp5WindowStructuralAnchors(editor, content);
  attachHwp5WindowNumbering(editor, content);
  attachHwp5WindowColumns(editor, content);
  content.hwp5GroupGeometry = projectHwp5GroupGeometry(content);
  if (content.hwp5Pictures?.length) {
    const projected = projectHwp5PictureGeometry(content);
    if (projected.state === "projected")
      content.pictures = projected.pictures;
    else
      content.hwp5PictureGeometryError = projected.error;
  }
  const roots = projectHwp5RootContent(content);
  if (roots.state === "projected") {
    validateHwp5WindowSelection(roots.content);
    return roots.content;
  }
  content.hwp5WindowRootError = roots.error;
  validateHwp5WindowSelection(content);
  return content;
}

// web/preview/hwp5-current-reference-command.mjs
function currentReferenceCommand(editor, format, enabled, message) {
  if (!editor || !enabled)
    throw new Error("EditorNotOpen");
  if (format !== "hwp5")
    throw new Error("UnsupportedCurrentReferenceFormat");
  if (message.kind === "query-created-tables")
    return { tables: editor.createdTables(message.section) };
  if (message.kind === "query-current-references")
    return {
      window: editor.currentReferences(message.section, {
        first: message.first,
        count: message.count
      })
    };
  if (message.kind === "query-current-source-references")
    return {
      window: editor.currentSourceReferences(message.section, {
        first: message.first,
        count: message.count
      })
    };
  if (message.kind === "query-current-text")
    return { text: editor.currentText(message.reference) };
  if (message.kind !== "splice-current")
    throw new Error("UnknownCurrentReferenceCommand");
  editor.spliceCurrent(message);
  return null;
}

// web/preview/hwp5-current-reference-content.mjs
function attachHwp5CurrentReferences(editor, preview, content) {
  for (const row of content.paragraphs)
    delete row.currentReference;
  if (!editor?.supportsCurrentReferences?.())
    return content;
  const errors = [];
  for (const section of new Set(content.paragraphs.map((row) => row.section))) {
    try {
      const total = editor.paragraphCount(section);
      if (total !== preview.sections[section]?.paragraphs.length)
        throw new Error("CurrentReferenceDisplayMismatch");
      const rows = content.paragraphs.filter((row) => row.section === section);
      const bindings = new Map;
      for (const first of new Set(rows.map((row) => Math.floor(row.paragraph / 1024) * 1024))) {
        const query = editor.supportsCurrentSourceReferences?.() ? "currentSourceReferences" : "currentReferences";
        const window = editor[query](section, { first, count: Math.min(1024, total - first) });
        if (window.total !== total || window.first !== first || window.references.length !== Math.min(1024, total - first) || window.references.some((ref) => ref.kind === "cell" || ref.section !== section))
          throw new Error("CurrentReferenceDisplayMismatch");
        window.references.forEach((ref, index) => bindings.set(first + index, ref));
      }
      for (const row of rows) {
        const ref = bindings.get(row.paragraph);
        if (!ref)
          throw new Error("CurrentReferenceDisplayMismatch");
      }
      for (const row of rows)
        row.currentReference = bindings.get(row.paragraph);
    } catch (error) {
      errors.push({ section, error: error.message });
    }
  }
  content.currentReferenceErrors = errors;
  return content;
}

// web/preview/hwp5-note-selection-owner.mjs
var uint2 = (n) => Number.isInteger(n) && n >= 0 && n <= 4294967295;
var epoch = (s) => typeof s === "string" && /^[1-9][0-9]{0,19}$/.test(s) && BigInt(s) <= 0xffffffffffffffffn;
var key2 = (s, p) => `${s}:${p}`;
function attachHwp5NoteSelectionOwners(content) {
  if (content?.format !== "hwp5" || content.window || !Array.isArray(content.paragraphs) || !Array.isArray(content.currentParagraphFlows) || !Array.isArray(content.hwp5Notes) || !content.hwp5Notes.length || !Array.isArray(content.hwp5NoteErrors) || content.hwp5NoteErrors.length || !Array.isArray(content.flowSourceErrors) || content.flowSourceErrors.length)
    return content;
  const rows = new Map, flows = new Map, promoted = new Map;
  for (const row of content.paragraphs) {
    if (!row || !uint2(row.section) || !uint2(row.paragraph) || rows.has(key2(row.section, row.paragraph)))
      return content;
    rows.set(key2(row.section, row.paragraph), row);
  }
  for (const flow of content.currentParagraphFlows) {
    if (!flow || !uint2(flow.section) || !uint2(flow.paragraph) || flows.has(key2(flow.section, flow.paragraph)))
      return content;
    flows.set(key2(flow.section, flow.paragraph), flow);
  }
  const sourceRef = (row, flow) => {
    const ref = row?.currentReference;
    return ref && flow && flow.generated === false && uint2(flow.source_node) && flow.template_node === flow.source_node && ref.kind === "original" && ref.section === row.section && ref.id === String(flow.source_node) && ref.row === 0 && ref.column === 0 && epoch(ref.epoch) && typeof ref.scope === "string" && ref.scope.length > 0 && Object.keys(ref).sort().join(",") === "column,epoch,id,kind,row,scope,section" ? ref : null;
  };
  for (const note of content.hwp5Notes) {
    if (!note || !uint2(note.section) || !uint2(note.controlNode) || !uint2(note.listNode) || !uint2(note.hostParagraph) || !["footnote", "endnote"].includes(note.kind) || !Array.isArray(note.paragraphs) || !note.paragraphs.length || note.source?.kind !== note.kind || note.source.control_node !== note.controlNode || note.source.list_node !== note.listNode || note.source.paragraph !== note.hostParagraph || note.source.paragraph_count !== note.paragraphs.length)
      return content;
    const host = rows.get(key2(note.section, note.hostParagraph)), hostFlow = flows.get(key2(note.section, note.hostParagraph));
    const hostRef = sourceRef(host, hostFlow);
    if (!hostRef || host.clipped || hostFlow.host !== "body" || hostFlow.top_level !== true || hostFlow.parent_node !== null)
      return content;
    for (const paragraph of note.paragraphs) {
      if (!uint2(paragraph))
        return content;
      const id = key2(note.section, paragraph), row = rows.get(id), flow = flows.get(id), ref = sourceRef(row, flow);
      if (!ref || !row || row.clipped || row.selectionOwner != null || row.tableCell || row.drawingText || row.drawingCaption || row.createdCell || promoted.has(id) || flow.top_level !== false || flow.host !== note.kind || flow.parent_node !== note.controlNode || flow.list_node !== note.listNode || ref.scope !== hostRef.scope || ref.epoch !== hostRef.epoch)
        return content;
      const owner = "hwp5-note:" + JSON.stringify([
        note.section,
        note.kind,
        note.controlNode,
        note.listNode,
        ref.scope,
        ref.epoch
      ]);
      promoted.set(id, { ...row, selectionOwner: owner });
    }
  }
  return {
    ...content,
    paragraphs: content.paragraphs.map((row) => promoted.get(key2(row.section, row.paragraph)) ?? row)
  };
}

// web/preview/hwp5-created-cell-display.mjs
function hwp5CreatedCellDisplay(table, options, shapes) {
  const shape = shapes?.find((shape) => shape.id === table.resources.paragraph);
  if (!shape || options.cell.attributes !== 0)
    return {};
  const insets = sourceTableCellInsets({ sourceGeometry: { in_margin: options.table.margins } }, { sourceMargin: { has_margin: false } });
  if (!insets)
    return {};
  return {
    displayFormat: "hwp5",
    displayParagraphShape: hwp5ParagraphGeometry(shape),
    displayInsets: insets
  };
}

// web/preview/hwp5-created-table-content.mjs
function attachHwp5CreatedTables(editor, content, available, sectionCount, maxUnits = 200000) {
  content.tableCreationAvailable = available;
  content.tableCreationResources = available ? editor.tableCreationResources() : null;
  const tables = [];
  let units = 0;
  let paragraphShapes;
  const visible = new Map(content.paragraphs.map((row) => [`${row.section}:${row.paragraph}`, row]));
  if (available)
    for (let section = 0;section < sectionCount; section++) {
      const snapshots = editor.createdTables(section);
      if (!snapshots.length)
        continue;
      if (paragraphShapes === undefined) {
        try {
          paragraphShapes = typeof editor.paragraphShapes === "function" ? editor.paragraphShapes() : null;
        } catch (error) {
          paragraphShapes = null;
          content.createdTableParagraphDisplayError = error.message;
        }
      }
      const first = editor.currentSourceReferences(section, { first: 0, count: 1 }).references[0];
      if (!first)
        throw new Error("MissingCreatedTableHost");
      for (const { table, options } of snapshots) {
        const host = visible.get(`${section}:${table.host_paragraph}`);
        if (!host)
          continue;
        const cells = table.cells.map((cell) => {
          units += cell.text.length;
          if (units > maxUnits)
            throw new Error("CreatedTableDisplayTextBudgetExceeded");
          const currentReference = Object.freeze({
            epoch: first.epoch,
            scope: first.scope,
            kind: "cell",
            section,
            id: table.identity,
            row: cell.row,
            column: cell.column
          });
          return { ...cell, currentReference, softLineBreakAvailable: true };
        });
        const anchorUnit = sourceDisplayPosition(table.anchor_unit, host.sourceOffsets ?? [{ at: 0, source: 0 }], host.text.length);
        tables.push({
          ...table,
          ...hwp5CreatedCellDisplay(table, options, paragraphShapes),
          cells,
          hwp5Policy: options,
          section,
          hostParagraph: table.host_paragraph,
          anchorUnit
        });
      }
    }
  content.createdTables = tables;
  return content;
}

// web/preview/hwp5-table-creation-command.mjs
function hwp5TableCreationRequest(message) {
  const o = message.options;
  if (!o || typeof o !== "object" || Array.isArray(o) || Object.keys(o).some((key) => !["rows", "columns", "width", "rowHeight", "resources"].includes(key)))
    throw new Error("InvalidTableCreationOptions");
  return {
    version: 1,
    section: message.section,
    paragraph: message.paragraph,
    unit: message.unit,
    rows: o.rows,
    columns: o.columns,
    width: o.width,
    row_height: o.rowHeight,
    resources: o.resources,
    options: {
      common: {
        flags: 6955537,
        offset_x: 0,
        offset_y: 0,
        z_order: 0,
        margins: [0, 0, 0, 0],
        prevent_page_break: false,
        description: "표"
      },
      table: { page_break: 1, repeat_header: false, cell_spacing: 0, margins: [0, 0, 0, 0] },
      cell: { layout: "observed8", unknown: 0, attributes: 0, margins: [0, 0, 0, 0] }
    }
  };
}
function setHwp5CreatedCellText(editor, message) {
  const r = message.reference;
  if (!r || r.kind !== "cell" || r.section !== message.section || r.id !== message.identity || r.row !== message.row || r.column !== message.column)
    throw new Error("InvalidCurrentReferenceScope");
  const before = editor.currentText(r);
  if (!before.endsWith("\r"))
    throw new Error("UnsupportedParagraphTerminator");
  editor.spliceCurrent({
    reference: r,
    startUnit: 0,
    endUnit: before.length - 1,
    text: message.text
  });
}

// web/preview/selection-edit-query.mjs
function selectionEditQuery(message, { active, format, canEdit }) {
  return selectionQuery(message, { active, format, query: canEdit, kind: "query-edit-range" });
}
function selectionSplitQuery(message, { active, format, canSplit, canSplitAnchored }) {
  if (message.kind !== "query-split-range")
    throw new Error("InvalidEditPermissionRange");
  if (message.anchored !== undefined && typeof message.anchored !== "boolean")
    throw new Error("InvalidEditPermissionRange");
  const query = message.anchored && typeof canSplitAnchored === "function" ? canSplitAnchored : canSplit;
  return selectionQuery(message, { active, format, query, kind: "query-split-range" });
}
function selectionQuery(message, { active, format, query, kind }) {
  if (!Number.isSafeInteger(message.requestId) || message.requestId < 1 || !["section", "paragraph", "startUnit", "endUnit"].every((key) => Number.isInteger(message[key]) && message[key] >= 0 && message[key] <= 4294967295) || message.paragraph === 4294967295 || message.endUnit < message.startUnit)
    throw new Error("InvalidEditPermissionRange");
  if (!active)
    throw new Error("EditorNotOpen");
  const allowed = format === "hwpx" ? query(message.section, message.paragraph + 1, message.startUnit, message.endUnit) : false;
  if (typeof allowed !== "boolean")
    throw new Error("InvalidEditPermissionResponse");
  return {
    kind,
    requestId: message.requestId,
    section: message.section,
    paragraph: message.paragraph,
    startUnit: message.startUnit,
    endUnit: message.endUnit,
    allowed
  };
}

// web/preview/reader-runtime.mjs
function copyRuntimeMessage(message) {
  const ancestors = new Set;
  function validate(value) {
    if (value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value))
      return;
    if (typeof value !== "object")
      throw new TypeError("InvalidRuntimePayload");
    if (typeof SharedArrayBuffer !== "undefined" && (value instanceof SharedArrayBuffer || ArrayBuffer.isView(value) && value.buffer instanceof SharedArrayBuffer))
      throw new TypeError("SharedRuntimePayloadUnsupported");
    if (value instanceof WebAssembly.Module || value instanceof ArrayBuffer || ArrayBuffer.isView(value))
      return;
    if (ancestors.has(value))
      throw new TypeError("CyclicRuntimePayload");
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
      throw new TypeError("InvalidRuntimePayload");
    ancestors.add(value);
    for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
      if (descriptor.get || descriptor.set)
        throw new TypeError("InvalidRuntimePayload");
      validate(descriptor.value);
    }
    ancestors.delete(value);
  }
  validate(message);
  if (!message || typeof message.kind !== "string")
    throw new TypeError("InvalidRuntimeMessage");
  return structuredClone(message);
}
function createReaderRuntime({
  wasmModule,
  loadWasmModule,
  allowReload = false,
  referenceScope
} = {}) {
  if (referenceScope !== undefined && (typeof referenceScope !== "string" || !referenceScope.length))
    throw new TypeError("InvalidCurrentReferenceScope");
  const createExperimentalHwp5Editor = (module, input, options = {}) => createExperimentalHwp5Editor2(module, input, { ...options, referenceScope });
  let module, bytes, preview, editor, format;
  const displayResources = createDisplayResourceCache();
  let historyEnabled = false;
  let historyPoisoned = false;
  let hwpxChartOlePolicy = false;
  let protectionRemoved = false;
  let hwp5StyleOpenError = null;
  let documentWindow = null;
  let hwp5PreviewDirty = false;
  let hwpxCreatedTablesPending = false;
  function normalizationMetadataAvailable() {
    return WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_normalization_info" && entry.kind === "function");
  }
  function outsideFieldRange(section, paragraph, start, end) {
    if (hwpxCreatedTablesPending && !editor.createdTableHostMode(section))
      return false;
    return WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_can_edit_outside_field" && entry.kind === "function") && editor.canEditOutsideField(section, paragraph, start, end);
  }
  function hwp5DisplayProjection() {
    if (hwp5PreviewDirty)
      refreshCurrentHwp5Preview();
    return editor && historyEnabled && preview.primarySource === "distribution_viewtext" ? { ...preview, readOnly: false } : preview;
  }
  function hwp5ParagraphFormatsAvailable() {
    return [
      "hwp5_edit_para_shape_count",
      "hwp5_edit_para_shape_id",
      "hwp5_edit_set_paragraph_format"
    ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
  }
  async function refreshHwp5PreviewFallback() {
    if (historyEnabled && editor?.supportsCurrentTextPreview?.())
      return;
    const fallback = await createHwp5Reader(module);
    try {
      preview = fallback.readText(editor.save({ allowStaleLayout: true }).bytes);
    } finally {
      fallback.close();
    }
  }
  function hwp5TableCreationAvailable() {
    return Boolean(editor) && [
      "hwp5_edit_insert_table",
      "hwp5_edit_created_tables",
      "hwp5_edit_table_creation_resources",
      "hwp5_edit_current_text_preview",
      "hwp5_edit_current_source_references",
      "hwp5_edit_current_references",
      "hwp5_edit_copy_current_text",
      "hwp5_edit_splice_current"
    ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
  }
  function refreshCurrentHwp5Preview() {
    if (historyEnabled && editor?.supportsCurrentTextPreview?.()) {
      preview = { ...preview, ...editor.currentTextPreview() };
      hwp5PreviewDirty = false;
    }
  }
  function hwp5Display(projected = null) {
    refreshCurrentHwp5Preview();
    if (typeof projected === "function")
      projected = projected();
    if (!projected && documentWindow) {
      const total = preview.sections.reduce((sum, section) => sum + section.paragraphs.length, 0);
      const offset = Math.min(documentWindow.offset, Math.max(0, total - 1));
      projected = queryHwp5WindowContent(editor, hwp5DisplayProjection(), { offset, count: Math.min(documentWindow.count, total - offset) }, hwp5ParagraphFormatsAvailable());
    }
    const content = projected ?? displayContent(hwp5DisplayProjection());
    content.editorSessionAvailable = Boolean(editor);
    const observedDocInfoAvailable = [
      "hwp5_edit_open_observed_docinfo",
      "hwp5_edit_observed_docinfo_diagnostics"
    ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.kind === "function" && entry.name === name));
    if (observedDocInfoAvailable) {
      content.observedDocInfoEditingAvailable = !editor && preview.primarySource !== "distribution_viewtext" && ["UnexpectedEnd", "RepairedSourceUnsupported", "ResourceCountMismatch"].includes(hwp5StyleOpenError);
      content.observedDocInfoDiagnostics = editor?.observedDocInfoDiagnostics() ?? null;
    }
    if (historyEnabled || editor?.supportsAtomicFormatting?.())
      attachHwp5CurrentReferences(editor, preview, content);
    attachHwp5CreatedTables(editor, content, hwp5TableCreationAvailable(), preview.sections.length);
    const normalizationExport = preview.primarySource === "distribution_viewtext" ? "hwp5_edit_open_normalized_distribution" : "hwp5_edit_open_normalized";
    content.normalizationEditingAvailable = normalizationMetadataAvailable() && hwp5StyleOpenError === "RepairedSourceUnsupported" && WebAssembly.Module.exports(module).some((entry) => entry.name === normalizationExport && entry.kind === "function");
    if (editor?.supportsNormalizationInfo())
      content.normalizationInfo = editor.normalizationInfo();
    content.documentWindowAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_field_spans" && entry.kind === "function");
    if (preview.primarySource === "distribution_viewtext")
      content.primarySource = preview.primarySource;
    content.distributionEditingAvailable = preview.primarySource === "distribution_viewtext" && WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_open_distribution" && entry.kind === "function") && (hwp5StyleOpenError !== "RepairedSourceUnsupported" || content.normalizationEditingAvailable);
    content.paragraphAlignmentAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_paragraph_alignment" && entry.kind === "function");
    content.paragraphMarginsAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_paragraph_margins" && entry.kind === "function");
    content.paragraphSpacingAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_paragraph_spacing" && entry.kind === "function");
    content.characterPropertiesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_properties" && entry.kind === "function");
    content.characterPropertiesRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_properties_ranges" && entry.kind === "function");
    content.paragraphReplacementAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_replace_paragraph_ranges" && entry.kind === "function");
    content.characterUnderlineAvailable = [
      "hwp5_edit_set_character_underline",
      "hwp5_edit_character_underlines"
    ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
    content.characterStrikeAvailable = [
      "hwp5_edit_set_character_strike",
      "hwp5_edit_character_strikes"
    ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
    content.characterStrikeRangesAvailable = content.characterStrikeAvailable && WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_strike_ranges" && entry.kind === "function");
    content.characterUnderlineRangesAvailable = content.characterUnderlineAvailable && WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_underline_ranges" && entry.kind === "function");
    content.characterUnderlineColorAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_underline_color" && entry.kind === "function");
    content.characterStrikeColorAvailable = content.characterStrikeAvailable && ["hwp5_edit_set_character_strike_color", "hwp5_edit_character_strike_styles"].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
    content.characterTextColorAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_text_color" && entry.kind === "function");
    content.characterShadeAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_shade" && entry.kind === "function");
    content.characterEffectAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_effect" && entry.kind === "function");
    content.characterEffectExclusiveAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_effect_exclusive" && entry.kind === "function");
    content.characterEffectRangesExclusiveAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_effect_ranges_exclusive" && entry.kind === "function");
    content.characterOutlineAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_outline" && entry.kind === "function");
    content.characterOutlineRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_outline_ranges" && entry.kind === "function");
    content.characterOutlineExtendedAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_outline_extended" && entry.kind === "function");
    content.characterOutlineRangesExtendedAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_outline_ranges_extended" && entry.kind === "function");
    content.characterEffectRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_effect_ranges" && entry.kind === "function");
    content.characterFontAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_font" && entry.kind === "function");
    content.characterFontNameAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_font_name" && entry.kind === "function");
    content.namedFontTextAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_splice_font_name" && entry.kind === "function");
    content.characterPropertyTextAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_splice_character_properties" && entry.kind === "function");
    content.namedFontPropertyTextAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_splice_font_name_properties" && entry.kind === "function");
    content.namedFontReplacementAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_replace_paragraph_ranges_font_name" && entry.kind === "function");
    content.characterPropertyReplacementAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_replace_paragraph_ranges_properties" && entry.kind === "function");
    content.namedFontPropertyReplacementAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_replace_paragraph_ranges_font_name_properties" && entry.kind === "function");
    content.characterFontNameRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_font_name_ranges" && entry.kind === "function");
    content.characterFontRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_font_ranges" && entry.kind === "function");
    content.characterTextColorRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_text_color_ranges" && entry.kind === "function");
    content.characterShadeRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_character_shade_ranges" && entry.kind === "function");
    if (protectionRemoved)
      content.passwordProtectionRemoved = true;
    attachHwp5TextSourcePolicy(editor, content);
    if (content.window)
      return content;
    const paragraphFormatAvailable = hwp5ParagraphFormatsAvailable();
    const prepared = attachHwp5PictureTails(editor, attachHwp5Pictures(editor, attachHwp5PageSources(editor, attachHwp5ParagraphFormats(editor, attachHwp5Tables(editor, preview, attachHwp5Styles(editor, preview, content, hwp5StyleOpenError)), paragraphFormatAvailable))));
    prepared.hwp5GroupGeometry = projectHwp5GroupGeometry(prepared);
    attachHwp5Forms(editor, prepared);
    attachHwp5FormProperties(editor, prepared);
    prepared.hwp5FormTextEditAvailable = historyEnabled && editor?.supportsFormTextEdit?.() === true;
    prepared.hwp5FormTextLayoutRetentionAvailable = prepared.hwp5FormTextEditAvailable && editor?.supportsFormTextLayoutRetention?.() === true;
    prepared.hwp5CheckBoxStateEditAvailable = historyEnabled && editor?.supportsCheckBoxStateEdit?.() === true;
    prepared.hwp5RadioSelectAvailable = historyEnabled && editor?.supportsRadioButtonSelect?.() === true;
    prepared.hwp5UnnamedRadioSelectAvailable = prepared.hwp5RadioSelectAvailable && editor?.supportsUnnamedRadioSelect?.() === true;
    attachHwp5Lines(editor, prepared);
    if (prepared.hwp5Pictures?.length) {
      const pictures = projectHwp5PictureGeometry(prepared);
      if (pictures.state === "projected")
        prepared.pictures = pictures.pictures;
      else
        prepared.hwp5PictureGeometryError = pictures.error;
    }
    attachHwp5Formulas(editor, prepared, ["hwp5_edit_formula_sources", "hwp5_edit_set_formula_definition"].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function")));
    const roots = projectHwp5RootContent(prepared);
    if (roots.state === "projected")
      return attachHwp5NoteSelectionOwners(roots.content);
    if (prepared.hwp5Drawings?.length && prepared.hwp5Drawings.every((row) => row.source.kind_id === 610496366))
      prepared.hwp5GroupPageModelError = roots.error;
    else
      prepared.hwp5DrawingPageModelError = roots.error;
    return attachHwp5NoteSelectionOwners(prepared);
  }
  function anchorView(section, paragraph) {
    try {
      return editor.anchorText(section, paragraph);
    } catch (error) {
      if ([
        "MissingTextSite",
        "UnsupportedParagraphControl",
        "UnsupportedInlineControl",
        "SourceBindingMismatch",
        "UnsupportedTextPositionProjection",
        "HwpxAnchorEditAbiUnavailable",
        "UnsupportedStructuralAnchorEdit",
        "UnsupportedStructuralFieldEdit"
      ].includes(error.message))
        return null;
      throw error;
    }
  }
  function hwpxDisplay(projected) {
    const resources = displayResources.view(editor);
    if (!projected && documentWindow) {
      const offset = Math.min(documentWindow.offset, Math.max(0, preview.paragraphCount - 1));
      const count = Math.min(documentWindow.count, preview.paragraphCount - offset);
      projected = projectHwpxWindow(editor, preview, { offset, count });
    }
    const content = projected ?? displayHwpxContent(preview);
    if (!content.window)
      attachHwpxFormulas(editor, content);
    content.formulaDefinitionAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_formula_definition" && entry.kind === "function");
    const formulaExports = new Set(WebAssembly.Module.exports(module).filter((entry) => entry.kind === "function").map((entry) => entry.name));
    attachHwpxCharts(editor, content, formulaExports, hwpxChartOlePolicy);
    content.manualFormulaResultAvailable = typeof editor.setManualFormulaResult === "function" && ["hwpx_edit_set_manual_formula_result", "hwpx_edit_manual_formula_result_max_bytes"].every((name) => formulaExports.has(name));
    content.manualFormulaResultTextAvailable = formulaResultTextAvailable(editor, module);
    const formulaResultContext = content.manualFormulaResultTextAvailable && content.window ? attachHwpxFormulas(editor, { paragraphs: content.paragraphs }) : content;
    const formulaResultSections = new Set((formulaResultContext.formulas ?? []).map((row) => row.section));
    const formulaResultParagraph = createFormulaResultParagraphFilter(editor, formulaExports);
    const formulaDisplay = createFormulaResultDisplayLookup(editor, formulaExports);
    content.paragraphAlignmentAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_paragraph_alignment" && entry.kind === "function");
    content.paragraphMarginsAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_paragraph_margins" && entry.kind === "function");
    content.paragraphSpacingAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_paragraph_spacing" && entry.kind === "function");
    content.characterPropertiesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_properties" && entry.kind === "function");
    content.characterPropertiesRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_properties_ranges" && entry.kind === "function");
    content.paragraphReplacementAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_replace_paragraph_ranges" && entry.kind === "function");
    content.characterUnderlineAvailable = [
      "hwpx_edit_set_character_underline",
      "hwpx_edit_character_underlines"
    ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
    content.characterStrikeAvailable = [
      "hwpx_edit_set_character_strike",
      "hwpx_edit_character_strikes"
    ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
    content.characterStrikeRangesAvailable = content.characterStrikeAvailable && WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_strike_ranges" && entry.kind === "function");
    content.characterUnderlineRangesAvailable = content.characterUnderlineAvailable && WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_underline_ranges" && entry.kind === "function");
    content.characterUnderlineColorAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_underline_color" && entry.kind === "function");
    content.characterStrikeColorAvailable = content.characterStrikeAvailable && ["hwpx_edit_set_character_strike_color", "hwpx_edit_character_strike_styles"].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
    content.characterTextColorAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_text_color" && entry.kind === "function");
    content.characterShadeAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_shade" && entry.kind === "function");
    content.characterEffectAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_effect" && entry.kind === "function");
    content.characterEffectExclusiveAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_effect_exclusive" && entry.kind === "function");
    content.characterEffectRangesExclusiveAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_effect_ranges_exclusive" && entry.kind === "function");
    content.characterOutlineAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_outline" && entry.kind === "function");
    content.characterOutlineRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_outline_ranges" && entry.kind === "function");
    content.characterOutlineExtendedAvailable = false;
    content.characterOutlineRangesExtendedAvailable = false;
    content.characterEffectRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_effect_ranges" && entry.kind === "function");
    content.characterFontAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_font" && entry.kind === "function");
    content.characterFontNameAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_font_name" && entry.kind === "function");
    content.namedFontTextAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_splice_font_name" && entry.kind === "function");
    content.characterPropertyTextAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_splice_character_properties" && entry.kind === "function");
    content.namedFontPropertyTextAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_splice_font_name_properties" && entry.kind === "function");
    content.namedFontReplacementAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_replace_paragraph_ranges_font_name" && entry.kind === "function");
    content.characterPropertyReplacementAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_replace_paragraph_ranges_properties" && entry.kind === "function");
    content.namedFontPropertyReplacementAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_replace_paragraph_ranges_font_name_properties" && entry.kind === "function");
    content.characterFontNameRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_font_name_ranges" && entry.kind === "function");
    content.characterFontRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_font_ranges" && entry.kind === "function");
    content.characterTextColorRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_text_color_ranges" && entry.kind === "function");
    content.characterShadeRangesAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_character_shade_ranges" && entry.kind === "function");
    let units = 0;
    const fieldLinkGuard = createFieldLinkDisplayGuard();
    const currentText = new Map;
    const automaticNumberSnapshot = createAutomaticNumberDisplaySnapshot(editor);
    const nextMerge = new Map, previousMerge = new Map;
    const neighborAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_paragraph_neighbors" && entry.kind === "function");
    for (const section of new Set(content.paragraphs.map((p) => p.section))) {
      for (const row of editor.paragraphTextSnapshot(section))
        currentText.set(`${section}:${row.paragraph - 1}`, row);
      if (neighborAvailable) {
        const neighbors = editor.paragraphNeighbors(section);
        for (const [index, value] of neighbors.next.entries()) {
          const paragraph = neighbors.firstParagraph + index - 1;
          nextMerge.set(`${section}:${paragraph}`, value === null ? null : value - 1);
          if (value !== null) {
            const key = `${section}:${value - 1}`;
            if (previousMerge.has(key))
              throw new Error("DuplicateParagraphNeighbor");
            previousMerge.set(key, paragraph);
          }
        }
      }
    }
    for (const paragraph of content.paragraphs) {
      const current = currentText.get(`${paragraph.section}:${paragraph.paragraph}`);
      if (!current)
        throw new Error("MissingCurrentParagraphText");
      paragraph.selectionOwner = current.nested ? null : `section:${paragraph.section}:body`;
      if (neighborAvailable) {
        paragraph.nextMergeParagraph = nextMerge.get(`${paragraph.section}:${paragraph.paragraph}`) ?? null;
        paragraph.previousMergeParagraph = previousMerge.get(`${paragraph.section}:${paragraph.paragraph}`) ?? null;
      }
      paragraph.label = `구역 ${paragraph.section + 1} · 문단 ${paragraph.paragraph + 1}${current.nested ? " · 중첩" : ""} · HWPX 읽기 전용`;
      paragraph.plainEditable = !paragraph.clipped && fieldLinkGuard.read(paragraph.section, () => editor.canEdit(paragraph.section, paragraph.paragraph + 1), false, "plain");
      if (paragraph.plainEditable) {
        const anchored = editor.anchorText(paragraph.section, paragraph.paragraph + 1);
        paragraph.text = current.nested ? retainedAutomaticNumberPlainText(editor, paragraph.section, paragraph.paragraph + 1, current.text, anchored, automaticNumberSnapshot) : anchored;
      }
      paragraph.fieldLabels = [];
      paragraph.manualFormulaResults = [];
      paragraph.anchorEditable = false;
      if (!paragraph.clipped && !paragraph.plainEditable) {
        const anchored = fieldLinkGuard.read(paragraph.section, () => anchorView(paragraph.section, paragraph.paragraph + 1), null, "anchor");
        if (anchored !== null) {
          paragraph.text = anchored;
          paragraph.anchorEditable = true;
        }
      }
      const clipped = clipText(paragraph.text, Math.max(0, HWPX_DISPLAY_BOUNDS.maxUnits - units));
      if (clipped !== paragraph.text) {
        paragraph.clipped = true;
        content.limited = true;
        paragraph.text = clipped;
      }
      units += paragraph.text.length;
      if (paragraph.clipped) {
        paragraph.plainEditable = false;
        paragraph.anchorEditable = false;
      }
      paragraph.anchoredSplitAvailable = !paragraph.clipped && (paragraph.anchorEditable || paragraph.plainEditable && /[\t\r\n]/.test(paragraph.text)) && WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_split_anchored" && entry.kind === "function");
      if (!paragraph.clipped && !paragraph.plainEditable && !paragraph.anchorEditable) {
        try {
          paragraph.fieldLabels = fieldLinkGuard.read(paragraph.section, () => editor.fieldLabels(paragraph.section, paragraph.paragraph + 1), [], "labels");
        } catch (error) {
          if (![
            "SourceBindingMismatch",
            "UnsupportedTextPositionProjection",
            "HwpxFieldEditAbiUnavailable",
            "UnsupportedStructuralFieldEdit"
          ].includes(error.message))
            throw error;
          paragraph.fieldReadOnlyReason = error.message;
        }
      }
      if (paragraph.fieldLabels.length && WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_field_label_display_text" && entry.kind === "function"))
        units += projectFieldLabelDisplay(editor, paragraph, HWPX_DISPLAY_BOUNDS.maxUnits - units + paragraph.text.length);
      units += fieldLinkGuard.read(paragraph.section, () => {
        const eligible = content.manualFormulaResultTextAvailable && !paragraph.clipped && !paragraph.plainEditable && formulaResultSections.has(paragraph.section);
        const snapshot = eligible && formulaDisplay.available ? formulaDisplay.get(paragraph.section, paragraph.paragraph + 1) : undefined;
        const available = eligible && (snapshot !== undefined ? snapshot !== null : formulaResultParagraph(paragraph.section, paragraph.paragraph + 1));
        return projectFormulaResultText(editor, paragraph, available, HWPX_DISPLAY_BOUNDS.maxUnits - units + paragraph.text.length, snapshot ?? undefined);
      }, 0, "formula-results");
      if (paragraph.clipped)
        content.limited = true;
      const wholeFormulaResult = paragraph.manualFormulaResults.length === 1 && paragraph.manualFormulaResults[0].start === 0 && paragraph.manualFormulaResults[0].end === paragraph.text.length;
      paragraph.editable = paragraph.plainEditable || paragraph.anchorEditable || paragraph.fieldLabels.length > 0 || wholeFormulaResult;
      if (!paragraph.editable && fieldLinkGuard.reason(paragraph.section))
        paragraph.fieldReadOnlyReason = fieldLinkGuard.reason(paragraph.section);
      if (paragraph.editable)
        paragraph.label = paragraph.label.replace("읽기 전용", paragraph.plainEditable ? "일반 텍스트 편집" : paragraph.anchorEditable ? "보호 개체 텍스트 편집" : paragraph.manualFormulaResults.length ? "계산 결과 편집" : "필드 라벨만 편집");
      else if (paragraph.manualFormulaResults.length)
        paragraph.label = paragraph.label.replace("읽기 전용", "계산 결과 범위만 편집");
    }
    content.readOnly = !content.paragraphs.some((paragraph) => paragraph.editable);
    attachAutomaticNumbers(editor, content, automaticNumberSnapshot);
    attachDutmal(editor, content, [
      "hwpx_edit_inline_string_sources",
      "hwpx_edit_dutmal_sites",
      "hwpx_edit_dutmal_text",
      "hwpx_edit_dutmal_display_text"
    ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function")));
    attachEquations(editor, content, WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_equation_sites" && entry.kind === "function"));
    attachEquationRendering(editor, content, content.equationAvailable && WebAssembly.Module.exports(module).some((entry) => entry.name === "equation_process" && entry.kind === "function"), undefined, WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_equation_styles" && entry.kind === "function"));
    attachNoteReferences(editor, content);
    attachDrawingTextBindings(editor, content);
    attachCheckBoxes(editor, content, [
      "hwpx_edit_form_sites",
      "hwpx_edit_form_source_attributes",
      "hwpx_edit_checkbox_state",
      "hwpx_edit_set_checkbox_state"
    ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function")));
    if (protectionRemoved)
      content.passwordProtectionRemoved = true;
    const styleAvailable = ["hwpx_edit_character_shapes", "hwpx_edit_character_ranges"].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
    const paragraphAvailable = [
      "hwpx_edit_paragraph_shape_ids",
      "hwpx_edit_paragraph_shape_refs",
      "hwpx_edit_set_paragraph_format"
    ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
    const tableContent = attachHwpxTables(editor, attachHwpxStyles(resources, content, styleAvailable));
    attachHwpxTableBorders(editor, tableContent, formulaExports.has("hwpx_edit_table_border_sources"));
    if (content.window)
      attachHwpxFormulas(editor, tableContent);
    const sourced = attachHwpxConnectors(editor, attachHwpxLines(editor, attachHwpxPictures(editor, attachHwpxParagraphFormats(resources, tableContent, paragraphAvailable))));
    attachTabDefinitions(resources, sourced);
    attachSectionTabSources(editor, sourced);
    attachEllipses(editor, sourced, formulaExports.has("hwpx_edit_ellipse_sources"));
    const displayed = attachHwpxPageSettings(editor, sourced);
    attachHwpxPictureCaptions(editor, displayed, ["hwpx_edit_picture_caption", "hwpx_edit_picture_caption_bindings"].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function")));
    attachHwpxPageAreaDeclarations(editor, displayed, formulaExports.has("hwpx_edit_page_area_declarations"));
    attachHwpxOleSources(editor, displayed, ["hwpx_edit_ole_sites", "hwpx_edit_ole_source"].every((name) => formulaExports.has(name)));
    displayed.lines.push(...displayed.connectors.flatMap((row) => row.referenceLine ? [row.referenceLine] : []));
    if (content.window && content.paragraphs.some((row) => row.clipped))
      throw new Error("ParagraphWindowTextBudgetExceeded");
    const creationAvailable = [
      "hwpx_edit_created_tables",
      "hwpx_edit_insert_table",
      "hwpx_edit_set_created_cell_text",
      "hwpx_edit_save_for_display"
    ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
    displayed.tableCreationResources = creationAvailable && WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_table_creation_resources" && entry.kind === "function") ? resources.tableCreationResources() : null;
    const result = attachCreatedTables(editor, displayed, creationAvailable, HWPX_DISPLAY_BOUNDS.maxUnits, preview.sectionCount);
    hwpxCreatedTablesPending = result.createdTableHostPending;
    return result;
  }
  const outcomes = new WeakMap;
  let lastHistoryRevision;
  let loadProjection = null;
  let requestSequence = 0;
  async function execute(message, requestTicket, reusableLoad, ownerWindowProjection = false) {
    let reader;
    let response;
    const minimalError = (error) => ({
      origin: message.origin,
      kind: message.kind,
      applied,
      ...historyPoisoned ? { historyPoisoned: true } : {},
      ...message.requestId === undefined ? {} : { requestId: message.requestId },
      error: error?.message || String(error)
    });
    const reply = (value) => {
      if (response !== undefined)
        throw new Error("DuplicateRuntimeReply");
      try {
        let historyRevision, historyRevisions, historyStats;
        if (historyEnabled && editor && WebAssembly.Module.exports(module).some((entry) => entry.name === `${format}_edit_history_revision`))
          historyRevision = editor.historyRevision();
        if (historyEnabled && editor && ["count", "at"].every((suffix) => WebAssembly.Module.exports(module).some((entry) => entry.name === `${format}_edit_history_revision_${suffix}`)))
          historyRevisions = editor.historyRevisions();
        if (historyEnabled && editor)
          historyStats = editor.historyStats();
        response = {
          origin: message.origin,
          ...value,
          ...historyPoisoned ? { historyPoisoned: true } : {},
          ...historyStats === undefined ? {} : { historyStats },
          ...historyRevision === undefined ? {} : { historyRevision },
          ...historyRevisions === undefined ? {} : { historyRevisions }
        };
      } catch (error) {
        response = minimalError(error);
      }
    };
    let applied = false;
    let mutationUncertain = false;
    let atomicOutcome;
    let nativeTextDelta;
    let beforeTextOwner = null;
    if (format === "hwp5" && historyEnabled && message.kind === "splice") {
      try {
        beforeTextOwner = editor?.captureExclusiveTextOwner(message.section, message.paragraph);
      } catch {}
    }
    const projectedOwner = () => {
      if (ownerWindowProjection === true && nativeTextDelta && !documentWindow && preview.sections.every((s) => s.paragraphs.every((p) => p.tokens.every((t) => t.type !== "control" || [2, 11, 13, 21].includes(t.code))))) {
        hwp5PreviewDirty = true;
        return { viewKind: "owner-window-patch", ...nativeTextDelta };
      }
      return null;
    };
    const captureTextDelta = () => {
      try {
        nativeTextDelta = editor.readExclusiveTextDelta(beforeTextOwner);
      } catch {
        nativeTextDelta = undefined;
      }
    };
    displayResources.beginRequest(message, { format, editor, historyEnabled });
    try {
      if (message.kind === "formatting-capabilities") {
        if (!editor)
          throw Error("EditorNotOpen");
        reply({
          kind: message.kind,
          formattingCapabilities: formattingCapabilities(editor),
          formattingBatchQueryAvailable: true
        });
        return;
      }
      if (message.kind === "query-formatting") {
        if (!editor)
          throw Error("EditorNotOpen");
        reply({ kind: message.kind, formatting: queryAtomicFormatting(editor, format, message) });
        return;
      }
      if (message.kind === "formatting-patch") {
        if (!editor || !historyEnabled)
          throw Error("HistoryNotEnabled");
        atomicOutcome = editor.applyFormattingPatch(message.request);
        applied = atomicOutcome.application === "applied";
        mutationUncertain = atomicOutcome.application === "unknown";
        if (mutationUncertain)
          historyPoisoned = true;
        if (atomicOutcome.error || atomicOutcome.cleanupError)
          throw Error(atomicOutcome.error || atomicOutcome.cleanupError);
        if (atomicOutcome.nativeCode === 2) {
          reply({ kind: message.kind, changed: false });
          return;
        }
        reply({ kind: message.kind, content: format === "hwpx" ? hwpxDisplay() : hwp5Display() });
        return;
      }
      if (format === "hwp5" && preview?.sectionInventory && message.kind !== "load")
        throw new Error("AvailableSectionsReadOnly");
      if ([
        "query-current-references",
        "query-current-source-references",
        "query-current-text",
        "query-created-tables",
        "splice-current"
      ].includes(message.kind)) {
        const result = currentReferenceCommand(editor, format, historyEnabled, message);
        if (result) {
          reply({ kind: message.kind, requestId: message.requestId, ...result });
        } else {
          applied = true;
          await refreshHwp5PreviewFallback();
          reply({ kind: message.kind, requestId: message.requestId, content: hwp5Display() });
        }
        return;
      }
      if (message.kind === "insert-table" || message.kind === "created-cell-text") {
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        if (format === "hwp5") {
          if (!hwp5TableCreationAvailable())
            throw new Error("Hwp5TableCreationAbiUnavailable");
          const identity = message.kind === "insert-table" ? editor.insertTable(hwp5TableCreationRequest(message)) : message.identity;
          if (message.kind === "created-cell-text")
            setHwp5CreatedCellText(editor, message);
          applied = true;
          reply({ kind: message.kind, identity, content: hwp5Display() });
          return;
        }
        if (format !== "hwpx")
          throw new Error("UnsupportedTableCreationFormat");
        let identity = message.identity;
        if (message.kind === "insert-table")
          identity = editor.insertTable(message.section, message.paragraph + 1, message.unit, message.options);
        else
          editor.setCreatedCellText(message.section, identity, message.row, message.column, message.text);
        applied = true;
        reader = await createHwpxReader(module);
        preview = reader.readTextEvents(editor.saveForDisplay());
        reply({ kind: message.kind, identity, content: hwpxDisplay() });
        return;
      }
      if (message.kind === "set-edit-window") {
        if (!editor || !preview || !historyEnabled)
          throw new Error("EditorNotOpen");
        const full = message.offset === null && message.count === null;
        if (format === "hwp5") {
          const projected = () => full ? displayContent(hwp5DisplayProjection()) : queryHwp5WindowContent(editor, hwp5DisplayProjection(), { offset: message.offset, count: message.count }, hwp5ParagraphFormatsAvailable());
          const content = hwp5Display(projected);
          documentWindow = full ? null : { offset: message.offset, count: message.count };
          reply({ kind: "set-edit-window", content });
          return;
        }
        if (format !== "hwpx")
          throw new Error("UnsupportedDocumentWindowFormat");
        const projected = full ? displayHwpxContent(preview) : projectHwpxWindow(editor, preview, { offset: message.offset, count: message.count });
        const content = hwpxDisplay(projected);
        documentWindow = full ? null : { offset: message.offset, count: message.count };
        reply({ kind: "set-edit-window", content });
        return;
      }
      if (message.kind === "query-window" || message.kind === "query-edit-window") {
        if (!editor || !preview)
          throw new Error("EditorNotOpen");
        if (message.kind === "query-edit-window" && !historyEnabled)
          throw new Error("EditorNotOpen");
        if (format === "hwp5") {
          const content = hwp5Display(() => queryHwp5WindowContent(editor, hwp5DisplayProjection(), { offset: message.offset, count: message.count }, hwp5ParagraphFormatsAvailable()));
          reply({ kind: message.kind, content });
          return;
        }
        if (format !== "hwpx")
          throw new Error("UnsupportedDocumentWindowFormat");
        let content = projectHwpxWindow(editor, preview, {
          offset: message.offset,
          count: message.count
        });
        if (message.kind === "query-edit-window") {
          content = hwpxDisplay(content);
          if (content.paragraphs.some((row) => row.clipped))
            throw new Error("ParagraphWindowTextBudgetExceeded");
        }
        reply({ kind: message.kind, content });
        return;
      }
      if (message.kind === "query-edit-range") {
        reply(selectionEditQuery(message, {
          active: Boolean(editor) && historyEnabled,
          format,
          canEdit: (section, paragraph, start, end) => formulaResultTextRangeAllowed(editor, module, section, paragraph, start, end) || hwpxFieldRangeTarget(editor, hwpxCreatedTablesPending, section, paragraph, start, end) !== null || outsideFieldRange(section, paragraph, start, end)
        }));
        return;
      }
      if (message.kind === "query-split-range") {
        reply(selectionSplitQuery(message, {
          active: Boolean(editor) && historyEnabled,
          format,
          canSplit: (section, paragraph, atUnit, endUnit) => editor.canSplitParagraph({ section, paragraph, atUnit, endUnit }),
          canSplitAnchored: editor?.supportsAnchoredSplitQuery?.() ? (section, paragraph, atUnit, endUnit) => editor.canSplitParagraphAnchored({ section, paragraph, atUnit, endUnit }) : undefined
        }));
        return;
      }
      if (format === "hwp5" && !historyEnabled && ["save", "undo", "redo", "split", "merge", "splice", "format"].includes(message.kind))
        throw new Error("EditorNotOpen");
      if (message.kind === "refresh") {
        if (!editor || !preview)
          throw new Error("EditorNotOpen");
        if (format === "hwp5")
          await refreshHwp5PreviewFallback();
        else {
          reader = await createHwpxReader(module);
          preview = reader.readTextEvents(editor.saveForDisplay());
        }
        reply({ kind: "refresh", content: format === "hwpx" ? hwpxDisplay() : hwp5Display() });
        return;
      }
      if (message.kind === "load") {
        const availableSectionsOnly = availableSectionsRequest(message);
        const availableSectionCopy = availableSectionCopyRequest(message);
        const requestedPolicy = message.allowObservedChartOleDeviations === undefined ? false : message.allowObservedChartOleDeviations;
        if (typeof requestedPolicy !== "boolean")
          throw new Error("InvalidChartOlePolicy");
        if (requestedPolicy && message.format !== "hwpx")
          throw new Error("UnsupportedChartOlePolicyFormat");
        editor?.close();
        editor = undefined;
        preview = undefined;
        if (protectionRemoved)
          bytes?.fill(0);
        protectionRemoved = false;
        bytes = undefined;
        module = undefined;
        historyEnabled = false;
        historyPoisoned = false;
        hwp5StyleOpenError = null;
        documentWindow = null;
        hwpxCreatedTablesPending = false;
        format = message.format ?? "hwp5";
        hwpxChartOlePolicy = format === "hwpx" && requestedPolicy;
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnknownDocumentFormat");
        if (message.wasmModule !== undefined) {
          if (!(message.wasmModule instanceof WebAssembly.Module))
            throw new Error("InvalidPreviewWasmModule");
          module = message.wasmModule;
        } else {
          module = wasmModule ?? await loadWasmModule?.();
          if (!(module instanceof WebAssembly.Module))
            throw new Error("PreviewWasmModuleRequired");
        }
        bytes = new Uint8Array(message.bytes);
        if (format === "hwpx") {
          reader = await createHwpxReader(module);
          preview = reader.readTextEvents(bytes);
          const next = await createHwpxEditor2(module);
          try {
            next.open(bytes, { allowObservedChartOleDeviations: hwpxChartOlePolicy });
          } catch (error) {
            next.close();
            throw error;
          }
          editor = next;
          reply({ kind: "load", content: hwpxDisplay() });
          return;
        }
        reader = await createHwp5Reader(module);
        if (availableSectionCopy) {
          const next = await createExperimentalHwp5Editor(module, bytes, {
            availableSectionCopy: true
          });
          try {
            preview = reader.readText(next.save().bytes);
          } catch (error) {
            next.close();
            throw error;
          }
          editor = next;
          reply({ kind: "load", content: hwp5Display() });
          return;
        }
        preview = availableSectionsOnly ? reader.readAvailableText(bytes) : reader.readText(bytes);
        if (availableSectionsOnly) {
          reply({ kind: "load", content: availableSectionsContent(preview) });
          return;
        }
        if (!preview.readOnly) {
          try {
            editor = await createExperimentalHwp5Editor(module, bytes);
          } catch (error) {
            hwp5StyleOpenError = error.message;
          }
        }
        if (!editor && preview.primarySource === "distribution_viewtext" && WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_open_distribution" && entry.kind === "function")) {
          try {
            const probe = await createExperimentalHwp5Editor(module, bytes, { distribution: true });
            probe.close();
          } catch (error) {
            hwp5StyleOpenError = error.message;
          }
        }
        reply({ kind: "load", content: hwp5Display() });
      } else if (message.kind === "table-background-bytes") {
        if (!editor || format !== "hwpx")
          throw new Error("TableBackgroundReadUnavailable");
        const backgroundBytes = editor.tableBackgroundBytes(message.section, message.listNode);
        reply({
          kind: "table-background-bytes",
          section: message.section,
          listNode: message.listNode,
          bytes: backgroundBytes
        });
      } else if (message.kind === "picture-bytes") {
        if (!editor || !["hwpx", "hwp5"].includes(format))
          throw new Error("PictureReadUnavailable");
        const pictureBytes = format === "hwp5" ? readHwp5PictureBytes(editor, message.section, message.pictureNode) : editor.pictureBytes(message.section, message.pictureNode);
        reply({
          kind: "picture-bytes",
          section: message.section,
          pictureNode: message.pictureNode,
          bytes: pictureBytes
        });
      } else if (message.kind === "unlock") {
        if (!bytes || !module)
          throw new Error("PasswordDocumentNotLoaded");
        const decoder = await (format === "hwpx" ? createHwpxPasswordDecoder(module) : createHwp5PasswordDecoder(module));
        let plaintext;
        try {
          plaintext = decoder.decryptToPlaintext(bytes, message.password);
        } finally {
          decoder.close();
          delete message.password;
        }
        if (!plaintext)
          throw new Error("DocumentNotEncrypted");
        let next;
        try {
          reader = await (format === "hwpx" ? createHwpxReader(module) : createHwp5Reader(module));
          const current = format === "hwpx" ? reader.readTextEvents(plaintext) : reader.readText(plaintext);
          if (format === "hwpx") {
            next = await createHwpxEditor2(module);
            next.open(plaintext, { allowObservedChartOleDeviations: hwpxChartOlePolicy });
          } else
            next = await createExperimentalHwp5Editor(module, plaintext);
          editor?.close();
          editor = next;
          next = undefined;
          bytes = plaintext;
          preview = current;
          protectionRemoved = true;
          historyEnabled = false;
          historyPoisoned = false;
          reply({ kind: "unlock", content: format === "hwpx" ? hwpxDisplay() : hwp5Display() });
        } catch (error) {
          next?.close();
          if (bytes !== plaintext)
            plaintext.fill(0);
          throw error;
        }
      } else if (message.kind === "save") {
        requirePasswordRemovalConsent(protectionRemoved, message.allowUnprotectedOutput);
        const saved = saveDocument(editor, format, message.allowStaleLayout === undefined ? false : message.allowStaleLayout);
        reply({
          kind: "save",
          ...saved,
          ...protectionRemoved ? { passwordProtectionRemoved: true } : {}
        });
      } else if (message.kind === "splice-font-name" || message.kind === "splice-character-properties") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error(message.kind === "splice-font-name" ? "UnsupportedNamedFontTextEditing" : "UnsupportedCharacterPropertyTextEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        if (message.rangePolicy !== undefined && message.rangePolicy !== "reject")
          throw new Error("InvalidRangePolicy");
        if (!Number.isInteger(message.paragraph) || message.paragraph < 0 || message.paragraph > (format === "hwpx" ? 4294967294 : 4294967295))
          throw new RangeError("Invalid paragraph");
        const paragraph = message.paragraph + (format === "hwpx" ? 1 : 0);
        let textMode = "plain", beginElement = 0;
        if (format === "hwpx" && !editor.canEdit(message.section, paragraph)) {
          const target = hwpxFieldRangeTarget(editor, hwpxCreatedTablesPending, message.section, paragraph, message.startUnit, message.endUnit);
          if (target !== null) {
            textMode = "field";
            beginElement = target.beginElement;
          } else if (outsideFieldRange(message.section, paragraph, message.startUnit, message.endUnit))
            textMode = "plain";
          else if (anchorView(message.section, paragraph) !== null)
            textMode = "anchored";
          else
            throw new Error("UnsupportedFieldLabelRange");
        }
        if (message.kind === "splice-font-name")
          editor.spliceWithFontName({ ...message, paragraph, textMode, beginElement });
        else
          editor.spliceWithCharacterProperties({ ...message, paragraph, textMode, beginElement });
        applied = true;
        if (format === "hwpx") {
          reader = await createHwpxReader(module);
          preview = reader.readTextEvents(editor.saveForDisplay());
        } else {
          await refreshHwp5PreviewFallback();
        }
        reply({ kind: message.kind, content: format === "hwpx" ? hwpxDisplay() : hwp5Display() });
      } else if (message.kind === "character-font-name") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterFontNameEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        if (!Number.isInteger(message.paragraph) || message.paragraph < 0 || message.paragraph > (format === "hwpx" ? 4294967294 : 4294967295))
          throw new RangeError("Invalid paragraph");
        editor.setCharacterFontName({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          startUnit: message.startUnit,
          endUnit: message.endUnit,
          language: message.language,
          name: message.name
        });
        applied = true;
        reply({
          kind: "character-font-name",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-font") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterFontEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        if (!Number.isInteger(message.paragraph) || message.paragraph < 0 || message.paragraph > (format === "hwpx" ? 4294967294 : 4294967295))
          throw new RangeError("Invalid paragraph");
        editor.setCharacterFont({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          startUnit: message.startUnit,
          endUnit: message.endUnit,
          language: message.language,
          fontId: message.fontId
        });
        applied = true;
        reply({
          kind: "character-font",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-outline") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterOutlineEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        if (!Number.isInteger(message.paragraph) || message.paragraph < 0 || message.paragraph > (format === "hwpx" ? 4294967294 : 4294967295))
          throw new RangeError("Invalid paragraph");
        editor.setCharacterOutline({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          startUnit: message.startUnit,
          endUnit: message.endUnit,
          kind: message.outlineKind
        });
        applied = true;
        reply({
          kind: "character-outline",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-effect") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterEffectEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        if (!Number.isInteger(message.paragraph) || message.paragraph < 0 || message.paragraph > (format === "hwpx" ? 4294967294 : 4294967295))
          throw new RangeError("Invalid paragraph");
        editor.setCharacterEffect({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          startUnit: message.startUnit,
          endUnit: message.endUnit,
          effect: message.effect,
          enabled: message.enabled,
          exclusive: message.exclusive
        });
        applied = true;
        reply({
          kind: "character-effect",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-shade") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterShadeEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        if (!Number.isInteger(message.paragraph) || message.paragraph < 0 || message.paragraph > (format === "hwpx" ? 4294967294 : 4294967295))
          throw new RangeError("Invalid paragraph");
        editor.setCharacterShade({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          startUnit: message.startUnit,
          endUnit: message.endUnit,
          color: message.color
        });
        applied = true;
        reply({
          kind: "character-shade",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-text-color") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterTextColorEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.setCharacterTextColor({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          startUnit: message.startUnit,
          endUnit: message.endUnit,
          color: message.color
        });
        applied = true;
        reply({
          kind: "character-text-color",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-strike-color") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterStrikeColorEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        if (!Number.isInteger(message.paragraph) || message.paragraph < 0 || message.paragraph > (format === "hwpx" ? 4294967294 : 4294967295))
          throw new RangeError("InvalidTextPosition");
        editor.setCharacterStrikeColor({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          startUnit: message.startUnit,
          endUnit: message.endUnit,
          color: message.color
        });
        applied = true;
        reply({
          kind: "character-strike-color",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-underline-color") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterUnderlineColorEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.setCharacterUnderlineColor({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          startUnit: message.startUnit,
          endUnit: message.endUnit,
          color: message.color
        });
        applied = true;
        reply({
          kind: "character-underline-color",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-strike") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterStrikeEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        if (!Number.isInteger(message.paragraph) || message.paragraph < 0 || message.paragraph > (format === "hwpx" ? 4294967294 : 4294967295))
          throw new RangeError("InvalidTextPosition");
        editor.setCharacterStrike({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          startUnit: message.startUnit,
          endUnit: message.endUnit,
          enabled: message.enabled
        });
        applied = true;
        reply({
          kind: "character-strike",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-underline") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterUnderlineEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.setCharacterUnderline({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          startUnit: message.startUnit,
          endUnit: message.endUnit,
          kind: message.underlineKind
        });
        applied = true;
        reply({
          kind: "character-underline",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "replace-paragraph-ranges") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedParagraphReplacement");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        encodeCharacterRanges(message.ranges);
        const ranges = message.ranges.map((range) => ({
          ...range,
          paragraph: range.paragraph + (format === "hwpx" ? 1 : 0)
        }));
        if (Object.hasOwn(message, "language") || Object.hasOwn(message, "name")) {
          editor.replaceParagraphRangesWithFontName({
            ranges,
            text: message.text,
            language: message.language,
            name: message.name,
            properties: message.properties
          });
        } else
          editor.replaceParagraphRanges({
            ranges,
            text: message.text,
            properties: message.properties
          });
        applied = true;
        if (format === "hwpx") {
          reader = await createHwpxReader(module);
          preview = reader.readTextEvents(editor.saveForDisplay());
        } else {
          await refreshHwp5PreviewFallback();
        }
        reply({
          kind: "replace-paragraph-ranges",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-font-name-ranges") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterFontNameEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        encodeCharacterRanges(message.ranges);
        if (format === "hwpx" && message.ranges.some((range) => range.paragraph === 4294967295))
          throw new RangeError("Invalid paragraph");
        const ranges = message.ranges.map((range) => ({
          ...range,
          paragraph: range.paragraph + (format === "hwpx" ? 1 : 0)
        }));
        editor.setCharacterFontNameRanges({
          ranges,
          language: message.language,
          name: message.name
        });
        applied = true;
        reply({ kind: message.kind, content: format === "hwpx" ? hwpxDisplay() : hwp5Display() });
      } else if (message.kind === "character-font-ranges") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterFontEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        encodeCharacterRanges(message.ranges);
        const ranges = message.ranges.map((range) => ({
          ...range,
          paragraph: range.paragraph + (format === "hwpx" ? 1 : 0)
        }));
        editor.setCharacterFontRanges({
          ranges,
          language: message.language,
          fontId: message.fontId
        });
        applied = true;
        reply({
          kind: "character-font-ranges",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-outline-ranges") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterOutlineEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        encodeCharacterRanges(message.ranges);
        if (format === "hwpx" && message.ranges.some((range) => range.paragraph === 4294967295))
          throw new RangeError("InvalidTextPosition");
        const ranges = message.ranges.map((range) => ({
          ...range,
          paragraph: range.paragraph + (format === "hwpx" ? 1 : 0)
        }));
        editor.setCharacterOutlineRanges({ ranges, kind: message.outlineKind });
        applied = true;
        reply({
          kind: "character-outline-ranges",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-effect-ranges") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterEffectEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        encodeCharacterRanges(message.ranges);
        if (format === "hwpx" && message.ranges.some((range) => range.paragraph === 4294967295))
          throw new RangeError("InvalidTextPosition");
        const ranges = message.ranges.map((range) => ({
          ...range,
          paragraph: range.paragraph + (format === "hwpx" ? 1 : 0)
        }));
        editor.setCharacterEffectRanges({
          ranges,
          effect: message.effect,
          enabled: message.enabled,
          exclusive: message.exclusive
        });
        applied = true;
        reply({
          kind: "character-effect-ranges",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-shade-ranges") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterShadeEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        encodeCharacterRanges(message.ranges);
        if (format === "hwpx" && message.ranges.some((range) => range.paragraph === 4294967295))
          throw new RangeError("InvalidTextPosition");
        const ranges = message.ranges.map((range) => ({
          ...range,
          paragraph: range.paragraph + (format === "hwpx" ? 1 : 0)
        }));
        editor.setCharacterShadeRanges({ ranges, color: message.color });
        applied = true;
        reply({
          kind: "character-shade-ranges",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-text-color-ranges") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterTextColorEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        encodeCharacterRanges(message.ranges);
        const ranges = message.ranges.map((range) => ({
          ...range,
          paragraph: range.paragraph + (format === "hwpx" ? 1 : 0)
        }));
        editor.setCharacterTextColorRanges({ ranges, color: message.color });
        applied = true;
        reply({
          kind: "character-text-color-ranges",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-strike-ranges") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterStrikeEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        encodeCharacterRanges(message.ranges);
        if (format === "hwpx" && message.ranges.some((range) => range.paragraph === 4294967295))
          throw new RangeError("InvalidTextPosition");
        const ranges = message.ranges.map((range) => ({
          ...range,
          paragraph: range.paragraph + (format === "hwpx" ? 1 : 0)
        }));
        editor.setCharacterStrikeRanges({ ranges, enabled: message.enabled });
        applied = true;
        reply({
          kind: "character-strike-ranges",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-underline-ranges") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterUnderlineEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        encodeCharacterRanges(message.ranges);
        if (format === "hwpx" && message.ranges.some((range) => range.paragraph === 4294967295))
          throw new RangeError("Invalid paragraph");
        const ranges = message.ranges.map((range) => ({
          ...range,
          paragraph: range.paragraph + (format === "hwpx" ? 1 : 0)
        }));
        editor.setCharacterUnderlineRanges({ ranges, kind: message.underlineKind });
        applied = true;
        reply({
          kind: "character-underline-ranges",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-properties-ranges") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterPropertiesEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        encodeCharacterRanges(message.ranges);
        const ranges = message.ranges.map((range) => ({
          ...range,
          paragraph: range.paragraph + (format === "hwpx" ? 1 : 0)
        }));
        editor.setCharacterPropertiesRanges({ ranges, properties: message.properties });
        applied = true;
        reply({
          kind: "character-properties-ranges",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "character-properties") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedCharacterPropertiesEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.setCharacterProperties({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          startUnit: message.startUnit,
          endUnit: message.endUnit,
          properties: message.properties
        });
        applied = true;
        reply({
          kind: "character-properties",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "paragraph-spacing") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedParagraphSpacingEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.setParagraphSpacing({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          type: message.type,
          value: message.value
        });
        applied = true;
        reply({
          kind: "paragraph-spacing",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "paragraph-margins") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedParagraphMarginsEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.setParagraphMargins({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          margins: message.margins
        });
        applied = true;
        reply({
          kind: "paragraph-margins",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "paragraph-alignment") {
        if (format !== "hwpx" && format !== "hwp5")
          throw new Error("UnsupportedParagraphAlignmentEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.setParagraphAlignment({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          alignment: message.alignment
        });
        applied = true;
        reply({
          kind: "paragraph-alignment",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "paragraph-format") {
        if (format !== "hwp5" && format !== "hwpx")
          throw new Error("UnsupportedParagraphFormatEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.setParagraphFormat({
          section: message.section,
          paragraph: message.paragraph + (format === "hwpx" ? 1 : 0),
          paraShapeId: message.paraShapeId
        });
        applied = true;
        reply({
          kind: "paragraph-format",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "formula-definition") {
        if (format !== "hwpx" && format !== "hwp5")
          throw new Error("UnsupportedFormulaDefinitionEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        if (format === "hwp5")
          editor.setFormulaDefinition({
            section: message.section,
            sourceNode: message.beginElement,
            formula: message.formula
          });
        else
          editor.setFormulaDefinition(message.section, message.beginElement, message.formula);
        applied = true;
        if (format === "hwp5") {
          await refreshHwp5PreviewFallback();
          reply({ kind: "formula-definition", content: hwp5Display() });
        } else {
          reader = await createHwpxReader(module);
          preview = reader.readTextEvents(editor.saveForDisplay());
          reply({ kind: "formula-definition", content: hwpxDisplay() });
        }
      } else if (message.kind === "chart-display") {
        if (format !== "hwpx")
          throw new Error("UnsupportedChartEditing");
        if (!editor)
          throw new Error("EditorNotOpen");
        const chart = editor.chartDisplay(message.section, message.wrapper);
        reply({
          kind: message.kind,
          requestId: message.requestId,
          section: message.section,
          wrapper: message.wrapper,
          chart
        });
      } else if (message.kind === "chart-points" || message.kind === "chart-series-text" || message.kind === "chart-rich-text") {
        if (format !== "hwpx")
          throw new Error("UnsupportedChartEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        const chart = message.kind === "chart-rich-text" ? editor.chartRichText(message.section, message.wrapper) : message.kind === "chart-series-text" ? editor.chartSeriesText(message.section, message.wrapper) : editor.chartPoints(message.section, message.wrapper);
        reply({
          kind: message.kind,
          requestId: message.requestId,
          section: message.section,
          wrapper: message.wrapper,
          chart
        });
      } else if (message.kind === "chart-points-set" || message.kind === "chart-numeric-point" || message.kind === "chart-point" || message.kind === "chart-series-text-set" || message.kind === "chart-rich-text-set") {
        if (format !== "hwpx")
          throw new Error("UnsupportedChartEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        if (message.kind === "chart-points-set")
          applyChartPointBatchCommand(editor, message);
        else if (message.kind === "chart-rich-text-set")
          editor.setChartRichText(message.section, message.wrapper, message.ordinal, message.value);
        else if (message.kind === "chart-series-text-set")
          editor.setChartSeriesText(message.section, message.wrapper, message.ordinal, message.value);
        else if (message.kind === "chart-point")
          editor.setChartPoint(message.section, message.wrapper, message.point, message.value);
        else
          editor.setChartNumericPoint(message.section, message.wrapper, message.point, message.value);
        applied = true;
        reader = await createHwpxReader(module);
        preview = reader.readTextEvents(editor.saveForDisplay());
        const chart = message.kind === "chart-rich-text-set" ? editor.chartRichText(message.section, message.wrapper) : message.kind === "chart-series-text-set" ? editor.chartSeriesText(message.section, message.wrapper) : editor.chartPoints(message.section, message.wrapper);
        reply({ kind: message.kind, content: hwpxDisplay(), chart });
      } else if (message.kind === "manual-formula-result") {
        if (format !== "hwpx")
          throw new Error("UnsupportedManualFormulaResultEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        if (typeof editor.setManualFormulaResult !== "function")
          throw new Error("HwpxManualFormulaResultAbiUnavailable");
        editor.setManualFormulaResult(message.section, message.beginElement, message.display);
        applied = true;
        reader = await createHwpxReader(module);
        preview = reader.readTextEvents(editor.saveForDisplay());
        reply({ kind: "manual-formula-result", content: hwpxDisplay() });
      } else if (message.kind === "inline-string-sources") {
        if (format !== "hwpx")
          throw new Error("UnsupportedInlineStringSources");
        if (!editor)
          throw new Error("EditorNotOpen");
        reply({
          kind: message.kind,
          requestId: message.requestId,
          sources: editor.inlineStringSources()
        });
      } else if (message.kind === "equation-sources") {
        if (format !== "hwpx")
          throw new Error("UnsupportedEquationScriptEditing");
        if (!editor)
          throw new Error("EditorNotOpen");
        reply({
          kind: message.kind,
          ...equationQueryIdentity(message),
          sources: editor.equationSources(message.section)
        });
      } else if (message.kind === "equation-script-query") {
        if (format !== "hwpx")
          throw new Error("UnsupportedEquationScriptEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        reply({
          kind: message.kind,
          ...equationQueryIdentity(message),
          equation: readEquationScript(editor, message)
        });
      } else if (message.kind === "equation-script-set") {
        if (format !== "hwpx")
          throw new Error("UnsupportedEquationScriptEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        writeEquationScript(editor, message);
        applied = true;
        const equation = readEquationScript(editor, message);
        reader = await createHwpxReader(module);
        preview = reader.readTextEvents(editor.saveForDisplay());
        reply({
          kind: message.kind,
          ...equationQueryIdentity(message),
          equation,
          content: hwpxDisplay()
        });
      } else if (message.kind === "dutmal-text-query") {
        if (format !== "hwpx")
          throw new Error("UnsupportedDutmalTextEditing");
        if (!editor)
          throw new Error("EditorNotOpen");
        reply({
          kind: message.kind,
          requestId: message.requestId,
          dutmal: readDutmalText(editor, message)
        });
      } else if (message.kind === "dutmal-text") {
        if (format !== "hwpx")
          throw new Error("UnsupportedDutmalTextEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        const dutmal = writeDutmalText(editor, message);
        applied = true;
        reader = await createHwpxReader(module);
        preview = reader.readTextEvents(editor.saveForDisplay());
        reply({ kind: message.kind, requestId: message.requestId, dutmal, content: hwpxDisplay() });
      } else if (message.kind === "radio-select") {
        if (format !== "hwp5")
          throw new Error("UnsupportedRadioSelectEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.selectRadioButton(message.section, message.formNode);
        applied = true;
        reply({ kind: message.kind, content: hwp5Display() });
      } else if (message.kind === "checkbox-state") {
        if (format !== "hwpx" && format !== "hwp5")
          throw new Error("UnsupportedCheckBoxStateEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.setCheckBoxState(message.section, message.formNode, message.state);
        applied = true;
        reply({
          kind: "checkbox-state",
          content: format === "hwp5" ? hwp5Display() : hwpxDisplay()
        });
      } else if (message.kind === "form-text") {
        if (format !== "hwp5")
          throw new Error("UnsupportedFormTextEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.setFormText({
          section: message.section,
          formNode: message.formNode,
          text: message.text
        });
        applied = true;
        reply({ kind: message.kind, content: hwp5Display() });
      } else if (message.kind === "picture-resize") {
        if (format !== "hwpx" && format !== "hwp5")
          throw new Error("UnsupportedPictureResizeEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.resizePicture({
          section: message.section,
          pictureNode: message.pictureNode,
          width: message.width,
          height: message.height
        });
        applied = true;
        reply({
          kind: "picture-resize",
          content: format === "hwp5" ? hwp5Display() : hwpxDisplay()
        });
      } else if (message.kind === "picture-current-size") {
        if (format !== "hwp5")
          throw new Error("UnsupportedPictureCurrentSizeEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.setPictureCurrentSize({
          section: message.section,
          pictureNode: message.pictureNode,
          width: message.width,
          height: message.height
        });
        applied = true;
        reply({ kind: "picture-current-size", content: hwp5Display() });
      } else if (message.kind === "picture-dimensions") {
        if (format !== "hwpx")
          throw new Error("UnsupportedPictureDimensionEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.setPictureDimensions({
          section: message.section,
          pictureNode: message.pictureNode,
          display: message.display,
          original: message.original,
          current: message.current
        });
        applied = true;
        reply({ kind: "picture-dimensions", content: hwpxDisplay() });
      } else if (message.kind === "table-column-width") {
        if (format !== "hwpx" && format !== "hwp5")
          throw new Error("UnsupportedCellSizeEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        const content = format === "hwpx" ? hwpxDisplay() : hwp5Display();
        const table = content.tables?.find((row) => row.section === message.section && row.tableNode === message.tableNode);
        const plan = tableColumnWidthPlan(table, message);
        if (plan.state !== "planned")
          throw new Error(plan.error);
        editor.setCellSizes(plan.cells);
        applied = plan.cells.length !== 0;
        reply({
          kind: "table-column-width",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "cell-styles") {
        if (format !== "hwpx" && format !== "hwp5")
          throw Error("UnsupportedCellStyleEditing");
        if (!editor || !historyEnabled)
          throw Error("EditorNotOpen");
        const value = validateCellStylesMessage(message);
        editor.setCellStyles({
          borders: value.borders,
          fills: value.fills,
          ...Object.hasOwn(value, "diagonals") ? { diagonals: value.diagonals } : {}
        });
        applied = true;
        reply({ kind: "cell-styles", content: format === "hwpx" ? hwpxDisplay() : hwp5Display() });
      } else if (message.kind === "cell-appearance") {
        if (format !== "hwpx" && format !== "hwp5")
          throw Error("UnsupportedCellAppearanceEditing");
        if (!editor || !historyEnabled)
          throw Error("EditorNotOpen");
        const value = validateCellAppearanceMessage(message);
        editor.setCellAppearance({ cells: value.cells, background: value.background });
        applied = true;
        reply({
          kind: "cell-appearance",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "cell-borders") {
        if (format !== "hwpx" && format !== "hwp5")
          throw Error("UnsupportedCellBorderEditing");
        if (!editor || !historyEnabled)
          throw Error("EditorNotOpen");
        const cells = validateCellBordersMessage(message);
        editor.setCellBorders(cells);
        applied = true;
        reply({ kind: "cell-borders", content: format === "hwpx" ? hwpxDisplay() : hwp5Display() });
      } else if (message.kind === "cell-border") {
        if (format !== "hwpx" && format !== "hwp5")
          throw new Error("UnsupportedCellBorderEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        const value = validateCellBorderMessage(message);
        editor.setCellBorder(value);
        applied = true;
        reply({ kind: "cell-border", content: format === "hwpx" ? hwpxDisplay() : hwp5Display() });
      } else if (message.kind === "cell-background") {
        if (format !== "hwpx" && format !== "hwp5")
          throw new Error("UnsupportedCellBackgroundEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        const value = validateCellBackgroundMessage(message);
        editor.setCellBackground(value);
        applied = true;
        reply({
          kind: "cell-background",
          content: format === "hwpx" ? hwpxDisplay() : hwp5Display()
        });
      } else if (message.kind === "cell-size") {
        if (format !== "hwpx" && format !== "hwp5")
          throw new Error("UnsupportedCellSizeEditing");
        if (!editor || !historyEnabled)
          throw new Error("EditorNotOpen");
        editor.setCellSize({
          section: message.section,
          listNode: message.listNode,
          width: message.width,
          height: message.height
        });
        applied = true;
        reply({ kind: "cell-size", content: format === "hwpx" ? hwpxDisplay() : hwp5Display() });
      } else if (message.kind === "enable") {
        if (format === "hwpx") {
          if (message.normalizeObservedCfb !== undefined)
            throw new Error("UnsupportedNormalizationFormat");
          if (message.retainObservedDocInfo !== undefined)
            throw new Error("UnsupportedObservedDocInfoFormat");
          if (!editor) {
            const next = await createHwpxEditor2(module);
            try {
              next.open(bytes);
            } catch (error) {
              next.close();
              throw error;
            }
            editor = next;
          }
          if (!historyEnabled) {
            editor.enableHistoryDefault(message.history);
            historyEnabled = true;
          }
          const structureAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_split" && entry.kind === "function");
          const splitQueryAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_can_split" && entry.kind === "function");
          const mergeAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_merge" && entry.kind === "function");
          const formattingAvailable = [
            "hwpx_edit_set_character_format",
            "hwpx_edit_character_shape_ids"
          ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
          const charShapeIds = formattingAvailable ? editor.characterShapeIds() : [];
          const displayAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_character_shapes" && entry.kind === "function");
          let characterShapes = null, characterShapesError = null;
          if (displayAvailable) {
            try {
              characterShapes = editor.characterShapes();
            } catch (error) {
              characterShapesError = error.message;
            }
          }
          const cellSizeAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_cell_size" && entry.kind === "function");
          const cellBackgroundAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_cell_background" && entry.kind === "function");
          const cellBorderAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_cell_border" && entry.kind === "function");
          const cellBorderBatchAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_cell_borders" && entry.kind === "function");
          const cellAppearanceAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_cell_appearance" && entry.kind === "function");
          const cellStyleBatchAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_cell_styles" && entry.kind === "function");
          const cellDiagonalAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_cell_styles_v2" && entry.kind === "function");
          const cellSizeBatchAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_cell_sizes" && entry.kind === "function");
          const pictureDimensionsAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_set_picture_dimensions" && entry.kind === "function");
          const pictureResizeAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwpx_edit_resize_picture" && entry.kind === "function");
          const dutmalTextAvailable = [
            "hwpx_edit_inline_string_sources",
            "hwpx_edit_dutmal_text",
            "hwpx_edit_set_dutmal_text",
            "hwpx_edit_dutmal_text_max_bytes"
          ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
          const equationScriptAvailable = [
            "hwpx_edit_equation_sources",
            "hwpx_edit_equation_script",
            "hwpx_edit_set_equation_script",
            "hwpx_edit_equation_script_max_bytes",
            "hwpx_edit_history_revision"
          ].every((name) => WebAssembly.Module.exports(module).some((entry) => entry.name === name && entry.kind === "function"));
          reply({
            kind: "enable",
            paragraphBreakAvailable: editor.supportsParagraphBreaks(),
            dutmalTextAvailable,
            equationScriptAvailable,
            equationSectionCount: equationScriptAvailable ? preview.sectionCount : 0,
            charShapeCount: charShapeIds.length,
            charShapeIds,
            characterShapes,
            characterShapesError,
            historyAvailable: true,
            structureAvailable,
            splitQueryAvailable,
            mergeAvailable,
            cellSizeAvailable,
            cellBackgroundAvailable,
            cellBorderAvailable,
            cellBorderBatchAvailable,
            cellAppearanceAvailable,
            cellStyleBatchAvailable,
            cellDiagonalAvailable,
            cellSizeBatchAvailable,
            pictureDimensionsAvailable,
            pictureResizeAvailable,
            content: reusableLoad && requestSequence === requestTicket && reusableLoad.ticket === requestTicket - 1 && reusableLoad.editor === editor && reusableLoad.preview === preview && reusableLoad.bytes === bytes && reusableLoad.module === module && reusableLoad.window === documentWindow && reusableLoad.chartOlePolicy === hwpxChartOlePolicy && reusableLoad.protectionRemoved === protectionRemoved && reusableLoad.createdTablesPending === hwpxCreatedTablesPending && Object.keys(message).every((key) => ["kind", "origin", "requestId"].includes(key)) ? reusableLoad.content : hwpxDisplay()
          });
          return;
        }
        if (message.distribution !== undefined && typeof message.distribution !== "boolean")
          throw new Error("InvalidDistributionPolicy");
        if (message.normalizeObservedCfb !== undefined && typeof message.normalizeObservedCfb !== "boolean")
          throw new Error("InvalidNormalizationPolicy");
        if (message.retainObservedDocInfo !== undefined && typeof message.retainObservedDocInfo !== "boolean")
          throw new Error("InvalidObservedDocInfoPolicy");
        if (message.retainObservedDocInfo === true && editor)
          throw new Error("ObservedDocInfoRequiresFreshSession");
        if (message.normalizeObservedCfb === true && !normalizationMetadataAvailable())
          throw new Error("Hwp5NormalizationAbiUnavailable");
        editor ??= await createExperimentalHwp5Editor(module, bytes, {
          distribution: message.distribution ?? false,
          normalizeObservedCfb: message.normalizeObservedCfb ?? false,
          retainObservedDocInfo: message.retainObservedDocInfo ?? false
        });
        if (!historyEnabled) {
          editor.enableHistoryDefault(message.history);
          historyEnabled = true;
        }
        const structureAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_split" && entry.kind === "function");
        const mergeAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_merge" && entry.kind === "function");
        let characterShapes = null, characterShapesError = null;
        try {
          characterShapes = editor.characterShapes();
        } catch (error) {
          characterShapesError = error.message;
        }
        const cellSizeAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_cell_size" && entry.kind === "function");
        const cellBackgroundAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_cell_background" && entry.kind === "function");
        const cellBorderAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_cell_border" && entry.kind === "function");
        const cellBorderBatchAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_cell_borders" && entry.kind === "function");
        const cellAppearanceAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_cell_appearance" && entry.kind === "function");
        const cellStyleBatchAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_cell_styles" && entry.kind === "function");
        const cellDiagonalAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_cell_styles_v2" && entry.kind === "function");
        const cellSizeBatchAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_cell_sizes" && entry.kind === "function");
        const pictureCurrentSizeAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_set_picture_current_size" && entry.kind === "function");
        const pictureResizeAvailable = WebAssembly.Module.exports(module).some((entry) => entry.name === "hwp5_edit_resize_picture" && entry.kind === "function");
        reply({
          kind: "enable",
          formTextAvailable: editor.supportsFormTextEdit(),
          paragraphBreakAvailable: editor.supportsParagraphBreaks(),
          charShapeCount: editor.characterShapeCount(),
          characterShapes,
          characterShapesError,
          historyAvailable: true,
          structureAvailable,
          mergeAvailable,
          cellSizeAvailable,
          cellBackgroundAvailable,
          cellBorderAvailable,
          cellBorderBatchAvailable,
          cellAppearanceAvailable,
          cellStyleBatchAvailable,
          cellDiagonalAvailable,
          cellSizeBatchAvailable,
          pictureCurrentSizeAvailable,
          pictureResizeAvailable,
          content: hwp5Display()
        });
      } else if (message.kind === "undo" || message.kind === "redo") {
        if (!editor)
          throw new Error("EditorNotOpen");
        let historyHint = null, beforeOwner = null, beforeRevision;
        if (format === "hwp5" && historyEnabled && ownerWindowProjection && typeof ownerWindowProjection === "object") {
          try {
            const h = ownerWindowProjection, o = h.owner;
            const uint = (n) => Number.isSafeInteger(n) && n >= 0 && n < 4294967295;
            if (h.kind === "history-window-v1" && h.operation === message.kind && uint(h.beforeRevision) && uint(h.expectedRevision) && typeof h.beforeEpoch === "string" && /^[1-9][0-9]{0,19}$/.test(h.beforeEpoch) && o && [o.section, o.paragraph, o.sourceNode].every(uint) && (o.parentNode === null || uint(o.parentNode))) {
              const actual = editor.historyRevision();
              const captured = editor.captureExclusiveTextOwner(o.section, o.paragraph);
              if (actual === h.beforeRevision && captured?.window.epoch === h.beforeEpoch && captured.window.sourceNode === o.sourceNode && captured.window.parentNode === o.parentNode) {
                historyHint = h;
                beforeOwner = captured;
                beforeRevision = actual;
              }
            }
          } catch {}
        }
        const changed = message.kind === "undo" ? editor.undo() : editor.redo();
        applied = changed;
        if (changed && historyHint) {
          try {
            const o = historyHint.owner, revision = editor.historyRevision();
            const fresh = revision === historyHint.expectedRevision ? editor.readCurrentOwnerWindow(o.section, o.paragraph) : null;
            if (fresh && fresh.window.sourceNode === o.sourceNode && fresh.window.parentNode === o.parentNode && BigInt(fresh.window.epoch) > BigInt(beforeOwner.window.epoch)) {
              hwp5PreviewDirty = true;
              reply({
                kind: message.kind,
                changed,
                content: {
                  viewKind: "history-owner-window",
                  version: 1,
                  operation: message.kind,
                  beforeRevision,
                  revision,
                  beforeEpoch: beforeOwner.window.epoch,
                  epoch: fresh.window.epoch,
                  owner: { ...o },
                  ...fresh
                }
              });
              return;
            }
          } catch {}
        }
        if (format === "hwpx") {
          reader = await createHwpxReader(module);
          preview = reader.readTextEvents(editor.saveForDisplay());
          reply({ kind: message.kind, changed, content: hwpxDisplay() });
        } else {
          await refreshHwp5PreviewFallback();
          reply({ kind: message.kind, changed, content: hwp5Display() });
        }
      } else if (message.kind === "split" || message.kind === "merge") {
        if (!editor)
          throw new Error("EditorNotOpen");
        paragraphBreakIntent(message);
        if (format === "hwpx") {
          if (!Number.isInteger(message.paragraph) || message.paragraph < 0 || message.paragraph >= 4294967295)
            throw new Error("InvalidParagraphIndex");
          const target = { ...message, paragraph: message.paragraph + 1 };
          if (message.kind === "split") {
            if (message.anchored !== undefined && typeof message.anchored !== "boolean")
              throw new Error("InvalidAnchorMode");
            applyParagraphSplit(editor, target, message, true);
          } else if (message.rightParagraph !== undefined) {
            if (!Number.isInteger(message.rightParagraph) || message.rightParagraph < 0 || message.rightParagraph >= 4294967295)
              throw new Error("InvalidParagraphIndex");
            editor.mergeParagraphPair({ ...target, rightParagraph: message.rightParagraph + 1 });
          } else
            editor.mergeParagraph(target);
          applied = true;
          reader = await createHwpxReader(module);
          preview = reader.readTextEvents(editor.saveForDisplay());
          const content = hwpxDisplay();
          const splitParagraph = message.kind === "split" ? content.paragraphs.find((row) => row.section === message.section && row.paragraph === message.paragraph)?.nextMergeParagraph : undefined;
          reply({
            kind: message.kind,
            content,
            ...message.kind === "split" ? {
              splitTarget: Number.isInteger(splitParagraph) ? { section: message.section, paragraph: splitParagraph } : null
            } : {}
          });
          return;
        }
        if (message.kind === "merge" && message.rightParagraph !== undefined)
          throw new Error("UnsupportedMergeTarget");
        if (message.kind === "split")
          applyParagraphSplit(editor, message, message);
        else
          editor.mergeParagraph(message);
        applied = true;
        await refreshHwp5PreviewFallback();
        const content = hwp5Display();
        const right = message.kind === "split" ? content.paragraphs.find((row) => row.section === message.section && row.paragraph === message.paragraph + 1 && row.editable) : null;
        reply({
          kind: message.kind,
          content,
          ...message.kind === "split" ? { splitTarget: right ? { section: right.section, paragraph: right.paragraph } : null } : {}
        });
      } else if (message.kind === "splice" || message.kind === "format") {
        if (!editor)
          throw new Error("EditorNotOpen");
        if (format === "hwpx") {
          if (message.rangePolicy && message.rangePolicy !== "reject")
            throw new Error("InvalidRangePolicy");
          if (!Number.isInteger(message.startUnit) || !Number.isInteger(message.endUnit) || message.endUnit < message.startUnit)
            throw new Error("InvalidTextPosition");
          const plainTextSplice = message.kind === "splice" && editor.canEdit(message.section, message.paragraph + 1);
          if (!plainTextSplice)
            displayResources.invalidate();
          if (message.kind === "format") {
            editor.setCharacterFormat({ ...message, paragraph: message.paragraph + 1 });
          } else if (plainTextSplice) {
            editor.splice(message.section, message.paragraph + 1, message.startUnit, message.endUnit - message.startUnit, message.text);
          } else if (spliceFormulaResultText(editor, module, message)) {} else {
            const target = hwpxFieldRangeTarget(editor, hwpxCreatedTablesPending, message.section, message.paragraph + 1, message.startUnit, message.endUnit);
            if (target) {
              editor.spliceFieldLabel(message.section, message.paragraph + 1, target.beginElement, message.startUnit, message.endUnit - message.startUnit, message.text);
            } else if (outsideFieldRange(message.section, message.paragraph + 1, message.startUnit, message.endUnit)) {
              editor.splice(message.section, message.paragraph + 1, message.startUnit, message.endUnit - message.startUnit, message.text);
            } else if (anchorView(message.section, message.paragraph + 1) !== null) {
              editor.spliceAnchored(message.section, message.paragraph + 1, message.startUnit, message.endUnit - message.startUnit, message.text);
            } else {
              const targets = editor.fieldLabels(message.section, message.paragraph + 1);
              if (targets.length === 0) {
                editor.splice(message.section, message.paragraph + 1, message.startUnit, message.endUnit - message.startUnit, message.text);
              } else {
                throw new Error("UnsupportedFieldLabelRange");
              }
            }
          }
          applied = true;
          reader = await createHwpxReader(module);
          preview = reader.readTextEvents(editor.saveForDisplay());
          reply({ kind: message.kind, content: hwpxDisplay() });
          return;
        }
        if (message.kind === "splice" && message.reference !== undefined) {
          editor.spliceCurrent(message);
          applied = true;
          captureTextDelta();
          if (projectedOwner()) {
            reply({ kind: message.kind, content: projectedOwner() });
            return;
          }
          await refreshHwp5PreviewFallback();
          reply({ kind: message.kind, content: hwp5Display() });
          return;
        }
        if (message.kind === "splice") {
          editor.splice(message);
          captureTextDelta();
        } else
          editor.setCharacterFormat(message);
        applied = true;
        if (historyEnabled && editor.supportsCurrentTextPreview?.()) {
          reply({ kind: message.kind, content: projectedOwner() ?? hwp5Display() });
          return;
        }
        const raw = editor.copyText(message.section, message.paragraph);
        const p = preview.sections[message.section].paragraphs[message.paragraph];
        const sectionHasFields = preview.sections[message.section].paragraphs.some((paragraph) => paragraph.tokens.some((t) => t.type === "control" && t.code === 3));
        if (sectionHasFields || p.tokens.some((t) => t.type === "control" && t.code !== 13)) {
          await refreshHwp5PreviewFallback();
        } else {
          const text = new TextDecoder("utf-16le", { fatal: true, ignoreBOM: true }).decode(raw.subarray(0, -2));
          preview.sections[message.section].paragraphs[message.paragraph] = raw.length === 0 ? p : {
            ...p,
            text,
            textPresent: true,
            declaredUnits: raw.length / 2,
            tokens: [
              { type: "text", startUnit: 0, text, raw: raw.subarray(0, -2) },
              {
                type: "control",
                startUnit: raw.length / 2 - 1,
                code: 13,
                raw: raw.subarray(-2)
              }
            ]
          };
        }
        reply({ kind: message.kind, content: hwp5Display() });
      } else
        throw new Error("UnknownPreviewCommand");
    } catch (error) {
      mutationUncertain = mutationUncertain || ["MutationUncertain", "HistoryMutationUncertain"].includes(error?.message);
      if (mutationUncertain)
        historyPoisoned = true;
      delete message.password;
      const availableSectionsPreviewAvailable = message.kind === "load" && message.availableSectionsOnly !== true && format === "hwp5" && error.message === "SectionCountMismatch" && availableSectionsCapability(module);
      const availableSectionCopyAvailable = message.kind === "load" && message.availableSectionsOnly !== true && message.availableSectionCopy !== true && format === "hwp5" && error.message === "SectionCountMismatch" && availableSectionCopyCapability(module);
      const passwordRequired = message.kind === "load" && (format === "hwpx" && error.message === "EncryptedDocument" || format === "hwp5" && error.message === "UnsupportedEncryption");
      const queryIdentity = [
        "chart-points",
        "chart-series-text",
        "chart-rich-text",
        "chart-display"
      ].includes(message.kind) ? { requestId: message.requestId, section: message.section, wrapper: message.wrapper } : ["query-edit-range", "query-split-range"].includes(message.kind) ? {
        requestId: message.requestId,
        section: message.section,
        paragraph: message.paragraph,
        startUnit: message.startUnit,
        endUnit: message.endUnit
      } : {};
      const currentIdentity = [
        "query-current-references",
        "query-current-source-references",
        "query-current-text",
        "query-created-tables",
        "splice-current"
      ].includes(message.kind) ? { requestId: message.requestId } : {};
      reply({
        kind: message.kind,
        applied,
        ...availableSectionsPreviewAvailable ? { availableSectionsPreviewAvailable: true } : {},
        ...availableSectionCopyAvailable ? { availableSectionCopyAvailable: true } : {},
        error: error.message || String(error),
        ...queryIdentity,
        ...currentIdentity,
        ...dutmalQueryIdentity(message),
        ...equationQueryIdentity(message),
        ...passwordRequired ? { passwordRequired: true } : {}
      });
    } finally {
      try {
        reader?.close();
      } catch (error) {
        response = minimalError(error);
      }
      response ??= minimalError(new Error("MissingRuntimeReply"));
      if (nativeTextDelta && !response.error)
        response = { ...response, nativeTextDelta };
      try {
        response = structuredClone(response);
      } catch (error) {
        response = minimalError(error);
      }
      if (message.kind === "load" && format === "hwpx" && !response.error && response.content && !historyEnabled && editor && message.password === undefined && requestSequence === requestTicket) {
        try {
          loadProjection = {
            ticket: requestTicket,
            editor,
            preview,
            bytes,
            module,
            window: documentWindow,
            chartOlePolicy: hwpxChartOlePolicy,
            protectionRemoved,
            createdTablesPending: hwpxCreatedTablesPending,
            content: structuredClone(response.content)
          };
        } catch {
          loadProjection = null;
        }
      }
      if (atomicOutcome)
        response = {
          ...response,
          formattingNativeCode: atomicOutcome.nativeCode,
          formattingRefreshRequired: atomicOutcome.refreshRequired === true,
          changed: atomicOutcome.changed
        };
      const revision = response.historyRevision;
      const changed = typeof response.changed === "boolean" ? response.changed : typeof revision === "number" && typeof lastHistoryRevision === "number" ? revision !== lastHistoryRevision : applied ? null : false;
      displayResources.finishRequest(Boolean(response.error), response);
      outcomes.set(response, atomicOutcome ? { application: atomicOutcome.application, changed: atomicOutcome.changed } : {
        application: historyPoisoned || mutationUncertain || ["MutationUncertain", "HistoryMutationUncertain"].includes(response.error) ? "unknown" : applied && changed !== false ? "applied" : "unapplied",
        changed
      });
      if (typeof revision === "number")
        lastHistoryRevision = revision;
      return response;
    }
  }
  let tail = Promise.resolve();
  let terminal = false;
  let loaded = false;
  let disposal;
  function clear() {
    hwp5PreviewDirty = false;
    displayResources.reset();
    try {
      editor?.close();
    } finally {
      if (protectionRemoved)
        bytes?.fill(0);
      module = bytes = preview = editor = format = undefined;
      lastHistoryRevision = undefined;
      historyPoisoned = historyEnabled = hwpxChartOlePolicy = protectionRemoved = hwpxCreatedTablesPending = false;
      hwp5StyleOpenError = documentWindow = null;
    }
  }
  return {
    outcome(reply) {
      return { ...outcomes.get(reply) };
    },
    request(input, admission, ownerWindowProjection = false) {
      if (admission !== undefined && typeof admission !== "function")
        return Promise.reject(Error("InvalidRuntimeAdmission"));
      const requestTicket = ++requestSequence;
      const reusableLoad = loadProjection;
      loadProjection = null;
      if (terminal)
        return Promise.reject(new Error("RuntimeDisposed"));
      let message;
      try {
        message = copyRuntimeMessage(input);
      } catch (error) {
        displayResources.invalidate();
        return Promise.reject(error);
      }
      const secret = message.password;
      const task = tail.then(async () => {
        if (terminal)
          throw new Error("RuntimeDisposed");
        if (message.kind === "load") {
          if (loaded && !allowReload)
            throw new Error("RuntimeDocumentAlreadyLoaded");
          hwp5PreviewDirty = false;
          loaded = true;
          lastHistoryRevision = undefined;
        }
        admission?.();
        return execute(message, requestTicket, reusableLoad, ownerWindowProjection);
      });
      const settled = task.finally(() => {
        if (ArrayBuffer.isView(secret))
          new Uint8Array(secret.buffer, secret.byteOffset, secret.byteLength).fill(0);
        else if (secret instanceof ArrayBuffer)
          new Uint8Array(secret).fill(0);
        delete message.password;
      });
      tail = settled.then(() => {
        return;
      }, () => {
        return;
      });
      return settled;
    },
    dispose() {
      if (!disposal) {
        terminal = true;
        requestSequence++;
        loadProjection = null;
        disposal = tail.then(clear);
      }
      return disposal;
    }
  };
}

// packages/core/src/wasm-module-loader.ts
var knownModules = new WeakMap;
function readKnownNativeModule(module) {
  return knownModules.get(module);
}
var modules = new Map;
function createWasmModuleLoader(options = {}) {
  const url = options.url ?? new URL("./hwpjs.wasm", import.meta.url);
  return async () => {
    const response = await (options.fetch ?? globalThis.fetch)(url, { cache: "no-cache" });
    if (!response.ok)
      throw Error(`WasmFetchFailed:${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer()).slice();
    if (bytes.length < 8 || ![0, 97, 115, 109, 1, 0, 0, 0].every((value, index) => bytes[index] === value))
      throw Error("InvalidWasmArtifact");
    if (!globalThis.crypto?.subtle)
      return WebAssembly.compile(bytes);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
    const key = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const previous = modules.get(key);
    if (previous)
      return previous;
    const compiled = WebAssembly.compile(bytes).then((module) => {
      if (key === "8e0ff0d0e80f185f255024cb9d946b0469648fd5eb175ef6c7aa3562124c91ff" || key === "a38f4df7993c8f645fd28fd13df0108f9be4ba5ca55736e76e334d7d8968343f" || key === "d849a4b22357e62d2425c3f1632edc07f2948ac18ce6d97009aede9d2b6cb1eb" || key === "bd095cdf56892d5b5708a567ca91ae271846a3949bfc41c3a717bdee6513684f" || key === "ede6256ef063765cfb1f4489d2bece3a971aa715041c993fec87d4eb374855fa" || key === "25998a7513b73938abe5e9e614a18733059b42f71f00b13cf663f073c26396b3" || key === "f25c1a4807f428a8a392e8ef0be6dadced309825a6a9704305694969fd9c40bb" || key === "4b7fd814e32a03ea88f6adcd4ef8458be344dfc8a94a698b29e21df0b255d34a" || key === "aa4161ae261a37cff5cfe05ba78d7e9d8ad236c1999ddf5d978ac6b1a60bf122" || key === "c14f11aaa9a278298f469d1dec9bfbdba2e33f1a0433925f2c0b073866e6de02" || key === "82031994b4b7f066c28c725495954eebc67bb25570869c06528ea328e0155ccc")
        knownModules.set(module, Object.freeze({ contract: "hwp5-exclusive-text-delta-v1", sha256: key }));
      return module;
    });
    modules.set(key, compiled);
    compiled.catch(() => {
      if (modules.get(key) === compiled)
        modules.delete(key);
    });
    return compiled;
  };
}

// packages/core/src/runtime/reader-runtime.ts
var origins = new WeakMap;
function consumeReaderNativeGeometryOrigin(runtime, reply, ctx) {
  return origins.get(runtime)?.read(reply, ctx);
}
function createReaderEditorRuntime(options = {}) {
  let contract = options.wasmModule ? readKnownNativeModule(options.wasmModule) : undefined, closed = false, sequence = 0, tainted = false, poisoned = false;
  const backend = createReaderRuntime({
    ...options,
    ...options.loadWasmModule ? {
      loadWasmModule: async () => {
        const module = await options.loadWasmModule();
        contract = readKnownNativeModule(module);
        return module;
      }
    } : {}
  });
  const replies = new WeakMap;
  let runtime;
  const valid = () => {
    if (!canonicalRuntimeDescriptors(runtime, request, dispose, Object.prototype))
      tainted = true;
    return !closed && !tainted && !poisoned && !!contract;
  };
  async function request(message, context) {
    return requestInternal(message, context);
  }
  async function requestInternal(message, context, admission, projection = false) {
    let ownedProjection = false;
    try {
      ownedProjection = copyOwned(projection);
    } catch {}
    const captured = context ? { ...context } : undefined, kind = message.kind;
    const raw = await backend.request(message, admission, allowsOwnerWindowProjection(contract) && valid() ? ownedProjection : false);
    const reply = ownObservation({
      ...raw,
      meta: { ...backend.outcome(raw), ...captured ? { context: captured } : {} }
    })();
    if (/MutationUncertain|HistoryMutationUncertain/.test(String(reply.error ?? "")))
      poisoned = true;
    if (reply.content !== undefined || reply.error || reply.meta?.changed === true || ["splice", "splice-current", "undo", "redo", "format"].includes(kind))
      sequence++;
    const origin = nativeOrigin(kind, reply, captured, sequence, contract, valid);
    if (origin)
      replies.set(reply, origin);
    return reply;
  }
  function dispose() {
    closed = true;
    return backend.dispose();
  }
  runtime = { request, dispose };
  bindRuntimeAdmission(runtime, (message, context, admission, projection) => requestInternal(message, context, admission, projection), () => !closed && !poisoned);
  origins.set(runtime, {
    valid,
    read: (reply, ctx) => {
      if (!valid())
        return;
      const o = replies.get(reply);
      replies.delete(reply);
      return o && sameRequestContext(o.context, ctx) ? o : undefined;
    }
  });
  bindNativeRuntimeOrigin(runtime, (reply, ctx) => consumeReaderNativeGeometryOrigin(runtime, reply, ctx));
  return runtime;
}
function createReaderRuntimeFactory(options = {}) {
  const captured = { ...options };
  return Object.assign(() => createReaderEditorRuntime(captured), {
    async createDocumentBytes(format) {
      const module = captured.wasmModule ?? await captured.loadWasmModule?.();
      if (!module)
        throw Error("ExplicitWasmRequired");
      return createNewDocumentBytes(module, format);
    }
  });
}
// packages/core/src/internal/native-worker-origin.ts
function createNativeWorkerWitness() {
  const host = globalThis;
  const descriptor = Object.getOwnPropertyDescriptor(host, "Worker");
  const Constructor = descriptor && "value" in descriptor ? descriptor.value : undefined;
  const native = (value, name) => typeof value === "function" && Function.prototype.toString.call(value) === `function ${name}() { [native code] }`;
  const prototype = typeof Constructor === "function" ? Constructor.prototype : undefined;
  const post = prototype && Object.getOwnPropertyDescriptor(prototype, "postMessage");
  const terminate = prototype && Object.getOwnPropertyDescriptor(prototype, "terminate");
  let trusted;
  let data;
  try {
    const EventConstructor = globalThis.MessageEvent;
    if (typeof EventConstructor === "function") {
      trusted = Object.getOwnPropertyDescriptor(new EventConstructor("message"), "isTrusted")?.get;
      data = Object.getOwnPropertyDescriptor(EventConstructor.prototype, "data")?.get;
    }
  } catch {}
  const supported = native(Constructor, "Worker") && native(post?.value, "postMessage") && native(terminate?.value, "terminate") && native(trusted, "get isTrusted") && native(data, "get data");
  const current = (worker) => {
    try {
      const now = Object.getOwnPropertyDescriptor(host, "Worker");
      const currentPost = Object.getOwnPropertyDescriptor(prototype, "postMessage");
      const currentTerminate = Object.getOwnPropertyDescriptor(prototype, "terminate");
      return supported && !!worker && !!now && "value" in now && now.value === Constructor && Object.getPrototypeOf(worker) === prototype && currentPost?.value === post?.value && currentTerminate?.value === terminate?.value && !Object.hasOwn(worker, "postMessage") && !Object.hasOwn(worker, "terminate");
    } catch {
      return false;
    }
  };
  return Object.freeze({
    current,
    accepts(event, value) {
      try {
        return supported && trusted.call(event) === true && data.call(event) === value;
      } catch {
        return false;
      }
    }
  });
}

// packages/core/src/internal/known-worker-code.ts
var KNOWN_WORKER_CODE_SHA256 = "9d4b9526134cc1ad57b6fd3c7016b95d9edf6c6f2820bc961214d2c802a31404";

// packages/core/src/worker-runtime.ts
var ownedWorkers = new WeakSet;
var scopeSequence = 0;
var origins2 = new WeakMap;
function consumeWorkerNativeGeometryOrigin(runtime, reply, ctx) {
  return origins2.get(runtime)?.read(reply, ctx);
}
function createWorkerEditorRuntime(options = {}) {
  if (scopeSequence >= Number.MAX_SAFE_INTEGER)
    throw Error("WorkerIdentityExhausted");
  const referenceScope = `worker:${++scopeSequence}`;
  const defaultURL = new URL("./worker.js", import.meta.url), custom = options.workerFactory !== undefined || options.workerURL !== undefined;
  let worker, closed = false, failure, sequence = 0, publication = 0, canonicalCode = false, tainted = false, poisoned = false, blobURL, contract;
  const trustedReplies = new WeakSet;
  const transportWitness = createNativeWorkerWitness();
  const pending = new Map, proofs = new WeakMap;
  let runtime;
  const valid = () => {
    if (canonicalCode && !custom && !transportWitness.current(worker))
      tainted = true;
    if (!canonicalRuntimeDescriptors(runtime, request, dispose, Object.prototype))
      tainted = true;
    return !closed && !tainted && !poisoned && !custom && canonicalCode && !!contract && transportWitness.current(worker);
  };
  const rejectAll = (e) => {
    for (const item of pending.values())
      item.reject(e);
    pending.clear();
  };
  const receive = (event) => {
    const value = event.data;
    if (!value || !Number.isSafeInteger(value.id))
      return;
    const item = pending.get(value.id);
    if (!item)
      return;
    pending.delete(value.id);
    if (typeof value.transportError === "string")
      item.reject(Error(value.transportError));
    else if (!value.reply || typeof value.reply.kind !== "string")
      item.reject(Error("MalformedWorkerReply"));
    else {
      if (transportWitness.accepts(event, value))
        trustedReplies.add(value.reply);
      item.resolve(value.reply);
    }
  };
  function shutdown(reason) {
    if (closed)
      return;
    closed = true;
    failure = reason;
    rejectAll(reason);
    if (worker) {
      worker.removeEventListener("message", receive);
      worker.removeEventListener("error", failed);
      worker.removeEventListener("messageerror", failed);
      worker.terminate();
    }
    if (blobURL)
      URL.revokeObjectURL(blobURL);
  }
  function failed() {
    shutdown(Error("WorkerRuntimeFailed"));
  }
  function attach(w) {
    if (ownedWorkers.has(w))
      throw Error("WorkerAlreadyOwned");
    ownedWorkers.add(w);
    worker = w;
    w.addEventListener("message", receive);
    w.addEventListener("error", failed);
    w.addEventListener("messageerror", failed);
  }
  if (options.workerFactory)
    attach(options.workerFactory(options.workerURL ?? defaultURL));
  else if (options.workerURL !== undefined)
    attach(new Worker(options.workerURL, { type: "module" }));
  async function canonicalWorker() {
    if (worker)
      return;
    if (globalThis.crypto?.subtle) {
      try {
        const response = await fetch(defaultURL, { cache: "no-cache" });
        if (response.ok) {
          const bytes = new Uint8Array(await response.arrayBuffer()).slice(), digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
          const hash = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
          if (hash === KNOWN_WORKER_CODE_SHA256) {
            canonicalCode = true;
            blobURL = URL.createObjectURL(new Blob([bytes], { type: "text/javascript" }));
          }
        }
      } catch {}
    }
    if (closed)
      throw Error("RuntimeDisposed");
    attach(new Worker(blobURL ?? defaultURL, { type: "module" }));
  }
  const send = (message, admission, projection = false) => new Promise((resolve, reject) => {
    if (closed) {
      reject(failure ?? Error("RuntimeDisposed"));
      return;
    }
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    try {
      admission?.();
      worker.postMessage({
        id,
        message,
        ...projection === true ? { viewProjection: "owner-window-v1" } : projection && typeof projection === "object" ? { viewProjection: projection } : {}
      });
    } catch (error) {
      pending.delete(id);
      reject(error instanceof Error ? error : Error(String(error)));
    }
  });
  const load = options.loadWasmModule ?? (options.wasmModule ? async () => options.wasmModule : createWasmModuleLoader({ url: options.wasmURL }));
  const ready = Promise.resolve().then(load).then(async (module) => {
    contract = readKnownNativeModule(module);
    await canonicalWorker();
    return send({ kind: "initialize-runtime", wasmModule: module, referenceScope });
  });
  ready.catch((e) => shutdown(e instanceof Error ? e : Error(String(e))));
  async function request(message, context) {
    return requestInternal(message, context);
  }
  async function requestInternal(message, context, admission, projection = false) {
    let ownedProjection = false;
    try {
      ownedProjection = copyOwned(projection);
    } catch {}
    const owned = copyOwned(message), captured = context ? { ...context } : undefined, kind = owned.kind;
    await ready;
    const raw = await send(owned, admission, allowsOwnerWindowProjection(contract) && valid() ? ownedProjection : false);
    const reply = ownObservation({
      ...raw,
      meta: { ...raw.meta, ...captured ? { context: captured } : {} }
    })();
    if (/MutationUncertain|HistoryMutationUncertain/.test(String(reply.error ?? "")))
      poisoned = true;
    if (reply.content !== undefined || reply.error || reply.meta?.changed === true || ["splice", "splice-current", "undo", "redo", "format"].includes(kind))
      publication++;
    const trusted = trustedReplies.has(raw);
    trustedReplies.delete(raw);
    const proof = trusted ? nativeOrigin(kind, reply, captured, publication, contract, valid) : undefined;
    if (proof)
      proofs.set(reply, proof);
    return reply;
  }
  function dispose() {
    shutdown(Error("RuntimeDisposed"));
  }
  runtime = { request, dispose };
  bindRuntimeAdmission(runtime, (message, context, admission, projection) => requestInternal(message, context, admission, projection), () => !closed && !poisoned && !custom && canonicalCode && transportWitness.current(worker));
  origins2.set(runtime, {
    valid,
    read: (reply, ctx) => {
      if (!valid())
        return;
      const proof = proofs.get(reply);
      proofs.delete(reply);
      return proof && sameRequestContext(proof.context, ctx) ? proof : undefined;
    }
  });
  bindNativeRuntimeOrigin(runtime, (reply, ctx) => consumeWorkerNativeGeometryOrigin(runtime, reply, ctx));
  return runtime;
}
function createWorkerRuntimeFactory(options = {}) {
  const captured = { ...options }, load = captured.loadWasmModule ?? (captured.wasmModule ? async () => captured.wasmModule : createWasmModuleLoader({ url: captured.wasmURL }));
  let compiled;
  const loadWasmModule = () => {
    if (compiled)
      return compiled;
    const p = Promise.resolve().then(load);
    compiled = p;
    p.catch(() => {
      if (compiled === p)
        compiled = undefined;
    });
    return p;
  };
  return Object.assign(() => createWorkerEditorRuntime({ ...captured, loadWasmModule }), {
    preload: loadWasmModule
  });
}
export {
  createReaderEditorRuntime,
  createReaderRuntimeFactory,
  createWasmModuleLoader,
  createWorkerEditorRuntime,
  createWorkerRuntimeFactory
};
