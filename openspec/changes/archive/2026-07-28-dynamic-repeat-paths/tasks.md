## 1. Types

- [x] 1.1 Add `ItemExpression` and `StateExpression` interfaces to `src/spec.ts`
- [x] 1.2 Broaden `RepeatConfig.path` type to `string | ItemExpression | StateExpression`

## 2. Core hook

- [x] 2.1 Implement `useResolvedPath(expr: unknown): string | undefined` in `src/hooks.ts`
  - String passthrough
  - `{ $item }` → delegate to `useItemPath` logic (RepeatPathContext, no subscription)
  - `{ $state }` → `useValue` to read the pointer path (subscribes)
  - Unknown shape → `undefined`
  - `$state` pointing to non-string → `console.warn` + return `""`

## 3. Renderer

- [x] 3.1 Update `RepeatChildren` in `src/renderer.tsx` to resolve `repeat.path` via `useResolvedPath` before `useValue` and base path construction
- [x] 3.2 Fall back to `""` when `useResolvedPath` returns `undefined`

## 4. Exports

- [x] 4.1 Export `useResolvedPath` from `src/hooks.ts`
- [x] 4.2 Export `ItemExpression` and `StateExpression` types from `src/spec.ts`
- [x] 4.3 Add new exports to `src/index.ts`

## 5. Tests

- [x] 5.1 Add `useResolvedPath` tests to `src/hooks.test.ts`: string passthrough, `$item` resolution (inside/outside repeat), `$state` resolution, `$state` reactivity, non-string `$state`, unknown shape, empty `$state`
- [x] 5.2 Add `RepeatChildren` tests to `src/renderer.test.tsx`: nested repeat via `$item`, dynamic target via `$state`, `$state` switching re-renders, `$state` pointing to non-string renders nothing

## 6. Demo

- [x] 6.1 Add a nested-repeat demo case under `demo/src/cases/nested-repeat/` with a two-level repeat (rows → sub-items) using `{ $item: "subitems" }` in a pure JSON spec
- [x] 6.2 Register the new case in the demo app

## 7. Verification

- [x] 7.1 Run `npm test` — all tests pass
- [x] 7.2 Run `npm run coverage` — verify 100% coverage maintained
- [x] 7.3 Manual check: `npm run dev` in demo/, verify nested repeat renders correctly and cell edits only re-render the target cell
