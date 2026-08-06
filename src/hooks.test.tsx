// hooks.test.tsx — tests for all exported hooks.
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, render } from "@testing-library/react";
import { useStore, useValue, useSetValue, useBound, useSelector, useEmit, useResolvedPath, usePath, useRepeatIndex } from "./hooks";
import { createStore } from "./store";
import { createWrapper } from "./test-utils";
import { StoreProvider, ActionProvider } from "./contexts";

// ── useStore ──────────────────────────────────────────────────────

describe("useStore", () => {
  it("returns the store from context", () => {
    const store = createStore({ x: 1 });
    const { result } = renderHook(() => useStore(), {
      wrapper: createWrapper({ store }),
    });
    expect(result.current).toBe(store);
  });

  it("throws when used outside StoreProvider", () => {
    expect(() => renderHook(() => useStore())).toThrow(
      "useStore must be used within a StoreProvider",
    );
  });
});

// ── useValue ──────────────────────────────────────────────────────

describe("useValue", () => {
  it("reads the current value at a path", () => {
    const store = createStore({ x: 42 });
    const { result } = renderHook(() => useValue<number>("/x"), {
      wrapper: createWrapper({ store }),
    });
    expect(result.current).toBe(42);
  });

  it("returns undefined for missing path", () => {
    const store = createStore({});
    const { result } = renderHook(() => useValue("/missing"), {
      wrapper: createWrapper({ store }),
    });
    expect(result.current).toBeUndefined();
  });

  it("reacts to store set at the subscribed path", () => {
    const store = createStore({ x: 1 });
    const { result, rerender } = renderHook(() => useValue<number>("/x"), {
      wrapper: createWrapper({ store }),
    });
    expect(result.current).toBe(1);

    act(() => { store.set("/x", 99); });
    rerender();
    expect(result.current).toBe(99);
  });

  it("does NOT react to unrelated path changes", () => {
    const store = createStore({ x: 1, y: 2 });
    const { result, rerender } = renderHook(() => useValue<number>("/x"), {
      wrapper: createWrapper({ store }),
    });
    const snapshot = result.current;

    act(() => { store.set("/y", 999); });
    rerender();
    expect(result.current).toBe(snapshot);
  });
});

// ── useSetValue ────────────────────────────────────────────────────

describe("useSetValue", () => {
  it("returns a stable setter that writes to the store", () => {
    const store = createStore({ x: 1 });
    const { result, rerender } = renderHook(() => useSetValue("/x"), {
      wrapper: createWrapper({ store }),
    });

    const setterBefore = result.current;
    act(() => { result.current(99); });
    rerender();
    const setterAfter = result.current;

    expect(store.get("/x")).toBe(99);
    // setter should be stable (same reference)
    expect(setterBefore).toBe(setterAfter);
  });
});

// ── useBound ───────────────────────────────────────────────────────

describe("useBound", () => {
  it("returns [value, setter] tuple", () => {
    const store = createStore({ name: "Alice" });
    const { result } = renderHook(() => useBound<string>("/name"), {
      wrapper: createWrapper({ store }),
    });

    const [value, setter] = result.current;
    expect(value).toBe("Alice");
    expect(typeof setter).toBe("function");
  });

  it("setter updates the store and value", () => {
    const store = createStore({ name: "Alice" });
    const { result, rerender } = renderHook(() => useBound<string>("/name"), {
      wrapper: createWrapper({ store }),
    });

    act(() => { result.current[1]("Bob"); });
    rerender();

    expect(result.current[0]).toBe("Bob");
    expect(store.get("/name")).toBe("Bob");
  });
});

// ── useSelector ───────────────────────────────────────────────────

describe("useSelector", () => {
  it("returns a derived value from one path", () => {
    const store = createStore({ editKey: "Main" });
    const { result } = renderHook(
      () => useSelector("/editKey", (v) => v === "Main"),
      { wrapper: createWrapper({ store }) },
    );
    expect(result.current).toBe(true);
  });

  it("derives via property access on the resolved subtree", () => {
    const store = createStore({ user: { name: "A", role: "admin" } });
    const { result } = renderHook(
      () => useSelector("/user", (u) => (u as { name: string }).name),
      { wrapper: createWrapper({ store }) },
    );
    expect(result.current).toBe("A");
  });

  it("root window receives the full live snapshot", () => {
    const store = createStore({ a: 1, b: 2 });
    const { result } = renderHook(
      () => {
        const sum = useSelector("", (s) => {
          const st = s as { a: number; b: number };
          return st.a + st.b;
        });
        return sum;
      },
      { wrapper: createWrapper({ store }) },
    );
    expect(result.current).toBe(3);
  });

  it("notifies only on writes within the window", () => {
    const store = createStore({ user: { name: "A" }, items: [] });
    let evaluations = 0;
    function UserGate() {
      const isMain = useSelector("/user", (u) => {
        evaluations++;
        return (u as { name: string }).name === "Main";
      });
      return <div>{isMain ? "yes" : "no"}</div>;
    }
    const { container } = render(<UserGate />, {
      wrapper: createWrapper({ store }),
    });

    // Outside the window: not notified, derive not re-evaluated
    const evalsBefore = evaluations;
    act(() => {
      store.set("/items", [1]);
    });
    expect(evaluations).toBe(evalsBefore);
    expect(container.textContent).toBe("no");

    // Inside the window: notified, derive re-evaluated (value unchanged → no render)
    act(() => {
      store.set("/user/name", "B");
    });
    expect(evaluations).toBeGreaterThan(evalsBefore);
    expect(container.textContent).toBe("no");

    // Flip: re-render
    act(() => {
      store.set("/user/name", "Main");
    });
    expect(container.textContent).toBe("yes");
  });

  it("root window notifies on any write", () => {
    const store = createStore({ editKey: "A" });
    let renders = 0;
    let evaluations = 0;
    function IsMain() {
      renders++;
      const isMain = useSelector("", (s) => {
        evaluations++;
        return (s as { editKey: string }).editKey === "Main";
      });
      return <div>{isMain ? "yes" : "no"}</div>;
    }
    const { container } = render(<IsMain />, {
      wrapper: createWrapper({ store }),
    });
    const rendersBefore = renders;
    const evalsBefore = evaluations;

    // Notified on an unrelated write: derive re-evaluated, value unchanged → no re-render
    act(() => {
      store.set("/other", 1);
    });
    expect(evaluations).toBeGreaterThan(evalsBefore);
    expect(renders).toBe(rendersBefore);
    expect(container.textContent).toBe("no");
  });

  it("re-renders only when the derived value changes", () => {
    const store = createStore({ editKey: "A" });
    let renders = 0;
    function IsMain() {
      renders++;
      const isMain = useSelector("/editKey", (v) => v === "Main");
      return <div>{isMain ? "yes" : "no"}</div>;
    }
    const { container } = render(<IsMain />, {
      wrapper: createWrapper({ store }),
    });
    expect(renders).toBe(1);
    expect(container.textContent).toBe("no");

    // Derived value unchanged (false → false): no re-render
    act(() => {
      store.set("/editKey", "B");
    });
    expect(renders).toBe(1);

    // Derived value flips (false → true): re-render
    act(() => {
      store.set("/editKey", "Main");
    });
    expect(renders).toBe(2);
    expect(container.textContent).toBe("yes");

    // Flips back (true → false): re-render
    act(() => {
      store.set("/editKey", "Other");
    });
    expect(renders).toBe(3);
    expect(container.textContent).toBe("no");
  });

  it("re-renders when a same-subtree multi-field derive changes", () => {
    const store = createStore({ user: { name: "A", role: "user" } });
    let renders = 0;
    function AdminGate() {
      renders++;
      const isAdmin = useSelector("/user", (u) => {
        const { name, role } = u as { name: string; role: string };
        return name === "Main" && role === "admin";
      });
      return <div>{isAdmin ? "yes" : "no"}</div>;
    }
    const { container } = render(<AdminGate />, {
      wrapper: createWrapper({ store }),
    });
    expect(renders).toBe(1);
    expect(container.textContent).toBe("no");

    // One field changes but the combined result stays false: no re-render
    act(() => {
      store.set("/user/name", "Main");
    });
    expect(renders).toBe(1);
    expect(container.textContent).toBe("no");

    // Second field change flips the combined result: re-render
    act(() => {
      store.set("/user/role", "admin");
    });
    expect(renders).toBe(2);
    expect(container.textContent).toBe("yes");
  });

  it("works inside a repeat scope", () => {
    const store = createStore({ editKey: "Main" });
    const { result } = renderHook(
      () => useSelector("/editKey", (v) => v === "Main"),
      { wrapper: createWrapper({ store, repeatPath: "/items/3" }) },
    );
    expect(result.current).toBe(true);
  });

  it("throws when used outside a StoreProvider", () => {
    expect(() => renderHook(() => useSelector("/x", () => 1))).toThrow(
      "useStore must be used within a StoreProvider",
    );
  });
});

// ── usePath / useRepeatIndex ─────────────────────────────────

describe("usePath", () => {
  it("returns empty string by default", () => {
    const { result } = renderHook(() => usePath(), {
      wrapper: createWrapper(),
    });
    expect(result.current).toBe("");
  });

  it("returns the repeat path from context", () => {
    const { result } = renderHook(() => usePath(), {
      wrapper: createWrapper({ repeatPath: "/items/3" }),
    });
    expect(result.current).toBe("/items/3");
  });

  it("offset 0 returns the innermost scope", () => {
    const { result } = renderHook(() => usePath(0), {
      wrapper: createWrapper({ repeatPath: "/items/3" }),
    });
    expect(result.current).toBe("/items/3");
  });

  it("offset 1 returns undefined when there is no parent scope", () => {
    const { result } = renderHook(() => usePath(1), {
      wrapper: createWrapper({ repeatPath: "/items/3" }),
    });
    expect(result.current).toBeUndefined();
  });

  it("negative offset returns undefined", () => {
    const { result } = renderHook(() => usePath(-1), {
      wrapper: createWrapper({ repeatPath: "/items/3" }),
    });
    expect(result.current).toBeUndefined();
  });

  it("any offset at root returns undefined", () => {
    const { result } = renderHook(() => usePath(2), {
      wrapper: createWrapper(),
    });
    expect(result.current).toBeUndefined();
  });
});

describe("useRepeatIndex", () => {
  it("returns undefined by default", () => {
    const { result } = renderHook(() => useRepeatIndex(), {
      wrapper: createWrapper(),
    });
    expect(result.current).toBeUndefined();
  });

  it("returns the repeat index from context", () => {
    const { result } = renderHook(() => useRepeatIndex(), {
      wrapper: createWrapper({ repeatIndex: 7 }),
    });
    expect(result.current).toBe(7);
  });
});

// ── useResolvedPath ───────────────────────────────────────────────

describe("useResolvedPath", () => {
  it("passes through plain strings", () => {
    const { result } = renderHook(() => useResolvedPath("/items"), {
      wrapper: createWrapper(),
    });
    expect(result.current).toBe("/items");
  });

  it("resolves $item with field inside repeat scope", () => {
    const { result } = renderHook(() => useResolvedPath({ $item: "subitems" }), {
      wrapper: createWrapper({ repeatPath: "/items/3" }),
    });
    expect(result.current).toBe("/items/3/subitems");
  });

  it("resolves $item with empty string to base path", () => {
    const { result } = renderHook(() => useResolvedPath({ $item: "" }), {
      wrapper: createWrapper({ repeatPath: "/items/7" }),
    });
    expect(result.current).toBe("/items/7");
  });

  it("returns undefined for $item outside repeat scope", () => {
    const { result } = renderHook(() => useResolvedPath({ $item: "x" }), {
      wrapper: createWrapper(),
    });
    expect(result.current).toBeUndefined();
  });

  it("resolves $state by reading the store at the pointer path", () => {
    const store = createStore({ activeList: "/fruits" });
    const { result } = renderHook(() => useResolvedPath({ $state: "/activeList" }), {
      wrapper: createWrapper({ store }),
    });
    expect(result.current).toBe("/fruits");
  });

  it("reacts to $state pointer changes", () => {
    const store = createStore({ pointer: "/listA" });
    const { result, rerender } = renderHook(() => useResolvedPath({ $state: "/pointer" }), {
      wrapper: createWrapper({ store }),
    });
    expect(result.current).toBe("/listA");

    act(() => { store.set("/pointer", "/listB"); });
    rerender();
    expect(result.current).toBe("/listB");
  });

  it("returns empty string and warns when $state resolves to non-string", () => {
    const store = createStore({ bad: 42 });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useResolvedPath({ $state: "/bad" }), {
      wrapper: createWrapper({ store }),
    });
    expect(result.current).toBe("");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('$state expression at "/bad" resolved to non-string'),
    );
    warn.mockRestore();
  });

  it("returns empty string when $state points to undefined path", () => {
    const store = createStore({});
    const { result } = renderHook(() => useResolvedPath({ $state: "/missing" }), {
      wrapper: createWrapper({ store }),
    });
    expect(result.current).toBe("");
  });

  it("returns undefined for unknown object shape", () => {
    const { result } = renderHook(() => useResolvedPath({ other: "value" }), {
      wrapper: createWrapper(),
    });
    expect(result.current).toBeUndefined();
  });
});

// ── useEmit ────────────────────────────────────────────────────────

describe("useEmit", () => {
  it("returns a function", () => {
    const { result } = renderHook(() => useEmit(), {
      wrapper: createWrapper(),
    });
    expect(typeof result.current).toBe("function");
  });

  it("warns when emit called with no on map", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useEmit(), {
      wrapper: createWrapper(),
    });

    await expect(result.current("click")).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('thin-render: emit("click") called but element has no "on" bindings'),
    );
    warn.mockRestore();
  });

  it("warns when event name is not in on map and lists available events", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const handler = vi.fn();
    const handlers = { a: handler };
    const on = { change: { action: "a" }, submit: { action: "a" } };

    const { result } = renderHook(() => useEmit(on), {
      wrapper: createWrapper({ handlers }),
    });

    await expect(result.current("click")).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('emit("click") — event not found'),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Available events: change, submit"),
    );
    expect(handler).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("dispatches action and calls handler with resolved params", async () => {
    const store = createStore({ doc: { id: 42 } });
    const handler = vi.fn();
    const handlers = { myAction: handler };
    const on = { click: { action: "myAction", params: { docId: { $state: "/doc/id" } } } };

    const { result } = renderHook(() => useEmit(on), {
      wrapper: createWrapper({ store, handlers }),
    });

    await act(async () => {
      await result.current("click");
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      { docId: 42 },
      { getState: store.getState, setState: store.set },
    );
  });

  it("warns when handler is not registered", async () => {
    const store = createStore();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const on = { click: { action: "noSuchHandler" } };

    const { result } = renderHook(() => useEmit(on), {
      wrapper: createWrapper({ store }),
    });

    await act(async () => {
      await result.current("click");
    });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('no handler registered for "noSuchHandler"'),
    );
    warn.mockRestore();
  });

  it("supports multiple bindings for the same event", async () => {
    const store = createStore();
    const h1 = vi.fn();
    const h2 = vi.fn();
    const handlers = { a: h1, b: h2 };
    const on = { click: [{ action: "a" }, { action: "b" }] };

    const { result } = renderHook(() => useEmit(on), {
      wrapper: createWrapper({ store, handlers }),
    });

    await act(async () => {
      await result.current("click");
    });

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it("warns when on map is empty (no keys)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const on: Record<string, unknown> = {};

    const { result } = renderHook(() => useEmit(on), {
      wrapper: createWrapper(),
    });

    await expect(result.current("click")).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Available events: (none)"),
    );
    warn.mockRestore();
  });

  it("warns and does not dispatch for unknown event name", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const handler = vi.fn();
    const handlers = { a: handler };
    const on = { click: { action: "a" } };

    const { result } = renderHook(() => useEmit(on), {
      wrapper: createWrapper({ handlers }),
    });

    await act(async () => {
      await result.current("unknown");
    });

    expect(handler).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('emit("unknown") — event not found'),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Available events: click"),
    );
    warn.mockRestore();
  });

  it("resolves $item inside repeat scope", async () => {
    const store = createStore();
    const handler = vi.fn();
    const handlers = { del: handler };
    const on = { click: { action: "del", params: { path: { $item: "" } } } };

    const { result } = renderHook(() => useEmit(on), {
      wrapper: createWrapper({ store, handlers, repeatPath: "/items/3", repeatIndex: 3 }),
    });

    await act(async () => {
      await result.current("click");
    });

    expect(handler).toHaveBeenCalledWith(
      { path: "/items/3" },
      expect.anything(),
    );
  });

  it("does not warn for built-in setState action", async () => {
    const store = createStore();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const on = { click: { action: "setState", params: { path: "/x", value: 1 } } };

    const { result } = renderHook(() => useEmit(on), {
      wrapper: createWrapper({ store }),
    });

    await act(async () => {
      await result.current("click");
    });

    expect(warn).not.toHaveBeenCalled();
    expect(store.get("/x")).toBe(1);
    warn.mockRestore();
  });

  it("skips warning for 'setState' action even when no handler registered", async () => {
    const store = createStore();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const on = { click: { action: "setState" } };

    // ActionProvider without builtins — setState is not in handlers
    const NoBuiltinsWrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider store={store}>
        <ActionProvider handlers={{}} store={store}>
          {children}
        </ActionProvider>
      </StoreProvider>
    );

    const { result } = renderHook(() => useEmit(on), {
      wrapper: NoBuiltinsWrapper,
    });

    await act(async () => {
      await result.current("click");
    });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("throws outside ActionProvider", () => {
    expect(() =>
      renderHook(() => useEmit(), {
        wrapper: ({ children }) => children,
      }),
    ).toThrow("useEmit must be used within an ActionProvider");
  });
});
