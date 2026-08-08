// store-debug/handlers.ts — handlers for the store debugging demo.
// updateSummary writes two paths in one dispatch (multi-write); noopWrite
// writes the current value back to /customer/name (a no-op the real store
// silently ignores — the wrapper flags it).
import type { Handlers } from "thin-render";

export const handlers: Handlers = {
  updateSummary: (_params, { getState, setState }) => {
    const state = getState() as { customer?: { name?: string; email?: string } };
    const name = state.customer?.name ?? "";
    const email = state.customer?.email ?? "";
    setState("/summary", `${name} <${email}>`);
    setState("/lastUpdated", new Date().toISOString());
  },
  noopWrite: (_params, { getState, setState }) => {
    const state = getState() as { customer?: { name?: string } };
    setState("/customer/name", state.customer?.name ?? "");
  },
};
