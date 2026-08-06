## Purpose
The SliderField component binds a numeric store path to a Mantine slider with min, max, and an optional label.

## Requirements

### Requirement: SliderField renders a Mantine Slider bound to a store path
A `SliderField` component SHALL exist as a registry component. It SHALL accept `bind` (store path), `min`, `max`, and optional `label` props. It SHALL use `useBound<number>` to read and write the numeric value. It SHALL render a Mantine `<Slider>` with `value={value}`, `min={min}`, `max={max}`, and `onChange={setValue}`. When `label` is present and non-empty, it SHALL render a label showing the formatted value.

#### Scenario: SliderField reads and displays value
- **WHEN** a SliderField has `bind: "/flags/aiSuggestions/rollout"`, `min: 0`, `max: 100`, `label: "{value}%"`
- **AND** the store has `60` at that path
- **THEN** the Slider renders with the thumb at 60% and a label reading "60%"

#### Scenario: SliderField writes on drag
- **WHEN** user drags the slider to 80
- **THEN** the bound path is set to `80`
