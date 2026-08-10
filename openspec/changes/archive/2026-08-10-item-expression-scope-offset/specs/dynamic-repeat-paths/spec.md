# dynamic-repeat-paths Delta

## MODIFIED Requirements

### Requirement: useResolvedPath resolves repeat.path expressions
The `useResolvedPath(expr)` hook SHALL accept a value that is a plain string, `{ $item: "<field>" }`, `{ $item: "<field>", $scope: <number> }`, or `{ $state: "<path>" }`. When `expr` is a string, it SHALL return it unchanged. When `expr` is `{ $item: "<field>" }` (with or without `$scope`), it SHALL resolve against the `PathContext` scope stack without a store subscription: `$scope` SHALL select the stack depth to resolve against, where `0` is the innermost scope, `1` the parent scope, `2` the grandparent, and so on; when `$scope` is omitted it SHALL default to `0`. A `$scope` that is not a non-negative integer within the stack bounds SHALL resolve to `undefined`, mirroring `usePath(offset)`. When `expr` is `{ $state: "<path>" }`, it SHALL read the value at `<path>` from the store via `useValue` and return it; this creates a store subscription to `<path>`. When `expr` does not match any recognized shape, it SHALL return `undefined`.

#### Scenario: Plain string passed through
- **WHEN** `useResolvedPath("/items")` is called
- **THEN** it returns `"/items"`

#### Scenario: $item resolves against repeat context
- **WHEN** `useResolvedPath({ $item: "subitems" })` is called inside `<RepeatScope path="/items/3">`
- **THEN** it returns `"/items/3/subitems"`

#### Scenario: $item empty resolves to base path
- **WHEN** `useResolvedPath({ $item: "" })` is called inside `<RepeatScope path="/items/7">`
- **THEN** it returns `"/items/7"`

#### Scenario: $item with $scope resolves against parent scope
- **WHEN** `useResolvedPath({ $item: "colDefs", $scope: 1 })` is called inside a nested repeat at `/tables/0/rows/2` whose parent scope is `/tables/0`
- **THEN** it returns `"/tables/0/colDefs"`

#### Scenario: $item with $scope beyond the stack resolves to undefined
- **WHEN** `useResolvedPath({ $item: "colDefs", $scope: 2 })` is called inside a scope stack of depth 2 (e.g. `["/tables/0/rows/2", "/tables/0"]`)
- **THEN** it returns `undefined`

#### Scenario: $item with invalid $scope resolves to undefined
- **WHEN** `useResolvedPath({ $item: "colDefs", $scope: -1 })` is called, or `$scope` is a non-integer value
- **THEN** it returns `undefined`

#### Scenario: $item outside repeat returns undefined
- **WHEN** `useResolvedPath({ $item: "x" })` is called outside any RepeatScope
- **THEN** it returns `undefined`

#### Scenario: $state reads store path and returns its value
- **WHEN** `useResolvedPath({ $state: "/selectedList" })` is called and the store has `/selectedList = "/fruits"`
- **THEN** it returns `"/fruits"`

#### Scenario: $state subscribes to the pointer path
- **WHEN** a component calls `useResolvedPath({ $state: "/pointer" })` and the store value at `/pointer` changes from `"/listA"` to `"/listB"`
- **THEN** the component re-renders with the new resolved path `"/listB"`

#### Scenario: $state pointing to non-string logs warning
- **WHEN** `useResolvedPath({ $state: "/bad" })` is called and `/bad` holds the number `42`
- **THEN** a console warning is logged and the hook returns `""`

#### Scenario: $state pointing to undefined returns empty string
- **WHEN** `useResolvedPath({ $state: "/missing" })` is called and `/missing` does not exist in the store
- **THEN** it returns `""` without warning

#### Scenario: Unknown object shape returns undefined
- **WHEN** `useResolvedPath({ other: "value" })` is called
- **THEN** it returns `undefined`

### Requirement: Nested repeats compose via $item resolution
When a `RepeatChildren` renders elements that themselves have a `repeat` with a `$item` expression, the inner repeat SHALL resolve against the fully-qualified path set by the outer repeat's `RepeatScope`. This SHALL work for arbitrarily deep nesting. When the inner `$item` expression carries a `$scope` offset, it SHALL resolve against the scope stack at that depth, allowing an inner repeat to target data in an ancestor scope (e.g. a sibling field of a row's parent record).

#### Scenario: Two levels of nested repeat
- **WHEN** outer repeat at `/items` contains an inner element with `repeat: { path: { $item: "subitems" } }`, and `/items/0/subitems` holds `[{ val: 1 }, { val: 2 }]`
- **THEN** the inner repeat renders two children, each scoped to `/items/0/subitems/0` and `/items/0/subitems/1`

#### Scenario: Three levels of nested repeat
- **WHEN** level-1 repeat at `/a`, level-2 repeat at `{ $item: "b" }`, level-3 repeat at `{ $item: "c" }`, and `/a/0/b/0/c` holds `[1, 2]`
- **THEN** level-3 repeat renders two children scoped to `/a/0/b/0/c/0` and `/a/0/b/0/c/1`

#### Scenario: Inner repeat with $scope targets ancestor sibling data
- **WHEN** an outer repeat at `/tables` scopes item 0 to `/tables/0` with `{ rows: [...], colDefs: [...] }`, a row repeat at `{ $item: "rows" }` scopes row 2 to `/tables/0/rows/2`, and an inner element has `repeat: { path: { $item: "colDefs", $scope: 1 } }`
- **THEN** the inner repeat iterates the array at `/tables/0/colDefs`, rendering one child per column, each scoped to `/tables/0/colDefs/N`
