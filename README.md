# thin-render

A ~1,050-line spec-driven renderer with **granular per-path re-renders** for React components and a zero-dependency generic renderer for non-React targets (DOCX, PDF, CSV, etc.). Edit one cell in a 1000-row table — only that one cell's component re-renders.

Built as a minimal alternative to `@json-render/react`, dropping AI streaming, Zod validation, directives, devtools, and multi-framework output. Just the rendering core, a path-based store, an action system, and a generic renderer for non-React output.

**[Live demo →](https://ypyl.github.io/thin-render/)**

## Why

`@json-render/react` cascades re-renders across the entire element tree on any state change because three React contexts (`State`, `Visibility`, `Actions`) all subscribe to the full state. Editing one cell in a repeated structure re-renders every component. thin-render fixes this at the architecture level: the renderer subscribes to nothing, and leaf components subscribe to individual store paths via `useSyncExternalStore`.

## Architecture

```
┌──────────┐     ┌──────────────┐      ┌──────────────┐
│   Spec   │ ──▶ │  Renderer    │ ──▶ │  Registry    │
│ (JSON    │     │ (walks tree, │      │ (type →      │
│  tree)   │     │  builds emit)│      │  component)  │
└──────────┘     └──────┬───────┘      └──────────────┘
                        │
                 ┌──────▼───────┐
                 │    Store     │
                 │ (path-based, │
                 │  granular)   │
                 └──────┬───────┘
                        │
                 ┌──────▼───────┐
                 │   Handlers   │
                 │ (registered  │
                 │  at top)     │
                 └──────────────┘
```

### Key design invariants

- **StoreContext** holds the store *reference* — never the state value. It never changes, so `useContext` never triggers re-renders.
- **ActionContext** holds handler map + `getState`/`setState` — also stable. Dispatching an action never re-renders anything by itself.
- **ElementRenderer** is `React.memo`'d and subscribes to no state. It only re-renders when the spec changes.
- **Leaf components** subscribe to individual paths via `useBound()`/`useValue()` — each uses `useSyncExternalStore` with a per-path snapshot. Changing `/items/0/name` re-renders only the component subscribed to that exact path. Derived values use `useSelector(path, derive)` — the path is the subscription window (writes outside it never notify), and it re-renders only when the derived value changes.

## Quick start

```bash
cd demo
npm install
npm run dev     # http://localhost:5173
```

### Basic usage

```tsx
import { Renderer, createStore, type Spec, type Registry } from "thin-render";

// 1. Define a spec (what to render)
const spec: Spec = {
  root: "card",
  elements: {
    card: { type: "Card", props: { title: "Hello" }, children: ["greeting"] },
    greeting: { type: "StaticText", props: { text: "World" } },
  },
};

// 2. Build a registry (type → React component)
const registry: Registry = {
  Card: ({ element, children }) => <Paper>{children}</Paper>,
  StaticText: ({ element }) => <>{element.props?.text}</>,
};

// 3. Create a store (state lives here)
const store = createStore({});

// 4. Render
<Renderer spec={spec} registry={registry} store={store} />
```

### Two-way binding

Components use `useBound(path)` to read and write a single store path:

```tsx
import { useBound } from "thin-render";

function BoundField({ element }: ComponentProps) {
  const [value, setValue] = useBound<string>(String(element.props?.bind));
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}
```

The spec declares the path:

```json
{ "type": "BoundField", "props": { "bind": "/user/name", "label": "Name" } }
```

Changing this input writes to `/user/name` and re-renders *only* this `BoundField`.

### Actions

Register handlers at the top, dispatch from components via `emit`:

```tsx
// Handler (pure function of params + store API)
const handlers = {
  saveDoc: (params, { setState }) => {
    setState("/savedAt", new Date().toISOString());
  },
};

// Spec binds an event to the handler
const spec = {
  root: "btn",
  elements: {
    btn: {
      type: "ActionButton",
      props: { label: "Save" },
      on: { click: { action: "saveDoc" } },
    },
  },
};
```

The `emit("click")` closure is built per-element by the renderer, resolves params on-demand (read, not subscribe), and invokes the handler. Action params support:

- `{ $state: "/path" }` — reads the current value from the store
- `{ $item: "field" }` — resolves to the absolute state path (e.g., `/items/5/field`)
- `{ $item: "" }` — resolves to the repeat base path (e.g., `/items/5`)
- `{ $index: true }` — resolves to the numeric repeat index

Built-in `setState` action is always available: `{ action: "setState", params: { path: "/flag", value: true } }`.

### Repeat (arrays)

```json
{ "type": "Card", "repeat": { "path": "/items" }, "children": ["row"] }
```

Renders `row` once per item in `/items`. Inside a repeat, components can use `usePath()` to get the current item's base path (`/items/0`, `/items/1`, etc.) — which is automatically composed with relative paths like `useBound("name")` to read from `/items/0/name`. Nested repeats push onto a scope stack: `usePath(1)` reads the *parent* repeat's base path, enabling rows × columns grids from a fully static spec (see the **Dynamic Columns** demo case) — `usePath(n)` returns `undefined` beyond the stack.

For stable React keys across re-renders, provide a `key` field on the repeat config pointing to a unique field on each item (e.g., `"repeat": { "path": "/items", "key": "id" }`). Without it, the array index is used, which breaks on reorder or delete. The unique ID must come from your data — thin-render does not auto-generate IDs.

### Named slots (record-form children)

`children` also accepts a record form: slot names mapped to child element ids (or arrays of ids). The parent component renders each slot at a position of its choosing:

```json
{ "type": "Page", "children": {
  "header": "pageTitle",
  "sidebar": ["link1", "link2"],
  "content": "mainText",
  "footer": "pageFooter"
} }
```

```tsx
function Page({ slots }: ComponentProps) {
  return (
    <div>
      <header>{slots?.header}</header>
      <aside>{slots?.sidebar}</aside>
      <main>{slots?.content}</main>
      <footer>{slots?.footer}</footer>
    </div>
  );
}
```

Exactly one of `children`/`slots` is passed to a component, based on the children shape: array form → `children`, record form → `slots`. With `repeat` + record form, one component instance is created **per item**, each with its own slots scoped to the item's path. Slot names are never used as React keys (element keys are); do not reference the same child element id from two slots of the same element.

### Nested spec packages (store views)

A self-contained spec package (its own spec, registry, components, handlers) can be embedded inside a bigger spec at **multiple places** while sharing one store. The composition point is a boundary component registered in the parent registry:

1. **Resolve the occurrence's base path** from element props — a plain string (`"/widgets/0/data"`) or `{ $item: "field" }` relative to the parent's repeat scope via `usePath()`.
2. **Wrap the parent store** — `createStoreView(useStore(), base)` implements the `Store` interface with every path rebased onto `base`, so the child spec reads/writes its subtree as its own root. Writes land directly in the parent store (write-back with zero bridges); subscriptions delegate, so granularity is preserved.
3. **Bridge parent actions** — capture the parent's `ActionContext` via `useContext` (the boundary sits inside the parent's `ActionProvider`) and expose each parent handler under a `parent.<name>` namespace in the nested renderer's `handlers`. Params resolved in the child's world (child-scoped `$state` values) pass through untouched; the handler runs with the parent's accessors.
4. **Render** — a nested `<Renderer>` with the child's spec, registry, and the merged handler map (`{ ...childHandlers, ...bridge }`). The nested renderer already resets repeat scope and mounts fresh providers, so the child world is cleanly isolated.

The child spec fires parent actions with `action: "parent.<name>"` and self-identifies via its data (`params: { id: { $state: "/id" } }`). The same spec/registry renders standalone with a plain `createStore` store — only the store wiring differs (see the **Nested Package** demo case).

## API

### `<Renderer>`

> Source: [`renderer.tsx`](./src/renderer.tsx)

| Prop | Type | Description |
|------|------|-------------|
| `spec` | `Spec \| null` | The declarative UI tree |
| `registry` | `Registry` | `Record<string, ComponentType<ComponentProps>>` |
| `store` | `Store` | Created by `createStore()`, stable reference |
| `handlers` | `Handlers?` | `Record<string, Handler>` — action handlers |
| `loading` | `boolean?` | Suppresses missing-element warnings during streaming |

### Hooks

> Source: [`hooks.ts`](./src/hooks.ts), [`contexts.tsx`](./src/contexts.tsx)

| Hook | Signature | Description |
|------|-----------|-------------|
| `useBound<T>(path)` | `[T \| undefined, (v: T) => void]` | Two-way bind to a path |
| `useValue<T>(path)` | `T \| undefined` | Read-only subscription to a path |
| `useSelector<T>(path, derive)` | `T` | Subscribe to a **derived** value within a path window; re-renders only when the derived value changes |
| `useSetValue(path)` | `(v: unknown) => void` | Write-only setter for a path |
| `useStore()` | `Store` | The stable store; throws without a provider |
| `ActionContext` | React context | `{ handlers, getState, setState }` of the nearest `ActionProvider` — read via `useContext` inside boundary components to bridge parent actions into a nested renderer |
| `usePath(offset?)` | `string` | Current repeat scope's base path; `usePath(1)` returns the parent scope, `undefined` beyond the stack |

### Store & utilities

> Source: [`store.ts`](./src/store.ts)

| Export | Signature | Description |
|--------|-----------|-------------|
| `createStore(initial?)` | `Store` | Create a path-based external store |
| `createStoreView(store, basePath)` | `Store` | A path-prefixed **view** of a store: every path is rebased onto `basePath`, so a nested spec can treat a subtree as its own root — no data copies, subscriptions delegate with granularity preserved |
| `getByPath(state, path)` | `unknown` | Read a nested value from an object by path string |

`Store` instance methods:

| Method | Description |
|--------|-------------|
| `store.get(path)` | Read value at path |
| `store.set(path, value)` | Write path; no-op if value unchanged; notifies overlapping subscribers |
| `store.subscribe(path, fn)` | Register change listener; returns unsubscribe |
| `store.getState()` | Full state snapshot |

### `renderGeneric`

> Source: [`renderer-generic.ts`](./src/renderer-generic.ts)

A pure function that walks a spec tree, resolves `$state`/`$item`/`$index` in props, and calls user-provided builder functions — no React, no subscriptions, no JSX. Use it to generate DOCX, PDF, CSV, plain strings, or any format from the same spec schema and store.

| Export | Signature | Description |
|--------|-----------|-------------|
| `renderGeneric(spec, store, registry)` | `unknown` | Walk the spec, resolve expressions, call registry builders |
| `GenericRegistry` | `Record<string, (props, children, ctx) => unknown>` | Map of spec type → builder function |

```ts
import { renderGeneric, createStore, type Spec, type GenericRegistry } from "thin-render";
import { Document, Paragraph, TextRun, Packer } from "docx";

const store = createStore({ title: "Report", rows: [{ name: "Widget", qty: 42 }] });

const spec: Spec = {
  root: "doc",
  elements: {
    doc:   { type: "Document", children: ["section"] },
    section: { type: "Section", children: ["heading", "list"] },
    heading: { type: "Heading", props: { text: { $state: "/title" } } },
    list:  { type: "Table", repeat: { path: "/rows" }, children: ["row"] },
    row:   { type: "Row", children: ["name", "qty"] },
    name:  { type: "Cell", props: { text: { $item: "name" } } },
    qty:   { type: "Cell", props: { text: { $item: "qty" } } },
  },
};

const registry: GenericRegistry = {
  Document: (_p, children) => new Document({ sections: children }),
  Section:  (_p, children) => ({ children }),
  Heading:  (props) => new Paragraph({ text: String(props.text) }),
  Table:    (_p, children) => new Table({ rows: children }),
  Row:      (_p, children) => new TableRow({ children }),
  Cell:     (props) => new TableCell({ children: [new Paragraph(String(props.text))] }),
};

const doc = renderGeneric(spec, store, registry) as Document;
const blob = await Packer.toBlob(doc);
```

Registry functions receive resolved props (all `$state`/`$item`/`$index` already resolved to plain values) and rendered children as a flat array. For record-form children (named slots), `children` is `[]` and `ctx.slots` holds one entry per slot name (each an array of that slot's rendered results). The renderer handles repeat iteration, expression resolution, and tree walking — your registry just builds the output objects.

### Component contract (`ComponentProps`)

> Source: [`renderer.tsx`](./src/renderer.tsx)

```ts
interface ComponentProps {
  element: UIElement;          // current spec element
  children?: ReactNode;       // rendered children (array-form children only)
  slots?: Record<string, ReactNode>;  // rendered named slots (record-form children only)
  emit: (event: string) => void;  // dispatch bound actions
}
```

### Spec types

> Source: [`spec.ts`](./src/spec.ts)

```ts
interface Spec {
  root: string;
  elements: Record<string, UIElement>;
}

type SlotMap = Record<string, string | string[]>;  // slot name → child id(s)

interface UIElement {
  type: string;
  props?: Record<string, unknown>;
  children?: string[] | SlotMap;  // ordered children or named slots
  on?: Record<string, ActionBinding | ActionBinding[]>;
  repeat?: { path: string; key?: string };
}

interface ActionBinding {
  action: string;
  params?: Record<string, unknown>;  // $state, $item, $index expressions
}
```

## Demo

The demo app (`demo/`) has eighteen self-contained cases:

| Case | What it shows | Source |
|-----|---------------|--------|
| **Basic** | Static spec rendering | [`BasicCase.tsx`](./demo/src/cases/basic/BasicCase.tsx) · [`spec.json`](./demo/src/cases/basic/spec.json) · [`registry.ts`](./demo/src/cases/basic/registry.ts) |
| **Form** | `BoundField` inputs with read-only/editable toggle | [`FormCase.tsx`](./demo/src/cases/form/FormCase.tsx) · [`spec.json`](./demo/src/cases/form/spec.json) · [`handlers.ts`](./demo/src/cases/form/handlers.ts) · [`registry.ts`](./demo/src/cases/form/registry.ts) |
| **Actions** | `ActionButton` + handler writes timestamp to store | [`ActionsCase.tsx`](./demo/src/cases/actions/ActionsCase.tsx) · [`spec.json`](./demo/src/cases/actions/spec.json) · [`handlers.ts`](./demo/src/cases/actions/handlers.ts) · [`registry.ts`](./demo/src/cases/actions/registry.ts) |
| **Large (1000)** | 1000-row × 2-column editable table via `repeat` — edit one cell, only that cell re-renders. Per-row ✕ delete using `{ $index: true }`. | [`LargeCase.tsx`](./demo/src/cases/large/LargeCase.tsx) · [`buildSpec.ts`](./demo/src/cases/large/buildSpec.ts) · [`handlers.ts`](./demo/src/cases/large/handlers.ts) · [`registry.ts`](./demo/src/cases/large/registry.ts) |
| **Table** | 1000-row HTML `<table>` with `<thead>`/`<tbody>` structure built via `repeat` | [`TableCase.tsx`](./demo/src/cases/table/TableCase.tsx) · [`buildSpec.ts`](./demo/src/cases/table/buildSpec.ts) · [`handlers.ts`](./demo/src/cases/table/handlers.ts) · [`registry.ts`](./demo/src/cases/table/registry.ts) |
| **Switch** | Conditional rendering via named slots — three mutually-exclusive status views | [`SwitchCase.tsx`](./demo/src/cases/switch/SwitchCase.tsx) · [`spec.json`](./demo/src/cases/switch/spec.json) · [`handlers.ts`](./demo/src/cases/switch/handlers.ts) · [`registry.ts`](./demo/src/cases/switch/registry.ts) |
| **Detail Modal** | Click a table row → async handler simulates backend call → detail data loads into a separate store path and displays in a Modal | [`DetailModalCase.tsx`](./demo/src/cases/detail-modal/DetailModalCase.tsx) · [`buildSpec.ts`](./demo/src/cases/detail-modal/buildSpec.ts) · [`handlers.ts`](./demo/src/cases/detail-modal/handlers.ts) · [`registry.ts`](./demo/src/cases/detail-modal/registry.ts) |
| **Two Store** | Two stores, two Renderers side by side — settings panel changes update a live preview only on Apply via a cross-store handler | [`TwoStoreCase.tsx`](./demo/src/cases/two-store/TwoStoreCase.tsx) · [`buildPreviewSpec.ts`](./demo/src/cases/two-store/buildPreviewSpec.ts) · [`buildSettingsSpec.ts`](./demo/src/cases/two-store/buildSettingsSpec.ts) · [`handlers.ts`](./demo/src/cases/two-store/handlers.ts) · [`registry.ts`](./demo/src/cases/two-store/registry.ts) |
| **Feature Flags** | Dashboard with ToggleField, SliderField, Badge, Alert, and SegmentedField — showcases five Mantine-derived components | [`FeatureFlagsCase.tsx`](./demo/src/cases/feature-flags/FeatureFlagsCase.tsx) · [`buildSpec.ts`](./demo/src/cases/feature-flags/buildSpec.ts) · [`registry.ts`](./demo/src/cases/feature-flags/registry.ts) |
| **Translations** | Editable translation strings via repeat on a plain object — demonstrates object key iteration with PathLabel and BoundField | [`TranslationsCase.tsx`](./demo/src/cases/translations/TranslationsCase.tsx) · [`buildSpec.ts`](./demo/src/cases/translations/buildSpec.ts) · [`registry.ts`](./demo/src/cases/translations/registry.ts) |
| **Drag & Drop** | Sortable table with drag-and-drop reordering, add, and remove — powered by @dnd-kit with the store as source of truth | [`DndTableCase.tsx`](./demo/src/cases/dnd-table/DndTableCase.tsx) · [`buildSpec.ts`](./demo/src/cases/dnd-table/buildSpec.ts) · [`registry.ts`](./demo/src/cases/dnd-table/registry.ts) |
| **Mantine Table** | Mantine-styled table with pagination — 300 rows, 10 per page, page state in store. Self-contained PaginatedTable component | [`MantineTableCase.tsx`](./demo/src/cases/mantine-table/MantineTableCase.tsx) · [`buildSpec.ts`](./demo/src/cases/mantine-table/buildSpec.ts) · [`handlers.ts`](./demo/src/cases/mantine-table/handlers.ts) · [`registry.ts`](./demo/src/cases/mantine-table/registry.ts) |
| **Dynamic Columns** | Static spec, runtime-unknown columns — rows repeat `/data`, cells repeat `/colDefs`; `DataCell` resolves each cell across the two repeat scopes via `usePath(1)`. Switching datasets changes the column set with no spec regeneration | [`DynamicColumnsCase.tsx`](./demo/src/cases/dynamic-columns/DynamicColumnsCase.tsx) · [`spec.json`](./demo/src/cases/dynamic-columns/spec.json) · [`handlers.ts`](./demo/src/cases/dynamic-columns/handlers.ts) · [`registry.tsx`](./demo/src/cases/dynamic-columns/registry.tsx) |
| **Nested Repeat** | Two-level nested `repeat` — categories contain items; the inner repeat uses `{ $item: "items" }` to resolve against the outer scope | [`NestedRepeatCase.tsx`](./demo/src/cases/nested-repeat/NestedRepeatCase.tsx) · [`spec.json`](./demo/src/cases/nested-repeat/spec.json) · [`registry.tsx`](./demo/src/cases/nested-repeat/registry.tsx) |
| **Named Slots** | Record-form children map slot names to elements — a `Page` places header/sidebar/content/footer at different positions; `repeat` builds per-item slot instances | [`NamedSlotsCase.tsx`](./demo/src/cases/named-slots/NamedSlotsCase.tsx) · [`spec.json`](./demo/src/cases/named-slots/spec.json) · [`registry.tsx`](./demo/src/cases/named-slots/registry.tsx) |
| **DOCX Export** | Edit data in a table, then export to a downloadable `.docx` — `renderGeneric` with separate React and DOCX specs and registry-side expression resolution | [`DocxExportCase.tsx`](./demo/src/cases/docx-export/DocxExportCase.tsx) · [`spec.json`](./demo/src/cases/docx-export/spec.json) · [`docxSpec.ts`](./demo/src/cases/docx-export/docxSpec.ts) · [`docxRegistry.ts`](./demo/src/cases/docx-export/docxRegistry.ts) · [`registry.ts`](./demo/src/cases/docx-export/registry.ts) |
| **XLSX Export** | Edit data in a table, then export to a downloadable `.xlsx` via `renderGeneric` with the `xlsx` (SheetJS) package | [`XlsxExportCase.tsx`](./demo/src/cases/xlsx-export/XlsxExportCase.tsx) · [`spec.json`](./demo/src/cases/xlsx-export/spec.json) · [`xlsxSpec.ts`](./demo/src/cases/xlsx-export/xlsxSpec.ts) · [`xlsxRegistry.ts`](./demo/src/cases/xlsx-export/xlsxRegistry.ts) · [`registry.ts`](./demo/src/cases/xlsx-export/registry.ts) |
| **Nested Package** | A child package (own spec, registry, components) embedded at two base paths of one parent store — `createStoreView` write-back, `parent.*` bridge actions, and a standalone instance proving parity | [`NestedPackageCase.tsx`](./demo/src/cases/nested-package/NestedPackageCase.tsx) · [`spec.json`](./demo/src/cases/nested-package/spec.json) · [`handlers.ts`](./demo/src/cases/nested-package/handlers.ts) · [`registry.ts`](./demo/src/cases/nested-package/registry.ts) · [`child/EmbeddedChild.tsx`](./demo/src/cases/nested-package/child/EmbeddedChild.tsx) · [`child/spec.json`](./demo/src/cases/nested-package/child/spec.json) · [`child/registry.ts`](./demo/src/cases/nested-package/child/registry.ts) · [`child/StandaloneChild.tsx`](./demo/src/cases/nested-package/child/StandaloneChild.tsx) |

## Q&A

See [Q&A.md](./Q&A.md) for answers to common questions about `$state`, `$item`, and `$index` expressions — what they are, where they can be used, when to use each, how they cause re-renders, and how they compare to each other.
