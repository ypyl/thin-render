## Why

`playwright` is listed in the root `package.json` devDependencies but has zero usage anywhere in the repo (no tests, no scripts, no config files reference it). It is a dead dependency that only inflates install time and lockfile size.

## What Changes

- Remove `playwright` from `devDependencies` in `package.json`.
- Update `package-lock.json` accordingly (`npm install` after the edit).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Tooling-only change (`skip_specs: true`).

## Impact

- `package.json`, `package-lock.json` — remove the entry.
- No source, test, or docs changes.
