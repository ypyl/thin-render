## ADDED Requirements

### Requirement: emit warns when element has no on map
When `emit(eventName)` is called on an element with no `on` map (`on` is `undefined` or `null`), the library SHALL call `console.warn` with a descriptive message indicating the element has no action bindings. The emit call SHALL still return without error.

#### Scenario: Emit with no on map warns
- **WHEN** `emit("click")` is called from an element where `on` is `undefined`
- **THEN** `console.warn` is called with a message indicating no `on` bindings are configured
- **AND** `emit` returns without throwing

### Requirement: emit warns when event name is not in the on map
When `emit(eventName)` is called and the element has an `on` map but `on[eventName]` is `undefined`, the library SHALL call `console.warn` with a descriptive message including the event name and the available keys in the `on` map. The emit call SHALL still return without error.

#### Scenario: Emit with missing event name warns
- **WHEN** `emit("click")` is called on an element with `on: { change: { action: "save" } }`
- **THEN** `console.warn` is called with a message indicating `"click"` was not found and listing available event names
- **AND** `emit` returns without throwing
