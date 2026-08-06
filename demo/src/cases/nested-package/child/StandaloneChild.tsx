// nested-package/child/StandaloneChild.tsx — renders the child package fully
// isolated with its own store. Same spec and registry as embedded mode; the
// only difference is the wiring: own store + own implementation of the
// "parent.loadDetail" action name (no parent exists here). In a standalone
// deployment without this handler, the action would warn as unknown.
import { useState } from "react";
import { Stack, Text } from "@mantine/core";
import { Renderer, createStore, type Handlers } from "thin-render";
import childSpec from "./spec.json";
import { childRegistry } from "./registry";
import { childHandlers } from "./handlers";

export function StandaloneChild() {
  const [store] = useState(() =>
    createStore({
      id: "cust-3",
      name: "Linus Torvalds",
      email: "linus@example.com",
      notes: "Standalone instance with its own store.",
    }),
  );

  // The child spec fires "parent.loadDetail" — the action name is just a
  // contract. Standalone wiring provides its own implementation; embedded
  // wiring (EmbeddedChild) bridges the same name to the parent's handler.
  const standaloneHandlers: Handlers = {
    "parent.loadDetail": (params, { setState }) => {
      setState(
        "/notes",
        `Details fetched locally for ${String(params.id ?? "")} (no parent bridge in standalone mode).`,
      );
    },
  };

  return (
    <Stack gap="xs">
      <Renderer
        spec={childSpec}
        registry={childRegistry}
        store={store}
        handlers={{ ...childHandlers, ...standaloneHandlers }}
      />
      <Text size="xs" c="dimmed">
        Standalone: own store — "Load details" runs a local handler here. When embedded, the same
        action name is bridged to the parent's handler.
      </Text>
    </Stack>
  );
}
