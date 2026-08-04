## Purpose
The action system dispatches user gestures (via `emit`) and store changes (via `watch`) to registered handler functions. Handlers receive resolved params and a `{ getState, setState }` API for reading and mutating the store.
## Requirements
### Requirement: Handlers are registered once at the top
The library SHALL accept a `handlers` map (string → handler function) provided to `<Renderer>` (or a provider). Handler registration is independent of state — the `ActionContext` value holds the `handlers` reference plus stable `getState`/`setState` functions, and the context value SHALL be referentially stable across state mutations.

#### Scenario: ActionContext value stable on state change
- **WHEN** state at `/x` changes
- **THEN** the `ActionContext` Provider value remains referentially identical and no `useContext(ActionContext)` consumer re-renders solely due to the state change

### Requirement: emit resolves action binding and invokes the handler
`emit(eventName)` SHALL look up `element.on[eventName]` (a binding or array of bindings). For each binding it resolves `params` by replacing any `{ $state: "<path>" }` value with the current value from `store.get(path)` (read on-demand, never subscribed) and then invokes the matching handler with `(resolvedParams, { getState, setState })`. If the binding is an array, handlers SHALL be invoked in order.

#### Scenario: $state param resolved at dispatch time
- **WHEN** `emit("click")` resolves a binding `{ action: "save", params: { id: { $state: "/doc/id" } } }` and `/doc/id` currently equals `"42"`
- **THEN** the `save` handler is invoked with `params.id === "42"`

#### Scenario: Multiple bindings in an array run sequentially
- **WHEN** `element.on.click` is `[{ action: "a" }, { action: "b" }]`
- **THEN** handler `a` runs to completion before handler `b` is invoked

### Requirement: Handler signature is (params, storeApi)
A handler SHALL be a function `(params: object, api: { getState, setState }) => void | Promise<void>`. `getState()` returns the live state snapshot (read on-demand); `setState(path, value)` mutates the store at the path (granularly notifying subscribers). Handlers MUST NOT be passed React-specific objects.

#### Scenario: Handler reads and writes store
- **WHEN** a `removeItem` handler receives `{ index: 2 }` and is defined as `(p, { getState, setState }) => setState("/items", getState().items.filter((_, i) => i !== p.index))`
- **THEN** after invocation `store.get("/items")` has length one less and listeners on `/items` are notified

#### Scenario: Async handler supported
- **WHEN** a handler is `async (p, { setState }) => { await fetch(...); setState("/savedAt", Date.now()); }`
- **THEN** `setState` after the await still flows through the store and granularly re-renders subscribers on `/savedAt`

### Requirement: Built-in setState action
The library SHALL provide a built-in handler named `setState` that sets a single path: `{ action: "setState", params: { path: "<path>", value: <value> } }`. It MUST NOT require user registration to function.

#### Scenario: setState built-in writes a path
- **WHEN** `emit("click")` resolves `{ action: "setState", params: { path: "/flag", value: true } }`
- **THEN** `store.get("/flag")` becomes `true` and subscribers on `/flag` re-render, with no user-registered handler needed

### Requirement: Dispatching an action never re-renders by itself
The act of calling `emit` SHALL NOT trigger any re-render. Re-renders SHALL occur only as a consequence of subsequent `setState` calls made by the invoked handler(s).

#### Scenario: Handler that does nothing causes no re-render
- **WHEN** `emit("click")` invokes a handler `() => {}` that performs no `setState`
- **THEN** no component re-renders as a result of the dispatch

### Requirement: Actions can be triggered by store changes via watch
In addition to `emit(eventName)` via `on` bindings, actions SHALL be triggerable by store mutations via `watch` bindings. When a watched store path changes, the configured action bindings SHALL be resolved and their handlers invoked exactly as if triggered by `emit` — same param resolution, same `{ getState, setState }` API, same handler function signature. The handler SHALL NOT be able to distinguish whether it was triggered by `emit` or by `watch`.

#### Scenario: Watch-triggered handler receives same API as emit-triggered
- **WHEN** a handler is invoked via `watch` on `/form/name`
- **THEN** it receives `(resolvedParams, { getState, setState })` — identical to being invoked via `emit("click")`

#### Scenario: Built-in setState works in watch bindings
- **WHEN** an element has `watch: { "/country": [{ action: "setState", params: { path: "/city", value: "" } }] }` and `/country` changes from `"US"` to `"CA"`
- **THEN** `/city` is set to `""` without any user-registered handler

### Requirement: emit warns when element has no on map
When `emit(eventName)` is called on an element with no `on` map (`on` is `undefined` or `null`), the library SHALL call `console.warn` with a descriptive message indicating the element has no action bindings. The emit call SHALL still return without error.

#### Scenario: Emit with no on map warns
- **WHEN** `emit("click")` is called from an element where `on` is `undefined`
- **THEN** `console.warn` is called with a message indicating no `on` bindings are configured
- **AND** `emit` returns without throwing

### Requirement: emit warns when event name is not in the on map
When `emit(eventName)` is called and the element has an `on` map but `on[eventName]` is `undefined`, the library SHALL call `console.warn` with a descriptive message including the event name and the available keys in the `on` map. The emit call SHALL still return without error.

#### Scenario: Emit with missing event name warns
- **WHEN** `emit("click")` is called on an element with `on: { change: { action: "save" } }`
- **THEN** `console.warn` is called with a message indicating `"click"` was not found and listing available event names
- **AND** `emit` returns without throwing

