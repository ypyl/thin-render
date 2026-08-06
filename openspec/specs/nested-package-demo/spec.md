# nested-package-demo Specification

## Purpose
Demonstrates embedding a self-contained spec package (own spec, registry, handlers) at multiple places of a bigger spec sharing one store, with write-back and a parent-level action fired by the child.
## Requirements
### Requirement: Nested package demo exists with two embedded occurrences
A demo case SHALL exist at `/nested-package` that renders a single parent store containing two distinct child data objects at different paths (`/top/customer` and `/bottom/customer`). Both occurrences SHALL be rendered by the same child package via its `EmbeddedChild` boundary component, using `createStoreView` with the occurrence's base path. Each occurrence SHALL display its own child data.

#### Scenario: Both occurrences render their own data
- **WHEN** navigating to `/nested-package`
- **THEN** the top case panel renders the child package UI for the `/top/customer` data
- **AND** the bottom case panel renders the child package UI for the `/bottom/customer` data
- **AND** each panel shows its own customer's name and email

### Requirement: Child writes back through the view into the parent store
Editing an editable field inside a child occurrence SHALL update the parent store at that occurrence's base path, and SHALL NOT affect the other occurrence.

#### Scenario: Editing one occurrence updates only its base path
- **WHEN** the user edits the notes field of the top occurrence
- **THEN** the parent store's `/top/customer/notes` equals the edited value
- **AND** `/bottom/customer/notes` is unchanged

### Requirement: Child fires a parent-level action via the parent.* bridge
The child spec SHALL declare an action named `parent.loadDetail` with params referencing child data (the customer id). Dispatching it SHALL invoke the parent's `loadDetail` handler with the params resolved in the child's world and state accessors bound to the parent store.

#### Scenario: Parent handler receives child id payload
- **WHEN** the user clicks "Load details" in the top occurrence
- **THEN** the parent `loadDetail` handler is invoked with `{ id }` equal to the top customer's id

### Requirement: Parent handler fetches and writes a detail panel
The parent `loadDetail` handler SHALL derive a detail payload from the received id (simulating a fetch) and SHALL write it to a parent-level path (`/detail`). A parent-side detail panel SHALL subscribe to that path and render the fetched payload.

#### Scenario: Detail panel shows the fetched payload for the clicked occurrence
- **WHEN** the user clicks "Load details" in the top occurrence and then in the bottom occurrence
- **THEN** the detail panel shows the payload fetched for the top customer's id
- **AND** after the second click the detail panel shows the payload fetched for the bottom customer's id

### Requirement: Home page and routing include the new case
The home page CASES array SHALL include an entry for the nested-package demo and the App router SHALL have a `/nested-package` route.

#### Scenario: Nested package card appears on home page
- **WHEN** viewing the home page
- **THEN** a card for "Nested Package" is present with a concept-naming description

