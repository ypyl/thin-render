// renderer-generic.ts — target-agnostic spec tree walker (no React).
//
// Walks a Spec tree and calls user-provided registry functions with raw
// element props and a context object containing the store, base path, and
// index. Registry functions resolve expressions themselves — just like
// React components use hooks to resolve. No subscriptions, no JSX.
//
// Children contract (mirrors the React renderer):
//   - array-form children → flat `children` array (ctx.slots undefined)
//   - record-form children (SlotMap) → `children = []`, ctx.slots populated
//     (each slot holds the results of rendering that slot's child elements)
import type { Spec, SlotMap } from "./spec.js";
import type { Store } from "./store.js";
import { resolveRepeatPath } from "./expressions.js";

/** Context passed to each registry function. */
export type RenderContext = {
  /** The store — use store.get(path) or getByPath(store.getState(), path) to read values. */
  store: Store;
  /** Current repeat scope base path ("" at root, "/items/0" inside a repeat). */
  basePath: string;
  /** Numeric repeat index (undefined at root). */
  index?: string | number;
  /**
   * Named slot results, populated only for record-form children (SlotMap).
   * Each entry holds the results from rendering that slot's child elements.
   */
  slots?: Record<string, unknown[]>;
};

/** Registry maps spec type names to builder functions. */
export type GenericRegistry = Record<
  string,
  (props: Record<string, unknown>, children: unknown[], ctx: RenderContext) => unknown
>;

/**
 * Walk a spec tree and call registry functions to produce output.
 *
 * Props are passed to registry functions RAW — `$state`, `$item`, `$index`
 * expression objects are NOT resolved by the renderer. Registry functions
 * resolve them manually using `ctx.store` and `ctx.basePath`, exactly like
 * React components resolve expressions via hooks.
 *
 * @example
 * ```ts
 * import { getByPath } from "thin-render";
 *
 * const doc = renderGeneric(spec, store, {
 *   Heading: (props, _children, { store, basePath }) => {
 *     const text = // resolve $state / $item manually
 *     return new Paragraph({ text: String(text) });
 *   },
 *   Document: (props, children, ctx) => new Document({ sections: children }),
 * }) as Document;
 * ```
 */
export function renderGeneric(
  spec: Spec | null,
  store: Store,
  registry: GenericRegistry,
): unknown {
  if (!spec?.root) return null;
  if (!spec.elements[spec.root]) return null;

  return walk(spec.root, spec, store, registry, "", undefined);
}

/** Walk one slot's child keys (single id or array of ids) in order. */
function walkSlotKeys(
  keys: string | string[],
  spec: Spec,
  store: Store,
  registry: GenericRegistry,
  basePath: string,
  index: string | number | undefined,
): unknown[] {
  return (Array.isArray(keys) ? keys : [keys]).map((childKey) =>
    walk(childKey, spec, store, registry, basePath, index),
  );
}

/** Internal recursive walk. */
function walk(
  elementKey: string,
  spec: Spec,
  store: Store,
  registry: GenericRegistry,
  basePath: string,
  index: string | number | undefined,
): unknown {
  const element = spec.elements[elementKey];

  if (!element) {
    console.warn(
      `thin-render: missing element "${elementKey}" referenced in spec.`,
    );
    return null;
  }

  const builder = registry[element.type];
  if (!builder) {
    console.warn(
      `thin-render: no registry entry for type "${element.type}"`,
    );
    return null;
  }

  // Props are passed RAW — expressions NOT resolved by renderer
  const props = element.props ?? {};
  const ctx: RenderContext = { store, basePath, index };

  // Record-form children (SlotMap): results go into ctx.slots, children = [].
  const arrayChildren = Array.isArray(element.children) ? element.children : undefined;
  const slotMap: SlotMap | undefined =
    element.children && !Array.isArray(element.children) ? element.children : undefined;

  // ── Handle repeat ──
  if (element.repeat) {
    const resolvedPath = resolveRepeatPath(
      element.repeat.path,
      () => store.getState(),
      basePath || undefined,
    );
    if (!resolvedPath) return [];

    const value = store.get(resolvedPath);

    // Record form: concatenate each slot's results across items.
    if (slotMap) {
      const slots: Record<string, unknown[]> = {};
      for (const slotName of Object.keys(slotMap)) {
        slots[slotName] = [];
      }

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const itemPath = `${resolvedPath}/${i}`;
          for (const [slotName, slotKeys] of Object.entries(slotMap)) {
            slots[slotName]!.push(...walkSlotKeys(slotKeys, spec, store, registry, itemPath, i));
          }
        }
      } else if (value !== null && typeof value === "object") {
        let i = 0;
        for (const objKey of Object.keys(value as Record<string, unknown>)) {
          const itemPath = `${resolvedPath}/${objKey}`;
          for (const [slotName, slotKeys] of Object.entries(slotMap)) {
            slots[slotName]!.push(...walkSlotKeys(slotKeys, spec, store, registry, itemPath, i));
          }
          i++;
        }
      }

      return builder(props, [], { ...ctx, slots });
    }

    // Array iteration
    if (Array.isArray(value)) {
      const results: unknown[] = [];
      for (let i = 0; i < value.length; i++) {
        const itemPath = `${resolvedPath}/${i}`;
        for (const childKey of arrayChildren ?? []) {
          results.push(
            walk(childKey, spec, store, registry, itemPath, i),
          );
        }
      }
      return builder(props, results, ctx);
    }

    // Object iteration
    if (value !== null && typeof value === "object") {
      const results: unknown[] = [];
      let i = 0;
      for (const objKey of Object.keys(value as Record<string, unknown>)) {
        const itemPath = `${resolvedPath}/${objKey}`;
        for (const childKey of arrayChildren ?? []) {
          results.push(
            walk(childKey, spec, store, registry, itemPath, i),
          );
        }
        i++;
      }
      return builder(props, results, ctx);
    }

    // Non-iterable: render nothing
    return builder(props, [], ctx);
  }

  // ── Handle record-form children ──
  if (slotMap) {
    const slots = Object.fromEntries(
      Object.entries(slotMap).map(([slotName, slotKeys]) => [
        slotName,
        walkSlotKeys(slotKeys, spec, store, registry, basePath, index),
      ]),
    );
    return builder(props, [], { ...ctx, slots });
  }

  // ── Handle children ──
  const children: unknown[] = [];
  for (const childKey of arrayChildren ?? []) {
    children.push(
      walk(childKey, spec, store, registry, basePath, index),
    );
  }

  return builder(props, children, ctx);
}
