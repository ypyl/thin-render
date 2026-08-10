# Item Expression Scope Offset — Tasks

## 1. Core types and expression resolution

- [x] 1.1 Add optional `$scope?: number` to `ItemExpression` in `src/spec.ts`
- [x] 1.2 Update `resolveExpressions` in `src/expressions.ts` to accept the scope stack (`scopes: string[]`) instead of a single `basePath`, and resolve `$item` against `scopes[$scope ?? 0]` (undefined when out of range or invalid; `$scope` ignored on `$state`/`$index`)
- [x] 1.3 Keep `resolveRepeatPath` basePath-based; callers pre-resolve the offset (no signature change)

## 2. React renderer hooks

- [x] 2.1 `useResolvedPath` in `src/hooks.ts`: for `$item` expressions call `usePath($scope ?? 0)` instead of `usePath()`
- [x] 2.2 `useEmit` in `src/hooks.ts`: capture the full scope stack via `useContext(PathContext)` (replacing the `usePath()` capture), pass it to `resolveExpressions`, and include it in the `useMemo` dependency array alongside `repeatIdx`

## 3. Generic renderer

- [x] 3.1 `walk` in `src/renderer-generic.ts`: resolve `$item` in `repeat.path` against `scopes[$scope ?? 0]` (default `scopes[0]`) instead of always `scopes[0]`

## 4. Tests (100% coverage thresholds enforced)

- [x] 4.1 `src/expressions.test.ts`: `resolveExpressions` resolves `$item` with `$scope` against parent/grandparent scopes; out-of-range and invalid `$scope` resolve to undefined; omitted `$scope` behaves as `0`; `$scope` on `$state`/`$index` ignored
- [x] 4.2 `src/hooks.test.tsx`: `useResolvedPath` with `$scope: 1` returns the parent-scope path; out-of-range `$scope` returns undefined; `useEmit` resolves `$item` + `$scope` params against ancestor scopes; emit closure stays stable for a fixed-position element
- [x] 4.3 `src/renderer.test.tsx`: nested repeat with `{ $item: "colDefs", $scope: 1 }` renders the sibling-colDefs grid (rows × columns from per-table data); out-of-range `$scope` renders nothing; header and cells resolve correct paths
- [x] 4.4 `src/renderer-generic.test.ts`: repeat with `$scope` offset resolves against `scopes[$scope]`; out-of-range `$scope` renders no children; existing `$item`/`$state` repeat behavior unchanged

## 5. Demo case (stacked tables)

- [x] 5.1 Create `demo/src/cases/stacked-tables/` with a static `spec.json` (declares each table's columns under the tables element's `columns` prop; tableWrap repeat over `/tables`, headerRow repeat `{ $item: "colDefs" }`, tbody repeat `{ $item: "rows" }`, tr repeat `{ $item: "colDefs", $scope: 1 }`), `handlers.ts` (per-table datasets, rows only — no column derivation), `registry.tsx` reusing `CaseContainer`, `StackRow`, `ActionButton`, `Table`/`THead`/`TBody`/`Tr`, `ColumnHeader`, `DataCell`, and `StackedTablesCase.tsx` seeding colDefs from the spec's declared columns once then loading rows
- [x] 5.2 Register the `/stacked-tables` route in `demo/src/App.tsx`
- [x] 5.3 Add demo tests for the stacked-tables case (per spec: distinct column sets, per-table rows, empty cells for missing fields, load replaces one table only)

## 6. Docs sync (AGENTS.md)

- [x] 6.1 `README.md`: add the stacked-tables row to the demo table and update the case count; note the `$scope` capability in the relevant section
- [x] 6.2 `demo/README.md`: add the case row and update the case count
- [x] 6.3 `LLM.md`: add `$scope` to the Expression Matrix, update the `$item` key rules, add a stacked-tables pattern entry, and keep API tables in sync with `src/index.ts`

## 7. Verification

- [x] 7.1 Run `npm test` — all tests pass
- [x] 7.2 Run `npm run coverage` — 100% line/branch/function/statement thresholds pass
- [x] 7.3 Run `openspec validate --changes item-expression-scope-offset` — change is valid
