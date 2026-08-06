## Context

See proposal.md. `resolveParams(params, getState, repeatBasePath, repeatIndex)` forwards its four arguments verbatim to `resolveExpressions`. `useEmit` is its only production caller; `src/actions.test.ts` tests it directly.

## Goals / Non-Goals

**Goals:** Remove the delegate and point `useEmit` at `resolveExpressions`. Zero behavior change, zero coverage loss.

**Non-Goals:** No changes to `resolveExpressions`, `expressions.ts`, or the public API.

## Decisions

**D1: Delete the wrapper instead of exporting it.** It was previously internal-only and is not documented. `resolveExpressions` is exported from `expressions.ts` (internal module, not public index) with an identical signature, so the wrapper buys nothing. Alternative considered: keep it as a named alias for readability — rejected, one indirection with one caller is noise.

**D2: Remove the `resolveParams` tests, keep the `builtinSetState` tests.** The 10 removed tests duplicate coverage that `expressions.test.ts` already provides for every branch (plain passthrough, `$state`, `$item`, `$index`, recursion, mixed). The `actions.test.ts` file remains for the built-in setState logic.

## Risks / Trade-offs

- Test count drops by 10 → The same behavior stays covered through `expressions.test.ts`; verified by the 100% coverage gate in tasks.
- Import churn in `useEmit` → One-line call-site change, covered by existing renderer/actions tests.
