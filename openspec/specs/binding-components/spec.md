## Purpose
Registry components receive rendered children and named slots through the ComponentProps contract, read their data paths from element props, and dispatch actions via the emit contract.

## Requirements

### Requirement: Registry maps type names to components
The library SHALL treat a registry as a plain `Record<string, React.ComponentType<ComponentProps>>` mapping spec `type` strings to components. `ComponentProps` SHALL be `{ element: UIElement; children?: ReactNode; slots?: Record<string, ReactNode>; emit: (event: string) => void }`.

For an element with array-form `children`, the renderer SHALL pass the rendered child nodes via `children` and SHALL NOT set `slots`. For an element with record-form `children`, the renderer SHALL pass each slot's rendered child nodes via `slots[slotName]` and SHALL NOT set `children`. A component therefore receives exactly one of `children` or `slots` (never both, never neither when the element declares children). A slot holding multiple elements SHALL be passed as a single `ReactNode` (a fragment of the rendered elements, each keyed by its spec element key).

Components SHALL treat slot names as positions: the spec decides which element goes into which slot, the component decides where each slot renders.

#### Scenario: Plain object registry works
- **WHEN** a registry `{ Text: ({ element }) => <p>{element.props.text}</p> }` is passed to `<Renderer>`
- **THEN** elements with `type: "Text"` render that component

#### Scenario: Array-form children populate the children prop
- **WHEN** an element has `children: ["a", "b"]` and its component reads `children`
- **THEN** the component receives the rendered `a` and `b` nodes in order via `children`, and `slots` is `undefined`

#### Scenario: Record-form children populate the slots prop
- **WHEN** an element has `children: { "header": "h", "body": "b" }` and its component reads `slots`
- **THEN** the component receives `slots.header` (the rendered `h` node) and `slots.body` (the rendered `b` node), and `children` is `undefined`

#### Scenario: Slot with multiple elements is a single node
- **WHEN** an element has `children: { "toolbar": ["t1", "t2"] }` and its component renders `slots.toolbar`
- **THEN** both `t1` and `t2` render, in order, inside the position where the component places `slots.toolbar`

### Requirement: Components read paths from element.props
A component SHALL obtain its data path(s) from `element.props` (e.g. `props.bind`) and subscribe via `useBound`/`useValue`. A component MUST NOT hardcode a path literal — the actual path is supplied by the spec.

#### Scenario: BoundField reuses across distinct specs
- **WHEN** two different specs each declare an element of type `BoundField` with `props.bind` set to `"/invoice/name"` and `"/contact/firstName"` respectively
- **THEN** the same `BoundField` component definition serves both, subscribing to the path each spec supplies

### Requirement: Components dispatch actions via emit
A component SHALL invoke `emit(event)` for DOM events on its rendered controls (e.g. `onClick={() => emit("click")}`). The mapping from event name to action binding lives in the spec's `element.on`, not in the component. The component declares only that it emits a named event.

#### Scenario: ActionButton is path-independent of the handler
- **WHEN** two specs reuse the same `ActionButton` component (which only does `onClick={() => emit("click")}`) with different `on.click` bindings
- **THEN** each spec's handler is invoked for its own button, and the component code contains no reference to any handler name
