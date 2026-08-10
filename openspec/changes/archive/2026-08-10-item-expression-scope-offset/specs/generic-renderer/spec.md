# generic-renderer Delta

## MODIFIED Requirements

### Requirement: renderGeneric handles repeat iteration

When an element has a `repeat` config, the library SHALL render the element's `children` once per item in the resolved iterable. It MUST support both array and object iteration with `$state` and `$item` expressions in `repeat.path`. `$item` expressions SHALL support an optional `$scope` offset resolved against the scope stack (`ctx.scopes`, innermost first): `$scope` `0` selects the innermost scope, `1` the parent scope, and so on; omitted `$scope` SHALL default to `0`. A `$scope` that is not a non-negative integer within the stack bounds SHALL resolve to `undefined`, rendering no children. Children within each iteration SHALL be scoped to the item's path and index.

#### Scenario: Repeat over array renders children per item

- **WHEN** an element has `repeat: { path: "/rows" }` and `store.get("/rows")` returns `[{ name: "A" }, { name: "B" }]` with two children `["cell1", "cell2"]`
- **THEN** the registry function receives children rendered for each item: `["A-cell1...", "A-cell2...", "B-cell1...", "B-cell2..."]`

#### Scenario: Repeat over object iterates entries

- **WHEN** an element has `repeat: { path: "/dict" }` and `store.get("/dict")` returns `{ a: { val: 1 }, b: { val: 2 } }`
- **THEN** children are rendered once per entry, scoped to `/dict/a` and `/dict/b` respectively

#### Scenario: Repeat with $state expression in path

- **WHEN** an element has `repeat: { path: { $state: "/targetPath" } }` and `store.get("/targetPath")` returns the string `"/items"`
- **THEN** the repeat resolves to iterating `store.get("/items")`

#### Scenario: Repeat with $item expression in path

- **WHEN** inside a repeat at `/items/0`, an element has `repeat: { path: { $item: "subItems" } }`
- **THEN** the repeat resolves to iterating `store.get("/items/0/subItems")`

#### Scenario: Repeat with $item and $scope offset in path

- **WHEN** inside a nested repeat at `/tables/0/rows/2` (scope stack `["/tables/0/rows/2", "/tables/0"]`), an element has `repeat: { path: { $item: "colDefs", $scope: 1 } }` and `store.get("/tables/0/colDefs")` returns `[{ key: "name" }, { key: "email" }]`
- **THEN** the repeat iterates `store.get("/tables/0/colDefs")`, rendering children scoped to `/tables/0/colDefs/0` and `/tables/0/colDefs/1`

#### Scenario: Repeat path with out-of-range $scope renders nothing

- **WHEN** inside a scope stack of depth 2, an element has `repeat: { path: { $item: "colDefs", $scope: 3 } }`
- **THEN** no children are rendered (empty array returned for that element)

#### Scenario: Repeat path resolves to non-iterable renders nothing

- **WHEN** `repeat.path` resolves to a value that is neither an array nor a plain object (e.g., `null`, a string, a number)
- **THEN** no children are rendered (empty array returned for that element)

#### Scenario: Repeat key from item field

- **WHEN** an element has `repeat: { path: "/rows", key: "id" }` and items have `{ id: "x" }` and `{ id: "y" }`
- **THEN** the key field is available for the registry function to use (e.g., for stable identification), but the renderer does not enforce key uniqueness
