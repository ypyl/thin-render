## Context

The Q&A section in README.md contains 3 subsections (`$state`, `$item`, `$index`) totaling ~370 lines. Extracting it to a dedicated file keeps both files focused: README for onboarding, Q&A.md for deep reference.

## Goals / Non-Goals

**Goals:**
- Move Q&A content verbatim to `Q&A.md` (no content changes)
- Replace Q&A in README with a brief link + description
- Keep the Q&A heading structure intact in the new file

**Non-Goals:**
- No content edits to Q&A answers
- No other README restructuring

## Decisions

### Placement: repo root (`Q&A.md`)

Co-located with `README.md` for maximum discoverability. Alternative considered was `docs/Q&A.md` but the repo doesn't have a `docs/` directory and adding one for a single file is over-engineering.

### README reference: heading + link + one-liner

```
## Q&A

See [Q&A.md](./Q&A.md) for answers to common questions about `$state`, `$item`, and `$index` expressions.
```

Minimal, keeps the section heading for navigation, immediately points to the full content.

## Risks / Trade-offs

- **Broken link**: If `Q&A.md` is renamed or moved, the link breaks. Mitigation: file at repo root, unlikely to move.
- **Dual maintenance**: Both files reference each other conceptually. Low risk since Q&A is self-contained.
