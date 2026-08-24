## 1. CaseContainer source link

- [x] 1.1 Add optional `sourceFolder` prop to `demo/src/components/CaseContainer.tsx`; when present and non-empty, render a "View source on GitHub" Mantine `Anchor` (`target="_blank"`, `rel="noopener noreferrer"`) pointing at `https://github.com/ypyl/thin-render/tree/master/demo/src/cases/<sourceFolder>`, placed in the header area next to the title.
- [x] 1.2 Add a unit test in the demo test suite covering: `sourceFolder` present → link renders with the correct href; `sourceFolder` absent → no link; `sourceFolder: ""` → no link.

## 2. Link every case to its own folder

- [x] 2.1 Add `sourceFolder` (equal to the case's folder name) to the root `CaseContainer` props in every `demo/src/cases/<name>/spec.json` (basic, form, actions, large, table, switch, detail-modal, two-store, feature-flags, translations, dnd-table, mantine-table, dynamic-columns, stacked-tables, nested-repeat, named-slots, docx-export, xlsx-export, nested-package, store-debug). For any case whose root metadata is authored via its component rather than a spec, set `sourceFolder` there instead so it still renders.

## 3. Docs in sync

- [x] 3.1 Update `README.md` and `demo/README.md` where useful to note each case links to its source folder on GitHub (case count and API surface unchanged — update only wording, not the numbers or tables).

## 4. Verify

- [x] 4.1 Run `npm test`.
- [x] 4.2 Run `npm run coverage` (100 % thresholds must pass).
- [x] 4.3 Start the demo and confirm each case page shows the "View source on GitHub" link pointing to the correct subfolder.
