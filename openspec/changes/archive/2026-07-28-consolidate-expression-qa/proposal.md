## Why

The Expressions section in Q&A.md has 20 questions organized as three identical templates ($state: 7, $item: 7, $index: 6). Each follows the same pattern: "What is X?", "Where can I use X?", "When in actions?", "When in repeat?", "Does it re-render?", plus edge cases. The content is valuable but the structure creates repetition — the same code examples appear for each expression type, and the "Where can I use" answers already contain the information that "When would I use" repeats with longer examples.

Consolidating from 20 questions to ~5 keeps all the information while making the section scannable.

## What Changes

- Replace the 20-question expression trilogy with 5 consolidated questions:
  - **Expression reference table** — the 5-context × 3-expression matrix from LLM.md
  - **What is `$state`?** — definition, the subscription distinction, missing-path edge case
  - **What is `$item`?** — definition, the `""` sentinel, nesting, path vs value, outside-repeat behavior
  - **What is `$index`?** — definition, row deletion example, true/false gating
  - **How do they compare?** — one table covering semantics, resolution target, where valid

## Capabilities

### New Capabilities
<!-- None — documentation restructuring only -->

### Modified Capabilities
<!-- None -->

## Impact

- Affected file: `Q&A.md` (replace Expressions section)
- No code changes
- Same information, half the line count
