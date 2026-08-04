# ADR 0001: The store boundary stays `unknown` — typing happens at consumption points

Status: Accepted

## Context

`createStore(initial)` seeds a path-addressed store: `get("/a/b")`, `set("/a/b", v)`,
`subscribe("/a/b", fn)`. The store is a JSON blob addressed by string paths, and the
library renders JSON specs against it. Three facts shape the typing:

1. **Paths are runtime data, not types.** The repeat system builds paths dynamically
   (`/items/${index}/name`), handlers compose them (`"/" + key`), and `$state`/`$item`
   expressions resolve at dispatch time. No static type can be checked against a
   runtime-composed path.
2. **The shape is open.** `set("/anything/at/all", x)` creates new branches. The
   initial state is a seed, not a contract; the store can outgrow it.
3. **The data originates from JSON.** Spec props and action params are literally JSON
   (`Record<string, unknown>`), so the store's "type" is whatever the data says.

## Decision

The store boundary is deliberately typed `unknown` (`createStore` initial:
`Record<string, unknown>`; `Store.get`/`getState` return `unknown`; `Store.set` takes
`unknown`). `unknown` (not `any`) forces narrowing to happen at a typed access point,
the same treatment TypeScript applies to `JSON.parse`.

Type safety lives at the **consumption points**, not the boundary:

- `useValue<T>(path)`, `useBound<T>(path)`, `useSelector<T>(path, derive)` — annotate
  where the caller knows the type.
- Handlers receive `{ getState, setState }` and narrow `getState()` explicitly.

No generic was added to `createStore`. A `createStore<T>(initial: T)` generic would be
a phantom: it types the input but every output stays `unknown` (paths are strings), so
the type would promise more than it delivers. Path-level template-literal typing
(tRPC-style `Paths<T>`) was rejected because it breaks on computed paths, which is the
library's core repeat pattern.

## Consequences

- Handler code occasionally casts: `getState() as Record<string, unknown>` (contained
  to a couple of sites in the demo).
- Hook call sites must annotate (`useValue<string>("...")`); the library trusts the
  caller's annotation, the same model as `useState<T>`.
- Apps can tighten the seed without library changes: `createStore({...} satisfies
  MyState)` or a typed wrapper around `getState()`.
- If handler friction grows, a future option is `Store<T>` with typed `getState(): T`
  only, leaving per-path reads honestly `unknown`. Revisit if that becomes real pain.
