// nested-package/handlers.ts — parent handlers. loadDetail receives the
// child's id via the parent.* bridge (params resolved in the child's world)
// and simulates a fetch by looking the customer up in the parent store.
import type { Handlers } from "thin-render";

export function createHandlers(): Handlers {
  return {
    loadDetail: (params, { getState, setState }) => {
      const id = String(params.id ?? "");
      const state = getState() as {
        top: { customer: { id: string; name: string; email: string } };
        bottom: { customer: { id: string; name: string; email: string } };
      };
      const found =
        state.top.customer.id === id
          ? state.top.customer
          : state.bottom.customer.id === id
            ? state.bottom.customer
            : undefined;
      if (!found) return;
      setState("/detail", { ...found, loadedAt: new Date().toISOString() });
    },
  };
}
