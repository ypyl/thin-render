## Why

`useItemPath` (src/hooks.ts) has zero production callers. It is not exported from the public API (`src/index.ts`) and not documented in README.md or LLM.md; the only consumer is its own test suite. It is dead code kept alive by tests.

## What Changes

- Remove the `useItemPath` hook and its doc comment from `src/hooks.ts`.
- Remove the `useItemPath` import and its `describe` block from `src/hooks.test.tsx`.
- No behavior change: `resolveRepeatPath` and `useResolvedPath` (the production path) are untouched.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Internal dead-code removal, no behavior contract changes (`skip_specs: true`).

## Impact

- `src/hooks.ts` — remove ~10 lines.
- `src/hooks.test.tsx` — remove import + ~35 test lines.
- No README.md / LLM.md / demo changes (hook is not documented or used anywhere).
