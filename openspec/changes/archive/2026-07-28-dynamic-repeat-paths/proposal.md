## Why

`repeat.path` is a static string — it cannot adapt to the current repeat scope or to store state. This makes nested repeats (rows → sub-rows) impossible with pure JSON specs and prevents dynamic repeat targets driven by store state (e.g., sidebar selection switches which list is displayed). The building block for resolution (`useItemPath`) already exists for props; extending it to `repeat.path` removes an artificial limitation with minimal surface area.

## What Changes

- `RepeatConfig.path` type broadens from `string` to `string | { $item: string } | { $state: string }`
- `RepeatChildren` resolves `repeat.path` through a new `useResolvedPath` hook before subscribing, supporting three forms:
  - Plain string — absolute store path (unchanged behavior)
  - `{ $item: "<field>" }` — resolves against current `RepeatPathContext` for nested repeats
  - `{ $state: "<path>" }` — reads a store path whose value is the target array path (dynamic target)
- New `useResolvedPath(expr)` hook — composes `useItemPath` passthrough/`$item` resolution with `useValue` for `$state` lookups
- Type exports: `ItemExpression` and `StateExpression` interfaces added to public types

## Capabilities

### New Capabilities

- `dynamic-repeat-paths`: `repeat.path` accepts `$item` expressions (resolved against the current repeat scope) and `$state` expressions (resolved by reading a store path), enabling nested repeats and store-driven repeat targets in pure JSON specs

### Modified Capabilities

- `spec-schema`: `RepeatConfig.path` type broadened from `string` to union with expression types
- `renderer`: `RepeatChildren` shall resolve `repeat.path` through expression resolution before subscribing

## Impact

- **src/spec.ts** — `RepeatConfig.path` type change, new `ItemExpression`/`StateExpression` types
- **src/hooks.ts** — new `useResolvedPath` hook
- **src/renderer.tsx** — `RepeatChildren` uses `useResolvedPath` instead of raw `repeat.path`
- **src/index.ts** — export new hook and types
- **Tests** — hooks tests for `useResolvedPath`, renderer tests for nested repeats via `$item`, dynamic target via `$state`
- **Demo** — new nested repeat case demonstrating rows → sub-rows with pure JSON spec
