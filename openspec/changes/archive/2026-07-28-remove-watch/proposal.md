## Why

The `watch` directive adds complexity to the spec schema, renderer, and documentation for a feature that is functionally replaceable by a 3-line `useEffect` inside a reactive component. Worse, it doesn't work inside repeats — watch paths are literal strings with no expression support, so per-item validation is impossible. This creates confusion ("why can't I watch per-item changes?") while offering no unique capability that `useValue` + `useEffect` can't achieve with less API surface.

Removing watch simplifies the spec, reduces the public API, eliminates the watch-validation demo, and removes ~5 Q&A entries and a LLM.md pattern.

## What Changes

- **BREAKING**: Remove `watch` support entirely:
  - Remove `WatchMap` type and `watch` field from `UIElement` in `spec.ts`
  - Remove `useWatch` from `renderer.tsx`
  - Remove `watch` from the expression matrix (one less column)
  - Remove watch-validation demo case
  - Remove watch from README, Q&A.md, LLM.md
  - Remove watch-related questions from Q&A (~5 entries)
- Add Option B (reactive component) as the replacement pattern in docs

## Capabilities

### New Capabilities
<!-- None — feature removal -->

### Modified Capabilities
<!-- None -->

## Impact

- **BREAKING**: any spec using `watch` will fail validation
- Affected files: `src/spec.ts`, `src/renderer.tsx`, `src/hooks.ts` (import), `README.md`, `Q&A.md`, `LLM.md`, `demo/`
- Consumer mitigation: replace `watch` specs with reactive components using `useValue` + `useEffect`
