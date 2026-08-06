## Purpose
Repeat scopes expose the current item's numeric index through a repeat index context, read by `useRepeatIndex`.

## Requirements

### Requirement: RepeatScope exposes repeat index via context
The `RepeatScope` component SHALL provide both a `PathContext` (existing) and a `RepeatIndexContext` (new) to its children. The index SHALL be the numeric position of the item in the repeat array or the iteration position for object repeats.

#### Scenario: useRepeatIndex returns the item's index
- **WHEN** a component inside `<RepeatScope path="/items/5" index={5}>` calls `useRepeatIndex()`
- **THEN** it returns `5`

#### Scenario: useRepeatIndex returns undefined outside repeat
- **WHEN** a component not nested inside any `RepeatScope` calls `useRepeatIndex()`
- **THEN** it returns `undefined`

### Requirement: useEmit reads the repeat index via useRepeatIndex
`useEmit` SHALL call `useRepeatIndex()` to capture the element's repeat index so `{ $index: true }` action params resolve correctly at dispatch time. The hook SHALL be internal: `useRepeatIndex` is not part of the public package exports; the public surface is documented in README.md and LLM.md.

#### Scenario: useRepeatIndex drives $index param resolution
- **WHEN** an ActionButton at repeat index 3 emits "click" with `on.click.params = { pos: { $index: true } }`
- **THEN** the handler receives `{ pos: 3 }`
