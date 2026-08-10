// renderer.test.tsx — tests for the Renderer and its internal components.
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { type ReactNode, createElement } from "react";
import { Renderer, type ComponentProps, type Registry } from "./renderer";
import { createStore } from "./store";
import type { Spec, UIElement } from "./spec";
import { usePath, useRepeatIndex, useValue } from "./hooks";

// ── Spy components ────────────────────────────────────────────────

/** Captures ComponentProps for later assertion. */
function makeSpy() {
  const called: { call: number; element: unknown; children: ReactNode; emit: unknown }[] = [];
  function SpyComponent({ element, children, emit }: ComponentProps) {
    called.push({ call: called.length, element, children, emit });
    return createElement("div", { "data-testid": "spy" }, children);
  }
  (SpyComponent as unknown as Record<string, unknown>).called = called;
  return SpyComponent as typeof SpyComponent & { called: typeof called };
}

// ── Helpers ───────────────────────────────────────────────────────

function makeSpec(overrides: Partial<Spec> = {}): Spec {
  return {
    root: "r",
    elements: {
      r: { type: "Spy", children: [] },
    },
    ...overrides,
  };
}

// ── Tests: Renderer (public API) ──────────────────────────────────

describe("Renderer", () => {
  it("returns null for null spec", () => {
    const store = createStore();
    const { container } = render(
      <Renderer spec={null} registry={{}} store={store} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("returns null when root element is missing from spec", () => {
    const store = createStore();
    const spec: Spec = { root: "missing", elements: {} };
    const { container } = render(
      <Renderer spec={spec} registry={{}} store={store} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders root element through registry component", () => {
    const store = createStore();
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec = makeSpec({
      elements: {
        r: { type: "Spy", props: { label: "hello" } },
      },
    });

    render(<Renderer spec={spec} registry={registry} store={store} />);

    expect(Spy.called).toHaveLength(1);
    const el = Spy.called[0]!.element as UIElement;
    expect(el.type).toBe("Spy");
    expect((el.props as Record<string, unknown>).label).toBe("hello");
  });
});

// ── Tests: ElementRenderer edge cases ─────────────────────────────

describe("ElementRenderer", () => {
  it("warns when element key is missing", () => {
    const store = createStore();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const spec: Spec = {
      root: "r",
      elements: {
        r: { type: "Spy", children: ["missing"] },
      },
    };
    const Spy = makeSpy();
    const registry: Registry = { Spy };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('missing element "missing"'),
    );
    warn.mockRestore();
  });

  it("warns when component type is not in registry", () => {
    const store = createStore();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const spec: Spec = {
      root: "r",
      elements: {
        r: { type: "NoSuchComponent" },
      },
    };

    render(<Renderer spec={spec} registry={{}} store={store} />);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('no component registered for type "NoSuchComponent"'),
    );
    warn.mockRestore();
  });

  it("renders nested children", () => {
    const store = createStore();
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "r",
      elements: {
        r: { type: "Spy", children: ["a"] },
        a: { type: "Spy", children: ["b"] },
        b: { type: "Spy" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // Three elements rendered: root, a, b
    expect(Spy.called).toHaveLength(3);
  });
});

// ── Tests: RepeatChildren ─────────────────────────────────────────

describe("RepeatChildren", () => {
  it("renders children once per array item", () => {
    const store = createStore({ items: [{ name: "A" }, { name: "B" }, { name: "C" }] });
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/items" }, children: ["row"] },
        row: { type: "Spy", props: {} },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // 1 list + 3 rows = 4 renders
    expect(Spy.called).toHaveLength(4);
  });

  it("uses key field from repeat config for React keys", () => {
    const store = createStore({ items: [{ id: "x" }, { id: "y" }] });
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/items", key: "id" }, children: ["row"] },
        row: { type: "Spy" },
      },
    };

    // Renders without warning about missing keys
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Renderer spec={spec} registry={registry} store={store} />);
    // No key-related warnings expected
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("renders nothing for empty array", () => {
    const store = createStore({ items: [] });
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/items" }, children: ["row"] },
        row: { type: "Spy" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // Only the list container, no rows
    expect(Spy.called).toHaveLength(1);
  });

  it("falls back to index when key field is missing on items", () => {
    // Items have no id field, but repeat config specifies key: "id"
    const store = createStore({ items: [{ name: "A" }, { name: "B" }] });
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/items", key: "id" }, children: ["row"] },
        row: { type: "Spy" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // 1 list + 2 rows = 3 renders (no crash despite missing key field)
    expect(Spy.called).toHaveLength(3);
  });

  it("handles repeat with no children defined", () => {
    const store = createStore({ items: [{ name: "A" }] });
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    // repeat config without children property
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/items" } },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // The list element renders; no children to repeat
    expect(Spy.called).toHaveLength(1);
  });

  it("handles repeat on missing store path", () => {
    const store = createStore({});
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/nonexistent" }, children: ["row"] },
        row: { type: "Spy" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // Only the list, no rows since path is missing
    expect(Spy.called).toHaveLength(1);
  });

  // ── Object repeat ──

  it("renders children once per object key", () => {
    const store = createStore({ settings: { theme: "dark", lang: "en", notif: true } });
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/settings" }, children: ["row"] },
        row: { type: "Spy", props: {} },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // 1 list + 3 rows (theme, lang, notif) = 4 renders
    expect(Spy.called).toHaveLength(4);
  });

  it("uses repeat.key to extract from object values", () => {
    const store = createStore({ widgets: { a: { label: "Foo" }, b: { label: "Bar" } } });
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/widgets", key: "label" }, children: ["row"] },
        row: { type: "Spy" },
      },
    };

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Renderer spec={spec} registry={registry} store={store} />);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("falls back to object key when repeat.key is undefined or missing on values", () => {
    const store = createStore({ flags: { darkMode: true, beta: false } });
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/flags", key: "id" }, children: ["row"] },
        row: { type: "Spy" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // 1 list + 2 rows (still renders with object-key fallback)
    expect(Spy.called).toHaveLength(3);
  });

  // ── $item nested repeat ──

  it("renders nested repeat via $item expression", () => {
    const store = createStore({
      items: [
        { name: "A", subitems: [{ val: 1 }, { val: 2 }] },
        { name: "B", subitems: [{ val: 3 }] },
      ],
    });
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/items" }, children: ["subList"] },
        subList: { type: "Spy", repeat: { path: { $item: "subitems" } }, children: ["cell"] },
        cell: { type: "Spy" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // 1 list + 2 outer rows + (2 + 1) inner cells = 6 renders
    expect(Spy.called).toHaveLength(6);
  });

  it("renders rows × columns grid with $item $scope against sibling colDefs", () => {
    const store = createStore({
      tables: [
        {
          rows: [{ name: "A", email: "a@x" }, { name: "B", email: "b@x" }],
          colDefs: [{ key: "name" }, { key: "email" }],
        },
      ],
    });
    const Spy = makeSpy();
    const cellScopes: { col: string; row: string }[] = [];
    function CellSpy(_props: ComponentProps) {
      cellScopes.push({ col: usePath(), row: usePath(1) });
      return null;
    }
    const registry: Registry = { Spy, CellSpy };
    const spec: Spec = {
      root: "tableWrap",
      elements: {
        tableWrap: { type: "Spy", repeat: { path: "/tables" }, children: ["headerRow", "tbody"] },
        headerRow: { type: "Spy", repeat: { path: { $item: "colDefs" } }, children: ["headerCell"] },
        headerCell: { type: "Spy" },
        tbody: { type: "Spy", repeat: { path: { $item: "rows" } }, children: ["tr"] },
        tr: { type: "Spy", repeat: { path: { $item: "colDefs", $scope: 1 } }, children: ["cell"] },
        cell: { type: "CellSpy" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // Spy: tableWrap(1) + headerRow(1) + headerCell(2) + tbody(1) + tr(2) = 7
    expect(Spy.called).toHaveLength(7);
    // Cells resolve their column scope (innermost) and row scope (parent).
    expect(cellScopes).toEqual([
      { col: "/tables/0/colDefs/0", row: "/tables/0/rows/0" },
      { col: "/tables/0/colDefs/1", row: "/tables/0/rows/0" },
      { col: "/tables/0/colDefs/0", row: "/tables/0/rows/1" },
      { col: "/tables/0/colDefs/1", row: "/tables/0/rows/1" },
    ]);
  });

  it("renders nothing for $item repeat with out-of-range $scope", () => {
    const store = createStore({
      tables: [
        {
          rows: [{ name: "A" }],
          colDefs: [{ key: "name" }],
        },
      ],
    });
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "tableWrap",
      elements: {
        tableWrap: { type: "Spy", repeat: { path: "/tables" }, children: ["tbody"] },
        tbody: { type: "Spy", repeat: { path: { $item: "rows" } }, children: ["tr"] },
        tr: { type: "Spy", repeat: { path: { $item: "colDefs", $scope: 5 } }, children: ["cell"] },
        cell: { type: "Spy" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // tableWrap(1) + tbody(1) + tr rows repeat (1) — the $scope-5 column
    // repeat resolves to undefined, so no tr children render.
    expect(Spy.called).toHaveLength(3);
  });

  // ── $state dynamic repeat target ──

  it("renders repeat via $state dynamic target", () => {
    const store = createStore({
      activeList: "/fruits",
      fruits: [{ name: "Apple" }, { name: "Banana" }],
    });
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: { $state: "/activeList" } }, children: ["row"] },
        row: { type: "Spy" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // 1 list + 2 rows = 3 renders
    expect(Spy.called).toHaveLength(3);
  });

  it("re-renders repeat when $state pointer changes", () => {
    const store = createStore({
      pointer: "/listA",
      listA: [{ name: "A1" }],
      listB: [{ name: "B1" }, { name: "B2" }],
    });
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: { $state: "/pointer" } }, children: ["row"] },
        row: { type: "Spy" },
      },
    };

    const { rerender } = render(
      <Renderer spec={spec} registry={registry} store={store} />,
    );

    // Initial: 1 list + 1 row from listA = 2
    expect(Spy.called).toHaveLength(2);

    // Switch pointer to listB
    store.set("/pointer", "/listB");
    rerender(
      <Renderer spec={spec} registry={registry} store={store} />,
    );

    // Now: initial 2 + 1 list + 2 rows from listB = 5 total
    // (the list re-renders because $state subscription fired)
    expect(Spy.called).toHaveLength(5);
  });

  it("renders nothing when $state points to non-string", () => {
    const store = createStore({ badPointer: 42 });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: { $state: "/badPointer" } }, children: ["row"] },
        row: { type: "Spy" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // The list element renders; repeat bails out (falsy path), no rows
    expect(Spy.called).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('$state expression at "/badPointer"'),
    );
    warn.mockRestore();
  });

  it("renders nothing for non-iterable value", () => {
    const store = createStore({ value: "hello" });
    const Spy = makeSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/value" }, children: ["row"] },
        row: { type: "Spy" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // Only the list container, no rows (string is not iterable)
    expect(Spy.called).toHaveLength(1);
  });
});

// ── Tests: Nested renderer path scope boundary ─────────────────────

/** Component that captures usePath() value. */
function makePathCapture() {
  const captured: string[] = [];
  function CapturePath({ element, children }: ComponentProps) {
    captured.push(usePath());
    return createElement("div", { "data-testid": "path-capture" }, children);
  }
  return { Component: CapturePath as typeof CapturePath, captured };
}

/** Component that captures useRepeatIndex() value. */
function makeIndexCapture() {
  const captured: (string | number | undefined)[] = [];
  function CaptureIndex({ element, children }: ComponentProps) {
    captured.push(useRepeatIndex());
    return createElement("div", { "data-testid": "index-capture" }, children);
  }
  return { Component: CaptureIndex as typeof CaptureIndex, captured };
}

describe("Nested renderer path scope boundary", () => {
  it("nested renderer resets PathContext to empty string", () => {
    // Outer repeat at /items, row 0 renders a nested Renderer.
    // A component inside the nested Renderer should see usePath() = "".
    const store = createStore({
      items: [{ name: "A", subSpec: { root: "inner", elements: { inner: { type: "CapturePath" } } } }],
    });
    const Spy = makeSpy();
    const { Component: CapturePath, captured } = makePathCapture();
    const registry: Registry = { Spy, CapturePath };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/items" }, children: ["row"] },
        row: { type: "Spy" },
      },
    };

    // Make the row component also render a nested Renderer
    const { container } = render(
      <Renderer spec={spec} registry={registry} store={store} />,
    );

    // Now we need the row's component to render a nested Renderer.
    // Instead, build a spec where a single element's children include a nested renderer.
    // Simpler: use a component that explicitly renders a nested Renderer.
    // Let's use a custom component approach.
  });

  it("nested renderer resets PathContext to empty string", () => {
    const store = createStore({
      items: [{ name: "A" }],
    });
    const { Component: CapturePath, captured } = makePathCapture();
    const Spy = makeSpy();

    // The outer spec has a repeat; the row renders a component that wraps a nested Renderer
    const outerSpec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/items" }, children: ["row"] },
        row: { type: "RowWithNested" },
      },
    };

    // Custom component: renders a nested Renderer + captures outer path
    function RowWithNested({ element, children }: ComponentProps) {
      const nestedSpec: Spec = {
        root: "cap",
        elements: {
          cap: { type: "CapturePath" },
        },
      };
      return createElement(
        "div",
        { "data-testid": "row-with-nested" },
        createElement(Renderer, { spec: nestedSpec, registry: { CapturePath }, store }),
      );
    }

    const registry: Registry = { Spy, CapturePath, RowWithNested };

    render(<Renderer spec={outerSpec} registry={registry} store={store} />);

    // The CapturePath inside the nested Renderer should see ""
    expect(captured).toContain("");
  });

  it("nested renderer resets RepeatIndexContext to undefined", () => {
    const store = createStore({
      items: [{ name: "A" }],
    });
    const { Component: CaptureIndex, captured } = makeIndexCapture();
    const Spy = makeSpy();

    const outerSpec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/items" }, children: ["row"] },
        row: { type: "RowWithNested" },
      },
    };

    function RowWithNested({ element, children }: ComponentProps) {
      const nestedSpec: Spec = {
        root: "cap",
        elements: {
          cap: { type: "CaptureIndex" },
        },
      };
      return createElement(
        "div",
        { "data-testid": "row-with-nested" },
        createElement(Renderer, { spec: nestedSpec, registry: { CaptureIndex }, store }),
      );
    }

    const registry: Registry = { Spy, CaptureIndex, RowWithNested };

    render(<Renderer spec={outerSpec} registry={registry} store={store} />);

    // The CaptureIndex inside the nested Renderer should see undefined
    expect(captured).toContain(undefined);
  });

  it("outer repeat scope unaffected by nested renderer", () => {
    const store = createStore({
      items: [{ name: "A" }, { name: "B" }],
    });
    const { Component: CapturePath, captured } = makePathCapture();
    const Spy = makeSpy();

    // outerPath captures usePath() at the row level (should get /items/N)
    function OuterPathCapture({ element, children }: ComponentProps) {
      captured.push(usePath());
      return createElement("div", { "data-testid": "outer-path" }, children);
    }

    function RowWithNested({ element, children }: ComponentProps) {
      // Capture outer path (should be /items/N)
      captured.push(usePath());
      const nestedSpec: Spec = {
        root: "cap",
        elements: {
          cap: { type: "CapturePath" },
        },
      };
      return createElement(
        "div",
        { "data-testid": "row-with-nested" },
        createElement(Renderer, { spec: nestedSpec, registry: { CapturePath }, store }),
      );
    }

    const outerSpec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/items" }, children: ["row"] },
        row: { type: "RowWithNested" },
      },
    };

    const registry: Registry = { Spy, CapturePath, RowWithNested, OuterPathCapture };

    render(<Renderer spec={outerSpec} registry={registry} store={store} />);

    // Outer path captures should see /items/0 and /items/1 (not "")
    expect(captured).toContain("/items/0");
    expect(captured).toContain("/items/1");
    // The nested Renderer should see ""
    expect(captured).toContain("");
  });

  it("nested renderer exposes no ancestor scopes", () => {
    const store = createStore({
      items: [{ name: "A" }],
    });
    const Spy = makeSpy();

    // Captures usePath(1) — must be undefined inside the nested renderer.
    const captured: (string | undefined)[] = [];
    function CaptureParent({ element, children }: ComponentProps) {
      captured.push(usePath(1));
      return createElement("div", { "data-testid": "capture-parent" }, children);
    }

    function RowWithNested({ element, children }: ComponentProps) {
      const nestedSpec: Spec = {
        root: "cap",
        elements: {
          cap: { type: "CaptureParent" },
        },
      };
      return createElement(
        "div",
        { "data-testid": "row-with-nested" },
        createElement(Renderer, { spec: nestedSpec, registry: { CaptureParent }, store }),
      );
    }

    const outerSpec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/items" }, children: ["row"] },
        row: { type: "RowWithNested" },
      },
    };

    const registry: Registry = { Spy, CaptureParent, RowWithNested };

    render(<Renderer spec={outerSpec} registry={registry} store={store} />);

    // The nested renderer resets the stack: no parent scope is visible.
    expect(captured).toEqual([undefined]);
  });
});

// ── Tests: Repeat scope stack ──────────────────────────────────────

/** Component that captures usePath() and usePath(offset) values. */
function makeStackCapture() {
  const captured: (string | undefined)[][] = [];
  function CaptureStack({ element, children }: ComponentProps) {
    captured.push([usePath(), usePath(1), usePath(2)]);
    return createElement("div", { "data-testid": "stack-capture" }, children);
  }
  return { Component: CaptureStack as typeof CaptureStack, captured };
}

describe("Repeat scope stack", () => {
  it("nested repeat exposes parent scopes via usePath(offset)", () => {
    const store = createStore({
      items: [
        { name: "A", subitems: [{ val: 1 }, { val: 2 }] },
        { name: "B", subitems: [{ val: 3 }] },
      ],
    });
    const { Component: CaptureStack, captured } = makeStackCapture();
    const Spy = makeSpy();
    const registry: Registry = { Spy, CaptureStack };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Spy", repeat: { path: "/items" }, children: ["subList"] },
        subList: { type: "Spy", repeat: { path: { $item: "subitems" } }, children: ["cell"] },
        cell: { type: "CaptureStack" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // Each inner cell sees its own scope, the row scope, then the root scope.
    expect(captured).toEqual([
      ["/items/0/subitems/0", "/items/0", ""],
      ["/items/0/subitems/1", "/items/0", ""],
      ["/items/1/subitems/0", "/items/1", ""],
    ]);
  });

  it("grid cell resolves row and column scopes via $state columns repeat", () => {
    const store = createStore({
      data: [{ name: "A", email: "a@x.com" }, { name: "B", email: "b@x.com" }],
      colPointer: "/colDefs",
      colDefs: [{ key: "name" }, { key: "email" }],
    });
    const { Component: CaptureStack, captured } = makeStackCapture();
    const Spy = makeSpy();
    const registry: Registry = { Spy, CaptureStack };
    const spec: Spec = {
      root: "tbody",
      elements: {
        tbody: { type: "Spy", repeat: { path: "/data" }, children: ["tr"] },
        tr: { type: "Spy", repeat: { path: { $state: "/colPointer" } }, children: ["cell"] },
        cell: { type: "CaptureStack" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // Rows × columns cross-product: each cell sees column scope + row scope.
    expect(captured).toEqual([
      ["/colDefs/0", "/data/0", ""],
      ["/colDefs/1", "/data/0", ""],
      ["/colDefs/0", "/data/1", ""],
      ["/colDefs/1", "/data/1", ""],
    ]);
  });

  it("three-level nesting exposes all ancestor scopes", () => {
    const store = createStore({
      a: [{ b: [{ c: [{ val: 1 }] }] }],
    });
    const { Component: CaptureStack, captured } = makeStackCapture();
    const Spy = makeSpy();
    const registry: Registry = { Spy, CaptureStack };
    const spec: Spec = {
      root: "l1",
      elements: {
        l1: { type: "Spy", repeat: { path: "/a" }, children: ["l2"] },
        l2: { type: "Spy", repeat: { path: { $item: "b" } }, children: ["l3"] },
        l3: { type: "Spy", repeat: { path: { $item: "c" } }, children: ["cell"] },
        cell: { type: "CaptureStack" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    expect(captured).toEqual([
      ["/a/0/b/0/c/0", "/a/0/b/0", "/a/0"],
    ]);
  });

  it("relative bind composition inside a repeat uses only the innermost scope", () => {
    const store = createStore({
      items: [{ name: "A", subitems: [{ val: 1 }] }],
    });
    const rendered: unknown[] = [];
    function Cell({ element, children }: ComponentProps) {
      // Simulates consumer-side composition (BoundField pattern):
      // relative reads compose against usePath() — the innermost scope.
      rendered.push(useValue<string>(`${usePath()}/val`));
      return createElement("div", {}, children);
    }
    const registry: Registry = { Cell };
    const spec: Spec = {
      root: "list",
      elements: {
        list: { type: "Cell", repeat: { path: "/items" }, children: ["subList"] },
        subList: { type: "Cell", repeat: { path: { $item: "subitems" } }, children: ["cell"] },
        cell: { type: "Cell" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // The innermost repeat scope /items/0/subitems/0 wins — not /items/0.
    expect(rendered).toEqual([undefined, undefined, 1]);
  });
});

// ── Tests: Named slots (record-form children) ──────────────────────

/** Captures ComponentProps (including slots) for later assertion. */
function makeSlotSpy() {
  const called: {
    call: number;
    element: unknown;
    children: ReactNode;
    slots: Record<string, ReactNode> | undefined;
    emit: unknown;
  }[] = [];
  function SpyComponent({ element, children, slots, emit }: ComponentProps) {
    called.push({ call: called.length, element, children, slots, emit });
    return createElement(
      "div",
      { "data-testid": "spy" },
      slots ? Object.values(slots) : children,
    );
  }
  (SpyComponent as unknown as Record<string, unknown>).called = called;
  return SpyComponent as typeof SpyComponent & { called: typeof called };
}

describe("Named slots", () => {
  it("renders record-form children as named slots at component-chosen positions", () => {
    const store = createStore();
    const registry: Registry = {
      Card: ({ slots }: ComponentProps) =>
        createElement("div", { "data-testid": "card" }, slots?.body, slots?.header),
      Text: ({ element }: ComponentProps) =>
        createElement("span", { "data-testid": `text-${String(element.props?.id)}` }),
    };
    const spec: Spec = {
      root: "card",
      elements: {
        card: { type: "Card", children: { header: "h", body: "b" } },
        h: { type: "Text", props: { id: "H" } },
        b: { type: "Text", props: { id: "B" } },
      },
    };

    const { container } = render(
      <Renderer spec={spec} registry={registry} store={store} />,
    );

    const card = container.querySelector('[data-testid="card"]')!;
    const order = Array.from(card.querySelectorAll("span")).map((s) =>
      s.getAttribute("data-testid"),
    );
    // Component places body before header, regardless of declaration order
    expect(order).toEqual(["text-B", "text-H"]);
  });

  it("slot with multiple elements renders them in order", () => {
    const store = createStore();
    const registry: Registry = {
      Toolbar: ({ slots }: ComponentProps) =>
        createElement("div", { "data-testid": "toolbar" }, slots?.actions),
      Text: ({ element }: ComponentProps) =>
        createElement("span", { "data-testid": `text-${String(element.props?.id)}` }),
    };
    const spec: Spec = {
      root: "toolbar",
      elements: {
        toolbar: { type: "Toolbar", children: { actions: ["t1", "t2"] } },
        t1: { type: "Text", props: { id: "1" } },
        t2: { type: "Text", props: { id: "2" } },
      },
    };

    const { container } = render(
      <Renderer spec={spec} registry={registry} store={store} />,
    );

    const toolbar = container.querySelector('[data-testid="toolbar"]')!;
    const order = Array.from(toolbar.querySelectorAll("span")).map((s) =>
      s.getAttribute("data-testid"),
    );
    expect(order).toEqual(["text-1", "text-2"]);
  });

  it("sets exactly one of children or slots based on children shape", () => {
    const store = createStore();
    const Spy = makeSlotSpy();
    const registry: Registry = { Spy, ArraySpy: Spy, RecordSpy: Spy };
    const spec: Spec = {
      root: "root",
      elements: {
        root: { type: "Spy", children: ["arrayForm", "recordForm"] },
        arrayForm: { type: "ArraySpy", children: ["leaf"] },
        recordForm: { type: "RecordSpy", children: { x: "leaf" } },
        leaf: { type: "Spy" },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    // root + arrayForm + recordForm + leaf×2 (once per form)
    const calls = Spy.called;
    expect(calls).toHaveLength(5);
    const arrayCall = calls.find((c) => (c.element as UIElement).type === "ArraySpy");
    const recordCall = calls.find((c) => (c.element as UIElement).type === "RecordSpy");
    expect(arrayCall).toBeDefined();
    expect(recordCall).toBeDefined();
    expect(arrayCall!.children).not.toBeUndefined();
    expect(arrayCall!.slots).toBeUndefined();
    expect(recordCall!.children).toBeUndefined();
    expect(recordCall!.slots).toEqual({ x: expect.anything() });
  });

  it("missing key inside a slot warns and is skipped", () => {
    const store = createStore();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const registry: Registry = {
      Card: ({ slots }: ComponentProps) =>
        createElement("div", { "data-testid": "card" }, slots?.body),
      Text: ({ element }: ComponentProps) =>
        createElement("span", { "data-testid": `text-${String(element.props?.id)}` }),
    };
    const spec: Spec = {
      root: "card",
      elements: {
        card: { type: "Card", children: { body: ["missing", "b"] } },
        b: { type: "Text", props: { id: "B" } },
      },
    };

    const { container } = render(
      <Renderer spec={spec} registry={registry} store={store} />,
    );

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('missing element "missing"'),
    );
    const card = container.querySelector('[data-testid="card"]')!;
    const texts = Array.from(card.querySelectorAll("span")).map((s) =>
      s.getAttribute("data-testid"),
    );
    expect(texts).toEqual(["text-B"]);
    warn.mockRestore();
  });

  it("empty record children yield an empty slots object", () => {
    const store = createStore();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const Spy = makeSlotSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "card",
      elements: {
        card: { type: "Spy", children: {} },
      },
    };

    render(<Renderer spec={spec} registry={registry} store={store} />);

    expect(warn).not.toHaveBeenCalled();
    expect(Spy.called).toHaveLength(1);
    expect(Spy.called[0]!.slots).toEqual({});
    expect(Spy.called[0]!.children).toBeUndefined();
    warn.mockRestore();
  });

  it("repeat with record-form children builds item-scoped slots", () => {
    const store = createStore({
      cards: [
        { id: "A", title: "T1" },
        { id: "B", title: "T2" },
      ],
    });
    const seen: string[] = [];
    const handlers = {
      log: (params: Record<string, unknown>) => seen.push(String(params.id)),
    };
    const registry: Registry = {
      Card: ({ slots }: ComponentProps) =>
        createElement(
          "div",
          { "data-testid": "card" },
          slots?.title,
          slots?.action,
        ),
      Title: () => {
        const title = useValue<string>(`${usePath()}/title`);
        return createElement("span", { "data-testid": "title" }, title);
      },
      Action: ({ emit }: ComponentProps) =>
        createElement("button", { "data-testid": "action", onClick: () => emit("click") }),
    };
    const spec: Spec = {
      root: "cardList",
      elements: {
        cardList: {
          type: "Card",
          repeat: { path: "/cards" },
          children: { title: "t", action: "a" },
        },
        t: { type: "Title" },
        a: {
          type: "Action",
          on: { click: { action: "log", params: { id: { $item: "id" } } } },
        },
      },
    };

    const { container } = render(
      <Renderer spec={spec} registry={registry} store={store} handlers={handlers} />,
    );

    const titles = Array.from(container.querySelectorAll('[data-testid="title"]')).map(
      (n) => n.textContent,
    );
    expect(titles).toEqual(["T1", "T2"]);

    // Each item's action resolves $item against its own scope (path strings)
    const buttons = container.querySelectorAll('[data-testid="action"]');
    expect(buttons).toHaveLength(2);
    buttons[0]!.click();
    buttons[1]!.click();
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        expect(seen).toEqual(["/cards/0/id", "/cards/1/id"]);
        resolve();
      }, 0),
    );
  });

  it("repeat with record-form children iterates objects", () => {
    const store = createStore({
      settings: {
        dark: { label: "Dark" },
        light: { label: "Light" },
      },
    });
    const registry: Registry = {
      Card: ({ slots }: ComponentProps) =>
        createElement("div", { "data-testid": "card" }, slots?.title),
      Title: () => {
        const label = useValue<string>(`${usePath()}/label`);
        return createElement("span", { "data-testid": "title" }, label);
      },
    };
    const spec: Spec = {
      root: "cardList",
      elements: {
        cardList: {
          type: "Card",
          repeat: { path: "/settings" },
          children: { title: "t" },
        },
        t: { type: "Title" },
      },
    };

    const { container } = render(
      <Renderer spec={spec} registry={registry} store={store} />,
    );

    const titles = Array.from(container.querySelectorAll('[data-testid="title"]')).map(
      (n) => n.textContent,
    );
    expect(titles).toEqual(["Dark", "Light"]);
  });

  it("repeat with record-form children over non-iterable renders nothing", () => {
    const store = createStore({ value: 42 });
    const Spy = makeSlotSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "cardList",
      elements: {
        cardList: {
          type: "Spy",
          repeat: { path: "/value" },
          children: { title: "t" },
        },
        t: { type: "Spy" },
      },
    };

    const { container } = render(
      <Renderer spec={spec} registry={registry} store={store} />,
    );

    expect(Spy.called).toHaveLength(0);
    expect(container.innerHTML).toBe("");
  });

  it("repeat with record-form children and unresolvable path renders nothing", () => {
    const store = createStore();
    const Spy = makeSlotSpy();
    const registry: Registry = { Spy };
    const spec: Spec = {
      root: "cardList",
      elements: {
        cardList: {
          type: "Spy",
          repeat: { path: { $item: "subitems" } },
          children: { title: "t" },
        },
        t: { type: "Spy" },
      },
    };

    const { container } = render(
      <Renderer spec={spec} registry={registry} store={store} />,
    );

    expect(Spy.called).toHaveLength(0);
    expect(container.innerHTML).toBe("");
  });
});

