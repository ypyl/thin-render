## Why

`renderGeneric` was just added to thin-render but has no demo case showing it in action. Users need a concrete, runnable example that demonstrates rendering a spec to DOCX with data from a store and downloading the result — the most compelling use case for the generic renderer.

## What Changes

- Add a new demo case "DOCX Export" that renders a data table to a downloadable `.docx` file using `renderGeneric` + the `docx` npm package
- Add `docx` as a dev dependency in `demo/`
- Add the case to the demo home page navigation

## Capabilities

<!-- No library capability changes — this is a demo-only addition. -->

## Impact

- **New files**: `demo/src/cases/docx-export/DocxExportCase.tsx`, `demo/src/cases/docx-export/spec.json`, `demo/src/cases/docx-export/registry.ts`
- **Modified files**: `demo/src/HomePage.tsx` (add navigation entry), `demo/package.json` (add `docx` dev dependency)
- **Dependencies**: Adds `docx` to demo dev dependencies only — no effect on the thin-render library
- **Breaking changes**: None
