// DynamicColumnsCase.tsx — static spec (spec.json), runtime-unknown columns demo case.
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Container, Breadcrumbs } from "@mantine/core";
import { Renderer, createStore } from "thin-render";
import { handlers } from "./handlers";
import { registry } from "./registry";
import spec from "./spec.json";

export function DynamicColumnsCase() {
  const [store] = useState(() => {
    const s = createStore({});
    // Seed with the users dataset so the case renders immediately.
    handlers.loadDataset({ dataset: "users" }, { getState: s.getState, setState: s.set });
    return s;
  });

  const specRef = useMemo(() => spec, []);

  return (
    <Container size="md" py="md">
      <Breadcrumbs mb="md">
        <Link href="/">Home</Link>
        <span>Dynamic Columns</span>
      </Breadcrumbs>
      <Renderer spec={specRef} registry={registry} store={store} handlers={handlers} />
    </Container>
  );
}
