// DocxExportCase.tsx — demo: edit data in React table, export to DOCX via renderGeneric.
import { useState, useCallback } from "react";
import { Link } from "wouter";
import { Container, Breadcrumbs, Button, Group } from "@mantine/core";
import { Renderer, createStore, renderGeneric } from "thin-render";
import { Packer } from "docx";
import reactSpec from "./spec.json";
import { registry } from "./registry";
import { docxSpec } from "./docxSpec";
import { docxRegistry } from "./docxRegistry";

function makeInitialStore() {
  return createStore({
    title: "Q3 Sales Report",
    rows: [
      { id: 1, name: "Widgets", qty: 120, price: 9.99 },
      { id: 2, name: "Gadgets", qty: 45, price: 24.50 },
      { id: 3, name: "Doodads", qty: 200, price: 3.75 },
    ],
    generatedAt: null,
  });
}

export function DocxExportCase() {
  const [store] = useState(makeInitialStore);

  const handleExport = useCallback(async () => {
    const doc = renderGeneric(docxSpec, store, docxRegistry);
    const blob = await Packer.toBlob(doc as any);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report.docx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    store.set("/generatedAt", new Date().toISOString());
  }, [store]);

  return (
    <Container size="md" py="md">
      <Breadcrumbs mb="md">
        <Link href="/">Home</Link>
        <span>DOCX Export</span>
      </Breadcrumbs>
      <Group mb="md">
        <Button onClick={handleExport}>Download DOCX</Button>
      </Group>
      <Renderer spec={reactSpec} registry={registry} store={store} />
    </Container>
  );
}
