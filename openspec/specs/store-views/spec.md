# store-views Specification

## Purpose
Lets a nested spec package (its own spec, registry, and handlers) render data that lives at a subtree of a bigger store, with no data copies and no sync bridges.
## Requirements
### Requirement: createStoreView returns a Store rebased to a base path
`createStoreView(store, basePath)` SHALL return an object satisfying the `Store` interface whose `get(path)` reads `store` at the path formed by joining `basePath` and `path`, and whose `set(path, value)` writes `store` at the joined path.

#### Scenario: Get reads through to the base subtree
- **WHEN** a store has state `{ a: { b: { x: 1 } } }` and a view is created with basePath `/a/b`
- **THEN** `view.get("/x")` returns `1`

#### Scenario: Set writes through to the base subtree
- **WHEN** a view with basePath `/a/b` calls `set("/x", 2)`
- **THEN** the underlying store has `get("/a/b/x")` equal to `2`

### Requirement: Path joining normalizes empty and slash-prefixed paths
Joining SHALL map the empty path to exactly `basePath` (never `basePath + "/"`), and SHALL treat paths with or without a leading `/` as equal.

#### Scenario: Empty path addresses the base subtree
- **WHEN** a view with basePath `/a/b` calls `get("")`
- **THEN** it returns the value at `/a/b` in the underlying store

#### Scenario: Leading slash is optional
- **WHEN** a view with basePath `/a/b` calls `get("/x")` and `get("x")`
- **THEN** both return the same value

### Requirement: getState returns the subtree snapshot
`getState()` on a view SHALL return the value at `basePath` (the subtree), so that paths passed to `get`/`set`/`subscribe` are relative to that subtree.

#### Scenario: getState is subtree-scoped
- **WHEN** a view with basePath `/a/b` is created over state `{ a: { b: { x: 1 }, y: 2 } }`
- **THEN** `view.getState()` returns `{ x: 1 }` (not the root state, and not containing `/a/y`)

### Requirement: Subscription delegation preserves granularity
`subscribe(path, listener)` on a view SHALL delegate to `store.subscribe(joinedPath, listener)` and return a function that unsubscribes the delegated subscription. The view MUST NOT maintain its own listener registry. A listener SHALL be notified exactly when the underlying store notifies on the joined path (overlapping writes), and MUST NOT be notified by writes outside the base subtree.

#### Scenario: Write inside the subtree notifies
- **WHEN** a view with basePath `/a/b` subscribes to `/x`, and the underlying store is written at `/a/b/x`
- **THEN** the listener is called

#### Scenario: Write outside the subtree does not notify
- **WHEN** a view with basePath `/a/b` subscribes to `/x`, and the underlying store is written at `/c/x`
- **THEN** the listener is not called

#### Scenario: Unsubscribe removes the delegated listener
- **WHEN** the function returned by `view.subscribe("/x", fn)` is called and the underlying store is then written at `/a/b/x`
- **THEN** `fn` is not called

### Requirement: Writes materialize the base subtree when absent
`set` on a view SHALL create the base path structure in the underlying store if it does not exist yet (delegating to the store's set semantics).

#### Scenario: Set on missing base creates structure
- **WHEN** a view with basePath `/a/b` calls `set("/x", 1)` on an empty store
- **THEN** the underlying store has `get("/a/b/x")` equal to `1`

### Requirement: Views compose
A view created over another view SHALL behave like a single view whose base path is the joined base paths.

#### Scenario: View of view reads through both prefixes
- **WHEN** `createStoreView(createStoreView(store, "/a"), "/b")` is used to read path `/x` over state `{ a: { b: { x: 5 } } }`
- **THEN** it returns `5`

