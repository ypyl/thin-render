## Why

thin-render currently couples spec-driven tree rendering to React — the only way to render a spec is through the React `<Renderer>` component. This makes it impossible to use the same spec/store/expression system for non-React output targets like DOCX generation, PDF generation, CSV export, or any other format. The spec schema, path-based store, and expression language (`$state`, `$item`, `$index`) are valuable independently of React — they just need a renderer that doesn't depend on React primitives.

## What Changes

- Extract expression resolution logic (`resolveParams` and path utilities) from `hooks.ts` into a standalone internal `expressions.ts` module shared by both renderers
- Add a `renderGeneric` function that walks a spec tree, resolves expressions against a store, and calls user-provided registry functions — no React, no subscriptions, no contexts
- Add a `GenericRegistry` type for the registry contract
- Export the new public API from the package index
- No changes to the existing React renderer, hooks, or contexts

## Capabilities

### New Capabilities
- `generic-renderer`: A pure, zero-dependency function `renderGeneric(spec, store, registry)` that walks a spec tree, resolves `$state`/`$item`/`$index` expressions in element props (read-once from store), handles repeat (array and object iteration), and calls user-provided registry functions to produce output of any type. 

### Modified Capabilities
<!-- None — this is purely additive. Existing React renderer behavior is unchanged. -->

## Impact

- **New files**: `src/expressions.ts` (~50 lines), `src/renderer-generic.ts` (~60 lines)
- **Modified files**: `src/hooks.ts` (import from expressions.ts instead of inline), `src/index.ts` (new exports)
- **Dependencies**: No new dependencies. `renderGeneric` is pure TypeScript with zero imports from React
- **Package name**: No change. `thin-render` ships both renderers in the same package
- **Breaking changes**: None. All existing exports and behavior are preserved
- **Testing**: New test files for `expressions.ts` and `renderer-generic.ts` to maintain 100% coverage
