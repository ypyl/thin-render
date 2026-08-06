## Why

`resolveParams` (src/hooks.ts) is a one-line delegate to `resolveExpressions` with a single production caller (`useEmit`). It adds an indirection layer without any behavior of its own, and its only consumers are `useEmit` and its own test block.

## What Changes

- Remove `resolveParams` from `src/hooks.ts`.
- `useEmit` calls `resolveExpressions` directly (same signature, already imported).
- Remove the `resolveParams` import and its `describe` block (10 tests) from `src/actions.test.ts`.
- No behavior change: `resolveExpressions` is untouched and already fully covered by `src/expressions.test.ts`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Internal refactor, no behavior contract changes (`skip_specs: true`).

## Impact

- `src/hooks.ts` — remove ~8 lines.
- `src/actions.test.ts` — remove import + ~60 test lines (the inlined `builtinSetState` tests stay).
- No README.md / LLM.md / demo changes (`resolveParams` is not documented or exported).
