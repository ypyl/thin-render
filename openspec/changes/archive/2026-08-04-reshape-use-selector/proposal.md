## Why

`useSelector`'s whole-state selector signature `useSelector((s) => getByPath(s, "/editKey") === "Main")` forces three costs on every call site: a coarse whole-store subscription (every `set()` anywhere wakes the component), a `getByPath` import just to address the store, and reads that can silently escape the subscription scope. The common case is a single-path derived condition, where a path-scoped signature is strictly better — narrower wake-ups, property access, and a locally verifiable "reads within the window" contract.

## What Changes

- **BREAKING**: `useSelector<T>(selector: (state: unknown) => T)` becomes `useSelector<T>(path: string, derive: (value: unknown) => T)`.
- The `path` argument is the subscription **window**: the component is notified only on writes within that path's subtree, and the derive receives the value at the path (plain property access — no `getByPath` needed at call sites). Re-render granularity is unchanged: only when the derived value changes (strict equality).
- `useSelector("", derive)` is the whole-store window — equivalent expressiveness to today's general form, with property access instead of `getByPath` on the root object. Nothing the general form could express is lost.
- Multi-branch derives are expressed either via a common-ancestor window (`useSelector("/user", (u) => u.name === "Main" && u.role === "admin")`), the root window for unrelated branches, or composed narrow calls (`useSelector("/items", ...)` + `useSelector("/selectedId", ...)` combined in render).
- `getByPath` remains exported (still used internally and by `useValue`); only selector call sites stop needing it.
- Update `README.md` and `LLM.md` (hooks tables + derived-subscription pattern) and rewrite the `useSelector` test suite for the new signature, keeping 100% coverage.

## Capabilities

### New Capabilities
<!-- None — this change reshapes an existing capability. -->

### Modified Capabilities
- `use-selector`: signature changes from a whole-state selector to a path-scoped window + derive; subscription scope becomes path-bounded; the derive receives the value at the path instead of the full state; the root window (`""`) preserves whole-store derives.

## Impact

- `src/hooks.ts` — `useSelector` implementation: `subscribe` becomes `store.subscribe(path, listener)`; `getSnapshot` derives from `getByPath(store.getState(), path)`.
- `src/hooks.test.tsx` — `useSelector` suite rewritten for the new signature (window semantics, flip re-render, no-op bail-out, root window, missing-provider throw); 100% coverage gate unchanged.
- `src/index.ts` — export unchanged (same name, new signature).
- `README.md`, `LLM.md` — hooks table rows and the derived-subscription pattern updated.
- `openspec/specs/use-selector/spec.md` — requirements modified via this change's delta (base spec merged from the archived `add-use-selector` change).
