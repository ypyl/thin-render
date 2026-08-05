## MODIFIED Requirements

### Requirement: Renderer resolves element types via a registry
The `<Renderer spec registry store? handlers? />` component SHALL walk the spec starting at `spec.root`, resolve each element's `type` against the `registry` map, and render the matched component. When no component is registered for `type`, `Renderer` SHALL render nothing and log a warning.

`Renderer` SHALL also establish a path-scope boundary by resetting the `PathContext` scope stack to a fresh root stack and `RepeatIndexContext` to `undefined` for its entire subtree, so that any `usePath()`, `usePath(offset)`, or `useRepeatIndex()` calls inside a nested renderer return root values regardless of any outer `RepeatScope` that may contain this `Renderer`.

#### Scenario: Unknown type renders nothing
- **WHEN** an element has `type: "Nonexistent"` and no `Nonexistent` entry exists in the registry
- **THEN** `Renderer` renders nothing for that element and logs a warning to the console

#### Scenario: Nested renderer resets path scope
- **WHEN** a component inside a `RepeatScope` with `PathContext` at `/items/0` renders a `<Renderer>` as its child, and a descendant component inside that nested `Renderer` calls `usePath()`
- **THEN** `usePath()` returns `""` (root), not `/items/0`

#### Scenario: Nested renderer resets repeat index scope
- **WHEN** a component inside a `RepeatScope` with `RepeatIndexContext` at `3` renders a `<Renderer>` as its child, and a descendant component inside that nested `Renderer` calls `useRepeatIndex()`
- **THEN** `useRepeatIndex()` returns `undefined`, not `3`

#### Scenario: Nested renderer exposes no ancestor scopes
- **WHEN** a component inside a `RepeatScope` with `PathContext` at `/items/0` renders a `<Renderer>` as its child, and a descendant component inside that nested `Renderer` calls `usePath(1)`
- **THEN** `usePath(1)` returns `undefined` — the stack has no ancestors

#### Scenario: Outer repeat scope still works after nested render
- **WHEN** a `RepeatChildren` at `/items` contains a component that renders a nested `<Renderer>`, and the same row also contains a component that calls `usePath()` directly (not inside the nested `Renderer`)
- **THEN** the direct `usePath()` call returns `/items/N` for its row, unaffected by the nested renderer
