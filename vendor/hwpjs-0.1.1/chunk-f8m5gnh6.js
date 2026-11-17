// packages/react-native/src/provider.ts
import { createEditor } from "@ohah/hwpjs";

// packages/react-native/src/native/owned-dto.ts
function copyTransportDTO(value, seen = new Set) {
  if (value === null || value === undefined || typeof value === "string" || typeof value === "boolean")
    return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw TypeError("NativeInvalidNumber");
    return value;
  }
  if (typeof value !== "object")
    throw TypeError("NativeUnsupportedPayload");
  if (typeof SharedArrayBuffer !== "undefined" && (value instanceof SharedArrayBuffer || ArrayBuffer.isView(value) && value.buffer instanceof SharedArrayBuffer))
    throw TypeError("NativeSharedBufferUnsupported");
  if (value instanceof Uint8Array)
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice();
  if (value instanceof ArrayBuffer)
    return value.slice(0);
  if (seen.has(value))
    throw TypeError("NativeCyclicPayload");
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      const result = new Array(value.length);
      for (const key of Reflect.ownKeys(value)) {
        if (key === "length")
          continue;
        if (typeof key !== "string")
          throw TypeError("NativeUnsupportedPayload");
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!("value" in descriptor))
          throw TypeError("NativeAccessorPayloadUnsupported");
        Object.defineProperty(result, key, {
          value: copyTransportDTO(descriptor.value, seen),
          enumerable: true,
          configurable: true,
          writable: true
        });
      }
      return result;
    }
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
      throw TypeError("NativeUnsupportedPayload");
    const result = Object.create(null);
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string")
        throw TypeError("NativeUnsupportedPayload");
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!("value" in descriptor))
        throw TypeError("NativeAccessorPayloadUnsupported");
      result[key] = copyTransportDTO(descriptor.value, seen);
    }
    return result;
  } finally {
    seen.delete(value);
  }
}

// packages/react-native/src/native/transport.ts
class NativeBackendUnavailableError2 extends Error {
  code = "NativeBackendUnavailable";
  constructor() {
    super("NativeBackendUnavailable: inject a native shared-provider transport; no WebView fallback");
    this.name = "NativeBackendUnavailableError";
  }
}

class NativeRuntimeError2 extends Error {
  code;
  constructor(code) {
    super(code);
    this.code = code;
    this.name = "NativeRuntimeError";
  }
}

// packages/react-native/src/native/runtime.ts
var adopted = new WeakSet;
var contextKeys = [
  "editorId",
  "documentId",
  "generation",
  "requestId",
  "operationRevision"
];
function isDescriptorValid(transport) {
  const d = transport.descriptor;
  return !!d && d.protocol === "hwpjs.editor-runtime/1" && d.abiVersion === 1 && d.projection === "shared-provider" && typeof d.implementation === "string" && d.implementation.length > 0;
}
function validateContext(context) {
  if (typeof context.editorId !== "string" || !context.editorId || !(context.documentId === null || typeof context.documentId === "string") || !["generation", "requestId", "operationRevision"].every((key) => {
    const value = context[key];
    return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
  }))
    throw new NativeRuntimeError2("NativeInvalidRequestContext");
}
async function adopt(transport) {
  if (!transport || typeof transport !== "object" || typeof transport.request !== "function" || typeof transport.invalidate !== "function" || typeof transport.dispose !== "function") {
    throw new NativeRuntimeError2("NativeInvalidTransport");
  }
  if (adopted.has(transport))
    throw new NativeRuntimeError2("NativeTransportAlreadyOwned");
  adopted.add(transport);
  try {
    if (!isDescriptorValid(transport))
      throw new NativeRuntimeError2("NativeTransportProtocolMismatch");
  } catch (error) {
    const failures = [error];
    try {
      transport.invalidate();
    } catch (cause) {
      failures.push(cause);
    }
    try {
      await transport.dispose();
    } catch (cause) {
      failures.push(cause);
    }
    if (failures.length > 1)
      throw new AggregateError(failures, "NativeTransportAdoptionFailed");
    throw error;
  }
  const send = transport.request.bind(transport);
  const invalidate = transport.invalidate.bind(transport);
  const release = transport.dispose.bind(transport);
  let terminal = false;
  let pending;
  let disposal;
  return Object.freeze({
    request(message, context) {
      if (terminal)
        return Promise.reject(new NativeRuntimeError2("NativeRuntimeDisposed"));
      if (pending)
        return Promise.reject(new NativeRuntimeError2("NativeRuntimeBusy"));
      let owned, ownedContext;
      try {
        owned = copyTransportDTO(message);
        if (!owned || typeof owned.kind !== "string" || !owned.kind)
          throw new NativeRuntimeError2("NativeInvalidMessage");
        ownedContext = context === undefined ? undefined : copyTransportDTO(context);
        if (ownedContext !== undefined)
          validateContext(ownedContext);
      } catch (error) {
        return Promise.reject(error);
      }
      const expected = ownedContext === undefined ? undefined : { ...ownedContext };
      const operation = Promise.resolve().then(() => {
        if (terminal)
          throw new NativeRuntimeError2("NativeRuntimeDisposed");
        return send(owned, ownedContext);
      }).then((reply) => {
        if (terminal)
          throw new NativeRuntimeError2("NativeRuntimeDisposed");
        const result = copyTransportDTO(reply);
        if (!result || typeof result.kind !== "string" || !result.kind || result.error !== undefined && typeof result.error !== "string" || result.applied !== undefined && typeof result.applied !== "boolean" || result.meta !== undefined && (result.meta === null || typeof result.meta !== "object" || Array.isArray(result.meta)) || result.meta?.application !== undefined && !["unapplied", "applied", "unknown"].includes(result.meta.application) || result.meta?.changed !== undefined && result.meta.changed !== null && typeof result.meta.changed !== "boolean") {
          throw new NativeRuntimeError2("NativeInvalidReply");
        }
        const returned = result.meta?.context;
        if (returned !== undefined && (expected === undefined || contextKeys.some((key) => returned[key] !== expected[key])))
          throw new NativeRuntimeError2("NativeMismatchedReply");
        return {
          ...result,
          meta: { ...result.meta, ...expected === undefined ? {} : { context: expected } }
        };
      });
      const guarded = operation.then((reply) => {
        pending = undefined;
        return reply;
      }, (error) => {
        pending = undefined;
        throw error;
      });
      pending = guarded.then(() => {}, () => {});
      return guarded;
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
      try {
        invalidate();
      } catch (error) {
        failures.push(error);
      }
      Promise.resolve(pending).then(async () => {
        try {
          await release();
        } catch (error) {
          failures.push(error);
        }
        if (failures.length)
          throw new AggregateError(failures, "NativeTransportDisposeFailed");
      }).then(resolve, reject);
      return disposal;
    }
  });
}
function createNativeRuntimeFactory2(factory) {
  return async () => {
    if (!factory)
      throw new NativeBackendUnavailableError2;
    return adopt(await factory());
  };
}

// packages/react-native/src/provider.ts
function createNativeProvider2(options = {}) {
  const factory = options.createTransport;
  if (factory !== undefined && typeof factory !== "function")
    throw TypeError("NativeInvalidTransportFactory");
  const runtimeFactory = createNativeRuntimeFactory2(factory);
  const availability = Object.freeze(factory ? { status: "configured", reason: "TransportValidatedOnCreation" } : { status: "unavailable", reason: "NativeBackendNotInstalled" });
  return Object.freeze({
    availability,
    runtimeFactory,
    createEditor(options = {}) {
      return createEditor({ ...options, runtimeFactory });
    }
  });
}
function createNativeProviderFromJsi2(binding) {
  if (binding === undefined || binding.transportState === "unavailable")
    return createNativeProvider2();
  const abi = binding.abiInfo;
  if (binding.transportState !== "configured" || !abi || abi.abiVersion !== 1 || abi.pointerBits !== 64 || ![abi.tokenSize, abi.bufferSize, abi.stateSize].every((value) => Number.isSafeInteger(value) && value > 0) || typeof binding.createTransport !== "function")
    throw Error("NativeJsiAbiMismatch");
  return createNativeProvider2({ createTransport: binding.createTransport.bind(binding) });
}

export { copyTransportDTO, NativeBackendUnavailableError2, NativeRuntimeError2, createNativeRuntimeFactory2, createNativeProvider2, createNativeProviderFromJsi2 };
