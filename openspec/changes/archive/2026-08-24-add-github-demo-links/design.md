## Context

The demo app (`demo/`) drives individual case pages with the `thin-render` renderer. Every case's root element is a `CaseContainer` (a reusable demo component in `demo/src/components/CaseContainer.tsx`), whose props come from that case's `spec.json`. All cases already route through `CaseContainer`, so it is the single point where a per-case GitHub link can be rendered. The library itself (`src/`) is untouched.

## Goals / Non-Goals

**Goals:**
- Show a "View source on GitHub" link on every demo case page pointing at that case's own `demo/src/cases/<name>` folder.
- Keep the change demo-only and minimal, adding one optional prop to the shared wrapper rather than per-case markup.

**Non-Goals:**
- Deep links to individual files or line numbers.
- Any behavior change to the published `thin-render` library.
- Changing how cases are authored or registered.

## Decisions

**Add an optional `sourceFolder` prop to `CaseContainer`.** The wrapper already renders the title/description block from spec props, and every case uses it as root. When `sourceFolder` is present, render a Mantine `Anchor` (the pattern already used by `HomePage.tsx`) with `target="_blank"` and `rel="noopener noreferrer"` pointing at the GitHub repo's `master` branch, `demo/src/cases/<sourceFolder>` path. Place it in the header area next to the title.

**Set `sourceFolder` in each case's spec `CaseContainer` props.** Each `spec.json` adds `sourceFolder` equal to its own directory name (e.g. `basic`, `form`, `dnd-table`). This keeps the component universal (per project convention) and lets each case self-describe its source location.

**Alternative considered — derive the folder from the route.** The folder name matches the route in every case, so the link could be computed instead of stored in the spec. Rejected: it couples the component to the router and would need a route-aware wrapper; an explicit prop keeps `CaseContainer` a dumb, spec-driven component consistent with the rest of the codebase.

## Risks / Trade-offs

- **Spec-file churn:** every case's `spec.json` gains one prop. Mechanical, low risk; the existing validation/tests confirm all cases still render.
- **Hard-coded repo + branch:** the link assumes the `ypyl/thin-render` repo and `master` branch. `HomePage.tsx` already hard-codes the same repo, so this matches the existing convention.
- **Exact-match prop names matter:** `spec.json` must use the exact `sourceFolder` key, or the link silently stays hidden. Covered by a spec requirement and demo verification.
