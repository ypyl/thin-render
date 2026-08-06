## Purpose
The store reads and immutably writes nested values by JSON-Pointer-like paths with structural sharing.

## Requirements

### Requirement: Store supports get and set at JSON-Pointer-like paths
A `Store` created by `createStore(initial)` SHALL expose `get(path)` returning the value at the path (or `undefined` if any segment is missing) and `set(path, value)` performing an immutable structural-sharing update. Segments are `/`-separated; leading `/` is optional.

#### Scenario: Get reads a nested value
- **WHEN** `store.get("/items/0/name")` is called and the current state has `items: [{ name: "A" }]`
- **THEN** it returns `"A"`

#### Scenario: Missing path returns undefined
- **WHEN** `store.get("/items/99/name")` is called on a 1-element array
- **THEN** it returns `undefined`

#### Scenario: Set creates nested structure when absent
- **WHEN** `store.set("/a/b/c", 5)` is called on an empty initial state
- **THEN** `store.get("/a/b/c")` returns `5` and `store.get("/a/b")` returns `{ c: 5 }`

### Requirement: Set uses immutable structural sharing
`set(path, value)` SHALL produce a new root state object that shares unchanged sibling branches by reference and clones only objects/arrays along the path to the target. Setting a leaf MUST NOT change the reference identity of unrelated branches.

#### Scenario: Sibling branch identity preserved
- **WHEN** `store.set("/items/0/name", "X")` is called and the prior state has `items: [{ name: "A", qty: 1 }, { name: "B", qty: 2 }]`
- **THEN** the second item object (`items[1]`) is the same reference before and after, and the sibling field `items[0].qty` object substructure is unchanged where unaffected

### Requirement: Subscribers register for a specific path
A `Store` SHALL expose `subscribe(path, listener)` returning an unsubscribe function. The store MUST maintain listeners per path. `set(path, value)` MUST notify a listener when the set `path` equals the listener's path, is an ancestor of it, or is a descendant of it (i.e., the listener's subscribed path and the mutated path overlap in the tree).

#### Scenario: Listener on exact path notified
- **WHEN** `subscribe("/x", fn)` then `set("/x", 1)`
- **THEN** `fn` is called

#### Scenario: Listener on ancestor notified by descendant set
- **WHEN** `subscribe("/items", fn)` then `set("/items/0/name", "A")`
- **THEN** `fn` is called (the array identity changed because the first item object was replaced)

#### Scenario: Listener on descendant notified by ancestor set
- **WHEN** `subscribe("/items/0/name", fn)` then `set("/items", [...])`
- **THEN** `fn` is called (the descendant path may have a new value)

#### Scenario: Unrelated listener not notified
- **WHEN** `subscribe("/other", fn)` then `set("/items/0/name", "A")`
- **THEN** `fn` is NOT called because the paths do not overlap

### Requirement: No-op set does not notify
`set(path, value)` where the value at `path` is already strictly equal to `value` SHALL not mutate state and SHALL NOT notify any listener.

#### Scenario: Same value set twice triggers one notification
- **WHEN** `subscribe("/x", fn)`, then `set("/x", 1)`, then `set("/x", 1)`
- **THEN** `fn` is called exactly once

### Requirement: useValue subscribes to one path via useSyncExternalStore
The `useValue<T>(path)` hook SHALL use `useSyncExternalStore` with a per-path subscribe function and per-path getSnapshot, returning the current value at `path`. The hook MUST cause the component to re-render only when the value at `path` changes (by strict equality).

#### Scenario: Component re-renders on subscribed path change
- **WHEN** a component calls `useValue<string>("/user/name")` and `/user/name` changes from `"A"` to `"B"`
- **THEN** the component re-renders with the new value

#### Scenario: Component does not re-render on unrelated path change
- **WHEN** a component calls `useValue<string>("/user/name")` and `/user/email` changes
- **THEN** the component does not re-render

### Requirement: useBound returns value and setter for a path
The `useBound<T>(path)` hook SHALL return `[value, setValue]` where `value` is `useValue<T>(path)` and `setValue(v)` calls `store.set(path, v)`. Calling `setValue` MUST NOT trigger a re-render of the caller other than through the resulting `set`.

#### Scenario: useBound two-way bind
- **WHEN** a component calls `const [v, setV] = useBound("/x")`, then calls `setV(2)`
- **THEN** `store.get("/x")` returns `2` and the component re-renders with `v === 2`