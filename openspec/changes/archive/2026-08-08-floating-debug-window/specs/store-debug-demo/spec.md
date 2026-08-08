## MODIFIED Requirements

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

## ADDED Requirements

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
