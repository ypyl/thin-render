// test-utils.tsx — shared test wrappers providing Store + Action contexts.
import { type ReactNode } from "react";
import { StoreProvider, ActionProvider, BUILTIN_SET_STATE } from "./contexts";
import { PathContext, RepeatIndexContext } from "./hooks";
import { createStore, type Store } from "./store";
import type { Handlers } from "./contexts";

interface WrapperOptions {
  store?: Store;
  handlers?: Handlers;
  repeatPath?: string;
  repeatIndex?: number;
}

/** Creates a wrapper component that provides store, actions, and repeat scope. */
export function createWrapper(opts: WrapperOptions = {}) {
  const store = opts.store ?? createStore({});
  const handlers = opts.handlers ?? {};

  return function Wrapper({ children }: { children: ReactNode }) {
    let inner = children;
    if (opts.repeatPath !== undefined || opts.repeatIndex !== undefined) {
      inner = (
        <PathContext.Provider value={[opts.repeatPath ?? ""]}>
          <RepeatIndexContext.Provider value={opts.repeatIndex}>
            {inner}
          </RepeatIndexContext.Provider>
        </PathContext.Provider>
      );
    }
    return (
      <StoreProvider store={store}>
        <ActionProvider
          handlers={handlers}
          builtins={{ setState: BUILTIN_SET_STATE }}
          store={store}
        >
          {inner}
        </ActionProvider>
      </StoreProvider>
    );
  };
}
