## 1. Fix: Reset path scope in Renderer

- [x] 1.1 Update `Renderer` in `src/renderer.tsx` to wrap its output in `PathContext.Provider` (value `""`) and `RepeatIndexContext.Provider` (value `undefined`). Import these contexts from `./hooks`.

## 2. Tests

- [x] 2.1 Add test: nested renderer resets `PathContext` — a component inside a repeat renders a `<Renderer>`, `usePath()` inside that nested renderer returns `""` not the outer repeat path.
- [x] 2.2 Add test: nested renderer resets `RepeatIndexContext` — same setup, `useRepeatIndex()` returns `undefined` not the outer repeat index.
- [x] 2.3 Add test: outer repeat scope unaffected by nested renderer — sibling components in the same repeat row still get the correct `usePath()` value.

## 3. Verification

- [x] 3.1 Run `npm test` — all tests pass
- [x] 3.2 Run `npm run coverage` — 100% coverage maintained
