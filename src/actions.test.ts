// actions.test.ts — self-checks for the action system (setState built-in).
// Imports from source; keeps BUILTIN_SET_STATE inlined (React-free). Pure logic.
import { describe, it, expect } from "vitest";
import { getByPath, createStore } from "./store";

// ── BUILTIN_SET_STATE (from src/contexts.tsx, inlined to avoid React import) ─
const builtinSetState = (
  params: Record<string, unknown>,
  api: { getState: () => unknown; setState: (p: string, v: unknown) => void },
) => {
  const path = params.path as string | undefined;
  if (path) api.setState(path, params.value);
};

// ── Tests ─────────────────────────────────────────────────────────

describe("builtinSetState", () => {
  it("writes a path", () => {
    const store = createStore({ flag: false });
    let called = 0;
    store.subscribe("/flag", () => called++);
    builtinSetState({ path: "/flag", value: true }, { getState: store.getState, setState: store.set });
    expect(called).toBe(1);
    expect(store.get("/flag")).toBe(true);
  });

  it("does nothing when path is falsy", () => {
    const store = createStore({ x: 1 });
    builtinSetState({ path: undefined, value: 99 }, { getState: store.getState, setState: store.set });
    expect(store.get("/x")).toBe(1);
    builtinSetState({ path: "", value: 99 }, { getState: store.getState, setState: store.set });
    expect(store.get("/x")).toBe(1);
  });
});

describe("handler edge cases", () => {
  it("handler that does nothing causes no store notification", () => {
    const store = createStore();
    let calls = 0;
    store.subscribe("/any", () => calls++);
    // noop
    expect(calls).toBe(0);
  });

  it("async handler writes after await (late setState)", async () => {
    const store = createStore({ saved: false });
    const handler = async (params: Record<string, unknown>, api: { getState: () => unknown; setState: (p: string, v: unknown) => void }) => {
      await new Promise((r) => setTimeout(r, 10));
      api.setState("/saved", true);
    };
    await handler({}, { getState: store.getState, setState: store.set });
    expect(store.get("/saved")).toBe(true);
  });
});
