# Q&A

## Core API

### Which hook should I use?

| Hook | Reads store? | Writes store? | Subscribes? | Use when |
|------|:--:|:--:|:--:|----------|
| `useBound<T>(path)` | ✓ | ✓ | ✓ | Input fields, two-way binding |
| `useValue<T>(path)` | ✓ | ✗ | ✓ | Display-only values, conditional rendering |
| `useSetValue(path)` | ✗ | ✓ | ✗ | Buttons or effects that write without reading |
| `useStore()` | via `.get()` | via `.set()` | ✗ | Handlers, imperative logic, reading multiple paths |
| `usePath()` | — | — | via context | Current scope path — `""` at root, `/items/3` inside a repeat |

**Key distinction:** `useBound` and `useValue` subscribe via `useSyncExternalStore` — the component re-renders when the value at that path changes. `useSetValue` and `useStore` do NOT subscribe — they return stable functions, no re-render on state change.

`useStore()` gives you the raw store object. Use it when you need `store.get(path)` to read without subscribing, or `store.set(path, value)` for imperative writes. Avoid calling `store.get()` during render — use `useValue` for reactive reads.

### How do I create and initialize a store?

```ts
import { createStore } from "thin-render";

const store = createStore({
  user: { name: "Alice", email: "alice@example.com" },
  items: [{ id: 1, name: "First" }],
  flags: { darkMode: true },
});
```

`createStore(initial)` takes an optional initial state object and returns a `Store`. Create it once — at component top level via `useState(() => createStore({...}))` or in a module — so the reference is stable across renders. The store lives outside React; only `useBound`/`useValue` subscriptions bridge it into the React tree.

### How do I read state outside a component?

```ts
import { getByPath } from "thin-render";

// Inside a handler:
const handlers = {
  loadDetail: (params, { getState, setState }) => {
    const items = getByPath(getState(), "/items") as Item[];
    const name = getByPath(getState(), "/user/name") as string;
  },
};
```

`getByPath(state, path)` walks a nested object by path string and returns the value (or `undefined` if any segment is missing). It's the non-reactive counterpart to `useValue` — use it in handlers where you have `getState()` but can't call hooks.

### What does the Renderer need?

```tsx
import { Renderer, type Spec, type Registry, type Handlers } from "thin-render";

<Renderer
  spec={spec}           // Spec — the JSON tree declaring what to render
  registry={registry}   // Registry — Record<string, ComponentType<ComponentProps>>
  store={store}         // Store — from createStore()
  handlers={handlers}   // Handlers? — Record<string, Handler> (optional)
/>
```

All four props must be **stable references** — create them once, don't recreate on every render. The Renderer wraps them in providers internally; changing references would re-mount the tree.

### How do I build a registry?

```tsx
import type { ComponentProps, Registry } from "thin-render";

function Card({ element, children }: ComponentProps) {
  return <div className="card">{children}</div>;
}

function Button({ element, emit }: ComponentProps) {
  return <button onClick={() => emit("click")}>{String(element.props?.label)}</button>;
}

const registry: Registry = {
  Card,
  Button,
};
```

A registry maps spec `type` strings to React components. Each component receives `ComponentProps`. The registry reference must be stable — define it at module scope or in a `useMemo`/`useState` initializer.

### What's the ComponentProps contract?

```ts
interface ComponentProps {
  element: UIElement;               // current spec element (type, props, children, on, repeat)
  children?: ReactNode;             // pre-rendered child elements
  emit: (event: string) => void;    // dispatch actions declared in element.on
}
```

Every registry component receives these three props. `element.props` is `Record<string, unknown>` — cast to the types you expect. `children` are already rendered by the renderer — just place them in your JSX. `emit("click")` fires whatever action the spec bound to `on.click`.

### What's the Spec structure?

```ts
interface Spec {
  root: string;                          // key of the root element
  elements: Record<string, UIElement>;   // element key → element definition
}

interface UIElement {
  type: string;                          // matches a key in your registry
  props?: Record<string, unknown>;       // passed to your component as element.props
  children?: string[];                   // keys of child elements to render
  on?: Record<string, ActionBinding | ActionBinding[]>;    // event → action bindings
  repeat?: { path: string | { $item: string } | { $state: string }; key?: string };
}

interface ActionBinding {
  action: string;                        // handler name (or "setState" for built-in)
  params?: Record<string, unknown>;      // $state, $item, $index resolved at dispatch
}
```

Specs are JSON — you write them as `.json` files or build them programmatically. The `type` field links each element to a component in your registry. `children` reference other element keys by name. `on` wires actions to handlers. `repeat` drives array/object iteration.

## Expressions

### Expression reference

| | `on.params` | `repeat.path` | element `props` |
|---|:--:|:--:|:--:|
| `{ $state: "/path" }` | ✓ read-once | ✓ subscribes | ✗ |
| `{ $item: "field" }` | ✓ path str | ✓ context only | ✗ |
| `{ $item: "" }` | ✓ base path | ✓ base path | ✗ |
| `{ $index: true }` | ✓ number | ✗ | ✗ |

**Key rules:**
- `$state` in `repeat.path` subscribes via `useSyncExternalStore` — changing the pointer re-renders the repeat
- `$item` in `repeat.path` uses context only — no subscription, relies on parent re-render
- `$item: ""` returns the repeat base path (e.g., `/items/3`); `$item: "field"` appends (e.g., `/items/3/field`)
- Props are ALWAYS static — components resolve expressions themselves
- `$index: false` → `undefined`; use to explicitly opt out

### What is `$state`?

`{ $state: "/path" }` reads a value from the store at the given path. Unlike static values in your spec, it dereferences the store at runtime.

`$state` works in two contexts with different behavior:
- **Action params** — read once at dispatch time, no subscription. The handler gets a snapshot.
- **Repeat path** — subscribes via `useValue` → `useSyncExternalStore`. When the pointer changes, the repeat re-renders.

**Example — dynamic repeat target:**

```json
// Store: { activeTab: "/tabs/fruits", tabs: { fruits: [...], vegetables: [...] } }
{ "type": "MyList", "repeat": { "path": { "$state": "/activeTab" } }, "children": ["row"] }
```

When the user switches tabs, write the new path to `/activeTab` — the repeat follows.

**Missing paths:** In action params, resolves to `undefined` (no warning). In repeat path, resolves to `""` (empty string), renders nothing. If the path holds a non-string in repeat context, a console warning is logged.

### What is `$item`?

`{ $item: "field" }` builds an absolute path from the current repeat scope. It resolves to a **path string**, not a value — unlike `$state`.

| Syntax | Meaning | Example (inside `/items/3`) |
|--------|---------|-----------------------------|
| `{ $item: "field" }` | Append field to scope | `/items/3/field` |
| `{ $item: "" }` | The scope path itself | `/items/3` |

`$item` works in three places: action params (handler receives the path string), repeat paths (enables nested repeats), and component props (resolved manually with `usePath()`). It never subscribes — it reads `PathContext`, a React context set by the nearest parent repeat.

**Example — nested repeat:**

```json
// Store: { categories: [{ name: "Fruits", items: [{ name: "Apple" }, ...] }, ...] }
// Outer: repeat: { path: "/categories" } — sets scope to /categories/0
// Inner: repeat: { path: { "$item": "items" } } — resolves to /categories/0/items
```

**Outside a repeat:** `$item` returns `undefined` in all contexts. No warning.

### What is `$index`?

`{ $index: true }` passes the numeric repeat index to a handler. It only works in action params — no repeat path or component prop support.

```json
{ "on": { "click": { "action": "removeItem", "params": { "index": { "$index": true } } } } }
```

```ts
removeItem: (params, { getState, setState }) => {
  const idx = params.index as number;
  setState("/items", getState().items.filter((_, i) => i !== idx));
};
```

`{ $index: false }` explicitly passes `undefined`. Outside a repeat, resolves to `undefined` (no warning).

### How do `$state`, `$item`, and `$index` compare?

| | `$state` | `$item` | `$index` |
|---|---------|---------|----------|
| **Resolves to** | A **value** from the store | A **path string** from context | A **number** from context |
| **Resolves against** | Store root (absolute) | Repeat scope (relative) | Repeat scope (relative) |
| **In action params** | Snapshot read | Path string for handler to use | Numeric index |
| **In repeat path** | Subscribes, causes re-renders | Context only, no subscription | Not supported |
| **Outside repeat** | Works normally | Returns `undefined` | Returns `undefined` |

In short: `$state` answers "what value?", `$item` answers "what path?", `$index` answers "which position?".

## Actions & Handlers

### What is `renderGeneric` and when should I use it?

`renderGeneric` is a pure function that walks a spec tree and calls your builder functions instead of React components. Use it for one-shot, non-interactive output — DOCX reports, PDF invoices, CSV exports, plain text, or any format.

```ts
import { renderGeneric, type GenericRegistry } from "thin-render";

const registry: GenericRegistry = {
  Paragraph: (props, children) => new Paragraph({ children }),
  Heading:   (props, _children) => new Paragraph({ text: String(props.text), heading: "HEADING_1" }),
};
```

**Key differences from the React `<Renderer>`:**

| | React `<Renderer>` | `renderGeneric` |
|---|---|---|
| **Output** | React component tree | Whatever your registry returns |
| **Expression resolution** | Components use hooks (`useBound`, `useValue`) | Props resolved automatically before registry call |
| **Subscriptions** | `useSyncExternalStore` per path | Read-once from store at generation time |
| **Actions (`on`)** | `emit` dispatches handlers | Ignored — no interactivity |
| **Repeat** | React reconciliation | Plain loop, pushes results to array |
| **Return value** | React element | `unknown` — cast to your output type |

**Typical usage:** The React renderer powers an interactive data view. The user edits, filters, and reviews data. A "Export" button handler calls `renderGeneric` with a separate DOCX spec to produce a downloadable report — same store, same expression language, different spec.

### What goes in a `GenericRegistry`?

Each entry is a function `(props, children) => unknown`:

- `props` — the element's `props` with all `$state`/`$item`/`$index` expressions already resolved to plain values. No expression objects reach your function.
- `children` — a flat array of whatever your child registry functions returned.

```ts
const registry: GenericRegistry = {
  // Leaf: no children
  TextRun: (props) => new TextRun({ text: String(props.text) }),
  // Container: receives children array from child elements
  Paragraph: (_props, children) => new Paragraph({ children }),
  // Repeat container: children are flattened results of all iterations
  Table: (_props, children) => new Table({ rows: children }),
};
```

The return type is `unknown` — TypeScript won't enforce homogeneity. Cast `renderGeneric`'s result at the call site: `renderGeneric(...) as Document`.

### What is a handler?

A handler is a **pure function** that runs in response to an action. It lives outside React — no hooks, no JSX, no component lifecycle. The contract:

```ts
type Handler = (
  params: Record<string, unknown>,
  api: {
    getState: () => unknown;                       // read the entire store
    setState: (path: string, value: unknown) => void; // write to a path
  }
) => void | Promise<void>;
```

- `params` — the resolved action parameters from the spec (any `$state`/`$item`/`$index` expressions already resolved)
- `getState()` — returns the full store state tree. Use `getByPath(getState(), path)` for targeted reads
- `setState(path, value)` — writes a value to a store path, triggering subscribers on that exact path
- Return `void` or `Promise<void>` — async handlers are awaited by `emit`

Handlers are registered once at the top level and never change. They're the only place side effects (state writes) happen in thin-render.

### How do I register handlers?

Pass a `handlers` object to `<Renderer>`. Create it once — at module scope or in a `useState`/`useRef` — so the reference is stable across renders:

```tsx
const handlers = {
  saveDoc: (params, { setState }) => {
    setState("/savedAt", new Date().toISOString());
  },
  removeItem: (params, { getState, setState }) => {
    const idx = params.index as number;
    setState("/items", (getState().items ?? []).filter((_, i) => i !== idx));
  },
};

<Renderer spec={spec} registry={registry} store={store} handlers={handlers} />
```

The handler map is merged into `ActionContext` alongside the built-in `setState` handler (user handlers take priority on name conflicts). The context value is memoized and never triggers re-renders.

### How do I trigger an action from a component?

Use the `emit` function from `ComponentProps`. The spec declares which events map to which actions via the `on` field:

```tsx
// Component
function MyButton({ element, emit }: ComponentProps) {
  return <button onClick={() => emit("click")}>{element.props?.label}</button>;
}
```

```json
// Spec
{
  "type": "MyButton",
  "props": { "label": "Save" },
  "on": {
    "click": { "action": "saveDoc" }
  }
}
```

When the button is clicked:
1. `emit("click")` looks up `on.click` in the element's spec
2. `resolveParams` resolves any `$state`/`$item`/`$index` expressions in `params`
3. The handler is invoked with resolved params + `{ getState, setState }`

`emit` is memoized per element — it's stable as long as the `on` map doesn't change. The event name can be anything: `"click"`, `"change"`, `"submit"`, etc.

### How do I pass data to a handler?

Via the `params` field in the action binding. Values can be static or expression-driven:

```json
{
  "on": {
    "click": {
      "action": "loadDetail",
      "params": {
        "itemId": { "$item": "id" },
        "userId": { "$state": "/user/id" },
        "position": { "$index": true },
        "label": "static value"
      }
    }
  }
}
```

At dispatch time, `resolveParams` walks the params object:
- `{ $state: "/path" }` → reads the store value at that path (snapshot)
- `{ $item: "field" }` → resolves to an absolute path relative to the repeat scope
- `{ $index: true }` → numeric repeat index
- Static values (strings, numbers, etc.) pass through unchanged
- Nested objects are recursed into

The handler receives the fully resolved object:
```ts
{ itemId: "/items/2/id", userId: 42, position: 2, label: "static value" }
```

See the expression Q&A sections above for details on each expression type.

### Can I fire multiple handlers from one event?

Yes — use an array of action bindings:

```json
{
  "on": {
    "click": [
      { "action": "logClick" },
      { "action": "saveDoc", "params": { "id": { "$state": "/doc/id" } } }
    ]
  }
}
```

Both handlers are invoked in order. Each gets its own params resolution — they're independent.

### What is the built-in `setState` action?

`setState` is always available without writing a handler. It writes a value to a store path:

```json
{
  "on": {
    "click": {
      "action": "setState",
      "params": { "path": "/flag", "value": true }
    }
  }
}
```

The `value` parameter supports `$state` expressions — useful for copying values between paths:

```json
{
  "params": {
    "path": "/selectedName",
    "value": { "$state": "/items/0/name" }
  }
}
```

This reads `/items/0/name` from the store at click time and writes it to `/selectedName`. No custom handler needed for simple state-to-state copies.

If you register your own handler named `setState`, it takes priority over the built-in. Built-in handlers are merged under user handlers.

### How do I react to store changes reactively?

Use `useValue` (or `useBound`) with `useEffect` inside a component:

```tsx
function ValidatingField({ element }: ComponentProps) {
  const [value, setValue] = useBound<string>(String(element.props?.bind));
  const store = useStore();

  useEffect(() => {
    if ((value ?? "").length < 3) {
      store.set(`/errors/${String(element.props?.bind)}`, "Too short");
    } else {
      store.set(`/errors/${String(element.props?.bind)}`, undefined);
    }
  }, [value]);

  return <input value={value ?? ""} onChange={e => setValue(e.target.value)} />;
}
```

This pattern works everywhere — including inside repeats, because `useBound` and `useValue` automatically compose their paths with the current repeat scope.

### Can handlers be async?

Yes. The handler contract allows `Promise<void>` as a return type:

```ts
const handlers = {
  loadDetail: async (params, { getState, setState }) => {
    setState("/loading", true);
    const id = params.id as string;
    const data = await fetch(`/api/items/${id}`).then(r => r.json());
    setState("/itemDetail", data);
    setState("/loading", false);
  },
};
```

`emit` awaits the handler's promise, so sequential `emit` calls for the same event run in order.

### What happens if a handler isn't found?

If `emit` references an action name that doesn't exist in the registered handlers, thin-render logs a warning and continues:

> `thin-render: no handler registered for "typoedName"`

No error is thrown, no state is changed. This is a deliberate design choice — a missing handler shouldn't crash the app.

The built-in `setState` action is an exception: if `setState` isn't found (which only happens if the user explicitly removes it), it's silently skipped without a warning.

If your action isn't firing, check the browser console for these warnings — it's usually a typo in the action name or a missing handler registration.

## Patterns

### How do I render a table whose columns I don't know in advance?

Data like `{ data: [{ head1: val1, head2: val2, ... }, ...] }` — an array of records whose keys are only known at runtime — can't name its columns in a static spec. Two approaches, from the simplest to the most granular:

**1. Static spec with two nested repeats (scope stack).** Derive the columns when data lands and store both arrays:

```ts
// in the load handler
const rows = await api.fetchRows();
store.set("/data", rows.map((r, i) => ({ __id: i, ...r })));
store.set("/colDefs", deriveColumns(rows)); // [{ key: "head1", label: "head1" }, ...]
```

`deriveColumns` takes the union of keys across ALL rows (a row may miss a key — that cell renders empty) and excludes internal fields like `__id`:

```ts
function deriveColumns(rows: Record<string, unknown>[]): { key: string; label: string }[] {
  const keys = new Set<string>();
  for (const row of rows) for (const k of Object.keys(row)) if (k !== "__id") keys.add(k);
  return [...keys].map((key) => ({ key, label: key }));
}
```

The spec stays fully static — the header row and every body row repeat over `/colDefs`, with no column names anywhere in it:

```json
{ "type": "TBody", "repeat": { "path": "/data", "key": "__id" }, "children": ["tr"] },
{ "type": "Tr", "repeat": { "path": "/colDefs" }, "children": ["cell"] },
{ "type": "DataCell" }
```

Each cell resolves its value across the two repeat scopes. Repeat scopes form a stack (innermost first): `usePath()` is the column scope, `usePath(1)` the row scope, `undefined` beyond the stack:

```tsx
function DataCell(_props: ComponentProps) {
  const colBase = usePath();                              // e.g. /colDefs/2
  const rowBase = usePath(1);                             // e.g. /data/5
  const key = useValue<string>(`${colBase}/key`) ?? "";   // e.g. "head1"
  const [value, setValue] = useBound<string>(`${rowBase}/${key}`); // /data/5/head1
  return <td><input value={value} onChange={(e) => setValue(e.target.value)} /></td>;
}
```

The cell subscribes to exactly its own value path, so per-cell granularity survives; a column-set change only re-renders the repeats, never the whole tree. `renderGeneric` builders get the same stack via `ctx.scopes`. The nested-`<Renderer>` boundary resets the stack, so no scope leaks across renderers.

**2. Generate the spec from the data (spec as derived state).** If you can't add a custom cell component, generate one `Th`/`Td`/`BoundField` element per column after load and memoize the spec on the column set — see the demo's Dynamic Columns case README note. The spec changes (full re-render, the correct trigger) only when the column set changes.

Either way the two shared rules hold: enrich rows with a stable `__id` for the repeat key, and derive columns as a union across all rows, excluding internal fields.
