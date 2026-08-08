## Context

See proposal.md — Why. The archived `remove-store-debug-options` change removed `createStore(initial, { debug, log })` from `src/store.ts`; its design.md accepted "a console.log-based trace can be added ad hoc when actually needed (YAGNI)". The store is a duck-typed `Store` interface (`get`/`set`/`subscribe`/`getState`) with `set` as the single mutation entry point; the Renderer accepts any `Store` implementation. Existing demo conventions: shared components in `demo/src/components/` (BoundField, ActionButton, CaseContainer, StackRow, GridRow), per-case folders with `registry.ts(x)`, `spec.json`, `handlers.ts`, registration in `App.tsx` routes + `HomePage.tsx` CASES array, and demo specs under `openspec/specs/*-demo/`.

## Goals / Non-Goals

**Goals:**
- Prove full store write visibility works with a small wrapper, entirely in the demo — no `src/` changes, no public API change, no spec/behavior contract changes.
- Make the demo teach: every write source (bindings, actions, handlers) funnels through `set`; same-value writes are silently ignored by the store; a wrapped store sees everything including nested views.

**Non-Goals:**
- Reviving or re-adding `StoreOptions { debug, log }` to `createStore` — that is exactly the speculative plumbing the archived change removed; the wrapper is the "ad hoc trace" that removal pointed to.
- Building a general-purpose devtools library or documenting the wrapper as an official pattern in README/LLM.md (can be a follow-up change if the demo lands well).

## Decisions

**D1: The wrapper lives in the case folder, not `src/`.** `demo/src/cases/store-debug/logStore.ts`. Putting it in `src/` would make it public API surface (exports, LLM.md tables, coverage, tests) and undermine the demo's thesis: debugging needs no library support. Alternative considered: exporting it from the library as a documented utility — rejected for the same reason.

**D2: `createLogStore(store)` returns a control object + wrapped store, not just a store.**
```ts
createLogStore(store, { maxEntries = 100 }?)
  → { store: Store; getEntries(): LogEntry[]; subscribe(fn): () => void;
      clear(): void; setPaused(paused: boolean): void }
```
- `store` is the wrapper passed to `<Renderer>`. It delegates `get`/`subscribe`/`getState` verbatim; `set` records an entry then always delegates (the underlying store remains authoritative, including its same-value short-circuit).
- `prev` is read via `store.get(path)` *before* delegating; `noop = prev === value` (same reference/primitive comparison the store itself uses).
- Entries: `{ id, path, prev, next, noop, at }`, newest-first via unshift, capped at `maxEntries` (oldest dropped).
- `subscribe` notifies on every recorded entry (including no-ops and while paused → see D4); `getEntries()` returns a fresh array snapshot for `useSyncExternalStore`.
- `window.__store = store` (the underlying store) assigned in the case component with a `declare global` typing — one line that enables console poking (`__store.getState()`, `__store.get("/x")`).
- Alternative considered: a store that pushes to a plain array with the panel polling — rejected, subscription is 10 lines and keeps the UI honest/live.

**D3: The debug panel is plain React, not spec-driven.** `DebugPanel.tsx` sits next to the `<Renderer>` as a sibling column (like Breadcrumbs/DetailPanel patterns). The log panel is debugging chrome; making it spec-driven would be a self-referential demo of nothing and muddies the story that debugging lives outside the library. Alternative considered: registering it in the registry — rejected.

**D4: Panel updates via `useSyncExternalStore`.** `subscribe` + `getEntries()` map directly onto `useSyncExternalStore` (no effect, no tearing). Pause semantics: `setPaused(true)` stops *recording* new entries entirely (wrapper drops them before pushing), so "paused" means the log freezes — the underlying store keeps working. Alternative: record-but-hide — rejected, freezing the log is the more useful debugging affordance and simpler to reason about.

**D5: Mini-app composition (spec-driven, reusing shared components).** Single store initialized with `{ customer: { name, email }, tags: [{ label }...], summary, lastUpdated, editingSection: true }`:
- `CaseContainer` → `StackRow`: `BoundField` (name, bind `customer/name`), `BoundField` (email), an `ActionButton` "Update summary" firing `updateSummary` (a handler writing `/summary` and `/lastUpdated` in one dispatch — shows multi-path writes), an `ActionButton` "Write same value" firing `noopWrite` (sets `customer/name` to its current value — shows the no-op flag), and a repeat over `tags` with a per-item `BoundField` (item-scoped writes via the repeat base path, following the nested-repeat pattern; `BoundField` composes `usePath()` + `bind`).
- The wrapped store is passed to `<Renderer>`; `handlers` are the case's own.
- Alternative considered: embedding a `createStoreView` child package to show rebased paths — deferred, the nested-package case already demonstrates that; this demo's story is write visibility, not slice mechanics.

**D6: Registration and docs.** Route `/store-debug`, case folder `store-debug`, HomePage card (title "Store Debug", 🐞, description naming store write logging). README.md and demo/README.md: add the table row, bump case count, refresh line counts. These are mandatory syncs per repo AGENTS.md.

## Risks / Trade-offs

- [Demo-only value: the wrapper is not documented for consumers] → The demo itself is the documentation; a follow-up change can lift the pattern into README/LLM.md if it proves useful.
- [`window.__store` global needs typing] → `declare global` in the case file; harmless in a demo-only build.
- [Repeat item paths must resolve like nested-repeat for the item-scoped-write scenario] → Follow the existing nested-repeat case's binding mechanics; verify interactively during apply.
- [README line counts/case count drift] → The same change updates tables and counts (AGENTS.md requires it); `npm test` and `npm run coverage` still gate the change.
