## Why

thin-render's API is small (~10 exported hooks/types) but the patterns for combining them are not obvious from the type signatures alone. A code agent (LLM) generating thin-render code needs a dense, table-driven reference that answers "what goes where" without reading prose documentation.

Shipping an `LLM.md` in the npm package lets consumers drop it into their agent's context (AGENTS.md, CLAUDE.md, .cursorrules) and get correct code generation immediately — no custom prompt engineering needed.

## What Changes

- Create `LLM.md` at the repo root with:
  - **Concepts**: 4 building blocks (Spec, Registry, Store, Handlers) — one diagram, one sentence each
  - **API Reference**: types, hooks, handler/component contracts in table format
  - **Expression Matrix**: `$state`/`$item`/`$index` — where each is valid (5-context constraint table)
  - **Patterns**: 6 copy-paste patterns (repeat, bound field, action button, watch, modal, conditional render) with spec + component + handler code
  - **Minimal complete example** at the end

## Capabilities

### New Capabilities
<!-- None — documentation-only change -->

### Modified Capabilities
<!-- None -->

## Impact

- New file: `LLM.md` (repo root, ships with npm package)
- No code changes, no API changes
- No changes to existing docs (README, Q&A.md, AGENTS.md)
