// packages/core/src/internal/native-runtime-origin.ts
function allowsOwnerWindowProjection(contract) {
  return contract?.contract === "hwp5-exclusive-text-delta-v1" && (contract.sha256 === "d849a4b22357e62d2425c3f1632edc07f2948ac18ce6d97009aede9d2b6cb1eb" || contract.sha256 === "bd095cdf56892d5b5708a567ca91ae271846a3949bfc41c3a717bdee6513684f" || contract.sha256 === "ede6256ef063765cfb1f4489d2bece3a971aa715041c993fec87d4eb374855fa" || contract.sha256 === "25998a7513b73938abe5e9e614a18733059b42f71f00b13cf663f073c26396b3" || contract.sha256 === "f25c1a4807f428a8a392e8ef0be6dadced309825a6a9704305694969fd9c40bb" || contract.sha256 === "4b7fd814e32a03ea88f6adcd4ef8458be344dfc8a94a698b29e21df0b255d34a" || contract.sha256 === "aa4161ae261a37cff5cfe05ba78d7e9d8ad236c1999ddf5d978ac6b1a60bf122" || contract.sha256 === "c14f11aaa9a278298f469d1dec9bfbdba2e33f1a0433925f2c0b073866e6de02" || contract.sha256 === "82031994b4b7f066c28c725495954eebc67bb25570869c06528ea328e0155ccc");
}
var uint = (n) => Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) < 4294967295;
var epoch = (s) => typeof s === "string" && /^[1-9][0-9]{0,19}$/.test(s) && BigInt(s) <= 0xffffffffffffffffn;
function canonicalRuntimeDescriptors(runtime, request, dispose, prototype) {
  const a = Object.getOwnPropertyDescriptor(runtime, "request"), b = Object.getOwnPropertyDescriptor(runtime, "dispose");
  return Object.getPrototypeOf(runtime) === prototype && !!a && !!b && "value" in a && "value" in b && a.value === request && b.value === dispose;
}
function nativeOrigin(kind, reply, context, sequence, contract, authority) {
  if (!contract || !context || !authority() || reply.error || !uint(reply.historyRevision))
    return;
  const ctx = Object.freeze({ ...context });
  const content = reply.content;
  if (content?.viewKind === "history-owner-window") {
    const p = content, { window: w, reference: r, owner: o } = p;
    if (!allowsOwnerWindowProjection(contract) || !["undo", "redo"].includes(kind) || p.version !== 1 || p.operation !== kind || reply.changed !== true || reply.meta?.application !== "applied" || reply.meta?.changed !== true || !uint(p.beforeRevision) || p.beforeRevision === p.revision || p.revision !== reply.historyRevision || !epoch(p.beforeEpoch) || !epoch(p.epoch) || BigInt(p.epoch) <= BigInt(p.beforeEpoch) || !o || !uint(o.section) || !uint(o.paragraph) || !uint(o.sourceNode) || o.parentNode !== null && !uint(o.parentNode) || !r || r.kind !== "original" || typeof r.scope !== "string" || !r.scope || r.epoch !== p.epoch || r.section !== o.section || r.id !== String(o.sourceNode) || w?.epoch !== p.epoch || w.section !== o.section || w.sourceNode !== o.sourceNode || w.parentNode !== o.parentNode)
      return;
    return Object.freeze({
      kind: "history-window",
      context: ctx,
      sequence,
      referenceScope: r.scope,
      nativeEpoch: p.epoch,
      nativeRevision: p.revision,
      beforeEpoch: p.beforeEpoch,
      beforeRevision: p.beforeRevision,
      owner: Object.freeze({ ...o }),
      historyWindowDelta: content,
      authority
    });
  }
  if (content?.viewKind === "owner-window-patch") {
    const { receipt: r, window: w, reference: ref } = content;
    if (!["splice", "splice-current"].includes(kind) || reply.meta?.application !== "applied" || reply.meta?.changed !== true || r?.exclusive !== true || r.version !== 1 || !epoch(r.beforeEpoch) || !epoch(r.epoch) || BigInt(r.epoch) <= BigInt(r.beforeEpoch) || !uint(r.beforeRevision) || r.revision !== reply.historyRevision || !ref || ref.kind !== "original" || typeof ref.scope !== "string" || ref.epoch !== r.epoch || ref.id !== String(r.sourceNode) || ref.section !== r.section || w?.epoch !== r.epoch || w.sourceNode !== r.sourceNode || w.parentNode !== r.parentNode || w.section !== r.section)
      return;
    const owner = Object.freeze({
      section: r.section,
      paragraph: r.paragraph,
      sourceNode: r.sourceNode,
      parentNode: r.parentNode
    });
    return Object.freeze({
      kind: "exclusive-text",
      context: ctx,
      sequence,
      referenceScope: ref.scope,
      nativeEpoch: r.epoch,
      nativeRevision: r.revision,
      beforeEpoch: r.beforeEpoch,
      beforeRevision: r.beforeRevision,
      owner,
      ownerWindowDelta: content,
      authority
    });
  }
  if (content?.format !== "hwp5" || content.window || content.viewKind || !Array.isArray(content.paragraphs))
    return;
  if (reply.meta?.changed === false && !["load", "enable", "refresh"].includes(kind))
    return;
  const refs = content.paragraphs.map((p) => p.currentReference).filter(Boolean);
  const ref = refs[0];
  if (!ref || !epoch(ref.epoch) || typeof ref.scope !== "string" || !ref.scope || refs.some((r) => r.scope !== ref.scope || r.epoch !== ref.epoch))
    return;
  const packet = reply.nativeTextDelta, r = packet?.receipt, w = packet?.window, b = packet?.before;
  if (packet && ["splice", "splice-current"].includes(kind) && reply.meta?.application === "applied" && reply.meta?.changed === true && r?.version === 1 && r.exclusive === true && epoch(r.beforeEpoch) && epoch(r.epoch) && BigInt(r.epoch) > BigInt(r.beforeEpoch) && uint(r.beforeRevision) && r.revision === reply.historyRevision && w?.epoch === r.epoch && b?.epoch === r.beforeEpoch && w.sourceNode === r.sourceNode && b.sourceNode === r.sourceNode && w.parentNode === r.parentNode && b.parentNode === r.parentNode && packet.reference?.scope === ref.scope && packet.reference?.epoch === r.epoch && packet.reference?.id === String(r.sourceNode)) {
    return Object.freeze({
      kind: "exclusive-text",
      context: ctx,
      sequence,
      referenceScope: ref.scope,
      nativeEpoch: r.epoch,
      nativeRevision: r.revision,
      beforeEpoch: r.beforeEpoch,
      beforeRevision: r.beforeRevision,
      owner: Object.freeze({
        section: r.section,
        paragraph: r.paragraph,
        sourceNode: r.sourceNode,
        parentNode: r.parentNode
      }),
      fullSnapshotDelta: packet,
      authority
    });
  }
  return Object.freeze({
    kind: "full-baseline",
    context: ctx,
    sequence,
    referenceScope: ref.scope,
    nativeEpoch: ref.epoch,
    nativeRevision: reply.historyRevision,
    owner: null,
    authority
  });
}
function sameRequestContext(a, b) {
  return !!b && ["editorId", "documentId", "generation", "requestId", "operationRevision"].every((k) => a[k] === b[k]);
}
var runtimeOrigins = new WeakMap;
function bindNativeRuntimeOrigin(runtime, read) {
  runtimeOrigins.set(runtime, read);
}
function consumeNativeRuntimeOrigin(runtime, reply, context) {
  return runtimeOrigins.get(runtime)?.(reply, context);
}

// packages/core/src/internal/runtime-admission.ts
var ports = new WeakMap;

class RuntimeAdmissionRejected extends Error {
  constructor(error) {
    super(error instanceof Error ? error.message : String(error));
    this.name = "RuntimeAdmissionRejected";
  }
}
function bindRuntimeAdmission(runtime, request, transportValid) {
  const { request: originalRequest, dispose: originalDispose } = runtime;
  let tainted = false;
  const valid = () => {
    if (!canonicalRuntimeDescriptors(runtime, originalRequest, originalDispose, Object.prototype))
      tainted = true;
    return !tainted && transportValid();
  };
  ports.set(runtime, { valid, request });
}
function hasRuntimeAdmission(runtime) {
  try {
    return !!runtime && ports.get(runtime)?.valid() === true;
  } catch {
    return false;
  }
}
function requestAtRuntimeAdmission(runtime, message, context, guard, projection = false) {
  const port = ports.get(runtime);
  const admission = () => {
    try {
      if (!port?.valid())
        throw Error("UnsupportedAtomicRuntime");
      guard();
    } catch (error) {
      throw new RuntimeAdmissionRejected(error);
    }
  };
  admission();
  return port.request(message, context, admission, projection);
}

// js/border-fill-values.mjs
var BORDER_LINE_STYLES2 = Object.freeze([
  "NONE",
  "SOLID",
  "DASH",
  "DOT",
  "DASH_DOT",
  "DASH_DOT_DOT",
  "LONG_DASH",
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
]);
var BORDER_WIDTHS_HUNDREDTH_MM2 = Object.freeze([
  10,
  12,
  15,
  20,
  25,
  30,
  40,
  50,
  60,
  70,
  100,
  150,
  200,
  300,
  400,
  500
]);

// js/paragraph-margin-args.mjs
function paragraphMarginArgs(margins) {
  const names = ["left", "right", "indent", "before", "after"];
  if (!margins || typeof margins !== "object" || Array.isArray(margins) || Object.keys(margins).some((key) => !names.includes(key)))
    throw new TypeError("InvalidParagraphMargins");
  let mask = 0;
  const values = names.map((key, index) => {
    if (!Object.hasOwn(margins, key) || margins[key] === null)
      return 0;
    const value = margins[key];
    if (!Number.isInteger(value) || value < -2147483648 || value > 2147483647)
      throw new RangeError("InvalidParagraphMargins");
    mask |= 1 << index;
    return value;
  });
  return [mask, ...values];
}

// js/hwp5-section-inventory.mjs
var availableSectionExports = Object.freeze([
  "hwp5_text_read_available",
  "hwp5_text_declared_sections",
  "hwp5_text_distribution"
]);
function sectionInventory(declared, available) {
  if (![declared, available].every((value) => Number.isInteger(value) && value >= 1 && value <= 1024))
    throw new Error("InvalidSectionInventory");
  return { declared, available, mismatch: declared !== available };
}
function checkedSectionInventory(value) {
  const result = sectionInventory(value?.declared, value?.available);
  if (value.mismatch !== result.mismatch)
    throw new Error("InvalidSectionInventory");
  return result;
}

// js/hwp5-available-section-copy.mjs
var availableSectionCopyExports = Object.freeze([
  "hwp5_edit_open_available_section_copy",
  "hwp5_edit_available_section_copy_info"
]);
function validateAvailableSectionCopyOption(value, distribution, normalizeObservedCfb) {
  if (typeof value !== "boolean")
    throw new TypeError("Invalid available section copy option");
  if (value && (distribution || normalizeObservedCfb))
    throw new Error("ConflictingAvailableSectionCopyOptions");
}
function decodeAvailableSectionCopyInfo(bytes) {
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (value === null)
    return null;
  const inventory = sectionInventory(value?.declared, value?.available);
  if (!inventory.mismatch)
    throw new Error("InvalidAvailableSectionCopyInfo");
  return {
    normalized: true,
    historyBaseline: "available-sections-copy",
    deviations: null,
    sectionInventory: inventory,
    missingContentRecovered: false
  };
}

// web/preview/hwp5-available-copy-preview.mjs
function availableSectionCopyCapability(module) {
  if (!(module instanceof WebAssembly.Module))
    return false;
  const names = new Set(WebAssembly.Module.exports(module).filter((row) => row.kind === "function").map((row) => row.name));
  return availableSectionCopyExports.every((name) => names.has(name));
}
function availableSectionCopyRequest(message) {
  const value = message.availableSectionCopy === undefined ? false : message.availableSectionCopy;
  validateAvailableSectionCopyOption(value, message.distribution ?? false, message.normalizeObservedCfb ?? false);
  if (value && message.availableSectionsOnly === true)
    throw new Error("ConflictingAvailableSectionCopyOptions");
  if (value && (message.format ?? "hwp5") !== "hwp5")
    throw new Error("UnsupportedAvailableSectionCopyFormat");
  return value;
}

// js/character-underline-args.mjs
function characterUnderlineArg(kind) {
  const values = ["none", "bottom", "center", "top"];
  const value = values.indexOf(kind);
  if (value < 0)
    throw new TypeError("InvalidCharacterUnderlineKind");
  return value;
}

export { allowsOwnerWindowProjection, canonicalRuntimeDescriptors, nativeOrigin, sameRequestContext, bindNativeRuntimeOrigin, consumeNativeRuntimeOrigin, RuntimeAdmissionRejected, bindRuntimeAdmission, hasRuntimeAdmission, requestAtRuntimeAdmission, BORDER_LINE_STYLES2, BORDER_WIDTHS_HUNDREDTH_MM2, paragraphMarginArgs, availableSectionExports, sectionInventory, checkedSectionInventory, validateAvailableSectionCopyOption, decodeAvailableSectionCopyInfo, availableSectionCopyCapability, availableSectionCopyRequest, characterUnderlineArg };
