// table/buildSpec.ts — builds the HTML table spec with repeat.
import type { Spec } from "thin-render";

export function buildTableSpec(itemCount: number): Spec {
  return {
    root: "container",
    elements: {
      container: {
        type: "CaseContainer",
        props: {
          title: `${itemCount}-Row HTML Table`,
          description: "The same 1,000 rows as a real HTML table with a header row, editable cells, and per-row delete.",
          technicalDescription: "The data is displayed as a proper HTML table: a header row and 1,000 body rows. Each cell is editable in place and every row has a delete button. The table structure, including the header and body sections, is defined in the page data rather than in code.",
        },
        children: ["table"],
      },
      table: {
        type: "Table",
        props: {},
        children: ["toggleBtn", "headerRow", "tableBody"],
      },
      toggleBtn: {
        type: "EditToggle",
        on: { edit: { action: "startEdit" }, save: { action: "saveEdit" }, cancel: { action: "cancelEdit" } },
      },
      headerRow: { type: "Tr", children: ["thName", "thEmail", "thActions"] },
      thName: { type: "Th", props: { text: "Name" } },
      thEmail: { type: "Th", props: { text: "Email" } },
      thActions: { type: "Th", props: { text: "Actions" } },
      tableBody: {
        type: "TBody",
        repeat: { path: "/items" },
        children: ["row"],
      },
      row: {
        type: "Tr",
        children: ["cellName", "cellEmail", "cellActions"],
      },
      cellName: { type: "Td", children: ["nameField"] },
      cellEmail: { type: "Td", children: ["emailField"] },
      cellActions: { type: "Td", children: ["deleteBtn"] },
      nameField: { type: "BoundField", props: { bind: "name", label: "" } },
      emailField: { type: "BoundField", props: { bind: "email", label: "" } },
      deleteBtn: {
        type: "ActionButton",
        props: { label: "✕" },
        on: { click: { action: "removeItem", params: { index: { $index: true } } } },
      },
    },
  };
}
