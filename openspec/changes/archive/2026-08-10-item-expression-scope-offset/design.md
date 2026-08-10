# Item Expression Scope Offset — Design

## Context

See proposal.md for motivation. The library already exposes a scope stack to components via `usePath(offset)` (see specs/repeat-scope-stack), and `repeat.path` expressions resolve `$item` against the innermost scope only (see specs/dynamic-repeat-paths). `resolveExpressions` and `resolveRepeatPath` in `src/expressions.ts` are internal (not exported from `src/index.ts`), so their signatures are free to change. Both the React renderer (`src/hooks.ts`, `src/renderer.tsx`) and the generic renderer (`src/renderer-generic.ts`) resolve repeat paths; the generic renderer already carries the full scope stack in `ctx.scopes` and its internal `walk` uses `scopes[0]`.

## Goals / Non-Goals

**Goals:**
- `$item` expressions can target ancestor repeat scopes via an optional `$scope` depth.
- Works identically in `repeat.path` (React + generic renderers) and action `params`.
- One static spec renders multiple differently-schemed tables stacked (new demo case).
- Non-breaking: omitted `$scope` behaves exactly as today.

**Non-Goals:**
- New repeat modes (key/column auto-iteration, static-data repeat) — out of scope, would fight the path-scope model.
- Store-level derived colDefs (`derive` helper) — separate concern, not needed for this pattern.
- Changes to `usePath` itself, or `$scope` on `$state`/`$index` expressions (`$state` is store-based, `$index` is numeric; a scope depth is meaningless there).
- Spec generation (the `buildTableSpec` factory fallback) — remains a documented alternative.

## Decisions

### 1. `$scope` lives on the `$item` expression object
Shape: `{ $item: "colDefs", $scope: 1 }` — an optional field on `ItemExpression` in `src/spec.ts`.

- **Why:** the expression is self-contained, works in both `repeat.path` and `params` through the shared type, and reads naturally in JSON. An alternative — putting the offset on the `repeat` config (`repeat: { path: {...}, scope: 1 }`) — would only work for repeats, not params, and would split one concept across two places.
- **Alternative considered:** a dedicated `{ $parent: "colDefs" }` expression. Rejected: less general (depth is arbitrary, not just 1), and a second expression kind costs more spec/test surface.

### 2. Naming: `$scope`, mirroring the "scope stack" terminology
The codebase already talks in scopes: `PathContext` scope stack, `RepeatScope`, `ctx.scopes`. `$scope: 1` reads as "the scope one level up". `usePath(offset)` uses "offset" for the hook parameter; `$scope` is the JSON-facing name. Cosmetic, not behavioral.

### 3. Semantics mirror `usePath(offset)` exactly
`$scope` is a stack depth: `0` = innermost (default), `1` = parent, … Any value that is not a non-negative integer within stack bounds resolves to `undefined` — same silent behavior as `usePath` out-of-range. No new warning modes; resolution stays pure string concatenation (no store read, no subscription).

### 4. Resolution is applied at three call sites, all internal
- `src/hooks.ts` `useResolvedPath` — for `$item` expressions, call `usePath($scope ?? 0)` instead of `usePath()`.
- `src/renderer-generic.ts` `walk` — resolve `$item` against `scopes[$scope ?? 0]` instead of `scopes[0]` (the walk already has the stack).
- `src/hooks.ts` `useEmit` — capture the full scope stack (`useContext(PathContext)`) instead of only `usePath()`, and pass it to `resolveExpressions`; `resolveExpressions` resolves `$item` against `scopes[$scope ?? 0]` (falling back to `undefined` for out-of-range). `resolveExpressions`' signature changes from a single `basePath` to a `scopes: string[]` — safe, it is not public API.

### 5. `useEmit` deps use the stack array; stability is preserved in practice
`useMemo` deps become `[on, ctx, scopes, repeatIdx]`. The stack array identity is stable as long as no ancestor repeat re-renders — and when an ancestor repeat *does* re-render, the new `PathContext` value propagates and re-renders descendant elements anyway (React.memo does not bail on context changes). So the "emit stays stable for a fixed-position element" property holds; rebuilding the closure on ancestor re-renders is consistent with the element re-rendering regardless.

### 6. Expression-shape detection needs no change
`resolveExpressions` and `resolveRepeatPath` already branch on `typeof obj.$item === "string"` before recursing, so `{ $item: "x", $scope: 1 }` still hits the `$item` branch. `$scope` is simply read inside that branch.

## Risks / Trade-offs

- [Scope stack resets at nested `<Renderer>` boundaries] → `$scope` cannot climb past a nested renderer, same as `usePath`. Documented behavior, no action needed.
- [100% coverage thresholds on new branches] → each new branch (offset resolution, out-of-range, invalid values, in both renderers and params) gets explicit unit tests; add scenario coverage per spec.
- [Silent `undefined` on typo'd `$scope`] → matches `usePath` semantics; a demo + Expression Matrix entry make the shape discoverable. No new warnings to keep behavior predictable.
- [`$scope` on the shared `ItemExpression` type could tempt use in props] → props are never resolved by the renderer (spec-schema contract); components resolve expressions themselves and already have `usePath(offset)`. No library behavior to define; document in LLM.md that `$scope` is for `repeat.path` and `on.params`.

## Migration Plan

Additive and non-breaking: `$scope` is optional, defaults to `0`. No existing spec, store shape, or public API changes. Rollback = remove the optional field and its resolution (revert to `usePath()` / `scopes[0]`). Docs (README.md, demo/README.md, LLM.md) updated in the same change per AGENTS.md.

## Open Questions

None — deferred unknowns (e.g., whether to later add store-level derived colDefs, or a `$scope`-style helper on generic-renderer props resolution) do not change this design's specs, approach, or task breakdown.
