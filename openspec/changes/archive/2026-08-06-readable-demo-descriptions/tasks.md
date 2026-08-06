## 1. Rewrite demo case descriptions

- [x] 1.1 Rewrite the `description` and `technicalDescription` props of the `CaseContainer` in the 10 `spec.json`-based cases (basic, form, actions, switch, dynamic-columns, nested-repeat, named-slots, docx-export, xlsx-export, nested-package incl. its child `spec.json`) in plain newcomer-friendly language — no component names, API names, expression syntax, or implementation details
- [x] 1.2 Rewrite the same props in the 8 `buildSpec.ts`-based cases (table, detail-modal, two-store — both `buildPreviewSpec.ts` and `buildSettingsSpec.ts` —, feature-flags, translations, large, dnd-table, mantine-table), keeping the JSON structure and escaping intact

## 2. Rewrite the landing page cards

- [x] 2.1 Rewrite all 18 card descriptions in `demo/src/HomePage.tsx` in the same plain style (1–2 sentences: what the demo shows and what the visitor can try)

## 3. Update README demo tables

- [x] 3.1 Update the "What it shows" column of all 18 rows in the `README.md` demo table, keeping the source file links and case count unchanged
- [x] 3.2 Update the "What it shows" column of all 18 rows in the `demo/README.md` demo table

## 4. Verify

- [x] 4.1 Forbidden-token check: grep all four description locations for component names (`BoundField`, `CaseContainer`, `Renderer`, `Switch`, `EditToggle`, `ActionButton`, ...), API names (`useBound`, `useValue`, `usePath`, `renderGeneric`, `createStoreView`, ...), and expression syntax (`$item`, `$index`, `{ $item:`, `repeat` as a directive, ...) — zero hits in descriptions
- [x] 4.2 Cross-check consistency: descriptions agree across HomePage cards, case pages, and both README tables; every table row corresponds to a real case in `demo/src/cases/` and a route in `demo/src/App.tsx`
- [x] 4.3 Run `npm test` — all tests pass
- [x] 4.4 Run `npm run coverage` — 100% thresholds still met
- [x] 4.5 Build the demo (`npm run build` in `demo/`) and verify a few case pages render their new description and "How it works" text
