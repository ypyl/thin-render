## Context

Current implementation (see proposal.md — Why): `useSelector<T>(selector)` subscribes at the root (`store.subscribe("", listener)`) — `pathsOverlap("", x)` is always true, so every `set()` anywhere notifies the component — and snapshots `selector(store.getState())`. The store already supports per-path subscriptions, and `getByPath(state, "")` returns the whole state (empty segment list ⇒ returns the root object). `useValue` demonstrates the narrow-subscription pattern this design reuses. Base spec merged into `openspec/specs/use-selector/spec.md` from the archived `add-use-selector` change. 100% coverage gate on `src/` (lines/branches/functions/statements).

## Goals / Non-Goals

**Goals:**
- One signature, `useSelector<T>(path: string, derive: (value: unknown) => T): T`, replacing the whole-state selector form.
- Wake-ups bounded to the path's subtree; renders bounded to derive-result flips (unchanged contract).
- Derive uses plain property access on the resolved subtree — no `getByPath` import at call sites.
- `useSelector("", derive)` preserves everything the general form could express.

**Non-Goals:**
- A second, multi-path selector form — the root window and composed narrow calls cover it (see Decisions).
- Custom equality functions or memoized selector infrastructure (unchanged from previous design).
- Per-path read tracking (Proxy-wrapped snapshots) — unchanged non-goal; the window makes the read scope explicit instead.
- Any change to `useValue`, `useBound`, the store, or the renderer.

## Decisions

**D1: The `path` argument is both the subscription scope and the access window.**
One argument carries both meanings; the signature makes the coupling unbreakable — the derive physically cannot read outside the window because it only receives the value at `path`:

```ts
const subscribe = useCallback(
  (listener: () => void) => store.subscribe(path, listener),
  [store, path],
);
const getSnapshot = useCallback(
  () => derive(getByPath(store.getState(), path)),
  [store, path, derive],
);
return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as T;
```

Alternatives considered:
- *Keep the general form*: strictly dominated — root wake-ups on every `set()`, `getByPath` needed at every call site, and reads can escape the subscription scope (no local verifiability).
- *Overload both forms*: the general form adds no capability the root window lacks; two signatures for one concept is more surface, more docs, more tests.
- *`useValue(path, derive?)`*: muddies `useValue`'s raw-value contract (which `useBound` composes); "select" better carries the derive semantics.

**D2: The root window (`""`) is the general form's replacement.**
`pathsOverlap("", x)` is always true (empty path is a prefix of everything), so `useSelector("", derive)` keeps the coarse whole-store subscription — identical wake behavior to today. `getByPath(state, "")` returns the whole state, and since the root is a plain object, derive uses property access (`s.items.length > 0 && s.selectedId != null`) instead of `getByPath` string addressing. Cross-branch derives keep working in one call, strictly nicer than before.

**D3: Window choice is the tuning lever.**
The spectrum — `"/items/0/done"` (tightest) → `"/items"` → `"/user"` → `""` (whole store) — replaces the old binary choice (per-path `useValue` vs whole-store `useSelector`). In-window writes that don't flip the derive still notify (derive re-runs, React bails out on `Object.is` equality); the documented guidance is "tightest window that covers every read". Same-subtree multi-field derives collapse to one call (`useSelector("/user", (u) => u.name === "Main" && u.role === "admin")`); unrelated branches use the root window or composed narrow calls.

**D4: Derive identity in `getSnapshot` deps (unchanged from previous design).**
Inline derives are recreated every render — `useSyncExternalStore` handles that; only unstable snapshot *values* violate the contract (spec: "Selector must return a stable snapshot"). No new machinery.

**D5: No store changes.**
Per-path `subscribe` and `getByPath` already express the window. Diff stays in `hooks.ts`, tests, docs.

## Risks / Trade-offs

- [Breaking signature change on a published hook (v0.6.0)] → Pre-1.0 semver; the hook shipped one release ago with no tracked external consumers; all call sites (tests, README, LLM.md — no demo usage) update in the same change; rollback is a one-commit revert.
- [In-window writes that don't flip the derive still wake the component (derive re-runs)] → Same trade-off the general form always had, now tunable; React bails out on snapshot equality; documented via the "tightest window" guidance in README/LLM.md.
- [Derive can no longer read outside its window — a capability the general form had] → By design; root window or composed narrow calls cover those cases; the spec's window requirement makes the boundary explicit.
- [100% coverage gate] → Test suite rewritten to cover: window notify / outside-window no-notify, flip re-render, unchanged-value bail-out, root window, repeat scope, missing-provider throw.

## Migration Plan

In-repo only: rewrite `useSelector` tests and docs (README.md, LLM.md) in the same change; no demo call sites exist. Release note calls out the pre-1.0 breaking change; no deprecation shim. Rollback: revert the commit — the previous signature and tests are fully intact.

## Open Questions

None.
