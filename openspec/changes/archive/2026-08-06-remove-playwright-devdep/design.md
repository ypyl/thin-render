## Context

See proposal.md. `grep -r playwright` across the repo (excluding `node_modules`) matches only `package.json` itself. The pi tooling on this machine has its own playwright install outside the repo, so nothing in the project needs it.

## Goals / Non-Goals

**Goals:** Drop the unused devDependency and its lockfile entry.

**Non-Goals:** No changes to vitest, demo, or CI configuration (none reference playwright).

## Decisions

**D1: Remove via `npm uninstall --save-dev playwright`** so the lockfile is updated by npm rather than hand-edited. Alternative: editing `package.json` by hand and running `npm install` — equivalent result; npm uninstall is less error-prone.

## Risks / Trade-offs

- Someone later wants browser tests → Install it back when needed (YAGNI; the audit found no test using it).
