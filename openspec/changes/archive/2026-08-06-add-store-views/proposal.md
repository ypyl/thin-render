## Why

Embedding a self-contained spec package (its own spec, registry, components, and handlers) inside a bigger spec currently forces a separate store per embedded occurrence: the child data subtree is copied into a new store, sync bridges keep the copies in line, and child actions reaching the parent require bypassing the action system (temp paths in the parent store, closure-emitted events). This duplicates data, adds per-instance lifecycle management, and makes write-back and cross-boundary events fragile.

## What Changes

- Export `createStoreView(store, basePath)` from `src/store.ts`: a path-prefixed view of an existing store implementing the same `Store` interface. `get`/`set`/`subscribe` rebase the given path onto `basePath`; `getState()` returns the subtree snapshot at `basePath`. No new listener registry, no data copies — granular per-path subscriptions are preserved by delegation.
- Add a `nested-package` demo case: a child package (own spec JSON, components, registry, handlers, plus an `EmbeddedChild` boundary component) rendered at multiple places inside a bigger spec using one parent store. The child writes back through its view, and fires a parent-level action (`parent.loadDetail`) with its own id as payload; the parent handler fetches and writes the result to a parent-level detail panel.
- Document the embedding pattern in `README.md` and `LLM.md`: store views, the boundary component, the `parent.*` action namespace, and standalone-vs-embedded parity (same spec and registry in both modes).
- No changes to the renderer, hooks, contexts, or spec schema.

## Capabilities

### New Capabilities
- `store-views`: `createStoreView` behavior — path-joining semantics, subtree `getState`, subscription delegation with preserved granularity, set materialization, view-of-view composition, and degenerate cases (empty base, missing subtree).
- `nested-package-demo`: the demo case — child package embedded at multiple occurrences, write-back through the view, and the `parent.*` bridge flow from child action to parent handler with id payload.

### Modified Capabilities
<!-- None: path-based-store requirements are unchanged; the view is a new consumer of the existing Store interface. -->

## Impact

- `src/store.ts`: new exported `createStoreView` function + `src/store.test.ts` coverage (100% thresholds enforced).
- `src/index.ts`: new exports `createStoreView` and `ActionContext` (the latter needed by the boundary component to bridge parent actions into the nested renderer — see design D3).
- `demo/src/cases/nested-package/`: new case folder (child package + parent case), `demo/src/App.tsx` route, home page card.
- `README.md` and `LLM.md`: pattern section, API table entries, demo table row, case and line counts.
- `demo/README.md`: demo table row for the new case.
- No breaking changes; no new dependencies.
