## MODIFIED Requirements

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
