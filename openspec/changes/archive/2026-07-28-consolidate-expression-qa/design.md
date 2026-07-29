## Context

Q&A.md Expressions section: 20 questions across $state (7), $item (7), $index (6). The template-driven structure creates repetition without adding information.

## Goals / Non-Goals

**Goals:**
- Reduce 20 questions to 5
- Keep all factual information (syntax, contexts, edge cases, examples)
- Use the expression matrix from LLM.md as the reference table
- Merge "Where can I use" + "When would I use" into the "What is" answers

**Non-Goals:**
- No information loss — every edge case preserved
- No change to other Q&A sections

## Decisions

### Structure: 5 questions

1. **Expression reference** — the matrix table (what LLM.md has), one question
2. **What is $state?** — definition, subscription behavior (the only non-trivial re-render case), missing path
3. **What is $item?** — definition, "" sentinel, nested repeat example, outside-repeat, path-vs-value
4. **What is $index?** — definition, row deletion example, true/false
5. **How do they compare?** — semantics table

### Code examples: keep the best one per expression

- $state: tab switcher (dynamic repeat) — shows the subscription behavior
- $item: nested repeat (categories → items) — shows path composition
- $index: row deletion — shows positional array work

The less distinctive examples (action params with mixed $state+$item, basic repeat path) get replaced by the reference table.

### Edge cases: fold into "What is" answers

Instead of separate questions for "What happens if path doesn't exist?" and "What happens outside a repeat?", include these as one-liners in the definition: "If the path doesn't exist, returns undefined/empty string. If outside a repeat, $item returns undefined."

## Risks / Trade-offs

- **Regression**: If the shorter format misses a question someone actually searches for. Mitigation: the expression matrix covers "where valid", the "What is" covers edge cases.
