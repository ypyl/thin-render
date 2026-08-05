// renderer.tsx — recursive spec walker + RepeatChildren + public Renderer.
//
// Key design invariants (see design.md):
//   - ElementRenderer subscribes to NO state — no useValue/useBound inside.
//   - It's React.memo'd on { elementKey, spec, registry, loading }.
//   - Emit is built per-element from useEmit(OnMap), stable when on map is stable.
//   - RepeatChildren subscribes only to repeat.path via useValue.
//   - Children contract: array-form children → `children` prop; record-form
//     children (SlotMap) → `slots` prop. Exactly one is set, never both.
// See specs/renderer/spec.md.
import {
  type ReactNode,
  type ComponentType,
  memo,
  createElement,
} from "react";
import type { Spec, UIElement, OnMap, RepeatConfig, SlotMap } from "./spec.js";
import { useValue, useEmit, useResolvedPath, PathContext, RepeatIndexContext } from "./hooks.js";
import { StoreProvider, ActionProvider, BUILTIN_SET_STATE } from "./contexts.js";
import type { Store } from "./store.js";
import type { Handlers } from "./contexts.js";

// ── Component contract ────────────────────────────────────────────

/** Props every registry component receives. */
export interface ComponentProps {
  /** The current element's spec data (type, props, children, on, repeat). */
  element: UIElement;
  /**
   * Rendered child ElementRenderers (when element has array-form children).
   * Exactly one of `children`/`slots` is set, based on the children shape.
   */
  children?: ReactNode;
  /** Rendered named slots (when element has record-form children). */
  slots?: Record<string, ReactNode>;
  /** Stable emit closure dispatching this element's action bindings. */
  emit: (event: string) => Promise<void> | void;
}

/** Registry maps spec type names → React components. */
export type Registry = Record<string, ComponentType<ComponentProps>>;

// ── ElementRenderer ───────────────────────────────────────────────

interface ElementRendererProps {
  elementKey: string;
  spec: Spec;
  registry: Registry;
  loading?: boolean;
}

/**
 * Build a slots record from a SlotMap: each slot is a single ReactNode
 * (fragment of ElementRenderers keyed by their spec element keys).
 */
function buildSlots(
  slotMap: SlotMap,
  spec: Spec,
  registry: Registry,
  loading?: boolean,
): Record<string, ReactNode> {
  return Object.fromEntries(
    Object.entries(slotMap).map(([slotName, slotKeys]) => [
      slotName,
      (Array.isArray(slotKeys) ? slotKeys : [slotKeys]).map((childKey) => (
        <_ElementRenderer
          key={childKey}
          elementKey={childKey}
          spec={spec}
          registry={registry}
          loading={loading}
        />
      )),
    ]),
  );
}

/** Memoized: re-renders only when elementKey/spec/registry change. */
const _ElementRenderer = memo(function ElementRenderer({
  elementKey,
  spec,
  registry,
  loading,
}: ElementRendererProps) {
  const element: UIElement | undefined = spec.elements[elementKey];

  // ── Unknown type ──
  if (!element) {
    if (!loading) {
      console.warn(
        `thin-render: missing element "${elementKey}" referenced in spec.`,
      );
    }
    return null;
  }

  const Component = registry[element.type];
  const on: OnMap | undefined = element.on;

  // ── No component registered ──
  if (!Component) {
    console.warn(`thin-render: no component registered for type "${element.type}"`);
    return null;
  }

  // Stable emit for this element's on bindings.
  const emit = useEmit(on);

  // ── Repeat ──
  if (element.repeat) {
    if (!element.children || Array.isArray(element.children)) {
      // Array form (or no children): one component instance, children are
      // the scoped per-item ElementRenderers.
      return createElement(
        Component,
        { element, emit } satisfies ComponentProps,
        <RepeatChildren
          repeat={element.repeat}
          childKeys={element.children ?? []}
          spec={spec}
          registry={registry}
          loading={loading}
        />,
      );
    }
    // Record form: one component instance PER ITEM, each receiving its own
    // named slots scoped to the item's PathContext.
    return (
      <RepeatSlots
        repeat={element.repeat}
        slotMap={element.children}
        spec={spec}
        registry={registry}
        loading={loading}
        Component={Component}
        element={element}
        on={on}
      />
    );
  }

  // ── Children (array form) ──
  if (Array.isArray(element.children)) {
    return createElement(
      Component,
      { element, emit } satisfies ComponentProps,
      element.children.map((childKey) => (
        <_ElementRenderer
          key={childKey}
          elementKey={childKey}
          spec={spec}
          registry={registry}
          loading={loading}
        />
      )),
    );
  }

  // ── Named slots (record form) ──
  if (element.children) {
    return createElement(
      Component,
      { element, emit, slots: buildSlots(element.children, spec, registry, loading) } satisfies ComponentProps,
    );
  }

  // ── Leaf element ──
  return createElement(Component, { element, emit } satisfies ComponentProps);
});

// ── Repeat scopes ─────────────────────────────────────────────────

/** Per-item scope descriptors for the value at a resolved repeat path. */
function repeatScopes(
  resolvedPath: string,
  value: unknown,
  repeat: RepeatConfig,
): Array<{ key: string; basePath: string; index: number }> {
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      const itemObj = item as Record<string, unknown> | undefined;
      const rawKey = repeat.key && itemObj ? itemObj[repeat.key] : undefined;
      const key = rawKey != null && rawKey !== "" ? String(rawKey) : String(index);
      return { key, basePath: `${resolvedPath}/${index}`, index };
    });
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(([objKey, val], index) => {
      const valObj = val as Record<string, unknown> | undefined;
      const rawKey = repeat.key && valObj ? valObj[repeat.key] : undefined;
      const key = rawKey != null && rawKey !== "" ? String(rawKey) : objKey;
      return { key, basePath: `${resolvedPath}/${objKey}`, index };
    });
  }
  return [];
}

/** Renders childKeys once per item in the state array or object at repeat.path. */
function RepeatChildren({
  repeat,
  childKeys,
  spec,
  registry,
  loading,
}: RepeatChildrenProps) {
  const resolvedPath = useResolvedPath(repeat.path);
  if (!resolvedPath) return null;
  const value = useValue<unknown>(resolvedPath);

  return (
    <>
      {repeatScopes(resolvedPath, value, repeat).map(({ key, basePath, index }) => (
        <RepeatScope key={key} path={basePath} index={index}>
          {childKeys.map((childKey) => (
            <_ElementRenderer
              key={childKey}
              elementKey={childKey}
              spec={spec}
              registry={registry}
              loading={loading}
            />
          ))}
        </RepeatScope>
      ))}
    </>
  );
}

interface RepeatChildrenProps {
  repeat: RepeatConfig;
  childKeys: string[];
  spec: Spec;
  registry: Registry;
  loading?: boolean;
}

/** Renders one component instance per item, each receiving named slots. */
function RepeatSlots({
  repeat,
  slotMap,
  spec,
  registry,
  loading,
  Component,
  element,
  on,
}: {
  repeat: RepeatConfig;
  slotMap: SlotMap;
  spec: Spec;
  registry: Registry;
  loading?: boolean;
  Component: ComponentType<ComponentProps>;
  element: UIElement;
  on?: OnMap;
}) {
  const resolvedPath = useResolvedPath(repeat.path);
  if (!resolvedPath) return null;
  const value = useValue<unknown>(resolvedPath);

  return (
    <>
      {repeatScopes(resolvedPath, value, repeat).map(({ key, basePath, index }) => (
        <RepeatScope key={key} path={basePath} index={index}>
          <RepeatSlotItem
            spec={spec}
            registry={registry}
            loading={loading}
            element={element}
            slotMap={slotMap}
            Component={Component}
            on={on}
          />
        </RepeatScope>
      ))}
    </>
  );
}

/**
 * One repeated slot item. Rendered inside its item's RepeatScope so its
 * `emit` (via useEmit) resolves `$item`/`$index` against the item scope.
 */
function RepeatSlotItem({
  spec,
  registry,
  loading,
  element,
  slotMap,
  Component,
  on,
}: {
  spec: Spec;
  registry: Registry;
  loading?: boolean;
  element: UIElement;
  slotMap: SlotMap;
  Component: ComponentType<ComponentProps>;
  on?: OnMap;
}) {
  const emit = useEmit(on);
  return createElement(
    Component,
    { element, emit, slots: buildSlots(slotMap, spec, registry, loading) } satisfies ComponentProps,
  );
}

// ── RepeatScope (lightweight contexts: base path + index) ─────────

function RepeatScope({ path, index, children }: { path: string; index: string | number; children: ReactNode }) {
  return (
    <PathContext.Provider value={path}>
      <RepeatIndexContext.Provider value={index}>
        {children}
      </RepeatIndexContext.Provider>
    </PathContext.Provider>
  );
}

// ── Public Renderer ────────────────────────────────────────────────

export interface RendererProps {
  /** The spec to render. */
  spec: Spec | null;
  /** Component registry (type → component). */
  registry: Registry;
  /** State store (created once, stable reference). */
  store: Store;
  /** Action handlers (created once, stable reference). Built-in setState always present. */
  handlers?: Handlers;
  /** Whether the spec is still loading (suppresses missing-element warnings). */
  loading?: boolean;
}

/** Top-level renderer: wires providers and renders the root element. */
export function Renderer({
  spec,
  registry,
  store,
  handlers = {},
  loading,
}: RendererProps) {
  if (!spec?.root) return null;
  if (!spec.elements[spec.root]) return null;

  return (
    <PathContext.Provider value="">
      <RepeatIndexContext.Provider value={undefined}>
        <StoreProvider store={store}>
          <ActionProvider
            handlers={handlers}
            builtins={{ setState: BUILTIN_SET_STATE }}
            store={store}
          >
            <_ElementRenderer
              elementKey={spec.root}
              spec={spec}
              registry={registry}
              loading={loading}
            />
          </ActionProvider>
        </StoreProvider>
      </RepeatIndexContext.Provider>
    </PathContext.Provider>
  );
}
