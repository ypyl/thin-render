## Context

`useRepeatPath` returns the current store path from the nearest `RepeatPathContext`. Outside a repeat, it returns `""`. The "Repeat" prefix suggests it only works inside repeats, which is false.

## Goals / Non-Goals

**Goals:**
- Rename `useRepeatPath` → `usePath` in public API
- Rename internal `RepeatPathContext` → `PathContext` for consistency
- Update all references in source, tests, demo, and docs

**Non-Goals:**
- No behavior changes

## Decisions

### Name: `usePath`

Shorter than `useRepeatPath`, doesn't imply a repeat requirement. Returns the current scope path or `""` at root.

### Internal rename: `RepeatPathContext` → `PathContext`

The context powers `usePath`. Renaming keeps the two names aligned.

### What stays the same

`useRepeatIndex` was already removed in `slim-public-api`. The only repeat-scope hook left is this one — no confusion with sibling hooks.

## Risks / Trade-offs

- **Breaking existing imports**: Consumers with `useRepeatPath` must update. Mitigation: mechanical find-and-replace, no logic change.
