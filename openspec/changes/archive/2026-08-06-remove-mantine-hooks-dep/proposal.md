## Why

`@mantine/hooks` is listed in `demo/package.json` dependencies but is never imported anywhere in `demo/src`. It is a dead dependency of the demo app.

## What Changes

- Remove `@mantine/hooks` from `dependencies` in `demo/package.json`.
- Update the demo lockfile (`npm install` in `demo/`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Tooling-only change (`skip_specs: true`).

## Impact

- `demo/package.json` and `demo/package-lock.json`.
- No source or docs changes.
