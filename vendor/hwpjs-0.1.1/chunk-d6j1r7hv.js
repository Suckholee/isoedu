import {
  BORDER_WIDTHS_HUNDREDTH_MM2
} from "./chunk-c8kv1wt8.js";
import {
  TABLE_DIAGONAL_DIRECTIONS,
  createdTableIdentity
} from "./chunk-6ffsr0y9.js";
import {
  characterFontNameArgs
} from "./chunk-bnqtzsr8.js";

// js/wasm-memory.mjs
function createMemory(wasm) {
  const decoder = new TextDecoder;
  const copy = (ptr, length) => length === 0 ? new Uint8Array(0) : new Uint8Array(wasm.memory.buffer, ptr >>> 0, length).slice();
  const withBytes = (bytes, fn, secret = false) => {
    const ptr = wasm.cfb_alloc(bytes.length) >>> 0;
    if (!ptr)
      throw new Error("OutOfMemory");
    try {
      new Uint8Array(wasm.memory.buffer, ptr, bytes.length).set(bytes);
      return fn(ptr, bytes.length);
    } finally {
      if (secret)
        new Uint8Array(wasm.memory.buffer, ptr, Math.max(bytes.length, 1)).fill(0);
      wasm.cfb_free(ptr, bytes.length);
    }
  };
  return {
    copy,
    error: () => new Error(decoder.decode(copy(wasm.cfb_error_ptr(), wasm.cfb_error_len()))),
    withBytes,
    withSecretBytes: (bytes, fn) => withBytes(bytes, fn, true)
  };
}

// js/cell-border-command.mjs
var CELL_BORDER_STYLES = Object.freeze(["NONE", "SOLID", "DOUBLE_SLIM"]);
var CELL_BORDER_WIDTHS = BORDER_WIDTHS_HUNDREDTH_MM2;
var styleCodes = new Map(CELL_BORDER_STYLES.map((style, code) => [style, code]));
var widths = new Set(CELL_BORDER_WIDTHS);
var names = Object.freeze([
  "section",
  "tableNode",
  "listNode",
  "edges",
  "style",
  "width",
  "color"
]);
var allowed = new Set(names);
function cellBorderStyleCode(style) {
  const code = styleCodes.get(style);
  if (code === undefined)
    throw new RangeError("UnsupportedCellBorderStyle");
  return code;
}
function validate(input, message) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new TypeError("InvalidCellBorder");
  const keys = Reflect.ownKeys(input);
  if (keys.length !== names.length + Number(message) || keys.some((key) => !allowed.has(key) && !(message && key === "kind")) || message && input.kind !== "cell-border")
    throw new TypeError("InvalidCellBorder");
  const values = names.map((name) => {
    if (!Object.hasOwn(input, name))
      throw new TypeError("InvalidCellBorder");
    const value = input[name];
    if (name === "style") {
      cellBorderStyleCode(value);
    } else if (name === "width") {
      if (!widths.has(value))
        throw new RangeError("UnsupportedBorderWidth");
    } else {
      const maximum = name === "color" ? 16777215 : name === "edges" ? 15 : 4294967295;
      const minimum = name === "edges" ? 1 : 0;
      if (!Number.isInteger(value) || value < minimum || value > maximum)
        throw new RangeError("InvalidCellBorder");
    }
    return value;
  });
  return Object.freeze(Object.fromEntries(names.map((name, index) => [name, values[index]])));
}
function validateCellBorder(input) {
  return validate(input, false);
}
function validateCellBorderMessage(input) {
  return validate(input, true);
}

// js/cell-border-batch.mjs
var MAX_CELL_BORDER_EDITS = 4096;
var CELL_BORDER_STRIDE = 28;
function validateCellBorders(cells) {
  if (!Array.isArray(cells))
    throw new TypeError("InvalidCellBorderBatch");
  const length = cells.length;
  if (length > MAX_CELL_BORDER_EDITS)
    throw new RangeError("LimitExceeded");
  if (Reflect.ownKeys(cells).length !== length + 1)
    throw new TypeError("InvalidCellBorderBatch");
  const result = [], owners = new Set;
  for (let index = 0;index < length; index++) {
    if (!Object.hasOwn(cells, index))
      throw new TypeError("InvalidCellBorderBatch");
    const value = validateCellBorder(cells[index]);
    const key = `${value.section}:${value.listNode}`;
    if (owners.has(key))
      throw new TypeError("DuplicateCellBorderEdit");
    owners.add(key);
    result.push(value);
  }
  return Object.freeze(result);
}
function validateCellBordersMessage(message) {
  if (!message || typeof message !== "object")
    throw new TypeError("InvalidCellBorderBatch");
  const keys = Reflect.ownKeys(message);
  if (keys.length !== 2 || !Object.hasOwn(message, "kind") || !Object.hasOwn(message, "cells") || message.kind !== "cell-borders")
    throw new TypeError("InvalidCellBorderBatch");
  return validateCellBorders(message.cells);
}
function encodeCellBorders(cells) {
  const values = validateCellBorders(cells);
  const bytes = new Uint8Array(values.length * CELL_BORDER_STRIDE), view = new DataView(bytes.buffer);
  values.forEach((v, index) => {
    [
      v.section,
      v.tableNode,
      v.listNode,
      v.edges,
      cellBorderStyleCode(v.style),
      v.width,
      v.color
    ].forEach((number, field) => view.setUint32(index * CELL_BORDER_STRIDE + field * 4, number, true));
  });
  return bytes;
}

// js/cell-diagonal-command.mjs
var CELL_DIAGONAL_STRIDE = 48;
var required = ["section", "tableNode", "listNode"];
var optional = ["directions", "style", "width", "color"];
var allowed2 = new Set([...required, ...optional]);
function validateCellDiagonals(input) {
  if (!Array.isArray(input))
    throw TypeError("InvalidCellDiagonalBatch");
  const length = input.length;
  if (length > MAX_CELL_BORDER_EDITS)
    throw RangeError("LimitExceeded");
  if (Reflect.ownKeys(input).length !== length + 1)
    throw TypeError("InvalidCellDiagonalBatch");
  const owners = new Set, rows = [];
  for (let index = 0;index < length; index++) {
    if (!Object.hasOwn(input, index))
      throw TypeError("InvalidCellDiagonalBatch");
    const source = input[index];
    if (!source || typeof source !== "object" || Array.isArray(source))
      throw TypeError("InvalidCellDiagonal");
    const fields = optional.filter((key) => Object.hasOwn(source, key));
    if (!fields.length || required.some((key) => !Object.hasOwn(source, key)) || Reflect.ownKeys(source).some((key) => !allowed2.has(key)))
      throw TypeError("InvalidCellDiagonal");
    const directions = fields.includes("directions") ? source.directions : undefined;
    if (fields.includes("directions") && !TABLE_DIAGONAL_DIRECTIONS.includes(directions))
      throw TypeError("InvalidCellDiagonal");
    const normalized = validateCellBorder({
      section: source.section,
      tableNode: source.tableNode,
      listNode: source.listNode,
      edges: 1,
      style: fields.includes("style") ? source.style : "NONE",
      width: fields.includes("width") ? source.width : BORDER_WIDTHS_HUNDREDTH_MM2[0],
      color: fields.includes("color") ? source.color : 0
    });
    const key = `${normalized.section}:${normalized.listNode}`;
    if (owners.has(key))
      throw TypeError("DuplicateCellDiagonalEdit");
    owners.add(key);
    const row = Object.fromEntries(required.map((key) => [key, normalized[key]]));
    for (const key of fields)
      row[key] = key === "directions" ? directions : normalized[key];
    rows.push(Object.freeze(row));
  }
  return Object.freeze(rows);
}
function encodeCellDiagonals(input) {
  const rows = validateCellDiagonals(input), bytes = new Uint8Array(rows.length * CELL_DIAGONAL_STRIDE), view = new DataView(bytes.buffer);
  rows.forEach((row, index) => {
    const mask = Number(Object.hasOwn(row, "directions")) | Number(Object.hasOwn(row, "style")) << 1 | Number(Object.hasOwn(row, "width")) << 2 | Number(Object.hasOwn(row, "color")) << 3;
    const words = [
      row.section,
      row.tableNode,
      row.listNode,
      mask,
      Object.hasOwn(row, "directions") ? TABLE_DIAGONAL_DIRECTIONS.indexOf(row.directions) : 0,
      Object.hasOwn(row, "style") ? cellBorderStyleCode(row.style) : 0,
      row.width ?? 0,
      row.color ?? 0,
      0,
      0,
      0,
      0
    ];
    words.forEach((value, word) => view.setUint32(index * CELL_DIAGONAL_STRIDE + word * 4, value, true));
  });
  return bytes;
}

// js/cell-border-patch-command.mjs
var CELL_BORDER_PATCH_STRIDE = 32;
var required2 = ["section", "tableNode", "listNode", "edges"];
var optional2 = ["style", "width", "color"];
var allowed3 = new Set([...required2, ...optional2]);
function validateCellBorderPatches(input) {
  if (!Array.isArray(input))
    throw TypeError("InvalidCellBorderPatchBatch");
  const length = input.length;
  if (length > MAX_CELL_BORDER_EDITS)
    throw RangeError("LimitExceeded");
  if (Reflect.ownKeys(input).length !== length + 1)
    throw TypeError("InvalidCellBorderPatchBatch");
  const rows = [], owners = new Set;
  for (let index = 0;index < length; index++) {
    if (!Object.hasOwn(input, index))
      throw TypeError("InvalidCellBorderPatchBatch");
    const source = input[index];
    if (!source || typeof source !== "object" || Array.isArray(source))
      throw TypeError("InvalidCellBorderPatch");
    const keys = Reflect.ownKeys(source), fields = optional2.filter((key) => Object.hasOwn(source, key));
    if (keys.some((key) => !allowed3.has(key)) || required2.some((key) => !Object.hasOwn(source, key)) || !fields.length)
      throw TypeError("InvalidCellBorderPatch");
    const normalized = validateCellBorder({
      section: source.section,
      tableNode: source.tableNode,
      listNode: source.listNode,
      edges: source.edges,
      style: fields.includes("style") ? source.style : "NONE",
      width: fields.includes("width") ? source.width : BORDER_WIDTHS_HUNDREDTH_MM2[0],
      color: fields.includes("color") ? source.color : 0
    });
    const key = `${normalized.section}:${normalized.listNode}`;
    if (owners.has(key))
      throw TypeError("DuplicateCellBorderEdit");
    owners.add(key);
    const row = Object.fromEntries(required2.map((key) => [key, normalized[key]]));
    for (const key of fields)
      row[key] = normalized[key];
    rows.push(Object.freeze(row));
  }
  return Object.freeze(rows);
}
function encodeCellBorderPatches(input) {
  const rows = validateCellBorderPatches(input), bytes = new Uint8Array(rows.length * CELL_BORDER_PATCH_STRIDE), view = new DataView(bytes.buffer);
  rows.forEach((row, index) => {
    const mask = Number(Object.hasOwn(row, "style")) | Number(Object.hasOwn(row, "width")) << 1 | Number(Object.hasOwn(row, "color")) << 2;
    const fields = [
      row.section,
      row.tableNode,
      row.listNode,
      row.edges,
      mask,
      Object.hasOwn(row, "style") ? cellBorderStyleCode(row.style) : 0,
      row.width ?? 0,
      row.color ?? 0
    ];
    fields.forEach((number, field) => view.setUint32(index * CELL_BORDER_PATCH_STRIDE + field * 4, number, true));
  });
  return bytes;
}

// js/cell-fill-command.mjs
var CELL_FILL_STRIDE = 48;
var CELL_HATCH_STYLES = Object.freeze([
  "HORIZONTAL",
  "VERTICAL",
  "BACK_SLASH",
  "SLASH",
  "CROSS",
  "CROSS_DIAGONAL"
]);
var hatchCodes = new Map(CELL_HATCH_STYLES.map((value, index) => [value, index]));
function exact(value, names) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw TypeError("InvalidCellFill");
  const keys = Reflect.ownKeys(value);
  if (keys.length !== names.length || names.some((name) => !Object.hasOwn(value, name)))
    throw TypeError("InvalidCellFill");
}
function number(value, maximum) {
  if (!Number.isInteger(value) || value < 0 || value > maximum)
    throw RangeError("InvalidCellFill");
  return value;
}
function tuple(value) {
  if (!Array.isArray(value) || value.length !== 2 || Reflect.ownKeys(value).length !== 3 || !Object.hasOwn(value, 0) || !Object.hasOwn(value, 1))
    throw TypeError("InvalidCellFill");
  return Object.freeze([number(value[0], 16777215), number(value[1], 16777215)]);
}
function validateCellFill(input) {
  if (!input || typeof input !== "object")
    throw TypeError("InvalidCellFill");
  const kind = input.kind;
  switch (kind) {
    case "none":
      exact(input, ["kind"]);
      return Object.freeze({ kind });
    case "solid":
      exact(input, ["kind", "color"]);
      return Object.freeze({ kind, color: number(input.color, 16777215) });
    case "hatch": {
      exact(input, ["kind", "face", "hatch", "style"]);
      const style = input.style;
      if (!hatchCodes.has(style))
        throw TypeError("InvalidCellFill");
      return Object.freeze({
        kind,
        face: number(input.face, 16777215),
        hatch: number(input.hatch, 16777215),
        style
      });
    }
    case "linear":
      exact(input, ["kind", "colors", "angle", "centerX", "centerY", "step", "stepCenter"]);
      return Object.freeze({
        kind,
        colors: tuple(input.colors),
        angle: number(input.angle, 359),
        centerX: number(input.centerX, 100),
        centerY: number(input.centerY, 100),
        step: number(input.step, 100),
        stepCenter: number(input.stepCenter, 100)
      });
    default:
      throw TypeError("InvalidCellFill");
  }
}
function validateCellFills(input) {
  if (!Array.isArray(input))
    throw TypeError("InvalidCellFillBatch");
  const length = input.length;
  if (length > MAX_CELL_BORDER_EDITS)
    throw RangeError("LimitExceeded");
  if (Reflect.ownKeys(input).length !== length + 1)
    throw TypeError("InvalidCellFillBatch");
  const owners = new Set, values = [];
  for (let index = 0;index < length; index++) {
    if (!Object.hasOwn(input, index))
      throw TypeError("InvalidCellFillBatch");
    const source = input[index];
    exact(source, ["section", "tableNode", "listNode", "fill"]);
    const section = number(source.section, 4294967295), tableNode = number(source.tableNode, 4294967295), listNode = number(source.listNode, 4294967295), fill = validateCellFill(source.fill), key = `${section}:${listNode}`;
    if (owners.has(key))
      throw TypeError("DuplicateCellFillEdit");
    owners.add(key);
    values.push(Object.freeze({ section, tableNode, listNode, fill }));
  }
  return Object.freeze(values);
}
function encodeCellFills(input) {
  const rows = validateCellFills(input), bytes = new Uint8Array(rows.length * CELL_FILL_STRIDE), view = new DataView(bytes.buffer);
  rows.forEach((row, index) => {
    const fill = row.fill, fields = [row.section, row.tableNode, row.listNode, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (fill.kind === "solid") {
      fields[3] = 1;
      fields[4] = fill.color;
    }
    if (fill.kind === "hatch") {
      fields[3] = 2;
      fields[4] = fill.face;
      fields[5] = fill.hatch;
      fields[6] = hatchCodes.get(fill.style);
    }
    if (fill.kind === "linear") {
      fields[3] = 3;
      fields.splice(4, 7, ...fill.colors, fill.angle, fill.centerX, fill.centerY, fill.step, fill.stepCenter);
    }
    fields.forEach((value, field) => view.setUint32(index * CELL_FILL_STRIDE + field * 4, value, true));
  });
  return bytes;
}

// js/cell-style-command.mjs
function validateCellStyles(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw TypeError("InvalidCellStyles");
  if (Reflect.ownKeys(input).length !== 2 + Number(Object.hasOwn(input, "diagonals")) || !Object.hasOwn(input, "borders") || !Object.hasOwn(input, "fills"))
    throw TypeError("InvalidCellStyles");
  const borders = validateCellBorderPatches(input.borders), fills = validateCellFills(input.fills), diagonals = Object.hasOwn(input, "diagonals") ? validateCellDiagonals(input.diagonals) : undefined, owners = new Map;
  for (const rows of [borders, fills, diagonals ?? []])
    for (const row of rows) {
      const key = `${row.section}:${row.listNode}`;
      if (owners.has(key) && owners.get(key) !== row.tableNode)
        throw TypeError("AmbiguousCellStyleOwner");
      owners.set(key, row.tableNode);
      if (owners.size > MAX_CELL_BORDER_EDITS)
        throw RangeError("LimitExceeded");
    }
  return Object.freeze({ borders, fills, ...diagonals ? { diagonals } : {} });
}
function validateCellStylesMessage(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || Reflect.ownKeys(input).length !== 3 + Number(Object.hasOwn(input, "diagonals")) || !Object.hasOwn(input, "kind") || !Object.hasOwn(input, "borders") || !Object.hasOwn(input, "fills") || input.kind !== "cell-styles")
    throw TypeError("InvalidCellStyles");
  return Object.freeze({
    kind: "cell-styles",
    ...validateCellStyles({
      borders: input.borders,
      fills: input.fills,
      ...Object.hasOwn(input, "diagonals") ? { diagonals: input.diagonals } : {}
    })
  });
}

// js/abi-schema.mjs
var ABI_VERSION = 6;
var EXPERIMENTAL_EDITOR_FUNCTIONS = Object.freeze([
  "hwp5_edit_open",
  "hwp5_edit_close",
  "hwp5_edit_section_count",
  "hwp5_edit_paragraph_count",
  "hwp5_edit_char_shape_count",
  "hwp5_edit_copy_text",
  "hwp5_edit_splice",
  "hwp5_edit_format",
  "hwp5_edit_save",
  "hwp5_edit_output_ptr",
  "hwp5_edit_output_len",
  "hwp5_edit_output_free",
  "hwp5_edit_reflow"
]);
var HWPX_DOCUMENT_PROVENANCE_FUNCTIONS = Object.freeze(["hwpx_edit_document_provenance"]);
var DOCUMENT = Object.freeze({
  header_bytes: 8,
  node_bytes: 56,
  parent: 0,
  kind: 4,
  name_len: 8,
  content_len: 12,
  state: 16,
  reserved: 20,
  created: 24,
  modified: 32,
  clsid: 40
});
var FIELD = Object.freeze({ name: 0, path: 1, content: 2, clsid: 3 });
var VALUE = Object.freeze({
  kind: 0,
  color: 1,
  left: 2,
  right: 3,
  child: 4,
  state: 5,
  created: 6,
  modified: 7,
  start: 8,
  size: 9,
  uses_fat: 10,
  has_content: 11
});
var REQUIRED_FUNCTIONS = Object.freeze([
  "hwpjs_abi_version",
  "cfb_alloc",
  "cfb_free",
  "cfb_open",
  "cfb_open_strict",
  "cfb_find_exact",
  "cfb_write",
  "cfb_document",
  "cfb_output_ptr",
  "cfb_output_len",
  "cfb_output_free",
  "cfb_close",
  "cfb_error_ptr",
  "cfb_error_len",
  "cfb_error_code_ptr",
  "cfb_error_code_len",
  "cfb_count",
  "cfb_find",
  "cfb_find_snapshot",
  "cfb_field_ptr",
  "cfb_field_len",
  "cfb_value",
  "cfb_sector_count",
  "cfb_raw_ptr",
  "cfb_raw_len",
  "hwp5_text_read",
  "hwp5_text_ptr",
  "hwp5_text_len",
  "hwp5_text_free"
]);

// js/abi.mjs
function validateAbi(wasm) {
  if (typeof wasm.hwpjs_abi_version !== "function")
    throw new Error("Missing HWPJS ABI version");
  const actual = wasm.hwpjs_abi_version();
  if (actual !== ABI_VERSION)
    throw new Error(`Unsupported HWPJS ABI ${actual}; expected ${ABI_VERSION}`);
  for (const name of REQUIRED_FUNCTIONS) {
    if (typeof wasm[name] !== "function")
      throw new Error(`Missing HWPJS ABI export: ${name}`);
  }
  if (!(wasm.memory instanceof WebAssembly.Memory))
    throw new Error("Missing HWPJS ABI memory");
}

// js/output-bytes.mjs
var nodeBuffer = typeof Buffer !== "undefined" && typeof process !== "undefined" && process.versions?.node ? Buffer : null;

// js/input.mjs
var bufferLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get;
var typedArrayName = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), Symbol.toStringTag).get;
function inputBytes(data) {
  if (ArrayBuffer.isView(data) && typedArrayName.call(data) === "Uint8Array")
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  let isBuffer = false;
  try {
    bufferLength.call(data);
    isBuffer = true;
  } catch {}
  if (isBuffer)
    return new Uint8Array(data);
  if (!Array.isArray(data))
    throw new TypeError("Expected Uint8Array, ArrayBuffer, or an array of bytes");
  const bytes = new Uint8Array(data.length);
  for (let i = 0;i < bytes.length; i++) {
    const value = data[i];
    if (!Number.isInteger(value) || value < 0 || value > 255)
      throw new TypeError(`Invalid byte at index ${i}`);
    bytes[i] = value;
  }
  return bytes;
}

// js/atomic-formatting-api.mjs
function createAtomicFormattingApi({ wasm, memory, check, prefix }) {
  const suffixes = [
    "formatting_capabilities",
    "query_formatting",
    "apply_formatting_patch",
    "output_ptr",
    "output_len",
    "output_free",
    "history_revision",
    "history_stats"
  ];
  const available = () => suffixes.every((s) => typeof wasm[`${prefix}_${s}`] === "function");
  const required = () => {
    check();
    if (!available())
      throw Error("AtomicFormattingUnavailable");
  };
  const read = (action) => {
    try {
      if (action() !== 1)
        throw memory.error();
      return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(memory.copy(wasm[`${prefix}_output_ptr`](), wasm[`${prefix}_output_len`]())));
    } finally {
      wasm[`${prefix}_output_free`]();
    }
  };
  const caps = () => {
    required();
    const value = read(() => wasm[`${prefix}_formatting_capabilities`]());
    if (value?.schemaVersion !== 1 || value.atomic !== true || value.format !== prefix.replace(/_edit$/, "") || value.coordinateSpace !== "native-source-utf16" || value.requiresHistoryProtocol !== 2 || typeof value.binding?.session !== "string" || !value.binding.session || !value.fields || typeof value.fields !== "object" || Array.isArray(value.fields) || !Object.values(value.fields).some((field) => field && field.readable === true) || !value.limits || !["requestBytes", "replyBytes", "targets", "ranges", "commands", "fontNameBytes"].every((k) => Number.isSafeInteger(value.limits[k]) && value.limits[k] > 0))
      throw Error("AtomicFormattingUnavailable");
    if (value.binding.revision !== null && (!Number.isSafeInteger(value.binding.revision) || value.binding.revision < 0 || value.binding.revision >= 4294967295))
      throw Error("InvalidFormattingBinding");
    return value;
  };
  const encode = (value, limit) => {
    const bytes = new TextEncoder().encode(JSON.stringify(ownedJSON(value)));
    if (bytes.byteLength > limit)
      throw Error("LimitExceeded");
    return bytes;
  };
  return {
    supportsAtomicFormatting() {
      check();
      return available();
    },
    atomicFormattingCapabilities: caps,
    queryFormatting(request) {
      const policy = caps();
      const bytes = encode(request, policy.limits.requestBytes);
      const value = memory.withBytes(bytes, (ptr, size) => read(() => wasm[`${prefix}_query_formatting`](ptr, size)));
      if (value?.schemaVersion !== 1 || !Array.isArray(value.targets) || !value.observations || value.binding?.session !== request.binding?.session || value.binding?.revision !== request.binding?.revision)
        throw Error("MalformedFormattingQuery");
      return value;
    },
    applyFormattingPatch(request) {
      const policy = caps();
      const bytes = encode(request, policy.limits.requestBytes);
      let started = false, completed;
      try {
        return memory.withBytes(bytes, (ptr, size) => {
          started = true;
          const nativeCode = wasm[`${prefix}_apply_formatting_patch`](ptr, size);
          if (![0, 1, 2, 3].includes(nativeCode))
            return {
              application: "unknown",
              changed: null,
              error: "InvalidAtomicFormattingResult"
            };
          const error = nativeCode === 0 || nativeCode === 3 ? memory.error().message : undefined;
          return completed = {
            nativeCode,
            application: nativeCode === 1 ? "applied" : nativeCode === 3 ? "unknown" : "unapplied",
            changed: nativeCode === 3 ? null : nativeCode === 1,
            ...error ? { error } : {}
          };
        });
      } catch (error) {
        if (!started)
          throw error;
        if (completed)
          return {
            ...completed,
            cleanupError: error?.message || String(error),
            refreshRequired: true
          };
        return { application: "unknown", changed: null, error: error?.message || String(error) };
      }
    }
  };
}
function ownedJSON(value, seen = new Set) {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw Error("InvalidNumber");
    return value;
  }
  if (typeof value !== "object" || seen.has(value))
    throw Error("InvalidFormattingDTO");
  const array = Array.isArray(value), proto = Object.getPrototypeOf(value);
  if (!array && proto !== Object.prototype && proto !== null)
    throw Error("InvalidFormattingDTO");
  seen.add(value);
  try {
    const result = array ? [] : Object.create(null);
    for (const key of Reflect.ownKeys(value)) {
      if (array && key === "length")
        continue;
      if (typeof key !== "string")
        throw Error("InvalidFormattingDTO");
      if (array && !/^(0|[1-9][0-9]*)$/.test(key))
        throw Error("InvalidFormattingDTO");
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !("value" in descriptor))
        throw Error("AccessorPayloadUnsupported");
      if (descriptor.value === undefined) {
        if (array)
          throw Error("InvalidFormattingDTO");
        continue;
      }
      result[key] = ownedJSON(descriptor.value, seen);
    }
    if (array && result.length !== value.length)
      throw Error("InvalidFormattingDTO");
    for (let i = 0;array && i < value.length; i++)
      if (!Object.hasOwn(result, i))
        throw Error("InvalidFormattingDTO");
    return result;
  } finally {
    seen.delete(value);
  }
}

// js/table-initial-texts.mjs
var encoder = new TextEncoder;
var TABLE_TEXT_REQUEST_LIMIT = 4 * 1024 * 1024;
function captureTableTextRequest(input) {
  const active = new Set;
  let nodes = 0, units = 0;
  const capture = (value, depth = 0) => {
    if (++nodes > 1e5 || depth > 32)
      throw new RangeError("LimitExceeded");
    if (typeof value === "string") {
      units += value.length;
      if (units > TABLE_TEXT_REQUEST_LIMIT)
        throw new RangeError("LimitExceeded");
      return value;
    }
    if (value === null || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value))
      return value;
    if (!value || typeof value !== "object" || active.has(value))
      throw new TypeError("InvalidTableCreationRequest");
    active.add(value);
    try {
      const array = Array.isArray(value);
      if (!array && ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
        throw new TypeError("InvalidTableCreationRequest");
      const result = array ? [] : Object.create(null);
      const keys = array ? Array.from({ length: Math.min(value.length, 100001) }, (_, i) => String(i)) : Reflect.ownKeys(value);
      if (keys.length > 1e5)
        throw new RangeError("LimitExceeded");
      for (const key of keys) {
        const field = Object.getOwnPropertyDescriptor(value, key);
        if (typeof key !== "string" || !field || !Object.hasOwn(field, "value"))
          throw new TypeError("InvalidTableCreationRequest");
        if (!array && !field.enumerable)
          continue;
        if (key === "toJSON")
          throw new TypeError("InvalidTableCreationRequest");
        units += key.length;
        if (units > TABLE_TEXT_REQUEST_LIMIT)
          throw new RangeError("LimitExceeded");
        result[key] = capture(field.value, depth + 1);
      }
      return result;
    } finally {
      active.delete(value);
    }
  };
  return capture(input);
}
function captureTableInitialTexts(rows, columns, input) {
  if (!Number.isInteger(rows) || rows < 1 || !Number.isInteger(columns) || columns < 1 || rows * columns > 4096 || !Array.isArray(input) || input.length !== rows)
    throw new TypeError("InvalidTableCellTexts");
  let bytes = 0;
  return Array.from({ length: rows }, (_, row) => {
    const entry = Object.getOwnPropertyDescriptor(input, String(row));
    if (!entry || !Object.hasOwn(entry, "value"))
      throw new TypeError("InvalidTableCellTexts");
    const cells = entry.value;
    if (!Array.isArray(cells) || cells.length !== columns)
      throw new TypeError("InvalidTableCellTexts");
    return Array.from({ length: columns }, (_, column) => {
      const entry = Object.getOwnPropertyDescriptor(cells, String(column));
      if (!entry || !Object.hasOwn(entry, "value"))
        throw new TypeError("InvalidTableCellTexts");
      const text = entry.value;
      if (typeof text !== "string" || !text.isWellFormed())
        throw new TypeError("InvalidTableCellText");
      if (text.length > TABLE_TEXT_REQUEST_LIMIT)
        throw new RangeError("LimitExceeded");
      for (let index = 0;index < text.length; index++) {
        const unit = text.charCodeAt(index);
        if (unit < 32 || unit === 127)
          throw new TypeError("InvalidTableCellText");
      }
      bytes += encoder.encode(text).length;
      if (bytes > TABLE_TEXT_REQUEST_LIMIT)
        throw new RangeError("LimitExceeded");
      return text;
    });
  });
}
function encodeTableTextRequest(request) {
  const json = JSON.stringify(request);
  if (json.length > TABLE_TEXT_REQUEST_LIMIT)
    throw new RangeError("LimitExceeded");
  const bytes = encoder.encode(json);
  if (bytes.length > TABLE_TEXT_REQUEST_LIMIT)
    throw new RangeError("LimitExceeded");
  return bytes;
}

// js/cell-size-batch.mjs
function encodeCellSizes(cells) {
  if (!Array.isArray(cells))
    throw new TypeError("InvalidCellSizeBatch");
  if (cells.length > 4096)
    throw new RangeError("LimitExceeded");
  const names = ["section", "listNode", "width", "height"], seen = new Set;
  const bytes = new Uint8Array(cells.length * 16), view = new DataView(bytes.buffer);
  for (let i = 0;i < cells.length; i++) {
    const cell = cells[i];
    if (!cell || typeof cell !== "object" || Array.isArray(cell) || Object.keys(cell).some((key) => !names.includes(key)))
      throw new TypeError("InvalidCellSizeBatch");
    const values = names.map((name) => {
      const value = cell[name];
      if (!Number.isInteger(value) || value < 0 || value > 4294967295)
        throw new RangeError("InvalidCellSizeBatch");
      return value;
    });
    const key = `${values[0]}:${values[1]}`;
    if (seen.has(key))
      throw new Error("DuplicateCellSizeEdit");
    seen.add(key);
    values.forEach((value, column) => view.setUint32(i * 16 + column * 4, value, true));
  }
  return bytes;
}

// js/cell-background-command.mjs
var names2 = Object.freeze(["section", "tableNode", "listNode", "color"]);
var allowed4 = new Set(names2);
function validate2(input, message) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new TypeError("InvalidCellBackground");
  const keys = Reflect.ownKeys(input);
  if (keys.length !== names2.length + Number(message) || keys.some((key) => !allowed4.has(key) && !(message && key === "kind")) || message && input.kind !== "cell-background")
    throw new TypeError("InvalidCellBackground");
  const values = names2.map((name) => {
    if (!Object.hasOwn(input, name))
      throw new TypeError("InvalidCellBackground");
    const value = input[name];
    const maximum = name === "color" ? 16777215 : 4294967295;
    if (!Number.isInteger(value) || value < 0 || value > maximum)
      throw new RangeError("InvalidCellBackground");
    return value;
  });
  return Object.freeze(Object.fromEntries(names2.map((name, index) => [name, values[index]])));
}
function validateCellBackground(input) {
  return validate2(input, false);
}
function validateCellBackgroundMessage(input) {
  return validate2(input, true);
}

// js/cell-appearance-command.mjs
function validateCellAppearance(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw TypeError("InvalidCellAppearance");
  const keys = Reflect.ownKeys(input);
  if (keys.length !== 2 || !Object.hasOwn(input, "cells") || !Object.hasOwn(input, "background"))
    throw TypeError("InvalidCellAppearance");
  const cells = validateCellBorders(input.cells), source = input.background;
  const background = source === null ? null : validateCellBackground(source);
  return Object.freeze({ cells, background });
}
function validateCellAppearanceMessage(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw TypeError("InvalidCellAppearance");
  const keys = Reflect.ownKeys(input);
  if (keys.length !== 3 || !Object.hasOwn(input, "kind") || !Object.hasOwn(input, "cells") || !Object.hasOwn(input, "background") || input.kind !== "cell-appearance")
    throw TypeError("InvalidCellAppearance");
  const value = validateCellAppearance({ cells: input.cells, background: input.background });
  return Object.freeze({ kind: "cell-appearance", ...value });
}

// js/hwpx-created-tables.mjs
function decodeCreatedTables(bytes) {
  const fail = () => {
    throw new Error("InvalidCreatedTables");
  };
  if (!(bytes instanceof Uint8Array))
    return fail();
  let rows;
  try {
    rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  return validateCreatedTables(rows);
}
function validateCreatedTables(rows, { hostBase = 1 } = {}) {
  const fail = () => {
    throw new Error("InvalidCreatedTables");
  };
  if (hostBase !== 0 && hostBase !== 1)
    return fail();
  if (!Array.isArray(rows) || rows.length > 1e5)
    return fail();
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const keys = (value, names) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === names.length && names.every((name) => Object.hasOwn(value, name));
  const identities = new Set, instances = new Set, paragraphs = new Set;
  for (const row of rows) {
    if (!keys(row, [
      "identity",
      "instance_id",
      "host_paragraph",
      "anchor_unit",
      "rows",
      "columns",
      "width",
      "height",
      "resources",
      "cells"
    ]))
      return fail();
    try {
      createdTableIdentity(row.identity);
    } catch {
      return fail();
    }
    if (identities.has(row.identity))
      return fail();
    identities.add(row.identity);
    if (![
      row.instance_id,
      row.host_paragraph,
      row.anchor_unit,
      row.rows,
      row.columns,
      row.width,
      row.height
    ].every(uint) || !row.instance_id || row.host_paragraph < hostBase || !row.rows || !row.columns || row.width < row.columns || row.height < row.rows || row.height % row.rows || instances.has(row.instance_id))
      return fail();
    instances.add(row.instance_id);
    if (!keys(row.resources, ["paragraph", "character", "style", "border_fill"]) || !Object.values(row.resources).every(uint))
      return fail();
    const count = row.rows * row.columns;
    if (count > 1e5 || !Array.isArray(row.cells) || row.cells.length !== count)
      return fail();
    const height = row.height / row.rows;
    let x = 0;
    for (let index = 0;index < count; index++) {
      const cell = row.cells[index];
      if (!keys(cell, ["paragraph_id", "row", "column", "x", "y", "width", "height", "text"]) || ![cell.paragraph_id, cell.row, cell.column, cell.x, cell.y, cell.width, cell.height].every(uint))
        return fail();
      if (!cell.paragraph_id || paragraphs.has(cell.paragraph_id) || cell.row !== Math.floor(index / row.columns) || cell.column !== index % row.columns || cell.x !== x || !cell.width || cell.height !== height || cell.y !== cell.row * height || typeof cell.text !== "string" || !cell.text.isWellFormed())
        return fail();
      paragraphs.add(cell.paragraph_id);
      x += cell.width;
      if (x > row.width)
        return fail();
      if (cell.column === row.columns - 1) {
        if (x !== row.width)
          return fail();
        x = 0;
      }
    }
  }
  return rows;
}

// js/table-creation-resources.mjs
var decoder = new TextDecoder("utf-8", { fatal: true });
function decodeTableCreationResources(bytes) {
  const value = JSON.parse(decoder.decode(bytes));
  const keys = ["paragraph", "character", "style", "border_fill"];
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== keys.length || !keys.every((key) => Object.hasOwn(value, key) && Array.isArray(value[key]) && value[key].every((id, i, ids) => Number.isInteger(id) && id >= 0 && id <= 4294967295 && (!i || ids[i - 1] < id))))
    throw new Error("InvalidTableCreationResources");
  return value;
}

// js/text-transaction-args.mjs
function textTransactionArgs({ section, paragraph, startUnit, endUnit, text }) {
  const positions = [section, paragraph, startUnit, endUnit];
  if (positions.some((value) => !Number.isInteger(value) || value < 0 || value > 4294967295) || endUnit < startUnit)
    throw new RangeError("InvalidTextPosition");
  if (typeof text !== "string")
    throw new TypeError("Text must be a string");
  if (!text.isWellFormed())
    throw new RangeError("InvalidUnicodeEncoding");
  if (text.length === 0 || startUnit + text.length > 4294967295)
    throw new RangeError("InvalidTextPosition");
  if (text.length > 4 * 1024 * 1024)
    throw new RangeError("LimitExceeded");
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > 4 * 1024 * 1024)
    throw new RangeError("LimitExceeded");
  return { positions, bytes };
}

// js/named-font-text-args.mjs
function namedFontTextArgs({
  section,
  paragraph,
  startUnit,
  endUnit,
  text,
  language,
  name
}) {
  const { positions, bytes } = textTransactionArgs({
    section,
    paragraph,
    startUnit,
    endUnit,
    text
  });
  return { positions, bytes, font: characterFontNameArgs(language, name) };
}

// js/paragraph-break-api.mjs
function createParagraphBreakApi({
  wasm,
  memory,
  check,
  uint,
  prefix,
  endAsCount,
  unavailable
}) {
  const name = `${prefix}_split_with_break`;
  return {
    supportsParagraphBreaks() {
      check();
      return typeof wasm[name] === "function";
    },
    splitParagraphWithBreak({ section, paragraph, atUnit, endUnit = atUnit, kind }) {
      check();
      const values = [section, paragraph, atUnit, endUnit];
      for (const [index, label] of ["section", "paragraph", "atUnit", "endUnit"].entries())
        uint(values[index], label);
      if (endUnit < atUnit)
        throw new RangeError("InvalidTextPosition");
      if (kind !== "page" && kind !== "column")
        throw new Error("InvalidParagraphBreakKind");
      if (typeof wasm[name] !== "function")
        throw new Error(unavailable);
      if (wasm[name](section, paragraph, atUnit, endAsCount ? endUnit - atUnit : endUnit, kind === "page" ? 1 : 2) !== 1)
        throw memory.error();
    }
  };
}

// js/editor-history.mjs
function createHistoryApi({ wasm, memory, check, uint, prefix, unavailable }) {
  const travel = (kind) => {
    check();
    const action = wasm[`${prefix}_${kind}`];
    if (typeof action !== "function")
      throw new Error(unavailable);
    const value = action();
    if (value !== 0 && value !== 1)
      throw memory.error();
    return value === 1;
  };
  let legacyPolicy;
  let negotiation;
  const api = {
    historyRevisions() {
      check();
      const count = wasm[`${prefix}_history_revision_count`], at = wasm[`${prefix}_history_revision_at`];
      if (typeof count !== "function" || typeof at !== "function")
        throw new Error(unavailable);
      const length = count();
      if (!Number.isInteger(length) || length < 1 || length > 65536)
        throw memory.error();
      const revisions = Array.from({ length }, (_, index) => at(index));
      if (revisions.some((value) => !Number.isInteger(value) || value < 0 || value >= 4294967295) || new Set(revisions).size !== length)
        throw memory.error();
      return revisions;
    },
    historyRevision() {
      check();
      const action = wasm[`${prefix}_history_revision`];
      if (typeof action !== "function")
        throw new Error(unavailable);
      const value = action();
      if (!Number.isInteger(value) || value < 0 || value >= 4294967295)
        throw memory.error();
      return value;
    },
    enableHistory({ maxEntries = 16, maxCheckpointBytes = 8 * 1024 * 1024 } = {}) {
      check();
      uint(maxEntries, "maxEntries");
      uint(maxCheckpointBytes, "maxCheckpointBytes");
      const action = wasm[`${prefix}_history_enable`];
      if (typeof action !== "function")
        throw new Error(unavailable);
      if (action(maxEntries, maxCheckpointBytes) !== 1)
        throw memory.error();
      legacyPolicy = Object.freeze({ maxEntries, maxCheckpointBytes });
      negotiation = "explicit-v1";
    },
    historyV2Available() {
      check();
      return typeof wasm[`${prefix}_history_enable_options`] === "function" && typeof wasm[`${prefix}_history_stats`] === "function";
    },
    enableHistoryV2(options = {}) {
      check();
      if (!api.historyV2Available())
        throw new Error("HistoryV2AbiUnavailable");
      if (options === null || typeof options !== "object" || ![Object.prototype, null].includes(Object.getPrototypeOf(options)))
        throw new TypeError("InvalidHistoryOptions");
      const allowed = new Set([
        "maxEntries",
        "maxCheckpointBytes",
        "maxCheckpointOwnedBytes",
        "maxRetainedBytes"
      ]);
      const clean = {};
      for (const key of Reflect.ownKeys(options)) {
        const d = Object.getOwnPropertyDescriptor(options, key);
        if (!allowed.has(key) || !d || !("value" in d))
          throw new TypeError("InvalidHistoryOptions");
        uint(d.value, key);
        clean[key] = d.value;
      }
      const bytes = new TextEncoder().encode(JSON.stringify(clean));
      memory.withBytes(bytes, (ptr, length) => {
        if (wasm[`${prefix}_history_enable_options`](ptr, length) !== 1)
          throw memory.error();
      });
      negotiation = "explicit-v2";
    },
    enableHistoryDefault(options) {
      check();
      if (options !== undefined) {
        const mode = options && typeof options === "object" ? Object.getOwnPropertyDescriptor(options, "mode") : undefined;
        if (mode && "value" in mode && mode.value === "legacy-v1") {
          if (![Object.prototype, null].includes(Object.getPrototypeOf(options)))
            throw new TypeError("InvalidHistoryOptions");
          const clean = {};
          for (const key of Reflect.ownKeys(options)) {
            const d = Object.getOwnPropertyDescriptor(options, key);
            if (!["mode", "maxEntries", "maxCheckpointBytes"].includes(key) || !d || !("value" in d))
              throw new TypeError("InvalidHistoryOptions");
            if (key !== "mode") {
              uint(d.value, key);
              clean[key] = d.value;
            }
          }
          api.enableHistory(clean);
          return;
        }
        api.enableHistoryV2(options);
        return;
      }
      if (api.historyV2Available()) {
        api.enableHistoryV2({});
        negotiation = "native-default-v2";
      } else {
        api.enableHistory();
        negotiation = "negotiated-legacy-v1";
      }
    },
    historyStats() {
      check();
      const action = wasm[`${prefix}_history_stats`];
      if (typeof action !== "function") {
        if (!legacyPolicy)
          throw new Error("HistoryNotEnabled");
        return Object.freeze({
          protocolVersion: 1,
          negotiation,
          requested: legacyPolicy,
          resolved: legacyPolicy,
          retainedBytes: null,
          metadataOwnedBytes: null,
          currentOwnedBytes: null,
          undoOwnedBytes: null,
          redoOwnedBytes: null,
          evictedCount: null,
          policySource: "legacy-abi-success"
        });
      }
      if (action() !== 1)
        throw memory.error();
      try {
        const bytes = memory.copy(wasm[`${prefix}_output_ptr`](), wasm[`${prefix}_output_len`]());
        return {
          ...JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
          negotiation
        };
      } finally {
        wasm[`${prefix}_output_free`]();
      }
    },
    undo: () => travel("undo"),
    redo: () => travel("redo")
  };
  return api;
}

export { cellBorderStyleCode, validateCellBorder, validateCellBorderMessage, validateCellBordersMessage, encodeCellBorders, encodeCellDiagonals, encodeCellBorderPatches, validateCellFills, encodeCellFills, validateCellStyles, validateCellStylesMessage, createAtomicFormattingApi, EXPERIMENTAL_EDITOR_FUNCTIONS, validateAbi, encodeCellSizes, validateCellBackground, validateCellBackgroundMessage, validateCellAppearance, validateCellAppearanceMessage, textTransactionArgs, namedFontTextArgs, createMemory, inputBytes, createHistoryApi, createParagraphBreakApi, decodeCreatedTables, validateCreatedTables, decodeTableCreationResources, captureTableTextRequest, captureTableInitialTexts, encodeTableTextRequest };
