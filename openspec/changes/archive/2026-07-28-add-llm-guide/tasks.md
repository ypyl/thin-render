## 1. Write LLM.md

- [x] 1.1 Draft Concepts section — ASCII diagram + one-line descriptions of Spec, Registry, Store, Handlers
- [x] 1.2 Draft API Reference section — types table, hooks table, handler contract, component contract
- [x] 1.3 Draft Expression Matrix — 5-context × 3-expression constraint table + path syntax rules
- [x] 1.4 Draft Patterns section — 6 patterns with complete code + minimal complete example

## 2. Review & Polish

- [x] 2.1 Verify all type signatures, hook names, and exports match `src/index.ts`
- [x] 2.2 Verify expression matrix is accurate against `src/spec.ts` types and `src/hooks.ts` resolution logic
- [x] 2.3 Verify pattern code compiles (spec JSON structure matches Spec type, components match ComponentProps, handlers match Handler type)
- [x] 2.4 Verify `package.json` includes `LLM.md` in its `files` field (or add it)

## 3. Verification

- [x] 3.1 Run `npm test` to confirm no regressions
