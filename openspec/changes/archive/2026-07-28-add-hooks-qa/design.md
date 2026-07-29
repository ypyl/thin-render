## Context

Q&A.md has 35 questions across three sections (Expressions, Actions & Handlers, Watch). None of them cover the core API: hooks, store creation, Renderer props, registry building, or the component contract. These are the first things a user needs to understand.

## Goals / Non-Goals

**Goals:**
- Add a Core API section with 7 questions
- Hook comparison table as the centerpiece
- Cover all public exports not already explained elsewhere

**Non-Goals:**
- No duplication of README tutorial content — Q&A is reference, README is walkthrough
- No code changes

## Decisions

### Placement: new `## Core API` section at the top of Q&A.md

Currently Q&A starts with expressions. Core API should come first — it's foundational. Expressions build on hooks and the Renderer.

### Hook comparison: table format

The most useful thing for a user is a side-by-side comparison of the 5 hooks. A table with "reads?", "writes?", "subscribes?" columns plus a "use when" column.

### Questions to include

1. Which hook should I use? (comparison table)
2. How do I create and initialize a store?
3. How do I read state outside a component? (getByPath)
4. What does the Renderer need?
5. How do I build a registry?
6. What's the ComponentProps contract?
7. What's the Spec structure?

## Risks / Trade-offs

- **Section order**: Moving Core API before Expressions changes the reading flow. Expressions reference hooks — putting Core API first is logical.
- **Duplication with README**: README has "Basic usage" and API tables. Q&A goes deeper — "which hook when?" not "here are the hooks."
