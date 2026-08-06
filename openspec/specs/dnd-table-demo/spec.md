# dnd-table-demo Specification

## Purpose
The DndTable demo shows a sortable, editable table powered by @dnd-kit, with drag-and-drop reordering, add/remove rows, and an edit/save/cancel flow.
## Requirements
### Requirement: DndTable renders a sortable table with drag handles
A `DndTable` component SHALL exist as a registry component that reads an array from the store at `element.props.path` and renders a Mantine `<Table>` with an auto-generated header row containing a drag column header, one `<Table.Th>` per entry in `element.props.columns`, and an actions column header. Rows SHALL be rendered via internal iteration (`.map()`) inside `<SortableContext>` using the `SortableRow` component. An "Add Row" button SHALL appear below the table, appending a new item with default values to the store. On drag end, DndTable SHALL compute the reordered array via `arrayMove` and write it to the store.

> **Limitation:** DndTable does NOT use thin-render's `repeat` directive. @dnd-kit requires `SortableContext` and `useSortable` to be in the same React render pass; `repeat` renders via a separate `RepeatChildren`/`ElementRenderer` pass, desynchronizing @dnd-kit's animation cycle and causing a double-move visual glitch. This is an inherent incompatibility between external DnD libraries and spec-driven repeat rendering.

#### Scenario: Table renders rows from store
- **WHEN** the store has `{ items: [{ name: "Alice", email: "a@x.com" }] }` and the spec has DndTable with `columns: ["Name", "Email"]`
- **THEN** the header row renders Th elements for the drag column, "Name", "Email", and actions column
- **AND** rows are rendered with drag handles, Name/Email values, and remove buttons

#### Scenario: Drag-and-drop reorders rows
- **WHEN** a user drags the second row above the first row and drops it
- **THEN** the visual order updates to show the dragged row first
- **AND** the store at the configured path is updated with the new array order

#### Scenario: Add row button appends a new item
- **WHEN** the user clicks the "Add Row" button
- **THEN** a new item `{ name: "New", email: "new@example.com" }` is appended to the array in the store

#### Scenario: Remove button removes the specified row
- **WHEN** the user clicks the remove button on the first row
- **THEN** that row is removed from the array in the store

#### Scenario: Keyboard-based reordering
- **WHEN** a user focuses a drag handle and uses keyboard controls to move a row
- **THEN** the row reorders and the store is updated on completion

### Requirement: Dnd table demo case has its own page
A demo case SHALL exist at the `/dnd-table` route with a `DndTableCase` component that creates a store with a list of items and renders a `Renderer` with the DndTable spec.

#### Scenario: Navigating to dnd-table page
- **WHEN** navigating to `/dnd-table`
- **THEN** the DndTable renders inside a CaseContainer with title "Drag & Drop Table"
- **AND** the table shows rows with drag handles, Name, Email, and remove buttons
- **AND** an "Add Row" button is visible below the table

#### Scenario: Home page includes dnd-table card
- **WHEN** viewing the home page
- **THEN** a card for "Drag & Drop" is present with a description mentioning drag-and-drop reordering

### Requirement: DndTable supports edit/save/cancel toggle
DndTable SHALL support an edit/save/cancel lifecycle via Edit/Save/Cancel buttons rendered above the table. The store SHALL track editing state via `/editingSection`. On edit, DndTable SHALL snapshot the current items array into `/_snapshot/items` for cancel support. On save, the snapshot SHALL be cleared and editing disabled. On cancel, items SHALL be restored from `/_snapshot/items` and editing disabled. When `/editingSection` is true, SortableRow cells SHALL render as editable `TextInput` elements that write changes to the store at per-cell paths.

DndTable SHALL read the initial items array from the store ONCE on mount (via `getByPath` in a `useState` lazy initializer). It SHALL NOT subscribe to the items path — subscribing causes structural sharing to create a new array reference on every cell edit, triggering DndTable re-renders that reset TextInput cursor positions.

#### Scenario: Edit button enables cell editing
- **WHEN** the Edit button is clicked
- **THEN** the buttons change to "Save" / "Cancel"
- **AND** all cell inputs become editable (borders visible, values changeable)
- **AND** the current items array is snapshotted to `/_snapshot/items`

#### Scenario: Editing a cell updates the store
- **WHEN** editing is enabled and the user types "NewName" into the Name cell of the first row
- **THEN** the store at `/items/0/name` is updated to "NewName"

#### Scenario: Save commits changes
- **WHEN** the user has edited cells and clicks "Save"
- **THEN** the snapshot at `/_snapshot/items` is cleared and editing is disabled
- **AND** cell inputs return to read-only displaying the edited values

#### Scenario: Cancel reverts all changes
- **WHEN** the user has edited cells and clicks "Cancel"
- **THEN** all cell values revert to their pre-edit state (restored from `/_snapshot/items`)
- **AND** editing is disabled
- **AND** the snapshot is cleared

#### Scenario: Cursor does not jump during editing
- **WHEN** a user types into a TextInput cell
- **THEN** the cursor position is preserved (DndTable does not re-render because it does not subscribe to the items array)

### Requirement: SortableRow supports editable cells
SortableRow SHALL accept `editing` and `path` props from DndTable. When `editing` is true, cells SHALL render as editable `TextInput` elements bound to the store via `useValue`/`useSetValue` at computed per-cell paths (`${path}/${index}/${field}`). When `editing` is false, cells SHALL render as read-only `TextInput` with variant `unstyled`.

#### Scenario: Editable cells write to store
- **WHEN** SortableRow renders with `editing: true` at index 0 with `path: "/items"` and the user changes the "name" field
- **THEN** the store at `/items/0/name` is updated

#### Scenario: Read-only cells do not write to store
- **WHEN** SortableRow renders with `editing: false`
- **THEN** cell inputs are read-only and user cannot modify values

### Requirement: Demo initializes with 150 items
The DndTable demo SHALL initialize its store with 150 generated items instead of 5 hardcoded items, to stress-test drag-and-drop performance at scale.

#### Scenario: 150 items render
- **WHEN** navigating to `/dnd-table`
- **THEN** 150 rows are rendered with drag handles

