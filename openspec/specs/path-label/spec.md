# path-label Specification

## Purpose
The PathLabel component renders the last segment of the current repeat path, showing the key name of the item being repeated.
## Requirements
### Requirement: PathLabel renders the current repeat key
A `PathLabel` component SHALL exist as a registry component. It SHALL call `usePath()` and extract the last path segment. It SHALL render that segment as plain text. Outside a repeat context (empty path), it SHALL render nothing.

#### Scenario: PathLabel in object repeat
- **WHEN** PathLabel renders inside a repeat on `/translations` where the current item is `greeting`
- **THEN** `usePath()` returns `/translations/greeting`
- **AND** PathLabel renders `"greeting"`

#### Scenario: PathLabel in array repeat
- **WHEN** PathLabel renders inside a repeat on `/items` where the current item is index 0
- **THEN** `usePath()` returns `/items/0`
- **AND** PathLabel renders `"0"`

#### Scenario: PathLabel outside repeat
- **WHEN** PathLabel renders outside any repeat context
- **THEN** `usePath()` returns `""`
- **AND** PathLabel renders nothing (empty string)

