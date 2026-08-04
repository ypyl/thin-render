## MODIFIED Requirements

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

### Requirement: Tests run before publish
The `package.json` SHALL define a `prepublishOnly` script that runs `npm test`, `npm run build`, and a direct Node ESM import check of the built output. The publish SHALL be blocked if tests fail, coverage drops below the configured thresholds, the build fails, or the ESM import check throws.

#### Scenario: Publish blocked by failing tests
- **WHEN** `npm publish` is executed and tests fail
- **THEN** the publish is aborted before any package is uploaded to the registry

#### Scenario: Publish proceeds with passing tests
- **WHEN** `npm publish` is executed and all tests pass, the build succeeds, and the ESM import check loads `dist/index.js`
- **THEN** the package is uploaded to the npm registry
