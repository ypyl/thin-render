## Why

Every demo case description — the landing-page cards, the description under each case title, and the "How it works" text — is written in internal library jargon (component names, expression syntax, implementation details). A user who is familiarizing themselves with the library cannot tell what a case actually shows or does. The descriptions should read as plain, normal text: what you see, what you can try, what happens when you interact.

## What Changes

- Rewrite all 18 demo card descriptions in `demo/src/HomePage.tsx` as plain-language text. Each describes what the demo shows and what the visitor can try, with no component names, API names, expression syntax, or implementation details.
- Rewrite the `description` prop of every demo case's `CaseContainer` (in each case's `spec.json` or `buildSpec.ts`) in the same plain style.
- Rewrite the `technicalDescription` ("How it works" spoiler) of every demo case into plain, newcomer-friendly prose describing the user-visible behavior and flow. No internal component names, API mentions, or implementation details. The spoiler mechanism itself is unchanged — only the text content changes.
- Update the "What it shows" columns of the demo tables in `README.md` and `demo/README.md` to match the new descriptions. Source file links stay unchanged.
- No library behavior changes: `src/` is untouched, no test changes, no API changes.

## Capabilities

### New Capabilities

None. This is a content-only documentation change — no behavior contracts change.

### Modified Capabilities

None. The `case-container` spec governs component behavior (rendering of `description` and `technicalDescription` props), which is unchanged; only the prop values in demo specs change.

## Impact

- `demo/src/HomePage.tsx` — 18 card descriptions rewritten.
- 18 demo case spec files, wherever `CaseContainer` `description` / `technicalDescription` props are defined:
  - `spec.json`: `basic`, `form`, `actions`, `switch`, `table` (via `buildSpec.ts`), `detail-modal` (via `buildSpec.ts`), `two-store` (via `buildPreviewSpec.ts` / `buildSettingsSpec.ts`), `feature-flags` (via `buildSpec.ts`), `translations` (via `buildSpec.ts`), `large` (via `buildSpec.ts`), `dnd-table` (via `buildSpec.ts`), `mantine-table` (via `buildSpec.ts`), `dynamic-columns`, `nested-repeat`, `named-slots`, `docx-export`, `xlsx-export`, `nested-package` (incl. its child spec).
- `README.md` — demo table "What it shows" column.
- `demo/README.md` — demo table "What it shows" column.
- No changes to `src/` library code, tests, or coverage (descriptions are inert props; the demo has no test suite).
