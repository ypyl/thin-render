// nested-package/child/EmbeddedChild.tsx — the composition point.
//
// A registry component for PARENT specs. It:
//   1. resolves the occurrence's base path from element props
//      (plain string, or { $item: "field" } relative to the parent scope),
//   2. wraps the parent store in a createStoreView so the child package sees
//      its subtree as its own root — no copies, no sync bridges,
//   3. builds a `parent.*` bridge from the parent's ActionContext: params
//      resolved in the child's world pass through untouched, accessors are
//      the parent's, so the child can fire parent-level handlers.
import { useContext, useMemo } from "react";
import {
  Renderer,
  createStoreView,
  useStore,
  usePath,
  ActionContext,
  type ComponentProps,
  type Handlers,
} from "thin-render";
import childSpec from "./spec.json";
import { childRegistry } from "./registry";
import { childHandlers } from "./handlers";

function resolveBase(raw: unknown, scope: string): string | undefined {
  if (typeof raw === "string") return raw;
  if (raw !== null && typeof raw === "object") {
    const item = (raw as Record<string, unknown>).$item;
    if (typeof item === "string") return item ? `${scope}/${item}` : scope;
  }
  return undefined;
}

export function EmbeddedChild({ element }: ComponentProps) {
  const parentStore = useStore();
  const parentAction = useContext(ActionContext);
  const scope = usePath();

  const base = useMemo(
    () => resolveBase(element.props?.base, scope),
    [element.props?.base, scope],
  );

  const view = useMemo(
    () => (base !== undefined ? createStoreView(parentStore, base) : null),
    [parentStore, base],
  );

  // parent.<name> → parent handler with the parent's accessors; params pass
  // through untouched (already resolved in the child's world by its emit).
  const bridge = useMemo<Handlers>(() => {
    const out: Handlers = {};
    if (parentAction) {
      for (const [name, handler] of Object.entries(parentAction.handlers)) {
        out[`parent.${name}`] = (params, _api) =>
          handler(params, {
            getState: parentAction.getState,
            setState: parentAction.setState,
          });
      }
    }
    return out;
  }, [parentAction]);

  const handlers = useMemo(() => ({ ...childHandlers, ...bridge }), [bridge]);

  if (!view) return null;
  return (
    <Renderer
      spec={childSpec}
      registry={childRegistry}
      store={view}
      handlers={handlers}
    />
  );
}
