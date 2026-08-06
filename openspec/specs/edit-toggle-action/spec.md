## Purpose
The edit-toggle action system snapshots store state and toggles the editing section, backing the Edit/Save/Cancel lifecycle.

## Requirements

### Requirement: startEdit handler snapshots state and enables edit mode
A handler named `startEdit` SHALL be registered in the demo's handlers map. When invoked, it SHALL deep-clone the full store state via `getState()` and write it to `/_snapshot`, then set `/editingSection` to `true`. The handler MUST NOT require params.

#### Scenario: startEdit snapshots current state
- **WHEN** `startEdit` is invoked and the store contains `{ items: [...], savedAt: "..." }`
- **THEN** `/_snapshot` contains a deep clone of the full state and `/editingSection` becomes `true`

#### Scenario: startEdit overwrites previous snapshot
- **WHEN** `startEdit` is invoked and `/_snapshot` already exists from a previous edit session
- **THEN** `/_snapshot` is replaced with the current state snapshot

### Requirement: saveEdit handler clears snapshot and exits edit mode
A handler named `saveEdit` SHALL be registered in the demo's handlers map. When invoked, it SHALL delete `/_snapshot` and set `/editingSection` to `false`. The handler MUST NOT require params.

#### Scenario: saveEdit exits edit mode
- **WHEN** `saveEdit` is invoked
- **THEN** `/_snapshot` is cleared (set to undefined) and `/editingSection` becomes `false`

### Requirement: cancelEdit handler restores snapshot and exits edit mode
A handler named `cancelEdit` SHALL be registered in the demo's handlers map. When invoked, it SHALL iterate the union of snapshot keys and current state keys (excluding `_snapshot` and `editingSection`) and call `setState(key, snapshotValue)` for each, then delete `/_snapshot` and set `/editingSection` to `false`. The handler MUST NOT require params.

#### Scenario: cancelEdit restores all changed values
- **WHEN** `startEdit` was invoked, `/items/0/name` was changed from "Alice" to "Bob" via BoundField, and `cancelEdit` is invoked
- **THEN** `/items/0/name` is restored to "Alice", `/_snapshot` is cleared, and `/editingSection` becomes `false`

#### Scenario: cancelEdit resets newly created fields to undefined
- **WHEN** `startEdit` was invoked on an empty store, a field is typed during edit (creating a new key not in the snapshot), and `cancelEdit` is invoked
- **THEN** the new field is reset to `undefined`, `/_snapshot` is cleared, and `/editingSection` becomes `false`

#### Scenario: cancelEdit does not re-render unchanged cells
- **WHEN** `cancelEdit` restores values and a cell's value in the snapshot equals its current value
- **THEN** that cell's component does NOT re-render (the store's equality check treats the `setState` as a no-op)

### Requirement: EditToggle dispatches edit/save/cancel in relevant specs
The Form, Actions, Large, and Table demo specs SHALL each include an `EditToggle` element with `on: { edit: { action: "startEdit" }, save: { action: "saveEdit" }, cancel: { action: "cancelEdit" } }`. Clicking the buttons SHALL invoke the corresponding handler.

#### Scenario: Edit button invokes startEdit
- **WHEN** the user clicks the "Edit" button in the Form tab
- **THEN** the `startEdit` handler is invoked, state is snapshotted, and all BoundFields become editable

#### Scenario: Save button invokes saveEdit
- **WHEN** the user clicks the "Save" button in the Large tab
- **THEN** the `saveEdit` handler is invoked, the snapshot is cleared, and all BoundFields return to read-only

#### Scenario: Cancel button invokes cancelEdit
- **WHEN** the user edits fields in the Table tab then clicks "Cancel"
- **THEN** the `cancelEdit` handler is invoked, all edits are reverted to the snapshot, and all BoundFields return to read-only

### Requirement: Basic tab is unaffected
The Basic tab spec SHALL NOT include an edit toggle button, as it contains no BoundFields.

#### Scenario: Basic tab has no edit button
- **WHEN** the Basic tab is selected
- **THEN** no Edit/ActionButton toggle is rendered in that tab
