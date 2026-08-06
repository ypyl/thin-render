## Context

See proposal.md. `grep -rn "@mantine/hooks" demo/src` returns nothing; only Mantine core components are used (via `@mantine/core`, which does not depend on consumers installing `@mantine/hooks`).

## Goals / Non-Goals

**Goals:** Drop the unused demo dependency and its lockfile entry.

**Non-Goals:** No changes to imports or components; `@mantine/core` stays.

## Decisions

**D1: Remove via `npm uninstall @mantine/hooks` run inside `demo/`** so the demo lockfile updates consistently. Alternative: hand-editing — rejected, npm is safer.

## Risks / Trade-offs

- A future case might want a Mantine hook → Install it back then (YAGNI).
