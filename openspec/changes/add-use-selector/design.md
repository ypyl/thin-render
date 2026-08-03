## Context

thin-render's re-render contract (see `openspec/specs/path-based-store/spec.md`) is built on `useSyncExternalStore` with per-path `subscribe`/`getSnapshot`. `useValue(path)` subscribes to exactly one path and re-renders on every write that overlaps it. The store exposes `subscribe(path, listener)`, and subscribing at the root (`""`) is notified on every `set()` because `pathsOverlap("", x)` is always true. Coverage is enforced at 100% across the package (`src/`).

See proposal.md — Why for motivation.

## Goals / Non-Goals

**Goals:**
- One new hook, `useSelector<T>(selector)`, reusing the existing `useStore()` + `useSyncExternalStore` machinery.
- Re-render granularity at the level of the selected value (strict equality bail-out).
- No changes to `Store`, `useValue`, the renderer, or the expression system.

**Non-Goals:**
- Memoized selectors / selector dependency tracking (Redux `createSelector` style).
- Custom equality functions.
- Per-path subscription tracking for selectors (fine-grained `store.subscribe(path)` fan-out based on which paths the selector reads).
- A `useBound` fallback/default-value variant (separate concern; can be a follow-up change).

## Decisions

**D1: Snapshot is the selected value; subscription is coarse (root).**
`useSelector` subscribes with `store.subscribe("", listener)` and snapshots `selector(store.getState())`. `useSyncExternalStore` re-renders only when consecutive snapshots differ by `Object.is`, so the coarse notification is filtered to "selected value changed". This is the same architecture as Redux `useSelector` with `react-redux`'s default `shallowEqual` replaced by strict equality.

Alternatives considered:
- *Per-path selector analysis* (track which paths the selector read and subscribe only to those): requires wrapping the snapshot in a Proxy to record reads. Powerful but fragile (dynamic reads, proxy overhead, context-dependent paths) — unjustified for a minimal library. Composing narrow `useValue` calls remains the escape hatch for hot paths.
- *Signature `useSelector(selector, equalityFn)`*: flexible but adds API surface. Strict equality covers the motivating case (booleans, strings, numbers); object results can be memoized by the consumer. Rejected for now — easy to add later without breaking.

**D2: Selector identity goes into `getSnapshot` deps.**
`getSnapshot` is `useCallback(() => selector(store.getState()), [store, selector])`. Inline selectors (the common case) recreate `getSnapshot` each render, which `useSyncExternalStore` handles fine — the danger is only an unstable snapshot *value*, which is the consumer's responsibility (spec: "Selector must return a stable snapshot"). Memoized selectors are also supported since `selector` is a dep.

**D3: Single hook, no store changes.**
The store already supports root subscriptions, so no new store API is needed. Keeps the diff to `hooks.ts`, `index.ts`, tests, and docs.

## Risks / Trade-offs

- [Coarse notification fan-out: every `set()` notifies the component, and React must compare snapshots on each notification] → Acceptable for small stores / infrequent writes (thin-render's target). Document that hot paths should prefer composed `useValue` calls; note in LLM.md/README.
- [Non-primitive selector results: fresh object/array literals violate the stable-snapshot contract and can cause repeated renders or the React "getSnapshot should be cached" warning] → Spec requirement + JSDoc call it out explicitly; primitives and consumer-memoized results are safe.
- [100% coverage gate] → Tests must cover the hook's branches (value read, flip re-render, no-op re-render) as well as the missing-provider throw path.

## Migration Plan

Backward compatible — new export only; no existing API changes. Rollback is a revert of the export + hook. No data migration.

## Open Questions

None.
