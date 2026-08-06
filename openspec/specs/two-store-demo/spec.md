## Purpose
The two-store demo renders settings and preview side by side with independent stores, updating the preview only on Apply.

## Requirements

### Requirement: Two store demo exists with side-by-side renderers
A demo case SHALL exist at `/two-store` that renders two `<Renderer>` instances side-by-side in a `SimpleGrid cols={2}` layout, each with its own store. The left panel SHALL show settings fields (title `BoundField`, color `SelectField`, size `SelectField`) and an Apply button. The right panel SHALL show a `PreviewBox`. The left panel SHALL be always editable (store initialized with `editingSection: true`).

#### Scenario: Settings panel renders with editable fields
- **WHEN** navigating to `/two-store`
- **THEN** the left CaseContainer renders with title "Settings"
- **AND** a BoundField for title is present and editable
- **AND** SelectField dropdowns for color and size are present
- **AND** an "Apply Changes" button is present

#### Scenario: Preview panel renders initially matching settings
- **WHEN** navigating to `/two-store`
- **THEN** the right CaseContainer renders with title "Live Preview"
- **AND** the PreviewBox displays the initial settings values

#### Scenario: Changing settings does not affect preview until Apply
- **WHEN** user changes the title to "World" and color to "Red"
- **THEN** the preview still shows the previous values (no update)
- **WHEN** user clicks "Apply Changes"
- **THEN** the preview updates to show "World" in red

#### Scenario: Apply copies all settings to preview
- **WHEN** user changes title, color, and size, then clicks Apply
- **THEN** the preview reflects all three changes simultaneously

### Requirement: Cross-store handler bridges both stores
The `applySettings` handler SHALL read `/settings` from its own store (store A) and SHALL write the value to `/preview` in store B via closure. Store A's state SHALL NOT be modified by the apply action.

#### Scenario: Handler copies state across stores
- **WHEN** `applySettings` is dispatched
- **THEN** `getState()` from store A reads `/settings`
- **AND** `storeB.set("/preview", ...)` receives the settings value
- **AND** store A's state is unchanged

### Requirement: Home page and routing include the new case
The home page CASES array SHALL include an entry for the two-store demo and the App router SHALL have a `/two-store` route.

#### Scenario: Two-store card appears on home page
- **WHEN** viewing the home page
- **THEN** a card for "Two Store" is present with a concept-naming description
