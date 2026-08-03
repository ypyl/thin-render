## 1. Implementation

- [x] 1.1 Add `useSelector<T>(selector: (state: unknown) => T): T` to `src/hooks.ts`: `useStore()`, `useCallback` subscribe at root (`store.subscribe("", listener)`), `getSnapshot` of `selector(store.getState())`, wired through `useSyncExternalStore`. Include JSDoc covering the stable-snapshot contract and the coarse-subscription trade-off (per design D1/D2/D3).
- [x] 1.2 Export `useSelector` from `src/index.ts` next to the other hooks.

## 2. Tests

- [x] 2.1 Add a `useSelector` describe block to `src/hooks.test.tsx` covering the spec scenarios: reads a derived value, multi-path derivation, re-renders when the derived boolean flips, does NOT re-render when the derived value is unchanged (count renders), re-renders when an unrelated path change alters the result, works inside a repeat scope (via `createWrapper({ repeatPath })`), and throws outside a `StoreProvider`.
- [x] 2.2 Run `npm test` and `npm run coverage` — all suites pass and coverage stays at 100% thresholds.

## 3. Docs

- [x] 3.1 Update `README.md`: add `useSelector` row to the Hooks table with signature `(state: unknown) => T` and a note on re-render semantics (selected-value granularity vs per-path).
- [x] 3.2 Update `LLM.md`: add `useSelector` to the API Reference hooks table and add a "Derived subscription (useSelector)" pattern showing the `/editKey === "Main"` case, with the stable-snapshot caveat.
- [x] 3.3 Re-read both docs after the change and fix any drift (line counts, exports list, patterns).
