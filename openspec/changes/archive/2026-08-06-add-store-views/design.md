# Design: add-store-views

## Context

thin-render's `Store` interface (`get`/`set`/`subscribe`/`getState`) is the single seam every hook reads through (`useValue`, `useBound`, `useSelector`, `useEmit`'s accessors). A nested `<Renderer>` already creates a clean world boundary: it resets `PathContext` to `[""]` and mounts fresh `StoreProvider` + `ActionProvider`. What's missing is a way to point that nested world at a *subtree* of an existing store without copying data. See proposal.md — Why.

## Goals / Non-Goals

**Goals**
- One parent store as the single source of truth; child package reads/writes its subtree live.
- Zero changes to the renderer, hooks, contexts, or spec schema.
- The bridge (`parent.*` namespace) stays userland code inside the child package, not a library export — until the demo proves it deserves one.

**Non-Goals**
- No `rootPath`/`basePath` props on `Renderer` (occurrence identity comes from child data ids, not self-location).
- No package registry or spec-library context (static import only).
- No read-only view variant (write-back is required).
- No change to path syntax or JSON-Pointer escaping.

## Decisions

### D1: A store view (path-prefixed wrapper) instead of per-instance stores

`createStoreView(store, basePath)` returns a plain object implementing `Store`. `join(p) = normalizePath(p) ? \`${basePath}/${normalizePath(p)}\` : basePath`. All four methods delegate with joined paths; the view keeps no listener registry of its own.

- `get(p)` → `store.get(join(p))`
- `set(p, v)` → `store.set(join(p), v)`
- `subscribe(p, fn)` → `store.subscribe(join(p), fn)` (returns the delegated unsubscribe)
- `getState()` → `store.get(basePath)` — the subtree snapshot, so relative reads against it work

**Why**: the view is a `Store`, so it plugs into `StoreProvider`, `ActionProvider`, and every hook unchanged. Subscription granularity is preserved by construction — `pathsOverlap` runs on the joined absolute paths, so writes outside the subtree never notify a child listener, and writes inside it notify exactly as they would for a direct subscriber.

**Alternatives considered**:
- *Separate store per occurrence + sync bridges* (current workaround): data copies, re-seeding races, clobbered edits, closure-emitted events bypassing the action system. Rejected.
- *Context-based path rebasing inside hooks* (a `PathBaseContext` consulted by `useValue`/`useSetValue`/`useEmit`): touches every hook, adds a second scope concept alongside `PathContext`, and `useSelector`/`useBound` would each need the same treatment. The store wrapper confines the concern to one 15-line function. Rejected.
- *Flattening the child spec into the parent spec*: path rewriting, key collisions, no reuse. Rejected.

### D2: `getState()` returns the subtree snapshot

`useValue`'s snapshot is `getByPath(store.getState(), path)` — the snapshot source must therefore be scoped to the same root the given paths are relative to. Returning the full root state would make child reads resolve against the *parent's* `/x`, not the subtree's. A bonus: child handlers' `getState` is automatically scoped to the child world (their accessors come from the view via `ActionProvider`).

### D3: Child → parent events via a `parent.*` bridge in the boundary component

The child package ships `EmbeddedChild`, a registry component that: resolves the base path from element props (`useItemPath`, so `{ $item: "data" }` works inside parent repeats), builds the view (D1), and renders a nested `<Renderer>` with `handlers = { ...childHandlers, ...bridge }`.

The bridge is built per occurrence from the parent's `ActionContext` (captured via `useContext` in the boundary — it sits inside the parent's `ActionProvider`):

```
for each parent handler name N:  "parent.N" = (params, api) => parentHandler(params, parentApi)
```

- Params are passed through **untouched** — they were already resolved in the child's world by the child's `useEmit` (child-scoped `$state` → values). No `childBase` injection into params or api (user decision during exploration).
- Accessors are the **parent's** (from `parentApi`), so the handler can read/write anywhere in the parent store.
- Occurrence identity is carried by the child data's own `id` field, referenced in the child spec's params (`{ id: { $state: "/id" } }`).
- The bridge map is memoized on `[parentAction, base, childHandlers]` — stable per occurrence.
- Nesting child-of-child: the inner boundary sees the outer bridge's names in its parent context, so `parent.<app-level-name>` keeps working at any depth.
- Standalone mode (`StandaloneChild` with its own store): no bridge; `parent.*` actions warn as unknown handlers — same spec/registry, different wiring.

**Alternatives considered**:
- *Declarative on-map on the parent's boundary element, payload via store*: the parent spec would need to know the child's outbox path convention — leaks child internals into the parent JSON and resurrects the temp-path pattern. Rejected.
- *Injecting `childBase` into the handler api*: user explicitly wants the parent handler to receive only what the child passes. Rejected.

### D4: Demo shape — two embedded occurrences + detail panel

Parent store: `/top/customer` and `/bottom/customer` (distinct data objects, each with an `id`), plus `/detail`. The child package renders a customer card: name/email display, an editable notes `BoundField` (proves write-back), and a "Load details" button firing `parent.loadDetail` with `{ id: { $state: "/id" } }`. The parent's `loadDetail` handler derives a detail payload from the id (simulated fetch — no network in the demo) and writes `/detail`; a parent-side panel subscribes and renders it.

Child package folder (`demo/src/cases/nested-package/`): `child/` (spec.ts, registry.tsx, handlers.ts, components, `EmbeddedChild.tsx`, `StandaloneChild.tsx`) + the parent case files (store, parent spec, parent handlers, parent registry wiring, `NestedPackageCase.tsx`). Demo components reuse existing universal components from `demo/src/components/` where possible.

### D5: Empty base path is valid and behaves as an identity view

`createStoreView(store, "")` joins paths without a prefix — a degenerate but consistent case (renderer at root). No special-casing beyond the join function; the spec covers it via the empty-path scenario.

## Risks / Trade-offs

- **Path segment collisions**: a segment in `basePath` containing `/` breaks joining (no escaping in the path syntax). → Same limitation as all store paths today; base paths are authored, not user input. Documented, not fixed.
- **View identity churn**: if the base path changes (e.g. parent repeat reorder), the view is recreated and the nested renderer re-subscribes. → Cheap (no own state); child components re-render from fresh snapshots. Declarative behavior, no manual lifecycle.
- **Nested `parent.*` doubling**: at depth >1 the bridge also registers `parent.parent.<name>` entries (harmless noise). → Documented in LLM.md; child authors always use `parent.<app-level-name>`.
- **Bridge is userland**: the convention (`parent.` prefix) could drift across packages. → Captured as a documented pattern in README/LLM.md; extract a library helper only if the demo proves repeated need.
- **100% coverage thresholds**: new export needs exhaustive tests including degenerate branches. → `store.test.ts` mirrors the spec scenarios 1:1.

## Migration Plan

Pure addition: new export + new demo case + docs. No existing behavior changes, no breaking changes, no rollback surface. `README.md`/`LLM.md`/`demo/README.md` are updated in the same change (per AGENTS.md), including API table, demo tables, and counts.

## Open Questions

None — remaining unknowns (exact demo styling, component names) are implementation details that don't affect specs or architecture.
