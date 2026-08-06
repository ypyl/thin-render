// large/buildSpec.ts — builds the 1000-row repeated cards spec.
import type { Spec } from "thin-render";

export function buildLargeSpec(itemCount: number): Spec {
  return {
    root: "root",
    elements: {
      root: {
        type: "CaseContainer",
        props: { title: `${itemCount}-Row Editable Table (edit any cell)`, description: "A list of 1,000 rows with inline editing and per-row delete. Type in any cell and only that cell updates, keeping the page fast at scale.", technicalDescription: "The page renders 1,000 rows, each with two editable fields and a delete button. Edit mode unlocks the fields, and typing updates only the cell you are editing. Use the ✕ button to remove a row. Everything stays responsive even at this size." },
        children: ["body"],
      },
      body: {
        type: "StackRow",
        props: { gap: "md" },
        children: ["toggleBtn", "list"],
      },
      toggleBtn: {
        type: "EditToggle",
        on: { edit: { action: "startEdit" }, save: { action: "saveEdit" }, cancel: { action: "cancelEdit" } },
      },
      list: {
        type: "StackRow",
        props: { gap: "md" },
        repeat: { path: "/items" },
        children: ["row"],
      },
      row: {
        type: "FieldsetRow",
        props: {},
        children: ["cellName", "cellEmail", "deleteBtn"],
      },
      deleteBtn: {
        type: "ActionButton",
        props: { label: "✕" },
        on: { click: { action: "removeItem", params: { index: { $index: true } } } },
      },
      cellName: {
        type: "BoundField",
        props: { bind: "name", label: "Name" },
      },
      cellEmail: {
        type: "BoundField",
        props: { bind: "email", label: "Email" },
      },
    },
  };
}
