# npm-publish Specification

## Purpose
The package compiles to ESM JavaScript with type declarations and publishes to the npm registry via a tag-triggered GitHub Actions workflow.
## Requirements
### Requirement: Package compiles to ESM JavaScript with declarations
The project SHALL have a `tsconfig.build.json` that extends `tsconfig.json`, removes `noEmit`, and sets `outDir` to `dist` with `declaration: true`. Running `npm run build` SHALL invoke `tsc -p tsconfig.build.json` and produce `.js` and `.d.ts` files in `dist/` mirroring the `src/` structure. Relative imports in the compiled output SHALL use explicit `.js` extensions so Node's ESM loader can resolve them without a bundler.

#### Scenario: Build produces JavaScript output
- **WHEN** `npm run build` is executed
- **THEN** `dist/index.js` exists and contains valid ESM JavaScript
- **AND** `dist/index.d.ts` exists and contains type declarations
- **AND** all source modules (`hooks.js`, `store.js`, `renderer.js`, `contexts.js`) have corresponding `.js` and `.d.ts` files in `dist/`

#### Scenario: Build fails on type errors
- **WHEN** source code contains a TypeScript type error
- **THEN** `npm run build` exits with a non-zero code
- **AND** no `dist/` files are produced (or existing ones are cleaned)

#### Scenario: Compiled output resolves under Node ESM
- **WHEN** Node.js executes `node --input-type=module -e "import('./dist/index.js')"` against a fresh build
- **THEN** the import loads without `ERR_MODULE_NOT_FOUND`
- **AND** the module exposes the public exports (e.g. `createStore`, `useSelector`)

### Requirement: package.json exposes compiled entry points
The `package.json` SHALL include `exports`, `main`, `module`, and `types` fields pointing into `dist/`. The `exports` field SHALL map `"."` to the ESM entry with a `types` condition for TypeScript. The `files` field SHALL be set to `["dist", "LLM.md"]` to limit the published tarball to the compiled output and the agent reference guide.

#### Scenario: ESM import resolves to compiled output
- **WHEN** a consumer runs `import { createStore } from "thin-render"`
- **THEN** Node.js (or bundler) resolves to `dist/index.js`
- **AND** TypeScript resolves types from `dist/index.d.ts`

#### Scenario: Published tarball contains only dist
- **WHEN** `npm pack` is executed (dry-run of publish)
- **THEN** the generated `.tgz` contains only files under `dist/` plus `LLM.md`
- **AND** does NOT contain `src/`, `demo/`, `openspec/`, test files, or config files

### Requirement: Tests run before publish
The `package.json` SHALL define a `prepublishOnly` script that runs `npm test`, `npm run build`, and a direct Node ESM import check of the built output. The publish SHALL be blocked if tests fail, coverage drops below the configured thresholds, the build fails, or the ESM import check throws.

#### Scenario: Publish blocked by failing tests
- **WHEN** `npm publish` is executed and tests fail
- **THEN** the publish is aborted before any package is uploaded to the registry

#### Scenario: Publish proceeds with passing tests
- **WHEN** `npm publish` is executed and all tests pass, the build succeeds, and the ESM import check loads `dist/index.js`
- **THEN** the package is uploaded to the npm registry

### Requirement: GitHub Actions publishes on version tags
A workflow at `.github/workflows/publish.yml` SHALL trigger on tag pushes matching `v*`. It SHALL checkout the code, install dependencies, build, and publish to npm using the `NPM_TOKEN` secret.

#### Scenario: Tag push triggers publish
- **WHEN** a tag `v0.1.0` is pushed to the repository
- **THEN** the publish workflow runs
- **AND** `npm ci` installs dependencies
- **AND** `npm run build` compiles TypeScript
- **AND** `npm publish --access public` uploads to the npm registry

#### Scenario: Push without tag does not trigger publish
- **WHEN** a commit is pushed to `master` without a version tag
- **THEN** the publish workflow does NOT run

