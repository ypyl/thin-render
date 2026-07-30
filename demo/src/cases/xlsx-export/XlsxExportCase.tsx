// XlsxExportCase.tsx — demo: edit data in React table, export to XLSX via renderGeneric.
import { useState, useCallback } from "react";
import { Link } from "wouter";
import { Container, Breadcrumbs, Button, Group } from "@mantine/core";
import { Renderer, createStore, renderGeneric } from "thin-render";
import reactSpec from "./spec.json";
import { registry } from "./registry";
import { xlsxSpec } from "./xlsxSpec";
import { xlsxRegistry } from "./xlsxRegistry";

function makeInitialStore() {
  return createStore({
    title: "Q3 Sales Report",
    rows: [
      { id: 1, name: "Widgets", qty: 120, price: 9.99 },
      { id: 2, name: "Gadgets", qty: 45, price: 24.50 },
      { id: 3, name: "Doodads", qty: 200, price: 3.75 },
    ],
  });
}

export function XlsxExportCase() {
  const [store] = useState(makeInitialStore);

  const handleExport = useCallback(async () => {
    const blob = renderGeneric(xlsxSpec, store, xlsxRegistry) as Blob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [store]);

  return (
    <Container size="md" py="md">
      <Breadcrumbs mb="md">
        <Link href="/">Home</Link>
        <span>XLSX Export</span>
      </Breadcrumbs>
      <Group mb="md">
        <Button onClick={handleExport}>Download XLSX</Button>
      </Group>
      <Renderer spec={reactSpec} registry={registry} store={store} />
    </Container>
  );
}
