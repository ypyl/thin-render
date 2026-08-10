# Agent Instructions

## OpenSpec workflow (REQUIRED for code changes)

All code changes to this library MUST go through the OpenSpec change workflow. Do not edit `src/`, `demo/`, tests, or the public API directly without a change proposal.

**Workflow:**

1. **Propose** — create a change with all artifacts in one step:
   - `/opsx-propose <name-or-description>` (or the `openspec-propose` skill)
   - Generates `openspec/changes/<name>/` with `proposal.md`, `specs/**/spec.md`, `design.md`, `tasks.md`
   - Validate with `openspec validate --changes <name>` before starting work
2. **Apply** — implement the tasks:
   - `/opsx-apply <name>` (or the `openspec-apply-change` skill)
   - Mark each task `- [x]` in `tasks.md` as it completes
   - Every task list MUST include running `npm test` and `npm run coverage` (100% thresholds enforced)
3. **Archive** — finalize when implementation is complete:
   - `/opsx-archive <name>` (or the `openspec-archive-change` skill)
   - Moves the change to `openspec/changes/archive/` and merges specs into `openspec/specs/`

**Rules:**

- Use `openspec status --change <name>` and `openspec instructions <artifact> --change <name>` before writing artifacts — the CLI owns the canonical paths and build order
- Specs are behavior contracts: SHALL/MUST requirements, each with `#### Scenario:` blocks (WHEN/THEN). Implementation details belong in `design.md`, not specs
- Check `openspec/specs/` for existing capabilities before filling the proposal's Capabilities section — reuse or modify, don't duplicate
- Read dependency artifacts before creating the next one (proposal → specs/design → tasks)
- Any change that touches documented behavior must also update `README.md` and `LLM.md` per the sections below

**Exceptions:** trivial fixes (typos, formatting, docs-only edits) can skip the full proposal, but still update docs in sync and mention the change.

## READMEs

When making changes that affect documented behavior, keep any affected README files in sync (`README.md` **and** `demo/README.md`):

- **Demo cases added/removed** → update the demo section
- **API surface changes** → update hook signatures, types, or component tables
- **Line count or test count changes** → update the numbers
- **New capabilities or architectural changes** → update the relevant sections
- **New live URLs or links** → add them

### Demo cases MUST stay in sync

Every demo case under `demo/src/cases/` MUST be listed in the demo tables of both `README.md` and `demo/README.md` (name, what-it-shows, and source file links), and every row in those tables MUST correspond to a real case registered in `demo/src/App.tsx`. The stated case count must match the actual number of routes. A case is only "done" when its table rows and count are updated in the same change that adds/removes it — never leave the README for a later cleanup.

### Public API MUST stay in sync

Every export from `src/index.ts` MUST appear in the API tables of `README.md` and `LLM.md`, and every API documented there MUST actually be exported. When the public API changes (new/removed/renamed exports, changed signatures or contracts), update the tables, hooks, and patterns in the same change.

When in doubt, re-read the README after a change and fix anything that drifted. Cross-check demo tables against `demo/src/cases/` and API tables against `src/index.ts`.

## LLM.md

**LLM.md is the agent-facing reference for the library** — it ships with the npm package so consumers can copy it into their agent config. When making changes that affect the public API or usage patterns, keep LLM.md in sync:

- **New exports** (hooks, types, components) → add to the API Reference tables
- **Changed hook signatures or contracts** → update the tables and patterns
- **New expression behavior or constraints** → update the Expression Matrix
- **New common patterns** → add to the Patterns section
- **Removed or renamed APIs** → remove or update across all sections

The Expression Matrix is the single source of truth for "what goes where" — if a constraint changes (e.g., `$item` becomes valid in a new context), the matrix must reflect it.

**LLM.md and `README.md` API sections MUST stay in sync with each other and with `src/index.ts`** — any public API change updates all three in the same change.

When in doubt, diff LLM.md against `src/index.ts` and the expression resolution code in `src/hooks.ts` after any API change.

## Publishing (npm)

Publishing is **tag-triggered via GitHub Actions** — never run `npm publish` locally as the primary path. The local `~/.npmrc` token can be stale/expired; the workflow uses the repo's `NPM_TOKEN` secret instead.

**Flow:**

1. **Bump the version** — `npm version <semver>` (e.g. `npm version 0.12.0`). Minor for new features, patch for bugfixes; this updates `package.json` + `package-lock.json`, creates the `0.12.0` commit, and the `v0.12.0` tag.
2. **Push to BOTH remotes** — `nas` (primary, keeps the NAS mirror in sync) and `origin` (GitHub, triggers the workflows):
   ```bash
   git push nas master && git push nas v0.12.0
   git push origin master && git push origin v0.12.0
   ```
3. **The tag push to `origin` triggers `Publish to npm`** (`.github/workflows/publish.yml`, on tags `v*`): `npm ci` → `npm run build` → `npm publish --access public`. The `master` push also triggers `Deploy to GitHub Pages` (demo site) — expected, not a failure.
4. **Verify** the publish succeeded:
   ```bash
   npm view thin-render version          # should show the new version
   gh run list --repo ypyl/thin-render   # Publish to npm run should be green
   gh run watch <run-id> --exit-status   # follow a run to completion
   ```
   Optionally `npm pack thin-render@<version>` and inspect the tarball (must contain `dist/` and `LLM.md`).

**Rules:**

- Semver: 0.x line — minor for features (`0.11.0` → `0.12.0`), patch for bugfixes. Breaking changes bump the minor in 0.x per convention — discuss first.
- Never change the package name.
- Direct `npm publish` from this machine only if needed after a fresh `npm login` (the token in `~/.npmrc` expires); the canonical path is the tag-triggered workflow.
