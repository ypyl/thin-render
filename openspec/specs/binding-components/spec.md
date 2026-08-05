## ADDED Requirements

### Requirement: Registry maps type names to binding components
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

### Requirement: Binding components read paths from element.props
A binding component SHALL obtain its data path(s) from `element.props` (e.g. `props.bind`, `props.binds`, `props.values`, `props.actions`) and subscribe via `useBound`/`useValue`. A binding component MUST NOT hardcode a path literal — the actual path is supplied by the spec.

#### Scenario: BoundField reuses across distinct specs
- **WHEN** two different specs each declare an element of type `BoundField` with `props.bind` set to `"/invoice/name"` and `"/contact/firstName"` respectively
- **THEN** the same `BoundField` component definition serves both, subscribing to the path each spec supplies

### Requirement: Presentational components receive plain props only
Presentational components (e.g. `TextInput`, `Button`, `Card`) SHALL receive only plain props (`value`, `onChange`, `onClick`, `label`, `children`, etc.) and MUST NOT import the store hooks or know about paths. They SHALL be reusable outside the thin-render registry (e.g. used directly in a hand-written React tree).

#### Scenario: Presentational input reused outside the registry
- **WHEN** a plain React file imports `TextInput` and renders `<TextInput value="x" onChange={fn} />` directly (without `Renderer`)
- **THEN** it works with no thin-render store or context present

### Requirement: Binding forwards plain props to presentational components
A binding component SHALL translate `element.props` paths into calls to `useBound`/`useValue`/`emit` and forward the resulting plain `value`/`onChange`/`onClick`/etc. to a presentational component. The binding layer is the ONLY place that touches the store hooks.

#### Scenario: BoundField wraps a presentational TextInput
- **WHEN** a `BoundField` binding is defined as reading `element.props.bind` via `useBound` and rendering `<TextInput value={v} onChange={setV} label={element.props.label} />`
- **THEN** keystrokes in `TextInput` call `setV`, which calls `store.set(bind, v)`, which re-renders only the `BoundField` subscribed to that path

### Requirement: Multi-path contract supported via binds
A binding component MAY declare a contract using `props.binds` (a map of role → path) and call `useBound` once per role. This enables composite components (e.g. `FullName` with first/last) without hardcoding paths.

#### Scenario: Multi-path binds drive one component
- **WHEN** a `FullName` binding reads `useBound(element.props.binds.first)` and `useBound(element.props.binds.last)` and renders two `TextInput`s
- **THEN** editing the "first" input re-renders `FullName` (subscribed to `/user/first`) but a sibling component subscribed to `/user/last` does not re-render

### Requirement: Action contract supported via emit
A binding component MAY invoke `emit(event)` for DOM events on its presentational component (e.g. `onClick={() => emit("click")}`). The mapping from event name to action binding lives in the spec's `element.on`, not in the component. The component declares only that it emits a named event.

#### Scenario: ActionButton is path-independent of the handler
- **WHEN** two specs reuse the same `ActionButton` binding (which only does `onClick={() => emit("click")}`) with different `on.click` bindings
- **THEN** each spec's `on.click.action` handler is invoked; the component need not know the handler name