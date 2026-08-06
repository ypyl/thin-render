## Purpose
The Renderer renders a spec's root element through the matching registry component.

## Requirements

### Requirement: Renderer renders a simple spec
The Renderer SHALL accept a spec, registry, and store, and render the root element through its corresponding registry component.

#### Scenario: Simple spec renders
- **WHEN** a spec with root "card" of type "Card" is rendered with a registry containing a Card component
- **THEN** the Card component receives the element definition and rendered children

### Requirement: Renderer handles null and invalid specs
The Renderer SHALL return null for null specs and specs with missing root elements.

#### Scenario: Null spec returns null
- **WHEN** `spec` prop is null
- **THEN** the Renderer returns null without error

#### Scenario: Missing root element returns null
- **WHEN** `spec.root` references an element key not present in `spec.elements`
- **THEN** the Renderer returns null

### Requirement: Renderer handles missing elements gracefully
The ElementRenderer SHALL warn and return null when an element key is not found in the spec, unless `loading` is true.

#### Scenario: Missing element with loading=false warns
- **WHEN** a spec references a child element key that doesn't exist and `loading` is false
- **THEN** `console.warn` is called and null is returned for that child

#### Scenario: Missing element with loading=true is silent
- **WHEN** a spec references a child element key that doesn't exist and `loading` is true
- **THEN** no warning is emitted and null is returned for that child

### Requirement: Renderer handles unknown component types
The ElementRenderer SHALL warn and return null when an element's type has no matching registry component.

#### Scenario: Unknown type warns
- **WHEN** an element has `type: "NoSuchComponent"` and no matching registry entry exists
- **THEN** `console.warn` is called and null is returned

### Requirement: Repeat renders children per array item
The RepeatChildren component SHALL render child elements once for each item in the state array at `repeat.path`.

#### Scenario: Repeat renders N items
- **WHEN** the store has `["a", "b", "c"]` at `/items` and a repeat config points to that path
- **THEN** child elements are rendered three times

#### Scenario: Repeat uses key field
- **WHEN** a repeat config specifies `key: "id"` and items have id fields
- **THEN** child elements use the id value as their React key

#### Scenario: Repeat handles empty array
- **WHEN** the store has an empty array at the repeat path
- **THEN** no child elements are rendered and no error occurs

### Requirement: All uncovered branches are covered
The four remaining uncovered branches in store.ts, hooks.ts, and contexts.tsx SHALL have tests.

#### Scenario: immutableSetByPath sets array index at terminal
- **WHEN** `immutableSetByPath` is called with a path ending in a numeric index on an array parent
- **THEN** the value is set at that array index

#### Scenario: BUILTIN_SET_STATE handles falsy path
- **WHEN** `BUILTIN_SET_STATE` is called with `path: undefined` or `path: ""`
- **THEN** `setState` is not called

#### Scenario: resolveParams handles $index false
- **WHEN** `resolveParams` processes `{ $index: false }`
- **THEN** it returns `undefined` regardless of repeatIndex

#### Scenario: useEmit handles setState built-in action
- **WHEN** `useEmit` dispatches an action named "setState"
- **THEN** no console warning is emitted even though "setState" is not in user handlers
