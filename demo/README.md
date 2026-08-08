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
| **Basic** | A static greeting card; the page is described as data and nothing is interactive. |
| **Form** | Editable fields with an edit/save/cancel flow. |
| **Actions** | A button that records the current time and shows it on the page. |
| **Large (1000)** | 1,000 editable rows; typing updates only the cell being edited. |
| **Table** | A 1,000-row HTML table with a header row and editable cells. |
| **Switch** | One panel that swaps between loading, loaded, and error views. |
| **Detail Modal** | Click a row to load its details from a simulated server into a popup. |
| **Two Store** | Settings on the left update a preview on the right only when you click Apply. |
| **Feature Flags** | A dashboard of feature toggles, rollout sliders, and an environment picker. |
| **Translations** | Editable translation strings, one key per row. |
| **Drag & Drop** | Sortable table: drag to reorder, plus add, remove, and edit. |
| **Mantine Table** | Paginated table, 300 rows with 10 per page. |
| **Dynamic Columns** | A table whose columns are decided at runtime; switching datasets changes the column set. |
| **Nested Repeat** | Categories with editable items inside each category. |
| **Named Slots** | A page layout assembled from named areas, plus cards generated from a list. |
| **DOCX Export** | Edit data, then export it as a Word document. |
| **XLSX Export** | Edit data, then export it as a spreadsheet. |
| **Nested Package** | The same feature embedded twice in one page plus a standalone copy, each with its own data. |
| **Store Debug** | A store wrapped in a logging decorator; every write shows up in a floating debug window (opened from the corner button) with its path, previous value, and new value. Poke the store from the console via `window.__store` — console writes land in the log too. |

## Performance verification

1. Open **React DevTools Profiler**.
2. Open the **Large (1000)** case.
3. Start profiling, type in one cell, stop.
4. The flamegraph shows **one** `BoundField` re-render — not 1000.
5. The `RepeatChildren` container re-runs its `.map` (cheap), but `ElementRenderer` wrappers skip (memo'd with stable props).

Or install **React Scan** in the browser to visualize re-renders as colored borders.
