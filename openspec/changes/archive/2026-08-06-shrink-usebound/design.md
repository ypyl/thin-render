## Context

See proposal.md. Current code:

```ts
const setRaw = useSetValue(path);
const set = useCallback((v: T) => setRaw(v), [setRaw]);
return [value, set];
```

`setRaw` is `(value: unknown) => void`, stable across renders. The wrapper exists only to narrow the parameter type.

## Goals / Non-Goals

**Goals:** Return `setRaw` directly; keep the public tuple type unchanged.

**Non-Goals:** No changes to `useSetValue` or the tuple type.

## Decisions

**D1: Rely on TypeScript's contravariant parameter check.** `(value: unknown) => void` is assignable to `(value: T) => void` under `strictFunctionTypes`, so the tuple type `[T | undefined, (value: T) => void]` still type-checks with `useSetValue(path)` directly. The build (`tsc`) verifies this in tasks.

**D2: No new tests.** Existing `useBound` tests exercise identity and behavior; the setter identity is unchanged (same stable closure source).

## Risks / Trade-offs

- TypeScript edge case where the assignability fails → The `npm run build` step in tasks catches it immediately; fallback is keeping the wrapper.
