## Context

The `$state` Q&A section was added to the README. `$item` is the companion expression with broader reach (three usage contexts vs. two) and different semantics (path resolution vs. value lookup). It deserves the same treatment.

No code changes. Purely a README addition.

## Goals / Non-Goals

**Goals:**
- Add an `$item` subsection to the existing Q&A in the README
- Cover all three usage contexts (action params, repeat path, component props)
- Explain the `$item: ""` sentinel
- Contrast with `$state` (path vs. value, context vs. store, no subscription vs. subscribes)

**Non-Goals:**
- No code changes
- No new demo cases
- No API surface changes

## Decisions

### Placement: subsection under existing Q&A

Since `$state` and `$item` are sibling concepts, they belong in the same Q&A section. `$item` goes after `$state` as a new `### How is $item different from $state?` already exists in the `$state` Q&A — the `$item` subsection can cross-reference it rather than duplicate.

### Content: mirror the $state Q&A structure but emphasize differences

- What `$item` is
- Where it's used (three places — one more than `$state`)
- When to use each
- Does it cause re-renders? (No — it's always context-only)
- Edge cases
- Comparison with `$state`

## Risks / Trade-offs

- **Duplication with `$state` Q&A**: The existing Q&A already has a comparison table. Keep `$item` self-contained but reference rather than repeat.
- **Section length**: Two Q&A subsections is still manageable.
