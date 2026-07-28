## Purpose
The spec schema defines the JSON structure for declarative UI: a root element key, an elements map, and per-element fields for props, children, event bindings (`on`), store-change watchers (`watch`), and array iteration (`repeat`).
## Requirements
### Requirement: Spec is a keyed element map with a root pointer
The library SHALL accept a `Spec` value consisting of a `root` key (string) and an `elements` map keyed by element id. Each element in `elements` MUST declare a `type` (string) referencing a registry component. An element MAY declare `props` (a plain serializable object of literal values and path strings), `children` (an ordered array of child element ids), `on` (event→action bindings), `repeat` (array iteration config), and `watch` (store path → action bindings fired on store mutation).

#### Scenario: Minimal valid spec
- **WHEN** a spec `{ root: "r", elements: { r: { type: "Text", props: { text: "hi" } } } }` is rendered
- **THEN** the `Renderer` resolves `elements.r` and renders the registry component registered for `"Text"` without error

#### Scenario: Spec with children forms a tree
- **WHEN** a spec defines element A with `children: ["b"]` and element `b` exists in `elements`
- **THEN** `Renderer` renders element A's component with element `b` rendered as a child, in the order given by the `children` array

#### Scenario: Missing root element fails gracefully
- **WHEN** the `root` value does not match any key in `elements`
- **THEN** `Renderer` renders nothing and does not throw

#### Scenario: Element with watch field
- **WHEN** a spec element has `watch: { "/form/name": [{ action: "validate", params: { value: { $state: "/form/name" } } }] }`
- **THEN** the element is valid and renders normally; the `watch` field is handled by the renderer separately from rendering

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
An element SHALL support a `repeat` field `{ path: string | { $item: string } | { $state: string }, key?: string }` causing its `children` to render once per item in the iterable at the resolved path. The `path` field SHALL accept three forms:
- A plain string — an absolute store path (e.g., `"/items"`)
- `{ $item: "<field>" }` — resolved against the current `RepeatPathContext` to form an absolute path
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

#### Scenario: Repeat path uses $state expression
- **WHEN** an element has `repeat: { path: { $state: "/activeList" } }` and `/activeList` holds the string `"/fruits"` where `/fruits` is an array of length 3
- **THEN** `Renderer` renders the children 3 times, iterating over `/fruits`

