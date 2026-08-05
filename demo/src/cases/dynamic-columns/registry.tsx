// dynamic-columns/registry.tsx — components used by the Dynamic Columns demo.
import { CaseContainer } from "../../components/CaseContainer";
import { StackRow } from "../../components/StackRow";
import { ActionButton } from "../../components/ActionButton";
import { DataCell } from "../../components/DataCell";
import { Table, THead, TBody, Tr } from "../../components/table";
import { useValue, usePath, type ComponentProps, type Registry } from "thin-render";

/** Header cell: reads its label from the column scope (/colDefs/N). */
function ColumnHeader(_props: ComponentProps) {
  const label = useValue<string>(`${usePath()}/label`);
  return (
    <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #ddd" }}>
      {String(label ?? "")}
    </th>
  );
}

export const registry: Registry = {
  CaseContainer,
  StackRow,
  ActionButton,
  Table,
  THead,
  TBody,
  Tr,
  ColumnHeader,
  DataCell,
};
