// NestedRepeatCase.tsx — two-level repeat via $item expression.
import { useState } from "react";
import { Link } from "wouter";
import { Container, Breadcrumbs } from "@mantine/core";
import { Renderer, createStore } from "thin-render";
import { registry } from "./registry";
import nestedSpec from "./spec.json";

export function NestedRepeatCase() {
  const [store] = useState(() =>
    createStore({
      categories: [
        {
          name: "Fruits",
          items: [
            { name: "Apple", qty: 5 },
            { name: "Banana", qty: 3 },
            { name: "Cherry", qty: 12 },
          ],
        },
        {
          name: "Vegetables",
          items: [
            { name: "Carrot", qty: 10 },
            { name: "Broccoli", qty: 4 },
          ],
        },
        {
          name: "Dairy",
          items: [
            { name: "Milk", qty: 2 },
            { name: "Cheese", qty: 1 },
            { name: "Yogurt", qty: 6 },
          ],
        },
      ],
    }),
  );

  return (
    <Container size="md" py="md">
      <Breadcrumbs mb="md">
        <Link href="/">Home</Link>
        <span>Nested Repeat</span>
      </Breadcrumbs>
      <Renderer spec={nestedSpec} registry={registry} store={store} />
    </Container>
  );
}
