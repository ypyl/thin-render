# Named Children (Slots)

## Why

Layout components (Page, Card, Modal) cannot place children at different positions — `children` is an ordered list rendered as one flat stream, and components have no way to render a spec element by key. Multi-region layouts today require wrapper-component nesting, CSS grid hacks, or fragile key-matching. The `Switch` component already fakes named selection by matching child React keys against a store value (the documented `.$` prefix hack), proving the demand. Named children make slot placement declarative in the spec, where it belongs.

## What Changes

- `UIElement.children` SHALL accept a record form `Record<string, string | string[]>` in addition to the existing array form. Record form = named slots; arrays allow multiple elements per slot.
- **React renderer**: record-form children populate a new `ComponentProps.slots: Record<string, ReactNode>` and leave `children` undefined (strict separation — a component either gets ordered children or named slots, never both). Array form is unchanged. Element keys remain the React keys, preserving memoization and granular re-render behavior.
- **Generic renderer**: `RenderContext` gains `slots?: Record<string, unknown[]>`; record form passes `children = []` and populates `ctx.slots` (symmetric with the React renderer).
- `RepeatChildren` handles both forms per item: array form builds `children`, record form builds `slots` per item.
- **Switch component rewritten** to use `slots?.[value]` — removes the `Children.toArray` + `.$` key-matching machinery and updates the switch demo spec's `technicalDescription`. Not a breaking change: Switch remains a registered component with the same spec-facing behavior (renders the child whose slot name matches the store value).
- **New demo case**: named-slots layout demo (a Page-style component with header/sidebar/content/footer rendered in different positions) to showcase the feature.
- Docs: LLM.md (UIElement type, Component Contract, Pattern 5 rewritten to slots, new layout pattern), README.md and demo/README.md (API tables, demo tables, case counts). Expression Matrix is untouched — this is not an expression feature.

## Capabilities

### New Capabilities

None — the feature is cleanly owned by the four existing specs below; no new capability is needed.

### Modified Capabilities

- `spec-schema`: `children` field expands from `string[]` to `string[] | Record<string, string | string[]>`; named slots are declared in the spec, not in component code.
- `binding-components`: `ComponentProps` gains `slots?: Record<string, ReactNode>`; record-form children populate slots, array-form populate children (never both).
- `renderer`: ElementRenderer and RepeatChildren render record-form children into slots, per element and per repeat item; missing slot child keys warn and render nothing (existing missing-element path).
- `generic-renderer`: `RenderContext` gains `slots?: Record<string, unknown[]>`; record-form children render into `ctx.slots` with `children = []`.

## Impact

- **Library code**: `src/spec.ts` (type), `src/renderer.tsx` (ElementRenderer + RepeatChildren), `src/renderer-generic.ts` (walk). Hooks, store, and contexts untouched.
- **Tests**: `src/renderer.test.tsx`, `src/renderer-generic.test.ts` (100% line/branch/function/statement coverage enforced). New scenarios: record form renders slots, arrays-per-slot, repeat + record form, missing key in slot, empty record, generic parity.
- **Demo**: `demo/src/components/Switch.tsx` rewritten, switch case spec updated, new `named-slots` case (spec + registry + components + `App.tsx`/`HomePage.tsx` wiring), demo README tables and case count.
- **Docs**: `README.md`, `demo/README.md`, `LLM.md`.
- **Specs**: delta files for `spec-schema`, `binding-components`, `renderer`, `generic-renderer`.
- **No breaking changes**: array-form children, existing components, and the public API surface (exports) are unchanged; `ComponentProps.slots` is additive.
