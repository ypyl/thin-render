## MODIFIED Requirements

### Requirement: Children render in spec order with stable keys
When an element declares `children: [k1, k2, ...]`, `Renderer` SHALL render each child `ElementRenderer` keyed by its spec key in the order listed. Missing child keys SHALL be skipped with a console warning.

When an element declares record-form `children` (`{ slotName: k | [k1, k2, ...] }`), `Renderer` SHALL render each slot's child `ElementRenderer`s keyed by their spec keys and pass them to the component via `ComponentProps.slots[slotName]` (a single node per slot; `children` prop SHALL be undefined). Within a slot, multiple children SHALL render in the order listed. Missing child keys in any slot SHALL be skipped with a console warning; the slot then holds the remaining children.

`Renderer` SHALL NOT accept a `loading` prop; there is no warning-suppression mode.

#### Scenario: Out-of-order children preserve spec order
- **WHEN** an element has `children: ["b", "a"]`
- **THEN** child `b` is rendered before child `a`

#### Scenario: Record-form children populate slots
- **WHEN** an element has `children: { "header": "h", "body": "b" }` and its component renders `{slots.header}{slots.body}`
- **THEN** the `h` element renders at the component's header position and the `b` element at its body position, regardless of declaration order

#### Scenario: Missing key inside a slot warns and is skipped
- **WHEN** an element has `children: { "body": ["missing", "b"] }` and `"missing"` is not in `spec.elements`
- **THEN** a console warning is logged and the `body` slot contains only the rendered `b` element

#### Scenario: Missing element warns unconditionally
- **WHEN** an element key referenced in `children` is not in `spec.elements` and no `loading` prop is passed (the prop no longer exists)
- **THEN** a console warning is logged and the missing element renders nothing
