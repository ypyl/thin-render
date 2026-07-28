## Why

The Q&A section in README.md has grown to ~370 lines across three subsections (`$state`, `$item`, `$index`). It's valuable reference material, but its length dilutes the README's primary purpose as a getting-started guide. Moving it to a dedicated `Q&A.md` keeps the README focused while keeping the Q&A discoverable via a prominent link.

## What Changes

- Create `Q&A.md` at the repo root with the full Q&A content
- Replace the Q&A section in `README.md` with a short reference: a link to `Q&A.md` and a brief description of what it covers
- Update the AGENTS.md synchronization note if applicable (README structural changes)

## Capabilities

### New Capabilities
<!-- None — documentation restructuring only -->

### Modified Capabilities
<!-- None -->

## Impact

- New file: `Q&A.md`
- Modified: `README.md` (Q&A section replaced with link)
