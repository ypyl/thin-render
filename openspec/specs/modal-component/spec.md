## Purpose
The Modal component shows a Mantine overlay controlled by a store path, without outside-click or Escape dismissal.

## Requirements

### Requirement: Modal component reads visibility from a store path
A `Modal` component SHALL exist as a registry component. It SHALL accept a `path` prop and use `useValue(path)` to determine visibility. When the value at `path` is truthy, it SHALL render a Mantine `<Modal>` with `opened={true}`, an optional `title` prop, and its children inside the modal body. When falsy, nothing SHALL render. The modal SHALL NOT close on outside click or Escape — only the store path change controls visibility.

#### Scenario: Modal opens when path value becomes truthy
- **WHEN** a Modal has `path: "/itemDetail"` and `/itemDetail` is `undefined`
- **THEN** the Modal does not render
- **WHEN** a handler sets `/itemDetail` to `{ name: "Alpha" }`
- **THEN** the Modal renders with `opened={true}` and children visible inside

#### Scenario: Modal closes when path value becomes falsy
- **WHEN** a Modal is open and a handler sets `/itemDetail` to `undefined`
- **THEN** the Modal stops rendering

#### Scenario: Modal with title
- **WHEN** a Modal has `props: { path: "/itemDetail", title: "Item Details" }`
- **THEN** the rendered Mantine `<Modal>` displays "Item Details" as its title

### Requirement: Detail modal demo case exists
A demo case SHALL exist at `/detail-modal` that demonstrates interdependent state via a table of items and a detail modal.

#### Scenario: Table renders with items
- **WHEN** navigating to `/detail-modal`
- **THEN** a CaseContainer renders with title "Detail Modal Demo"
- **AND** a table renders with ~10 rows, each showing id, name, and industry
- **AND** each row has a "Details" button

#### Scenario: Clicking Details opens modal with loading then detail
- **WHEN** user clicks "Details" on a row
- **THEN** the handler dispatches `loadDetail` with the item's id
- **AND** `/loadingDetail` is set to `true`
- **AND** the modal opens showing a loading message
- **AND** after ~600ms the handler writes generated detail data to `/itemDetail`
- **AND** `/loadingDetail` is set to `false`
- **AND** the modal content switches to show the detail fields (revenue, employees, founded, headquarters)

#### Scenario: Closing the modal
- **WHEN** user clicks "Close" inside the modal
- **THEN** `/itemDetail` is set to `undefined`
- **AND** the modal closes

#### Scenario: Clicking a different row
- **WHEN** the modal is open for one item and user clicks "Details" on a different row
- **THEN** the handler overwrites `/itemDetail` with the new item's detail data
- **AND** the modal content updates to show the new details

### Requirement: Home page lists the detail modal case
The home page CASES array SHALL include an entry for the detail modal demo with appropriate emoji, title, and description.

#### Scenario: Detail modal card on home page
- **WHEN** viewing the home page
- **THEN** a card for "Detail Modal" is present
- **AND** its description names the thin-render concepts demonstrated (interdependent state, async handlers, Modal component)
