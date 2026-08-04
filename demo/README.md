# thin-render demo

Demonstrates the `thin-render` library — a minimal spec-driven React renderer with
**granular per-path re-renders**. Editing one cell in a 1000-row table re-renders
only that one cell.

## Running

```bash
cd thin-render/demo
npm install    # first time
npm run dev    # starts at http://localhost:5173
```

## Cases

| Case | What it shows |
|------|---------------|
| **Basic** | Static spec → renders a paper card with text. No state, no reactivity. |
| **Form** | Two `BoundField` inputs bound to `/name` and `/email`. Edit/save/cancel lifecycle via handlers. |
| **Actions** | `ActionButton` wired to a `saveDoc` handler that writes a timestamp to the store. |
| **Large (1000)** | 1000 rows × 2 columns via `repeat`. Editing one cell re-renders exactly one `BoundField`. |
| **Table** | 1000-row HTML `<table>` with `<thead>`/`<tbody>` via `repeat` on `<tr>` elements. |
| **Switch** | Conditional rendering via `useValue` — three mutually-exclusive status views. |
| **Detail Modal** | Click a row → async handler loads detail data into a Modal via `LoadingBox`. |
| **Two Store** | Two stores, two Renderers side by side — cross-store handler updates preview on Apply. |
| **Feature Flags** | Dashboard with `ToggleField`, `SliderField`, `SegmentedField`, `Badge`, and `Alert`. |
| **Translations** | Editable translation strings via `repeat` on a plain object (not an array). |
| **Drag & Drop** | Sortable table with drag-and-drop reordering, add, remove, and edit/save/cancel. Powered by `@dnd-kit`. |
| **Mantine Table** | Mantine-styled table with `<Table>` + `<Pagination>` — 300 rows, 10 per page. Pagination state driven by store. |
| **Nested Repeat** | Two-level nested `repeat` — categories contain items; the inner repeat resolves `{ $item: "items" }` against the outer scope. |
| **DOCX Export** | Edit data in an interactive table, then export to a downloadable `.docx` via `renderGeneric` with separate React and DOCX specs. |
| **XLSX Export** | Edit data in a table, then export to a downloadable `.xlsx` via `renderGeneric` with the `xlsx` (SheetJS) package. |

## Performance verification

1. Open **React DevTools Profiler**.
2. Switch to the **Large (1000)** tab.
3. Start profiling, type in one cell, stop.
4. The flamegraph shows **one** `BoundField` re-render — not 1000.
5. The `RepeatChildren` container re-runs its `.map` (cheap), but `ElementRenderer` wrappers skip (memo'd with stable props).

Or install **React Scan** in the browser to visualize re-renders as colored borders.
