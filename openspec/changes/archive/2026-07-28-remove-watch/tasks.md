## 1. Remove from Source

- [x] 1.1 Remove `WatchMap` type and `watch` field from `UIElement` in `spec.ts`
- [x] 1.2 Remove `useWatch` from `renderer.tsx` and all watch-related imports
- [x] 1.3 Remove watch from expression resolution paths if referenced in hooks.ts

## 2. Remove from Demo

- [x] 2.1 Delete `demo/src/cases/watch-validation/` directory
- [x] 2.2 Remove watch-validation route from `demo/src/App.tsx` or routing file
- [x] 2.3 Remove watch-validation entry from HomePage navigation

## 3. Update Documentation

- [x] 3.1 Update `README.md` — remove Watch section, update expression bullets
- [x] 3.2 Update `Q&A.md` — remove 5 Watch questions, remove watch column from expression matrix, add reactive component pattern
- [x] 3.3 Update `LLM.md` — remove watch pattern, remove watch column from expression matrix
- [x] 3.4 Update `AGENTS.md` — remove watch references if present

## 4. Verification

- [x] 4.1 Run `npm test` to confirm no regressions
- [x] 4.2 Verify demo builds (`npx tsc --noEmit` in demo/)
