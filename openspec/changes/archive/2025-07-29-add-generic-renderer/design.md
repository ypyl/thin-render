## Context

thin-render currently bundles expression resolution logic inside `hooks.ts` as part of `useEmit` and related hooks. The `resolveParams` function is not exported, the path utilities (`segmentsOf`, `normalizePath`, `pathsOverlap`) are internal to `store.ts`, and there is no non-React renderer. The existing React renderer (`renderer.tsx`) uses `React.memo`, `createElement`, React Context, and `useSyncExternalStore` — none of which are applicable to a one-shot tree walk.

## Goals / Non-Goals

**Goals:**
- Extract expression resolution into a standalone internal module shared by both renderers
- Provide a `renderGeneric` function that walks the spec tree without React
- Zero new dependencies; `renderGeneric` is pure TypeScript
- Maintain 100% test coverage
- No changes to existing React renderer behavior or public API

**Non-Goals:**
- Unifying the React renderer and generic renderer into one implementation
- Supporting action dispatch (`emit`, `on`, handlers) in `renderGeneric` — actions are interactive and DOCX/PDF/CSV targets don't need them
- Supporting `watch` bindings in `renderGeneric` — same rationale
- Changing the package name or splitting into multiple npm packages
- Adding a demo case for the generic renderer (that's user-land; the demo app is React)

## Decisions

### Decision 1: Extract expressions into `src/expressions.ts` (internal, not exported)

**Rationale:** The expression resolution logic (`resolveParams`, `resolveRepeatPath`) is already pure — it receives `getState` as a function argument and never calls React hooks itself. Extracting it makes it importable by both the React renderer (for `useEmit`, `useResolvedPath`) and the generic renderer (`renderGeneric`), without creating a circular dependency or pulling React types into the generic renderer. The utilities remain internal — only `renderGeneric` and `GenericRegistry` are exported. Users don't need direct access to expression resolution; `renderGeneric` handles it automatically.

**Alternatives considered:**
- Keep in `hooks.ts` and have `renderer-generic.ts` import from hooks → pulls in React context imports, wrong dependency direction
- Duplicate the logic in `renderer-generic.ts` → divergence risk, violates DRY

### Decision 2: `renderGeneric` is a standalone function, not a class or builder

**Rationale:** The renderer is stateless — it receives spec, store, and registry as arguments and returns a result. There's no internal state to manage, no lifecycle, no configuration. A pure function is the simplest API and aligns with the one-shot nature of non-React rendering.

**Signature:**
```ts
function renderGeneric(
  spec: Spec | null,
  store: Store,
  registry: GenericRegistry
): unknown
```

**Alternatives considered:**
- Builder pattern with `.register()` → overkill for a ~50-line function
- Class with extensibility hooks → speculative; no known use case for subclassing

### Decision 3: `renderGeneric` returns `unknown`

**Rationale:** Registry functions return heterogeneous types (e.g., `Document`, `Paragraph`, `Table`). A generic `T` would force all entries to return the same type, which is a lie. `unknown` is honest — the user casts at the call site (e.g., `renderGeneric(...) as Document`) where they know what the root registry entry returns. `null` is folded into the return: if the spec is null or root missing, `null` is returned, and the user's cast handles it.

### Decision 4: `GenericRegistry` type uses `unknown`, not a generic parameter

**Rationale:** In a DOCX registry, `Document` returns a `Document`, `Paragraph` returns a `Paragraph`, `Section` returns a plain object — all different types. Forcing a single `T` on the registry would make it unusable without a cumbersome union type. `unknown` accepts heterogeneous return types and lets the user cast `renderGeneric`'s result at the call site.

```ts
type GenericRegistry = Record<
  string,
  (props: Record<string, unknown>, children: unknown[]) => unknown
>;
```

**Alternatives considered:**
- `GenericRegistry<T>` with single type parameter → lies about registry homogeneity; user must declare a union for every entry
- Per-type return types via mapped type parameter object → complex, hard to infer, over-engineered for the use case

### Decision 5: Expression resolution in props happens in the renderer, not in registry functions

**Rationale:** Unlike the React renderer where components use hooks (`useBound`, `useValue`) to subscribe to paths, DOCX/PDF targets have no hooks and no reactivity. The renderer resolves expressions before calling the registry function so that registry functions receive plain values. This means the same spec can use `$state`/`$item`/`$index` in props and have them resolved automatically.

**Contrast with React renderer:** The React renderer deliberately does NOT resolve expressions in props — components receive `{ $state: "/x" }` verbatim and use hooks to subscribe. This is the correct behavior for interactive UIs where values change over time. For one-shot document generation, resolving at render time is the correct behavior.

### Decision 6: `renderGeneric` does not support `on` (actions) or `watch`

**Rationale:** Actions and watchers are interactive concepts — they dispatch handlers in response to user events or store mutations. A DOCX document has no interactivity. Including them in `renderGeneric` would be dead code with no valid use case. The `on` and `watch` fields on `UIElement` are simply ignored.

### Decision 7: File structure

```
src/
├── spec.ts              ← unchanged
├── store.ts             ← unchanged (exports path utils)
├── expressions.ts       ← NEW (internal) — resolveExpressions, resolveRepeatPath
├── hooks.ts             ← MODIFIED — imports from expressions.ts
├── contexts.tsx         ← unchanged
├── renderer.tsx         ← unchanged
├── renderer-generic.ts  ← NEW — renderGeneric, GenericRegistry
└── index.ts             ← MODIFIED — new exports
```

No new directories. Two new source files totaling ~120 lines.

## Risks / Trade-offs

- **Risk:** Users might expect `renderGeneric` to support `on`/actions like the React renderer
  → **Mitigation:** Document clearly that `renderGeneric` is for one-shot, non-interactive rendering. The `on` field is ignored.

- **Risk:** `resolveExpressions` in props is a different behavior than the React renderer (which passes expressions verbatim and lets hooks resolve them)
  → **Mitigation:** This is by design, not a bug. Document the difference: React renderer = expressions in props are passed through (hooks resolve them); Generic renderer = expressions in props are resolved before registry call.

- **Risk:** The `docx` npm package (or similar) might evolve and change its API
  → **Mitigation:** `renderGeneric` has no dependency on `docx` or any output format. The registry functions are user-provided. API changes in output libraries are the user's concern.

- **Risk:** Users might want `renderGeneric` to support async registry functions for lazy loading or async data
  → **Mitigation:** Not in scope for this change. The current design is synchronous. If async is needed later, a `renderGenericAsync` variant can be added without breaking `renderGeneric`.

## Open Questions

<!-- None — all design decisions are resolved above -->
