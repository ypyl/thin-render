## 1. Remove the options

^- [x] 1.1 Remove `StoreOptions`, the `options` parameter, and the `debug`/`log` branches from `createStore` in `src/store.ts`
^- [x] 1.2 Remove the `describe("debug mode", ...)` block from `src/store.test.ts`

## 2. Verify

^- [x] 2.1 Grep `src/` for `StoreOptions`, `debug`, and `log` references (expect zero outside archives)
^- [x] 2.2 Run `npm test` — all tests pass
^- [x] 2.3 Run `npm run coverage` — 100% thresholds still met
