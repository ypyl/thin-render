## Purpose
The feature-flags demo showcases five Mantine-derived form components in a single-page dashboard.

## Requirements

### Requirement: Feature flags dashboard demo exists
A demo case SHALL exist at `/feature-flags` that showcases five new Mantine-derived components in a single-page dashboard.

#### Scenario: Dashboard renders with all sections
- **WHEN** navigating to `/feature-flags`
- **THEN** a CaseContainer renders with title "Feature Flags Dashboard"
- **AND** an info Alert is visible with a description
- **AND** a SegmentedField for environment selection is visible
- **AND** at least 3 feature flag cards are visible, each with a ToggleField and a Badge

#### Scenario: ToggleField controls flag state
- **WHEN** user toggles "Dark Mode" off
- **THEN** `/flags/darkMode` is set to `false`

#### Scenario: SliderField controls rollout percentage
- **WHEN** user drags the "AI Suggestions" rollout slider to 75
- **THEN** `/flags/aiSuggestions/rollout` is set to `75`

#### Scenario: SegmentedField changes environment
- **WHEN** user clicks "Production" in the environment selector
- **THEN** `/environment` is set to `"production"`

### Requirement: Home page lists the feature flags case
The home page CASES array SHALL include an entry for the feature flags demo.

#### Scenario: Feature flags card on home page
- **WHEN** viewing the home page
- **THEN** a card for "Feature Flags" is present with a concept-naming description
