## Context

See proposal.md — Why. The published tarball fails direct Node ESM import because `tsc` emits relative imports exactly as written in source (extensionless), and Node's ESM loader requires explicit `.js` extensions. Reproduced against `0.6.0` and `0.7.0` tarballs. `tsconfig.json` uses `module: "ESNext"`, `moduleResolution: "bundler"` — which accepts both extensionless and `.js`-extension relative imports, so the source can be fixed without config changes. Bundler consumers are unaffected either way; this fix targets Node ESM resolution only.

## Goals / Non-Goals

**Goals:**
- Make `import { createStore } from "thin-render"` work under Node ESM (no `ERR_MODULE_NOT_FOUND`).
- Guard the fix so the defect cannot silently return on future releases.

**Non-Goals:**
- Changing the build module system (no `NodeNext`, no dual CJS/ESM output, no bundler step).
- Changing public API, hooks, types, or documentation (README/LLM.md).
- Fixing the demo (bundled by Vite; unaffected).

## Decisions

**D1: Explicit `.js` extensions in source relative imports — not `moduleResolution: "NodeNext"`.**
TypeScript maps `./store.js` → `store.ts` (and `.tsx`) for type resolution, `tsc` emits the specifier verbatim, and both bundlers and Node ESM accept it. `moduleResolution: "bundler"` stays, so no other build behavior changes. Alternatives considered:
- *`module: "NodeNext"`*: forces extensions (same outcome) but changes emit semantics and module detection rules package-wide — larger blast radius for a one-line-per-import fix.
- *Post-build rewrite step*: patching `dist/` after `tsc` adds a fragile build-time script; source-level extensions are the standard, self-documenting fix.

**D2: `prepublishOnly` becomes test + build + Node ESM smoke check.**
`prepublishOnly: "npm test && npm run build && node --input-type=module -e \"import('./dist/index.js')\""` — the smoke check imports the built entry and throws on `ERR_MODULE_NOT_FOUND`, blocking publish exactly when the defect regresses. The publish workflow already runs `npm run build` before `npm publish`, and `npm publish` runs `prepublishOnly` locally in CI, so the guard is active in the existing pipeline. A bare import is sufficient — module evaluation is enough to prove resolution; export presence is a separate concern already covered by tests.

**D3: Only `src/` imports change; tests keep extensionless imports.**
Test files are not published and Vitest resolves both forms; changing them adds noise with no shipped benefit.

## Risks / Trade-offs

- [Vitest/Vite resolution of `.js`-extension imports into `.ts` sources] → Supported by Vite's resolver (standard pattern for ESM libraries); verified by running the full suite after the change.
- [Missed a relative import specifier in a non-obvious form] → Enumerated by grep (`from "./x"` / `from "./x"` in `src/` excluding tests) and verified by the Node ESM smoke check against a fresh build.
- [Coverage gate] → No logic changes; import specifiers do not alter statement/branch coverage. Full suite + coverage run in verification.

## Migration Plan

In-repo change; no consumer migration needed (this makes the existing contract actually hold). Rollback: revert the commit — extensionless imports build fine for bundler consumers.

## Open Questions

None.
