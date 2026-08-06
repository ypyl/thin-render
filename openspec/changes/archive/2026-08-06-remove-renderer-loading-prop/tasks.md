## 1. Remove the prop

^- [x] 1.1 Remove `loading` from `RendererProps` and `Renderer` in `src/renderer.tsx`; drop it from `_ElementRenderer`, `buildSlots`, `RepeatChildren`, `RepeatSlots`, `RepeatSlotItem` signatures and their call sites; make the missing-element warning unconditional; update the memo comment
^- [x] 1.2 Remove the `loading`-specific tests from `src/renderer.test.tsx` (lines ~77-109) and update any other `loading` usages

## 2. Update docs and specs

^- [x] 2.1 Remove the `loading` row from the Renderer API table in `README.md`
^- [x] 2.2 Verify the delta spec `specs/renderer/spec.md` matches the implemented behavior (warnings always log)

## 3. Verify

^- [x] 3.1 Grep `src/` for `loading` references (expect only unrelated names in comments/docs)
^- [x] 3.2 Run `npm test` — all tests pass
^- [x] 3.3 Run `npm run coverage` — 100% thresholds still met
