## Purpose
Nested repeats expose a scope stack so components inside rows × columns grids can resolve values against ancestor repeat scopes, enabling static specs for tables whose columns are only known at runtime.

## ADDED Requirements

### Requirement: PathContext holds a scope stack
`PathContext` SHALL hold a stack of repeat-scope base paths, innermost first, instead of a single path string. Each `RepeatScope` SHALL push its item's base path onto the stack. The `Renderer` root SHALL reset the stack to a single root scope (`""`). `usePath()` SHALL return the innermost scope — identical observable behavior to a single-path context.

#### Scenario: Single repeat exposes one scope
- **WHEN** a repeat at `/items` renders item 0 and a descendant component calls `usePath()`
- **THEN** `usePath()` returns `/items/0`

#### Scenario: Nested repeat pushes onto the stack
- **WHEN** an outer repeat at `/items` contains an inner repeat at `{ $item: "subitems" }` rendering `/items/2/subitems/1`
- **THEN** the scope stack is `["/items/2/subitems/1", "/items/2"]`
- **AND** `usePath()` returns the innermost scope `/items/2/subitems/1`

#### Scenario: Root scope is an empty stack entry
- **WHEN** a component renders outside any `RepeatScope` and calls `usePath()`
- **THEN** `usePath()` returns `""`

### Requirement: usePath(offset) resolves ancestor scopes
`usePath(offset)` SHALL return the scope at the given depth: `0` SHALL return the innermost scope, `1` the parent scope, `2` the grandparent, and so on. When no argument is passed, `usePath()` SHALL behave exactly as `usePath(0)`. An offset beyond the stack depth — including any offset at the root scope — SHALL return `undefined`.

#### Scenario: Cell resolves its value across row and column scopes
- **WHEN** a grid renders rows via `repeat: { path: "/data" }` and columns via `repeat: { path: { $state: "/meta/columns" } }`, and a cell component inside the column scope calls `usePath()` and `usePath(1)`
- **THEN** `usePath()` returns `/meta/columns/2` and `usePath(1)` returns `/data/5`

#### Scenario: Out-of-range offset returns undefined
- **WHEN** a component calls `usePath(3)` inside a stack of depth 2, or calls `usePath(1)` at the root scope
- **THEN** the call returns `undefined`

### Requirement: Nested Renderer resets the scope stack
A nested `<Renderer>` SHALL reset the scope stack to a fresh root stack for its entire subtree, regardless of any outer `RepeatScope` that contains it. Inside the nested renderer, `usePath()` SHALL return `""` and `usePath(offset)` with any offset SHALL return `undefined`. Scopes of the outer tree SHALL remain intact for components outside the nested renderer.

#### Scenario: Nested renderer inside outer repeat sees no ancestor scopes
- **WHEN** a component inside a `RepeatScope` at `/items/0` renders a `<Renderer>` as its child, and a descendant component inside that nested `Renderer` calls `usePath()` and `usePath(1)`
- **THEN** `usePath()` returns `""` and `usePath(1)` returns `undefined`

#### Scenario: Outer scope unaffected after nested render
- **WHEN** a `RepeatChildren` at `/items` contains a component that renders a nested `<Renderer>`, and the same row also contains a component that calls `usePath(1)` directly (not inside the nested `Renderer`) with the row at `/items/3`
- **THEN** the direct `usePath(1)` call returns the outer repeat's parent scope (or `undefined` at top level), unaffected by the nested renderer

### Requirement: Expression and binding resolution uses the innermost scope
`$item` expressions, relative paths in `useBound`/`useValue`/`useSetValue`, `useResolvedPath`, and `$index` SHALL resolve against the innermost scope only — identical to pre-stack behavior. The stack SHALL NOT change how paths compose; it only makes ancestor scopes readable.

#### Scenario: Relative bind composes against the innermost scope
- **WHEN** a component inside the scope `/items/2/subitems/1` calls `useBound("name")`
- **THEN** it binds to `/items/2/subitems/1/name`, not to any ancestor-scope path

#### Scenario: $item expression resolves against the innermost scope
- **WHEN** an element inside the scope `/items/2/subitems/1` has `repeat: { path: { $item: "children" } }`
- **THEN** the repeat iterates over `/items/2/subitems/1/children`

### Requirement: Generic renderer exposes the scope stack
`renderGeneric` SHALL pass the full scope stack to every registry builder via `ctx.scopes`, ordered innermost first. `ctx.basePath` SHALL remain the innermost scope (`""` at root), preserving existing builder behavior.

#### Scenario: Generic builder reads ancestor scope
- **WHEN** a generic registry builder renders a cell inside a rows × columns nested repeat and reads `ctx.scopes`
- **THEN** `ctx.scopes[0]` is the column scope and `ctx.scopes[1]` is the row scope, allowing the builder to resolve the cell value path

#### Scenario: basePath unchanged for existing builders
- **WHEN** a generic registry builder renders at the root scope, then inside a repeat at `/items/0`
- **THEN** `ctx.basePath` is `""` at root and `/items/0` inside the repeat, exactly as before the stack change
