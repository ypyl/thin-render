// expressions.test.ts — pure expression resolution tests.
import { describe, it, expect, vi } from "vitest";
import { resolveExpressions, resolveRepeatPath, scopeDepth, scopeDepthOf } from "./expressions";

// ── resolveExpressions ────────────────────────────────────────────

describe("resolveExpressions", () => {
  const getState = () => ({ x: "val", deep: { nested: 42 }, items: ["a", "b"] });

  it("passes plain values through unchanged", () => {
    const result = resolveExpressions(
      { count: 42, label: "Hello", flag: true, nothing: null },
      getState,
    );
    expect(result).toEqual({ count: 42, label: "Hello", flag: true, nothing: null });
  });

  it("resolves $state expression from store", () => {
    const result = resolveExpressions({ text: { $state: "/x" } }, getState);
    expect(result.text).toBe("val");
  });

  it("resolves $state to undefined when path not found", () => {
    const result = resolveExpressions({ text: { $state: "/missing" } }, getState);
    expect(result.text).toBeUndefined();
  });

  it("resolves $state with nested path", () => {
    const result = resolveExpressions({ val: { $state: "/deep/nested" } }, getState);
    expect(result.val).toBe(42);
  });

  it("resolves $item expression against base path", () => {
    const result = resolveExpressions(
      { label: { $item: "name" } },
      getState,
      ["/items/2"],
    );
    expect(result.label).toBe("/items/2/name");
  });

  it("resolves $item empty string to base path", () => {
    const result = resolveExpressions(
      { path: { $item: "" } },
      getState,
      ["/items/2"],
    );
    expect(result.path).toBe("/items/2");
  });

  it("resolves $item to undefined when outside repeat (no basePath)", () => {
    const result = resolveExpressions({ label: { $item: "name" } }, getState);
    expect(result.label).toBeUndefined();
  });

  it("resolves $index true to numeric index", () => {
    const result = resolveExpressions(
      { idx: { $index: true } },
      getState,
      ["/base"],
      5,
    );
    expect(result.idx).toBe(5);
  });

  it("resolves $index false to undefined", () => {
    const result = resolveExpressions(
      { idx: { $index: false } },
      getState,
      ["/base"],
      5,
    );
    expect(result.idx).toBeUndefined();
  });

  it("resolves $index true to undefined when index is undefined", () => {
    const result = resolveExpressions(
      { idx: { $index: true } },
      getState,
      ["/base"],
    );
    expect(result.idx).toBeUndefined();
  });

  it("recurses into nested objects", () => {
    const result = resolveExpressions(
      { meta: { source: { $state: "/x" } } },
      getState,
    );
    expect(result.meta).toEqual({ source: "val" });
  });

  it("passes arrays through without expression resolution", () => {
    const result = resolveExpressions(
      { items: [{ $state: "/x" }], x: 1 },
      getState,
    );
    expect(result.items).toEqual([{ $state: "/x" }]);
    expect(result.x).toBe(1);
  });

  it("handles empty params", () => {
    const result = resolveExpressions({}, getState);
    expect(result).toEqual({});
  });

  it("handles mixed expressions and plain values", () => {
    const result = resolveExpressions(
      { name: "static", value: { $state: "/x" }, idx: { $index: true } },
      getState,
      ["/base"],
      0,
    );
    expect(result).toEqual({ name: "static", value: "val", idx: 0 });
  });

  // ── $scope offset ────────────────────────────────────────────────

  it("resolves $item with $scope against the parent scope", () => {
    const result = resolveExpressions(
      { colDefs: { $item: "colDefs", $scope: 1 } },
      getState,
      ["/tables/0/rows/2", "/tables/0"],
    );
    expect(result.colDefs).toBe("/tables/0/colDefs");
  });

  it("resolves $item with $scope and empty field to the ancestor base", () => {
    const result = resolveExpressions(
      { table: { $item: "", $scope: 1 } },
      getState,
      ["/tables/0/rows/2", "/tables/0"],
    );
    expect(result.table).toBe("/tables/0");
  });

  it("resolves $item with $scope 2 against the grandparent scope", () => {
    const result = resolveExpressions(
      { root: { $item: "meta", $scope: 2 } },
      getState,
      ["/a/0/b/1/c/2", "/a/0/b/1", "/a/0"],
    );
    expect(result.root).toBe("/a/0/meta");
  });

  it("resolves $item with out-of-range $scope to undefined", () => {
    const result = resolveExpressions(
      { colDefs: { $item: "colDefs", $scope: 5 } },
      getState,
      ["/tables/0/rows/2", "/tables/0"],
    );
    expect(result.colDefs).toBeUndefined();
  });

  it("resolves $item with invalid $scope to undefined", () => {
    for (const bad of [-1, 1.5, "1", true]) {
      const result = resolveExpressions(
        { colDefs: { $item: "colDefs", $scope: bad } },
        getState,
        ["/tables/0/rows/2", "/tables/0"],
      );
      expect(result.colDefs).toBeUndefined();
    }
  });

  it("resolves $item with $scope 0 explicitly like the default", () => {
    const result = resolveExpressions(
      { label: { $item: "name", $scope: 0 } },
      getState,
      ["/items/2"],
    );
    expect(result.label).toBe("/items/2/name");
  });

  it("resolves $item with $scope inside a nested params object", () => {
    const result = resolveExpressions(
      { meta: { table: { $item: "id", $scope: 1 } } },
      getState,
      ["/tables/0/rows/2", "/tables/0"],
    );
    expect(result.meta).toEqual({ table: "/tables/0/id" });
  });

  it("ignores $scope on $state expressions", () => {
    const result = resolveExpressions(
      { text: { $state: "/x", $scope: 1 } },
      getState,
      ["/tables/0/rows/2", "/tables/0"],
    );
    expect(result.text).toBe("val");
  });

  it("ignores $scope on $index expressions", () => {
    const result = resolveExpressions(
      { idx: { $index: true, $scope: 1 } },
      getState,
      ["/base"],
      5,
    );
    expect(result.idx).toBe(5);
  });
});

// ── resolveRepeatPath ─────────────────────────────────────────────

describe("resolveRepeatPath", () => {
  const getState = () => ({ targetPath: "/rows" });

  it("passes string through unchanged", () => {
    expect(resolveRepeatPath("/items", getState, "/base")).toBe("/items");
  });

  it("resolves $item expression against base path", () => {
    expect(resolveRepeatPath({ $item: "sub" }, getState, "/base")).toBe("/base/sub");
  });

  it("resolves $item empty string to base path", () => {
    expect(resolveRepeatPath({ $item: "" }, getState, "/base")).toBe("/base");
  });

  it("returns undefined for $item outside repeat", () => {
    expect(resolveRepeatPath({ $item: "sub" }, getState)).toBeUndefined();
  });

  it("resolves $state expression from store", () => {
    expect(resolveRepeatPath({ $state: "/targetPath" }, getState)).toBe("/rows");
  });

  it("returns empty string for non-string $state value", () => {
    const getState2 = () => ({ targetPath: 42 });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(resolveRepeatPath({ $state: "/targetPath" }, getState2)).toBe("");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("non-string value"),
    );
    warn.mockRestore();
  });

  it("returns undefined for $state with missing path", () => {
    const getState2 = () => ({});
    expect(resolveRepeatPath({ $state: "/missing" }, getState2)).toBe("");
  });

  it("returns undefined for unknown expression type", () => {
    expect(resolveRepeatPath(42, getState)).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(resolveRepeatPath(null, getState)).toBeUndefined();
  });
});

// ── scopeDepth / scopeDepthOf ─────────────────────────────────────

describe("scopeDepth", () => {
  it("defaults absent scope to 0", () => {
    expect(scopeDepth(undefined)).toBe(0);
  });

  it("passes non-negative integers through", () => {
    expect(scopeDepth(0)).toBe(0);
    expect(scopeDepth(2)).toBe(2);
  });

  it("maps invalid values to -1", () => {
    expect(scopeDepth(-1)).toBe(-1);
    expect(scopeDepth(1.5)).toBe(-1);
    expect(scopeDepth("1")).toBe(-1);
    expect(scopeDepth(true)).toBe(-1);
    expect(scopeDepth(null)).toBe(-1);
  });
});

describe("scopeDepthOf", () => {
  it("reads $scope from an expression object", () => {
    expect(scopeDepthOf({ $item: "colDefs", $scope: 2 })).toBe(2);
  });

  it("defaults to 0 for expression objects without $scope", () => {
    expect(scopeDepthOf({ $item: "colDefs" })).toBe(0);
  });

  it("defaults to 0 for non-objects", () => {
    expect(scopeDepthOf("/items")).toBe(0);
    expect(scopeDepthOf(null)).toBe(0);
    expect(scopeDepthOf(undefined)).toBe(0);
  });

  it("maps invalid $scope to -1", () => {
    expect(scopeDepthOf({ $item: "colDefs", $scope: -2 })).toBe(-1);
  });
});
