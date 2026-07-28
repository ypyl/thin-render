## Context

The README currently documents `$state` in passing — a bullet point in the Actions section and a type comment in the spec schema. The expression is used in two distinct contexts (action params and repeat paths) with different behaviors (snapshot read vs. reactive subscription), but users have to discover this by reading source code.

No code changes needed. Purely a README addition.

## Goals / Non-Goals

**Goals:**
- Add a Q&A section to the README explaining `$state` thoroughly
- Cover both usage contexts (action params, repeat path) and the behavioral difference
- Cover edge cases (missing paths, non-string values, nesting)
- Distinguish `$state` from `$item` and `$index`

**Non-Goals:**
- No code changes to src/ or demo/
- No new test requirements (100% coverage already met)
- No API surface changes
- No new capabilities or spec changes

## Decisions

### Placement: dedicated Q&A section at end of README

The existing README sections (Architecture, Quick Start, API, Demo) serve different purposes — they're reference and tutorial material. A Q&A section is a distinct format (question-driven). Placing it at the end keeps it discoverable without interrupting the narrative flow of the existing content.

**Alternatives considered:**
- Inline in Actions section: Too narrow — `$state` also works in repeat paths
- Inline in Repeat section: Too narrow — misses the action param use case
- Separate FAQ.md: Adds a file to maintain; README is the single source of truth

### Content: answer-driven, not speculation-driven

Questions should arise naturally from real usage patterns observed in the codebase and tests. Each answer should reference concrete behavior visible in `hooks.ts`, `renderer.tsx`, and the test files.

## Risks / Trade-offs

- **Section length**: The Q&A could grow over time. Currently 7 questions, manageable.
- **Duplication**: Some content overlaps with the Actions and Repeat sections. Keep Q&A self-contained but link to relevant sections where appropriate.
- **Drift**: If `$state` behavior changes, the Q&A must be updated. Low risk — the expression semantics are stable.
