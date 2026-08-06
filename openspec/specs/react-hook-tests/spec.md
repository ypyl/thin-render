## Purpose
Every hook exported from the library has at least one test verifying its core behavior.

## Requirements

### Requirement: All exported hooks have tests
Every hook exported from `src/hooks.ts` SHALL have at least one test verifying its core behavior.

#### Scenario: useStore returns the store
- **WHEN** `useStore()` is called inside a StoreProvider
- **THEN** it returns the store instance passed to the provider

#### Scenario: useStore throws outside provider
- **WHEN** `useStore()` is called without a StoreProvider ancestor
- **THEN** it throws an error containing "useStore must be used within a StoreProvider"

#### Scenario: useValue reads and reacts to store changes
- **WHEN** `useValue("/x")` is rendered and `store.set("/x", 42)` is called via `act`
- **THEN** the hook returns 42 on the next render

#### Scenario: useBound provides two-way binding
- **WHEN** `useBound("/x")` is rendered
- **THEN** it returns a tuple `[value, setter]` where calling `setter(newValue)` updates the store at `/x`

#### Scenario: useEmit dispatches actions
- **WHEN** `useEmit(on)` is called with an `on` map and the returned `emit("click")` is invoked
- **THEN** the corresponding handler is called with resolved params and store API

#### Scenario: useItemPath resolves $item expressions
- **WHEN** `useItemPath({ $item: "name" })` is called inside a repeat scope with base path `/items/3`
- **THEN** it returns `/items/3/name`

### Requirement: Context providers are tested
StoreProvider and ActionProvider SHALL have tests verifying they make their values available to descendants.

#### Scenario: StoreProvider provides store to children
- **WHEN** a component reads StoreContext inside a StoreProvider
- **THEN** it receives the store prop passed to the provider

#### Scenario: ActionProvider merges builtins and user handlers
- **WHEN** ActionProvider is given `builtins` and `handlers` props
- **THEN** the context value's `handlers` map contains both, with user handlers taking precedence over builtins on name clash

### Requirement: Coverage thresholds are raised
After adding hook and context tests, coverage thresholds SHALL be raised to reflect the new baseline.

#### Scenario: Thresholds updated
- **WHEN** `vitest.config.ts` is read
- **THEN** `coverage.thresholds` specifies lines: 55, functions: 50, branches: 50
