## Why

Components currently have no way to subscribe to a **derived** condition. `useValue` subscribes to a single path and re-renders on every write to it — so `const isMain = useValue("/editKey") === "Main"` re-renders the component on every `/editKey` change, even when `isMain` stays `false` (e.g. `"Other1"` → `"Other2"`). Consumers need re-render granularity at the level of the *computed value*, not the underlying path.

## What Changes

- Add a new public hook `useSelector<T>(selector: (state: unknown) => T): T`:
  - Reads the store snapshot and applies `selector` to it.
  - Re-renders **only** when the selected value changes (strict equality), regardless of how many store paths changed underneath.
  - Subscribes at the store root (coarse notification), relying on `useSyncExternalStore`'s snapshot-equality bail-out for granularity.
- Export `useSelector` from the package root (`src/index.ts`).
- Document it in `README.md` (hooks table) and `LLM.md` (API table + a derived-subscription pattern).
- No breaking changes; existing hooks unchanged.

## Capabilities

### New Capabilities
- `use-selector`: derived subscriptions — subscribing to a value computed from the store, with re-render granularity at the selected-value level.

### Modified Capabilities
<!-- No existing requirement changes. -->

## Impact

- `src/hooks.ts` — new hook (uses `useStore`, `useSyncExternalStore`)
- `src/index.ts` — add `useSelector` to exports
- `src/hooks.test.tsx` — new test suite (100% coverage enforced by vitest thresholds)
- `README.md`, `LLM.md` — API reference tables and patterns section
- No changes to store, renderer, expression system, or spec schema
