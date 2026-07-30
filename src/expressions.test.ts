// expressions.test.ts — pure expression resolution tests.
import { describe, it, expect, vi } from "vitest";
import { resolveExpressions, resolveRepeatPath } from "./expressions";

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
      "/items/2",
    );
    expect(result.label).toBe("/items/2/name");
  });

  it("resolves $item empty string to base path", () => {
    const result = resolveExpressions(
      { path: { $item: "" } },
      getState,
      "/items/2",
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
      "/base",
      5,
    );
    expect(result.idx).toBe(5);
  });

  it("resolves $index false to undefined", () => {
    const result = resolveExpressions(
      { idx: { $index: false } },
      getState,
      "/base",
      5,
    );
    expect(result.idx).toBeUndefined();
  });

  it("resolves $index true to undefined when index is undefined", () => {
    const result = resolveExpressions(
      { idx: { $index: true } },
      getState,
      "/base",
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
      "/base",
      0,
    );
    expect(result).toEqual({ name: "static", value: "val", idx: 0 });
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
