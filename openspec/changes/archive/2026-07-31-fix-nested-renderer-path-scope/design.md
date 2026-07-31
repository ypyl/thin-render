## Context

See proposal.md for motivation. Currently, `Renderer` wraps its output in `StoreProvider` and `ActionProvider` but does NOT provide `PathContext` or `RepeatIndexContext`. This means when a component inside a `RepeatScope` renders a nested `Renderer`, the React context mechanism causes `usePath()` and `useRepeatIndex()` in the nested tree to resolve to the outer repeat's values.

## Goals / Non-Goals

**Goals:**
- `Renderer` must establish a clean path-scope boundary so nested renderers don't inherit outer repeat context.
- No breaking changes to existing code paths.
- Minimal code change — one wrapper layer in `Renderer`.

**Non-Goals:**
- Not changing how `RepeatChildren` or `RepeatScope` work.
- Not adding a new API or hook.
- Not changing how `$item` / `$state` expressions resolve (they already use `basePath` from `PathContext`, which will now correctly be `""` inside a nested renderer).

## Decisions

### Decision: Reset contexts directly in `Renderer`

**Approach:** Wrap the `_ElementRenderer` inside `Renderer` with `PathContext.Provider` (value `""`) and `RepeatIndexContext.Provider` (value `undefined`).

**Why:** This is the simplest, most direct fix. The `Renderer` is already the natural boundary between independent spec trees. It already provides `StoreProvider` and `ActionProvider` — adding the context resets is consistent with that pattern.

**Alternatives considered:**
1. *Create a dedicated `ScopeBoundary` component* — overkill for a two-provider wrapper; adds an extra component layer for no behavioral benefit.
2. *Fix in `RepeatScope` to detect nested renderers* — impractical; `RepeatScope` has no knowledge of what children render, and this would couple repeat logic to renderer internals.
3. *Make `usePath()` detect when a Renderer ancestor is present* — fragile and breaks the clean context semantics that React provides.

### Decision: Both `PathContext` and `RepeatIndexContext` are reset

**Why:** They are a pair — a path scope without a matching index reset would leave `useRepeatIndex()` leaking. Resetting both keeps the contract consistent.

## Risks / Trade-offs

- **[Risk] Components relying on leaked path** — A component that (intentionally or accidentally) relied on `usePath()` returning an outer repeat's path inside a nested `Renderer` will now get `""`. This is the desired fix, not a bug, but could surface in existing code. → **Mitigation:** Document the boundary behavior clearly. No migration needed since the old behavior was unintentional.
- **[Trade-off] Adds two extra React context providers per `Renderer` mount** — negligible cost since these providers' values are constants and React optimizes constant-context providers.
