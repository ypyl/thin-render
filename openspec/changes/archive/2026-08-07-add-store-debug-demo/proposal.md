## Why

The archived `remove-store-debug-options` change removed `createStore`'s built-in `debug`/`log` option (every `set()` logged `[store] <path>: <prev> → <value>`). Its design.md accepted the risk: "a console.log-based trace can be added ad hoc when actually needed (YAGNI)". This demo proves that claim by showing full store write visibility with a ~20-line wrapper decorator — no library support required, and no reason to regret the deletion.

## What Changes

- Add a new demo case at `/store-debug` showing how to debug "what is going on with the store" **without any library change**:
  - `createLogStore(store)` — a `Store`-shaped wrapper that delegates `get`/`set`/`subscribe`/`getState` and records every `set()` call (path, previous value, new value, no-op detection) into an in-memory entry list with subscription support.
  - A spec-driven mini-app (bound fields, a repeat list with per-item edits, action buttons) whose store is the wrapped one — so every write from bindings, actions, handlers, and the built-in `setState` action appears in the log.
  - A live debug panel (plain React, not spec-driven) showing the write log (newest first, capped), a live state snapshot, and Pause/Clear controls. The wrapper also exposes the raw store as `window.__store` for console poking.
- Register the case on the home page (`CASES` array) and in the App router.
- Update `README.md` and `demo/README.md` demo tables and case counts.

## Capabilities

### New Capabilities

- `store-debug-demo`: The demo case at `/store-debug` that renders a spec-driven app over a logging store wrapper and a live write-log panel, proving debugging needs no library support.

### Modified Capabilities

None. No library code, public API, or behavior contracts change — this is demo-only.

## Impact

- `demo/src/cases/store-debug/` — new case folder: `StoreDebugCase.tsx`, `logStore.ts` (wrapper + `LogEntry`), `DebugPanel.tsx` (log UI), `spec.json`, `registry.tsx`, `handlers.ts`, `components.tsx`.
- `demo/src/App.tsx` — import + `/store-debug` route.
- `demo/src/HomePage.tsx` — new card in `CASES`.
- `README.md` / `demo/README.md` — demo table row, case count, line counts.
- No changes to `src/`, no public API changes, no dependency changes, no package changes.
