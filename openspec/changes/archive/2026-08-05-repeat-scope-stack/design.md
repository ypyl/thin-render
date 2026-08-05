## Context

Current state: `PathContext` carries a single path string; each `RepeatScope` shadows it with its item's base path (see proposal.md — Why). `usePath()` returns that string; `useItemPath`/`useResolvedPath`/relative binds compose against it; the `Renderer` boundary resets it to `""` (spec: renderer — nested boundary). The generic renderer threads a plain `basePath` parameter through `walk`, surfaced as `ctx.basePath`. `PathContext`/`RepeatIndexContext` are NOT exported from `src/index.ts` — the context shape is internal; only `usePath` (and the RenderContext type) are public.

Constraints: 100% coverage enforced; specs SHALL/MUST with `#### Scenario:` blocks; demo cases must stay in sync with README tables; ~1,050-line library ethos — prefer consumer-side composition over new renderer features.

## Goals / Non-Goals

**Goals:**
- Expose ancestor repeat scopes to descendant components via a stack, backward compatibly: `usePath()` keeps returning the innermost scope.
- Preserve the nested-`<Renderer>` boundary as a hard reset: no scope can cross a Renderer boundary in either direction.
- Keep expression/binding resolution (`$item`, relative binds, `$index`, `useResolvedPath`) innermost-only — zero behavior change outside the new `usePath(offset)` capability.
- Give `renderGeneric` builders the same stack via `ctx.scopes`, additive only.

**Non-Goals:**
- No index stack (`useRepeatIndex(offset)`). Grid cells need the parent *path*, not the parent *index*; the index is derivable from the path when needed. Stacking indexes doubles the context surface for a case nobody has.
- No value-walking `$item` resolution ("resolve against whichever scope has the field") — makes path resolution data-dependent, breaks the no-subscription model, and is ambiguous when both scopes have the field.
- No grid/repeat config feature (`repeat: { rows, cols }`) — bakes a special case into the renderer; the stack + a consumer-side `DataCell` component covers the grid.
- No spec-generation helper (Route A stays a consumer pattern; the stack removes its necessity for the grid, it doesn't replace it for other uses).

## Decisions

### D1: PathContext value becomes `string[]`, innermost first
`RepeatScope` reads the current stack from `PathContext` and provides a **new** array `[basePath, ...parentStack]` (never mutates). The `Renderer` boundary provides a fresh `[""]` root stack. The React default context value is `[""]` so `usePath()` returns `""` outside any provider, matching today.

Alternatives considered:
- *Parent-pointer / linked list* — same information, more code, harder to debug; array is the obvious shape for a stack and matches what the generic renderer threads.
- *Second context (`ParentPathContext`)* — only exposes one level and needs N contexts for N levels; array generalizes for free.

### D2: `usePath(offset = 0)` — offset into the stack; out-of-range → `undefined`
`usePath()` ≡ `usePath(0)` ≡ `stack[0]`. `usePath(1)` ≡ `stack[1]`. Negative or out-of-range offsets return `undefined` (spec: usePath(offset) resolves ancestor scopes). The offset is additive: existing call sites are untouched.

Alternatives considered:
- *`useScopes()` returning the whole stack* — forces every consumer to own array-indexing and defaulting; `usePath(offset)` keeps the common cases one-liners. Consumers can still write `useScopes()`-style logic by combining `usePath()` + `usePath(1)`.
- *Separate `useParentPath()`* — hides the general case behind a special one.

### D3: The Renderer boundary resets the stack — a wall, not a push
The nested-`<Renderer>` requirement (spec: renderer — "Nested renderer exposes no ancestor scopes") is a hard reset: the nested renderer provides `[""]` regardless of what the outer tree's stack holds. Implemented by the existing `Renderer` wrapper — the only change is the provider value shape. This is the same rule as today ("resets `PathContext` to `''`"), extended to the stack; the existing test at `renderer.test.tsx:471` is updated, not weakened.

### D4: Resolution sites read only `stack[0]`
`usePath` (public), `useItemPath` (`$item`), `useResolvedPath` (`$item` branch), and relative-path composition in `useBound`/`useValue`/`useSetValue` all read the innermost scope. `RepeatIndexContext` is untouched. The stack exists solely as readable state; nothing resolves through it implicitly. This keeps every existing scenario in `dynamic-repeat-paths`, `item-expression-*`, and `renderer` specs passing unchanged.

### D5: Generic renderer threads `scopes: string[]`, innermost first
`walk` gains a `scopes` parameter (replacing the `basePath` parameter's role: `ctx.basePath = scopes[0] ?? ""`); repeat iteration calls `walk` with `[childBase, ...scopes]`. `RenderContext` gains `scopes: string[]` — additive; existing builders using `ctx.basePath` are unaffected. The generic `DataCell` builder performs the same two-hop read as the React one (key at `scopes[0]`, value at `scopes[1]`).

### D6: Proof via a "Dynamic Columns Table" demo case
New demo case: store holds `/data` (records with runtime keys) + `/meta/columns` (derived on load); spec is fully static — `TBody` repeats `/data`, `Tr` repeats `{ $state: "/meta/columns" }`, cells are a reusable `DataCell` component (demo/src/components/) doing the two-hop read with `usePath()`/`usePath(1)`. README.md and demo/README.md demo tables + case count (16 → 17) update in the same change. This is the end-to-end proof of the capability and the pattern's documentation anchor.

## Risks / Trade-offs

- **New array per scope per render** → ElementRenderer memoization and per-cell subscriptions are unchanged; the array creation is one allocation per repeat item per render — negligible against the existing element-descriptor work, and only on repeat re-renders (which already re-run).
- **Context value identity churn** → `RepeatScope` already provides a fresh path string per item; an array per item adds no new re-render class. Consumers re-render on provider change exactly as today.
- **Accidental mutation of the stack** → stacks are always fresh arrays (`[base, ...parent]`); never `push` into a context-held array, which React would not observe. Enforced by construction (D1) and reviewable.
- **`usePath(offset)` semantics drift** (undefined vs `""` for out-of-range) → pinned in the spec (usePath(offset) resolves ancestor scopes) with scenarios for both root and beyond-depth cases; tests enforce.
- **Demo README drift** → case count and tables updated in the same change per AGENTS.md; validated in tasks.
- **Coverage regression** → 100% thresholds enforced; tasks include `npm test` and `npm run coverage` gates.

## Migration Plan

- Internal-only change for the React renderer (context shape not exported); no consumer migration.
- `RenderContext` gains a field — additive for TypeScript consumers.
- `usePath(offset)` is additive; no existing call site changes.
- Docs: README hook table, LLM.md API table + Pattern #9, Q&A.md pattern entry, demo tables — updated in the same change.
- Rollback: revert the change; `usePath()` callers are unaffected either way.
