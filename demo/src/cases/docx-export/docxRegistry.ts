// docx-export/docxRegistry.ts — maps DOCX spec types to docx builder functions.
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
} from "docx";
import { getByPath, type GenericRegistry, type RenderContext } from "thin-render";

/** Resolve a prop value that may be an expression object ($state, $item, $index). */
function resolve(
  value: unknown,
  ctx: RenderContext,
): unknown {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.$state === "string") {
      return getByPath(ctx.store.getState(), obj.$state);
    }
    if (typeof obj.$item === "string") {
      const path = obj.$item === "" ? ctx.basePath : `${ctx.basePath}/${obj.$item}`;
      return getByPath(ctx.store.getState(), path);
    }
    if ("$index" in obj) {
      return (obj.$index as boolean) ? ctx.index : undefined;
    }
  }
  return value;
}

export const docxRegistry: GenericRegistry = {
  Document: (_props, children) =>
    new Document({ sections: children as any }),
  Section: (_props, children) =>
    ({ children }),
  Heading: (props, _children, ctx) =>
    new Paragraph({
      heading: (props.level as number) === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      children: [new TextRun(String(resolve(props.text, ctx) ?? ""))],
    }),
  DocxTable: (_props, children) =>
    new Table({
      rows: children.flat() as any,
      width: { size: 9000, type: "dxa" as any },
      columnWidths: [3000, 3000, 3000],
    }),
  HeaderRow: (_props, children) =>
    new TableRow({ children: children as any }),
  HeaderCell: (props) =>
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(props.text ?? ""), bold: true })] })] }),
  DocxTableBody: (_props, children) =>
    children,
  TableRow: (_props, children) =>
    new TableRow({ children: children as any }),
  TableCell: (_props, children) =>
    new TableCell({ children: children as any }),
  Paragraph: (props, _children, ctx) =>
    new Paragraph({ children: [new TextRun(String(resolve(props.text, ctx) ?? ""))] }),
};
