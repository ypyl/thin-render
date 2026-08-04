## Purpose

Lets components subscribe to values derived from the store (e.g. `/editKey === "Main"`) and re-render only when the derived value actually changes, not on every write to an underlying path.

## ADDED Requirements

### Requirement: useSelector returns a derived value from the store
`useSelector<T>(selector)` SHALL subscribe to the store and return the result of calling `selector` on the current store snapshot.

#### Scenario: Reads a derived value
- **WHEN** a component calls `useSelector((s) => getByPath(s, "/editKey") === "Main")` and the store has `editKey: "Main"`
- **THEN** the hook returns `true`

#### Scenario: Selector receives the full live snapshot
- **WHEN** the store state is `{ a: 1, b: 2 }` and a component calls `useSelector((s) => getByPath(s, "/a") + getByPath(s, "/b"))`
- **THEN** the hook returns `3`

### Requirement: useSelector re-renders only when the selected value changes
The hook SHALL cause the component to re-render only when the selector's result changes by strict equality (Object.is), regardless of how many store paths changed underneath. Writes that do not change the selected value MUST NOT re-render the component.

#### Scenario: Re-renders when the derived boolean flips
- **WHEN** a component uses `useSelector((s) => getByPath(s, "/editKey") === "Main")` and `/editKey` changes from `"A"` to `"Main"`
- **THEN** the component re-renders with the new value `true`

#### Scenario: Does not re-render when the derived value is unchanged
- **WHEN** a component uses `useSelector((s) => getByPath(s, "/editKey") === "Main")` and `/editKey` changes from `"A"` to `"B"`
- **THEN** the component does NOT re-render because the selected value stays `false`

#### Scenario: Re-renders on unrelated paths when the derived value changes
- **WHEN** the selector result depends on multiple paths and one of them changes in a way that alters the result
- **THEN** the component re-renders with the new derived value

### Requirement: useSelector works outside and inside repeat scopes
The hook SHALL be usable in any component rendered within a StoreProvider, including inside repeat scopes. It reads from the store root and is independent of the repeat scope context.

#### Scenario: Used inside a repeat scope
- **WHEN** a component inside a repeat scope (non-empty `PathContext`) calls `useSelector((s) => getByPath(s, "/editKey") === "Main")`
- **THEN** it returns the derived value for the store root, unaffected by the repeat scope

### Requirement: Selector must return a stable snapshot
The selector SHALL return a value whose reference identity is stable while the derived value is unchanged (primitives are inherently stable; object/array results require memoization). A selector returning a fresh object or array on every call is a misuse and may cause repeated re-renders.

#### Scenario: Primitive selector results are stable
- **WHEN** the selector returns a primitive (boolean, string, number) and the underlying paths change without altering the result
- **THEN** the component does not re-render

#### Scenario: Non-primitive results require stable references
- **WHEN** the selector returns an object or array literal and the underlying paths change without altering the derived content
- **THEN** the consumer is responsible for memoizing the result so its reference stays stable; without memoization re-render behavior is not guaranteed
