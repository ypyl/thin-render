## Why

When a component inside a `RepeatChildren` scope renders a nested `<Renderer>`, the `PathContext` from the outer repeat leaks into the nested renderer's tree. Any `usePath()` call inside the nested renderer returns the outer repeat's path (e.g., `/items/0`) instead of the root (`""`). This breaks the path scoping contract — a nested `Renderer` should be a clean boundary where path context resets.

## What Changes

- **`Renderer` resets `PathContext` and `RepeatIndexContext`** — The `Renderer` component will wrap its output in `PathContext.Provider` with value `""` and `ResetIndexContext.Provider` with value `undefined`, isolating nested renderer trees from any outer repeat scope.
- **No breaking changes** — Existing code outside of nested-renderer scenarios is unaffected. Components not nested inside another `Renderer` continue to work identically.

## Capabilities

### New Capabilities

### Modified Capabilities

- `renderer`: The `Renderer` component MUST reset `PathContext` to `""` and `RepeatIndexContext` to `undefined` for its subtree, establishing a path-scope boundary for nested renderers.

## Impact

- **`src/renderer.tsx`**: `Renderer` wraps its content in `PathContext.Provider` / `RepeatIndexContext.Provider`.
- **`src/contexts.tsx`**: May need to import `RepeatIndexContext` from hooks if not already accessible.
- **`src/hooks.ts`**: No changes — context consumers already read the nearest provider.
- **Tests**: Need a test for nested renderer path scoping (repeat inside renderer inside repeat).
- **`LLM.md` / README**: Document the path-scope boundary behavior of `Renderer`.
