## Context

See proposal.md. The audit found `useItemPath` with no production callers; it is a thin wrapper (`expr` → `resolveRepeatPath(expr, undefined, usePath())`) that duplicates the `$item` branch of `useResolvedPath`.

## Goals / Non-Goals

**Goals:** Remove the dead hook and its tests with no behavior change.

**Non-Goals:** No changes to `useResolvedPath`, `resolveRepeatPath`, or the public API.

## Decisions

**D1: Cut entirely, do not export.** The hook is a one-liner wrapper over an internal helper; the production need is already covered by `useResolvedPath`. Keeping it "for future use" is speculative (YAGNI). Alternative considered: exporting it as public API — rejected, no consumer and the API surface is deliberately slim.

**D2: Remove the tests with the hook.** The tests exist only to exercise the dead hook. Removing them cannot lower coverage of any remaining code (coverage thresholds apply to `src/` files, and the hook's logic is covered through `useResolvedPath`'s tests via `resolveRepeatPath`).

## Risks / Trade-offs

- Someone might want this hook later → Trivial to reintroduce (5 lines); the audit already flagged it as the highest-confidence cut.
- Test count drops → Expected; coverage stays at 100% (verified in tasks).
