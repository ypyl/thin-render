## 1. Rename in Source

- [x] 1.1 Rename `useRepeatPath` → `usePath` in `src/hooks.ts` (definition + all references)
- [x] 1.2 Rename `RepeatPathContext` → `PathContext` in `src/hooks.ts`
- [x] 1.3 Update `src/index.ts` export
- [x] 1.4 Update `src/renderer.tsx` (imports + usage in RepeatScope)
- [x] 1.5 Update `src/hooks.test.tsx` (imports + test cases)
- [x] 1.6 Update `src/renderer.test.tsx` if references exist

## 2. Rename in Demo

- [x] 2.1 Update `useRepeatPath` → `usePath` in all demo components that import it

## 3. Update Documentation

- [x] 3.1 Update `README.md` — hooks table + repeat section
- [x] 3.2 Update `LLM.md` — hooks table, import example, patterns
- [x] 3.3 Update `Q&A.md` — all references

## 4. Verification

- [x] 4.1 Run `npm test` to confirm no regressions
- [x] 4.2 Verify demo builds (`npx tsc --noEmit` in demo/)
