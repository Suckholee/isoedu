import {
  FONT_LANGUAGES,
  validFontFaceOrder,
  sourceTextChange,
  paragraphAlignmentKey,
  paragraphAlignmentValue,
  characterColorArg
} from "./chunk-jk4tbr51.js";
import {
  CHARACTER_EFFECTS,
  characterEffectMode,
  characterEffectArgs,
  hwp5CharacterOutlineArg
} from "./chunk-6ffsr0y9.js";
import {
  TEXT_TOP,
  TEXT_LEFT,
  rowTop,
  hitTableBoundary,
  sameParagraph,
  selectableText,
  paragraphTarget,
  hitText,
  caretGeometry,
  characterShadeResourceValue,
  characterOutlineResourceKind,
  characterEffectResourceValue,
  HOST_EPOCH_KEYS,
  createHostEpochReaders,
  historySelectionStamp,
  sameHistoryPaintStamp,
  createHistoryPaintBarrier,
  LINE_HEIGHT,
  canvasHorizontalExtent,
  createSurfaceRenderer
} from "./chunk-sg8m4ms8.js";
import {
  affinePoint
} from "./chunk-a94gkc3m.js";
import"./chunk-x8k5ryaa.js";
import {
  hwp5StructuralEditableStart,
  typingSourceSpan,
  mergeTypingProperties,
  characterTypingState,
  characterTypingSize
} from "./chunk-pger00hh.js";
import {
  paragraphBreakIntent
} from "./chunk-c36s8813.js";
import {
  encodeCharacterRanges,
  normalizeParagraphReplacement,
  characterShadeArgs
} from "./chunk-vq9qdwke.js";
import {
  characterFontNameArgs,
  characterPropertyArgs
} from "./chunk-bnqtzsr8.js";
import {
  paragraphSelectionEdge,
  paragraphSelectionOwner,
  paragraphSelectionRanges,
  uint,
  observationRows,
  textChange,
  graphemeUnits,
  wordBoundary,
  snapUnit,
  characterRangeValues,
  isUtf16Boundary,
  isSourceCharacterSize,
  characterPropertyResourceValue
} from "./chunk-2q1tayv5.js";

// web/preview/range-atomic-formatting.mjs
var uint2 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var check = (condition, reason) => {
  if (!condition)
    throw Error(reason);
};
var bytes = (value) => new TextEncoder().encode(JSON.stringify(value)).byteLength;
function atomicRangePatch(intent) {
  check(intent && typeof intent === "object" && !Array.isArray(intent), "InvalidFormattingIntent");
  if (intent.kind === "alignment") {
    check(Object.keys(intent).every((key) => ["kind", "alignment"].includes(key)), "UnknownFormattingIntent");
    check(paragraphAlignmentValue(intent.alignment) !== undefined, "InvalidParagraphAlignment");
    return Object.freeze({ paragraph: Object.freeze({ alignment: intent.alignment }) });
  }
  check(intent.kind === "font-names" && intent.names && typeof intent.names === "object" && !Array.isArray(intent.names), "InvalidFormattingIntent");
  check(Object.keys(intent).every((key) => ["kind", "names"].includes(key)), "UnknownFormattingIntent");
  check(Object.keys(intent.names).length === FONT_LANGUAGES.length && Object.keys(intent.names).every((key) => FONT_LANGUAGES.includes(key)), "InvalidFontLanguages");
  const fonts = {};
  for (const language of FONT_LANGUAGES) {
    check(Object.hasOwn(intent.names, language), "InvalidFontLanguages");
    const name = intent.names[language];
    characterFontNameArgs(language, name);
    fonts[language] = Object.freeze({ name });
  }
  return Object.freeze({ character: Object.freeze({ fonts: Object.freeze(fonts) }) });
}
function atomicRangeUnavailable(capability, kind, format) {
  if (capability?.schemaVersion !== 1 || capability.atomic !== true || capability.format !== format || capability.coordinateSpace !== "native-source-utf16" || capability.requiresHistoryProtocol !== 2)
    return "AtomicFormattingUnavailable";
  const fields = kind === "alignment" ? ["paragraph.alignment"] : FONT_LANGUAGES.map((language) => `character.fonts.${language}.name`);
  for (const field of fields) {
    if (capability.fields?.[field]?.writable !== true) {
      const reason = capability.fields?.[field]?.writeUnavailableReason;
      return typeof reason === "string" && reason.length > 0 ? reason : "AtomicFormattingFieldUnavailable";
    }
  }
  return null;
}
var ownedSelectors = (selectors) => {
  check(Array.isArray(selectors) && selectors.length > 0, "InvalidFormattingSelectors");
  return Object.freeze(selectors.map((selector) => {
    check(selector?.kind === "original-paragraph" && uint2(selector.section) && uint2(selector.paragraph), "InvalidFormattingSelector");
    const ranges = selector.ranges;
    check(ranges === undefined || Array.isArray(ranges) && ranges.length > 0, "InvalidFormattingRanges");
    return Object.freeze({
      kind: "original-paragraph",
      section: selector.section,
      paragraph: selector.paragraph,
      ...ranges === undefined ? {} : {
        ranges: Object.freeze(ranges.map((range) => {
          check(range && uint2(range.startUnit) && uint2(range.endUnit) && range.startUnit < range.endUnit, "InvalidFormattingRanges");
          return Object.freeze({ startUnit: range.startUnit, endUnit: range.endUnit });
        }))
      }
    });
  }));
};
async function prepareAtomicRangeRequest({
  read,
  selectors,
  intent,
  token,
  revision,
  format,
  current
}) {
  check(current() === true, "StaleFormattingSelection");
  const ownedToken = Object.freeze({
    editorId: token.editorId,
    documentId: token.documentId,
    generation: token.generation,
    operationRevision: token.operationRevision,
    viewRevision: token.viewRevision
  });
  const selected = ownedSelectors(selectors);
  const patch = atomicRangePatch(intent);
  check(current() === true, "StaleFormattingSelection");
  const answer = await read({ kind: "formatting-capabilities" }, ownedToken);
  check(current() === true, "StaleFormattingSelection");
  const cap = answer.formattingCapabilities;
  const why = atomicRangeUnavailable(cap, patch.character ? "font-names" : "alignment", format);
  if (why)
    throw Error(why);
  check(cap.binding && typeof cap.binding.session === "string" && cap.binding.session.length > 0 && uint2(cap.binding.revision) && cap.binding.revision < 4294967295 && cap.binding.revision === revision, "InvalidFormattingBinding");
  const binding = Object.freeze({ session: cap.binding.session, revision: cap.binding.revision });
  for (const key of [
    "requestBytes",
    "replyBytes",
    "targets",
    "ranges",
    "commands",
    "fontNameBytes"
  ])
    check(Number.isSafeInteger(cap.limits?.[key]) && cap.limits[key] > 0, "InvalidFormattingLimits");
  const limits = Object.freeze({ ...cap.limits });
  check(selected.length <= limits.targets, "FormattingTargetLimit");
  check(selected.reduce((n, selector) => n + (selector.ranges?.length ?? 0), 0) <= limits.ranges, "FormattingRangeLimit");
  check(answer.formattingBatchQueryAvailable === true, "AtomicBatchQueryUnavailable");
  const query = { schemaVersion: 1, binding, selectors: selected, fields: [] };
  check(bytes(query) <= limits.requestBytes, "FormattingRequestLimit");
  const commands = selected.length * (patch.character ? FONT_LANGUAGES.length : 1);
  check(commands <= limits.commands, "FormattingCommandLimit");
  if (patch.character)
    for (const font of Object.values(patch.character.fonts))
      check(new TextEncoder().encode(font.name).byteLength <= limits.fontNameBytes, "FormattingFontNameLimit");
  check(current() === true, "StaleFormattingSelection");
  const reply = await read({ kind: "query-formatting", selectors: selected, fields: [] }, ownedToken);
  check(current() === true, "StaleFormattingSelection");
  const value = reply.formatting;
  check(value?.schemaVersion === 1 && value.binding?.session === binding.session && value.binding.revision === binding.revision, "StaleFormattingBinding");
  check(bytes(value) <= limits.replyBytes, "FormattingReplyLimit");
  check(Array.isArray(value.targets) && value.targets.length === selected.length, "InvalidFormattingTargets");
  const targets = [], refs = new Set;
  let targetBytes = bytes({ schemaVersion: 1, binding, targets: [], patch });
  for (let index = 0;index < selected.length; index++) {
    const selector = selected[index], target = value.targets[index];
    check(target && typeof target.ref === "string" && target.ref.length > 0 && !refs.has(target.ref), "InvalidFormattingTarget");
    check(Object.keys(target).every((key) => ["ref", "ranges"].includes(key)), "UnknownFormattingTarget");
    const { ref, ranges } = target;
    check(ranges === undefined || Array.isArray(ranges), "InvalidFormattingRanges");
    const copied = ranges?.map((range) => {
      check(range && Object.keys(range).every((key) => ["startUnit", "endUnit"].includes(key)) && uint2(range.startUnit) && uint2(range.endUnit) && range.startUnit <= range.endUnit, "InvalidFormattingRanges");
      return Object.freeze({ startUnit: range.startUnit, endUnit: range.endUnit });
    });
    if (selector.ranges)
      check(JSON.stringify(copied) === JSON.stringify(selector.ranges), "FormattingRangeMismatch");
    refs.add(ref);
    const owned = Object.freeze({
      ref,
      ...copied === undefined ? {} : { ranges: Object.freeze(copied) }
    });
    targetBytes += bytes(owned) + (index ? 1 : 0);
    check(targetBytes <= limits.requestBytes, "FormattingRequestLimit");
    targets.push(owned);
  }
  const request = Object.freeze({
    schemaVersion: 1,
    binding,
    targets: Object.freeze(targets),
    patch
  });
  check(bytes(request) <= limits.requestBytes, "FormattingRequestLimit");
  check(current() === true, "StaleFormattingSelection");
  const finalAnswer = await read({ kind: "formatting-capabilities" }, ownedToken);
  check(current() === true, "StaleFormattingSelection");
  const finalCap = finalAnswer.formattingCapabilities;
  const finalWhy = atomicRangeUnavailable(finalCap, patch.character ? "font-names" : "alignment", format);
  if (finalWhy)
    throw Error(finalWhy);
  check(finalAnswer.formattingBatchQueryAvailable === true, "AtomicBatchQueryUnavailable");
  check(finalCap.binding?.session === binding.session && finalCap.binding.revision === binding.revision, "StaleFormattingBinding");
  for (const key of [
    "requestBytes",
    "replyBytes",
    "targets",
    "ranges",
    "commands",
    "fontNameBytes"
  ])
    check(Number.isSafeInteger(finalCap.limits?.[key]) && finalCap.limits[key] > 0, "InvalidFormattingLimits");
  check(selected.reduce((n, selector) => n + (selector.ranges?.length ?? 0), 0) <= finalCap.limits.ranges, "FormattingRangeLimit");
  if (patch.character)
    for (const font of Object.values(patch.character.fonts))
      check(new TextEncoder().encode(font.name).byteLength <= finalCap.limits.fontNameBytes, "FormattingFontNameLimit");
  check(bytes(request) <= finalCap.limits.requestBytes && targets.length <= finalCap.limits.targets && commands <= finalCap.limits.commands, "FormattingRequestLimit");
  check(current() === true, "StaleFormattingSelection");
  return request;
}

// web/preview/range-formatting-binding.mjs
var uint3 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var samePoint = (a, b) => a?.section === b?.section && a?.paragraph === b?.paragraph && a?.unit === b?.unit;
var original = (format, row) => format !== "hwp5" || row.currentReference?.kind === "original" && row.currentReference.section === row.section && typeof row.currentReference.id === "string" && row.currentReference.id.length <= 10 && /^(0|[1-9][0-9]*)$/.test(row.currentReference.id) && BigInt(row.currentReference.id) <= 0xffffffffn;
function rowsByPosition(content) {
  if (!Array.isArray(content?.paragraphs))
    return null;
  const map = new Map;
  for (const row of content.paragraphs) {
    if (!row || !uint3(row.section) || !uint3(row.paragraph))
      return null;
    let section = map.get(row.section);
    if (!section)
      map.set(row.section, section = new Map);
    if (section.has(row.paragraph))
      return null;
    section.set(row.paragraph, row);
  }
  return map;
}
function offsets(value) {
  if (value === undefined || value === null)
    return value;
  if (!Array.isArray(value))
    throw Error("InvalidFormattingOffsets");
  let previous;
  return Object.freeze(value.map((row) => {
    if (!row || !uint3(row.at) || !uint3(row.source) || previous && (row.at <= previous.at || row.source <= previous.source))
      throw Error("InvalidFormattingOffsets");
    const copy = Object.freeze({ at: row.at, source: row.source });
    previous = copy;
    return copy;
  }));
}
var sameOffsets = (a, b) => a === b || Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((row, index) => row.at === b[index]?.at && row.source === b[index]?.source);
function captureFormattingRangeBinding(state, selection) {
  const content = state?.content;
  if (state?.status !== "ready" || state.selection != null || !["hwp5", "hwpx"].includes(content?.format) || content.limited === true || !selection?.anchor || !selection?.focus)
    return null;
  const { anchor, focus } = selection;
  if (anchor.createdCell || focus.createdCell || anchor.pageArea !== undefined || focus.pageArea !== undefined)
    return null;
  const display = paragraphSelectionRanges(content.paragraphs, anchor, focus, undefined, {
    sourcePositions: false,
    includeEmpty: true
  });
  const source = paragraphSelectionRanges(content.paragraphs, anchor, focus, undefined, {
    includeEmpty: true
  });
  const indexed = rowsByPosition(content);
  if (!display || !source || !indexed)
    return null;
  const members = [];
  for (let index = 0;index < display.length; index++) {
    const range = display[index], row = indexed.get(range.section)?.get(range.paragraph);
    if (!row || row.createdCell || row.clipped || row.editable !== true || !original(content.format, row))
      return null;
    const owner = paragraphSelectionOwner(row);
    if (typeof owner !== "string" || !owner)
      return null;
    const ref = row.currentReference;
    members.push(Object.freeze({
      section: range.section,
      paragraph: range.paragraph,
      owner,
      text: row.text,
      offsets: offsets(row.sourceOffsets),
      original: content.format === "hwp5" ? Object.freeze({ kind: ref.kind, section: ref.section, id: ref.id }) : undefined,
      display: Object.freeze({ ...range }),
      source: Object.freeze({ ...source[index] })
    }));
  }
  return Object.freeze({
    documentId: state.documentId,
    generation: state.generation,
    format: content.format,
    anchor: Object.freeze({
      section: anchor.section,
      paragraph: anchor.paragraph,
      unit: anchor.unit
    }),
    focus: Object.freeze({ section: focus.section, paragraph: focus.paragraph, unit: focus.unit }),
    members: Object.freeze(members)
  });
}
function formattingRangeBindingMatches(binding, state, selection) {
  if (!binding || !samePoint(binding.anchor, selection?.anchor) || !samePoint(binding.focus, selection?.focus) || state?.documentId !== binding.documentId || state.generation !== binding.generation || state.content?.format !== binding.format)
    return false;
  const current = captureFormattingRangeBinding(state, selection);
  return Boolean(current && current.members.length === binding.members.length && current.members.every((row, index) => {
    const before = binding.members[index];
    return row.section === before.section && row.paragraph === before.paragraph && row.owner === before.owner && row.text === before.text && sameOffsets(row.offsets, before.offsets) && (binding.format !== "hwp5" || row.original.kind === before.original.kind && row.original.section === before.original.section && row.original.id === before.original.id) && row.display.startUnit === before.display.startUnit && row.display.endUnit === before.display.endUnit && row.source.startUnit === before.source.startUnit && row.source.endUnit === before.source.endUnit;
  }));
}
function formattingRangeSelectors(binding, character) {
  if (!binding)
    throw Error("UnsupportedFormattingSelection");
  return Object.freeze(binding.members.flatMap((row) => {
    if (character && row.display.startUnit === row.display.endUnit)
      return [];
    if (character && row.source.endUnit - row.source.startUnit !== row.display.endUnit - row.display.startUnit)
      throw Error("ProtectedAnchorRange");
    return [
      Object.freeze({
        kind: "original-paragraph",
        section: row.section,
        paragraph: row.paragraph,
        ...character ? {
          ranges: Object.freeze([
            Object.freeze({ startUnit: row.source.startUnit, endUnit: row.source.endUnit })
          ])
        } : {}
      })
    ];
  }));
}

// web/preview/history-model-readiness.mjs
function matchHistoryModelSelection(state, revision, selection, paragraph) {
  if (!state || state.status !== "ready" || state.nativeHistoryRevision !== revision || !Number.isInteger(revision) || revision < 0 || revision >= 4294967295 || !selection?.anchor || !selection?.focus || !paragraph || typeof paragraph.text !== "string" || paragraph.clipped || !(paragraph.editable || paragraph.selectable))
    return false;
  const owner = paragraphSelectionOwner(paragraph);
  if (typeof owner !== "string" || !owner)
    return false;
  const { anchor: a, focus: f } = selection, selected = state.selection;
  if (!selected || selected.coordinateSpace !== "display" || !["hwp5", "hwpx"].includes(state.content?.format) || selected.format !== state.content.format || !Array.isArray(state.content.paragraphs) || !state.content.paragraphs.includes(paragraph))
    return false;
  for (const key of ["documentId", "generation", "operationRevision", "viewRevision"])
    if (selected[key] !== state[key])
      return false;
  if (!Number.isSafeInteger(a.section) || a.section < 0 || !Number.isSafeInteger(a.paragraph) || a.paragraph < 0 || a.section !== f.section || a.paragraph !== f.paragraph || a.createdCell || f.createdCell || a.pageArea !== undefined || f.pageArea !== undefined || paragraph.section !== a.section || paragraph.paragraph !== a.paragraph || paragraph.drawingText || paragraph.drawingCaption || !paragraph.tableCell && paragraph.selectionOwner !== `section:${a.section}:body` || selected.owner !== owner || selected.section !== a.section || selected.paragraph !== a.paragraph)
    return false;
  for (const point of [a, f]) {
    if (!Number.isSafeInteger(point.unit) || point.unit < 0 || point.unit > paragraph.text.length)
      return false;
    const u = point.unit, text = paragraph.text;
    if (u > 0 && u < text.length && text.charCodeAt(u - 1) >= 55296 && text.charCodeAt(u - 1) <= 56319 && text.charCodeAt(u) >= 56320 && text.charCodeAt(u) <= 57343)
      return false;
  }
  return selected.startUnit === Math.min(a.unit, f.unit) && selected.endUnit === Math.max(a.unit, f.unit) && selected.affinity === (a.unit > f.unit ? "backward" : "forward");
}
function sameHistoryModelObservation(before, current) {
  if (before === current)
    return Boolean(current);
  if (!before || !current || before.status !== "ready" || current.status !== "ready" || before.content !== current.content || before.capabilities !== current.capabilities || before.historyRecoveryRequired !== current.historyRecoveryRequired || before.savedOperationRevision !== current.savedOperationRevision || !Number.isSafeInteger(before.stateVersion) || !Number.isSafeInteger(current.stateVersion) || current.stateVersion <= before.stateVersion)
    return false;
  return [
    "editorId",
    "documentId",
    "generation",
    "operationRevision",
    "viewRevision",
    "nativeHistoryRevision"
  ].every((key) => before[key] === current[key]);
}

// web/preview/range-formatting-observation.mjs
var merge = (previous, value) => {
  if (previous === null || value === null || value === undefined)
    return null;
  return previous === undefined || previous === value ? value : "mixed";
};
function rangeFormattingObservation(content, ranges) {
  const paragraphs = new Map;
  for (const row of content?.paragraphs ?? []) {
    if (!row)
      continue;
    const { section: sectionKey, paragraph: paragraphKey } = row;
    if (!uint(sectionKey) || !uint(paragraphKey))
      continue;
    let section = paragraphs.get(sectionKey);
    if (!section)
      paragraphs.set(sectionKey, section = new Map);
    if (!section.has(paragraphKey))
      section.set(paragraphKey, row);
  }
  const at = (section, paragraph) => paragraphs.get(section)?.get(paragraph);
  const ids = characterRangeValues(content, ranges, (id) => id, { isBoundary: isUtf16Boundary }, at);
  const resources = Object.fromEntries([
    ["shapes", "characterShapes"],
    ["underlines", "characterUnderlines"],
    ["strikes", "characterStrikes"],
    ["colors", "characterTextColors"],
    ["fonts", "characterFontReferences"],
    ["shades", "characterShades"],
    ["outlines", "characterOutlines"],
    ["effects", "characterEffects"]
  ].map(([key, field]) => [key, observationRows(content?.[field])]));
  const names = new Map;
  let fontsValid = content?.characterFontNameAvailable === true && !content.fontFacesError && !content.characterFontReferencesError && Array.isArray(content.fontFaces) && validFontFaceOrder(content.fontFaces);
  if (fontsValid) {
    try {
      for (const face of content.fontFaces) {
        if (face.name !== null) {
          if (typeof face.name !== "string")
            throw Error("InvalidFontName");
          if (face.name.length)
            characterFontNameArgs(face.language, face.name);
        }
        names.set(face.language + ":" + face.id, face.name);
      }
    } catch {
      fontsValid = false;
    }
  }
  const refs = resources.fonts;
  if (!refs || [...refs.values()].some((row) => !Array.isArray(row.fontIds) || row.fontIds.length !== FONT_LANGUAGES.length || !row.fontIds.every(uint)))
    fontsValid = false;
  const colorsValid = content?.characterTextColorAvailable === true && resources.colors && [...resources.colors.values()].every((row) => row.color === null || uint(row.color) && row.color <= 16777215);
  const values = {};
  const effects = {};
  const fontValues = {};
  const fontBindings = Object.fromEntries(FONT_LANGUAGES.map((language) => [language, Boolean(ids && fontsValid)]));
  const selectedFontIds = Object.fromEntries(FONT_LANGUAGES.map((language) => [language, new Set]));
  let colorBindingValid = Boolean(ids && colorsValid);
  for (const id of ids ? new Set(ids) : []) {
    const shape = resources.shapes?.get(id);
    const underline = resources.underlines?.get(id);
    const strike = resources.strikes?.get(id);
    for (const property of ["bold", "italic", "underline", "strike"]) {
      const available = property === "underline" ? content.characterUnderlineAvailable : property === "strike" ? content.characterStrikeAvailable : content.characterPropertiesAvailable;
      const value = available === true ? characterPropertyResourceValue(property, shape, underline, strike) : null;
      values[property] = merge(values[property], typeof value === "boolean" ? value : null);
    }
    const height = shape?.height;
    values.size = merge(values.size, content.characterPropertiesAvailable === true && isSourceCharacterSize(height) ? height : null);
    const color = colorsValid ? resources.colors.get(id) : null;
    colorBindingValid &&= Boolean(color);
    values.textColor = merge(values.textColor, color && color.color !== null ? "#" + color.color.toString(16).padStart(6, "0") : null);
    values.shade = merge(values.shade, characterShadeResourceValue(resources.shades?.get(id)));
    values.outline = merge(values.outline, characterOutlineResourceKind(resources.outlines?.get(id)));
    for (const effect of CHARACTER_EFFECTS)
      effects[effect] = merge(effects[effect], characterEffectResourceValue(resources.effects?.get(id), effect));
    for (let index = 0;index < FONT_LANGUAGES.length; index++) {
      const language = FONT_LANGUAGES[index];
      const fontId = fontsValid ? refs.get(id)?.fontIds[index] : undefined;
      const key = language + ":" + fontId;
      if (!uint(fontId) || !names.has(key)) {
        fontBindings[language] = false;
        continue;
      }
      selectedFontIds[language].add(fontId);
      const value = names.get(key);
      const previous = fontValues[language];
      if (previous === undefined)
        fontValues[language] = { kind: "single", name: value };
      else if (previous.kind === "single" && previous.name !== value)
        fontValues[language] = { kind: "mixed" };
    }
  }
  const orderedFontIds = Object.fromEntries(FONT_LANGUAGES.map((language) => [language, []]));
  if (fontsValid) {
    for (const face of content.fontFaces)
      if (selectedFontIds[face.language].has(face.id))
        orderedFontIds[face.language].push(face.id);
  }
  let align;
  for (const range of ranges ?? []) {
    const row = at(range.section, range.paragraph);
    align = merge(align, paragraphAlignmentKey(row?.paragraphShape?.alignment));
  }
  return Object.freeze({
    ...Object.fromEntries(["size", "bold", "italic", "underline", "strike", "textColor", "shade", "outline"].map((key) => [key, values[key] ?? null])),
    effects: Object.freeze(Object.fromEntries(CHARACTER_EFFECTS.map((effect) => [effect, effects[effect] ?? null]))),
    fontNames: Object.freeze(Object.fromEntries(FONT_LANGUAGES.map((language) => [
      language,
      Object.freeze(fontBindings[language] ? fontValues[language] : { kind: "unknown" })
    ]))),
    fontIds: Object.freeze(Object.fromEntries(FONT_LANGUAGES.map((language) => [
      language,
      fontBindings[language] ? Object.freeze(orderedFontIds[language]) : null
    ]))),
    align: align ?? null,
    colorBindingValid,
    fontBindings: Object.freeze(fontBindings)
  });
}

// packages/vanilla/src/surface.ts
import {
  readGeometryProjection,
  readNativeGeometryEvidence
} from "@ohah/hwpjs/_internal/native-geometry";

// web/preview/caret-formatting-intent.mjs
function ownCaretTypingIntent(input) {
  const data = (value, allowed) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return null;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const result = Object.create(null);
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key !== "string" || !allowed.includes(key) || !Object.hasOwn(descriptors[key], "value"))
        return null;
      result[key] = descriptors[key].value;
    }
    return result;
  };
  try {
    const value = data(input, ["kind", "properties", "language", "name"]);
    if (!value)
      return null;
    if (value.kind === "character-properties") {
      if (Reflect.ownKeys(value).some((key) => !["kind", "properties"].includes(key)))
        return null;
      const properties = data(value.properties, ["size", "bold", "italic"]);
      if (!properties)
        return null;
      characterPropertyArgs(properties);
      return Object.freeze({ kind: value.kind, properties: Object.freeze(properties) });
    }
    if (value.kind === "font-name") {
      if (Reflect.ownKeys(value).some((key) => !["kind", "language", "name"].includes(key)))
        return null;
      characterFontNameArgs(value.language, value.name);
      return Object.freeze({ kind: value.kind, language: value.language, name: value.name });
    }
  } catch {
    return null;
  }
  return null;
}

// web/preview/canvas-pointer-coordinates.mjs
function canvasDocumentPoint(event, bounds, scrollTop, scale = 1, scrollLeft = 0) {
  if (!Number.isFinite(scale) || scale <= 0)
    return { x: NaN, y: NaN };
  return {
    x: (event.clientX - bounds.left + scrollLeft) / scale,
    y: (event.clientY - bounds.top + scrollTop) / scale
  };
}
function canvasDocumentBounds(bounds, scale = 1) {
  if (!Number.isFinite(scale) || scale <= 0 || ![bounds.x, bounds.y, bounds.height].every(Number.isFinite) || bounds.height < 0)
    return null;
  const result = { x: bounds.x * scale, y: bounds.y * scale, height: bounds.height * scale };
  return Object.values(result).every(Number.isFinite) ? result : null;
}
function canvasCaretScrollLeft(x, scrollLeft, width) {
  if (![x, scrollLeft, width].every(Number.isFinite) || scrollLeft < 0 || width <= 0)
    return null;
  if (x < scrollLeft)
    return Math.max(0, x);
  if (x + 2 > scrollLeft + width)
    return Math.max(0, x + 2 - width);
  return scrollLeft;
}

// web/preview/structure-error-message.mjs
function structureErrorMessage(operation, code) {
  const explanations = {
    UnsupportedColumnBoundaryEdit: "이 단 설정 경계의 문단 구조 편집은 아직 지원하지 않습니다.",
    CrossParagraphOwner: "서로 다른 본문·셀·개체 소유권을 넘는 문단 구조 편집은 지원하지 않습니다.",
    InvalidParagraphAdjacency: "원본 구조에서 연속하지 않는 문단은 병합할 수 없습니다."
  };
  return `문단 ${operation} 실패: ${code}${Object.hasOwn(explanations, code) ? ` · ${explanations[code]}` : ""}`;
}

// web/preview/text-navigation.mjs
function adjacentParagraphBoundary(layout, focus, key) {
  if (!focus || !["ArrowLeft", "ArrowRight"].includes(key))
    return null;
  const paragraph = focus.paragraph + (key === "ArrowLeft" ? -1 : 1);
  if (!Number.isSafeInteger(paragraph) || paragraph < 0)
    return null;
  const rows = layout.rows.filter((row) => row.section === focus.section && row.paragraph === paragraph && selectableText(row) && (!focus.pageArea || row.pageArea === focus.pageArea && row.pageOrdinal === focus.pageOrdinal));
  if (!rows.length)
    return null;
  const row = key === "ArrowLeft" ? rows.at(-1) : rows[0];
  return {
    ...focus,
    paragraph,
    unit: key === "ArrowLeft" ? row.endUnit : row.startUnit,
    affinity: key === "ArrowLeft" ? "backward" : "forward"
  };
}
function navigateText(layout, text, anchor, focus, key, {
  extend = false,
  paragraphEdge = false,
  crossParagraph = false,
  preferredX = null,
  word = false,
  acceptRow = null
} = {}) {
  if (!focus || !anchor || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(key))
    return null;
  let unit = focus.unit, affinity = "forward", nextX = null;
  if (key === "ArrowLeft" || key === "ArrowRight") {
    if (!extend && anchor.unit !== focus.unit)
      unit = key === "ArrowLeft" ? Math.min(anchor.unit, focus.unit) : Math.max(anchor.unit, focus.unit);
    else if (word)
      unit = wordBoundary(text, unit, key === "ArrowRight");
    else {
      const bounds = graphemeUnits(text);
      unit = key === "ArrowLeft" ? bounds.filter((b) => b < unit).at(-1) ?? 0 : bounds.find((b) => b > unit) ?? text.length;
    }
  } else {
    const caret = caretGeometry(layout, focus), row = caret && layout.rows[caret.row];
    if (!row)
      return null;
    if (key === "Home" || key === "End") {
      unit = paragraphEdge ? key === "Home" ? 0 : text.length : key === "Home" ? row.startUnit : row.endUnit;
      affinity = key === "End" ? "backward" : "forward";
    } else {
      const direction = key === "ArrowUp" ? -1 : 1;
      nextX = Number.isFinite(preferredX) ? preferredX : (caret.paintGeometry ?? caret).x;
      const currentY = rowTop(row, caret.row);
      const candidates = layout.rows.flatMap((candidate, index) => {
        const delta = (rowTop(candidate, index) - currentY) * direction;
        const allowed = crossParagraph && extend ? candidate.section === focus.section : sameParagraph(candidate, focus);
        const instance = !focus.pageArea || candidate.pageArea === focus.pageArea && candidate.pageOrdinal === focus.pageOrdinal;
        const sameFrame = row.transform === undefined && candidate.transform === undefined || Array.isArray(row.transform) && Array.isArray(candidate.transform) && row.transform.length === 6 && candidate.transform.length === 6 && row.transform.every((value, i) => value === candidate.transform[i]);
        return selectableText(candidate) && allowed && instance && sameFrame && delta > 0 ? [{ index, delta }] : [];
      });
      const adjacent = candidates.reduce((best, candidate) => (!best || candidate.delta < best.delta) && (acceptRow === null || acceptRow(layout.rows[candidate.index])) ? candidate : best, null);
      const destination = adjacent && layout.rows[adjacent.index];
      const local = adjacent && [nextX, rowTop(destination, adjacent.index) + TEXT_TOP];
      const screen = local && (destination.transform === undefined ? local : affinePoint(destination.transform, local));
      const next = screen && hitText(layout, screen[0], screen[1], destination);
      if (next && !sameParagraph(next, focus))
        return { anchor, focus: next, preferredX: nextX };
      if (next) {
        unit = next.unit;
        affinity = next.affinity;
      }
    }
  }
  const next = { ...focus, unit, affinity };
  return { anchor: extend ? anchor : next, focus: next, preferredX: nextX };
}

// web/preview/paragraph-composition.mjs
function paragraphCompositionProjection(paragraph, start, text) {
  if (!paragraph || !start || paragraph.section !== start.section || paragraph.paragraph !== start.paragraph || typeof paragraph.text !== "string" || typeof text !== "string" || !text.isWellFormed() || text.length > 4194304 || !Number.isSafeInteger(start.unit) || start.unit < 0 || start.unit > paragraph.text.length)
    return null;
  const prefix = paragraph.text.slice(0, start.unit);
  if (!prefix.isWellFormed())
    return null;
  const anchor = {
    section: start.section,
    paragraph: start.paragraph,
    unit: start.unit,
    affinity: "forward"
  };
  return {
    draft: { section: start.section, paragraph: start.paragraph, text: prefix + text },
    composition: { anchor, focus: { ...anchor, unit: start.unit + text.length } }
  };
}

// web/preview/navigation-intent.mjs
function navigationIntent(event, platform = "") {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key))
    return null;
  if (event.getModifierState?.("AltGraph") || event.altKey && event.ctrlKey)
    return null;
  const mac = /mac/i.test(platform), horizontal = ["ArrowLeft", "ArrowRight"].includes(event.key);
  if (mac && event.ctrlKey)
    return null;
  if (event.altKey && !(mac && horizontal && !event.metaKey))
    return null;
  if (mac && event.metaKey && horizontal)
    return { key: event.key === "ArrowLeft" ? "Home" : "End", paragraphEdge: false, word: false };
  if (mac && event.metaKey && ["ArrowUp", "ArrowDown"].includes(event.key))
    return { key: event.key === "ArrowUp" ? "Home" : "End", paragraphEdge: true, word: false };
  return {
    key: event.key,
    paragraphEdge: Boolean(event.ctrlKey || event.metaKey),
    word: horizontal && Boolean(event.ctrlKey || mac && event.altKey)
  };
}

// web/preview/typing-format-draft.mjs
var uint4 = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
var splitsScalar = (text, unit) => unit > 0 && unit < text.length && /[\uD800-\uDBFF]/u.test(text[unit - 1]) && /[\uDC00-\uDFFF]/u.test(text[unit]);
function projectTypingDraftRanges(paragraph, text, selection = null) {
  const before = paragraph?.text, ranges = paragraph?.characterRanges;
  if (typeof before !== "string" || typeof text !== "string" || !before.isWellFormed() || !text.isWellFormed() || !Array.isArray(ranges) || paragraph.clipped)
    return null;
  let cursor = 0;
  for (const range of ranges) {
    if (!uint4(range?.start) || !uint4(range.end) || !uint4(range.charShapeId) || range.start !== cursor || range.end < range.start || range.end > before.length || splitsScalar(before, range.start) || splitsScalar(before, range.end))
      return null;
    cursor = range.end;
  }
  if (cursor !== before.length || !ranges.length)
    return null;
  if (before === text)
    return ranges.map((range) => ({ ...range }));
  const change = textChange(before, text, selection);
  if (!change)
    return null;
  const { startUnit: start, endUnit: end } = change;
  const site = ranges.find((range) => range.start <= start && start <= range.end);
  if (!site)
    return null;
  const delta = change.text.length - (end - start), output = [];
  const append = (low, high, id) => {
    const previous = output.at(-1);
    if (high > low && previous?.end === low && previous.start < previous.end && previous.charShapeId === id)
      previous.end = high;
    else
      output.push({ start: low, end: high, charShapeId: id });
  };
  for (const range of ranges) {
    if (range.start < start)
      append(range.start, Math.min(range.end, start), range.charShapeId);
  }
  if (change.text.length)
    append(start, start + change.text.length, site.charShapeId);
  for (const range of ranges) {
    if (range.end > end)
      append(Math.max(range.start, end) + delta, range.end + delta, range.charShapeId);
    else if (range.start === range.end && range.start >= end)
      append(range.start + delta, range.end + delta, range.charShapeId);
  }
  if (!output.length && !text.length)
    append(0, 0, site.charShapeId);
  return output;
}

// web/preview/history-selection.mjs
var MAX_NATIVE_REACHABLE_REVISIONS = 65536;
function createHistorySelectionStore(limit = 100) {
  if (!Number.isSafeInteger(limit) || limit < 1)
    throw new RangeError("InvalidHistorySelectionLimit");
  const selections = new Map;
  let reachable;
  const copy = (selection) => selection ? structuredClone(selection) : null;
  const validRevision = (revision) => Number.isInteger(revision) && revision >= 0 && revision < 4294967295;
  const trimFallback = () => {
    while (selections.size > limit)
      selections.delete(selections.keys().next().value);
  };
  return {
    remember(revision, selection) {
      if (!validRevision(revision))
        throw new RangeError("InvalidHistoryRevision");
      if (reachable && !reachable.has(revision))
        return;
      const value = copy(selection);
      selections.delete(revision);
      selections.set(revision, value);
      if (!reachable)
        trimFallback();
    },
    selection(revision) {
      return copy(selections.get(revision));
    },
    retain(revisions, currentRevision) {
      if (currentRevision !== undefined && !validRevision(currentRevision))
        throw new RangeError("InvalidHistoryRevisions");
      if (revisions === undefined) {
        reachable = undefined;
        trimFallback();
        return;
      }
      if (!Array.isArray(revisions) || revisions.length > MAX_NATIVE_REACHABLE_REVISIONS)
        throw new RangeError("InvalidHistoryRevisions");
      const next = new Set;
      for (const revision of revisions) {
        if (!validRevision(revision) || next.has(revision))
          throw new RangeError("InvalidHistoryRevisions");
        next.add(revision);
      }
      if (currentRevision !== undefined && !next.has(currentRevision))
        throw new RangeError("InvalidHistoryRevisions");
      reachable = next;
      for (const revision of selections.keys())
        if (!reachable.has(revision))
          selections.delete(revision);
    },
    reset() {
      selections.clear();
      reachable = undefined;
    }
  };
}

// web/preview/drawing-boundary-hit.mjs
function hitDrawingBoundary(layout, x, y, target = null) {
  if (![x, y].every(Number.isFinite))
    return null;
  for (const drawing of (layout.placedDrawings ?? []).toReversed()) {
    if (target && (drawing.section !== target.section || drawing.hostParagraph !== target.paragraph))
      continue;
    const box = drawing.rectangle;
    if (!box || ![box.x, box.y, box.width, box.height].every(Number.isFinite) || box.width <= 0 || box.height <= 0 || !Number.isInteger(drawing.anchorUnit) || drawing.anchorUnit < 0)
      continue;
    if (!layout.rows.some((row) => row.kind === "text" && row.section === drawing.section && row.paragraph === drawing.hostParagraph && row.editable === true))
      continue;
    const right = box.x + box.width, bottom = box.y + box.height;
    if (x < box.x - 4 || x > right + 4 || y < box.y - 4 || y > bottom + 4)
      continue;
    if (Math.min(Math.abs(x - box.x), Math.abs(x - right), Math.abs(y - box.y), Math.abs(y - bottom)) > 4)
      continue;
    const after = x >= box.x + box.width / 2;
    return {
      section: drawing.section,
      paragraph: drawing.hostParagraph,
      unit: drawing.anchorUnit + Number(after),
      affinity: after ? "backward" : "forward",
      drawingNode: drawing.drawingNode
    };
  }
  return null;
}

// web/preview/queued-input.mjs
function appendQueuedText(queued, text, limit = 1024 * 1024) {
  if (!Number.isSafeInteger(limit) || limit < 0)
    throw new RangeError("InvalidQueuedInputLimit");
  if (typeof queued !== "string" || typeof text !== "string" || !queued.isWellFormed() || !text.isWellFormed() || /[\r\n]/.test(text))
    return { accepted: false };
  if (queued.length > limit || text.length > limit - queued.length)
    return { accepted: true, overflow: true, text: queued };
  return { accepted: true, text: queued + text };
}

// web/preview/transient-intent-deque.mjs
function createTransientIntentDeque() {
  let slots = [], head = 0;
  return {
    get length() {
      return slots.length - head;
    },
    front() {
      return slots[head];
    },
    push(value) {
      slots.push(value);
    },
    shift() {
      if (head === slots.length)
        return;
      const value = slots[head];
      slots[head++] = undefined;
      if (head === slots.length) {
        slots = [];
        head = 0;
      } else if (head >= slots.length - head) {
        slots = slots.slice(head);
        head = 0;
      }
      return value;
    },
    clear() {
      slots = [];
      head = 0;
    }
  };
}

// web/preview/input-intent-queue.mjs
function createInputIntentQueue({ maxOperations = 1024, maxUnits = 16 * 1024 * 1024 } = {}) {
  if (!Number.isSafeInteger(maxOperations) || maxOperations < 1 || !Number.isSafeInteger(maxUnits) || maxUnits < 0)
    throw new RangeError("InvalidInputIntentLimit");
  let base = null, projected = null, units = 0;
  const entries = createTransientIntentDeque();
  const clear = () => {
    entries.clear();
    base = projected = null;
    units = 0;
  };
  const peek = (committed) => {
    if (!entries.length)
      return null;
    if (committed !== base)
      throw new Error("InputIntentBaseMismatch");
    const entry = entries.front();
    return {
      ...entry,
      beforeSelection: structuredClone(entry.beforeSelection),
      afterText: base.slice(0, entry.startUnit) + entry.text + base.slice(entry.endUnit)
    };
  };
  return {
    get size() {
      return entries.length;
    },
    get projected() {
      return projected;
    },
    get hasCapacity() {
      return entries.length < maxOperations && units < maxUnits;
    },
    append(before, after, selection, beforeSelection) {
      if (typeof before !== "string" || typeof after !== "string" || !before.isWellFormed() || !after.isWellFormed())
        throw new Error("InvalidInputIntentText");
      if (entries.length && projected !== before)
        throw new Error("InputIntentChainMismatch");
      const change = textChange(before, after, selection);
      if (!change)
        return false;
      if (entries.length >= maxOperations || change.text.length > maxUnits - units)
        throw new RangeError("InputIntentLimit");
      const savedSelection = structuredClone(beforeSelection);
      entries.push({ ...change, beforeSelection: savedSelection });
      if (base === null)
        base = before;
      projected = after;
      units += change.text.length;
      return true;
    },
    peek,
    consume(committed) {
      const next = peek(committed);
      if (!next)
        return null;
      entries.shift();
      units -= next.text.length;
      base = next.afterText;
      if (!entries.length)
        clear();
      return next;
    },
    clear
  };
}

// web/preview/paragraph-break-shortcut.mjs
function paragraphBreakShortcut(event) {
  if (event.key !== "Enter" || event.altKey || Boolean(event.ctrlKey) === Boolean(event.metaKey))
    return null;
  return event.shiftKey ? "column" : "page";
}

// web/preview/selection-edit-permission.mjs
function same(a, b) {
  return Boolean(a && b && ["section", "paragraph", "startUnit", "endUnit"].every((key) => a[key] === b[key]));
}
function validate(range) {
  if (!range || !["section", "paragraph", "startUnit", "endUnit"].every((key) => Number.isInteger(range[key]) && range[key] >= 0 && range[key] <= 4294967295) || range.endUnit < range.startUnit)
    throw new TypeError("InvalidEditPermissionRange");
}
function createSelectionEditPermission({ kind = "query-edit-range" } = {}) {
  if (!["query-edit-range", "query-split-range"].includes(kind))
    throw new TypeError("InvalidEditPermissionKind");
  let sequence = 0, current = null;
  return {
    request(range) {
      validate(range);
      if (same(current, range))
        return null;
      if (sequence === Number.MAX_SAFE_INTEGER)
        throw new Error("EditPermissionSequenceExhausted");
      current = { ...range, requestId: ++sequence, allowed: null };
      return {
        kind,
        section: range.section,
        paragraph: range.paragraph,
        startUnit: range.startUnit,
        endUnit: range.endUnit,
        requestId: current.requestId
      };
    },
    accept(message) {
      if (!current || current.allowed !== null || message?.kind !== kind || message.requestId !== current.requestId || !same(message, current) || typeof message.allowed !== "boolean" || message.error)
        return false;
      current.allowed = message.allowed;
      return true;
    },
    allowed(range) {
      return same(current, range) && current.allowed === true;
    },
    pending(range) {
      return same(current, range) && current.allowed === null;
    },
    reject(message) {
      if (!current || current.allowed !== null || message?.kind !== kind || message.requestId !== current.requestId || !same(message, current) || typeof message.error !== "string" || !message.error)
        return false;
      current.allowed = false;
      return true;
    },
    invalidate() {
      current = null;
    }
  };
}

// web/preview/picture-resize-target.mjs
function pictureResizeTarget(picture) {
  const geometry = picture?.geometry ?? (picture?.resizeRecordNode !== undefined ? picture.resizeGeometry : null);
  if (!geometry || picture.geometryError != null || picture.sizeProtectionError != null || picture.sizeProtected === true || picture.transformError != null || picture.renderingCornersError != null)
    return null;
  if (!Number.isInteger(picture.section) || !Number.isInteger(picture.pictureNode))
    return null;
  if (picture.resizeRecordNode !== undefined && (!Number.isInteger(picture.resizeRecordNode) || picture.resizeRecordNode < 0 || picture.resizeRecordNode > 4294967295))
    return null;
  const editIdentity = picture.resizeRecordNode === undefined ? {} : { resizeRecordNode: picture.resizeRecordNode };
  if (picture.groupResizeAvailable === true && picture.groupResizeError == null && Number.isInteger(picture.owner?.anchorNode) && picture.owner.anchorNode !== picture.pictureNode && geometry.width === null && geometry.height === null) {
    const points = picture.renderingCorners;
    if (!Array.isArray(points) || points.length !== 4 || points.some((point) => !Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)))
      return null;
    const [width, height] = [1, 3].map((end) => Math.round(Math.hypot(points[end][0] - points[0][0], points[end][1] - points[0][1])));
    if (![width, height].every((value) => Number.isInteger(value) && value > 0 && value <= 4294967295))
      return null;
    return { section: picture.section, pictureNode: picture.pictureNode, width, height };
  }
  if (geometry.widthRelative !== 4 || geometry.heightRelative !== 2 || ![geometry.width, geometry.height].every((value) => Number.isInteger(value) && value > 0 && value <= 4294967295))
    return null;
  if (Number.isInteger(picture.transform?.angle) && picture.transform.angle !== 0) {
    const points = picture.renderingCorners;
    if (!Array.isArray(points) || points.length !== 4 || !Array.from(points).every((p) => Array.isArray(p) && p.length === 2 && Array.from(p).every(Number.isFinite)))
      return null;
    const [width, height] = [1, 3].map((end) => Math.round(Math.hypot(points[end][0] - points[0][0], points[end][1] - points[0][1])));
    if (![width, height].every((v) => Number.isInteger(v) && v > 0 && v <= 4294967295))
      return null;
    return {
      section: picture.section,
      pictureNode: picture.pictureNode,
      ...editIdentity,
      width,
      height
    };
  }
  return {
    section: picture.section,
    pictureNode: picture.pictureNode,
    ...editIdentity,
    width: geometry.width,
    height: geometry.height
  };
}

// web/preview/clipboard-transfer.mjs
async function transferSelectedText({ clipboard, text, isCurrent, cut, remove, report }) {
  if (typeof text !== "string" || !text || !isCurrent())
    return false;
  if (typeof clipboard?.writeText !== "function") {
    report("이 환경에서는 시스템 클립보드를 사용할 수 없습니다.");
    return false;
  }
  try {
    await clipboard.writeText(text);
  } catch {
    if (isCurrent())
      report("클립보드 쓰기가 거부되었습니다.");
    return false;
  }
  if (!isCurrent())
    return false;
  if (cut)
    return remove() === true;
  report("선택 텍스트 복사 완료");
  return true;
}
async function pasteClipboardText({
  clipboard,
  isCurrent,
  replace,
  report,
  onDenied = null
}) {
  if (!isCurrent())
    return false;
  if (typeof clipboard?.readText !== "function") {
    report("이 환경에서는 시스템 클립보드를 읽을 수 없습니다.");
    return false;
  }
  let text;
  try {
    text = await clipboard.readText();
  } catch {
    if (isCurrent()) {
      report("클립보드 읽기가 거부되었습니다. Ctrl/Cmd+V를 사용하세요.");
      if (isCurrent())
        onDenied?.();
    }
    return false;
  }
  if (!isCurrent() || typeof text !== "string" || !text || !text.isWellFormed())
    return false;
  return replace(text) === true;
}

// web/preview/canvas-pointer-frame-gate.mjs
function installCanvasPointerFrameGate({
  canvas,
  renderer,
  signal,
  cancelDrag = () => {},
  onBlocked = () => {}
}) {
  const blockedPointers = new Set;
  let suppressClick = false;
  let cancelling = false;
  const current = () => typeof renderer.isPaintedFrameCurrent === "function" ? renderer.isPaintedFrameCurrent() === true : typeof renderer.paintedFrame !== "function";
  const guard = (event) => {
    const pointer = Number.isInteger(event.pointerId), id = event.pointerId;
    const click = ["click", "dblclick", "contextmenu"].includes(event.type);
    const fresh = current();
    if (event.type === "pointerdown" && fresh) {
      blockedPointers.delete(id);
      suppressClick = false;
    }
    if (fresh && !(pointer && blockedPointers.has(id)) && !(click && suppressClick))
      return;
    event.preventDefault();
    event.stopImmediatePropagation();
    canvas.style.cursor = "default";
    const captured = pointer && canvas.hasPointerCapture?.(id);
    if (event.type === "pointerdown" || event.type === "pointerup" || captured || event.buttons) {
      if (pointer)
        blockedPointers.add(id);
      suppressClick = true;
    }
    cancelDrag(id);
    if (captured) {
      const realm = canvas.ownerDocument?.defaultView ?? globalThis;
      const cancel = realm.PointerEvent ? new realm.PointerEvent("pointercancel", { pointerId: id }) : new (realm.Event ?? Event)("pointercancel");
      if (!realm.PointerEvent)
        Object.defineProperty(cancel, "pointerId", { value: id });
      cancelling = true;
      try {
        canvas.dispatchEvent(cancel);
      } finally {
        cancelling = false;
      }
      if (canvas.hasPointerCapture?.(id))
        canvas.releasePointerCapture(id);
    }
    if (event.type === "pointerup")
      blockedPointers.delete(id);
    onBlocked(event);
  };
  for (const type of [
    "pointerdown",
    "pointermove",
    "pointerup",
    "click",
    "dblclick",
    "contextmenu"
  ]) {
    canvas.addEventListener(type, guard, { capture: true, signal });
  }
  canvas.addEventListener("pointercancel", (event) => {
    if (!cancelling)
      blockedPointers.delete(event.pointerId);
  }, { capture: true, signal });
}

// web/preview/history-input-intent-queue.mjs
function createHistoryInputIntentQueue({
  ready,
  nativeReady,
  readyForKind,
  history,
  input,
  error,
  maxOperations = 1024,
  maxUnits = 16 * 1024 * 1024,
  maxOperationsPerYield = nativeReady === undefined && readyForKind === undefined ? Number.MAX_SAFE_INTEGER : 16,
  yieldTask = (resume) => setTimeout(resume, 0)
}) {
  if (!Number.isSafeInteger(maxOperations) || maxOperations < 1 || !Number.isSafeInteger(maxUnits) || maxUnits < 0 || !Number.isSafeInteger(maxOperationsPerYield) || maxOperationsPerYield < 1)
    throw new RangeError("InvalidOrderedInputLimit");
  if (nativeReady !== undefined && typeof nativeReady !== "function" || readyForKind !== undefined && typeof readyForKind !== "function")
    throw new TypeError("InvalidOrderedInputReadiness");
  if (typeof yieldTask !== "function")
    throw new TypeError("InvalidOrderedInputYield");
  let generation = 0, sequence = 0, scheduled = false, active = false, processing = false, units = 0, operations = 0, yieldTicket = null;
  const entries = createTransientIntentDeque();
  const compositions = new Map;
  const nativeSettled = () => nativeReady ? nativeReady() === true : Boolean(ready());
  const canRun = (entry) => {
    if (!entry || entry.compositionPending)
      return false;
    const strict = Boolean(ready());
    if (nativeReady && nativeReady() !== true)
      return false;
    const decision = readyForKind?.(entry.kind);
    if (decision === undefined)
      return strict;
    if (decision !== true)
      return false;
    return entry.kind === "history" ? strict || nativeReady !== undefined : strict;
  };
  const clear = () => {
    generation++;
    entries.clear();
    compositions.clear();
    active = false;
    units = 0;
    scheduled = false;
    operations = 0;
    yieldTicket = null;
  };
  const requestYield = () => {
    if (yieldTicket)
      return;
    const ticket = { generation };
    yieldTicket = ticket;
    let installing = true, calledInline = false;
    try {
      yieldTask(() => {
        if (installing) {
          calledInline = true;
          return;
        }
        if (yieldTicket !== ticket || ticket.generation !== generation)
          return;
        yieldTicket = null;
        operations = 0;
        drain();
      });
      installing = false;
      if (calledInline)
        throw Error("InvalidOrderedInputYield");
    } catch (cause) {
      installing = false;
      if (yieldTicket === ticket) {
        clear();
        error(cause);
      }
    }
  };
  const drain = () => {
    if (processing || yieldTicket)
      return;
    if (active && nativeSettled())
      active = false;
    const entry = entries.front();
    if (!entry || entry.compositionPending)
      return;
    if (operations >= maxOperationsPerYield) {
      requestYield();
      return;
    }
    const epoch = generation;
    if (!canRun(entry) || epoch !== generation || entries.front() !== entry)
      return;
    entries.shift();
    active = false;
    if (entry.token)
      compositions.delete(entry.token);
    units -= entry.data?.length ?? 0;
    processing = true;
    try {
      const accepted = entry.kind === "history" ? history(entry.operation) : input(entry);
      if (epoch !== generation)
        return;
      if (!accepted)
        throw Error("OrderedInputRejected");
      operations++;
      active = !nativeSettled();
      if (canRun(entries.front()))
        wake();
    } catch (cause) {
      clear();
      error(cause);
    } finally {
      processing = false;
    }
  };
  const wake = () => {
    if (scheduled || yieldTicket)
      return;
    scheduled = true;
    const epoch = generation;
    queueMicrotask(() => {
      if (epoch !== generation)
        return;
      scheduled = false;
      drain();
    });
  };
  const append = (entry) => {
    const size = entry.data?.length ?? 0;
    if (entries.length >= maxOperations || size > maxUnits - units)
      return false;
    entries.push(entry);
    if (entry.token)
      compositions.set(entry.token, entry);
    units += size;
    drain();
    return true;
  };
  return {
    get nextKind() {
      return entries.front()?.kind ?? null;
    },
    get size() {
      return entries.length + Number(active);
    },
    get hasCapacity() {
      return entries.length < maxOperations;
    },
    history(operation) {
      return ["undo", "redo"].includes(operation) && append({ kind: "history", operation });
    },
    input(inputType, data = "") {
      return typeof data === "string" && data.isWellFormed() && append({ kind: "input", inputType, data });
    },
    composition() {
      const token = { generation, id: ++sequence };
      return append({
        kind: "input",
        inputType: "insertText",
        data: "",
        compositionPending: true,
        token
      }) ? token : null;
    },
    completeComposition(token, data) {
      const entry = compositions.get(token);
      if (!entry || token.generation !== generation || typeof data !== "string" || !data.isWellFormed() || data.length > maxUnits - units)
        return false;
      entry.data = data;
      entry.compositionPending = false;
      units += data.length;
      wake();
      return true;
    },
    wake,
    clear
  };
}

// web/preview/canvas-editor.mjs
var RANGE_FORMATTING_KINDS = Object.freeze([
  "formatting-patch",
  "character-properties-ranges",
  "character-outline-ranges",
  "character-effect-ranges",
  "character-strike-ranges",
  "character-underline-ranges",
  "character-text-color-ranges",
  "character-shade-ranges",
  "character-font-ranges",
  "character-font-name-ranges"
]);
function createCanvasEditor({
  canvas,
  viewport,
  input,
  renderer,
  controls,
  note,
  queryEditRange = null,
  querySplitRange = null,
  platform = null,
  environment = {},
  historyAvailability = null,
  transferMultiParagraphSelection = null,
  requestStableNonTextHistory = null,
  historyModelState = null,
  prepareHistoryModelSelection = null,
  deferQueuedTypingProjection = null,
  onCommittedSelection = () => {},
  onComposition = () => {}
}) {
  const ownerDocument = environment.ownerDocument ?? input.ownerDocument ?? globalThis.document;
  const realm = ownerDocument?.defaultView ?? globalThis;
  const AbortController = environment.AbortController ?? realm.AbortController;
  platform ??= realm.navigator?.userAgentData?.platform ?? realm.navigator?.platform ?? "";
  const clipboard = environment.clipboard ?? realm.navigator?.clipboard;
  const activeElement = environment.activeElement ?? (() => input.getRootNode?.().activeElement ?? ownerDocument?.activeElement);
  const events = new AbortController, listen = (node, type, fn) => node.addEventListener(type, fn, { signal: events.signal });
  let historyPaintBarrier;
  const hostControls = controls;
  controls = {
    ready: () => !events.signal.aborted && hostControls.ready(),
    busy: () => events.signal.aborted || hostControls.busy() || historyPaintBarrier?.pending === true,
    request: (message) => !events.signal.aborted && hostControls.request(message)
  };
  let target = null, committed = "", anchor = null, focus = null, pending = null, composing = false, drag = null;
  let preferredX = null, dragScale = 1;
  let selectionOrigin = "canvas";
  const viewScale = () => renderer.viewScale?.() ?? 1;
  let pictureResizeAvailable = false;
  let typingIntentRevision = 0;
  const changedTypingIntent = () => {
    typingIntentRevision = Number.isSafeInteger(typingIntentRevision) && typingIntentRevision < Number.MAX_SAFE_INTEGER ? typingIntentRevision + 1 : NaN;
  };
  let typingFont = null;
  let typingProperties = null;
  let multiComposition = null;
  let draftSelection = null;
  const inputIntents = createInputIntentQueue();
  let queuedInputCapture = null;
  let compositionInputCapture = null;
  let compositionInvalidated = false;
  const clearInputIntents = () => {
    if (composing)
      compositionInvalidated = true;
    inputIntents.clear();
    historyIntents.clear();
    queuedInputCapture = compositionInputCapture = null;
  };
  const textPending = () => ["splice", "splice-font-name", "splice-character-properties", "created-cell-text"].includes(pending?.kind);
  const pendingDraftEditable = () => Boolean(target) && controls.ready() && !historyPending && !multipleParagraphs() && (textPending() || inputIntents.size > 0) && Boolean(renderer.paragraph(target)?.selectable || renderer.paragraph(target)?.editable);
  const textAwaitingCommit = () => pendingDraftEditable() || Boolean(target && input.value !== committed);
  const historySelections = createHistorySelectionStore();
  let historyRevision = null;
  let historyAvailable = false, historyPending = false, structureAvailable = false, mergeAvailable = false, structureTarget = null;
  let deferredComposition = null, deferredReplies = [];
  let ackProjectionSequence = 0, deferredTypingCheck = null;
  let historyModelWitness = null;
  let historyModelPreparation = null;
  let historyPresentationReport = null;
  let formattingPaint = null;
  const historyModelReady = () => {
    if (!historyModelWitness || events.signal.aborted || ownerDocument?.visibilityState === "hidden" || typeof historyModelState !== "function")
      return false;
    const state = historyModelState();
    return sameHistoryModelObservation(historyModelWitness, state) && matchHistoryModelSelection(state, historyRevision, { anchor, focus }, renderer.paragraph(focus));
  };
  const nativeHistoryReady = () => !events.signal.aborted && !deferredComposition && !composing && !pending && !historyPending && !inputIntents.size && (!target || input.value === committed) && hostControls.ready() && !hostControls.busy() && (!historyPaintBarrier?.pending || historyModelReady());
  const historyIntents = createHistoryInputIntentQueue({
    ...typeof historyModelState === "function" ? {
      nativeReady: nativeHistoryReady,
      readyForKind: (kind) => kind === "history" && historyModelReady() ? true : undefined
    } : {},
    ready: () => !deferredComposition && !composing && !pending && !historyPending && !inputIntents.size && (!target || input.value === committed) && controls.ready() && !controls.busy(),
    history: (kind) => performHistory(kind),
    input: (intent) => applyOrderedInput(intent),
    error: (error) => report(`대기 명령을 적용할 수 없습니다: ${error.message}`)
  });
  const historyInputPending = () => historyIntents.size > 0 || historyPaintBarrier?.pending === true || RANGE_FORMATTING_KINDS.includes(pending?.kind);
  historyPaintBarrier = createHistoryPaintBarrier({
    isPainted(selection) {
      if (historyModelPreparation)
        return false;
      if (events.signal.aborted || ownerDocument?.visibilityState === "hidden" || !sameHistoryPaintStamp(historySelectionStamp(selection), historySelectionStamp({ anchor, focus })) || renderer.isSelectionPainted?.(selection) !== true)
        return false;
      if (!historyModelWitness)
        return true;
      if (!historyModelReady())
        return false;
      const paragraph = renderer.paragraph(selection.focus);
      if (!paragraphSelectionRanges([paragraph], selection.anchor, selection.focus, () => "single", {
        sourcePositions: false,
        includeEmpty: true
      }))
        return false;
      const currentLayout = renderer.layout();
      if (!caretGeometry(currentLayout, selection.anchor) || !caretGeometry(currentLayout, selection.focus))
        return false;
      const { scrollTop: top, scrollLeft: left } = viewport;
      reveal();
      if (top !== viewport.scrollTop || left !== viewport.scrollLeft) {
        paint();
        return false;
      }
      return historyModelReady() && sameHistoryPaintStamp(historySelectionStamp(selection), historySelectionStamp({ anchor, focus })) && renderer.isSelectionPainted?.(selection) === true;
    },
    release() {
      const completedFormatting = formattingPaint?.phase === "paint" ? formattingPaint : null;
      const completedReport = completedFormatting?.report ?? historyPresentationReport;
      if (completedFormatting)
        formattingPaint = null;
      historyPresentationReport = null;
      canvas.dataset.selectionAuthority = "current";
      input.setAttribute("aria-busy", "false");
      setSelection(anchor, focus, preferredX, selectionOrigin);
      historyIntents.wake();
      queueMicrotask(() => {
        if (!events.signal.aborted && completedReport !== null && reportedNoteRevision === completedReport && !historyIntents.size && !historyPaintBarrier.pending && !historyPending && !pending)
          report(completedFormatting ? "서식 처리 · 화면 반영 완료" : "실행 취소/다시 실행 적용 · 화면 반영 완료");
        completedFormatting?.resolve(true);
      });
    }
  });
  let splitQueryAvailable = false;
  let paragraphBreakAvailable = false;
  const multipleParagraphs = () => Boolean(anchor && focus && !sameParagraph(anchor, focus));
  const rangePermission = createSelectionEditPermission();
  const splitPermission = createSelectionEditPermission({ kind: "query-split-range" });
  const intentChange = (intent) => ({
    startUnit: intent.startUnit,
    endUnit: intent.endUnit,
    text: intent.text
  });
  const draftTextChange = () => {
    if (!pending && !composing && inputIntents.size) {
      try {
        return intentChange(inputIntents.peek(committed));
      } catch {
        return null;
      }
    }
    return textChange(committed, input.value, draftSelection && {
      startUnit: Math.min(draftSelection.anchor.unit, draftSelection.focus.unit),
      endUnit: Math.max(draftSelection.anchor.unit, draftSelection.focus.unit),
      inputType: draftSelection.inputType
    });
  };
  const wholeTextEditable = () => Boolean(target) && !multipleParagraphs() && renderer.paragraph(target)?.editable === true;
  const editRange = () => {
    if (target?.createdCell)
      return null;
    if (!target || !anchor || !focus || multipleParagraphs())
      return null;
    const change = input.value !== committed ? draftTextChange() : null;
    const range = change ?? {
      startUnit: Math.min(anchor.unit, focus.unit),
      endUnit: Math.max(anchor.unit, focus.unit),
      text: ""
    };
    const source = sourceTextChange(range, renderer.paragraph(target)?.sourceOffsets);
    return {
      section: target.section,
      paragraph: target.paragraph,
      startUnit: source.startUnit,
      endUnit: source.endUnit
    };
  };
  const textEditable = () => wholeTextEditable() || Boolean(editRange() && rangePermission.allowed(editRange()));
  const multiCompositionAvailable = () => {
    if (!multipleParagraphs() || renderer.paragraphReplacementAvailable?.() !== true)
      return false;
    const ranges = renderer.replacementRanges?.(anchor, focus);
    return Boolean(ranges?.length && ranges.every((range) => renderer.paragraph(range)?.editable === true));
  };
  const updateReadOnly = () => {
    input.readOnly = compositionInvalidated || !controls.ready() || !textEditable() && !multiCompositionAvailable() && !pendingDraftEditable();
    if (typeof queryEditRange === "function" && controls.ready() && !controls.busy() && !pending && !historyPending && target && !wholeTextEditable() && renderer.paragraph(target)?.selectable && editRange()) {
      const request = rangePermission.request(editRange());
      if (request && queryEditRange(request) === false)
        rangePermission.invalidate();
    }
    if (typeof querySplitRange === "function" && splitQueryAvailable && controls.ready() && !controls.busy() && structureAvailable && !pending && !historyPending && target && !wholeTextEditable() && renderer.paragraph(target)?.selectable && editRange() && input.value === committed) {
      const request = splitPermission.request(editRange());
      if (request && querySplitRange({
        ...request,
        anchored: renderer.paragraph(target)?.anchoredSplitAvailable === true
      }) === false)
        splitPermission.invalidate();
    }
  };
  let reportedNote = "";
  let reportedNoteRevision = 0;
  const report = (text) => {
    note.textContent = text;
    reportedNote = text;
    reportedNoteRevision++;
  };
  const compositionProjection = () => {
    if (!multiComposition)
      return null;
    const start = paragraphSelectionEdge(multiComposition.anchor, multiComposition.focus);
    return paragraphCompositionProjection(renderer.paragraph(start), start, input.value);
  };
  const extendedNavigation = (key, paragraphEdge, extend = true, word = false) => {
    if (pending || historyPending || composing || input.value !== committed || !controls.ready() || controls.busy())
      return null;
    const paragraph = renderer.paragraph(focus);
    if (!paragraph)
      return null;
    if (!extend && anchor.unit !== focus.unit && ["ArrowLeft", "ArrowRight"].includes(key)) {
      return navigateText(renderer.layout(), paragraph.text, anchor, focus, key);
    }
    const acceptRow = (row) => sameParagraph(row, focus) || Boolean(renderer.selectionRanges?.(anchor, {
      ...focus,
      section: row.section,
      paragraph: row.paragraph,
      unit: row.startUnit
    }));
    let next = navigateText(renderer.layout(), paragraph.text, anchor, focus, key, {
      extend: true,
      paragraphEdge,
      crossParagraph: true,
      preferredX,
      word,
      acceptRow
    });
    if ((!paragraphEdge || word) && next?.focus.unit === focus.unit && ["ArrowLeft", "ArrowRight"].includes(key)) {
      if (!extend && renderer.adjacentParagraph) {
        const point = renderer.adjacentParagraph(focus, key === "ArrowRight");
        return point ? { anchor: point, focus: point } : null;
      }
      const point = adjacentParagraphBoundary(renderer.layout(), focus, key);
      if (point)
        next = { anchor, focus: point };
    }
    if (!next)
      return null;
    if (!sameParagraph(next.anchor, next.focus) && !renderer.selectionRanges?.(next.anchor, next.focus))
      return null;
    if (!extend)
      next = { ...next, anchor: next.focus };
    return next;
  };
  const place = () => {
    const caret = caretGeometry(renderer.layout(), compositionProjection()?.composition.focus ?? focus);
    if (!caret)
      return;
    const bounds = canvasDocumentBounds(caret.screenBounds ?? caret, viewScale());
    if (!bounds)
      return;
    const left = viewport.scrollLeft ?? 0;
    input.style.left = `${Math.max(left, Math.min(bounds.x, left + viewport.clientWidth - 2))}px`;
    input.style.height = `${bounds.height}px`;
    input.style.top = `${Math.max(viewport.scrollTop, Math.min(bounds.y, viewport.scrollTop + viewport.clientHeight - bounds.height))}px`;
  };
  renderer.onGeometry(() => {
    place();
    historyPaintBarrier.notify();
  });
  if (ownerDocument?.addEventListener)
    listen(ownerDocument, "visibilitychange", () => {
      if (ownerDocument.visibilityState !== "hidden")
        historyPaintBarrier.notify();
    });
  const paint = ({ deferGeometry = false, preserveQueuedTyping = false } = {}) => {
    let composition;
    if (multiComposition)
      composition = compositionProjection()?.composition;
    const change = composing && !multiComposition && draftTextChange();
    if (change)
      composition = {
        anchor: { ...target, unit: change.startUnit },
        focus: { ...target, unit: change.startUnit + change.text.length }
      };
    const interaction = {
      anchor,
      focus,
      active: activeElement() === input || drag !== null,
      composition,
      historyPending
    };
    if (preserveQueuedTyping)
      renderer.select(interaction, true);
    else
      renderer.select(interaction);
    canvas.dataset.caret = focus ? `${focus.section}:${focus.paragraph}:${focus.unit}` : "";
    canvas.dataset.selection = anchor && focus ? `${anchor.unit}:${focus.unit}` : "";
    canvas.dataset.composing = String(composing);
    if (!deferGeometry)
      place();
    onComposition({
      composing,
      pending: Boolean(pending || historyPending || historyPaintBarrier.pending || inputIntents.size)
    });
    if (!composing && !pending && !historyPending && !historyPaintBarrier.pending && !inputIntents.size && input.value === committed)
      onCommittedSelection(anchor && focus ? { anchor: { ...anchor }, focus: { ...focus } } : null, { origin: selectionOrigin });
  };
  const sync = ({ deferGeometry = false } = {}) => {
    if (historyPaintBarrier.pending)
      return;
    if (!target || multipleParagraphs())
      return;
    const backward = input.selectionDirection === "backward";
    const minimum = hwp5StructuralEditableStart(renderer.paragraph(target));
    const start = Math.max(minimum, snapUnit(input.value, input.selectionStart)), end = Math.max(minimum, snapUnit(input.value, input.selectionEnd, true));
    if (input.selectionStart < minimum || input.selectionEnd < minimum)
      input.setSelectionRange(start, end, backward ? "backward" : "forward");
    const anchorUnit = backward ? end : start, focusUnit = backward ? start : end;
    if (anchor?.unit !== anchorUnit || focus?.unit !== focusUnit)
      preferredX = null;
    if (!(sameParagraph(anchor, target) && anchor.unit === anchorUnit && anchor.pageArea === target.pageArea && anchor.pageOrdinal === target.pageOrdinal))
      anchor = {
        ...target,
        unit: anchorUnit,
        affinity: anchor?.unit === anchorUnit ? anchor.affinity : "forward"
      };
    if (!(sameParagraph(focus, target) && focus.unit === focusUnit && focus.pageArea === target.pageArea && focus.pageOrdinal === target.pageOrdinal))
      focus = {
        ...target,
        unit: focusUnit,
        affinity: focus?.unit === focusUnit ? focus.affinity : "forward"
      };
    updateReadOnly();
    paint({ deferGeometry, preserveQueuedTyping: deferGeometry });
  };
  const resetTypingForUserSelection = (a, f) => {
    if (anchor && focus && (!sameParagraph(anchor, a) || anchor.unit !== a.unit || !sameParagraph(focus, f) || focus.unit !== f.unit)) {
      changedTypingIntent();
      typingFont = null;
      changedTypingIntent();
      typingProperties = null;
    }
  };
  const editablePoint = (point) => {
    if (!point)
      return point;
    const minimum = hwp5StructuralEditableStart(renderer.paragraph(point));
    return point.unit < minimum ? { ...point, unit: minimum } : point;
  };
  const setSelection = (a, f, nextX = null, origin = "canvas") => {
    a = editablePoint(a);
    f = editablePoint(f);
    selectionOrigin = origin;
    if (draftSelection && !sameParagraph(draftSelection.focus, f))
      draftSelection = null;
    if (typingFont && !sameParagraph(typingFont, f)) {
      changedTypingIntent();
      typingFont = null;
    }
    if (typingProperties && !sameParagraph(typingProperties, f)) {
      changedTypingIntent();
      typingProperties = null;
    }
    preferredX = nextX;
    anchor = a;
    focus = f;
    if (sameParagraph(a, f))
      input.setSelectionRange(Math.min(a.unit, f.unit), Math.max(a.unit, f.unit), a.unit > f.unit ? "backward" : "forward");
    updateReadOnly();
    paint();
  };
  const pump = (requestedChange = null) => {
    if (!target || composing || pending || historyPending || !controls.ready() || controls.busy())
      return;
    const sourceRange = requestedChange && sourceTextChange(requestedChange, renderer.paragraph(target)?.sourceOffsets);
    const permitted = requestedChange ? wholeTextEditable() || rangePermission.allowed({
      ...target,
      startUnit: sourceRange.startUnit,
      endUnit: sourceRange.endUnit
    }) : textEditable();
    if (!permitted)
      return;
    let queued = null, change;
    try {
      queued = !requestedChange && inputIntents.size ? inputIntents.peek(committed) : null;
      change = requestedChange ?? (queued ? intentChange(queued) : draftTextChange());
    } catch {
      clearInputIntents();
      input.value = committed;
      renderer.preview(null);
      sync();
      report("대기 입력의 기준 문서를 확인할 수 없어 적용하지 않았습니다.");
      return;
    }
    if (!change) {
      draftSelection = null;
      return;
    }
    preferredX = null;
    const font = change.text && typingFont && sameParagraph(typingFont, target) ? typingFont : null;
    const properties = change.text && typingProperties && sameParagraph(typingProperties, target) ? { ...typingProperties.properties } : null;
    pending = {
      kind: target.createdCell ? "created-cell-text" : font ? "splice-font-name" : properties ? "splice-character-properties" : "splice",
      start: change.startUnit,
      end: change.endUnit,
      afterText: committed.slice(0, change.startUnit) + change.text + committed.slice(change.endUnit),
      beforeSelection: queued?.beforeSelection ?? draftSelection ?? {
        anchor: { ...target, unit: change.startUnit },
        focus: { ...target, unit: change.endUnit }
      }
    };
    draftSelection = null;
    const command = sourceRange ?? sourceTextChange(change, renderer.paragraph(target)?.sourceOffsets);
    const request = target.createdCell ? {
      kind: pending.kind,
      origin: "canvas",
      section: target.section,
      identity: target.createdCell.identity,
      row: target.createdCell.row,
      column: target.createdCell.column,
      text: pending.afterText
    } : {
      kind: pending.kind,
      origin: "canvas",
      section: target.section,
      paragraph: target.paragraph,
      ...command,
      ...font ? { language: font.language, name: font.name } : {},
      ...properties ? { properties } : {}
    };
    const reference = renderer.paragraph(target)?.currentReference;
    if (["splice", "created-cell-text"].includes(pending.kind) && reference)
      request.reference = reference;
    if (!controls.request(request))
      pending = null;
    else if (queued)
      inputIntents.consume(committed);
    input.setAttribute("aria-busy", String(Boolean(pending)));
  };
  const reveal = () => {
    const caret = caretGeometry(renderer.layout(), focus);
    if (!caret || activeElement() !== input)
      return;
    const bounds = canvasDocumentBounds(caret.screenBounds ?? caret, viewScale());
    if (!bounds)
      return;
    const left = canvasCaretScrollLeft(bounds.x, viewport.scrollLeft ?? 0, viewport.clientWidth);
    if (left !== null)
      viewport.scrollLeft = left;
    if (bounds.y < viewport.scrollTop)
      viewport.scrollTop = bounds.y;
    else if (bounds.y + bounds.height > viewport.scrollTop + viewport.clientHeight)
      viewport.scrollTop = bounds.y + bounds.height - viewport.clientHeight;
    place();
    input.scrollIntoView({ block: "nearest", inline: "nearest" });
  };
  const draftPreview = () => {
    const change = pending && textPending() ? { startUnit: pending.start, endUnit: pending.end } : draftTextChange();
    return {
      ...target,
      text: input.value,
      characterRanges: projectTypingDraftRanges(renderer.paragraph(target), input.value, change)
    };
  };
  const preview = () => {
    renderer.preview(draftPreview());
    sync();
    reveal();
  };
  const coordinates = (event) => {
    const box = canvas.getBoundingClientRect();
    return canvasDocumentPoint(event, box, viewport.scrollTop, viewScale(), viewport.scrollLeft ?? 0);
  };
  installCanvasPointerFrameGate({
    canvas,
    renderer,
    signal: events.signal,
    cancelDrag(pointerId) {
      if (drag !== pointerId)
        return;
      drag = null;
      if (canvas.hasPointerCapture(pointerId))
        canvas.releasePointerCapture(pointerId);
    },
    onBlocked(event) {
      if (event.type === "pointerdown")
        report("화면 갱신 중입니다. 갱신된 화면에서 다시 선택하세요.");
    }
  });
  const point = (event, constrained = null) => {
    const { x, y } = coordinates(event);
    const layout = renderer.layout();
    return hitTableBoundary(layout, x, y, (target) => renderer.paragraph(target), constrained) ?? hitDrawingBoundary(layout, x, y, constrained) ?? hitText(layout, x, y, constrained);
  };
  listen(canvas, "pointermove", (event) => {
    if (historyPaintBarrier.pending)
      return;
    canvas.style.cursor = point(event) ? "text" : "default";
    if (drag !== event.pointerId || !target)
      return;
    if (dragScale !== viewScale()) {
      release(event);
      return;
    }
    const box = viewport.getBoundingClientRect();
    if (event.clientY < box.top || event.clientY > box.bottom)
      viewport.scrollTop += event.clientY < box.top ? -LINE_HEIGHT : LINE_HEIGHT;
    if (Number.isFinite(box.left) && Number.isFinite(box.right)) {
      if (event.clientX < box.left)
        viewport.scrollLeft = Math.max(0, (viewport.scrollLeft ?? 0) - LINE_HEIGHT);
      else if (event.clientX > box.right)
        viewport.scrollLeft = (viewport.scrollLeft ?? 0) + LINE_HEIGHT;
    }
    const free = !pending && !composing && !historyPending && input.value === committed ? point(event) : null;
    const ranges = free ? renderer.selectionRanges?.(anchor, free) : null;
    const next = ranges ? free : point(event, target);
    if (next) {
      resetTypingForUserSelection(anchor, next);
      setSelection(anchor, next);
    }
  });
  listen(canvas, "pointerdown", (event) => {
    if (event.button !== 0)
      return;
    if (historyPaintBarrier.pending) {
      event.preventDefault();
      report("이력의 입력 위치를 확인 중입니다. 화면 반영 뒤 다시 선택하세요.");
      return;
    }
    const location = coordinates(event);
    const picture = !event.shiftKey && !event.metaKey && !event.ctrlKey ? renderer.pictureAtLogicalPoint?.(location.x, location.y, {
      includeBehind: event.altKey === true
    }) : null;
    if (picture) {
      event.preventDefault();
      if (historyPending || composing || pending || input.value !== committed || controls.busy()) {
        report("입력 반영 중에는 그림 선택을 변경할 수 없습니다.");
        return;
      }
      if (drag !== null && canvas.hasPointerCapture(drag))
        canvas.releasePointerCapture(drag);
      rangePermission.invalidate();
      splitPermission.invalidate();
      changedTypingIntent();
      typingFont = null;
      changedTypingIntent();
      typingProperties = null;
      draftSelection = null;
      selectionOrigin = "canvas";
      anchor = null;
      focus = null;
      target = null;
      drag = null;
      input.blur();
      input.value = "";
      committed = "";
      input.disabled = true;
      renderer.selectPicture?.(picture.picture);
      paint();
      report("그림을 선택했습니다. 지원되는 그림은 크기를 입력해 변경할 수 있습니다.");
      if (!controls.ready() && !controls.busy())
        controls.request({ kind: "enable", origin: "canvas" });
      return;
    }
    const next = point(event);
    if (!next) {
      renderer.selectPicture?.(null);
      input.blur();
      return;
    }
    event.preventDefault();
    if (historyPending || composing || (pending || input.value !== committed) && !sameParagraph(next, target)) {
      report("입력 반영 중입니다. 같은 문단에서 이어서 입력하거나 잠시 기다리세요.");
      return;
    }
    renderer.selectPicture?.(null);
    const extended = event.shiftKey && anchor && (sameParagraph(anchor, next) || renderer.selectionRanges?.(anchor, next)) ? anchor : next;
    if (!sameParagraph(next, target)) {
      target = { section: next.section, paragraph: next.paragraph };
      committed = renderer.paragraph(next).text;
      input.value = committed;
    }
    target = paragraphTarget(next);
    resetTypingForUserSelection(extended, next);
    setSelection(extended, next);
    input.disabled = false;
    updateReadOnly();
    input.focus({ preventScroll: true });
    drag = event.pointerId;
    dragScale = viewScale();
    canvas.setPointerCapture(drag);
    paint();
    if (!controls.ready() && !controls.busy()) {
      report("편집 세션을 여는 중…");
      controls.request({ kind: "enable", origin: "canvas" });
    }
  });
  const release = (event) => {
    if (drag === event.pointerId) {
      drag = null;
      if (canvas.hasPointerCapture(event.pointerId))
        canvas.releasePointerCapture(event.pointerId);
      paint();
      if (event.type === "pointerup" && anchor && focus && sameParagraph(anchor, focus) && anchor.unit === focus.unit)
        report("커서 위치를 선택했습니다.");
    }
  };
  listen(canvas, "pointerup", release);
  listen(canvas, "pointercancel", release);
  listen(canvas, "lostpointercapture", release);
  const performHistory = (kind) => {
    if (!["undo", "redo"].includes(kind))
      return false;
    if (!historyAvailable) {
      report("이 문서 형식은 실행 취소/다시 실행을 아직 지원하지 않습니다.");
      return false;
    }
    const modelReady = historyModelReady();
    if (composing || pending || inputIntents.size || historyPending || target && input.value !== committed || !controls.ready() || controls.busy() && !modelReady) {
      report("입력 반영이 끝난 뒤 실행 취소/다시 실행하세요.");
      return false;
    }
    historyModelWitness = null;
    historyModelPreparation = null;
    historyPending = true;
    historyPaintBarrier.begin();
    if (historyRevision !== null && anchor && focus)
      historySelections.remember(historyRevision, { anchor, focus });
    const previousNote = reportedNote;
    const pendingNote = "실행 취소/다시 실행 반영 중 · 현재 커서는 새 입력 위치가 아닙니다. 입력은 복원 위치 확인 뒤 적용됩니다.";
    canvas.dataset.selectionAuthority = "history-pending";
    input.setAttribute("aria-busy", "true");
    report(pendingNote);
    paint({ deferGeometry: modelReady });
    if (!controls.request({ kind, origin: "canvas" })) {
      historyPending = false;
      historyModelWitness = null;
      historyModelPreparation = null;
      historyPaintBarrier.reset();
      canvas.dataset.selectionAuthority = "current";
      input.setAttribute("aria-busy", "false");
      if (reportedNote === pendingNote)
        report(previousNote);
      updateReadOnly();
      paint();
      return false;
    }
    return true;
  };
  const historyRoute = () => {
    if (events.signal.aborted)
      return "blocked";
    if (target !== null || anchor !== null || focus !== null || inputIntents.size > 0 || historyIntents.size > 0 || historyPending || historyPaintBarrier.pending || queuedInputCapture !== null || compositionInputCapture !== null || deferredComposition !== null || historyModelPreparation !== null || historyModelWitness !== null || draftSelection !== null || textPending())
      return "text";
    if (compositionInvalidated || structureTarget !== null || drag !== null || composing || multiComposition !== null || pending !== null || deferredReplies.length > 0 || deferredTypingCheck !== null || historyPresentationReport !== null || input.value !== committed)
      return "blocked";
    return "none";
  };
  const canRequestHistory = (kind) => {
    if (!["undo", "redo"].includes(kind) || !historyAvailable || !controls.ready() || !historyIntents.hasCapacity)
      return false;
    const available = historyAvailability?.();
    if (available?.available === false)
      return false;
    return composing || Boolean(pending || inputIntents.size || historyPending || historyIntents.size || target && input.value !== committed) || !available || available[kind === "undo" ? "canUndo" : "canRedo"] === true;
  };
  const travel = (kind) => {
    if (!canRequestHistory(kind))
      return false;
    if (typeof requestStableNonTextHistory === "function") {
      const route = historyRoute();
      if (route === "blocked")
        return false;
      if (route === "none")
        return requestStableNonTextHistory(kind) === true;
    }
    return historyIntents.history(kind);
  };
  const applyOrderedInput = ({ inputType, data }) => {
    if (!target || !anchor || !focus)
      return false;
    if (inputType === "navigation") {
      const action = JSON.parse(data);
      if (action.key === "SelectAll") {
        resetTypingForUserSelection({ ...target, unit: 0 }, { ...target, unit: committed.length });
        setSelection({ ...target, unit: 0 }, { ...target, unit: committed.length });
        reveal();
        return true;
      }
      const next = extendedNavigation(action.key, action.paragraphEdge, action.extend, action.word);
      if (!next)
        return true;
      if (!action.extend && !sameParagraph(target, next.focus)) {
        target = paragraphTarget(next.focus);
        committed = renderer.paragraph(target).text;
        input.value = committed;
      }
      resetTypingForUserSelection(next.anchor, next.focus);
      setSelection(next.anchor, next.focus, next.preferredX);
      reveal();
      return true;
    }
    if (["insertText", "insertReplacementText", "insertFromPaste"].includes(inputType))
      return replaceSelectedText(data);
    if (["insertLineBreak", "insertParagraph"].includes(inputType))
      return split() !== false;
    if ([
      "deleteContentBackward",
      "deleteContentForward",
      "deleteWordBackward",
      "deleteWordForward",
      "deleteByCut"
    ].includes(inputType)) {
      if (!multipleParagraphs() && input.selectionStart === input.selectionEnd && inputType !== "deleteByCut") {
        const unit = input.selectionStart;
        const backward = inputType.endsWith("Backward");
        const minimum = hwp5StructuralEditableStart(renderer.paragraph(target));
        if (backward && minimum > 0 && unit <= minimum)
          return true;
        const next = inputType.startsWith("deleteWord") ? wordBoundary(committed, unit, !backward) : snapUnit(committed, unit + (backward ? -1 : 1), !backward);
        if (next === unit) {
          mergeBoundary(backward);
          return true;
        }
        setSelection({ ...target, unit: Math.min(unit, next) }, { ...target, unit: Math.max(unit, next) });
      }
      return replaceSelectedText("");
    }
    return false;
  };
  const queueOrderedInput = (inputType, data = "") => {
    if (![
      "insertText",
      "insertReplacementText",
      "insertFromPaste",
      "insertLineBreak",
      "insertParagraph",
      "deleteContentBackward",
      "deleteContentForward",
      "deleteWordBackward",
      "deleteWordForward",
      "deleteByCut",
      "navigation"
    ].includes(inputType))
      return false;
    const accepted = historyIntents.input(inputType, data ?? "");
    if (!accepted)
      report("대기 입력 한도에 도달했습니다. 명령 반영 후 이어서 입력하세요.");
    return accepted;
  };
  const split = (breakBefore = null) => {
    if (breakBefore !== null && !paragraphBreakAvailable) {
      report("수정키+Enter 명령은 아직 지원하지 않습니다. 문단은 변경하지 않았습니다.");
      return false;
    }
    if (breakBefore !== null && multipleParagraphs()) {
      report("쪽·단 나누기는 한 문단 안에서 선택한 범위에 적용하세요.");
      return false;
    }
    if (target?.createdCell) {
      report("생성 셀의 여러 문단 편집은 아직 지원하지 않습니다.");
      return;
    }
    if (!textEditable() && !(splitQueryAvailable && editRange() && splitPermission.allowed(editRange()))) {
      if (splitQueryAvailable && editRange())
        report(splitPermission.pending(editRange()) ? "문단 분할 범위를 확인 중입니다. 확인 후 Enter를 다시 누르세요." : "이 범위는 문단을 분할할 수 없습니다.");
      return false;
    }
    if (!structureAvailable) {
      report("이 문서 형식의 문단 분할은 아직 지원하지 않습니다.");
      return false;
    }
    if (!target || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy()) {
      report("입력 반영이 끝난 뒤 문단을 분할하세요.");
      return false;
    }
    const unit = snapUnit(committed, input.selectionStart);
    const end = snapUnit(committed, input.selectionEnd, true);
    const position = sourceTextChange({ startUnit: unit, endUnit: end, text: "" }, renderer.paragraph(target)?.sourceOffsets);
    structureTarget = {
      kind: "split",
      ...paragraphTarget(target),
      paragraph: target.paragraph + 1
    };
    historyPending = true;
    input.readOnly = false;
    const anchored = breakBefore === null && renderer.paragraph(target)?.anchoredSplitAvailable === true ? { anchored: true } : {};
    if (!controls.request({
      kind: "split",
      origin: "canvas",
      ...target,
      ...anchored,
      ...breakBefore === null ? {} : { breakBefore },
      atUnit: position.startUnit,
      endUnit: position.endUnit
    })) {
      structureTarget = null;
      historyPending = false;
      updateReadOnly();
      return false;
    }
    input.setAttribute("aria-busy", "true");
    return true;
  };
  const selectedCharacterPropertyRanges = () => {
    if (!multipleParagraphs() || renderer.characterPropertyRangesAvailable?.() !== true || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
      return null;
    return renderer.selectionRanges?.(anchor, focus) ?? null;
  };
  const setTypingProperties = (properties, onCommit = null) => {
    const previous = typingProperties && sameParagraph(typingProperties, target) ? typingProperties.properties : {};
    let merged;
    try {
      merged = mergeTypingProperties(previous, properties);
    } catch {
      return false;
    }
    changedTypingIntent();
    typingProperties = { ...target, properties: merged };
    onCommit?.(typingIntentRevision);
    report("다음 입력의 글자 속성을 지정했습니다. 입력 전에는 문서가 변경되지 않습니다.");
    return true;
  };
  const setCharacterProperties = (properties, guard = null) => {
    if (multipleParagraphs()) {
      const ranges = selectedCharacterPropertyRanges();
      if (!ranges?.length)
        return false;
      if (guard && guard() !== true)
        return false;
      pending = { kind: "character-properties-ranges", anchor: { ...anchor }, focus: { ...focus } };
      if (!controls.request({
        kind: pending.kind,
        origin: "canvas",
        ranges,
        properties: { ...properties }
      })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    }
    const range = selectedRange();
    if (!range)
      return false;
    if (range.startUnit === range.endUnit) {
      if (!canSetTypingProperties())
        return false;
      return setTypingProperties(properties);
    }
    pending = {
      kind: "character-properties",
      start: input.selectionStart,
      end: input.selectionEnd
    };
    if (!controls.request({
      kind: "character-properties",
      origin: "canvas",
      ...range,
      properties: { ...properties }
    })) {
      pending = null;
      return false;
    }
    input.setAttribute("aria-busy", "true");
    return true;
  };
  const replaceSelection = (text, guard = null) => {
    if (!target || !anchor || !focus || typeof text !== "string" || !text.isWellFormed() || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
      return false;
    if (target.createdCell) {
      const normalized = normalizeParagraphReplacement(text);
      if (!textEditable() || inputIntents.size || normalized.includes(`
`) && renderer.paragraph(target)?.softLineBreakAvailable !== true)
        return false;
      sync();
      const start = snapUnit(committed, input.selectionStart), end = snapUnit(committed, input.selectionEnd, true);
      draftSelection = { anchor: { ...anchor }, focus: { ...focus } };
      input.value = committed.slice(0, start) + normalized + committed.slice(end);
      input.setSelectionRange(start + normalized.length, start + normalized.length);
      preview();
      pump({ startUnit: start, endUnit: end, text: normalized });
      return Boolean(pending);
    }
    if (renderer.paragraphReplacementAvailable?.() === false) {
      report("현재 WASM은 문단 교체를 지원하지 않습니다.");
      return false;
    }
    const ranges = renderer.replacementRanges?.(anchor, focus);
    if (!ranges?.length || ranges.some((range) => renderer.paragraph(range)?.editable !== true))
      return false;
    const start = paragraphSelectionEdge(anchor, focus);
    const lines = normalizeParagraphReplacement(text).split(`
`);
    const font = typingFont && sameParagraph(typingFont, target) ? typingFont : null;
    const properties = typingProperties && sameParagraph(typingProperties, target) ? { ...typingProperties.properties } : null;
    if (font && renderer.namedFontReplacementAvailable?.() !== true) {
      report("현재 WASM은 지정 글꼴의 문단 교체를 지원하지 않습니다.");
      return false;
    }
    if (properties && (font ? renderer.namedFontPropertyReplacementAvailable?.() : renderer.characterPropertyReplacementAvailable?.()) !== true) {
      report("현재 WASM은 입력 속성을 포함한 문단 교체를 지원하지 않습니다.");
      return false;
    }
    if (guard && guard() !== true)
      return false;
    pending = {
      kind: "replace-paragraph-ranges",
      font,
      properties,
      anchor: { ...anchor },
      focus: { ...focus },
      target: { section: start.section, paragraph: start.paragraph + lines.length - 1 },
      unit: lines.length === 1 ? start.unit + text.length : lines.at(-1).length
    };
    if (!controls.request({
      kind: pending.kind,
      origin: "canvas",
      ranges,
      text,
      ...font ? { language: font.language, name: font.name } : {},
      ...properties ? { properties: { ...properties } } : {}
    })) {
      pending = null;
      return false;
    }
    input.setAttribute("aria-busy", "true");
    return true;
  };
  const queueReplacementTyping = (text) => {
    if (pending?.kind !== "replace-paragraph-ranges")
      return false;
    return queueTyping(pending, text);
  };
  const queueTyping = (request, text) => {
    const queued = appendQueuedText(request.queuedText ?? "", text);
    if (!queued.accepted)
      return false;
    if (queued.overflow) {
      report("대기 입력 한도에 도달했습니다. 반영 후 다시 입력하세요.");
      return true;
    }
    request.queuedText = queued.text;
    return true;
  };
  const queueSplitTyping = (text) => structureTarget?.kind === "split" && historyPending && queueTyping(structureTarget, text);
  const selectedCharacterPropertyState = (property) => {
    if (multipleParagraphs()) {
      if (!["bold", "italic", "underline", "strike"].includes(property) || property === "strike" && renderer.characterStrikeRangesAvailable?.() !== true || property === "underline" && renderer.characterUnderlineRangesAvailable?.() !== true || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
        return null;
      return renderer.selectionCharacterState?.(anchor, focus, property) ?? null;
    }
    if (!selectedRange())
      return null;
    if (property === "strike" && input.selectionStart === input.selectionEnd)
      return null;
    if (input.selectionStart === input.selectionEnd) {
      if (!canSetTypingProperties())
        return null;
      const properties = typingProperties && sameParagraph(typingProperties, target) ? typingProperties.properties : null;
      return characterTypingState(committed, input.selectionStart, property, properties, (start, end, key) => renderer.characterState?.(target, start, end, key));
    }
    return renderer.characterState?.(target, snapUnit(committed, input.selectionStart), snapUnit(committed, input.selectionEnd, true), property) ?? null;
  };
  const setCharacterUnderline = (underlineKind, guard = null) => {
    if (multipleParagraphs()) {
      if (renderer.characterUnderlineRangesAvailable?.() !== true || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
        return false;
      const ranges = renderer.selectionRanges?.(anchor, focus);
      if (!ranges?.length)
        return false;
      if (guard && guard() !== true)
        return false;
      pending = { kind: "character-underline-ranges", anchor: { ...anchor }, focus: { ...focus } };
      if (!controls.request({ kind: pending.kind, origin: "canvas", ranges, underlineKind })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    }
    const range = selectedRange();
    if (!range || range.startUnit === range.endUnit)
      return false;
    pending = { kind: "character-underline", start: input.selectionStart, end: input.selectionEnd };
    if (!controls.request({ kind: "character-underline", origin: "canvas", ...range, underlineKind })) {
      pending = null;
      return false;
    }
    input.setAttribute("aria-busy", "true");
    return true;
  };
  const toggleCharacterProperty = (property, guard = null) => {
    if (property === "strike") {
      if (composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
        return false;
      if (multipleParagraphs()) {
        if (renderer.characterStrikeRangesAvailable?.() !== true)
          return false;
        const state = selectedCharacterPropertyState(property);
        const ranges = renderer.selectionRanges?.(anchor, focus);
        if (state === null || !ranges?.length)
          return false;
        if (guard && guard() !== true)
          return false;
        pending = { kind: "character-strike-ranges", anchor: { ...anchor }, focus: { ...focus } };
        if (!controls.request({
          kind: pending.kind,
          origin: "canvas",
          ranges,
          enabled: state !== true
        })) {
          pending = null;
          return false;
        }
        input.setAttribute("aria-busy", "true");
        return true;
      }
      const range = selectedRange();
      if (!range || range.startUnit === range.endUnit)
        return false;
      const state = selectedCharacterPropertyState(property);
      if (state === null)
        return false;
      pending = { kind: "character-strike", start: input.selectionStart, end: input.selectionEnd };
      if (!controls.request({
        kind: pending.kind,
        origin: "canvas",
        ...range,
        enabled: state !== true
      })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    }
    if (multipleParagraphs()) {
      const state = selectedCharacterPropertyState(property);
      return state === null ? false : property === "underline" ? setCharacterUnderline(state === true ? "none" : "bottom", guard) : setCharacterProperties({ [property]: state !== true });
    }
    if (!selectedRange())
      return false;
    if (input.selectionStart === input.selectionEnd && ["bold", "italic"].includes(property)) {
      const state = selectedCharacterPropertyState(property);
      return state === null ? false : setCharacterProperties({ [property]: !state });
    }
    const properties = renderer.characterToggle?.(target, snapUnit(committed, input.selectionStart), snapUnit(committed, input.selectionEnd, true), property);
    if (!properties)
      return false;
    return property === "underline" ? setCharacterUnderline(properties.underline ? "bottom" : "none") : setCharacterProperties(properties);
  };
  const setCharacterColor = (kind, color) => {
    const range = selectedRange();
    if (!range || range.startUnit === range.endUnit)
      return false;
    pending = { kind, start: input.selectionStart, end: input.selectionEnd };
    if (!controls.request({ kind, origin: "canvas", ...range, color })) {
      pending = null;
      return false;
    }
    input.setAttribute("aria-busy", "true");
    return true;
  };
  const setCharacterUnderlineColor = (color) => setCharacterColor("character-underline-color", color);
  const setCharacterStrikeColor = (color) => renderer.characterStrikeColorAvailable?.() === true && setCharacterColor("character-strike-color", color);
  const selectedShadeRanges = () => {
    if (!multipleParagraphs()) {
      const range = selectedRange();
      return range ? [range] : null;
    }
    if (renderer.characterShadeRangesAvailable?.() !== true || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
      return null;
    return renderer.selectionRanges?.(anchor, focus) ?? null;
  };
  const selectedOutlineRanges = () => {
    if (!multipleParagraphs()) {
      const range = renderer.characterOutlineAvailable?.() === true ? selectedRange() : null;
      return range ? [range] : null;
    }
    if (renderer.characterOutlineRangesAvailable?.() !== true || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
      return null;
    const ranges = renderer.selectionRanges?.(anchor, focus);
    try {
      encodeCharacterRanges(ranges);
    } catch {
      return null;
    }
    return ranges;
  };
  const selectedOutlineValue = (named = false) => {
    if (composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
      return null;
    if (multipleParagraphs())
      return selectedOutlineRanges() ? renderer[named ? "characterOutlineKindState" : "characterOutlineState"]?.(anchor, focus) ?? null : null;
    if (!selectedRange() || input.selectionStart === input.selectionEnd)
      return null;
    return renderer[named ? "characterOutlineKind" : "characterOutline"]?.(target, snapUnit(committed, input.selectionStart), snapUnit(committed, input.selectionEnd, true)) ?? null;
  };
  const characterOutlineKindAvailable = (kind) => {
    let value;
    try {
      value = hwp5CharacterOutlineArg(kind);
    } catch {
      return false;
    }
    if (!selectedOutlineRanges()?.some((range) => range.startUnit < range.endUnit))
      return false;
    return value <= 1 || (multipleParagraphs() ? renderer.characterOutlineRangesExtendedAvailable?.() : renderer.characterOutlineExtendedAvailable?.()) === true;
  };
  const selectedEffectRanges = (exclusive = false) => {
    try {
      characterEffectMode(exclusive);
    } catch {
      return null;
    }
    if (multipleParagraphs()) {
      const available = exclusive ? renderer.characterEffectRangesExclusiveAvailable?.() : renderer.characterEffectRangesAvailable?.();
      if (available !== true || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
        return null;
      const ranges = renderer.selectionRanges?.(anchor, focus);
      try {
        encodeCharacterRanges(ranges);
      } catch {
        return null;
      }
      return ranges;
    }
    if ((exclusive ? renderer.characterEffectExclusiveAvailable?.() : renderer.characterEffectAvailable?.()) !== true)
      return null;
    const range = selectedRange();
    return range ? [range] : null;
  };
  const setCharacterShade = (color, guard = null) => {
    if (renderer.characterShadeAvailable?.() !== true)
      return false;
    try {
      characterShadeArgs(color);
    } catch {
      return false;
    }
    if (multipleParagraphs()) {
      if (renderer.characterShadeRangesAvailable?.() !== true)
        return false;
      const ranges = selectedShadeRanges();
      if (!ranges?.some((range) => range.startUnit < range.endUnit))
        return false;
      if (guard && guard() !== true)
        return false;
      pending = { kind: "character-shade-ranges", anchor: { ...anchor }, focus: { ...focus } };
      if (!controls.request({ kind: pending.kind, origin: "canvas", ranges, color })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    }
    return setCharacterColor("character-shade", color);
  };
  const setCharacterFont = (language, fontId, guard = null) => {
    if (multipleParagraphs()) {
      const ranges = selectedFontRanges();
      if (!ranges?.some((range) => range.startUnit < range.endUnit))
        return false;
      if (guard && guard() !== true)
        return false;
      pending = { kind: "character-font-ranges", anchor: { ...anchor }, focus: { ...focus } };
      if (!controls.request({ kind: pending.kind, origin: "canvas", ranges, language, fontId })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    }
    if (renderer.characterFontAvailable?.() !== true)
      return false;
    const range = selectedRange();
    if (!range || range.startUnit === range.endUnit)
      return false;
    pending = { kind: "character-font", start: input.selectionStart, end: input.selectionEnd };
    if (!controls.request({ kind: "character-font", origin: "canvas", ...range, language, fontId })) {
      pending = null;
      return false;
    }
    input.setAttribute("aria-busy", "true");
    return true;
  };
  const setCharacterFontName = (language, name, guard = null) => {
    if (multipleParagraphs()) {
      const ranges = selectedFontNameRanges();
      if (!ranges?.some((range) => range.startUnit < range.endUnit))
        return false;
      if (guard && guard() !== true)
        return false;
      pending = { kind: "character-font-name-ranges", anchor: { ...anchor }, focus: { ...focus } };
      if (!controls.request({ kind: pending.kind, origin: "canvas", ranges, language, name })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    }
    const range = selectedRange();
    if (!range)
      return false;
    if (range.startUnit === range.endUnit) {
      if (renderer.namedFontTextAvailable?.() !== true || !textEditable())
        return false;
      if (typingProperties && renderer.namedFontPropertyTextAvailable?.() !== true)
        return false;
      try {
        characterFontNameArgs(language, name);
      } catch {
        return false;
      }
      changedTypingIntent();
      typingFont = { ...target, language, name };
      report("다음 입력의 글꼴을 지정했습니다. 입력 전에는 문서가 변경되지 않습니다.");
      return true;
    }
    if (renderer.characterFontNameAvailable?.() !== true)
      return false;
    pending = { kind: "character-font-name", start: input.selectionStart, end: input.selectionEnd };
    if (!controls.request({ kind: pending.kind, origin: "canvas", ...range, language, name })) {
      pending = null;
      return false;
    }
    input.setAttribute("aria-busy", "true");
    return true;
  };
  const selectedFontRanges = () => {
    if (!multipleParagraphs()) {
      const range = selectedRange();
      return range ? [range] : null;
    }
    if (renderer.characterFontRangesAvailable?.() !== true || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
      return null;
    return renderer.selectionRanges?.(anchor, focus) ?? null;
  };
  const selectedFontNameRanges = () => {
    if (!multipleParagraphs()) {
      const range = selectedRange();
      if (range?.startUnit === range?.endUnit && !textEditable())
        return null;
      return range;
    }
    if (renderer.characterFontNameRangesAvailable?.() !== true || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
      return null;
    return renderer.selectionRanges?.(anchor, focus) ?? null;
  };
  const selectedTextColorRanges = () => {
    if (!multipleParagraphs()) {
      const range = selectedRange();
      return range ? [range] : null;
    }
    if (renderer.textColorRangesAvailable?.() === false)
      return null;
    if (composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
      return null;
    return renderer.selectionRanges?.(anchor, focus) ?? null;
  };
  const setCharacterTextColor = (color, guard = null) => {
    if (!multipleParagraphs())
      return setCharacterColor("character-text-color", color);
    const ranges = selectedTextColorRanges();
    if (!ranges?.some((range) => range.startUnit < range.endUnit))
      return false;
    if (guard && guard() !== true)
      return false;
    pending = { kind: "character-text-color-ranges", anchor: { ...anchor }, focus: { ...focus } };
    if (!controls.request({ kind: pending.kind, origin: "canvas", ranges, color })) {
      pending = null;
      return false;
    }
    input.setAttribute("aria-busy", "true");
    return true;
  };
  const mergeBoundary = (backward) => {
    if (backward && target && input.selectionStart === input.selectionEnd) {
      const minimum = hwp5StructuralEditableStart(renderer.paragraph(target));
      if (minimum > 0 && input.selectionStart <= minimum)
        return true;
    }
    if (target?.createdCell)
      return false;
    if (!textEditable())
      return false;
    if (!target || input.selectionStart !== input.selectionEnd || input.selectionStart !== (backward ? 0 : input.value.length))
      return false;
    if (!mergeAvailable)
      return false;
    if (composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
      return true;
    const current = renderer.paragraph(target);
    const neighbor = backward ? current?.previousMergeParagraph : current?.nextMergeParagraph;
    if (neighbor === null)
      return true;
    const explicit = Number.isInteger(neighbor);
    const left = {
      ...paragraphTarget(target),
      paragraph: backward ? explicit ? neighbor : target.paragraph - 1 : target.paragraph
    };
    const rightParagraph = backward ? target.paragraph : explicit ? neighbor : target.paragraph + 1;
    const paragraph = renderer.paragraph(left);
    if (!paragraph || !renderer.paragraph({ ...left, paragraph: rightParagraph }))
      return true;
    structureTarget = { kind: "merge", ...left, unit: paragraph.text.length };
    historyPending = true;
    input.readOnly = true;
    if (!controls.request({
      kind: "merge",
      origin: "canvas",
      ...left,
      ...explicit ? { rightParagraph } : {}
    })) {
      structureTarget = null;
      historyPending = false;
      updateReadOnly();
    } else
      input.setAttribute("aria-busy", "true");
    return true;
  };
  listen(input, "beforeinput", (event) => {
    if (event.defaultPrevented)
      return;
    if (compositionInvalidated) {
      event.preventDefault();
      return;
    }
    if (["historyUndo", "historyRedo"].includes(event.inputType) && !composing && !event.isComposing) {
      event.preventDefault();
      travel(event.inputType === "historyUndo" ? "undo" : "redo");
      return;
    }
    if ((composing || event.isComposing || textAwaitingCommit()) && ["insertLineBreak", "insertParagraph"].includes(event.inputType)) {
      event.preventDefault();
      if (target && controls.ready())
        queueOrderedInput(event.inputType);
      return;
    }
    if (deferredComposition)
      return;
    if (historyInputPending() && !composing && !event.isComposing) {
      event.preventDefault();
      if (!queueOrderedInput(event.inputType, event.data))
        report("현재 대기 명령 뒤에 이 입력을 적용할 수 없습니다.");
      return;
    }
    if (structureTarget?.kind === "split" && historyPending) {
      event.preventDefault();
      if (!event.isComposing && !composing && ["insertText", "insertReplacementText"].includes(event.inputType))
        queueSplitTyping(event.data);
      return;
    }
    if (!target || !controls.ready() || historyPending) {
      event.preventDefault();
      return;
    }
    if (["historyUndo", "historyRedo"].includes(event.inputType)) {
      event.preventDefault();
      travel(event.inputType === "historyUndo" ? "undo" : "redo");
      return;
    }
    if (pending?.kind === "replace-paragraph-ranges" && !multipleParagraphs()) {
      event.preventDefault();
      if (!event.isComposing && !composing && event.inputType === "insertText")
        queueReplacementTyping(event.data);
      return;
    }
    if (multipleParagraphs()) {
      if (multiComposition && composing)
        return;
      event.preventDefault();
      if (event.isComposing || composing)
        return;
      if (["insertText", "insertReplacementText", "insertFromPaste"].includes(event.inputType) && typeof event.data === "string") {
        if (event.inputType !== "insertText" || !queueReplacementTyping(event.data))
          replaceSelection(event.data);
      } else if (["insertLineBreak", "insertParagraph"].includes(event.inputType))
        replaceSelection(`
`);
      else if (["deleteContentBackward", "deleteContentForward", "deleteByCut"].includes(event.inputType))
        replaceSelection("");
      return;
    }
    if (event.inputType === "insertLineBreak" && target.createdCell && renderer.paragraph(target)?.softLineBreakAvailable === true) {
      event.preventDefault();
      replaceSelection(`
`);
      return;
    }
    if (event.inputType === "insertFromPaste" && typeof event.data === "string" && /[\r\n]/.test(event.data)) {
      event.preventDefault();
      sync();
      replaceSelection(event.data);
      return;
    }
    if (["insertLineBreak", "insertParagraph"].includes(event.inputType)) {
      event.preventDefault();
      split();
      return;
    }
    if (!textEditable() && !pendingDraftEditable()) {
      event.preventDefault();
      return;
    }
    if (pendingDraftEditable() && !composing) {
      if (!inputIntents.hasCapacity) {
        event.preventDefault();
        report("대기 입력 한도에 도달했습니다. 반영 후 이어서 입력하세요.");
        return;
      }
      sync();
      queuedInputCapture = {
        before: input.value,
        selection: {
          startUnit: input.selectionStart,
          endUnit: input.selectionEnd,
          inputType: event.inputType
        },
        beforeSelection: { anchor: { ...anchor }, focus: { ...focus } }
      };
    }
    if (!pending && !composing && input.value === committed) {
      sync();
      draftSelection = { anchor: { ...anchor }, focus: { ...focus }, inputType: event.inputType };
    }
    if (["deleteContentBackward", "deleteContentForward"].includes(event.inputType) && mergeBoundary(event.inputType === "deleteContentBackward")) {
      event.preventDefault();
      return;
    }
    if (["insertLineBreak", "insertParagraph"].includes(event.inputType)) {
      event.preventDefault();
      split();
    }
  });
  listen(input, "input", () => {
    if (compositionInvalidated) {
      input.value = committed;
      renderer.preview(null);
      sync();
      return;
    }
    if (deferredComposition)
      return;
    if (!target)
      return;
    if (multiComposition && composing) {
      const projected = compositionProjection();
      if (!projected) {
        report("조합 문자열의 표시 경계를 확인할 수 없습니다.");
        return;
      }
      renderer.preview(projected.draft);
      paint();
      return;
    }
    if (!textEditable() && !pendingDraftEditable()) {
      if (typeof queryEditRange === "function" && renderer.paragraph(target)?.selectable && !multipleParagraphs()) {
        updateReadOnly();
        return;
      }
      input.value = committed;
      sync();
      return;
    }
    if (pendingDraftEditable() && !composing) {
      const capture = queuedInputCapture ?? {
        before: inputIntents.projected ?? pending?.afterText,
        selection: null,
        beforeSelection: null
      };
      queuedInputCapture = null;
      try {
        inputIntents.append(capture.before, input.value, capture.selection, capture.beforeSelection);
      } catch (error) {
        input.value = capture.before;
        renderer.preview(draftPreview());
        sync();
        report(`대기 입력을 추가하지 못했습니다: ${error.message}`);
        return;
      }
    }
    preview();
    if (!composing)
      pump();
  });
  listen(input, "compositionstart", () => {
    if (!target || !controls.ready())
      return;
    compositionInvalidated = false;
    if (historyInputPending()) {
      const token = historyIntents.composition();
      if (!token) {
        report("조합 입력을 위한 대기 공간이 없습니다.");
        return;
      }
      deferredComposition = {
        token,
        before: input.value,
        start: input.selectionStart,
        end: input.selectionEnd,
        direction: input.selectionDirection
      };
      composing = true;
      return;
    }
    if (historyPending) {
      input.readOnly = true;
      report("문단 변경 반영 뒤 조합 입력을 시작하세요.");
      return;
    }
    if (multipleParagraphs()) {
      if (!multiCompositionAvailable() || pending || historyPending || controls.busy() || input.value !== committed)
        return;
      multiComposition = { anchor: { ...anchor }, focus: { ...focus } };
      input.value = "";
      input.setSelectionRange(0, 0);
      composing = true;
      paint();
      return;
    }
    if (!textEditable() && !pendingDraftEditable())
      return;
    if (textPending() || inputIntents.size) {
      sync();
      compositionInputCapture = {
        before: input.value,
        selection: { startUnit: input.selectionStart, endUnit: input.selectionEnd },
        beforeSelection: { anchor: { ...anchor }, focus: { ...focus } }
      };
      queuedInputCapture = null;
    }
    if (!pending && input.value === committed) {
      sync();
      draftSelection = { anchor: { ...anchor }, focus: { ...focus } };
    }
    composing = true;
    paint();
  });
  listen(input, "compositionend", (event) => {
    if (compositionInvalidated) {
      compositionInvalidated = false;
      composing = false;
      multiComposition = null;
      input.value = committed;
      renderer.preview(null);
      sync();
      paint();
      return;
    }
    if (deferredComposition) {
      const capture = deferredComposition;
      const data = typeof event.data === "string" ? event.data : textChange(capture.before, input.value, {
        startUnit: capture.start,
        endUnit: capture.end
      })?.text ?? "";
      deferredComposition = null;
      composing = false;
      input.value = capture.before;
      input.setSelectionRange(capture.start, capture.end, capture.direction);
      const replies = deferredReplies;
      deferredReplies = [];
      for (const reply of replies)
        controller.message(reply);
      if (!historyIntents.completeComposition(capture.token, data)) {
        historyIntents.clear();
        report("조합 입력의 대기 문서를 확인할 수 없습니다.");
      }
      historyIntents.wake();
      return;
    }
    if (!composing)
      return;
    if (multiComposition) {
      const selected = multiComposition;
      const text = typeof event.data === "string" ? event.data : input.value;
      multiComposition = null;
      composing = false;
      input.value = committed;
      renderer.preview(null);
      setSelection(selected.anchor, selected.focus);
      if (text)
        replaceSelection(text);
      return;
    }
    composing = false;
    if (compositionInputCapture) {
      const capture = compositionInputCapture;
      compositionInputCapture = null;
      try {
        inputIntents.append(capture.before, input.value, capture.selection, capture.beforeSelection);
      } catch (error) {
        input.value = capture.before;
        renderer.preview(draftPreview());
        sync();
        report(`조합 입력을 추가하지 못했습니다: ${error.message}`);
        return;
      }
    }
    preview();
    queueMicrotask(pump);
    historyIntents.wake();
  });
  listen(input, "keydown", (event) => {
    if (!target || event.defaultPrevented || event.getModifierState?.("AltGraph") || composing || event.isComposing || event.keyCode === 229)
      return;
    const navigation = navigationIntent(event, platform);
    const key = navigation?.key ?? event.key;
    if (historyInputPending() && navigation && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(key)) {
      event.preventDefault();
      queueOrderedInput("navigation", JSON.stringify({
        key,
        paragraphEdge: navigation.paragraphEdge,
        extend: event.shiftKey === true,
        word: navigation.word
      }));
      return;
    }
    if (historyInputPending() && !event.altKey && !event.metaKey && !event.ctrlKey && ["Backspace", "Delete"].includes(key) && multipleParagraphs()) {
      event.preventDefault();
      queueOrderedInput(key === "Backspace" ? "deleteContentBackward" : "deleteContentForward");
      return;
    }
    if ((historyInputPending() || textAwaitingCommit()) && !event.altKey && !event.metaKey && !event.ctrlKey && key === "Enter") {
      event.preventDefault();
      queueOrderedInput(event.shiftKey ? "insertLineBreak" : "insertParagraph");
      return;
    }
    if (historyInputPending() && !event.metaKey && !event.ctrlKey && !event.altKey && (multipleParagraphs() || pending?.kind === "replace-paragraph-ranges") && Array.from(key).length === 1 && key.isWellFormed()) {
      event.preventDefault();
      queueOrderedInput("insertText", key);
      return;
    }
    if (structureTarget?.kind === "split" && historyPending && !event.metaKey && !event.ctrlKey && !event.altKey && Array.from(key).length === 1 && key.isWellFormed()) {
      event.preventDefault();
      queueSplitTyping(key);
      return;
    }
    if ((multipleParagraphs() || pending?.kind === "replace-paragraph-ranges") && !event.metaKey && !event.ctrlKey && !event.altKey && Array.from(key).length === 1 && key.isWellFormed()) {
      event.preventDefault();
      if (!queueReplacementTyping(key))
        replaceSelection(key);
      return;
    }
    if (multipleParagraphs() && !event.metaKey && !event.ctrlKey && !event.altKey && ["Backspace", "Delete"].includes(key)) {
      event.preventDefault();
      replaceSelection("");
      return;
    }
    if (multipleParagraphs() && (event.metaKey || event.ctrlKey) && !event.altKey && ["c", "x"].includes(key.toLowerCase())) {
      event.preventDefault();
      const options = { cut: key.toLowerCase() === "x" };
      if (typeof transferMultiParagraphSelection === "function")
        transferMultiParagraphSelection(options);
      else
        transferSelection(options);
      return;
    }
    if (multipleParagraphs() && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(key)) {
      if (!navigation)
        return;
      event.preventDefault();
      if (pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
        return;
      if (event.shiftKey) {
        const paragraph = renderer.paragraph(focus);
        if (!paragraph || !navigation)
          return;
        const next = extendedNavigation(key, navigation.paragraphEdge, true, navigation.word);
        if (next && renderer.selectionRanges?.(next.anchor, next.focus)) {
          resetTypingForUserSelection(next.anchor, next.focus);
          setSelection(next.anchor, next.focus, next.preferredX);
          reveal();
        }
        return;
      }
      const point = key === "ArrowLeft" || key === "ArrowRight" ? paragraphSelectionEdge(anchor, focus, key === "ArrowRight") : focus;
      if (!point || !renderer.paragraph(point))
        return;
      target = paragraphTarget(point);
      committed = renderer.paragraph(target).text;
      input.value = committed;
      resetTypingForUserSelection(point, point);
      setSelection(point, point);
      if (key !== event.key) {
        const next = extendedNavigation(key, navigation.paragraphEdge, false, navigation.word);
        if (next) {
          resetTypingForUserSelection(next.anchor, next.focus);
          setSelection(next.anchor, next.focus, next.preferredX);
        }
      }
      reveal();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && !event.defaultPrevented && ["b", "i", "u"].includes(key.toLowerCase())) {
      event.preventDefault();
      if (event.repeat)
        return;
      toggleCharacterProperty({ b: "bold", i: "italic", u: "underline" }[key.toLowerCase()]);
      return;
    }
    if (key === "Tab" && !event.metaKey && !event.ctrlKey && !event.altKey && (target?.createdCell || renderer.paragraph(target)?.tableCell)) {
      if (pending || historyPending || input.value !== committed || !controls.ready() || controls.busy()) {
        event.preventDefault();
        report("입력 반영이 끝난 뒤 셀을 이동하세요.");
        return;
      }
      const next = renderer.adjacentCell?.(target, event.shiftKey);
      if (!next)
        return;
      event.preventDefault();
      target = paragraphTarget(next);
      committed = renderer.paragraph(target).text;
      input.value = committed;
      updateReadOnly();
      resetTypingForUserSelection(next, next);
      setSelection(next, next);
      reveal();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && key.toLowerCase() === "a") {
      event.preventDefault();
      if (historyInputPending()) {
        queueOrderedInput("navigation", JSON.stringify({ key: "SelectAll" }));
        return;
      }
      resetTypingForUserSelection({ ...target, unit: 0 }, { ...target, unit: input.value.length });
      setSelection({ ...target, unit: 0 }, { ...target, unit: input.value.length });
      reveal();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && !event.altKey && ["z", "y"].includes(key.toLowerCase())) {
      event.preventDefault();
      travel(key.toLowerCase() === "y" || event.shiftKey ? "redo" : "undo");
      return;
    }
    if (key === "Enter") {
      event.preventDefault();
      if (event.metaKey || event.ctrlKey || event.altKey) {
        const intent = paragraphBreakShortcut(event);
        if (intent !== null)
          split(intent);
        else
          report("수정키+Enter 명령은 아직 지원하지 않습니다. 문단은 변경하지 않았습니다.");
        return;
      }
      if (multipleParagraphs() || event.shiftKey && target?.createdCell && renderer.paragraph(target)?.softLineBreakAvailable === true)
        replaceSelection(`
`);
      else
        split();
      return;
    }
    if (!event.metaKey && !event.ctrlKey && !event.altKey && ["Backspace", "Delete"].includes(key) && mergeBoundary(key === "Backspace")) {
      event.preventDefault();
      return;
    }
    if (!navigation)
      return;
    event.preventDefault();
    const next = extendedNavigation(key, navigation.paragraphEdge, event.shiftKey === true, navigation.word);
    if (!next)
      return;
    if (!event.shiftKey && !sameParagraph(target, next.focus)) {
      target = paragraphTarget(next.focus);
      committed = renderer.paragraph(target).text;
      input.value = committed;
    }
    resetTypingForUserSelection(next.anchor, next.focus);
    setSelection(next.anchor, next.focus, next.preferredX);
    reveal();
  });
  listen(input, "keyup", sync);
  listen(input, "select", sync);
  for (const kind of ["copy", "cut"])
    listen(input, kind, (event) => {
      if (!multipleParagraphs())
        return;
      event.preventDefault();
      if (typeof transferMultiParagraphSelection === "function") {
        if (!event.clipboardData)
          return;
        transferMultiParagraphSelection({
          cut: kind === "cut",
          clipboard: {
            writeText(text) {
              event.clipboardData.setData("text/plain", text);
              return Promise.resolve();
            }
          }
        });
        return;
      }
      const text = renderer.selectionText?.(anchor, focus);
      if (typeof text !== "string" || !event.clipboardData || pending || composing || historyPending || input.value !== committed)
        return;
      event.clipboardData.setData("text/plain", text);
      if (kind === "cut")
        replaceSelection("");
    });
  listen(input, "paste", (event) => {
    const text = event.clipboardData?.getData("text/plain");
    if (historyInputPending() && typeof text === "string" && !composing) {
      event.preventDefault();
      queueOrderedInput("insertFromPaste", text);
      return;
    }
    if (structureTarget?.kind === "split" && historyPending) {
      event.preventDefault();
      if (!queueSplitTyping(text))
        report("문단 분할 반영 뒤 여러 줄을 붙여넣으세요.");
      return;
    }
    if (!multipleParagraphs() && (typeof text !== "string" || !/[\r\n]/.test(text)))
      return;
    event.preventDefault();
    if (!multipleParagraphs())
      sync();
    if (typeof text === "string")
      replaceSelection(text);
  });
  const focusedSelection = () => {
    if (activeElement() === input && target && anchor && focus && sameParagraph(anchor, target) && sameParagraph(focus, target) && !composing && !pending && !historyPending && !inputIntents.size && input.value === committed && !controls.busy()) {
      input.setSelectionRange(Math.min(anchor.unit, focus.unit), Math.max(anchor.unit, focus.unit), anchor.unit > focus.unit ? "backward" : "forward");
    }
    paint();
  };
  const focusInput = () => {
    if (events.signal.aborted)
      return false;
    input.focus({ preventScroll: true });
    if (activeElement() !== input)
      return false;
    focusedSelection();
    return true;
  };
  listen(input, "focus", focusedSelection);
  listen(input, "blur", paint);
  const selectedRange = () => {
    if (target?.createdCell)
      return null;
    if (!target || multipleParagraphs() || composing || pending || historyPending || !controls.ready() || controls.busy() || input.value !== committed)
      return null;
    const startUnit = snapUnit(committed, input.selectionStart);
    const endUnit = snapUnit(committed, input.selectionEnd, true);
    const range = sourceTextChange({ startUnit, endUnit, text: "" }, renderer.paragraph(target)?.sourceOffsets);
    return {
      section: target.section,
      paragraph: target.paragraph,
      startUnit: range.startUnit,
      endUnit: range.endUnit
    };
  };
  const canInsertParagraphBreak = () => !events.signal.aborted && paragraphBreakAvailable && structureAvailable && !inputIntents.size && drag === null && selectedRange() !== null && renderer.paragraph(target)?.selectionOwner === `section:${target.section}:body` && (textEditable() || Boolean(splitQueryAvailable && editRange() && splitPermission.allowed(editRange())));
  const canSetTypingProperties = () => Boolean(selectedRange()) && input.selectionStart === input.selectionEnd && textEditable() && renderer.characterPropertyTextAvailable?.() === true && (!typingFont || renderer.namedFontPropertyTextAvailable?.() === true);
  const resetExternalSelection = (controller, origin = "canvas") => {
    if (historyRevision !== null && anchor && focus)
      historySelections.remember(historyRevision, { anchor, focus });
    const available = historyAvailable, structure = structureAvailable, merge = mergeAvailable, splitQuery = splitQueryAvailable, breaks = paragraphBreakAvailable;
    controller.reset({ preserveHistory: true, selectionOrigin: origin });
    historyAvailable = available;
    structureAvailable = structure;
    mergeAvailable = merge;
    splitQueryAvailable = splitQuery;
    paragraphBreakAvailable = breaks;
  };
  const settledSelection = (allowEmpty = false) => {
    if (events.signal.aborted || !target || !anchor || !focus || composing || pending || historyPending || controls.busy() || input.value !== committed)
      return null;
    const text = multipleParagraphs() ? renderer.selectionText?.(anchor, focus) : committed.slice(snapUnit(committed, input.selectionStart), snapUnit(committed, input.selectionEnd, true));
    if (typeof text !== "string" || !allowEmpty && !text)
      return null;
    return {
      text,
      allowEmpty,
      anchor,
      focus,
      target,
      committed,
      revision: historyRevision,
      start: input.selectionStart,
      end: input.selectionEnd
    };
  };
  const selectionCurrent = (saved) => {
    const current = settledSelection(saved.allowEmpty);
    return current !== null && current.anchor === saved.anchor && current.focus === saved.focus && current.target === saved.target && current.committed === saved.committed && current.revision === saved.revision && current.start === saved.start && current.end === saved.end && current.text === saved.text;
  };
  const selectionTextEditAvailable = () => {
    if (!controls.ready())
      return false;
    if (!multipleParagraphs())
      return textEditable();
    if (renderer.paragraphReplacementAvailable?.() === false)
      return false;
    const ranges = renderer.replacementRanges?.(anchor, focus);
    return Boolean(ranges?.length && ranges.every((range) => renderer.paragraph(range)?.editable === true));
  };
  const replaceSelectedText = (text, guard = null) => {
    if (typeof text !== "string" || !text.isWellFormed())
      return false;
    if (/[\r\n]/.test(text) || multipleParagraphs())
      return replaceSelection(text, guard);
    if (!target || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy() || !textEditable())
      return false;
    const start = snapUnit(committed, input.selectionStart), end = snapUnit(committed, input.selectionEnd, true);
    const next = committed.slice(0, start) + text + committed.slice(end);
    if (next === committed)
      return true;
    const previous = { anchor: { ...anchor }, focus: { ...focus } };
    draftSelection = previous;
    input.value = next;
    input.setSelectionRange(start + text.length, start + text.length);
    pump({ startUnit: start, endUnit: end, text });
    if (!pending) {
      input.value = committed;
      draftSelection = null;
      setSelection(previous.anchor, previous.focus);
      return false;
    }
    preview();
    return true;
  };
  const transferableSelection = (cut, multiOnly) => {
    const saved = settledSelection();
    if (!saved || cut && !selectionTextEditAvailable())
      return null;
    if (multiOnly && (!multipleParagraphs() || saved.text.includes("￼") || cut && renderer.paragraphReplacementAvailable?.() !== true))
      return null;
    return saved;
  };
  const captureTransferSelection = ({
    cut = false,
    clipboard = environment.clipboard ?? realm.navigator?.clipboard,
    multiOnly = false,
    isCurrent = null
  } = {}) => {
    const saved = transferableSelection(cut, multiOnly);
    if (!saved)
      return null;
    const current = () => isCurrent ? selectionCurrent(saved) && isCurrent() === true && selectionCurrent(saved) : selectionCurrent(saved);
    let used = false;
    return () => {
      if (used)
        return Promise.resolve(false);
      used = true;
      return transferSelectedText({
        clipboard,
        text: saved.text,
        isCurrent: current,
        cut,
        remove: () => replaceSelectedText("", isCurrent ? current : null),
        report
      });
    };
  };
  const transferSelection = (options = {}) => captureTransferSelection(options)?.() ?? Promise.resolve(false);
  const startFormattingPaint = (bindingCurrent, rejectedCurrent) => {
    if (!pending || !RANGE_FORMATTING_KINDS.includes(pending.kind) || historyPaintBarrier.pending)
      return Promise.resolve(false);
    let resolve;
    const promise = new Promise((done) => {
      resolve = done;
    });
    formattingPaint = {
      pending,
      phase: "native",
      bindingCurrent,
      rejectedCurrent,
      resolve,
      promise,
      report: null
    };
    historyPaintBarrier.begin();
    canvas.dataset.selectionAuthority = "formatting-pending";
    input.setAttribute("aria-busy", "true");
    return promise;
  };
  const requestAtomicFormatting = (request, guard) => {
    if (!multipleParagraphs() || !settledSelection() || !controls.ready() || controls.busy() || guard() !== true)
      return false;
    pending = { kind: "formatting-patch", anchor: { ...anchor }, focus: { ...focus } };
    if (!controls.request({ kind: "formatting-patch", origin: "canvas", request })) {
      pending = null;
      return false;
    }
    input.setAttribute("aria-busy", "true");
    return true;
  };
  const captureCaretFormatting = (isCurrent, postCurrent, ownedModalCurrent) => {
    const saved = settledSelection(true);
    if (!saved || saved.target.createdCell || multipleParagraphs() || saved.start !== saved.end || saved.anchor.unit !== saved.focus.unit || !sameParagraph(saved.anchor, saved.focus))
      return null;
    let expectedTypingRevision = typingIntentRevision;
    const stable = (post = false) => {
      const modal = ownedModalCurrent?.() === true;
      if (!post && !modal && !selectionCurrent(saved))
        return false;
      return Number.isSafeInteger(expectedTypingRevision) && typingIntentRevision === expectedTypingRevision && !events.signal.aborted && !composing && !pending && !historyPending && !inputIntents.size && !historyInputPending() && drag === null && controls.ready() && !controls.busy() && target === saved.target && anchor === saved.anchor && focus === saved.focus && historyRevision === saved.revision && committed === saved.committed && input.value === saved.committed && renderer.paragraph(target)?.text === saved.committed && (post ? postCurrent() : isCurrent()) === true && target === saved.target && anchor === saved.anchor && focus === saved.focus && input.value === saved.committed && !composing && !pending && !controls.busy() && typingIntentRevision === expectedTypingRevision;
    };
    if (!stable())
      return null;
    const caretEditable = () => {
      if (wholeTextEditable())
        return true;
      try {
        const mapped = sourceTextChange({ startUnit: saved.anchor.unit, endUnit: saved.anchor.unit, text: "" }, renderer.paragraph(target)?.sourceOffsets);
        return rangePermission.allowed({
          ...target,
          startUnit: mapped.startUnit,
          endUnit: mapped.endUnit
        });
      } catch {
        return false;
      }
    };
    const supported = (kind) => {
      if (!stable() || !caretEditable())
        return false;
      if (kind === "character-properties")
        return renderer.characterPropertyTextAvailable?.() === true && (!typingFont || renderer.namedFontPropertyTextAvailable?.() === true);
      return kind === "font-name" && renderer.namedFontTextAvailable?.() === true && (!typingProperties || renderer.namedFontPropertyTextAvailable?.() === true);
    };
    let used = false, accepted = false;
    return Object.freeze({
      current: () => !used && stable(),
      supported,
      typing: Object.freeze({
        properties: typingProperties && sameParagraph(typingProperties, target) ? Object.freeze({ ...typingProperties.properties }) : null,
        font: typingFont && sameParagraph(typingFont, target) ? Object.freeze({ language: typingFont.language, name: typingFont.name }) : null
      }),
      request(intent) {
        if (used)
          return false;
        const owned = ownCaretTypingIntent(intent);
        if (!owned || !supported(owned.kind) || !stable())
          return false;
        used = true;
        if (owned.kind === "character-properties")
          accepted = setTypingProperties(owned.properties, (revision) => {
            expectedTypingRevision = revision;
          });
        else {
          changedTypingIntent();
          typingFont = { ...target, language: owned.language, name: owned.name };
          expectedTypingRevision = typingIntentRevision;
          accepted = true;
          report("다음 입력의 글꼴을 지정했습니다. 입력 전에는 문서가 변경되지 않습니다.");
        }
        return accepted;
      },
      appliedCurrent: () => used && accepted && stable(true)
    });
  };
  const captureSelectionFormatting = (isCurrent = () => true, observe = () => ({}), ownedMultiFormattingModalCurrent = () => false) => {
    if (!multipleParagraphs())
      return null;
    const saved = settledSelection();
    if (!saved)
      return null;
    const formattingSelectionCurrent = () => {
      if (ownedMultiFormattingModalCurrent() !== true)
        return selectionCurrent(saved);
      const value = settledSelection(saved.allowEmpty);
      return value !== null && multipleParagraphs() && value.anchor === saved.anchor && value.focus === saved.focus && value.target === saved.target && value.committed === saved.committed && value.revision === saved.revision && value.text === saved.text && ownedMultiFormattingModalCurrent() === true;
    };
    const current = () => formattingSelectionCurrent() && isCurrent() === true && formattingSelectionCurrent();
    const observed = observe(saved.anchor, saved.focus);
    const observation = Object.freeze({ ...observed });
    const supported = (kind) => {
      const readers = {
        "character-properties": "characterPropertyRangesAvailable",
        underline: "characterUnderlineRangesAvailable",
        strike: "characterStrikeRangesAvailable",
        "text-color": "textColorRangesAvailable",
        "font-name": "characterFontNameRangesAvailable",
        "font-id": "characterFontRangesAvailable",
        shade: "characterShadeRangesAvailable",
        outline: "characterOutlineRangesAvailable",
        effect: "characterEffectRangesAvailable"
      };
      return Object.hasOwn(readers, kind) && renderer[readers[kind]]?.() === true;
    };
    if (!current())
      return null;
    let used = false;
    return Object.freeze({
      observation,
      supported,
      current,
      request(intent) {
        if (used)
          return false;
        used = true;
        if (!current() || !intent || typeof intent !== "object" || !supported(intent.kind))
          return false;
        const kind = intent.kind;
        const keys = {
          "character-properties": ["kind", "properties"],
          underline: ["kind", "underlineKind"],
          strike: ["kind", "enabled"],
          "text-color": ["kind", "color"],
          "font-name": ["kind", "language", "name"],
          "font-id": ["kind", "language", "fontId"],
          shade: ["kind", "color"],
          outline: ["kind", "outlineKind"],
          effect: ["kind", "effect", "enabled", "exclusive"]
        };
        if (!Object.hasOwn(keys, kind) || Object.keys(intent).some((key) => !keys[kind].includes(key)))
          return false;
        try {
          if (kind === "character-properties") {
            const properties = { ...intent.properties };
            characterPropertyArgs(properties);
            return current() && setCharacterProperties(properties, current) === true;
          }
          if (kind === "underline") {
            const value = intent.underlineKind;
            if (!["none", "bottom", "center", "top"].includes(value))
              return false;
            return current() && setCharacterUnderline(value, current) === true;
          }
          if (kind === "strike") {
            const enabled = intent.enabled;
            if (typeof enabled !== "boolean")
              return false;
            const ranges = renderer.selectionRanges?.(saved.anchor, saved.focus);
            if (!ranges?.length || !current())
              return false;
            pending = {
              kind: "character-strike-ranges",
              anchor: { ...anchor },
              focus: { ...focus }
            };
            if (!controls.request({ kind: pending.kind, origin: "canvas", ranges, enabled })) {
              pending = null;
              return false;
            }
            input.setAttribute("aria-busy", "true");
            return true;
          }
          if (kind === "text-color") {
            const color = intent.color;
            characterColorArg(color);
            return current() && setCharacterTextColor(color, current) === true;
          }
          if (kind === "font-name") {
            const { language, name } = intent;
            characterFontNameArgs(language, name);
            return current() && setCharacterFontName(language, name, current) === true;
          }
          if (kind === "font-id") {
            const { language, fontId: id } = intent;
            if (!FONT_LANGUAGES.includes(language) || !Number.isInteger(id) || id < 0 || id > 4294967295)
              return false;
            return current() && setCharacterFont(language, id, current) === true;
          }
          if (kind === "shade") {
            const color = intent.color;
            characterShadeArgs(color);
            return current() && setCharacterShade(color, current) === true;
          }
          if (kind === "outline") {
            const value = intent.outlineKind;
            hwp5CharacterOutlineArg(value);
            return current() && controller.setCharacterOutline(value, current) === true;
          }
          if (kind === "effect") {
            const { effect, enabled } = intent, exclusive = intent.exclusive ?? false;
            characterEffectArgs(effect, enabled);
            characterEffectMode(exclusive);
            return current() && controller.setCharacterEffect(effect, enabled, exclusive, current) === true;
          }
        } catch {
          return false;
        }
        return false;
      }
    });
  };
  const captureRangeFormatting = (property, isCurrent = () => true) => {
    if (!["underline", "strike"].includes(property) || !multipleParagraphs())
      return null;
    const saved = settledSelection();
    if (!saved)
      return null;
    const available = () => property === "underline" ? renderer.characterUnderlineRangesAvailable?.() === true : renderer.characterStrikeRangesAvailable?.() === true;
    const supported = available();
    const observed = selectedCharacterPropertyState(property);
    const value = typeof observed === "boolean" || observed === "mixed" ? observed : null;
    if (!selectionCurrent(saved))
      return null;
    let used = false;
    return Object.freeze({
      value,
      reason: !supported ? "RangeFormattingUnsupported" : value === null ? "RangeFormattingUnknown" : null,
      request() {
        if (used)
          return false;
        used = true;
        if (!selectionCurrent(saved) || !available() || value === null || selectedCharacterPropertyState(property) !== value || !selectionCurrent(saved))
          return false;
        return toggleCharacterProperty(property, () => selectionCurrent(saved) && isCurrent() === true && selectionCurrent(saved)) === true;
      }
    });
  };
  const canDeleteSelection = () => settledSelection() !== null && selectionTextEditAvailable();
  const controller = {
    focusInput,
    canInsertParagraphBreak,
    insertParagraphBreak(kind) {
      const intent = paragraphBreakIntent({ kind: "split", breakBefore: kind });
      if (!canInsertParagraphBreak())
        return false;
      const accepted = split(intent) === true;
      if (accepted)
        input.focus({ preventScroll: true });
      return accepted;
    },
    canDeleteSelection,
    deleteSelection() {
      if (!canDeleteSelection())
        return false;
      const accepted = replaceSelectedText("");
      if (accepted)
        input.focus({ preventScroll: true });
      return accepted;
    },
    canPasteSelection() {
      return typeof clipboard?.readText === "function" && settledSelection(true) !== null && selectionTextEditAvailable();
    },
    canPasteInput() {
      return settledSelection(true) !== null && selectionTextEditAvailable();
    },
    pasteSelection({ clipboard = environment.clipboard ?? realm.navigator?.clipboard } = {}) {
      const saved = settledSelection(true);
      if (!saved || !selectionTextEditAvailable())
        return Promise.resolve(false);
      return pasteClipboardText({
        clipboard,
        isCurrent: () => selectionCurrent(saved) && selectionTextEditAvailable(),
        replace: replaceSelectedText,
        report,
        onDenied: () => input.focus({ preventScroll: true })
      });
    },
    hasMultiParagraphSelection: () => multipleParagraphs(),
    captureRangeFormatting,
    captureSelectionFormatting,
    captureCaretFormatting,
    startFormattingPaint,
    requestAtomicFormatting,
    currentFormattingSelection: () => anchor && focus ? { anchor: { ...anchor }, focus: { ...focus } } : null,
    captureTransferSelection,
    canTransferSelection(cut = false, multiOnly = false, port = clipboard) {
      return typeof port?.writeText === "function" && transferableSelection(cut, multiOnly) !== null;
    },
    transferSelection,
    selectTextRange({ section, paragraph, startUnit, endUnit, affinity = "forward" }, { focusInput = true, selectionOrigin: origin = "canvas" } = {}) {
      if (!["forward", "backward"].includes(affinity))
        return false;
      if (composing || pending || historyPending || drag !== null || input.value !== committed || controls.busy())
        return false;
      const next = { section, paragraph }, row = renderer.paragraph(next);
      if (!row || row.clipped || !selectableText(row) || ![startUnit, endUnit].every(Number.isInteger) || startUnit < 0 || endUnit < startUnit || endUnit > row.text.length)
        return false;
      if (snapUnit(row.text, startUnit) !== startUnit || snapUnit(row.text, endUnit) !== endUnit)
        return false;
      if (!caretGeometry(renderer.layout(), { ...next, unit: startUnit }))
        return false;
      target = next;
      committed = row.text;
      input.value = committed;
      input.disabled = false;
      if (origin === "canvas")
        resetTypingForUserSelection({ ...next, unit: affinity === "backward" ? endUnit : startUnit }, { ...next, unit: affinity === "backward" ? startUnit : endUnit });
      setSelection({ ...next, unit: affinity === "backward" ? endUnit : startUnit }, { ...next, unit: affinity === "backward" ? startUnit : endUnit }, null, origin);
      if (focusInput)
        input.focus({ preventScroll: true });
      paint();
      reveal();
      return true;
    },
    replaceSelection,
    replaceSelectedText,
    selectedRange,
    selectedCharacterPropertyState,
    selectedCharacterPropertyRanges,
    selectedCharacterSize() {
      if (composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
        return null;
      if (multipleParagraphs())
        return renderer.selectionCharacterSize?.(anchor, focus) ?? null;
      if (!selectedRange())
        return null;
      if (input.selectionStart === input.selectionEnd) {
        const properties = typingProperties && sameParagraph(typingProperties, target) ? typingProperties.properties : null;
        return characterTypingSize(committed, input.selectionStart, properties, (start, end) => renderer.characterSize?.(target, start, end));
      }
      return renderer.characterSize?.(target, snapUnit(committed, input.selectionStart), snapUnit(committed, input.selectionEnd, true)) ?? null;
    },
    canSetTypingProperties,
    toggleCharacterProperty,
    selectedParagraphFormat() {
      if (!target || multipleParagraphs() || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
        return null;
      const paragraph = renderer.paragraph(target);
      return !paragraph?.clipped && Number.isInteger(paragraph?.paraShapeId) ? {
        ...target,
        paraShapeId: paragraph.paraShapeId,
        paragraphShape: paragraph.paragraphShape ? { ...paragraph.paragraphShape } : undefined
      } : null;
    },
    tableCreationSelection() {
      if (!target || target.createdCell || multipleParagraphs() || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy() || renderer.tableCreationAvailable?.() !== true || input.selectionStart !== input.selectionEnd)
        return null;
      const paragraph = renderer.paragraph(target);
      if (!paragraph || paragraph.clipped)
        return null;
      const unit = snapUnit(committed, input.selectionStart);
      const source = sourceTextChange({ startUnit: unit, endUnit: unit, text: "" }, paragraph.sourceOffsets);
      return { section: target.section, paragraph: target.paragraph, unit: source.startUnit };
    },
    tableCreationResources() {
      return renderer.tableCreationResources?.() ?? null;
    },
    tableCreationWidthHint() {
      return this.tableCreationSelection() ? renderer.tableCreationWidthHint?.(target) ?? null : null;
    },
    insertTable(options) {
      const selection = this.tableCreationSelection();
      if (!selection)
        return false;
      pending = {
        kind: "insert-table",
        start: input.selectionStart,
        end: input.selectionEnd,
        beforeSelection: { anchor: { ...anchor }, focus: { ...focus } }
      };
      if (!controls.request({ kind: "insert-table", origin: "canvas", ...selection, options })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    },
    setParagraphFormat(paraShapeId) {
      const paragraph = this.selectedParagraphFormat();
      if (!paragraph)
        return false;
      pending = { kind: "paragraph-format", start: input.selectionStart, end: input.selectionEnd };
      if (!controls.request({
        kind: "paragraph-format",
        origin: "canvas",
        section: paragraph.section,
        paragraph: paragraph.paragraph,
        paraShapeId
      })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    },
    setParagraphAlignment(alignment) {
      const paragraph = this.selectedParagraphFormat();
      if (!paragraph)
        return false;
      pending = {
        kind: "paragraph-alignment",
        start: input.selectionStart,
        end: input.selectionEnd
      };
      if (!controls.request({
        kind: "paragraph-alignment",
        origin: "canvas",
        section: paragraph.section,
        paragraph: paragraph.paragraph,
        alignment
      })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    },
    setParagraphSpacing(type, value) {
      const paragraph = this.selectedParagraphFormat();
      if (!paragraph)
        return false;
      pending = { kind: "paragraph-spacing", start: input.selectionStart, end: input.selectionEnd };
      if (!controls.request({
        kind: "paragraph-spacing",
        origin: "canvas",
        section: paragraph.section,
        paragraph: paragraph.paragraph,
        type,
        value
      })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    },
    setParagraphMargins(margins) {
      const paragraph = this.selectedParagraphFormat();
      if (!paragraph)
        return false;
      pending = { kind: "paragraph-margins", start: input.selectionStart, end: input.selectionEnd };
      if (!controls.request({
        kind: "paragraph-margins",
        origin: "canvas",
        section: paragraph.section,
        paragraph: paragraph.paragraph,
        margins
      })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    },
    formatSelection(charShapeId) {
      const range = selectedRange();
      if (!range || range.startUnit === range.endUnit)
        return false;
      pending = { kind: "format", start: input.selectionStart, end: input.selectionEnd };
      if (!controls.request({ kind: "format", origin: "canvas", ...range, charShapeId })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    },
    setCharacterProperties,
    setCharacterUnderline,
    setCharacterUnderlineColor,
    setCharacterStrikeColor,
    setCharacterShade,
    setCharacterOutline(kind, guard = null) {
      if (!characterOutlineKindAvailable(kind))
        return false;
      if (multipleParagraphs()) {
        const ranges = selectedOutlineRanges();
        if (!ranges?.some((range) => range.startUnit < range.endUnit))
          return false;
        if (guard && guard() !== true)
          return false;
        pending = { kind: "character-outline-ranges", anchor: { ...anchor }, focus: { ...focus } };
        if (!controls.request({ kind: pending.kind, origin: "canvas", ranges, outlineKind: kind })) {
          pending = null;
          return false;
        }
        input.setAttribute("aria-busy", "true");
        return true;
      }
      if (renderer.characterOutlineAvailable?.() !== true)
        return false;
      const range = selectedRange();
      if (!range || range.startUnit === range.endUnit)
        return false;
      pending = { kind: "character-outline", start: input.selectionStart, end: input.selectionEnd };
      if (!controls.request({ kind: pending.kind, origin: "canvas", ...range, outlineKind: kind })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    },
    selectedCharacterOutline: () => selectedOutlineValue(),
    selectedCharacterOutlineKind: () => selectedOutlineValue(true),
    selectedOutlineRanges,
    characterOutlineKindAvailable,
    setCharacterEffect(effect, enabled, exclusive = false, guard = null) {
      try {
        characterEffectArgs(effect, enabled);
        characterEffectMode(exclusive);
      } catch {
        return false;
      }
      const ranges = selectedEffectRanges(exclusive);
      if (!ranges?.some((range) => range.startUnit < range.endUnit))
        return false;
      if (multipleParagraphs()) {
        if (guard && guard() !== true)
          return false;
        pending = { kind: "character-effect-ranges", anchor: { ...anchor }, focus: { ...focus } };
        if (!controls.request({
          kind: pending.kind,
          origin: "canvas",
          ranges,
          effect,
          enabled,
          ...exclusive ? { exclusive: true } : {}
        })) {
          pending = null;
          return false;
        }
        input.setAttribute("aria-busy", "true");
        return true;
      }
      const range = ranges[0];
      pending = { kind: "character-effect", start: input.selectionStart, end: input.selectionEnd };
      if (!controls.request({
        kind: pending.kind,
        origin: "canvas",
        ...range,
        effect,
        enabled,
        ...exclusive ? { exclusive: true } : {}
      })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    },
    selectedEffectRanges,
    selectedCharacterEffect(effect) {
      if (composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
        return null;
      if (multipleParagraphs())
        return renderer.characterEffectState?.(anchor, focus, effect) ?? null;
      if (!selectedRange() || input.selectionStart === input.selectionEnd)
        return null;
      return renderer.characterEffect?.(target, snapUnit(committed, input.selectionStart), snapUnit(committed, input.selectionEnd, true), effect) ?? null;
    },
    selectedShadeRanges,
    selectedCharacterFontIds(language) {
      if (composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
        return null;
      if (multipleParagraphs())
        return renderer.selectionFontIds?.(anchor, focus, language) ?? null;
      if (!selectedRange())
        return null;
      if (input.selectionStart === input.selectionEnd) {
        if (typingFont && sameParagraph(typingFont, target))
          return null;
        const span = typingSourceSpan(committed, input.selectionStart);
        return span ? renderer.characterFontIds?.(target, span.start, span.end, language) ?? null : null;
      }
      return renderer.characterFontIds?.(target, snapUnit(committed, input.selectionStart), snapUnit(committed, input.selectionEnd, true), language) ?? null;
    },
    selectedCharacterShade() {
      if (composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
        return null;
      if (multipleParagraphs())
        return renderer.characterShadeState?.(anchor, focus) ?? null;
      if (!selectedRange() || input.selectionStart === input.selectionEnd)
        return null;
      return renderer.characterShade?.(target, snapUnit(committed, input.selectionStart), snapUnit(committed, input.selectionEnd, true)) ?? null;
    },
    setCharacterFont,
    setCharacterFontName,
    selectedCharacterRange: selectedRange,
    selectedFontRanges,
    selectedFontNameRanges,
    setCharacterTextColor,
    selectedTextColorRanges,
    selectedCell() {
      if (!target || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
        return null;
      return renderer.cell?.(target) ?? null;
    },
    selectedFormula() {
      if (!target || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
        return null;
      return renderer.formula?.(target) ?? null;
    },
    setCellSize(width, height) {
      const cell = this.selectedCell();
      if (!cell)
        return false;
      pending = { kind: "cell-size", start: input.selectionStart, end: input.selectionEnd };
      if (!controls.request({
        kind: "cell-size",
        origin: "canvas",
        section: cell.section,
        listNode: cell.listNode,
        width,
        height
      })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    },
    setTableColumnWidth(width, height) {
      if (!this.selectedCell() || !Number.isInteger(width) || width < 1 || width > 4294967295)
        return false;
      if (height !== undefined && (!Number.isInteger(height) || height < 0 || height > 4294967295))
        return false;
      const cell = renderer.cell?.(target, { includeTableNode: true });
      if (!cell || !Number.isInteger(cell.tableNode))
        return false;
      pending = {
        kind: "table-column-width",
        start: input.selectionStart,
        end: input.selectionEnd
      };
      if (!controls.request({
        kind: "table-column-width",
        origin: "canvas",
        section: cell.section,
        tableNode: cell.tableNode,
        listNode: cell.listNode,
        width,
        expectedWidth: cell.width,
        ...height === undefined ? {} : { height, expectedHeight: cell.height }
      })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    },
    selectedPicture() {
      if (!pictureResizeAvailable || composing || pending || historyPending || input.value !== committed || !controls.ready() || controls.busy())
        return null;
      return pictureResizeTarget(renderer.selectedPicture?.());
    },
    resizePicture(width, height) {
      const picture = this.selectedPicture();
      if (!picture || ![width, height].every((value) => Number.isInteger(value) && value > 0 && value <= 4294967295))
        return false;
      pending = { kind: "picture-resize" };
      if (!controls.request({
        kind: "picture-resize",
        origin: "canvas",
        section: picture.section,
        pictureNode: picture.resizeRecordNode ?? picture.pictureNode,
        width,
        height
      })) {
        pending = null;
        return false;
      }
      input.setAttribute("aria-busy", "true");
      return true;
    },
    initializeCapabilities(value = {}) {
      this.message({ ...value, kind: "enable", origin: "surface-init" });
    },
    flushComposition() {
      if (composing || pending || historyPending || inputIntents.size || historyInputPending())
        return "blocked";
      if (target && input.value !== committed) {
        pump();
        return "blocked";
      }
      return "unchanged";
    },
    cancelComposition() {
      const capture = deferredComposition, replies = deferredReplies;
      deferredComposition = null;
      deferredReplies = [];
      historyIntents.clear();
      clearInputIntents();
      composing = false;
      multiComposition = null;
      input.value = capture?.before ?? committed;
      if (capture)
        input.setSelectionRange(capture.start, capture.end, capture.direction);
      for (const reply of replies)
        this.message(reply);
      renderer.preview(null);
      sync();
    },
    consumeDeferredTypingProjection() {
      const check = deferredTypingCheck;
      deferredTypingCheck = null;
      return check?.() === true;
    },
    historyRoute,
    settled: () => !composing && !pending && !inputIntents.size && !historyPending && !historyInputPending() && (!target || input.value === committed),
    canHistory: () => historyAvailable && !composing && !pending && !inputIntents.size && !historyPending && !historyInputPending() && (!target || input.value === committed) && controls.ready() && !controls.busy(),
    history: (kind) => !historyIntents.size && performHistory(kind),
    canRequestHistory,
    historyModelReady,
    requestHistory: travel,
    reset({ preserveHistory = false, selectionOrigin: origin = "canvas" } = {}) {
      ackProjectionSequence++;
      deferredTypingCheck = null;
      historyPresentationReport = null;
      const interruptedFormatting = formattingPaint;
      formattingPaint = null;
      interruptedFormatting?.resolve(false);
      selectionOrigin = origin;
      if (events.signal.aborted)
        return;
      historyModelWitness = null;
      historyModelPreparation = null;
      historyPaintBarrier.reset();
      canvas.dataset.selectionAuthority = "current";
      historyIntents.clear();
      deferredComposition = null;
      deferredReplies = [];
      if (!preserveHistory)
        pictureResizeAvailable = false;
      renderer.selectPicture?.(null);
      rangePermission.invalidate();
      splitPermission.invalidate();
      changedTypingIntent();
      typingFont = null;
      changedTypingIntent();
      typingProperties = null;
      draftSelection = null;
      clearInputIntents();
      if (drag !== null && canvas.hasPointerCapture(drag))
        canvas.releasePointerCapture(drag);
      composing = false;
      multiComposition = null;
      drag = null;
      target = null;
      pending = null;
      anchor = null;
      focus = null;
      committed = "";
      preferredX = null;
      historyAvailable = false;
      historyPending = false;
      structureAvailable = false;
      mergeAvailable = false;
      structureTarget = null;
      splitQueryAvailable = false;
      paragraphBreakAvailable = false;
      if (!preserveHistory) {
        historyRevision = null;
        historySelections.reset();
      }
      input.value = "";
      input.disabled = true;
      input.setAttribute("aria-busy", "false");
      canvas.style.cursor = "default";
      report("");
      renderer.preview(null);
      paint();
    },
    external(message) {
      if (events.signal.aborted)
        return;
      if (message.kind === "set-edit-window")
        return;
      if (message.origin !== "canvas" && !["enable", "save"].includes(message.kind)) {
        resetExternalSelection(this, message.origin === "core" ? "core" : "canvas");
      }
    },
    message(message) {
      if (events.signal.aborted)
        return;
      const ackSequence = ++ackProjectionSequence;
      deferredTypingCheck = null;
      const pendingFormattingReply = formattingPaint && formattingPaint.pending === pending && message.origin === "canvas" && message.kind === pending?.kind ? formattingPaint : null;
      const preserveRejectedFormattingInput = pendingFormattingReply?.pending.kind === "formatting-patch" && message.error && message.applied === false && pendingFormattingReply.rejectedCurrent?.() === true;
      const pendingHistoryReply = historyPaintBarrier.pending && historyPending && message.origin === "canvas" && ["undo", "redo"].includes(message.kind);
      if (deferredComposition && composing && !["enable", "save", "query-edit-range", "query-split-range", "set-edit-window"].includes(message.kind)) {
        deferredReplies.push(message);
        return;
      }
      if (message.error && !["save", "query-edit-range", "query-split-range"].includes(message.kind) && !pendingHistoryReply && !preserveRejectedFormattingInput)
        historyIntents.clear();
      historyIntents.wake();
      if (message.kind === "set-edit-window") {
        if (!message.error)
          resetExternalSelection(this);
        return;
      }
      if (message.kind === "enable" && !message.error)
        pictureResizeAvailable = message.pictureResizeAvailable === true;
      if (message.kind === "query-split-range") {
        if (!splitPermission.accept(message) && !splitPermission.reject(message))
          return;
        if (message.error)
          report(`문단 분할 범위를 확인하지 못했습니다: ${message.error}`);
        updateReadOnly();
        return;
      }
      if (message.kind === "query-edit-range") {
        if (!rangePermission.accept(message) && !rangePermission.reject(message))
          return;
        if ((!message.allowed || message.error) && (input.value !== committed || inputIntents.size)) {
          clearInputIntents();
          input.value = committed;
          sync();
          report("이 범위는 편집할 수 없습니다.");
        }
        if (message.error)
          report(`입력 범위를 확인하지 못했습니다: ${message.error}`);
        updateReadOnly();
        if (message.allowed && !message.error && input.value !== committed) {
          preview();
          pump();
        }
        return;
      }
      if (message.kind !== "save")
        rangePermission.invalidate();
      if (message.kind !== "save")
        splitPermission.invalidate();
      const revision = message.historyRevision;
      const versioned = Number.isInteger(revision) && revision >= 0 && revision < 4294967295;
      const travelMessage = ["undo", "redo"].includes(message.kind);
      const revisionChanged = versioned && revision !== historyRevision;
      if (versioned && !message.error) {
        try {
          historySelections.retain(message.historyRevisions, revision);
        } catch {
          const available = historyAvailable, structure = structureAvailable, merge = mergeAvailable, splitQuery = splitQueryAvailable, breaks = paragraphBreakAvailable;
          this.reset();
          historyAvailable = available;
          structureAvailable = structure;
          mergeAvailable = merge;
          splitQueryAvailable = splitQuery;
          paragraphBreakAvailable = breaks;
          report("문서 이력 응답의 선택 정보를 확인할 수 없습니다. 문단을 다시 선택하세요.");
          return;
        }
      }
      if (versioned && !message.error && !travelMessage && historyRevision !== null && revisionChanged && anchor && focus) {
        historySelections.remember(historyRevision, pending?.beforeSelection ?? (pending?.anchor ? { anchor: pending.anchor, focus: pending.focus } : { anchor, focus }));
      }
      try {
        if (["undo", "redo", "merge"].includes(message.kind)) {
          changedTypingIntent();
          typingFont = null;
          changedTypingIntent();
          typingProperties = null;
        }
        if (message.kind === "save") {
          pump();
          return;
        }
        if (message.applied && message.error) {
          this.reset();
          return;
        }
        if (message.origin === "canvas" && message.kind === "picture-resize" && pending?.kind === "picture-resize") {
          pending = null;
          input.setAttribute("aria-busy", "false");
          report(message.error ? `그림 크기 변경 실패: ${message.error}` : "그림 크기를 변경했습니다.");
          return;
        }
        if (message.kind === "enable") {
          if (!message.error) {
            historyAvailable = message.historyAvailable === true;
            structureAvailable = message.structureAvailable === true;
            splitQueryAvailable = message.splitQueryAvailable === true;
            mergeAvailable = message.mergeAvailable === true;
            paragraphBreakAvailable = message.paragraphBreakAvailable === true;
          }
          updateReadOnly();
          report(message.error ? `편집 시작 실패: ${message.error}` : "클릭·드래그 선택 후 입력하세요. 변경 후 재조판이 필요합니다.");
          pump();
          return;
        }
        if (message.origin === "canvas" && structureTarget && message.kind === structureTarget.kind) {
          const queued = structureTarget.queuedText ?? "";
          const next = message.kind === "split" && message.splitTarget ? { ...structureTarget, ...message.splitTarget } : structureTarget;
          structureTarget = null;
          historyPending = false;
          updateReadOnly();
          input.setAttribute("aria-busy", "false");
          const operation = message.kind === "merge" ? "병합" : "분할";
          if (message.error) {
            report(structureErrorMessage(operation, message.error) + (queued ? " · 대기 입력은 적용되지 않았습니다." : ""));
            return;
          }
          if (message.kind === "split" && Object.hasOwn(message, "splitTarget") && (!message.splitTarget || message.splitTarget.section !== target.section || !Number.isInteger(message.splitTarget.paragraph) || message.splitTarget.paragraph <= target.paragraph)) {
            this.reset();
            report("문단 분할은 적용됐지만 새 문단 위치를 확인할 수 없어 직접 입력을 중단했습니다." + (queued ? " 대기 입력은 적용되지 않았습니다." : ""));
            return;
          }
          const paragraph = renderer.paragraph(next);
          if (!paragraph?.editable && !paragraph?.selectable) {
            this.reset();
            report(`문단 ${operation}은 적용됐지만 표시 한도로 직접 입력을 중단했습니다.${queued ? " 대기 입력은 적용되지 않았습니다." : ""}`);
            return;
          }
          if (message.kind === "split" && typingFont && sameParagraph(typingFont, target)) {
            changedTypingIntent();
            typingFont = {
              ...paragraphTarget(next),
              language: typingFont.language,
              name: typingFont.name
            };
          }
          if (message.kind === "split" && typingProperties && sameParagraph(typingProperties, target)) {
            changedTypingIntent();
            typingProperties = {
              ...paragraphTarget(next),
              properties: { ...typingProperties.properties }
            };
          }
          target = paragraphTarget(next);
          committed = paragraph.text;
          input.value = committed;
          renderer.preview(null);
          const unit = snapUnit(committed, Math.min(next.unit ?? 0, committed.length));
          setSelection({ ...target, unit }, { ...target, unit });
          reveal();
          if (queued && textEditable()) {
            input.value = committed.slice(0, unit) + queued + committed.slice(unit);
            input.setSelectionRange(unit + queued.length, unit + queued.length);
            preview();
            pump();
          }
          report(`문단 ${operation} 적용 · 재조판 필요${queued && !textEditable() ? " · 보호된 문단의 대기 입력은 적용되지 않았습니다." : ""}`);
          return;
        }
        if (["undo", "redo"].includes(message.kind) && message.origin === "canvas" && historyPending) {
          historyPending = false;
          updateReadOnly();
          if (message.error) {
            report(`실행 취소/다시 실행 실패: ${message.error}`);
            return;
          }
          const restored = versioned && message.changed ? historySelections.selection(revision) : null;
          const restoredParagraph = restored && renderer.paragraph(restored.focus);
          const modelState = message.changed === true && typeof historyModelState === "function" ? historyModelState() : null;
          let modelSelectionAccepted = false;
          const applyModelSelection = (state) => {
            if (!restored || !state || !matchHistoryModelSelection(state, revision, restored, restoredParagraph))
              return false;
            modelSelectionAccepted = true;
            target = paragraphTarget(restored.focus);
            committed = restoredParagraph.text;
            input.value = committed;
            anchor = restored.anchor;
            focus = restored.focus;
            preferredX = null;
            selectionOrigin = "canvas";
            historyModelWitness = state;
            try {
              onCommittedSelection({ anchor: { ...anchor }, focus: { ...focus } }, { origin: "canvas" });
            } catch (error) {
              historyModelWitness = null;
              throw error;
            }
            if (events.signal.aborted || historyModelWitness !== state)
              return false;
            report("실행 취소/다시 실행 적용 · 화면 반영 대기");
            historyPresentationReport = reportedNoteRevision;
            return true;
          };
          if (applyModelSelection(modelState) || modelSelectionAccepted)
            return;
          if (restored && modelState && modelState.selection === undefined && typeof prepareHistoryModelSelection === "function") {
            const preparation = {};
            historyModelPreparation = preparation;
            let preparing;
            try {
              preparing = prepareHistoryModelSelection({
                revision,
                selection: restored,
                sourceState: modelState
              });
            } catch (error) {
              historyModelPreparation = null;
              throw error;
            }
            if (preparing && typeof preparing.then === "function") {
              if (events.signal.aborted || historyModelPreparation !== preparation)
                return;
              target = paragraphTarget(restored.focus);
              committed = restoredParagraph?.text ?? committed;
              input.value = committed;
              anchor = restored.anchor;
              focus = restored.focus;
              return Promise.resolve(preparing).then((freshState) => {
                if (events.signal.aborted || historyModelPreparation !== preparation)
                  return;
                const accepted = sameHistoryModelObservation(modelState, freshState) && freshState === historyModelState() && applyModelSelection(freshState);
                if (events.signal.aborted || historyModelPreparation !== preparation)
                  return;
                if (!accepted) {
                  historyModelWitness = null;
                  historyPaintBarrier.begin();
                  historyPaintBarrier.acknowledge(null);
                  canvas.dataset.selectionAuthority = "history-unresolved";
                  report("복원 선택을 확인하지 못했습니다. 대기 입력은 아직 적용되지 않았습니다.");
                  return;
                }
                historyModelPreparation = null;
                historyIntents.wake();
                historyPaintBarrier.notify();
                return true;
              }).catch((error) => {
                if (events.signal.aborted || historyModelPreparation !== preparation)
                  return;
                historyModelWitness = null;
                historyPaintBarrier.begin();
                historyPaintBarrier.acknowledge(null);
                canvas.dataset.selectionAuthority = "history-unresolved";
                report(`복원 선택 게시를 확인하지 못했습니다: ${error.message}`);
              }).finally(() => {
                if (historyModelPreparation === preparation)
                  historyModelPreparation = null;
              });
            }
            if (historyModelPreparation === preparation)
              historyModelPreparation = null;
          }
          const restoredRanges = restored && (sameParagraph(restored.anchor, restored.focus) ? restored.focus.createdCell ? Boolean(restoredParagraph) : paragraphSelectionRanges([restoredParagraph], restored.anchor, restored.focus, () => "single", { sourcePositions: false, includeEmpty: true }) : renderer.selectionRanges?.(restored.anchor, restored.focus));
          if (restored && selectableText(restoredParagraph) && restoredRanges && caretGeometry(renderer.layout(), restored.anchor) && caretGeometry(renderer.layout(), restored.focus)) {
            target = paragraphTarget(restored.focus);
            committed = renderer.paragraph(target).text;
            input.value = committed;
            if (renderer.clearDraft)
              renderer.clearDraft();
            else
              renderer.preview(null);
            setSelection(restored.anchor, restored.focus);
            reveal();
            report("실행 취소/다시 실행 적용 · 재조판 필요");
            historyPresentationReport = reportedNoteRevision;
            return;
          }
          if (message.changed) {
            target = anchor = focus = null;
            input.disabled = true;
            if (renderer.clearDraft)
              renderer.clearDraft();
            else
              renderer.preview(null);
            paint();
            report("이력은 적용됐지만 복원 위치를 확인할 수 없어 대기 입력을 보존했습니다.");
            return;
          }
          if (!target) {
            report(message.changed ? "실행 취소/다시 실행 적용 · 재조판 필요" : "이동할 편집 이력이 없습니다.");
            return;
          }
          const paragraph = renderer.paragraph(target);
          if (!selectableText(paragraph)) {
            this.reset();
            return;
          }
          const a = anchor?.unit ?? 0, f = focus?.unit ?? 0;
          const multi = multipleParagraphs() ? { anchor: { ...anchor }, focus: { ...focus } } : null;
          committed = paragraph.text;
          input.value = committed;
          if (renderer.clearDraft)
            renderer.clearDraft();
          else
            renderer.preview(null);
          if (multi && renderer.selectionRanges?.(multi.anchor, multi.focus))
            setSelection(multi.anchor, multi.focus);
          else
            setSelection({ ...target, unit: snapUnit(committed, Math.min(a, committed.length)) }, { ...target, unit: snapUnit(committed, Math.min(f, committed.length)) });
          report(message.changed ? "실행 취소/다시 실행 적용 · 재조판 필요" : "이동할 편집 이력이 없습니다.");
          return;
        }
        if (message.origin !== "canvas" || !pending || !target || message.kind !== pending.kind)
          return;
        const previous = pending;
        pending = null;
        input.setAttribute("aria-busy", "false");
        if (previous.kind === "replace-paragraph-ranges") {
          if (message.error) {
            setSelection(previous.anchor, previous.focus);
            report(`교체 실패: ${message.error}${previous.queuedText ? " · 대기 입력도 적용되지 않았습니다." : ""}`);
            return;
          }
          const paragraph = renderer.paragraph(previous.target);
          if (!paragraph?.editable || paragraph.clipped) {
            this.reset();
            report("교체는 적용됐지만 표시 범위에서 입력을 계속할 수 없습니다.");
            return;
          }
          changedTypingIntent();
          typingFont = previous.font ? { ...previous.target, language: previous.font.language, name: previous.font.name } : null;
          changedTypingIntent();
          typingProperties = previous.properties ? { ...previous.target, properties: { ...previous.properties } } : null;
          target = previous.target;
          committed = paragraph.text;
          input.value = committed;
          renderer.preview(null);
          const unit = snapUnit(committed, Math.min(previous.unit, committed.length));
          setSelection({ ...target, unit }, { ...target, unit });
          reveal();
          report("선택 교체 적용 · 재조판 필요");
          if (previous.queuedText) {
            input.value = committed.slice(0, unit) + previous.queuedText + committed.slice(unit);
            input.setSelectionRange(unit + previous.queuedText.length, unit + previous.queuedText.length);
            preview();
            pump();
          }
          return;
        }
        if (RANGE_FORMATTING_KINDS.includes(previous.kind)) {
          if (!message.error && pendingFormattingReply?.bindingCurrent?.() !== true && pendingFormattingReply) {
            this.reset({ preserveHistory: true, selectionOrigin: "core" });
            report("서식 응답 뒤 현재 범위를 확인할 수 없어 대기 입력을 적용하지 않았습니다.");
            return;
          }
          setSelection(previous.anchor, previous.focus);
          report(message.error ? `서식은 적용되지 않았습니다: ${message.error}` : "여러 문단 서식 적용 · 재조판 필요");
          return;
        }
        if (message.error) {
          clearInputIntents();
          if (previous.kind === "splice-font-name") {
            changedTypingIntent();
            typingFont = null;
          }
          if (["splice-font-name", "splice-character-properties"].includes(previous.kind)) {
            changedTypingIntent();
            typingProperties = null;
          }
          if ([
            "format",
            "character-properties",
            "character-outline",
            "character-effect",
            "character-strike",
            "character-strike-color",
            "character-underline",
            "character-underline-color",
            "character-text-color",
            "character-shade",
            "character-font",
            "character-font-name"
          ].includes(previous.kind) && input.value !== committed) {
            report(`서식은 적용되지 않았습니다: ${message.error}`);
            preview();
            pump();
            return;
          }
          input.value = committed;
          renderer.preview(null);
          const restored = previous.beforeSelection;
          setSelection(restored?.anchor ?? { ...target, unit: snapUnit(committed, previous.start) }, restored?.focus ?? { ...target, unit: snapUnit(committed, previous.end, true) });
          report(`입력이 적용되지 않았습니다: ${message.error}`);
          return;
        }
        if (previous.kind === "insert-table") {
          const next = {
            section: target.section,
            createdCell: { identity: message.identity, row: 0, column: 0 }
          };
          const cell = renderer.paragraph(next);
          if (!cell?.editable || !caretGeometry(renderer.layout(), { ...next, unit: 0 })) {
            resetExternalSelection(this);
            report("표는 생성됐지만 현재 표시 위치에서는 셀 입력을 시작할 수 없습니다.");
            return;
          }
          target = next;
          committed = cell.text;
          input.value = committed;
          setSelection({ ...next, unit: 0 }, { ...next, unit: 0 });
          input.focus({ preventScroll: true });
          reveal();
          report("표 생성 · 첫 셀에서 입력할 수 있습니다.");
          return;
        }
        const paragraph = renderer.paragraph(target);
        if (!selectableText(paragraph)) {
          this.reset();
          report("표시 한도에 도달해 직접 입력을 중단했습니다. 적용된 변경은 native 모델에 유지됩니다.");
          return;
        }
        committed = paragraph.text;
        if (inputIntents.size) {
          try {
            inputIntents.peek(committed);
          } catch {
            clearInputIntents();
            input.value = committed;
            renderer.preview(null);
            sync();
            report("대기 입력의 기준 문서를 확인할 수 없어 적용하지 않았습니다.");
            return;
          }
        }
        report("변경 적용 · 재조판 필요");
        const canStage = typeof deferQueuedTypingProjection === "function" && previous.kind === "splice" && !message.error && message.applied !== false && inputIntents.size > 0 && historyIntents.nextKind === "history" && !composing && !deferredComposition && !multiComposition && !historyPending && !historyPaintBarrier.pending && !typingFont && !typingProperties && !target.createdCell && !multipleParagraphs() && wholeTextEditable();
        if (canStage) {
          const capturedTarget = target, capturedValue = input.value;
          const unchanged = () => !events.signal.aborted && ackProjectionSequence === ackSequence && target === capturedTarget && input.value === capturedValue && !composing && !deferredComposition && !multiComposition && !historyPending && !historyPaintBarrier.pending && !typingFont && !typingProperties && historyIntents.nextKind === "history";
          const current = () => {
            if (!unchanged())
              return false;
            const observed = renderer.paragraph(capturedTarget);
            return unchanged() && observed === paragraph;
          };
          if (current() && deferQueuedTypingProjection(draftPreview(), current) === true && current()) {
            sync({ deferGeometry: true });
            if (!current())
              return;
            pump();
            if (current() && pending?.kind === "splice")
              deferredTypingCheck = current;
            return;
          }
          if (!current())
            return;
        }
        preview();
        pump();
      } finally {
        if (versioned && !message.error) {
          historyRevision = revision;
          if (revisionChanged && !travelMessage)
            historySelections.remember(revision, anchor && focus ? { anchor, focus } : null);
        }
        if (pendingFormattingReply && formattingPaint === pendingFormattingReply) {
          if (message.error) {
            formattingPaint = null;
            historyPaintBarrier.reset();
            pendingFormattingReply.resolve(false);
            canvas.dataset.selectionAuthority = "current";
            input.setAttribute("aria-busy", "false");
            if (preserveRejectedFormattingInput)
              historyIntents.wake();
          } else {
            pendingFormattingReply.phase = "paint";
            pendingFormattingReply.report = reportedNoteRevision;
            const selected = target && anchor && focus ? { anchor, focus } : null;
            historyPaintBarrier.acknowledge(selected);
            canvas.dataset.selectionAuthority = selected ? "awaiting-formatting-paint" : "history-unresolved";
            input.setAttribute("aria-busy", "true");
            paint();
          }
        }
        if (pendingHistoryReply && historyPaintBarrier.pending && !historyPending) {
          const restoredSelection = target && anchor && focus ? { anchor, focus } : null;
          historyPaintBarrier.acknowledge(restoredSelection);
          canvas.dataset.selectionAuthority = restoredSelection ? "awaiting-history-paint" : "history-unresolved";
          input.setAttribute("aria-busy", "true");
          paint({ deferGeometry: Boolean(historyModelPreparation) || historyModelReady() });
        }
      }
    },
    close() {
      if (events.signal.aborted)
        return;
      this.reset();
      events.abort();
      renderer.onGeometry(() => {});
    }
  };
  return controller;
}

// packages/vanilla/src/surface.ts
import {
  getHistoryAvailability,
  createParagraphSelection,
  getSelectionFormatting
} from "@ohah/hwpjs";

// packages/vanilla/src/core-bridge.ts
function createControlBridge(options, observeResult) {
  let closed = false;
  let pending;
  let task = Promise.resolve();
  const current = (token) => {
    const s = options.state();
    return !closed && options.lease.isActive() && s.documentId === token.documentId && s.generation === token.generation;
  };
  const release = (request) => {
    if (pending?.id === request.id && pending.documentId === request.documentId && pending.generation === request.generation)
      pending = undefined;
  };
  return {
    pendingKind: () => pending && current(pending) ? pending.kind : undefined,
    ready: () => !closed && options.lease.isActive() && options.state().status === "ready",
    busy: () => closed || pending !== undefined || options.state().status !== "ready",
    request(message) {
      if (closed || pending || !options.lease.isActive() || options.state().status !== "ready")
        return false;
      if (message.kind === "enable")
        return false;
      const owned = structuredClone(message);
      const token = options.state().token;
      const request = {
        id: Symbol("input-surface-request"),
        kind: owned.kind,
        documentId: token.documentId,
        generation: token.generation
      };
      pending = request;
      let acknowledged = false;
      task = Promise.resolve().then(() => {
        if (!current(request))
          return;
        return options.lease.request(owned, { token, coordinates: "legacy-native" });
      }).then((answer) => {
        release(request);
        if (!answer || !current(request))
          return;
        if ("status" in answer && "state" in answer) {
          const result = answer;
          if (options.state().operationRevision !== result.state.operationRevision)
            return;
          acknowledged = true;
          let observationError;
          try {
            observeResult?.(result, owned);
          } catch (error) {
            observationError = error;
          }
          options.acknowledge({
            ...owned,
            ...result.reply,
            kind: message.kind,
            origin: message.origin,
            ...result.error ? { error: result.error } : {},
            applied: result.status === "committed-refresh-required" || result.status === "committed-with-snapshot"
          }, result.state);
          if (observationError !== undefined)
            options.error(observationError);
        } else {
          acknowledged = true;
          options.acknowledge(answer);
        }
      }).catch((error) => {
        release(request);
        if (acknowledged) {
          if (!closed) {
            const callbackError = new Error("문서 응답 후 화면 반영 콜백에서 오류가 발생했습니다.", { cause: error });
            callbackError.name = "InputSurfaceAcknowledgementCallbackError";
            Object.assign(callbackError, {
              documentId: request.documentId,
              generation: request.generation
            });
            options.error(callbackError);
          }
          return;
        }
        if (!current(request))
          return;
        options.error(error);
        options.acknowledge({
          ...owned,
          kind: message.kind,
          origin: message.origin,
          error: String(error),
          applied: false
        });
      });
      return true;
    },
    async flush() {
      await task;
    },
    close() {
      closed = true;
      pending = undefined;
    }
  };
}

// packages/vanilla/src/page-frame.ts
function canvasSurfacePageFrame(layout, available, scale = 1, scrollbarWidth = 0) {
  if (!Number.isFinite(available) || available <= 0 || !Number.isFinite(scale) || scale <= 0 || !Number.isFinite(scrollbarWidth) || scrollbarWidth < 0 || scrollbarWidth >= available || layout?.state !== "paginated" || !Array.isArray(layout.pages) || !layout.pages.length)
    return null;
  let left = Infinity, right = -Infinity;
  for (const page of layout.pages) {
    const paper = page?.paper;
    if (!paper || ![paper.x, paper.width, paper.x + paper.width].every(Number.isFinite) || paper.x < 0 || paper.width <= 0)
      return null;
    left = Math.min(left, paper.x);
    right = Math.max(right, paper.x + paper.width);
  }
  let extent = canvasHorizontalExtent(layout.pages, 0, TEXT_LEFT, scale);
  if (extent === null)
    return null;
  if (layout.memoPaneRight !== undefined) {
    if (!Number.isFinite(layout.memoPaneRight) || layout.memoPaneRight < 0)
      return null;
    extent = Math.max(extent, (layout.memoPaneRight + TEXT_LEFT) * scale);
  }
  if (!Number.isFinite(extent) || extent <= 0)
    return null;
  const width = Math.min(available, extent + scrollbarWidth);
  const marginLeft = Math.max(0, Math.min(available - width, (available - (left + right) * scale) / 2));
  return { width, marginLeft, contentWidth: extent };
}

// packages/vanilla/src/surface.ts
function createCanvasSurface({
  root,
  editor,
  environment = {},
  onStatus = () => {}
}) {
  if (!root?.ownerDocument)
    throw Error("InvalidSurfaceRoot");
  if (typeof editor.acquireInputSurface !== "function" || typeof editor.readResource !== "function")
    throw Error("SurfaceCorePortUnavailable");
  const doc = root.ownerDocument, realm = doc.defaultView;
  if (!realm)
    throw Error("SurfaceRealmUnavailable");
  const container = doc.createElement("div"), viewport = doc.createElement("div");
  const stage = doc.createElement("div");
  stage.style.cssText = "position:relative;width:max-content;min-width:100%";
  const canvas = doc.createElement("canvas"), spacer = doc.createElement("div"), input = doc.createElement("textarea");
  container.dataset.hwpjsSurface = "";
  viewport.style.cssText = "position:relative;overflow:auto;width:100%;height:100%;min-height:0";
  container.style.cssText = "height:100%;position:relative";
  canvas.style.cssText = "position:sticky;top:0;left:0;display:block;touch-action:none";
  spacer.style.cssText = "pointer-events:none";
  input.style.cssText = "position:absolute;opacity:0.01;width:2px;resize:none;overflow:hidden;padding:0;border:0";
  input.setAttribute("aria-label", "Document text input");
  input.dataset.hwpjsDocumentInput = "";
  input.spellcheck = false;
  input.maxLength = 4194304;
  input.tabIndex = -1;
  canvas.tabIndex = 0;
  input.style.pointerEvents = "none";
  stage.append(canvas, spacer, input);
  viewport.append(stage);
  container.append(viewport);
  root.append(container);
  let closed = false, renderer, direct, lease;
  let frameObserver;
  let unsubscribe, bridge;
  let displayed = "", selectionKey = "", observedStateVersion = -1;
  let nonTextHistoryAdmissionReady = false;
  let nonTextHistoryPending;
  let nonTextSelectionProjection;
  let nonTextHistoryTask = Promise.resolve();
  let activeHistoryAcknowledgement;
  let deferredTypingAcknowledgement;
  let historySelectionPublication;
  let formattingReceipt;
  const formattingTasks = new Set;
  const trackFormattingTask = (task) => {
    formattingTasks.add(task);
    task.then(() => formattingTasks.delete(task), () => formattingTasks.delete(task));
    return task;
  };
  let formattingPreparation;
  let atomicProfile;
  let atomicProfileTask = Promise.resolve();
  let explicitClearPending;
  const status = (message) => {
    if (!closed)
      onStatus(message);
  };
  const note = {
    set textContent(value) {
      status(value);
    }
  };
  const alignFrame = (layout = renderer?.layout()) => {
    if (closed)
      return;
    const gutter = viewport.offsetWidth - viewport.clientWidth;
    const frame = canvasSurfacePageFrame(layout, root.clientWidth, renderer?.viewScale() ?? 1, Number.isFinite(gutter) ? Math.max(0, gutter) : 0);
    const width = frame ? `${Math.max(frame.contentWidth, viewport.clientWidth - frame.marginLeft)}px` : "max-content";
    const margin = frame ? `${frame.marginLeft}px` : "0px";
    if (stage.style.width !== width)
      stage.style.width = width;
    if (stage.style.marginLeft !== margin)
      stage.style.marginLeft = margin;
    stage.style.minWidth = frame ? "0px" : "100%";
    stage.style.overflow = frame ? "clip" : "visible";
  };
  const render = (state) => {
    if (closed || !renderer)
      return;
    if (state.stateVersion <= observedStateVersion)
      return;
    observedStateVersion = state.stateVersion;
    const key = `${state.documentId}:${state.generation}:${state.operationRevision}:${state.viewRevision}`;
    if (state.status === "refresh-required") {
      renderer.suspendGeometryEvidence();
      input.readOnly = true;
      return;
    }
    if (state.status !== "ready") {
      renderer.suspendGeometryEvidence();
      return;
    }
    const geometry = lease ? readGeometryProjection(lease, state) : undefined;
    if (key === displayed) {
      renderer.observeSourceState(state);
      renderer.setGeometryEvidence(geometry?.content, geometry?.evidence);
      const selected = state.selection;
      const nextSelectionKey = JSON.stringify(selected ?? null);
      if (historySelectionPublication && state.content === historySelectionPublication.state.content && state.nativeHistoryRevision === historySelectionPublication.state.nativeHistoryRevision && nextSelectionKey === JSON.stringify(historySelectionPublication.target)) {
        selectionKey = nextSelectionKey;
        return;
      }
      if (!nonTextHistoryPending && !bridge?.busy() && nextSelectionKey !== selectionKey) {
        selectionKey = nextSelectionKey;
        if (selected) {
          direct?.initializeCapabilities({
            ...state.capabilities,
            historyRevision: state.nativeHistoryRevision,
            historyRevisions: state.nativeHistoryRevisions
          });
          if (!direct?.selectTextRange(selected, { focusInput: false, selectionOrigin: "core" }))
            status("선택한 텍스트의 화면 위치를 표시할 수 없습니다.");
        } else
          direct?.external({ kind: "external-update", origin: "core" });
      }
      return;
    }
    const changedDocument = displayed.split(":").slice(0, -2).join(":") !== key.split(":").slice(0, -2).join(":");
    if (changedDocument) {
      atomicProfile = undefined;
      nonTextSelectionProjection = state;
      try {
        direct?.reset({ selectionOrigin: "core" });
      } finally {
        nonTextSelectionProjection = undefined;
      }
      renderer.clear();
      selectionKey = "";
    }
    const retained = state.selection ? state.selection : undefined;
    if (!nonTextHistoryPending && !retained && !changedDocument && displayed && !bridge?.busy())
      direct?.external({ kind: "external-update", origin: "core" });
    displayed = key;
    renderer.show(geometry?.content ?? state.content, {
      sourceState: state,
      geometryEvidence: geometry?.evidence,
      preserveScroll: !changedDocument,
      resourceEpoch: `${state.documentId}:${state.generation}:${state.operationRevision}`,
      resourceDocument: `${state.documentId}:${state.generation}`,
      deferLayout: !changedDocument && ["splice", "undo", "redo"].includes(bridge?.pendingKind() ?? "")
    });
    if (!nonTextHistoryPending && retained && lease?.isActive() && !bridge?.busy()) {
      direct?.initializeCapabilities({
        ...state.capabilities,
        historyRevision: state.nativeHistoryRevision,
        historyRevisions: state.nativeHistoryRevisions
      });
      if (changedDocument)
        nonTextSelectionProjection = state;
      try {
        if (!direct?.selectTextRange(retained, { focusInput: false, selectionOrigin: "core" }))
          direct?.external({ kind: "external-update", origin: "core" });
      } finally {
        if (changedDocument)
          nonTextSelectionProjection = undefined;
      }
    }
    if (changedDocument)
      direct?.initializeCapabilities({
        ...state.capabilities,
        historyRevision: state.nativeHistoryRevision,
        historyRevisions: state.nativeHistoryRevisions
      });
  };
  const cleanup = () => {
    closed = true;
    atomicProfile = undefined;
    nonTextHistoryAdmissionReady = false;
    nonTextHistoryPending = undefined;
    explicitClearPending = undefined;
    historySelectionPublication = undefined;
    frameObserver?.disconnect();
    bridge?.close();
    unsubscribe?.();
    try {
      direct?.close();
    } finally {
      try {
        lease?.release();
      } finally {
        renderer?.close();
        container.remove();
      }
    }
  };
  try {
    const rendererEnvironment = Object.create(environment);
    const hostEpochs = createHostEpochReaders(environment);
    for (const key of HOST_EPOCH_KEYS) {
      Object.defineProperty(rendererEnvironment, key, { value: hostEpochs[key] });
    }
    Object.defineProperty(rendererEnvironment, "nativeGeometryEvidenceReader", {
      value: readNativeGeometryEvidence
    });
    renderer = createSurfaceRenderer(canvas, viewport, spacer, alignFrame, rendererEnvironment);
    if (environment.decodeImage)
      renderer.pictureDecoder(environment.decodeImage);
    lease = editor.acquireInputSurface({
      commitComposition: async () => {
        const result = direct?.flushComposition() ?? "unchanged";
        if (result === "blocked")
          return result;
        await bridge?.flush();
        return direct?.settled() ? "unchanged" : "blocked";
      },
      cancelComposition: () => direct?.cancelComposition()
    });
    bridge = createControlBridge({
      state: () => editor.getEditorState(),
      lease,
      acknowledge(reply, state) {
        const priorAcknowledgement = activeHistoryAcknowledgement;
        deferredTypingAcknowledgement = undefined;
        activeHistoryAcknowledgement = state;
        const finish = (modelPrepared = false) => {
          const deferred = deferredTypingAcknowledgement;
          deferredTypingAcknowledgement = undefined;
          const currentTyping = deferred && deferred === state && !closed && editor.getEditorState() === deferred && lease?.isActive() && direct.consumeDeferredTypingProjection?.() === true;
          if (!closed && !modelPrepared && !currentTyping && !direct.historyModelReady())
            renderer.flushProjection();
        };
        try {
          if (state)
            render(state);
          const prepared = direct.message(reply);
          if (prepared && typeof prepared.then === "function") {
            Promise.resolve(prepared).then((value) => finish(value === true), (error) => {
              status(String(error));
              finish();
            });
          } else
            finish();
        } catch (error) {
          finish();
          throw error;
        } finally {
          activeHistoryAcknowledgement = priorAcknowledgement;
        }
      },
      error: (error) => status(String(error))
    }, (result, message) => {
      if (formattingReceipt?.kind === message.kind)
        formattingReceipt.result = result;
    });
    direct = createCanvasEditor({
      canvas,
      viewport,
      input,
      renderer,
      controls: {
        ready: () => nonTextHistoryPending === undefined && bridge.ready(),
        busy: () => nonTextHistoryPending !== undefined || bridge.busy(),
        request: (message) => nonTextHistoryPending === undefined && bridge.request(message)
      },
      deferQueuedTypingProjection(draft, controllerCurrent) {
        const current = activeHistoryAcknowledgement;
        if (closed || !current || current !== editor.getEditorState() || current.status !== "ready" || !lease?.isActive() || bridge?.busy())
          return false;
        const held = () => {
          if (closed || current !== editor.getEditorState() || !lease?.isActive() || bridge?.pendingKind() !== "splice" || controllerCurrent() !== true)
            return false;
          return !closed && current === editor.getEditorState() && lease?.isActive() === true && bridge?.pendingKind() === "splice";
        };
        if (renderer.stageQueuedTypingPreview(draft, held) !== true || closed || current !== editor.getEditorState() || !lease?.isActive() || bridge?.busy())
          return false;
        deferredTypingAcknowledgement = current;
        return true;
      },
      historyModelState: () => {
        if (closed || !lease?.isActive() || !bridge?.ready() || bridge.busy())
          return null;
        const state = editor.getEditorState();
        return state.status === "ready" && renderer.historyModelMatches(state) ? state : null;
      },
      prepareHistoryModelSelection({ revision, selection, sourceState }) {
        const current = editor.getEditorState();
        if (closed || !lease?.isActive() || bridge?.busy() || current !== sourceState || sourceState !== activeHistoryAcknowledgement || current.status !== "ready" || current.nativeHistoryRevision !== revision || selection?.anchor?.section !== selection?.focus?.section || selection?.anchor?.paragraph !== selection?.focus?.paragraph)
          return null;
        let target;
        try {
          target = createParagraphSelection(current, {
            section: selection.anchor.section,
            paragraph: selection.anchor.paragraph,
            startUnit: Math.min(selection.anchor.unit, selection.focus.unit),
            endUnit: Math.max(selection.anchor.unit, selection.focus.unit),
            affinity: selection.anchor.unit > selection.focus.unit ? "backward" : "forward"
          });
        } catch (error) {
          status(String(error));
          return null;
        }
        const publication = { state: current, target };
        historySelectionPublication = publication;
        return lease.publishSelection(target).then((published) => {
          const fresh = editor.getEditorState();
          if (closed || !lease?.isActive() || historySelectionPublication !== publication || fresh !== published || fresh.content !== current.content || fresh.documentId !== current.documentId || fresh.generation !== current.generation || fresh.operationRevision !== current.operationRevision || fresh.viewRevision !== current.viewRevision || fresh.nativeHistoryRevision !== revision || !renderer.historyModelMatches(fresh))
            return null;
          return fresh;
        }).catch((error) => {
          status(String(error));
          return null;
        }).finally(() => {
          if (historySelectionPublication === publication)
            historySelectionPublication = undefined;
        });
      },
      note,
      environment: { ...environment, ownerDocument: doc },
      platform: realm.navigator.platform,
      historyAvailability: () => getHistoryAvailability(editor.getEditorState()),
      transferMultiParagraphSelection(options) {
        if (!nonTextHistoryAdmissionReady || !direct)
          return Promise.resolve(false);
        return transferSurfaceSelection(options);
      },
      requestStableNonTextHistory(kind) {
        if (!nonTextHistoryAdmissionReady || !direct)
          return false;
        const state = nonTextHistoryState(kind);
        return state ? requestNonTextHistory(kind, state) : false;
      },
      queryEditRange: (m) => bridge.request(m),
      querySplitRange: (m) => bridge.request(m),
      onCommittedSelection(value, observation) {
        if (closed || !lease?.isActive())
          return;
        const state = editor.getEditorState();
        if (state.status !== "ready")
          return;
        const singleOwnerRange = value && value.anchor.section === value.focus.section && value.anchor.paragraph === value.focus.paragraph;
        const point = singleOwnerRange ? value.anchor : null, row = point && renderer.paragraph(point);
        const owner = paragraphSelectionOwner(row);
        const target = point && owner ? {
          ...state.token,
          coordinateSpace: "display",
          format: state.content.format,
          owner,
          section: point.section,
          paragraph: point.paragraph,
          startUnit: Math.min(value.anchor.unit, value.focus.unit),
          endUnit: Math.max(value.anchor.unit, value.focus.unit),
          affinity: value.anchor.unit > value.focus.unit ? "backward" : "forward"
        } : null;
        const key = JSON.stringify(target);
        if (observation?.origin === "core" && nonTextSelectionProjection === state) {
          selectionKey = key;
          return;
        }
        const projectedClear = observation?.origin === "core" && target === null && state.selection == null;
        const explicitClear = observation?.origin === "canvas" && target === null && state.selection === undefined;
        if (key === selectionKey && (!explicitClear || explicitClearPending === state))
          return;
        selectionKey = key;
        if (projectedClear)
          return;
        const clearingState = explicitClear ? state : undefined;
        if (clearingState)
          explicitClearPending = clearingState;
        lease.publishSelection(target).catch((error) => {
          if (!closed)
            status(String(error));
        }).finally(() => {
          if (clearingState && explicitClearPending === clearingState)
            explicitClearPending = undefined;
        });
      }
    });
    const resource = async (kind, payload, field) => {
      const token = editor.getEditorState().token;
      const answer = await editor.readResource({ kind, ...payload }, token);
      const now = editor.getEditorState().token;
      if (closed || !lease.isActive() || token.documentId !== now.documentId || token.generation !== now.generation || token.operationRevision !== now.operationRevision)
        throw Error("StaleSurfaceResource");
      if (answer.error)
        throw Error(answer.error);
      return answer[field];
    };
    renderer.pictureReader((section, pictureNode) => resource("picture-bytes", { section, pictureNode }, "bytes"));
    renderer.tableBackgroundReader((section, listNode) => resource("table-background-bytes", { section, listNode }, "bytes"));
    renderer.chartReader((section, wrapper) => resource("chart-display", { section, wrapper }, "chart"));
    render(editor.getEditorState());
    direct.initializeCapabilities({
      ...editor.getEditorState().capabilities,
      historyRevision: editor.getEditorState().nativeHistoryRevision,
      historyRevisions: editor.getEditorState().nativeHistoryRevisions
    });
    unsubscribe = editor.registerStateListener(render);
    const Observe = environment.ResizeObserver ?? realm.ResizeObserver;
    frameObserver = new Observe(() => alignFrame());
    frameObserver.observe(root);
    alignFrame();
  } catch (error) {
    cleanup();
    throw error;
  }
  const historyKind = (kind) => kind === "undo" || kind === "redo";
  const noneViewState = () => {
    if (closed || nonTextHistoryPending || !lease?.isActive() || bridge?.busy())
      return;
    const state = editor.getEditorState();
    const key = `${state.documentId}:${state.generation}:${state.operationRevision}:${state.viewRevision}`;
    if (state.status !== "ready" || state.selection != null || state.stateVersion !== observedStateVersion || key !== displayed || direct?.historyRoute?.() !== "none")
      return;
    if (closed || nonTextHistoryPending || !lease?.isActive() || bridge?.busy() || editor.getEditorState() !== state || direct?.historyRoute?.() !== "none" || editor.getEditorState() !== state)
      return;
    return state;
  };
  const nonTextHistoryState = (kind) => {
    if (!historyKind(kind))
      return;
    const state = noneViewState();
    if (!state || state.capabilities?.historyAvailable !== true)
      return;
    const availability = getHistoryAvailability(state);
    if (!availability.available || !availability[kind === "undo" ? "canUndo" : "canRedo"])
      return;
    return noneViewState() === state ? state : undefined;
  };
  const modalOpen = () => {
    try {
      return typeof doc.querySelector === "function" && doc.querySelector("dialog:modal") !== null;
    } catch {
      return true;
    }
  };
  const requestNonTextHistory = (kind, state) => {
    const request = {};
    nonTextHistoryPending = request;
    let resolveTask;
    nonTextHistoryTask = new Promise((resolve) => {
      resolveTask = resolve;
    });
    const sameOwner = () => {
      if (closed || nonTextHistoryPending !== request || !lease?.isActive())
        return false;
      const current = editor.getEditorState();
      return current.documentId === state.documentId && current.generation === state.generation;
    };
    const settle = (result, error) => {
      let current;
      const stillCurrent = () => !closed && !nonTextHistoryPending && lease?.isActive() && current !== undefined && editor.getEditorState() === current && current.documentId === state.documentId && current.generation === state.generation;
      try {
        if (!sameOwner())
          return;
        const observed = editor.getEditorState();
        if (observed.status === "ready")
          render(observed);
        if (!sameOwner())
          return;
        if (nonTextHistoryPending === request)
          nonTextHistoryPending = undefined;
        current = editor.getEditorState();
        if (!stillCurrent())
          return;
        if (current.status !== "ready") {
          status("실행 취소/다시 실행 대기가 끝났습니다. 현재 문서 상태를 확인하세요.");
          return;
        }
        const key = `${current.documentId}:${current.generation}:${current.operationRevision}:${current.viewRevision}`;
        if (current.stateVersion !== observedStateVersion || key !== displayed) {
          status("실행 취소/다시 실행 대기가 끝났습니다. 현재 문서 표시를 확인하세요.");
          return;
        }
        const noAffirmativeChange = (value) => value === undefined || value === null || value === false;
        const reply = result?.reply;
        if (result?.status === "rejected-unapplied" && result.state === state && current === state && noAffirmativeChange(result.changed) && (reply?.applied === undefined || reply.applied === false) && noAffirmativeChange(reply?.changed) && noAffirmativeChange(reply?.meta?.changed) && (reply?.meta?.application === undefined || reply.meta.application === "unapplied") && noneViewState() === state) {
          status(`실행 취소/다시 실행 실패: ${result.error ?? "요청이 적용되지 않았습니다."}`);
          return;
        }
        direct.initializeCapabilities({
          ...current.capabilities,
          historyRevision: current.nativeHistoryRevision,
          historyRevisions: current.nativeHistoryRevisions
        });
        if (!stillCurrent())
          return;
        selectionKey = JSON.stringify(current.selection ?? null);
        if (current.selection) {
          let selected;
          nonTextSelectionProjection = current;
          try {
            selected = direct.selectTextRange(current.selection, {
              focusInput: false,
              selectionOrigin: "core"
            });
          } finally {
            nonTextSelectionProjection = undefined;
          }
          if (!stillCurrent())
            return;
          if (!selected) {
            status("이력은 적용됐지만 복원된 텍스트 선택의 화면 위치를 확인할 수 없습니다.");
            return;
          }
        } else {
          direct.external({ kind: "external-update", origin: "core" });
          if (!stillCurrent())
            return;
        }
        const failure = error ?? result?.error;
        status(failure ? `실행 취소/다시 실행 실패: ${String(failure)}` : result?.state !== current ? "이력 응답 뒤 변경된 현재 문서 상태를 표시했습니다." : current.selection ? "실행 취소/다시 실행 적용 · 복원 선택 표시 완료" : "실행 취소/다시 실행 적용 · 텍스트 복원 위치 없음");
      } catch (failure) {
        try {
          if (stillCurrent())
            status(`이력 응답 후 화면 반영 실패: ${String(failure)}`);
        } catch {}
      } finally {
        if (nonTextHistoryPending === request)
          nonTextHistoryPending = undefined;
        resolveTask();
      }
    };
    try {
      const task = editor[kind](state.token);
      Promise.resolve(task).then((result) => settle(result), (error) => settle(undefined, error));
      return true;
    } catch (error) {
      settle(undefined, error);
      return false;
    }
  };
  const formattingModalOwner = () => {
    let dialog, bound = false, invalid = false;
    const current = () => {
      if (invalid)
        return false;
      if (!bound)
        return !modalOpen();
      try {
        const active = doc.querySelectorAll("dialog:modal");
        return dialog?.ownerDocument === doc && dialog.isConnected === true && dialog.open === true && active.length === 1 && active[0] === dialog;
      } catch {
        return false;
      }
    };
    return {
      current,
      isOwned: () => bound && current(),
      bind(element, verify) {
        if (bound)
          return false;
        bound = true;
        dialog = element;
        const valid = verify();
        if (!valid)
          invalid = true;
        return valid;
      }
    };
  };
  const rangeViewState = (modalCurrent = () => !modalOpen()) => {
    if (closed || nonTextHistoryPending || !lease?.isActive() || bridge?.busy() || !modalCurrent())
      return;
    const state = editor.getEditorState();
    const key = `${state.documentId}:${state.generation}:${state.operationRevision}:${state.viewRevision}`;
    if (state.status !== "ready" || state.selection != null || state.stateVersion !== observedStateVersion || key !== displayed || direct.hasMultiParagraphSelection() !== true || !direct.settled())
      return;
    return !closed && lease?.isActive() && !bridge?.busy() && editor.getEditorState() === state ? state : undefined;
  };
  const rangeWritable = (state) => state.capabilities?.readOnly !== true && state.content?.readOnly !== true;
  const surfaceClipboard = () => environment.clipboard === undefined ? realm.navigator?.clipboard : environment.clipboard;
  const captureSurfaceSelection = (options = {}) => {
    const state = rangeViewState();
    const clipboard = options.clipboard === undefined ? surfaceClipboard() : options.clipboard;
    if (!state || options.cut === true && !rangeWritable(state) || !direct.canTransferSelection(options.cut === true, true, clipboard))
      return null;
    const active = () => input.getRootNode().activeElement ?? doc.activeElement;
    const focus = active();
    return direct.captureTransferSelection({
      cut: options.cut === true,
      clipboard,
      multiOnly: true,
      isCurrent: () => rangeViewState() === state && (options.cut !== true || rangeWritable(state)) && active() === focus && rangeViewState() === state
    });
  };
  const transferSurfaceSelection = (options = {}) => captureSurfaceSelection(options)?.() ?? Promise.resolve(false);
  const prepareAtomicProfile = (state) => {
    if (closed || !lease?.isActive() || state.status !== "ready")
      return Promise.resolve(false);
    if (atomicProfile?.documentId === state.documentId && atomicProfile.generation === state.generation && atomicProfile.format === state.content?.format)
      return atomicProfile.pending ? atomicProfileTask.then(() => !closed) : Promise.resolve(true);
    const profile = {
      documentId: state.documentId,
      generation: state.generation,
      format: state.content?.format,
      pending: true,
      alignment: "AtomicCapabilitiesPending",
      fonts: "AtomicCapabilitiesPending"
    };
    atomicProfile = profile;
    atomicProfileTask = trackFormattingTask(Promise.resolve().then(() => editor.readResource({ kind: "formatting-capabilities" }, state.token)).then((answer) => {
      if (closed || atomicProfile !== profile || editor.getEditorState().documentId !== profile.documentId || editor.getEditorState().generation !== profile.generation)
        return;
      const cap = answer.formattingCapabilities;
      const transport = answer.formattingBatchQueryAvailable === true ? null : "AtomicBatchQueryUnavailable";
      profile.alignment = transport ?? atomicRangeUnavailable(cap, "alignment", profile.format);
      profile.fonts = transport ?? atomicRangeUnavailable(cap, "font-names", profile.format);
      profile.pending = false;
      try {
        status("서식 지원 정보를 확인했습니다.");
      } catch {}
    }).catch((error) => {
      if (closed || atomicProfile !== profile)
        return;
      const reason = error instanceof Error ? error.message : String(error);
      profile.pending = false;
      profile.alignment = profile.fonts = reason;
      if (["StaleTarget", "StaleReply"].includes(reason))
        atomicProfile = undefined;
    }));
    return atomicProfileTask.then(() => !closed);
  };
  nonTextHistoryAdmissionReady = true;
  let disposal;
  return {
    canRequestHistory(kind) {
      if (!historyKind(kind) || closed || nonTextHistoryPending)
        return false;
      const route = direct.historyRoute();
      if (route === "none")
        return Boolean(nonTextHistoryState(kind));
      return route === "text" && !closed && direct.canRequestHistory(kind);
    },
    requestHistory(kind) {
      if (!historyKind(kind) || closed || nonTextHistoryPending)
        return false;
      const route = direct.historyRoute();
      if (route === "none") {
        const state = nonTextHistoryState(kind);
        return state ? requestNonTextHistory(kind, state) : false;
      }
      return route === "text" && !closed && direct.requestHistory(kind);
    },
    focus() {
      if (closed || nonTextHistoryPending || !lease?.isActive() || modalOpen())
        return false;
      const state = editor.getEditorState();
      const key = `${state.documentId}:${state.generation}:${state.operationRevision}:${state.viewRevision}`;
      if (state.status !== "ready" || state.stateVersion !== observedStateVersion || key !== displayed)
        return false;
      const route = direct.historyRoute();
      if (route === "blocked")
        return false;
      if (route === "text")
        return direct.focusInput() && !closed && !nonTextHistoryPending && lease?.isActive() === true && !modalOpen() && editor.getEditorState() === state;
      if (!direct.settled())
        return false;
      const current = noneViewState();
      if (typeof doc.querySelector !== "function" || !current || current !== state || modalOpen() || noneViewState() !== current)
        return false;
      canvas.focus({ preventScroll: true });
      return (canvas.getRootNode().activeElement ?? doc.activeElement) === canvas && !modalOpen() && noneViewState() === current;
    },
    canTransferSelection(cut = false, clipboard = surfaceClipboard()) {
      const state = rangeViewState();
      return Boolean(state && (!cut || rangeWritable(state)) && direct.canTransferSelection(cut, true, clipboard) && rangeViewState() === state);
    },
    captureTransferSelection(options = {}) {
      return captureSurfaceSelection(options);
    },
    transferSelection(options = {}) {
      return transferSurfaceSelection(options);
    },
    captureCaretFormatting() {
      const state = editor.getEditorState();
      if (closed || nonTextHistoryPending || !lease?.isActive() || bridge?.busy() || modalOpen() || state.status !== "ready")
        return null;
      const source = getSelectionFormatting(state);
      const selected = source.target;
      if (!selected || source.characterAvailableReason === "CreatedCellRequiresSurfacePort")
        return null;
      const canonical = () => {
        if (closed || nonTextHistoryPending || !lease?.isActive() || bridge?.busy() || state !== editor.getEditorState() || state.status !== "ready" || observedStateVersion !== state.stateVersion || displayed !== `${state.documentId}:${state.generation}:${state.operationRevision}:${state.viewRevision}` || !direct.settled() || !renderer.historyModelMatches(state) || !selected || selected.startUnit !== selected.endUnit)
          return false;
        const points = direct.currentFormattingSelection();
        return points && points.anchor.section === selected.section && points.focus.section === selected.section && points.anchor.paragraph === selected.paragraph && points.focus.paragraph === selected.paragraph && points.anchor.unit === selected.startUnit && points.focus.unit === selected.endUnit && Boolean(caretGeometry(renderer.layout(), points.anchor)) && editor.getEditorState() === state;
      };
      if (modalOpen() || !canonical())
        return null;
      const modal = formattingModalOwner();
      const current = () => canonical() && modal.current();
      const postCurrent = () => canonical() && (!modalOpen() || modal.isOwned());
      const captured = direct.captureCaretFormatting(current, postCurrent, modal.isOwned);
      if (!captured || !current())
        return null;
      const writable = rangeWritable(state);
      const properties = writable && captured.supported("character-properties") ? null : "CaretTypingPropertiesUnavailable";
      const font = writable && captured.supported("font-name") ? null : "CaretTypingFontUnavailable";
      const readonlyReason = writable ? null : "ReadOnlyDocument";
      const pending = captured.typing;
      const fontNames = { ...source.fontNames };
      const fontNameAvailableReasons = { ...source.fontNameAvailableReasons };
      FONT_LANGUAGES.forEach((language) => {
        fontNameAvailableReasons[language] = readonlyReason ?? font;
      });
      if (pending.font)
        fontNames[pending.font.language] = Object.freeze({ kind: "single", name: pending.font.name });
      return Object.freeze({
        mode: "typing",
        state,
        observation: Object.freeze({
          ...source,
          ...pending.properties,
          fontNames: Object.freeze(fontNames)
        }),
        reasons: Object.freeze({
          characterAvailableReason: readonlyReason ?? properties,
          paragraphAvailableReason: source.paragraphAvailableReason,
          fontNameAvailableReasons: Object.freeze(fontNameAvailableReasons),
          fontNamesAvailableReason: "CaretRepresentativeFontUnavailable",
          textColorAvailableReason: "CaretTypingColorUnavailable",
          underlineAvailableReason: "CaretTypingUnderlineUnavailable",
          strikeAvailableReason: "CaretTypingStrikeUnavailable"
        }),
        current: () => current() && captured.current(),
        bindDialog(element) {
          return modal.bind(element, () => current() && captured.current());
        },
        request(intent) {
          return writable && current() && captured.current() && captured.request(intent) === true;
        },
        appliedCurrent: () => postCurrent() && captured.appliedCurrent()
      });
    },
    captureSelectionFormatting() {
      const state = rangeViewState();
      if (!state)
        return null;
      const modal = formattingModalOwner();
      const dialogCurrent = modal.current;
      const current = () => rangeViewState(dialogCurrent) === state;
      let binding = null;
      const captured = direct.captureSelectionFormatting(current, (anchor, focus) => {
        binding = captureFormattingRangeBinding(state, { anchor, focus });
        const ranges = paragraphSelectionRanges(state.content?.paragraphs, anchor, focus, undefined, { sourcePositions: false });
        return rangeFormattingObservation(state.content, ranges);
      }, modal.isOwned);
      if (!captured || !current())
        return null;
      if (rangeWritable(state))
        prepareAtomicProfile(state);
      const atomicReason = (kind) => {
        if (!rangeWritable(state))
          return "ReadOnlyDocument";
        if (!binding)
          return "UnsupportedFormattingSelection";
        const profile = atomicProfile;
        if (!profile || profile.documentId !== state.documentId || profile.generation !== state.generation || profile.pending)
          return "AtomicCapabilitiesPending";
        return kind === "alignment" ? profile.alignment : profile.fonts;
      };
      const reason = (kind) => !rangeWritable(state) ? "ReadOnlyDocument" : captured.supported(kind) ? null : "RangeFormattingUnsupported";
      const reasons = () => Object.freeze({
        characterAvailableReason: reason("character-properties"),
        underlineAvailableReason: reason("underline"),
        strikeAvailableReason: reason("strike"),
        textColorAvailableReason: reason("text-color") ?? (captured.observation.colorBindingValid ? null : "UnknownCharacterTextColor"),
        fontNameAvailableReasons: Object.freeze(Object.fromEntries(FONT_LANGUAGES.map((language) => [
          language,
          reason("font-name") ?? (captured.observation.fontBindings[language] ? null : "UnknownCharacterFontName")
        ]))),
        fontNamesAvailableReason: atomicReason("font-names"),
        paragraphAvailableReason: atomicReason("alignment")
      });
      let used = false, prepared, completion;
      let settledResult;
      const viewCurrent = () => {
        const fresh = editor.getEditorState();
        const selection = direct.currentFormattingSelection();
        return !closed && lease?.isActive() === true && fresh.status === "ready" && renderer.historyModelMatches(fresh) === true && formattingRangeBindingMatches(binding, fresh, selection) && Boolean(caretGeometry(renderer.layout(), selection.anchor) && caretGeometry(renderer.layout(), selection.focus)) && !closed && lease?.isActive() === true && editor.getEditorState() === fresh && renderer.historyModelMatches(fresh) === true;
      };
      const resultCurrent = (result) => {
        if (!result)
          return false;
        try {
          const fresh = editor.getEditorState();
          return Boolean((result.state === fresh || sameHistoryModelObservation(result.state, fresh)) && viewCurrent());
        } catch {
          return false;
        }
      };
      return Object.freeze({
        state,
        observation: captured.observation,
        get reasons() {
          return reasons();
        },
        current: () => current() && captured.current(),
        bindDialog(element) {
          return modal.bind(element, () => current() && captured.current());
        },
        async prepare(intent) {
          if (used || !current() || !captured.current())
            return false;
          if (!intent) {
            await prepareAtomicProfile(state);
            return current() && captured.current();
          }
          if (!["alignment", "font-names"].includes(intent.kind))
            return current() && captured.current() && rangeWritable(state);
          if (!binding || !rangeWritable(state) || formattingPreparation)
            return false;
          const record = {};
          formattingPreparation = record;
          const task = prepareAtomicRangeRequest({
            read: (message, token) => editor.readResource(message, token),
            selectors: formattingRangeSelectors(binding, intent.kind === "font-names"),
            intent,
            token: state.token,
            revision: state.nativeHistoryRevision,
            format: state.content.format,
            current: () => current() && captured.current() && rangeWritable(state)
          }).then((request) => {
            prepared = request;
            return current() && captured.current();
          }).finally(() => {
            if (formattingPreparation === record)
              formattingPreparation = undefined;
          });
          trackFormattingTask(task);
          return task;
        },
        request(intent) {
          if (used)
            return false;
          used = true;
          if (!current() || !rangeWritable(state))
            return false;
          if (intent.kind === "text-color" && reasons().textColorAvailableReason !== null)
            return false;
          if (intent.kind === "font-name" && reasons().fontNameAvailableReasons[intent.language] !== null)
            return false;
          const atomic = ["alignment", "font-names"].includes(intent.kind);
          if (atomic) {
            if (!prepared || atomicReason(intent.kind) !== null)
              return false;
            const patch = atomicRangePatch(intent);
            if (JSON.stringify(patch) !== JSON.stringify(prepared.patch))
              return false;
          }
          const receipt = {
            kind: atomic ? "formatting-patch" : {
              "character-properties": "character-properties-ranges",
              underline: "character-underline-ranges",
              strike: "character-strike-ranges",
              "text-color": "character-text-color-ranges",
              "font-name": "character-font-name-ranges",
              "font-id": "character-font-ranges",
              shade: "character-shade-ranges",
              outline: "character-outline-ranges",
              effect: "character-effect-ranges"
            }[intent.kind],
            result: null
          };
          formattingReceipt = receipt;
          const accepted = atomic ? direct.requestAtomicFormatting(prepared, () => current() && captured.current()) : captured.request(intent) === true;
          if (!accepted) {
            if (formattingReceipt === receipt)
              formattingReceipt = undefined;
            return false;
          }
          direct.startFormattingPaint(() => activeHistoryAcknowledgement === editor.getEditorState() && viewCurrent(), () => atomic && receipt.result?.status === "rejected-unapplied" && receipt.result.state === state && editor.getEditorState() === state && rangeWritable(state) && viewCurrent());
          completion = bridge.flush().then(async () => {
            await Promise.resolve();
            const result = receipt.result;
            const currentView = resultCurrent(result);
            settledResult = result;
            return Object.freeze({ result, current: currentView });
          }).finally(() => {
            if (formattingReceipt === receipt)
              formattingReceipt = undefined;
          });
          return true;
        },
        settledCurrent() {
          try {
            if (modalOpen() && !dialogCurrent())
              return false;
            return resultCurrent(settledResult);
          } catch {
            return false;
          }
        },
        settle() {
          return completion ?? Promise.resolve(Object.freeze({ result: null, current: false }));
        }
      });
    },
    captureRangeFormatting(property) {
      const state = rangeViewState();
      if (!state)
        return null;
      if (!rangeWritable(state))
        return Object.freeze({
          state,
          value: null,
          reason: "ReadOnlyDocument",
          request: () => false
        });
      const captured = direct.captureRangeFormatting(property, () => rangeViewState() === state && rangeWritable(state));
      if (!captured || rangeViewState() !== state)
        return null;
      let used = false;
      return Object.freeze({
        state,
        value: captured.value,
        reason: captured.reason,
        request() {
          if (used)
            return false;
          used = true;
          return rangeViewState() === state && rangeWritable(state) && captured.request() === true;
        }
      });
    },
    canPasteInput() {
      return !closed && direct.canPasteInput();
    },
    focusForPaste() {
      if (closed || !direct.canPasteInput())
        return false;
      return direct.focusInput() && !closed && direct.canPasteInput();
    },
    setScale(value) {
      return !closed && renderer.setViewScale(value);
    },
    setDisplayOptions(options) {
      return !closed && renderer.setDisplayOptions(options);
    },
    getDisplayOptions() {
      return closed ? undefined : renderer.getDisplayOptions();
    },
    getContextPicture() {
      const state = editor.getEditorState();
      const key = `${state.documentId}:${state.generation}:${state.operationRevision}:${state.viewRevision}`;
      if (closed || nonTextHistoryPending !== undefined || !lease?.isActive() || state.status !== "ready" || observedStateVersion !== state.stateVersion || key !== displayed || bridge?.busy() || !direct?.settled?.())
        return;
      const picture = renderer.selectedPicture?.();
      if (!picture)
        return null;
      if (![picture.section, picture.pictureNode].every((value) => Number.isSafeInteger(value) && value >= 0 && value <= 4294967295))
        return;
      return Object.freeze({
        ...state.token,
        section: picture.section,
        pictureNode: picture.pictureNode
      });
    },
    getSelection() {
      return editor.getEditorState().selection ?? null;
    },
    async flushComposition() {
      if (closed)
        return "blocked";
      const answer = direct.flushComposition();
      if (answer !== "blocked")
        await bridge.flush();
      return answer;
    },
    dispose() {
      if (!disposal) {
        cleanup();
        disposal = Promise.allSettled([
          bridge.flush(),
          nonTextHistoryTask,
          ...formattingTasks
        ]).then((results) => {
          for (const result of results.slice(0, 2))
            if (result.status === "rejected")
              throw result.reason;
        });
      }
      return disposal;
    }
  };
}
// packages/vanilla/src/shortcuts.ts
import {
  compileKeymap,
  resolveKeyboardShortcut
} from "@ohah/hwpjs";
function createKeyboardShortcuts(options) {
  let compiled = compileKeymap(options.config, options.platform), closed = false;
  const fallback = options.fallback ? compileKeymap(options.fallback, options.platform) : undefined;
  const keyboard = (event) => {
    if (closed || event.defaultPrevented)
      return;
    const target = event.target;
    if (target && typeof target.closest === "function" && target.closest("input,textarea,select,[contenteditable]") && !target.closest("[data-hwpjs-document-input]"))
      return;
    const input = {
      code: event.code,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      isComposing: event.isComposing,
      keyCode: event.keyCode,
      repeat: event.repeat,
      altGraph: event.getModifierState?.("AltGraph") === true
    };
    const binding = resolveKeyboardShortcut(compiled, input);
    if (!binding) {
      const initialInput = { ...input, repeat: false };
      const original = event.repeat && resolveKeyboardShortcut(compiled, initialInput) || fallback && resolveKeyboardShortcut(fallback, initialInput);
      if (original) {
        event.stopPropagation();
        if (event.repeat || ["copy", "cut", "paste", "undo", "redo"].includes(original.command))
          event.preventDefault();
      }
      return;
    }
    event.stopPropagation();
    try {
      if (!options.isAvailable(binding.command)) {
        event.preventDefault();
        options.onUnavailable?.(binding.command);
        return;
      }
      const primary = options.platform === "mac" ? input.metaKey && !input.ctrlKey : input.ctrlKey && !input.metaKey;
      if (binding.command === "paste" && input.code === "KeyV" && primary && !input.altKey && !input.shiftKey && options.nativePaste?.() === true) {
        if (!options.isAvailable(binding.command)) {
          event.preventDefault();
          options.onUnavailable?.(binding.command);
        }
        return;
      }
      event.preventDefault();
      const result = options.execute(binding.command);
      if (result && typeof result.then === "function")
        result.catch((error) => {
          if (!closed)
            options.onError?.(error);
        });
    } catch (error) {
      event.preventDefault();
      if (!closed)
        options.onError?.(error);
    }
  };
  options.root.addEventListener("keydown", keyboard, true);
  return {
    setConfig(config) {
      if (closed)
        throw Error("KeyboardShortcutsDisposed");
      const next = compileKeymap(config, options.platform);
      compiled = next;
    },
    dispose() {
      if (closed)
        return;
      closed = true;
      options.root.removeEventListener("keydown", keyboard, true);
    }
  };
}
export {
  createCanvasSurface,
  createKeyboardShortcuts
};
