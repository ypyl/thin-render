## Why

The DOCX Export demo case showed how `renderGeneric` can drive a third-party document library. Excel is the other dominant business format — and its grid structure is an even more natural fit for spec-driven rendering than DOCX. A second export demo reinforces the "one store, multiple specs" pattern and makes the library's value clearer.

## What Changes

- Add a new demo case "XLSX Export" that renders a data table to a downloadable `.xlsx` file using `renderGeneric` + the `xlsx` package (SheetJS)
- Add `xlsx` as a dev dependency in `demo/`
- Add the case to the demo home page navigation

## Capabilities

<!-- No library capability changes — demo-only addition. -->

## Impact

- **New files**: `demo/src/cases/xlsx-export/XlsxExportCase.tsx`, `demo/src/cases/xlsx-export/spec.json`, `demo/src/cases/xlsx-export/registry.ts`, `demo/src/cases/xlsx-export/xlsxSpec.ts`, `demo/src/cases/xlsx-export/xlsxRegistry.ts`
- **Modified files**: `demo/src/App.tsx` (add route), `demo/src/HomePage.tsx` (add card), `demo/package.json` (add `xlsx` dev dep)
- **Dependencies**: Adds `xlsx` to demo dev dependencies only
- **Breaking changes**: None
