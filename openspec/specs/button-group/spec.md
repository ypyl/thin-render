## Purpose
The ButtonGroup component groups child buttons into a connected Mantine button group.

## Requirements

### Requirement: ButtonGroup wraps children in Mantine Button.Group
A `ButtonGroup` component SHALL exist as a registry component that renders children inside Mantine's `<Button.Group>`. It SHALL accept the standard `ComponentProps` interface (`element`, `children`, `emit`) and SHALL ignore `element.props`. The component SHALL be stateless and presentational.

#### Scenario: ButtonGroup renders connected buttons
- **WHEN** a spec element has `type: "ButtonGroup"` with three `ActionButton` children
- **THEN** the buttons render as a visually connected segmented control with no gap between adjacent buttons
- **AND** the first button has rounded left border-radius
- **AND** the last button has rounded right border-radius

#### Scenario: ButtonGroup with single child
- **WHEN** a spec element has `type: "ButtonGroup"` with one `ActionButton` child
- **THEN** the single button renders normally inside the group wrapper with no visual breakage

### Requirement: Switch demo uses ButtonGroup for status buttons
The Switch demo spec SHALL use `type: "ButtonGroup"` for the `buttons` element (replacing `type: "Row"`) so the three status toggle buttons render as a connected segmented control.

#### Scenario: Switch demo buttons are visually grouped
- **WHEN** the Switch demo renders
- **THEN** the "Loading", "Loaded", and "Error" buttons appear as a connected button group
- **AND** clicking any button still dispatches the correct `setStatus` action
