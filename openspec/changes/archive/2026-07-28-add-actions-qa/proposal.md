## Why

`Q&A.md` covers the three expression types (`$state`, `$item`, `$index`) but has nothing on actions and handlers — the mechanism that actually executes logic. Users reading the expression Q&A naturally wonder: "OK, I know what `$state` does in params — but how do handlers work? How do I trigger them? What's the contract? What's the difference between `on` and `watch`?"

The README documents actions and watch in separate sections but never compares them, never explains the handler contract explicitly, and never covers the built-in `setState` action's capabilities (like using `$state` in its `value` param). A Q&A section fills these gaps.

## What Changes

- Add an **Actions & Handlers** section to `Q&A.md` covering:
  - The handler contract (`(params, { getState, setState }) => void | Promise<void>`)
  - How to register handlers
  - How to trigger actions (`emit`, `on` map, array syntax for multiple handlers)
  - The built-in `setState` action (including `$state` in `value`)
  - `on` vs `watch`: comparison table — when to use which
  - How `watch` avoids re-renders (`store.subscribe`, not `useValue`)
  - What happens when a handler is missing (console.warn)
  - Async handlers
  - Passing data via params with expression resolution

## Capabilities

### New Capabilities
<!-- None — documentation-only change -->

### Modified Capabilities
<!-- None -->

## Impact

- Affected file: `Q&A.md` (append new section)
- No code changes, no API changes
