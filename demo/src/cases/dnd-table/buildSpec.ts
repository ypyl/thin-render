// dnd-table/buildSpec.ts — Drag & Drop table demo spec.
import type { Spec } from "thin-render";

export function buildDndTableSpec(): Spec {
  return {
    root: "container",
    elements: {
      container: {
        type: "CaseContainer",
        props: {
          sourceFolder: "dnd-table",
          title: "Drag & Drop Table",
          description: "A sortable table. Drag rows into a new order, add new rows, remove rows, and edit cells in place.",
          technicalDescription: "Hold a row and drag it up or down to reorder the table. You can also add new rows, remove rows, and edit cells after clicking Edit. All changes, including the row order, are saved into the page's data.",
        },
        children: ["table"],
      },
      table: {
        type: "DndTable",
        props: { path: "/items", columns: ["Name", "Email"], idKey: "name" },
      },
    },
  };
}
