## 1. Setup

- [x] 1.1 Add `docx` to `demo/package.json` dev dependencies (`npm install --save-dev docx` in demo/)
- [x] 1.2 Create case directory `demo/src/cases/docx-export/`

## 2. React preview spec and registry

- [x] 2.1 Create `demo/src/cases/docx-export/spec.json` — React spec with CaseContainer, editable table with BoundFields, and ActionButton for export
- [x] 2.2 Create `demo/src/cases/docx-export/registry.ts` — React registry mapping spec types to existing shared components (CaseContainer, BoundField, Card, etc.)
- [x] 2.3 Create `demo/src/cases/docx-export/handlers.ts` — handler for the export action (skipped: export triggered via plain React button in case component, not spec action)

## 3. DOCX spec and registry

- [x] 3.1 Create `demo/src/cases/docx-export/docxSpec.ts` — DOCX spec describing the document structure (Document, Section, Heading, Table with repeat)
- [x] 3.2 Create `demo/src/cases/docx-export/docxRegistry.ts` — DOCX registry mapping types to `docx` builder functions

## 4. Case component

- [x] 4.1 Create `demo/src/cases/docx-export/DocxExportCase.tsx` — renders the React preview + "Download DOCX" button; handler calls `renderGeneric` with the DOCX spec/registry, then `Packer.toBlob` and triggers browser download

## 5. Routing and navigation

- [x] 5.1 Add route `/docx-export` to `demo/src/App.tsx`
- [x] 5.2 Add card entry to `CASES` array in `demo/src/HomePage.tsx`

## 6. Verification

- [x] 6.1 Run `npm run dev` in demo/ — verify the case renders and "Download DOCX" produces a valid `.docx` file
- [x] 6.2 Run `npm test` in root — verify 100% coverage is maintained (no library changes)
- [x] 6.3 Verify existing demo cases still work (no regressions in routing or existing cases)
