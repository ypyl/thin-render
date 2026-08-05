## 1. Scope stack core (React renderer)

- [x] 1.1 Change `PathContext` value shape to `string[]` (innermost first) with default `[""]` in `src/contexts.tsx` — no public export change
- [x] 1.2 Update `RepeatScope` in `src/renderer.tsx` to read the current stack from `PathContext` and provide a fresh `[basePath, ...parentStack]` array (never mutate)
- [x] 1.3 Update the `Renderer` boundary in `src/renderer.tsx` to reset the stack to a fresh `[""]` root (nested-renderer wall preserved)
- [x] 1.4 Implement `usePath(offset = 0)` in `src/hooks.ts`: `stack[0]` by default, offset into the stack, negative/out-of-range offsets return `undefined`
- [x] 1.5 Verify resolution sites (`useItemPath`, `useResolvedPath` `$item` branch, relative-path composition in `useBound`/`useValue`/`useSetValue`) read only the innermost scope — no behavior change
- [x] 1.6 Update existing tests that touch `PathContext` shape (nested-renderer reset test at `src/renderer.test.tsx:471` and any hooks tests)
- [x] 1.7 Add tests: single/nested repeat stack contents, `usePath(0/1/2)` including root and beyond-depth offsets, negative offset, nested `Renderer` stack reset (`usePath()` → `""`, `usePath(1)` → `undefined`), relative binds and `$item` still resolve innermost-only

## 2. Generic renderer scope stack

- [x] 2.1 Thread a `scopes: string[]` array through `walk` in `src/renderer-generic.ts` (innermost first); repeat iteration passes `[childBase, ...scopes]`
- [x] 2.2 Add `scopes: string[]` to `RenderContext`; keep `ctx.basePath = scopes[0] ?? ""` — existing builders unaffected
- [x] 2.3 Add tests: `ctx.scopes` innermost-first in a nested repeat (rows × columns), `ctx.basePath` unchanged at root and inside repeats

## 3. Dynamic Columns Table demo case

- [x] 3.1 Create reusable `DataCell` component in `demo/src/components/DataCell.tsx`: reads column key from its own scope, value/bind from the parent scope via `usePath(1)`
- [x] 3.2 Create `demo/src/cases/dynamic-columns/` case: static spec (TBody repeats `/data`, Tr repeats `{ $state: "/meta/columns" }`), handlers that load records → `/data` + derived columns → `/meta/columns`, registry
- [x] 3.3 Register the case in `demo/src/App.tsx`
- [x] 3.4 Update README.md and demo/README.md demo tables with the new case and bump the case count (16 → 17)

## 4. Docs sync

- [x] 4.1 Update README.md: `usePath` signature in the hooks table and the Repeat section (parent-scope access via `usePath(offset)`)
- [x] 4.2 Update LLM.md: API Reference hook table and Pattern #9 — the static-spec two-repeat grid variant now works
- [x] 4.3 Update Q&A.md pattern entry: replace the "scope wall" explanation with the stack semantics and the two-repeat variant for runtime-column tables

## 5. Validation

- [x] 5.1 `npm test` passes
- [x] 5.2 `npm run coverage` passes at 100% thresholds
- [x] 5.3 `openspec validate --changes repeat-scope-stack` passes
- [x] 5.4 Demo builds and the Dynamic Columns case works in the browser (columns load, per-cell edits re-render only that cell)
