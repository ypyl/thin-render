// StoreDebugCase.tsx — spec-driven app over a logging store wrapper, with a
// live write log beside it. The wrapped store is what the Renderer gets, so
// every write (bindings, actions, handlers) lands in the log.
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Breadcrumbs, Container, SimpleGrid } from "@mantine/core";
import { Renderer, createStore } from "thin-render";
import { createLogStore } from "./logStore";
import { DebugPanel } from "./DebugPanel";
import { handlers } from "./handlers";
import { registry } from "./registry";
import spec from "./spec.json";

export function StoreDebugCase() {
  // The raw store and the log wrapper are separate useState values so both
  // StrictMode initializer runs agree on which store is live.
  const [store] = useState(() =>
    createStore({
      customer: { name: "Ada Lovelace", email: "ada@example.com" },
      tags: [{ label: "math" }, { label: "code" }, { label: "notes" }],
      summary: "",
      lastUpdated: "",
      editingSection: true,
    }),
  );
  const [log] = useState(() => createLogStore(store));

  // Assign in an effect (not the initializer): StrictMode double-invokes
  // initializers in dev, and an assignment there could point at a discarded
  // store. Effects run once on the committed instance.
  //
  // Usage: open the DevTools console on this page and poke the raw store —
  // window.__store.getState(), .get("/path"), .set("/path", value). A
  // console write goes through the same set() as a binding or handler, so it
  // shows up in the write log like any other.
  useEffect(() => {
    window.__store = store;
  }, [store]);

  return (
    <Container size="xl" py="md">
      <Breadcrumbs mb="md">
        <Link href="/">Home</Link>
        <span>Store Debug</span>
      </Breadcrumbs>
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" style={{ alignItems: "start" }}>
        <Renderer spec={spec} registry={registry} store={log.store} handlers={handlers} />
        <DebugPanel log={log} />
      </SimpleGrid>
    </Container>
  );
}
