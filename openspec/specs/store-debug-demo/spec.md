## Purpose

Shows how to debug what is going on with the store without any library support: a demo case that wraps a store in a logging decorator and hosts a live write-log panel in a draggable floating window over the spec-driven app.

## Requirements

### Requirement: Logging store wrapper records every write
The case SHALL ship a `createLogStore` wrapper that implements the `Store` interface by delegating `get`, `subscribe`, and `getState` to the underlying store. The wrapper's `set` SHALL record a log entry containing the path, the previous value, the new value, and whether the write was a no-op (previous value identical to new value), then SHALL delegate to the underlying store's `set`. Recorded entries SHALL be queryable and subscribable so a UI can render them live. The wrapper SHALL expose the underlying store as `window.__store` when running in the demo.

#### Scenario: Wrapper delegates reads and subscriptions
- **WHEN** a component calls `get`, `subscribe`, or `getState` on the wrapped store
- **THEN** the call is forwarded to the underlying store with the same path and semantics

#### Scenario: Every set produces a log entry
- **WHEN** `set` is called on the wrapped store with a path and value
- **THEN** an entry is recorded with the exact path, the value previously stored at that path, the new value, and `noop: false`

#### Scenario: Same-value set is flagged as a no-op
- **WHEN** `set` is called with a value identical to the value already stored at that path
- **THEN** the entry records `noop: true` while the underlying store silently ignores the write

#### Scenario: Log entries are subscribable
- **WHEN** a new entry is recorded
- **THEN** all subscribers of the wrapper's entry list are notified and can read the updated list

#### Scenario: Underlying store exposed on window
- **WHEN** the case runs in the demo
- **THEN** `window.__store` points at the underlying (unwrapped) store, so `getState()` can be poked from the browser console

### Requirement: Store debug case exists at /store-debug
A demo case SHALL exist at `/store-debug` that renders a spec-driven app full-width, with debug information available in a floating window opened from a fixed button. The app SHALL be described by a spec and SHALL include at least: an editable bound text field, a repeat list whose items have editable fields, and a button whose action handler writes multiple paths in one dispatch. The app's store SHALL be the wrapped store, so every app write appears in the log.

#### Scenario: Case renders app full-width with a debug button
- **WHEN** navigating to `/store-debug`
- **THEN** the page renders the spec-driven app full-width
- **AND** a fixed debug button is visible in the corner of the viewport

#### Scenario: Editing a bound field logs the write
- **WHEN** the user types into the bound text field
- **THEN** the field updates and the debug panel shows a new entry for the field's bind path with the previous and new values

#### Scenario: Editing a repeat item logs an item-scoped write
- **WHEN** the user edits a field of one item in the repeat list
- **THEN** the debug panel shows a new entry whose path includes the item's index or key

#### Scenario: Handler multi-write appears as one entry per path
- **WHEN** the user clicks the multi-write button
- **THEN** the debug panel shows one new entry per path written by the handler

### Requirement: Floating debug window opens from an affix button
The case SHALL render a fixed button at the bottom-right of the viewport that opens a floating window containing the debug panel. The button SHALL display a live badge with the number of recorded entries. The floating window SHALL be draggable by its header only, resizable within minimum and maximum dimensions, constrained to the viewport, and closable. The window SHALL NOT block interaction with the app underneath. The wrapper SHALL keep recording entries while the window is closed.

#### Scenario: Button opens and closes the window
- **WHEN** the user clicks the debug button
- **THEN** the floating window appears containing the debug panel
- **WHEN** the user clicks the window's close button
- **THEN** the window disappears and the app remains unchanged

#### Scenario: Badge shows the live entry count
- **WHEN** writes are recorded while the window is closed
- **THEN** the button's badge shows the number of recorded entries without the window being open

#### Scenario: Window stays open while the app is used
- **WHEN** the window is open and the user types into a bound field in the app
- **THEN** the field updates, the window remains open, and the new write appears in the log

#### Scenario: Window drags by its header only
- **WHEN** the user drags the window's header
- **THEN** the window moves on screen
- **WHEN** the user scrolls inside the write log
- **THEN** the log scrolls and the window does not move

#### Scenario: Window is resizable
- **WHEN** the user drags the window's resize handle
- **THEN** the window resizes within its configured minimum and maximum dimensions

#### Scenario: Window is constrained to the viewport
- **WHEN** the user drags or resizes the window
- **THEN** the window cannot leave the viewport bounds

#### Scenario: Log records while the window is closed
- **WHEN** the window is closed and the user interacts with the app
- **THEN** entries are recorded in the wrapper
- **AND** the button's badge count increases

### Requirement: Debug panel shows a live, capped write log
The debug panel SHALL render the recorded entries newest-first with path, previous value, and new value, and SHALL visually mark no-op entries. The panel SHALL cap the displayed entries at a fixed maximum and SHALL provide a Clear button that empties the log and a Pause toggle that stops recording new entries without affecting app behavior. The panel SHALL also render a live snapshot of the current state.

#### Scenario: Newest entries appear first
- **WHEN** multiple writes have been recorded
- **THEN** the panel lists them with the most recent write at the top

#### Scenario: No-op writes are marked
- **WHEN** a same-value write is recorded
- **THEN** the panel visually distinguishes the no-op entry from normal writes

#### Scenario: Clear empties the log
- **WHEN** the user clicks Clear
- **THEN** the panel shows no entries, and subsequent writes appear again

#### Scenario: Pause stops recording
- **WHEN** the user toggles Pause on and then performs an app write
- **THEN** no new entry is added to the panel
- **WHEN** the user toggles Pause off and performs an app write
- **THEN** a new entry is added again

### Requirement: Home page and routing include the case
The home page CASES array SHALL include an entry for the store-debug demo and the App router SHALL have a `/store-debug` route.

#### Scenario: Store-debug card appears on home page
- **WHEN** viewing the home page
- **THEN** a card for the store-debug demo is present with a description naming store debugging

#### Scenario: Route renders the case
- **WHEN** navigating to `/store-debug`
- **THEN** the store-debug case renders without errors
