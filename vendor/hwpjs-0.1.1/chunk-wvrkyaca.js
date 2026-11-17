// js/hwpx-shape-layout-values.mjs
function validShapeLayoutValues(value) {
  const uint = (n) => Number.isInteger(n) && n >= 0 && n <= 4294967295;
  const optional = (n, check) => n === null || check(n);
  const signed = (n) => Number.isSafeInteger(n) && n >= -2147483648 && n <= 4294967295;
  const bool = (n) => n === null || typeof n === "boolean";
  const array = (a, length, check) => Array.isArray(a) && a.length === length && a.every(check);
  const g = value?.geometry, p = value?.position, f = value?.flow;
  return Boolean(g && p && f && [g.width, g.height].every((n) => optional(n, uint)) && optional(g.width_relative, (n) => uint(n) && n <= 4) && optional(g.height_relative, (n) => uint(n) && n <= 2) && bool(g.treat_as_character) && [g.horizontal_offset, g.vertical_offset].every((n) => optional(n, signed)) && array(p.flags, 4, bool) && Array.isArray(p.relations) && p.relations.length === 4 && p.relations.every((n, i) => optional(n, (n) => uint(n) && n <= [2, 3, 4, 4][i])) && optional(f.text_wrap, (n) => uint(n) && n <= 5) && optional(f.text_flow, (n) => uint(n) && n <= 3) && optional(f.z_order, signed) && array(f.outside_margins, 4, (n) => optional(n, signed)));
}

// js/hwpx-group-context.mjs
function validGroupContext(value, node) {
  const uint = (n) => Number.isInteger(n) && n >= 0 && n <= 4294967295;
  if (!uint(node))
    return false;
  if (value === null)
    return true;
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && [value.parent_container, value.root_anchor, value.depth].every(uint) && value.depth >= 1 && value.root_anchor <= value.parent_container && value.parent_container < node && value.depth <= value.parent_container - value.root_anchor + 1 && value.depth === 1 === (value.parent_container === value.root_anchor));
}

// js/hwpx-tab-sources.mjs
var uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var object2 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
function decodeTabSources(bytes) {
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  return validateTabSources(value);
}
function validateTabSources(value) {
  if (!object2(value) || !uint(value.section) || !uint(value.paragraph) || value.paragraph === 0 || !Array.isArray(value.rows))
    throw new Error("InvalidTabSources");
  let previous = -1;
  const nodes = new Set;
  for (const row of value.rows) {
    if (!object2(row) || !uint(row.unit) || !uint(row.node) || row.unit <= previous || nodes.has(row.node) || ![row.width, row.tab_type, row.leader].every((raw) => raw === null || typeof raw === "string" && new TextEncoder().encode(raw).length <= 4096))
      throw new Error("InvalidTabSources");
    previous = row.unit;
    nodes.add(row.node);
  }
  return value;
}

// js/hwpx-tab-definitions.mjs
var uint3 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var object3 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var raw = (value) => value === null || typeof value === "string" && new TextEncoder().encode(value).length <= 4096;
function validateTabDefinitions(rows) {
  if (!Array.isArray(rows))
    throw new Error("InvalidTabDefinitions");
  let previous = -1, count = 0;
  for (const row of rows) {
    if (!object3(row) || !uint3(row.id) || row.id <= previous || !raw(row.auto_left) || !raw(row.auto_right) || !Array.isArray(row.items))
      throw new Error("InvalidTabDefinitions");
    previous = row.id;
    count += row.items.length;
    if (count > 1e6)
      throw new Error("InvalidTabDefinitions");
    for (const item of row.items)
      if (!object3(item) || !raw(item.pos) || !raw(item.kind) || !raw(item.leader) || Object.hasOwn(item, "unit") && !raw(item.unit))
        throw new Error("InvalidTabDefinitions");
  }
  return rows;
}
function decodeTabDefinitions(bytes) {
  return validateTabDefinitions(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

// js/chart-display-fields.mjs
var object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var uint2 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var text = (value) => typeof value === "string" && value.isWellFormed();
var nullableUint = (value) => value === null || uint2(value);
var oneOf = (values) => (value) => values.includes(value);
function field(value, accepts, owner) {
  return value === null || object(value) && uint2(value.node) && value.node > owner && (value.value === null || accepts(value.value));
}
function number(value) {
  return object(value) && (value.kind === "finite" ? typeof value.value === "number" && Number.isFinite(value.value) : ["positive_infinity", "negative_infinity", "not_a_number"].includes(value.kind) && value.value === null);
}
function scaling(value, owner) {
  return value === null || object(value) && uint2(value.node) && value.node > owner && field(value.orientation, oneOf(["minMax", "maxMin"]), value.node) && [value.minimum, value.maximum, value.log_base].every((item) => field(item, number, value.node));
}

// js/chart-view-3d.mjs
function validChartView3D(value, occupied = null) {
  if (value === undefined || value === null)
    return true;
  if (!object(value) || !uint2(value.node) || value.node === 0 || occupied?.has(value.node) || typeof value.unparsed_children !== "boolean")
    return false;
  const ranges = {
    rotation_x: [-90, 90],
    rotation_y: [0, 360],
    height_percent: [5, 500],
    depth_percent: [20, 2000],
    perspective: [0, 240]
  };
  const nodes = new Set([value.node]);
  for (const key of [...Object.keys(ranges), "right_angle_axes"]) {
    const accepts = key === "right_angle_axes" ? (v) => typeof v === "boolean" : (v) => Number.isInteger(v) && v >= ranges[key][0] && v <= ranges[key][1];
    const leaf = value[key];
    if (!field(leaf, accepts, value.node))
      return false;
    if (leaf !== null) {
      if (nodes.has(leaf.node) || occupied?.has(leaf.node))
        return false;
      nodes.add(leaf.node);
    }
  }
  return true;
}

// js/hwpx-document-provenance.mjs
var object4 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var exact = (value, keys) => object4(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
var uint4 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var text2 = (value) => typeof value === "string" && value.length <= 4096;
function isSourceColorProfile(value) {
  return exact(value, ["id", "encoding", "verified"]) && typeof value.id === "string" && value.id.length > 0 && value.id.length <= 256 && ["rgb24", "colorref24"].includes(value.encoding) && typeof value.verified === "boolean";
}
function decodeDocumentProvenance(bytes) {
  const fail = () => {
    throw Error("InvalidDocumentProvenance");
  };
  if (!(bytes instanceof Uint8Array) || bytes.byteLength > 1024 * 1024)
    return fail();
  let value;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail();
  }
  if (!exact(value, ["sourceOnly", "sourceVersion", "sourceVersionError", "sourceColorProfile"]) || value.sourceOnly !== true || !isSourceColorProfile(value.sourceColorProfile))
    return fail();
  const version = value.sourceVersion;
  if (version !== null) {
    if (!exact(version, [
      "major",
      "minor",
      "micro",
      "build_number",
      "patch",
      "revision",
      "os",
      "xml_version",
      "target_application",
      "application",
      "app_version",
      "xml_bytes"
    ]) || ![version.major, version.minor, version.xml_bytes].every(uint4) || !["micro", "build_number", "patch", "revision", "os"].every((key) => version[key] === null || uint4(version[key])) || !["xml_version", "target_application", "application", "app_version"].every((key) => version[key] === null || text2(version[key])))
      return fail();
  }
  if (value.sourceVersionError !== null && (version !== null || typeof value.sourceVersionError !== "string" || !/^[A-Za-z_][A-Za-z0-9_]{0,127}$/.test(value.sourceVersionError)))
    return fail();
  return value;
}

export { validShapeLayoutValues, validGroupContext, decodeTabSources, validateTabSources, validateTabDefinitions, decodeTabDefinitions, object, uint2, text, nullableUint, oneOf, field, number, scaling, validChartView3D, isSourceColorProfile, decodeDocumentProvenance };
