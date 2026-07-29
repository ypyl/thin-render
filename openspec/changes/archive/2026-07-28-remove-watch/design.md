## Context

`watch` is a spec directive that subscribes to store paths via `store.subscribe` and fires handlers on change — without causing the parent `_ElementRenderer` to re-render. In practice, the same behavior is achievable with `useValue` + `useEffect` in a component. Watch introduces a separate code path, a separate type, and a separate mental model for something that React already handles.

Worse, watch paths are literal strings — inside a repeat, `watch: { "name": [...] }` subscribes to `/name`, not `/items/3/name`. This makes watch useless for per-item validation, which is the most natural use case.

## Goals / Non-Goals

**Goals:**
- Remove `watch` from spec, renderer, types, demos, and all documentation
- Replace with the `useValue` + `useEffect` reactive component pattern
- Simplify the expression matrix (remove watch column)

**Non-Goals:**
- No other spec changes
- No changes to `on` (event-driven) action dispatch

## Decisions

### Removal scope

| Area | Action |
|------|--------|
| `spec.ts` | Remove `WatchMap` type, remove `watch` from `UIElement` |
| `renderer.tsx` | Remove `useWatch`, remove `watch` prop propagation |
| `demo/` | Remove `watch-validation` case, remove from HomePage routes |
| `README.md` | Remove Watch section, remove watch from expression bullet |
| `Q&A.md` | Remove 5 Watch questions, remove watch from expression matrix, replace with reactive component pattern note |
| `LLM.md` | Remove watch pattern (#4), remove watch column from expression matrix |
| `AGENTS.md` | Remove watch from sync rules if mentioned |

### Replacement pattern

```tsx
function ValidatingField({ element }: ComponentProps) {
  const [value, setValue] = useBound<string>(String(element.props?.bind));
  const store = useStore();

  useEffect(() => {
    if ((value ?? "").length < 3) {
      store.set(`/errors/${String(element.props?.bind)}`, "Too short");
    } else {
      store.set(`/errors/${String(element.props?.bind)}`, undefined);
    }
  }, [value]);

  return <input value={value ?? ""} onChange={e => setValue(e.target.value)} />;
}
```

This works identically, works inside repeats, and uses only standard React patterns.

## Risks / Trade-offs

- **Breaking existing specs**: Anyone using `watch` in their specs must migrate. Mitigation: the replacement is a straightforward component extraction. Early library, low adoption risk.
- **Lost capability**: The "no element re-render" property of watch is lost. In practice, the leaf component re-renders either way because `useBound` subscribes. The parent `_ElementRenderer` staying memo'd has negligible performance impact.
