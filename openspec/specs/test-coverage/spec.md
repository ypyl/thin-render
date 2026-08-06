## Purpose
The project runs its test suite with Vitest and enforces full coverage thresholds.

## Requirements

### Requirement: Vitest runs all tests
The project SHALL use Vitest as its test runner. Running `npm test` SHALL execute all test files matching `src/**/*.test.ts` (and `.test.tsx`) via `vitest run`.

#### Scenario: All existing tests pass
- **WHEN** `npm test` is executed
- **THEN** all existing tests pass with unchanged assertions
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
- **WHEN** code changes cause line coverage to drop below 100%
- **THEN** `npm run coverage` exits with a non-zero code
- **AND** the failing threshold is reported in the output

### Requirement: Tests import from source instead of inlining
Test files SHALL import functions under test from their source modules rather than inlining copies. This ensures coverage instrumentation tracks the actual source code. The one exception is `src/actions.test.ts`, which inlines the built-in `setState` handler body to stay React-free (the handler lives in `src/contexts.tsx`).

#### Scenario: Store tests import from source
- **WHEN** `src/store.test.ts` is compiled and run
- **THEN** it imports `createStore`, `getByPath`, `immutableSetByPath`, `pathsOverlap` from `./store`
- **AND** no store logic is duplicated in the test file

#### Scenario: Action tests import from source
- **WHEN** `src/actions.test.ts` is compiled and run
- **THEN** it imports `getByPath` and `createStore` from `./store`
- **AND** the only inlined logic is the built-in `setState` handler body, kept React-free by design

### Requirement: Coverage thresholds are enforced
The Vitest configuration SHALL define coverage thresholds that fail the build when not met.

#### Scenario: Thresholds configured
- **WHEN** `vitest.config.ts` is read
- **THEN** it contains a `coverage.thresholds` object with at minimum: `lines: 100`, `functions: 100`, `branches: 100`, `statements: 100`
