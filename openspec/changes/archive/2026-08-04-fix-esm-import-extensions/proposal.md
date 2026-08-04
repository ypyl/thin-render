## Why

The published package (`"type": "module"`, `exports` → `dist/index.js`) contains extensionless relative imports (`./store`, `./hooks`, …) because `tsc` emits what the source wrote. Node's ESM loader requires explicit extensions, so `import { createStore } from "thin-render"` in Node throws `ERR_MODULE_NOT_FOUND`. Verified against both `0.6.0` and `0.7.0` tarballs — a pre-existing packaging defect that violates the `npm-publish` spec's "ESM import resolves to compiled output" scenario. Bundler consumers (Vite/webpack) are unaffected.

## What Changes

- Add explicit `.js` extensions to all relative imports in `src/` (TypeScript resolves `./store.js` → `store.ts`/`store.tsx`; bundlers and Node ESM both accept the compiled output).
- Extend the `prepublishOnly` script to build and then smoke-test a direct Node ESM import of `dist/index.js`, so the defect cannot silently return.
- No public API, behavior, or docs (README/LLM.md) changes — the hooks and exports are untouched.
- Follow-up release: bump to `0.7.1` and publish once archived.

## Capabilities

### New Capabilities
<!-- None — bug fix on an existing capability. -->

### Modified Capabilities
- `npm-publish`: the ESM-output and pre-publish requirements gain explicit Node ESM resolution guarantees (compiled output uses explicit `.js` extensions; pre-publish runs an ESM import smoke check).

## Impact

- `src/*.ts(x)` — relative import specifiers gain `.js` extensions (no logic changes).
- `package.json` — `prepublishOnly` extended with build + Node ESM import check.
- `openspec/specs/npm-publish/spec.md` — modified requirements via this change's delta.
- Version bump + publish (`0.7.1`) after archive.
