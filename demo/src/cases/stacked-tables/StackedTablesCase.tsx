// StackedTablesCase.tsx — all tables rendered at once from one static spec.
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Container, Breadcrumbs } from "@mantine/core";
import { Renderer, createStore } from "thin-render";
import { handlers } from "./handlers";
import { registry } from "./registry";
import spec from "./spec.json";

interface ColumnDef {
  key: string;
  label: string;
}

export function StackedTablesCase() {
  const [store] = useState(() => {
    const s = createStore({});
    // The spec declares each table's columns; seed the store once so the
    // repeats can iterate them. Headers are never derived from data.
    const columns = (
      spec.elements.tables.props as { columns: Record<string, ColumnDef[]> }
    ).columns;
    for (const [name, colDefs] of Object.entries(columns)) {
      s.set(`/tables/${name}/colDefs`, colDefs);
      handlers.loadDataset({ dataset: name }, { getState: s.getState, setState: s.set });
    }
    return s;
  });

  const specRef = useMemo(() => spec, []);

  return (
    <Container size="md" py="md">
      <Breadcrumbs mb="md">
        <Link href="/">Home</Link>
        <span>Stacked Tables</span>
      </Breadcrumbs>
      <Renderer spec={specRef} registry={registry} store={store} handlers={handlers} />
    </Container>
  );
}
