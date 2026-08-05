// spec.ts — declared types for the rendering spec.
//
// Props are plain serializable values + JSON-Pointer-like path strings.
// The renderer NEVER resolves $-expressions; paths are declarative and read
// by binding components via the store hooks. See specs/spec-schema/spec.md.

/**
 * A binding from an event name (e.g. "click", "change") to one or more action
 * bindings. `action` names a handler registered at the top of the app;
 * `params` may contain `{ $state: "<path>" }` references resolved at dispatch
 * time (read on-demand, never subscribed).
 */
export interface ActionBinding {
  /** Handler name registered in the ActionProvider. */
  action: string;
  /** Optional params; may contain `{ $state: "<path>" }` references. */
  params?: Record<string, unknown>;
}

/** Event→action map declared on an element. */
export type OnMap = Record<string, ActionBinding | ActionBinding[]>;

/** $item expression: resolved against the current PathContext. */
export interface ItemExpression {
  $item: string;
}

/** $state expression: resolved by reading the store value at the given path. */
export interface StateExpression {
  $state: string;
}

/** Repeat configuration: render children once per item in a state array. */
export interface RepeatConfig {
  /** Absolute store path, $item expression (resolved against repeat scope), or $state expression (resolved by reading store). */
  path: string | ItemExpression | StateExpression;
  /** Field name on the item object to use as a stable React key (else index). */
  key?: string;
}

/**
 * Named children: maps slot names to child element ids (or arrays of ids for
 * multiple elements in one slot). The parent component renders each slot at a
 * position of its choosing via `ComponentProps.slots`.
 */
export type SlotMap = Record<string, string | string[]>;

/**
 * One element in the spec. `props` holds plain values and path strings only —
 * no runtime `$`-expression resolution is performed by the renderer.
 * `children` is either an ordered array of child element ids or a `SlotMap`
 * of named slots (mutually exclusive — a component receives either the
 * `children` prop or the `slots` prop, never both).
 */
export interface UIElement {
  type: string;
  props?: Record<string, unknown>;
  children?: string[] | SlotMap;
  on?: OnMap;
  repeat?: RepeatConfig;
}

/** The full spec: a root element key + a map of elements. */
export interface Spec {
  root: string;
  elements: Record<string, UIElement>;
}