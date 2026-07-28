## Why

The README now has a Q&A section for `$state` (added in `add-state-qa-readme`), but `$item` — the companion expression used in action params, repeat paths, and component props — has no equivalent deep-dive. `$item` is used in more places than `$state` (three contexts vs. two) and has fundamentally different semantics (path resolution vs. value lookup). A dedicated Q&A section makes the expression discoverable and answers natural follow-up questions.

## What Changes

- Add an **`$item` Q&A** subsection to the existing Q&A section in `README.md`, covering:
  - What `$item` is and its syntax (`{ $item: "field" }`, `{ $item: "" }`)
  - The three places it can be used (action params, repeat paths, component props via `useItemPath`)
  - Why `$item` never subscribes (context-only, unlike `$state` in repeat paths)
  - When to use each context
  - Edge cases: outside repeat, nested objects, the `""` sentinel
  - How `$item` compares to `$state` (path vs. value, context vs. store)

## Capabilities

### New Capabilities
<!-- None — documentation-only change -->

### Modified Capabilities
<!-- None — no spec-level requirement changes -->

## Impact

- Affected file: `README.md` (append to existing Q&A section)
- No code changes, no API changes, no dependency changes
