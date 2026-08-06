## 1. Remove the delegate

^- [x] 1.1 Remove `resolveParams` from `src/hooks.ts` and update `useEmit` to call `resolveExpressions` directly
^- [x] 1.2 Remove the `resolveParams` import and `describe("resolveParams", ...)` block from `src/actions.test.ts`

## 2. Verify

^- [x] 2.1 Grep `src/` for remaining `resolveParams` references (expect zero)
^- [x] 2.2 Run `npm test` — all tests pass
^- [x] 2.3 Run `npm run coverage` — 100% thresholds still met
