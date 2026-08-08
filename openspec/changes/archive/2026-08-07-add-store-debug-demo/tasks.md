## 1. Logging store wrapper

- [x] 1.1 Create `demo/src/cases/store-debug/logStore.ts` with `LogEntry` (`id`, `path`, `prev`, `next`, `noop`, `at`) and `createLogStore(store, { maxEntries })` returning `{ store, getEntries, subscribe, clear, setPaused }` per design D2 (delegating wrapper; `prev` read before delegating; `noop = prev === value`; newest-first, capped; `declare global` for `window.__store`)

## 2. Mini-app spec and handlers

- [x] 2.1 Create `demo/src/cases/store-debug/handlers.ts` with `updateSummary` (writes `/summary` and `/lastUpdated` in one dispatch) and `noopWrite` (sets `customer/name` to its current value)
- [x] 2.2 Create `demo/src/cases/store-debug/spec.json` describing the app per design D5: CaseContainer with BoundFields for `customer/name` and `customer/email`, the two action buttons, and a repeat over `tags` with a per-item BoundField (following the nested-repeat binding mechanics)
- [x] 2.3 Create `demo/src/cases/store-debug/registry.tsx` mapping the spec's types to shared demo components (CaseContainer, StackRow, BoundField, ActionButton)

## 3. Debug panel

- [x] 3.1 Create `demo/src/cases/store-debug/DebugPanel.tsx`: plain React, `useSyncExternalStore(subscribe, getEntries)`, renders entries newest-first with path/prev/next, marks `noop` entries, caps display at `maxEntries`, Clear button, Pause toggle, and a live state snapshot

## 4. Case page and registration

- [x] 4.1 Create `demo/src/cases/store-debug/StoreDebugCase.tsx`: store initialized with `{ customer: { name, email }, tags: [...], summary, lastUpdated, editingSection: true }`, wrapped via `createLogStore`, two-column layout with `<Renderer store={wrapped}>` and `<DebugPanel>` side by side
- [x] 4.2 Register the case in `demo/src/App.tsx` (import + `/store-debug` route) and `demo/src/HomePage.tsx` (CASES entry with title "Store Debug" and a description naming store write logging)

## 5. Docs sync

- [x] 5.1 Update `README.md` and `demo/README.md`: add the store-debug row to the demo tables, bump the case count, refresh line counts per AGENTS.md

## 6. Verify

- [x] 6.1 Run `npm test` — all tests pass
- [x] 6.2 Run `npm run coverage` — 100% thresholds still met
- [x] 6.3 Run the demo dev server and manually verify the spec scenarios: bound-field writes log entries, repeat item edits log item-scoped paths, multi-write button logs one entry per path, same-value write is marked no-op, Clear and Pause work, `window.__store.getState()` works in the console
