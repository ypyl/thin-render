## ADDED Requirements

### Requirement: RepeatScope exposes repeat index via context
The `RepeatScope` component SHALL provide both a `PathContext` (existing) and a `RepeatIndexContext` (new) to its children. The index SHALL be the numeric position of the item in the repeat array.

#### Scenario: useRepeatIndex returns the item's index
- **WHEN** a component inside `<RepeatScope path="/items/5" index={5}>` calls `useRepeatIndex()`
- **THEN** it returns `5`

#### Scenario: useRepeatIndex returns undefined outside repeat
- **WHEN** a component not nested inside any `RepeatScope` calls `useRepeatIndex()`
- **THEN** it returns `undefined`

### Requirement: useItemPath resolves $item expressions to absolute paths
The `useItemPath(expr)` hook SHALL accept a value that is either a plain string or `{ $item: "<field>" }`. When `expr` is a string, it SHALL return it unchanged. When `expr` is `{ $item: "<field>" }` and inside a repeat scope, it SHALL return `${repeatPath}/${field}`; when `<field>` is `""`, it SHALL return `repeatPath` itself. When `expr` is `{ $item: "<field>" }` but outside a repeat scope, it SHALL return `undefined`.

#### Scenario: Plain string passed through
- **WHEN** `useItemPath("name")` is called inside a repeat scope with base `/items/0`
- **THEN** it returns `"name"` unchanged

#### Scenario: $item resolves to full path
- **WHEN** `useItemPath({ $item: "name" })` is called inside `<RepeatScope path="/items/3">`
- **THEN** it returns `"/items/3/name"`

#### Scenario: $item empty resolves to base path
- **WHEN** `useItemPath({ $item: "" })` is called inside `<RepeatScope path="/items/7">`
- **THEN** it returns `"/items/7"`

#### Scenario: $item outside repeat returns undefined
- **WHEN** `useItemPath({ $item: "x" })` is called outside any RepeatScope
- **THEN** it returns `undefined`

### Requirement: usePath and useRepeatIndex are exported
`usePath` and `useRepeatIndex` SHALL be exported from `src/index.ts` as public API. `usePath` is already exported; `useRepeatIndex` is new.

#### Scenario: useRepeatIndex importable from thin-render
- **WHEN** a consumer writes `import { useRepeatIndex } from "thin-render"`
- **THEN** it receives the hook function