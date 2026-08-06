## Purpose
The StackRow component wraps repeated children in a Mantine Stack with a configurable gap.

## Requirements

### Requirement: StackRow component adds Mantine Stack gap between children
A `StackRow` component SHALL exist as a separate registry component that wraps children in a Mantine `<Stack>` with a configurable `gap` prop. It SHALL read `gap` from `element.props.gap` and default to `"md"` when omitted. This component is the repeat-container counterpart to the transparent `Row` component — `Row` renders a Fragment, `StackRow` renders a Stack with gap.

#### Scenario: StackRow renders with default gap
- **WHEN** a spec element has `type: "StackRow"` with no `props.gap`
- **THEN** the StackRow component renders `<Stack gap="md">{children}</Stack>`
- **AND** children receive vertical spacing per Mantine's `md` theme token (16px)

#### Scenario: StackRow renders with explicit gap
- **WHEN** a spec element has `type: "StackRow"` with `props: { gap: "lg" }`
- **THEN** the StackRow component renders `<Stack gap="lg">{children}</Stack>`

#### Scenario: StackRow with numeric gap value
- **WHEN** a spec element has `type: "StackRow"` with `props: { gap: 24 }`
- **THEN** the StackRow component renders `<Stack gap={24}>{children}</Stack>`
- **AND** children receive 24px vertical spacing

### Requirement: Row component remains a transparent Fragment wrapper
The `Row` component SHALL continue to render children in a React Fragment (`<></>`) with no wrapping DOM element, no conditional logic, and no Mantine imports.

#### Scenario: Row renders as Fragment
- **WHEN** a spec element has `type: "Row"`
- **THEN** the Row component renders `<>{children}</>` with no wrapping DOM element

### Requirement: Large Case spec uses StackRow for repeat spacing
The Large Case demo spec SHALL use `type: "StackRow"` with `gap: "md"` for the `list` repeat container so repeated `FieldsetRow` items are visually separated.

#### Scenario: Large Case items have visual spacing
- **WHEN** the Large Case demo renders
- **THEN** each repeated `FieldsetRow` item has `md` vertical spacing from adjacent items
- **AND** the `EditToggle` button remains at the top of the card with no extra spacing below it
