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
| **Handlers** | Pure functions invoked by actions/watch | `handlers.ts` — `Handlers` type |

A demo case typically has 3–4 files: `spec.json`, `registry.ts`, `handlers.ts` (optional), and a `<Name>Case.tsx` that wires them.

## API Reference

### Types

```ts
import type { Spec, UIElement, ActionBinding, RepeatConfig, ComponentProps, Handler, Handlers, Registry } from "thin-render";
```

| Type | Shape |
|------|-------|
| `Spec` | `{ root: string; elements: Record<string, UIElement> }` |
| `UIElement` | `{ type: string; props?: Record<string, unknown>; children?: string[]; on?: OnMap; watch?: WatchMap; repeat?: RepeatConfig }` |
| `ActionBinding` | `{ action: string; params?: Record<string, unknown> }` |
| `OnMap` | `Record<string, ActionBinding \| ActionBinding[]>` |
| `WatchMap` | `Record<string, ActionBinding[]>` |
| `RepeatConfig` | `{ path: string \| { $item: string } \| { $state: string }; key?: string }` |

### Hooks

```ts
import { useBound, useValue, useSetValue, useEmit, useStore, useItemPath, useResolvedPath, useRepeatPath, useRepeatIndex } from "thin-render";
```

| Hook | Returns | Notes |
|------|---------|-------|
| `useBound<T>(path)` | `[T \| undefined, (v: T) => void]` | Two-way bind; subscribes |
| `useValue<T>(path)` | `T \| undefined` | Read-only subscription |
| `useSetValue(path)` | `(v: unknown) => void` | Write-only |
| `useEmit(on?)` | `(event: string) => void` | Dispatch actions; stable ref |
| `useStore()` | `Store` | Access `store.get()` / `store.set()` |
| `useItemPath(expr)` | `string \| undefined` | Resolve `$item` in props |
| `useResolvedPath(expr)` | `string \| undefined` | Resolve repeat.path expressions |
| `useRepeatPath()` | `string` | Current repeat scope base path |
| `useRepeatIndex()` | `number \| undefined` | Current repeat index |

### Component Contract

Every registry component receives:

```ts
interface ComponentProps {
  element: UIElement;               // current spec element
  children?: ReactNode;             // rendered children
  emit: (event: string) => void;   // dispatch on.* actions
}
```

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
import { createStore, getByPath } from "thin-render";
const store = createStore({ /* initial state */ });
```

| Method | Description |
|--------|-------------|
| `store.get(path)` | Read value at path |
| `store.set(path, value)` | Write path; no-op if value unchanged |
| `store.subscribe(path, fn)` | Listen for changes on overlapping paths; returns unsubscribe |
| `store.getState()` | Full state snapshot |

`getByPath(state, path)` — standalone utility to read a nested value from any object by path. Used inside handlers: `getByPath(getState(), params.id)`

Path syntax: JSON-Pointer-like, `/`-separated. Leading `/` optional. `""` = root.

## Expression Matrix

| | `on.params` | `watch.params` | `repeat.path` | `watch path` | element `props` |
|---|:--:|:--:|:--:|:--:|:--:|
| `{ $state: "/path" }` | ✓ read-once | ✓ read-once | ✓ subscribes | ✗ | ✗ |
| `{ $item: "field" }` | ✓ path str | ✓ path str | ✓ context only | ✗ | ✗ |
| `{ $item: "" }` | ✓ base path | ✓ base path | ✓ base path | ✗ | ✗ |
| `{ $index: true }` | ✓ number | ✓ number | ✗ | ✗ | ✗ |

**Key rules:**
- `$state` in `repeat.path` subscribes via `useSyncExternalStore` — changing the pointer re-renders the repeat
- `$item` in `repeat.path` uses context only — no subscription, relies on parent re-render
- Watch paths are ALWAYS literal strings — no expression support (type-level constraint: `Record<string, ...>`)
- Props are ALWAYS static — components resolve expressions themselves via `useItemPath(expr)`
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

### 4. Watch Validation

```json
{ "type": "BoundField", "props": { "bind": "name" }, "watch": { "/name": [{ "action": "validateName" }] } }
```

```ts
const handlers = {
  validateName: (_params, { getState, setState }) => {
    const name = getByPath(getState(), "name") as string;
    setState("/errors/name", (name ?? "").length < 3 ? "Too short" : undefined);
  },
};
```

Watch uses `store.subscribe` — no re-render. Handler writes to a DIFFERENT path to avoid loops.

### 5. Conditional Render (useValue)

```json
{ "type": "Switch", "props": { "path": "/status" }, "children": ["loading", "loaded", "error"] }
```

```tsx
function Switch({ element, children }: ComponentProps) {
  const status = useValue<string>(String(element.props?.path));
  const match = Children.toArray(children).find(c =>
    (c as ReactElement).key?.replace(/^\.\$/, "") === status
  );
  return <>{match}</>;
}
```

Use special child keys: `{ "key": ".$loading" }` — the component strips the `.$` prefix for matching.

### 6. Modal (store-gated overlay)

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
