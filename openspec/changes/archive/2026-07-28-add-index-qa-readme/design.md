## Context

The `$state` and `$item` Q&A subsections exist. `$index` is the simplest of the three — it only works in action params, only resolves to the numeric repeat index, and has the narrowest surface area. It deserves equal documentation treatment.

No code changes. Purely a README addition.

## Goals / Non-Goals

**Goals:**
- Add an `$index` subsection to the existing Q&A
- Cover: syntax, where used, `true`/`false` gating, real example (row deletion), edge cases
- Contrast with `$item: ""` (index vs. path for identifying the current item)

**Non-Goals:**
- No code changes
- No API changes

## Decisions

### Placement: after `$item` subsection

Logical order: `$state` → `$item` → `$index` (decreasing complexity, decreasing number of usage contexts).

### Content: shorter than `$state` and `$item`

`$index` has one usage context, one syntax variant that matters (`true`), and straightforward semantics. The Q&A should be proportional — 3-4 questions, not 7.

## Risks / Trade-offs

- **Section length**: Three subsections is still manageable in a single Q&A block
