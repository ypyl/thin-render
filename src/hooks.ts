// hooks.ts — store hooks + emit builder.
//
// useValue uses useSyncExternalStore with a per-path subscribe/getSnapshot so
// a component re-renders ONLY when the value at its path changes. This is the
// granular re-render contract. See specs/path-based-store/spec.md and
// specs/action-system/spec.md.
import {
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  createContext,
} from "react";
import {
  StoreContext,
  ActionContext,
  type ActionContextValue,
} from "./contexts";
import type { OnMap, ActionBinding } from "./spec";
import { getByPath } from "./store";
import { resolveExpressions, resolveRepeatPath } from "./expressions";

// ── Repeat scope contexts (used by renderer + hooks) ──────────────

export const PathContext = createContext<string>("");
export const RepeatIndexContext = createContext<string | number | undefined>(undefined);

/** Hook for descendant components to get parent repeat's base path. */
export function usePath(): string {
  return useContext(PathContext);
}

/** Hook for descendant components to get parent repeat's numeric index. */
export function useRepeatIndex(): string | number | undefined {
  return useContext(RepeatIndexContext);
}

/** Return the stable store; throws if no provider. */
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}

/**
 * Subscribe to a single path. Re-renders only when that path's value changes
 * (by strict equality of the resolved snapshot).
 */
export function useValue<T>(path: string): T | undefined {
  const store = useStore();
  // subscribe returns an unsubscribe fn; React caches it across renders when
  // stable. Bind to `store` + `path`.
  const subscribe = useCallback(
    (listener: () => void) => store.subscribe(path, listener),
    [store, path],
  );
  const getSnapshot = useCallback(() => getByPath(store.getState(), path), [
    store,
    path,
  ]);
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  ) as T | undefined;
}

/** Stable setter for a path. */
export function useSetValue(path: string): (value: unknown) => void {
  const store = useStore();
  return useCallback(
    (value: unknown) => store.set(path, value),
    [store, path],
  );
}

/** Two-way bind: [currentValue, setValue]. */
export function useBound<T>(path: string): [T | undefined, (value: T) => void] {
  const value = useValue<T>(path);
  const setRaw = useSetValue(path);
  const set = useCallback((v: T) => setRaw(v), [setRaw]);
  return [value, set];
}

/**
 * Subscribe to a value derived from the store.
 *
 * Re-renders ONLY when the selector's result changes (Object.is), regardless
 * of how many store paths changed underneath. Unlike `useValue`, which
 * subscribes to one path and re-renders on every write to it, the snapshot
 * here is the computed value itself — so writes that don't change the result
 * do not re-render the component.
 *
 * Example: re-render only when `/editKey` becomes (or stops being) "Main":
 *
 *   const isMain = useSelector((s) => getByPath(s, "/editKey") === "Main");
 *
 * Caveats:
 * - The selector must return a stable reference when the derived value is
 *   unchanged (a primitive, or a memoized object/array). A fresh literal each
 *   call violates useSyncExternalStore's snapshot contract and can loop.
 * - The subscription is coarse: it listens to the whole store, so the component
 *   is notified on every set() and React bails out when the snapshot is equal.
 *   For hot paths prefer composing narrow `useValue` calls instead.
 */
export function useSelector<T>(selector: (state: unknown) => T): T {
  const store = useStore();
  const subscribe = useCallback(
    (listener: () => void) => store.subscribe("", listener),
    [store],
  );
  const getSnapshot = useCallback(
    () => selector(store.getState()),
    [store, selector],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as T;
}

/** Resolve `{ $state: "<path>" }` references in action params at dispatch time. Recurses into nested objects.
 * Also resolves `{ $item: "<field>" }` to `${basePath}/${field}` and `{ $index: boolean }` to the numeric index. */
export function resolveParams(
  params: Record<string, unknown>,
  getState: () => unknown,
  repeatBasePath?: string,
  repeatIndex?: string | number,
): Record<string, unknown> {
  return resolveExpressions(params, getState, repeatBasePath, repeatIndex);
}

/**
 * Build a stable `emit(event)` closure dispatching the element's action
 * bindings. `emit` reads state on-demand (never subscribes) and invokes
 * handlers with `{ getState, setState }`. Dispatch itself never re-renders —
 * only subsequent setState calls do.
 */
export function useEmit(on?: OnMap): (event: string) => Promise<void> | void {
  const ctxRaw = useContext(ActionContext);
  if (!ctxRaw) throw new Error("useEmit must be used within an ActionProvider");
  const ctx: ActionContextValue = ctxRaw;

  // Capture repeat scope at the element's position (static per element)
  const repeatPath = usePath();
  const repeatIdx = useRepeatIndex();

  return useMemo(() => {
    async function emit(eventName: string): Promise<void> {
      if (!on) {
        console.warn(`thin-render: emit("${eventName}") called but element has no "on" bindings`);
        return;
      }
      const binding = on[eventName];
      if (!binding) {
        console.warn(
          `thin-render: emit("${eventName}") — event not found in on map. ` +
            `Available events: ${Object.keys(on).join(", ") || "(none)"}`,
        );
        return;
      }
      const bindings: ActionBinding[] = Array.isArray(binding)
        ? binding
        : [binding];
      for (const b of bindings) {
        const handler = ctx.handlers[b.action];
        if (!handler) {
          if (b.action !== "setState") {
            console.warn(`thin-render: no handler registered for "${b.action}"`);
          }
          continue;
        }
        const resolved = b.params
          ? resolveParams(b.params, ctx.getState, repeatPath, repeatIdx)
          : {};
        await handler(resolved, {
          getState: ctx.getState,
          setState: ctx.setState,
        });
      }
    }
    return emit;
  }, [on, ctx, repeatPath, repeatIdx]);
}

export type { ActionContextValue };

/**
 * Convenience hook for components to resolve `$item` expressions in props.
 * String → passthrough. `{ $item: "<field>" }` → `${repeatPath}/${field}`.
 * `{ $item: "" }` → repeatPath. Outside repeat → undefined.
 */
export function useItemPath(expr: unknown): string | undefined {
  const base = usePath();
  return resolveRepeatPath(expr, undefined, base);
}

/**
 * Resolve a repeat.path expression to an absolute store path.
 * - string → passthrough (no subscription)
 * - `{ $item: "<field>" }` → resolved against PathContext (no subscription)
 * - `{ $state: "<path>" }` → reads the store value at <path> (subscribes)
 * - otherwise → undefined
 */
export function useResolvedPath(expr: unknown): string | undefined {
  // $item expression — delegate to resolveRepeatPath (context-only, no subscription)
  if (
    expr !== null &&
    typeof expr === "object" &&
    !Array.isArray(expr) &&
    typeof (expr as Record<string, unknown>).$item === "string"
  ) {
    const base = usePath();
    return resolveRepeatPath(expr, undefined, base);
  }

  // $state expression — read from store (subscribes to the pointer path)
  if (
    expr !== null &&
    typeof expr === "object" &&
    !Array.isArray(expr) &&
    typeof (expr as Record<string, unknown>).$state === "string"
  ) {
    const pointerPath = (expr as { $state: string }).$state;
    const resolved = useValue<unknown>(pointerPath);
    if (typeof resolved === "string") return resolved;
    if (resolved !== undefined) {
      console.warn(
        `thin-render: $state expression at "${pointerPath}" resolved to non-string value, expected a path string`,
      );
    }
    return "";
  }

  // String passthrough
  if (typeof expr === "string") return expr;

  return undefined;
}