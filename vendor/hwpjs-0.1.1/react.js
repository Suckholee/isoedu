// packages/react/src/surface.ts
import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from "react";
import { createCanvasSurface } from "@ohah/hwpjs/vanilla";
function useCanvasSurface(options) {
  const { editor, environment } = options;
  const [root, setRoot] = useState(null);
  const rootRef = useRef(null);
  const surfaceRef = useRef(null);
  const disposal = useRef(null);
  const failedDisposal = useRef(false);
  const callbacks = useRef(options);
  useEffect(() => {
    callbacks.current = options;
  });
  const mountRef = useCallback((node) => {
    if (rootRef.current !== node)
      surfaceRef.current = null;
    rootRef.current = node;
    setRoot(node);
  }, []);
  const handle = useMemo(() => ({
    get element() {
      return rootRef.current;
    },
    get surface() {
      return surfaceRef.current;
    },
    focus() {
      return surfaceRef.current?.focus() ?? false;
    },
    setScale(value) {
      return surfaceRef.current?.setScale(value) ?? false;
    },
    getSelection() {
      return surfaceRef.current?.getSelection() ?? null;
    },
    flushComposition() {
      return surfaceRef.current?.flushComposition() ?? Promise.resolve("blocked");
    }
  }), []);
  useEffect(() => {
    if (!root)
      return;
    let live = true;
    let surface = null;
    const current = () => live && rootRef.current === root;
    const report = (error) => {
      if (!current())
        return;
      try {
        if (callbacks.current.onError)
          Promise.resolve(callbacks.current.onError(error)).catch(() => {});
        else
          console.error(error);
      } catch {}
    };
    const dispose = () => {
      const owned = surface;
      surface = null;
      if (surfaceRef.current === owned)
        surfaceRef.current = null;
      if (!owned)
        return;
      let pending;
      try {
        pending = Promise.resolve(owned.dispose());
      } catch (error) {
        pending = Promise.reject(error);
      }
      disposal.current = pending;
      const clear = () => {
        if (disposal.current === pending)
          disposal.current = null;
      };
      pending.then(clear, () => {
        failedDisposal.current = true;
        clear();
      });
    };
    const start = () => {
      if (!current())
        return;
      if (failedDisposal.current) {
        report(Error("CanvasSurfaceDisposalFailed"));
        return;
      }
      try {
        surface = createCanvasSurface({
          root,
          editor,
          environment,
          onStatus(message) {
            if (!current())
              return;
            try {
              Promise.resolve(callbacks.current.onStatus?.(message)).catch(report);
            } catch (error) {
              report(error);
            }
          }
        });
        if (current()) {
          surfaceRef.current = surface;
          const ready = callbacks.current.onReady?.(surface);
          if (ready)
            Promise.resolve(ready).catch((error) => {
              if (current()) {
                dispose();
                report(error);
                live = false;
              }
            });
        } else
          dispose();
      } catch (error) {
        dispose();
        report(error);
        live = false;
      }
    };
    const previous = disposal.current;
    if (previous)
      previous.then(start, report);
    else
      start();
    return () => {
      live = false;
      dispose();
    };
  }, [root, editor, environment]);
  return { mountRef, handle };
}
var CanvasSurface = forwardRef(function CanvasSurface({ editor, environment, onStatus, onReady, onError, style, ...attributes }, ref) {
  const { mountRef, handle } = useCanvasSurface({
    editor,
    environment,
    onStatus,
    onReady,
    onError
  });
  useImperativeHandle(ref, () => handle, [handle]);
  Reflect.deleteProperty(attributes, "children");
  Reflect.deleteProperty(attributes, "dangerouslySetInnerHTML");
  return createElement("div", {
    ...attributes,
    ref: mountRef,
    "data-hwpjs-react-surface": "",
    style: { ...style, height: "100%", minHeight: 0 }
  });
});
CanvasSurface.displayName = "CanvasSurface";
function useEditorState(editor) {
  const subscribe = useCallback((notify) => editor.registerStateListener(() => notify()), [editor]);
  const getSnapshot = useCallback(() => editor.getEditorState(), [editor]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
export {
  CanvasSurface,
  useCanvasSurface,
  useEditorState
};
