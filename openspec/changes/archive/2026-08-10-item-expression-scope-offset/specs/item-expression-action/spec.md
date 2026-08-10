# item-expression-action Delta

## MODIFIED Requirements

### Requirement: Expression objects resolve in action params at dispatch time
`useEmit` SHALL resolve expression objects in action `params` at dispatch time via `resolveExpressions` (src/expressions.ts). Values of the form `{ $item: "<field>" }` SHALL resolve to the absolute state path `${basePath}/${field}`; when `<field>` is the empty string `""`, they SHALL resolve to `basePath` itself. When the expression carries a `$scope` number, `$item` SHALL resolve against the scope-stack entry at that depth instead of the innermost scope: `$scope` `0` is the innermost scope, `1` the parent scope, and so on; when omitted it SHALL default to `0`. A `$scope` that is not a non-negative integer within the stack bounds SHALL resolve to `undefined`. Resolution SHALL be pure string concatenation — no store read, no subscription. When no scope is available at the resolved depth (`basePath` is undefined), `$item` SHALL resolve to `undefined`.

#### Scenario: $item with field resolves to path
- **WHEN** action params contain `{ id: { $item: "name" } }` and the element sits in a repeat scope with base `/items/3`
- **THEN** the handler receives `{ id: "/items/3/name" }`

#### Scenario: $item with empty string resolves to base path
- **WHEN** action params contain `{ row: { $item: "" } }` and the element sits in a repeat scope with base `/items/7`
- **THEN** the handler receives `{ row: "/items/7" }`

#### Scenario: $item with $scope resolves against parent scope
- **WHEN** action params contain `{ table: { $item: "id", $scope: 1 } }` and the element sits in a nested repeat at `/tables/0/rows/2` whose parent scope is `/tables/0`
- **THEN** the handler receives `{ table: "/tables/0/id" }`

#### Scenario: $item with out-of-range $scope resolves to undefined
- **WHEN** action params contain `{ table: { $item: "id", $scope: 5 } }` and the element's scope stack has depth 2
- **THEN** the handler receives `{ table: undefined }`

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
`useEmit(on)` SHALL capture the element's repeat scope stack and repeat index so `$item`, `$scope`, and `$index` in action params resolve against the element's repeat position at dispatch time. The captured scope stack SHALL expose every ancestor scope, not only the innermost, so `$item` expressions with a `$scope` offset can resolve against parent scopes. The captured values SHALL be passed to `resolveExpressions` during `emit(event)` calls and SHALL be included in the `useMemo` dependency array.

#### Scenario: emit resolves $item in params to the element's repeat path
- **WHEN** an ActionButton inside `<RepeatScope path="/items/5">` emits "click" with `on.click.params = { itemPath: { $item: "" } }`
- **THEN** the handler is invoked with `{ itemPath: "/items/5" }`

#### Scenario: emit resolves $item with $scope against an ancestor scope
- **WHEN** an ActionButton inside a nested repeat at `/tables/0/rows/2` (parent scope `/tables/0`) emits "click" with `on.click.params = { tablePath: { $item: "", $scope: 1 } }`
- **THEN** the handler is invoked with `{ tablePath: "/tables/0" }`

#### Scenario: useMemo stays stable for a fixed-position element
- **WHEN** an element at repeat index 5 re-renders for unrelated reasons (its own useValue fires)
- **THEN** the `useEmit` `useMemo` does NOT recompute (path `/items/5` and index 5 unchanged)
