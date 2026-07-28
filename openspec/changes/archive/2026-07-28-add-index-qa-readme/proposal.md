## Why

The README Q&A section now covers `$state` and `$item` in depth. `$index` is the third and simplest expression type — it passes the numeric repeat index to action handlers. Currently only mentioned as a one-line bullet in the Actions section. A Q&A subsection completes the trilogy and makes all three expression types discoverable.

## What Changes

- Add an **`$index` Q&A** subsection to the existing Q&A section in `README.md`, covering:
  - What `$index` is and its syntax (`{ $index: true }`)
  - Where it can be used (action params only — unlike `$state` and `$item`)
  - Why `$index` is boolean-gated (`true` → value, `false` → undefined)
  - How it's used in real handlers (row deletion via array index)
  - Edge cases: outside repeat, `$index: false`
  - How `$index` compares to `$item: ""` for identifying the current item

## Capabilities

### New Capabilities
<!-- None — documentation-only change -->

### Modified Capabilities
<!-- None — no spec-level requirement changes -->

## Impact

- Affected file: `README.md` (append to existing Q&A section)
- No code changes, no API changes, no dependency changes
