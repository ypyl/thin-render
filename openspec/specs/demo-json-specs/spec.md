## Purpose
The demo app stores static rendering specs as standalone JSON files conforming to the Spec schema.

## Requirements

### Requirement: Demo specs are stored as JSON files
The demo application SHALL store its static rendering specs as standalone JSON files in `demo/src/specs/`, each conforming to the `Spec` schema (root key + elements map).

#### Scenario: Basic spec loads from JSON
- **WHEN** the demo app renders the "Basic" tab
- **THEN** it imports `basic.json` and passes it to `<Renderer spec={basicSpec} />`
- **AND** the rendered output matches the previous inline-spec behavior

#### Scenario: Form spec loads from JSON
- **WHEN** the demo app renders the "Form" tab
- **THEN** it imports `form.json` and passes it to `<Renderer spec={formSpec} />`
- **AND** bound fields and edit toggle work identically to the inline-spec version

#### Scenario: Actions spec loads from JSON
- **WHEN** the demo app renders the "Actions" tab
- **THEN** it imports `actions.json` and passes it to `<Renderer spec={actionsSpec} />`
- **AND** action dispatch and timestamp display work identically to the inline-spec version

#### Scenario: Missing or invalid JSON
- **WHEN** a JSON spec file is missing or has an invalid structure
- **THEN** the build SHALL fail with a clear error (Vite/TypeScript catches malformed JSON at import time)
