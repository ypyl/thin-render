// DataCell.tsx — grid cell for the rows × columns nested-repeat pattern.
//
// Works with the dynamic-columns layout:
//   TBody (repeat: /data) → Tr (repeat: /colDefs) → DataCell
//
// The cell reads its column definition from its OWN repeat scope (the
// column scope, e.g. /colDefs/2) and binds the value at the PARENT scope
// (the row scope, e.g. /data/5) via usePath(1). The value path
// /data/5/<key> is subscribed per-cell — editing one cell re-renders only
// that cell, even though both repeat paths are static spec.
import { useBound, useValue, usePath, type ComponentProps } from "thin-render";

export function DataCell({ element }: ComponentProps) {
  const colBase = usePath();                            // e.g. /colDefs/2
  const rowBase = usePath(1);                           // e.g. /data/5
  const key = useValue<string>(`${colBase}/key`) ?? ""; // e.g. "name"
  const [value, setValue] = useBound<string>(`${rowBase}/${key}`);
  return (
    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
      <input
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        style={{ border: "1px solid #ddd", borderRadius: 4, padding: "4px 8px", width: "100%" }}
      />
    </td>
  );
}
