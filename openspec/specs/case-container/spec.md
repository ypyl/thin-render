## Purpose
The CaseContainer component wraps demo cases in a consistent Mantine Paper layout with a title and optional description, providing a uniform visual container for all demo case root elements.
## Requirements
### Requirement: CaseContainer renders a titled wrapper with description
A `CaseContainer` component SHALL exist as a registry component that wraps children in a Mantine `<Paper>` with a required `title` and optional `description`. The title SHALL render as an `<h4>` heading. When `description` is present and non-empty, it SHALL render below the title in dimmed, smaller text.

When `technicalDescription` is present and non-empty, CaseContainer SHALL render a Mantine `Spoiler` between the description and children. The Spoiler SHALL be collapsed by default (`maxHeight={0}`) with `showLabel="How it works"` and `hideLabel="Hide details"`. The `technicalDescription` text SHALL render inside the Spoiler using `white-space: pre-wrap` to preserve line breaks.

When `technicalDescription` is absent or empty, no Spoiler is rendered.

#### Scenario: CaseContainer with title and description
- **WHEN** a spec element has `type: "CaseContainer"` with `props: { title: "Form Demo", description: "Shows two-way binding with edit/save/cancel lifecycle" }`
- **THEN** the title renders as an `<h4>` heading
- **AND** the description renders below the title in dimmed, smaller text
- **AND** children render below the description inside the Paper

#### Scenario: CaseContainer with title only
- **WHEN** a spec element has `type: "CaseContainer"` with `props: { title: "Basic Static Rendering" }` and no `description` prop
- **THEN** the title renders normally
- **AND** no description text is rendered
- **AND** children still render inside the Paper

#### Scenario: CaseContainer with empty description
- **WHEN** a spec element has `type: "CaseContainer"` with `description: ""` (empty string)
- **THEN** no description text is rendered (same behavior as when prop is absent)

#### Scenario: CaseContainer with technical description
- **WHEN** a spec element has `type: "CaseContainer"` with `props: { title: "Demo", technicalDescription: "Spec\n...\nFeatures\n..." }`
- **THEN** a Mantine Spoiler renders between the description area and children
- **AND** the Spoiler is collapsed by default (toggle shows "How it works")
- **AND** clicking the toggle reveals the technical description text with preserved line breaks
- **AND** clicking again collapses it (toggle shows "Hide details")

#### Scenario: CaseContainer without technical description
- **WHEN** a spec element has `type: "CaseContainer"` with no `technicalDescription` prop
- **THEN** no Spoiler is rendered
- **AND** the component behaves identically to before this change

#### Scenario: CaseContainer with empty technical description
- **WHEN** a spec element has `type: "CaseContainer"` with `technicalDescription: ""` (empty string)
- **THEN** no Spoiler is rendered (same as when prop is absent)

### Requirement: Card component is unchanged
The existing `Card` component SHALL remain unchanged. It SHALL continue to render only an optional title without description support. It SHALL remain available for non-root usage (e.g., inner cards in the Switch demo).

#### Scenario: Card still works for inner cards
- **WHEN** the Switch demo renders
- **THEN** the "✅ Loaded" and "❌ Error" inner cards render using `type: "Card"` with only a `title` prop, exactly as before

### Requirement: All root demo case elements use CaseContainer with descriptions
Each demo case's root element SHALL use `type: "CaseContainer"` (instead of `type: "Card"`) and SHALL include a `description` prop that explains what the case demonstrates.

#### Scenario: Basic case shows description
- **WHEN** navigating to `/basic`
- **THEN** the CaseContainer renders with description text explaining static spec rendering

#### Scenario: Form case shows description
- **WHEN** navigating to `/form`
- **THEN** the CaseContainer renders with description text explaining two-way bound editable fields

#### Scenario: Actions case shows description
- **WHEN** navigating to `/actions`
- **THEN** the CaseContainer renders with description text explaining action dispatch with state feedback

#### Scenario: Large case shows description
- **WHEN** navigating to `/large`
- **THEN** the CaseContainer renders with description text explaining the 1,000-row repeat with inline-editable cells

#### Scenario: Table case shows description
- **WHEN** navigating to `/table`
- **THEN** the CaseContainer renders with description text explaining the HTML table structure via repeat

#### Scenario: Switch case shows description
- **WHEN** navigating to `/switch`
- **THEN** the CaseContainer renders with description text explaining conditional rendering with useValue

### Requirement: CaseContainer renders an optional GitHub source link
A `CaseContainer` component SHALL accept an optional `sourceFolder` prop. When `sourceFolder` is present and non-empty, `CaseContainer` SHALL render a "View source on GitHub" link that opens `https://github.com/ypyl/thin-render/tree/master/demo/src/cases/<sourceFolder>` in a new browser tab. When `sourceFolder` is absent or empty, no link SHALL be rendered.

#### Scenario: CaseContainer with sourceFolder
- **WHEN** a spec element has `type: "CaseContainer"` with `props: { title: "Basic", sourceFolder: "basic" }`
- **THEN** a link labeled "View source on GitHub" renders in the container
- **AND** the link points to `https://github.com/ypyl/thin-render/tree/master/demo/src/cases/basic`
- **AND** the link opens in a new tab when clicked

#### Scenario: CaseContainer without sourceFolder
- **WHEN** a spec element has `type: "CaseContainer"` with `props: { title: "Basic" }` and no `sourceFolder` prop
- **THEN** no GitHub source link is rendered

#### Scenario: CaseContainer with empty sourceFolder
- **WHEN** a spec element has `type: "CaseContainer"` with `sourceFolder: ""`
- **THEN** no GitHub source link is rendered (same as when the prop is absent)

### Requirement: Every demo case's root CaseContainer links to its own folder
Each demo case's root `CaseContainer` element SHALL set `sourceFolder` to the case's own folder name under `demo/src/cases/`, so every demo case page links to its own GitHub subfolder.

#### Scenario: Basic case links to its folder
- **WHEN** navigating to `/basic`
- **THEN** the root CaseContainer renders a "View source on GitHub" link pointing to `.../tree/master/demo/src/cases/basic`

#### Scenario: Dnd table case links to its folder
- **WHEN** navigating to `/dnd-table`
- **THEN** the root CaseContainer renders a "View source on GitHub" link pointing to `.../tree/master/demo/src/cases/dnd-table`
