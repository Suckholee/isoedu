// js/font-face-identity.mjs
var FONT_LANGUAGES = Object.freeze([
  "hangul",
  "latin",
  "hanja",
  "japanese",
  "other",
  "symbol",
  "user"
]);
function validFontFaceOrder(rows) {
  let previousLanguage = -1, previousId = -1;
  for (const row of rows) {
    const language = FONT_LANGUAGES.indexOf(row?.language);
    if (language < 0 || language < previousLanguage || !Number.isInteger(row.id) || row.id < 0 || row.id > 4294967295 || language === previousLanguage && row.id <= previousId)
      return false;
    previousLanguage = language;
    previousId = row.id;
  }
  return true;
}

// js/font-faces.mjs
function decodeFontFaces(bytes) {
  const fail = () => {
    throw new Error("InvalidFontFaces");
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
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row) || Object.keys(row).length !== 3 || !["language", "id", "name"].every((key) => Object.hasOwn(row, key)))
      return fail();
    if (row.name !== null && (typeof row.name !== "string" || !row.name.isWellFormed() || new TextEncoder().encode(row.name).length > 4096))
      return fail();
  }
  if (!validFontFaceOrder(rows))
    return fail();
  return rows;
}

// web/preview/text-offsets.mjs
function retainedTextView(paragraph) {
  const retained = (code) => [2, 3, 4, 8, 9, 11, 16, 17, 18, 21, 22, 23].includes(code);
  if (!paragraph.tokens.some((t) => t.type === "control" && (retained(t.code) || t.code === 10 || t.code === 24 || t.code === 30 || t.code === 31)))
    return null;
  const chunks = [], offsets = [{ at: 0, source: 0 }];
  let source = 0, display = 0, ended = false;
  for (const t of paragraph.tokens) {
    if (ended || t.startUnit !== source)
      return null;
    if (t.type === "text") {
      if (t.raw.length !== t.text.length * 2)
        return null;
      chunks.push(t.text);
      display += t.text.length;
    } else if (t.code === 10 && t.raw.length === 2) {
      chunks.push(`
`);
      display++;
    } else if (t.code === 24 && t.raw.length === 2) {
      chunks.push("­");
      display++;
    } else if ((t.code === 30 || t.code === 31) && t.raw.length === 2) {
      chunks.push(" ");
      display++;
    } else if (retained(t.code) && t.raw.length === 16) {
      chunks.push(t.code === 9 ? "\t" : t.code === 3 ? "«" : t.code === 4 ? "»" : "￼");
      display++;
      offsets.push({ at: display, source: source + t.raw.length / 2 });
    } else if (t.code === 13 && t.raw.length === 2)
      ended = true;
    else
      return null;
    source += t.raw.length / 2;
  }
  if (!ended || source !== paragraph.declaredUnits)
    return null;
  return { text: chunks.join(""), offsets };
}
function sourceTextChange(change, offsets) {
  if (!offsets)
    return change;
  const map = (unit) => {
    const row = offsets.findLast((r) => r.at <= unit);
    if (!row)
      throw new RangeError("InvalidDisplayPosition");
    return row.source + unit - row.at;
  };
  return { ...change, startUnit: map(change.startUnit), endUnit: map(change.endUnit) };
}
function sourceDisplayPosition(unit, offsets, displayLength) {
  if (!Number.isInteger(unit) || unit < 0 || !Number.isInteger(displayLength) || displayLength < 0 || !Array.isArray(offsets) || offsets.length === 0)
    throw new RangeError("InvalidSourceDisplayPosition");
  let previous;
  for (const row of offsets) {
    if (!row || !Number.isInteger(row.at) || !Number.isInteger(row.source) || row.at < 0 || row.source < 0 || previous && (row.at <= previous.at || row.source <= previous.source))
      throw new RangeError("InvalidSourceDisplayPosition");
    previous = row;
  }
  if (offsets[0].at !== 0 || offsets[0].source !== 0)
    throw new RangeError("InvalidSourceDisplayPosition");
  const index = offsets.findLastIndex((row) => row.source <= unit);
  if (index < 0)
    throw new RangeError("InvalidSourceDisplayPosition");
  const row = offsets[index], result = row.at + unit - row.source, next = offsets[index + 1];
  if (result > displayLength || next && result >= next.at && unit < next.source)
    throw new RangeError("InvalidSourceDisplayPosition");
  return result;
}

// js/paragraph-spacing-args.mjs
var paragraphSpacingTypes = Object.freeze([
  "PERCENT",
  "FIXED",
  "BETWEEN_LINES",
  "AT_LEAST"
]);
function paragraphSpacingArgs(type, value) {
  const kind = paragraphSpacingTypes.indexOf(type);
  if (kind < 0 || !Number.isInteger(value) || value < -2147483648 || value > 2147483647)
    throw new RangeError("InvalidParagraphSpacing");
  return [kind, value];
}

// web/preview/paragraph-alignments.mjs
var paragraphAlignments = Object.freeze([
  { value: 0, key: "JUSTIFY", label: "양쪽 정렬" },
  { value: 1, key: "LEFT", label: "왼쪽 정렬" },
  { value: 2, key: "RIGHT", label: "오른쪽 정렬" },
  { value: 3, key: "CENTER", label: "가운데 정렬" },
  { value: 4, key: "DISTRIBUTE", label: "배분 정렬" },
  { value: 5, key: "DISTRIBUTE_SPACE", label: "공백 배분" }
].map(Object.freeze));
var paragraphAlignmentKey = (value) => paragraphAlignments.find((entry) => entry.value === value)?.key ?? null;
var paragraphAlignmentValue = (key) => paragraphAlignments.find((entry) => entry.key === key)?.value;
var paragraphAlignmentLabel = (value) => paragraphAlignments.find((entry) => entry.value === value)?.label;

// js/character-color-args.mjs
function characterColorArg(color) {
  const value = parseCharacterColor(color);
  if (value === null)
    throw new TypeError("InvalidCharacterColor");
  return value;
}
function parseCharacterColor(color) {
  return typeof color === "string" && color.length === 7 && /^#[0-9a-f]{6}$/i.test(color) ? Number.parseInt(color.slice(1), 16) : null;
}

// js/hwp5-picture-sources.mjs
function picturePrefixArg(prefix) {
  const value = ["base73", "with_opacity74", "with_instance78"].indexOf(prefix);
  if (value < 0)
    throw new Error("InvalidPicturePrefix");
  return value;
}
function validateHwp5PictureSources(rows) {
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const uint = (value) => integer(value, 0, 4294967295), signed = (value) => integer(value, -2147483648, 2147483647);
  const array = (value, length, valid) => Array.isArray(value) && value.length === length && Array.from(value).every(valid);
  const optional = (value, valid) => value === null || valid(value);
  if (!Array.isArray(rows))
    throw new Error("InvalidHwp5PictureSources");
  const components = new Set, pictures = new Set;
  for (const row of rows) {
    if (!row || ![
      "component_node",
      "owner_node",
      "picture_node",
      "border_color",
      "border_attributes",
      "extra_bytes"
    ].every((key) => uint(row[key])) || row.owner_node >= row.component_node || row.component_node >= row.picture_node || components.has(row.component_node) || pictures.has(row.picture_node) || !signed(row.border_width) || !array(row.points, 4, (point) => array(point, 2, signed)) || !array(row.crop, 4, signed) || !array(row.margins, 4, (value) => integer(value, -32768, 32767)) || !integer(row.contrast, -128, 127) || !integer(row.brightness, -128, 127) || !integer(row.effect, 0, 255) || !integer(row.bin_data_id, 0, 65535) || !optional(row.border_opacity, (value) => integer(value, 0, 255)) || !optional(row.instance_id, uint) || row.instance_id !== null && row.border_opacity === null)
      throw new Error("InvalidHwp5PictureSources");
    components.add(row.component_node);
    pictures.add(row.picture_node);
  }
  return rows;
}
function decodeHwp5PictureSources(bytes) {
  return validateHwp5PictureSources(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
}

export { FONT_LANGUAGES, validFontFaceOrder, decodeFontFaces, retainedTextView, sourceTextChange, sourceDisplayPosition, paragraphSpacingTypes, paragraphSpacingArgs, paragraphAlignmentKey, paragraphAlignmentValue, paragraphAlignmentLabel, characterColorArg, parseCharacterColor, picturePrefixArg, validateHwp5PictureSources, decodeHwp5PictureSources };
