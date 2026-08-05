## MODIFIED Requirements

### Requirement: Spec is a keyed element map with a root pointer
The library SHALL accept a `Spec` value consisting of a `root` key (string) and an `elements` map keyed by element id. Each element in `elements` MUST declare a `type` (string) referencing a registry component. An element MAY declare `props` (a plain serializable object of literal values and path strings), `children` (an ordered array of child element ids OR a record mapping slot names to child element ids or arrays of child element ids), `on` (event→action bindings), `repeat` (array iteration config), and `watch` (store path → action bindings fired on store mutation).

When `children` is an array, it declares ordered children. When `children` is a record, each key is a **slot name** and each value is a child element id (single) or an array of child element ids (multiple elements in one slot). Slot names are arbitrary strings chosen by the spec author; the parent element's component renders each slot at a position of its choosing.

#### Scenario: Minimal valid spec
- **WHEN** a spec `{ root: "r", elements: { r: { type: "Text", props: { text: "hi" } } } }` is rendered
- **THEN** the `Renderer` resolves `elements.r` and renders the registry component registered for `"Text"` without error

#### Scenario: Spec with children forms a tree
- **WHEN** a spec defines element A with `children: ["b"]` and element `b` exists in `elements`
- **THEN** `Renderer` renders element A's component with element `b` rendered as a child, in the order given by the `children` array

#### Scenario: Spec with named children declares slots
- **WHEN** a spec defines element A with `children: { "header": "h", "toolbar": ["t1", "t2"], "body": "b" }` and all referenced elements exist in `elements`
- **THEN** the spec is valid and A's component receives three slots: `"header"` holding the rendered `h` element, `"toolbar"` holding the rendered `t1` and `t2` elements, and `"body"` holding the rendered `b` element

#### Scenario: Missing root element fails gracefully
- **WHEN** the `root` value does not match any key in `elements`
- **THEN** `Renderer` renders nothing and does not throw

#### Scenario: Element with watch field
- **WHEN** a spec element has `watch: { "/form/name": [{ action: "validate", params: { value: { $state: "/form/name" } } }] }`
- **THEN** the element is valid and renders normally; the `watch` field is handled by the renderer separately from rendering
