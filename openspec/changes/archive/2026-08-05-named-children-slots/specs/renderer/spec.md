## MODIFIED Requirements

### Requirement: Children render in spec order with stable keys
When an element declares `children: [k1, k2, ...]`, `Renderer` SHALL render each child `ElementRenderer` keyed by its spec key in the order listed. Missing child keys SHALL be skipped with a console warning (only when not streaming/loading).

When an element declares record-form `children` (`{ slotName: k | [k1, k2, ...] }`), `Renderer` SHALL render each slot's child `ElementRenderer`s keyed by their spec keys and pass them to the component via `ComponentProps.slots[slotName]` (a single node per slot; `children` prop SHALL be undefined). Within a slot, multiple children SHALL render in the order listed. Missing child keys in any slot SHALL be skipped with a console warning (only when not streaming/loading); the slot then holds the remaining children.

#### Scenario: Out-of-order children preserve spec order
- **WHEN** an element has `children: ["b", "a"]`
- **THEN** child `b` is rendered before child `a`

#### Scenario: Record-form children populate slots
- **WHEN** an element has `children: { "header": "h", "body": "b" }` and its component renders `{slots.header}{slots.body}`
- **THEN** the `h` element renders at the component's header position and the `b` element at its body position, regardless of declaration order

#### Scenario: Missing key inside a slot warns and is skipped
- **WHEN** an element has `children: { "body": ["missing", "b"] }` and `"missing"` is not in `spec.elements`
- **THEN** a console warning is logged (when not streaming/loading) and the `body` slot contains only the rendered `b` element

### Requirement: RepeatChildren supports array and record children
For an element with a `repeat` field, `RepeatChildren` SHALL render each item's children according to the element's `children` form: array-form children are passed to the repeated component via `ComponentProps.children`; record-form children are passed via `ComponentProps.slots` with per-slot nodes. Each repeated instance SHALL receive its own children/slots scoped to its item's `PathContext` and `RepeatIndexContext`. Missing child keys SHALL be skipped with a console warning, matching the non-repeated behavior.

#### Scenario: Repeat with record-form children builds slots per item
- **WHEN** an element has `repeat: { path: "/cards" }` and `children: { "title": "t", "body": "b" }`, and `/cards` holds two items
- **THEN** each repeated component instance receives `slots.title` and `slots.body` rendered for its own item, scoped to `/cards/0` and `/cards/1` respectively

#### Scenario: Repeat with array-per-slot renders all elements per item
- **WHEN** an element has `repeat: { path: "/rows" }` and `children: { "cells": ["c1", "c2"] }`
- **THEN** each repeated instance's `slots.cells` contains both `c1` and `c2` rendered for that item
