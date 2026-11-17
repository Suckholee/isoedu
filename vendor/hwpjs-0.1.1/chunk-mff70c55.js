import {
  metadataKeys,
  metadataText,
  decodeMetadataWire
} from "./chunk-gx7k5hbb.js";
import {
  validShapeLayoutValues,
  validGroupContext
} from "./chunk-wvrkyaca.js";

// js/hwpx-table-caption.mjs
function decodeTableCaption(bytes) {
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  return validateTableCaption(value);
}
function validateTableCaption(value) {
  if (value === null)
    return null;
  const uint = (v) => Number.isInteger(v) && v >= 0 && v <= 4294967295;
  const signed = (v) => Number.isSafeInteger(v) && v >= -2147483648 && v <= 4294967295;
  const optional = (v, check) => v === null || check(v);
  for (const field of ["text_direction", "line_wrap", "vertical_alignment"])
    if (!optional(value?.[field], (v) => uint(v) && v <= 2))
      throw new Error("InvalidTableCaption");
  if (!value || typeof value !== "object" || Array.isArray(value) || !uint(value.caption_node) || !optional(value.list_node, uint) || !optional(value.side, (v) => uint(v) && v <= 3) || ![null, false, true].includes(value.full_size) || !optional(value.width, signed) || !optional(value.gap, signed) || !optional(value.last_width, uint))
    throw new Error("InvalidTableCaption");
  return value;
}

// js/hwpx-shape-source-values.mjs
function validateShapeSourceValues(value) {
  const fail = () => {
    throw new Error("InvalidShapeSourceValues");
  };
  const uint = (v) => Number.isInteger(v) && v >= 0 && v <= 4294967295;
  const signed = (v) => Number.isSafeInteger(v) && v >= -2147483648 && v <= 4294967295;
  const optional = (v, check) => v === null || check(v);
  const geometry = value?.geometry;
  if (!geometry || ![geometry.width, geometry.height].every((v) => optional(v, uint)) || !optional(geometry.width_relative, (v) => uint(v) && v <= 4) || !optional(geometry.height_relative, (v) => uint(v) && v <= 2) || ![null, false, true].includes(geometry.treat_as_character) || ![geometry.horizontal_offset, geometry.vertical_offset].every((v) => optional(v, signed)))
    fail();
  if (Object.hasOwn(value, "position")) {
    const p = value.position;
    if (!p || !Array.isArray(p.flags) || p.flags.length !== 4 || !p.flags.every((v) => [null, false, true].includes(v)) || !Array.isArray(p.relations) || p.relations.length !== 4 || !p.relations.every((v, i) => optional(v, (n) => uint(n) && n <= [2, 3, 4, 4][i])))
      fail();
  }
  if (Object.hasOwn(value, "flow")) {
    const f = value.flow;
    if (!f || !optional(f.text_wrap, (n) => uint(n) && n <= 5) || !optional(f.text_flow, (n) => uint(n) && n <= 3) || !optional(f.z_order, signed) || !Array.isArray(f.outside_margins) || f.outside_margins.length !== 4 || !f.outside_margins.every((v) => optional(v, signed)))
      fail();
  }
  return value;
}

// js/hwpx-drawing-text-values.mjs
function validDrawingTextValues(text, drawingNode) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const signed = (value) => Number.isSafeInteger(value) && value >= -2147483648 && value <= 4294967295;
  const optional = (value, check) => value === null || check(value);
  return Boolean(text && typeof text === "object" && !Array.isArray(text) && uint(drawingNode) && uint(text.node) && text.node > drawingNode && optional(text.list_node, uint) && (text.list_node === null || text.list_node > text.node) && typeof text.margin_present === "boolean" && Array.isArray(text.margins) && text.margins.length === 4 && Array.from(text.margins).every((value) => optional(value, signed)) && [null, false, true].includes(text.editable) && optional(text.last_width, uint) && (text.margin_present || text.margins.every((value) => value === null)) && [text.text_direction, text.line_wrap, text.vertical_alignment].every((value) => optional(value, (n) => uint(n) && n <= 2)));
}

// js/hwpx-drawing-text-snapshot.mjs
function decodeDrawingTextSnapshot(bytes) {
  const fail = () => {
    throw new Error("InvalidDrawingTextSnapshot");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length > 65536)
    return fail();
  let value;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  const uint = (v) => Number.isInteger(v) && v >= 0 && v <= 4294967295;
  const signed = (v) => Number.isSafeInteger(v) && v >= -2147483648 && v <= 4294967295;
  const optional = (v, check) => v === null || check(v);
  if (!value || ![value.drawing_node, value.paragraph, value.anchor_unit].every(uint) || value.paragraph === 0)
    return fail();
  if (value.group_context !== undefined && value.group_context !== null) {
    const group = value.group_context;
    if (!group || ![group.parent_container, group.root_anchor, group.depth].every(uint) || group.depth < 1 || group.root_anchor > group.parent_container || group.parent_container >= value.drawing_node)
      return fail();
  }
  const geometry = value.geometry, text = value.text;
  if (!geometry || !validDrawingTextValues(text, value.drawing_node))
    return fail();
  try {
    validateShapeSourceValues(value);
  } catch {
    return fail();
  }
  if (Object.hasOwn(value, "caption")) {
    try {
      validateTableCaption(value.caption);
    } catch {
      return fail();
    }
    if (value.caption !== null && value.caption.caption_node <= value.drawing_node)
      return fail();
  }
  if (Object.hasOwn(value, "transform_identity") && ![null, false, true].includes(value.transform_identity))
    return fail();
  if (Object.hasOwn(value, "rendering")) {
    const r = value.rendering;
    if (!r || !Array.isArray(r.flip) || r.flip.length !== 2 || !r.flip.every((v) => [null, false, true].includes(v)) || ![null, false, true].includes(r.reverse) || !optional(r.angle, uint))
      return fail();
    if (Object.hasOwn(r, "center") && (!Array.isArray(r.center) || r.center.length !== 2 || !r.center.every((v) => optional(v, signed))))
      return fail();
    if (Object.hasOwn(r, "rotate_image") && ![null, false, true].includes(r.rotate_image))
      return fail();
    if (r.matrix === null) {
      if (![
        "UnsupportedPictureMatrixSequence",
        "IncompletePictureMatrix",
        "NonFinitePictureMatrix"
      ].includes(r.matrix_error))
        return fail();
    } else if (!Array.isArray(r.matrix) || r.matrix.length !== 6 || !r.matrix.every(Number.isFinite) || r.matrix_error !== null)
      return fail();
  }
  if (Object.hasOwn(value, "rectangle")) {
    const r = value.rectangle;
    if (!r || typeof r.present !== "boolean" || !uint(r.unknown_children) || !Array.isArray(r.points) || r.points.length !== 4 || !r.points.every((p) => Array.isArray(p) && p.length === 2 && p.every((v) => optional(v, signed))) || !Array.isArray(r.point_present) || r.point_present.length !== 4 || !r.point_present.every((v) => typeof v === "boolean"))
      return fail();
    if (r.points.some((point, i) => !r.point_present[i] && point.some((v) => v !== null)) || !r.present && r.point_present.some(Boolean))
      return fail();
  }
  if (Object.hasOwn(value, "stroke")) {
    if (value.stroke === null) {
      if (![
        "UnsupportedLineStrokeDecoration",
        "UnsupportedLineStrokeColor",
        "UnsupportedLineStrokeStyle"
      ].includes(value.stroke_error))
        return fail();
    } else {
      const s = value.stroke;
      if (!s || value.stroke_error !== null || !optional(s.color, (n) => uint(n) && n <= 16777215) || !optional(s.width, uint) || !optional(s.style, (n) => uint(n) && n <= 6))
        return fail();
    }
  }
  if (Object.hasOwn(value, "rendering_corners") && value.rendering_corners !== null && (!Array.isArray(value.rendering_corners) || value.rendering_corners.length !== 4 || !value.rendering_corners.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))))
    return fail();
  if (Object.hasOwn(value, "paint")) {
    const p = value.paint;
    if (!p || ![p.fill_node, p.shadow_node].every((v) => optional(v, uint)) || !optional(p.shadow_type, (n) => uint(n) && n <= 14) || p.shadow_node === null && p.shadow_type !== null)
      return fail();
  }
  return value;
}

// js/hwpx-line-geometry.mjs
function decodeLineGeometry(bytes, expectedNode) {
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const uint = (n) => Number.isInteger(n) && n >= 0 && n <= 4294967295;
  if (!value || value.current !== true || value.coordinateSpace !== "renderingInfo" || value.paintable !== false || value.geometry?.node !== expectedNode || !["node", "paragraph", "anchor_node", "anchor_unit"].every((name) => uint(value.geometry[name])) || value.geometry.paragraph < 1 || !Array.isArray(value.geometry.endpoints) || value.geometry.endpoints.length !== 2 || !value.geometry.endpoints.every((point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)))
    throw new Error("InvalidLineGeometry");
  return value;
}

// js/hwpx-picture-geometry-wire.mjs
function decodePictureGeometry(bytes) {
  const fail = () => {
    throw new Error("InvalidPictureGeometry");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length !== 48)
    fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const flags = view.getUint32(4, true);
  if (view.getUint32(0, true) !== 826757192 || flags & ~127 || view.getUint32(28, true))
    fail();
  const values = Array.from({ length: 5 }, (_, i) => view.getUint32(8 + i * 4, true));
  if (values[2] > 4 || values[3] > 2 || values[4] > 1)
    fail();
  const result = {};
  for (const [index, name] of [
    "width",
    "height",
    "widthRelative",
    "heightRelative",
    "treatAsCharacter"
  ].entries()) {
    if (!(flags & 1 << index) && values[index] !== 0)
      fail();
    result[name] = flags & 1 << index ? index === 4 ? Boolean(values[index]) : values[index] : null;
  }
  for (const [index, name] of ["horizontalOffset", "verticalOffset"].entries()) {
    const value = view.getBigInt64(32 + index * 8, true), present = flags & 1 << index + 5;
    if (value < -2147483648n || value > 4294967295n || !present && value !== 0n)
      fail();
    result[name] = present ? Number(value) : null;
  }
  return result;
}

// js/hwpx-picture-position-wire.mjs
function decodePicturePosition(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 40)
    throw new Error("InvalidPicturePosition");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), presence = view.getUint32(4, true);
  if (view.getUint32(0, true) !== 827347016 || presence & ~255)
    throw new Error("InvalidPicturePosition");
  const maxima = [1, 1, 1, 1, 2, 3, 4, 4];
  const fields = maxima.map((maximum, index) => {
    const value = view.getUint32(8 + index * 4, true), present = Boolean(presence & 1 << index);
    if (value > maximum || !present && value !== 0)
      throw new Error("InvalidPicturePosition");
    return present ? index < 4 ? Boolean(value) : value : null;
  });
  return { flags: fields.slice(0, 4), relations: fields.slice(4) };
}

// js/hwpx-picture-flow-wire.mjs
function decodePictureFlow(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 56)
    throw new Error("InvalidPictureFlow");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), presence = view.getUint32(4, true);
  if (view.getUint32(0, true) !== 826691656 || presence & ~127)
    throw new Error("InvalidPictureFlow");
  const fields = Array.from({ length: 7 }, (_, index) => {
    const value = index < 2 ? view.getUint32(8 + index * 4, true) : Number(view.getBigInt64(16 + (index - 2) * 8, true));
    const present = Boolean(presence & 1 << index);
    if (index < 2 ? value > [5, 3][index] : value < -2147483648 || value > 4294967295)
      throw new Error("InvalidPictureFlow");
    if (!present && value !== 0)
      throw new Error("InvalidPictureFlow");
    return present ? value : null;
  });
  return {
    textWrap: fields[0],
    textFlow: fields[1],
    zOrder: fields[2],
    outsideMargins: fields.slice(3)
  };
}

// js/hwpx-drawing-placement-wire.mjs
function decodeDrawingPlacement(bytes, errorName = "InvalidDrawingPlacement") {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 144)
    throw new Error(errorName);
  return {
    geometry: decodePictureGeometry(bytes.subarray(0, 48)),
    position: decodePicturePosition(bytes.subarray(48, 88)),
    flow: decodePictureFlow(bytes.subarray(88, 144))
  };
}

// js/hwpx-line-display-wire.mjs
function decodeLinePlacement(bytes) {
  return decodeDrawingPlacement(bytes, "InvalidLinePlacement");
}
function decodeLineNodes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 8)
    throw new Error("InvalidLineNodes");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(4, true);
  if (view.getUint32(0, true) !== 827214920 || bytes.length !== 8 + count * 4)
    throw new Error("InvalidLineNodes");
  const nodes = Array.from({ length: count }, (_, i) => view.getUint32(8 + i * 4, true));
  if (nodes.some((node, i) => i > 0 && node <= nodes[i - 1]))
    throw new Error("InvalidLineNodes");
  return nodes;
}
function decodeLineDisplay(bytes) {
  if (!(bytes instanceof Uint8Array) || ![56, 72].includes(bytes.length))
    throw new Error("InvalidLineDisplay");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== (bytes.length === 56 ? 826559560 : 843336776) || view.getUint32(4, true) !== 0 || view.getUint32(12, true) === 0)
    throw new Error("InvalidLineDisplay");
  const endpoints = [0, 1].map((i) => [0, 1].map((axis) => view.getFloat64(24 + (i * 2 + axis) * 8, true)));
  if (endpoints.flat().some((number) => !Number.isFinite(number)))
    throw new Error("InvalidLineDisplay");
  let stroke = { color: null, width: null, style: null };
  if (bytes.length === 72) {
    const flags = view.getUint32(56, true);
    if (flags > 7)
      throw new Error("InvalidLineDisplay");
    stroke = Object.fromEntries(["color", "width", "style"].map((name, i) => {
      const value = view.getUint32(60 + i * 4, true), present = flags & 1 << i;
      if (!present && value !== 0)
        throw new Error("InvalidLineDisplay");
      return [name, present ? value : null];
    }));
    if (stroke.color > 16777215 || stroke.style > 5)
      throw new Error("InvalidLineDisplay");
  }
  return {
    lineNode: view.getUint32(8, true),
    paragraph: view.getUint32(12, true),
    anchorNode: view.getUint32(16, true),
    anchorUnit: view.getUint32(20, true),
    endpoints,
    stroke
  };
}

// js/hwpx-fill-brushes.mjs
function decodeFillBrushes(bytes) {
  const fail = () => {
    throw new Error("InvalidFillBrushes");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length > 128 * 1024 * 1024)
    return fail();
  let v;
  try {
    v = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  const uint = (n) => Number.isInteger(n) && n >= 0 && n <= 4294967295;
  const optionalUint = (n) => n === null || uint(n);
  const kinds = ["win_brush", "gradation", "img_brush", "color", "image"];
  if (!v || !Array.isArray(v.brushes) || !Array.isArray(v.nodes) || !Array.isArray(v.kind_counts) || v.kind_counts.length !== kinds.length || !v.kind_counts.every(uint))
    return fail();
  for (const key of [
    "header_and_sections",
    "master_pages",
    "other_attributes",
    "unknown_enums",
    "non_six_hex_colors",
    "attribute_bytes",
    "direct_children",
    "color_count_mismatch"
  ])
    if (!uint(v[key]))
      return fail();
  for (const b of v.brushes) {
    if (!b || !["header", "section", "master_page"].includes(b.part_kind) || ![b.part_item_index, b.element_index, b.other_attributes, b.direct_children].every(uint) || !optionalUint(b.section_ordinal) || !optionalUint(b.parent_element_index) || !Array.isArray(b.child_counts) || b.child_counts.length !== 3 || !b.child_counts.every(uint))
      return fail();
  }
  const counts = kinds.map(() => 0);
  for (const [index, n] of v.nodes.entries()) {
    if (!n || !kinds.includes(n.kind) || !uint(n.brush_index) || n.brush_index >= v.brushes.length || !optionalUint(n.parent_node_index) || n.parent_node_index !== null && n.parent_node_index >= index || ![
      n.element_index,
      n.attribute_bytes,
      n.other_attributes,
      n.unknown_enums,
      n.non_six_hex_colors,
      n.direct_children,
      n.recognized_children
    ].every(uint) || !Array.isArray(n.raw) || n.raw.length !== 19 || !n.raw.every((s) => s === null || typeof s === "string"))
      return fail();
    if (n.parent_node_index !== null && v.nodes[n.parent_node_index].brush_index !== n.brush_index)
      return fail();
    counts[kinds.indexOf(n.kind)]++;
  }
  if (!counts.every((count, i) => count === v.kind_counts[i]))
    return fail();
  return v;
}

// js/hwpx-table-border-sources.mjs
function decodeTableBorderSources(bytes) {
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const fail = () => {
    throw new Error("InvalidTableBorderSources");
  };
  const uint = (v) => Number.isInteger(v) && v >= 0 && v <= 4294967295;
  const optionalUint = (v) => v === null || uint(v);
  const text = (v) => v === null || typeof v === "string" && v.length <= 4096;
  const edge = (v) => v === null || v && !Array.isArray(v) && ["style", "width", "color"].every((k) => text(v[k]));
  if (!value || value.sourceOnly !== true || !Array.isArray(value.cells) || !Array.isArray(value.styles) || value.cells.length > 1e5 || value.styles.length > 4096)
    fail();
  const ids = new Set, nodes = new Set;
  for (const style of value.styles) {
    if (!style || !uint(style.id) || !uint(style.node) || ids.has(style.id) || nodes.has(style.node) || !Array.isArray(style.edges) || style.edges.length !== 4 || !style.edges.every(edge) || !edge(style.diagonal) || !["slash", "back_slash", "three_d", "shadow", "center_line"].every((k) => text(style[k])) || ![
      "slash_crooked",
      "slash_is_counter",
      "back_slash_crooked",
      "back_slash_is_counter",
      "break_cell_separate_line"
    ].every((k) => !Object.hasOwn(style, k) || text(style[k])) || !["slash_node", "back_slash_node", "fill_node"].every((k) => optionalUint(style[k])) || !uint(style.unknown_children) || style.unknown_attributes !== undefined && !uint(style.unknown_attributes))
      fail();
    ids.add(style.id);
    nodes.add(style.node);
    if (style.fill_report !== undefined && style.fill_report !== null) {
      const report = decodeFillBrushes(new TextEncoder().encode(JSON.stringify(style.fill_report)));
      if (report.brushes.length !== 1 || report.brushes[0].part_kind !== "header" || report.brushes[0].section_ordinal !== null || report.brushes[0].element_index !== style.fill_node || report.brushes[0].parent_element_index !== style.node)
        fail();
    }
  }
  let previous = -1;
  const lists = new Set;
  for (const cell of value.cells) {
    if (!cell || !uint(cell.table_node) || !uint(cell.cell_node) || cell.cell_node <= previous || cell.table_node >= cell.cell_node || !uint(cell.list_node) || cell.list_node <= cell.cell_node || lists.has(cell.list_node) || !optionalUint(cell.border_fill_id) || !optionalUint(cell.style_index) || cell.border_fill_id === null !== (cell.style_index === null) || cell.style_index !== null && value.styles[cell.style_index]?.id !== cell.border_fill_id)
      fail();
    previous = cell.cell_node;
    lists.add(cell.list_node);
  }
  return value;
}

// js/hwpx-shape-paint-values.mjs
function validShapePaintValues(source) {
  const uint = (n) => Number.isInteger(n) && n >= 0 && n <= 4294967295;
  const optional = (n, check) => n === null || check(n);
  if (source?.stroke === null) {
    if (![
      "UnsupportedLineStrokeDecoration",
      "UnsupportedLineStrokeColor",
      "UnsupportedLineStrokeStyle"
    ].includes(source.stroke_error))
      return false;
  } else if (!source?.stroke || source.stroke_error !== null || !optional(source.stroke.color, (n) => uint(n) && n <= 16777215) || !optional(source.stroke.width, uint) || !optional(source.stroke.style, (n) => uint(n) && n <= 6))
    return false;
  const paint = source.paint;
  return Boolean(paint && [paint.fill_node, paint.shadow_node].every((n) => optional(n, uint)) && optional(paint.shadow_type, (n) => uint(n) && n <= 14) && !(paint.shadow_node === null && paint.shadow_type !== null));
}

// js/hwpx-shape-common-source.mjs
var object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var coordinate = (value) => value === null || Number.isInteger(value) && value >= -2147483648 && value <= 4294967295;
var optionalBoolean = (value) => value === null || typeof value === "boolean";
function validShapeCommonSource(value) {
  if (!validShapeLayoutValues(value))
    return false;
  if (Object.hasOwn(value, "component_sizes")) {
    const sizes = value.component_sizes;
    if (!object(sizes) || !["original", "current"].every((key) => sizes[key] === null || object(sizes[key]) && [sizes[key].width, sizes[key].height].every((n) => n === null || uint(n))))
      return false;
  }
  if (Object.hasOwn(value, "stroke_style") && !(value.stroke_style === null || uint(value.stroke_style) && value.stroke_style <= 17))
    return false;
  if (value.stroke && value.stroke_style !== undefined && value.stroke_style !== value.stroke.style)
    return false;
  if (["stroke", "stroke_error", "paint"].some((key) => Object.hasOwn(value, key)) && !validShapePaintValues(value))
    return false;
  const r = value.rendering;
  if (!object(r) || !Array.isArray(r.flip) || r.flip.length !== 2 || !Array.from(r.flip).every(optionalBoolean) || !(r.angle === null || uint(r.angle)) || !optionalBoolean(r.reverse) || !optionalBoolean(r.rotate_image) || !Array.isArray(r.center) || r.center.length !== 2 || !Array.from(r.center).every(coordinate))
    return false;
  return r.matrix === null ? [
    "UnsupportedPictureMatrixSequence",
    "IncompletePictureMatrix",
    "NonFinitePictureMatrix"
  ].includes(r.matrix_error) : Array.isArray(r.matrix) && r.matrix.length === 6 && Array.from(r.matrix).every(Number.isFinite) && r.matrix_error === null;
}

// js/hwpx-section-tabs.mjs
var uint2 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var raw = (value) => value === null || typeof value === "string" && new TextEncoder().encode(value).length <= 4096;
function validateSectionTabs(rows) {
  if (!Array.isArray(rows))
    throw new Error("InvalidSectionTabSources");
  let previous = null;
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row) || !uint2(row.section) || !uint2(row.node) || ![row.tab_stop, row.tab_stop_val, row.tab_stop_unit].every(raw) || Object.hasOwn(row, "body_owner") && row.body_owner !== null && (!uint2(row.body_owner) || row.body_owner >= row.node) || previous && (row.section < previous.section || row.section === previous.section && row.node <= previous.node))
      throw new Error("InvalidSectionTabSources");
    previous = row;
  }
  return rows;
}
function decodeSectionTabs(bytes) {
  return validateSectionTabs(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwpx-picture-owners.mjs
function decodePictureOwners(bytes) {
  const fail = () => {
    throw new Error("InvalidPictureOwners");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length > 32 * 1024 * 1024)
    fail();
  let rows;
  try {
    rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    fail();
  }
  if (!Array.isArray(rows) || rows.length > 1e5)
    fail();
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const seen = new Set;
  return rows.map((row) => {
    if (!row || !uint(row.picture_node) || seen.has(row.picture_node))
      fail();
    seen.add(row.picture_node);
    if (row.owner === null) {
      if (typeof row.failure !== "string" || !/^[A-Za-z][A-Za-z0-9]{0,127}$/.test(row.failure))
        fail();
      return { pictureNode: row.picture_node, owner: null, error: row.failure };
    }
    if (row.failure !== null || !row.owner || !uint(row.owner.paragraph) || row.owner.paragraph === 0 || !uint(row.owner.anchor_node) || !uint(row.owner.anchor_unit))
      fail();
    return {
      pictureNode: row.picture_node,
      owner: {
        paragraph: row.owner.paragraph,
        anchorNode: row.owner.anchor_node,
        anchorUnit: row.owner.anchor_unit
      },
      error: null
    };
  });
}

// js/hwpx-page-area-declarations.mjs
function decodePageAreaDeclarations(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const invalid = () => {
    throw Error("InvalidPageAreaDeclarations");
  };
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!Array.isArray(rows) || rows.length > 1e5)
    invalid();
  const owners = new Set;
  let previousParagraph = 0;
  return rows.map((row) => {
    if (!row || ![row.paragraph, row.source_element, row.source_control, row.unit].every(uint) || row.paragraph < 1 || row.paragraph < previousParagraph || row.source_control >= row.source_element || !["left", "right"].includes(row.affinity) || owners.has(row.source_element))
      invalid();
    owners.add(row.source_element);
    previousParagraph = row.paragraph;
    return {
      paragraph: row.paragraph,
      sourceElement: row.source_element,
      sourceControl: row.source_control,
      unit: row.unit,
      affinity: row.affinity
    };
  });
}

// js/hwpx-font-face-metadata.mjs
function decodeHwpxFontFaceMetadata(bytes) {
  const fail = () => {
    throw new Error("InvalidHwpxFontFaceMetadata");
  };
  const font = (row) => metadataKeys(row, ["face", "type", "isEmbedded", "binaryItemIDRef"]) && Object.values(row).every(metadataText);
  const rows = decodeMetadataWire(bytes, "InvalidHwpxFontFaceMetadata");
  for (const row of rows) {
    if (!metadataKeys(row, ["format", "language", "id", "font", "substitute", "typeInfo"]) || row.format !== "hwpx" || !font(row.font) || row.substitute !== null && !font(row.substitute))
      return fail();
    if (row.typeInfo !== null && (!metadataKeys(row.typeInfo, [
      "familyType",
      "weight",
      "proportion",
      "contrast",
      "strokeVariation",
      "armStyle",
      "letterform",
      "midline",
      "xHeight"
    ]) || !Object.values(row.typeInfo).every(metadataText)))
      return fail();
  }
  return rows;
}

// js/hwpx-paragraph-shapes.mjs
function decodeHwpxParagraphShapes(bytes) {
  const result = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const invalid = () => {
    throw new Error("InvalidParagraphShapes");
  };
  const text = (value) => value === null || typeof value === "string";
  const measure = (value) => value === null || value && typeof value === "object" && !Array.isArray(value) && (value.value === null || Number.isInteger(value.value) && value.value >= -2147483648 && value.value <= 4294967295) && text(value.unit);
  const breaks = (value) => value === null || value && typeof value === "object" && !Array.isArray(value) && ["widow_orphan", "keep_with_next", "keep_lines", "page_break_before"].every((key) => value[key] === null || typeof value[key] === "boolean");
  if (!Array.isArray(result))
    invalid();
  const ids = new Set;
  for (const row of result) {
    if (!row || typeof row !== "object" || !Number.isInteger(row.id) || row.id < 0 || row.id > 4294967295 || ids.has(row.id) || Object.hasOwn(row, "tab_pr_id") && row.tab_pr_id !== null && (!Number.isInteger(row.tab_pr_id) || row.tab_pr_id < 0 || row.tab_pr_id > 4294967295) || Object.hasOwn(row, "break_settings") && !breaks(row.break_settings) || !text(row.horizontal) || !text(row.spacing_type) || !measure(row.spacing) || !Array.isArray(row.margins) || row.margins.length !== 5 || !row.margins.every(measure))
      invalid();
    ids.add(row.id);
  }
  return result;
}

// js/hwpx-drawing-text-bindings.mjs
function decodeDrawingTextBindings(bytes) {
  const fail = () => {
    throw new Error("InvalidDrawingTextBindings");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length > 16000000)
    return fail();
  let rows;
  try {
    rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  if (!Array.isArray(rows) || rows.length > 1e5)
    return fail();
  const seen = new Set, owners = new Map, integer = (value) => Number.isSafeInteger(value) && value >= 0 && value <= 4294967295;
  return rows.map((row) => {
    if (!row || !integer(row.paragraph) || row.paragraph === 0 || seen.has(row.paragraph) || !row.owner)
      return fail();
    const owner = row.owner;
    if (Object.hasOwn(owner, "kind") && !["text", "caption"].includes(owner.kind))
      return fail();
    if (![owner.drawing_node, owner.text_node, owner.list_node].every(integer) || !(owner.drawing_node < owner.text_node && owner.text_node < owner.list_node))
      return fail();
    const key = `${owner.drawing_node}:${owner.text_node}:${owner.kind ?? "text"}`;
    if (owners.has(owner.list_node) && owners.get(owner.list_node) !== key)
      return fail();
    owners.set(owner.list_node, key);
    seen.add(row.paragraph);
    return {
      paragraph: row.paragraph,
      drawingNode: owner.drawing_node,
      textNode: owner.text_node,
      listNode: owner.list_node,
      ...Object.hasOwn(owner, "kind") ? { kind: owner.kind } : {}
    };
  });
}

// js/hwpx-drawing-text-snapshots.mjs
function decodeDrawingTextSnapshots(bytes) {
  if (!(bytes instanceof Uint8Array))
    throw new Error("InvalidDrawingTextSnapshots");
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!Array.isArray(rows) || rows.length > 1e5)
    throw new Error("InvalidDrawingTextSnapshots");
  const encoder = new TextEncoder;
  return rows.map((row, index) => {
    const value = decodeDrawingTextSnapshot(encoder.encode(JSON.stringify(row)));
    if (index && value.drawing_node <= rows[index - 1].drawing_node)
      throw new Error("InvalidDrawingTextSnapshots");
    return value;
  });
}

// js/hwpx-container-source.mjs
function decodeContainerSource(bytes) {
  const fail = () => {
    throw new Error("InvalidContainerSource");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length > 1048576)
    return fail();
  let v;
  try {
    v = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  const uint = (n) => Number.isInteger(n) && n >= 0 && n <= 4294967295;
  const optional = (n, check) => n === null || check(n);
  const signed = (n) => Number.isSafeInteger(n) && n >= -2147483648 && n <= 4294967295;
  const bool = (n) => n === null || typeof n === "boolean";
  const array = (a, length, check) => Array.isArray(a) && a.length === length && a.every(check);
  if (!v || !uint(v.container_node))
    return fail();
  if (Object.hasOwn(v, "has_caption") || Object.hasOwn(v, "caption")) {
    if (typeof v.has_caption !== "boolean" || v.has_caption !== (v.caption !== null))
      return fail();
    try {
      validateTableCaption(v.caption);
    } catch {
      return fail();
    }
  }
  if (!Array.isArray(v.children) || !v.children.every((c, i) => c && uint(c.node) && c.node > v.container_node && (i === 0 || c.node > v.children[i - 1].node) && typeof c.namespace_uri === "string" && typeof c.local_name === "string" && c.local_name.length > 0))
    return fail();
  if (v.has_caption === true && !v.children.some((c) => c.node === v.caption.caption_node && c.namespace_uri === "http://www.hancom.co.kr/hwpml/2011/paragraph" && c.local_name === "caption"))
    return fail();
  if (!validGroupContext(v.group_context, v.container_node))
    return fail();
  const g = v.geometry, p = v.position, f = v.flow, t = v.transform;
  if (!g || !p || !f || !t)
    return fail();
  if (!validShapeLayoutValues(v))
    return fail();
  if (!array(t.flip, 2, bool) || !optional(t.angle, uint) || !array(t.center, 2, (n) => optional(n, signed)) || !bool(t.rotate_image) || !bool(t.reverse) || !uint(t.unknown_matrix_nodes) || !Array.isArray(t.matrices) || t.matrices.length > 1024)
    return fail();
  if (!t.matrices.every((m) => m && ["translation", "scale", "rotation"].includes(m.kind) && array(m.values, 6, (n) => optional(n, (n) => typeof n === "number" && Number.isFinite(n)))))
    return fail();
  return v;
}

// js/hwpx-rectangle-rendering-source.mjs
function decodeRectangleRenderingSource(bytes) {
  const fail = () => {
    throw new Error("InvalidRectangleRenderingSource");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length > 65536)
    return fail();
  let value;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  const uint = (n) => Number.isInteger(n) && n >= 0 && n <= 4294967295;
  const signed = (n) => Number.isSafeInteger(n) && n >= -2147483648 && n <= 4294967295;
  const optional = (n, check) => n === null || check(n);
  const bool = (n) => n === null || typeof n === "boolean";
  const array = (a, length, check) => Array.isArray(a) && a.length === length && a.every(check);
  if (!value || !uint(value.rectangle_node) || !value.source)
    return fail();
  if (!value.owner || ![value.owner.paragraph, value.owner.anchor_unit, value.owner.anchor_node].every(uint) || value.owner.paragraph === 0 || value.owner.anchor_node > value.rectangle_node)
    return fail();
  const s = value.source, { rendering: r, rectangle: p } = s;
  if (!validShapeLayoutValues(s))
    return fail();
  if (!validShapePaintValues(s))
    return fail();
  if (!bool(s.transform_identity) || !r || !p || !array(r.flip, 2, bool) || !optional(r.angle, uint) || !bool(r.reverse) || !array(r.center, 2, (n) => optional(n, signed)) || !bool(r.rotate_image))
    return fail();
  if (r.matrix === null) {
    if (![
      "UnsupportedPictureMatrixSequence",
      "IncompletePictureMatrix",
      "NonFinitePictureMatrix"
    ].includes(r.matrix_error))
      return fail();
  } else if (!array(r.matrix, 6, Number.isFinite) || r.matrix_error !== null)
    return fail();
  if (typeof p.present !== "boolean" || !uint(p.unknown_children) || !array(p.point_present, 4, (n) => typeof n === "boolean") || !array(p.points, 4, (point) => array(point, 2, (n) => optional(n, signed))))
    return fail();
  if (p.points.some((point, i) => !p.point_present[i] && point.some((n) => n !== null)) || !p.present && p.point_present.some(Boolean))
    return fail();
  if (s.rendering_corners !== null && (!array(s.rendering_corners, 4, (point) => array(point, 2, Number.isFinite)) || r.matrix === null))
    return fail();
  return value;
}

// js/hwpx-rectangle-rendering-sources.mjs
function decodeRectangleRenderingSources(bytes) {
  if (!(bytes instanceof Uint8Array))
    throw new Error("InvalidRectangleRenderingSources");
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!Array.isArray(rows) || rows.length > 1e5)
    throw new Error("InvalidRectangleRenderingSources");
  const encoder = new TextEncoder;
  return rows.map((row, index) => {
    const value = decodeRectangleRenderingSource(encoder.encode(JSON.stringify(row)));
    if (index && value.rectangle_node <= rows[index - 1].rectangle_node)
      throw new Error("InvalidRectangleRenderingSources");
    return value;
  });
}

// js/hwpx-ellipse-sources.mjs
var object2 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var uint3 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var coordinate2 = (value) => value === null || Number.isInteger(value) && value >= -2147483648 && value <= 4294967295;
function decodeEllipseSources(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const text = (value) => value === null || typeof value === "string" && new TextEncoder().encode(value).length <= 4096;
  if (!Array.isArray(rows) || rows.length > 1e5 || rows.some((row, index) => {
    const owner = row?.owner, geometry = row?.geometry;
    return !object2(row) || row.sourceOnly !== true || !uint3(row.node) || index > 0 && row.node <= rows[index - 1].node || Object.hasOwn(row, "common") && !validShapeCommonSource(row.common) || row.common && Object.hasOwn(row.common, "group_context") && !validGroupContext(row.common.group_context, row.node) || row.common?.group_context && row.common.group_context.root_anchor !== owner?.anchor_node || !object2(owner) || !["paragraph", "anchor_node", "anchor_unit"].every((key) => uint3(owner[key])) || owner.paragraph < 1 || !object2(geometry) || !["interval_dirty", "has_arc_properties", "arc_type"].every((key) => text(geometry[key])) || !Array.isArray(geometry.points) || geometry.points.length !== 7 || !Array.from(geometry.points).every((point) => point === null || object2(point) && coordinate2(point.x) && coordinate2(point.y));
  }))
    throw new Error("InvalidEllipseSources");
  return rows;
}

// js/hwpx-picture-sites-wire.mjs
var states = ["located", "conditional", "unsupported_anchor", "missing_host", "ambiguous_host"];
function decodePictureSites(bytes) {
  const fail = () => {
    throw new Error("InvalidPictureSites");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length < 8)
    fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 827871304)
    fail();
  const count = view.getUint32(4, true);
  if (count > 1e5 || bytes.length !== 8 + count * 16)
    fail();
  const result = [], seen = new Set;
  for (let index = 0;index < count; index++) {
    const at = 8 + index * 16;
    const pictureNode = view.getUint32(at, true), paragraphValue = view.getUint32(at + 4, true);
    const unitValue = view.getUint32(at + 8, true), flags = view.getUint32(at + 12, true);
    const stateIndex = flags & 255, hasParagraph = Boolean(flags & 256), hasUnit = Boolean(flags & 512);
    if (flags & ~775 || stateIndex > 4 || seen.has(pictureNode))
      fail();
    if (hasParagraph && paragraphValue === 0)
      fail();
    if (!hasParagraph && paragraphValue !== 0 || !hasUnit && unitValue !== 0)
      fail();
    if (stateIndex === 0 !== hasUnit || hasUnit && !hasParagraph)
      fail();
    if (stateIndex === 2 !== (hasParagraph && !hasUnit))
      fail();
    seen.add(pictureNode);
    result.push({
      pictureNode,
      paragraph: hasParagraph ? paragraphValue : null,
      anchorUnit: hasUnit ? unitValue : null,
      state: states[stateIndex]
    });
  }
  return result;
}

// js/hwpx-picture-owner-wire.mjs
function decodePictureOwner(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 16)
    throw new Error("InvalidPictureOwner");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 827281480 || view.getUint32(4, true) === 0)
    throw new Error("InvalidPictureOwner");
  return {
    paragraph: view.getUint32(4, true),
    anchorNode: view.getUint32(8, true),
    anchorUnit: view.getUint32(12, true)
  };
}

// js/hwpx-picture-corners-wire.mjs
function decodePictureRenderingCorners(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 72)
    throw new Error("InvalidPictureRenderingCorners");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 827019336 || view.getUint32(4, true) !== 0)
    throw new Error("InvalidPictureRenderingCorners");
  return Array.from({ length: 4 }, (_, index) => Array.from({ length: 2 }, (_, coordinate) => {
    const number = view.getFloat64(8 + (index * 2 + coordinate) * 8, true);
    if (!Number.isFinite(number))
      throw new Error("InvalidPictureRenderingCorners");
    return number;
  }));
}

// js/hwpx-connector-source.mjs
var uint4 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var object3 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var parse = (bytes) => JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
function decodeConnectorNodes(bytes) {
  const nodes = parse(bytes);
  if (!Array.isArray(nodes) || !nodes.every((value, index) => uint4(value) && (index === 0 || value > nodes[index - 1])))
    throw new Error("InvalidConnectorNodes");
  return nodes;
}
function decodeConnectorSource(bytes) {
  const value = parse(bytes), geometry = value?.geometry;
  const point = (item) => item === null || object3(item) && ["x", "y", "subject_id_ref", "subject_index", "control_type"].every((name) => item[name] === null || typeof item[name] === "string");
  if (!object3(value) || value.sourceOnly !== true || !uint4(value.node) || !object3(geometry) || !(geometry.raw_type === null || typeof geometry.raw_type === "string") || typeof geometry.known_type !== "boolean" || !point(geometry.start) || !point(geometry.end) || typeof geometry.controls_present !== "boolean" || !Array.isArray(geometry.controls) || geometry.controls.length > 4096 || !geometry.controls.every((item) => item !== null && point(item)) || !geometry.controls_present && geometry.controls.length !== 0 || !uint4(geometry.unexpected_children))
    throw new Error("InvalidConnectorSource");
  return value;
}
function decodeConnectorOwner(bytes, expectedNode) {
  const value = parse(bytes);
  if (!object3(value) || value.current !== true || value.sourceOnly === true || !["node", "paragraph", "anchor_node", "anchor_unit"].every((name) => uint4(value[name])) || value.paragraph < 1 || expectedNode !== undefined && value.node !== expectedNode)
    throw new Error("InvalidConnectorOwner");
  return value;
}
function decodeConnectorRenderingSource(bytes, expectedNode) {
  const value = parse(bytes);
  const point = (row) => Array.isArray(row) && row.length === 2 && row.every(Number.isFinite);
  if (!object3(value) || value.sourceOnly !== true || value.coordinateSpace !== "renderingInfo" || !uint4(value.node) || expectedNode !== undefined && value.node !== expectedNode || !Array.isArray(value.endpoints) || value.endpoints.length !== 2 || !value.endpoints.every(point) || !Array.isArray(value.controls) || value.controls.length > 4096 || !value.controls.every(point))
    throw new Error("InvalidConnectorRenderingSource");
  return value;
}

// js/hwpx-drawing-stroke-source.mjs
var fields = [
  "color",
  "width",
  "style",
  "endCap",
  "headStyle",
  "tailStyle",
  "headfill",
  "tailfill",
  "headSz",
  "tailSz",
  "outlineStyle",
  "alpha"
];
var uint5 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
function decodeDrawingStrokeSource(bytes, expectedNode) {
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const attr = value?.attributes;
  if (!value || value.sourceOnly !== true || !uint5(value.node) || value.node !== expectedNode || !(value.lineShapeNode === null || uint5(value.lineShapeNode)) || !(value.knownColor === null || typeof value.knownColor === "boolean") || !uint5(value.unknownEnums) || value.unknownEnums > 8 || !attr || typeof attr !== "object" || Array.isArray(attr) || !fields.every((name) => attr[name] === null || typeof attr[name] === "string" && new TextEncoder().encode(attr[name]).length <= 4096))
    throw new Error("InvalidDrawingStrokeSource");
  return value;
}

// js/hwpx-page-settings.mjs
function validateColumn(column) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!column || !uint(column.declaration_node) || !uint(column.owner_node) || ![column.count, column.gap].every((value) => value === null || uint(value)) || ![null, true, false].includes(column.same_size) || ![null, "left", "right", "mirror"].includes(column.direction) || ![null, "newspaper", "balanced_newspaper", "parallel"].includes(column.kind) || typeof column.ambiguous !== "boolean")
    throw new Error("InvalidParagraphFlow");
  if (column.sizes !== undefined && (!Array.isArray(column.sizes) || column.sizes.some((size) => !size || ![size.width, size.gap].every((value) => value === null || uint(value)))))
    throw new Error("InvalidParagraphFlow");
}
function decodeParagraphFlow(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!Array.isArray(rows))
    throw new Error("InvalidParagraphFlow");
  for (const row of rows) {
    if (!row)
      throw new Error("InvalidParagraphFlow");
    if (row.empty_line_eligible !== undefined && typeof row.empty_line_eligible !== "boolean")
      throw new Error("InvalidParagraphFlow");
    if (row.note_context !== undefined && row.note_context !== null) {
      const note = row.note_context;
      if (![note.note_node, note.list_node].every((value) => Number.isInteger(value) && value >= 0 && value <= 4294967295) || !["footnote", "endnote"].includes(note.kind) || row.host !== note.kind || row.top_level !== false)
        throw new Error("InvalidParagraphFlow");
    }
    if (row.single_column !== undefined && typeof row.single_column !== "boolean")
      throw new Error("InvalidParagraphFlow");
    if (row.host !== undefined && !["body", "header", "footer", "footnote", "endnote", "drawing", "other"].includes(row.host))
      throw new Error("InvalidParagraphFlow");
    if (row.column_declaration !== undefined && row.column_declaration !== null) {
      validateColumn(row.column_declaration);
    }
    if (row.column_start_declaration !== undefined && row.column_start_declaration !== null) {
      validateColumn(row.column_start_declaration);
    }
    if (row.column_changes !== undefined) {
      if (!Array.isArray(row.column_changes))
        throw new Error("InvalidParagraphFlow");
      let previous = 0;
      for (const change of row.column_changes) {
        if (!change || !Number.isInteger(change.unit) || change.unit < previous || change.unit > 4294967295)
          throw new Error("InvalidParagraphFlow");
        validateColumn(change.declaration);
        previous = change.unit;
      }
    }
    if (row.page_number_source !== undefined && row.page_number_source !== null) {
      const source = row.page_number_source;
      if (typeof source.supported !== "boolean" || source.start_page !== null && (!Number.isInteger(source.start_page) || source.start_page < 1 || source.start_page > 4294967295) || ![null, true, false].includes(source.hide_first_header) || ![null, true, false].includes(source.hide_first_footer))
        throw new Error("InvalidParagraphFlow");
    }
    if (row.page_area !== undefined && row.page_area !== null) {
      const area = row.page_area;
      const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
      if (!area || !uint(area.owner_node) || !uint(area.list_node) || ![area.width, area.height].every((value) => value === null || uint(value)) || ![null, "both", "odd", "even"].includes(area.apply) || ![null, "top", "center", "bottom"].includes(area.vertical_alignment))
        throw new Error("InvalidParagraphFlow");
    }
    if (!row || !Number.isInteger(row.paragraph) || row.paragraph <= 0 || row.paragraph > 4294967295 || !Number.isInteger(row.source_node) || row.source_node < 0 || row.source_node > 4294967295 || typeof row.top_level !== "boolean" || ![null, true, false].includes(row.page_break) || ![null, true, false].includes(row.column_break))
      throw new Error("InvalidParagraphFlow");
  }
  if (rows.some((row, i) => i > 0 && row.paragraph !== rows[i - 1].paragraph + 1))
    throw new Error("InvalidParagraphFlow");
  return rows;
}
function decodePageSettings(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const optional = (value) => value === null || uint(value);
  if (!Array.isArray(rows))
    throw new Error("InvalidPageSettings");
  for (const row of rows) {
    if (!row || !uint(row.section_ordinal) || !uint(row.element_index) || !uint(row.duplicate_margins) || !optional(row.width) || !optional(row.height) || ![null, "widely", "narrowly"].includes(row.orientation) || ![null, "left_only", "left_right", "top_bottom"].includes(row.gutter_type))
      throw new Error("InvalidPageSettings");
    if (row.hide_first_empty_line !== undefined && ![null, true, false].includes(row.hide_first_empty_line))
      throw new Error("InvalidPageSettings");
    if (Object.hasOwn(row, "hide_first_empty_line") !== Object.hasOwn(row, "visibility_count"))
      throw new Error("InvalidPageSettings");
    if (row.visibility_count !== undefined && (!uint(row.visibility_count) || row.visibility_count !== 1 && row.hide_first_empty_line != null))
      throw new Error("InvalidPageSettings");
    if (row.margin !== null && (!row.margin || !["header", "footer", "gutter", "left", "right", "top", "bottom"].every((name) => optional(row.margin[name]))))
      throw new Error("InvalidPageSettings");
  }
  return rows;
}

// js/hwpx-note-shapes.mjs
function decodeNoteShapes(bytes) {
  const report = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const invalid = () => {
    throw new Error("InvalidNoteShapes");
  };
  if (!report || ![
    "sections",
    "foot_notes",
    "end_notes",
    "other_attributes",
    "unknown_enums",
    "noncanonical_colors",
    "direct_children"
  ].every((name) => uint(report[name])) || !Array.isArray(report.notes) || !Array.isArray(report.children))
    invalid();
  for (const note of report.notes) {
    if (!note || !["foot", "end"].includes(note.kind) || ![
      "section_ordinal",
      "element_index",
      "parent_element_index",
      "other_attributes",
      "direct_children"
    ].every((name) => uint(note[name])) || note.section_ordinal >= report.sections || !Array.isArray(note.child_counts) || note.child_counts.length !== 5 || !note.child_counts.every(uint))
      invalid();
  }
  for (const child of report.children) {
    if (!child || !["auto_num_format", "note_line", "note_spacing", "numbering", "placement"].includes(child.kind) || ![
      "note_index",
      "element_index",
      "other_attributes",
      "unknown_enums",
      "noncanonical_colors",
      "direct_children"
    ].every((name) => uint(child[name])) || child.note_index >= report.notes.length || !Array.isArray(child.raw) || child.raw.length !== 16 || !child.raw.every((value) => value === null || typeof value === "string"))
      invalid();
  }
  return report;
}

// js/hwpx-table-pagination.mjs
function decodeTablePagination(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const optional = (value) => value === null || uint(value);
  if (!Array.isArray(rows))
    throw new Error("InvalidTablePagination");
  let previous = -1;
  for (const row of rows) {
    const value = row?.values;
    if (!row || !uint(row.table_node) || row.table_node <= previous || !value || ![null, "none", "table", "cell", "unknown"].includes(value.page_break) || ![null, false, true].includes(value.repeat_header) || ![null, false, true].includes(value.no_adjust) || !optional(value.cell_spacing) || !optional(value.border_fill_id))
      throw new Error("InvalidTablePagination");
    previous = row.table_node;
  }
  return rows;
}

// js/hwpx-table-geometry.mjs
function decodeTableGeometry(bytes) {
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!value || typeof value !== "object")
    throw new Error("InvalidTableGeometry");
  const uint = (v) => Number.isInteger(v) && v >= 0 && v <= 4294967295;
  const signed = (v) => Number.isSafeInteger(v) && v >= -2147483648 && v <= 4294967295;
  const optional = (v, check) => v === null || check(v);
  const bool = (v) => [null, false, true].includes(v);
  const bounded = (max) => (v) => uint(v) && v <= max;
  if (Object.hasOwn(value, "z_order") && !optional(value.z_order, signed))
    throw new Error("InvalidTableGeometry");
  const g = value?.geometry;
  const margin = (v) => v === null || Array.isArray(v) && v.length === 4 && v.every((n) => optional(n, signed));
  for (const [name, maximum] of [
    ["text_wrap", 5],
    ["text_flow", 3]
  ]) {
    if (name in value && !optional(value[name], bounded(maximum)))
      throw new Error("InvalidTableGeometry");
  }
  if (!g || !optional(g.width, uint) || !optional(g.height, uint) || !optional(g.width_relative, bounded(4)) || !optional(g.height_relative, bounded(2)) || !bool(g.treat_as_character) || !optional(g.horizontal_offset, signed) || !optional(g.vertical_offset, signed) || ![
    value.affect_line_spacing,
    value.flow_with_text,
    value.allow_overlap,
    value.hold_anchor
  ].every(bool) || !optional(value.vertical_relative, bounded(2)) || !optional(value.horizontal_relative, bounded(3)) || !optional(value.vertical_alignment, bounded(4)) || !optional(value.horizontal_alignment, bounded(4)) || !margin(value.out_margin) || !margin(value.in_margin))
    throw new Error("InvalidTableGeometry");
  return value;
}

// js/caption-bindings-wire.mjs
function decodeCaptionBindings(bytes, ownerField, errorName) {
  if (!["table_node", "picture_node", "container_node"].includes(ownerField))
    throw new Error("InvalidCaptionBindingOwnerField");
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const uint = (v) => Number.isInteger(v) && v >= 0 && v <= 4294967295;
  const object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  if (!Array.isArray(rows) || rows.length > 1e5)
    throw new Error(errorName);
  let previous = 0;
  for (const row of rows) {
    if (!object(row) || !uint(row.paragraph) || row.paragraph <= previous || !object(row.owner) || !uint(row.owner[ownerField]) || !uint(row.owner.caption_node) || !uint(row.owner.list_node))
      throw new Error(errorName);
    previous = row.paragraph;
  }
  return rows;
}

// js/hwpx-table-caption-bindings.mjs
function decodeTableCaptionBindings(bytes) {
  return decodeCaptionBindings(bytes, "table_node", "InvalidTableCaptionBindings");
}

// js/hwpx-note-reference-sites.mjs
function decodeNoteReferenceSites(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!Array.isArray(rows) || rows.length > 1e5)
    throw new Error("InvalidNoteReferenceSites");
  const notes = new Set, anchors = new Set, numbers = new Set;
  for (const row of rows) {
    if (!row || Array.isArray(row) || !["note_node", "number_node", "anchor_node", "paragraph", "anchor_unit"].every((key) => uint(row[key])) || row.paragraph === 0 || notes.has(row.note_node) || anchors.has(row.anchor_node) || numbers.has(row.number_node))
      throw new Error("InvalidNoteReferenceSites");
    notes.add(row.note_node);
    anchors.add(row.anchor_node);
    numbers.add(row.number_node);
  }
  return rows;
}

// js/hwpx-paragraph-text-snapshot.mjs
function decodeParagraphTextSnapshot(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!Array.isArray(rows) || rows.length > 1e5)
    throw new Error("InvalidParagraphTextSnapshot");
  let previous = null;
  for (const row of rows) {
    if (!row || !Number.isInteger(row.paragraph) || row.paragraph < 1 || row.paragraph > 4294967295 || previous !== null && row.paragraph !== previous + 1 || typeof row.text !== "string" || !row.text.isWellFormed() || typeof row.nested !== "boolean")
      throw new Error("InvalidParagraphTextSnapshot");
    previous = row.paragraph;
  }
  return rows;
}

// js/hwpx-formula-field-sources.mjs
function decodeFormulaFieldSources(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const optionalBoolean = (value) => value === null || typeof value === "boolean";
  if (!Array.isArray(rows) || rows.length > 1e5)
    throw new Error("InvalidFormulaFieldSources");
  const begins = new Set, ends = new Set;
  for (const row of rows) {
    if (!row || !uint(row.begin_node) || !uint(row.end_node) || row.end_node <= row.begin_node || begins.has(row.begin_node) || ends.has(row.end_node) || !optionalBoolean(row.editable) || !optionalBoolean(row.dirty) || !Array.isArray(row.raw) || row.raw.length !== 5 || row.raw.some((value) => value !== null && (typeof value !== "string" || !value.isWellFormed())))
      throw new Error("InvalidFormulaFieldSources");
    begins.add(row.begin_node);
    ends.add(row.end_node);
  }
  return rows;
}

// js/hwpx-table-cell-margin.mjs
function decodeTableCellMargin(bytes) {
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const bool = (v) => [null, false, true].includes(v);
  const number = (v) => v === null || Number.isSafeInteger(v) && v >= -2147483648 && v <= 4294967295;
  if (!value || !bool(value.has_margin) || !bool(value.header) || !(value.margin === null || Array.isArray(value.margin) && value.margin.length === 4 && value.margin.every(number)))
    throw new Error("InvalidTableCellMargin");
  for (const field of ["text_direction", "line_wrap", "vertical_alignment"]) {
    if (value[field] !== undefined && value[field] !== null && !(Number.isInteger(value[field]) && value[field] >= 0 && value[field] <= 2))
      throw new Error("InvalidTableCellMargin");
  }
  return value;
}

// js/hwpx-picture-crop-wire.mjs
function decodePictureCrop(bytes) {
  const fail = () => {
    throw new Error("InvalidPictureCrop");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length !== 48)
    fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), flags = view.getUint32(4, true);
  if (view.getUint32(0, true) !== 826495048 || flags & ~63)
    fail();
  const clip = [];
  for (let index = 0;index < 4; index++) {
    const value = view.getBigInt64(8 + index * 8, true), present = flags & 1 << index;
    if (value < -2147483648n || value > 4294967295n || !present && value !== 0n)
      fail();
    clip.push(present ? Number(value) : null);
  }
  const imageDimensions = [];
  for (let index = 0;index < 2; index++) {
    const value = view.getUint32(40 + index * 4, true), present = flags & 1 << index + 4;
    if (!present && value !== 0)
      fail();
    imageDimensions.push(present ? value : null);
  }
  return { clip, imageDimensions };
}

// js/hwpx-picture-transform-wire.mjs
function decodePictureTransform(bytes) {
  const fail = () => {
    throw new Error("InvalidPictureTransform");
  };
  if (!(bytes instanceof Uint8Array) || bytes.length < 24)
    fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(4, true), flags = view.getUint32(12, true), angle = view.getUint32(16, true), identity = view.getUint32(20, true);
  if (view.getUint32(0, true) !== 827609160 || count > 1024 || bytes.length !== 24 + count * 56 || flags & ~1807 || identity > 2 || !(flags & 8) && angle !== 0)
    fail();
  const booleans = [0, 1, 2].map((index) => {
    const present = flags & 1 << index, value = Boolean(flags & 1 << index + 8);
    if (!present && value)
      fail();
    return present ? value : null;
  });
  const matrices = [];
  for (let index = 0;index < count; index++) {
    const at = 24 + index * 56, kind = view.getUint32(at, true), presence = view.getUint32(at + 4, true);
    if (kind > 2 || presence & ~63)
      fail();
    const values = Array.from({ length: 6 }, (_, field) => {
      const value = view.getFloat64(at + 8 + field * 8, true), present = presence & 1 << field;
      if (!present && value !== 0)
        fail();
      return present ? value : null;
    });
    matrices.push({ kind: ["translation", "scale", "rotation"][kind], values });
  }
  return {
    flip: booleans.slice(0, 2),
    reverse: booleans[2],
    angle: flags & 8 ? angle : null,
    identity: identity === 0 ? null : identity === 1,
    unknownMatrixNodes: view.getUint32(8, true),
    matrices
  };
}
export { decodeTableCaption, validateShapeSourceValues, validDrawingTextValues, decodeDrawingTextSnapshot, decodeLineGeometry, decodePictureGeometry, decodePicturePosition, decodePictureFlow, decodeDrawingPlacement, decodeLinePlacement, decodeLineNodes, decodeLineDisplay, decodeFillBrushes, decodeTableBorderSources, validShapeCommonSource, validateSectionTabs, decodeSectionTabs, decodePictureOwners, decodePageAreaDeclarations, decodeHwpxFontFaceMetadata, decodeHwpxParagraphShapes, decodeDrawingTextBindings, decodeDrawingTextSnapshots, decodeContainerSource, decodeRectangleRenderingSource, decodeRectangleRenderingSources, decodeEllipseSources, decodePictureSites, decodePictureOwner, decodePictureRenderingCorners, decodeConnectorNodes, decodeConnectorSource, decodeConnectorOwner, decodeConnectorRenderingSource, decodeDrawingStrokeSource, decodeParagraphFlow, decodePageSettings, decodeNoteShapes, decodeTablePagination, decodeTableGeometry, decodeCaptionBindings, decodeTableCaptionBindings, decodeNoteReferenceSites, decodeParagraphTextSnapshot, decodeFormulaFieldSources, decodeTableCellMargin, decodePictureCrop, decodePictureTransform };
