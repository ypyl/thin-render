## Purpose
The SegmentedField component binds a store path to a Mantine segmented control with labeled options.

## Requirements

### Requirement: SegmentedField renders a Mantine SegmentedControl bound to a store path
A `SegmentedField` component SHALL exist as a registry component. It SHALL accept `bind` (store path) and `options` (array of `{ value, label }`) props. It SHALL use `useBound<string>` to read and write the value. It SHALL render a Mantine `<SegmentedControl>` with `data={options}`, `value={value}`, and `onChange={setValue}`.

#### Scenario: SegmentedField displays and writes
- **WHEN** a SegmentedField has `bind: "/environment"` with options for Development/Staging/Production
- **AND** the store has `"development"` at that path
- **THEN** the "Development" segment is selected
- **WHEN** user clicks "Production"
- **THEN** `/environment` is set to `"production"`
