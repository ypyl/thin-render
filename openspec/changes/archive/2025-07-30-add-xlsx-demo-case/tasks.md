## 1. Setup

- [x] 1.1 Add `xlsx` to `demo/package.json` dev dependencies (`npm install --save-dev xlsx` in demo/)
- [x] 1.2 Create case directory `demo/src/cases/xlsx-export/`

## 2. React preview

- [x] 2.1 Copy the React spec from the DOCX demo — same editable table with BoundFields (or create a fresh `spec.json` with the same structure)
- [x] 2.2 Create `demo/src/cases/xlsx-export/registry.ts` — React registry mapping spec types to shared components (CaseContainer, BoundField, Table, THead, TBody, Tr, Th, Td)

## 3. XLSX spec and registry

- [x] 3.1 Create `demo/src/cases/xlsx-export/xlsxSpec.ts` — XLSX spec with Workbook → Sheet → [headerRow, tableBody] → repeat rows → cells
- [x] 3.2 Create `demo/src/cases/xlsx-export/xlsxRegistry.ts` — XLSX registry mapping types to xlsx builder functions with resolve helper

## 4. Case component

- [x] 4.1 Create `demo/src/cases/xlsx-export/XlsxExportCase.tsx` — renders React preview + "Download XLSX" button; handler calls `renderGeneric` with the XLSX spec/registry, then `XLSX.write` + Blob download

## 5. Routing and navigation

- [x] 5.1 Add route `/xlsx-export` to `demo/src/App.tsx`
- [x] 5.2 Add card entry to `CASES` array in `demo/src/HomePage.tsx`

## 6. Verification

- [x] 6.1 Run demo — verify the case renders and "Download XLSX" produces a valid `.xlsx` file
- [x] 6.2 Run `npm test` in root — verify 100% coverage is maintained (no library changes)
