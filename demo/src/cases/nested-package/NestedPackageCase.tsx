// NestedPackageCase.tsx — one parent store; the child package embedded at
// two base paths via EmbeddedChild plus a standalone instance.
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Container, Breadcrumbs } from "@mantine/core";
import { Renderer, createStore } from "thin-render";
import { createHandlers } from "./handlers";
import { registry } from "./registry";
import spec from "./spec.json";

export function NestedPackageCase() {
  const [store] = useState(() =>
    createStore({
      top: {
        customer: {
          id: "cust-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
          notes: "",
        },
      },
      bottom: {
        customer: {
          id: "cust-2",
          name: "Grace Hopper",
          email: "grace@example.com",
          notes: "",
        },
      },
      detail: null,
    }),
  );

  const handlers = useMemo(() => createHandlers(), []);

  return (
    <Container size="lg" py="md">
      <Breadcrumbs mb="md">
        <Link href="/">Home</Link>
        <span>Nested Package</span>
      </Breadcrumbs>
      <Renderer spec={spec} registry={registry} store={store} handlers={handlers} />
    </Container>
  );
}
