## Purpose
The $item and $index expressions resolve to absolute store path strings and numeric indexes in action params at dispatch time.

## Requirements

### Requirement: Expression objects resolve in action params at dispatch time
`useEmit` SHALL resolve expression objects in action `params` at dispatch time via `resolveExpressions` (src/expressions.ts). Values of the form `{ $item: "<field>" }` SHALL resolve to the absolute state path `${basePath}/${field}`; when `<field>` is the empty string `""`, they SHALL resolve to `basePath` itself. Resolution SHALL be pure string concatenation — no store read, no subscription. When called outside a repeat scope (`basePath` is undefined), `$item` SHALL resolve to `undefined`.

#### Scenario: $item with field resolves to path
- **WHEN** action params contain `{ id: { $item: "name" } }` and the element sits in a repeat scope with base `/items/3`
- **THEN** the handler receives `{ id: "/items/3/name" }`

#### Scenario: $item with empty string resolves to base path
- **WHEN** action params contain `{ row: { $item: "" } }` and the element sits in a repeat scope with base `/items/7`
- **THEN** the handler receives `{ row: "/items/7" }`

#### Scenario: $item outside repeat resolves to undefined
- **WHEN** action params contain `{ field: { $item: "x" } }` and the element is not inside a repeat scope
- **THEN** the handler receives `{ field: undefined }`

#### Scenario: $item mixed with $state in same params object
- **WHEN** params contain `{ itemPath: { $item: "" }, userId: { $state: "/user/id" } }`, `getState()` returns `{ user: { id: 42 } }`, and the repeat base is `/items/2`
- **THEN** the handler receives `{ itemPath: "/items/2", userId: 42 }`

### Requirement: $index resolves to numeric repeat index
`resolveExpressions` SHALL detect values of the form `{ $index: boolean }` in action params and resolve them to the numeric repeat index. When `$index` is truthy and a repeat index is available, it SHALL return the index. Outside a repeat scope, it SHALL resolve to `undefined`.

#### Scenario: $index inside repeat returns index
- **WHEN** action params contain `{ pos: { $index: true } }` and the element is at repeat index 3
- **THEN** the handler receives `{ pos: 3 }`

#### Scenario: $index outside repeat returns undefined
- **WHEN** action params contain `{ pos: { $index: true } }` and the element is not inside a repeat
- **THEN** the handler receives `{ pos: undefined }`

#### Scenario: $index false resolves to undefined
- **WHEN** action params contain `{ pos: { $index: false } }`
- **THEN** the handler receives `{ pos: undefined }` regardless of repeat index

### Requirement: useEmit captures repeat scope for param resolution
`useEmit(on)` SHALL call `usePath()` and `useRepeatIndex()` to capture the current repeat scope. These values SHALL be passed to `resolveExpressions` during `emit(event)` calls, so `$item` and `$index` in action params resolve against the element's repeat position. The captured values SHALL be included in the `useMemo` dependency array.

#### Scenario: emit resolves $item in params to the element's repeat path
- **WHEN** an ActionButton inside `<RepeatScope path="/items/5">` emits "click" with `on.click.params = { itemPath: { $item: "" } }`
- **THEN** the handler is invoked with `{ itemPath: "/items/5" }`

#### Scenario: useMemo stays stable for a fixed-position element
- **WHEN** an element at repeat index 5 re-renders for unrelated reasons (its own useValue fires)
- **THEN** the `useEmit` `useMemo` does NOT recompute (path `/items/5` and index 5 unchanged)
