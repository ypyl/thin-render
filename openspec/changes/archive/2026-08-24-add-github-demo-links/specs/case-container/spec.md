## ADDED Requirements

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
