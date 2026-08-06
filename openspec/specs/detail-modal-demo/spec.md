## Purpose
The detail modal demo simulates an async backend: clicking Details loads an item's record into a modal with a loading state.

## Requirements

### Requirement: Handler simulates async backend call
The `loadDetail` handler SHALL simulate an async backend call. It SHALL set `/loadingDetail` to `true`, SHALL await a delay of at least 400ms, SHALL write generated detail data (revenue, employees, founded, headquarters) to `/itemDetail`, and SHALL set `/loadingDetail` to `false`. The detail data SHALL be looked up from a hardcoded mapping keyed by item ID.

#### Scenario: Handler writes to independent store path
- **WHEN** `loadDetail` is dispatched with `{ id: "a1" }`
- **THEN** `/loadingDetail` becomes `true`
- **AND** after the delay, `/itemDetail` contains `{ revenue: "...", employees: ..., founded: ..., headquarters: "..." }`
- **AND** `/loadingDetail` becomes `false`
- **AND** `/items` remains unchanged

### Requirement: Close handler clears detail state
A `closeModal` handler SHALL exist that sets `/itemDetail` to `undefined`.

#### Scenario: Close clears detail
- **WHEN** `closeModal` is dispatched
- **THEN** `/itemDetail` becomes `undefined`

### Requirement: Spec builder generates the full spec
A `buildDetailModalSpec` function SHALL generate a spec with a CaseContainer root containing a table of items and a Modal. The table body SHALL use `repeat` on `/items` with `TBody`/`Tr`/`Td` components. Each row SHALL have an `ActionButton` dispatching `loadDetail` with the item's id via `{ $item: "id" }`. The Modal SHALL use a `Switch` on `/loadingDetail` to show either a loading message or the detail content. Detail content SHALL use `StaticText` components reading from `/itemDetail` subpaths via `useValue`.

#### Scenario: Spec structure
- **WHEN** `buildDetailModalSpec(10)` is called
- **THEN** the returned spec has a CaseContainer root with 10 items in the repeat
- **AND** the Modal element has `path: "/itemDetail"` and `title: "Item Details"`
- **AND** the Close button dispatches `closeModal`

### Requirement: Case component wires everything together
A `DetailModalCase` component SHALL create a store with initial items and SHALL render the `Renderer` with the spec, registry, and handlers.

#### Scenario: Initial store state
- **WHEN** the case mounts
- **THEN** the store contains `/items` with 10 items (each with id, name, industry)
- **AND** `/itemDetail` is `undefined`
- **AND** `/loadingDetail` is `false`

### Requirement: Registry includes all required components
The detail modal case registry SHALL include `CaseContainer`, `Table`, `TBody`, `Tr`, `Td`, `ActionButton`, `Modal`, `Switch`, `StaticText`, and `StackRow`.

#### Scenario: All components registered
- **WHEN** the spec references `type: "Modal"`
- **THEN** the Modal component renders
- **WHEN** the spec references `type: "Table"`
- **THEN** the Table component renders
