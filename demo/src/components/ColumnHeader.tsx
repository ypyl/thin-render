// ColumnHeader.tsx — table header cell reading its label from the column scope.
//
// Works with the rows × columns nested-repeat layout:
//   THead → Tr (repeat: colDefs) → ColumnHeader
//
// The header sits in the column repeat scope (e.g. /colDefs/0) and reads its
// label from `${usePath()}/label`. Shared by the dynamic-columns and
// stacked-tables demo cases.
import { useValue, usePath, type ComponentProps } from "thin-render";

export function ColumnHeader(_props: ComponentProps) {
  const label = useValue<string>(`${usePath()}/label`);
  return (
    <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #ddd" }}>
      {String(label ?? "")}
    </th>
  );
}
