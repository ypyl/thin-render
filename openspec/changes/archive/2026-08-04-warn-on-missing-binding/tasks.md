## 1. Implementation

- [x] 1.1 Add `console.warn` in `useEmit` when `on` is `undefined`/`null` (emit with no on map)
- [x] 1.2 Add `console.warn` in `useEmit` when `on[eventName]` is `undefined` (missing event in on map), including available event keys in the message

## 2. Tests

- [x] 2.1 Add test: emit with no `on` map calls `console.warn` and returns without error
- [x] 2.2 Add test: emit with missing event name calls `console.warn` with available keys and returns without error
- [x] 2.3 Verify existing tests still pass — mock `console.warn` in any test that triggers the new warn paths

## 3. Verification

- [x] 3.1 Run `npm test` and confirm all tests pass
- [x] 3.2 Run `npm run coverage` to verify 100% coverage is maintained
