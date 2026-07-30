// xlsx-export/xlsxRegistry.ts — maps XLSX spec types to xlsx builder functions.
import * as XLSX from "xlsx";
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

export const xlsxRegistry: GenericRegistry = {
  Workbook: (_props, children) => {
    const wb = XLSX.utils.book_new();
    for (const entry of children as { ws: XLSX.WorkSheet; name: string }[]) {
      XLSX.utils.book_append_sheet(wb, entry.ws, entry.name);
    }
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  },
  Sheet: (props, children, ctx) => {
    // children = [headerRow: [...values], bodyRows: [[...values], ...]]
    const [header, body] = children as [unknown[], unknown[][]];
    const data = [header, ...body];
    const ws = XLSX.utils.aoa_to_sheet(data);
    return { ws, name: String(resolve(props.name, ctx) ?? "Sheet1") };
  },
  SheetData: (_props, children) =>
    children,
  XlsxRow: (_props, children) =>
    children,
  XlsxCell: (props, _children, ctx) =>
    resolve(props.value, ctx),
};
