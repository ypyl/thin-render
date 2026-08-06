## Context

See proposal.md. `StoreOptions { debug?, log? }` is declared in `src/store.ts`, destructured in `createStore`, and used only in `set()` to log `[store] <path>: <prev> → <value>`. Grep across library, demo, and tests shows the only usages are the two `createStore({ x: 1 }, { debug: true, ... })` calls in its own test block.

## Goals / Non-Goals

**Goals:** Drop the options parameter and the logging branches with zero behavior change for real callers.

**Non-Goals:** No change to `set()` semantics, path handling, or subscription behavior. No public API re-export changes (`StoreOptions` was never exported from `src/index.ts`).

## Decisions

**D1: Remove the parameter entirely, not just the default.** `createStore(initial)` keeps its single-argument signature. Alternative considered: leaving the parameter but ignoring it — rejected, dead parameter surface is worse than none.

**D2: Remove the test block with the feature.** The 3 tests exist solely to verify the logging feature. The `set()` no-op early-return (`prev === value`) stays and remains covered by existing tests.

## Risks / Trade-offs

- Any external consumer passing `{ debug: true }` would break → The option was undocumented and unused in every repo location; the risk is theoretical, and the npm package exposes no typing for it (not exported).
- Removing logging could hamper future debugging → The store is small; a `console.log`-based trace can be added ad hoc when actually needed (YAGNI).
