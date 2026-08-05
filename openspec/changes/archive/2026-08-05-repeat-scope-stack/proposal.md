## Why

Tables whose columns are only known at runtime (arrays of records like `[{ head1: v1, ... }, ...]`) cannot be rendered with a static spec: nested repeats shadow the outer scope, so a cell inside a rows × columns grid has no way to resolve its value path (row base + column key). Consumers today must either regenerate the spec when columns change (full-tree re-render) or duplicate column metadata into every row.

## What Changes

- `PathContext` becomes a **scope stack** (innermost first) instead of a single path string. `RepeatScope` pushes onto it; the `Renderer` boundary resets it to a fresh root stack. Nested-renderer isolation is preserved: a nested `<Renderer>` still sees a clean scope, never the outer tree's scopes.
- `usePath(offset = 0)` — new optional offset parameter: `0` returns the innermost scope (current behavior), `1` the parent scope, and so on. Out-of-range offsets return `undefined`.
- `RenderContext` (generic renderer) gains `scopes: string[]` (innermost first). `basePath` keeps its current meaning — no breakage for existing registry builders.
- `$item`, relative binds, `useResolvedPath`, and `$index` keep resolving against the **innermost** scope only — unchanged behavior, backward compatible.
- **BREAKING (type-level only):** none — `usePath()` with no argument is unchanged. The `PathContext` provider value shape changes internally (string → array), which is not part of the public API.

This enables the static-spec dynamic-column table pattern: `tbody` repeats `/data`, `tr` repeats `{ $state: "/meta/columns" }`, and a small `DataCell` component reads the column key from its own scope and the value from the parent scope via `usePath(1)` — per-cell granularity, runtime column changes, no spec regeneration, no data duplication.

## Capabilities

### New Capabilities
- `repeat-scope-stack`: Scope-stack semantics for `PathContext` — `usePath(offset)` parent-scope access, `ctx.scopes` in the generic renderer, nested-renderer stack reset, out-of-range behavior.

### Modified Capabilities
- `renderer`: The nested-renderer path-scope boundary requirement changes from "resets `PathContext` to `""`" to "resets the scope stack to a fresh root" — observable `usePath()` behavior in nested renderers is unchanged.

## Impact

- `src/contexts.tsx` — `PathContext` value shape (string → scope stack)
- `src/renderer.tsx` — `RepeatScope` pushes, `Renderer` resets the stack
- `src/hooks.ts` — `usePath(offset)`, relative bind composition still uses innermost scope
- `src/renderer-generic.ts` — `RenderContext.scopes`
- Tests — new coverage for stack semantics, nested-renderer reset, out-of-range offsets, generic `ctx.scopes`; existing nested-renderer test updated
- Docs — README.md (hook table, demo case), LLM.md (API table, Pattern #9 gains the two-repeat variant), Q&A.md (pattern entry updated)
- Demo — new "Dynamic Columns Table" case proving the static-spec pattern (buildSpec-free)
