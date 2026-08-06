# Tasks: add-store-views

## 1. Library: createStoreView

- [x] 1.1 Implement `createStoreView(store, basePath)` in `src/store.ts` per design D1: join paths (empty path → basePath, leading `/` normalized), delegate `get`/`set`/`subscribe` with joined paths, `getState()` returns `store.get(basePath)`. No own listener registry.
- [x] 1.2 Export `createStoreView` from `src/index.ts`.
- [x] 1.3 Add unit tests in `src/store.test.ts` mirroring `specs/store-views/spec.md` scenarios 1:1: read-through get, write-through set, empty path → base subtree, leading-slash optionality, subtree-scoped getState, notify on in-subtree write, no notify on out-of-subtree write, unsubscribe removes delegated listener, set materializes missing base, view-of-view composition.
- [x] 1.4 Run `npm test` and `npm run coverage` — 100% thresholds must pass.

## 2. Demo: nested-package case

- [x] 2.1 Create `demo/src/cases/nested-package/child/` package: child spec (customer card: name/email display, editable notes field, "Load details" button with `on: { click: { action: "parent.loadDetail", params: { id: { $state: "/id" } } } }`), child registry, child handlers, child components (reuse universal components from `demo/src/components/` where possible).
- [x] 2.2 Add `EmbeddedChild.tsx` to the child package: resolves base from element props via `useItemPath` (string or `{ $item: ... }`), builds `createStoreView(useStore(), base)` memoized on `[store, base]`, builds the `parent.*` bridge from the parent `ActionContext` (params passed through untouched, parent accessors), renders nested `<Renderer>` with child spec/registry and merged handlers.
- [x] 2.3 Add `StandaloneChild.tsx` to the child package: same spec/registry with its own `createStore` — proves standalone-vs-embedded parity.
- [x] 2.4 Create the parent case: single store with `/top/customer` and `/bottom/customer` (distinct data, each with an id) and `/detail`; parent spec embeds the child at both paths (type registered from the child package, `props.base` per occurrence) plus a detail panel subscribing to `/detail`; parent handlers include `loadDetail` that derives a payload from the received id (simulated fetch) and writes `/detail`.
- [x] 2.5 Wire `NestedPackageCase.tsx` into `demo/src/App.tsx` (route `/nested-package`, home page card) and register the child type in the parent registry.
- [x] 2.6 Verify the case manually in the dev server (`npm run dev` in `demo/`): both occurrences render own data, notes edit writes back to the right base path only, "Load details" shows the right payload per occurrence.

## 3. Docs (READMEs and LLM.md stay in sync per AGENTS.md)

- [x] 3.1 Add the embedding pattern section to `README.md` and `LLM.md`: store views, `EmbeddedChild`/boundary component, `parent.*` namespace convention, standalone-vs-embedded parity, nesting-depth note (`parent.<name>` works at any depth).
- [x] 3.2 Update API tables in `README.md` and `LLM.md` with `createStoreView` (signature, contract, `Store` return type) and `ActionContext` (exported from `src/index.ts` for the boundary bridge).
- [x] 3.3 Update demo tables and counts in `README.md` and `demo/README.md` with the nested-package row (name, what-it-shows, source links, case count).
- [x] 3.4 Update line count / test count references in the READMEs if present.

## 4. Validation

- [x] 4.1 Run `npm test` and `npm run coverage` — 100% thresholds must pass.
- [x] 4.2 Run `openspec validate --changes add-store-views` and fix any drift (proposal/specs/design/tasks consistency).
