# thin-render

A ~700-line spec-driven React renderer with **granular per-path re-renders**. Edit one cell in a 1000-row table — only that one cell's component re-renders.

Built as a minimal alternative to `@json-render/react`, dropping AI streaming, Zod validation, directives, devtools, and multi-framework output. Just the rendering core, a path-based store, and an action system.

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
- **Leaf components** subscribe to individual paths via `useBound()`/`useValue()` — each uses `useSyncExternalStore` with a per-path snapshot. Changing `/items/0/name` re-renders only the component subscribed to that exact path.

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

Renders `row` once per item in `/items`. Inside a repeat, components can use `usePath()` to get the current item's base path (`/items/0`, `/items/1`, etc.) — which is automatically composed with relative paths like `useBound("name")` to read from `/items/0/name`.

For stable React keys across re-renders, provide a `key` field on the repeat config pointing to a unique field on each item (e.g., `"repeat": { "path": "/items", "key": "id" }`). Without it, the array index is used, which breaks on reorder or delete. The unique ID must come from your data — thin-render does not auto-generate IDs.

### Watch (reactive derivations)

```json
{ "type": "BoundField", "props": { "bind": "name" },
  "watch": { "/name": [{ "action": "validateName" }] } }
```

When `/name` changes, the `validateName` handler fires — without causing `ElementRenderer` to re-render. The handler can read any path and write results (e.g. errors to `/errors/name`), which DOES trigger targeted re-renders in subscribing components. Built on `store.subscribe`, not `useValue` — no re-render from the watch itself.

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
| `useSetValue(path)` | `(v: unknown) => void` | Write-only setter for a path |
| `usePath()` | `string` | Current repeat scope's base path |

### Store & utilities

> Source: [`store.ts`](./src/store.ts)

| Export | Signature | Description |
|--------|-----------|-------------|
| `createStore(initial?)` | `Store` | Create a path-based external store |
| `getByPath(state, path)` | `unknown` | Read a nested value from an object by path string |

`Store` instance methods:

| Method | Description |
|--------|-------------|
| `store.get(path)` | Read value at path |
| `store.set(path, value)` | Write path; no-op if value unchanged; notifies overlapping subscribers |
| `store.subscribe(path, fn)` | Register change listener; returns unsubscribe |
| `store.getState()` | Full state snapshot |

### Component contract (`ComponentProps`)

> Source: [`renderer.tsx`](./src/renderer.tsx)

```ts
interface ComponentProps {
  element: UIElement;          // current spec element
  children?: ReactNode;       // rendered child elements
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

interface UIElement {
  type: string;
  props?: Record<string, unknown>;
  children?: string[];
  on?: Record<string, ActionBinding | ActionBinding[]>;
  watch?: Record<string, ActionBinding[]>;
  repeat?: { path: string; key?: string };
}

interface ActionBinding {
  action: string;
  params?: Record<string, unknown>;  // $state, $item, $index expressions
}
```

## Demo

The demo app (`demo/`) has thirteen self-contained cases:

| Case | What it shows | Source |
|-----|---------------|--------|
| **Basic** | Static spec rendering | [`BasicCase.tsx`](./demo/src/cases/basic/BasicCase.tsx) · [`spec.json`](./demo/src/cases/basic/spec.json) · [`registry.ts`](./demo/src/cases/basic/registry.ts) |
| **Form** | `BoundField` inputs with read-only/editable toggle | [`FormCase.tsx`](./demo/src/cases/form/FormCase.tsx) · [`spec.json`](./demo/src/cases/form/spec.json) · [`handlers.ts`](./demo/src/cases/form/handlers.ts) · [`registry.ts`](./demo/src/cases/form/registry.ts) |
| **Actions** | `ActionButton` + handler writes timestamp to store | [`ActionsCase.tsx`](./demo/src/cases/actions/ActionsCase.tsx) · [`spec.json`](./demo/src/cases/actions/spec.json) · [`handlers.ts`](./demo/src/cases/actions/handlers.ts) · [`registry.ts`](./demo/src/cases/actions/registry.ts) |
| **Large (1000)** | 1000-row × 2-column editable table via `repeat` — edit one cell, only that cell re-renders. Per-row ✕ delete using `{ $index: true }`. | [`LargeCase.tsx`](./demo/src/cases/large/LargeCase.tsx) · [`buildSpec.ts`](./demo/src/cases/large/buildSpec.ts) · [`handlers.ts`](./demo/src/cases/large/handlers.ts) · [`registry.ts`](./demo/src/cases/large/registry.ts) |
| **Table** | 1000-row HTML `<table>` with `<thead>`/`<tbody>` structure built via `repeat` | [`TableCase.tsx`](./demo/src/cases/table/TableCase.tsx) · [`buildSpec.ts`](./demo/src/cases/table/buildSpec.ts) · [`handlers.ts`](./demo/src/cases/table/handlers.ts) · [`registry.ts`](./demo/src/cases/table/registry.ts) |
| **Switch** | Conditional rendering via `useValue` — three mutually-exclusive status views | [`SwitchCase.tsx`](./demo/src/cases/switch/SwitchCase.tsx) · [`spec.json`](./demo/src/cases/switch/spec.json) · [`handlers.ts`](./demo/src/cases/switch/handlers.ts) · [`registry.ts`](./demo/src/cases/switch/registry.ts) |
| **Detail Modal** | Click a table row → async handler simulates backend call → detail data loads into a separate store path and displays in a Modal | [`DetailModalCase.tsx`](./demo/src/cases/detail-modal/DetailModalCase.tsx) · [`buildSpec.ts`](./demo/src/cases/detail-modal/buildSpec.ts) · [`handlers.ts`](./demo/src/cases/detail-modal/handlers.ts) · [`registry.ts`](./demo/src/cases/detail-modal/registry.ts) |
| **Two Store** | Two stores, two Renderers side by side — settings panel changes update a live preview only on Apply via a cross-store handler | [`TwoStoreCase.tsx`](./demo/src/cases/two-store/TwoStoreCase.tsx) · [`buildPreviewSpec.ts`](./demo/src/cases/two-store/buildPreviewSpec.ts) · [`buildSettingsSpec.ts`](./demo/src/cases/two-store/buildSettingsSpec.ts) · [`handlers.ts`](./demo/src/cases/two-store/handlers.ts) · [`registry.ts`](./demo/src/cases/two-store/registry.ts) |
| **Feature Flags** | Dashboard with ToggleField, SliderField, Badge, Alert, and SegmentedField — showcases five Mantine-derived components | [`FeatureFlagsCase.tsx`](./demo/src/cases/feature-flags/FeatureFlagsCase.tsx) · [`buildSpec.ts`](./demo/src/cases/feature-flags/buildSpec.ts) · [`registry.ts`](./demo/src/cases/feature-flags/registry.ts) |
| **Translations** | Editable translation strings via repeat on a plain object — demonstrates object key iteration with PathLabel and BoundField | [`TranslationsCase.tsx`](./demo/src/cases/translations/TranslationsCase.tsx) · [`buildSpec.ts`](./demo/src/cases/translations/buildSpec.ts) · [`registry.ts`](./demo/src/cases/translations/registry.ts) |
| **Drag & Drop** | Sortable table with drag-and-drop reordering, add, and remove — powered by @dnd-kit with the store as source of truth | [`DndTableCase.tsx`](./demo/src/cases/dnd-table/DndTableCase.tsx) · [`buildSpec.ts`](./demo/src/cases/dnd-table/buildSpec.ts) · [`registry.ts`](./demo/src/cases/dnd-table/registry.ts) |
| **Mantine Table** | Mantine-styled table with pagination — 300 rows, 10 per page, page state in store. Self-contained PaginatedTable component | [`MantineTableCase.tsx`](./demo/src/cases/mantine-table/MantineTableCase.tsx) · [`buildSpec.ts`](./demo/src/cases/mantine-table/buildSpec.ts) · [`handlers.ts`](./demo/src/cases/mantine-table/handlers.ts) · [`registry.ts`](./demo/src/cases/mantine-table/registry.ts) |

## Q&A

See [Q&A.md](./Q&A.md) for answers to common questions about `$state`, `$item`, and `$index` expressions — what they are, where they can be used, when to use each, how they cause re-renders, and how they compare to each other.
