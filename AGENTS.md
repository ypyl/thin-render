# Agent Instructions

## READMEs

When making changes that affect documented behavior, keep any affected README files in sync:

- **Demo cases added/removed** → update the demo section
- **API surface changes** → update hook signatures, types, or component tables
- **Line count or test count changes** → update the numbers
- **New capabilities or architectural changes** → update the relevant sections
- **New live URLs or links** → add them

When in doubt, re-read the README after a change and fix anything that drifted.

## LLM.md

**LLM.md is the agent-facing reference for the library** — it ships with the npm package so consumers can copy it into their agent config. When making changes that affect the public API or usage patterns, keep LLM.md in sync:

- **New exports** (hooks, types, components) → add to the API Reference tables
- **Changed hook signatures or contracts** → update the tables and patterns
- **New expression behavior or constraints** → update the Expression Matrix
- **New common patterns** → add to the Patterns section
- **Removed or renamed APIs** → remove or update across all sections

The Expression Matrix is the single source of truth for "what goes where" — if a constraint changes (e.g., `$item` becomes valid in a new context), the matrix must reflect it.

When in doubt, diff LLM.md against `src/index.ts` and the expression resolution code in `src/hooks.ts` after any API change.
