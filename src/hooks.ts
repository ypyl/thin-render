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
} from "./contexts.js";
import type { OnMap, ActionBinding } from "./spec.js";
import { getByPath } from "./store.js";
import { resolveExpressions, resolveRepeatPath, scopeDepth } from "./expressions.js";

// ── Repeat scope contexts (used by renderer + hooks) ──────────────

// PathContext holds a STACK of repeat-scope base paths, innermost first
// (e.g. ["/items/2/subitems/1", "/items/2"]). RepeatScope pushes; the
// Renderer boundary resets to a fresh root stack [""]. `$item` resolution
// and relative-path composition read only the innermost scope (stack[0]).
export const PathContext = createContext<string[]>([""]);
export const RepeatIndexContext = createContext<string | number | undefined>(undefined);

/**
 * Hook for descendant components to read repeat scopes.
 *
 * `usePath()` returns the innermost scope ("" at root) — unchanged behavior.
 * `usePath(offset)` returns the scope at that depth: 1 = parent scope,
 * 2 = grandparent, etc. Out-of-range offsets return `undefined`.
 */
export function usePath(): string;
export function usePath(offset: number): string | undefined;
export function usePath(offset = 0): string | undefined {
  const stack = useContext(PathContext);
  return stack[offset];
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
  return [value, useSetValue(path)];
}

/**
 * Subscribe to a value derived from a store path.
 *
 * `path` is the subscription **window**: the component is notified only on
 * writes that overlap the path (the path itself or any descendant), and the
 * derive receives the value at that path — so it can only read within the
 * window. Passing `""` widens the window to the whole store (derive receives
 * the entire state and every write notifies). Re-renders ONLY when the
 * derive's result changes (Object.is), regardless of how many writes occurred
 * inside the window.
 *
 * Example: re-render only when `/editKey` becomes (or stops being) "Main":
 *
 *   const isMain = useSelector("/editKey", (v) => v === "Main");
 *
 * The derive reads the resolved subtree directly (property access — no
 * `getByPath` needed). Multi-branch derives: use the root window `""` for
 * unrelated branches, or compose narrow calls (`useSelector("/items", ...)`
 * + `useSelector("/selectedId", ...)`) and combine in render.
 *
 * Caveats:
 * - The derive must return a stable reference when the derived value is
 *   unchanged (a primitive, or a memoized object/array). A fresh literal each
 *   call violates useSyncExternalStore's snapshot contract and can loop.
 * - Writes inside the window that don't change the derived value still notify
 *   the component (React bails out on equal snapshots). Choose the tightest
 *   window that covers every read.
 */
export function useSelector<T>(path: string, derive: (value: unknown) => T): T {
  const store = useStore();
  const subscribe = useCallback(
    (listener: () => void) => store.subscribe(path, listener),
    [store, path],
  );
  const getSnapshot = useCallback(
    () => derive(getByPath(store.getState(), path)),
    [store, path, derive],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as T;
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

  // Capture the repeat scope stack at the element's position (static per element)
  // so $item/$scope in params can resolve against ancestor scopes at dispatch.
  const scopes = useContext(PathContext);
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
          ? resolveExpressions(b.params, ctx.getState, scopes, repeatIdx)
          : {};
        await handler(resolved, {
          getState: ctx.getState,
          setState: ctx.setState,
        });
      }
    }
    return emit;
  }, [on, ctx, scopes, repeatIdx]);
}

export type { ActionContextValue };

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
    const item = expr as { $item: string; $scope?: unknown };
    // usePath(-1) returns undefined for invalid $scope (negative/non-integer),
    // mirroring out-of-range behavior; omitted $scope defaults to the innermost.
    const base = usePath(scopeDepth(item.$scope));
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