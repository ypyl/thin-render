## Context

thin-render has 10 exported hooks/types. An LLM generating code needs to know: what to import, how to structure files, where each expression type is valid, and how the 4 building blocks compose. The existing documentation (README, Q&A.md) is human-oriented prose. An agent-oriented reference needs tables, constraints, and copy-paste patterns.

## Goals / Non-Goals

**Goals:**
- Create a single `LLM.md` file that ships with the npm package
- Cover the full public API surface in table format
- Include an expression constraint matrix (which expression works where)
- Provide 6 copy-paste patterns with complete code (spec JSON + TSX component + handler + store init)
- Include a minimal complete example
- Keep file under ~200 lines (dense, scannable)

**Non-Goals:**
- No duplication of README/Q&A.md prose
- No internal implementation details
- No philosophical explanations (that's what Q&A.md is for)

## Decisions

### Format: tables + code, minimal prose

Every section uses either a table or a code block. No paragraph longer than 2 sentences. The LLM scans for types and patterns, not explanations.

### Structure: 4 sections

1. **Concepts** — one ASCII diagram showing the 4 building blocks and how they connect
2. **API Reference** — types table, hooks table, handler contract, component contract
3. **Expression Matrix** — the 5-context × 3-expression constraint table, plus path syntax
4. **Patterns** — repeat, bound field, action button, watch validation, conditional render, modal — each with complete code. Ends with minimal app.

### Pattern code: complete but minimal

Each pattern shows exactly what an agent needs to write:
- The spec JSON snippet
- The registry component
- The handler function
- The store initialization

All patterns use consistent variable names (`spec`, `registry`, `store`, `handlers`) so the agent can compose them.

### Expression matrix: the heart of the file

A single table answers "can I use X here?":

| | `on.params` | `watch.params` | `repeat.path` | `watch.path` | `props` |
|---|:--:|:--:|:--:|:--:|:--:|
| `$state` | ✓ read-once | ✓ read-once | ✓ subscribes | ✗ | ✗ |
| `$item` | ✓ path str | ✓ path str | ✓ context | ✗ | ✗ |
| `$index` | ✓ number | ✓ number | ✗ | ✗ | ✗ |

### Placement: repo root `LLM.md`

Colocated with README.md and package.json. Included in npm publish via the existing `files` field (or added if missing). Consumers do `cp node_modules/thin-render/LLM.md ./AGENTS.md` or reference it directly.

## Risks / Trade-offs

- **Drift**: If the API changes, LLM.md must be updated. Mitigation: it's a reference sheet, not prose — updating a table row is mechanical.
- **Duplication**: Some content overlaps with README tables. Acceptable — different audiences, different formats.
