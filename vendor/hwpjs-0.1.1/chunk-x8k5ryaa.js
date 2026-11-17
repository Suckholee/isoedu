// js/hwp5-table-layout-sources.mjs
function decodeHwp5TableLayoutSources(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  return validateHwp5TableLayoutSources(rows);
}
function validateHwp5TableLayoutSources(rows) {
  const uint = (value, max = 4294967295) => Number.isInteger(value) && value >= 0 && value <= max;
  const signed = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5TableLayoutSources");
  for (const row of rows) {
    if (row && Object.hasOwn(row, "object_extra_u16") && row.object_extra_u16 !== null && (!uint(row.object_extra_u16, 65535) || row.object_extra_bytes !== 2))
      throw new Error("InvalidHwp5TableLayoutSources");
    if (!row || ![
      "table_node",
      "table_record_node",
      "object_flags",
      "width",
      "height",
      "instance_id",
      "object_extra_bytes",
      "table_flags",
      "table_extra_bytes"
    ].every((key) => uint(row[key])) || !["offset_y", "offset_x", "z_order", "prevent_page_break"].every((key) => signed(row[key], -2147483648, 2147483647)) || !["rows", "columns", "border_fill_id"].every((key) => uint(row[key], 65535)) || !signed(row.cell_spacing, -32768, 32767) || !["outer_margins", "inner_margins"].every((key) => Array.isArray(row[key]) && row[key].length === 4 && row[key].every((value) => signed(value, -32768, 32767))) || !["description_bytes", "zone_count"].every((key) => row[key] === null || uint(row[key])) || row.description_bytes !== null && row.description_bytes % 2 !== 0)
      throw new Error("InvalidHwp5TableLayoutSources");
  }
  return rows;
}

// js/hwp5-form-sources.mjs
var uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var signed = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
var uniqueRows = (rows, inspect) => {
  const controls = new Set, objects = new Set;
  if (!Array.isArray(rows))
    throw Error("InvalidHwp5FormSources");
  for (const row of rows) {
    if (!row || !uint(row.control_node) || !uint(row.object_node) || row.control_node >= row.object_node || controls.has(row.control_node) || objects.has(row.object_node) || !inspect(row))
      throw Error("InvalidHwp5FormSources");
    controls.add(row.control_node);
    objects.add(row.object_node);
  }
  return rows;
};
function validateHwp5FormSources(rows) {
  return uniqueRows(rows, (row) => [
    "paragraph_node",
    "source_unit",
    "raw_length",
    "flags",
    "width",
    "height",
    "instance_id",
    "common_extra_bytes",
    "envelope_extra_bytes",
    "property_bytes",
    "property_nodes",
    "other_direct_children"
  ].every((k) => uint(row[k])) && row.paragraph_node < row.control_node && row.source_unit <= 4294967287 && ["unknown", "push_button", "check_box", "combo_box", "radio_button", "edit"].includes(row.kind) && uint(row.type_id) && uint(row.secondary_type_id) && ["offset_x", "offset_y", "z_order", "prevent_page_break"].every((k) => signed(row[k], -2147483648, 2147483647)) && Array.isArray(row.margins) && row.margins.length === 4 && row.margins.every((v) => signed(v, -32768, 32767)) && (row.description_bytes === null || uint(row.description_bytes)));
}
function validateHwp5FormAnchors(rows) {
  return uniqueRows(rows, (row) => uint(row.paragraph) && uint(row.source_unit) && row.source_unit <= 4294967287 && uint(row.current_unit) && row.current_unit <= 4294967287);
}
var decode = (bytes, validate) => validate(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
var decodeHwp5FormSources = (bytes) => decode(bytes, validateHwp5FormSources);
var decodeHwp5FormAnchors = (bytes) => decode(bytes, validateHwp5FormAnchors);

// js/hwp5-form-properties.mjs
var uint2 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
function validateHwp5FormProperties(rows) {
  const fail = () => {
    throw Error("InvalidHwp5FormProperties");
  };
  if (!Array.isArray(rows) || rows.length > 1e5)
    fail();
  let totalUnits = 0, totalFields = 0;
  const controls = new Set, objects = new Set;
  for (const row of rows) {
    if (!row || !["control_node", "object_node", "known_nodes", "deferred_nodes"].every((k) => uint2(row[k])) || row.control_node >= row.object_node || controls.has(row.control_node) || objects.has(row.object_node) || !Array.isArray(row.fields))
      fail();
    const fields = new Set;
    for (const property of row.fields) {
      if (!property || typeof property.field !== "string" || !/^[a-z][a-z0-9_]{0,63}$/.test(property.field) || fields.has(property.field) || !["wstring", "integer", "boolean"].includes(property.kind) || !Array.isArray(property.units) || property.units.length > 1e6 - totalUnits || property.units.some((unit) => !Number.isInteger(unit) || unit < 0 || unit > 65535))
        fail();
      totalUnits += property.units.length;
      totalFields++;
      fields.add(property.field);
      if (totalFields > 1e5)
        fail();
    }
    if (row.fields.length > row.known_nodes)
      fail();
    controls.add(row.control_node);
    objects.add(row.object_node);
  }
  return rows;
}
function decodeHwp5FormProperties(bytes) {
  return validateHwp5FormProperties(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-drawing-style-sources.mjs
function drawingStyleLayoutArgs(options) {
  if (!options || typeof options !== "object" || Array.isArray(options) || Object.keys(options).some((key) => !["border", "tail"].includes(key)))
    throw new Error("InvalidDrawingStyleLayout");
  const border = ["spec11", "observed13"].indexOf(options.border);
  const tail = ["fill_only", "alpha_shadow", "alpha_shadow_metadata"].indexOf(options.tail);
  if (border < 0 || tail < 0)
    throw new Error("InvalidDrawingStyleLayout");
  return [border, tail];
}
function validateHwp5DrawingStyleSources(rows) {
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const uint = (value) => integer(value, 0, 4294967295);
  const byte = (value) => integer(value, 0, 255);
  const signed = (value) => integer(value, -2147483648, 2147483647);
  const optional = (value, check) => value === null || check(value);
  const fail = () => {
    throw new Error("InvalidHwp5DrawingStyleSources");
  };
  if (!Array.isArray(rows))
    fail();
  const seen = new Set;
  for (const row of rows) {
    const b = row?.border;
    if (!row || !uint(row.component_node) || !uint(row.owner_node) || row.owner_node >= row.component_node || seen.has(row.component_node) || !b || !uint(b.color) || !signed(b.width) || !uint(b.attributes?.raw) || !byte(b.outline) || !uint(row.fill_flags) || typeof row.fill_known !== "boolean" || !uint(row.extra_bytes))
      fail();
    seen.add(row.component_node);
    if (row.fill_known !== ((row.fill_flags & ~7) === 0))
      fail();
    const { pattern, image } = row;
    if (!optional(pattern, (p) => p && uint(p.background) && uint(p.foreground) && signed(p.kind)) || !optional(row.gradient_colors, uint) || !optional(row.additional_bytes, uint) || !optional(image, (p) => p && byte(p.mode) && p.picture && integer(p.picture.contrast, -128, 127) && integer(p.picture.brightness, -128, 127) && byte(p.picture.effect) && integer(p.picture.bin_data_id, 0, 65535)))
      fail();
    if (row.fill_known) {
      if (pattern !== null !== !!(row.fill_flags & 1) || image !== null !== !!(row.fill_flags & 2) || row.gradient_colors !== null !== !!(row.fill_flags & 4) || row.additional_bytes === null)
        fail();
    } else if ([
      pattern,
      image,
      row.gradient_colors,
      row.additional_bytes,
      row.alpha,
      row.shadow,
      row.metadata
    ].some((v) => v !== null))
      fail();
    if (row.alpha === null !== (row.shadow === null))
      fail();
    if (Object.hasOwn(row, "gradient")) {
      const g = row.gradient;
      if (g === null ? row.gradient_colors !== null : !g || !row.fill_known || !(row.fill_flags & 4) || !byte(g.kind) || !["angle", "center_x", "center_y", "blur"].every((key) => uint(g[key])) || !optional(g.blur_center, byte) || !Array.isArray(g.colors) || g.colors.length !== row.gradient_colors || !Array.from(g.colors).every(uint) || !Array.isArray(g.positions) || g.positions.length !== (g.colors.length > 2 ? g.colors.length : 0) || !Array.from(g.positions).every(signed))
        fail();
    }
    if (row.alpha !== null) {
      const alpha = row.alpha;
      if (!alpha)
        fail();
      for (const [key, mask] of [
        ["pattern", 1],
        ["gradient", 4],
        ["image", 2]
      ]) {
        if (!optional(alpha[key], byte) || alpha[key] !== null !== !!(row.fill_flags & mask))
          fail();
      }
      const s = row.shadow;
      if (!s || !uint(s.kind) || !uint(s.color) || !signed(s.offset_x) || !signed(s.offset_y))
        fail();
    }
    if (!optional(row.metadata, (m) => m && uint(m.instance_id) && byte(m.reserved) && byte(m.shadow_alpha)) || row.metadata !== null && row.shadow === null)
      fail();
  }
  return rows;
}
function decodeHwp5DrawingStyleSources(bytes) {
  return validateHwp5DrawingStyleSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-drawing-sources.mjs
function validateHwp5DrawingSources(rows) {
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5DrawingSources");
  const controls = new Set, components = new Set;
  for (const row of rows) {
    if (!row || ![
      "control_node",
      "component_node",
      "paragraph_node",
      "kind_id",
      "flags",
      "width",
      "height",
      "instance_id",
      "original_width",
      "original_height",
      "current_width",
      "current_height",
      "component_attributes",
      "matrix_pairs",
      "component_extra_bytes"
    ].every((key) => integer(row[key], 0, 4294967295)) || !["offset_x", "offset_y", "component_offset_x", "component_offset_y"].every((key) => integer(row[key], -2147483648, 2147483647)) || !integer(row.rotation_angle, -32768, 32767) || row.matrix_pairs > 65535 || !(row.paragraph_node < row.control_node && row.control_node < row.component_node) || controls.has(row.control_node) || components.has(row.component_node))
      throw new Error("InvalidHwp5DrawingSources");
    controls.add(row.control_node);
    components.add(row.component_node);
    const keys = [
      "z_order",
      "outer_margins",
      "prevent_page_break",
      "description_bytes",
      "object_extra_bytes"
    ];
    if (keys.some((key) => Object.hasOwn(row, key))) {
      if (!integer(row.z_order, -2147483648, 2147483647) || !integer(row.prevent_page_break, -2147483648, 2147483647) || !Array.isArray(row.outer_margins) || row.outer_margins.length !== 4 || !Array.from(row.outer_margins).every((value) => integer(value, -32768, 32767)) || row.description_bytes !== null && (!integer(row.description_bytes, 0, 131070) || row.description_bytes % 2 !== 0) || !integer(row.object_extra_bytes, 0, 4294967295))
        throw new Error("InvalidHwp5DrawingSources");
    }
  }
  return rows;
}
function decodeHwp5DrawingSources(bytes) {
  return validateHwp5DrawingSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-structural-anchors.mjs
var HWP5_STRUCTURAL_ANCHOR_KINDS = Object.freeze([
  "section",
  "column",
  "header",
  "footer",
  "bookmark"
]);
function decodeHwp5StructuralAnchors(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5StructuralAnchors");
  const seen = new Set;
  for (const row of rows) {
    if (!row || !HWP5_STRUCTURAL_ANCHOR_KINDS.includes(row.kind) || !["control_node", "paragraph", "source_unit", "current_unit"].every((key) => uint(row[key])) || row.source_unit > 4294967287 || row.current_unit > 4294967287 || seen.has(row.control_node))
      throw new Error("InvalidHwp5StructuralAnchors");
    seen.add(row.control_node);
  }
  return rows;
}

// js/hwp5-page-area-sources.mjs
function decodeHwp5PageAreaSources(bytes) {
  const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  return validateHwp5PageAreaSources(rows);
}
function validateHwp5PageAreaSources(rows) {
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5PageAreaSources");
  const uint = (value, max = 4294967295) => Number.isInteger(value) && value >= 0 && value <= max;
  const seen = new Set;
  for (const row of rows) {
    if (!row || !["header", "footer"].includes(row.kind) || ![
      "owner_node",
      "list_node",
      "paragraph_count",
      "control_attributes",
      "list_attributes",
      "width",
      "height",
      "control_extra_bytes",
      "list_extra_bytes"
    ].every((key) => uint(row[key])) || row.owner_node >= row.list_node || row.list_unknown !== null && !uint(row.list_unknown, 65535) || !uint(row.text_references, 255) || !uint(row.number_references, 255) || typeof row.control_extra_nonzero !== "boolean" || typeof row.list_extra_nonzero !== "boolean" || row.control_extra_bytes === 0 && row.control_extra_nonzero || row.list_extra_bytes === 0 && row.list_extra_nonzero || seen.has(row.list_node))
      throw new Error("InvalidHwp5PageAreaSources");
    seen.add(row.list_node);
    if (row.control_instance_id !== undefined && row.control_instance_id !== null && (!uint(row.control_instance_id) || row.control_extra_bytes !== 4 || row.control_extra_nonzero !== (row.control_instance_id !== 0)))
      throw new Error("InvalidHwp5PageAreaSources");
  }
  return rows;
}

// js/hwp5-master-page-sources.mjs
function decodeHwp5MasterPageSources(bytes) {
  return validateHwp5MasterPageSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}
function validateHwp5MasterPageSources(rows) {
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5MasterPageSources");
  const uint = (value, max = 4294967295) => Number.isInteger(value) && value >= 0 && value <= max;
  const seen = new Set;
  for (const row of rows) {
    if (!row || ![
      "owner_node",
      "list_node",
      "paragraph_count",
      "list_attributes",
      "width",
      "height",
      "extra_bytes"
    ].every((key) => uint(row[key])) || row.owner_node >= row.list_node || row.list_unknown !== null && !uint(row.list_unknown, 65535) || !uint(row.text_reference, 255) || !uint(row.number_reference, 255) || typeof row.extra_nonzero !== "boolean" || row.extra_bytes === 0 && row.extra_nonzero || seen.has(row.list_node))
      throw new Error("InvalidHwp5MasterPageSources");
    seen.add(row.list_node);
  }
  return rows;
}

// js/hwp5-note-sources.mjs
function validateHwp5NoteSources(rows) {
  const uint = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5NoteSources");
  const seen = new Set, controls = new Map;
  for (const row of rows) {
    if (!row || !["footnote", "endnote"].includes(row.kind) || ![
      "control_node",
      "list_node",
      "paragraph_count",
      "paragraph",
      "source_unit",
      "current_unit",
      "number",
      "number_shape",
      "control_extra_bytes",
      "list_attributes",
      "list_extra_bytes"
    ].every((key) => uint(row[key], 4294967295)) || row.control_node >= row.list_node || row.source_unit > 4294967287 || row.current_unit > 4294967287 || !uint(row.prefix, 65535) || !uint(row.suffix, 65535) || row.instance_id !== null && !uint(row.instance_id, 4294967295) || row.list_unknown !== null && !uint(row.list_unknown, 65535) || typeof row.control_extra_nonzero !== "boolean" || typeof row.list_extra_nonzero !== "boolean" || row.control_extra_bytes === 0 && row.control_extra_nonzero || row.list_extra_bytes === 0 && row.list_extra_nonzero || seen.has(row.list_node))
      throw new Error("InvalidHwp5NoteSources");
    const previous = controls.get(row.control_node);
    if (previous && [
      "kind",
      "paragraph",
      "source_unit",
      "current_unit",
      "number",
      "prefix",
      "suffix",
      "number_shape",
      "instance_id",
      "control_extra_bytes",
      "control_extra_nonzero"
    ].some((key) => previous[key] !== row[key]))
      throw new Error("InvalidHwp5NoteSources");
    controls.set(row.control_node, row);
    seen.add(row.list_node);
  }
  return rows;
}
function decodeHwp5NoteSources(bytes) {
  return validateHwp5NoteSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-drawing-list-sources.mjs
function validateHwp5DrawingListSources(rows) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5DrawingListSources");
  const seen = new Set;
  for (const row of rows) {
    if (!row || !["caption", "body"].includes(row.kind) || ![
      "control_node",
      "owner_node",
      "list_node",
      "paragraph_count",
      "attributes",
      "extra_bytes"
    ].every((key) => uint(row[key])) || row.paragraph_count > 65535 || row.owner_node >= row.list_node || (row.kind === "caption" ? row.owner_node !== row.control_node : row.owner_node <= row.control_node) || row.unknown !== null && (!uint(row.unknown) || row.unknown > 65535) || typeof row.extra_nonzero !== "boolean" || row.extra_bytes === 0 && row.extra_nonzero || seen.has(row.list_node))
      throw new Error("InvalidHwp5DrawingListSources");
    seen.add(row.list_node);
    if (Object.hasOwn(row, "caption")) {
      const c = row.caption;
      if (row.kind === "body" ? c !== null : !c || ![c.flags, c.width, c.max_text_width, c.extra_bytes].every(uint) || !Number.isInteger(c.gap) || c.gap < -32768 || c.gap > 32767 || typeof c.extra_nonzero !== "boolean" || c.extra_bytes === 0 && c.extra_nonzero || row.extra_bytes !== c.extra_bytes + 14)
        throw new Error("InvalidHwp5DrawingListSources");
    }
    if (row.kind === "caption" ? row.margins !== null || row.last_width !== null || row.body_extra_bytes !== null : !Array.isArray(row.margins) || row.margins.length !== 4 || !Array.from(row.margins).every((value) => Number.isInteger(value) && value >= -32768 && value <= 32767) || !uint(row.last_width) || !uint(row.body_extra_bytes) || row.extra_bytes < 12 || row.body_extra_bytes !== row.extra_bytes - 12)
      throw new Error("InvalidHwp5DrawingListSources");
  }
  return rows;
}
function decodeHwp5DrawingListSources(bytes) {
  return validateHwp5DrawingListSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-drawing-local-transforms.mjs
function validateHwp5DrawingLocalTransforms(rows) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5DrawingLocalTransforms");
  const seen = new Set;
  for (const row of rows) {
    if (!row || !uint(row.component_node) || !uint(row.owner_node) || row.owner_node >= row.component_node || !Array.isArray(row.matrix) || row.matrix.length !== 6 || !Array.from(row.matrix).every(Number.isFinite) || seen.has(row.component_node))
      throw new Error("InvalidHwp5DrawingLocalTransforms");
    seen.add(row.component_node);
  }
  return rows;
}
function decodeHwp5DrawingLocalTransforms(bytes) {
  return validateHwp5DrawingLocalTransforms(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-drawing-rectangle-corners.mjs
function validateHwp5DrawingRectangleCorners(rows) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5DrawingRectangleCorners");
  const components = new Set, rectangles = new Set;
  for (const row of rows) {
    if (!row || !uint(row.component_node) || !uint(row.rectangle_node) || row.component_node >= row.rectangle_node || !uint(row.round_rate) || row.round_rate > 255 || !Array.isArray(row.points) || row.points.length !== 4 || !Array.from(row.points).every((point) => Array.isArray(point) && point.length === 2 && Array.from(point).every(Number.isFinite)) || components.has(row.component_node) || rectangles.has(row.rectangle_node))
      throw new Error("InvalidHwp5DrawingRectangleCorners");
    components.add(row.component_node);
    rectangles.add(row.rectangle_node);
    if (Object.hasOwn(row, "raw_points") && (!Array.isArray(row.raw_points) || row.raw_points.length !== 4 || !Array.from(row.raw_points).every((point) => Array.isArray(point) && point.length === 2 && Array.from(point).every((value) => Number.isInteger(value) && value >= -2147483648 && value <= 2147483647))))
      throw new Error("InvalidHwp5DrawingRectangleCorners");
  }
  return rows;
}
function decodeHwp5DrawingRectangleCorners(bytes) {
  return validateHwp5DrawingRectangleCorners(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-drawing-component-sources.mjs
function validateHwp5DrawingComponentSources(rows) {
  const fail = () => {
    throw new Error("InvalidHwp5DrawingComponentSources");
  };
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  if (!Array.isArray(rows))
    fail();
  const components = new Map, controls = new Set;
  let previous = -1;
  for (const row of rows) {
    if (!row || ![
      "component_node",
      "owner_node",
      "kind_id",
      "original_width",
      "original_height",
      "current_width",
      "current_height",
      "attributes",
      "extra_bytes"
    ].every((key) => integer(row[key], 0, 4294967295)) || !["offset_x", "offset_y", "rotation_x", "rotation_y"].every((key) => integer(row[key], -2147483648, 2147483647)) || !["group_count", "local_version", "matrix_pairs"].every((key) => integer(row[key], 0, 65535)) || !integer(row.rotation_angle, -32768, 32767) || row.second_id !== null && !integer(row.second_id, 0, 4294967295) || row.owner_node >= row.component_node || row.component_node <= previous)
      fail();
    if (row.second_id === null) {
      if (components.get(row.owner_node)?.kind_id !== 610496366)
        fail();
    } else {
      if (components.has(row.owner_node) || controls.has(row.owner_node))
        fail();
      controls.add(row.owner_node);
    }
    components.set(row.component_node, row);
    previous = row.component_node;
  }
  return rows;
}
function decodeHwp5DrawingComponentSources(bytes) {
  return validateHwp5DrawingComponentSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-counted-point-layout.mjs
function countedPointLayoutArg(layout, error) {
  if (layout === "specified_i16_axes")
    return 0;
  if (layout === "observed_i32_points")
    return 1;
  throw new Error(error);
}

// js/hwp5-drawing-polygon-points.mjs
function polygonLayoutArg(layout) {
  return countedPointLayoutArg(layout, "InvalidPolygonLayout");
}
function validateHwp5DrawingPolygonPoints(rows) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const pair = (value, valid) => Array.isArray(value) && value.length === 2 && Array.from(value).every(valid);
  const components = new Set, polygons = new Set;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5DrawingPolygonPoints");
  for (const row of rows) {
    if (!row || !uint(row.component_node) || !uint(row.polygon_node) || row.component_node >= row.polygon_node || !uint(row.extra_bytes) || components.has(row.component_node) || polygons.has(row.polygon_node) || !Array.isArray(row.raw_points) || !Array.isArray(row.points) || row.raw_points.length !== row.points.length || !Array.from(row.raw_points).every((p) => pair(p, (n) => Number.isInteger(n) && n >= -2147483648 && n <= 2147483647)) || !Array.from(row.points).every((p) => pair(p, Number.isFinite)))
      throw new Error("InvalidHwp5DrawingPolygonPoints");
    components.add(row.component_node);
    polygons.add(row.polygon_node);
  }
  return rows;
}
function decodeHwp5DrawingPolygonPoints(bytes) {
  return validateHwp5DrawingPolygonPoints(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-document-properties.mjs
function validateHwp5DocumentProperties(value) {
  const uint = (number, max) => Number.isInteger(number) && number >= 0 && number <= max;
  if (!value || !["source_record", "caret_list", "caret_paragraph", "caret_character", "extra_bytes"].every((key) => uint(value[key], 4294967295)) || ![
    "section_count",
    "page_start",
    "footnote_start",
    "endnote_start",
    "picture_start",
    "table_start",
    "equation_start"
  ].every((key) => uint(value[key], 65535)) || typeof value.extra_nonzero !== "boolean" || value.extra_bytes === 0 && value.extra_nonzero)
    throw new Error("InvalidHwp5DocumentProperties");
  return value;
}
function decodeHwp5DocumentProperties(bytes) {
  return validateHwp5DocumentProperties(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-page-control-sources.mjs
function validateHwp5PageControlSources(rows) {
  const fail = () => {
    throw new Error("InvalidHwp5PageControlSources");
  };
  const uint = (value, max = 4294967295) => Number.isInteger(value) && value >= 0 && value <= max;
  if (!Array.isArray(rows))
    fail();
  const ids = new Set, positions = new Set;
  for (const row of rows) {
    if (!row || !["position", "hide", "restart", "parity"].includes(row.kind) || ![
      "control_node",
      "paragraph",
      "source_unit",
      "current_unit",
      "attributes",
      "extra_bytes"
    ].every((key) => uint(row[key])) || row.source_unit > 4294967287 || row.current_unit > 4294967287 || typeof row.extra_nonzero !== "boolean" || row.extra_bytes === 0 && row.extra_nonzero || ids.has(row.control_node))
      fail();
    for (const field of ["number", "symbol", "prefix", "suffix", "dash"]) {
      const present = row.kind === "position" ? field !== "number" : row.kind === "restart" && field === "number";
      if (present ? !uint(row[field], 65535) : row[field] !== null)
        fail();
    }
    const position = `${row.paragraph}:${row.current_unit}`;
    if (positions.has(position))
      fail();
    ids.add(row.control_node);
    positions.add(position);
  }
  return rows;
}
function decodeHwp5PageControlSources(bytes) {
  return validateHwp5PageControlSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-picture-shadow-source.mjs
function validateHwp5PictureShadowSource(shadow, flags) {
  if (shadow === undefined)
    return;
  if (shadow === null) {
    if (flags & 1)
      throw Error("InvalidHwp5PictureShadowSource");
    return;
  }
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  const signed = (value) => Number.isInteger(value) && value >= -2147483648 && value <= 2147483647;
  const p = shadow.properties;
  if (!(flags & 1) || !p || !["style", "alignment", "rotate_with_shape"].every((key) => signed(p[key])) || ![
    "transparency_bits",
    "blur_bits",
    "direction_bits",
    "distance_bits",
    "skew_x_bits",
    "skew_y_bits",
    "scale_x_bits",
    "scale_y_bits"
  ].every((key) => uint(p[key])) || !signed(shadow.color_type) || !uint(shadow.color_value) || !uint(shadow.color_effect_count))
    throw Error("InvalidHwp5PictureShadowSource");
}

// js/hwp5-picture-tail-sources.mjs
function pictureTailLayoutArg(layout) {
  const value = ["effects_only", "dimensions8", "with_alpha9"].indexOf(layout);
  if (value < 0)
    throw new Error("InvalidPictureTailLayout");
  return value;
}
function validateHwp5PictureTailSources(rows) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5PictureTailSources");
  const components = new Set, pictures = new Set;
  for (const row of rows) {
    if (!row || ![
      "component_node",
      "owner_node",
      "picture_node",
      "instance_id",
      "effects_flags",
      "extra_bytes"
    ].every((key) => uint(row[key])) || row.owner_node >= row.component_node || row.component_node >= row.picture_node || components.has(row.component_node) || pictures.has(row.picture_node) || !Number.isInteger(row.border_opacity) || row.border_opacity < 0 || row.border_opacity > 255 || row.effects_flags & ~15 || row.image_width === null !== (row.image_height === null) || row.image_width !== null && (!uint(row.image_width) || !uint(row.image_height)) || row.image_alpha !== null && (!Number.isInteger(row.image_alpha) || row.image_alpha < -128 || row.image_alpha > 127 || row.image_width === null))
      throw new Error("InvalidHwp5PictureTailSources");
    validateHwp5PictureShadowSource(row.shadow, row.effects_flags);
    components.add(row.component_node);
    pictures.add(row.picture_node);
  }
  return rows;
}
function decodeHwp5PictureTailSources(bytes) {
  return validateHwp5PictureTailSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/hwp5-page-settings.mjs
function decodeHwp5PageSettings(bytes) {
  const row = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  return validateHwp5PageSettings(row);
}
function validateHwp5PageSettings(row) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!row || ![
    "source_node",
    "width",
    "height",
    "left",
    "right",
    "top",
    "bottom",
    "header",
    "footer",
    "gutter",
    "flags",
    "extra_bytes"
  ].every((name) => uint(row[name])) || !["narrowly", "widely"].includes(row.orientation) || !["one_side", "facing", "top"].includes(row.binding))
    throw new Error("InvalidHwp5PageSettings");
  if (row.orientation !== (row.flags & 1 ? "widely" : "narrowly") || row.binding !== ["one_side", "facing", "top"][row.flags >>> 1 & 3])
    throw new Error("InvalidHwp5PageSettings");
  return row;
}

export { HWP5_STRUCTURAL_ANCHOR_KINDS, decodeHwp5StructuralAnchors, decodeHwp5PageAreaSources, validateHwp5PageAreaSources, decodeHwp5MasterPageSources, validateHwp5MasterPageSources, validateHwp5DocumentProperties, decodeHwp5DocumentProperties, validateHwp5PageControlSources, decodeHwp5PageControlSources, validateHwp5NoteSources, decodeHwp5NoteSources, validateHwp5FormSources, validateHwp5FormAnchors, decodeHwp5FormSources, decodeHwp5FormAnchors, validateHwp5FormProperties, decodeHwp5FormProperties, validateHwp5DrawingSources, decodeHwp5DrawingSources, validateHwp5DrawingComponentSources, decodeHwp5DrawingComponentSources, validateHwp5DrawingListSources, decodeHwp5DrawingListSources, validateHwp5DrawingLocalTransforms, decodeHwp5DrawingLocalTransforms, validateHwp5DrawingRectangleCorners, decodeHwp5DrawingRectangleCorners, countedPointLayoutArg, polygonLayoutArg, validateHwp5DrawingPolygonPoints, decodeHwp5DrawingPolygonPoints, drawingStyleLayoutArgs, validateHwp5DrawingStyleSources, decodeHwp5DrawingStyleSources, validateHwp5PictureShadowSource, pictureTailLayoutArg, validateHwp5PictureTailSources, decodeHwp5PictureTailSources, decodeHwp5PageSettings, validateHwp5PageSettings, decodeHwp5TableLayoutSources, validateHwp5TableLayoutSources };
