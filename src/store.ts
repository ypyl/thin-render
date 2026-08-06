// store.ts — path-based external store with granular per-path subscriptions.
//
// Path syntax is JSON-Pointer-like: segments separated by "/", optional
// leading "/". Example: "/items/0/name". Empty path "" = the root object.
//
// On `set(path, value)` listeners whose subscribed path overlaps the mutated
// path (equal, ancestor of, or descendant of) are notified. Subscribers on
// disjoint paths are NOT notified — this is the granular re-render guarantee.
// See specs/path-based-store/spec.md.

/** Normalise a path: strip a single leading "/", keep "" as root. */
export function normalizePath(path: string): string {
  if (!path) return "";
  if (path[0] === "/") return path.slice(1);
  return path;
}

/** Split a path into segments. Empty path → []. */
export function segmentsOf(path: string): string[] {
  const p = normalizePath(path);
  if (p === "") return [];
  return p.split("/").filter((s) => s.length > 0);
}

/** Read a nested value by path; returns undefined if any segment is missing. */
export function getByPath(state: unknown, path: string): unknown {
  const segments = segmentsOf(path);
  let cur: unknown = state;
  for (const seg of segments) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/**
 * Immutably set a value at a path. Only objects/arrays along the path are
 * shallow-cloned; siblings (and unrelated branches) keep their references.
 */
export function immutableSetByPath(
  root: unknown,
  path: string,
  value: unknown,
): unknown {
  const segments = segmentsOf(path);
  if (segments.length === 0) return value;

  // Root must be a container; coerce when needed.
  const base =
    root !== null && typeof root === "object" && !Array.isArray(root)
      ? { ...(root as Record<string, unknown>) }
      : Array.isArray(root)
        ? [...(root as unknown[])]
        : {};

  let current: Record<string, unknown> | unknown[] = base;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]!;
    const nextSeg = segments[i + 1]!;
    let child = (current as Record<string, unknown>)[seg];
    if (Array.isArray(child)) {
      child = [...child];
    } else if (child !== null && typeof child === "object") {
      child = { ...(child as Record<string, unknown>) };
    } else {
      // Missing/non-container: create one matching the next segment shape.
      child = /^\d+$/.test(nextSeg) ? [] : {};
    }
    (current as Record<string, unknown>)[seg] = child;
    current = child as Record<string, unknown> | unknown[];
  }

  const last = segments[segments.length - 1]!;
  if (Array.isArray(current)) {
    (current as unknown[])[parseInt(last, 10)] = value;
  } else {
    (current as Record<string, unknown>)[last] = value;
  }
  return base;
}

/** Whether two paths overlap (equal / ancestor / descendant). */
export function pathsOverlap(a: string, b: string): boolean {
  if (a === b) return true;
  const segA = segmentsOf(a);
  const segB = segmentsOf(b);
  const min = Math.min(segA.length, segB.length);
  for (let i = 0; i < min; i++) {
    if (segA[i] !== segB[i]) return false;
  }
  return true; // one is a prefix of the other
}

/**
 * Listener registered for a specific path. Re-render granularity depends on
 * only notifying listeners whose path overlaps the mutated path.
 */
export type Listener = () => void;

export interface Store {
  /** Read the value at a path. */
  get: (path: string) => unknown;
  /** Immutably set a value at a path and notify overlapping subscribers. */
  set: (path: string, value: unknown) => void;
  /** Subscribe to changes overlapping `path`; returns an unsubscribe fn. */
  subscribe: (path: string, listener: Listener) => () => void;
  /** Live snapshot of the entire state (read on-demand, never for render). */
  getState: () => unknown;
}

/** Options for {@link createStore}. */
export interface StoreOptions {
  /** Log every `set()` call to the console. */
  debug?: boolean;
  /** Custom logger. Defaults to `console.log`. */
  log?: (...args: unknown[]) => void;
}

/**
 * Create a path-prefixed view of an existing store: every path is rebased
 * onto `basePath`, so a nested spec package can treat a subtree of the
 * parent store as its own root. No data is copied and no listener registry
 * is kept — all four methods delegate to the underlying store, so per-path
 * subscription granularity is preserved (writes outside the base subtree
 * never notify view subscribers). See specs/store-views/spec.md.
 */
export function createStoreView(store: Store, basePath: string): Store {
  const base = normalizePath(basePath);
  // Empty path → exactly basePath (never basePath + "/"); leading "/" optional.
  const join = (path: string) => {
    const p = normalizePath(path);
    return p ? `${base}/${p}` : base;
  };
  return {
    get: (path) => store.get(join(path)),
    set: (path, value) => store.set(join(path), value),
    subscribe: (path, listener) => store.subscribe(join(path), listener),
    // Snapshot scoped to the subtree so paths given to get/set/subscribe are
    // relative to it (useValue reads via getByPath(getState(), path)).
    getState: () => store.get(base),
  };
}

/** Create an in-memory store with per-path subscriptions. */
export function createStore(
  initial: Record<string, unknown> = {},
  options: StoreOptions = {},
): Store {
  let state: unknown = { ...initial };
  const listeners = new Map<string, Set<Listener>>();
  const { debug = false, log = console.log } = options;

  function notify(affected: string) {
    for (const [subscribedPath, set] of listeners) {
      if (pathsOverlap(subscribedPath, affected)) {
        for (const fn of set) fn();
      }
    }
  }

  return {
    get(path: string) {
      return getByPath(state, path);
    },

    set(path: string, value: unknown) {
      const prev = getByPath(state, path);
      if (prev === value) return;
      if (debug) log(`[store] ${path}:`, prev, "→", value);
      state = immutableSetByPath(state, path, value);
      notify(path);
    },

    subscribe(path: string, listener: Listener) {
      let set = listeners.get(path);
      if (!set) {
        set = new Set();
        listeners.set(path, set);
      }
      set.add(listener);
      return () => {
        set?.delete(listener);
        if (set && set.size === 0) listeners.delete(path);
      };
    },

    getState() {
      return state;
    },
  };
}