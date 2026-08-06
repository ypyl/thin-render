## Purpose

Provides a pure, zero-dependency function that walks a spec tree and calls user-provided registry functions to produce output of any type — without React, subscriptions, or DOM involvement. Expression resolution is left to the registry functions, which receive the store and repeat scope via context.

## Requirements

### Requirement: renderGeneric walks spec tree from root

The library SHALL export a `renderGeneric` function accepting `(spec, store, registry)` and returning `unknown`. It MUST resolve `spec.root` and walk the element tree, calling the corresponding `registry[element.type]` function for each element.

#### Scenario: Renders a minimal one-element spec

- **WHEN** `renderGeneric` is called with `spec = { root: "a", elements: { a: { type: "Text" } } }`, `store`, and `registry = { Text: () => "hello" }`
- **THEN** it returns `"hello"`

#### Scenario: Root element not found returns null

- **WHEN** `spec.root` does not match any key in `spec.elements`
- **THEN** `renderGeneric` returns `null` and does not throw

#### Scenario: Null spec returns null

- **WHEN** `spec` is `null`
- **THEN** `renderGeneric` returns `null` and does not throw

### Requirement: Element props are passed raw to registry functions
The library SHALL pass element `props` to registry functions RAW — `$state`, `$item`, and `$index` expression objects SHALL NOT be resolved by the renderer. The `ctx` argument SHALL carry the `store`, `basePath`, `scopes` (repeat scope stack, innermost first), and `index`, so registry functions can resolve expressions themselves, exactly like React components resolve expressions via hooks. Plain values (strings, numbers, booleans, arrays) SHALL pass through unchanged.

#### Scenario: $state expression passed through raw
- **WHEN** an element has `props: { text: { $state: "/title" } }` and `store.get("/title")` returns `"Report"`
- **THEN** the registry function receives `props.text` as the expression object `{ $state: "/title" }` unchanged, and can resolve it via `ctx.store`

#### Scenario: $item expression resolved manually by the registry
- **WHEN** inside a repeat at `/items/2`, an element has `props: { label: { $item: "name" } }` and the registry function resolves it against `ctx.basePath`
- **THEN** the registry function receives `props.label` as the expression object and resolves it to the path `/items/2/name` (or reads the value at that path) using `ctx`

#### Scenario: Plain values pass through unchanged
- **WHEN** an element has `props: { count: 42, label: "Hello", flag: true }`
- **THEN** the registry function receives `props.count === 42`, `props.label === "Hello"`, `props.flag === true`

#### Scenario: Arrays in props pass through without expression resolution
- **WHEN** an element has `props: { items: [{ $state: "/x" }] }`
- **THEN** the array is passed through as-is (expression objects inside arrays are NOT resolved, mirroring the React-side behavior)

### Requirement: renderGeneric handles repeat iteration

When an element has a `repeat` config, the library SHALL render the element's `children` once per item in the resolved iterable. It MUST support both array and object iteration with `$state` and `$item` expressions in `repeat.path`. Children within each iteration SHALL be scoped to the item's path and index.

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

#### Scenario: Repeat path resolves to non-iterable renders nothing

- **WHEN** `repeat.path` resolves to a value that is neither an array nor a plain object (e.g., `null`, a string, a number)
- **THEN** no children are rendered (empty array returned for that element)

#### Scenario: Repeat key from item field

- **WHEN** an element has `repeat: { path: "/rows", key: "id" }` and items have `{ id: "x" }` and `{ id: "y" }`
- **THEN** the key field is available for the registry function to use (e.g., for stable identification), but the renderer does not enforce key uniqueness

### Requirement: Missing element or registry type warns and returns null

The library SHALL log a warning when a referenced element key is missing from `spec.elements`. The library SHALL log a warning when an element's `type` has no corresponding function in the `registry`. In both cases, the element SHALL render as `null` and SHALL NOT throw.

#### Scenario: Missing element key warns

- **WHEN** an element references a child key `"missing"` that is not in `spec.elements`
- **THEN** `console.warn` is called with a message including the missing key, and the walk returns `null` for that element without throwing

#### Scenario: Missing registry type warns

- **WHEN** an element has `type: "UnknownType"` and `registry` has no `UnknownType` key
- **THEN** `console.warn` is called with a message including the type name, and the element renders as `null` without throwing

### Requirement: Registry function receives raw props and rendered children
The library SHALL call each registry function with `(props, children, ctx)` where `props` is the element's `props` (or `{}` if undefined) passed RAW (expressions unresolved), `children` is a flat array of results from rendering child elements (empty array if no children), and `ctx` is the `RenderContext`.

For array-form `children`, `children` SHALL hold the rendered results in order and `ctx.slots` SHALL be `undefined`. For record-form `children`, `children` SHALL be an empty array and `ctx.slots` SHALL hold one entry per slot name, each entry being the array of results from rendering that slot's child elements (in the order listed; empty array if none). The two forms are mutually exclusive — a registry function receives results either via `children` or via `ctx.slots`, never both.

For an element with a `repeat` config, the above SHALL hold per item: each item's iteration renders the element's children (array or record form) once, scoped to the item's path and index, and the registry function is called once with the concatenated results (array form) or per-item `ctx.slots` merged by slot name (record form, slot entries concatenated across items in iteration order).

#### Scenario: Registry receives empty props and empty children

- **WHEN** an element has no `props` and no `children`
- **THEN** the registry function receives `props = {}`, `children = []`, and `ctx.slots` is `undefined`

#### Scenario: Registry receives array of child results

- **WHEN** an element with `children: ["a", "b"]` is rendered and child elements produce results `"resultA"` and `"resultB"`
- **THEN** the registry function receives `children = ["resultA", "resultB"]` and `ctx.slots` is `undefined`

#### Scenario: Registry receives named slots for record-form children
- **WHEN** an element with `children: { "header": "h", "body": ["b1", "b2"] }` is rendered and child elements produce `"resultH"`, `"resultB1"`, `"resultB2"`
- **THEN** the registry function receives `children = []` and `ctx.slots = { header: ["resultH"], body: ["resultB1", "resultB2"] }`

#### Scenario: Repeat with record-form children concatenates slots per item
- **WHEN** an element with `repeat: { path: "/rows" }` and `children: { "title": "t" }` iterates two items whose `t` child produces `"T0"` and `"T1"`
- **THEN** the registry function receives `children = []` and `ctx.slots = { title: ["T0", "T1"] }`

### Requirement: GenericRegistry type is exported

The library SHALL export a `GenericRegistry` type representing a mapping from spec type names to functions `(props: Record<string, unknown>, children: unknown[], ctx: RenderContext) => unknown`. The `RenderContext` type SHALL also be exported. Registry entries MAY return different types — the type system does not enforce homogeneity. Users cast the return value of `renderGeneric` at the call site.

#### Scenario: TypeScript compilation with GenericRegistry

- **WHEN** a user writes `const registry: GenericRegistry = { Text: () => "hello", Count: () => 42 }`
- **THEN** TypeScript accepts heterogeneous return types without error


