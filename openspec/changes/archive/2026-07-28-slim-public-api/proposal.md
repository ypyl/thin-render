## Why

thin-render's public API surface is 35 exports. An audit against the demo codebase reveals only 14 values/types are actually imported by consumers. The remaining 21 are internal implementation details: spec type aliases users never reference in TypeScript (they write JSON), store internals, React context providers, and helper hooks with no consumer usage.

A ~900-line library should not export more things than it has source lines. Slimming the public surface makes the library easier to understand, reduces the API table size, and keeps internals free to change.

## What Changes

- **BREAKING**: Remove 16 internal-only exports from the public API:
  - Spec types: `UIElement`, `ActionBinding`, `OnMap`, `WatchMap`, `RepeatConfig`, `ItemExpression`, `StateExpression`
  - Store internals: `immutableSetByPath`, `StoreOptions`, `Listener`
  - Context internals: `StoreContext`, `StoreProvider`, `ActionContext`, `ActionProvider`, `ActionContextValue`
  - Internal hooks: `resolveParams`, `useRepeatIndex`, `useItemPath`
- Update `README.md`, `LLM.md`, and `Q&A.md` to reflect the reduced surface
- Update `AGENTS.md` sync rules for the new export list

## Capabilities

### New Capabilities
<!-- None — API surface reduction -->

### Modified Capabilities
<!-- None -->

## Impact

- **BREAKING**: 16 exports removed — any code importing them will fail to compile
- Affected files: `src/index.ts`, `README.md`, `LLM.md`, `Q&A.md`, `AGENTS.md`
- Consumer mitigation: none needed — no demo code imports any of the removed exports
