# Named Children (Slots) — Design

## Context

The spec schema, React renderer, and generic renderer all treat `children` as an ordered array of element ids. Components receive one flat `children: ReactNode` (React) or `children: unknown[]` (generic) and cannot place children at different positions. The `Switch` demo component works around this by matching child React keys against a store value (the `.$` prefix hack in `demo/src/components/Switch.tsx`). See proposal.md — Why for motivation.

Relevant code: `src/spec.ts` (UIElement type), `src/renderer.tsx` (`_ElementRenderer` builds children; `RepeatChildren` iterates childKeys per item), `src/renderer-generic.ts` (`walk` builds a flat children array; repeat concatenates results).

## Goals / Non-Goals

**Goals:**
- Record-form `children` on `UIElement` with per-slot arrays of element ids
- Strict separation: array form → `children` prop, record form → `slots` prop, never both
- Identical semantics across the React and generic renderers (same walker contract, different output wrappers)
- Rewrite `Switch` to use slots; add a named-slots layout demo case
- Zero behavior change for existing array-form specs

**Non-Goals:**
- No new expression types (`$child`, etc.) — props stay static, the renderer stays a dumb walker
- No `renderChild(key)` callback API — placement stays in the spec, not component code
- No separate `slots` field on `UIElement` — one `children` field with two shapes covers all cases (a "title slot + default body" element is expressed as `children: { title: "t", body: ["b1", "b2"] }`)
- No change to hooks, store, contexts, or the expression system

## Decisions

### D1: Union type on `children`, not a new `slots` field
`UIElement.children` becomes `string[] | Record<string, string | string[]>`. Alternatives considered: a separate `slots` field (rejected — two concepts for one thing, and the union + array-per-slot covers every "both ordered and named" case); `{ $child: "key" }` props expressions (rejected — breaks the "props are plain static values" contract and would require the renderer to resolve expressions, which it must never do).

### D2: Strict children/slots separation in the component contract
Array form populates `ComponentProps.children` (unchanged); record form populates `ComponentProps.slots: Record<string, ReactNode>` and leaves `children` undefined. Rationale: a component that renders `{children}` must never silently double-render slots; explicit shape = explicit intent. The generic renderer mirrors this: record form passes `children = []` and `ctx.slots: Record<string, unknown[]>`.

### D3: Single React node per slot
A slot with multiple element ids renders as a fragment of `_ElementRenderer`s, each keyed by its spec element key — the slot value in `slots` is one `ReactNode`. This keeps `ComponentProps.slots` simple (`Record<string, ReactNode>`) and avoids array/fragment union noise at call sites.

### D4: Element keys remain the React keys
Slot names are never used as React keys. Consequences: no key-mangling issues; memoization behavior of `_ElementRenderer` (`memo` on `{elementKey, spec, registry, loading}`) is untouched; the same child element id in two slots of one element produces a React duplicate-key warning (documented constraint — use a wrapper element instead).

### D5: `RepeatChildren` branches on the children shape
The existing per-item iteration logic stays; for record form each item builds a per-slot fragment instead of one flat children list. The component instance per item receives `slots` scoped to its `PathContext`. The generic walker concatenates per-slot results across items (`ctx.slots[slotName]` = all items' results for that slot, in iteration order) — this matches the generic renderer's existing flat-children contract (no per-item boundaries in its API).

### D6: Switch rewrite
`demo/src/components/Switch.tsx` becomes `slots?.[value] ?? null` via `useValue` — deleting the `Children.toArray` + `.$` prefix machinery and the LLM.md Pattern 5 hack. The switch demo spec changes `children: ["loading", "loaded", "error"]` to `children: { loading: "loading", loaded: "loaded", error: "error" }` and its `technicalDescription` is updated. Spec-facing behavior (which child renders for which store value) is unchanged; existing tests for the demo's behavior should pass as-is.

### D7: Missing keys reuse the existing warning path
An unknown id inside a slot hits the existing "missing element" warning in `_ElementRenderer` (React) and `walk` (generic) — no new validation code. `children: {}` (empty record) yields `slots = {}` with no warnings.

## Risks / Trade-offs

- **Component contract ambiguity** (children vs slots) → Mitigation: strict separation (D2) means a component never receives both; documentation (LLM.md Component Contract, README API table) states the rule explicitly.
- **Same child id in two slots of one element → React duplicate-key warning** → Mitigation: documented constraint; wrapper element as the escape hatch. Rare in practice.
- **Two children shapes double the renderer's branch surface** → Mitigation: the branch is a single `Array.isArray` check in two places (`_ElementRenderer`/`RepeatChildren`, generic `walk`); both renderers share identical semantics via the specs, and 100% branch coverage forces tests for every combination (array/record × plain/repeat × single/multi-element slot).
- **Generic renderer loses per-item slot boundaries under repeat** → Accepted: its API contract is flat (`children`/`ctx.slots` of results), consistent with the existing "children concatenated across items" behavior.
- **Switch rewrite touches a documented pattern** → Mitigation: LLM.md Pattern 5 is rewritten in the same change; the demo's observable behavior is unchanged.

## Migration Plan

No migration needed — the change is additive. Array-form specs, existing components, and the public export surface are unchanged. The switch demo spec is updated in-repo in the same change. Rollback: revert the change; no data or format migration involved.

## Open Questions

None.
