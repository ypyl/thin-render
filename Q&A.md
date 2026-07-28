# Q&A

### What is the `$state` expression?

`{ $state: "/path" }` tells thin-render: "read the value at this store path." It's one of three expression types used in spec JSON:

| Expression | Syntax | Meaning |
|-----------|--------|---------|
| `$state` | `{ $state: "/doc/id" }` | Read the store value at `/doc/id` |
| `$item` | `{ $item: "field" }` | Resolve relative to the current repeat scope |
| `$index` | `{ $index: true }` | Numeric index of the current repeat iteration |

Unlike static values in your spec, `$state` dereferences the store at runtime. Use it when the value you need isn't known until the spec is rendered.

### Where can I use `$state`?

In exactly two places — and the behavior is different in each:

**1. Action parameters** (read-once, no subscription)

Inside `params` on any action binding — `on.click`, `on.change`, or `watch` handlers:

```json
{
  "type": "ActionButton",
  "props": { "label": "Save" },
  "on": {
    "click": {
      "action": "saveDoc",
      "params": {
        "docId": { "$state": "/currentDoc/id" }
      }
    }
  }
}
```

When the button is clicked, `resolveParams` reads the current value at `/currentDoc/id` from the store and passes it to the handler. This is a **snapshot** — no subscription, no re-render. The handler gets whatever value was there at click time.

**2. Repeat path** (subscribes, causes re-renders)

Inside `repeat.path` to dynamically switch which array a repeat iterates over:

```json
{
  "type": "Spy",
  "repeat": { "path": { "$state": "/activeList" } },
  "children": ["row"]
}
```

`useResolvedPath` reads the value at `/activeList` via `useValue` — which subscribes via `useSyncExternalStore`. When `/activeList` changes from `"/fruits"` to `"/vegetables"`, the repeat re-renders with the new array. This is **reactive** — it follows the pointer wherever it goes.

> **Note:** `$state` cannot be used in element `props`. Props are static passthrough values — components that need dynamic state use hooks like `useBound(path)` or `useValue(path)` internally.

### When would I use `$state` in action params?

When the data your handler needs lives in the store, and you want the **current** value at the moment the action fires.

**Example:** A detail modal that loads data for the currently selected item from a repeat. The handler needs both the item ID (from the repeat scope, via `$item`) and the current user ID (from the store, via `$state`):

```json
{
  "on": {
    "click": {
      "action": "loadDetail",
      "params": {
        "itemId": { "$item": "id" },
        "userId": { "$state": "/user/id" }
      }
    }
  }
}
```

At click time, `resolveParams` merges `$item` (resolved against the repeat scope) and `$state` (read from the store) into a single params object for the handler.

`$state` supports nesting — it recurses into nested objects:

```json
{
  "params": {
    "nested": {
      "ref": { "$state": "/items/0/name" }
    }
  }
}
```

### When would I use `$state` in a repeat path?

When you want the repeat's data source to be **dynamic** — changing based on store state.

**Example:** A tab switcher where each tab shows a different list. Instead of rendering all lists and hiding inactive ones, you point the repeat at whichever list is active:

```json
// Store state:
// { activeTab: "/tabs/fruits", tabs: { fruits: [...], vegetables: [...] } }

{
  "type": "MyList",
  "repeat": { "path": { "$state": "/activeTab" } },
  "children": ["row"]
}
```

When the user switches tabs, your handler writes the new path to `/activeTab`. The repeat re-renders with the new array — only the repeat children re-render, not the parent element.

### Does `$state` cause re-renders?

**It depends where you use it:**

| Context | Mechanism | Subscribes? | Causes re-render? |
|---------|-----------|-------------|-------------------|
| Action params (`on.click.params`) | `resolveParams` | No — reads once at dispatch | No |
| Action params (`watch` handler params) | `resolveParams` | No — reads once when watch fires | No |
| Repeat path (`repeat.path`) | `useResolvedPath` → `useValue` | Yes — `useSyncExternalStore` | Yes, the repeat re-renders |

The design rationale: actions are **event-driven** — you want the state at the moment the event fires. A repeat path is **declarative** — the UI should reflect the current target.

### What happens if the path doesn't exist?

**In action params:** the resolved value is `undefined`. The handler receives `undefined` for that key. No warning is logged.

**In repeat path:** `useValue` returns `undefined`, `useResolvedPath` returns `""` (empty string), and `RepeatChildren` renders nothing. No warning is logged for genuinely missing paths.

If the path exists but holds a non-string value (e.g., a number), `useResolvedPath` logs a console warning:
> `thin-render: $state expression at "/badPointer" resolved to non-string value, expected a path string`

and returns `""` (renders nothing).

### How is `$state` different from `$item`?

| | `$state` | `$item` |
|---|---------|---------|
| **Resolves against** | Store root (always absolute) | Current repeat scope (relative) |
| **Takes** | A store path string | A field name (or `""` for the base path) |
| **In action params** | Read from store at dispatch time | Resolved to an absolute path string like `/items/3/field` |
| **In repeat path** | Subscribes via `useValue`, causes re-renders | Resolves via context only, no subscription |
| **Outside repeat** | Works normally (reads from store) | Returns `undefined` |

In short: `$state` answers "what value is at this path?" while `$item` answers "what path am I at right now?"

### What is the `$item` expression?

`{ $item: "field" }` tells thin-render: "build an absolute path from the current repeat scope." It's a **path resolution** expression — unlike `$state` which resolves to a value, `$item` resolves to a path string.

Two forms:

| Syntax | Meaning | Example (inside `/items/3`) |
|--------|---------|-----------------------------|
| `{ $item: "field" }` | Append field to the repeat base path | `/items/3/field` |
| `{ $item: "" }` | Return the repeat base path itself | `/items/3` |

`$item` resolves against `RepeatPathContext` — the React context set by the nearest parent `repeat`. No store access, no subscription.

### Where can I use `$item`?

In three places — more than `$state`'s two:

**1. Action params** — resolved at dispatch time by `resolveParams`:

```json
{
  "on": {
    "click": {
      "action": "removeItem",
      "params": {
        "itemPath": { "$item": "" }
      }
    }
  }
}
```

The handler receives the absolute path string (e.g., `"/items/5"`). It's a path, not a value — the handler decides what to do with it (read, write, or both).

**2. Repeat path** — resolved at render time by `useResolvedPath`:

```json
{
  "type": "ItemRow",
  "repeat": { "path": { "$item": "subitems" } },
  "children": ["cell"]
}
```

When the outer repeat is at `/categories/0`, this repeat iterates over `/categories/0/subitems`. This is how **nested repeats** compose — each `$item` resolves against the innermost `RepeatPathContext`.

**3. Component props** — resolved at render time by `useItemPath`:

```tsx
function MyComponent({ element }: ComponentProps) {
  const path = useItemPath(element.props?.target);
  const value = useValue(path);
  // ...
}
```

Components call `useItemPath(expr)` to interpret a prop that might be a `$item` expression, a plain string, or any other value. Unlike action params and repeat paths (which the renderer handles automatically), component props are the component's responsibility.

### When would I use `$item` in action params?

When your handler needs to know **which item** the action came from — to read its data, delete it, or navigate relative to it.

**Example:** Detail modal that passes a row's ID to a handler. The handler receives the path to the ID field, then reads the value:

```json
{
  "on": {
    "click": {
      "action": "loadDetail",
      "params": {
        "id": { "$item": "id" }
      }
    }
  }
}
```

The handler receives `{ id: "/items/2/id" }` — a path string. It then calls `getByPath(getState(), "/items/2/id")` to read the actual ID value.

Compare with `$state` — which would pass the *value* directly. Use `$item` when you want the **path** (for further reads/writes), `$state` when you want the **value**.

### When would I use `$item` in a repeat path?

When you have **nested data structures** and need an inner repeat to iterate over a child array of each outer item.

**Example:** Categories containing items:

```json
// Store: { categories: [{ name: "Fruits", items: [{ name: "Apple" }, ...] }, ...] }

{
  "type": "CategoryGroup",
  "repeat": { "path": "/categories" },
  "children": ["categoryTitle", "itemList"]
}
```

Inside `categoryTitle`, `useBound("name")` reads from `/categories/0/name`.

```json
{
  "type": "ItemRow",
  "repeat": { "path": { "$item": "items" } },
  "children": ["itemName"]
}
```

Inside the inner repeat, `itemName` uses `useBound("name")` which reads from `/categories/0/items/0/name`. The `$item` expression composes the path from context — no store subscription, no overhead. This works for arbitrarily deep nesting.

### Does `$item` cause re-renders?

**No.** `$item` resolves against `RepeatPathContext` — a React context. It never touches the store. When the parent repeat re-renders (because its data changed), all `useContext(RepeatPathContext)` consumers re-render as part of normal React propagation. No `useSyncExternalStore`, no store subscription.

This is the key architectural difference from `$state` in repeat paths:

| Expression | Resolution | Re-render trigger |
|-----------|-----------|-------------------|
| `$item` in repeat path | `useContext(RepeatPathContext)` | Parent repeat re-render (React normal) |
| `$state` in repeat path | `useValue` → `useSyncExternalStore` | Store subscription fires |

### What happens outside a repeat?

`$item` returns `undefined` when used outside any `RepeatScope`. No warning is logged.

**In action params:** The handler receives `undefined` for that key.

**In repeat path:** `useResolvedPath` returns `undefined`, `RepeatChildren` renders nothing.

**In component props:** `useItemPath` returns `undefined`.

This is by design — `$item` has no meaning without a repeat scope to resolve against.

### What does `$item: ""` do?

The empty string is a sentinel for "give me the base path itself." Inside `/items/3`, `{ $item: "" }` resolves to `"/items/3"` — the full path to the current item, not a field within it.

Use this when your handler needs the whole item's path (to delete it, or to pass it to another store operation):

```json
{
  "params": {
    "row": { "$item": "" }
  }
}
```

At dispatch, `row` is `"/items/7"` — the full path to the item in the array.

### What is the `$index` expression?

`{ $index: true }` tells thin-render: "pass the numeric repeat index to the handler." It's the simplest of the three expression types — it only works in action params, and only returns a number.

| Syntax | Meaning | Example (inside `/items/3`) |
|--------|---------|-----------------------------|
| `{ $index: true }` | Pass the numeric repeat index | `3` |
| `{ $index: false }` | Explicitly pass nothing | `undefined` |

Unlike `$state` (value lookup) and `$item` (path resolution), `$index` is just a position — "I'm the Nth item in this array."

### Where can I use `$index`?

**Only in action params** — resolved at dispatch time by `resolveParams`:

```json
{
  "on": {
    "click": {
      "action": "removeItem",
      "params": {
        "index": { "$index": true }
      }
    }
  }
}
```

The handler receives the numeric index (e.g., `0`, `1`, `42`).

`$index` cannot be used in repeat paths or component props — there's no `useResolvedPath` or `useItemPath` equivalent for it. The renderer and hooks have no concept of resolving `$index` outside action dispatch.

### When would I use `$index`?

When your handler needs to know **which position** in the array the action came from — typically for array operations like delete or reorder.

**Example:** Row deletion in the Large and Table demos. The delete button on each row passes the index to the `removeItem` handler:

```json
{
  "type": "ActionButton",
  "props": { "label": "✕" },
  "on": {
    "click": {
      "action": "removeItem",
      "params": {
        "index": { "$index": true }
      }
    }
  }
}
```

```tsx
// Handler receives { index: 5 }
removeItem: (params, { getState, setState }) => {
  const idx = params.index as number;
  setState("/items", (getState().items ?? []).filter((_, i) => i !== idx));
}
```

### Why does `$index` use `true`/`false`?

The boolean gating lets spec authors conditionally include or exclude the index without changing the params shape. `{ $index: true }` → the index value; `{ $index: false }` → `undefined`.

This is useful when the same handler serves both repeat and non-repeat contexts — the spec can pass `{ $index: false }` to explicitly opt out.

### What happens outside a repeat?

`$index` resolves to `undefined`. No warning is logged. If your handler receives `params.index === undefined`, it wasn't inside a repeat.

### `$index` vs `$item: ""` — which should I use?

Both identify the current item, but in different ways:

| | `$index` | `$item: ""` |
|---|---------|------------|
| **What you get** | Numeric index (`3`) | Absolute path (`"/items/3"`) |
| **Best for** | Array operations (delete by index, reorder) | Path-based operations (read/write at the item's path) |
| **Stability** | Changes if array is reordered | Changes if the item's path in the store changes |

Use `$index` when you're doing positional array work. Use `$item: ""` when you need to pass the item's full store path to another handler or component.

## Actions & Handlers

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

### What's the difference between `on` and `watch`?

Both dispatch actions to handlers, but the trigger is fundamentally different:

| | `on` | `watch` |
|---|------|---------|
| **Trigger** | Component calls `emit("event")` | Store path changes |
| **Declared in spec** | `on: { click: { action: "..." } }` | `watch: { "/path": [{ action: "..." }] }` |
| **Typical use** | User interactions (click, change, submit) | Side effects (validation, logging, sync) |
| **Re-renders element?** | No — `emit` never re-renders | No — uses `store.subscribe`, not `useValue` |
| **Can trigger re-renders?** | Yes — if handler calls `setState` | Yes — if handler calls `setState` |

Use `on` when a **user does something**. Use `watch` when **data changes** and you need to react regardless of how it changed.

### How does `watch` avoid causing re-renders?

`watch` uses `store.subscribe(path, callback)` directly in a `useEffect` — bypassing React's render cycle entirely:

```tsx
// Inside useWatch (simplified)
useEffect(() => {
  const unsub = store.subscribe(path, () => {
    // This callback fires on store change — NO re-render
    const resolved = resolveParams(b.params, getState, ...);
    handler(resolved, { getState, setState });
  });
  return unsub;
}, [watch, store]);
```

Compare with `useValue(path)` which uses `useSyncExternalStore` and DOES re-render the component on change. `watch` deliberately avoids this — the `ElementRenderer` is `React.memo`'d and should never re-render from state changes.

**However:** if the handler calls `setState`, that write WILL trigger re-renders in any component subscribed to the written path via `useValue` or `useBound`. The re-render is targeted — only subscribers of the changed path re-render, never the element with the `watch` directive.

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

`emit` awaits the handler's promise, so sequential `emit` calls for the same event run in order. `watch` fires handlers synchronously from the subscribe callback — the handler runs immediately but its async work continues in the background.

### What happens if a handler isn't found?

If `emit` or `watch` references an action name that doesn't exist in the registered handlers, thin-render logs a warning and continues:

> `thin-render: no handler registered for "typoedName"`

No error is thrown, no state is changed. This is a deliberate design choice — a missing handler shouldn't crash the app.

The built-in `setState` action is an exception: if `setState` isn't found (which only happens if the user explicitly removes it), it's silently skipped without a warning.

If your action isn't firing, check the browser console for these warnings — it's usually a typo in the action name or a missing handler registration.

### Watch

#### Can I use `$item` in a watch path?

**No.** Watch paths are literal strings — they don't support `$item` or `$state` expressions. Unlike `repeat.path` which goes through `useResolvedPath`, the watch path goes directly to `store.subscribe(path)`:

```ts
// repeat.path — resolved via useResolvedPath (expressions work)
repeat: { path: { $item: "subitems" } }  // ✓ composes with repeat scope

// watch path — literal string only
watch: { "name": [...] }  // subscribes to /name literally, NOT /items/3/name
```

Inside a repeat at `/items/3`, writing `watch: { "name": [...] }` subscribes to the root path `/name` — not `/items/3/name`. The watch path does NOT compose with the repeat scope.

This is enforced at the type level: `WatchMap` is `Record<string, ActionBinding[]>`, while `RepeatConfig.path` is `string | ItemExpression | StateExpression`.

Note that `$item` DOES work in watch **params** — params go through `resolveParams` which has access to the repeat scope. It's only the subscription path itself that stays literal.

#### How do I validate per-item inside a repeat?

Since watch paths don't compose with the repeat scope, you can't watch per-item paths like `/items/3/name` from within a repeat element. Two workarounds:

**Option A: Watch the parent array** — place the watch on a parent element outside the repeat, watching the entire array path:

```json
{
  "type": "ItemList",
  "watch": {
    "/items": [{ "action": "validateAllItems" }]
  }
}
```

The handler iterates all items and validates each. Less granular (fires on any item change) but functional.

**Option B: Use a reactive component** — instead of `watch`, use `useValue` inside a component to react to changes and trigger side effects:

```tsx
function ValidatingField({ element }: ComponentProps) {
  const [value] = useBound<string>(String(element.props?.bind));
  const store = useStore();

  useEffect(() => {
    if ((value ?? "").length < 3) {
      store.set("/errors/name", "Too short");
    } else {
      store.set("/errors/name", undefined);
    }
  }, [value]);

  return <input value={value} /* ... */ />;
}
```

This gives you per-item reactivity at the cost of moving logic into a component.

#### Can a watch handler cause an infinite loop?

**No** — the store's `set()` method checks strict equality before notifying subscribers:

```ts
// store.ts
set(path: string, value: unknown) {
  const prev = getByPath(state, path);
  if (prev === value) return;  // no change → no notification → no loop
  state = immutableSetByPath(state, path, value);
  notify(path);
}
```

If a watch on `/name` fires and the handler writes the same value back, the second `setState` call is a no-op — no notification, no re-fire.

If the handler writes a **different** value, the watch fires again. The loop continues until the value stabilizes:

```
setState("/name", "hello")
  → watch fires → handler uppercases → setState("/name", "HELLO")
  → watch fires → handler uppercases → setState("/name", "HELLO")  ← same, stops
```

The handler runs twice but terminates cleanly. For most patterns (validation, transformation) this is harmless. Be mindful if your handler has side effects beyond `setState`.

**Best practice:** watch one path, write to a different path (e.g., watch `/name`, write to `/errors/name`). Disjoint paths can never loop.

#### Does watch fire on initial render?

**No.** `store.subscribe()` only fires when `set()` is called — it's a change listener, not a value reader. The initial state value at the watched path does not trigger the handler.

If you need to run validation on initial render, call the handler explicitly in your component or use a separate `useEffect` with `useValue`.

#### Can I watch a path that doesn't exist yet?

**Yes.** `store.subscribe(path)` registers a listener for a path regardless of whether it currently holds a value. When `set()` is later called on that path (or an overlapping path), the listener fires.

This is useful for lazy-initialized state — you can set up a watch before the data arrives, and the handler runs when it does.
