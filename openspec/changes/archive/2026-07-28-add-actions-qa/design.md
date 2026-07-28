## Context

`Q&A.md` currently has one section: expression types (`$state`, `$item`, `$index`). Actions and handlers are the other half of the story — expressions provide data to handlers, and handlers execute logic. The two topics are inseparable in practice, so they belong in the same file.

## Goals / Non-Goals

**Goals:**
- Add an Actions & Handlers section to Q&A.md
- Cover: handler contract, registration, triggering (on vs watch), built-in setState, async, missing handlers
- Include a comparison table for `on` vs `watch`
- Cross-reference expression types where relevant (e.g., params resolution)

**Non-Goals:**
- No code changes
- No demo changes
- No README changes (Q&A.md is the right home for this depth)

## Decisions

### Placement: new `## Actions & Handlers` section in Q&A.md

After the expression types section. The expression types are "what data flows into handlers" — actions are "how handlers are invoked." Logical progression.

### Structure: mirror the expression Q&A style

Each question is a `###` heading. Grouped thematically: handler basics → triggering → on vs watch → edge cases.

### Questions to include (10 total)

1. What is a handler? (contract)
2. How do I register handlers?
3. How do I trigger an action from a component?
4. How do I pass data to a handler?
5. Can I fire multiple handlers from one event?
6. What is the built-in `setState` action?
7. What's the difference between `on` and `watch`?
8. How does `watch` avoid causing re-renders?
9. Can handlers be async?
10. What happens if a handler isn't found?

## Risks / Trade-offs

- **Section length**: 10 questions is substantial but necessary for complete coverage
- **Duplication with README**: The README already has basic Actions and Watch sections. Q&A goes deeper — cross-reference rather than duplicate
