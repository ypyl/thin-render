## Context

The DOCX Export demo established the pattern: separate React and output specs, shared store, plain-button export handler that calls `renderGeneric`. The XLSX case follows the same architecture. The `xlsx` package (SheetJS) is array-oriented rather than builder-oriented, so the registry functions produce plain arrays rather than object instances.

## Goals / Non-Goals

**Goals:**
- Showcase `renderGeneric` with the `xlsx` package in a runnable demo
- Share the exact same React preview spec and registry as the DOCX demo (table with BoundFields)
- Let users click "Download XLSX" to export the data to a spreadsheet

**Non-Goals:**
- Formulas, number formatting, or multiple sheets — just export table data
- Styling beyond basic column widths — minimal, readable output
- Extracting a shared utility from the DOCX and XLSX registries — duplication is fine

## Decisions

### Decision 1: Reuse the React preview from the DOCX demo

The React spec and registry are identical — same table with BoundFields for title/name/qty/price. The XLSX case imports them directly or duplicates them. Duplicating keeps each case fully self-contained and is consistent with how all other demo cases work.

### Decision 2: XLSX registry returns plain arrays, not objects

Unlike `docx` which uses constructors (`new Paragraph(...)`), `xlsx` wants arrays of arrays. The registry reflects this:

```ts
XlsxRow:  (_, children) => children           // already an array of cell values
XlsxCell: (props, ctx) => resolve(props.value, ctx)  // returns a scalar
SheetData: (_, children) => children.flat()   // identity, flattens repeated rows
```

The `Sheet` builder converts the final nested array to a worksheet. The `Workbook` builder assembles the workbook and triggers download.

### Decision 3: Download via manual Blob

`XLSX.writeFile()` is convenient but browser-dependent. Using `XLSX.write()` + manual `Blob` + download link is more reliable and matches the DOCX pattern.

### Decision 4: No header styling

The xlsx package supports cell styles but they require a more complex API. The first row is just data — bold headers add complexity without demonstrating anything new about `renderGeneric`. Users can see the column values and understand the structure.

## Risks / Trade-offs

- **Risk:** `xlsx` is a larger package (~1.5MB) than `docx`
  → **Mitigation:** Dev dependency only, not shipped with thin-render. Vite tree-shakes what it can.
- **Risk:** The `xlsx` package API is less type-safe than `docx`
  → **Mitigation:** The registry is ~25 lines; the surface area is tiny. `as any` casts handle the loose types.
