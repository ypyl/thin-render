// logStore.ts — a Store-shaped wrapper that records every write for debugging.
//
// The whole point of this demo: store debugging needs NO library support.
// `Store` is an interface and the Renderer accepts any implementation, so a
// decorating wrapper sees every set() call — from bindings, actions, and
// handlers alike — and can log path + previous value + new value.
import type { Store } from "thin-render";

export interface LogEntry {
  id: number;
  /** Path that was written ("" = root). */
  path: string;
  /** Value stored at the path before the write. */
  prev: unknown;
  /** Value the caller tried to store. */
  next: unknown;
  /** True when prev === next — the underlying store silently ignores these. */
  noop: boolean;
  /** Timestamp of the write. */
  at: number;
}

export interface LogStore {
  /** The wrapped store — pass this to <Renderer>. */
  store: Store;
  /** Snapshot of recorded entries, newest first. */
  getEntries(): LogEntry[];
  /** Notified whenever the entry list changes; returns an unsubscribe fn. */
  subscribe(listener: () => void): () => void;
  /** Empty the log. */
  clear(): void;
  /** Pause/unpause recording. The underlying store keeps working either way. */
  setPaused(paused: boolean): void;
}

declare global {
  interface Window {
    /**
     * The underlying (unwrapped) store, for console poking.
     *
     * Assigned by StoreDebugCase's effect (not here — StrictMode). Usage in
     * the DevTools console: window.__store.getState(), .get("/path"),
     * .set("/path", value). Console writes go through the same set() as
     * bindings/handlers, so they land in the wrapper's write log.
     */
    __store?: Store;
  }
}

let nextId = 1;

/**
 * Wrap a store so every `set` is recorded. Reads/subscriptions delegate
 * verbatim; `set` records an entry (prev read BEFORE delegating) and always
 * delegates — the underlying store stays authoritative, including its
 * same-value short-circuit.
 */
export function createLogStore(
  store: Store,
  { maxEntries = 100 }: { maxEntries?: number } = {},
): LogStore {
  let entries: LogEntry[] = [];
  let paused = false;
  const listeners = new Set<() => void>();

  function notify() {
    for (const fn of listeners) fn();
  }

  const wrapped: Store = {
    get: (path) => store.get(path),
    set: (path, value) => {
      const prev = store.get(path);
      if (!paused) {
        entries = [
          { id: nextId++, path, prev, next: value, noop: prev === value, at: Date.now() },
          ...entries,
        ].slice(0, maxEntries);
        notify();
      }
      store.set(path, value);
    },
    subscribe: (path, listener) => store.subscribe(path, listener),
    getState: () => store.getState(),
  };

  // window.__store is assigned by the case component (useEffect) — not here:
  // React StrictMode double-invokes useState initializers in dev, so an
  // assignment here could point at a discarded store.

  return {
    store: wrapped,
    getEntries: () => entries,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    clear: () => {
      entries = [];
      notify();
    },
    setPaused: (p) => {
      paused = p;
    },
  };
}
