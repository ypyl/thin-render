// xlsx-export/xlsxSpec.ts — XLSX spec describing the spreadsheet structure.
import type { Spec } from "thin-render";

export const xlsxSpec: Spec = {
  root: "workbook",
  elements: {
    workbook:  { type: "Workbook",   children: ["sheet"] },
    sheet:     { type: "Sheet",      props: { name: { $state: "/title" } },
                                     children: ["headerRow", "tableBody"] },
    headerRow: { type: "XlsxRow",    children: ["hName", "hQty", "hPrice"] },
    hName:     { type: "XlsxCell",   props: { value: "Name" } },
    hQty:      { type: "XlsxCell",   props: { value: "Qty" } },
    hPrice:    { type: "XlsxCell",   props: { value: "Price" } },
    tableBody: { type: "SheetData",  repeat: { path: "/rows" }, children: ["row"] },
    row:       { type: "XlsxRow",    children: ["nameCell", "qtyCell", "priceCell"] },
    nameCell:  { type: "XlsxCell",   props: { value: { $item: "name" } } },
    qtyCell:   { type: "XlsxCell",   props: { value: { $item: "qty" } } },
    priceCell: { type: "XlsxCell",   props: { value: { $item: "price" } } },
  },
};
