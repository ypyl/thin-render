## Purpose
The demo's BoundField renders read-only or editable depending on the editing section state in the store.

## Requirements

### Requirement: BoundField reads editing state from store
The BoundField component in the demo SHALL call `useValue<boolean>("/editingSection")` to determine whether it renders in read-only or editable mode. It MUST NOT assume editing state from any source other than `/editingSection` in the store.

#### Scenario: BoundField renders read-only by default
- **WHEN** `/editingSection` is undefined or falsy
- **THEN** BoundField renders unstyled text (a `<span>` containing the bound value) with no input border or focus ring

#### Scenario: BoundField renders editable when flag is true
- **WHEN** `/editingSection` is `true`
- **THEN** BoundField renders a Mantine `<TextInput>` with default variant, receiving `value` and `onChange` from `useBound`

#### Scenario: BoundField re-renders on toggle
- **WHEN** `/editingSection` changes from false to true (or vice versa)
- **THEN** every BoundField subscribed to `/editingSection` re-renders; other components (Cards, StaticText, ActionButton) do NOT re-render

### Requirement: Read-only mode has no visual input chrome
In read-only mode, BoundField SHALL render the value as plain text (no TextInput wrapper, no border, no background). The text SHALL be wrapped in a container that preserves vertical alignment with editable inputs to minimize layout shift when toggling.

#### Scenario: Layout shift minimized
- **WHEN** the edit toggle switches from read-only to editable
- **THEN** no visible vertical jump or text reflow occurs for any field (the read-only span and editable input occupy the same vertical space)