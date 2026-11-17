import {
  copyTransportDTO,
  NativeBackendUnavailableError2,
  createNativeProvider2
} from "./chunk-f8m5gnh6.js";
import {
  decodeFontFaces,
  retainedTextView,
  sourceTextChange
} from "./chunk-jk4tbr51.js";
import"./chunk-6ffsr0y9.js";
import"./chunk-x8k5ryaa.js";
import {
  attachHwpxPageAreaDeclarations,
  attachHwpxStyles,
  attachTabDefinitions,
  attachSectionTabSources,
  attachHwp5Styles,
  attachHwp5Tables,
  attachHwp5ParagraphFormats,
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
  attachHwp5PageSources,
  attachHwp5Pictures,
  attachHwp5PictureTails
} from "./chunk-w5n0k031.js";
import {
  projectHwp5GroupGeometry,
  projectHwp5PictureGeometry,
  projectHwp5RootContent
} from "./chunk-a94gkc3m.js";
import {
  hitText,
  caretGeometry,
  withTextBoundaries,
  currentTextBoundaryIdentity,
  createRenderer
} from "./chunk-sg8m4ms8.js";
import {
  decodeFontFaceMetadata
} from "./chunk-rmgwrdxt.js";
import {
  decodeTableCaption,
  decodeLineGeometry,
  decodePictureGeometry,
  decodePicturePosition,
  decodePictureFlow,
  decodeLinePlacement,
  decodeLineNodes,
  decodeLineDisplay,
  decodeFillBrushes,
  decodeTableBorderSources,
  decodeSectionTabs,
  decodePictureOwners,
  decodePageAreaDeclarations,
  decodeHwpxFontFaceMetadata,
  decodeHwpxParagraphShapes,
  decodeDrawingTextBindings,
  decodeDrawingTextSnapshots,
  decodeContainerSource,
  decodeRectangleRenderingSource,
  decodeRectangleRenderingSources,
  decodeEllipseSources,
  decodePictureSites,
  decodePictureOwner,
  decodePictureRenderingCorners,
  decodeConnectorNodes,
  decodeConnectorSource,
  decodeConnectorOwner,
  decodeConnectorRenderingSource,
  decodeDrawingStrokeSource,
  decodeParagraphFlow,
  decodePageSettings,
  decodeNoteShapes,
  decodeTablePagination,
  decodeTableGeometry,
  decodeCaptionBindings,
  decodeTableCaptionBindings,
  decodeNoteReferenceSites,
  decodeParagraphTextSnapshot,
  decodeFormulaFieldSources,
  decodeTableCellMargin,
  decodePictureCrop,
  decodePictureTransform
} from "./chunk-mff70c55.js";
import {
  decodeCharacterFontMetrics,
  decodeCharacterEffects,
  decodeCharacterOutlines,
  decodeCharacterShades,
  decodeCharacterUnderlines,
  decodeCharacterStrikes,
  decodeCharacterStrikeStyles,
  decodeCharacterTextColors,
  decodeCharacterFontReferences,
  decodeCharacterUnderlineStyles,
  decodeCharacterShapes,
  decodeCharacterRanges,
  decodeTableBindings,
  decodeTablePlacements
} from "./chunk-gx7k5hbb.js";
import"./chunk-2q1tayv5.js";
import {
  decodeTabSources,
  decodeTabDefinitions
} from "./chunk-wvrkyaca.js";

// packages/react-native/src/canvas/provider.ts
import { SPLICE_TEXT_COMMAND } from "@ohah/hwpjs";

// packages/react-native/src/canvas/history-negotiation.mjs
async function configureNativeHistory(port, token, revision, options) {
  if (port.descriptor.historyProtocol !== "hwpjs.native-history/2")
    return { error: "NativeHistoryV2Unavailable" };
  const json = JSON.stringify(options);
  if (typeof json !== "string")
    return { error: "InvalidHistoryOptions" };
  const bytes = Uint8Array.from(unescape(encodeURIComponent(json)), (c) => c.charCodeAt(0));
  if (bytes.length > 4096)
    return { error: "InvalidHistoryOptions" };
  return port.request({ kind: "history-configure", token, expectedRevision: revision, bytes });
}

// packages/react-native/src/canvas/context-port.ts
function createNativeContextPort(binding) {
  if (!binding)
    throw new NativeBackendUnavailableError2;
  if (binding.contextProtocol !== "hwpjs.native-context/1" || typeof binding.createContextPort !== "function")
    throw Error("NativeContextProtocolMismatch");
  return binding.createContextPort();
}

// packages/react-native/src/canvas/context-transport.ts
var decode = (bytes) => decodeURIComponent(Array.from(bytes, (b) => "%" + b.toString(16).padStart(2, "0")).join(""));
var encode = (text) => Uint8Array.from(unescape(encodeURIComponent(text)), (c) => c.charCodeAt(0));
var failure = (kind, error) => ({
  kind,
  error,
  applied: false,
  meta: { application: "unapplied", changed: false }
});
async function createNativeContextTransport(binding, observe) {
  const raw = createNativeContextPort(binding);
  const note = (event) => {
    try {
      observe?.(event);
    } catch {}
  };
  const tokenInfo = (t) => t ? { slot: t.slot, generation: t.generation } : null;
  const port = {
    descriptor: raw.descriptor,
    async request(packet) {
      note({
        event: "native-request",
        kind: packet.kind,
        token: tokenInfo(packet.token),
        expectedRevision: packet.expectedRevision
      });
      const reply = await raw.request(packet);
      note({
        event: "native-reply",
        kind: reply.kind,
        status: reply.status,
        token: tokenInfo(reply.token ?? packet.token),
        revision: reply.revision,
        outputRevision: reply.outputRevision
      });
      return reply;
    },
    invalidate() {
      note({ event: "native-invalidate" });
      raw.invalidate();
    },
    async dispose() {
      const r = await raw.dispose();
      note({ event: "native-dispose" });
      return r;
    }
  };
  if (port.descriptor.protocol !== "hwpjs.native-context/1" || port.descriptor.abiVersion !== 1 || port.descriptor.projection !== "format-native-wire") {
    await port.dispose();
    throw Error("NativeContextProtocolMismatch");
  }
  if (port.descriptor.snapshotProtocol !== "hwpjs.native-snapshot/2") {
    await port.dispose();
    throw Error("NativeSnapshotUnavailable");
  }
  if (port.descriptor.renderSourcesProtocol !== "hwpjs.native-render-sources/3") {
    await port.dispose();
    throw Error("NativeRenderSourcesUnavailable");
  }
  let token, revision = 0, terminal = false, editingEnabled = false;
  const checked = (reply) => {
    if (reply.revision !== undefined)
      revision = reply.revision;
    return reply;
  };
  function projected(content) {
    const paragraphs = content.paragraphs.map((row) => {
      const retained = content.format === "hwp5" ? retainedTextView(row) : null;
      const complete = Boolean(row.rawPlain || retained);
      return {
        ...row,
        text: retained?.text ?? row.text,
        ...retained ? { sourceOffsets: retained.offsets } : {},
        displayComplete: complete,
        projectionUnavailable: !complete,
        editable: row.editable && complete
      };
    });
    return {
      ...content,
      paragraphs,
      completeness: {
        ...content.window,
        displayComplete: paragraphs.every((p) => p.displayComplete),
        immediateOwnerComplete: paragraphs.every((p) => p.selectionOwner !== null),
        ownershipGraphComplete: false,
        unsupportedWriteOwners: [
          ...new Set(paragraphs.filter((p) => !p.editable).map((p) => p.ownerKind))
        ]
      }
    };
  }
  async function snapshot(kind, mutation, window) {
    const r = checked(await port.request(window ? { kind: "snapshot-window", token, ...window, expectedRevision: revision } : { kind: "snapshot", token }));
    if (r.status !== 0 || !r.bytes)
      return {
        kind,
        error: r.error ?? "NativeSnapshotFailed",
        meta: mutation?.meta ?? { application: "unapplied", changed: false }
      };
    const content = projected(JSON.parse(decode(r.bytes)));
    if (content.protocol !== "hwpjs.native-snapshot/2" || content.projection !== "native-owners-v2" || !["hwp5", "hwpx"].includes(content.format) || !Array.isArray(content.paragraphs) || content.nativeRevision !== revision || !Array.isArray(content.historyRevisions))
      throw Error("NativeInvalidSnapshot");
    const view = editingEnabled ? content : {
      ...content,
      paragraphs: content.paragraphs.map((row) => ({
        ...row,
        editable: false
      }))
    };
    return {
      kind,
      content: view,
      historyRevision: content.historyRevision,
      historyRevisions: content.historyRevisions,
      historyStats: content.historyStats,
      capabilities: {
        nativeCapability: content.capability,
        completeness: content.completeness,
        nativeCanvas: {
          backend: "UIKit/CoreGraphics",
          renderSourcesProtocol: "hwpjs.native-render-sources/3",
          textBoundaryProtocol: "hwpjs.native-text-boundaries/1",
          word: false,
          fullLayout: false,
          android: false
        },
        nativeContext: true,
        projection: "native-owners-v2",
        fullLayout: false,
        canvas: false,
        nativeIme: false
      },
      ...mutation ? { applied: mutation.meta.application === "applied", meta: mutation.meta } : {}
    };
  }
  return {
    async renderSources(expectedRevision) {
      if (terminal || !token)
        throw Error("NativeDocumentNotLoaded");
      const result = await port.request({ kind: "render-sources", token, expectedRevision });
      if (result.status !== 0 || !result.bytes || result.outputRevision !== expectedRevision)
        throw Error(result.error ?? "StaleRenderSources");
      return result.bytes;
    },
    async pictureBytes(expectedRevision, section, pictureNode) {
      if (terminal || !token)
        throw Error("NativeDocumentNotLoaded");
      const result = await port.request({
        kind: "picture-bytes",
        token,
        expectedRevision,
        section,
        pictureNode
      });
      if (result.status !== 0 || !result.bytes || result.outputRevision !== expectedRevision)
        throw Error(result.error ?? "StalePictureBytes");
      return result.bytes;
    },
    descriptor: {
      protocol: "hwpjs.editor-runtime/1",
      abiVersion: 1,
      projection: "shared-provider",
      implementation: "NativeContext+owned-snapshot/1"
    },
    async request(message) {
      if (terminal)
        throw Error("NativeRuntimeDisposed");
      const kind = message.kind;
      if (kind === "load") {
        if (token)
          return failure(kind, "NativeContextAlreadyLoaded");
        if (message.password !== undefined || message.availableSectionCopy === true || message.allowObservedChartOleDeviations === true)
          return failure(kind, "NativeLoadOptionsUnsupported");
        if (!["hwp5", "hwpx"].includes(message.format) || !(message.bytes instanceof Uint8Array || message.bytes instanceof ArrayBuffer))
          return failure(kind, "NativeInvalidLoad");
        const r = checked(await port.request({
          kind: "open",
          format: message.format === "hwp5" ? 1 : 2,
          bytes: message.bytes
        }));
        if (r.status !== 0 || !r.token)
          return failure(kind, r.error ?? "NativeOpenFailed");
        token = r.token;
        return snapshot(kind);
      }
      if (!token)
        return failure(kind, "NativeDocumentNotLoaded");
      if (kind === "enable" || kind === "refresh") {
        if (Object.keys(message).some((key) => key !== "kind" && !(kind === "enable" && key === "history")))
          return failure(kind, "NativeEnableOptionsUnsupported");
        if (kind === "enable" && message.history !== undefined) {
          const configured = await configureNativeHistory(port, token, revision, message.history);
          if (configured.error || configured.status !== 0)
            return failure(kind, configured.error ?? "NativeHistoryConfigureFailed");
        }
        if (kind === "enable")
          editingEnabled = true;
        return snapshot(kind);
      }
      if (kind === "splice") {
        if (!editingEnabled)
          return failure(kind, "NativeEditingNotEnabled");
        if (typeof message.text !== "string" || ![message.section, message.paragraph, message.startUnit, message.endUnit].every((n) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 4294967295) || message.endUnit < message.startUnit || message.reference !== undefined)
          return failure(kind, "NativeInvalidSplice");
        const observation = await snapshot(kind);
        if (observation.error)
          return observation;
        const rows = observation.content.paragraphs;
        const row = rows.find((r) => r.section === message.section && r.paragraph === message.paragraph);
        if (!row?.editable || message.endUnit > row.text.length)
          return failure(kind, "NativeProjectionProtectedRange");
        const r = checked(await port.request({
          kind: "splice",
          token,
          expectedRevision: revision,
          section: message.section,
          paragraph: message.paragraph,
          startUnit: message.startUnit,
          deletedUnits: message.endUnit - message.startUnit,
          bytes: encode(message.text)
        }));
        if (r.status !== 0 && r.status !== 1)
          return {
            kind,
            error: r.error ?? "NativeSpliceFailed",
            meta: r.meta,
            historyRevision: r.historyRevision
          };
        return snapshot(kind, r);
      }
      if (kind === "undo" || kind === "redo") {
        if (!editingEnabled)
          return failure(kind, "NativeEditingNotEnabled");
        const r = checked(await port.request({
          kind: "history",
          token,
          expectedRevision: revision,
          redo: kind === "redo"
        }));
        if (r.status !== 0 && r.status !== 1)
          return {
            kind,
            error: r.error ?? "NativeHistoryFailed",
            meta: r.meta,
            historyRevision: r.historyRevision
          };
        return snapshot(kind, r);
      }
      if (kind === "save") {
        if (message.allowUnprotectedOutput === true)
          return failure(kind, "NativeUnprotectedOutputUnsupported");
        const r = checked(await port.request({
          kind: "save",
          token,
          expectedRevision: revision,
          allowStaleLayout: message.allowStaleLayout === true
        }));
        if (r.status !== 0)
          return failure(kind, r.error ?? "NativeSaveFailed");
        return {
          kind,
          bytes: r.bytes,
          historyRevision: r.historyRevision,
          layoutRequiresReflow: r.layoutRequiresReflow,
          meta: r.meta
        };
      }
      if (kind === "query-edit-window" || kind === "query-window") {
        const { section, startOrdinal, count } = message;
        if (![section, startOrdinal, count].every((n) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 4294967295) || count === 0)
          return failure(kind, "InvalidWindowRange");
        return snapshot(kind, undefined, {
          section,
          startOrdinal,
          count
        });
      }
      if (kind === "query-edit-range") {
        const observation = await snapshot(kind);
        if (observation.error)
          return observation;
        const content = observation.content, row = content.paragraphs.find((p) => p.section === message.section && p.paragraph === message.paragraph);
        if (!row || message.owner !== row.selectionOwner)
          return failure(kind, "InvalidSelectionOwner");
        if (![message.startUnit, message.endUnit].every((n) => typeof n === "number" && Number.isInteger(n) && n >= 0) || Number(message.startUnit) > Number(message.endUnit) || Number(message.endUnit) > row.text.length || !row.displayComplete)
          return failure(kind, "InvalidTextPosition");
        const range = { startUnit: message.startUnit, endUnit: message.endUnit };
        return {
          kind,
          owner: row.selectionOwner,
          displayRange: range,
          sourceCoordinateSpace: "format-native-utf16",
          sourceRange: content.format === "hwp5" ? sourceTextChange(range, row.sourceOffsets) : range,
          editable: row.editable,
          nativeRevision: content.nativeRevision
        };
      }
      if (kind === "query-current-text") {
        const r = await snapshot(kind);
        if (r.error)
          return r;
        const rows = r.content.paragraphs;
        const row = rows.find((p) => p.section === message.section && p.paragraph === message.paragraph);
        return row ? row.displayComplete ? {
          kind,
          text: row.text,
          owner: row.selectionOwner,
          displayComplete: true,
          coordinateSpace: "display-utf16"
        } : failure(kind, "NativeDisplayProjectionIncomplete") : failure(kind, "NativeParagraphNotFound");
      }
      return failure(kind, "NativeOperationUnsupported:" + kind);
    },
    invalidate() {
      terminal = true;
      port.invalidate();
    },
    async dispose() {
      terminal = true;
      const r = await port.dispose();
      if (r.status !== 0)
        throw Error(r.error ?? "NativeDisposeFailed");
    }
  };
}

// packages/react-native/src/canvas/project-hwpx-content.mjs
function projectNativeHwpx(projection, snapshot, port) {
  const paragraphs = projection.paragraphs.map((row) => {
    const source = snapshot.sections[row.section].paragraphs.find((p) => p.nativeParagraph === row.paragraph);
    if (!source || source.sourceNode !== row.sourceNode)
      throw Error("NativeRenderOwnerMismatch");
    const text = port.anchorText(row.section, row.paragraph);
    if (row.rawPlain && row.text !== text)
      throw Error("NativeRenderTextMismatch");
    return {
      ...row,
      paragraph: row.paragraph - 1,
      publicParagraph: row.paragraph,
      text,
      clipped: false
    };
  });
  const { window, ...base } = projection;
  const content = {
    ...base,
    paragraphs,
    nativeEnumeration: window,
    limited: false,
    readOnly: false,
    characterUnderlineAvailable: true,
    characterStrikeAvailable: true
  };
  attachHwpxStyles(port, content, true);
  if (content.characterShapesError || paragraphs.some((p) => p.characterRangesError))
    throw Error("IncompleteNativeCharacterSources");
  attachHwpxTables(port, content);
  attachHwpxTableBorders(port, content, true);
  attachHwpxParagraphFormats(port, content, true);
  attachDrawingTextBindings(port, content);
  attachHwpxPictures(port, content);
  attachHwpxLines(port, content);
  attachHwpxConnectors(port, content);
  attachTabDefinitions(port, content);
  attachSectionTabSources(port, content);
  attachEllipses(port, content, true);
  attachHwpxPageSettings(port, content);
  attachHwpxPictureCaptions(port, content, true);
  attachHwpxPageAreaDeclarations(port, content, true);
  content.lines.push(...content.connectors.flatMap((row) => row.referenceLine ? [row.referenceLine] : []));
  for (const key of ["pageSettingsError", "paragraphShapesError"])
    if (content[key])
      throw Error(content[key]);
  for (const key of [
    "paragraphFlowErrors",
    "tableBindingsErrors",
    "tablePlacementsErrors",
    "tableGeometryErrors",
    "tableCellMarginErrors",
    "tableCaptionErrors",
    "tableBorderSourceErrors",
    "drawingTextBindingErrors",
    "drawingTextSnapshotErrors",
    "pictureErrors",
    "lineErrors",
    "connectorErrors",
    "rectangleSourceErrors",
    "fillBrushErrors"
  ])
    if (content[key]?.length)
      throw Error("IncompleteNativeHwpxSource:" + key + ":" + (content[key][0].error ?? "Unknown"));
  return content;
}

// packages/react-native/src/canvas/hwpx-render-source-port.mjs
function hwpxRenderSourcePort(snapshot) {
  const bank = new Map;
  let total = 0;
  if (!Array.isArray(snapshot.queries) || snapshot.queries.length > 32768)
    throw Error("RenderQueryBudget");
  for (const query of snapshot.queries) {
    if (typeof query.name !== "string" || !/^[a-z_]{1,64}$/.test(query.name) || !Array.isArray(query.args) || query.args.length > 3 || !query.args.every((v) => Number.isSafeInteger(v) && v >= 0 && v <= 4294967295))
      throw Error("InvalidRenderQuery");
    const key = JSON.stringify([query.name, query.args]);
    if (bank.has(key))
      throw Error("DuplicateRenderQuery");
    if (query.error_name !== null) {
      if (typeof query.error_name !== "string" || !query.error_name || query.error_name.length > 160 || query.wire !== null)
        throw Error("InvalidRenderQueryError");
      bank.set(key, { error: query.error_name });
      continue;
    }
    if (!Array.isArray(query.wire) || query.wire.length > 32 * 1024 * 1024 - total)
      throw Error("RenderWireBudget");
    if (!query.wire.every((v) => Number.isInteger(v) && v >= 0 && v <= 255))
      throw Error("InvalidRenderWireByte");
    total += query.wire.length;
    bank.set(key, { bytes: Uint8Array.from(query.wire) });
  }
  const wire = (name, args) => {
    const row = bank.get(JSON.stringify([name, args]));
    if (!row)
      throw Error("MissingNativeRenderQuery:" + name);
    if (row.error)
      throw Error(row.error);
    return row.bytes;
  };
  const integers = (name, args) => {
    const bytes = wire(name, args);
    if (bytes.length % 4)
      throw Error("InvalidParagraphShapeIds");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return Array.from({ length: bytes.length / 4 }, (_, i) => view.getUint32(i * 4, true));
  };
  const port = {
    sectionCount: () => snapshot.sectionCount,
    paragraphShapeIds() {
      return integers("paragraph_shape_ids", []);
    },
    paragraphShapeRefs(section) {
      const values = integers("paragraph_shape_refs", [section]);
      if (values.length < 2 || values[0] < 1 || values[1] !== values.length - 2)
        throw Error("InvalidParagraphShapeIds");
      return { firstParagraph: values[0], ids: values.slice(2) };
    },
    anchorText(section, paragraph) {
      return new TextDecoder("utf-8", { fatal: true }).decode(wire("anchor_text", [section, paragraph]));
    },
    rectangleNodes(section) {
      const rows = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(wire("rectangle_nodes", [section])));
      if (!Array.isArray(rows) || rows.length > 1e5 || !rows.every((v) => Number.isSafeInteger(v) && v >= 0 && v <= 4294967295))
        throw Error("InvalidRectangleNodes");
      return rows;
    },
    tabSources(section, paragraph) {
      const value = decodeTabSources(wire("tab_sources", [section, paragraph]));
      if (value.section !== section || value.paragraph !== paragraph)
        throw Error("TabSourcesParagraphMismatch");
      return value;
    },
    pictureSizeProtection(section, node) {
      const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(wire("picture_size_protection", [section, node])));
      if (value !== null && typeof value !== "boolean")
        throw Error("InvalidPictureSizeProtection");
      return value;
    },
    paragraphShapes() {
      return decodeHwpxParagraphShapes(wire("paragraph_shapes", []));
    },
    pageSettings() {
      return decodePageSettings(wire("page_settings", []));
    },
    noteShapes() {
      return decodeNoteShapes(wire("note_shapes", []));
    },
    tabDefinitions() {
      return decodeTabDefinitions(wire("tab_definitions", []));
    },
    sectionTabSources() {
      return decodeSectionTabs(wire("section_tabs", []));
    },
    characterShapes() {
      return decodeCharacterShapes(wire("character_shapes", []));
    },
    fontFaces() {
      return decodeFontFaces(wire("font_faces", []));
    },
    fontFaceMetadata() {
      return decodeHwpxFontFaceMetadata(wire("font_face_metadata", []));
    },
    characterFontMetrics() {
      return decodeCharacterFontMetrics(wire("character_font_metrics", []), "hwpx");
    },
    characterTextColors() {
      return decodeCharacterTextColors(wire("character_text_colors", []));
    },
    characterShades() {
      return decodeCharacterShades(wire("character_shades", []));
    },
    characterEffects() {
      return decodeCharacterEffects(wire("character_effects", []));
    },
    characterOutlines() {
      return decodeCharacterOutlines(wire("character_outlines", []));
    },
    characterFontReferences() {
      return decodeCharacterFontReferences(wire("character_font_references", []));
    },
    characterStrikeStyles() {
      return decodeCharacterStrikeStyles(wire("character_strike_styles", []));
    },
    characterStrikes() {
      return decodeCharacterStrikes(wire("character_strikes", []));
    },
    characterUnderlines() {
      return decodeCharacterUnderlines(wire("character_underlines", []));
    },
    characterUnderlineStyles() {
      return decodeCharacterUnderlineStyles(wire("character_underline_styles", []));
    },
    sectionFillBrushes(section) {
      return decodeFillBrushes(wire("section_fill_brushes", [section]));
    },
    paragraphTextSnapshot(section) {
      return decodeParagraphTextSnapshot(wire("paragraph_text_snapshot", [section]));
    },
    paragraphFlow(section) {
      return decodeParagraphFlow(wire("paragraph_flow", [section]));
    },
    tableBindings(section) {
      return decodeTableBindings(wire("table_bindings", [section]));
    },
    tablePlacements(section) {
      return decodeTablePlacements(wire("table_placements", [section]));
    },
    tablePagination(section) {
      return decodeTablePagination(wire("table_pagination", [section]));
    },
    tableBorderSources(section) {
      return decodeTableBorderSources(wire("table_border_sources", [section]));
    },
    tableCaptionBindings(section) {
      return decodeTableCaptionBindings(wire("table_caption_bindings", [section]));
    },
    pictureSites(section) {
      return decodePictureSites(wire("picture_sites", [section]));
    },
    pictureOwners(section) {
      return decodePictureOwners(wire("picture_owners", [section]));
    },
    pictureCaptionBindings(section) {
      return decodeCaptionBindings(wire("picture_caption_bindings", [section]), "picture_node", "InvalidPictureCaptionBindings");
    },
    containerCaptionBindings(section) {
      return decodeCaptionBindings(wire("container_caption_bindings", [section]), "container_node", "InvalidContainerCaptionBindings");
    },
    drawingTextBindings(section) {
      return decodeDrawingTextBindings(wire("drawing_text_bindings", [section]));
    },
    drawingTextSnapshots(section) {
      return decodeDrawingTextSnapshots(wire("drawing_text_snapshots", [section]));
    },
    rectangleRenderingSources(section) {
      return decodeRectangleRenderingSources(wire("rectangle_rendering_sources", [section]));
    },
    ellipseSources(section) {
      return decodeEllipseSources(wire("ellipse_sources", [section]));
    },
    lineNodes(section) {
      return decodeLineNodes(wire("line_nodes", [section]));
    },
    connectorNodes(section) {
      return decodeConnectorNodes(wire("connector_nodes", [section]));
    },
    pageAreaDeclarations(section) {
      return decodePageAreaDeclarations(wire("page_area_declarations", [section]));
    },
    noteReferenceSites(section) {
      return decodeNoteReferenceSites(wire("note_reference_sites", [section]));
    },
    formulaFieldSources(section) {
      return decodeFormulaFieldSources(wire("formula_field_sources", [section]));
    },
    characterRanges(section, paragraph) {
      return decodeCharacterRanges(wire("character_ranges", [section, paragraph]));
    },
    tableCellMargin(section, listNode) {
      return decodeTableCellMargin(wire("table_cell_margin", [section, listNode]));
    },
    tableGeometry(section, tableNode) {
      return decodeTableGeometry(wire("table_geometry", [section, tableNode]));
    },
    tableCaption(section, tableNode) {
      return decodeTableCaption(wire("table_caption", [section, tableNode]));
    },
    pictureOwner(section, pictureNode) {
      return decodePictureOwner(wire("picture_owner", [section, pictureNode]));
    },
    picturePosition(section, pictureNode) {
      return decodePicturePosition(wire("picture_position", [section, pictureNode]));
    },
    pictureFlow(section, pictureNode) {
      return decodePictureFlow(wire("picture_flow", [section, pictureNode]));
    },
    pictureGeometry(section, pictureNode) {
      return decodePictureGeometry(wire("picture_geometry", [section, pictureNode]));
    },
    pictureCrop(section, pictureNode) {
      return decodePictureCrop(wire("picture_crop", [section, pictureNode]));
    },
    pictureTransform(section, pictureNode) {
      return decodePictureTransform(wire("picture_transform", [section, pictureNode]));
    },
    pictureRenderingCorners(section, pictureNode) {
      return decodePictureRenderingCorners(wire("picture_rendering_corners", [section, pictureNode]));
    },
    pictureCaption(section, pictureNode) {
      return decodeTableCaption(wire("picture_caption", [section, pictureNode]));
    },
    lineDisplay(section, lineNode) {
      return decodeLineDisplay(wire("line_display", [section, lineNode]));
    },
    linePlacement(section, lineNode) {
      return decodeLinePlacement(wire("line_placement", [section, lineNode]));
    },
    lineGeometry(section, node) {
      return decodeLineGeometry(wire("line_geometry", [section, node]), node);
    },
    connectorGeometrySource(section, node) {
      return decodeConnectorSource(wire("connector_geometry_source", [section, node]));
    },
    connectorOwner(section, node) {
      return decodeConnectorOwner(wire("connector_owner", [section, node]), node);
    },
    connectorRenderingSource(section, node) {
      return decodeConnectorRenderingSource(wire("connector_rendering_source", [section, node]), node);
    },
    drawingStrokeSource(section, node) {
      return decodeDrawingStrokeSource(wire("drawing_stroke_source", [section, node]), node);
    },
    containerSourceSnapshot(section, containerNode) {
      return decodeContainerSource(wire("container_source_snapshot", [section, containerNode]));
    },
    rectangleRenderingSource(section, rectangleNode) {
      return decodeRectangleRenderingSource(wire("rectangle_rendering_source", [section, rectangleNode]));
    }
  };
  return Object.freeze(port);
}

// packages/react-native/src/canvas/render-source-port.mjs
function renderSourcePort(snapshot, expectedRevision) {
  if (snapshot?.protocol !== "hwpjs.native-render-sources/3" || snapshot.revision !== expectedRevision)
    throw Error("StaleRenderSources");
  const read = (object, key) => {
    const value = object?.[key];
    if (value === undefined)
      throw Error("MissingNativeRenderSource:" + key);
    if (value?.error_name)
      throw Error(value.error_name);
    return value;
  };
  const section = (index) => {
    if (!Number.isSafeInteger(index) || index < 0 || index >= snapshot.sectionCount)
      throw Error("InvalidSection");
    return read(snapshot, "sections")[index];
  };
  const paragraph = (si, pi) => {
    const rows = read(section(si), "paragraphs");
    if (!Number.isSafeInteger(pi) || pi < 0 || pi >= rows.length)
      throw Error("InvalidParagraph");
    return rows[pi];
  };
  const bytes = (value) => new TextEncoder().encode(JSON.stringify(value));
  const port = {
    sectionCount: () => snapshot.sectionCount,
    fileVersion: () => read(snapshot, "fileVersion"),
    paragraphShapeCount: () => read(snapshot, "paragraphShapes").length,
    paragraphShapeId: (si, pi) => read(paragraph(si, pi), "paragraphShapeId"),
    characterRanges: (si, pi) => read(paragraph(si, pi), "characterRanges").map((r) => ({
      start: r.start_unit,
      end: r.end_unit,
      charShapeId: r.char_shape_id
    })),
    paragraphShapes: () => read(snapshot, "paragraphShapes").map((r) => ({
      ...r,
      legacySpacingKind: r.legacy_spacing_kind,
      legacySpacing: r.legacy_spacing,
      modernSpacing: r.modern_spacing,
      headingKind: r.heading_kind,
      headingId: r.heading_id,
      packedHeadingLevel: r.packed_heading_level,
      extendedHeadingLevel: r.extended_heading_level,
      headingLevel: r.heading_level
    })),
    supportsFormSources: () => true,
    supportsFormProperties: () => true
  };
  for (const name of ["characterShapes", "borderFillSources", "documentProperties"])
    port[name] = () => read(snapshot, name);
  for (const name of [
    "pageSettings",
    "sectionSettings",
    "tableLayoutSources",
    "cellLayoutSources",
    "tableAnchors",
    "structuralAnchors",
    "paragraphFlow",
    "columnSources",
    "pageAreaSources",
    "masterPageSources",
    "noteSources",
    "noteShapeSources",
    "automaticNumberSources",
    "pageControlSources",
    "captionSources",
    "drawingSources",
    "drawingObjectExtras",
    "drawingComponentSources",
    "drawingAnchors",
    "drawingListSources",
    "drawingMatrixSources",
    "drawingLocalTransforms",
    "drawingRectangleCorners",
    "drawingLineEndpoints",
    "formSources",
    "formProperties",
    "formAnchors",
    "formulaSources",
    "pictureSources",
    "pictureTailSources",
    "drawingStyleSources"
  ])
    port[name] = (si) => read(section(si), name);
  port.characterFontMetrics = () => decodeCharacterFontMetrics(bytes(read(snapshot, "characterFontMetrics")), "hwp5");
  port.characterTextColors = () => decodeCharacterTextColors(bytes(read(snapshot, "characterTextColors")));
  port.characterShades = () => decodeCharacterShades(bytes(read(snapshot, "characterShades")));
  port.characterEffects = () => decodeCharacterEffects(bytes(read(snapshot, "characterEffects")));
  port.characterOutlines = () => decodeCharacterOutlines(bytes(read(snapshot, "characterOutlines")));
  port.characterFontReferences = () => decodeCharacterFontReferences(bytes(read(snapshot, "characterFontReferences")));
  port.fontFaceMetadata = () => decodeFontFaceMetadata(bytes(read(snapshot, "fontFaceMetadata")));
  port.fontFaces = () => decodeFontFaces(bytes(read(snapshot, "fontFaces")));
  port.characterStrikes = () => decodeCharacterStrikes(bytes(read(snapshot, "characterStrikes")));
  port.characterStrikeStyles = () => decodeCharacterStrikeStyles(bytes(read(snapshot, "characterStrikeStyles")));
  port.characterUnderlines = () => decodeCharacterUnderlines(bytes(read(snapshot, "characterUnderlines")));
  port.characterUnderlineStyles = () => decodeCharacterUnderlineStyles(bytes(read(snapshot, "characterUnderlineStyles")));
  port.pictureSources = (si, prefix = "base73") => read(section(si), prefix === "base73" ? "pictureSources" : "pictureSources:" + prefix);
  port.pictureTailSources = (si, layout) => read(section(si), layout === "dimensions8" ? "pictureTailSources" : "pictureTailSources:" + layout);
  port.drawingStyleSources = (si, options) => {
    if (options?.border !== "observed13" || !["fill_only", "alpha_shadow_metadata"].includes(options.tail))
      throw Error("UnsupportedDrawingStyleProfile");
    return read(section(si), options.tail === "alpha_shadow_metadata" ? "drawingStyleSources" : "drawingStyleSources:fill_only");
  };
  for (const name of ["drawingCurvePoints", "drawingPolygonPoints"])
    port[name] = (si, layout) => {
      if (layout !== "observed_i32_points")
        throw Error("UnsupportedNativePointProfile");
      return read(section(si), name + ":" + layout);
    };
  const camel = (value) => Object.fromEntries(Object.entries(value).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v]));
  for (const name of ["tableBindings", "tablePlacements"])
    port[name] = (si) => read(section(si), name).map(camel);
  return Object.freeze(port);
}
function decodeRenderSources(bytes, expectedRevision, projection) {
  if (!(bytes instanceof Uint8Array) || bytes.length > 64 * 1024 * 1024)
    throw Error("RenderSourceByteBounds");
  const snapshot = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (snapshot.protocol !== "hwpjs.native-render-sources/3" || !["hwp5", "hwpx"].includes(snapshot.format))
    throw Error("UnsupportedNativeRenderFormat");
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || snapshot.revision !== expectedRevision || projection.nativeRevision !== expectedRevision)
    throw Error("StaleRenderSources");
  if (!Number.isSafeInteger(snapshot.sectionCount) || snapshot.sectionCount < 1 || snapshot.sectionCount > 4096 || !Array.isArray(snapshot.sections) || snapshot.sections.length !== snapshot.sectionCount)
    throw Error("RenderSectionBounds");
  if (projection.format !== undefined && projection.format !== snapshot.format)
    throw Error("NativeRenderFormatMismatch");
  const w = projection.window;
  if (!w?.enumerationComplete || w.hasMore || w.documentTotalRows !== projection.paragraphs.length || projection.paragraphs.length > 4096)
    throw Error("IncompleteNativeProjection");
  let count = 0;
  for (const section of snapshot.sections) {
    if (!Array.isArray(section.paragraphs) || section.paragraphs.length > 4096)
      throw Error("RenderParagraphBounds");
    count += section.paragraphs.length;
  }
  if (count !== projection.paragraphs.length)
    throw Error("RenderParagraphBounds");
  const seen = new Set;
  for (const row of projection.paragraphs) {
    const key = `${row.section}:${row.paragraph}`;
    if (seen.has(key) || !Number.isSafeInteger(row.section) || row.section < 0 || row.section >= snapshot.sectionCount || !Number.isSafeInteger(row.paragraph) || (snapshot.format === "hwp5" ? row.paragraph < 0 || row.paragraph >= snapshot.sections[row.section].paragraphs.length : !snapshot.sections[row.section].paragraphs.some((p) => p.nativeParagraph === row.paragraph && p.sourceNode === row.sourceNode)))
      throw Error("RenderOwnerBounds");
    seen.add(key);
  }
  return {
    snapshot,
    port: snapshot.format === "hwpx" ? hwpxRenderSourcePort(snapshot) : renderSourcePort(snapshot, expectedRevision)
  };
}

// packages/react-native/src/canvas/project-content.mjs
function projectNativeContent(projection, bytes) {
  const { snapshot, port } = decodeRenderSources(bytes, projection.nativeRevision, projection);
  if (snapshot.format === "hwpx")
    return projectNativeHwpx(projection, snapshot, port);
  const paragraphs = projection.paragraphs.map((row) => {
    const proof = snapshot.sections[row.section].paragraphs[row.paragraph].textPresence;
    if (!row.displayComplete) {
      if (!(proof?.observed_empty === true && proof.source_node === row.sourceNode && proof.token_count === 0 && proof.raw_units === 0 && Number.isSafeInteger(proof.declared_units) && proof.declared_units >= 0 && proof.declared_units <= 1 && row.text === "" && Array.isArray(row.tokens) && row.tokens.length === 0))
        throw Error("NativeDisplayProjectionIncomplete");
    }
    return { ...row, clipped: false };
  });
  const { window, ...base } = projection;
  const content = {
    ...base,
    paragraphs,
    limited: false,
    nativeEnumeration: window,
    editorSessionAvailable: true,
    characterUnderlineAvailable: true,
    characterStrikeAvailable: true
  };
  const preview = {
    sections: Array.from({ length: snapshot.sectionCount }, (_, index) => ({
      index,
      paragraphs: paragraphs.filter((p) => p.section === index)
    }))
  };
  attachHwp5Styles(port, preview, content);
  if (!content.characterShapes || content.characterShapesError || content.paragraphs.some((p) => p.characterRangesError))
    throw Error("IncompleteNativeCharacterSources");
  attachHwp5Tables(port, preview, content);
  attachHwp5ParagraphFormats(port, content, true);
  attachHwp5PageSources(port, content);
  attachHwp5Pictures(port, content);
  attachHwp5PictureTails(port, content);
  content.hwp5GroupGeometry = projectHwp5GroupGeometry(content);
  attachHwp5Forms(port, content);
  attachHwp5FormProperties(port, content);
  attachHwp5Lines(port, content);
  if (content.hwp5Pictures.length) {
    const r = projectHwp5PictureGeometry(content);
    if (r.state !== "projected")
      throw Error(r.error);
    content.pictures = r.pictures;
  }
  attachHwp5Formulas(port, content, false);
  const roots = projectHwp5RootContent(content);
  if (roots.state === "projected")
    return roots.content;
  if (roots.state === "unavailable")
    throw Error(roots.error);
  return content;
}

// packages/react-native/src/canvas/resource-document.mjs
function nativeResourceDocument(content) {
  const token = content?.canvasObservationToken;
  if (!token || typeof token.editorId !== "string" || typeof token.documentId !== "string" || !Number.isSafeInteger(token.generation) || token.generation < 0 || !["hwp5", "hwpx"].includes(content.format))
    throw Error("NativeCanvasDocumentIdentityRequired");
  return JSON.stringify([token.editorId, token.documentId, token.generation, content.format]);
}

// packages/react-native/src/canvas/command-context.mjs
var clone = (value) => JSON.parse(JSON.stringify(value));
function createNativeCommandContext(measureText) {
  if (typeof measureText !== "function")
    throw Error("NativeTextMeasurementUnavailable");
  let commands = [], matrix = [1, 0, 0, 1, 0, 0], stack = [];
  const initial = {
    font: "16px system-ui",
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    miterLimit: 10,
    lineDashOffset: 0,
    textAlign: "start",
    textBaseline: "alphabetic",
    shadowColor: "#00000000",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    filter: "none"
  };
  let state = { ...initial };
  const append = (method, args = []) => {
    if (commands.length >= 1e5)
      throw Error("PaintCommandBudget");
    commands.push({ op: "ctx", method, args: clone(args) });
  };
  const multiply = (b) => {
    const a = matrix;
    matrix = [
      a[0] * b[0] + a[2] * b[1],
      a[1] * b[0] + a[3] * b[1],
      a[0] * b[2] + a[2] * b[3],
      a[1] * b[2] + a[3] * b[3],
      a[0] * b[4] + a[2] * b[5] + a[4],
      a[1] * b[4] + a[3] * b[5] + a[5]
    ];
  };
  const finite = (args) => {
    if (!args.every(Number.isFinite))
      throw Error("InvalidPaintNumber");
  };
  const ctx = {
    measureText(text) {
      const m = measureText(String(text), state.font);
      if (!m || !Number.isFinite(m.width) || m.width < 0 || !Number.isFinite(m.actualBoundingBoxAscent) || !Number.isFinite(m.actualBoundingBoxDescent))
        throw Error("InvalidNativeTextMetrics");
      return m;
    },
    save() {
      stack.push({ state: clone(state), matrix: [...matrix] });
      append("save");
    },
    restore() {
      if (!stack.length)
        throw Error("PaintStackUnderflow");
      ({ state, matrix } = stack.pop());
      append("restore");
    },
    setTransform(...args) {
      finite(args);
      if (args.length !== 6)
        throw Error("InvalidTransform");
      matrix = [...args];
      append("setTransform", args);
    },
    transform(...args) {
      finite(args);
      if (args.length !== 6)
        throw Error("InvalidTransform");
      multiply(args);
      append("transform", args);
    },
    translate(x, y) {
      this.transform(1, 0, 0, 1, x, y);
    },
    scale(x, y) {
      this.transform(x, 0, 0, y, 0, 0);
    },
    getTransform() {
      const [a, b, c, d, e, f] = matrix;
      return { a, b, c, d, e, f };
    },
    setLineDash(args) {
      finite(args);
      if (args.some((v) => v < 0))
        throw Error("InvalidDash");
      append("setLineDash", [args]);
    },
    fillText(text, x, y) {
      finite([x, y]);
      append("fillText", [String(text), x, y]);
    },
    strokeText(text, x, y) {
      finite([x, y]);
      append("strokeText", [String(text), x, y]);
    },
    drawImage(bitmap, ...args) {
      if (!bitmap || typeof bitmap.key !== "string" || ![2, 4, 8].includes(args.length))
        throw Error("InvalidNativeImage");
      finite(args);
      append("drawImage", [bitmap.key, ...args]);
    },
    createLinearGradient(...points) {
      finite(points);
      if (points.length !== 4)
        throw Error("InvalidGradient");
      const g = {
        kind: "linear",
        points,
        stops: [],
        addColorStop(at, color) {
          if (!Number.isFinite(at) || at < 0 || at > 1 || typeof color !== "string")
            throw Error("InvalidGradientStop");
          this.stops.push([at, color]);
        }
      };
      return g;
    }
  };
  for (const method of [
    "beginPath",
    "closePath",
    "stroke",
    "fill",
    "clip",
    "moveTo",
    "lineTo",
    "bezierCurveTo",
    "rect",
    "fillRect",
    "strokeRect",
    "arc",
    "ellipse"
  ])
    ctx[method] = (...args) => {
      for (const a of args)
        if (typeof a === "number" && !Number.isFinite(a))
          throw Error("InvalidPaintNumber");
      append(method, args);
    };
  for (const key of Object.keys(initial))
    Object.defineProperty(ctx, key, {
      get: () => state[key],
      set: (value) => {
        const dto = value?.kind === "linear" ? { kind: value.kind, points: value.points, stops: value.stops } : value;
        state[key] = dto;
        append("set", [key, dto]);
      }
    });
  return {
    ctx,
    begin() {
      commands = [];
      stack = [];
      matrix = [1, 0, 0, 1, 0, 0];
      state = { ...initial };
    },
    finish() {
      if (stack.length)
        throw Error("UnbalancedPaintStack");
      return clone(commands);
    }
  };
}

// packages/react-native/src/canvas/native-renderer.mjs
function createNativeRenderer(surface) {
  const textBoundaries = surface.textBoundaries;
  let closed = false, revision = 0, presentedRevision = 0, resourceEpoch = 0, layout = null, scheduled = new Map, serial = 0;
  const timeouts = new Set, intervals = new Set;
  const scopedTimeout = (callback, delay, ...args) => {
    const id = setTimeout(() => {
      timeouts.delete(id);
      if (!closed)
        withTextBoundaries(textBoundaries, () => callback(...args));
    }, delay);
    timeouts.add(id);
    return id;
  };
  const cancelTimeout = (id) => {
    timeouts.delete(id);
    clearTimeout(id);
  };
  const scopedInterval = (callback, delay, ...args) => {
    const id = setInterval(() => {
      if (!closed)
        withTextBoundaries(textBoundaries, () => callback(...args));
    }, delay);
    intervals.add(id);
    return id;
  };
  const cancelInterval = (id) => {
    intervals.delete(id);
    clearInterval(id);
  };
  const waiters = [], fontObservations = new Map;
  const recorder = createNativeCommandContext((text, font) => {
    const metrics = surface.measureText(text, font);
    fontObservations.set(font, {
      requested: font,
      resolved: metrics.resolvedFont ?? null,
      fallback: metrics.fontFallback ?? null
    });
    return metrics;
  });
  const geometry = surface.bounds();
  const viewport = {
    clientWidth: geometry.width,
    clientHeight: geometry.height,
    scrollTop: 0,
    scrollLeft: 0,
    addEventListener() {},
    removeEventListener() {}
  };
  const canvas = {
    style: {},
    dataset: {},
    width: 0,
    height: 0,
    getContext: () => recorder.ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, ...surface.bounds() })
  };
  recorder.ctx.canvas = canvas;
  const spacer = { style: {} };
  const flush = (callback) => {
    if (closed)
      return;
    recorder.begin();
    withTextBoundaries(textBoundaries, callback);
    if (layout?.state !== "paginated")
      return;
    if (canvas.dataset.paintPending === "true")
      return;
    if (layout.objectCoverage === "incomplete" || layout.unrenderedObjects?.length || layout.pictureCoverage?.failed || layout.tableBackgroundCoverage?.failed) {
      const error = Error("IncompleteNativePaintCoverage");
      for (const w of waiters.splice(0))
        w.reject(error);
      surface.onError?.(error);
      return;
    }
    const hitTargets = [];
    const seen = new Set;
    for (const row of layout.rows) {
      const key = row.section + ":" + row.paragraph;
      if (!row.editable || seen.has(key))
        continue;
      seen.add(key);
      const caret = withTextBoundaries(textBoundaries, () => caretGeometry(layout, {
        section: row.section,
        paragraph: row.paragraph,
        unit: row.startUnit
      }));
      if (!caret)
        continue;
      const x = caret.x - viewport.scrollLeft, y = caret.y - viewport.scrollTop;
      if (x < 0 || y < 0 || x >= viewport.clientWidth || y + caret.height > viewport.clientHeight)
        continue;
      hitTargets.push({
        id: "canvas-body-" + row.section + "-" + row.paragraph,
        rect: [x, y, 1, caret.height]
      });
    }
    const current = revision;
    Promise.resolve(surface.present({
      hitTargets,
      protocol: "hwpjs.native-canvas/1",
      state: "paginated",
      revision: current,
      scale: 1,
      commands: recorder.finish(),
      observation: {
        picturePending: canvas.dataset.picturePending === "true",
        paintPending: canvas.dataset.paintPending === "true",
        publicToken: surface.currentContent()?.canvasObservationToken,
        nativeRevision: surface.currentContent()?.nativeRevision
      }
    })).then(() => {
      if (!closed && current === revision) {
        presentedRevision = current;
        for (const w of waiters.splice(0))
          w.resolve({ revision, layout });
      }
    }, (error) => {
      if (current === revision) {
        for (const w of waiters.splice(0))
          w.reject(error);
        surface.onError?.(error);
      }
    });
  };
  const environment = {
    textBoundaryIdentity: () => withTextBoundaries(textBoundaries, currentTextBoundaryIdentity),
    requestFrame(callback) {
      const id = ++serial;
      scheduled.set(id, callback);
      scopedTimeout(() => {
        if (scheduled.has(id))
          drain();
      }, 0);
      return id;
    },
    cancelFrame(id) {
      scheduled.delete(id);
    },
    setTimeout: scopedTimeout,
    clearTimeout: cancelTimeout,
    setInterval: scopedInterval,
    clearInterval: cancelInterval,
    devicePixelRatio: () => 1,
    ResizeObserver: class {
      observe() {}
      disconnect() {}
    }
  };
  const rawRenderer = withTextBoundaries(textBoundaries, () => createRenderer(canvas, viewport, spacer, (value) => {
    layout = value;
    revision++;
    presentedRevision = 0;
  }, environment));
  const renderer = new Proxy(rawRenderer, {
    get(target, key) {
      const value = target[key];
      return typeof value === "function" ? (...args) => withTextBoundaries(textBoundaries, () => value.apply(target, args)) : value;
    }
  });
  renderer.pictureDecoder((bytes, meta) => surface.decodeImage(bytes, { ...meta, revision: resourceEpoch }));
  function drain() {
    for (const [id, callback] of [...scheduled]) {
      scheduled.delete(id);
      flush(callback);
    }
  }
  const unsubscribe = surface.onBounds((bounds) => {
    if (closed)
      return;
    viewport.clientWidth = bounds.width;
    viewport.clientHeight = bounds.height;
    if (!surface.currentContent())
      return;
    renderer.show(surface.currentContent(), { preserveScroll: true });
    drain();
  });
  return {
    show(content) {
      if (closed)
        throw Error("Disposed");
      const resourceDocument = nativeResourceDocument(content);
      const { canvasObservationToken: observation, nativeRevision } = content;
      renderer.pictureReader((section, node) => surface.pictureBytes(observation, nativeRevision, section, node));
      resourceEpoch++;
      surface.beginResources(resourceEpoch, resourceDocument);
      layout = renderer.show(content, { resourceEpoch, resourceDocument });
      if (layout.state !== "paginated" || layout.limited)
        throw Error(layout.error ?? "IncompleteLayout");
      const painted = new Promise((resolve, reject) => waiters.push({ resolve, reject }));
      drain();
      return painted;
    },
    drain,
    fontMetadata: () => [...fontObservations.values()],
    hit(point) {
      if (closed)
        throw Error("Disposed");
      if (point.revision !== revision || presentedRevision !== revision || !renderer.isPaintedFrameCurrent())
        throw Error("StaleFrame");
      const b = surface.bounds();
      if (![point.x, point.y].every(Number.isFinite) || point.x < 0 || point.y < 0 || point.x >= b.width || point.y >= b.height)
        throw Error("OutsideSurface");
      return withTextBoundaries(textBoundaries, () => hitText(layout, point.x + viewport.scrollLeft, point.y + viewport.scrollTop));
    },
    reveal(section, paragraph) {
      const row = layout.rows.find((r) => r.section === section && r.paragraph === paragraph && r.editable);
      if (!row)
        throw Error("NoEditableLayoutRow");
      const caret = withTextBoundaries(textBoundaries, () => caretGeometry(layout, { section, paragraph, unit: row.startUnit }));
      if (!caret)
        throw Error("NoCaretGeometry");
      viewport.scrollTop = Math.max(0, caret.y - viewport.clientHeight / 2);
      viewport.scrollLeft = Math.max(0, caret.x - viewport.clientWidth / 2);
      const painted = new Promise((resolve, reject) => waiters.push({ resolve, reject }));
      renderer.show(surface.currentContent(), { preserveScroll: true });
      drain();
      return painted;
    },
    scroll(x, y) {
      if (![x, y].every(Number.isFinite) || x < 0 || y < 0)
        throw Error("InvalidScroll");
      viewport.scrollLeft = x;
      viewport.scrollTop = y;
      renderer.show(surface.currentContent(), { preserveScroll: true });
      drain();
    },
    close() {
      if (closed)
        return;
      closed = true;
      for (const w of waiters.splice(0))
        w.reject(Error("Disposed"));
      scheduled.clear();
      for (const id of timeouts)
        clearTimeout(id);
      for (const id of intervals)
        clearInterval(id);
      timeouts.clear();
      intervals.clear();
      const failures = [];
      try {
        unsubscribe();
      } catch (error) {
        failures.push(error);
      }
      try {
        renderer.close();
      } catch (error) {
        failures.push(error);
      }
      try {
        surface.dispose();
      } catch (error) {
        failures.push(error);
      }
      if (failures.length)
        throw new AggregateError(failures, "NativeCanvasCleanupFailed");
    }
  };
}

// packages/react-native/src/canvas/create-canvas-session.mjs
function createCanvasSession({ editor, transport, surface, spliceCommand }) {
  let closed = false, content = null, snapshot = null, epoch = 0, lastEdit = null, disposal = null;
  const nativeSurface = {
    ...surface,
    currentContent: () => content,
    pictureBytes: (token, revision, section, node) => transport.pictureBytes(token, revision, section, node)
  };
  const renderer = createNativeRenderer(nativeSurface);
  const live = () => {
    if (closed)
      throw Error("Disposed");
  };
  async function refresh() {
    live();
    const generation = ++epoch;
    const state = editor.getEditorState();
    const bytes = await transport.renderSources(state.token, state.content.nativeRevision);
    if (closed || generation !== epoch || editor.getEditorState() !== state)
      throw Error("StaleRenderSources");
    const next = projectNativeContent(state.content, bytes);
    next.canvasObservationToken = state.token;
    snapshot = state;
    content = next;
    return renderer.show(content);
  }
  return {
    async load(bytes, format) {
      live();
      epoch++;
      await editor.load(bytes, { format });
      return refresh();
    },
    refresh,
    fontMetadata: () => renderer.fontMetadata(),
    lastEdit: () => lastEdit && { ...lastEdit },
    revealEditable() {
      live();
      const p = snapshot?.content.paragraphs.find((r) => r.editable && r.displayComplete && r.ownerKind === "body");
      if (!p)
        throw Error("NoEditableBody");
      const display = content.paragraphs.find((r) => r.section === p.section && (r.publicParagraph ?? r.paragraph) === p.paragraph);
      if (!display)
        throw Error("NoEditableLayoutOwner");
      return renderer.reveal(display.section, display.paragraph);
    },
    async input(point, text) {
      live();
      const hit = renderer.hit(point);
      if (!hit)
        throw Error("NoTextOwner");
      if (snapshot !== editor.getEditorState())
        throw Error("StaleFrame");
      const display = content.paragraphs.find((r) => r.section === hit.section && r.paragraph === hit.paragraph);
      const p = snapshot.content.paragraphs.find((r) => r.section === hit.section && r.paragraph === (display?.publicParagraph ?? hit.paragraph));
      if (!p?.editable || !p.displayComplete)
        throw Error("ProtectedOwner");
      const target = {
        ...snapshot.token,
        coordinateSpace: "display",
        format: snapshot.content.format,
        section: p.section,
        paragraph: p.paragraph,
        owner: p.selectionOwner,
        startUnit: hit.unit,
        endUnit: hit.unit,
        affinity: hit.affinity
      };
      await editor.setSelection(target);
      const result = await editor.dispatchCommand(spliceCommand, { target, text });
      if (result.status !== "committed-with-snapshot")
        throw Error("SpliceUnapplied");
      lastEdit = {
        format: snapshot.content.format,
        section: p.section,
        paragraph: p.paragraph,
        startUnit: hit.unit,
        endUnit: hit.unit,
        text,
        rawPlain: p.rawPlain,
        coordinateSpace: "display-utf16",
        sourceNativeRevision: snapshot.content.nativeRevision
      };
      return refresh();
    },
    async undo() {
      live();
      const r = await editor.undo();
      if (r.status === "committed-with-snapshot")
        await refresh();
      return r;
    },
    async redo() {
      live();
      const r = await editor.redo();
      if (r.status === "committed-with-snapshot")
        await refresh();
      return r;
    },
    async save(options) {
      live();
      return editor.save(options);
    },
    async reopen(bytes, format) {
      live();
      epoch++;
      await editor.load(bytes, { format });
      return refresh();
    },
    scroll: (x, y) => renderer.scroll(x, y),
    dispose() {
      if (disposal)
        return disposal;
      closed = true;
      epoch++;
      disposal = Promise.resolve().then(async () => {
        try {
          renderer.close();
        } finally {
          await editor.dispose();
        }
      });
      return disposal;
    }
  };
}

// packages/react-native/src/canvas/provider.ts
function createNativeCanvasProvider(binding, options = {}) {
  let serial = 0;
  const trace = (e) => {
    try {
      options.observe?.(e);
    } catch {}
  };
  const registered = new WeakMap;
  function sourcesFor() {
    const runtimes = new Map;
    const ids = new WeakMap;
    const key = (t) => JSON.stringify([t.editorId, t.documentId, t.generation]);
    const provider = createNativeProvider2({
      createTransport: async () => {
        const runtime = ++serial;
        trace({ event: "runtime-created", runtime });
        const transport = await createNativeContextTransport(binding, (e) => trace({ ...e, runtime }));
        ids.set(transport, runtime);
        let identity;
        return {
          descriptor: transport.descriptor,
          async request(message, context) {
            if (!context)
              throw Error("CanvasRequestIdentityMissing");
            const observed = key(context);
            if (identity !== undefined && identity !== observed)
              throw Error("CanvasRuntimeIdentityChanged");
            identity = observed;
            runtimes.set(observed, transport);
            trace({
              event: "public-runtime-request",
              runtime,
              kind: message.kind,
              context: { ...context }
            });
            return transport.request(message);
          },
          invalidate() {
            transport.invalidate();
            if (identity && runtimes.get(identity) === transport)
              runtimes.delete(identity);
          },
          async dispose() {
            try {
              await transport.dispose();
            } finally {
              if (identity && runtimes.get(identity) === transport)
                runtimes.delete(identity);
            }
          }
        };
      }
    });
    let editor;
    const active = (token) => {
      const current = editor.getEditorState().token;
      if (key(token) !== key(current) || token.operationRevision !== current.operationRevision)
        throw Error("StaleCanvasObservation");
      const t = runtimes.get(key(token));
      if (!t)
        throw Error("NativeDocumentNotLoaded");
      return t;
    };
    return {
      create(options) {
        editor = provider.createEditor(options);
        editor.registerUpdateListener((state) => trace({
          event: "public-state-callback",
          token: { ...state.token },
          status: state.status,
          nativeRevision: state.content?.nativeRevision
        }));
        return editor;
      },
      transport: {
        renderSources: async (token, revision) => {
          const t = active(token), runtime = ids.get(t);
          trace({
            event: "render-query",
            runtime,
            publicToken: { ...token },
            nativeRevision: revision
          });
          const bytes = await t.renderSources(revision);
          trace({
            event: "render-query-complete",
            runtime,
            publicToken: { ...token },
            nativeRevision: revision
          });
          return bytes;
        },
        pictureBytes: (token, revision, section, node) => {
          const t = active(token);
          trace({
            event: "picture-query",
            runtime: ids.get(t),
            publicToken: { ...token },
            nativeRevision: revision,
            section,
            node
          });
          return t.pictureBytes(revision, section, node);
        }
      }
    };
  }
  const attached = new WeakSet;
  return Object.freeze({
    createEditor(options) {
      const source = sourcesFor();
      const editor = source.create(options);
      registered.set(editor, source);
      return editor;
    },
    attachCanvas(editor, surface) {
      const source = registered.get(editor);
      if (!source)
        throw Error("CanvasEditorProviderMismatch");
      if (attached.has(editor))
        throw Error("CanvasAlreadyAttached");
      attached.add(editor);
      try {
        return createCanvasSession({
          editor,
          transport: source.transport,
          surface,
          spliceCommand: SPLICE_TEXT_COMMAND
        });
      } catch (error) {
        attached.delete(editor);
        throw error;
      }
    }
  });
}
// packages/react-native/src/canvas/NativeCanvasView.tsx
import { useRef } from "react";
import {
  Platform,
  requireNativeComponent,
  TurboModuleRegistry
} from "react-native";
import { jsx } from "react/jsx-runtime";
var Surface = Platform.OS === "ios" ? requireNativeComponent("HwpNativeCanvas") : null;
var nextSurface = 0;
function NativeCanvasView({
  onHost,
  ...props
}) {
  if (Platform.OS !== "ios" || !Surface)
    throw Error("HwpJSCanvasIOSOnly");
  const identity = useRef("hwp-native-canvas-" + ++nextSurface).current;
  const initialized = useRef(false);
  return /* @__PURE__ */ jsx(Surface, {
    ...props,
    surfaceId: identity,
    onLayout: (event) => {
      props.onLayout?.(event);
      if (initialized.current)
        return;
      TurboModuleRegistry.getEnforcing("HwpNativeCanvasData");
      if (!globalThis.__hwpNativeCanvasCreateHost)
        throw Error("CanvasHostNotInstalled");
      initialized.current = true;
      onHost(globalThis.__hwpNativeCanvasCreateHost(identity));
    }
  });
}
// packages/react-native/src/canvas/text-boundaries.mjs
function createTextBoundaries(host) {
  let disposed = false;
  const live = () => {
    if (disposed)
      throw Error("DisposedTextBoundaries");
  };
  return Object.freeze({
    capability: Object.freeze({
      protocol: "hwpjs.native-text-boundaries/1",
      coordinateSpace: "utf16",
      grapheme: "NSString-composed-character-sequences",
      word: false
    }),
    segments(text) {
      live();
      if (typeof text !== "string" || text.length > 1e6)
        throw Error("TextBoundaryInput");
      for (let i = 0;i < text.length; i++) {
        const u = text.charCodeAt(i);
        if (u >= 55296 && u <= 56319) {
          const v = text.charCodeAt(++i);
          if (!(v >= 56320 && v <= 57343))
            throw Error("InvalidUTF16");
        } else if (u >= 56320 && u <= 57343)
          throw Error("InvalidUTF16");
      }
      const parts = host.segmentText(text);
      live();
      if (!Array.isArray(parts) || parts.length > text.length)
        throw Error("InvalidNativeTextBoundary");
      let next = 0;
      const rows = [];
      for (let i = 0;i < parts.length; i++) {
        const part = parts[i];
        if (part === null || typeof part !== "object" || !Number.isSafeInteger(part.index) || part.index !== next || typeof part.segment !== "string" || !part.segment.length || text.slice(next, next + part.segment.length) !== part.segment)
          throw Error("InvalidNativeTextBoundary");
        const end = next + part.segment.length;
        if (end < text.length && text.charCodeAt(end - 1) >= 55296 && text.charCodeAt(end - 1) <= 56319 && text.charCodeAt(end) >= 56320 && text.charCodeAt(end) <= 57343)
          throw Error("InvalidNativeTextBoundary");
        const row = { index: next, segment: part.segment, input: text };
        next += part.segment.length;
        rows.push(row);
      }
      if (next !== text.length)
        throw Error("IncompleteNativeTextBoundary");
      const normalized = [];
      for (const row of rows) {
        const previous = normalized[normalized.length - 1];
        if (previous?.segment === "\r" && row.segment === `
`)
          previous.segment = `\r
`;
        else
          normalized.push(row);
      }
      return normalized;
    },
    word() {
      live();
      throw Error("NativeWordSegmentationUnavailable");
    },
    dispose() {
      disposed = true;
    }
  });
}

// packages/react-native/src/canvas/host-surface.mjs
function createHostSurface(host, { onPoint, onError = () => {} } = {}) {
  const protocol = host.resourceProtocol;
  if (protocol !== undefined && protocol !== "hwpjs.native-image-resources/2")
    throw Error("NativeImageResourceProtocolMismatch");
  const imageResourcesV2 = protocol === "hwpjs.native-image-resources/2";
  let next = 0, closed = false;
  const textBoundaries = createTextBoundaries(host);
  const pending = new Map, listeners = new Set;
  host.setReplyHandler((message) => {
    if (closed)
      return;
    if (message.event === "bounds") {
      for (const listener of listeners)
        listener(message);
      return;
    }
    if (message.event === "point") {
      onPoint?.(message.point);
      return;
    }
    if (message.event === "error") {
      onError(Error(message.error));
      return;
    }
    const request = pending.get(message.id);
    if (!request)
      return;
    pending.delete(message.id);
    if (message.error)
      request.reject(Error(message.error));
    else
      request.resolve(message);
  });
  const request = (invoke) => new Promise((resolve, reject) => {
    if (closed)
      return reject(Error("Disposed"));
    if (next >= 4294967295)
      return reject(Error("CanvasRequestIdExhausted"));
    const id = ++next;
    pending.set(id, { resolve, reject });
    try {
      invoke(id);
    } catch (error) {
      pending.delete(id);
      reject(error);
    }
  });
  return {
    textBoundaries,
    bounds: () => host.bounds(),
    measureText: (text, font) => host.measureText(text, font),
    onError,
    onBounds(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    beginResources: (epoch, document) => imageResourcesV2 ? host.beginResources(epoch, document) : host.beginResources(epoch),
    present: (frame) => request((id) => host.present(id, JSON.stringify(frame))),
    async decodeImage(bytes, { revision }) {
      const key = "bitmap-" + (next + 1);
      const reply = await request((id) => host.decodeImage(id, key, bytes, revision));
      const { width, height, version } = reply.size ?? {};
      if (imageResourcesV2 && (!Number.isInteger(version) || version < 1 || version > 4294967295)) {
        host.releaseImage(key);
        throw Error("InvalidNativeBitmapVersion");
      }
      const release = () => imageResourcesV2 ? host.releaseImage(key, version) : host.releaseImage(key);
      if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
        release();
        throw Error("InvalidNativeBitmapSize");
      }
      let released = false;
      return {
        key,
        width,
        height,
        close() {
          if (released)
            return;
          released = true;
          if (!closed)
            release();
        }
      };
    },
    dispose() {
      if (closed)
        return;
      closed = true;
      textBoundaries.dispose();
      for (const p of pending.values())
        p.reject(Error("Disposed"));
      pending.clear();
      listeners.clear();
      host.dispose();
    }
  };
}

// packages/react-native/src/canvas/text-platform.mjs
function installNativeTextPlatform(host, realm = globalThis) {
  const installed = [];
  if (typeof Array.prototype.toSorted !== "function") {
    Object.defineProperty(Array.prototype, "toSorted", {
      configurable: true,
      writable: true,
      value(compare) {
        return Array.from(this).sort(compare);
      }
    });
    installed.push("nonmutating-array-sort");
  }
  if (typeof realm.structuredClone !== "function") {
    realm.structuredClone = (value) => copyTransportDTO(value);
    installed.push("strict-owned-DTO-clone");
  }
  if (typeof realm.TextEncoder !== "function") {
    realm.TextEncoder = class {
      encode(text = "") {
        return Uint8Array.from(host.encodeUTF8(String(text)));
      }
    };
    installed.push("TextEncoder");
  }
  if (typeof realm.TextDecoder !== "function") {
    realm.TextDecoder = class {
      constructor(label = "utf-8") {
        if (!["utf-8", "utf8"].includes(label.toLowerCase()))
          throw Error("UnsupportedEncoding");
      }
      decode(bytes = new Uint8Array) {
        if (!(bytes instanceof Uint8Array))
          throw Error("InvalidUTF8Bytes");
        return host.decodeUTF8(bytes);
      }
    };
    installed.push("TextDecoder-fatal-only");
  }
  if (typeof String.prototype.isWellFormed !== "function") {
    Object.defineProperty(String.prototype, "isWellFormed", {
      configurable: true,
      writable: true,
      value() {
        const s = String(this);
        for (let i = 0;i < s.length; i++) {
          const c = s.charCodeAt(i);
          if (c >= 55296 && c <= 56319) {
            const n = s.charCodeAt(++i);
            if (!(n >= 56320 && n <= 57343))
              return false;
          } else if (c >= 56320 && c <= 57343)
            return false;
        }
        return true;
      }
    });
    installed.push("UTF16-wellformed-check");
  }
  return {
    installed,
    segmentationEquivalence: "NSString platform segmentation; ICU/Hancom equivalence unverified"
  };
}

// packages/react-native/src/canvas/platform.ts
function createNativeCanvasSurface(host, callbacks) {
  return createHostSurface(host, callbacks);
}
function createNativeTextBoundaries(host) {
  return createTextBoundaries(host);
}
function installNativeTextPlatform2(host) {
  return installNativeTextPlatform(host);
}
// packages/react-native/src/canvas/install.ts
import { Platform as Platform2, TurboModuleRegistry as TurboModuleRegistry2 } from "react-native";
function getNativeCanvasBinding() {
  if (Platform2.OS !== "ios")
    throw Error("HwpJSCanvasIOSOnly");
  TurboModuleRegistry2.getEnforcing("HwpCanvasContext");
  const binding = globalThis.hwpNativeCanvasBinding;
  if (!binding || binding.contextProtocol !== "hwpjs.native-context/1" || typeof binding.createContextPort !== "function")
    throw Error("NativeCanvasBindingNotInstalled");
  return binding;
}
export {
  NativeCanvasView,
  createNativeCanvasProvider,
  createNativeCanvasSurface,
  createNativeTextBoundaries,
  getNativeCanvasBinding,
  installNativeTextPlatform2 as installNativeTextPlatform
};
