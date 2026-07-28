## Context

The existing Q&A.md has 10 questions under "Actions & Handlers" covering the handler contract, registration, `emit`, `setState`, `on` vs `watch`, async, and missing handlers. Two of those touch on `watch` generally. The deeper `watch` mechanics (literal paths, infinite-loop guard, initial-render behavior) are documented only in source code and tests.

## Goals / Non-Goals

**Goals:**
- Add 5 watch-specific questions to Q&A.md
- Cover: `$item` gap in watch paths, per-item validation workaround, infinite-loop guard, initial render behavior, non-existent paths
- Keep questions concise — `watch` is a focused topic

**Non-Goals:**
- No code changes
- No demo changes
- No spec changes (watch paths intentionally don't support expressions)

## Decisions

### Placement: new `### Watch` subsection under Actions & Handlers

The existing Q&A already has `### What's the difference between on and watch?` and `### How does watch avoid causing re-renders?`. Adding a `### Watch` grouping header before a set of deeper questions makes the section scannable. The two existing watch questions can stay where they are (comparison and re-render mechanics are cross-cutting).

The new questions go after the existing 10, under a `### Watch` sub-heading.

### Question selection: 5 questions

Focus on the most actionable gaps:
1. `$item` in watch paths — the biggest "gotcha"
2. Per-item validation workaround — practical solution to #1
3. Infinite-loop guard — natural concern for watch→setState patterns
4. Initial render — clarifies timing
5. Non-existent paths — clarifies subscription behavior

## Risks / Trade-offs

- **Section depth**: 15 total questions under Actions & Handlers. Still manageable with the `### Watch` grouping.
