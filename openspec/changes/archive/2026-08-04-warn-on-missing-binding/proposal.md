## Why

When a component emits an event that has no binding in the spec's `on` map (or the element has no `on` map at all), `useEmit` silently returns. This makes spec wiring mistakes invisible during development — a misnamed event or a missing `on` block fails silently, costing debugging time.

## What Changes

- `useEmit`'s returned `emit` closure SHALL call `console.warn` when `on` is `undefined`/`null` (element has no `on` map).
- `useEmit`'s returned `emit` closure SHALL call `console.warn` when `on[eventName]` is `undefined` (event name not found in the `on` map).

## Capabilities

### New Capabilities

_None_ — no new capability is introduced. This is a behavioral refinement of the existing action system.

### Modified Capabilities

- `action-system`: `emit` now warns on missing bindings instead of silently returning.

## Impact

- Affected code: `src/hooks.ts` — `useEmit` function (approximately 4 lines added).
- Affected tests: `src/hooks.test.tsx` or `src/renderer.test.tsx` — need assertions for the new warnings.
- No breaking changes: existing handlers still fire as before. The only difference is console output in previously-silent misconfiguration cases.
