// renderer-generic.test.ts — generic spec walker tests.
import { describe, it, expect, vi } from "vitest";
import { renderGeneric, type GenericRegistry, type RenderContext } from "./renderer-generic";
import { createStore, getByPath } from "./store";
import type { Spec } from "./spec";

function makeStore(data: Record<string, unknown> = {}) {
  return createStore(data);
}

describe("renderGeneric", () => {
  // ── Basic rendering ──

  it("renders a minimal one-element spec", () => {
    const spec: Spec = {
      root: "a",
      elements: { a: { type: "Text" } },
    };
    const registry: GenericRegistry = {
      Text: () => "hello",
    };
    expect(renderGeneric(spec, makeStore(), registry)).toBe("hello");
  });

  it("returns null for null spec", () => {
    expect(renderGeneric(null, makeStore(), {})).toBeNull();
  });

  it("returns null when root element not in spec", () => {
    const spec: Spec = {
      root: "missing",
      elements: {},
    };
    expect(renderGeneric(spec, makeStore(), {})).toBeNull();
  });

  // ── Props pass-through (raw, not resolved) ──

  it("passes props raw — expression objects NOT resolved by renderer", () => {
    const spec: Spec = {
      root: "x",
      elements: { x: { type: "T", props: { text: { $state: "/title" } } } },
    };
    const registry: GenericRegistry = {
      T: (props) => props,
    };
    expect(renderGeneric(spec, makeStore({ title: "Report" }), registry)).toEqual({
      text: { $state: "/title" },
    });
  });

  it("passes plain values through unchanged", () => {
    const spec: Spec = {
      root: "x",
      elements: { x: { type: "T", props: { count: 42, label: "Hi" } } },
    };
    const registry: GenericRegistry = {
      T: (props) => props,
    };
    expect(renderGeneric(spec, makeStore(), registry)).toEqual({ count: 42, label: "Hi" });
  });

  it("passes empty object for undefined props", () => {
    const spec: Spec = {
      root: "x",
      elements: { x: { type: "T" } },
    };
    const registry: GenericRegistry = {
      T: (props) => props,
    };
    expect(renderGeneric(spec, makeStore(), registry)).toEqual({});
  });

  // ── RenderContext ──

  it("ctx contains store, basePath, and index at root", () => {
    const spec: Spec = {
      root: "x",
      elements: { x: { type: "T" } },
    };
    const store = makeStore();
    const registry: GenericRegistry = {
      T: (_props, _children, ctx) => ctx,
    };
    const ctx = renderGeneric(spec, store, registry) as RenderContext;
    expect(ctx.store).toBe(store);
    expect(ctx.basePath).toBe("");
    expect(ctx.index).toBeUndefined();
  });

  it("ctx.basePath is set inside repeat", () => {
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Wrapper", repeat: { path: "/rows" }, children: ["item"] },
        item: { type: "Item", props: { name: { $item: "name" } } },
      },
    };
    const store = makeStore({ rows: [{ name: "A" }, { name: "B" }] });
    const paths: string[] = [];
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
      Item: (_props, _children, ctx) => {
        paths.push(ctx.basePath);
        return null;
      },
    };
    renderGeneric(spec, store, registry);
    expect(paths).toEqual(["/rows/0", "/rows/1"]);
  });

  it("ctx.index is set inside repeat", () => {
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Wrapper", repeat: { path: "/rows" }, children: ["item"] },
        item: { type: "Item" },
      },
    };
    const store = makeStore({ rows: [{}, {}, {}] });
    const indices: (string | number | undefined)[] = [];
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
      Item: (_props, _children, ctx) => {
        indices.push(ctx.index);
        return null;
      },
    };
    renderGeneric(spec, store, registry);
    expect(indices).toEqual([0, 1, 2]);
  });

  it("registry can resolve $state manually via ctx.store", () => {
    const spec: Spec = {
      root: "x",
      elements: { x: { type: "T", props: { text: { $state: "/title" } } } },
    };
    const store = makeStore({ title: "Report" });
    const registry: GenericRegistry = {
      T: (props, _children, ctx) =>
        getByPath(ctx.store.getState(), (props.text as { $state: string }).$state),
    };
    expect(renderGeneric(spec, store, registry)).toBe("Report");
  });

  it("registry can resolve $item manually via ctx.basePath", () => {
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Wrapper", repeat: { path: "/rows" }, children: ["item"] },
        item: { type: "Item", props: { label: { $item: "name" } } },
      },
    };
    const store = makeStore({ rows: [{ name: "A" }, { name: "B" }] });
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
      Item: (props, _children, ctx) => {
        const field = (props.label as { $item: string }).$item;
        return getByPath(ctx.store.getState(), `${ctx.basePath}/${field}`);
      },
    };
    expect(renderGeneric(spec, store, registry)).toEqual(["A", "B"]);
  });

  it("registry can resolve $index manually via ctx.index", () => {
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Wrapper", repeat: { path: "/rows" }, children: ["item"] },
        item: { type: "Item", props: { idx: { $index: true } } },
      },
    };
    const store = makeStore({ rows: [{}, {}, {}] });
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
      Item: (_props, _children, ctx) => ctx.index,
    };
    expect(renderGeneric(spec, store, registry)).toEqual([0, 1, 2]);
  });

  // ── Repeat handling ──

  it("repeats over array", () => {
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Wrapper", repeat: { path: "/items" }, children: ["row"] },
        row: { type: "Row" },
      },
    };
    const store = makeStore({ items: [1, 2, 3] });
    const callCounts: number[] = [];
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
      Row: () => {
        callCounts.push(1);
        return "row";
      },
    };
    const result = renderGeneric(spec, store, registry);
    expect(result).toEqual(["row", "row", "row"]);
    expect(callCounts).toHaveLength(3);
  });

  it("repeats over object entries", () => {
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Wrapper", repeat: { path: "/dict" }, children: ["row"] },
        row: { type: "Row" },
      },
    };
    const store = makeStore({ dict: { a: { val: 1 }, b: { val: 2 } } });
    const paths: string[] = [];
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
      Row: (_props, _children, ctx) => {
        paths.push(ctx.basePath);
        return null;
      },
    };
    renderGeneric(spec, store, registry);
    expect(paths).toEqual(["/dict/a", "/dict/b"]);
  });

  it("repeat with $state expression in path", () => {
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Wrapper", repeat: { path: { $state: "/targetPath" } }, children: ["row"] },
        row: { type: "Row" },
      },
    };
    const store = makeStore({ targetPath: "/rows", rows: [{}, {}] });
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
      Row: () => "r",
    };
    expect(renderGeneric(spec, store, registry)).toEqual(["r", "r"]);
  });

  it("repeat with $item expression in path", () => {
    const spec: Spec = {
      root: "outer",
      elements: {
        outer: { type: "Wrapper", repeat: { path: "/groups" }, children: ["inner"] },
        inner: { type: "Wrapper", repeat: { path: { $item: "sub" } }, children: ["row"] },
        row: { type: "Row" },
      },
    };
    const store = makeStore({
      groups: [
        { sub: [{}, {}] },
        { sub: [{}] },
      ],
    });
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
      Row: () => "r",
    };
    const result = renderGeneric(spec, store, registry) as unknown[][];
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(2);
    expect(result[1]).toHaveLength(1);
  });

  it("repeat over non-iterable renders empty children", () => {
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Wrapper", repeat: { path: "/nothing" }, children: ["row"] },
        row: { type: "Row" },
      },
    };
    const store = makeStore({ nothing: "not-an-array" });
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
      Row: () => "r",
    };
    expect(renderGeneric(spec, store, registry)).toEqual([]);
  });

  it("repeat over empty array renders empty children", () => {
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Wrapper", repeat: { path: "/empty" }, children: ["row"] },
        row: { type: "Row" },
      },
    };
    const store = makeStore({ empty: [] });
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
      Row: () => "r",
    };
    expect(renderGeneric(spec, store, registry)).toEqual([]);
  });

  it("repeat with children undefined does not crash (array)", () => {
    const spec: Spec = {
      root: "list",
      elements: {
        // @ts-expect-error — testing missing children
        list: { type: "Wrapper", repeat: { path: "/items" } },
      },
    };
    const store = makeStore({ items: [1, 2] });
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
    };
    expect(renderGeneric(spec, store, registry)).toEqual([]);
  });

  it("repeat with children undefined does not crash (object)", () => {
    const spec: Spec = {
      root: "list",
      elements: {
        // @ts-expect-error — testing missing children
        list: { type: "Wrapper", repeat: { path: "/dict" } },
      },
    };
    const store = makeStore({ dict: { a: {} } });
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
    };
    expect(renderGeneric(spec, store, registry)).toEqual([]);
  });

  it("repeat with $state resolving to non-string results in empty children", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Wrapper", repeat: { path: { $state: "/bad" } }, children: ["row"] },
        row: { type: "Row" },
      },
    };
    const store = makeStore({ bad: 42 });
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
      Row: () => "r",
    };
    expect(renderGeneric(spec, store, registry)).toEqual([]);
    warn.mockRestore();
  });

  it("repeat with $state resolving to undefined results in empty children", () => {
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Wrapper", repeat: { path: { $state: "/missing" } }, children: ["row"] },
        row: { type: "Row" },
      },
    };
    const store = makeStore({});
    const registry: GenericRegistry = {
      Wrapper: (_p, children) => children,
      Row: () => "r",
    };
    expect(renderGeneric(spec, store, registry)).toEqual([]);
  });

  // ── Missing elements / types ──

  it("warns on missing element key", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const spec: Spec = {
      root: "a",
      elements: { a: { type: "T", children: ["missing"] } },
    };
    const registry: GenericRegistry = { T: (_p, children) => children };
    const result = renderGeneric(spec, makeStore(), registry);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('missing element "missing"'),
    );
    expect(result).toEqual([null]);
    warn.mockRestore();
  });

  it("warns on missing registry type", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const spec: Spec = {
      root: "a",
      elements: { a: { type: "Unknown" } },
    };
    const result = renderGeneric(spec, makeStore(), {});
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('no registry entry for type "Unknown"'),
    );
    expect(result).toBeNull();
    warn.mockRestore();
  });

  // ── Children composition ──

  it("passes empty children array for element with no children", () => {
    const spec: Spec = {
      root: "a",
      elements: { a: { type: "T" } },
    };
    const registry: GenericRegistry = {
      T: (_props, children) => children,
    };
    expect(renderGeneric(spec, makeStore(), registry)).toEqual([]);
  });

  it("passes rendered children array to parent", () => {
    const spec: Spec = {
      root: "parent",
      elements: {
        parent: { type: "P", children: ["a", "b"] },
        a: { type: "T", props: { id: "a" } },
        b: { type: "T", props: { id: "b" } },
      },
    };
    const registry: GenericRegistry = {
      P: (_p, children) => children,
      T: (props) => props.id,
    };
    expect(renderGeneric(spec, makeStore(), registry)).toEqual(["a", "b"]);
  });

  it("deeply nested children render correctly", () => {
    const spec: Spec = {
      root: "a",
      elements: {
        a: { type: "A", children: ["b"] },
        b: { type: "B", children: ["c"] },
        c: { type: "C", props: { val: 42 } },
      },
    };
    const registry: GenericRegistry = {
      A: (_p, children) => ({ a: children }),
      B: (_p, children) => ({ b: children }),
      C: (props) => ({ c: props.val }),
    };
    expect(renderGeneric(spec, makeStore(), registry)).toEqual({
      a: [{ b: [{ c: 42 }] }],
    });
  });
});
