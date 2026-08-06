## Why

`useBound` wraps `useSetValue`'s already-stable setter in an extra `useCallback` to satisfy the tuple type. The wrapper is redundant: `useSetValue(path)` returns a stable `(value: unknown) => void`, which is assignable to the declared `(value: T) => void` (parameters are contravariant; `unknown` is a supertype of `T`). The extra closure adds a function allocation per render with zero behavioral difference.

## What Changes

- `src/hooks.ts` — `useBound` returns `useSetValue(path)` directly instead of wrapping it.
- No observable behavior change: the returned setter is referentially identical to today's wrapper (both derive from the same stable `useCallback`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Internal refactor, no behavior contract changes (`skip_specs: true`).

## Impact

- `src/hooks.ts` — remove ~3 lines.
- No docs, demo, or test changes (existing `useBound` tests cover the behavior).
