# thin-render — Agent Reference

> Copy this file to your agent's context (AGENTS.md, CLAUDE.md, .cursorrules) after `npm install thin-render`.

## Concepts

```
  Spec ──▶ Renderer ──▶ Registry (type → component)
  (JSON)      │
              ├──▶ Store (path-based state)
              └──▶ Handlers (pure functions)
```

| Block | What it is | Where it lives |
|-------|------------|----------------|
| **Spec** | JSON tree declaring what to render | `spec.json` — `Spec` type |
| **Registry** | Maps spec `type` names to React components | `registry.ts` — `Registry` type |
| **Store** | Path-based state container (external to React) | `createStore({...})` |
| **Handlers** | Pure functions invoked by actions | `handlers.ts` — `Handlers` type |

A demo case typically has 3–4 files: `spec.json`, `registry.ts`, `handlers.ts` (optional), and a `<Name>Case.tsx` that wires them.

## API Reference

### Types

```ts
import type { Spec, UIElement, SlotMap, ComponentProps, Handler, Handlers, Registry } from "thin-render";
```

| Type | Shape |
|------|-------|
| `Spec` | `{ root: string; elements: Record<string, UIElement> }` |
| `UIElement` | `{ type: string; props?: Record<string, unknown>; children?: string[] \| SlotMap; on?: OnMap; repeat?: RepeatConfig }` |
| `SlotMap` | `Record<string, string \| string[]>` — slot name → child element id(s); record-form `children` |
| `ActionBinding` | `{ action: string; params?: Record<string, unknown> }` — internal type (not re-exported) |
| `OnMap` | `Record<string, ActionBinding \| ActionBinding[]>` — internal type (not re-exported) |
| `RepeatConfig` | `{ path: string \| { $item: string } \| { $state: string }; key?: string }` — internal type (not re-exported) |

### Hooks

```ts
import { useBound, useValue, useSetValue, useStore, usePath, useSelector, getByPath, ActionContext } from "thin-render";
```

| Hook | Returns | Notes |
|------|---------|-------|
| `useBound<T>(path)` | `[T \| undefined, (v: T) => void]` | Two-way bind; subscribes |
| `useValue<T>(path)` | `T \| undefined` | Read-only subscription |
| `useSelector<T>(path, derive)` | `T` | Derived subscription within a path window; re-renders only when the derived value changes |
| `useSetValue(path)` | `(v: unknown) => void` | Write-only |
| `useStore()` | `Store` | Access `store.get()` / `store.set()` |
| `usePath(offset?)` | `string` | Current repeat scope base path; `usePath(1)` reads the parent repeat's scope, `undefined` beyond the stack |
| `ActionContext` | React context | `{ handlers, getState, setState }` of the nearest `ActionProvider` — `useContext` inside a boundary component to bridge parent actions into a nested renderer |

### Component Contract

Every registry component receives:

```ts
interface ComponentProps {
  element: UIElement;               // current spec element
  children?: ReactNode;             // rendered children (array-form children only)
  slots?: Record<string, ReactNode>;// rendered named slots (record-form children only)
  emit: (event: string) => void;   // dispatch on.* actions
}
```

Exactly one of `children`/`slots` is set, based on the element's `children` shape: `["a", "b"]` → `children`; `{ "header": "h", "toolbar": ["t1", "t2"] }` → `slots`. The spec decides which element goes into which slot; the component decides where each slot renders. Slot names are never React keys (element keys are) — do not reference the same child id from two slots of one element.

**Do NOT** call hooks like `useBound` inside `ElementRenderer` — only inside your registry components.

### Handler Contract

```ts
type Handler = (
  params: Record<string, unknown>,
  api: { getState: () => unknown; setState: (path: string, value: unknown) => void }
) => void | Promise<void>;
```

- `params` — `$state`/`$item`/`$index` already resolved
- `getState()` — full store snapshot
- `setState(path, value)` — writes a path, notifies subscribers
- Async handlers are awaited by `emit`

### Store API

```ts
import { createStore, createStoreView, getByPath } from "thin-render";
const store = createStore({ /* initial state */ });
```

| Method | Description |
|--------|-------------|
| `store.get(path)` | Read value at path |
| `store.set(path, value)` | Write path; no-op if value unchanged |
| `store.subscribe(path, fn)` | Listen for changes on overlapping paths; returns unsubscribe |
| `store.getState()` | Full state snapshot |

`getByPath(state, path)` — standalone utility to read a nested value from any object by path. Used inside handlers: `getByPath(getState(), params.id)`

`createStoreView(store, basePath)` — a path-prefixed view implementing the same `Store` interface: `get`/`set`/`subscribe` rebase the given path onto `basePath` (empty path → `basePath` exactly; leading `/` optional), and `getState()` returns the subtree snapshot at `basePath`. No data is copied and no listener registry is kept — subscriptions delegate, so writes outside the base subtree never notify view subscribers. Used to embed a nested spec package at a subtree of a parent store (see Pattern 10).

Path syntax: JSON-Pointer-like, `/`-separated. Leading `/` optional. `""` = root.

### Generic Renderer

```ts
import { renderGeneric, getByPath, type GenericRegistry, type RenderContext } from "thin-render";
```

| Export | Signature | Notes |
|--------|-----------|-------|
| `renderGeneric(spec, store, registry)` | `unknown` | Walk the spec tree, call builder functions; no React, no subscriptions |
| `GenericRegistry` | `Record<string, (props, children, ctx) => unknown>` | Map of spec type → builder function |
| `RenderContext` | `{ store; basePath; scopes; index?; slots? }` | Passed to every builder |

`renderGeneric` passes element `props` to builders **RAW** — `$state`/`$item`/`$index` expression objects are NOT resolved by the renderer. Builders resolve them manually against `ctx` (like React components resolve via hooks):

```ts
// Resolve a prop that may be an expression object.
function resolve(value: unknown, ctx: RenderContext): unknown {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.$state === "string") return getByPath(ctx.store.getState(), obj.$state);
    if (typeof obj.$item === "string") {
      const p = obj.$item === "" ? ctx.basePath : `${ctx.basePath}/${obj.$item}`;
      return getByPath(ctx.store.getState(), p);
    }
    if ("$index" in obj) return (obj.$index as boolean) ? ctx.index : undefined;
  }
  return value;
}

const registry: GenericRegistry = {
  Heading: (props, _children, ctx) => new Paragraph({ text: String(resolve(props.text, ctx)) }),
  Table: (_props, children) => new Table({ rows: children }),
};
```

`children` is a flat array of child results; for record-form children it is `[]` and `ctx.slots` holds one array per slot name. The renderer handles repeat iteration (array and object), scope stack (`ctx.scopes`, innermost first), and warnings for missing elements/types — your registry just builds the output objects. `renderGeneric` is also exported from README's API section; see the DOCX/XLSX demo cases for full examples.

## Expression Matrix

| | `on.params` | `repeat.path` | element `props` |
|---|:--:|:--:|:--:|
| `{ $state: "/path" }` | ✓ read-once | ✓ subscribes | ✗ |
| `{ $item: "field" }` | ✓ path str | ✓ context only | ✗ |
| `{ $item: "" }` | ✓ base path | ✓ base path | ✗ |
| `{ $index: true }` | ✓ number | ✗ | ✗ |

**Key rules:**
- `$state` in `repeat.path` subscribes via `useSyncExternalStore` — changing the pointer re-renders the repeat
- `$item` in `repeat.path` uses context only — no subscription, relies on parent re-render
- Props are ALWAYS static — components resolve expressions themselves
- `$item: ""` returns the repeat base path (e.g., `/items/3`); `$item: "field"` appends (e.g., `/items/3/field`)
- `$index: false` → `undefined`; use to explicitly opt out

## Patterns

### 1. Repeat (array iteration)

```json
{ "type": "List", "repeat": { "path": "/items", "key": "id" }, "children": ["row"] }
```

```tsx
function List({ children }: ComponentProps) { return <div>{children}</div>; }
```

Inside a repeat, `useBound("name")` reads from `/items/0/name`. Use `key` for stable React keys.

### 2. Bound Field (two-way binding)

```json
{ "type": "BoundField", "props": { "bind": "name", "label": "Name" } }
```

```tsx
function BoundField({ element }: ComponentProps) {
  const [value, setValue] = useBound<string>(String(element.props?.bind));
  return <input value={value ?? ""} onChange={e => setValue(e.target.value)} />;
}
```

### 3. Action Button

```json
{ "type": "ActionButton", "props": { "label": "Save" }, "on": { "click": { "action": "saveDoc", "params": { "id": { "$state": "/doc/id" } } } } }
```

```tsx
function ActionButton({ element, emit }: ComponentProps) {
  return <button onClick={() => emit("click")}>{String(element.props?.label)}</button>;
}
```

```ts
const handlers = { saveDoc: (params, { setState }) => { setState("/savedAt", new Date().toISOString()); } };
```

### 4. Reactive Validation (useEffect)

```tsx
function ValidatingField({ element }: ComponentProps) {
  const [value, setValue] = useBound<string>(String(element.props?.bind));
  const store = useStore();

  useEffect(() => {
    store.set("/errors/name", (value ?? "").length < 3 ? "Too short" : undefined);
  }, [value]);

  return <input value={value ?? ""} onChange={e => setValue(e.target.value)} />;
}
```

Reactive validation via `useValue`/`useEffect` — works everywhere, including inside repeats.

### 5. Conditional Render (slots)

```json
{ "type": "Switch", "props": { "path": "/status" }, "children": { "loading": "loading", "loaded": "loaded", "error": "error" } }
```

```tsx
function Switch({ element, slots }: ComponentProps) {
  const status = useValue<string>(String(element.props?.path));
  return slots?.[status] ?? null;
}
```

Record-form children make each branch a named slot; the component renders the slot whose name matches the store value. No key matching needed.

### 6. Derived Subscription (useSelector)
```tsx
import { useSelector } from "thin-render";

function EditModeGate() {
  const isMain = useSelector("/editKey", (v) => v === "Main");
  return isMain ? <MainEditor /> : <ReadOnly />;
}
```

`path` is the subscription **window**: the component is notified only on writes that overlap it (the path or any descendant), and `derive` receives the value at that path — plain property access, no `getByPath` needed. Re-renders ONLY when the derived value changes (strict equality) — writes to `/editKey` that keep the result the same (e.g. `"Other1"` → `"Other2"`) do not re-render, unlike `useValue` which re-renders on every write to its path. The derive must return a stable reference when unchanged: primitives are safe; memoize object/array results.

Window guidance: choose the tightest path that covers every read. Same-subtree multi-field derives use one call (`useSelector("/user", (u) => u.name === "Main" && u.role === "admin")`); unrelated branches use the root window (`useSelector("", (s) => s.items.length > 0 && s.selectedId != null)`) or compose narrow calls (`useSelector("/items", ...)` + `useSelector("/selectedId", ...)`) and combine in render.

### 7. Modal (store-gated overlay)
```json
{ "type": "Modal", "props": { "path": "/detailData", "title": "Details" }, "children": ["body"] }
```

```tsx
function Modal({ element, children }: ComponentProps) {
  const data = useValue(String(element.props?.path));
  const setData = useSetValue(String(element.props?.path));
  return data ? <Overlay onClose={() => setData(undefined)}>{children}</Overlay> : null;
}
```

### 8. Named Slots Layout

```json
{ "type": "Page", "children": { "header": "pageTitle", "sidebar": ["link1", "link2"], "content": "mainText", "footer": "pageFooter" } }
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

Named slots let a layout component place children at different positions. A slot holding multiple ids renders as one node (fragment). With `repeat` + record-form children, one component instance renders **per item**, each with slots scoped to its item path:

```json
{ "type": "SlotCard", "repeat": { "path": "/cards" }, "children": { "title": "t", "body": "b" } }
```

```tsx
function SlotCard({ slots }: ComponentProps) {
  return <Paper><Title>{slots?.title}</Title>{slots?.body}</Paper>;
}
```

### 9. Dynamic Columns Table (scope stack)


Render `{ data: [{ head1: val1, ... }, ...] }` — records whose keys are only known at runtime — with a **fully static spec**: rows and cells each repeat independently, and a cell resolves its value across the two scopes. Derived columns live in the store:

```ts
store.set("/data", rows.map((r, i) => ({ __id: i, ...r }))); // union of keys, excludes "__id"
store.set("/colDefs", deriveColumns(rows));                  // [{ key, label }, ...]
```

```json
{ "type": "TBody", "repeat": { "path": "/data", "key": "__id" }, "children": ["tr"] },
{ "type": "Tr", "repeat": { "path": "/colDefs" }, "children": ["cell"] },
{ "type": "DataCell" }
```

```tsx
function DataCell(_props: ComponentProps) {
  const colBase = usePath();                              // /colDefs/2
  const rowBase = usePath(1);                             // /data/5
  const key = useValue<string>(`${colBase}/key`) ?? "";   // "head1"
  const [value, setValue] = useBound<string>(`${rowBase}/${key}`);
  return <td><input value={value} onChange={(e) => setValue(e.target.value)} /></td>;
}
```

Repeat scopes form a stack (innermost first); `usePath(offset)` walks it — `0` is current, `1` is the parent repeat, beyond the stack is `undefined`. The nested `Renderer` boundary resets the stack, so no scope leaks across renderers. `$item`, relative binds, and `$index` still resolve against the innermost scope only. A `DataCell` re-renders only on writes to its own value path; changing `/colDefs` (a new column set) re-renders only the repeats, with no spec regeneration. `renderGeneric` builders get the same stack as `ctx.scopes`. If you cannot add a custom cell component, generate the spec from the columns instead — that remains a valid fallback.

### 10. Nested Spec Package (store view + parent bridge)

Embed a self-contained spec package (own spec, registry, components, handlers) at **multiple places** of a bigger spec sharing **one store**. The child data is a subtree of the parent's JSON (`/widgets/0/data`); the boundary component in the parent registry gives the child a rebased view of the parent store and a bridge to parent handlers:

```tsx
// EmbeddedChild.tsx — registered in the PARENT registry as "child-renderer"
import { useContext, useMemo } from "react";
import { Renderer, createStoreView, useStore, usePath, ActionContext, type ComponentProps, type Handlers } from "thin-render";

function EmbeddedChild({ element }: ComponentProps) {
  const parentStore = useStore();
  const parentAction = useContext(ActionContext);   // parent's handlers + accessors
  const scope = usePath();
  const base = typeof element.props?.base === "string" ? element.props.base : undefined;
  const view = useMemo(() => (base ? createStoreView(parentStore, base) : null), [parentStore, base]);

  // parent.<name> → parent handler with the parent's accessors; params (already
  // resolved in the child's world by the child's emit) pass through untouched
  const bridge = useMemo<Handlers>(() => {
    const out: Handlers = {};
    if (parentAction) {
      for (const [name, h] of Object.entries(parentAction.handlers)) {
        out[`parent.${name}`] = (params) => h(params, { getState: parentAction.getState, setState: parentAction.setState });
      }
    }
    return out;
  }, [parentAction]);

  if (!view) return null;
  return <Renderer spec={childSpec} registry={childRegistry} store={view} handlers={{ ...childHandlers, ...bridge }} />;
}
```

Parent spec: `{ "type": "child-renderer", "props": { "base": "/widgets/0/data" } }`. Child spec fires parent actions with `action: "parent.<name>"` and self-identifies via its data: `params: { id: { $state: "/id" } }`. Write-back is automatic — child `setState` lands in the parent store at the base path. The same spec/registry renders standalone with a plain `createStore` store (no bridge; `parent.*` actions warn as unknown). `base` also accepts `{ $item: "field" }` resolved against the parent scope via `usePath()`. Child-of-child nesting works: the inner boundary sees the outer bridge's names, so `parent.<app-level-name>` resolves at any depth.

### Minimal App

```tsx
import { Renderer, createStore, type Spec, type Registry } from "thin-render";

const spec: Spec = {
  root: "greeting",
  elements: { greeting: { type: "Hello", props: { name: "World" } } },
};
const registry: Registry = {
  Hello: ({ element }) => <h1>Hello, {String(element.props?.name)}!</h1>,
};
const store = createStore({});

<Renderer spec={spec} registry={registry} store={store} />
```
