## Context

`useEmit` in `src/hooks.ts` builds the `emit` closure. Currently it returns early without any diagnostic when `on` is missing or `on[eventName]` is missing (lines ~97–100). The `useEmit` hook has access to the `on` map and the event name — everything needed for meaningful warnings.

## Goals / Non-Goals

**Goals:**
- Add `console.warn` in the two silent-return paths of `useEmit`'s emit closure
- Include the event name and available `on` keys (when `on` exists) for actionable diagnostics

**Non-Goals:**
- No behavior change to handler dispatch, param resolution, or re-render contract
- No new exports or API surface changes

## Decisions

### Decision 1: Warn inline in the emit closure, not via a separate validation pass

**Chosen**: Add `console.warn` directly at the two early-return points in the `emit` closure.

**Alternatives considered**:
- **Validate the spec at parse time**: Would catch issues before render, but requires a separate walk of the spec. The `on` map is declared per-element, but `emit` is the point where the mismatch manifests — warning at the call site connects the symptom to the cause.
- **Throw an error**: Too aggressive. Missing bindings are a development-time concern, not a runtime invariant. A throw would break the app in production over a spec wiring mistake.
- **Custom logger callback**: Over-engineering for this scope. `console.warn` follows the existing pattern already used for missing handlers and missing elements in the renderer.

### Decision 2: Include available event names in the "missing event" warning

**Chosen**: When `on` exists but `on[eventName]` doesn't, list `Object.keys(on)` in the warning.

**Rationale**: If the developer wrote `on: { change: ... }` but the component emits `"click"`, seeing `"Available events: change"` immediately reveals the mismatch.

### Decision 3: Warn once per emit call (no deduplication)

**Chosen**: Warn on every call to `emit` with a missing binding. No throttling or once-per-element deduplication.

**Rationale**: A component that emits `"click"` 50 times while misconfigured is a loop bug worth seeing. Adding deduplication adds complexity with no clear benefit — the fix is to correct the spec, not to silence the warning.

## Risks / Trade-offs

- **Noise in CI/test logs**: If tests exercise emit with incomplete `on` maps, they'll now produce warnings. Mitigation: existing tests that trigger this path need `console.warn` to be mocked or asserted via `vi.spyOn`.
- **No production-off switch**: There's no mechanism to suppress these warnings in production builds. Mitigation: this matches the existing pattern for missing handlers and missing elements — a future change could add a global logger override, but it's out of scope here.
