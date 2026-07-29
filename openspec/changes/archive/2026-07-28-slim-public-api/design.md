## Context

The public API currently exports 35 entities. A consumer audit shows only ~14 are actually imported by any demo case. The remaining 21 fall into three categories:

1. **Spec type aliases** — `UIElement`, `ActionBinding`, etc. Users write JSON specs, not TypeScript objects. These types are internal to the library's own type-checking.
2. **Store/context internals** — `immutableSetByPath`, `StoreProvider`, `ActionContext`, etc. These are implementation details used by the renderer, never by consumer code.
3. **Unused hooks** — `resolveParams` (internal to `useEmit`/`useWatch`), `useRepeatIndex` (no consumer usage, derivable from `useRepeatPath`), `useItemPath` (no consumer usage, pattern never materialized).

## Goals / Non-Goals

**Goals:**
- Reduce public API from 35 to 19 exports
- Keep all exports actually used by demo consumers
- Update all documentation to match
- Keep internal modules importable for advanced users (`import { ... } from "thin-render/hooks"` still works)

**Non-Goals:**
- No code logic changes — purely export surface
- No changes to what the renderer or hooks DO

## Decisions

### What to keep: consumer-usage-driven

Only exports with at least one consumer import in the demo codebase stay public. Two exceptions:

- `Handler` type — kept despite no direct imports, because it's the building block of `Handlers` and users typing handler functions need it
- `RendererProps` — kept for wrapper component typing

### What to remove: 16 exports

| Category | Exports |
|----------|---------|
| Spec types | `UIElement`, `ActionBinding`, `OnMap`, `WatchMap`, `RepeatConfig`, `ItemExpression`, `StateExpression` |
| Store internals | `immutableSetByPath`, `StoreOptions`, `Listener` |
| Context internals | `StoreContext`, `StoreProvider`, `ActionContext`, `ActionProvider`, `ActionContextValue` |
| Internal hooks | `resolveParams`, `useRepeatIndex`, `useItemPath` |

### Backward compatibility: internal paths remain

`import { useRepeatIndex } from "thin-render/hooks"` will still work — we're only removing from the barrel `index.ts`. This is a soft landing for anyone who happened to import from sub-paths.

### Documentation updates

- `README.md`: update hooks table (remove 3 entries), remove type table rows
- `LLM.md`: update hooks table and import example
- `Q&A.md`: update references to `$item` in component props (replace `useItemPath` with manual resolution pattern)
- `AGENTS.md`: update sync rules

## Risks / Trade-offs

- **Someone importing removed types**: Low risk — audit showed zero consumer imports. If someone does, they can import from `thin-render/spec` or `thin-render/hooks` sub-paths.
- **Q&A.md references**: Q&A explains internal mechanisms using type names like `WatchMap`. Keep the explanations but remove "import" framing — describe behavior, not imports.
