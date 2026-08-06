## Purpose
The EditToggle component switches between a single Edit button and a Save/Cancel button group based on the editing state.

## Requirements

### Requirement: EditToggle renders one button in view mode, two buttons in edit mode
The demo SHALL provide a reusable `EditToggle` component that subscribes to `/editingSection` via `useValue`. When `/editingSection` is falsy, it SHALL render a single "Edit" button. When `/editingSection` is true, it SHALL render two buttons: "Save" and "Cancel", displayed as a horizontal group with the Cancel button visually distinct (outline variant).

#### Scenario: View mode shows only Edit button
- **WHEN** `/editingSection` is undefined or falsy
- **THEN** `EditToggle` renders a single button labeled "Edit"

#### Scenario: Edit mode shows Save and Cancel buttons
- **WHEN** `/editingSection` is true
- **THEN** `EditToggle` renders two buttons: "Save" (filled) and "Cancel" (outline), placed side by side

#### Scenario: Clicking Edit dispatches startEdit
- **WHEN** the user clicks the "Edit" button
- **THEN** `emit("edit")` is called, which resolves to the `startEdit` handler

#### Scenario: Clicking Save dispatches saveEdit
- **WHEN** the user clicks the "Save" button in edit mode
- **THEN** `emit("save")` is called, which resolves to the `saveEdit` handler

#### Scenario: Clicking Cancel dispatches cancelEdit
- **WHEN** the user clicks the "Cancel" button in edit mode
- **THEN** `emit("cancel")` is called, which resolves to the `cancelEdit` handler

### Requirement: EditToggle replaces ActionButton as the edit toggle across all tabs
The Form, Actions, Large, and Table demo tabs SHALL each use an `EditToggle` element instead of the previous `ActionButton` "Edit" toggle. Each spec SHALL map the `edit`, `save`, and `cancel` events to the corresponding handlers.

#### Scenario: Form tab uses EditToggle
- **WHEN** the Form tab is selected
- **THEN** an `EditToggle` is rendered at the top of the form, not an `ActionButton` with `toggleEdit`

#### Scenario: Large tab uses EditToggle
- **WHEN** the Large (1000) tab is selected
- **THEN** an `EditToggle` is rendered above the repeated rows

#### Scenario: Table tab uses EditToggle
- **WHEN** the Table tab is selected
- **THEN** an `EditToggle` is rendered above the HTML table
