// nested-package/child/handlers.ts — handlers owned by the child package.
// The child has no local actions of its own; parent-level actions are
// provided by the EmbeddedChild bridge under the `parent.` namespace.
import type { Handlers } from "thin-render";

export const childHandlers: Handlers = {};
