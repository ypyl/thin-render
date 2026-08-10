# spec-schema Delta

## MODIFIED Requirements

### Requirement: Repeat config drives array iteration
An element SHALL support a `repeat` field `{ path: string | { $item: string } | { $item: string, $scope: number } | { $state: string }, key?: string }` causing its `children` to render once per item in the iterable at the resolved path. The `path` field SHALL accept four forms:
- A plain string — an absolute store path (e.g., `"/items"`)
- `{ $item: "<field>" }` — resolved against the current `PathContext` to form an absolute path
- `{ $item: "<field>", $scope: <number> }` — resolved against the `PathContext` scope stack at depth `$scope` (`0` = innermost, `1` = parent, …; omitted `$scope` behaves as `0`)
- `{ $state: "<path>" }` — the value at `<path>` in the store is read and used as the target array path

When `key` is provided, items being objects MUST use `item[key]` (stringified) as the React element key; otherwise the array index is used for arrays and the object key for plain objects.

#### Scenario: Repeat renders one child per array item
- **WHEN** an element has `repeat: { path: "/items" }` and `children: ["row"]`, and `/items` holds an array of length 3
- **THEN** `Renderer` renders the `row` element 3 times, each scoped to one item

#### Scenario: Repeat falls back to index key
- **WHEN** `repeat.key` is omitted
- **THEN** each repeated child's React key is the string of its array index

#### Scenario: Repeat path uses $item expression
- **WHEN** an element inside a `<RepeatScope path="/items/2">` has `repeat: { path: { $item: "subitems" } }` and `/items/2/subitems` holds an array of length 2
- **THEN** `Renderer` renders the children twice, scoped to `/items/2/subitems/0` and `/items/2/subitems/1`

#### Scenario: Repeat path uses $item expression with $scope
- **WHEN** an element inside a nested repeat at `/tables/0/rows/2` (parent scope `/tables/0`) has `repeat: { path: { $item: "colDefs", $scope: 1 } }` and `/tables/0/colDefs` holds an array of length 2
- **THEN** `Renderer` renders the children twice, scoped to `/tables/0/colDefs/0` and `/tables/0/colDefs/1`

#### Scenario: Repeat path uses $state expression
- **WHEN** an element has `repeat: { path: { $state: "/activeList" } }` and `/activeList` holds the string `"/fruits"` where `/fruits` is an array of length 3
- **THEN** `Renderer` renders the children 3 times, iterating over `/fruits`
