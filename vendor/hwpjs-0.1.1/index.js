import {
  consumeNativeRuntimeOrigin,
  RuntimeAdmissionRejected,
  hasRuntimeAdmission,
  requestAtRuntimeAdmission,
  BORDER_LINE_STYLES2,
  BORDER_WIDTHS_HUNDREDTH_MM2,
  paragraphMarginArgs,
  availableSectionCopyRequest,
  characterUnderlineArg
} from "./chunk-c8kv1wt8.js";
import {
  FONT_LANGUAGES,
  validFontFaceOrder,
  sourceTextChange,
  paragraphSpacingArgs,
  paragraphAlignmentKey,
  paragraphAlignmentValue,
  characterColorArg,
  validateHwp5PictureSources
} from "./chunk-jk4tbr51.js";
import {
  hwp5StructuralEditableStart,
  typingSourceSpan
} from "./chunk-pger00hh.js";
import {
  characterFontNameArgs,
  characterPropertyArgs
} from "./chunk-bnqtzsr8.js";
import {
  paragraphSelectionOwner,
  characterRangeValues,
  isUtf16Boundary,
  characterSizeState,
  characterSelectionState
} from "./chunk-2q1tayv5.js";
import {
  isPlainOwnerBaseline,
  mergeExclusiveOwnerWindow,
  bindGeometryProjectionPort,
  createGeometryEvidenceController
} from "./chunk-qhxn3wfm.js";
import {
  copyOwned,
  freezeDTO,
  isPromiseLike,
  discardPromise,
  isOwnedImmutableObservation,
  ownObservation
} from "./chunk-w9ezghmp.js";
var __chunkGraphs;
var __chunkSeen;
var __chunkNonce;
var __preload = (id, seenOnly) => {
  for (var [base, graph, ids] of __chunkGraphs || [])
    for (var stack = [id], g = globalThis, d = g.document, head, j, node, k, link;j = stack.pop(); )
      if (!__chunkSeen[j] && (node = graph[j])) {
        __chunkSeen[j] = 1;
        for (k = 1;k < node.length; k++)
          stack.push(ids[node[k]]);
        if (!seenOnly && j !== id && (head = d && d.head)) {
          if (__chunkNonce === undefined)
            __chunkNonce = (k = d.querySelector("meta[property=csp-nonce]")) && (k.nonce || k.getAttribute("nonce")) || "";
          link = d.createElement("link");
          link.rel = "modulepreload";
          link.crossOrigin = "";
          if (__chunkNonce)
            link.nonce = __chunkNonce;
          link.href = new g.URL(node[0], base);
          head.appendChild(link);
        }
      }
};
var __chunks = (base, ids, nodes, entry) => {
  for (var graph = {}, i = 0;i < ids.length; i++)
    graph[ids[i]] = nodes[i];
  (__chunkGraphs ||= []).push([base, graph, ids]);
  __chunkSeen ||= {};
  __preload(ids[entry], 1);
};
__chunks(import.meta.url,["n0f9hgwp","ge650rt9","f3rm8ern","c8kv1wt8","jk4tbr51","pger00hh","bnqtzsr8","2q1tayv5","qhxn3wfm","w9ezghmp","vk1f4vr4","d6j1r7hv","vq9qdwke","rmgwrdxt","gx7k5hbb","x8k5ryaa","6ffsr0y9","knp5zb8y","mff70c55","wvrkyaca"],[["./index.js",3,4,5,6,7,8,9],["./chunk-ge650rt9.js",10,11,12,6,13,14,15,16],["./chunk-f3rm8ern.js",17,11,12,6,18,14,16],["./chunk-c8kv1wt8.js"],["./chunk-jk4tbr51.js"],["./chunk-pger00hh.js",6,7],["./chunk-bnqtzsr8.js",4],["./chunk-2q1tayv5.js",4],["./chunk-qhxn3wfm.js",9],["./chunk-w9ezghmp.js"],["./chunk-vk1f4vr4.js",3,11,16,4,15,12,6,13,14],["./chunk-d6j1r7hv.js",3,16,6],["./chunk-vq9qdwke.js",4],["./chunk-rmgwrdxt.js",14,15],["./chunk-gx7k5hbb.js",4,16],["./chunk-x8k5ryaa.js"],["./chunk-6ffsr0y9.js"],["./chunk-knp5zb8y.js",3,11,16,4,12,6,18,14,19],["./chunk-mff70c55.js",14,19],["./chunk-wvrkyaca.js"]],0);

// packages/core/src/commands/formatting-resource-intent.ts
var styles = new Set(BORDER_LINE_STYLES2);
var widths = new Set(BORDER_WIDTHS_HUNDREDTH_MM2);
var hatch = new Set(["HORIZONTAL", "VERTICAL", "BACK_SLASH", "SLASH", "CROSS", "CROSS_DIAGONAL"]);
function object(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw Error("InvalidFormattingResource");
  return value;
}
function keys(value, allowed) {
  for (const key of Object.keys(value))
    if (!allowed.includes(key))
      throw Error(`UnknownFormattingField:${key}`);
}
function integer(value, minimum, maximum) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || value > maximum)
    throw Error("InvalidFormattingResourceValue");
}
function rgb(value) {
  integer(value, 0, 16777215);
}
function validateBorderPatch(value) {
  const border = object(value);
  keys(border, ["left", "right", "top", "bottom"]);
  let present = false;
  for (const edge of Object.values(border)) {
    if (edge === undefined)
      continue;
    const row = object(edge);
    keys(row, ["style", "widthHundredthMm", "color"]);
    if (row.style !== undefined) {
      if (!styles.has(row.style))
        throw Error("UnsupportedBorderLineStyle");
      present = true;
    }
    if (row.widthHundredthMm !== undefined) {
      if (!widths.has(row.widthHundredthMm))
        throw Error("UnsupportedBorderWidth");
      present = true;
    }
    if (row.color !== undefined) {
      rgb(row.color);
      present = true;
    }
  }
  return present;
}
function validateBackgroundPatch(value) {
  const row = object(value);
  switch (row.kind) {
    case "none":
      keys(row, ["kind"]);
      return;
    case "solid":
      keys(row, ["kind", "color", "hatchColor"]);
      rgb(row.color);
      if (row.hatchColor !== undefined)
        rgb(row.hatchColor);
      return;
    case "hatch":
      keys(row, ["kind", "faceColor", "hatchColor", "style"]);
      rgb(row.faceColor);
      rgb(row.hatchColor);
      if (!hatch.has(row.style))
        throw Error("UnsupportedBackgroundHatch");
      return;
    case "linear":
      keys(row, ["kind", "colors", "angle", "centerX", "centerY", "step", "stepCenter"]);
      if (!Array.isArray(row.colors) || row.colors.length !== 2)
        throw Error("UnsupportedBackgroundStops");
      for (const color of row.colors)
        rgb(color);
      integer(row.angle, 0, 359);
      for (const name of ["centerX", "centerY", "step", "stepCenter"])
        integer(row[name], 0, 100);
      return;
    default:
      throw Error("UnsupportedBackgroundKind");
  }
}
var BORDER_LINE_STYLES = Object.freeze([...styles]);
var BORDER_WIDTHS_HUNDREDTH_MM = Object.freeze([...widths]);
var BACKGROUND_HATCH_STYLES = Object.freeze([...hatch]);

// packages/core/src/commands/character-formatting-patch.ts
var characterLineStyles = [
  "SOLID",
  "DASH",
  "DOT",
  "DASH_DOT",
  "DASH_DOT_DOT",
  "LONG_DASH",
  "CIRCLE",
  "DOUBLE_SLIM",
  "SLIM_THICK",
  "THICK_SLIM",
  "SLIM_THICK_SLIM",
  "WAVE",
  "DOUBLEWAVE",
  "THICK3D",
  "THICKREV3D",
  "3D",
  "REV3D"
];
var lineStyles = new Set(characterLineStyles);
function record(value, allowed) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
    throw Error("InvalidFormattingPatch");
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !allowed.includes(key))
      throw Error("UnknownFormattingField");
    if (!("value" in Object.getOwnPropertyDescriptor(value, key)))
      throw Error("InvalidFormattingPatch");
  }
  return value;
}
function integer2(value, lo, hi) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < lo || value > hi)
    throw Error("InvalidCharacterFormattingValue");
}
function rgb2(value) {
  integer2(value, 0, 16777215);
}
function choice(value, values) {
  if (typeof value !== "string" || !values.includes(value))
    throw Error("UnsupportedCharacterFormattingValue");
}
function boolean(value) {
  if (typeof value !== "boolean")
    throw Error("InvalidCharacterFormattingValue");
}
function validateCharacterFormattingPatch(value) {
  const c = record(value, [
    "size",
    "bold",
    "italic",
    "textColor",
    "fonts",
    "ratio",
    "charSpacing",
    "relativeSize",
    "offset",
    "underline",
    "strike",
    "shade",
    "outlineKind",
    "effects",
    "shadow",
    "border",
    "background"
  ]);
  if (c.size !== undefined)
    integer2(c.size, 0, 409600);
  for (const key of ["bold", "italic"])
    if (c[key] !== undefined)
      boolean(c[key]);
  if (c.textColor !== undefined)
    rgb2(c.textColor);
  if (c.fonts !== undefined) {
    const fonts = record(c.fonts, FONT_LANGUAGES);
    for (const language of FONT_LANGUAGES) {
      if (fonts[language] === undefined)
        continue;
      const f = record(fonts[language], ["id", "name"]);
      if (f.id !== undefined === (f.name !== undefined))
        throw Error("InvalidCharacterFontIntent");
      if (f.id !== undefined)
        integer2(f.id, 0, 4294967295);
      else
        characterFontNameArgs(language, f.name);
    }
  }
  for (const [key, lo, hi] of [
    ["ratio", 50, 200],
    ["charSpacing", -50, 50],
    ["relativeSize", 10, 250],
    ["offset", -100, 100]
  ]) {
    if (c[key] === undefined)
      continue;
    const metrics = record(c[key], FONT_LANGUAGES);
    for (const v of Object.values(metrics))
      if (v !== undefined)
        integer2(v, lo, hi);
  }
  for (const key of ["underline", "strike"]) {
    if (c[key] === undefined)
      continue;
    const d = record(c[key], key === "underline" ? ["kind", "style", "color"] : ["enabled", "style", "color"]);
    if (d.color !== undefined)
      rgb2(d.color);
    if (d.style !== undefined && !lineStyles.has(d.style))
      throw Error("UnsupportedCharacterLineStyle");
    if (key === "underline" && d.kind !== undefined)
      choice(d.kind, ["none", "bottom", "center", "top"]);
    if (key === "strike" && d.enabled !== undefined)
      boolean(d.enabled);
  }
  if (c.shade !== undefined) {
    const s = record(c.shade, ["kind", "color"]);
    choice(s.kind, ["none", "color"]);
    if (s.kind === "none") {
      if (s.color !== undefined)
        throw Error("InvalidCharacterShade");
    } else
      rgb2(s.color);
  }
  if (c.outlineKind !== undefined)
    choice(c.outlineKind, ["none", "solid", "dot", "thick", "dash", "dash_dot", "dash_dot_dot"]);
  if (c.effects !== undefined) {
    const e = record(c.effects, ["relief", "script"]);
    if (e.relief !== undefined)
      choice(e.relief, ["none", "emboss", "engrave"]);
    if (e.script !== undefined)
      choice(e.script, ["normal", "superscript", "subscript"]);
  }
  if (c.shadow !== undefined) {
    const s = record(c.shadow, ["kind", "offsetX", "offsetY", "color"]);
    if (s.kind !== undefined)
      choice(s.kind, ["none", "drop", "continuous"]);
    for (const k of ["offsetX", "offsetY"])
      if (s[k] !== undefined)
        integer2(s[k], -100, 100);
    if (s.color !== undefined)
      rgb2(s.color);
  }
  if (c.border !== undefined)
    validateBorderPatch(c.border);
  if (c.background !== undefined)
    validateBackgroundPatch(c.background);
}
function hasCharacterFormattingPatch(c) {
  if (!c)
    return false;
  if (c.border && validateBorderPatch(c.border))
    return true;
  if (c.background !== undefined || c.shade !== undefined)
    return true;
  for (const key of ["size", "bold", "italic", "textColor", "outlineKind"])
    if (c[key] !== undefined)
      return true;
  for (const key of [
    "fonts",
    "ratio",
    "charSpacing",
    "relativeSize",
    "offset",
    "underline",
    "strike",
    "effects",
    "shadow"
  ])
    if (c[key] && Object.values(c[key]).some((v) => v !== undefined))
      return true;
  return false;
}
function validateFormattingReset(value) {
  const r = record(value, ["basis", "scope"]);
  if (r.basis !== "paragraph-style")
    throw Error("UnsupportedFormattingReset");
  choice(r.scope, ["character", "paragraph", "all"]);
}

// packages/core/src/commands/original-paragraph-reference.ts
function validateOriginalParagraphReference(target, row, errorName) {
  if (target.format !== "hwp5")
    return;
  const ref = row.currentReference;
  if (ref?.kind !== "original" || ref.section !== target.section || typeof ref.id !== "string" || !/^(0|[1-9][0-9]*)$/.test(ref.id) || BigInt(ref.id) > 0xffffffffn) {
    throw Error(errorName);
  }
}

// packages/core/src/internal/paragraph-index.ts
var duplicate = Symbol("DuplicateParagraphCoordinate");
var fallback = Symbol("ParagraphIndexFallback");
function createParagraphRowLookup(visit) {
  const indexes = new WeakMap;
  return function uniqueParagraphRow(paragraphs, section, paragraph) {
    const scan = () => {
      const matches = paragraphs?.filter((row) => {
        visit?.("fallback");
        return row.section === section && row.paragraph === paragraph;
      });
      return matches?.length === 1 ? matches[0] : undefined;
    };
    if (!isOwnedImmutableObservation(paragraphs) || !Array.isArray(paragraphs))
      return scan();
    let index = indexes.get(paragraphs);
    if (index === undefined) {
      const built = new Map;
      let eligible = true;
      for (let i = 0;i < paragraphs.length; i++) {
        visit?.("index");
        const slot = Object.getOwnPropertyDescriptor(paragraphs, String(i));
        const row = slot && "value" in slot ? slot.value : undefined;
        if (!isOwnedImmutableObservation(row)) {
          eligible = false;
          break;
        }
        const s = Object.getOwnPropertyDescriptor(row, "section");
        const p = Object.getOwnPropertyDescriptor(row, "paragraph");
        if (!s || !p || !("value" in s) || !("value" in p) || !Number.isSafeInteger(s.value) || s.value < 0 || !Number.isSafeInteger(p.value) || p.value < 0) {
          eligible = false;
          break;
        }
        let sectionRows = built.get(s.value);
        if (!sectionRows)
          built.set(s.value, sectionRows = new Map);
        sectionRows.set(p.value, sectionRows.has(p.value) ? duplicate : row);
      }
      index = eligible ? built : fallback;
      indexes.set(paragraphs, index);
    }
    if (index === fallback)
      return scan();
    const row = index.get(section)?.get(paragraph);
    return row === duplicate ? undefined : row;
  };
}
var uniqueParagraphRow = createParagraphRowLookup();

// packages/core/src/commands/selection.ts
function validateToken(token, state, view = false) {
  if (!token || token.editorId !== state.editorId || token.documentId !== state.documentId || token.generation !== state.generation || token.operationRevision !== state.operationRevision || view && token.viewRevision !== state.viewRevision)
    throw Error("StaleTarget");
}
function validateSelection(target, state, editable = false) {
  validateToken(target, state, true);
  if (target.coordinateSpace !== "display" || !["hwp5", "hwpx"].includes(target.format) || !["forward", "backward"].includes(target.affinity))
    throw Error("InvalidCoordinateSpace");
  const content = state.content;
  if (!content || content.format !== target.format)
    throw Error("InvalidCoordinateSpace");
  if (![target.section, target.paragraph, target.startUnit, target.endUnit].every((x) => Number.isSafeInteger(x) && x >= 0) || target.endUnit < target.startUnit)
    throw Error("InvalidTextPosition");
  const row = uniqueParagraphRow(content.paragraphs, target.section, target.paragraph);
  if (!row || row.clipped || target.owner !== paragraphSelectionOwner(row) || !paragraphSelectionOwner(row))
    throw Error("InvalidSelectionOwner");
  if (editable && !row.editable)
    throw Error("SelectionNotEditable");
  if (typeof row.text !== "string" || target.endUnit > row.text.length)
    throw Error("InvalidTextPosition");
  const insideSurrogate = (at) => at > 0 && at < row.text.length && /[\uD800-\uDBFF]/.test(row.text[at - 1]) && /[\uDC00-\uDFFF]/.test(row.text[at]);
  if (insideSurrogate(target.startUnit) || insideSurrogate(target.endUnit))
    throw Error("InvalidScalarBoundary");
  return row;
}
function selectionMessage(target, state) {
  const row = validateSelection(target, state, true);
  if (row.createdCell)
    throw Error("CreatedCellRequiresSurfacePort");
  const change = {
    section: target.section,
    paragraph: target.paragraph,
    startUnit: target.startUnit,
    endUnit: target.endUnit
  };
  const mapped = target.format === "hwp5" ? sourceTextChange(change, row.sourceOffsets) : change;
  if (mapped.endUnit - mapped.startUnit !== target.endUnit - target.startUnit)
    throw Error("ProtectedAnchorRange");
  return {
    ...mapped,
    ...row.currentReference === undefined ? {} : { reference: row.currentReference }
  };
}

// packages/core/src/commands/atomic-formatting.ts
function object2(v, allowed) {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw Error("InvalidFormattingPatch");
  if (Object.keys(v).some((k) => !allowed.includes(k)))
    throw Error("UnknownFormattingField");
  return v;
}
function validateParagraphFormattingPatch(value) {
  const root = object2(value, ["paragraph"]);
  if (!Object.hasOwn(root, "paragraph"))
    throw Error("InvalidFormattingPatch");
  const p = object2(root.paragraph, [
    "alignment",
    "margins",
    "spacing",
    "grid",
    "borderConnect",
    "border",
    "background"
  ]);
  if (p.alignment !== undefined && paragraphAlignmentValue(p.alignment) === undefined)
    throw Error("InvalidParagraphAlignment");
  if (p.margins !== undefined) {
    const m = object2(p.margins, ["left", "right", "indent", "before", "after"]);
    if (Object.values(m).some((v) => v === null))
      throw Error("InvalidParagraphMargins");
    paragraphMarginArgs(m);
  }
  if (p.spacing !== undefined) {
    const v = object2(p.spacing, ["kind", "value"]);
    const kinds = {
      percent: "PERCENT",
      fixed: "FIXED",
      between: "BETWEEN_LINES",
      at_least: "AT_LEAST"
    };
    paragraphSpacingArgs(kinds[v.kind], v.value);
  }
  for (const key of ["grid", "borderConnect"])
    if (p[key] !== undefined && typeof p[key] !== "boolean")
      throw Error("InvalidParagraphFlags");
  if (p.border !== undefined)
    validateBorderPatch(p.border);
  if (p.background !== undefined)
    validateBackgroundPatch(p.background);
}
function validateFormattingPatch(value) {
  const root = object2(value, ["paragraph", "character", "reset"]);
  if (!["paragraph", "character", "reset"].some((key) => Object.hasOwn(root, key)))
    throw Error("InvalidFormattingPatch");
  if (Object.hasOwn(root, "paragraph"))
    validateParagraphFormattingPatch({ paragraph: root.paragraph });
  if (Object.hasOwn(root, "character"))
    validateCharacterFormattingPatch(root.character);
  if (Object.hasOwn(root, "reset")) {
    validateFormattingReset(root.reset);
    const patch = root;
    if (hasCharacterFormattingPatch(patch.character) || hasParagraphFormattingPatch(patch))
      throw Error("ConflictingFormattingReset");
  }
}
function hasParagraphFormattingPatch(patch) {
  const p = patch.paragraph;
  if (!p)
    return false;
  if (p.alignment !== undefined || p.spacing !== undefined || p.grid !== undefined || p.borderConnect !== undefined || p.background !== undefined)
    return true;
  if (p.border && validateBorderPatch(p.border))
    return true;
  return !!p.margins && Object.values(p.margins).some((value) => value !== undefined);
}
function formattingPatchNeedsCharacter(patch) {
  return !!(patch.reset && patch.reset.scope !== "paragraph") || hasCharacterFormattingPatch(patch.character);
}
function atomicSelector(target, state, write, character) {
  const row = validateSelection(target, state, write);
  if (character && target.startUnit === target.endUnit)
    throw Error("EmptyCharacterSelection");
  if (row.createdCell)
    throw Error("CreatedCellRequiresSurfacePort");
  if (!row.tableCell && !row.drawingText && !row.drawingCaption && target.owner !== `section:${target.section}:body`)
    throw Error("UnsupportedFormattingOwner");
  validateOriginalParagraphReference(target, row, "UnsupportedFormattingReference");
  let ranges;
  if (character && target.startUnit !== target.endUnit) {
    const change = {
      section: target.section,
      paragraph: target.paragraph,
      startUnit: target.startUnit,
      endUnit: target.endUnit
    };
    const mapped = target.format === "hwp5" ? sourceTextChange(change, row.sourceOffsets) : change;
    if (mapped.endUnit - mapped.startUnit !== target.endUnit - target.startUnit)
      throw Error("ProtectedAnchorRange");
    ranges = [{ startUnit: mapped.startUnit, endUnit: mapped.endUnit }];
  }
  return {
    kind: "original-paragraph",
    section: target.section,
    paragraph: target.paragraph,
    ...ranges ? { ranges } : {}
  };
}

// packages/core/src/commands/formatting-patch.ts
function assertFormattingAdmission(payload, stateVersion, capability) {
  if (payload.selectionVersion === undefined)
    return;
  if (!Number.isSafeInteger(payload.selectionVersion) || payload.selectionVersion < 0)
    throw Error("InvalidSelectionVersion");
  if (capability?.version !== 1 || capability.epoch !== "stateVersion" || !capability.commands.includes("APPLY_FORMATTING_PATCH"))
    throw Error("SelectionFenceUnavailable");
  if (payload.selectionVersion !== stateVersion)
    throw Error("StaleFormattingSelection");
}

// packages/core/src/editor/write-policy.ts
class EditorWritePolicy {
  editable = false;
  publish(editable, commit) {
    const previous = this.editable;
    this.editable = editable;
    try {
      commit();
    } catch (error) {
      this.editable = previous;
      throw error;
    }
  }
  assertWritable() {
    if (!this.editable)
      throw Error("ReadOnlyDocument");
  }
  observe(content, editable = this.editable) {
    if (editable || !content || typeof content !== "object" || Array.isArray(content))
      return content;
    const observed = content;
    return {
      ...observed,
      readOnly: true,
      ...Array.isArray(observed.paragraphs) ? {
        paragraphs: observed.paragraphs.map((row) => row && typeof row === "object" ? { ...row, editable: false } : row)
      } : {}
    };
  }
  capabilities(value, editable = this.editable) {
    return editable ? value : {
      ...value && typeof value === "object" ? value : {},
      readOnly: true,
      historyAvailable: false
    };
  }
}

// packages/core/src/state/history-state.ts
var unavailable = Object.freeze({
  available: false,
  canUndo: false,
  canRedo: false
});
function getHistoryAvailability(state) {
  if (state.historyRecoveryRequired || state.nativeHistoryStats?.poisoned === true || state.status !== "ready" || state.capabilities?.readOnly === true)
    return unavailable;
  const { nativeHistoryRevision: current, nativeHistoryRevisions: reachable } = state;
  const valid = (value) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value < 4294967295;
  if (!valid(current) || !Array.isArray(reachable) || reachable.length < 1 || reachable.length > 65536 || reachable[0] !== current || !reachable.every(valid) || new Set(reachable).size !== reachable.length)
    return unavailable;
  return Object.freeze({
    available: true,
    canUndo: reachable.some((revision) => revision < current),
    canRedo: reachable.some((revision) => revision > current)
  });
}

// packages/core/src/state/selection-history.ts
class SelectionHistory {
  #documentId = null;
  #generation = -1;
  #locations = new Map;
  clear() {
    this.#locations.clear();
    this.#documentId = null;
    this.#generation = -1;
  }
  #reachable(state) {
    if (!getHistoryAvailability(state).available)
      return;
    return new Set(state.nativeHistoryRevisions);
  }
  observe(state) {
    if (state.documentId !== this.#documentId || state.generation !== this.#generation) {
      this.clear();
      this.#documentId = state.documentId;
      this.#generation = state.generation;
    }
    if (state.status === "disposed") {
      this.clear();
      return;
    }
    if (state.status !== "ready" || !state.documentId)
      return;
    const reachable = this.#reachable(state);
    if (!reachable) {
      this.#locations.clear();
      return;
    }
    for (const revision of this.#locations.keys())
      if (!reachable.has(revision))
        this.#locations.delete(revision);
    const selected = state.selection;
    if (selected === undefined)
      return;
    const revision = state.nativeHistoryRevision;
    if (selected === null) {
      this.#locations.set(revision, null);
      return;
    }
    try {
      const target = selected;
      validateSelection(target, state);
      this.#locations.set(revision, Object.freeze({
        coordinateSpace: target.coordinateSpace,
        format: target.format,
        owner: target.owner,
        section: target.section,
        paragraph: target.paragraph,
        startUnit: target.startUnit,
        endUnit: target.endUnit,
        affinity: target.affinity
      }));
    } catch {
      this.#locations.delete(revision);
    }
  }
  restore(state) {
    if (state.status !== "ready" || !state.documentId || state.documentId !== this.#documentId || state.generation !== this.#generation)
      return;
    const reachable = this.#reachable(state), revision = state.nativeHistoryRevision;
    if (!reachable || !reachable.has(revision))
      return;
    const location = this.#locations.get(revision);
    if (location === undefined || location === null)
      return location;
    const target = Object.freeze({ ...location, ...state.token });
    try {
      validateSelection(target, state);
      return target;
    } catch {
      return;
    }
  }
}

// packages/core/src/state/paragraph-selection.ts
function createParagraphSelection(state, options) {
  if (!options || typeof options !== "object" || Array.isArray(options) || ![Object.prototype, null].includes(Object.getPrototypeOf(options)))
    throw Error("InvalidParagraphSelectionOptions");
  for (const key of Reflect.ownKeys(options)) {
    if (typeof key !== "string" || !["section", "paragraph", "startUnit", "endUnit", "affinity"].includes(key) || !("value" in Object.getOwnPropertyDescriptor(options, key)))
      throw Error("InvalidParagraphSelectionOptions");
  }
  if (state.status !== "ready")
    throw Error("EditorNotReady");
  const content = state.content;
  if (!content || !["hwp5", "hwpx"].includes(content.format ?? ""))
    throw Error("InvalidCoordinateSpace");
  const row = Array.isArray(content.paragraphs) ? content.paragraphs.find((item) => item.section === options.section && item.paragraph === options.paragraph) : undefined;
  const target = {
    ...state.token,
    coordinateSpace: "display",
    format: content.format,
    owner: paragraphSelectionOwner(row) ?? "",
    section: options.section,
    paragraph: options.paragraph,
    startUnit: options.startUnit,
    endUnit: options.endUnit === undefined ? options.startUnit : options.endUnit,
    affinity: options.affinity === undefined ? "forward" : options.affinity
  };
  validateSelection(target, state);
  return Object.freeze(target);
}

// packages/core/src/editor/new-document-selection.ts
function createNewDocumentSelection(state) {
  const content = state.content;
  if (state.status !== "ready" || !content || content.readOnly === true || !Array.isArray(content.paragraphs) || content.paragraphs.length !== 1)
    return;
  const row = content.paragraphs[0];
  if (!row || row.section !== 0 || row.paragraph !== 0 || row.editable !== true || row.clipped || row.tableCell || row.drawingText || row.drawingCaption || row.createdCell || row.textSourcePolicyError != null || row.selectionOwner !== "section:0:body")
    return;
  let startUnit;
  if (content.format === "hwpx" && row.text === "")
    startUnit = 0;
  else if (content.format === "hwp5" && row.text === "￼￼" && Array.isArray(row.sourceOffsets) && row.sourceOffsets.length === 3 && hwp5StructuralEditableStart(row) === 2)
    startUnit = 2;
  else
    return;
  try {
    const target = createParagraphSelection(state, { section: 0, paragraph: 0, startUnit });
    validateSelection(target, state, true);
    return target;
  } catch {
    return;
  }
}

// packages/core/src/editor/load-source-options.ts
function loadSourceOptions(options) {
  if (options.availableSectionCopy === undefined)
    return {};
  availableSectionCopyRequest({
    format: options.format,
    availableSectionCopy: options.availableSectionCopy,
    distribution: options.enableOptions?.distribution,
    normalizeObservedCfb: options.enableOptions?.normalizeObservedCfb
  });
  return { availableSectionCopy: options.availableSectionCopy };
}

// packages/core/src/state/text-scalar.ts
function isWellFormedText(text) {
  return !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(text);
}

// packages/core/src/state/editor-state.ts
class EditorState {
  editorId;
  documentId;
  generation;
  operationRevision;
  viewRevision;
  stateVersion;
  historyRecoveryRequired;
  status;
  nativeHistoryRevision;
  savedOperationRevision;
  #historyStats;
  #historyRevisions;
  #content;
  #capabilities;
  #selection;
  #read;
  constructor(data, read = localRead) {
    this.historyRecoveryRequired = data.historyRecoveryRequired === true;
    this.editorId = data.editorId;
    this.documentId = data.documentId;
    this.generation = data.generation;
    this.operationRevision = data.operationRevision;
    this.viewRevision = data.viewRevision;
    this.stateVersion = data.stateVersion;
    this.status = data.status;
    this.#historyStats = ownObservation(data.nativeHistoryStats);
    this.nativeHistoryRevision = data.nativeHistoryRevision;
    this.#historyRevisions = ownObservation(data.nativeHistoryRevisions);
    this.savedOperationRevision = data.savedOperationRevision;
    this.#content = ownObservation(data.content);
    this.#capabilities = ownObservation(data.capabilities);
    this.#selection = ownObservation(data.selection);
    this.#read = read;
    Object.freeze(this);
  }
  get nativeHistoryStats() {
    return this.#historyStats();
  }
  get nativeHistoryRevisions() {
    return this.#historyRevisions();
  }
  get token() {
    return Object.freeze({
      editorId: this.editorId,
      documentId: this.documentId,
      generation: this.generation,
      operationRevision: this.operationRevision,
      viewRevision: this.viewRevision
    });
  }
  get content() {
    return this.#content();
  }
  get capabilities() {
    return this.#capabilities();
  }
  get selection() {
    return this.#selection();
  }
  read(callback) {
    return this.#read(callback, this);
  }
}
function localRead(callback, state) {
  const result = callback(state);
  if (isPromiseLike(result)) {
    discardPromise(result);
    throw Error("AsyncRead");
  }
  return result;
}

// packages/core/src/commands/surface-protocol.ts
var SURFACE_READ_KINDS = Object.freeze([
  "formatting-capabilities",
  "query-formatting",
  "query-window",
  "query-edit-window",
  "query-edit-range",
  "query-split-range",
  "query-current-references",
  "query-current-source-references",
  "query-current-text",
  "query-created-tables",
  "picture-bytes",
  "table-background-bytes",
  "chart-display",
  "chart-points",
  "chart-series-text",
  "chart-rich-text",
  "inline-string-sources",
  "equation-sources",
  "equation-script-query",
  "dutmal-text-query"
]);
var SURFACE_MUTATION_KINDS = Object.freeze([
  "formatting-patch",
  "splice",
  "splice-current",
  "splice-font-name",
  "splice-character-properties",
  "created-cell-text",
  "insert-table",
  "undo",
  "redo",
  "split",
  "merge",
  "format",
  "replace-paragraph-ranges",
  "character-properties",
  "character-properties-ranges",
  "character-font",
  "character-font-ranges",
  "character-font-name",
  "character-font-name-ranges",
  "character-outline",
  "character-outline-ranges",
  "character-effect",
  "character-effect-ranges",
  "character-shade",
  "character-shade-ranges",
  "character-text-color",
  "character-text-color-ranges",
  "character-strike",
  "character-strike-ranges",
  "character-strike-color",
  "character-underline",
  "character-underline-ranges",
  "character-underline-color",
  "paragraph-format",
  "paragraph-alignment",
  "paragraph-spacing",
  "paragraph-margins",
  "formula-definition",
  "manual-formula-result",
  "chart-points-set",
  "chart-numeric-point",
  "chart-point",
  "chart-series-text-set",
  "chart-rich-text-set",
  "equation-script-set",
  "dutmal-text",
  "radio-select",
  "checkbox-state",
  "form-text",
  "picture-resize",
  "picture-current-size",
  "picture-dimensions",
  "table-column-width",
  "cell-size",
  "cell-background",
  "cell-border",
  "cell-borders",
  "cell-appearance",
  "cell-styles"
]);
var SURFACE_VIEW_KINDS = Object.freeze(["enable", "set-edit-window"]);
var reads = new Set(SURFACE_READ_KINDS);
var mutations = new Set(SURFACE_MUTATION_KINDS);
var views = new Set(SURFACE_VIEW_KINDS);
function surfaceOperation(kind) {
  return reads.has(kind) ? "read" : mutations.has(kind) ? "mutation" : views.has(kind) ? "view" : undefined;
}

// packages/core/src/scheduler/cancellation.ts
class CancellationFence {
  #cancelled = false;
  #listeners = new Set;
  get cancelled() {
    return this.#cancelled;
  }
  get subscriberCount() {
    return this.#listeners.size;
  }
  subscribe(listener) {
    if (this.#cancelled) {
      listener();
      return () => {};
    }
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  cancel() {
    if (this.#cancelled)
      return;
    this.#cancelled = true;
    const listeners = [...this.#listeners];
    this.#listeners.clear();
    for (const listener of listeners)
      listener();
  }
}
async function interruptible(task, fences) {
  const already = fences.find(({ fence }) => fence.cancelled);
  if (already) {
    Promise.resolve(task).catch(() => {});
    throw Error(already.error);
  }
  const unsubscribe = [];
  const interrupted = new Promise((_, reject) => {
    for (const { fence, error } of fences)
      unsubscribe.push(fence.subscribe(() => reject(Error(error))));
  });
  try {
    return await Promise.race([task, interrupted]);
  } finally {
    for (const off of unsubscribe)
      off();
  }
}

// packages/core/src/scheduler/fifo.ts
class FifoScheduler {
  #tail = Promise.resolve();
  enqueue(task) {
    const result = this.#tail.then(task);
    this.#tail = result.then(() => {}, () => {});
    return result;
  }
  drain() {
    return this.#tail.then(() => {});
  }
}

// packages/core/src/commands/registry.ts
class CommandRegistry {
  #handlers = new Map;
  #order = 0;
  register(command, callback, priority) {
    if (!Number.isFinite(priority))
      throw Error("InvalidPriority");
    const row = {
      priority,
      order: this.#order++,
      callback
    };
    const rows = this.#handlers.get(command.id) ?? [];
    rows.push(row);
    this.#handlers.set(command.id, rows);
    let active = true;
    return () => {
      if (!active)
        return;
      active = false;
      const next = (this.#handlers.get(command.id) ?? []).filter((x) => x !== row);
      if (next.length)
        this.#handlers.set(command.id, next);
      else
        this.#handlers.delete(command.id);
    };
  }
  capture(command) {
    return [...this.#handlers.get(command.id) ?? []].sort((a, b) => b.priority - a.priority || a.order - b.order);
  }
  run(handlers, payload, copy) {
    for (const handler of handlers) {
      if (Object.prototype.toString.call(handler.callback) === "[object AsyncFunction]")
        throw Error("AsyncCommandHandler");
      const value = handler.callback(copy(payload));
      if (isPromiseLike(value)) {
        discardPromise(value);
        throw Error("AsyncCommandHandler");
      }
      if (typeof value !== "boolean")
        throw Error("InvalidCommandHandlerResult");
      if (value)
        return true;
    }
    return false;
  }
  clear() {
    this.#handlers.clear();
  }
}

// packages/core/src/commands/commands.ts
function createCommand(name) {
  if (!name)
    throw Error("InvalidCommand");
  return Object.freeze({ name, id: Symbol(name) });
}
var SPLICE_TEXT_COMMAND = createCommand("splice-text");
var UNDO_COMMAND = createCommand("undo");
var REDO_COMMAND = createCommand("redo");
var INSERT_TABLE_COMMAND = createCommand("insert-table");
var SET_CHARACTER_PROPERTIES_COMMAND = createCommand("set-character-properties");
var SET_PARAGRAPH_ALIGNMENT_COMMAND = createCommand("set-paragraph-alignment");
var SET_CHARACTER_UNDERLINE_COMMAND = createCommand("set-character-underline");
var SET_CHARACTER_STRIKE_COMMAND = createCommand("set-character-strike");
var SET_CHARACTER_TEXT_COLOR_COMMAND = createCommand("set-character-text-color");
var SET_CHARACTER_FONT_NAME_COMMAND = createCommand("set-character-font-name");
var APPLY_FORMATTING_PATCH_COMMAND = createCommand("apply-formatting-patch");

// packages/core/src/editor/unlock-policy.ts
var passwordErrors = new Set([
  "InvalidPassword",
  "InvalidPasswordUnicode",
  "WrongPasswordOrCorruptPayload"
]);
function retryablePasswordReply(reply) {
  return typeof reply.error === "string" && passwordErrors.has(reply.error) && (reply.applied === false || reply.meta?.application === "unapplied") && reply.applied !== true && reply.meta?.application !== "applied" && reply.meta?.changed !== true && reply.changed !== true;
}

class PasswordAttemptError extends Error {
  retryable = true;
  constructor(message) {
    super(message);
    this.name = "PasswordAttemptError";
  }
}

// packages/core/src/state/formatting-selection.ts
var identity = (reference) => reference && typeof reference === "object" ? Object.fromEntries(Object.entries(reference).filter(([key]) => key !== "epoch")) : reference;
function formattingSelection(previous, patch, revision) {
  const selected = previous.selection;
  if (!selected)
    return;
  try {
    const old = validateSelection(selected, previous);
    const next = new EditorState({
      editorId: previous.editorId,
      documentId: previous.documentId,
      generation: previous.generation,
      operationRevision: revision,
      viewRevision: previous.viewRevision,
      stateVersion: previous.stateVersion,
      status: "ready",
      ...patch
    });
    const target = { ...selected, ...next.token }, row = validateSelection(target, next);
    if (old.text !== row.text || JSON.stringify(identity(old.currentReference)) !== JSON.stringify(identity(row.currentReference)) || JSON.stringify(old.sourceOffsets) !== JSON.stringify(row.sourceOffsets) || JSON.stringify(old.tableCell) !== JSON.stringify(row.tableCell) || JSON.stringify(old.drawingText) !== JSON.stringify(row.drawingText) || JSON.stringify(old.drawingCaption) !== JSON.stringify(row.drawingCaption) || JSON.stringify(old.createdCell) !== JSON.stringify(row.createdCell))
      return;
    return target;
  } catch {
    return;
  }
}

// packages/core/src/commands/formatting.ts
function validateFormattingTarget(target, state, character, capability = character ? "characterPropertiesAvailable" : "paragraphAlignmentAvailable") {
  const row = validateSelection(target, state, true);
  if (row.createdCell)
    throw Error("CreatedCellRequiresSurfacePort");
  const position = character ? selectionMessage(target, state) : {
    section: target.section,
    paragraph: target.paragraph,
    startUnit: target.startUnit,
    endUnit: target.endUnit,
    reference: undefined
  };
  const content = state.content;
  if (content[capability] !== true)
    throw Error("FormattingCapabilityUnavailable");
  if (!row.tableCell && !row.drawingText && !row.drawingCaption && target.owner !== `section:${target.section}:body`)
    throw Error("UnsupportedFormattingOwner");
  validateOriginalParagraphReference(target, row, "UnsupportedFormattingReference");
  const { reference: _, ...range } = position;
  if (character && target.startUnit === target.endUnit)
    throw Error("EmptyCharacterSelection");
  return range;
}
function formattingMessage(payload, state, character) {
  const range = validateFormattingTarget(payload.target, state, character);
  if (character) {
    const properties = payload.properties;
    characterPropertyArgs(properties);
    return { kind: "character-properties", ...range, properties };
  }
  const alignment = payload.alignment;
  if (paragraphAlignmentValue(alignment) === undefined)
    throw Error("InvalidParagraphAlignment");
  return {
    kind: "paragraph-alignment",
    section: range.section,
    paragraph: range.paragraph,
    alignment
  };
}

// packages/core/src/commands/underline.ts
function underlineMessage(payload, state) {
  const range = validateFormattingTarget(payload.target, state, true, "characterUnderlineAvailable");
  characterUnderlineArg(payload.kind);
  return { kind: "character-underline", ...range, underlineKind: payload.kind };
}

// packages/core/src/state/font-name-state.ts
var uint = (x) => typeof x === "number" && Number.isInteger(x) && x >= 0 && x <= 4294967295;
var unknownValue = Object.freeze({ kind: "unknown" });
var unknownObservation = Object.freeze({ value: unknownValue, bindingValid: false });
var unknown = () => Object.freeze(Object.fromEntries(FONT_LANGUAGES.map((language) => [language, unknownObservation])));
function characterFontNameObservations(content, paragraph, start, end) {
  const c = content;
  const row = paragraph;
  if (c?.characterFontNameAvailable !== true || c.fontFacesError || c.characterFontReferencesError || !Array.isArray(c.fontFaces) || !Array.isArray(c.characterFontReferences) || !uint(row?.section) || !uint(row?.paragraph) || !Number.isInteger(start) || !Number.isInteger(end) || start >= end)
    return unknown();
  const names = new Map;
  try {
    if (!validFontFaceOrder(c.fontFaces))
      return unknown();
    for (const face of c.fontFaces) {
      if (!face || typeof face !== "object")
        return unknown();
      const f = face;
      if (f.name !== null) {
        if (typeof f.name !== "string")
          return unknown();
        if (f.name.length)
          characterFontNameArgs(f.language, f.name);
      }
      names.set(f.language + ":" + f.id, f.name);
    }
  } catch {
    return unknown();
  }
  const refs = new Map;
  for (const item of c.characterFontReferences) {
    if (!item || typeof item !== "object")
      return unknown();
    const r = item;
    if (!uint(r.id) || refs.has(r.id) || !Array.isArray(r.fontIds) || r.fontIds.length !== FONT_LANGUAGES.length || !r.fontIds.every(uint))
      return unknown();
    refs.set(r.id, r.fontIds);
  }
  const spans = characterRangeValues(content, [{ section: row.section, paragraph: row.paragraph, startUnit: start, endUnit: end }], (id) => uint(id) ? refs.get(id) ?? null : null, { isBoundary: isUtf16Boundary });
  if (!spans)
    return unknown();
  return Object.freeze(Object.fromEntries(FONT_LANGUAGES.map((language, index) => {
    const keys = spans.map((ids) => language + ":" + ids[index]);
    if (keys.some((key) => !names.has(key)))
      return [language, unknownObservation];
    const values = keys.map((key) => names.get(key));
    const first = values[0];
    const value = values.some((name) => name !== first) ? Object.freeze({ kind: "mixed" }) : Object.freeze({ kind: "single", name: first });
    return [language, Object.freeze({ value, bindingValid: true })];
  })));
}

// packages/core/src/commands/font-name.ts
function fontNameMessage(payload, state) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || ["target", "language", "name"].some((key) => !Object.hasOwn(payload, key)) || Object.keys(payload).some((key) => !["target", "language", "name"].includes(key)) || Object.values(Object.getOwnPropertyDescriptors(payload)).some((d) => d.get || d.set)) {
    throw Error("InvalidCharacterFontNamePayload");
  }
  const range = validateFormattingTarget(payload.target, state, true, "characterFontNameAvailable");
  if (typeof globalThis.TextEncoder !== "function")
    throw Error("FontNameEncodingUnavailable");
  characterFontNameArgs(payload.language, payload.name);
  const row = validateSelection(payload.target, state);
  const observed = characterFontNameObservations(state.content, row, payload.target.startUnit, payload.target.endUnit);
  if (!observed[payload.language]?.bindingValid)
    throw Error("UnknownCharacterFontName");
  return { kind: "character-font-name", ...range, language: payload.language, name: payload.name };
}

// packages/core/src/commands/table-insert-options.ts
var resourceKeys = ["paragraph", "character", "style", "border_fill"];
function dataObject(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    return false;
  const own = Reflect.ownKeys(value);
  return own.length === keys.length && own.every((key) => typeof key === "string" && keys.includes(key) && ("value" in Object.getOwnPropertyDescriptor(value, key)));
}
var uint2 = (value) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 4294967295;
function validateTableInsertOptions(options, observed) {
  if (!dataObject(options, ["rows", "columns", "width", "rowHeight", "resources"]))
    throw Error("InvalidTableCreationOptions");
  const { rows, columns, width, rowHeight } = options;
  if (![rows, columns, width, rowHeight].every(uint2) || rows === 0 || columns === 0 || width < columns || rowHeight === 0 || !Number.isSafeInteger(rows * columns) || rows * columns > 1e5 || rows * rowHeight > 4294967295)
    throw Error("InvalidTableCreationDimensions");
  if (!dataObject(options.resources, resourceKeys) || !dataObject(observed, resourceKeys))
    throw Error("InvalidTableCreationResources");
  for (const key of resourceKeys) {
    const value = options.resources[key], ids = observed[key];
    if (!uint2(value) || !Array.isArray(ids) || !ids.every((id, index) => uint2(id) && (index === 0 || ids[index - 1] < id)) || !ids.includes(value))
      throw Error("InvalidTableCreationResources");
  }
  return options;
}

// packages/core/src/commands/table-insert.ts
function tableInsertMessage(payload, state) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || Reflect.ownKeys(payload).length !== 2 || !["target", "options"].every((key) => Object.hasOwn(payload, key)) || Reflect.ownKeys(payload).some((key) => typeof key !== "string" || !["target", "options"].includes(key) || !("value" in Object.getOwnPropertyDescriptor(payload, key))))
    throw Error("InvalidTableInsertPayload");
  const target = payload.target, row = validateSelection(target, state, true);
  if (target.startUnit !== target.endUnit)
    throw Error("TableInsertionRequiresCaret");
  if (target.owner !== `section:${target.section}:body` || row.tableCell || row.createdCell || row.drawingText || row.drawingCaption)
    throw Error("UnsupportedTableInsertOwner");
  validateOriginalParagraphReference(target, row, "UnsupportedTableInsertReference");
  const content = state.content;
  if (content.tableCreationAvailable !== true)
    throw Error("TableCreationUnavailable");
  const options = validateTableInsertOptions(payload.options, content.tableCreationResources);
  const mapped = selectionMessage(target, state);
  return {
    kind: "insert-table",
    section: mapped.section,
    paragraph: mapped.paragraph,
    unit: mapped.startUnit,
    options
  };
}

// packages/core/src/state/text-color-state.ts
var unavailable2 = () => Object.freeze({ value: null, bindingValid: false });
function characterTextColorObservation(content, paragraph, start, end) {
  const c = content;
  const p = paragraph;
  const uint = (value) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (c?.characterTextColorAvailable !== true || !Array.isArray(c.characterTextColors) || !uint(p?.section) || !uint(p?.paragraph) || start >= end)
    return unavailable2();
  const paragraphs = content.paragraphs;
  if (!Array.isArray(paragraphs) || paragraphs.some((row) => !row || typeof row !== "object"))
    return unavailable2();
  const colors = new Map;
  for (const item of c.characterTextColors) {
    if (!item || typeof item !== "object")
      return unavailable2();
    const row = item;
    if (!uint(row.id) || colors.has(row.id))
      return unavailable2();
    if (row.color !== null && (!uint(row.color) || row.color > 16777215))
      return unavailable2();
    colors.set(row.id, { color: row.color });
  }
  const values = characterRangeValues(content, [{ section: p.section, paragraph: p.paragraph, startUnit: start, endUnit: end }], (id) => uint(id) ? colors.get(id) ?? null : null, { isBoundary: isUtf16Boundary });
  if (!values)
    return unavailable2();
  const color = values[0].color;
  if (color === null || values.some((row) => row.color === null))
    return Object.freeze({ value: null, bindingValid: true });
  return Object.freeze({
    value: values.some((row) => row.color !== color) ? "mixed" : `#${color.toString(16).padStart(6, "0")}`,
    bindingValid: true
  });
}

// packages/core/src/commands/text-color.ts
function textColorMessage(payload, state) {
  const range = validateFormattingTarget(payload.target, state, true, "characterTextColorAvailable");
  characterColorArg(payload.color);
  const row = validateSelection(payload.target, state);
  if (!characterTextColorObservation(state.content, row, payload.target.startUnit, payload.target.endUnit).bindingValid)
    throw Error("UnknownCharacterTextColor");
  return { kind: "character-text-color", ...range, color: payload.color };
}

// packages/core/src/commands/strike.ts
function strikeMessage(payload, state) {
  const range = validateFormattingTarget(payload.target, state, true, "characterStrikeAvailable");
  if (typeof payload.enabled !== "boolean")
    throw Error("InvalidCharacterStrikeEnabled");
  return { kind: "character-strike", ...range, enabled: payload.enabled };
}

// packages/core/src/editor/create-editor.ts
var nextEditorId = 0;
var nextEditorInstance = 0;
var usedRuntimes = new WeakSet;
var errorText = (error) => error instanceof Error ? error.message : String(error);
var isWellFormed = isWellFormedText;
var isAsyncFunction = (callback) => Object.prototype.toString.call(callback) === "[object AsyncFunction]";
function createEditor(options) {
  const editorId = options.editorId ?? `hwpjs-editor-${++nextEditorId}`;
  if (nextEditorInstance >= Number.MAX_SAFE_INTEGER)
    throw Error("EditorIdentityExhausted");
  const instanceId = String(++nextEditorInstance);
  const queue = new FifoScheduler, admission = new FifoScheduler, registry = new CommandRegistry;
  const geometry = createGeometryEvidenceController();
  const takeGeometryOrigin = (runtime, reply, ctx) => consumeNativeRuntimeOrigin(runtime, reply, ctx);
  const selectionHistory = new SelectionHistory;
  const writePolicy = new EditorWritePolicy;
  let active, locked;
  let terminal = false, disposePromise, requestId = 0, nextGeneration = 0, revisionClock = 0, stateVersion = 0;
  let readDepth = 0, collecting = false, handling = false;
  const stateListeners = new Set, updateListeners = new Set, errorListeners = new Set;
  const released = new WeakSet;
  const loads = new Set;
  let surfaceEpoch = 0;
  let surface;
  const disposedFence = new CancellationFence;
  const runRead = (callback, snapshot) => {
    if (typeof callback !== "function")
      throw TypeError("InvalidReadCallback");
    if (isAsyncFunction(callback))
      throw Error("AsyncRead");
    readDepth++;
    try {
      const result = callback(snapshot);
      if (isPromiseLike(result)) {
        discardPromise(result);
        throw Error("AsyncRead");
      }
      return result;
    } finally {
      readDepth--;
    }
  };
  let state = new EditorState({
    editorId,
    documentId: null,
    generation: 0,
    operationRevision: 0,
    viewRevision: 0,
    stateVersion: 0,
    status: "empty"
  }, runRead);
  function assertPublicMutation() {
    if (readDepth) {
      geometry.invalidate();
      throw Error("ReadMutation");
    }
    if (collecting) {
      geometry.invalidate();
      throw Error("CollectorOnly");
    }
    if (handling) {
      geometry.invalidate();
      throw Error("CommandHandlerMutation");
    }
  }
  function assertLive() {
    if (terminal)
      throw Error("EditorDisposed");
  }
  function notifyError(error, context, applied = false) {
    geometry.invalidate();
    if (terminal)
      return;
    const event = Object.freeze({
      error,
      context: context ? Object.freeze({ ...context }) : undefined,
      applied
    });
    const final = (cause) => {
      try {
        const value = options.onError?.(Object.freeze({ ...event, error: cause }));
        discardPromise(value);
      } catch {}
    };
    if (!errorListeners.size) {
      final(error);
      return;
    }
    for (const listener of [...errorListeners]) {
      if (terminal)
        break;
      try {
        const result = listener(event);
        if (isPromiseLike(result))
          Promise.resolve(result).catch(final);
      } catch (cause) {
        final(cause);
      }
    }
  }
  function notify(listeners, snapshot, ctx, applied = false) {
    for (const listener of listeners) {
      if (terminal)
        break;
      try {
        const result = listener(snapshot);
        if (isPromiseLike(result))
          Promise.resolve(result).catch((error) => notifyError(error, ctx, applied));
      } catch (error) {
        notifyError(error, ctx, applied);
      }
    }
  }
  function install(patch, mutation = false, ctx, origin, transition) {
    if (terminal)
      return;
    const states = [...stateListeners], updates = mutation ? [...updateListeners] : [];
    const next = {
      editorId,
      documentId: state.documentId,
      generation: state.generation,
      operationRevision: state.operationRevision,
      viewRevision: state.viewRevision,
      stateVersion: ++stateVersion,
      status: state.status,
      content: state.content,
      capabilities: state.capabilities,
      historyRecoveryRequired: state.historyRecoveryRequired,
      nativeHistoryStats: state.nativeHistoryStats,
      nativeHistoryRevision: state.nativeHistoryRevision,
      nativeHistoryRevisions: state.nativeHistoryRevisions,
      savedOperationRevision: state.savedOperationRevision,
      selection: state.selection,
      ...patch
    };
    const previousState = state;
    state = new EditorState(next, runRead);
    if (origin)
      geometry.publish(previousState, state, origin, transition);
    else if (!mutation && Object.keys(patch).length === 1 && Object.hasOwn(patch, "selection"))
      geometry.inherit(previousState, state);
    else
      geometry.invalidate();
    selectionHistory.observe(state);
    const snapshot = state;
    notify(states, snapshot, ctx, mutation);
    notify(updates, snapshot, ctx, mutation);
  }
  function context(token = state.token) {
    return {
      editorId,
      documentId: token.documentId,
      generation: token.generation,
      requestId: ++requestId,
      operationRevision: token.operationRevision
    };
  }
  function verifyReply(reply, ctx) {
    if (!reply || typeof reply !== "object" || typeof reply.kind !== "string")
      throw Error("InvalidRuntimeReply");
    const returned = reply.meta?.context;
    if (returned && ["editorId", "documentId", "generation", "requestId", "operationRevision"].some((key) => returned[key] !== ctx[key]))
      throw Error("MismatchedRuntimeReply");
  }
  async function release(runtime) {
    if (!runtime || released.has(runtime))
      return;
    released.add(runtime);
    await runtime.dispose();
  }
  function enqueue(task) {
    if (terminal)
      return Promise.reject(Error("EditorDisposed"));
    return queue.enqueue(async () => {
      assertLive();
      return task();
    });
  }
  function assertSurface(record) {
    assertLive();
    if (!record.active || surface !== record)
      throw Error("InputSurfaceDetached");
  }
  function cancelComposition(record, reason) {
    try {
      record.hooks.cancelComposition(reason);
    } catch (error) {
      notifyError(error);
      if (reason === "load" || reason === "external-replace")
        throw error;
    }
  }
  function admit(task, settings = {}) {
    if (terminal)
      return Promise.reject(Error("EditorDisposed"));
    return admission.enqueue(async () => {
      assertLive();
      settings.guard?.();
      const record = surface;
      if (record) {
        assertSurface(record);
        const settlement = Promise.resolve().then(() => {
          assertSurface(record);
          return record.hooks.commitComposition();
        });
        const interruptions = [
          { fence: disposedFence, error: "EditorDisposed" },
          { fence: record.fence, error: "InputSurfaceDetached" }
        ];
        if (settings.abort)
          interruptions.push({ fence: settings.abort, error: "LoadCancelled" });
        const outcome = await interruptible(settlement, interruptions);
        assertLive();
        assertSurface(record);
        settings.guard?.();
        if (outcome !== "committed" && outcome !== "unchanged")
          throw Error("CompositionBlocked");
        if (settings.replace)
          cancelComposition(record, settings.replace);
      }
      assertLive();
      settings.guard?.();
      return enqueue(async () => {
        if (record)
          assertSurface(record);
        else if (surface)
          throw Error("InputSurfaceChanged");
        return task();
      });
    });
  }
  async function newRuntime() {
    const runtime = await options.runtimeFactory();
    if (!runtime || typeof runtime.request !== "function" || typeof runtime.dispose !== "function")
      throw Error("InvalidRuntime");
    if (usedRuntimes.has(runtime))
      throw Error("RuntimeAlreadyOwned");
    usedRuntimes.add(runtime);
    return runtime;
  }
  function history(reply) {
    return Number.isSafeInteger(reply.historyRevision) ? reply.historyRevision : undefined;
  }
  function assembleCapabilities(reply, inherit = true) {
    return reply.capabilities ?? {
      ...inherit && state.documentId !== null ? state.capabilities : {},
      ...Object.fromEntries(Object.entries(reply).filter(([key]) => ![
        "content",
        "kind",
        "error",
        "applied",
        "bytes",
        "meta",
        "origin",
        "requestId",
        "historyRevision",
        "historyRevisions",
        "historyStats",
        "nativeTextDelta",
        "historyPoisoned"
      ].includes(key)))
    };
  }
  function observeCapabilities(value, editable, reuseCurrent = false) {
    const projected = writePolicy.capabilities(value, editable);
    const previousValue = reuseCurrent ? state.capabilities : undefined;
    const plainRecord = (value) => {
      if (value === null || typeof value !== "object")
        return false;
      const proto = Object.getPrototypeOf(value);
      return proto === Object.prototype || proto === null;
    };
    if (reuseCurrent && isOwnedImmutableObservation(previousValue) && plainRecord(previousValue) && plainRecord(projected)) {
      const previous = Object.getOwnPropertyDescriptors(previousValue);
      const next = Object.getOwnPropertyDescriptors(projected);
      const keys = Reflect.ownKeys(next);
      if (keys.length === Reflect.ownKeys(previous).length && keys.every((key) => Object.hasOwn(previous, key) && ("value" in previous[key]) && ("value" in next[key]) && Object.is(previous[key].value, next[key].value)))
        return previousValue;
    }
    return ownObservation(projected)();
  }
  function contentPatch(reply, inherit = true, editable) {
    if (reply.content === undefined)
      throw Error("SnapshotMissing");
    const historyRecoveryRequired = inherit && state.historyRecoveryRequired || reply.historyPoisoned === true || reply.historyStats?.poisoned === true;
    const observedEditable = historyRecoveryRequired ? false : editable;
    const capabilities = assembleCapabilities(reply, inherit);
    return {
      content: ownObservation(writePolicy.observe(reply.content, observedEditable))(),
      capabilities: observeCapabilities(capabilities, observedEditable),
      historyRecoveryRequired,
      nativeHistoryStats: reply.historyStats,
      nativeHistoryRevision: history(reply),
      nativeHistoryRevisions: reply.historyRevisions,
      selection: undefined,
      viewRevision: state.viewRevision + 1
    };
  }
  async function finishCandidate(runtime, message, ctx, editable, enableOptions, first, guard = () => {}, initializeNewDocument = false) {
    let publicationContext = ctx;
    let reply = first ?? await runtime.request(message, ctx);
    verifyReply(reply, ctx);
    if (reply.error)
      throw Error(reply.error);
    if (editable) {
      const enableContext = { ...ctx, requestId: ++requestId };
      publicationContext = enableContext;
      reply = await runtime.request({ ...enableOptions, kind: "enable" }, enableContext);
      verifyReply(reply, enableContext);
      if (reply.error)
        throw Error(reply.error);
    }
    if (reply.historyPoisoned === true || reply.historyStats?.poisoned === true)
      throw Error("HistoryReloadRequired");
    const patch = contentPatch(reply, false, editable);
    assertLive();
    guard();
    const nextRevision = ++revisionClock;
    const nextData = {
      ...patch,
      documentId: ctx.documentId,
      generation: ctx.generation,
      operationRevision: nextRevision,
      savedOperationRevision: nextRevision,
      status: "ready"
    };
    const candidateState = new EditorState({
      editorId,
      viewRevision: state.viewRevision + 1,
      stateVersion: stateVersion + 1,
      ...nextData
    }, runRead);
    if (initializeNewDocument && editable)
      nextData.selection = createNewDocumentSelection(candidateState);
    const previous = active;
    writePolicy.publish(editable, () => {
      active = runtime;
      try {
        install(nextData, true, ctx, takeGeometryOrigin(runtime, reply, publicationContext));
      } catch (error) {
        active = previous;
        throw error;
      }
    });
    try {
      await release(previous);
    } catch (error) {
      notifyError(error, ctx);
    }
    return state;
  }
  function load(input, loadOptions) {
    assertPublicMutation();
    return loadSource(copyOwned(input), loadOptions);
  }
  function createDocument(createOptions = {}) {
    assertPublicMutation();
    const owned = copyOwned(createOptions);
    const format = owned.format ?? "hwpx";
    if (!["hwp5", "hwpx"].includes(format))
      throw Error("InvalidDocumentFormat");
    const producer = options.runtimeFactory.createDocumentBytes;
    if (typeof producer !== "function")
      throw Error("NewDocumentUnsupported");
    return loadSource(undefined, { ...owned, format }, () => producer.call(options.runtimeFactory, format));
  }
  function loadSource(input, loadOptions, producer) {
    assertPublicMutation();
    let bytes = input;
    if (!producer && !(bytes instanceof Uint8Array) && !(bytes instanceof ArrayBuffer))
      throw TypeError("InvalidDocumentBytes");
    const clearBytes = () => {
      if (bytes instanceof Uint8Array)
        bytes.fill(0);
      else if (bytes instanceof ArrayBuffer)
        new Uint8Array(bytes).fill(0);
    };
    const owned = copyOwned(loadOptions);
    if (!owned || !["hwp5", "hwpx"].includes(owned.format))
      throw Error("InvalidDocumentFormat");
    if (owned.history !== undefined && Object.hasOwn(owned.enableOptions ?? {}, "history"))
      throw Error("DuplicateHistoryOptions");
    const enableOptions = owned.history === undefined ? owned.enableOptions : { ...owned.enableOptions, history: owned.history };
    const sourceOptions = loadSourceOptions(owned);
    const cancellation = new CancellationFence;
    const job = { cancelled: false, fence: cancellation };
    loads.add(job);
    const guard = () => {
      if (job.cancelled)
        throw Error("LoadCancelled");
    };
    const tokenGeneration = ++nextGeneration, documentId = `${editorId}:instance:${instanceId}:document:${tokenGeneration}`;
    const message = {
      kind: "load",
      bytes,
      format: owned.format,
      ...sourceOptions,
      ...owned.password === undefined ? {} : { password: owned.password },
      ...owned.allowObservedChartOleDeviations === undefined ? {} : { allowObservedChartOleDeviations: owned.allowObservedChartOleDeviations }
    };
    return admit(async () => {
      const previousState = state;
      install({ status: "loading" });
      let candidate, keepLocked = false;
      const ctx = {
        editorId,
        documentId,
        generation: tokenGeneration,
        requestId: ++requestId,
        operationRevision: 0
      };
      try {
        if (locked) {
          const old = locked;
          locked = undefined;
          await release(old.runtime);
        }
        guard();
        if (producer) {
          const producing = Promise.resolve().then(producer).then((result) => {
            if (!(result instanceof Uint8Array))
              throw TypeError("InvalidDocumentBytes");
            bytes = result;
            if (job.cancelled || terminal) {
              result.fill(0);
              throw Error(terminal ? "EditorDisposed" : "LoadCancelled");
            }
            return result;
          });
          bytes = await interruptible(producing, [
            { fence: cancellation, error: "LoadCancelled" },
            { fence: disposedFence, error: "EditorDisposed" }
          ]);
          message.bytes = bytes;
          assertLive();
          guard();
        }
        candidate = await newRuntime();
        assertLive();
        guard();
        const reply = await candidate.request(message, ctx);
        verifyReply(reply, ctx);
        assertLive();
        guard();
        if (reply.error) {
          if (reply.passwordRequired === true) {
            locked = {
              runtime: candidate,
              message: { ...message, password: undefined },
              context: ctx,
              editable: owned.editable !== false,
              enableOptions
            };
            keepLocked = true;
          }
          throw Error(reply.error);
        }
        return await finishCandidate(candidate, message, ctx, owned.editable !== false, enableOptions, reply, guard, producer !== undefined);
      } catch (error) {
        if (!terminal)
          install({ status: previousState.status });
        notifyError(error, ctx);
        throw error;
      } finally {
        if (candidate && candidate !== active && !keepLocked)
          await release(candidate);
        clearBytes();
        delete message.password;
        loads.delete(job);
      }
    }, { replace: "load", abort: cancellation, guard }).finally(() => {
      loads.delete(job);
      clearBytes();
      delete message.password;
    });
  }
  function unlock(password, unlockOptions = {}) {
    assertPublicMutation();
    if (typeof password !== "string")
      throw TypeError("InvalidPassword");
    const owned = copyOwned(unlockOptions);
    return admit(async () => {
      const candidate = locked;
      if (!candidate)
        throw Error("NoLockedCandidate");
      const ctx = { ...candidate.context, requestId: ++requestId };
      let retryable = false;
      try {
        const reply = await candidate.runtime.request({ ...owned, kind: "unlock", password }, ctx);
        verifyReply(reply, ctx);
        if (reply.error) {
          retryable = retryablePasswordReply(reply);
          throw Error(reply.error);
        }
        assertLive();
        const result = await finishCandidate(candidate.runtime, candidate.message, ctx, candidate.editable, candidate.enableOptions, reply, () => {
          if (candidate.cancelled)
            throw Error("LoadCancelled");
        });
        locked = undefined;
        return result;
      } catch (error) {
        if (retryable && locked === candidate && !candidate.cancelled && !terminal) {
          const retry = new PasswordAttemptError(errorText(error));
          notifyError(retry, ctx, false);
          throw retry;
        }
        if (locked === candidate)
          locked = undefined;
        await release(candidate.runtime);
        notifyError(error, ctx);
        throw error;
      }
    }, { replace: "external-replace" });
  }
  function cancelLoad() {
    assertPublicMutation();
    for (const job of loads) {
      job.cancelled = true;
      job.fence.cancel();
    }
    if (locked)
      locked.cancelled = true;
    return enqueue(async () => {
      const candidate = locked;
      locked = undefined;
      await release(candidate?.runtime);
    });
  }
  function result(status, ctx, error, reply) {
    let ownedReply;
    try {
      if (reply !== undefined)
        ownedReply = freezeDTO(copyOwned(reply, true));
    } catch (metadataError) {
      notifyError(metadataError, ctx, status.startsWith("committed"));
    }
    const answer = {
      status,
      context: Object.freeze({ ...ctx }),
      state,
      error: error === undefined ? undefined : errorText(error),
      changed: reply?.meta?.changed ?? null,
      reply: ownedReply
    };
    return Object.freeze(answer);
  }
  function reject(ctx, error) {
    notifyError(error, ctx, false);
    return result("rejected-unapplied", ctx, error);
  }
  function requireReady(token, view = false) {
    assertLive();
    if (state.historyRecoveryRequired || state.nativeHistoryStats?.poisoned === true)
      throw Error("HistoryReloadRequired");
    if (!active || state.status !== "ready")
      throw Error(state.status === "refresh-required" ? "RefreshRequired" : "EditorNotReady");
    validateToken(token, state, view);
  }
  async function mutate(message, token, preserveFormattingSelection = false, admissionGuard) {
    const ctx = context(token);
    let reserved, reply;
    try {
      requireReady(token);
      writePolicy.assertWritable();
      admissionGuard?.();
      reserved = ++revisionClock;
      const historyCapture = geometry.captureHistory(state, message.kind);
      const exclusiveCapture = geometry.captureExclusive(state);
      const priorProjection = exclusiveCapture?.projection;
      const historyProjection = geometry.historyWindowHint(state, historyCapture);
      const projectionPreference = historyProjection && isPlainOwnerBaseline(state.content, historyProjection.owner.section, historyProjection.owner.paragraph) ? historyProjection : undefined;
      const projectionRequested = ["splice", "splice-current"].includes(message.kind) && !!priorProjection && !state.content?.readOnly && !state.content?.window && isPlainOwnerBaseline(state.content, message.section, message.paragraph);
      try {
        reply = admissionGuard || (projectionRequested || projectionPreference) && hasRuntimeAdmission(active) ? await requestAtRuntimeAdmission(active, message, ctx, admissionGuard ?? (() => {}), projectionPreference ?? projectionRequested) : await active.request(message, ctx);
        verifyReply(reply, ctx);
      } catch (error) {
        if (error instanceof RuntimeAdmissionRejected)
          return reject(ctx, error);
        install({ operationRevision: reserved, status: "refresh-required" });
        notifyError(error, ctx, "unknown");
        return result("committed-refresh-required", ctx, error);
      }
      const application = reply.meta?.application ?? (reply.applied === true ? "applied" : reply.error && reply.applied === false ? "unapplied" : undefined);
      if (reply.historyPoisoned === true || reply.historyStats?.poisoned === true) {
        install({
          content: ownObservation(writePolicy.observe(state.content, false))(),
          capabilities: ownObservation(writePolicy.capabilities(state.capabilities, false))(),
          operationRevision: application === "unapplied" ? state.operationRevision : reserved,
          status: "refresh-required",
          historyRecoveryRequired: true,
          nativeHistoryStats: reply.historyStats,
          nativeHistoryRevision: history(reply)
        });
        const failure = reply.error ?? "HistoryReloadRequired";
        notifyError(failure, ctx, application === "unapplied" ? false : "unknown");
        return result(application === "unapplied" ? "rejected-unapplied" : "committed-refresh-required", ctx, failure, reply);
      }
      if (application === "unapplied") {
        if (message.kind === "formatting-patch" && reply.formattingRefreshRequired === true)
          install({ status: "refresh-required" });
        if (message.kind === "formatting-patch" && reply.formattingNativeCode === 2) {
          if (reply.error)
            notifyError(reply.error, ctx, false);
          return result("known-no-op", ctx, reply.error, reply);
        }
        if (message.kind === "formatting-patch" && reply.error) {
          notifyError(reply.error, ctx, false);
          return result("rejected-unapplied", ctx, reply.error, reply);
        }
        if (reply.error)
          return reject(ctx, reply.error);
        return result("known-no-op", ctx, undefined, reply);
      }
      const noOp = !reply.error && (reply.meta?.changed === false || reply.changed === false);
      if (noOp) {
        geometry.invalidate();
        return result("known-no-op", ctx, undefined, reply);
      }
      if (reply.error || reply.content === undefined) {
        install({
          operationRevision: reserved,
          status: "refresh-required",
          nativeHistoryStats: reply.historyStats,
          nativeHistoryRevision: history(reply)
        });
        notifyError(reply.error ?? "SnapshotMissing", ctx, application === "applied" ? true : "unknown");
        return result("committed-refresh-required", ctx, reply.error ?? "SnapshotMissing", reply);
      }
      try {
        const mutationReply = reply;
        let origin = takeGeometryOrigin(active, reply, ctx);
        let merged;
        if (reply.content?.viewKind === "history-owner-window") {
          requireReady(token);
          merged = geometry.mergeHistoryWindow(state, reply.content, origin, historyCapture, reply);
          if (!merged) {
            geometry.invalidate();
            reply = await active.request({ kind: "refresh" }, ctx);
            verifyReply(reply, ctx);
            requireReady(token);
            if (reply.error || !reply.content || reply.content.viewKind)
              throw Error("HistoryWindowFallbackFailed");
            origin = takeGeometryOrigin(active, reply, ctx);
          }
        }
        if (reply.content?.viewKind === "owner-window-patch") {
          requireReady(token);
          if (priorProjection && origin)
            merged = mergeExclusiveOwnerWindow(state, reply.content, origin, {
              context: ctx,
              sequence: exclusiveCapture.sequence + 1,
              revision: state.nativeHistoryRevision,
              epoch: priorProjection.evidence.nativeEpoch,
              referenceScope: priorProjection.evidence.scope.referenceScope
            });
          if (!merged) {
            reply = await active.request({ kind: "refresh" }, ctx);
            verifyReply(reply, ctx);
            requireReady(token);
            if (reply.error || !reply.content || reply.content.viewKind)
              throw Error("OwnerProjectionFallbackFailed");
            origin = takeGeometryOrigin(active, reply, ctx);
          }
        }
        const patch = merged ? {
          content: merged,
          capabilities: observeCapabilities(assembleCapabilities(reply), undefined, true),
          historyRecoveryRequired: false,
          nativeHistoryStats: reply.historyStats,
          nativeHistoryRevision: history(reply),
          nativeHistoryRevisions: reply.historyRevisions,
          selection: undefined,
          viewRevision: state.viewRevision + 1
        } : contentPatch(reply);
        let selection = preserveFormattingSelection ? formattingSelection(state, patch, reserved) : undefined;
        if (message.kind === "undo" || message.kind === "redo") {
          const provisional = new EditorState({
            ...state.token,
            ...patch,
            operationRevision: reserved,
            stateVersion: state.stateVersion + 1,
            status: "ready"
          }, runRead);
          selection = selectionHistory.restore(provisional);
        }
        install({ ...patch, selection, operationRevision: reserved, status: "ready" }, true, ctx, origin, { kind: message.kind, capture: historyCapture });
        if (["owner-window-patch", "history-owner-window"].includes(mutationReply.content?.viewKind)) {
          reply = {
            ...mutationReply,
            content: state.content,
            ...reply.historyStats === undefined ? {} : { historyStats: reply.historyStats },
            ...reply.historyRevision === undefined ? {} : { historyRevision: reply.historyRevision },
            ...reply.historyRevisions === undefined ? {} : { historyRevisions: reply.historyRevisions },
            ...reply.historyPoisoned === undefined ? {} : { historyPoisoned: reply.historyPoisoned }
          };
        }
      } catch (error) {
        install({ operationRevision: reserved, status: "refresh-required" });
        notifyError(error, ctx, true);
        return result("committed-refresh-required", ctx, error);
      }
      return result("committed-with-snapshot", ctx, undefined, reply);
    } catch (error) {
      return reject(ctx, error);
    }
  }
  function capture(command, payload, snapshot = state) {
    if (!command || typeof command.id !== "symbol")
      throw Error("InvalidCommand");
    const owned = copyOwned(payload);
    return {
      command,
      payload: owned,
      token: owned?.target ?? owned?.token ?? snapshot.token,
      handlers: registry.capture(command)
    };
  }
  async function execute(pending) {
    const ctx = context(pending.token);
    try {
      requireReady(pending.token);
      handling = true;
      let handled;
      try {
        handled = registry.run(pending.handlers, pending.payload, (v) => copyOwned(v));
      } finally {
        handling = false;
      }
      assertLive();
      if (handled)
        return result("handled-without-runtime", ctx);
      writePolicy.assertWritable();
      if (pending.command.id === APPLY_FORMATTING_PATCH_COMMAND.id) {
        const payload = pending.payload;
        if (!payload || Object.keys(payload).some((key) => !["target", "patch", "selectionVersion"].includes(key)))
          throw Error("InvalidFormattingPatch");
        validateFormattingPatch(payload.patch);
        const selector = atomicSelector(payload.target, state, true, formattingPatchNeedsCharacter(payload.patch));
        const capability = await readFormattingCapabilities(payload.target);
        if (!capability.atomic)
          throw Error(capability.reason);
        const guard = () => {
          requireReady(payload.target, true);
          assertFormattingAdmission(payload, state.stateVersion, capability.selectionAdmissionFence);
        };
        guard();
        const prepared = await readRequest({ kind: "query-formatting", selector, fields: [] }, payload.target, guard, true);
        guard();
        const value = checkedFormattingQuery(prepared.formatting);
        if (value.binding.revision === null)
          throw Error("InvalidFormattingBinding");
        return await mutate({
          kind: "formatting-patch",
          request: {
            schemaVersion: 1,
            binding: value.binding,
            targets: value.targets,
            patch: payload.patch
          }
        }, payload.target, true, guard);
      }
      if (pending.command.id === SPLICE_TEXT_COMMAND.id) {
        const payload = pending.payload;
        if (payload.selectionVersion !== undefined && payload.selectionVersion !== state.stateVersion)
          throw Error("StaleClipboardSelection");
        if (typeof payload.text !== "string" || !isWellFormed(payload.text))
          throw Error("InvalidText");
        const position = selectionMessage(payload.target, state);
        return await mutate({ kind: "splice", ...position, text: payload.text }, payload.target);
      }
      if (pending.command.id === INSERT_TABLE_COMMAND.id) {
        const payload = pending.payload;
        return await mutate(tableInsertMessage(payload, state), payload.target);
      }
      if (pending.command.id === SET_CHARACTER_FONT_NAME_COMMAND.id) {
        const payload = pending.payload;
        return await mutate(fontNameMessage(payload, state), payload.target, true);
      }
      if (pending.command.id === SET_CHARACTER_TEXT_COLOR_COMMAND.id) {
        const payload = pending.payload;
        return await mutate(textColorMessage(payload, state), payload.target, true);
      }
      if (pending.command.id === SET_CHARACTER_STRIKE_COMMAND.id) {
        const payload = pending.payload;
        return await mutate(strikeMessage(payload, state), payload.target, true);
      }
      if (pending.command.id === SET_CHARACTER_UNDERLINE_COMMAND.id) {
        const payload = pending.payload;
        return await mutate(underlineMessage(payload, state), payload.target, true);
      }
      if (pending.command.id === SET_CHARACTER_PROPERTIES_COMMAND.id || pending.command.id === SET_PARAGRAPH_ALIGNMENT_COMMAND.id) {
        const payload = pending.payload;
        const message = formattingMessage(payload, state, pending.command.id === SET_CHARACTER_PROPERTIES_COMMAND.id);
        return await mutate(message, payload.target, true);
      }
      if (pending.command.id === UNDO_COMMAND.id || pending.command.id === REDO_COMMAND.id) {
        const payload = pending.payload;
        validateToken(payload.token, state);
        return await mutate({ kind: pending.command.id === UNDO_COMMAND.id ? "undo" : "redo" }, payload.token);
      }
      return reject(ctx, "UnsupportedCommand");
    } catch (error) {
      return reject(ctx, error);
    }
  }
  function dispatchCommand(command, payload) {
    assertPublicMutation();
    const pending = capture(command, payload);
    return admit(() => execute(pending));
  }
  function update(callback) {
    if (readDepth) {
      geometry.invalidate();
      throw Error("ReadMutation");
    }
    if (collecting)
      throw Error("NestedUpdate");
    if (handling) {
      geometry.invalidate();
      throw Error("CommandHandlerMutation");
    }
    assertLive();
    if (typeof callback !== "function")
      throw TypeError("InvalidUpdateCallback");
    if (isAsyncFunction(callback))
      throw Error("AsyncUpdate");
    const snapshot = state, pending = [];
    let open = true;
    const collector = Object.freeze({
      dispatchCommand(command, payload) {
        if (!open)
          throw Error("CollectorClosed");
        pending.push(capture(command, payload, snapshot));
      }
    });
    collecting = true;
    try {
      const returned = callback(collector, snapshot);
      if (isPromiseLike(returned)) {
        discardPromise(returned);
        throw Error("AsyncUpdate");
      }
      if (returned !== undefined)
        throw Error("InvalidUpdateReturn");
    } finally {
      collecting = false;
      open = false;
    }
    return admit(async () => {
      const results = [];
      let stoppedIndex = null;
      for (const [index, command] of pending.entries()) {
        const answer = await execute(command);
        results.push(answer);
        if (answer.status === "rejected-unapplied" || answer.status === "committed-refresh-required") {
          stoppedIndex = index;
          break;
        }
      }
      return Object.freeze({ results: Object.freeze(results), stoppedIndex, state });
    });
  }
  function refresh() {
    assertPublicMutation();
    const token = state.token;
    return enqueue(async () => {
      if (!active || state.status !== "refresh-required")
        throw Error("RefreshNotRequired");
      validateToken(token, state);
      const ctx = context(token);
      try {
        const reply = await active.request({ kind: "refresh" }, ctx);
        verifyReply(reply, ctx);
        if (reply.error)
          throw Error(reply.error);
        assertLive();
        const poisoned = state.historyRecoveryRequired || reply.historyPoisoned === true || reply.historyStats?.poisoned === true;
        install({ ...contentPatch(reply), status: poisoned ? "refresh-required" : "ready" }, true, ctx);
        if (poisoned)
          throw Error("HistoryReloadRequired");
        return state;
      } catch (error) {
        notifyError(error, ctx, false);
        throw error;
      }
    });
  }
  function save(saveOptions = {}) {
    assertPublicMutation();
    const owned = copyOwned(saveOptions);
    return admit(async () => {
      const token = owned.token ?? state.token;
      if (!active || state.documentId === null)
        throw Error("EditorNotReady");
      validateToken(token, state);
      const stale = state.status === "refresh-required" || state.historyRecoveryRequired || state.nativeHistoryStats?.poisoned === true;
      if (stale && !owned.recovery)
        throw Error("RecoverySaveRequired");
      if (!stale && state.status !== "ready")
        throw Error("EditorNotReady");
      const ctx = context(token);
      const format = state.content?.format;
      if (format !== "hwp5" && format !== "hwpx")
        throw Error("UnknownDocumentFormat");
      try {
        const reply = await active.request({
          kind: "save",
          allowStaleLayout: owned.allowStaleLayout ?? false,
          allowUnprotectedOutput: owned.allowUnprotectedOutput ?? false
        }, ctx);
        verifyReply(reply, ctx);
        if (reply.error)
          throw Error(reply.error);
        if (!(reply.bytes instanceof Uint8Array))
          throw Error("SaveBytesMissing");
        const bytes = reply.bytes.slice();
        assertLive();
        install({ savedOperationRevision: token.operationRevision });
        return Object.freeze({
          bytes,
          documentId: token.documentId,
          generation: token.generation,
          operationRevision: token.operationRevision,
          nativeHistoryRevision: history(reply) ?? state.nativeHistoryRevision,
          format,
          staleSnapshot: stale,
          layoutRequiresReflow: typeof reply.layoutRequiresReflow === "boolean" ? reply.layoutRequiresReflow : undefined,
          reply: freezeDTO(copyOwned(reply, true))
        });
      } catch (error) {
        notifyError(error, ctx, false);
        throw error;
      }
    });
  }
  function requestExperimental(message, experimental) {
    assertPublicMutation();
    const owned = copyOwned(message), settings = copyOwned(experimental);
    if (!owned || typeof owned.kind !== "string" || typeof settings.mutation !== "boolean")
      throw Error("InvalidExperimentalRequest");
    if (["load", "unlock", "enable", "save", "refresh", "undo", "redo", "splice"].includes(owned.kind))
      throw Error("UseTypedEditorOperation");
    const operation = surfaceOperation(owned.kind);
    if (operation && settings.mutation !== (operation === "mutation"))
      throw Error("OperationClassificationMismatch");
    if (!settings.mutation && operation !== "read")
      throw Error("UnsafeExperimentalQuery");
    return (settings.mutation ? admit : enqueue)(async () => {
      if (settings.mutation)
        return mutate(owned, settings.token);
      requireReady(settings.token);
      const ctx = context(settings.token);
      try {
        const reply = await active.request(owned, ctx);
        verifyReply(reply, ctx);
        if (reply.error)
          throw Error(reply.error);
        return freezeDTO(copyOwned(reply, true));
      } catch (error) {
        notifyError(error, ctx, false);
        throw error;
      }
    });
  }
  function setSelection(target, options = {}) {
    assertPublicMutation();
    const owned = copyOwned(target), settings = copyOwned(options);
    if (!settings || typeof settings !== "object" || Array.isArray(settings) || Object.keys(settings).some((key) => key !== "stateVersion") || settings.stateVersion !== undefined && (!Number.isSafeInteger(settings.stateVersion) || settings.stateVersion < 0))
      throw Error("InvalidSelectionOptions");
    const version = settings.stateVersion;
    return admit(async () => {
      requireReady(owned ?? state.token);
      if (version !== undefined && version !== state.stateVersion)
        throw Error("StaleSelectionObservation");
      if (owned)
        validateSelection(owned, state);
      install({ selection: owned });
      return state;
    });
  }
  function historyCommand(command, token) {
    assertPublicMutation();
    const explicit = token === undefined ? undefined : copyOwned(token), handlers = registry.capture(command);
    return admit(() => execute({ ...capture(command, { token: explicit ?? state.token }), handlers }));
  }
  async function readRequest(message, token, guard = () => {}, admitted = false) {
    guard();
    requireReady(token, true);
    const ctx = context(token);
    try {
      const reply = admitted ? await requestAtRuntimeAdmission(active, message, ctx, guard) : await active.request(message, ctx);
      verifyReply(reply, ctx);
      if (reply.error)
        throw Error(reply.error);
      assertLive();
      guard();
      return freezeDTO(copyOwned(reply, true));
    } catch (error) {
      notifyError(error, ctx, false);
      throw error;
    }
  }
  function hostFormattingWritable() {
    try {
      writePolicy.assertWritable();
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === "ReadOnlyDocument")
        return false;
      throw error;
    }
  }
  function checkedFormattingQuery(input) {
    const v = input;
    if (v?.schemaVersion !== 1 || typeof v.binding?.session !== "string" || !v.binding.session || !Array.isArray(v.targets) || v.targets.length !== 1 || typeof v.targets[0]?.ref !== "string" || !v.targets[0].ref || !Array.isArray(v.observations?.perTarget) || v.observations.perTarget.length !== 1 || v.observations.perTarget[0].ref !== v.targets[0].ref || !v.observations.aggregate)
      throw Error("MalformedFormattingQuery");
    if (v.binding.revision !== null && (!Number.isSafeInteger(v.binding.revision) || v.binding.revision < 0 || v.binding.revision >= 4294967295))
      throw Error("InvalidFormattingBinding");
    for (const fields of [v.observations.aggregate, v.observations.perTarget[0].fields]) {
      if (!fields || typeof fields !== "object" || Array.isArray(fields))
        throw Error("MalformedFormattingQuery");
      for (const observation of Object.values(fields)) {
        const o = observation;
        if (!o || typeof o.state !== "string" || !["known", "mixed", "unknown", "unavailable"].includes(o.state) || typeof o.writable !== "boolean" || !o.writable && typeof o.writeUnavailableReason !== "string" || (o.state === "unknown" || o.state === "unavailable") && typeof o.reason !== "string" || o.state === "known" && !Object.hasOwn(o, "value") || o.unit !== undefined && typeof o.unit !== "string")
          throw Error("MalformedFormattingQuery");
      }
    }
    if (!hostFormattingWritable()) {
      const observe = (fields) => Object.fromEntries(Object.entries(fields).map(([key, o]) => [
        key,
        o.writable ? { ...o, writable: false, writeUnavailableReason: "ReadOnlyDocument" } : o
      ]));
      return freezeDTO(copyOwned({
        ...v,
        observations: {
          perTarget: v.observations.perTarget.map((row) => ({
            ...row,
            fields: observe(row.fields)
          })),
          aggregate: observe(v.observations.aggregate)
        }
      }, true));
    }
    return freezeDTO(copyOwned(v, true));
  }
  async function readFormattingCapabilities(token, guard = () => {}) {
    requireReady(token, true);
    if (!hasRuntimeAdmission(active))
      return Object.freeze({ atomic: false, reason: "UnsupportedAtomicRuntime" });
    const ready = () => {
      requireReady(token, true);
      guard();
    };
    const reply = await readRequest({ kind: "formatting-capabilities" }, token, ready, true);
    const cap = reply.formattingCapabilities;
    if (cap?.atomic === false && typeof cap.reason === "string")
      return freezeDTO(copyOwned(cap, true));
    if (cap?.atomic !== true || cap.schemaVersion !== 1 || cap.coordinateSpace !== "native-source-utf16" || cap.requiresHistoryProtocol !== 2 || cap.format !== state.content.format || typeof cap.binding?.session !== "string" || !cap.binding.session || !cap.fields || !cap.limits)
      throw Error("MalformedFormattingCapabilities");
    if (cap.binding.revision !== null && (!Number.isSafeInteger(cap.binding.revision) || cap.binding.revision < 0 || cap.binding.revision >= 4294967295))
      throw Error("InvalidFormattingBinding");
    for (const n of [
      "requestBytes",
      "replyBytes",
      "targets",
      "ranges",
      "commands",
      "fontNameBytes",
      "projectionBytes"
    ])
      if (!Number.isSafeInteger(cap.limits[n]) || cap.limits[n] <= 0)
        throw Error("MalformedFormattingCapabilities");
    const fence = Object.freeze({
      version: 1,
      commands: Object.freeze(["APPLY_FORMATTING_PATCH"]),
      epoch: "stateVersion"
    });
    const fields = hostFormattingWritable() ? cap.fields : Object.fromEntries(Object.entries(cap.fields).map(([key, field]) => [
      key,
      field.writable ? { ...field, writable: false, writeUnavailableReason: "ReadOnlyDocument" } : field
    ]));
    return freezeDTO(copyOwned({
      ...cap,
      fields,
      ...hasRuntimeAdmission(active) ? { selectionAdmissionFence: fence } : {}
    }, true));
  }
  function getFormattingCapabilities(options = {}) {
    assertPublicMutation();
    const settings = copyOwned(options);
    if (!settings || typeof settings !== "object" || Array.isArray(settings) || Object.keys(settings).some((k) => k !== "token"))
      throw Error("InvalidFormattingCapabilityOptions");
    if (settings.token === null)
      throw Error("InvalidFormattingCapabilityOptions");
    const token = copyOwned(settings.token ?? state.token);
    return enqueue(() => readFormattingCapabilities(token));
  }
  function queryFormatting(target, options = {}) {
    assertPublicMutation();
    const owned = copyOwned(target), settings = copyOwned(options);
    if (!settings || typeof settings !== "object" || Array.isArray(settings) || Object.keys(settings).some((k) => k !== "fields") || settings.fields !== undefined && (!Array.isArray(settings.fields) || settings.fields.some((f) => typeof f !== "string")))
      throw Error("InvalidFormattingQueryOptions");
    return enqueue(async () => {
      requireReady(owned, true);
      if (!hasRuntimeAdmission(active))
        throw Error("UnsupportedAtomicRuntime");
      const selector = atomicSelector(owned, state, false, owned.startUnit !== owned.endUnit);
      const reply = await readRequest({
        kind: "query-formatting",
        selector,
        ...settings.fields === undefined ? {} : { fields: settings.fields }
      }, owned, () => requireReady(owned, true), true);
      return checkedFormattingQuery(reply.formatting);
    });
  }
  function readResource(message, requestOptions) {
    assertPublicMutation();
    const owned = copyOwned(message), expected = copyOwned(requestOptions === undefined ? state.token : ("token" in requestOptions) ? requestOptions.token : requestOptions);
    if (surfaceOperation(owned.kind) !== "read")
      return Promise.reject(Error("UnsupportedReadOperation"));
    return enqueue(() => readRequest(owned, expected));
  }
  function acquireInputSurface(hooks) {
    assertPublicMutation();
    assertLive();
    if (surface)
      throw Error("InputSurfaceAlreadyAttached");
    if (!hooks || typeof hooks.commitComposition !== "function" || typeof hooks.cancelComposition !== "function")
      throw Error("InvalidInputSurfaceHooks");
    const fence = new CancellationFence;
    const generation = ++surfaceEpoch;
    const record = {
      id: `${editorId}:surface:${generation}`,
      generation,
      active: true,
      hooks: {
        commitComposition: hooks.commitComposition.bind(hooks),
        cancelComposition: hooks.cancelComposition.bind(hooks)
      },
      fence
    };
    surface = record;
    const lease = Object.freeze({
      id: record.id,
      generation,
      isActive: () => !terminal && record.active && surface === record,
      request(message, requestOptions) {
        assertPublicMutation();
        let owned, expected, operation;
        try {
          assertSurface(record);
          owned = copyOwned(message);
          expected = copyOwned(requestOptions);
          if (expected.coordinates !== "legacy-native")
            throw Error("InvalidSurfaceCoordinates");
          operation = surfaceOperation(owned.kind);
          if (!operation)
            throw Error("UnsupportedSurfaceOperation");
        } catch (error) {
          return Promise.reject(error);
        }
        return enqueue(async () => {
          assertSurface(record);
          requireReady(expected.token, true);
          if (operation === "read")
            return readRequest(owned, expected.token, () => assertSurface(record));
          if (operation === "view") {
            const ctx = context(expected.token);
            const reply = await active.request(owned, ctx);
            verifyReply(reply, ctx);
            if (reply.error)
              throw Error(reply.error);
            install(contentPatch(reply), false, ctx, takeGeometryOrigin(active, reply, ctx));
            assertSurface(record);
            return freezeDTO(copyOwned(reply, true));
          }
          const answer = await mutate(owned, expected.token);
          assertSurface(record);
          return answer;
        });
      },
      publishSelection(target) {
        assertPublicMutation();
        let owned;
        const expected = state.token;
        try {
          assertSurface(record);
          owned = copyOwned(target);
        } catch (error) {
          return Promise.reject(error);
        }
        return enqueue(async () => {
          assertSurface(record);
          requireReady(owned ?? expected);
          if (owned)
            validateSelection(owned, state);
          install({ selection: owned });
          assertSurface(record);
          return state;
        });
      },
      release() {
        if (!record.active)
          return;
        assertPublicMutation();
        geometry.invalidate();
        record.active = false;
        record.fence.cancel();
        if (surface === record) {
          surface = undefined;
          install({ selection: null });
        }
        cancelComposition(record, "detach");
      }
    });
    bindGeometryProjectionPort(lease, (snapshot) => !terminal && record.active && surface === record && snapshot === state ? geometry.read(snapshot) : undefined);
    return lease;
  }
  function register(set, listener) {
    assertLive();
    if (typeof listener !== "function")
      throw TypeError("InvalidListener");
    set.add(listener);
    let attached = true;
    return () => {
      if (!attached)
        return;
      attached = false;
      set.delete(listener);
    };
  }
  function dispose() {
    geometry.invalidate();
    assertPublicMutation();
    if (disposePromise)
      return disposePromise;
    terminal = true;
    selectionHistory.clear();
    disposedFence.cancel();
    for (const job of loads)
      job.fence.cancel();
    loads.clear();
    if (surface) {
      const detached = surface;
      surface = undefined;
      detached.active = false;
      detached.fence.cancel();
      cancelComposition(detached, "dispose");
    }
    state = new EditorState({
      editorId,
      documentId: state.documentId,
      generation: state.generation,
      operationRevision: state.operationRevision,
      viewRevision: state.viewRevision,
      stateVersion: ++stateVersion,
      status: "disposed",
      content: state.content,
      capabilities: state.capabilities,
      historyRecoveryRequired: state.historyRecoveryRequired,
      nativeHistoryStats: state.nativeHistoryStats,
      nativeHistoryRevision: state.nativeHistoryRevision,
      nativeHistoryRevisions: state.nativeHistoryRevisions,
      savedOperationRevision: state.savedOperationRevision,
      selection: state.selection
    }, runRead);
    stateListeners.clear();
    updateListeners.clear();
    errorListeners.clear();
    registry.clear();
    const nativeDisposal = queue.enqueue(async () => {
      const current = active, candidate = locked?.runtime;
      active = undefined;
      locked = undefined;
      const failures = [];
      for (const runtime of [candidate, current])
        try {
          await release(runtime);
        } catch (error) {
          failures.push(error);
        }
      if (failures.length)
        throw new AggregateError(failures, "RuntimeDisposeFailed");
    });
    disposePromise = Promise.all([nativeDisposal, admission.drain()]).then(() => {});
    return disposePromise;
  }
  function geometryGuard(fn) {
    return (...args) => {
      try {
        const value = fn(...args);
        if (value instanceof Promise)
          value.catch(() => geometry.invalidate());
        return value;
      } catch (error) {
        geometry.invalidate();
        throw error;
      }
    };
  }
  return Object.freeze({
    getEditorState: () => state,
    read: (callback) => runRead(callback, state),
    load: geometryGuard(load),
    createDocument: geometryGuard(createDocument),
    unlock: geometryGuard(unlock),
    cancelLoad: geometryGuard(cancelLoad),
    dispatchCommand: geometryGuard(dispatchCommand),
    update: geometryGuard(update),
    save: geometryGuard(save),
    refresh: geometryGuard(refresh),
    requestExperimental: geometryGuard(requestExperimental),
    readResource: geometryGuard(readResource),
    getFormattingCapabilities: geometryGuard(getFormattingCapabilities),
    queryFormatting: geometryGuard(queryFormatting),
    setSelection: geometryGuard(setSelection),
    acquireInputSurface: geometryGuard(acquireInputSurface),
    dispose: geometryGuard(dispose),
    undo: (token) => historyCommand(UNDO_COMMAND, token),
    redo: (token) => historyCommand(REDO_COMMAND, token),
    registerStateListener: (listener) => register(stateListeners, listener),
    registerUpdateListener: (listener) => register(updateListeners, listener),
    registerErrorListener: (listener) => register(errorListeners, listener),
    registerCommand: (command, callback, priority = 0) => {
      assertLive();
      return registry.register(command, callback, priority);
    }
  });
}
// packages/core/src/state/formatting-state.ts
var message = (error) => error instanceof Error ? error.message : String(error);
function getSelectionFormatting(state) {
  const unavailable = (reason) => Object.freeze({
    target: null,
    characterAvailableReason: reason,
    paragraphAvailableReason: reason,
    underlineAvailableReason: reason,
    strikeAvailableReason: reason,
    textColorAvailableReason: reason,
    fontNames: Object.freeze(Object.fromEntries(FONT_LANGUAGES.map((language) => [
      language,
      Object.freeze({ kind: "unknown" })
    ]))),
    fontNameAvailableReasons: Object.freeze(Object.fromEntries(FONT_LANGUAGES.map((language) => [language, reason]))),
    textColor: null,
    bold: null,
    italic: null,
    underline: null,
    strike: null,
    size: null,
    align: null
  });
  if (state.status !== "ready")
    return unavailable(state.status === "refresh-required" ? "RefreshRequired" : "EditorNotReady");
  const selection = state.selection;
  if (selection == null)
    return unavailable("MissingSelection");
  let target, row;
  try {
    const selected = selection;
    row = validateSelection(selected, state);
    target = Object.freeze({
      editorId: selected.editorId,
      documentId: selected.documentId,
      generation: selected.generation,
      operationRevision: selected.operationRevision,
      viewRevision: selected.viewRevision,
      coordinateSpace: selected.coordinateSpace,
      format: selected.format,
      owner: selected.owner,
      section: selected.section,
      paragraph: selected.paragraph,
      startUnit: selected.startUnit,
      endUnit: selected.endUnit,
      affinity: selected.affinity
    });
  } catch (error) {
    return unavailable(message(error));
  }
  const reason = (character, capability) => {
    try {
      validateFormattingTarget(target, state, character, capability);
      return null;
    } catch (error) {
      return message(error);
    }
  };
  const characterAvailableReason = reason(true), paragraphAvailableReason = reason(false);
  const underlineAvailableReason = reason(true, "characterUnderlineAvailable");
  const strikeTargetReason = reason(true, "characterStrikeAvailable");
  const content = state.content;
  const caret = target.startUnit === target.endUnit;
  const span = caret ? typingSourceSpan(row.text, target.startUnit) : null;
  const start = span?.start ?? target.startUnit;
  const end = span?.end ?? target.endUnit;
  const observedSpan = characterRangeValues({ paragraphs: [row] }, [{ section: target.section, paragraph: target.paragraph, startUnit: start, endUnit: end }], () => true, { isBoundary: isUtf16Boundary });
  const canObserve = (capability) => observedSpan !== null && content[capability] === true;
  const bold = canObserve("characterPropertiesAvailable") ? characterSelectionState(content, row, start, end, "bold") : null;
  const italic = canObserve("characterPropertiesAvailable") ? characterSelectionState(content, row, start, end, "italic") : null;
  const underline = canObserve("characterUnderlineAvailable") ? characterSelectionState(content, row, start, end, "underline") : null;
  const strike = canObserve("characterStrikeAvailable") ? characterSelectionState(content, row, start, end, "strike") : null;
  const strikeAvailableReason = strikeTargetReason ?? (strike === null ? "UnknownCharacterStrike" : null);
  const textColorTargetReason = reason(true, "characterTextColorAvailable");
  const colorObservation = canObserve("characterTextColorAvailable") ? characterTextColorObservation(content, row, start, end) : null;
  const textColor = colorObservation?.value ?? null;
  const textColorAvailableReason = textColorTargetReason ?? (colorObservation?.bindingValid ? null : "UnknownCharacterTextColor");
  const size = canObserve("characterPropertiesAvailable") ? characterSizeState(content, row, start, end, {
    isBoundary: isUtf16Boundary
  }) : null;
  const align = paragraphAlignmentKey(row.paragraphShape?.alignment);
  const fontTargetReason = reason(true, "characterFontNameAvailable");
  const fontObserved = characterFontNameObservations(content, row, start, end);
  const fontNames = Object.freeze(Object.fromEntries(FONT_LANGUAGES.map((language) => [
    language,
    fontObserved[language].value
  ])));
  const fontNameAvailableReasons = Object.freeze(Object.fromEntries(FONT_LANGUAGES.map((language) => [
    language,
    fontTargetReason ?? (fontObserved[language].bindingValid ? null : "UnknownCharacterFontName")
  ])));
  return Object.freeze({
    target,
    characterAvailableReason,
    paragraphAvailableReason,
    underlineAvailableReason,
    strikeAvailableReason,
    textColorAvailableReason,
    fontNames,
    fontNameAvailableReasons,
    textColor,
    bold,
    italic,
    underline,
    strike,
    size,
    align
  });
}
// js/document-format.mjs
var cfbSignature = Uint8Array.of(208, 207, 17, 224, 161, 177, 26, 225);
var hwp3Signature = new TextEncoder().encode("HWP Document File V3");
var startsWith = (bytes, signature) => bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);
function detectDocumentFormat(input) {
  const bytes = input instanceof Uint8Array ? input : input instanceof ArrayBuffer ? new Uint8Array(input) : null;
  if (!bytes)
    throw new TypeError("ExpectedDocumentBytes");
  if (startsWith(bytes, cfbSignature))
    return "hwp5";
  if (bytes.length >= 4 && bytes[0] === 80 && bytes[1] === 75 && (bytes[2] === 3 && bytes[3] === 4 || bytes[2] === 5 && bytes[3] === 6 || bytes[2] === 7 && bytes[3] === 8))
    return "hwpx";
  if (startsWith(bytes, hwp3Signature))
    throw new Error("UnsupportedHwp3Document");
  throw new Error("UnsupportedDocumentSignature");
}

// packages/core/src/document-format.ts
function detectDocumentFormat2(input) {
  return detectDocumentFormat(input);
}
// packages/core/src/state/text-tools.ts
function textRows(state) {
  if (state.status !== "ready")
    return [];
  const content = state.content;
  if (!Array.isArray(content?.paragraphs))
    throw Error("InvalidDocumentTextSnapshot");
  const identities = new Set;
  return content.paragraphs.filter((row) => {
    if (!row || !Number.isSafeInteger(row.section) || row.section < 0 || !Number.isSafeInteger(row.paragraph) || row.paragraph < 0 || typeof row.text !== "string")
      throw Error("InvalidDocumentTextSnapshot");
    const key = `${row.section}:${row.paragraph}`;
    if (identities.has(key))
      throw Error("AmbiguousDocumentText");
    identities.add(key);
    return true;
  });
}
function searchOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options) || ![Object.prototype, null].includes(Object.getPrototypeOf(options)))
    throw Error("InvalidFindTextOptions");
  for (const key of Reflect.ownKeys(options)) {
    if (typeof key !== "string" || !["direction", "wrap", "origin"].includes(key) || !("value" in Object.getOwnPropertyDescriptor(options, key)))
      throw Error("InvalidFindTextOptions");
  }
  if (options.direction !== undefined && !["forward", "backward"].includes(options.direction) || options.wrap !== undefined && typeof options.wrap !== "boolean" || options.origin !== undefined && !["selection", "document"].includes(options.origin))
    throw Error("InvalidFindTextOptions");
  return {
    direction: options.direction ?? "forward",
    wrap: options.wrap ?? true,
    origin: options.origin ?? "selection"
  };
}
function findTextMatch(state, query, options = {}) {
  const { direction, wrap, origin } = searchOptions(options);
  if (typeof query !== "string" || !query || !isWellFormedText(query))
    throw Error("InvalidSearchQuery");
  const content = state.content;
  if (state.status !== "ready" || !["hwp5", "hwpx"].includes(content?.format ?? ""))
    throw Error("EditorNotReady");
  const rows = textRows(state), selected = origin === "selection" ? state.selection : null;
  if (!rows.length)
    return null;
  const selectedIndex = selected ? rows.findIndex((row) => row.section === selected.section && row.paragraph === selected.paragraph) : -1;
  const backward = direction === "backward", anchored = selectedIndex >= 0;
  const first = anchored ? selectedIndex : backward ? rows.length - 1 : 0;
  const start = anchored ? backward ? selected.startUnit : selected.endUnit : backward ? rows[first].text.length : 0;
  const visits = rows.length + (wrap && anchored ? 1 : 0);
  for (let step = 0;step < visits; step++) {
    const absolute = first + (backward ? -step : step);
    if (!wrap && (absolute < 0 || absolute >= rows.length))
      break;
    const row = rows[(absolute % rows.length + rows.length) % rows.length];
    if (row.clipped)
      continue;
    const owner = paragraphSelectionOwner(row);
    if (!owner)
      continue;
    const from = backward ? (step === 0 ? start : row.text.length) - query.length : step === 0 ? start : 0;
    if (backward && from < 0)
      continue;
    const at = backward ? row.text.lastIndexOf(query, from) : row.text.indexOf(query, from);
    if (at < 0 || step === rows.length && (backward ? at + query.length <= start : at >= start))
      continue;
    return Object.freeze({
      ...state.token,
      coordinateSpace: "display",
      format: content.format,
      owner,
      section: row.section,
      paragraph: row.paragraph,
      startUnit: at,
      endUnit: at + query.length,
      affinity: "forward"
    });
  }
  return null;
}
function selectionMatchesText(state, query) {
  const selected = state.selection;
  if (!selected || !query)
    return false;
  const row = textRows(state).find((row) => row.section === selected.section && row.paragraph === selected.paragraph);
  return !!row && !row.clipped && row.text.slice(selected.startUnit, selected.endUnit) === query;
}
function getDocumentTextStatistics(state) {
  if (state.status !== "ready")
    throw Error("EditorNotReady");
  const rows = textRows(state), content = state.content;
  const texts = rows.map((row) => row.text.replace(/\ufffc/g, ""));
  const scalars = Array.from(texts.join(""));
  return Object.freeze({
    complete: !content?.window && !content?.limited && !rows.some((row) => row.clipped),
    paragraphs: rows.length,
    characters: scalars.length,
    charactersWithoutWhitespace: scalars.filter((char) => !/\s/u.test(char)).length,
    words: texts.reduce((count, text) => count + (text.trim() ? text.trim().split(/\s+/u).length : 0), 0)
  });
}
// packages/core/src/state/clipboard-state.ts
function getSelectionClipboard(state) {
  const unavailable = (reason) => Object.freeze({
    target: null,
    text: null,
    copyReason: reason,
    editReason: reason,
    stateVersion: state.stateVersion
  });
  if (!state.documentId || state.status === "empty")
    return unavailable("NoDocument");
  if (state.status !== "ready")
    return unavailable(state.status === "refresh-required" ? "RefreshRequired" : "EditorNotReady");
  if (state.selection == null)
    return unavailable("MissingSelection");
  try {
    const selected = state.selection;
    const row = validateSelection(selected, state);
    const target = Object.freeze({
      ...state.token,
      coordinateSpace: selected.coordinateSpace,
      format: selected.format,
      owner: selected.owner,
      section: selected.section,
      paragraph: selected.paragraph,
      startUnit: selected.startUnit,
      endUnit: selected.endUnit,
      affinity: selected.affinity
    });
    const text = row.text.slice(target.startUnit, target.endUnit);
    if (text.includes("￼"))
      return unavailable("ClipboardObjectSelectionUnsupported");
    let editReason = null;
    try {
      selectionMessage(target, state);
    } catch (error) {
      editReason = error instanceof Error ? error.message : String(error);
    }
    return Object.freeze({
      target,
      text,
      copyReason: text.length ? null : "EmptyClipboardSelection",
      editReason,
      stateVersion: state.stateVersion
    });
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }
}
// packages/core/src/keymap/config.ts
var platforms = ["mac", "windows", "linux"];
var modifiers = new Set(["Mod", "Control", "Meta", "Alt", "Shift"]);
var namedCodes = new Set(("Backquote Backslash Backspace BracketLeft BracketRight Comma Equal Minus Period Quote Semicolon Slash " + "AltLeft AltRight CapsLock ContextMenu ControlLeft ControlRight Enter MetaLeft MetaRight ShiftLeft ShiftRight Space Tab " + "Delete End Help Home Insert PageDown PageUp ArrowDown ArrowLeft ArrowRight ArrowUp Escape NumLock ScrollLock Pause PrintScreen " + "IntlBackslash IntlRo IntlYen Convert NonConvert KanaMode Lang1 Lang2 Lang3 Lang4 Lang5 " + "NumpadAdd NumpadBackspace NumpadClear NumpadClearEntry NumpadComma NumpadDecimal NumpadDivide NumpadEnter NumpadEqual NumpadHash NumpadMemoryAdd NumpadMemoryClear NumpadMemoryRecall NumpadMemoryStore NumpadMemorySubtract NumpadMultiply NumpadParenLeft NumpadParenRight NumpadStar NumpadSubtract " + "AudioVolumeDown AudioVolumeMute AudioVolumeUp MediaPlayPause MediaStop MediaTrackNext MediaTrackPrevious").split(" "));
function invalid(detail) {
  throw new TypeError(`InvalidKeymap: ${detail}`);
}
function record2(value, where) {
  if (!value || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    invalid(where);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !("value" in Object.getOwnPropertyDescriptor(value, key)))
      invalid(`${where} property`);
  }
  return value;
}
function fields(value, allowed, where) {
  for (const key of Object.getOwnPropertyNames(value))
    if (!allowed.includes(key))
      invalid(`${where}.${key}`);
}
function text(value, where) {
  if (typeof value !== "string" || !value.trim() || /[\u0000-\u001f\u007f]/.test(value))
    invalid(where);
  return value;
}
function keymapModifierMask(binding, platform) {
  let mask = 0;
  for (const modifier of binding.modifiers) {
    const expanded = modifier === "Mod" ? platform === "mac" ? "Meta" : "Control" : modifier;
    mask |= expanded === "Control" ? 1 : expanded === "Meta" ? 2 : expanded === "Alt" ? 4 : 8;
  }
  return mask;
}
function validateKeymapConfig(input) {
  const config = record2(input, "config");
  fields(config, ["version", "bindings", "messages"], "config");
  if (config.version !== 1 || !Array.isArray(config.bindings))
    invalid("version/bindings");
  const ids = new Set;
  const bindings = config.bindings.map((input, index) => {
    const row = record2(input, `bindings[${index}]`);
    fields(row, ["id", "command", "code", "modifiers", "platform", "enabled", "labelKey"], "binding");
    const id = text(row.id, "id"), command = text(row.command, "command"), code = text(row.code, "code");
    if (ids.has(id))
      invalid(`duplicate id ${id}`);
    ids.add(id);
    if (!/^(?:Key[A-Z]|Digit[0-9]|Numpad[0-9]|F(?:[1-9]|1[0-9]|2[0-4]))$/.test(code) && !namedCodes.has(code))
      invalid(`code ${code}`);
    if (!Array.isArray(row.modifiers))
      invalid("modifiers");
    const seen = new Set;
    for (const modifier of row.modifiers) {
      if (typeof modifier !== "string" || !modifiers.has(modifier) || seen.has(modifier))
        invalid("modifier");
      seen.add(modifier);
    }
    if (seen.has("Mod") && (seen.has("Control") || seen.has("Meta")))
      invalid("Mod with explicit primary modifier");
    if ("platform" in row && !["all", ...platforms].includes(row.platform))
      invalid("platform");
    if ("enabled" in row && typeof row.enabled !== "boolean")
      invalid("enabled");
    if ("labelKey" in row)
      text(row.labelKey, "labelKey");
    return Object.freeze({
      id,
      command,
      code,
      modifiers: Object.freeze([...seen]),
      ..."platform" in row ? { platform: row.platform } : {},
      ..."enabled" in row ? { enabled: row.enabled } : {},
      ..."labelKey" in row ? { labelKey: row.labelKey } : {}
    });
  });
  for (const platform of platforms) {
    const keys = new Set;
    for (const binding of bindings) {
      if (binding.enabled === false || binding.platform && binding.platform !== "all" && binding.platform !== platform)
        continue;
      const key = `${binding.code}:${keymapModifierMask(binding, platform)}`;
      if (keys.has(key))
        invalid(`shortcut conflict on ${platform}: ${key}`);
      keys.add(key);
    }
  }
  let messages;
  if ("messages" in config) {
    const source = record2(config.messages, "messages");
    messages = Object.create(null);
    for (const [locale, input] of Object.entries(source)) {
      if (!/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(locale))
        invalid("locale");
      const translations = record2(input, "translations");
      const owned = Object.create(null);
      for (const [key, value] of Object.entries(translations)) {
        text(key, "labelKey");
        if (typeof value !== "string")
          invalid("message");
        owned[key] = value;
      }
      messages[locale] = Object.freeze(owned);
    }
    Object.freeze(messages);
  }
  return Object.freeze({
    version: 1,
    bindings: Object.freeze(bindings),
    ...messages ? { messages } : {}
  });
}
function mergeKeymap(defaults, overrides) {
  const base = validateKeymapConfig(defaults), custom = validateKeymapConfig(overrides);
  const rows = new Map(base.bindings.map((binding) => [binding.id, binding]));
  for (const binding of custom.bindings)
    rows.set(binding.id, binding);
  const messages = Object.create(null);
  for (const config of [base, custom])
    for (const [locale, values] of Object.entries(config.messages ?? {})) {
      messages[locale] = Object.assign(Object.create(null), messages[locale], values);
    }
  return validateKeymapConfig({ version: 1, bindings: [...rows.values()], messages });
}
function resolveShortcutLabel(config, binding, locale) {
  const key = binding.labelKey ?? binding.id;
  for (const language of [locale, locale.split("-")[0], "en"]) {
    const labels = config.messages?.[language];
    if (labels && Object.hasOwn(labels, key))
      return labels[key];
  }
  return binding.id;
}
var parseKeymapConfig = validateKeymapConfig;
// packages/core/src/keymap/resolve.ts
var compiledIndexes = new WeakMap;
function compileKeymap(config, platform) {
  if (!["mac", "windows", "linux"].includes(platform))
    throw new TypeError("InvalidKeymapPlatform");
  const owned = validateKeymapConfig(config);
  const bindings = Object.freeze(owned.bindings.filter((binding) => binding.enabled !== false && (!binding.platform || binding.platform === "all" || binding.platform === platform)));
  const index = new Map(bindings.map((binding) => [
    `${binding.code}:${keymapModifierMask(binding, platform)}`,
    binding
  ]));
  const compiled = Object.freeze({ platform, bindings });
  compiledIndexes.set(compiled, index);
  return compiled;
}
function resolveKeyboardShortcut(compiled, event) {
  const index = compiledIndexes.get(compiled);
  if (!index)
    throw new TypeError("InvalidCompiledKeymap");
  if (!event || event.isComposing || event.keyCode === 229 || event.altGraph)
    return null;
  if (typeof event.code !== "string" || [event.ctrlKey, event.metaKey, event.altKey, event.shiftKey].some((value) => typeof value !== "boolean"))
    return null;
  const mask = (event.ctrlKey ? 1 : 0) | (event.metaKey ? 2 : 0) | (event.altKey ? 4 : 0) | (event.shiftKey ? 8 : 0);
  const binding = index.get(`${event.code}:${mask}`) ?? null;
  if (event.repeat && binding?.command !== "undo" && binding?.command !== "redo")
    return null;
  return binding;
}
// packages/core/src/keymap/defaults.json
var defaults_default = {
  version: 1,
  bindings: [
    {
      id: "new-document",
      command: "new-document",
      code: "KeyN",
      modifiers: ["Mod"],
      platform: "all",
      labelKey: "command.new-document"
    },
    {
      id: "save",
      command: "save",
      code: "KeyS",
      modifiers: ["Mod"],
      platform: "all",
      labelKey: "command.save"
    },
    {
      id: "undo",
      command: "undo",
      code: "KeyZ",
      modifiers: ["Mod"],
      platform: "all",
      labelKey: "command.undo"
    },
    {
      id: "cut",
      command: "cut",
      code: "KeyX",
      modifiers: ["Mod"],
      platform: "all",
      labelKey: "command.cut"
    },
    {
      id: "copy",
      command: "copy",
      code: "KeyC",
      modifiers: ["Mod"],
      platform: "all",
      labelKey: "command.copy"
    },
    {
      id: "paste",
      command: "paste",
      code: "KeyV",
      modifiers: ["Mod"],
      platform: "all",
      labelKey: "command.paste"
    },
    {
      id: "find",
      command: "find",
      code: "KeyF",
      modifiers: ["Mod"],
      platform: "all",
      labelKey: "command.find"
    },
    {
      id: "bold",
      command: "bold",
      code: "KeyB",
      modifiers: ["Mod"],
      platform: "all",
      labelKey: "command.bold"
    },
    {
      id: "italic",
      command: "italic",
      code: "KeyI",
      modifiers: ["Mod"],
      platform: "all",
      labelKey: "command.italic"
    },
    {
      id: "underline",
      command: "underline",
      code: "KeyU",
      modifiers: ["Mod"],
      platform: "all",
      labelKey: "command.underline"
    },
    {
      id: "redo",
      command: "redo",
      code: "KeyZ",
      modifiers: ["Mod", "Shift"],
      platform: "all",
      labelKey: "command.redo"
    },
    {
      id: "replace-mac",
      command: "replace",
      code: "KeyH",
      modifiers: ["Mod", "Shift"],
      platform: "mac",
      labelKey: "command.replace"
    },
    {
      id: "replace-windows",
      command: "replace",
      code: "KeyH",
      modifiers: ["Control"],
      platform: "windows",
      labelKey: "command.replace"
    },
    {
      id: "replace-linux",
      command: "replace",
      code: "KeyH",
      modifiers: ["Control"],
      platform: "linux",
      labelKey: "command.replace"
    },
    {
      id: "bold-hancom-windows",
      command: "bold",
      code: "KeyB",
      modifiers: ["Alt", "Shift"],
      platform: "windows",
      labelKey: "command.bold"
    },
    {
      id: "bold-hancom-linux",
      command: "bold",
      code: "KeyB",
      modifiers: ["Alt", "Shift"],
      platform: "linux",
      labelKey: "command.bold"
    },
    {
      id: "italic-hancom-windows",
      command: "italic",
      code: "KeyI",
      modifiers: ["Alt", "Shift"],
      platform: "windows",
      labelKey: "command.italic"
    },
    {
      id: "italic-hancom-linux",
      command: "italic",
      code: "KeyI",
      modifiers: ["Alt", "Shift"],
      platform: "linux",
      labelKey: "command.italic"
    },
    {
      id: "underline-hancom-windows",
      command: "underline",
      code: "KeyU",
      modifiers: ["Alt", "Shift"],
      platform: "windows",
      labelKey: "command.underline"
    },
    {
      id: "underline-hancom-linux",
      command: "underline",
      code: "KeyU",
      modifiers: ["Alt", "Shift"],
      platform: "linux",
      labelKey: "command.underline"
    },
    {
      id: "redo-compat-y",
      command: "redo",
      code: "KeyY",
      modifiers: ["Mod"],
      labelKey: "command.redo"
    }
  ],
  messages: {
    ko: {
      "command.save": "저장",
      "command.undo": "실행 취소",
      "command.redo": "다시 실행",
      "command.cut": "잘라내기",
      "command.copy": "복사",
      "command.paste": "붙여넣기",
      "command.find": "찾기",
      "command.replace": "찾아 바꾸기",
      "command.bold": "굵게",
      "command.italic": "기울임",
      "command.underline": "밑줄",
      "command.new-document": "새 문서"
    },
    en: {
      "command.save": "Save",
      "command.undo": "Undo",
      "command.redo": "Redo",
      "command.cut": "Cut",
      "command.copy": "Copy",
      "command.paste": "Paste",
      "command.find": "Find",
      "command.replace": "Replace",
      "command.bold": "Bold",
      "command.italic": "Italic",
      "command.underline": "Underline",
      "command.new-document": "New document"
    }
  }
};

// packages/core/src/keymap/defaults.ts
var DEFAULT_KEYMAP = parseKeymapConfig(defaults_default);
// js/file-transform-input.mjs
var typed = Object.getPrototypeOf(Uint8Array.prototype);
var tag = Object.getOwnPropertyDescriptor(typed, Symbol.toStringTag).get;
var lengthOf = Object.getOwnPropertyDescriptor(typed, "byteLength").get;
var offsetOf = Object.getOwnPropertyDescriptor(typed, "byteOffset").get;
var bufferOf = Object.getOwnPropertyDescriptor(typed, "buffer").get;
var bufferLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get;
function copyFileTransformInput(value, limit, name) {
  let length, buffer, offset = 0;
  try {
    if (ArrayBuffer.isView(value) && tag.call(value) === "Uint8Array") {
      length = lengthOf.call(value);
      offset = offsetOf.call(value);
      buffer = bufferOf.call(value);
      bufferLength.call(buffer);
    } else {
      length = bufferLength.call(value);
      buffer = value;
    }
  } catch {
    throw new TypeError(`Invalid${name}Bytes`);
  }
  if (length < 1 || length > limit)
    throw new RangeError(`${name}ByteLimitExceeded`);
  const result = new Uint8Array(length);
  result.set(new Uint8Array(buffer, offset, length));
  return result;
}

// packages/document/src/bytes.ts
function copyDocumentBytes(value, limit, name) {
  return copyFileTransformInput(value, limit, name);
}

// packages/document/src/limits.ts
var HTML_EXPORT_LIMITS = Object.freeze({
  documentBytes: 64 * 1024 * 1024,
  wasmBytes: 32 * 1024 * 1024,
  imageBytes: 8 * 1024 * 1024,
  imageTotalBytes: 16 * 1024 * 1024,
  imageDataUnits: 24 * 1024 * 1024,
  outputBytes: 32 * 1024 * 1024
});

// packages/document/src/read-document.ts
var errorMessage = (error) => {
  if (error === null || typeof error !== "object")
    return "";
  const descriptor = Object.getOwnPropertyDescriptor(error, "message");
  return typeof descriptor?.value === "string" ? descriptor.value : "";
};
async function openHwp5(wasm, bytes) {
  const { createExperimentalHwp5Editor } = await (__preload("ge650rt9"), import("./chunk-ge650rt9.js"));
  const sdk = await createExperimentalHwp5Editor(wasm, bytes);
  try {
    return { sdk, sectionCount: sdk.sectionCount(), close: () => sdk.close() };
  } catch (error) {
    sdk.close();
    throw error;
  }
}
async function openHwpx(wasm, bytes) {
  const { createHwpxEditor } = await (__preload("f3rm8ern"), import("./chunk-f3rm8ern.js"));
  const sdk = await createHwpxEditor(wasm);
  try {
    return { sdk, sectionCount: sdk.open(bytes).sectionCount, close: () => sdk.close() };
  } catch (error) {
    sdk.close();
    throw error;
  }
}
async function openReadOnlyDocument(input, dependencies = {}) {
  const values = Object.create(null);
  if (!input || typeof input !== "object")
    throw new TypeError("InvalidReadOnlyInput");
  for (const key of ["bytes", "wasm", "sourceSha256"]) {
    const property = Object.getOwnPropertyDescriptor(input, key);
    if (!property || !Object.hasOwn(property, "value"))
      throw new TypeError("InvalidReadOnlyInput");
    values[key] = property.value;
  }
  const sourceSha256 = values.sourceSha256;
  if (typeof sourceSha256 !== "string" || !/^[a-f0-9]{64}$/.test(sourceSha256))
    throw new TypeError("InvalidSourceSha256");
  const bytes = copyDocumentBytes(values.bytes, HTML_EXPORT_LIMITS.documentBytes, "Document");
  const wasm = copyDocumentBytes(values.wasm, HTML_EXPORT_LIMITS.wasmBytes, "Wasm");
  const format = detectDocumentFormat(bytes);
  let handle;
  try {
    handle = await (format === "hwp5" ? dependencies.openHwp5 ?? openHwp5 : dependencies.openHwpx ?? openHwpx)(wasm, bytes);
  } catch (error) {
    if (format === "hwp5" && errorMessage(error) === "UnsupportedDistribution")
      throw new Error("UnsupportedDistributionDocument", { cause: error });
    throw error;
  }
  try {
    if (!Number.isSafeInteger(handle.sectionCount) || handle.sectionCount < 1 || handle.sectionCount > 4096 || !handle.sdk || typeof handle.sdk !== "object" || typeof handle.close !== "function")
      throw new Error("InvalidReadOnlyDocument");
  } catch (error) {
    try {
      await handle.close();
    } catch (closeError) {
      throw new AggregateError([error, closeError], "ReadOnlyAdmissionAndCloseFailed");
    }
    throw error;
  }
  let closed = false;
  return Object.freeze({
    format,
    sourceSha256,
    sectionCount: handle.sectionCount,
    sdk: handle.sdk,
    close: () => {
      if (!closed) {
        closed = true;
        return handle.close();
      }
    }
  });
}

// packages/document/src/model/common.ts
var LIMITS = Object.freeze({
  maxDepth: 32,
  maxBlocks: 200000,
  maxTextUnits: 4 * 1024 * 1024
});
var uint3 = (value) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 4294967295;
var diagnostic = (code, message, source) => ({
  code,
  message: String(message).slice(0, 512),
  ...source ? { source: { ...source } } : {}
});
function call(sdk, method, args, warnings, source) {
  try {
    const getter = Reflect.get(sdk, method);
    if (typeof getter !== "function")
      throw new Error(`${method}Unavailable`);
    return { ok: true, value: Reflect.apply(getter, sdk, args) };
  } catch (error) {
    const message = error !== null && (typeof error === "object" || typeof error === "function") ? Reflect.get(error, "message") ?? "UnknownError" : "UnknownError";
    warnings.push(diagnostic("ObservationUnavailable", `${method}: ${message}`, source));
    return { ok: false, value: null };
  }
}
function array(result, warnings, name, source) {
  if (result.ok && Array.isArray(result.value) && result.value.length <= LIMITS.maxBlocks)
    return result.value;
  if (result.ok)
    warnings.push(diagnostic("InvalidObservation", name, source));
  result.ok = false;
  return [];
}
function unique(rows, key, warnings, name) {
  const map = new Map;
  for (const row of rows) {
    const id = key(row);
    if (map.has(id)) {
      map.set(id, null);
      warnings.push(diagnostic("AmbiguousSourceIdentity", name));
    } else
      map.set(id, row);
  }
  return map;
}

// packages/document/src/model/hwp5.ts
function collectHwp5({
  sdk,
  sectionCount
}) {
  const warnings = [], sections = [];
  const preview = call(sdk, "currentTextPreview", [], warnings);
  const previewSections = unique(array({ ok: preview.ok, value: preview.value?.sections }, warnings, "currentTextPreview.sections"), (row) => row.index, warnings, "preview section");
  for (let section = 0;section < sectionCount; section++) {
    const source = { section };
    const get = (name) => call(sdk, name, [section], warnings, source);
    const flowResult = get("paragraphFlow"), flows = array(flowResult, warnings, "paragraphFlow", source);
    const flowMap = unique(flows, (r) => r.paragraph, warnings, "paragraphFlow");
    const countResult = get("paragraphCount");
    const count = countResult.ok && uint3(countResult.value) && countResult.value <= 1e5 ? countResult.value : null;
    const previewRows = previewSections.get(section)?.paragraphs;
    const paragraphs = [], objectTokens = [];
    let objectTokensKnown = count !== null && preview.ok && Array.isArray(previewRows) && previewRows.length === count;
    const ordinals = count !== null ? Array.from({ length: count }, (_, ordinal) => ordinal) : [...new Set(flows.map((row) => row.paragraph))];
    for (const paragraph of ordinals) {
      const p = previewRows?.[paragraph], flow = flowMap.get(paragraph);
      const node = uint3(flow?.source_node) ? flow.source_node : uint3(p?.nodeIndex) ? p.nodeIndex : null;
      const emptyParagraph = p?.textPresent === false && p.text === "" && uint3(p.nodeIndex) && uint3(p.declaredUnits) && p.declaredUnits <= 1 && Array.isArray(p.tokens) && p.tokens.length === 0;
      let displayText = typeof p?.text === "string" && (p.textPresent === true || emptyParagraph) ? p.text : null;
      let identityKnown = uint3(node) && flow?.generated !== true;
      if (uint3(p?.nodeIndex) && uint3(flow?.source_node) && p.nodeIndex !== flow.source_node) {
        identityKnown = false;
        displayText = null;
        warnings.push(diagnostic("ParagraphSourceMismatch", "Native source identities disagree", {
          section,
          paragraph
        }));
      }
      paragraphs.push({
        paragraph,
        node,
        identityKnown,
        displayText,
        flow: flow ?? null
      });
      if (!Array.isArray(p?.tokens))
        objectTokensKnown = false;
      else
        for (const token of p.tokens) {
          if (token?.type !== "control" || token.code !== 11)
            continue;
          if (!uint3(token.startUnit)) {
            objectTokensKnown = false;
            continue;
          }
          objectTokens.push({ paragraph, anchorUnit: token.startUnit, identityKnown });
        }
    }
    const bindings = get("tableBindings"), placements = get("tablePlacements"), tableInventory = get("tableLayoutSources"), cellInventory = get("cellLayoutSources"), areas = get("pageAreaSources");
    for (const [name, result] of Object.entries({
      bindings,
      placements,
      tableInventory,
      cellInventory,
      areas
    }))
      array(result, warnings, name, source);
    const anchors = get("tableAnchors"), drawingSources = get("drawingSources"), drawingAnchors = get("drawingAnchors");
    const pictureResult = call(sdk, "pictureSources", [section, "base73"], warnings, source);
    const drawByComponent = unique(array(drawingSources, warnings, "drawingSources", source), (r) => r.component_node, warnings, "drawing component");
    const anchorByComponent = unique(array(drawingAnchors, warnings, "drawingAnchors", source), (r) => r.component_node, warnings, "drawing anchor");
    const pictures = array(pictureResult, warnings, "pictureSources", source).map((row) => {
      const draw = drawByComponent.get(row.component_node), anchor = anchorByComponent.get(row.component_node);
      const owner = draw?.control_node === row.owner_node && anchor?.control_node === row.owner_node;
      return {
        inventorySiteKnown: uint3(row.component_node) && uint3(row.picture_node) && uint3(row.owner_node) && uint3(row.bin_data_id) && row.bin_data_id > 0,
        pictureNode: row.component_node,
        parentParagraph: owner && uint3(anchor?.paragraph) ? anchor.paragraph : null,
        sourceInfo: {
          section,
          pictureNode: row.component_node,
          recordNode: row.picture_node,
          componentNode: row.component_node,
          ownerNode: row.owner_node,
          resourceId: row.bin_data_id
        },
        width: owner && uint3(draw?.width) ? draw.width : null,
        height: owner && uint3(draw?.height) ? draw.height : null,
        reason: owner ? null : "PictureOwnerUnverified"
      };
    });
    const representedPictures = new Set(pictures.map((row) => row.pictureNode));
    let fallbackPictures = 0;
    for (const draw of drawByComponent.values()) {
      if (draw?.kind_id !== 611346787 || representedPictures.has(draw.component_node))
        continue;
      const anchor = anchorByComponent.get(draw.component_node);
      const ownerKnown = anchor?.control_node === draw.control_node && uint3(anchor?.paragraph);
      pictures.push({
        inventorySiteKnown: false,
        pictureNode: draw.component_node,
        parentParagraph: ownerKnown ? anchor.paragraph : null,
        sourceInfo: {
          section,
          pictureNode: draw.component_node,
          componentNode: draw.component_node,
          ownerNode: draw.control_node
        },
        width: uint3(draw?.width) ? draw.width : null,
        height: uint3(draw?.height) ? draw.height : null,
        reason: "PictureSourceUnobserved"
      });
      representedPictures.add(draw.component_node);
      fallbackPictures++;
      warnings.push(diagnostic("PictureSourceUnobserved", "Native drawing proves an image exists, but its picture profile metadata is unavailable", { section }));
    }
    const objects = [];
    const componentsResult = get("drawingComponentSources");
    const components = unique(array(componentsResult, warnings, "drawingComponentSources", source), (r) => r.component_node, warnings, "drawing component inventory");
    let componentsKnown = componentsResult.ok;
    for (const row of components.values()) {
      if (!row || !uint3(row.component_node) || !uint3(row.kind_id) || !uint3(row.owner_node)) {
        componentsKnown = false;
        continue;
      }
      if (row.kind_id === 611346787) {
        if (!representedPictures.has(row.component_node)) {
          representedPictures.add(row.component_node);
          pictures.push({
            pictureNode: row.component_node,
            inventorySiteKnown: false,
            parentParagraph: null,
            sourceInfo: {
              section,
              pictureNode: row.component_node,
              componentNode: row.component_node,
              ownerNode: row.owner_node
            },
            reason: "PictureSourceUnobserved"
          });
          fallbackPictures++;
        }
        continue;
      }
      const drawing = drawByComponent.get(row.component_node), anchor = anchorByComponent.get(row.component_node);
      const ownerKnown = drawing && anchor && drawing.control_node === anchor.control_node && drawing.control_node === row.owner_node;
      objects.push({
        kind: "drawing",
        node: row.component_node,
        siteKnown: true,
        parentParagraph: ownerKnown && uint3(anchor?.paragraph) ? anchor.paragraph : null,
        parentObjectNode: components.get(row.owner_node)?.kind_id === 610496366 ? row.owner_node : null,
        nativeKind: row.kind_id,
        reason: ownerKnown ? "ObjectDetailsDeferred" : "ObjectOwnerUnverified"
      });
    }
    const knownAnchors = new Set;
    let anchorsKnown = anchors.ok && drawingAnchors.ok;
    for (const row of [
      ...array(anchors, warnings, "tableAnchors", source),
      ...array(drawingAnchors, warnings, "drawingAnchors", source)
    ]) {
      if (!uint3(row?.paragraph) || !uint3(row?.current_unit)) {
        anchorsKnown = false;
        continue;
      }
      knownAnchors.add(`${row.paragraph}:${row.current_unit}`);
    }
    const tokenCounts = new Map;
    for (const token of objectTokens) {
      const key = `${token.paragraph}:${token.anchorUnit}`;
      tokenCounts.set(key, (tokenCounts.get(key) ?? 0) + 1);
    }
    const seenTokens = new Set;
    for (const token of objectTokens) {
      const key = `${token.paragraph}:${token.anchorUnit}`;
      if (seenTokens.has(key)) {
        objectTokensKnown = false;
        continue;
      }
      seenTokens.add(key);
      const located = anchorsKnown && token.identityKnown && tokenCounts.get(key) === 1;
      if (located && knownAnchors.has(key))
        continue;
      objects.push({
        kind: "unknown",
        node: null,
        siteKnown: false,
        parentParagraph: located ? token.paragraph : null,
        paragraph: token.paragraph,
        anchorUnit: token.anchorUnit,
        reason: located ? "UnclassifiedExtendedObject" : "ObjectAnchorInventoryUnavailable"
      });
    }
    sections.push({
      section,
      paragraphs,
      paragraphTotal: count,
      flowsKnown: flowResult.ok,
      bindings,
      placements,
      tableInventory,
      cellInventory,
      areas,
      anchors,
      pictures,
      picturesKnown: pictureResult.ok && fallbackPictures === 0,
      objects,
      objectsKnown: componentsKnown && objectTokensKnown && anchorsKnown,
      objectInventoryScope: "hwp5-drawing-components-and-typed-code11-signals",
      format: "hwp5"
    });
  }
  return { sections, warnings };
}

// packages/document/src/model/hwpx.ts
function collectHwpx({
  sdk,
  sectionCount
}) {
  const warnings = [], sections = [];
  for (let section = 0;section < sectionCount; section++) {
    const source = { section }, get = (name) => call(sdk, name, [section], warnings, source);
    const flowResult = get("paragraphFlow"), flows = array(flowResult, warnings, "paragraphFlow", source), flowMap = unique(flows, (r) => r.paragraph, warnings, "paragraphFlow");
    const snapshot = get("paragraphTextSnapshot"), rows = array(snapshot, warnings, "paragraphTextSnapshot", source);
    const observedRows = rows.slice();
    const observedIds = new Set(rows.map((row) => row.paragraph));
    for (const flow of flows)
      if (!observedIds.has(flow.paragraph)) {
        observedRows.push({ paragraph: flow.paragraph });
        observedIds.add(flow.paragraph);
      }
    const paragraphs = observedRows.map((row) => {
      const flow = flowMap.get(row.paragraph);
      return {
        paragraph: row.paragraph,
        node: uint3(flow?.source_node) ? flow.source_node : null,
        identityKnown: uint3(flow?.source_node),
        displayText: typeof row.text === "string" ? row.text : null,
        flow: flow ?? null
      };
    });
    const bindings = get("tableBindings"), placements = get("tablePlacements"), tableInventory = get("tableBorderSources"), areas = get("pageAreaDeclarations");
    for (const [name, result] of Object.entries({ bindings, placements, areas }))
      array(result, warnings, name, source);
    if (tableInventory.ok && (!tableInventory.value || !Array.isArray(tableInventory.value.cells))) {
      warnings.push({ code: "InvalidObservation", message: "tableBorderSources", source });
      tableInventory.ok = false;
    }
    const sitesResult = get("pictureSites"), ownersResult = get("pictureOwners");
    const owners = unique(array(ownersResult, warnings, "pictureOwners", source), (row) => row.pictureNode, warnings, "picture owner");
    const sites = array(sitesResult, warnings, "pictureSites", source).slice();
    const inventoryPictures = new Set(sites.filter((row) => uint3(row?.pictureNode)).map((row) => row.pictureNode));
    const seenPictures = new Set(sites.map((row) => row.pictureNode));
    for (const owner of owners.values())
      if (owner && !seenPictures.has(owner.pictureNode)) {
        sites.push({ pictureNode: owner.pictureNode, paragraph: owner.owner?.paragraph ?? null });
        seenPictures.add(owner.pictureNode);
      }
    const pictures = sites.map((row) => {
      const owner = owners.get(row.pictureNode), proof = owner?.owner;
      const parentParagraph = proof && row.paragraph === proof.paragraph ? proof.paragraph : null;
      return {
        inventorySiteKnown: inventoryPictures.has(row.pictureNode),
        pictureNode: row.pictureNode,
        parentParagraph,
        sourceInfo: { section, pictureNode: row.pictureNode },
        width: null,
        height: null,
        reason: uint3(parentParagraph) ? null : owner?.error ?? "PictureOwnerUnverified"
      };
    });
    const objects = new Map;
    let objectsKnown = true;
    const addObject = (row) => {
      if (!uint3(row.node)) {
        objectsKnown = false;
        return;
      }
      const previous = objects.get(row.node);
      if (previous && previous.kind !== row.kind)
        throw new Error("ConflictingObjectKind");
      if (!previous)
        objects.set(row.node, { ...row, node: row.node, siteKnown: true });
    };
    const inventory = (method) => {
      const result = get(method);
      const rows = array(result, warnings, method, source);
      objectsKnown &&= result.ok;
      return rows;
    };
    for (const row of inventory("chartSites"))
      addObject({
        kind: "chart",
        node: row?.wrapper,
        parentParagraph: row?.error_name === null && uint3(row?.paragraph) && uint3(row?.anchorUnit) ? row.paragraph : null,
        detailUnavailable: row?.error_name !== null,
        reason: row?.error_name ?? "ObjectDetailsDeferred"
      });
    for (const row of inventory("equationSites"))
      addObject({
        kind: "equation",
        node: row?.source?.node,
        parentParagraph: row?.source?.issue === null && row?.error_name === null && uint3(row?.paragraph) ? row.paragraph : null,
        detailUnavailable: row?.source?.issue !== null || row?.error_name !== null,
        reason: row?.source?.issue ?? row?.error_name ?? "ObjectDetailsDeferred"
      });
    for (const row of inventory("oleSites"))
      addObject({
        kind: "ole",
        node: row?.ole_node,
        parentParagraph: row?.error_name === null && uint3(row?.paragraph) ? row.paragraph : null,
        detailUnavailable: row?.error_name !== null,
        reason: row?.error_name ?? "ObjectDetailsDeferred"
      });
    for (const method of ["rectangleNodes", "lineNodes", "connectorNodes"])
      for (const node of inventory(method))
        addObject({
          kind: "drawing",
          node,
          parentParagraph: null,
          subtype: method,
          reason: "ObjectOwnerUnverified"
        });
    for (const row of inventory("ellipseSources"))
      addObject({
        kind: "drawing",
        node: row?.node,
        parentParagraph: uint3(row?.owner?.paragraph) ? row.owner.paragraph : null,
        subtype: "ellipse",
        reason: "ObjectDetailsDeferred"
      });
    for (const row of inventory("drawingTextBindings"))
      addObject({
        kind: "drawing",
        node: row?.drawingNode,
        parentParagraph: null,
        subtype: "text-bearing",
        reason: "ObjectOwnerUnverified"
      });
    sections.push({
      section,
      paragraphs,
      paragraphTotal: snapshot.ok && observedRows.length === rows.length ? rows.length : null,
      flowsKnown: flowResult.ok,
      bindings,
      placements,
      tableInventory,
      cellInventory: null,
      areas,
      pictures,
      picturesKnown: sitesResult.ok && ownersResult.ok,
      objects: [...objects.values()],
      objectsKnown,
      objectInventoryScope: "hwpx-chart-equation-ole-and-supported-drawing-sites",
      format: "hwpx"
    });
  }
  return { sections, warnings };
}

// packages/document/src/object-reference.ts
var KINDS = new Set(["image", "table", "chart", "equation", "drawing", "ole", "unknown"]);
var SHA = /^[a-f0-9]{64}$/u;
var REFERENCE = /^hwpjs-object:([a-f0-9]{64})\/(hwp5|hwpx)\/s(0|[1-9]\d*)\/(image|table|chart|equation|drawing|ole|unknown)\/(0|[1-9]\d*)$/u;
var object3 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var uint4 = (value) => typeof value === "number" && Number.isSafeInteger(value) && !Object.is(value, -0) && value >= 0 && value <= 4294967295;
var format = (value) => value === "hwp5" || value === "hwpx";
var identity2 = (value) => object3(value) && format(value.format) && uint4(value.section) && uint4(value.node);
function buildObjectReference(value) {
  if (!object3(value))
    throw new TypeError("InvalidObjectReferenceFields");
  const { sourceSha256, format: documentFormat, section, kind, node } = value;
  if (!identity2({ format: documentFormat, section, node }) || typeof sourceSha256 !== "string" || sourceSha256.length !== 64 || !SHA.test(sourceSha256) || typeof kind !== "string" || !KINDS.has(kind))
    throw new TypeError("InvalidObjectReferenceFields");
  return `hwpjs-object:${sourceSha256}/${documentFormat}/s${section}/${kind}/${node}`;
}
function parseObjectReference(reference, expected = {}) {
  if (typeof reference !== "string" || reference.length > 128 || !object3(expected))
    throw new TypeError("InvalidObjectReference");
  const { sourceSha256: expectedSha256, format: expectedFormat } = expected;
  if (expectedSha256 !== undefined && (typeof expectedSha256 !== "string" || expectedSha256.length !== 64 || !SHA.test(expectedSha256)) || expectedFormat !== undefined && !format(expectedFormat))
    throw new TypeError("InvalidObjectReferenceExpectation");
  const match = REFERENCE.exec(reference);
  if (!match || match[0] !== reference)
    throw new TypeError("InvalidObjectReference");
  const result = {
    sourceSha256: match[1],
    format: match[2],
    section: Number(match[3]),
    kind: match[4],
    node: Number(match[5])
  };
  if (!uint4(result.section) || !uint4(result.node))
    throw new TypeError("InvalidObjectReference");
  if (expectedSha256 !== undefined && expectedSha256 !== result.sourceSha256)
    throw new Error("StaleObjectReference");
  if (expectedFormat !== undefined && expectedFormat !== result.format)
    throw new Error("ObjectReferenceFormatMismatch");
  return result;
}
function canonicalImageId(value) {
  if (!object3(value))
    throw new TypeError("InvalidImageIdentity");
  const { format: documentFormat, section, node } = value;
  if (!identity2({ format: documentFormat, section, node }))
    throw new TypeError("InvalidImageIdentity");
  return `${documentFormat}:s${section}:i${node}`;
}

// packages/document/src/model/project.ts
var isPageArea = (value) => value === "header" || value === "footer";
var isApply = (value) => value === "both" || value === "odd" || value === "even";
var cellKey = (s, t, l) => `s${s}:t${t}:c${l}`;
var paragraphId = (s, p) => `s${s}:p${p}`;
var list = (result) => result?.ok && Array.isArray(result.value) ? result.value : [];
var known = (result) => result?.ok === true;
function project({
  format,
  sourceSha256,
  observations
}, limits = LIMITS) {
  const warnings = observations.warnings.map((w) => ({
    ...w,
    ...w.source ? { source: { ...w.source } } : {}
  }));
  const model = {
    version: 1,
    format,
    sourceSha256,
    coordinates: {
      sectionBase: 0,
      paragraphBase: format === "hwp5" ? 0 : 1,
      paragraphScope: format === "hwp5" ? "section" : "document",
      textUnit: "native-utf16"
    },
    sections: [],
    unplaced: [],
    warnings,
    coverage: {
      paragraphTotal: 0,
      observedParagraphs: 0,
      placed: 0,
      unplaced: 0,
      unknownBlocks: 0,
      unreadableSections: 0,
      pageAreasKnown: true,
      imagesKnown: true,
      pageAreaInheritanceKnown: false,
      tablesWithCompleteCellInventory: 0,
      inventoryComplete: true,
      objectsKnown: true,
      objectInventoryComplete: false,
      objectInventoryScope: "supported-native-inventories-only",
      objectTotal: 0,
      objectsPlaced: 0,
      objectsUnplaced: 0
    }
  };
  const nodes = new Map, children = new Map, paragraphs = new Map;
  let blockCount = 0, textUnits = 0;
  const warn = (code, message, source) => warnings.push(diagnostic(code, message, source));
  const add = (node) => {
    if (nodes.has(node.id))
      throw new Error("DuplicateModelIdentity");
    if (++blockCount > limits.maxBlocks)
      throw new RangeError("ModelBlockLimitExceeded");
    nodes.set(node.id, node);
    return node;
  };
  const unknown = (id, kind, code, source) => ({
    id,
    type: "unknown",
    kind,
    diagnostic: diagnostic(code, code, source),
    ...source ? { source: { ...source } } : {},
    editability: "unknown"
  });
  const collection = () => ({
    declarations: "known",
    definitions: [],
    inheritance: { state: "unresolved" }
  });
  for (const observation of observations.sections) {
    let definition = function(kind, owner, listNode, apply, declaredParagraphs, declaration) {
      if (!uint3(owner) || !uint3(listNode))
        throw new Error("InvalidPageAreaIdentity");
      const key = `${owner}:${listNode}`;
      const existing = defs.get(key);
      if (existing) {
        if (existing.block.kind !== kind || existing.block.apply !== apply)
          throw new Error("AmbiguousPageAreaDefinition");
        return existing;
      }
      const block = {
        id: `s${s}:${kind}:n${owner}:l${listNode}`,
        kind,
        source: { section: s, ownerNode: owner, listNode, ...declaration ? declaration : {} },
        apply,
        range: { state: "unresolved" },
        blocks: [],
        observedParagraphs: 0,
        ...uint3(declaredParagraphs) ? { declaredParagraphs } : {}
      };
      section[kind].definitions.push(block);
      const node = add({ id: block.id, root: true, target: block.blocks, block, kind: "area" });
      defs.set(key, node);
      return node;
    }, table = function(tableNode, rows = null, columns = null) {
      if (!uint3(tableNode))
        throw new Error("InvalidTableIdentity");
      const previous = byTable.get(tableNode);
      if (previous)
        return previous;
      const block = {
        id: `s${s}:t${tableNode}`,
        type: "table",
        reference: buildObjectReference({
          sourceSha256,
          format,
          section: s,
          kind: "table",
          node: tableNode
        }),
        source: { section: s, tableNode },
        rows: uint3(rows) ? rows : null,
        columns: uint3(columns) ? columns : null,
        cells: []
      };
      const node = add({
        id: block.id,
        kind: "table",
        block,
        parent: null,
        reason: "TableOwnerUnverified",
        native: tableNode
      });
      byTable.set(tableNode, node);
      model.coverage.objectTotal++;
      return node;
    }, cell = function(tableNode, listNode, cellNode) {
      if (!uint3(listNode))
        throw new Error("InvalidCellIdentity");
      const t = table(tableNode), id = cellKey(s, tableNode, listNode);
      const previousOwner = cellOwners.get(listNode);
      if (previousOwner !== undefined && previousOwner !== tableNode)
        throw new Error("ConflictingCellSourceIdentity");
      cellOwners.set(listNode, tableNode);
      if (cells.has(id)) {
        const existing = cells.get(id);
        if (uint3(cellNode)) {
          if (uint3(existing.block.source.cellNode) && existing.block.source.cellNode !== cellNode)
            throw new Error("ConflictingCellSourceIdentity");
          existing.block.source.cellNode = cellNode;
        }
        return existing;
      }
      const block = {
        id,
        source: { section: s, tableNode, listNode, ...uint3(cellNode) ? { cellNode } : {} },
        row: null,
        column: null,
        rowSpan: null,
        columnSpan: null,
        blocks: [],
        geometryKnown: false,
        contentState: "not-observed"
      };
      t.block.cells.push(block);
      const node = add({ id, kind: "cell", block, target: block.blocks, parent: t.id });
      cells.set(id, node);
      return node;
    };
    const s = observation.section, source = { section: s }, section = {
      id: `s${s}`,
      source,
      header: collection(),
      body: [],
      footer: collection()
    };
    model.sections.push(section);
    const body = add({ id: `@s${s}:body`, root: true, target: section.body, kind: "root" });
    const byOrdinal = new Map, defs = new Map, byTable = new Map, cells = new Map, cellOwners = new Map, paragraphSources = new Set;
    const placementMap = unique(list(observation.placements), (r) => r.tableNode, warnings, "table placement");
    const bindings = list(observation.bindings), paragraphBindings = unique(bindings, (r) => r.paragraph, warnings, "paragraph cell binding");
    if (!observation.flowsKnown)
      warn("ParagraphOwnershipUnavailable", "Native paragraph ownership unavailable", source);
    if (observation.paragraphTotal === null) {
      model.coverage.paragraphTotal = null;
      model.coverage.inventoryComplete = false;
      model.coverage.unreadableSections++;
      section.body.push(unknown(`s${s}:unreadable`, "section", "SectionTextUnavailable", source));
      model.coverage.unknownBlocks++;
    } else if (model.coverage.paragraphTotal !== null)
      model.coverage.paragraphTotal += observation.paragraphTotal;
    const structuralReads = [
      observation.bindings,
      observation.placements,
      observation.tableInventory,
      ...format === "hwp5" ? [observation.cellInventory] : []
    ];
    if (structuralReads.some((result) => !result?.ok)) {
      model.coverage.inventoryComplete = false;
      section.body.push(unknown(`s${s}:inventory`, "table-inventory", "TableInventoryUnavailable", source));
      model.coverage.unknownBlocks++;
      warn("TableInventoryUnavailable", "Table ownership or cell inventory unavailable", source);
    }
    if (!observation.flowsKnown || !observation.areas?.ok || !observation.picturesKnown)
      model.coverage.inventoryComplete = false;
    if (!known(observation.areas)) {
      section.header.declarations = section.footer.declarations = "unavailable";
      model.coverage.pageAreasKnown = false;
    } else if (format === "hwp5") {
      for (const area of list(observation.areas)) {
        if (!isPageArea(area.kind) || !uint3(area.owner_node) || !uint3(area.list_node))
          throw new Error("InvalidPageAreaObservation");
        const apply = uint3(area.control_attributes) ? ["both", "even", "odd"][area.control_attributes & 3] ?? null : null;
        definition(area.kind, area.owner_node, area.list_node, apply, area.paragraph_count);
      }
    } else {
      const declarations = unique(list(observation.areas), (d) => d.sourceElement, warnings, "page area declaration");
      const represented = new Set;
      for (const p of observation.paragraphs) {
        const flow = p.flow, area = flow?.page_area;
        if (!isPageArea(flow?.host) || !area)
          continue;
        const declaration = declarations.get(area.owner_node);
        if (!declaration) {
          section.header.declarations = section.footer.declarations = "unavailable";
          model.coverage.pageAreasKnown = false;
          warn("PageAreaDeclarationUnverified", "Owner has no unique declaration", source);
          continue;
        }
        represented.add(area.owner_node);
        definition(flow.host, area.owner_node, area.list_node, isApply(area.apply) ? area.apply : null, null, { declarationParagraph: declaration.paragraph, declarationUnit: declaration.unit });
      }
      if (represented.size !== declarations.size) {
        section.header.declarations = section.footer.declarations = "unavailable";
        model.coverage.pageAreasKnown = false;
        warn("UnclassifiedPageAreaDeclaration", "A declaration has no verified header/footer paragraph owner", source);
      }
    }
    if (format === "hwp5") {
      for (const row of list(observation.tableInventory))
        table(row.table_record_node, row.rows, row.columns);
      for (const row of list(observation.cellInventory))
        cell(row.table_record_node, row.list_node);
    } else {
      const inventoryValue = observation.tableInventory.ok ? observation.tableInventory.value : null;
      const inventory = inventoryValue && !Array.isArray(inventoryValue) ? inventoryValue.cells : null;
      if (Array.isArray(inventory))
        for (const row of inventory)
          cell(row.table_node, row.list_node, row.cell_node);
      else
        warn("CellInventoryUnavailable", "Native original-cell inventory unavailable", source);
    }
    for (const binding of bindings) {
      if (!uint3(binding.rows) || !binding.rows || !uint3(binding.columns) || !binding.columns)
        throw new Error("InvalidTableGeometry");
      const t = table(binding.tableNode, binding.rows, binding.columns), c = cell(binding.tableNode, binding.listNode);
      if (t.block.rows === null)
        t.block.rows = binding.rows;
      if (t.block.columns === null)
        t.block.columns = binding.columns;
      if (t.block.rows !== binding.rows || t.block.columns !== binding.columns)
        throw new Error("ConflictingTableGeometry");
      const names = ["row", "column", "rowSpan", "columnSpan"];
      if (!names.every((n) => uint3(binding[n])) || !binding.rowSpan || !binding.columnSpan || binding.row + binding.rowSpan > binding.rows || binding.column + binding.columnSpan > binding.columns)
        throw new Error("InvalidCellGeometry");
      if (c.block.geometryKnown && names.some((n) => c.block[n] !== binding[n]))
        throw new Error("ConflictingCellGeometry");
      for (const n of names)
        c.block[n] = binding[n];
      c.block.geometryKnown = true;
    }
    for (const p of observation.paragraphs) {
      if (!uint3(p.paragraph) || format === "hwpx" && !p.paragraph)
        throw new Error("InvalidNativeParagraphOrdinal");
      const id = paragraphId(s, p.paragraph), pSource = { section: s, paragraph: p.paragraph, ...uint3(p.node) ? { node: p.node } : {} };
      if (paragraphs.has(id))
        throw new Error("DuplicateParagraphIdentity");
      if (p.identityKnown && uint3(p.node)) {
        if (paragraphSources.has(p.node))
          throw new Error("DuplicateParagraphSourceIdentity");
        paragraphSources.add(p.node);
      }
      const displayText = typeof p.displayText === "string" ? p.displayText : null;
      if (displayText !== null && !displayText.isWellFormed())
        throw new Error("InvalidDocumentText");
      textUnits += displayText?.length ?? 0;
      if (textUnits > limits.maxTextUnits)
        throw new RangeError("ModelTextLimitExceeded");
      const block = {
        id,
        type: "paragraph",
        displayText,
        source: pSource,
        editability: p.identityKnown ? "range-check-required" : "unknown",
        ...p.identityKnown ? {} : { reason: "SourceIdentityUnverified" }
      };
      if (displayText === null) {
        warn("DisplayTextUnavailable", "Known display text unavailable", pSource);
        model.coverage.unknownBlocks++;
      }
      const node = add({
        id,
        kind: "paragraph",
        block,
        parent: null,
        reason: "ParagraphOwnerUnverified",
        native: p.node
      });
      paragraphs.set(id, node);
      byOrdinal.set(p.paragraph, node);
      model.coverage.observedParagraphs++;
      if (!p.identityKnown)
        continue;
      const binding = paragraphBindings.get(p.paragraph);
      if (binding) {
        const c = cells.get(cellKey(s, binding.tableNode, binding.listNode));
        if (c) {
          node.parent = c.id;
          c.block.contentState = "observed";
        }
      } else if (paragraphBindings.has(p.paragraph))
        node.reason = "AmbiguousCellOwner";
      else if (p.flow?.host === "body" && p.flow.top_level === true)
        node.parent = body.id;
      else if (isPageArea(p.flow?.host)) {
        const area = format === "hwp5" ? { owner_node: p.flow.parent_node, list_node: p.flow.list_node } : p.flow.page_area;
        const def = area && defs.get(`${area.owner_node}:${area.list_node}`);
        if (def && def.block.kind === p.flow.host) {
          node.parent = def.id;
          def.block.observedParagraphs++;
        } else {
          section[p.flow.host].declarations = "unavailable";
          model.coverage.pageAreasKnown = false;
          node.reason = "PageAreaOwnerUnverified";
        }
      }
    }
    for (const [tableNode, t] of byTable) {
      const placement = placementMap.get(tableNode), host = placement && byOrdinal.get(placement.paragraph);
      if (!host)
        continue;
      if (placement.parentTableNode !== null && placement.parentTableNode !== undefined) {
        if (host.parent !== cellKey(s, placement.parentTableNode, placement.parentListNode)) {
          t.reason = "NestedTableOwnerMismatch";
          continue;
        }
      }
      t.parent = host.id;
      delete t.reason;
    }
    const geometryCount = new Map;
    for (const c of cells.values()) {
      if (!c.block.geometryKnown || c.block.contentState !== "observed") {
        const code = !c.block.geometryKnown ? "CellGeometryUnavailable" : "CellContentNotObserved";
        c.block.blocks.push(unknown(`${c.id}:unknown`, "cell", code, c.block.source));
        model.coverage.unknownBlocks++;
        warn(code, code, c.block.source);
      } else
        geometryCount.set(c.block.source.tableNode, (geometryCount.get(c.block.source.tableNode) ?? 0) + 1);
    }
    for (const [n, t] of byTable)
      if (t.block.cells.length > 0 && geometryCount.get(n) === t.block.cells.length && known(observation.tableInventory) && (format !== "hwp5" || known(observation.cellInventory)))
        model.coverage.tablesWithCompleteCellInventory++;
    for (const def of defs.values())
      if (uint3(def.block.declaredParagraphs) && def.block.observedParagraphs !== def.block.declaredParagraphs)
        warn("PageAreaParagraphCountMismatch", "Native definition count differs from observed direct paragraph owners", def.block.source);
    if (!observation.picturesKnown)
      model.coverage.imagesKnown = false;
    for (const image of observation.pictures) {
      if (!uint3(image.pictureNode))
        throw new Error("InvalidPictureIdentity");
      const id = `s${s}:i${image.pictureNode}`;
      const sourceInfo = {};
      for (const name of [
        "section",
        "pictureNode",
        "recordNode",
        "componentNode",
        "ownerNode",
        "resourceId"
      ])
        if (uint3(image.sourceInfo?.[name]))
          sourceInfo[name] = image.sourceInfo[name];
      const block = {
        id,
        type: "image",
        reference: image.inventorySiteKnown === true ? buildObjectReference({
          sourceSha256,
          format,
          section: s,
          kind: "image",
          node: image.pictureNode
        }) : null,
        imageId: image.inventorySiteKnown === true ? canonicalImageId({ format, section: s, node: image.pictureNode }) : null,
        label: "image",
        alt: null,
        altState: "not-exposed",
        sourceInfo,
        ...uint3(image.width) ? { width: image.width } : {},
        ...uint3(image.height) ? { height: image.height } : {},
        sizeUnit: "hwp-unit"
      };
      add({
        id,
        kind: "image",
        block,
        parent: uint3(image.parentParagraph) && byOrdinal.has(image.parentParagraph) ? paragraphId(s, image.parentParagraph) : null,
        reason: image.reason ?? "PictureOwnerUnverified",
        native: image.pictureNode
      });
      model.coverage.objectTotal++;
    }
    if (observation.objectsKnown !== true) {
      model.coverage.objectsKnown = false;
      model.coverage.inventoryComplete = false;
      warn("ObjectInventoryIncomplete", observation.objectInventoryScope ?? "Native object inventory unavailable", source);
    }
    const objectNodes = new Map;
    for (const object of observation.objects ?? []) {
      const nodeKnown = object.siteKnown === true && uint3(object.node);
      const id = nodeKnown ? `s${s}:o${object.node}` : `s${s}:object:p${object.paragraph}:u${object.anchorUnit}`;
      const objectSource = {
        section: s,
        ...uint3(object.node) ? { node: object.node } : {},
        ...uint3(object.paragraph) ? { paragraph: object.paragraph } : {},
        ...uint3(object.anchorUnit) ? { anchorUnit: object.anchorUnit } : {}
      };
      const block = {
        ...unknown(id, object.kind, object.reason ?? "ObjectDetailsDeferred", objectSource),
        reference: nodeKnown ? buildObjectReference({
          sourceSha256,
          format,
          section: s,
          kind: object.kind,
          node: object.node
        }) : null,
        detailUnavailable: object.detailUnavailable === true,
        ...uint3(object.nativeKind) ? { nativeKind: object.nativeKind } : {},
        ...typeof object.subtype === "string" ? { subtype: object.subtype } : {}
      };
      const node = add({
        id,
        kind: "object",
        block,
        parent: uint3(object.parentParagraph) && byOrdinal.has(object.parentParagraph) ? paragraphId(s, object.parentParagraph) : null,
        reason: object.reason ?? "ObjectOwnerUnverified"
      });
      if (nodeKnown)
        objectNodes.set(object.node, node);
      model.coverage.unknownBlocks++;
      model.coverage.objectTotal++;
    }
    for (const object of observation.objects ?? []) {
      if (!uint3(object.node) || !uint3(object.parentObjectNode))
        continue;
      const node = objectNodes.get(object.node), parent = objectNodes.get(object.parentObjectNode);
      if (node && parent && node.parent === null)
        node.parent = parent.id;
    }
  }
  const resolved = new Map;
  for (const node of nodes.values()) {
    if (resolved.has(node.id))
      continue;
    const path = [], active = new Set;
    let cursor = node;
    let result;
    while (cursor && !resolved.has(cursor.id) && !active.has(cursor.id)) {
      if (cursor.root) {
        result = { placed: true, depth: 0 };
        break;
      }
      active.add(cursor.id);
      path.push(cursor);
      cursor = cursor.parent ? nodes.get(cursor.parent) : null;
    }
    result ??= cursor && resolved.get(cursor.id) || {
      placed: false,
      depth: 0,
      reason: cursor ? "CyclicOwner" : "MissingOwner"
    };
    for (let i = path.length - 1;i >= 0; i--) {
      result = { placed: result.placed, depth: result.depth + 1, reason: result.reason };
      if (result.depth > limits.maxDepth)
        result = { ...result, placed: false, reason: "ModelDepthLimitExceeded" };
      resolved.set(path[i].id, result);
    }
    if (node.root)
      resolved.set(node.id, { placed: true, depth: 0 });
  }
  for (const node of nodes.values())
    if (!node.root && node.parent && nodes.has(node.parent)) {
      const bucket = children.get(node.parent) ?? [];
      bucket.push(node);
      children.set(node.parent, bucket);
    }
  const emitted = new Set;
  function emit(first, target, placed) {
    const stack = [{ node: first, target, depth: 0 }];
    while (stack.length) {
      const { node, target: output, depth } = stack.pop();
      if (emitted.has(node.id) || depth > limits.maxDepth)
        continue;
      emitted.add(node.id);
      let next = output;
      if (node.kind === "cell" || node.root)
        next = node.target;
      else
        output.push(node.block);
      if (node.kind === "paragraph")
        model.coverage[placed ? "placed" : "unplaced"]++;
      if (["image", "table", "object"].includes(node.kind))
        model.coverage[placed ? "objectsPlaced" : "objectsUnplaced"]++;
      const descendants = children.get(node.id) ?? [];
      for (let i = descendants.length - 1;i >= 0; i--)
        stack.push({ node: descendants[i], target: next, depth: depth + 1 });
    }
  }
  for (const node of nodes.values())
    if (node.root)
      emit(node, node.target, true);
  for (const node of nodes.values())
    if (!emitted.has(node.id) && node.kind !== "cell") {
      const blocks = [];
      emit(node, blocks, false);
      const code = node.reason ?? resolved.get(node.id)?.reason ?? "UnplacedSource";
      for (const block of blocks)
        model.unplaced.push({
          block,
          diagnostic: diagnostic(code, "Source owner could not be placed safely", block.type === "image" ? block.sourceInfo : block.source)
        });
    }
  if (model.coverage.observedParagraphs !== model.coverage.placed + model.coverage.unplaced)
    throw new Error("ParagraphAccountingMismatch");
  return model;
}

// packages/document/src/document-model.ts
async function readDocumentModel(input = {}) {
  if (input === null || typeof input !== "object")
    throw new TypeError("InvalidDocumentFormat");
  const { format, sourceSha256, sectionCount, sdk } = input;
  if (format !== "hwp5" && format !== "hwpx")
    throw new TypeError("InvalidDocumentFormat");
  if (typeof sourceSha256 !== "string" || !/^[a-f0-9]{64}$/.test(sourceSha256))
    throw new TypeError("InvalidSourceSha256");
  if (typeof sectionCount !== "number" || !Number.isInteger(sectionCount) || sectionCount < 1 || sectionCount > 4096)
    throw new RangeError("SectionLimitExceeded");
  if (!sdk || typeof sdk !== "object")
    throw new TypeError("MissingSdk");
  const context = { sdk, sectionCount };
  const observations = format === "hwp5" ? collectHwp5(context) : collectHwpx(context);
  return project({ format, sourceSha256, observations }, LIMITS);
}

// packages/document/src/document-images.ts
var DOCUMENT_IMAGE_LIMITS = Object.freeze({
  maxImages: 4096,
  maxBytes: 8 * 1024 * 1024,
  maxTotalBytes: 32 * 1024 * 1024
});
var uint5 = (n) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 4294967295;
var digest = (s) => typeof s === "string" && /^[a-f0-9]{64}$/.test(s);
var siteStates = new Set([
  "located",
  "conditional",
  "unsupported_anchor",
  "missing_host",
  "ambiguous_host"
]);
var unsupported = new Set([
  "ExternalLink",
  "ExternalPictureImage",
  "UnsupportedBinDataType",
  "AbsentBinaryResource",
  "MissingPictureImage",
  "UnsupportedPictureDisplayHost",
  "UnsupportedPictureDisplayNode",
  "UnsupportedPictureSwitchHost",
  "UnsupportedPictureAnchor",
  "Hwp5BinaryResourceAbiUnavailable",
  "HwpxPictureBytesAbiUnavailable"
]);

class DocumentImageError extends Error {
  code;
  status;
  reason;
  constructor(code, status = "failed", reason = code) {
    super(code);
    this.name = "DocumentImageError";
    this.code = code;
    this.status = status;
    this.reason = reason;
  }
}
function fail(code) {
  throw new DocumentImageError(code);
}
function identify(bytes) {
  const at = (offset, text) => [...text].every((c, i) => bytes[offset + i] === c.charCodeAt(0));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let type;
  if (bytes.length >= 33 && bytes[0] === 137 && at(1, `PNG\r
\x1A
`) && view.getUint32(8) === 13 && at(12, "IHDR") && view.getUint32(16) > 0 && view.getUint32(20) > 0 && bytes[26] === 0 && bytes[27] === 0 && bytes[28] <= 1 && pngDepths[bytes[25]]?.includes(bytes[24]))
    type = ["image/png", ".png"];
  else if (bytes.length >= 13 && (at(0, "GIF87a") || at(0, "GIF89a")) && view.getUint16(6, true) > 0 && view.getUint16(8, true) > 0)
    type = ["image/gif", ".gif"];
  else if (bytes.length >= 54 && at(0, "BM") && view.getUint32(2, true) === bytes.length && view.getUint32(10, true) >= 54 && view.getUint32(10, true) <= bytes.length && view.getUint32(14, true) >= 40 && view.getUint32(14, true) <= bytes.length - 14 && view.getInt32(18, true) > 0 && view.getInt32(22, true) !== 0 && view.getUint16(26, true) === 1)
    type = ["image/bmp", ".bmp"];
  else if (bytes.length >= 20 && at(0, "RIFF") && at(8, "WEBP") && view.getUint32(4, true) === bytes.length - 8 && ["VP8 ", "VP8L", "VP8X"].some((tag) => at(12, tag)) && view.getUint32(16, true) <= bytes.length - 20)
    type = ["image/webp", ".webp"];
  else if (bytes.length >= 12 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes.at(-2) === 255 && bytes.at(-1) === 217) {
    let offset = 2, markers = 0;
    while (offset + 4 <= bytes.length && markers++ < 4096) {
      if (bytes[offset] !== 255)
        break;
      const marker = bytes[offset + 1], length = view.getUint16(offset + 2);
      if (length < 2 || length > bytes.length - offset - 2)
        break;
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
        if (length >= 8 && view.getUint16(offset + 5) > 0 && view.getUint16(offset + 7) > 0)
          type = ["image/jpeg", ".jpg"];
        break;
      }
      if (marker === 218 || marker === 217)
        break;
      offset += 2 + length;
    }
  }
  return type ? {
    mime: type[0],
    extension: type[1],
    recognized: true,
    validation: "signature-and-header-only"
  } : {
    mime: "application/octet-stream",
    extension: ".bin",
    recognized: false,
    validation: "unrecognized-or-unsupported-header"
  };
}
var pngDepths = {
  0: [1, 2, 4, 8, 16],
  2: [8, 16],
  3: [1, 2, 4, 8],
  4: [8, 16],
  6: [8, 16]
};
var isRows = (value) => Array.isArray(value);
var record3 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var errorMessage2 = (error) => error !== null && typeof error === "object" && ("message" in error) && typeof error.message === "string" ? error.message : undefined;
var invoke = (sdk, method, args) => {
  const fn = Reflect.get(sdk, method);
  if (typeof fn !== "function")
    throw Error("MissingSdkMethod");
  return Reflect.apply(fn, sdk, args);
};
function createDocumentImages({
  sdk,
  format,
  sourceSha256,
  sectionCount,
  limits = {}
} = {}) {
  if (format !== "hwp5" && format !== "hwpx")
    fail("InvalidDocumentFormat");
  if (!digest(sourceSha256))
    fail("InvalidSourceSha256");
  if (!sdk || typeof sdk !== "object")
    fail("MissingSdk");
  if (typeof sectionCount !== "number" || !Number.isInteger(sectionCount) || sectionCount < 1 || sectionCount > 4096)
    fail("SectionLimitExceeded");
  if (!limits || typeof limits !== "object" || Array.isArray(limits) || Object.keys(limits).some((key) => !Object.hasOwn(DOCUMENT_IMAGE_LIMITS, key)))
    fail("InvalidImageLimits");
  const budget = { ...DOCUMENT_IMAGE_LIMITS, ...limits };
  for (const [key, value] of Object.entries(budget))
    if (!Number.isSafeInteger(value) || value < 1 || value > { maxImages: 4096, maxBytes: 32 * 1024 * 1024, maxTotalBytes: 64 * 1024 * 1024 }[key])
      fail("InvalidImageLimits");
  const rows = new Map, resources = new Map;
  let totalBytes = 0, closed = false, borrowed = sdk;
  const ready = () => {
    if (closed)
      fail("DocumentImagesClosed");
  };
  for (let section = 0;section < sectionCount; section++) {
    let sites;
    const inventoryMethod = format === "hwp5" ? "pictureSources" : "pictureSites";
    if (typeof Reflect.get(sdk, inventoryMethod) !== "function")
      throw new DocumentImageError("ImageInventoryUnavailable", "unsupported", "PictureInventoryApiUnavailable");
    try {
      sites = invoke(sdk, inventoryMethod, format === "hwp5" ? [section, "base73"] : [section]);
    } catch (error) {
      throw new DocumentImageError("ImageInventoryUnavailable", /AbiUnavailable|Unsupported/.test(errorMessage2(error) ?? "") ? "unsupported" : "failed");
    }
    if (!isRows(sites))
      fail("InvalidImageInventory");
    if (sites.length > budget.maxImages - rows.size)
      fail("ImageCountLimitExceeded");
    if (format === "hwp5")
      validateHwp5PictureSources(sites);
    for (const row of sites) {
      if (!record3(row))
        fail("InvalidImageIdentity");
      const node = format === "hwp5" ? row.component_node : row.pictureNode;
      if (!uint5(node))
        fail("InvalidImageIdentity");
      if (format === "hwpx" && (typeof row.state !== "string" || !siteStates.has(row.state) || !(row.paragraph === null || uint5(row.paragraph) && row.paragraph > 0) || !(row.anchorUnit === null || uint5(row.anchorUnit))))
        fail("InvalidImageInventory");
      if (format === "hwp5" && (!uint5(row.picture_node) || !uint5(row.owner_node) || !uint5(row.bin_data_id)))
        fail("InvalidImageInventory");
      const id = canonicalImageId({ format, section, node });
      if (rows.has(id))
        fail("DuplicateImageIdentity");
      const source = format === "hwp5" ? {
        section,
        pictureNode: node,
        recordNode: row.picture_node,
        ownerNode: row.owner_node,
        resourceOrdinal: row.bin_data_id
      } : {
        section,
        pictureNode: node,
        paragraph: row.paragraph,
        anchorUnit: row.anchorUnit
      };
      const resourceKey = format === "hwp5" ? `docinfo:${row.bin_data_id}` : `source:${section}:${node}`;
      const entry = {
        id,
        source,
        resourceKey,
        status: "unread",
        reason: "PayloadNotRead",
        mime: null,
        extension: null,
        recognized: null,
        validation: "not-read",
        byteLength: null
      };
      rows.set(id, entry);
      if (!resources.has(resourceKey))
        resources.set(resourceKey, { refs: [], bytes: null, error: null });
      resources.get(resourceKey).refs.push(entry);
    }
  }
  sdk = null;
  const copy = (entry) => ({ ...entry, source: { ...entry.source } });
  return {
    list() {
      ready();
      return {
        version: 1,
        format,
        sourceSha256,
        images: [...rows.values()].map(copy),
        limits: { ...budget },
        budget: { retainedUniqueBytes: totalBytes, resourceKeys: resources.size },
        coverage: {
          scope: "section-picture-sites",
          sectionCount,
          references: rows.size,
          inventoryComplete: true,
          payloadsRead: [...rows.values()].filter((row) => row.status === "ready").length,
          payloadsFailed: [...rows.values()].filter((row) => row.status === "failed" || row.status === "unsupported").length,
          resourceIdentity: format === "hwp5" ? "docinfo-ordinal" : "picture-source-node",
          masterPagesIncluded: false,
          imageBrushesIncluded: false
        },
        nativePayloadLimitBytes: format === "hwp5" ? budget.maxBytes : 64 * 1024 * 1024,
        jsByteLimitTiming: format === "hwp5" ? "native-decoded-payload-limit" : "after-native-payload-copy"
      };
    },
    read(id, options) {
      ready();
      if (!options || typeof options !== "object" || Array.isArray(options) || Object.keys(options).some((k) => k !== "sourceSha256") || !("sourceSha256" in options) || !digest(options.sourceSha256))
        fail("InvalidSourceSha256");
      if (!options || typeof options !== "object" || !("sourceSha256" in options) || options.sourceSha256 !== sourceSha256)
        fail("SourceSha256Mismatch");
      if (typeof id !== "string" || id.length > 80 || !/^(hwp5|hwpx):s(0|[1-9][0-9]*):i(0|[1-9][0-9]*)$/.test(id))
        fail("InvalidImageId");
      const entry = rows.get(id);
      if (!entry)
        fail("UnknownImageId");
      const resource = resources.get(entry.resourceKey);
      if (!resource)
        fail("UnknownImageResource");
      if (!borrowed)
        fail("DocumentImagesClosed");
      if (!resource.bytes && !resource.error) {
        try {
          const bytesMethod = format === "hwp5" ? "binaryResource" : "pictureBytes";
          if (typeof Reflect.get(borrowed, bytesMethod) !== "function")
            throw new Error(format === "hwp5" ? "Hwp5BinaryResourceAbiUnavailable" : "HwpxPictureBytesAbiUnavailable");
          const result = format === "hwp5" ? invoke(borrowed, "binaryResource", [
            entry.source.resourceOrdinal,
            { maxBytes: budget.maxBytes }
          ]) : invoke(borrowed, "pictureBytes", [entry.source.section, entry.source.pictureNode]);
          if (!(result instanceof Uint8Array))
            fail("InvalidImageBytes");
          if (!result.length)
            fail("EmptyImageBytes");
          if (result.length > budget.maxBytes)
            fail("ImageBytesLimitExceeded");
          if (result.length > budget.maxTotalBytes - totalBytes)
            fail("ImageTotalBytesLimitExceeded");
          const bytes = Uint8Array.from(result), metadata = identify(bytes);
          resource.bytes = bytes;
          totalBytes += bytes.length;
          for (const ref of resource.refs)
            Object.assign(ref, metadata, {
              status: "ready",
              reason: metadata.recognized ? null : "UnrecognizedOrUnsupportedImageHeader",
              byteLength: bytes.length
            });
        } catch (error) {
          const code = error instanceof DocumentImageError ? error.code : unsupported.has(errorMessage2(error) ?? "") ? errorMessage2(error) : errorMessage2(error) === "LimitExceeded" ? "ImageBytesLimitExceeded" : "NativeImageReadFailed";
          const status = unsupported.has(code) ? "unsupported" : "failed";
          resource.error = { code, status };
          for (const ref of resource.refs)
            Object.assign(ref, { status, reason: code });
        }
      }
      if (resource.error)
        throw new DocumentImageError(resource.error.code, resource.error.status);
      if (!resource.bytes)
        fail("InvalidImageBytes");
      return { ...copy(entry), sourceSha256, bytes: Uint8Array.from(resource.bytes) };
    },
    close() {
      closed = true;
      borrowed = null;
      resources.clear();
      rows.clear();
      totalBytes = 0;
    }
  };
}

// packages/document/src/render-content.ts
function simpleCells(table, allowNested = false) {
  const { rows, columns, cells } = table;
  if (!rows || !columns)
    return null;
  const slots = rows * columns;
  if (!Number.isSafeInteger(slots) || slots > 8 * cells.length)
    return null;
  const grid = new Map;
  for (const cell of cells) {
    if (!cell.geometryKnown || cell.contentState !== "observed" || cell.row === null || cell.column === null || cell.row >= rows || cell.column >= columns || cell.rowSpan === null || cell.columnSpan === null || cell.row + cell.rowSpan > rows || cell.column + cell.columnSpan > columns || (cell.rowSpan !== 1 || cell.columnSpan !== 1) && slots > 4096 || !allowNested && cell.blocks.some((block) => block.type !== "paragraph" && block.type !== "image"))
      return null;
    for (let row = cell.row;row < cell.row + cell.rowSpan; row++) {
      for (let column = cell.column;column < cell.column + cell.columnSpan; column++) {
        const key = row * columns + column;
        if (grid.has(key))
          return null;
        grid.set(key, row === cell.row && column === cell.column ? cell : null);
      }
    }
  }
  return grid.size === slots ? { grid, rows, columns } : null;
}

// packages/document/src/render-escape.ts
var CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069\ud800-\udfff]/gu;
var MARKDOWN = /[\\`*_{}[\]()#+.!|<>~-]/gu;
var FORMATS = ["text", "markdown"];
var CONTENT_MARKDOWN = /[\\`*_[\]<>|~]/gu;
function createDisplayEscaper(options) {
  if (options === null || typeof options !== "object" || Array.isArray(options) || !("format" in options) || !FORMATS.includes(options.format))
    throw new TypeError("InvalidRenderFormat");
  const record = options;
  const view = record.view === undefined ? "content" : record.view;
  if (view !== "content" && view !== "structure")
    throw new TypeError("InvalidRenderView");
  const markdown = options.format === "markdown";
  return (text) => {
    if (typeof text !== "string")
      throw new TypeError("InvalidRenderString");
    const display = text.replace(CONTROL, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
    if (!markdown)
      return display;
    if (view === "structure")
      return display.replace(MARKDOWN, "\\$&");
    return display.replace(/&/gu, "&amp;").replace(CONTENT_MARKDOWN, "\\$&").replace(/^ {4}/u, "&#32;   ").replace(/^( {0,3})(#{1,6}(?=\s|$)|[-+](?=\s|$)|\d{1,9}[.)](?=\s|$)|-{3,}(?=\s|$))/u, (_, indent, token) => indent + token.replace(/[#+.\-)]/gu, "\\$&"));
  };
}

// packages/document/src/render.ts
var member = (values, value) => values.includes(value);
var LIMITS2 = Object.freeze({
  maxDepth: 32,
  maxNodes: 200000,
  maxTextUnits: 4 * 1024 * 1024,
  maxOutputUnits: 32 * 1024 * 1024
});
var own = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
function optionsFor(options) {
  if (!own(options) || !member(["text", "markdown"], options.format))
    throw new TypeError("InvalidRenderFormat");
  if (options.view !== undefined && !member(["content", "structure"], options.view))
    throw new TypeError("InvalidRenderView");
  const limits = { ...LIMITS2 };
  for (const key of Object.keys(LIMITS2)) {
    const value = options[key] ?? LIMITS2[key];
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > LIMITS2[key])
      throw new RangeError("InvalidRenderLimit:" + key);
    limits[key] = value;
  }
  return limits;
}
function validate(model, limits) {
  const references = new Map;
  const referenceIds = new Set;
  let nodes = 0, units = 0;
  const seen = new Set;
  const ids = new Set;
  const stack = [];
  function string(value) {
    if (typeof value !== "string")
      throw new TypeError("InvalidRenderString");
    units += value.length;
    if (units > limits.maxTextUnits)
      throw new RangeError("RenderTextLimitExceeded");
  }
  const integer = (value, nullable = false, min = 0) => {
    if (nullable && value === null)
      return;
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > 4294967295)
      throw new TypeError("InvalidRenderCoordinate");
  };
  function object(value) {
    if (!own(value))
      throw new TypeError("InvalidRenderObject");
  }
  const id = (value) => {
    string(value);
    if (!value || ids.has(value))
      throw new TypeError("DuplicateOrEmptyRenderId");
    ids.add(value);
  };
  const enqueue = (type, value, depth) => {
    if (++nodes > limits.maxNodes)
      throw new RangeError("RenderNodeLimitExceeded");
    if (depth > limits.maxDepth)
      throw new RangeError("RenderDepthLimitExceeded");
    object(value);
    if (seen.has(value))
      throw new TypeError("RepeatedRenderNodeOrCycle");
    seen.add(value);
    stack.push({ type, value, depth });
  };
  const array = (value, type, depth) => {
    if (!Array.isArray(value))
      throw new TypeError("InvalidRenderArray");
    if (value.length > limits.maxNodes - nodes)
      throw new RangeError("RenderNodeLimitExceeded");
    for (let i = value.length - 1;i >= 0; i--)
      enqueue(type, value[i], depth);
  };
  const diagnostic = (value) => {
    object(value);
    string(value.code);
    string(value.message);
  };
  object(model);
  if (model.version !== 1 || !member(["hwp5", "hwpx"], model.format))
    throw new TypeError("InvalidDocumentViewVersionOrFormat");
  array(model.sections, "section", 0);
  array(model.unplaced, "unplaced", 0);
  if (!Array.isArray(model.warnings))
    throw new TypeError("InvalidRenderWarnings");
  if (model.warnings.length > limits.maxNodes - nodes)
    throw new RangeError("RenderNodeLimitExceeded");
  nodes += model.warnings.length;
  for (const warning of model.warnings)
    diagnostic(warning);
  object(model.coverage);
  if (typeof model.coverage.inventoryComplete !== "boolean")
    throw new TypeError("InvalidRenderCoverage");
  while (stack.length) {
    const { type, value: v, depth } = stack.pop();
    if (type === "section") {
      id(v.id);
      object(v.source);
      integer(v.source.section);
      enqueue("area", v.header, depth);
      array(v.body, "block", depth);
      enqueue("area", v.footer, depth);
    } else if (type === "area") {
      if (!member(["known", "unavailable"], v.declarations))
        throw new TypeError("InvalidPageAreaDeclarations");
      object(v.inheritance);
      if (!member(["observed", "unresolved", "not-applicable"], v.inheritance.state))
        throw new TypeError("InvalidPageAreaInheritance");
      if (v.inheritance.fromSection !== undefined)
        integer(v.inheritance.fromSection);
      if (v.inheritance.definitionId !== undefined)
        string(v.inheritance.definitionId);
      array(v.definitions, "definition", depth);
    } else if (type === "definition") {
      id(v.id);
      if (!member(["header", "footer"], v.kind) || !member([null, "both", "odd", "even"], v.apply))
        throw new TypeError("InvalidPageAreaDefinition");
      object(v.range);
      if (!member(["observed", "unresolved"], v.range.state))
        throw new TypeError("InvalidPageAreaRange");
      for (const key of ["from", "to"])
        if (v.range[key] !== undefined)
          integer(v.range[key]);
      array(v.blocks, "block", depth);
    } else if (type === "unplaced") {
      diagnostic(v.diagnostic);
      enqueue("block", v.block, depth);
    } else if (type === "cell") {
      id(v.id);
      for (const key of ["row", "column"])
        integer(v[key], true);
      for (const key of ["rowSpan", "columnSpan"])
        integer(v[key], true, 1);
      if (typeof v.geometryKnown !== "boolean")
        throw new TypeError("InvalidCellGeometryState");
      string(v.contentState);
      array(v.blocks, "block", depth + 1);
    } else if (type === "block") {
      id(v.id);
      const referenceText = v.reference;
      if (referenceText !== undefined && referenceText !== null) {
        string(referenceText);
        if (typeof model.sourceSha256 !== "string")
          throw new TypeError("InvalidDocumentReferenceSource");
        const reference = parseObjectReference(referenceText, {
          sourceSha256: model.sourceSha256,
          format: model.format
        });
        const kind = v.type === "unknown" ? member(["chart", "equation", "drawing", "ole"], v.kind) ? v.kind : "unknown" : v.type;
        if (reference.kind !== kind || v.type === "paragraph")
          throw new TypeError("ObjectReferenceKindMismatch");
        if (referenceIds.has(referenceText))
          throw new TypeError("DuplicateObjectReference");
        const source = v.type === "image" ? v.sourceInfo : v.source;
        if (!own(source) || source.section !== reference.section)
          throw new TypeError("ObjectReferenceSourceMismatch");
        const node = v.type === "image" ? source?.pictureNode : v.type === "table" ? source?.tableNode : source?.node;
        if (node !== reference.node)
          throw new TypeError("ObjectReferenceSourceMismatch");
        referenceIds.add(referenceText);
        references.set(v, { ...reference, text: referenceText });
      }
      if (v.type === "paragraph") {
        if (!Object.hasOwn(v, "displayText") || v.displayText !== null && typeof v.displayText !== "string")
          throw new TypeError("InvalidDocumentViewDisplayText");
        if (v.displayText !== null)
          string(v.displayText);
        if (v.reason !== undefined)
          string(v.reason);
        object(v.source);
        integer(v.source.section);
        integer(v.source.paragraph, false, model.format === "hwpx" ? 1 : 0);
        if (!member(["range-check-required", "read-only", "unknown"], v.editability))
          throw new TypeError("InvalidParagraphEditability");
      } else if (v.type === "table") {
        integer(v.rows, true);
        integer(v.columns, true);
        array(v.cells, "cell", depth + 1);
      } else if (v.type === "image") {
        if (!member(["provided", "not-provided", "not-exposed"], v.altState))
          throw new TypeError("InvalidImageAltState");
        if (v.alt !== null)
          string(v.alt);
        if (v.altState === "provided" && v.alt === null)
          throw new TypeError("MissingProvidedImageAlt");
        object(v.sourceInfo);
        for (const key of [
          "section",
          "pictureNode",
          "recordNode",
          "componentNode",
          "ownerNode",
          "resourceId"
        ])
          if (v.sourceInfo[key] !== undefined && v.sourceInfo[key] !== null)
            integer(v.sourceInfo[key]);
        for (const key of ["width", "height"])
          if (v[key] !== undefined && v[key] !== null && (typeof v[key] !== "number" || !Number.isFinite(v[key]) || v[key] < 0))
            throw new TypeError("InvalidImageSize");
        if (v.sizeUnit !== undefined)
          string(v.sizeUnit);
      } else if (v.type === "unknown") {
        string(v.kind);
        diagnostic(v.diagnostic);
      } else
        throw new TypeError("UnsupportedRenderBlockType");
    }
  }
  return references;
}
function prepareDocumentRender(input, rawOptions) {
  const limits = optionsFor(rawOptions);
  const references = validate(input, limits);
  return { model: input, limits, references };
}

// packages/document/src/html-escape.ts
var display = createDisplayEscaper({ format: "text", view: "content" });
var entities = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
function escapeHTMLText(value, maxOutputUnits) {
  if (typeof value !== "string")
    throw new TypeError("InvalidRenderString");
  if (!Number.isSafeInteger(maxOutputUnits) || maxOutputUnits < 0)
    throw new RangeError("InvalidHtmlEscapeLimit");
  const chunks = [];
  let units = 0;
  for (let start = 0;start < value.length; ) {
    let end = Math.min(start + 512, value.length);
    if (end < value.length) {
      const high = value.charCodeAt(end - 1), low = value.charCodeAt(end);
      if (high >= 55296 && high <= 56319 && low >= 56320 && low <= 57343)
        end--;
    }
    const chunk = display(value.slice(start, end)).replace(/[&<>"']/gu, (c) => entities[c]);
    units += chunk.length;
    if (units > maxOutputUnits)
      throw new RangeError("RenderOutputLimitExceeded");
    chunks.push(chunk);
    start = end;
  }
  return chunks.join("");
}

// packages/document/src/render-html.ts
var limitKeys = ["maxDepth", "maxNodes", "maxTextUnits", "maxOutputUnits"];
var imagePrefixes = ["png", "jpeg", "gif", "webp", "bmp"].map((type) => `data:image/${type};base64,`);
var nativeEntries = Map.prototype.entries;
var nativeSize = Object.getOwnPropertyDescriptor(Map.prototype, "size").get;
var names = new Map([
  ["image", "이미지"],
  ["table", "표"],
  ["chart", "차트"],
  ["equation", "수식"],
  ["drawing", "도형"],
  ["ole", "임베디드 개체"]
]);
function optionsFor2(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new TypeError("InvalidHtmlRenderOptions");
  const values = Object.create(null);
  for (const key of Reflect.ownKeys(input)) {
    if (typeof key !== "string" || ![...limitKeys, "title", "fragment", "imageData"].includes(key))
      throw new TypeError("InvalidHtmlRenderOption");
    const property = Object.getOwnPropertyDescriptor(input, key);
    if (!property || !Object.hasOwn(property, "value"))
      throw new TypeError("InvalidHtmlRenderOption");
    values[key] = property.value;
  }
  const title = values.title === undefined ? "문서" : values.title;
  if (typeof title !== "string" || title.length > 1024)
    throw new TypeError("InvalidHtmlTitle");
  if (values.fragment !== undefined && typeof values.fragment !== "boolean")
    throw new TypeError("InvalidHtmlFragmentOption");
  const limits = {};
  for (const key of limitKeys)
    if (values[key] !== undefined) {
      if (typeof values[key] !== "number")
        throw new TypeError("InvalidRenderLimit:" + key);
      limits[key] = values[key];
    }
  return { title, fragment: values.fragment === true, imageData: values.imageData, limits };
}
function base64Digit(code) {
  if (code >= 65 && code <= 90)
    return code - 65;
  if (code >= 97 && code <= 122)
    return code - 71;
  if (code >= 48 && code <= 57)
    return code + 4;
  return code === 43 ? 62 : code === 47 ? 63 : -1;
}
function safeImageURI(value) {
  const prefix = imagePrefixes.find((p) => value.startsWith(p));
  if (!prefix)
    throw new TypeError("UnsupportedHtmlImageDataURI");
  const length = value.length - prefix.length;
  if (length === 0 || length % 4 !== 0)
    throw new TypeError("InvalidHtmlImageBase64");
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  const end = value.length - padding;
  for (let i = prefix.length;i < end; i++)
    if (base64Digit(value.charCodeAt(i)) < 0)
      throw new TypeError("InvalidHtmlImageBase64");
  if (padding === 2 && (base64Digit(value.charCodeAt(end - 1)) & 15) !== 0 || padding === 1 && (base64Digit(value.charCodeAt(end - 1)) & 3) !== 0)
    throw new TypeError("InvalidHtmlImageBase64");
  const head = [];
  let bits = 0, available = 0;
  for (let i = prefix.length;i < end && head.length < 12; i++) {
    bits = bits << 6 | base64Digit(value.charCodeAt(i));
    available += 6;
    if (available >= 8) {
      available -= 8;
      head.push(bits >>> available & 255);
    }
  }
  const ascii = (offset, text) => [...text].every((c, i) => head[offset + i] === c.charCodeAt(0));
  const mime = prefix.slice(11, prefix.indexOf(";"));
  const matches = mime === "png" ? [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => head[i] === n) : mime === "jpeg" ? head[0] === 255 && head[1] === 216 && head[2] === 255 : mime === "gif" ? ascii(0, "GIF87a") || ascii(0, "GIF89a") : mime === "webp" ? ascii(0, "RIFF") && ascii(8, "WEBP") : ascii(0, "BM");
  if (!matches)
    throw new TypeError("HtmlImageMimeSignatureMismatch");
}
function renderDocumentHTML(input, rawOptions = {}) {
  const options = optionsFor2(rawOptions);
  const { model, limits, references } = prepareDocumentRender(input, {
    ...options.limits,
    format: "text",
    view: "content"
  });
  if (options.title.length > limits.maxTextUnits)
    throw new RangeError("RenderTextLimitExceeded");
  const images = new Map;
  if (options.imageData !== undefined) {
    const size = nativeSize.call(options.imageData);
    if (typeof size !== "number" || size > 4096 || size > limits.maxNodes)
      throw new RangeError("HtmlImageLimitExceeded");
    const allowed = new Set([...references.values()].filter((r) => r.kind === "image").map((r) => r.text));
    let units = 0;
    for (const [key, value] of nativeEntries.call(options.imageData)) {
      if (typeof key !== "string" || typeof value !== "string" || !allowed.has(key))
        throw new TypeError("InvalidHtmlImageReference");
      units += key.length + value.length;
      if (units > limits.maxOutputUnits)
        throw new RangeError("RenderOutputLimitExceeded");
      safeImageURI(value);
      images.set(key, value);
    }
  }
  const chunks = [];
  let units = 0, ordinal = 0;
  const emit = (value) => {
    units += value.length;
    if (units > limits.maxOutputUnits)
      throw new RangeError("RenderOutputLimitExceeded");
    chunks.push(value);
  };
  const text = (value) => emit(escapeHTMLText(value, limits.maxOutputUnits - units));
  const attr = (name, value) => {
    emit(" " + name + '="');
    text(value);
    emit('"');
  };
  const referenceAttr = (block) => {
    const reference = references.get(block);
    if (reference)
      attr("data-ref", reference.text);
    return reference;
  };
  const notice = (value) => {
    emit('<p class="unobserved">');
    text(value);
    emit("</p>");
  };
  const diagnostic = (code, message) => {
    emit('<p class="diagnostic"><code>');
    text(code);
    emit("</code> ");
    text(message);
    emit("</p>");
  };
  const blocks = (values) => {
    for (const block of values) {
      if (block.type === "paragraph") {
        emit("<p>");
        if (block.displayText === null) {
          text("[문단 내용 미관측]");
          if (block.reason) {
            emit(" ");
            text(block.reason);
          }
        } else
          text(block.displayText);
        emit("</p>");
      } else if (block.type === "table")
        table(block);
      else if (block.type === "image") {
        emit('<figure class="image"');
        const reference = referenceAttr(block);
        attr("data-alt-state", block.altState);
        for (const key of ["width", "height"])
          if (block[key] !== undefined)
            attr("data-" + key, String(block[key]));
        if (block.sizeUnit !== undefined)
          attr("data-size-unit", block.sizeUnit);
        emit(">");
        const image = reference ? images.get(reference.text) : undefined;
        if (image) {
          emit("<img");
          attr("src", image);
          attr("alt", block.altState === "provided" ? block.alt : "");
          emit(">");
        }
        emit('<figcaption data-caption-origin="generated-label">');
        text("이미지 " + ++ordinal);
        if (block.altState === "provided" && block.alt !== "") {
          emit(" — ");
          text(block.alt);
        }
        emit("</figcaption>");
        if (!image)
          notice(reference ? "이미지 바이트가 포함되지 않았습니다." : "이미지 추출 참조 미관측");
        if (block.altState !== "provided")
          notice(block.altState === "not-provided" ? "대체 텍스트 없음" : "대체 텍스트 미관측");
        emit("</figure>");
      } else {
        emit('<figure class="object-unavailable"');
        referenceAttr(block);
        attr("data-kind", block.kind);
        emit('><figcaption data-caption-origin="generated-label">');
        text((names.get(block.kind) ?? "알 수 없는 개체") + " " + ++ordinal);
        emit("</figcaption>");
        notice("본문에 상세 내용이 포함되지 않았습니다.");
        diagnostic(block.diagnostic.code, block.diagnostic.message);
        emit("</figure>");
      }
    }
  };
  const table = (block) => {
    const grid = block.cells.some((c) => (c.rowSpan ?? 0) > 1000 || (c.columnSpan ?? 0) > 1000) ? null : simpleCells(block, true);
    if (!grid) {
      emit('<div class="table-unresolved"');
      referenceAttr(block);
      attr("data-rows", String(block.rows));
      attr("data-columns", String(block.columns));
      emit(">");
      notice("표 구조의 일부를 확인할 수 없어 관측된 셀 내용을 순서대로 표시합니다.");
      for (const cell of block.cells) {
        emit('<div class="cell"');
        attr("data-row", String(cell.row));
        attr("data-column", String(cell.column));
        attr("data-rowspan", String(cell.rowSpan));
        attr("data-colspan", String(cell.columnSpan));
        attr("data-content-state", cell.contentState);
        emit(">");
        if (cell.contentState !== "observed")
          notice("셀 내용 일부 미관측");
        blocks(cell.blocks);
        emit("</div>");
      }
      emit("</div>");
      return;
    }
    emit("<table");
    referenceAttr(block);
    emit('><caption data-caption-origin="generated-label">');
    text("표 " + ++ordinal);
    emit("</caption><tbody>");
    for (let row = 0;row < grid.rows; row++) {
      emit("<tr>");
      for (let column = 0;column < grid.columns; column++) {
        const cell = grid.grid.get(row * grid.columns + column);
        if (!cell)
          continue;
        emit("<td");
        if (cell.rowSpan !== 1)
          attr("rowspan", String(cell.rowSpan));
        if (cell.columnSpan !== 1)
          attr("colspan", String(cell.columnSpan));
        emit(">");
        blocks(cell.blocks);
        emit("</td>");
      }
      emit("</tr>");
    }
    emit("</tbody></table>");
  };
  const area = (value, kind) => {
    emit("<" + kind);
    attr("data-declarations", value.declarations);
    attr("data-inheritance", value.inheritance.state);
    if (value.inheritance.fromSection !== undefined)
      attr("data-inherit-from-section", String(value.inheritance.fromSection));
    if (value.inheritance.definitionId !== undefined)
      attr("data-inherit-definition-id", value.inheritance.definitionId);
    emit(">");
    if (value.declarations === "unavailable")
      notice((kind === "header" ? "머리말" : "꼬리말") + " 정의 미관측");
    if (value.inheritance.state === "unresolved")
      notice((kind === "header" ? "머리말" : "꼬리말") + " 상속 관계 미관측");
    for (const definition of value.definitions) {
      emit('<section class="page-area-definition"');
      attr("data-definition-id", definition.id);
      attr("data-kind", definition.kind);
      attr("data-apply", definition.apply ?? "unknown");
      attr("data-range", definition.range.state);
      if (definition.range.from !== undefined)
        attr("data-from", String(definition.range.from));
      if (definition.range.to !== undefined)
        attr("data-to", String(definition.range.to));
      emit(">");
      blocks(definition.blocks);
      emit("</section>");
    }
    emit("</" + kind + ">");
  };
  if (!options.fragment) {
    emit('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>');
    text(options.title);
    emit("</title><style>p,figcaption,td{white-space:pre-wrap}table{border-collapse:collapse}td{border:1px solid #aaa;padding:.3em;vertical-align:top}figure{margin:1em 0}.unobserved,.diagnostic{color:#555}</style></head><body>");
  }
  emit('<article class="hwpjs-semantic-document">');
  notice("관측된 논리 내용의 HTML입니다. 원본 서식과 쪽 배치는 재현하지 않습니다.");
  if (!model.coverage.inventoryComplete)
    notice("문서 내용의 일부를 확인하지 못했습니다.");
  if (model.coverage.imagesKnown === false)
    notice("이미지 재고 일부 미관측");
  if (model.coverage.pageAreasKnown === false)
    notice("머리말·꼬리말 재고 일부 미관측");
  if (model.coverage.pageAreaInheritanceKnown === false)
    notice("머리말·꼬리말 상속 일부 미관측");
  if (model.coverage.objectInventoryComplete === false)
    notice("개체 재고 일부 미관측");
  for (const section of model.sections) {
    emit('<section class="document-section"');
    attr("data-section", String(section.source.section));
    emit(">");
    area(section.header, "header");
    emit('<div class="body">');
    blocks(section.body);
    emit("</div>");
    area(section.footer, "footer");
    emit("</section>");
  }
  if (model.unplaced.length) {
    emit('<section class="unplaced" aria-label="배치 위치 미관측">');
    notice("다음 내용의 배치 위치는 확인하지 못했습니다.");
    for (const item of model.unplaced) {
      diagnostic(item.diagnostic.code, item.diagnostic.message);
      blocks([item.block]);
    }
    emit("</section>");
  }
  if (model.warnings.length) {
    emit('<aside class="warnings" aria-label="문서 읽기 경고">');
    for (const warning of model.warnings)
      diagnostic(warning.code, warning.message);
    emit("</aside>");
  }
  emit("</article>");
  if (!options.fragment)
    emit("</body></html>");
  return chunks.join("");
}

// packages/document/src/export-html.ts
var object4 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var uint6 = (value) => typeof value === "number" && Number.isInteger(value) && !Object.is(value, -0) && value >= 0 && value <= 4294967295;
var displayWarning = createDisplayEscaper({ format: "text", view: "structure" });
function warningStrings(warnings) {
  let units = 0;
  return warnings.map((value) => {
    const addresses = [];
    if (value.source)
      for (const key of [
        "section",
        "paragraph",
        "node",
        "pictureNode",
        "recordNode",
        "componentNode",
        "ownerNode",
        "tableNode",
        "listNode",
        "cellNode",
        "anchorUnit"
      ]) {
        const property = Object.getOwnPropertyDescriptor(value.source, key);
        if (property && Object.hasOwn(property, "value") && uint6(property.value))
          addresses.push(key + "=" + property.value);
      }
    if (value.code.length + value.message.length > 2048)
      throw new RangeError("HtmlWarningLimitExceeded");
    const text = displayWarning("[" + value.code + "] " + value.message + (addresses.length ? " (" + addresses.join(", ") + ")" : ""));
    units += text.length;
    if (text.length > 2048 || units > 1024 * 1024)
      throw new RangeError("HtmlWarningLimitExceeded");
    return text;
  });
}
function validateNativeScope(model, count, references) {
  const source = (value, expected) => {
    if (value === undefined)
      return;
    if (!object4(value))
      throw new Error("HtmlModelSourceMismatch");
    const section = value.section;
    if (section !== undefined && section !== null && (!uint6(section) || section >= count || expected !== undefined && section !== expected))
      throw new Error("HtmlModelSourceMismatch");
  };
  const stack = [];
  const sections = new Set;
  for (const section of model.sections) {
    source(section.source);
    const at = section.source.section;
    if (sections.has(at))
      throw new Error("HtmlModelSectionMismatch");
    sections.add(at);
    for (const block of section.body)
      stack.push({ block, section: at });
    for (const area of [section.header, section.footer]) {
      if (area.inheritance.fromSection !== undefined && area.inheritance.fromSection >= count)
        throw new Error("HtmlModelSourceMismatch");
      for (const definition of area.definitions) {
        source(definition.source, at);
        for (const block of definition.blocks)
          stack.push({ block, section: at });
      }
    }
  }
  if (model.coverage.inventoryComplete && sections.size !== count)
    throw new Error("HtmlModelSectionMismatch");
  for (const item of model.unplaced) {
    source(item.diagnostic.source);
    stack.push({ block: item.block });
  }
  for (const warning of model.warnings)
    source(warning.source);
  for (const ref of references.values())
    if (ref.section >= count)
      throw new Error("HtmlModelSourceMismatch");
  while (stack.length) {
    const { block, section } = stack.pop();
    source(block.type === "image" ? block.sourceInfo : block.source, section);
    if (block.type === "unknown")
      source(block.diagnostic.source);
    if (block.type === "table")
      for (const cell of block.cells) {
        source(cell.source, section);
        for (const child of cell.blocks)
          stack.push({ block: child, ...section === undefined ? {} : { section } });
      }
  }
}
function capture(value, withBytes) {
  if (!object4(value))
    throw new TypeError("ExplicitWasmRequired");
  const allowed = ["wasm", "embedImages", "title", "fragment", ...withBytes ? ["bytes"] : []];
  const fields = Object.create(null);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !allowed.includes(key))
      throw new TypeError("InvalidHtmlExportField");
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, "value"))
      throw new TypeError("InvalidHtmlExportField");
    fields[key] = descriptor.value;
  }
  if (!Object.hasOwn(fields, "wasm") || fields.wasm === undefined)
    throw new TypeError("ExplicitWasmRequired");
  if (fields.embedImages !== undefined && fields.embedImages !== "supported" && fields.embedImages !== "none")
    throw new TypeError("InvalidHtmlImagePolicy");
  if (fields.title !== undefined && (typeof fields.title !== "string" || fields.title.length > 1024))
    throw new TypeError("InvalidHtmlTitle");
  if (fields.fragment !== undefined && typeof fields.fragment !== "boolean")
    throw new TypeError("InvalidHtmlFragmentOption");
  return fields;
}
var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function base64(bytes) {
  const chunks = [];
  for (let start = 0;start < bytes.length; start += 8190) {
    let chunk = "";
    const end = Math.min(start + 8190, bytes.length);
    for (let at = start;at < end; at += 3) {
      const a = bytes[at], b = at + 1 < bytes.length ? bytes[at + 1] : 0, c = at + 2 < bytes.length ? bytes[at + 2] : 0;
      chunk += ALPHABET[a >>> 2] + ALPHABET[(a & 3) << 4 | b >>> 4] + (at + 1 < bytes.length ? ALPHABET[(b & 15) << 2 | c >>> 6] : "=") + (at + 2 < bytes.length ? ALPHABET[c & 63] : "=");
    }
    chunks.push(chunk);
  }
  return chunks.join("");
}
var warning = (code, message, section, node) => ({
  code,
  message: message.slice(0, 512),
  ...section === undefined ? {} : { source: { section, node } }
});
function byteBudget(text) {
  let bytes = 0;
  for (const character of text) {
    const n = character.codePointAt(0);
    bytes += n <= 127 ? 1 : n <= 2047 ? 2 : n <= 65535 ? 3 : 4;
    if (bytes > HTML_EXPORT_LIMITS.outputBytes)
      throw new RangeError("HtmlOutputByteLimitExceeded");
  }
}
async function exportDocumentHTML(input, dependencies = {}) {
  const fields = capture(input, true);
  const bytes = copyDocumentBytes(fields.bytes, HTML_EXPORT_LIMITS.documentBytes, "Document");
  const wasm = copyDocumentBytes(fields.wasm, HTML_EXPORT_LIMITS.wasmBytes, "Wasm");
  const format = detectDocumentFormat(bytes);
  if (!globalThis.crypto?.subtle)
    throw new Error("WebCryptoUnavailable");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const sourceSha256 = Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, "0")).join("");
  let document, images;
  let result, failed = false, failure;
  try {
    document = await (dependencies.openDocument ?? openReadOnlyDocument)({
      bytes: copyDocumentBytes(bytes, HTML_EXPORT_LIMITS.documentBytes, "Document"),
      wasm: copyDocumentBytes(wasm, HTML_EXPORT_LIMITS.wasmBytes, "Wasm"),
      sourceSha256
    });
    if (document.format !== format || document.sourceSha256 !== sourceSha256 || !Number.isSafeInteger(document.sectionCount) || document.sectionCount < 1 || document.sectionCount > 4096)
      throw new Error("InvalidHtmlReadDocument");
    const model = await (dependencies.readDocumentModel ?? readDocumentModel)({
      format,
      sourceSha256,
      sectionCount: document.sectionCount,
      sdk: document.sdk
    });
    if (model.version !== 1 || model.format !== format || model.sourceSha256 !== sourceSha256)
      throw new Error("InvalidHtmlDocumentModel");
    const { references } = prepareDocumentRender(model, { format: "text", view: "content" });
    validateNativeScope(model, document.sectionCount, references);
    const additions = [];
    const imageData = new Map;
    const refs = [...references.values()].filter((r) => r.kind === "image");
    if (fields.embedImages !== "none" && refs.length) {
      try {
        images = (dependencies.createDocumentImages ?? createDocumentImages)({
          sdk: document.sdk,
          format,
          sourceSha256,
          sectionCount: document.sectionCount,
          limits: {
            maxBytes: HTML_EXPORT_LIMITS.imageBytes,
            maxTotalBytes: HTML_EXPORT_LIMITS.imageTotalBytes
          }
        });
      } catch {
        additions.push(warning("HtmlImageInventoryUnavailable", "이미지 바이트 재고를 확인하지 못해 논리 참조만 남겼습니다."));
      }
      if (images) {
        const listing = images.list();
        if (listing.version !== 1 || listing.format !== format || listing.sourceSha256 !== sourceSha256 || !Array.isArray(listing.images) || listing.images.length > 4096)
          throw new Error("InvalidHtmlImageInventory");
        const members = new Map;
        for (const row of listing.images) {
          if (!object4(row) || !object4(row.source) || !uint6(row.source.section) || row.source.section >= document.sectionCount || !uint6(row.source.pictureNode) || typeof row.id !== "string" || members.has(row.id) || row.id !== canonicalImageId({
            format,
            section: row.source.section,
            node: row.source.pictureNode
          }) || typeof row.resourceKey !== "string" || (format === "hwp5" ? !uint6(row.source.resourceOrdinal) || !uint6(row.source.recordNode) || !uint6(row.source.ownerNode) || row.resourceKey !== `docinfo:${row.source.resourceOrdinal}` : row.resourceKey !== `source:${row.source.section}:${row.source.pictureNode}`))
            throw new Error("InvalidHtmlImageInventory");
          members.set(row.id, row);
        }
        const supported = new Set([
          "image/png",
          "image/jpeg",
          "image/gif",
          "image/webp",
          "image/bmp"
        ]);
        const cache = new Map, unavailable = new Set;
        let imageUnits = 0, exhausted = false;
        for (const ref of refs) {
          const id = canonicalImageId(ref), member = members.get(id);
          if (!member) {
            additions.push(warning("HtmlImageReferenceUnavailable", "이미지 재고에 참조가 없어 바이트를 포함하지 않았습니다.", ref.section, ref.node));
            continue;
          }
          let uri = cache.get(member.resourceKey);
          if (unavailable.has(member.resourceKey)) {
            additions.push(warning("HtmlImageBytesUnavailable", "해당 자원은 이미지 바이트를 포함하지 못해 논리 참조만 남겼습니다.", ref.section, ref.node));
            continue;
          }
          if (!uri && !exhausted) {
            try {
              const value = images.read(id, { sourceSha256 });
              if (!object4(value) || !object4(value.source) || value.id !== id || value.sourceSha256 !== sourceSha256 || value.resourceKey !== member.resourceKey || value.source.section !== ref.section || value.source.pictureNode !== ref.node)
                throw new Error("HtmlImageSourceMismatch");
              if (value.recognized !== true || !value.mime || !supported.has(value.mime)) {
                unavailable.add(member.resourceKey);
                additions.push(warning("HtmlImageFormatUnsupported", "지원되는 raster 형식으로 관측되지 않아 바이트를 포함하지 않았습니다.", ref.section, ref.node));
                continue;
              }
              const raw = copyDocumentBytes(value.bytes, HTML_EXPORT_LIMITS.imageBytes, "Image");
              const prefix = `data:${value.mime};base64,`, length = prefix.length + 4 * Math.ceil(raw.length / 3);
              if (length + imageUnits > HTML_EXPORT_LIMITS.imageDataUnits) {
                unavailable.add(member.resourceKey);
                additions.push(warning("HtmlImageBudgetExceeded", "누적 이미지 출력 예산을 넘어 바이트를 포함하지 않았습니다.", ref.section, ref.node));
                continue;
              }
              uri = prefix + base64(raw);
              cache.set(member.resourceKey, uri);
            } catch (error) {
              if (error instanceof Error && error.message === "HtmlImageSourceMismatch")
                throw error;
              if (error instanceof Error && error.message === "ImageTotalBytesLimitExceeded")
                exhausted = true;
              unavailable.add(member.resourceKey);
              additions.push(warning("HtmlImageBytesUnavailable", "이미지 바이트를 읽지 못해 논리 참조만 남겼습니다.", ref.section, ref.node));
              continue;
            }
          }
          if (!uri || imageUnits + uri.length > HTML_EXPORT_LIMITS.imageDataUnits) {
            additions.push(warning("HtmlImageBudgetExceeded", "누적 이미지 예산으로 바이트를 포함하지 않았습니다.", ref.section, ref.node));
            continue;
          }
          imageUnits += uri.length;
          imageData.set(ref.text, uri);
        }
      }
    }
    const warnings = [...model.warnings, ...additions];
    const publicWarnings = warningStrings(warnings);
    const html = (dependencies.renderDocumentHTML ?? renderDocumentHTML)({ ...model, warnings }, {
      imageData,
      ...fields.title === undefined ? {} : { title: fields.title },
      ...fields.fragment === undefined ? {} : { fragment: fields.fragment }
    });
    if (typeof html !== "string" || !html.isWellFormed())
      throw new Error("InvalidHtmlRenderOutput");
    byteBudget(html);
    result = { format, sourceSha256, html, semanticOnly: true, warnings: publicWarnings };
  } catch (error) {
    failed = true;
    failure = error;
  }
  const cleanup = [];
  for (const resource of [images, document])
    if (resource) {
      try {
        await resource.close();
      } catch (error) {
        cleanup.push(error);
      }
    }
  if (cleanup.length)
    throw new AggregateError(failed ? [failure, ...cleanup] : cleanup, "HtmlExportCleanupFailed");
  if (failed)
    throw failure;
  if (!result)
    throw new Error("MissingHtmlExportResult");
  return result;
}
async function toHtml(bytes, options) {
  const values = capture(options, false);
  return (await exportDocumentHTML({ bytes, ...values })).html;
}
export {
  APPLY_FORMATTING_PATCH_COMMAND,
  BACKGROUND_HATCH_STYLES,
  BORDER_LINE_STYLES,
  BORDER_WIDTHS_HUNDREDTH_MM,
  DEFAULT_KEYMAP,
  EditorState,
  INSERT_TABLE_COMMAND,
  PasswordAttemptError,
  REDO_COMMAND,
  SET_CHARACTER_FONT_NAME_COMMAND,
  SET_CHARACTER_PROPERTIES_COMMAND,
  SET_CHARACTER_STRIKE_COMMAND,
  SET_CHARACTER_TEXT_COLOR_COMMAND,
  SET_CHARACTER_UNDERLINE_COMMAND,
  SET_PARAGRAPH_ALIGNMENT_COMMAND,
  SPLICE_TEXT_COMMAND,
  UNDO_COMMAND,
  compileKeymap,
  createCommand,
  createEditor,
  createParagraphSelection,
  detectDocumentFormat2 as detectDocumentFormat,
  findTextMatch,
  getDocumentTextStatistics,
  getHistoryAvailability,
  getSelectionClipboard,
  getSelectionFormatting,
  mergeKeymap,
  parseKeymapConfig,
  resolveKeyboardShortcut,
  resolveShortcutLabel,
  selectionMatchesText,
  toHtml
};
