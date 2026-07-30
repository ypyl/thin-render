## Context

The demo app currently has 13 cases, all showcasing the React `<Renderer>`. The new `renderGeneric` API has no demo. The natural demo is a data table with an "Export to DOCX" button — showing the React renderer for interactive preview and `renderGeneric` for document generation, both consuming the same store.

Existing patterns: each case has a folder under `demo/src/cases/<name>/` with a `Case.tsx` component, a `spec.json`, a `registry.ts`, and optionally `handlers.ts`. Routes are in `App.tsx`, navigation cards in `HomePage.tsx`.

## Goals / Non-Goals

**Goals:**
- Showcase `renderGeneric` with the `docx` npm package in a runnable demo
- Let users edit data in a React-powered table, then click "Download DOCX" to export
- Follow existing demo case conventions (folder structure, CaseContainer, routing)

**Non-Goals:**
- A full document editor — just a simple table + download
- Supporting multiple DOCX templates — one spec, one export format
- Adding `docx` to the thin-render library dependencies — it's a demo dev dep only

## Decisions

### Decision 1: Single case with two specs — not one spec for both React and DOCX

**Rationale:** The React view has interactive elements (BoundField, EditToggle, ActionButton) that don't translate to DOCX. The DOCX spec has document structure (Document, Section, Paragraph, Table) that doesn't translate to React. Two separate specs sharing one store is the demonstrated pattern from the `add-generic-renderer` design.

### Decision 2: The DOCX spec lives in a `.ts` file, not `.json`

**Rationale:** Unlike React specs, the DOCX spec won't be loaded as JSON since it's generated programmatically. However, following the existing JSON-spec-based patterns keeps things consistent. The DOCX spec will be a `.ts` file exporting a `Spec` object (similar to how `buildSpec.ts` works in other cases) so it can reference the thin-render types.

Actually — the simplest approach: put the spec inline in the case component or in a `buildSpec.ts`, since it doesn't need to be separate JSON. Following the pattern of `large/buildSpec.ts`, `table/buildSpec.ts`, etc. which export `Spec` objects.

### Decision 3: Use CaseContainer for both the React view and the export button

The React side renders a spec with a `CaseContainer` → data table using `repeat`. A "Download DOCX" button sits inside the CaseContainer (or as a sibling ActionButton in the spec). The button triggers a handler that calls `renderGeneric` + `Packer.toBlob` + triggers download.

**Alternative:** Button outside the spec, as a plain React button in the Case component. Simpler, and the export action isn't really a spec concern — it's a demo-level feature.

→ **Chosen:** Button as a plain React element in the case component. The spec-based React view shows the preview. The case component renders the preview + an export button above it.

### Decision 4: Data model — a simple report table

```ts
store = createStore({
  title: "Q3 Sales Report",
  rows: [
    { name: "Widgets", qty: 120, price: 9.99 },
    { name: "Gadgets", qty: 45, price: 24.50 },
    { name: "Doodads", qty: 200, price: 3.75 },
  ],
  generatedAt: null,  // set on export
});
```

The React spec renders this as a table with BoundFields for editing. The DOCX spec renders it as a document with a heading + table.

### Decision 5: DOCX registry — inline builders

The DOCX registry functions will use the `docx` package directly. Each function creates the corresponding `docx` object. The renderer handles tree walking; the registry just maps types to constructors.

### Decision 6: File download approach

Use `Packer.toBlob(doc)` to get a Blob, then create an object URL and trigger a download via a temporary `<a>` element. This is standard browser file download — no server needed.

## Risks / Trade-offs

- **Risk:** `docx` package adds ~2MB to demo node_modules
  → **Mitigation:** Dev dependency only, not shipped with thin-render. Acceptable for a demo.
- **Risk:** GitHub Pages build might need the `docx` package
  → **Mitigation:** Already handled — demo is built with Vite, `docx` will be bundled as part of the demo build.
