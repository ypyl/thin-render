## 1. Shrink the hook

^- [x] 1.1 In `src/hooks.ts`, make `useBound` return `useSetValue(path)` directly (drop the wrapper closure)

## 2. Verify

^- [x] 2.1 Run `npm run build` — TypeScript accepts the narrowed tuple type
^- [x] 2.2 Run `npm test` — all tests pass
^- [x] 2.3 Run `npm run coverage` — 100% thresholds still met
