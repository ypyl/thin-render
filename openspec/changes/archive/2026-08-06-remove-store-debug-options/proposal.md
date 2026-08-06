## Why

`createStore` accepts a `StoreOptions` object with `debug` and `log` to log every `set()` call to the console. No consumer in the library, demo, or docs ever passes it; the feature is undocumented and kept alive only by its own test block. It is speculative debug plumbing.

## What Changes

- Remove the `StoreOptions` interface and the `options` parameter of `createStore` from `src/store.ts`.
- Remove the `debug`/`log` branches from `set()` (including the no-op guard logging).
- Remove the `describe("debug mode", ...)` block (3 tests) from `src/store.test.ts`.
- No behavior change for any existing caller: nothing passes options today. `StoreOptions` is not exported from the public API.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Internal cleanup, no behavior contract changes (`skip_specs: true`).

## Impact

- `src/store.ts` — remove ~12 lines.
- `src/store.test.ts` — remove ~20 test lines.
- No README.md / LLM.md / demo changes (`debug` is not documented anywhere).
