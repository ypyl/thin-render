## MODIFIED Requirements

### Requirement: Registry function receives resolved props and rendered children
The library SHALL call each registry function with `(props, children, ctx)` where `props` is the element's `props` (or `{}` if undefined) with all expressions resolved, `children` is a flat array of results from rendering child elements (empty array if no children), and `ctx` is the `RenderContext`.

For array-form `children`, `children` SHALL hold the rendered results in order and `ctx.slots` SHALL be `undefined`. For record-form `children`, `children` SHALL be an empty array and `ctx.slots` SHALL hold one entry per slot name, each entry being the array of results from rendering that slot's child elements (in the order listed; empty array if none). The two forms are mutually exclusive — a registry function receives results either via `children` or via `ctx.slots`, never both.

For an element with a `repeat` config, the above SHALL hold per item: each item's iteration renders the element's children (array or record form) once, scoped to the item's path and index, and the registry function is called once with the concatenated results (array form) or per-item `ctx.slots` merged by slot name (record form, slot entries concatenated across items in iteration order).

#### Scenario: Registry receives empty props and empty children
- **WHEN** an element has no `props` and no `children`
- **THEN** the registry function receives `props = {}`, `children = []`, and `ctx.slots` is `undefined`

#### Scenario: Registry receives array of child results
- **WHEN** an element with `children: ["a", "b"]` is rendered and child elements produce results `"resultA"` and `"resultB"`
- **THEN** the registry function receives `children = ["resultA", "resultB"]` and `ctx.slots` is `undefined`

#### Scenario: Registry receives named slots for record-form children
- **WHEN** an element with `children: { "header": "h", "body": ["b1", "b2"] }` is rendered and child elements produce `"resultH"`, `"resultB1"`, `"resultB2"`
- **THEN** the registry function receives `children = []` and `ctx.slots = { header: ["resultH"], body: ["resultB1", "resultB2"] }`

#### Scenario: Repeat with record-form children concatenates slots per item
- **WHEN** an element with `repeat: { path: "/rows" }` and `children: { "title": "t" }` iterates two items whose `t` child produces `"T0"` and `"T1"`
- **THEN** the registry function receives `children = []` and `ctx.slots = { title: ["T0", "T1"] }`
