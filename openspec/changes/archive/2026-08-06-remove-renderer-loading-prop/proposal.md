## Why

The `Renderer` `loading` prop suppresses missing-element warnings "during streaming". It has no consumer: no demo case passes it, and the watch/streaming feature it served was removed earlier. It is documented in README (API table) and tested, but it is vestigial public API surface. Removing it simplifies `RendererProps` and the internal threading of `loading` through every renderer helper.

## What Changes

- **BREAKING**: Remove the `loading` prop from `RendererProps` and `Renderer`.
- Remove the `loading` parameter from the internal `ElementRenderer` chain (`_ElementRenderer`, `buildSlots`, `RepeatChildren`, `RepeatSlots`, `RepeatSlotItem`).
- Missing-element / missing-key warnings SHALL now always be logged (no suppression mode).
- Update the `renderer` spec: drop the "only when not streaming/loading" qualifiers.
- Update the README API table (remove the `loading` row). LLM.md has no `loading` row.
- Remove the `loading`-specific tests from `src/renderer.test.tsx`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `renderer`: the "Children render in spec order with stable keys" requirement loses the warning-suppression qualifier; `Renderer` no longer accepts `loading`.

## Impact

- `src/renderer.tsx` — remove the prop and its threading (~25 lines).
- `src/renderer.test.tsx` — remove 2 tests + 1 render call using `loading`.
- `openspec/specs/renderer/spec.md` — delta for the modified requirement.
- `README.md` — remove the `loading` row from the Renderer API table.
- No demo changes (no case uses `loading`).
