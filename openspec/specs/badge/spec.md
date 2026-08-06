## Purpose
The Badge component renders a Mantine badge with configurable text and color.

## Requirements

### Requirement: Badge renders a Mantine Badge with text and color from props
A `Badge` component SHALL exist as a registry component. It SHALL read `text` and `color` from `element.props`. It SHALL render a Mantine `<Badge>` with `color={color}` containing the text. It SHALL NOT subscribe to the store.

#### Scenario: Badge displays text
- **WHEN** a Badge has `props: { text: "Active", color: "green" }`
- **THEN** a green Badge renders displaying "Active"

#### Scenario: Badge with no color defaults
- **WHEN** a Badge has `props: { text: "Inactive" }` and no color
- **THEN** the Badge renders with Mantine's default color
