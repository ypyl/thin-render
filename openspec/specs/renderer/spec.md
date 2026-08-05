## Purpose
The Renderer module resolves spec element types against a component registry, renders children in spec order, provides repeat iteration over arrays and plain objects, and supplies stable emit closures for action dispatch — all while minimizing re-renders through memoization and targeted state subscriptions.
## Requirements
### Requirement: Renderer resolves element types via a registry
The `<Renderer spec registry store? handlers? />` component SHALL walk the spec starting at `spec.root`, resolve each element's `type` against the `registry` map, and render the matched component. When no component is registered for `type`, `Renderer` SHALL render nothing and log a warning.

`Renderer` SHALL also establish a path-scope boundary by resetting `PathContext` to `""` and `RepeatIndexContext` to `undefined` for its entire subtree, so that any `usePath()` or `useRepeatIndex()` calls inside a nested renderer return root values regardless of any outer `RepeatScope` that may contain this `Renderer`.

#### Scenario: Unknown type renders nothing
- **WHEN** an element has `type: "Nonexistent"` and no `Nonexistent` entry exists in the registry
- **THEN** `Renderer` renders nothing for that element and logs a warning to the console

#### Scenario: Nested renderer resets path scope
- **WHEN** a component inside a `RepeatScope` with `PathContext` at `/items/0` renders a `<Renderer>` as its child, and a descendant component inside that nested `Renderer` calls `usePath()`
- **THEN** `usePath()` returns `""` (root), not `/items/0`

#### Scenario: Nested renderer resets repeat index scope
- **WHEN** a component inside a `RepeatScope` with `RepeatIndexContext` at `3` renders a `<Renderer>` as its child, and a descendant component inside that nested `Renderer` calls `useRepeatIndex()`
- **THEN** `useRepeatIndex()` returns `undefined`, not `3`

#### Scenario: Outer repeat scope still works after nested render
- **WHEN** a `RepeatChildren` at `/items` contains a component that renders a nested `<Renderer>`, and the same row also contains a component that calls `usePath()` directly (not inside the nested `Renderer`)
- **THEN** the direct `usePath()` call returns `/items/N` for its row, unaffected by the nested renderer

### Requirement: ElementRenderer does not subscribe to state
The internal `ElementRenderer` SHALL NOT read the store value or subscribe to state. It MUST render based solely on the spec element, the registry, the stable `ActionContext`, and the stable `StoreContext` reference. Therefore an arbitrary state mutation elsewhere SHALL NOT re-render an `ElementRenderer` whose element and registry props are unchanged.

#### Scenario: State change does not re-render a static element
- **WHEN** an element of type `Text` renders `{ props: { text: "hi" } }` and `/other` changes
- **THEN** the `Text`'s `ElementRenderer` does not re-render

### Requirement: ElementRenderer is memoizable per element
`ElementRenderer` SHALL be wrapped in `React.memo` so that, when its `element` (by spec key), `spec`, and `registry` props are referentially unchanged, React skips re-rendering it.

#### Scenario: Memo skips re-render on unrelated parent re-render
- **WHEN** a parent component re-renders for an unrelated reason but passes the same `element`, `spec`, `registry` references to a memoized `ElementRenderer`
- **THEN** `React.memo` prevents the `ElementRenderer` body from running

### Requirement: Children render in spec order with stable keys
When an element declares `children: [k1, k2, ...]`, `Renderer` SHALL render each child `ElementRenderer` keyed by its spec key in the order listed. Missing child keys SHALL be skipped with a console warning (only when not streaming/loading).

When an element declares record-form `children` (`{ slotName: k | [k1, k2, ...] }`), `Renderer` SHALL render each slot's child `ElementRenderer`s keyed by their spec keys and pass them to the component via `ComponentProps.slots[slotName]` (a single node per slot; `children` prop SHALL be undefined). Within a slot, multiple children SHALL render in the order listed. Missing child keys in any slot SHALL be skipped with a console warning (only when not streaming/loading); the slot then holds the remaining children.

#### Scenario: Out-of-order children preserve spec order
- **WHEN** an element has `children: ["b", "a"]`
- **THEN** child `b` is rendered before child `a`

#### Scenario: Record-form children populate slots
- **WHEN** an element has `children: { "header": "h", "body": "b" }` and its component renders `{slots.header}{slots.body}`
- **THEN** the `h` element renders at the component's header position and the `b` element at its body position, regardless of declaration order

#### Scenario: Missing key inside a slot warns and is skipped
- **WHEN** an element has `children: { "body": ["missing", "b"] }` and `"missing"` is not in `spec.elements`
- **THEN** a console warning is logged (when not streaming/loading) and the `body` slot contains only the rendered `b` element

### Requirement: RepeatChildren supports array and record children
For an element with a `repeat` field, `RepeatChildren` SHALL render each item's children according to the element's `children` form: array-form children are passed to the repeated component via `ComponentProps.children`; record-form children are passed via `ComponentProps.slots` with per-slot nodes. Each repeated instance SHALL receive its own children/slots scoped to its item's `PathContext` and `RepeatIndexContext`. Missing child keys SHALL be skipped with a console warning, matching the non-repeated behavior.

#### Scenario: Repeat with record-form children builds slots per item
- **WHEN** an element has `repeat: { path: "/cards" }` and `children: { "title": "t", "body": "b" }`, and `/cards` holds two items
- **THEN** each repeated component instance receives `slots.title` and `slots.body` rendered for its own item, scoped to `/cards/0` and `/cards/1` respectively

#### Scenario: Repeat with array-per-slot renders all elements per item
- **WHEN** an element has `repeat: { path: "/rows" }` and `children: { "cells": ["c1", "c2"] }`
- **THEN** each repeated instance's `slots.cells` contains both `c1` and `c2` rendered for that item

### Requirement: RepeatChildren subscribes only to the iterable path
For an element with a `repeat` field, `RepeatChildren` SHALL resolve `repeat.path` via `useResolvedPath` to obtain the absolute store path. It SHALL then read the value at that resolved path via a single `useValue` call. It MUST NOT subscribe to any deeper path.

When the resolved path is `""` or `undefined`, `RepeatChildren` SHALL render nothing.

When the value is an array (`Array.isArray`), `RepeatChildren` SHALL iterate via `.map()` with the numeric index, exactly as before.

When the value is a plain object (non-null, non-array, `typeof === "object"`), `RepeatChildren` SHALL iterate via `Object.entries()`. Each entry SHALL produce a scope with:
- `PathContext` set to `${resolvedPath}/${objectKey}`
- `RepeatIndexContext` set to the numeric position (0, 1, 2, …)

When the value is neither an array nor a plain object, `RepeatChildren` SHALL render nothing.

Each repeated child is wrapped in a scope that sets `${resolvedPath}/${indexOrKey}` as the relevant base path for descendant binding components. Because structural sharing replaces the container on a deep leaf set, `RepeatChildren` MAY re-run its iteration when a descendant path changes — this is cheap (it only re-creates React element descriptors) and does NOT re-render the row components, which are gated by memoized `ElementRenderer` wrappers and per-cell `useValue` subscriptions.

#### Scenario: Editing one cell re-renders only that cell component
- **WHEN** a 1000-row table is rendered via `RepeatChildren`, and `/items/0/name` changes
- **THEN** the binding component subscribed to `/items/0/name` re-renders; the other 999 rows' binding components do NOT re-render

#### Scenario: Adding an item re-renders the list
- **WHEN** the array at `/items` is replaced with a longer array (new array object)
- **THEN** `RepeatChildren` re-renders to map over the new length

#### Scenario: Object iteration renders one child per key
- **WHEN** the store has `{ settings: { theme: "dark", lang: "en" } }` and a repeat element has `path: "/settings"`
- **THEN** two children are rendered: one with `PathContext` at `/settings/theme` and index 0, another at `/settings/lang` and index 1

#### Scenario: Object iteration with repeat.key extracts from value
- **WHEN** the store has `{ widgets: { a: { label: "Foo" }, b: { label: "Bar" } } }` and a repeat element has `path: "/widgets"` with `key: "label"`
- **THEN** React keys `"Foo"` and `"Bar"` are used; if `repeat.key` is undefined, React keys `"a"` and `"b"` are used

#### Scenario: Non-iterable value renders nothing
- **WHEN** the value at `repeat.path` is `"string"`, `42`, `null`, or `undefined`
- **THEN** `RepeatChildren` renders nothing (empty fragment)

#### Scenario: Nested repeat via $item expression
- **WHEN** an outer repeat at `/items` contains an element with `repeat: { path: { $item: "subitems" } }`, and `/items/2/subitems` holds `[{ val: 1 }, { val: 2 }]`
- **THEN** the inner repeat renders two children scoped to `/items/2/subitems/0` and `/items/2/subitems/1`

#### Scenario: Dynamic repeat target via $state expression
- **WHEN** an element has `repeat: { path: { $state: "/activeList" } }` and `/activeList` changes from `"/fruits"` to `"/vegetables"`
- **THEN** `RepeatChildren` re-renders and iterates over `/vegetables` instead of `/fruits`

#### Scenario: $state pointing to non-string renders nothing
- **WHEN** an element has `repeat: { path: { $state: "/badPointer" } }` and `/badPointer` holds the number `99`
- **THEN** `RepeatChildren` renders nothing (empty fragment)

### Requirement: Renderer provides stable emit per element
For each element with an `on` field, `ElementRenderer` SHALL build a stable `emit(name)` closure (stable across renders when `element.on` and the `ActionContext` are unchanged) that the rendered component invokes to dispatch actions.

#### Scenario: emit identity stable across re-renders
- **WHEN** the same element re-renders for unrelated reasons with the same `on` and same `ActionContext` reference
- **THEN** the `emit` function passed to the component is referentially identical

### Requirement: ElementRenderer subscribes to watched paths and dispatches actions
For each element with a `watch` field, `ElementRenderer` SHALL use `store.subscribe` (not `useValue`) to subscribe to each watched path. On mutation, it SHALL resolve action params via `resolveParams` and invoke the configured handlers with `{ getState, setState }`. Subscriptions SHALL be cleaned up on unmount. The subscribe callback SHALL NOT cause ElementRenderer to re-render.

#### Scenario: Watch fires handler on store mutation
- **WHEN** an element has `watch: { "/form/name": [{ action: "validate" }] }` and the store mutates `/form/name` from `"A"` to `"AB"`
- **THEN** the `validate` handler is invoked with resolved params and `{ getState, setState }`
- **AND** `ElementRenderer` does NOT re-render as a result of the subscription firing

#### Scenario: Watched path change that does not overlap does not fire
- **WHEN** an element has `watch: { "/form/name": [{ action: "validate" }] }` and the store mutates `/form/email`
- **THEN** the `validate` handler is NOT invoked

#### Scenario: Watch unsubscribes on unmount
- **WHEN** an element with a `watch` field unmounts (e.g., via conditional rendering)
- **THEN** subsequent mutations to the watched path do NOT invoke the handler

#### Scenario: Multiple actions per watched path fire in order
- **WHEN** an element has `watch: { "/qty": [{ action: "recalculate" }, { action: "checkInventory" }] }` and `/qty` changes
- **THEN** `recalculate` runs before `checkInventory`

