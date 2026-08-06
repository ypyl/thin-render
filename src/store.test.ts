// store.test.ts — self-checks for the path-based store.
// Imports from source; no inlined copies. Pure logic, no React.
import { describe, it, expect } from "vitest";
import {
  getByPath,
  immutableSetByPath,
  pathsOverlap,
  createStore,
  createStoreView,
} from "./store";

// ── Tests ─────────────────────────────────────────────────────────

describe("getByPath", () => {
  it("reads nested values and undefined for missing segments", () => {
    const s = { items: [{ name: "A", qty: 1 }] };
    expect(getByPath(s, "/items/0/name")).toBe("A");
    expect(getByPath(s, "items/0/qty")).toBe(1);
    expect(getByPath(s, "/items/99/name")).toBeUndefined();
    expect(getByPath(s, "/missing/deep")).toBeUndefined();
  });
});

describe("immutableSetByPath", () => {
  it("creates nested structure when absent", () => {
    const next = immutableSetByPath({}, "/a/b/c", 5) as Record<string, unknown>;
    expect(getByPath(next, "/a/b/c")).toBe(5);
  });

  it("preserves sibling branch identity (structural sharing)", () => {
    const before: Record<string, unknown> = {
      items: [
        { name: "A", qty: 1, meta: { x: 1 } },
        { name: "B", qty: 2, meta: { x: 2 } },
      ],
      other: { keep: true },
    };
    const item1Before = (before.items as unknown[])[1];
    const meta0Before = ((before.items as unknown[])[0] as Record<string, unknown>).meta;
    const otherBefore = before.other;

    const next = immutableSetByPath(before, "/items/0/name", "X") as Record<string, unknown>;
    const itemsNext = next.items as unknown[];
    expect(itemsNext[1]).toBe(item1Before);
    expect((itemsNext[0] as Record<string, unknown>).meta).toBe(meta0Before);
    expect(next.other).toBe(otherBefore);
    expect((itemsNext[0] as Record<string, unknown>).name).toBe("X");
    expect(((before.items as unknown[])[0] as Record<string, unknown>).name).toBe("A");
  });

  it("sets array index at terminal path", () => {
    const next = immutableSetByPath({ items: ["a", "b"] }, "/items/0", "X") as Record<string, unknown>;
    expect(next.items).toEqual(["X", "b"]);
  });

  it("coerces null root to empty object", () => {
    const next = immutableSetByPath(null, "/x", 42) as Record<string, unknown>;
    expect(getByPath(next, "/x")).toBe(42);
  });
});

describe("pathsOverlap", () => {
  it("equal, ancestor, descendant, disjoint", () => {
    expect(pathsOverlap("/items", "/items")).toBe(true);
    expect(pathsOverlap("/items", "/items/0")).toBe(true);
    expect(pathsOverlap("/items/0/name", "/items")).toBe(true);
    expect(pathsOverlap("/items/0", "/items/0/name")).toBe(true);
    expect(pathsOverlap("/other", "/items/0/name")).toBe(false);
    expect(pathsOverlap("/items/0/name", "/items/1/name")).toBe(false);
    expect(pathsOverlap("", "")).toBe(true);
    expect(pathsOverlap("", "/x")).toBe(true);
  });
});

describe("subscribe", () => {
  it("notifies exact match", () => {
    const store = createStore();
    let calls = 0;
    const unsub = store.subscribe("/x", () => calls++);
    store.set("/x", 1);
    expect(calls).toBe(1);
    unsub();
    store.set("/x", 2);
    expect(calls).toBe(1);
  });

  it("notifies ancestor when descendant is set", () => {
    const store = createStore({ items: [{ name: "A" }] });
    let calls = 0;
    store.subscribe("/items", () => calls++);
    store.set("/items/0/name", "B");
    expect(calls).toBe(1);
  });

  it("notifies descendant when ancestor is set (array replaced)", () => {
    const store = createStore({ items: [{ name: "A" }] });
    let calls = 0;
    store.subscribe("/items/0/name", () => calls++);
    store.set("/items", [{ name: "B" }]);
    expect(calls).toBe(1);
  });

  it("does not notify unrelated path", () => {
    const store = createStore();
    let calls = 0;
    store.subscribe("/other", () => calls++);
    store.set("/items/0/name", "A");
    expect(calls).toBe(0);
  });

  it("two listeners on same path both notified", () => {
    const store = createStore({ x: 1 });
    let a = 0, b = 0;
    store.subscribe("/x", () => a++);
    store.subscribe("/x", () => b++);
    store.set("/x", 2);
    expect(a).toBe(1);
    expect(b).toBe(1);
  });
});

describe("set", () => {
  it("no-op when strictly equal value does not notify", () => {
    const store = createStore({ x: 1 });
    let calls = 0;
    store.subscribe("/x", () => calls++);
    store.set("/x", 1);
    expect(calls).toBe(0);
    store.set("/x", 2);
    store.set("/x", 2);
    expect(calls).toBe(1);
  });
});

describe("immutableSetByPath edge cases", () => {
  it("handles array root", () => {
    const next = immutableSetByPath(["a", "b"], "/0", "X") as unknown[];
    expect(next).toEqual(["X", "b"]);
  });

  it("handles primitive number root", () => {
    const next = immutableSetByPath(42, "/x", 1) as Record<string, unknown>;
    expect(getByPath(next, "/x")).toBe(1);
  });

  it("handles undefined root", () => {
    const next = immutableSetByPath(undefined, "/x", 1) as Record<string, unknown>;
    expect(getByPath(next, "/x")).toBe(1);
  });

  it("handles boolean root", () => {
    const next = immutableSetByPath(false, "/x", 1) as Record<string, unknown>;
    expect(getByPath(next, "/x")).toBe(1);
  });

  it("empty path replaces entire root", () => {
    const next = immutableSetByPath({ x: 1 }, "", 42);
    expect(next).toBe(42);
  });
});

describe("unsubscribe edge cases", () => {
  it("does not remove path entry when other listeners remain", () => {
    const store = createStore({ x: 1 });
    let a = 0, b = 0;
    const unsubA = store.subscribe("/x", () => a++);
    store.subscribe("/x", () => b++);
    unsubA();
    store.set("/x", 2);
    expect(a).toBe(0);
    expect(b).toBe(1);
  });
});

describe("createStoreView", () => {
  it("get reads through to the base subtree", () => {
    const store = createStore({ a: { b: { x: 1 } } });
    const view = createStoreView(store, "/a/b");
    expect(view.get("/x")).toBe(1);
  });

  it("set writes through to the base subtree", () => {
    const store = createStore({ a: { b: {} } });
    const view = createStoreView(store, "/a/b");
    view.set("/x", 2);
    expect(store.get("/a/b/x")).toBe(2);
  });

  it("empty path addresses the base subtree", () => {
    const store = createStore({ a: { b: { x: 1 } } });
    const view = createStoreView(store, "/a/b");
    expect(view.get("")).toEqual({ x: 1 });
  });

  it("leading slash is optional", () => {
    const store = createStore({ a: { b: { x: 1 } } });
    const view = createStoreView(store, "/a/b");
    expect(view.get("/x")).toBe(1);
    expect(view.get("x")).toBe(1);
  });

  it("getState is subtree-scoped", () => {
    const store = createStore({ a: { b: { x: 1 }, y: 2 } });
    const view = createStoreView(store, "/a/b");
    expect(view.getState()).toEqual({ x: 1 });
  });

  it("write inside the subtree notifies", () => {
    const store = createStore({ a: { b: {} }, c: {} });
    const view = createStoreView(store, "/a/b");
    let calls = 0;
    view.subscribe("/x", () => calls++);
    store.set("/a/b/x", 1);
    expect(calls).toBe(1);
  });

  it("write outside the subtree does not notify", () => {
    const store = createStore({ a: { b: {} }, c: {} });
    const view = createStoreView(store, "/a/b");
    let calls = 0;
    view.subscribe("/x", () => calls++);
    store.set("/c/x", 1);
    expect(calls).toBe(0);
  });

  it("unsubscribe removes the delegated listener", () => {
    const store = createStore({ a: { b: {} } });
    const view = createStoreView(store, "/a/b");
    let calls = 0;
    const unsub = view.subscribe("/x", () => calls++);
    unsub();
    store.set("/a/b/x", 1);
    expect(calls).toBe(0);
  });

  it("set on missing base creates structure", () => {
    const store = createStore();
    const view = createStoreView(store, "/a/b");
    view.set("/x", 1);
    expect(store.get("/a/b/x")).toBe(1);
  });

  it("view of view reads through both prefixes", () => {
    const store = createStore({ a: { b: { x: 5 } } });
    const view = createStoreView(createStoreView(store, "/a"), "/b");
    expect(view.get("/x")).toBe(5);
  });
});

describe("debug mode", () => {
  it("logs set calls when debug is enabled", () => {
    const logs: unknown[][] = [];
    const store = createStore({ x: 1 }, { debug: true, log: (...args) => logs.push(args) });
    store.set("/x", 2);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toEqual(["[store] /x:", 1, "→", 2]);
  });

  it("does not log when debug is disabled (default)", () => {
    const logs: unknown[][] = [];
    const store = createStore({ x: 1 }, { log: (...args) => logs.push(args) });
    store.set("/x", 2);
    expect(logs).toHaveLength(0);
  });

  it("does not log no-op sets", () => {
    const logs: unknown[][] = [];
    const store = createStore({ x: 1 }, { debug: true, log: (...args) => logs.push(args) });
    store.set("/x", 1); // same value
    expect(logs).toHaveLength(0);
  });
});
