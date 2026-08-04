// contexts.ts — stable StoreContext + ActionContext.
//
// Both contexts carry REFERENCES (the store, the handler map), never state.
// Their Provider values are referentially stable across state mutations, so
// `useContext` consumers do NOT re-render when state changes — the only
// re-renders come from per-path `useValue` subscriptions. See design.md
// Decisions 2 and 4.
import { createContext, useMemo, type ReactNode } from "react";
import type { Store } from "./store.js";

/** Carries the stable store reference. Never holds state directly. */
export const StoreContext = createContext<Store | null>(null);

export interface StoreProviderProps {
  store: Store;
  children: ReactNode;
}

/** Provides the store to descendant hooks. The value IS the store (stable). */
export function StoreProvider({ store, children }: StoreProviderProps) {
  // Store is the stable reference itself; no memoization needed — passing it
  // as `value` re-renders consumers only if `store` identity changes, which it
  // shouldn't across renders when the consumer creates it once.
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export type Handler = (
  params: Record<string, unknown>,
  api: { getState: () => unknown; setState: (path: string, value: unknown) => void },
) => void | Promise<void>;

export type Handlers = Record<string, Handler>;

/** Built-in handler: writes a single path using store.set. */
export const BUILTIN_SET_STATE: Handler = (params, { setState }) => {
  const path = params.path as string | undefined;
  if (path) setState(path, params.value);
};

/** Carries handlers + store accessors. Value is stable on `[handlers, store]`. */
export interface ActionContextValue {
  handlers: Handlers;
  getState: () => unknown;
  setState: (path: string, value: unknown) => void;
}

export const ActionContext = createContext<ActionContextValue | null>(null);

export interface ActionProviderProps {
  handlers: Handlers;
  /** Built-in handlers merged UNDER user handlers (user wins on name clash). */
  builtins?: Handlers;
  store: Store;
  children: ReactNode;
}

/**
 * Provides action dispatch context. The value is memoized on `[handlers, store]`
 * — both stable in typical usage (created once at module scope or in a ref) —
 * so `useContext(ActionContext)` never re-renders consumers due to state.
 */
export function ActionProvider({
  handlers,
  builtins,
  store,
  children,
}: ActionProviderProps) {
  const value = useMemo<ActionContextValue>(() => {
    const merged: Handlers = { ...(builtins ?? {}), ...handlers };
    return {
      handlers: merged,
      getState: store.getState,
      setState: store.set,
    };
  }, [handlers, builtins, store]);

  return (
    <ActionContext.Provider value={value}>{children}</ActionContext.Provider>
  );
}