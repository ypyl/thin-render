## Purpose
The $item expression resolves to absolute store path strings in action params at dispatch time.

## Requirements

### Requirement: resolveParams resolves $item to absolute state path
`resolveParams` SHALL detect values of the form `{ $item: "<field>" }` and resolve them to the absolute state path `${repeatBasePath}/${field}` at dispatch time. When `<field>` is the empty string `""`, it SHALL resolve to `repeatBasePath` itself. Resolution MUST be pure string concatenation — no store read, no subscription. When called outside a repeat scope (`repeatBasePath` is undefined), `$item` SHALL resolve to `undefined`.

#### Scenario: $item with field resolves to path
- **WHEN** `resolveParams({ id: { $item: "name" } }, getState, "/items/3")` is called
- **THEN** the resolved params contain `{ id: "/items/3/name" }`

#### Scenario: $item with empty string resolves to base path
- **WHEN** `resolveParams({ row: { $item: "" } }, getState, "/items/7")` is called
- **THEN** the resolved params contain `{ row: "/items/7" }`

#### Scenario: $item outside repeat resolves to undefined
- **WHEN** `resolveParams({ field: { $item: "x" } }, getState, "")` is called (empty or no repeat base)
- **THEN** the resolved params contain `{ field: undefined }`

#### Scenario: $item mixed with $state in same params object
- **WHEN** params contain `{ itemPath: { $item: "" }, userId: { $state: "/user/id" } }` and `getState()` returns `{ user: { id: 42 } }` with `repeatBasePath = "/items/2"`
- **THEN** resolved params contain `{ itemPath: "/items/2", userId: 42 }`

### Requirement: resolveParams resolves $index to numeric repeat index
`resolveParams` SHALL detect values of the form `{ $index: boolean }` and resolve them to the numeric repeat index. When `$index` is truthy and `repeatIndex` is a number, it SHALL return `repeatIndex`. When outside a repeat scope, it SHALL resolve to `undefined`.

#### Scenario: $index inside repeat returns index
- **WHEN** `resolveParams({ pos: { $index: true } }, getState, "/items/3", 3)` is called
- **THEN** the resolved params contain `{ pos: 3 }`

#### Scenario: $index outside repeat returns undefined
- **WHEN** `resolveParams({ pos: { $index: true } }, getState, "", undefined)` is called
- **THEN** the resolved params contain `{ pos: undefined }`

### Requirement: useEmit captures repeat scope for param resolution
`useEmit(on)` SHALL call `usePath()` and `useRepeatIndex()` to capture the current repeat scope. These values SHALL be passed to `resolveParams` during `emit(event)` calls, so `$item` and `$index` in action params resolve against the element's repeat position. The captured values SHALL be included in the `useMemo` dependency array.

#### Scenario: emit resolves $item in params to the element's repeat path
- **WHEN** an ActionButton inside `<RepeatScope path="/items/5">` emits "click" with `on.click.params = { itemPath: { $item: "" } }`
- **THEN** the handler is invoked with `{ itemPath: "/items/5" }`

#### Scenario: useMemo stays stable for a fixed-position element
- **WHEN** an element at repeat index 5 re-renders for unrelated reasons (its own useValue fires)
- **THEN** the `useEmit` `useMemo` does NOT recompute (path `/items/5` and index 5 unchanged)