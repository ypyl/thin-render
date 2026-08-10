## Purpose
The spec schema defines the JSON structure for declarative UI: a root element key, an elements map, and per-element fields for props, children, event bindings (`on`), and array iteration (`repeat`).
## Requirements
### Requirement: Spec is a keyed element map with a root pointer
The library SHALL accept a `Spec` value consisting of a `root` key (string) and an `elements` map keyed by element id. Each element in `elements` MUST declare a `type` (string) referencing a registry component. An element MAY declare `props` (a plain serializable object of literal values and path strings), `children` (an ordered array of child element ids OR a record mapping slot names to child element ids or arrays of child element ids), `on` (event→action bindings), and `repeat` (array iteration config).

When `children` is an array, it declares ordered children. When `children` is a record, each key is a **slot name** and each value is a child element id (single) or an array of child element ids (multiple elements in one slot). Slot names are arbitrary strings chosen by the spec author; the parent element's component renders each slot at a position of its choosing.

#### Scenario: Minimal valid spec
- **WHEN** a spec `{ root: "r", elements: { r: { type: "Text", props: { text: "hi" } } } }` is rendered
- **THEN** the `Renderer` resolves `elements.r` and renders the registry component registered for `"Text"` without error

#### Scenario: Spec with children forms a tree
- **WHEN** a spec defines element A with `children: ["b"]` and element `b` exists in `elements`
- **THEN** `Renderer` renders element A's component with element `b` rendered as a child, in the order given by the `children` array

#### Scenario: Spec with named children declares slots
- **WHEN** a spec defines element A with `children: { "header": "h", "toolbar": ["t1", "t2"], "body": "b" }` and all referenced elements exist in `elements`
- **THEN** the spec is valid and A's component receives three slots: `"header"` holding the rendered `h` element, `"toolbar"` holding the rendered `t1` and `t2` elements, and `"body"` holding the rendered `b` element

#### Scenario: Missing root element fails gracefully
- **WHEN** the `root` value does not match any key in `elements`
- **THEN** `Renderer` renders nothing and does not throw

### Requirement: Element props are plain values, never runtime-resolved expressions
An element's `props` SHALL contain only literal values (string, number, boolean, null, arrays/objects thereof) and path strings (JSON-Pointer-like, e.g. `"/items/0/name"`). The renderer MUST NOT interpret `{ $state: "..." }`, `{ $bindState: "..." }`, `$computed`, or other dynamic expressions. Binding components read path strings out of `props` and subscribe via the store hooks.

#### Scenario: Path string passed through unchanged
- **WHEN** an element has `props: { bind: "/user/name" }`
- **THEN** the rendered binding component receives `element.props.bind === "/user/name"` verbatim and is responsible for subscribing to that path

#### Scenario: No magic $-expression resolution
- **WHEN** an element has `props: { value: { $state: "/x" } }`
- **THEN** the renderer passes `element.props.value` to the component unchanged (it is the component author's responsibility to interpret such shapes if they choose, never the renderer's)

### Requirement: Event bindings map event names to action bindings
An element SHALL support an `on` field mapping event names (e.g. `"click"`, `"change"`) to an action binding `{ action: string, params?: object }` or an array of such bindings. The `action` names handlers registered at the top of the app. `params` values MAY contain `{ $state: "<path>" }` references which are resolved on-demand against the store at dispatch time (read, never subscribed).

#### Scenario: Single action binding
- **WHEN** an element has `on: { click: { action: "save", params: { id: { $state: "/doc/id" } } } }` and the user triggers `click`
- **THEN** the renderer's `emit("click")` resolves `params.id` by reading the current value at `/doc/id` and invokes the registered `save` handler with that resolved param

#### Scenario: Action name with no registered handler warns without throwing
- **WHEN** `emit("click")` resolves to `{ action: "noop" }` and no `noop` handler is registered
- **THEN** the system logs a warning and resolves the dispatch without throwing

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

