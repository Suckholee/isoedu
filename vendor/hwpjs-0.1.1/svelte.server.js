// packages/svelte/src/CanvasEditor.svelte
import * as $ from "svelte/internal/server";

// packages/svelte/src/lifecycle.ts
function createSurfaceLifecycle(root, create) {
  let latest, mounted;
  let surface, closed = false, epoch = 0;
  let failedDisposal = false;
  let statusOwner;
  let pending = Promise.resolve();
  const report = (error) => {
    try {
      latest?.onError?.(error);
    } catch {}
  };
  const disposeCurrent = async () => {
    statusOwner = undefined;
    const previous = surface;
    surface = undefined;
    mounted = undefined;
    if (previous) {
      try {
        await previous.dispose();
      } catch (error) {
        failedDisposal = true;
        throw error;
      }
    }
  };
  const sameHost = (a, b) => a?.editor === b.editor && a?.environment === b.environment;
  const schedule = (version) => {
    pending = pending.then(async () => {
      if (closed) {
        await disposeCurrent();
        return;
      }
      const next = latest;
      if (version !== epoch || failedDisposal)
        return;
      if (sameHost(mounted, next) && surface) {
        if (next.scale !== undefined)
          surface.setScale(next.scale);
        return;
      }
      await disposeCurrent();
      if (closed || version !== epoch)
        return;
      const owner = {};
      statusOwner = owner;
      const created = await create({
        root,
        editor: next.editor,
        environment: next.environment,
        onStatus: (message) => {
          if (!closed && statusOwner === owner)
            latest?.onStatus?.(message);
        }
      });
      surface = created;
      mounted = next;
      if (closed || !latest || !sameHost(next, latest)) {
        await disposeCurrent();
        return;
      }
      if (latest.scale !== undefined)
        created.setScale(latest.scale);
      latest?.onReady?.(created);
    }).catch(report);
  };
  return {
    update(props) {
      if (closed)
        return;
      latest = props;
      schedule(++epoch);
    },
    getSurface: () => surface,
    settled: () => pending,
    destroy() {
      if (!closed) {
        closed = true;
        ++epoch;
        schedule(epoch);
      }
      return pending;
    }
  };
}

// packages/svelte/src/action.ts
var canvasSurface = (root, props) => {
  const lifecycle = createSurfaceLifecycle(root, async (options) => {
    const { createCanvasSurface } = await import("@ohah/hwpjs/vanilla");
    return createCanvasSurface(options);
  });
  lifecycle.update(props);
  return {
    update(next) {
      lifecycle.update(next);
    },
    destroy() {
      lifecycle.destroy();
    }
  };
};

// packages/svelte/src/CanvasEditor.svelte
function CanvasEditor($$renderer, $$props) {
  let {
    editor,
    environment,
    scale,
    onStatus,
    onError,
    onReady,
    class: className,
    style,
    "aria-label": label = "Document editor"
  } = $$props;
  $$renderer.push(`<div${$.attr_class($.clsx(className))}${$.attr_style(style)}${$.attr("aria-label", label)}></div>`);
}
export {
  CanvasEditor,
  canvasSurface
};
