## 1. Remove the dead hook

^- [x] 1.1 Remove `useItemPath` and its doc comment from `src/hooks.ts`
^- [x] 1.2 Remove the `useItemPath` import and `describe("useItemPath", ...)` block from `src/hooks.test.tsx`

## 2. Verify

^- [x] 2.1 Grep the repo for remaining `useItemPath` references (expect zero outside the archived change)
^- [x] 2.2 Run `npm test` — all tests pass
^- [x] 2.3 Run `npm run coverage` — 100% thresholds still met
