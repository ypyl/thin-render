## Why

`demo/src/components/ErrorDisplay.tsx` was built for the watch-validation demo, which was removed earlier. No case, spec, or doc references it anymore. It is dead demo code.

## What Changes

- Delete `demo/src/components/ErrorDisplay.tsx`.
- No other file changes: the component is not registered in any case registry.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Dead demo code removal (`skip_specs: true`; the `watch-validation-demo` spec was already deleted).

## Impact

- `demo/src/components/ErrorDisplay.tsx` — deleted.
- No README / LLM.md / demo table changes (component was not documented).
