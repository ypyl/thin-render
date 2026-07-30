## 1. Extract expression resolution module

- [x] 1.1 Create `src/expressions.ts` with `resolveExpressions` and `resolveRepeatPath` extracted from `hooks.ts`, plus `getByPath` re-export from `store.ts`
- [x] 1.2 Update `src/hooks.ts` to import `resolveExpressions` and `resolveRepeatPath` from `./expressions.ts` instead of defining them inline; remove duplicated code
- [x] 1.3 Run existing tests to confirm no regressions

## 2. Implement generic renderer

- [x] 2.1 Create `src/renderer-generic.ts` with `renderGeneric` function and `GenericRegistry` type
- [x] 2.2 Implement recursive spec walk: resolve root element, call registry, recurse into children
- [x] 2.3 Implement expression resolution in props via `resolveExpressions` before each registry call
- [x] 2.4 Implement repeat handling: resolve `repeat.path`, iterate array/object, scope children to item path and index
- [x] 2.5 Implement missing-element and missing-type warnings (console.warn, return null)

## 3. Update public API

- [x] 3.1 Export `renderGeneric`, `GenericRegistry` from `src/index.ts`
- [x] 3.2 Run `npm run build` to verify TypeScript compilation

## 4. Write tests

- [x] 4.1 Write `src/expressions.test.ts`: cover `resolveExpressions` ($state, $item, $index, plain values, nested objects, arrays passthrough) and `resolveRepeatPath` (string, $state, $item forms)
- [x] 4.2 Write `src/renderer-generic.test.ts`: cover root element rendering, null/empty specs, expression resolution in props, repeat (array, object, $state, $item paths, empty iterables, non-iterables), nested repeats, missing element warnings, missing type warnings, children composition
- [x] 4.3 Run `npm run coverage` to verify 100% coverage is maintained

## 5. Verification

- [x] 5.1 Run `npm test` — all tests pass
- [x] 5.2 Run `npm run build` — clean compilation
- [x] 5.3 Run `npm run coverage` — 100% across lines, branches, functions, statements
