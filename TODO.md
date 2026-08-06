# TODO: ponytail audit findings

Findings from the ponytail audit (2026-08-06), ranked biggest cut first.
Each item should be implemented through the OpenSpec workflow
(`/opsx-propose` -> `/opsx-apply` -> `/opsx-archive`) and keep README.md,
demo/README.md, and LLM.md in sync where the public API changes.

## Cuts

- [x] 1. **Delete `useItemPath`** — zero production callers, not exported
      from `src/index.ts`, not documented. Only its own tests use it.
      Cut the hook in `src/hooks.ts` and its tests in `src/hooks.test.tsx`
      (around line 363). Replacement: nothing.

- [ ] 2. **Delete `resolveParams`** — a one-line delegate to
      `resolveExpressions` with a single production caller (`useEmit` in
      `src/hooks.ts`). Call `resolveExpressions` directly in `useEmit` and
      remove the `resolveParams` tests in `src/actions.test.ts`. Not
      exported, not documented. Replacement: nothing.

- [ ] 3. **Delete `debug`/`log` `StoreOptions`** — undocumented, no consumer
      in the library, demo, or docs; kept alive only by its own tests.
      Drop the `options` parameter of `createStore` in `src/store.ts`
      (nothing passes it) and remove its tests in `src/store.test.ts`
      (around line 253). `StoreOptions` is not exported.

- [ ] 4. **Remove `playwright` devDependency** — zero usage anywhere in the
      repo. Remove from `package.json` devDependencies.

- [ ] 5. **Remove `@mantine/hooks` demo dependency** — zero imports in
      `demo/src`. Remove from `demo/package.json` dependencies.

- [ ] 6. **Remove `Renderer` `loading` prop** — documented in README
      (line 193) and tested, but no demo passes it; vestigial from the
      removed watch/streaming feature. **BREAKING**: remove the prop from
      `RendererProps` in `src/renderer.tsx`, update the README API table,
      and drop the related tests in `src/renderer.test.tsx` (around
      lines 77-109).

- [ ] 7. **Shrink `useBound`** — the `set` wrapper around `setRaw` is
      redundant: `setRaw` is already stable (`useCallback` on
      `[store, path]`) and its `(value: unknown) => void` type is
      assignable to the returned `(value: T) => void`. Return `setRaw`
      directly in `src/hooks.ts`.

## Review (correctness, out of audit scope)

- [ ] 8. **Check `resolveExpressions` `$item` semantics** — the doc comment
      for `{ $item: "" }` says "reads store value at scope" but the code
      returns the path string. Decide which is intended and fix the comment
      or the code in `src/expressions.ts`.
