## Purpose
The SelectField component binds a store path to a Mantine select dropdown, always editable.

## Requirements

### Requirement: SelectField renders a dropdown bound to a store path
A `SelectField` component SHALL exist as a registry component. It SHALL accept `bind` (store path) and `options` (array of `{ value, label }`) props. It SHALL read the current value from the bound path via `useBound` and SHALL write the selected value on change. It SHALL be always editable — it SHALL NOT check `/editingSection`. It SHALL render a Mantine `<Select>` with the options as `data`.

#### Scenario: SelectField displays current value
- **WHEN** a SelectField has `bind: "/settings/color"` and `options: [{ value: "blue", label: "Blue" }, { value: "red", label: "Red" }]`
- **AND** the store has `/settings/color` set to `"blue"`
- **THEN** the Select renders with "Blue" as the selected value

#### Scenario: SelectField writes on change
- **WHEN** user selects "Red" from the dropdown
- **THEN** `/settings/color` is set to `"red"`
