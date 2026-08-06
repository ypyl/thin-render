# translations-demo Specification

## Purpose
The translations demo edits a set of key-value translation strings, one per row, generated from a plain object repeat.
## Requirements
### Requirement: Translations editor demo uses object repeat
A demo case SHALL exist at `/translations` that demonstrates `repeat` on a plain object. The store SHALL hold a `translations` object with string keys and string values. The spec SHALL use `repeat: { path: "/translations" }` to render one row per key. Each row SHALL contain a `PathLabel` for the key and a `BoundField` with `bind: ""` for the editable value.

#### Scenario: Table renders one row per translation key
- **WHEN** navigating to `/translations`
- **THEN** a CaseContainer renders with title "Translations Editor"
- **AND** for each key in the translations object, a row renders showing the key name and an editable text input with the current value

#### Scenario: Editing a value updates the store
- **WHEN** user changes the value for the key "greeting" from "Hello" to "Hi there"
- **THEN** the store at `/translations/greeting` is updated to `"Hi there"`

### Requirement: Home page includes the translations case
The home page CASES array SHALL include an entry for the translations demo.

#### Scenario: Home page card
- **WHEN** viewing the home page
- **THEN** a card for "Translations" is present with a description naming object repeat

