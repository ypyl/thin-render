## Context

`RepeatChildren` currently uses `repeat.path` as a raw static string — it never consults the `RepeatPathContext` set by parent repeats. This means:

- **Nested repeats are impossible with pure JSON specs.** An inner repeat can't express "iterate over the `subitems` field of the current outer item" because `repeat.path` is always an absolute root-level path.
- **Dynamic repeat targets are impossible.** A sidebar that switches which list to display must rebuild the spec programmatically.
- **The workaround is code generation** — `buildSpec()` functions that pre-compute element keys and paths per item. Brittle and defeats the declarative spec model.

The building block for resolution (`useItemPath`) already exists in `hooks.ts` and handles `$item` expressions. It's just not wired into the `repeat.path` flow.

## Goals / Non-Goals

**Goals:**
- Allow `repeat.path` to accept `{ $item: "<field>" }` — resolves against the current repeat scope, enabling arbitrarily deep nested repeats in pure JSON specs
- Allow `repeat.path` to accept `{ $state: "<path>" }` — reads a store path whose value is the target array path, enabling store-driven dynamic repeat targets
- Backward compatible — raw strings still work exactly as before
- Reuse existing `useItemPath` logic rather than duplicate resolution code
- Compose naturally: `$item` in a 3rd-level repeat resolves against the fully-qualified path set by levels 1 and 2

**Non-Goals:**
- `$state` resolution in element `props` — that's a separate concern (the `spec-schema` spec explicitly forbids $-expression resolution in props)
- `$index` in `repeat.path` — doesn't make semantic sense (repeat targets are arrays, not scalars)
- Changing the `RepeatPathContext` to a stack — unnecessary; each level sets a fully-qualified absolute path, so nesting composes naturally via context override

## Decisions

### Decision 1: New `useResolvedPath` hook rather than overloading `useItemPath`

**Rationale:** `useItemPath` is public API with signature `(expr: unknown) => string | undefined`. It does pure context-based concatenation — no store subscription. Adding `$state` support would require `useValue` internally, which:
- Changes its performance contract (now subscribes to store)
- Confuses the name ("item path" doesn't suggest state lookups)
- Changes the return type implications (now reactive, not static)

**Alternative considered:** Extend `useItemPath` to handle `$state` too. Rejected because the hook would become reactive in some paths but not others — a confusing API surface.

**Alternative considered:** Inline the resolution directly in `RepeatChildren`. Rejected because `useResolvedPath` is useful for component authors too (e.g., `BoundField` could later use it for dynamic bindings).

### Decision 2: `useResolvedPath` handles string passthrough + `$item` + `$state`

**Shape:**
```ts
function useResolvedPath(expr: unknown): string | undefined
```

**Resolution rules:**
1. `string` → return as-is (absolute path passthrough)
2. `{ $item: "<field>" }` → delegate to `useItemPath` logic (RepeatPathContext concatenation, no subscription)
3. `{ $state: "<path>" }` → `useValue(path)` to read the target path string (subscribes to `/path`)
4. Otherwise → `undefined`

When `$state` resolves to a non-string or `undefined`, log a dev warning and return `""`.

**Subscription behavior:**
- `$item` only reads context — no store subscription. `RepeatChildren` won't re-render when unrelated state changes.
- `$state` subscribes to the pointer path. `RepeatChildren` re-renders when the pointer changes (e.g., `/selectedList` → `"/vegetables"`). It does NOT re-render when other paths change.
- After resolution, `RepeatChildren` also subscribes to the resolved array path via `useValue(resolvedPath)`. So it holds 2 subscriptions when using `$state`, 1 when using `$item` or string.

### Decision 3: `RepeatConfig.path` type broadens to union

```ts
// Before
export interface RepeatConfig {
  path: string;
  key?: string;
}

// After
export interface ItemExpression {
  $item: string;
}

export interface StateExpression {
  $state: string;
}

export interface RepeatConfig {
  path: string | ItemExpression | StateExpression;
  key?: string;
}
```

**Rationale:** Explicit types give TypeScript consumers autocomplete and validation. The `useResolvedPath` hook takes `unknown` (matching `useItemPath`'s loose signature) so it works with both typed and untyped specs.

**Alternative considered:** Keep `path: string` and parse `$item:`/`$state:` prefix strings (like `"$item:subitems"`). Rejected — object syntax is already the established convention in action params, spec props, and `useItemPath`.

### Decision 4: `RepeatChildren` uses resolved path for both subscription and base path construction

```tsx
// Before
const value = useValue<unknown>(repeat.path);
// ...
const basePath = `${repeat.path}/${index}`;

// After
const resolvedPath = useResolvedPath(repeat.path) ?? "";
const value = useValue<unknown>(resolvedPath);
// ...
const basePath = `${resolvedPath}/${index}`;
```

When `useResolvedPath` returns `undefined` (e.g., `$item` outside a repeat, or `$state` pointing to nothing), `RepeatChildren` falls back to `""`. `useValue("")` returns `undefined`, the non-iterable branch renders nothing. Graceful degradation.

## Risks / Trade-offs

**[Risk] `$state` expression makes `RepeatChildren` hold 2 subscriptions** → Mitigation: `useSyncExternalStore` subscriptions are cheap (just callback registration). The 2nd subscription is to the resolved array path — same as today. Only difference is the pointer subscription. No cascading re-renders because `_ElementRenderer` is `React.memo`'d.

**[Risk] Nested repeats with `$item` could create deep context chains** → Mitigation: This is functionally identical to deeply nested components in React. Each `RepeatScope` just sets a context value. No recursion, no stack overflow risk beyond what React already handles.

**[Risk] `$state` pointing to a non-string value** → Mitigation: Dev-mode `console.warn` + fallback to `""`. The empty string resolves to `undefined` in the store, so nothing renders — no crash.

**[Risk] Existing code that passes objects to `repeat.path` (unlikely but possible in dynamically built specs)** → Mitigation: `useResolvedPath` checks for `$item`/`$state` keys specifically. An object without those keys would hit the "otherwise → undefined" branch. In practice, `repeat.path` has always been typed as `string` in TypeScript, so runtime objects in this field are effectively non-existent.

## Open Questions

1. **Should `useResolvedPath` be exported as public API?** Pro: component authors could use it for dynamic `bind` props. Con: expands API surface. Decision: export it — it's a natural companion to `useItemPath` and `useValue`.
2. **Should `$state` + `$item` combination in one expression be handled?** E.g., `{ $state: "/base", $item: "field" }`. Decision: no — YAGNI. The user can compose these in their data model instead (store a fully-qualified path at the `$state` target).
