## 1. Remove Exports from index.ts

- [x] 1.1 Remove spec types: UIElement, ActionBinding, OnMap, WatchMap, RepeatConfig, ItemExpression, StateExpression
- [x] 1.2 Remove store internals: immutableSetByPath, StoreOptions, Listener
- [x] 1.3 Remove context internals: StoreContext, StoreProvider, ActionContext, ActionProvider, ActionContextValue
- [x] 1.4 Remove internal hooks: resolveParams, useRepeatIndex, useItemPath

## 2. Update Documentation

- [x] 2.1 Update README.md hooks table — remove useRepeatIndex, useItemPath
- [x] 2.2 Update LLM.md hooks table and import example
- [x] 2.3 Update Q&A.md — replace useItemPath references with manual resolution pattern, update type references to describe behavior not imports
- [x] 2.4 Update AGENTS.md sync rules for new export list

## 3. Verification

- [x] 3.1 Run `npm test` to confirm no regressions
- [x] 3.2 Verify demo builds (`npx tsc --noEmit` in demo/)
