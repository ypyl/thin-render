## 1. Core Implementation

- [x] 1.1 Add explicit `.js` extensions to all relative import specifiers in `src/` (non-test files: `expressions.ts`, `hooks.ts`, `index.ts`, `renderer-generic.ts`, `contexts.tsx`, `renderer.tsx`)
- [x] 1.2 Extend `prepublishOnly` in `package.json` to `npm test && npm run build && node --input-type=module -e "import('./dist/index.js')"`

## 2. Verification

- [x] 2.1 Run `npm run build` — dist produced; Node ESM import of `dist/index.js` succeeds (no `ERR_MODULE_NOT_FOUND`)
- [x] 2.2 Run `npm test` — all suites pass (Vitest resolves `.js`-extension imports into `.ts` sources)
- [x] 2.3 Run `npm run coverage` — 100% thresholds (lines/branches/functions/statements) enforced
- [x] 2.4 Run `openspec validate --changes fix-esm-import-extensions` — change validates cleanly
