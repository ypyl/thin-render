## Purpose

Provides a pure, zero-dependency function that walks a spec tree, resolves expressions against a store, and calls user-provided registry functions to produce output of any type — without React, subscriptions, or DOM involvement.

## ADDED Requirements

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

### Requirement: Element props have expressions resolved before registry call

The library SHALL resolve `$state`, `$item`, and `$index` expression objects in element `props` before passing them to the registry function. Resolution SHALL occur recursively into nested objects and SHALL read from the store at generation time (read-once, never subscribed). Plain values (strings, numbers, booleans, arrays) SHALL pass through unchanged.

#### Scenario: $state expression resolved from store

- **WHEN** an element has `props: { text: { $state: "/title" } }` and `store.get("/title")` returns `"Report"`
- **THEN** the registry function receives `props.text === "Report"`

#### Scenario: $state path not found resolves to undefined

- **WHEN** an element has `props: { text: { $state: "/missing" } }` and no value exists at that path
- **THEN** the registry function receives `props.text === undefined`

#### Scenario: $item expression resolved against repeat scope

- **WHEN** inside a repeat at `/items/2`, an element has `props: { label: { $item: "name" } }` and `store.get("/items/2/name")` returns `"Widget"`
- **THEN** the registry function receives `props.label === "Widget"`

#### Scenario: $item empty string resolves to base path

- **WHEN** inside a repeat at `/items/2`, an element has `props: { path: { $item: "" } }`
- **THEN** the registry function receives `props.path === "/items/2"`

#### Scenario: $index true resolves to numeric index

- **WHEN** inside a repeat at index 5, an element has `props: { idx: { $index: true } }`
- **THEN** the registry function receives `props.idx === 5`

#### Scenario: $index false resolves to undefined

- **WHEN** an element has `props: { idx: { $index: false } }`
- **THEN** the registry function receives `props.idx === undefined`

#### Scenario: Plain values pass through unchanged

- **WHEN** an element has `props: { count: 42, label: "Hello", flag: true }`
- **THEN** the registry function receives `props.count === 42`, `props.label === "Hello"`, `props.flag === true`

#### Scenario: Nested objects with expressions are recursively resolved

- **WHEN** an element has `props: { meta: { source: { $state: "/src" } } }` and `store.get("/src")` returns `"api"`
- **THEN** the registry function receives `props.meta.source === "api"`

#### Scenario: Arrays in props pass through without expression resolution

- **WHEN** an element has `props: { items: [{ $state: "/x" }] }`
- **THEN** the array is passed through as-is (expression objects inside arrays are NOT resolved, consistent with `resolveParams` behavior)

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

### Requirement: Registry function receives resolved props and rendered children

The library SHALL call each registry function with `(props, children)` where `props` is the element's `props` (or `{}` if undefined) with all expressions resolved, and `children` is a flat array of results from rendering child elements (empty array if no children).

#### Scenario: Registry receives empty props and empty children

- **WHEN** an element has no `props` and no `children`
- **THEN** the registry function receives `props = {}` and `children = []`

#### Scenario: Registry receives array of child results

- **WHEN** an element with `children: ["a", "b"]` is rendered and child elements produce results `"resultA"` and `"resultB"`
- **THEN** the registry function receives `children = ["resultA", "resultB"]`

### Requirement: GenericRegistry type is exported

The library SHALL export a `GenericRegistry` type representing a mapping from spec type names to functions `(props: Record<string, unknown>, children: unknown[]) => unknown`. Registry entries MAY return different types — the type system does not enforce homogeneity. Users cast the return value of `renderGeneric` at the call site.

#### Scenario: TypeScript compilation with GenericRegistry

- **WHEN** a user writes `const registry: GenericRegistry = { Text: () => "hello", Count: () => 42 }`
- **THEN** TypeScript accepts heterogeneous return types without error


