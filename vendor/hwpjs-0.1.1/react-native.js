import {
  NativeBackendUnavailableError2,
  NativeRuntimeError2,
  createNativeRuntimeFactory2,
  createNativeProvider2,
  createNativeProviderFromJsi2
} from "./chunk-f8m5gnh6.js";
// packages/react-native/src/controller.ts
function controller(editor, ownsEditor) {
  let terminal = false, lease, disposal;
  return Object.freeze({
    editor,
    attachInputSurface(hooks) {
      if (terminal)
        throw Error("NativeControllerDisposed");
      if (lease?.isActive())
        throw Error("NativeInputSurfaceAlreadyAttached");
      lease = editor.acquireInputSurface(hooks);
      return lease;
    },
    detachInputSurface() {
      const previous = lease;
      lease = undefined;
      previous?.release();
    },
    dispose() {
      if (disposal)
        return disposal;
      terminal = true;
      let resolve, reject;
      disposal = new Promise((done, fail) => {
        resolve = done;
        reject = fail;
      });
      const failures = [];
      let editorDisposal = undefined;
      try {
        if (ownsEditor)
          editorDisposal = editor.dispose();
      } catch (error) {
        failures.push(error);
      }
      try {
        const previous = lease;
        lease = undefined;
        previous?.release();
      } catch (error) {
        failures.push(error);
      }
      Promise.resolve(editorDisposal).catch((error) => {
        failures.push(error);
      }).then(() => {
        if (failures.length)
          throw new AggregateError(failures, "NativeControllerDisposeFailed");
      }).then(resolve, reject);
      return disposal;
    }
  });
}
function createNativeController(editor) {
  return controller(editor, false);
}
function createNativeEditorController(provider, options) {
  return controller(provider.createEditor(options), true);
}
// packages/react-native/src/native/context-port.ts
function createNativeContextPort(binding) {
  if (!binding)
    throw new NativeBackendUnavailableError2;
  if (binding.contextProtocol !== "hwpjs.native-context/1" || typeof binding.createContextPort !== "function")
    throw Error("NativeContextProtocolMismatch");
  return binding.createContextPort();
}
// packages/react-native/src/native/context-transport.ts
var decode = (bytes) => decodeURIComponent(Array.from(bytes, (b) => "%" + b.toString(16).padStart(2, "0")).join(""));
var encode = (text) => Uint8Array.from(unescape(encodeURIComponent(text)), (c) => c.charCodeAt(0));
var failure = (kind, error) => ({
  kind,
  error,
  applied: false,
  meta: { application: "unapplied", changed: false }
});
async function createNativeContextTransport(binding) {
  const port = createNativeContextPort(binding);
  if (port.descriptor.snapshotProtocol !== "hwpjs.native-snapshot/1") {
    await port.dispose();
    throw Error("NativeSnapshotUnavailable");
  }
  let token, revision = 0, terminal = false, editingEnabled = false;
  const checked = (reply) => {
    if (reply.revision !== undefined)
      revision = reply.revision;
    return reply;
  };
  async function snapshot(kind, mutation) {
    const r = checked(await port.request({ kind: "snapshot", token }));
    if (r.status !== 0 || !r.bytes)
      return {
        kind,
        error: r.error ?? "NativeSnapshotFailed",
        meta: mutation?.meta ?? { application: "unapplied", changed: false }
      };
    const content = JSON.parse(decode(r.bytes));
    if (content.protocol !== "hwpjs.native-snapshot/1" || content.projection !== "plain-body-v1" || !["hwp5", "hwpx"].includes(content.format) || !Array.isArray(content.paragraphs) || content.nativeRevision !== revision || !Array.isArray(content.historyRevisions))
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
      capabilities: {
        nativeContext: true,
        projection: "plain-body-v1",
        fullLayout: false,
        canvas: false,
        nativeIme: false
      },
      ...mutation ? { applied: mutation.meta.application === "applied", meta: mutation.meta } : {}
    };
  }
  return {
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
        if (Object.keys(message).some((key) => key !== "kind"))
          return failure(kind, "NativeEnableOptionsUnsupported");
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
      if (kind === "query-current-text") {
        const r = await snapshot(kind);
        if (r.error)
          return r;
        const rows = r.content.paragraphs;
        const row = rows.find((p) => p.section === message.section && p.paragraph === message.paragraph);
        return row ? { kind, text: row.text } : failure(kind, "NativeParagraphNotFound");
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
function createNativeContextProvider(binding) {
  return createNativeProvider2(binding ? { createTransport: () => createNativeContextTransport(binding) } : {});
}
export {
  NativeBackendUnavailableError2 as NativeBackendUnavailableError,
  NativeRuntimeError2 as NativeRuntimeError,
  createNativeContextPort,
  createNativeContextProvider,
  createNativeContextTransport,
  createNativeController,
  createNativeEditorController,
  createNativeProvider2 as createNativeProvider,
  createNativeProviderFromJsi2 as createNativeProviderFromJsi,
  createNativeRuntimeFactory2 as createNativeRuntimeFactory
};
