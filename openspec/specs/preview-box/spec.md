## Purpose
The PreviewBox component renders styled preview content (title, color, font size) from the store.

## Requirements

### Requirement: PreviewBox renders styled content from /preview paths
A `PreviewBox` component SHALL render a Mantine `<Paper>` displaying preview content. It SHALL read title from `/preview/title`, color from `/preview/color`, and font size from `/preview/size`. It SHALL apply the color and size as inline CSS styles.

#### Scenario: Preview shows styled text
- **WHEN** `/preview/title` is `"Hello World"`, `/preview/color` is `"green"`, `/preview/size` is `"32px"`
- **THEN** the Paper displays "Hello World" in green at 32px font size

#### Scenario: Preview handles missing data
- **WHEN** `/preview` paths are undefined
- **THEN** the Paper renders without error, displaying empty content
