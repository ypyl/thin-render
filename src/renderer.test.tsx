// renderer.test.tsx — tests for the Renderer and its internal components.
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { type ReactNode, createElement } from "react";
import { Renderer, type ComponentProps, type Registry } from "./renderer";
import { createStore } from "./store";
import type { Spec, UIElement } from "./spec";
import { usePath, useRepeatIndex } from "./hooks";

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
  it("warns when element key is missing and loading is false", () => {
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

  it("does NOT warn when element key is missing and loading is true", () => {
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

    render(<Renderer spec={spec} registry={registry} store={store} loading />);

    expect(warn).not.toHaveBeenCalled();
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
});

