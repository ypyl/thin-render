# dynamic-repeat-paths Specification

## Purpose
Repeat paths accept `$item` and `$state` expressions in addition to plain strings, enabling dynamic and nested repeat targets resolved at render time.

## Requirements
### Requirement: useResolvedPath resolves repeat.path expressions
The `useResolvedPath(expr)` hook SHALL accept a value that is a plain string, `{ $item: "<field>" }`, or `{ $state: "<path>" }`. When `expr` is a string, it SHALL return it unchanged. When `expr` is `{ $item: "<field>" }`, it SHALL resolve against the current `PathContext` without a store subscription. When `expr` is `{ $state: "<path>" }`, it SHALL read the value at `<path>` from the store via `useValue` and return it; this creates a store subscription to `<path>`. When `expr` does not match any recognized shape, it SHALL return `undefined`.

#### Scenario: Plain string passed through
- **WHEN** `useResolvedPath("/items")` is called
- **THEN** it returns `"/items"`

#### Scenario: $item resolves against repeat context
- **WHEN** `useResolvedPath({ $item: "subitems" })` is called inside `<RepeatScope path="/items/3">`
- **THEN** it returns `"/items/3/subitems"`

#### Scenario: $item empty resolves to base path
- **WHEN** `useResolvedPath({ $item: "" })` is called inside `<RepeatScope path="/items/7">`
- **THEN** it returns `"/items/7"`

#### Scenario: $item outside repeat returns undefined
- **WHEN** `useResolvedPath({ $item: "x" })` is called outside any RepeatScope
- **THEN** it returns `undefined`

#### Scenario: $state reads store path and returns its value
- **WHEN** `useResolvedPath({ $state: "/selectedList" })` is called and the store has `/selectedList = "/fruits"`
- **THEN** it returns `"/fruits"`

#### Scenario: $state subscribes to the pointer path
- **WHEN** a component calls `useResolvedPath({ $state: "/pointer" })` and the store value at `/pointer` changes from `"/listA"` to `"/listB"`
- **THEN** the component re-renders with the new resolved path `"/listB"`

#### Scenario: $state pointing to non-string logs warning
- **WHEN** `useResolvedPath({ $state: "/bad" })` is called and `/bad` holds the number `42`
- **THEN** a console warning is logged and the hook returns `""`

#### Scenario: $state pointing to undefined returns empty string
- **WHEN** `useResolvedPath({ $state: "/missing" })` is called and `/missing` does not exist in the store
- **THEN** it returns `""` without warning

#### Scenario: Unknown object shape returns undefined
- **WHEN** `useResolvedPath({ other: "value" })` is called
- **THEN** it returns `undefined`

### Requirement: RepeatConfig.path accepts expression types
The `RepeatConfig` interface's `path` field SHALL accept `string | ItemExpression | StateExpression`. Plain strings SHALL continue to work as absolute store paths (backward compatible). The expression types are declared in `src/spec.ts` alongside the `Spec` types.

#### Scenario: String path still valid
- **WHEN** a spec has `repeat: { path: "/items" }`
- **THEN** the repeat renders normally, iterating over the array at `/items`

#### Scenario: $item expression in JSON spec
- **WHEN** a spec has `repeat: { path: { $item: "subitems" } }` on an element inside a repeat at `/items/0`
- **THEN** the repeat iterates over the array at `/items/0/subitems`

#### Scenario: $state expression in JSON spec
- **WHEN** a spec has `repeat: { path: { $state: "/activeList" } }` and the store has `/activeList = "/fruits"`
- **THEN** the repeat iterates over the array at `/fruits`

### Requirement: Nested repeats compose via $item resolution
When a `RepeatChildren` renders elements that themselves have a `repeat` with a `$item` expression, the inner repeat SHALL resolve against the fully-qualified path set by the outer repeat's `RepeatScope`. This SHALL work for arbitrarily deep nesting.

#### Scenario: Two levels of nested repeat
- **WHEN** outer repeat at `/items` contains an inner element with `repeat: { path: { $item: "subitems" } }`, and `/items/0/subitems` holds `[{ val: 1 }, { val: 2 }]`
- **THEN** the inner repeat renders two children, each scoped to `/items/0/subitems/0` and `/items/0/subitems/1`

#### Scenario: Three levels of nested repeat
- **WHEN** level-1 repeat at `/a`, level-2 repeat at `{ $item: "b" }`, level-3 repeat at `{ $item: "c" }`, and `/a/0/b/0/c` holds `[1, 2]`
- **THEN** level-3 repeat renders two children scoped to `/a/0/b/0/c/0` and `/a/0/b/0/c/1`
