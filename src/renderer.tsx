// renderer.tsx — recursive spec walker + RepeatChildren + public Renderer.
//
// Key design invariants (see design.md):
//   - ElementRenderer subscribes to NO state — no useValue/useBound inside.
//   - It's React.memo'd on { elementKey, spec, registry, loading }.
//   - Emit is built per-element from useEmit(OnMap), stable when on map is stable.
//   - RepeatChildren subscribes only to repeat.path via useValue.
// See specs/renderer/spec.md.
import {
  type ReactNode,
  type ComponentType,
  memo,
  createElement,
} from "react";
import type { Spec, UIElement, OnMap, RepeatConfig } from "./spec";
import { useValue, useEmit, useResolvedPath, PathContext, RepeatIndexContext } from "./hooks";
import { StoreProvider, ActionProvider, BUILTIN_SET_STATE } from "./contexts";
import type { Store } from "./store";
import type { Handlers } from "./contexts";

// ── Component contract ────────────────────────────────────────────

/** Props every registry component receives. */
export interface ComponentProps {
  /** The current element's spec data (type, props, children, on, repeat). */
  element: UIElement;
  /** Rendered child ElementRenderers (when element has children). */
  children?: ReactNode;
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

  // Stable emit for this element's on bindings.
  const emit = useEmit(on);

  // ── Children ──
  let children: ReactNode = null;

  if (element.repeat) {
    children = (
      <RepeatChildren
        repeat={element.repeat}
        childKeys={element.children ?? []}
        spec={spec}
        registry={registry}
        loading={loading}
      />
    );
  } else if (element.children) {
    children = element.children.map((childKey) => (
      <_ElementRenderer
        key={childKey}
        elementKey={childKey}
        spec={spec}
        registry={registry}
        loading={loading}
      />
    ));
  }

  // ── Render ──
  if (!Component) {
    console.warn(`thin-render: no component registered for type "${element.type}"`);
    return null;
  }

  return createElement(
    Component,
    { element, emit } satisfies ComponentProps,
    children,
  );
});

// ── RepeatChildren ─────────────────────────────────────────────────

interface RepeatChildrenProps {
  repeat: RepeatConfig;
  childKeys: string[];
  spec: Spec;
  registry: Registry;
  loading?: boolean;
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

  // Array iteration
  if (Array.isArray(value)) {
    return (
      <>
        {value.map((item, index) => {
          const itemObj = item as Record<string, unknown> | undefined;
          const rawKey = repeat.key && itemObj ? itemObj[repeat.key] : undefined;
          const key = rawKey != null && rawKey !== "" ? String(rawKey) : String(index);
          const basePath = `${resolvedPath}/${index}`;

          return (
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
          );
        })}
      </>
    );
  }

  // Object iteration
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <>
        {entries.map(([objKey, val], index) => {
          const valObj = val as Record<string, unknown> | undefined;
          const rawKey = repeat.key && valObj ? valObj[repeat.key] : undefined;
          const key = rawKey != null && rawKey !== "" ? String(rawKey) : objKey;
          const basePath = `${resolvedPath}/${objKey}`;

          return (
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
          );
        })}
      </>
    );
  }

  // Non-iterable: render nothing
  return null;
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

