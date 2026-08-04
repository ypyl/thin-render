## 1. Core Implementation

- [x] 1.1 Reshape `useSelector` in `src/hooks.ts` to `useSelector<T>(path: string, derive: (value: unknown) => T): T` — subscribe via `store.subscribe(path, listener)`, snapshot via `derive(getByPath(store.getState(), path))`
- [x] 1.2 Update the hook's JSDoc: window semantics (path = subscription scope + access scope, derive receives the value at path, `""` = whole store), property access instead of `getByPath` at call sites, stable-snapshot caveat, "tightest window" guidance

## 2. Tests

- [x] 2.1 Rewrite the `useSelector` suite in `src/hooks.test.tsx` for the new signature: returns derived value from one path (`useSelector("/editKey", (v) => v === "Main")`), derive receives the subtree value via property access, root window receives the full state
- [x] 2.2 Window behavior: write inside the window notifies (e.g. `/user/name` write with window `/user`), write outside the window does not notify (no re-evaluate), root window notifies on any write
- [x] 2.3 Re-render contract: flips re-render, unchanged derived value bails out, same-subtree multi-field derive re-renders when the combined result changes
- [x] 2.4 Repeat scope usage and the missing-provider throw path

## 3. Docs & API Sync

- [x] 3.1 Update `README.md`: hooks table row for `useSelector` (new signature `(path, derive)` + window description) and the derived-values bullet at line 40
- [x] 3.2 Update `LLM.md`: API table row, import example line 43, and the section 6 "Derived Subscription" pattern (`useSelector("/editKey", (v) => v === "Main")`; root-window and composed-narrow multi-branch guidance; drop `getByPath` from the pattern import)
- [x] 3.3 Cross-check: `src/index.ts` export unchanged (same name, new signature) and API tables in README.md + LLM.md in sync with exports (added missing `useStore` row to README.md)

## 4. Verification

- [x] 4.1 Run `npm test` — all suites pass
- [x] 4.2 Run `npm run coverage` — 100% thresholds (lines/branches/functions/statements) enforced
- [x] 4.3 Run `openspec validate --changes reshape-use-selector` — change validates cleanly
