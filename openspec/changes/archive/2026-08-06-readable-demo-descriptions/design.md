## Context

See proposal.md — Why. The descriptions live in four places, all holding the same 18-case content:

1. `demo/src/HomePage.tsx` — `CASES` array, one `description` string per card.
2. Each demo case's spec file (`spec.json` or `buildSpec.ts`) — `CaseContainer` props: `description` (visible under the title) and `technicalDescription` (shown in the "How it works" spoiler).
3. `README.md` — demo table "What it shows" column.
4. `demo/README.md` — demo table "What it shows" column.

The `case-container` spec requires every case root to use `CaseContainer` with a `description` prop; the spoiler renders whenever `technicalDescription` is non-empty. Component behavior is not changing — only prop values and markdown text.

## Goals / Non-Goals

**Goals:**

- One plain-language description per case, written for a newcomer: what the demo shows, what the visitor can try, what happens on interaction.
- Consistent wording across the four locations, with per-location length appropriate to the surface (card vs. case page vs. table cell).
- Descriptions stay free of internal details: no component names, no API names, no expression syntax, no implementation notes.

**Non-Goals:**

- No changes to `CaseContainer` or any library/demo component behavior (the "How it works" spoiler stays exactly as is).
- No changes to the demo routing, case count, titles, or source links.
- Not rewriting the developer-facing performance-verification section of `demo/README.md` (a dev how-to, not a case description).
- Not touching `LLM.md` — it has no demo-description content.

## Decisions

**D1: Plain behavioral prose for all four surfaces.** Each description states what you see and what you can do, e.g. "A simple greeting card — the whole page is defined as data, not code" instead of "demonstrates the Renderer component and type-driven element resolution". Rationale: the proposal's requirement is uniform — no API mentions anywhere. Alternatives considered: keeping API names in README tables (rejected: inconsistent with the case pages and the user's requirement).

**D2: "How it works" spoiler content becomes a plain-language walkthrough.** The `technicalDescription` is rewritten as short normal-prose steps of what happens when you interact ("Clicking Save writes your edits back and the fields become read-only again") — no component names, no spec/state/feature bullet structure. The spoiler mechanism, label, and rendering are unchanged. Rationale: the user explicitly wants "no internal details or api mentioning"; the spoiler remains a useful place for the plain walkthrough. Alternative considered: deleting the spoiler entirely — rejected, it would change `case-container` component behavior and require a spec change for no functional gain.

**D3: One source voice, three lengths.** A single canonical sentence set is drafted once (per case), then adapted: HomePage cards get ~1-2 sentences with a hook about what to try; case-page `description` gets the same sentence; `technicalDescription` gets the interaction walkthrough (2-4 short sentences); README table cells get the shortest form. Rationale: keeps the four locations consistent without forcing identical text where surfaces differ.

**D4: Forbidden-token check as the acceptance bar.** After rewriting, no demo-case description (in any of the four locations) may contain backticked API names, component names (`BoundField`, `CaseContainer`, `Renderer`, ...), expression syntax (`$item`, `$index`, `usePath`, `{ $item: ... }`), or internal concepts ("repeat directive", "registry", "emit system", "renderGeneric", "store paths"). Rationale: a mechanical, reviewable bar instead of subjective "plainness".

## Risks / Trade-offs

- Descriptions drift between the four locations after this change → Mitigation: the tasks include a cross-check step and the forbidden-token check; AGENTS.md already requires README/demo sync for future changes.
- Over-simplification loses information for advanced readers → Trade-off accepted deliberately: source code links remain in the README table, and the demo cases themselves are the reference implementation; this change is about the entry point, not the docs.
- `buildSpec.ts` descriptions are code strings — JSON-in-JS escaping mistakes → Mitigation: run the demo build (`npm run build` in `demo/`) as part of the tasks.
