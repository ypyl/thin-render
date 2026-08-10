# Item Expression Scope Offset

## Why

Applications that hold many tables with different schemas cannot render all of them stacked from a single static spec. The row × column cross-product requires a repeat over a table's colDefs nested inside the rows repeat, but `$item` expressions resolve only against the innermost repeat scope — so the inner column repeat cannot reach its table's colDefs at the parent scope. Components can already climb the scope stack via `usePath(offset)`; repeat-path expressions cannot. Today the only workarounds are denormalizing colDefs into every row or moving the cross-product into component glue, neither of which keeps the "one static spec renders any table" promise.

## What Changes

- `$item` expressions gain an optional `$scope` offset: `{ "$item": "colDefs", "$scope": 1 }` resolves against the parent repeat scope (`1` = parent, `2` = grandparent, …), mirroring `usePath(offset)`.
- `$scope` defaults to `0` (innermost scope), so every existing spec is unchanged — non-breaking.
- `$scope` is honored in `repeat.path` expressions (React renderer) and in action `params` resolution; the generic renderer honors it via its scope stack (`ctx.scopes`).
- Out-of-range or invalid `$scope` resolves to `undefined`, matching `usePath(offset)` semantics.
- New `stacked-tables` demo case: multiple differently-schemed tables rendered stacked from one static spec and one `/tables` data map (each table subtree carries its own `rows` + `colDefs`).
- README.md, demo/README.md, and LLM.md (Expression Matrix) kept in sync.

## Capabilities

### New Capabilities
- `stacked-tables-demo`: a demo case rendering multiple tables with different column sets from a single static spec and a per-table data map, exercising the `$scope` offset.

### Modified Capabilities
- `dynamic-repeat-paths`: `$item` expressions in `repeat.path` accept an optional `$scope` offset and resolve against the scope stack at that depth; nested repeat composition covers offset resolution.
- `item-expression-action`: `$item` in action `params` honors `$scope`; `useEmit` captures the element's scope stack for offset resolution at dispatch time.
- `renderer-generic`: the generic renderer's repeat iteration honors `$scope` by resolving repeat paths against `ctx.scopes[$scope]`.
- `spec-schema`: the `repeat.path` expression shape (`ItemExpression`) gains the optional `$scope` field.

## Impact

- `src/spec.ts` — `ItemExpression` gains `$scope?: number`.
- `src/expressions.ts` — `resolveExpressions` and `resolveRepeatPath` resolve `$item` against the scope at `$scope` depth.
- `src/hooks.ts` — `useResolvedPath` uses `usePath($scope ?? 0)`; `useEmit` captures the scope stack instead of only the innermost path.
- `src/renderer-generic.ts` — `walk` resolves `$item` against `scopes[$scope ?? 0]`.
- Tests: `expressions.test.ts`, `hooks.test.tsx`, `renderer.test.tsx`, `renderer-generic.test.ts` (100% coverage thresholds enforced).
- Demo: new `demo/src/cases/stacked-tables/` case, route registration in `demo/src/App.tsx`, case tables in `README.md` and `demo/README.md` (count updated), Expression Matrix and patterns in `LLM.md`.
