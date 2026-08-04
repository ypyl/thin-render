## ADDED Requirements

### Requirement: useSelector subscribes within the path's window
`useSelector<T>(path, derive)` SHALL subscribe only to writes that overlap `path` — the path itself or any of its descendants. Writes to unrelated paths MUST NOT notify the component. The derive function SHALL receive the value at `path` (the whole state when `path` is `""`), so reads cannot escape the subscription window.

#### Scenario: A write inside the window notifies the component
- **WHEN** a component uses `useSelector("/user", (u) => u.name === "Main")` and `/user/name` changes
- **THEN** the component is notified and re-evaluates the derive

#### Scenario: A write outside the window does not notify
- **WHEN** a component uses `useSelector("/user", (u) => u.name === "Main")` and an unrelated path such as `/items` changes
- **THEN** the component is NOT notified and does NOT re-evaluate the derive

#### Scenario: The root window subscribes to the whole store
- **WHEN** a component uses `useSelector("", (s) => ...)` and any path changes
- **THEN** the component is notified and re-evaluates the derive

## MODIFIED Requirements

### Requirement: useSelector returns a derived value from the store
`useSelector<T>(path, derive)` SHALL subscribe to the store at `path` and return the result of calling `derive` on the current value at `path` (property access on the resolved subtree; the whole state when `path` is `""`).

#### Scenario: Reads a derived value
- **WHEN** a component calls `useSelector("/editKey", (v) => v === "Main")` and the store has `editKey: "Main"`
- **THEN** the hook returns `true`

#### Scenario: Selector receives the full live snapshot
- **WHEN** the store state is `{ a: 1, b: 2 }` and a component calls `useSelector("", (s) => s.a + s.b)`
- **THEN** the hook returns `3`

#### Scenario: Derive receives the value at the path
- **WHEN** the store state is `{ user: { name: "A", role: "admin" } }` and a component calls `useSelector("/user", (u) => u.name)`
- **THEN** the hook returns `"A"` without the caller addressing nested paths via strings

### Requirement: useSelector re-renders only when the selected value changes
The hook SHALL cause the component to re-render only when the derive's result changes by strict equality (Object.is), regardless of how many writes occurred within the subscribed window. Writes that do not change the derived value MUST NOT re-render the component.

#### Scenario: Re-renders when the derived boolean flips
- **WHEN** a component uses `useSelector("/editKey", (v) => v === "Main")` and `/editKey` changes from `"A"` to `"Main"`
- **THEN** the component re-renders with the new value `true`

#### Scenario: Does not re-render when the derived value is unchanged
- **WHEN** a component uses `useSelector("/editKey", (v) => v === "Main")` and `/editKey` changes from `"A"` to `"B"`
- **THEN** the component does NOT re-render because the selected value stays `false`

#### Scenario: Re-renders on unrelated paths when the derived value changes
- **WHEN** a component uses `useSelector("", (s) => s.a + s.b)` (root window) and one of the unrelated paths changes in a way that alters the result
- **THEN** the component re-renders with the new derived value

#### Scenario: Re-renders when a same-subtree multi-field derive changes
- **WHEN** a component uses `useSelector("/user", (u) => u.name === "Main" && u.role === "admin")` and one of `/user/name` or `/user/role` changes in a way that alters the result
- **THEN** the component re-renders with the new derived value

### Requirement: useSelector works outside and inside repeat scopes
The hook SHALL be usable in any component rendered within a StoreProvider, including inside repeat scopes. It reads from the store root and is independent of the repeat scope context.

#### Scenario: Used inside a repeat scope
- **WHEN** a component inside a repeat scope (non-empty `PathContext`) calls `useSelector("/editKey", (v) => v === "Main")`
- **THEN** it returns the derived value for the store root, unaffected by the repeat scope

### Requirement: Selector must return a stable snapshot
The derive function SHALL return a value whose reference identity is stable while the derived value is unchanged (primitives are inherently stable; object/array results require memoization). A derive returning a fresh object or array on every call is a misuse and may cause repeated re-renders.

#### Scenario: Primitive selector results are stable
- **WHEN** the derive returns a primitive (boolean, string, number) and writes within the window occur without altering the result
- **THEN** the component does not re-render

#### Scenario: Non-primitive results require stable references
- **WHEN** the derive returns an object or array literal and writes within the window occur without altering the derived content
- **THEN** the consumer is responsible for memoizing the result so its reference stays stable; without memoization re-render behavior is not guaranteed
