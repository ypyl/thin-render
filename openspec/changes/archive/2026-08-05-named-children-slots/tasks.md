# Named Children (Slots) — Tasks

## 1. Library types

- [x] 1.1 Update `UIElement.children` in `src/spec.ts` to `string[] | Record<string, string | string[]>` (consider a `SlotMap` type alias; export it if it helps consumers)
- [x] 1.2 Add `slots?: Record<string, ReactNode>` to `ComponentProps` in `src/renderer.tsx`

## 2. React renderer

- [x] 2.1 `_ElementRenderer`: branch on children shape — array form builds `children` (unchanged), record form builds `slots: Record<string, ReactNode>` (each slot a fragment of `_ElementRenderer`s keyed by spec element key) and leaves `children` undefined
- [x] 2.2 Pass `slots` through `createElement` props; ensure `slots` is `undefined` for array form
- [x] 2.3 `RepeatChildren`: accept both children shapes; for record form build per-item `slots` (each slot scoped to the item's `RepeatScope`)

## 3. Generic renderer

- [x] 3.1 Add `slots?: Record<string, unknown[]>` to `RenderContext` in `src/renderer-generic.ts`
- [x] 3.2 `walk`: record form renders into `ctx.slots` with `children = []`; under `repeat`, concatenate each slot's results across items in iteration order

## 4. Tests (100% coverage enforced)

- [x] 4.1 `renderer.test.tsx`: record form populates slots; arrays-per-slot render in order; record + repeat builds per-item slots; missing key inside a slot warns and is skipped; empty record → `slots = {}`; `children` undefined when slots present; `slots` undefined for array form
- [x] 4.2 `renderer-generic.test.ts`: record form → `children = []` + `ctx.slots` populated; repeat + record concatenates per-slot results; slot with missing child key warns and renders null; slot values keep order
- [x] 4.3 Run `npm test` and `npm run coverage` — all suites pass with 100% line/branch/function/statement coverage

## 5. Demo: Switch rewrite

- [x] 5.1 Rewrite `demo/src/components/Switch.tsx` to select via `slots?.[value]` (delete `Children.toArray` + `.$` key-matching)
- [x] 5.2 Update switch demo `spec.json`: `children` becomes `{ loading: "loading", loaded: "loaded", error: "error" }`; update `technicalDescription` (features list: slot-based switching)

## 6. Demo: named-slots layout case

- [x] 6.1 Create `demo/src/cases/named-slots/` (spec.json + registry + a Page/Layout component rendering header/sidebar/content/footer slots at different positions; wire into App.tsx and HomePage.tsx)
- [x] 6.2 Demo builds cleanly: `npm run build` in `demo/` passes

## 7. Docs (keep in sync per AGENTS.md)

- [x] 7.1 `LLM.md`: UIElement type table (`children` two forms), Component Contract (`slots`), rewrite Pattern 5 (Switch via slots), add a named-slots layout pattern; Expression Matrix untouched
- [x] 7.2 `README.md` and `demo/README.md`: API tables (children/slots), demo tables (named-slots case row, switch row updated), case count updated

## 8. Final validation

- [x] 8.1 `openspec validate --changes named-children-slots` passes
- [x] 8.2 Full `npm test` + `npm run coverage` re-run green after all edits; spot-check the named-slots and switch demos in the browser (dev server)
