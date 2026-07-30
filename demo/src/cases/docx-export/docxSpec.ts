// docx-export/docxSpec.ts — DOCX spec describing the document structure.
import type { Spec } from "thin-render";

export const docxSpec: Spec = {
  root: "doc",
  elements: {
    doc:       { type: "Document",     children: ["section"] },
    section:   { type: "Section",      children: ["heading", "table"] },
    heading:   { type: "Heading",      props: { text: { $state: "/title" }, level: 1 } },
    table:     { type: "DocxTable",    children: ["headerRow", "tableBody"] },
    headerRow: { type: "HeaderRow",    children: ["hName", "hQty", "hPrice"] },
    hName:     { type: "HeaderCell",   props: { text: "Name" } },
    hQty:      { type: "HeaderCell",   props: { text: "Qty" } },
    hPrice:    { type: "HeaderCell",   props: { text: "Price" } },
    tableBody: { type: "DocxTableBody", repeat: { path: "/rows" }, children: ["row"] },
    row:       { type: "TableRow",     children: ["nameCell", "qtyCell", "priceCell"] },
    nameCell:  { type: "TableCell",    children: ["namePara"] },
    namePara:  { type: "Paragraph",    props: { text: { $item: "name" } } },
    qtyCell:   { type: "TableCell",    children: ["qtyPara"] },
    qtyPara:   { type: "Paragraph",    props: { text: { $item: "qty" } } },
    priceCell: { type: "TableCell",    children: ["pricePara"] },
    pricePara: { type: "Paragraph",    props: { text: { $item: "price" } } },
  },
};
