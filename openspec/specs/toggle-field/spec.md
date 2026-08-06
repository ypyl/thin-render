## Purpose
The ToggleField component binds a boolean store path to a Mantine switch.

## Requirements

### Requirement: ToggleField renders a Mantine Switch bound to a store path
A `ToggleField` component SHALL exist as a registry component. It SHALL accept a `bind` prop (store path) and SHALL use `useBound<boolean>` to read and write the boolean value. It SHALL render a Mantine `<Switch>` with `checked={value}` and `onChange` calling `setValue`.

#### Scenario: ToggleField reads current value
- **WHEN** a ToggleField has `bind: "/flags/darkMode"` and the store has `true` at that path
- **THEN** the Switch renders in the checked/on position

#### Scenario: ToggleField writes on toggle
- **WHEN** user clicks the Switch from on to off
- **THEN** `/flags/darkMode` is set to `false`
