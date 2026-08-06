// detail-modal/buildSpec.ts — builds the detail modal demo spec.
import type { Spec } from "thin-render";

interface Item {
  id: string;
  name: string;
  industry: string;
}

const ITEMS: Item[] = [
  { id: "a1", name: "Alpha Corp", industry: "Technology" },
  { id: "a2", name: "Beta LLC", industry: "Finance" },
  { id: "a3", name: "Gamma Inc", industry: "Healthcare" },
  { id: "a4", name: "Delta Co", industry: "Energy" },
  { id: "a5", name: "Epsilon Ltd", industry: "Retail" },
  { id: "a6", name: "Zeta AG", industry: "Manufacturing" },
  { id: "a7", name: "Eta Systems", industry: "Education" },
  { id: "a8", name: "Theta IO", industry: "Media" },
  { id: "a9", name: "Iota Group", industry: "Logistics" },
  { id: "b0", name: "Kappa SA", industry: "Agriculture" },
];

export function buildDetailModalSpec(): Spec {
  return {
    root: "container",
    elements: {
      container: {
        type: "CaseContainer",
        props: {
          title: "Detail Modal Demo",
          description: "Click Details on a row to load that item's full record from a simulated server. A brief loading indicator appears, then the record opens in a popup.",
          technicalDescription: "Each row has a Details button. Clicking it simulates a network request: a loading indicator appears, and when the response arrives a popup opens with the item's full record. The popup has its own Close button and its content is loaded per item, on demand.",
        },
        children: ["table", "modal"],
      },
      table: {
        type: "Table",
        props: {},
        children: ["headerGroup", "tableBody"],
      },
      headerGroup: { type: "THead", children: ["headerRow"] },
      headerRow: { type: "Tr", children: ["thId", "thName", "thIndustry", "thActions"] },
      thId: { type: "Th", props: { text: "ID" } },
      thName: { type: "Th", props: { text: "Name" } },
      thIndustry: { type: "Th", props: { text: "Industry" } },
      thActions: { type: "Th", props: { text: "" } },
      tableBody: {
        type: "TBody",
        repeat: { path: "/items" },
        children: ["row"],
      },
      row: {
        type: "Tr",
        children: ["cellId", "cellName", "cellIndustry", "cellActions"],
      },
      cellId: { type: "Td", children: ["idText"] },
      cellName: { type: "Td", children: ["nameText"] },
      cellIndustry: { type: "Td", children: ["industryText"] },
      cellActions: { type: "Td", children: ["detailBtn"] },
      idText: { type: "BoundField", props: { bind: "id", label: "" } },
      nameText: { type: "BoundField", props: { bind: "name", label: "" } },
      industryText: { type: "BoundField", props: { bind: "industry", label: "" } },
      detailBtn: {
        type: "ActionButton",
        props: { label: "Details" },
        on: { click: { action: "loadDetail", params: { id: { $item: "id" } } } },
      },
      modal: {
        type: "Modal",
        props: { path: "/itemDetail", title: "Item Details" },
        children: ["modalBody"],
      },
      modalBody: {
        type: "StackRow",
        props: { gap: "md" },
        children: ["detailArea"],
      },
      detailArea: {
        type: "LoadingBox",
        props: { path: "/loadingDetail" },
        children: ["detailContent"],
      },
      detailContent: {
        type: "StackRow",
        props: { gap: "sm" },
        children: ["revenueRow", "employeesRow", "foundedRow", "hqRow", "closeBtn"],
      },
      revenueRow: { type: "BoundField", props: { bind: "/itemDetail/revenue", label: "Revenue" } },
      employeesRow: { type: "BoundField", props: { bind: "/itemDetail/employees", label: "Employees" } },
      foundedRow: { type: "BoundField", props: { bind: "/itemDetail/founded", label: "Founded" } },
      hqRow: { type: "BoundField", props: { bind: "/itemDetail/headquarters", label: "Headquarters" } },
      closeBtn: {
        type: "ActionButton",
        props: { label: "Close" },
        on: { click: { action: "closeModal" } },
      },
    },
  };
}

export { ITEMS };
