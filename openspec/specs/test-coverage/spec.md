## Purpose
The project runs its test suite with Vitest and enforces full coverage thresholds.

## Requirements

### Requirement: Vitest runs all tests
The project SHALL use Vitest as its test runner, replacing `node:test`. Running `npm test` SHALL execute all test files matching `src/**/*.test.ts` via `vitest run`.

#### Scenario: All existing tests pass
- **WHEN** `npm test` is executed
- **THEN** all 20 existing tests pass with unchanged assertions
- **AND** the exit code is 0

#### Scenario: Watch mode for development
- **WHEN** `npx vitest` is executed without arguments
- **THEN** Vitest enters watch mode, re-running tests on file changes

### Requirement: Coverage reports are generated
The project SHALL generate code coverage reports using `@vitest/coverage-v8`. Running `npm run coverage` SHALL produce a coverage summary and fail if thresholds are not met.

#### Scenario: Coverage meets thresholds
- **WHEN** `npm run coverage` is executed
- **THEN** coverage is reported for all source files in `src/` (excluding `spec.ts` and `index.ts`)
- **AND** the report shows 100% across all metrics

#### Scenario: Coverage falls below threshold
- **WHEN** code changes cause line coverage to drop below 35%
- **THEN** `npm run coverage` exits with a non-zero code
- **AND** the failing threshold is reported in the output

### Requirement: Tests import from source instead of inlining
Test files SHALL import functions under test from their source modules rather than inlining copies. This ensures coverage instrumentation tracks the actual source code.

#### Scenario: Store tests import from source
- **WHEN** `src/store.test.ts` is compiled and run
- **THEN** it imports `createStore`, `getByPath`, `immutableSetByPath`, `pathsOverlap` from `./store`
- **AND** no store logic is duplicated in the test file

#### Scenario: Action tests import from source
- **WHEN** `src/actions.test.ts` is compiled and run
- **THEN** it imports `resolveParams` from `thin-render` (or `./hooks`)
- **AND** it imports `getByPath`, `createStore` from `./store`
- **AND** no store logic is duplicated in the test file

### Requirement: resolveParams is part of the public API
The `resolveParams` function SHALL be exported from the library barrel (`src/index.ts`) so it can be imported and tested directly, and used by consumers writing custom action handlers.

#### Scenario: resolveParams is importable
- **WHEN** a consumer imports `resolveParams` from `"thin-render"`
- **THEN** the import resolves to the function defined in `src/hooks.ts`

### Requirement: Coverage thresholds are enforced
The Vitest configuration SHALL define coverage thresholds that fail the build when not met.

#### Scenario: Thresholds configured
- **WHEN** `vitest.config.ts` is read
- **THEN** it contains a `coverage.thresholds` object with at minimum: `lines: 100`, `functions: 100`, `branches: 100`, `statements: 100`
