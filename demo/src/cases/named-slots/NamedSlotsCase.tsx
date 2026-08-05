// NamedSlotsCase.tsx — named children (record-form slots) demo.
import { useState } from "react";
import { Link } from "wouter";
import { Container, Breadcrumbs } from "@mantine/core";
import { Renderer, createStore } from "thin-render";
import namedSlotsSpec from "./spec.json";
import { registry } from "./registry";

export function NamedSlotsCase() {
  const [store] = useState(() =>
    createStore({
      cards: [
        { title: "First card", body: "Body of the first card." },
        { title: "Second card", body: "Body of the second card." },
      ],
    }),
  );

  return (
    <Container size="md" py="md">
      <Breadcrumbs mb="md">
        <Link href="/">Home</Link>
        <span>Named Slots</span>
      </Breadcrumbs>
      <Renderer spec={namedSlotsSpec} registry={registry} store={store} />
    </Container>
  );
}
