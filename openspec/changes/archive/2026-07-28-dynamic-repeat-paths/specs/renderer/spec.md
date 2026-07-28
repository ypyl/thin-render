## MODIFIED Requirements

### Requirement: RepeatChildren subscribes only to the iterable path
For an element with a `repeat` field, `RepeatChildren` SHALL resolve `repeat.path` via `useResolvedPath` to obtain the absolute store path. It SHALL then read the value at that resolved path via a single `useValue` call. It MUST NOT subscribe to any deeper path.

When the resolved path is `""` or `undefined`, `RepeatChildren` SHALL render nothing.

When the value is an array (`Array.isArray`), `RepeatChildren` SHALL iterate via `.map()` with the numeric index, exactly as before.

When the value is a plain object (non-null, non-array, `typeof === "object"`), `RepeatChildren` SHALL iterate via `Object.entries()`. Each entry SHALL produce a scope with:
- `RepeatPathContext` set to `${resolvedPath}/${objectKey}`
- `RepeatIndexContext` set to the numeric position (0, 1, 2, …)

When the value is neither an array nor a plain object, `RepeatChildren` SHALL render nothing.

Each repeated child is wrapped in a scope that sets `${resolvedPath}/${indexOrKey}` as the relevant base path for descendant binding components. Because structural sharing replaces the container on a deep leaf set, `RepeatChildren` MAY re-run its iteration when a descendant path changes — this is cheap (it only re-creates React element descriptors) and does NOT re-render the row components, which are gated by memoized `ElementRenderer` wrappers and per-cell `useValue` subscriptions.

#### Scenario: Editing one cell re-renders only that cell component
- **WHEN** a 1000-row table is rendered via `RepeatChildren`, and `/items/0/name` changes
- **THEN** the binding component subscribed to `/items/0/name` re-renders; the other 999 rows' binding components do NOT re-render

#### Scenario: Adding an item re-renders the list
- **WHEN** the array at `/items` is replaced with a longer array (new array object)
- **THEN** `RepeatChildren` re-renders to map over the new length

#### Scenario: Object iteration renders one child per key
- **WHEN** the store has `{ settings: { theme: "dark", lang: "en" } }` and a repeat element has `path: "/settings"`
- **THEN** two children are rendered: one with `RepeatPathContext` at `/settings/theme` and index 0, another at `/settings/lang` and index 1

#### Scenario: Object iteration with repeat.key extracts from value
- **WHEN** the store has `{ widgets: { a: { label: "Foo" }, b: { label: "Bar" } } }` and a repeat element has `path: "/widgets"` with `key: "label"`
- **THEN** React keys `"Foo"` and `"Bar"` are used; if `repeat.key` is undefined, React keys `"a"` and `"b"` are used

#### Scenario: Non-iterable value renders nothing
- **WHEN** the value at `repeat.path` is `"string"`, `42`, `null`, or `undefined`
- **THEN** `RepeatChildren` renders nothing (empty fragment)

#### Scenario: Nested repeat via $item expression
- **WHEN** an outer repeat at `/items` contains an element with `repeat: { path: { $item: "subitems" } }`, and `/items/2/subitems` holds `[{ val: 1 }, { val: 2 }]`
- **THEN** the inner repeat renders two children scoped to `/items/2/subitems/0` and `/items/2/subitems/1`

#### Scenario: Dynamic repeat target via $state expression
- **WHEN** an element has `repeat: { path: { $state: "/activeList" } }` and `/activeList` changes from `"/fruits"` to `"/vegetables"`
- **THEN** `RepeatChildren` re-renders and iterates over `/vegetables` instead of `/fruits`

#### Scenario: $state pointing to non-string renders nothing
- **WHEN** an element has `repeat: { path: { $state: "/badPointer" } }` and `/badPointer` holds the number `99`
- **THEN** `RepeatChildren` renders nothing (empty fragment)
