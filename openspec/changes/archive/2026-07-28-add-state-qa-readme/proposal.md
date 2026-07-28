## Why

The README currently mentions `$state` in passing — a one-liner in the Actions section and a brief note in the spec type comment. Users discover `$state` works in two places (action params and repeat paths) with fundamentally different behavior (snapshot vs. subscription), but this isn't documented anywhere. A dedicated Q&A section makes the expression discoverable and answers the natural follow-up questions that arise from using it.

## What Changes

- Add a **Q&A** section to `README.md` covering the `$state` expression:
  - What `$state` is and its syntax
  - The two places it can be used (action params vs. repeat paths)
  - Why the behavior differs between those two contexts (read-once snapshot vs. reactive subscription)
  - When to use each
  - Edge cases: missing paths, non-string values
  - How `$state` compares to `$item` and `$index`

## Capabilities

### New Capabilities
<!-- None — documentation-only change -->

### Modified Capabilities
<!-- None — no spec-level requirement changes -->

## Impact

- Affected file: `README.md` (append new section)
- No code changes, no API changes, no dependency changes
- Line count in README badge may need updating
