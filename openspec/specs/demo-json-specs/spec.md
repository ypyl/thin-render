## Purpose
The demo app stores static rendering specs as JSON files or builder functions, one set per case, conforming to the Spec schema.

## Requirements

### Requirement: Demo specs are stored per case
Each demo case SHALL keep its rendering spec in its own directory under `demo/src/cases/<name>/`. Static specs SHALL be standalone `spec.json` files conforming to the `Spec` schema (root key + elements map). Cases that need runtime-generated specs (e.g. parameterized row counts, dataset-driven columns) SHALL build them programmatically via a `buildSpec.ts` (or similarly named) module in the same directory.

#### Scenario: Basic spec loads from JSON
- **WHEN** the demo app renders the Basic case at `/basic`
- **THEN** it imports `spec.json` from `demo/src/cases/basic/` and passes it to `<Renderer>`
- **AND** the rendered output matches the expected static layout

#### Scenario: Large spec is built programmatically
- **WHEN** the demo app renders the Large case at `/large`
- **THEN** it calls `buildSpec(1000)` from `demo/src/cases/large/buildSpec.ts` to produce the spec at runtime

#### Scenario: Missing or invalid JSON
- **WHEN** a JSON spec file is missing or has an invalid structure
- **THEN** the build SHALL fail with a clear error (Vite/TypeScript catches malformed JSON at import time)
