## Why

`useRepeatPath` is a misleading name — it implies the hook only works inside repeats, when in fact it always returns the current path (empty string outside repeats, absolute path inside). Renaming to `usePath` is shorter, clearer, and doesn't suggest a limitation that doesn't exist.

## What Changes

- **BREAKING**: Rename `useRepeatPath` → `usePath` across all source and docs
- Also rename internal `RepeatPathContext` → `PathContext` for consistency

## Capabilities

### New Capabilities
<!-- None — rename only -->

### Modified Capabilities
<!-- None -->

## Impact

- **BREAKING**: any code importing `useRepeatPath` must change to `usePath`
- Affected: `src/hooks.ts`, `src/index.ts`, `src/renderer.tsx`, `src/hooks.test.tsx`, `src/renderer.test.tsx`, `demo/`, `README.md`, `LLM.md`, `Q&A.md`
