## Purpose
The Alert component renders a Mantine alert banner with a title, color, and child content.

## Requirements

### Requirement: Alert renders a Mantine Alert with title and children
An `Alert` component SHALL exist as a registry component. It SHALL read `title` and `color` from `element.props`. It SHALL render a Mantine `<Alert>` with the given title, color, and variant="light". It SHALL render its children inside the alert body.

#### Scenario: Alert with title and children
- **WHEN** an Alert has `props: { title: "Information", color: "blue" }` and a StaticText child
- **THEN** a blue info Alert renders with "Information" as the title and the child text in the body
